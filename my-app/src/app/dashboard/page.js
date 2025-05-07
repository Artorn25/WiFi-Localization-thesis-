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
  const [nodes, setNodes] = useState({
    "Node-807D3A47F90B": null,
    "Node-C45BBE4305AC": null,
    "Node-C45BBECE5D54": null,
  });
  
  const [chartData, setChartData] = useState({
    "Node-807D3A47F90B": {
      distance: { labels: [], router1: [], router2: [], router3: [] },
      rssi: { labels: [], router1: [], router2: [], router3: [] }
    },
    "Node-C45BBE4305AC": {
      distance: { labels: [], router1: [], router2: [], router3: [] },
      rssi: { labels: [], router1: [], router2: [], router3: [] }
    },
    "Node-C45BBECE5D54": {
      distance: { labels: [], router1: [], router2: [], router3: [] },
      rssi: { labels: [], router1: [], router2: [], router3: [] }
    }
  });

  const [currentNode, setCurrentNode] = useState("Node-807D3A47F90B");
  const [connectionStatus, setConnectionStatus] = useState("Unknown");

  function updateCharts(history) {
    if (distanceChart) distanceChart.destroy();
    if (rssiChart) rssiChart.destroy();

    const distanceCtx = document.getElementById("distanceChart").getContext("2d");
    distanceChart = new Chart(distanceCtx, {
      type: "line",
      data: {
        labels: history.distance.labels,
        datasets: [
          {
            label: "Router 1 Distance",
            data: history.distance.router1,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Router 2 Distance",
            data: history.distance.router2,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Router 3 Distance",
            data: history.distance.router3,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time",
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "Distance (m)",
            },
          },
        },
        animation: {
          duration: 0,
        },
      },
    });

    const rssiCtx = document.getElementById("rssiChart").getContext("2d");
    rssiChart = new Chart(rssiCtx, {
      type: "line",
      data: {
        labels: history.rssi.labels,
        datasets: [
          {
            label: "Router 1 RSSI",
            data: history.rssi.router1,
            borderColor: "rgba(54, 162, 235, 1)",
            backgroundColor: "rgba(54, 162, 235, 0.1)",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Router 2 RSSI",
            data: history.rssi.router2,
            borderColor: "rgba(255, 99, 132, 1)",
            backgroundColor: "rgba(255, 99, 132, 0.1)",
            tension: 0.1,
            fill: true,
          },
          {
            label: "Router 3 RSSI",
            data: history.rssi.router3,
            borderColor: "rgba(75, 192, 192, 1)",
            backgroundColor: "rgba(75, 192, 192, 0.1)",
            tension: 0.1,
            fill: true,
          },
        ],
      },
      options: {
        responsive: true,
        scales: {
          x: {
            display: true,
            title: {
              display: true,
              text: "Time",
            },
            ticks: {
              autoSkip: true,
              maxTicksLimit: 10,
            },
          },
          y: {
            beginAtZero: false,
            title: {
              display: true,
              text: "RSSI (dBm)",
            },
          },
        },
        animation: {
          duration: 0,
        },
      },
    });
  }

  function updateDataTable() {
    const tableBody = document.getElementById("dataTableBody");
    if (!tableBody) return;
    tableBody.innerHTML = "";

    const models = ["Log", "ITU", "FSPL"];
    const routers = ["Router-1", "Router-2", "Router-3"];

    models.forEach((model) => {
      routers.forEach((router) => {
        const row = tableBody.insertRow();
        row.insertCell(0).textContent = model;
        row.insertCell(1).textContent = router;
        row.insertCell(2).textContent = nodes[currentNode]?.[router]?.ssid || "N/A";
        row.insertCell(3).textContent = nodes[currentNode]?.[router]?.rssi || "N/A";
        row.insertCell(4).textContent = nodes[currentNode]?.[router]?.distance || "N/A";
      });
    });
  }

  useEffect(() => {
    updateCharts(chartData[currentNode]);
  }, [currentNode, chartData]);

  useEffect(() => {
    updateDataTable();
  }, [currentNode, nodes]);

  useEffect(() => {
    const connectionRef = ref(database, ".info/connected");
    onValue(connectionRef, (snap) => {
      setConnectionStatus(snap.val() ? "Connected" : "Disconnected");
    });

    const dbRef = ref(database, "Data");
    onValue(dbRef, (snapshot) => {
      if (snapshot.exists()) {
        const allData = snapshot.val();
        const nodeData = allData[currentNode];

        setNodes({
          "Node-807D3A47F90B": allData["Node-807D3A47F90B"],
          "Node-C45BBE4305AC": allData["Node-C45BBE4305AC"],
          "Node-C45BBECE5D54": allData["Node-C45BBECE5D54"],
        });

        const now = new Date();
        const timeLabel = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}`;

        setChartData(prev => {
          const newData = {...prev};
          const nodeHistory = newData[currentNode];
          
          if (nodeHistory.distance.labels.length >= 20) {
            nodeHistory.distance.labels.shift();
            nodeHistory.distance.router1.shift();
            nodeHistory.distance.router2.shift();
            nodeHistory.distance.router3.shift();
            nodeHistory.rssi.labels.shift();
            nodeHistory.rssi.router1.shift();
            nodeHistory.rssi.router2.shift();
            nodeHistory.rssi.router3.shift();
          }

          nodeHistory.distance.labels.push(timeLabel);
          nodeHistory.distance.router1.push(nodeData?.["Router-1"]?.distance || 0);
          nodeHistory.distance.router2.push(nodeData?.["Router-2"]?.distance || 0);
          nodeHistory.distance.router3.push(nodeData?.["Router-3"]?.distance || 0);

          nodeHistory.rssi.labels.push(timeLabel);
          nodeHistory.rssi.router1.push(nodeData?.["Router-1"]?.rssi || 0);
          nodeHistory.rssi.router2.push(nodeData?.["Router-2"]?.rssi || 0);
          nodeHistory.rssi.router3.push(nodeData?.["Router-3"]?.rssi || 0);

          return newData;
        });
      }
    });
  }, [currentNode]);

  const RouterInfo = ({ routerData, routerName }) => (
    <div className={`p-4 rounded-lg ${
      routerName === "Router-1" ? "bg-blue-50" : 
      routerName === "Router-2" ? "bg-red-50" : "bg-green-50"
    }`}>
      <h4 className={`text-md font-semibold ${
        routerName === "Router-1" ? "text-blue-500" : 
        routerName === "Router-2" ? "text-red-500" : "text-green-500"
      }`}>
        {routerName}
      </h4>
      <p className="text-gray-600">SSID: {routerData?.ssid || "N/A"}</p>
      <p className="text-gray-600">RSSI: {routerData?.rssi || "N/A"} dBm</p>
      <p className="text-gray-600">Distance: {routerData?.distance || "N/A"} m</p>
    </div>
  );

  return (
    <>
      <title>Dashboard</title>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
          WiFi Localization System
        </h1>
        
        <div
          id="connection-status"
          className={`p-3 rounded-md font-semibold mb-6 text-center ${
            connectionStatus === "Connected"
              ? "bg-green-500 text-white"
              : "bg-red-500 text-white"
          }`}
        >
          Status: {connectionStatus}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 mx-auto">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              Log Distance Path Model
            </h2>

            {/* Node 1 */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-500">Node 1</h3>
                <h4 className="text-md font-semibold text-gray-500">
                  Router 1
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-1"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-1"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-1"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 2
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-2"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-2"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-2"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 3
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-3"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-3"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-807D3A47F90B"]?.["Router-3"]?.distance || "N/A"}{" "}
                  m
                </p>
              </div>

              {/* Node 2 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-500">Node 2</h3>
                <h4 className="text-md font-semibold text-gray-500">
                  Router 1
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-1"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-1"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-1"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 2
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-2"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-2"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-2"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 3
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-3"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-3"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBE4305AC"]?.["Router-3"]?.distance || "N/A"}{" "}
                  m
                </p>
              </div>

              {/* Node 3 */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold text-green-500">Node 3</h3>
                <h4 className="text-md font-semibold text-gray-500">
                  Router 1
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-1"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-1"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-1"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 2
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-2"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-2"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-2"]?.distance || "N/A"}{" "}
                  m
                </p>

                <h4 className="text-md font-semibold text-gray-500 mt-3">
                  Router 3
                </h4>
                <p className="text-gray-600">
                  SSID:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-3"]?.ssid || "N/A"}
                </p>
                <p className="text-gray-600">
                  RSSI:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-3"]?.rssi || "N/A"} dBm
                </p>
                <p className="text-gray-600">
                  Distance:{" "}
                  {nodes["Node-C45BBECE5D54"]?.["Router-3"]?.distance || "N/A"}{" "}
                  m
                </p>
              </div>
            </div>

            
          </div>
        </div>

        <div className="flex justify-center mb-8 gap-4">
          <button
            onClick={() => setCurrentNode("Node-807D3A47F90B")}
            className={`px-4 py-2 rounded-md font-semibold ${
              currentNode === "Node-807D3A47F90B"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Node 1
          </button>
          <button
            onClick={() => setCurrentNode("Node-C45BBE4305AC")}
            className={`px-4 py-2 rounded-md font-semibold ${
              currentNode === "Node-C45BBE4305AC"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Node 2
          </button>
          <button
            onClick={() => setCurrentNode("Node-C45BBECE5D54")}
            className={`px-4 py-2 rounded-md font-semibold ${
              currentNode === "Node-C45BBECE5D54"
                ? "bg-blue-500 text-white"
                : "bg-gray-200 text-gray-800"
            }`}
          >
            Node 3
          </button>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mx-auto mb-8">
          <h2 className="text-2xl font-bold mb-4 text-green-600">
            Current Node: {currentNode.replace("Node-", "Node ")}
          </h2>
          
          {nodes[currentNode] ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <RouterInfo 
                routerData={nodes[currentNode]?.["Router-1"]} 
                routerName="Router-1" 
              />
              <RouterInfo 
                routerData={nodes[currentNode]?.["Router-2"]} 
                routerName="Router-2" 
              />
              <RouterInfo 
                routerData={nodes[currentNode]?.["Router-3"]} 
                routerName="Router-3" 
              />
            </div>
          ) : (
            <div className="bg-yellow-50 p-4 rounded-lg">
              <p>No data available for this node</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-blue-600">
              Distance Tracking - {currentNode.replace("Node-", "Node ")}
            </h2>
            <div className="h-[400px]">
              <canvas id="distanceChart"></canvas>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated:{" "}
              {chartData[currentNode]?.distance.labels[chartData[currentNode]?.distance.labels.length - 1] || "N/A"}
            </p>
          </div>
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-bold mb-4 text-green-600">
              RSSI Tracking - {currentNode.replace("Node-", "Node ")}
            </h2>
            <div className="h-[400px]">
              <canvas id="rssiChart"></canvas>
            </div>
            <p className="text-sm text-gray-500 mt-2">
              Last updated:{" "}
              {chartData[currentNode]?.rssi.labels[chartData[currentNode]?.rssi.labels.length - 1] || "N/A"}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold mb-4 text-purple-600">
            Detailed Data - {currentNode.replace("Node-", "Node ")}
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

        <div className="flex gap-4 justify-center">
          <button
            id="exportJSON"
            className="bg-yellow-300 px-4 py-2 rounded-md font-semibold hover:bg-yellow-400 transition-colors"
          >
            Export as JSON
          </button>
          <button
            id="exportCSV"
            className="bg-green-400 px-4 py-2 rounded-md font-semibold hover:bg-green-500 transition-colors"
          >
            Export as CSV
          </button>
        </div>
      </div>
    </>
  );
}