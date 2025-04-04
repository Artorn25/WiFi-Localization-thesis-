"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import "@styles/map.css";
import "@styles/homepage.css";

import { collection, query, where, getDocs } from "firebase/firestore";
// import { dbfs } from "./firebase-config"; // ต้องแน่ใจว่าได้ import dbfs จากไฟล์ที่ตั้งค่า Firebase

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);

  // ฟังก์ชันดึงข้อมูลจุดจาก Firestore
  const fetchPointsFromFirestore = async () => {
    try {
      const currentMapIndex = document.getElementById("map-select").value;

      if (!currentMapIndex) {
        console.log("Please select a map first");
        return;
      }

      const pointsRef = collection(dbfs, "points");
      const q = query(pointsRef, where("mapIndex", "==", currentMapIndex));

      const querySnapshot = await getDocs(q);

      console.log("Points data from Firestore:");
      querySnapshot.forEach((doc) => {
        console.log(`ID: ${doc.id}`, doc.data());
      });

      return querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error("Error fetching points from Firestore: ", error);
      return [];
    }
  };

  useEffect(() => {
    if (!autoRedirect) return;

    const countdownInterval = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    const closeTimer = setTimeout(() => {
      setShowInfoPopup(false);
    }, 5000);

    return () => {
      clearInterval(countdownInterval);
      clearTimeout(closeTimer);
    };
  }, [autoRedirect]);

  return (
    <>
      {/* ส่วน Popup ข้อมูลอธิบาย */}
      {showInfoPopup && (
        <div className="popup-overlay">
          <div className="popup">
            <h2 className="popup-title">About WiFi Localization</h2>
            <div className="popup-content">
              <p>
                WiFi Localization is a technique used to determine the location
                of a device using WiFi signals instead of GPS.
              </p>
              <ul className="popup-list">
                <li>Works well indoors where GPS is less effective</li>
                <li>Requires minimal additional hardware</li>
                <li>Used in indoor navigation and asset tracking</li>
              </ul>
              {autoRedirect && (
                <p className="countdown-text">
                  Closing in <span className="countdown">{countdown}</span>s
                </p>
              )}
            </div>
            <div className="popup-buttons">
              <button
                className="popup-close-btn"
                onClick={() => setShowInfoPopup(false)}
              >
                {autoRedirect ? "Skip Now" : "Close"}
              </button>
              <button
                className="popup-cancel-btn"
                onClick={() => setAutoRedirect(!autoRedirect)}
              >
                {autoRedirect ? "Stay Open" : "Auto Close OFF"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ส่วนแผนที่หลัก */}
      <div id="map-container">
        <div className="container">
          <canvas id="myCanvas" width="1400px" height="700px"></canvas>

          {/* ส่วนเลือกแผนที่ */}
          <div id="map-controls" style={{ marginBottom: "20px" }}>
            <div className="controls-group">
              <label htmlFor="map-select" style={{ marginRight: "10px" }}>
                เลือกแผนที่:
              </label>
              <select id="map-select" style={{ padding: "5px" }}>
                <option value="">-- กรุณาเลือกแผนที่ --</option>
              </select>
              <button
                onClick={fetchPointsFromFirestore}
                style={{
                  marginLeft: "10px",
                  padding: "5px 10px",
                  backgroundColor: "#4CAF50",
                  color: "white",
                  border: "none",
                  borderRadius: "4px",
                  cursor: "pointer",
                }}
              >
                Show Points
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ส่วนตัวอย่างแผนที่ */}
      <div
        id="map-sample-container"
        className="container"
        style={{ marginTop: "30px" }}
      >
        <h3 style={{ marginBottom: "15px" }}>ตัวอย่างแผนที่</h3>
        <div className="map-samples" style={{ display: "flex", gap: "20px" }}>
          <Image
            src="/map/map1.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/map1.png"
            width={400}
            height={200}
            style={{
              cursor: "pointer",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
          <Image
            src="/map/map2.png"
            alt="Sample Map 2"
            className="map-sample"
            data-map-src="/map/map2.png"
            width={400}
            height={200}
            style={{
              cursor: "pointer",
              border: "1px solid #ddd",
              borderRadius: "5px",
            }}
          />
        </div>
      </div>

      {/* Tooltip สำหรับแผนที่ */}
      <div
        id="tooltip"
        style={{
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          padding: "0.8rem",
          borderRadius: "6px",
          fontSize: "0.9rem",
          position: "absolute",
          display: "none",
          backgroundColor: "white",
          border: "1px solid black",
          pointerEvents: "none",
        }}
      ></div>

      <Script
        type="module"
        src="/script/module.js"
        strategy="beforeInteractive"
      />

      {/* สไตล์เพิ่มเติมสำหรับ Popup */}
      <style jsx>{`
        .popup-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
        }
        .popup {
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 600px;
          width: 90%;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .popup-title {
          font-size: 1.5rem;
          margin-bottom: 1rem;
          color: #333;
        }
        .popup-content {
          margin-bottom: 1.5rem;
          line-height: 1.6;
        }
        .popup-list {
          margin: 0.5rem 0;
          padding-left: 1.5rem;
        }
        .popup-list li {
          margin-bottom: 0.5rem;
        }
        .countdown-text {
          margin-top: 1rem;
          font-weight: bold;
        }
        .countdown {
          color: #0066cc;
          font-weight: bold;
        }
        .popup-buttons {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
        }
        .popup-close-btn {
          padding: 0.5rem 1rem;
          background: #0066cc;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        .popup-cancel-btn {
          padding: 0.5rem 1rem;
          background: #f0f0f0;
          color: #333;
          border: 1px solid #ccc;
          border-radius: 4px;
          cursor: pointer;
        }
      `}</style>
    </>
  );
}
