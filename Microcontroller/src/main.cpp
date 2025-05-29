#include <ESP8266WiFi.h>
#include <WiFiUdp.h>
#include <TimeLib.h>
#include <NTPClient.h>
#include <FirebaseESP8266.h>
#include <SimpleKalmanFilter.h>
#include <math.h>
#include "addons/TokenHelper.h"
#include "addons/RTDBHelper.h"

#define RED_PIN D6
#define GREEN_PIN D7
#define BLUE_PIN D8

#define WIFI_SSID "YOUR_SSID"
#define WIFI_PASSWORD "YOUR_PASSWORD"

#define API_KEY "API_KEY"
#define DATABASE_URL "https://YOUR_PROJECT_ID.firebaseio.com/"

const char* target_SSID_1 = "TARGET_SSID_1";
const char* target_SSID_2 = "TARGET_SSID_2";
const char* target_SSID_3 = "TARGET_SSID_3";

SimpleKalmanFilter kalmanFilter1(2, 2, 0.05), kalmanFilter2(2, 2, 0.05), kalmanFilter3(2, 2, 0.05);


const float n = 4.0;
// const float n = 3.8; 
const float d0 = 1.0;
const int PL_d0 = -30, timeZone = 7;
const char* ntpServerName = "pool.ntp.org";

FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

WiFiUDP ntpUDP;
NTPClient timeClient(ntpUDP, ntpServerName, timeZone * 3600);

unsigned long lastUpdateTime = 0;
unsigned long lastScanTime = 0;
bool signupOK = false;

float previousRSSI1 = -50, previousRSSI2 = -50, previousRSSI3 = -50;

String macAddress;

void logData(String ssid, float rssi, float distance, String timestamp) {
  Serial.print(timestamp + " - ");
  Serial.print(ssid);
  Serial.print(" - RSSI: ");
  Serial.print(rssi);
  Serial.print(" dBm, Distance: ");
  Serial.print(distance);
  Serial.println(" meters");
}

void connectToWiFi() {
  WiFi.mode(WIFI_STA);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Connecting to Wi-Fi");

  unsigned long wifiTimeout = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - wifiTimeout < 10000) {
    Serial.print(".");
    delay(200);
  }

  if (WiFi.status() == WL_CONNECTED) {
    Serial.println("\nConnected with IP: " + WiFi.localIP().toString());
  } else {
    Serial.println("\nWiFi connection failed, restarting...");
    ESP.restart();
  }
}

void checkWiFiConnection() {
  if (WiFi.status() != WL_CONNECTED) {
    Serial.println("WiFi connection lost, reconnecting...");
    connectToWiFi();
  }
}

void setupFirebase() {
  config.api_key = API_KEY;
  config.database_url = DATABASE_URL;

  if (Firebase.signUp(&config, &auth, "", "")) {
    Serial.println("Firebase sign-up success.");
    signupOK = true;
  } else {
    Serial.printf("Sign-up error: %s\n", config.signer.signupError.message.c_str());
  }

  config.token_status_callback = tokenStatusCallback;
  Firebase.begin(&config, &auth);
  Firebase.reconnectWiFi(true);
}

String getFormattedTime(time_t rawTime) {
  struct tm *ti;
  ti = localtime(&rawTime);
  
  char buffer[20];
  sprintf(buffer, "%04d-%02d-%02d %02d:%02d:%02d",
          ti->tm_year + 1900, ti->tm_mon + 1, ti->tm_mday,
          ti->tm_hour, ti->tm_min, ti->tm_sec);
  return String(buffer);
}

float calculate_Distance_Log(float rssi_dBm) {
  return d0 * pow(10, (PL_d0 - rssi_dBm) / (10 * n));
}

bool isTimeValid(time_t rawTime) {
  return rawTime > 100000; 
}

void setup() {
  Serial.begin(115200);
  pinMode(RED_PIN, OUTPUT);
  pinMode(GREEN_PIN, OUTPUT);
  pinMode(BLUE_PIN, OUTPUT);

  digitalWrite(RED_PIN, LOW);
  digitalWrite(GREEN_PIN, LOW);
  digitalWrite(BLUE_PIN, LOW);
  connectToWiFi();
  setupFirebase();
  timeClient.begin();

  macAddress = WiFi.macAddress();
  macAddress.replace(":", "");
  macAddress = "Node-" + macAddress;
  Serial.println("MAC Address: " + macAddress);

  if (Firebase.ready() && signupOK) {
    String nodePath = "/Data/" + macAddress;
    Firebase.setString(fbdo, nodePath + "/Mac", macAddress);
  }
}

void loop() {
  int analogValue = analogRead(A0); // 0 - 1023

  float voltage = analogValue * ((30.0 + 10.0) / 10.0) * (1.0 / 1023.0); 

  Serial.print("Analog: ");
  Serial.print(analogValue);
  Serial.print(" | Voltage: ");
  Serial.println(voltage, 2);  

  if (voltage < 3.4) {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, LOW);
    digitalWrite(BLUE_PIN, LOW);
  } else if (voltage < 3.8) {
    digitalWrite(RED_PIN, HIGH);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, LOW);
  } else {
    digitalWrite(RED_PIN, LOW);
    digitalWrite(GREEN_PIN, HIGH);
    digitalWrite(BLUE_PIN, LOW);
  }
  checkWiFiConnection();
  timeClient.update();
  time_t rawTime = timeClient.getEpochTime();
  
  if (!isTimeValid(rawTime)) {
    Serial.println("NTP time not available yet, retrying...");
    delay(200);
    return;
  }

  String currentTimestamp = getFormattedTime(rawTime);

  if (millis() - lastScanTime > 500) {
    lastScanTime = millis();
    int numNetworks = WiFi.scanNetworks();
    if (numNetworks == 0) {
      Serial.println("No networks found.");
    } else {
      bool foundSSID1 = false, foundSSID2 = false, foundSSID3 = false;
      float rawRSSI1 = 0, rawRSSI2 = 0, rawRSSI3 = 0;

      for (int i = 0; i < numNetworks; i++) {
        String ssid = WiFi.SSID(i);
        int rssi = WiFi.RSSI(i);

        if (ssid == target_SSID_1) {
          rawRSSI1 = rssi;
          foundSSID1 = true;
        }
        if (ssid == target_SSID_2) {
          rawRSSI2 = rssi;
          foundSSID2 = true;
        }
        if (ssid == target_SSID_3) {
          rawRSSI3 = rssi;
          foundSSID3 = true;
        }
      }

      if (Firebase.ready() && signupOK && (millis() - lastUpdateTime > 500)) {
        lastUpdateTime = millis();

        String nodePath = "/Data/" + macAddress;
        
        if (!Firebase.getString(fbdo, nodePath + "/Mac")) {
          Firebase.setString(fbdo, nodePath + "/Mac", macAddress);
        }

        if (foundSSID1 && rawRSSI1 != previousRSSI1) {
          previousRSSI1 = rawRSSI1;
          float filteredRSSI1 = kalmanFilter1.updateEstimate(rawRSSI1);
          float distance1 = calculate_Distance_Log(filteredRSSI1);
          logData(target_SSID_1, filteredRSSI1, distance1, currentTimestamp);
          String path1 = nodePath + "/Router-1";
          Firebase.setFloat(fbdo, path1 + "/rssi", filteredRSSI1);
          Firebase.setFloat(fbdo, path1 + "/distance", distance1);
          Firebase.setString(fbdo, path1 + "/timestamp", currentTimestamp);
        }

        if (foundSSID2 && rawRSSI2 != previousRSSI2) {
          previousRSSI2 = rawRSSI2;
          float filteredRSSI2 = kalmanFilter2.updateEstimate(rawRSSI2);
          float distance2 = calculate_Distance_Log(filteredRSSI2);
          logData(target_SSID_2, filteredRSSI2, distance2, currentTimestamp);
          String path2 = nodePath + "/Router-2";
          Firebase.setFloat(fbdo, path2 + "/rssi", filteredRSSI2);
          Firebase.setFloat(fbdo, path2 + "/distance", distance2);
          Firebase.setString(fbdo, path2 + "/timestamp", currentTimestamp);
        }

        if (foundSSID3 && rawRSSI3 != previousRSSI3) {
          previousRSSI3 = rawRSSI3;
          float filteredRSSI3 = kalmanFilter3.updateEstimate(rawRSSI3);
          float distance3 = calculate_Distance_Log(filteredRSSI3);
          logData(target_SSID_3, filteredRSSI3, distance3, currentTimestamp);
          String path3 = nodePath + "/Router-3";
          Firebase.setFloat(fbdo, path3 + "/rssi", filteredRSSI3);
          Firebase.setFloat(fbdo, path3 + "/distance", distance3);
          Firebase.setString(fbdo, path3 + "/timestamp", currentTimestamp);
        }
      }
    }
  }
}
