"use client";
import { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue } from "firebase/database";
import Chart from "chart.js/auto";

// Firebase Config
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_APIKEY,
  authDomain: process.env.NEXT_PUBLIC_AUTHDOMAIN,
  databaseURL: process.env.NEXT_PUBLIC_DATABASEURL,
  projectId: process.env.NEXT_PUBLIC_PROJECTID,
  storageBucket: process.env.NEXT_PUBLIC_STORAGEBUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_MESSAGINGSENDERID,
  appId: process.env.NEXT_PUBLIC_APPID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
let distanceChart, rssiChart;

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState("Unknown");
  console.log(process.env.NEXT_PUBLIC_APIKEY);
  function updateCharts(data) {
    if (distanceChart) {
      distanceChart.destroy();
    }
    if (rssiChart) {
      rssiChart.destroy();
    }

    distanceChart = new Chart(document.getElementById("distanceChart"), {
      type: "bar",
      data: {
        labels: ["Log Model", "ITU Model", "FSPL Model"],
        datasets: [
          {
            label: "Router 1",
            data: [
              data.Router1?.Log?.distance || 0,
              data.Router1?.ITU?.distance || 0,
              data.Router1?.FSPL?.distance || 0,
            ],
            backgroundColor: "rgba(54, 162, 235, 0.5)",
          },
          {
            label: "Router 2",
            data: [
              data.Router2?.Log?.distance || 0,
              data.Router2?.ITU?.distance || 0,
              data.Router2?.FSPL?.distance || 0,
            ],
            backgroundColor: "rgba(255, 99, 132, 0.5)",
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Distance (m)",
            },
          },
        },
      },
    });

    rssiChart = new Chart(document.getElementById("rssiChart"), {
      type: "line",
      data: {
        labels: ["Router 1", "Router 2"],
        datasets: [
          {
            label: "RSSI (dBm)",
            data: [data.Router1?.rssi || 0, data.Router2?.rssi || 0],
            borderColor: "rgb(75, 192, 192)",
            tension: 0.1,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          y: {
            title: {
              display: true,
              text: "RSSI (dBm)",
            },
          },
        },
      },
    });
  }

  function updateDataTable(data) {
    const tableBody = document.getElementById("dataTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const models = ["Log", "ITU", "FSPL"];
    const routers = ["Router1", "Router2"];

    models.forEach((model) => {
      routers.forEach((router) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = model;
        row.insertCell(1).textContent = router;
        row.insertCell(2).textContent = data[router]?.ssid || "N/A";
        row.insertCell(3).textContent = data[router]?.rssi || "N/A";
        row.insertCell(4).textContent =
          data[router]?.[model]?.[`distance`] || "N/A";
      });
    });
  }

  function updateDOM(data) {
    setData(data); // ใช้ React State แทน document.getElementById()
    updateCharts(data);
    updateDataTable(data);
  }

  useEffect(() => {
    const connectionRef = ref(database, ".info/connected");
    onValue(connectionRef, (snap) => {
      setConnectionStatus(snap.val() ? "Connected" : "Disconnected");
    });

    const dbRef = ref(database, "Data");
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const newData = snapshot.val();
        updateDOM(newData);
      } else {
        console.log("No data available");
      }
    });

    const datetimeEndRef = ref(database, "Data/Datetime/end");

    onValue(datetimeEndRef, (snapshot) => {
      const end = snapshot.val();
      console.log("New 'end' value:", end);

      onValue(dbRef, (snapshot) => {
        const newData = snapshot.val();
        updateDOM(newData);
      });
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
    <>
      <div className="container mx-auto px-4">
        <h1 className="text-3xl font-bold text-center text-gray-800 mb-8">
          Combined Firebase Console Display
        </h1>
        <div id="connection-status">Status: {connectionStatus}</div>
        <div id="time" className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4 text-gray-700">Datetime</h3>
          <div className="flex justify-between">
            <p id="start" className="text-gray-600">
              Start: {start}
            </p>
            <p id="end" className="text-gray-600">
              End: {end}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
          <div id="distance-log" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              Log Distance Path Model
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-green-500">
                  Router 1
                </h3>
                <p id="router-1-ssid-log" className="text-gray-600">
                  SSID: {ssid_1}
                </p>
                <p id="router-1-rssi-log" className="text-gray-600">
                  RSSI: {rssi_1} dBm
                </p>
                <p id="router-1-distance-log" className="text-gray-600">
                  Distance: {distance_1_Log} m
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-green-500">
                  Router 2
                </h3>
                <p id="router-2-ssid-log" className="text-gray-600">
                  SSID: {ssid_2}
                </p>
                <p id="router-2-rssi-log" className="text-gray-600">
                  RSSI: {rssi_2} dBm
                </p>
                <p id="router-2-distance-log" className="text-gray-600">
                  Distance: {distance_2_Log} m
                </p>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-green-500">
              Distance
            </h3>
            <p id="distance-a-b-log" className="text-gray-600">
              Distance A between Distance B using log: {distanceA_B_Log} m
            </p>
          </div>

          <div id="distance-itu" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              ITU Indoor Propagation Model
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-blue-500">
                  Router 1
                </h3>
                <p id="router-1-ssid-ITU" className="text-gray-600">
                  SSID: {ssid_1}
                </p>
                <p id="router-1-rssi-ITU" className="text-gray-600">
                  RSSI: {rssi_1} dBm
                </p>
                <p id="router-1-distance-ITU" className="text-gray-600">
                  Distance: {distance_1_ITU} m
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-blue-500">
                  Router 2
                </h3>
                <p id="router-2-ssid-ITU" className="text-gray-600">
                  SSID: {ssid_2}
                </p>
                <p id="router-2-rssi-ITU" className="text-gray-600">
                  RSSI: {rssi_2} dBm
                </p>
                <p id="router-2-distance-ITU" className="text-gray-600">
                  Distance: {distance_2_ITU} m
                </p>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-blue-500">
              Distance
            </h3>
            <p id="distance-a-b-ITU" className="text-gray-600">
              Distance A between Distance B using ITU: {distanceA_B_ITU} m
            </p>
          </div>

          <div id="distance-fspl" className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-purple-600">
              Free-space Path Loss
            </h2>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <h3 className="text-lg font-semibold text-purple-500">
                  Router 1
                </h3>
                <p id="router-1-ssid-FSPL" className="text-gray-600">
                  SSID: {ssid_1}
                </p>
                <p id="router-1-rssi-FSPL" className="text-gray-600">
                  RSSI: {rssi_1} dBm
                </p>
                <p id="router-1-distance-FSPL" className="text-gray-600">
                  Distance: {distance_1_Log} m
                </p>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-purple-500">
                  Router 2
                </h3>
                <p id="router-2-ssid-FSPL" className="text-gray-600">
                  SSID: {ssid_2}
                </p>
                <p id="router-2-rssi-FSPL" className="text-gray-600">
                  RSSI: {rssi_2} dBm
                </p>
                <p id="router-2-distance-FSPL" className="text-gray-600">
                  Distance: {distance_2_Log} m
                </p>
              </div>
            </div>
            <h3 className="text-lg font-semibold mb-2 text-purple-500">
              Distance
            </h3>
            <p id="distance-a-b-FSPL" className="text-gray-600">
              Distance A between Distance B using FSPL: {distanceA_B_Log} m
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              Distance Comparison Chart
            </h2>
            <canvas id="distanceChart"></canvas>
          </div>
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              RSSI Comparison Chart
            </h2>
            <canvas id="rssiChart"></canvas>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-purple-600">
            Detailed Data Table
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white text-center">
              <thead className="bg-gray-100">
                <tr>
                  <th className="py-2 px-4 border-b">Model</th>
                  <th className="py-2 px-4 border-b">Router</th>
                  <th className="py-2 px-4 border-b">SSID</th>
                  <th className="py-2 px-4 border-b">RSSI (dBm)</th>
                  <th className="py-2 px-4 border-b">Distance (m)</th>
                </tr>
              </thead>
              <tbody id="dataTableBody"></tbody>
            </table>
          </div>
        </div>
        <button id="exportJSON" className="bg-yellow-300">
          Export as JSON
        </button>
        <button id="exportCSV" className="bg-green-400">
          Export as CSV
        </button>
      </div>
    </>
  );
}
