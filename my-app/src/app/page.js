"use client";
import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";
import "@styles/map.css";
import "@styles/homepage.css";
import {
  CanvasUtils,
  MapManager,
  PointManager,
  TrilaterationUtils,
} from "@utils/index";
import { collection, getDocs } from "firebase/firestore";
import { dbfs, dbRef } from "@utils/firebaseConfig";

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [maps, setMaps] = useState([]); // เก็บข้อมูลแผนที่จาก Firestore
  const [loadedMaps, setLoadedMaps] = useState([]); // เก็บเฉพาะแผนที่ที่โหลดสำเร็จ
  const [selectedPoints, setSelectedPoints] = useState([]); // เก็บจุดของแผนที่ที่เลือก
  const [showCircles, setShowCircles] = useState(true); // ควบคุมการแสดงวงกลม

  // อ้างอิง canvas
  const canvasRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);
  const [pointManager, setPointManager] = useState(null);
  const [trilaterationUtils, setTrilaterationUtils] = useState(null);
  const [mapManager] = useState(new MapManager()); // ใช้ MapManager เพื่อจัดการแผนที่

  // ฟังก์ชันเริ่มต้น CanvasUtils, PointManager และ TrilaterationUtils
  const initializeCanvasAndManagers = () => {
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

    // สร้าง CanvasUtils
    const utils = new CanvasUtils(canvas, tooltip);
    utils.showCircles = showCircles;
    utils.initializeCanvas();

    // สร้าง PointManager และ TrilaterationUtils
    const pm = new PointManager(utils);
    const tu = new TrilaterationUtils(utils, pm, mapManager);
    pm.trilaterationUtils = tu;

    setCanvasUtils(utils);
    setPointManager(pm);
    setTrilaterationUtils(tu);
  };

  // ฟังก์ชันตรวจสอบการโหลดรูปภาพ
  const checkImageLoad = (mapSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = mapSrc;
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
    });
  };

  // ฟังก์ชันดึงข้อมูลแผนที่จาก Firestore และตรวจสอบการโหลด
  const fetchMapsFromFirestore = async () => {
    try {
      const mapsRef = collection(dbfs, "maps");
      const querySnapshot = await getDocs(mapsRef);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      // ตรวจสอบการโหลดรูปภาพก่อนเพิ่มลงใน dropdown
      const loadedMapsData = [];
      for (const map of mapsData) {
        try {
          await checkImageLoad(map.mapSrc);
          loadedMapsData.push(map);
          mapManager.maps[map.mapIndex] = {
            src: map.mapSrc,
            name: map.mapName,
          };
        } catch (error) {
          console.error(
            `Failed to load map image for ${map.mapName}:`,
            map.mapSrc
          );
        }
      }

      setMaps(mapsData);
      setLoadedMaps(loadedMapsData);
      mapManager.updateMapSelect();

      console.log("Loaded maps:", loadedMapsData);
    } catch (error) {
      console.error("Error fetching maps from Firestore: ", error);
      setMaps([]);
      setLoadedMaps([]);
    }
  };

  // ฟังก์ชันดึงข้อมูลจุดจาก Firestore และเริ่มการอัปเดตเรียลไทม์
  const fetchPointsFromFirestore = async () => {
    try {
      const currentMapName = document.getElementById("map-select").value;

      if (!currentMapName) {
        console.log("Please select a map first");
        setSelectedPoints([]);
        canvasUtils?.resetCanvas();
        return;
      }

      const selectedMap = maps.find((map) => map.id === currentMapName);
      if (selectedMap) {
        if (selectedMap.points) {
          setSelectedPoints(selectedMap.points);
          console.log("Points for selected map:", selectedMap.points);

          // ใช้พิกัดจาก Firestore โดยไม่ปรับสเกล
          pointManager.stopRealTimeUpdates();
          pointManager.pointsPerMap[selectedMap.mapIndex] =
            selectedMap.points.map((point) => ({
              ...point,
              data: [],
              rssi: "Not available",
              distance: 0,
            }));
          pointManager.points = pointManager.pointsPerMap[selectedMap.mapIndex];

          // เริ่มการอัปเดตเรียลไทม์สำหรับแต่ละจุด
          selectedMap.points.forEach((point) => {
            pointManager.startRealTimeUpdate(point, selectedMap.mapIndex);
          });

          // เรียก trilaterationUtils.startRealTimeUpdate เพื่อให้แน่ใจว่าการอัปเดตเรียลไทม์เริ่มต้น
          trilaterationUtils.mapIndex = selectedMap.mapIndex;
          trilaterationUtils.startRealTimeUpdate();
        } else {
          setSelectedPoints([]);
          pointManager.pointsPerMap[selectedMap.mapIndex] = [];
          pointManager.points = [];
          console.log("No points found for this map");
        }
        loadMapToCanvas(selectedMap.mapSrc, selectedMap.mapIndex);
      } else {
        setSelectedPoints([]);
        pointManager.pointsPerMap[currentMapName] = [];
        pointManager.points = [];
        canvasUtils?.resetCanvas();
        console.log("No map found for this mapName");
      }
    } catch (error) {
      console.error("Error fetching points from Firestore: ", error);
      setSelectedPoints([]);
      canvasUtils?.resetCanvas();
    }
  };

  // ฟังก์ชันโหลดรูปแผนที่ไปยัง canvas และวาดจุด/วงกลม
  const loadMapToCanvas = (mapSrc, selectedIndex) => {
    if (!canvasUtils || !trilaterationUtils) return;

    canvasUtils.img.src = mapSrc;
    canvasUtils.img.onload = () => {
      trilaterationUtils.refreshMap(selectedIndex);
    };
    canvasUtils.img.onerror = () => {
      console.error("Error loading map image:", mapSrc);
      canvasUtils.resetCanvas();
      canvasUtils.alert(
        "Error",
        "Failed to load map image. Please check the mapSrc path.",
        "error"
      );
    };
  };

  // ฟังก์ชันจัดการเมื่อกดที่ตัวอย่างแผนที่
  const handleSampleMapClick = (mapSrc) => {
    const matchedMap = maps.find((map) => map.mapSrc === mapSrc);
    if (matchedMap) {
      document.getElementById("map-select").value = matchedMap.id;
      fetchPointsFromFirestore();
    } else {
      console.log("No matching map found in Firestore for mapSrc:", mapSrc);
      setSelectedPoints([]);
      canvasUtils?.resetCanvas();
      document.getElementById("map-select").value = "";
    }
  };

  // เริ่มต้นเมื่อ component ถูกโหลด
  useEffect(() => {
    initializeCanvasAndManagers();
    fetchMapsFromFirestore();
  }, []);

  // อัปเดต showCircles ใน CanvasUtils
  useEffect(() => {
    if (canvasUtils) {
      canvasUtils.showCircles = showCircles;
      const currentMapName = document.getElementById("map-select").value;
      if (currentMapName) {
        const selectedMap = maps.find((map) => map.id === currentMapName);
        if (selectedMap) {
          trilaterationUtils.refreshMap(selectedMap.mapIndex);
        }
      }
    }
  }, [showCircles, canvasUtils, trilaterationUtils]);

  // จัดการ countdown สำหรับ popup
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
          <canvas
            id="myCanvas"
            ref={canvasRef}
            width="1000px"
            height="400px"
          ></canvas>

          {/* ส่วนเลือกแผนที่และควบคุมวงกลม */}
          <div id="map-controls" style={{ marginBottom: "20px" }}>
            <form action="">
              <input
                type="checkbox"
                id="showCircleCheckbox"
                name="showCircle"
                checked={showCircles}
                onChange={(e) => setShowCircles(!e.target.checked)}
              />
              <label htmlFor="showCircleCheckbox">Hide circle area</label>
              <br />
            </form>
            <div className="controls-group">
              <label htmlFor="map-select" style={{ marginRight: "10px" }}>
                เลือกแผนที่:
              </label>
              <select
                id="map-select"
                style={{ padding: "5px" }}
                onChange={fetchPointsFromFirestore}
              >
                <option value="">-- กรุณาเลือกแผนที่ --</option>
                {loadedMaps.map((map) => (
                  <option key={map.id} value={map.id}>
                    {map.mapName}
                  </option>
                ))}
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

          {/* ส่วนแสดงจุดของแผนที่ที่เลือก */}
          {selectedPoints.length > 0 ? (
            <div
              id="points-display"
              style={{
                marginTop: "20px",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "5px",
                backgroundColor: "#f9f9f9",
              }}
            >
              <h3 style={{ marginBottom: "10px" }}>
                Points for{" "}
                {
                  loadedMaps.find(
                    (map) =>
                      map.id === document.getElementById("map-select").value
                  )?.mapName
                }
              </h3>
              <ul style={{ listStyleType: "none", padding: 0 }}>
                {selectedPoints.map((point, index) => (
                  <li
                    key={index}
                    style={{
                      padding: "5px 0",
                      borderBottom: "1px solid #eee",
                    }}
                  >
                    <strong>Point {index + 1}:</strong> Name: {point.name}, X:{" "}
                    {point.x.toFixed(2)}, Y: {point.y.toFixed(2)}, Color:{" "}
                    {point.color}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div
              style={{
                marginTop: "20px",
                padding: "10px",
                color: "#888",
              }}
            >
              No points available for this map. Please select a map and click
              &quot;Show Points&quot;.
            </div>
          )}
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
          <NextImage
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
            onClick={() => handleSampleMapClick("/map/map1.png")}
          />
          <NextImage
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
            onClick={() => handleSampleMapClick("/map/map2.png")}
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
    </>
  );
}
