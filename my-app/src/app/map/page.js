"use client";
import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "../styles/map.css";
import Script from "next/script";
// import("sweetalert2")

export default function Map() {
  useEffect(() => {
    // ฟังก์ชันสำหรับโหลดฟอนต์จาก localStorage
    const loadFontSetting = () => {
      const savedFont = localStorage.getItem("selectedFont");
      if (savedFont) {
        document.body.style.fontFamily = savedFont;
      }
    };
    loadFontSetting();
  }, []);

  return (
    <>
      <nav>
        <div className="container">
          <div className="nav-content">
            <h1>🗺️ Campus Maps</h1>
            <div className="nav-links">
              <Link href="/">Home</Link>
              <Link href="/map" className="active">
                Maps
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div id="map-container">
        <div className="container">
          <canvas id="myCanvas" width="1400px" height="700px"></canvas>
          <div id="map-controls">
            <div className="controls-group">
              <label htmlFor="mapName">Map Name:</label>
              <select id="map-select">
                <option value="">Select Map</option>
              </select>
              <input type="text" id="mapName" placeholder="Enter map name" />
              <button id="updateMapName">Update Map Name</button>
              <button id="delete-map">🗑️ Delete Map</button>

              <div className="upload-btn-wrapper">
                <button className="btn-upload">
                  📤 Upload Map
                  <input type="file" id="map-upload" accept="image/*" />
                </button>
              </div>

              <input
                type="text"
                id="pointName"
                placeholder="Enter point name"
              />
              <button id="resetPoints">🔄 Reset</button>
            </div>

            <div className="controls-group">
              <select id="pointSelect"></select>
              <button id="DeletePoint">🗑️ Delete Point</button>
              <select id="point1Select"></select>
              <select id="point2Select"></select>
              <button id="ShowDistance">📏 Show Distance</button>
              <select id="editPointSelect"></select>
              <input
                type="text"
                id="newPointName"
                placeholder="Enter new point name"
              />
              <button id="editPoint">✏️ Update Point Name</button>
            </div>
          </div>

          <div id="distanceDisplay"></div>
        </div>
      </div>

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

      <div id="map-sample-container" className="container">
        <h3>Example Maps</h3>
        <div className="map-samples">
          <Image
            src="/map/map4.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/map4.png"
            width={200}
            height={400}
          />
        </div>
      </div>
      <Script src="/modules/module-map.js" strategy="afterInteractive" />
    </>
  );
}
