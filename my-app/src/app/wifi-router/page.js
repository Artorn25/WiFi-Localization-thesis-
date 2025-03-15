"use client";
import { useEffect, useState } from "react";
import "@styles/wifi-router.css";

export default function WifiRouter() {
  const [wifiData, setWifiData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // ฟังก์ชันสำหรับแสดง Wi-Fi routers
  function displayWifiList(wifiList) {
    const wifiListElement = document.getElementById("wifiList");
    wifiListElement.innerHTML = ""; // เคลียร์รายการเดิม
    wifiList.forEach((wifi) => {
      const listItem = document.createElement("li");
      const signalClass = getSignalClass(wifi.signalStrength);
      listItem.innerHTML = `
                <span>${wifi.name}</span>
                <span class="signal ${signalClass}">${wifi.signalStrength}%</span>
            `;
      wifiListElement.appendChild(listItem);
    });
  }

  // ฟังก์ชันสำหรับกำหนดสีตามความแรงของสัญญาณ
  function getSignalClass(signalStrength) {
    if (signalStrength >= 80) {
      return "strong";
    } else if (signalStrength >= 50) {
      return "moderate";
    } else {
      return "weak";
    }
  }

  // ฟังก์ชันรีเฟรชรายการ Wi-Fi
  async function refreshWifi() {
    setIsLoading(true);
    alert("Refreshing Wi-Fi list...");

    // จำลองการดึงข้อมูล Wi-Fi ใหม่ (อาจเปลี่ยนเป็น API จริงได้)
    const newWifiData = await fetchWifiData();
    setWifiData(newWifiData);
    displayWifiList(newWifiData);

    setIsLoading(false);
  }

  // ฟังก์ชันค้นหา Wi-Fi
  function searchWifi() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const filteredWifi = wifiData.filter((wifi) =>
      wifi.name.toLowerCase().includes(searchValue)
    );
    displayWifiList(filteredWifi);
  }

  // ฟังก์ชันจำลองการดึงข้อมูล Wi-Fi
  async function fetchWifiData() {
    return new Promise((resolve) => {
      setTimeout(() => {
        const data = [
          {
            name: "Home WiFi",
            signalStrength: Math.floor(Math.random() * 100),
          },
          {
            name: "Office WiFi",
            signalStrength: Math.floor(Math.random() * 100),
          },
          {
            name: "Cafe WiFi",
            signalStrength: Math.floor(Math.random() * 100),
          },
          {
            name: "Library WiFi",
            signalStrength: Math.floor(Math.random() * 100),
          },
          {
            name: "Guest WiFi",
            signalStrength: Math.floor(Math.random() * 100),
          },
        ];
        resolve(data);
      }, 1000);
    });
  }

  // เริ่มต้นแสดงรายการ Wi-Fi
  useEffect(() => {
    refreshWifi();
  }, []); 

  return (
    <>
      <header>
        <h1 className="text-yellow-300 shadow-md">Available Wi-Fi Routers</h1>
      </header>
      <section className="wifi-list">
        <input
          type="text"
          id="search"
          placeholder="Search Wi-Fi..."
          onKeyUp={searchWifi} // แก้ไขเป็น onKeyUp แทน onkeyup
        />
        <ul id="wifiList"></ul>
      </section>
      <button id="refreshBtn" onClick={refreshWifi} disabled={isLoading}>
        {isLoading ? "Refreshing..." : "Refresh"}
      </button>
    </>
  );
}
