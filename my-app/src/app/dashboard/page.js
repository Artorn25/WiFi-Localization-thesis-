"use client";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import Chart from "chart.js/auto";
import firebase from "firebase/compat/app";

// Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyCFhkQgV566VA1QjexbaCsAJ8iCfQXpW0g",
  authDomain: "esp8266-t1-37f02.firebaseapp.com",
  databaseURL:
    "https://esp8266-t1-37f02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp8266-t1-37f02",
  storageBucket: "esp8266-t1-37f02.appspot.com",
  messagingSenderId: "201166852539",
  appId: "1:201166852539:web:42c3ad90a0611b17d5b49e",
};

// Initialize Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.database(app);
const dbRef = db.ref();

function fetchData() {
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const data = snapshot.val();
      console.log(data); // Output updated data to the console

      // Get values or use default if not available
      var start = data?.Datetime?.start ?? "Not available",
        end = data?.Datetime?.end ?? "Not available",
        ssid_1 = data?.Router1?.ssid ?? "Not available",
        rssi_1 = data?.Router1?.rssi ?? "Not available",
        ssid_2 = data?.Router2?.ssid ?? "Not available",
        rssi_2 = data?.Router2?.rssi ?? "Not available",
        distance_1_Log = data?.Router1?.Log?.distance ?? "Not available",
        distance_2_Log = data?.Router2?.Log?.distance ?? "Not available",
        distanceA_B_Log = data?.DistanceA_B?.distanceA_B_Log ?? "Not available",
        distance_1_ITU = data?.Router1?.ITU?.distance ?? "Not available",
        distance_2_ITU = data?.Router2?.ITU?.distance ?? "Not available",
        distanceA_B_ITU = data?.DistanceA_B?.distanceA_B_ITU ?? "Not available";

      // Display the data in the console
      console.log("Start Time:", start);
      console.log("End Time:", end);
      console.log("Router1 SSID:", ssid_1);
      console.log("Router1 RSSI:", rssi_1);
      console.log("Router2 SSID:", ssid_2);
      console.log("Router2 RSSI:", rssi_2);
      console.log("Distance Log (Router1):", distance_1_Log);
      console.log("Distance Log (Router2):", distance_2_Log);
      console.log("Distance A-B Log:", distanceA_B_Log);
      console.log("Distance ITU (Router1):", distance_1_ITU);
      console.log("Distance ITU (Router2):", distance_2_ITU);
      console.log("Distance A-B ITU:", distanceA_B_ITU);

      // Update the DOM with the fetched data
      document.getElementById("start").innerText = "Start: " + start;
      document.getElementById("end").innerText = "End: " + end;

      document.getElementById("router-1-ssid-log").innerText =
        "SSID: " + ssid_1;
      document.getElementById("router-1-rssi-log").innerText =
        "RSSI: " + rssi_1 + " dBm";
      document.getElementById("router-1-distance-log").innerText =
        "Distance: " + distance_1_Log + " m";
      document.getElementById("router-2-ssid-log").innerText =
        "SSID: " + ssid_2;
      document.getElementById("router-2-rssi-log").innerText =
        "RSSI: " + rssi_2 + " dBm";
      document.getElementById("router-2-distance-log").innerText =
        "Distance: " + distance_2_Log + " m";
      document.getElementById("distance-a-b-log").innerText =
        "Distance A between Distance B using log: " + distanceA_B_Log + " m";

      document.getElementById("router-1-ssid-ITU").innerText =
        "SSID: " + ssid_1;
      document.getElementById("router-1-rssi-ITU").innerText =
        "RSSI: " + rssi_1 + " dBm";
      document.getElementById("router-1-distance-ITU").innerText =
        "Distance: " + distance_1_ITU + " m";
      document.getElementById("router-2-ssid-ITU").innerText =
        "SSID: " + ssid_2;
      document.getElementById("router-2-rssi-ITU").innerText =
        "RSSI: " + rssi_2 + " dBm";
      document.getElementById("router-2-distance-ITU").innerText =
        "Distance: " + distance_2_ITU + " m";
      document.getElementById("distance-a-b-ITU").innerText =
        "Distance A between Distance B using ITU: " + distanceA_B_ITU + " m";

      // Update any additional elements, charts, or tables
      updateDOM(data);
    } else {
      console.log("No data available");
    }
  });
}

// Fetch data initially when page loads
fetchData();

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Unknown");

  useEffect(() => {
    // ตรวจสอบการเชื่อมต่อ Firebase
    const connectionRef = ref(database, ".info/connected");
    onValue(connectionRef, (snap) => {
      setConnectionStatus(snap.val() ? "Connected" : "Disconnected");
    });

    // ดึงข้อมูลจาก Firebase
    const dbRef = ref(database, "Data");
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.val();
        setData(data); // เก็บข้อมูลใน state
      } else {
        console.log("No data available");
      }
    });
  }, []);

  // ดึงข้อมูลที่ใช้จาก `data`
  const start = data?.Datetime?.start ?? "Not available";
  const end = data?.Datetime?.end ?? "Not available";
  const ssid_1 = data?.Router1?.ssid ?? "Not available";
  const rssi_1 = data?.Router1?.rssi ?? "Not available";
  const ssid_2 = data?.Router2?.ssid ?? "Not available";
  const rssi_2 = data?.Router2?.rssi ?? "Not available";
  const distance_1_Log = data?.Router1?.Log?.distance ?? "Not available";
  const distance_2_Log = data?.Router2?.Log?.distance ?? "Not available";
  const distanceA_B_Log = data?.DistanceA_B?.distanceA_B_Log ?? "Not available";
  const distance_1_ITU = data?.Router1?.ITU?.distance ?? "Not available";
  const distance_2_ITU = data?.Router2?.ITU?.distance ?? "Not available";
  const distanceA_B_ITU = data?.DistanceA_B?.distanceA_B_ITU ?? "Not available";


  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
        Combined Firebase Console Display
      </h1>

      {/* สถานะการเชื่อมต่อ */}
      <div
        className={`text-center font-semibold ${connectionStatus === "Connected" ? "text-green-500" : "text-red-500"}`}
      >
        Status: {connectionStatus}
      </div>

      {/* เวลาเริ่มและสิ้นสุด */}
      <div className="bg-white rounded-lg shadow-md p-6 my-8">
        <h3 className="text-xl font-semibold mb-4 text-gray-700">Datetime</h3>
        <div className="flex justify-between">
          <p>Start: {start}</p>
          <p>End: {end}</p>
        </div>
      </div>

      {/* ข้อมูลระยะทาง */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        {["Log", "ITU", "FSPL"].map((model) => (
          <div key={model} className="bg-white rounded-lg shadow-md p-6">
            <h2
              className={`text-2xl font-bold mb-4 ${
                model === "Log"
                  ? "text-green-600"
                  : model === "ITU"
                  ? "text-blue-600"
                  : "text-purple-600"
              }`}
            >
              {model} Model
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              {["Router1", "Router2"].map((router) => (
                <div key={router}>
                  <h3 className="text-lg font-semibold text-gray-700">{router}</h3>
                  <p>SSID: {router === "Router1" ? ssid_1 : ssid_2}</p>
                  <p>RSSI: {router === "Router1" ? rssi_1 : rssi_2} dBm</p>
                  <p>Distance: {router === "Router1" ? distance_1_Log : distance_2_Log} m</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
