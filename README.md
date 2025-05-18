# 📡WIFI LOCALIZATION SYSTEM📡

<p>This project is thesis research, everyone can study for guideline or development. Thank you for watching.🙏🙏</p>

## 📍What is it ?

> The use of WiFi signals for positioning and tracking devices in areas where WiFi is available allows for accurate location identification, even in indoor environments where GPS signals are inaccessible. This system determines location based on the analysis of signal strength values, known as Received Signal Strength Indicator (RSSI). The RSSI values are used in distance calculation formulas, and the resulting distance values are sent to a database. These values are then visualized on a map created within a website or application, allowing users to track the current position in real time. WiFi localization systems can be accessed via both computers and portable devices such as smartphones and tablets, making them highly convenient and user-friendly.The WiFi-based positioning system we propose is particularly useful for tracking locations inside buildings or indoor facilities without relying on GPS, which is often ineffective in such environments. Since WiFi networks are widely installed in offices, shopping malls, hospitals, and other public places, this system leverages existing infrastructure. Additionally, our system operates within a small-scale range, making it suitable for deployment in various locations and adaptable for other applications in the future.

## ⚙️How It Works

![Overview WiFi Localization System](/images/infographic.png "Infographic")
1. **WEMOS D1** board scans for predefined SSID/router names.
2. Upon detecting a router, it reads the RSSI signal.
3. The RSSI is passed through a **Kalman Filter** for smoothing.
4. **Log Distance Path Loss Model** is used to convert RSSI to estimated distance.
5. The distance is sent to a **Firebase Real-Time Database**.
6. The website reads distances and creates circles representing range from routers.
7. With **three routers**, the system applies **Trilateration** to estimate the current position.

## 🧪Techniques used

- [Kalman Filter](https://www.kalmanfilter.net/default.aspx "Equaltion of filter")

```math
  R = 1, P = 1, Q = 0.05
```

- [Log Distance Path Loss Model](https://www.idc-online.com/technical_references/pdfs/electronic_engineering/Log_Distance_Path_Loss_or_Log_Normal_Shadowing_Model.pdf "Equaltion of find distance")

```math
  PL(d) = PL(d_0) + 10n log_{10}(d/d_0)
```

define value

```math
PL(d_0) = -30 dBm,n = 4
```

- [Trilateration](https://www.researchgate.net/publication/331555599_Trilateration_Technique_for_WiFi-Based_Indoor_Localization "Equaltion of find postion by 3 routers")

```math
 Router 1 : (x-x_{1})^2+(y-y_{1})^2 = d_{1}^2
```

```math
 Router 2 :  (x-x_{2})^2+(y-y_{2})^2 = d_{2}^2
```

```math
 Router 3 :  (x-x_{3})^2+(y-y_{3})^2 = d_{3}^2
```

after bring equaltion Router 1 minus equaltion Router2 and Router3<br>
get two new equations as follows:

```math
2(x_2-x_1 )x+2(y_2-y_1 )y=d_1^2-d_2^2+x_2^2+y_2^2-x_1^2-y_1^2
```

```math
2(x_3-x_1 )x+2(y_3-y_1 )y=d_1^2-d_3^2+x_3^2+y_3^2-x_1^2-y_1^2
```

## 🛠 System Scope
- Requires 3 WiFi routers
- Functions effectively in small-scale indoor areas
- WEMOS D1 (ESP8266) least 1
- internet connecting for board

## ​🌐 Website Demo
> ## 👉[Try the Demo](https://wi-fi-localization-thesis.vercel.app/ "WiFi Localization System")

## 🔄 System Diagram

![Sequence Diagram of User&Admin](/images/sequence-diagram.png "Sequence diagram")

## 🔌 Circuit Design

![All Accessary in Circuit design](/images/circuit-design.png "Circuit design")

## 🧰 Tools & Technologies
### 🌍 Website
+ Next.js v15
+ Tailwind CSS v4

### 📦 Microcontroller
+ PlatformIO
+ WEMOS D1 Mini (ESP8266)

### 💾 Database
+ Firebase
    + Real-Time Database
    + Firestore (for user/admin storage)ase
        - Firestore Database

## 🧑‍💻 Local Setup Guide
### 🌐 Website Setup
<b>1. Install dependencies</b>

```bash
bun install
#or
npm install
```
<b>2. Start development server</b>

```bash
bun run dev
#or
npm run dev
```

## 📡 Microcontroller Setup
<b>1. Install Firebase Library</b><br>
Download: [Firebase ESP8266 Client](https://github.com/mobizt/Firebase-ESP8266)
<br><b>2. Add Firebase Library Path</b><br>
- Extract the library
- Copy the full path (e.g., C:/Users/YourName/Downloads/Firebase_ESP8266_Client)
- Edit platformio.ini:

```bash
lib_deps =
  paulstoffregen/Time@^1.6.1
  arduino-libraries/NTPClient@^3.2.1
  C:/path/to/Firebase_ESP8266_Client
  LittleFS
  denyssene/SimpleKalmanFilter@^0.1.0
```

## 📚 Research References

- [Indoor localization by WiFi](https://www.researchgate.net/publication/252053646_Indoor_localization_by_WiFi)
- [A Survey of Latest Wi-Fi Assisted Indoor Positioning on Different Principles](https://www.mdpi.com/1424-8220/23/18/7961)
- [A Survey of Indoor Localization Systems and Technologies](https://ieeexplore.ieee.org/document/8692423)
