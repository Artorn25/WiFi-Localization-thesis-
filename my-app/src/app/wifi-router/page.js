"use client";
import { useEffect } from "react";
import "../styles/wifi-router.css";

export default function WifiRouter() {
  const wifiData = [
    { name: "Home WiFi", signalStrength: 85 },
    { name: "Office WiFi", signalStrength: 60 },
    { name: "Cafe WiFi", signalStrength: 30 },
    { name: "Library WiFi", signalStrength: 55 },
    { name: "Guest WiFi", signalStrength: 40 },
  ];

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
  function refreshWifi() {
    alert("Refreshing Wi-Fi list...");
    displayWifiList(wifiData); // เรียกข้อมูล Wi-Fi ซ้ำ (อาจเปลี่ยนข้อมูลใหม่จาก API จริงได้)
  }

  // ฟังก์ชันค้นหา Wi-Fi
  function searchWifi() {
    const searchValue = document.getElementById("search").value.toLowerCase();
    const filteredWifi = wifiData.filter((wifi) =>
      wifi.name.toLowerCase().includes(searchValue)
    );
    displayWifiList(filteredWifi);
  }

  // เริ่มต้นแสดงรายการ Wi-Fi
  useEffect(() => {
    displayWifiList(wifiData);
  }, []); // ใช้ useEffect แทน window.onload

  return (
    <>
      <header>
        <h1>Available Wi-Fi Routers</h1>
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

      <button id="refreshBtn" onClick={refreshWifi}>
        Refresh
      </button>
    </>
  );
}
