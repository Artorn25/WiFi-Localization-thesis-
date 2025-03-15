"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Script from "next/script";
import "@styles/map.css";

export default function Map() {
  return (
    <>
      <div id="map-container">
        <div className="container">
          <canvas id="myCanvas" width="1400px" height="700px"></canvas>
          <div id="map-controls">
            <form action="">
              <input
                type="checkbox"
                id="showCircleCheckbox"
                name="showCircle"
                value="show"
              />
              <label htmlFor="showCircleCheckbox">Hide circle area</label>
              <br />
            </form>
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
            src="/map/map1.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/map1.png"
            width={400}
            height={200}
          />
          <Image
            src="/map/map2.png"
            alt="Sample Map 2"
            className="map-sample"
            data-map-src="/map/map2.png"
            width={400}
            height={200}
          />
        </div>
      </div>
      <Script
        type="module"
        src="/script/module.js"
        strategy="afterInteractive"
      />
    </>
  );
}
