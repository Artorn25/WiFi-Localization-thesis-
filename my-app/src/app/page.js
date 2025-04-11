"use client";
import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import "@styles/map.css";
import "@styles/homepage.css";

import { collection, getDocs } from "firebase/firestore";
import { dbfs } from "@utils/firebaseConfig";

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [maps, setMaps] = useState([]); // เก็บข้อมูลแผนที่จาก Firestore
  const [selectedPoints, setSelectedPoints] = useState([]); // เก็บจุดของแผนที่ที่เลือก

  // อ้างอิง canvas
  const canvasRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);

  // ฟังก์ชันเริ่มต้น CanvasUtils (เลียนแบบจาก Map.js)
  const initializeCanvas = () => {
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

    const utils = {
      canvas,
      ctx: canvas.getContext("2d"),
      tooltip,
      img: new window.Image(),
      scaleX: 1,
      scaleY: 1,
      offsetX: 0,
      offsetY: 0,

      initializeCanvas() {
        this.adjustCanvasScale();
      },

      adjustCanvasScale() {
        if (!this.img.src) return;

        const canvasAspect = this.canvas.width / this.canvas.height;
        const imgAspect = this.img.width / this.img.height;

        if (imgAspect > canvasAspect) {
          // รูปกว้างกว่า canvas
          this.scaleX = this.canvas.width / this.img.width;
          this.scaleY = this.scaleX;
          this.offsetX = 0;
          this.offsetY =
            (this.canvas.height - this.img.height * this.scaleY) / 2;
        } else {
          // รูปสูงกว่า canvas
          this.scaleY = this.canvas.height / this.img.height;
          this.scaleX = this.scaleY;
          this.offsetX = (this.canvas.width - this.img.width * this.scaleX) / 2;
          this.offsetY = 0;
        }
      },

      toPixel(x, y) {
        return {
          pixelX: x * this.scaleX + this.canvas.width / 2 + this.offsetX,
          pixelY: -y * this.scaleY + this.canvas.height / 2 + this.offsetY,
        };
      },

      clearCanvas() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      },
    };

    setCanvasUtils(utils);
  };

  // ฟังก์ชันดึงข้อมูลแผนที่จาก Firestore
  const fetchMapsFromFirestore = async () => {
    try {
      const mapsRef = collection(dbfs, "maps");
      const querySnapshot = await getDocs(mapsRef);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id, // mapName เป็น document ID
        ...doc.data(),
      }));
      setMaps(mapsData);
      console.log("Maps data from Firestore:", mapsData);
    } catch (error) {
      console.error("Error fetching maps from Firestore: ", error);
      setMaps([]);
    }
  };

  // ฟังก์ชันดึงข้อมูลจุดจาก Firestore (จาก maps collection)
  const fetchPointsFromFirestore = async () => {
    try {
      const currentMapName = document.getElementById("map-select").value;

      if (!currentMapName) {
        console.log("Please select a map first");
        setSelectedPoints([]);
        canvasUtils?.clearCanvas(); // ล้าง canvas ถ้าไม่มีแผนที่เลือก
        return;
      }

      // หาแผนที่ที่เลือกจาก state maps
      const selectedMap = maps.find((map) => map.id === currentMapName);
      if (selectedMap) {
        // ตั้งค่าจุด
        if (selectedMap.points) {
          setSelectedPoints(selectedMap.points);
          console.log("Points for selected map:", selectedMap.points);
        } else {
          setSelectedPoints([]);
          console.log("No points found for this map");
        }
        // โหลดรูปแผนที่ไปยัง canvas และวาดจุดหลังจากโหลดเสร็จ
        loadMapToCanvas(selectedMap.mapSrc);
      } else {
        setSelectedPoints([]);
        canvasUtils?.clearCanvas();
        console.log("No map found for this mapName");
      }
    } catch (error) {
      console.error("Error fetching points from Firestore: ", error);
      setSelectedPoints([]);
      canvasUtils?.clearCanvas();
    }
  };

  // ฟังก์ชันโหลดรูปแผนที่ไปยัง canvas และวาดจุดหลังจากโหลดเสร็จ
  const loadMapToCanvas = (mapSrc) => {
    if (!canvasUtils) return;

    canvasUtils.img.src = mapSrc;
    canvasUtils.img.onload = () => {
      canvasUtils.adjustCanvasScale();
      canvasUtils.clearCanvas();
      canvasUtils.ctx.drawImage(
        canvasUtils.img,
        canvasUtils.offsetX,
        canvasUtils.offsetY,
        canvasUtils.img.width * canvasUtils.scaleX,
        canvasUtils.img.height * canvasUtils.scaleY
      );
      // วาดจุดหลังจากโหลดรูปเสร็จ
      drawPointsOnCanvas();
    };
    canvasUtils.img.onerror = () => {
      console.error("Error loading map image:", mapSrc);
      canvasUtils.clearCanvas();
    };
  };

  // ฟังก์ชันวาดจุดบน canvas
  const drawPointsOnCanvas = () => {
    if (!canvasUtils) return;

    selectedPoints.forEach((point) => {
      // แปลงพิกัดจาก Cartesian เป็นพิกัดบน canvas
      const { pixelX, pixelY } = canvasUtils.toPixel(point.x, point.y);

      // ตรวจสอบว่าพิกัดอยู่ในขอบเขตของ canvas หรือไม่
      if (
        pixelX < 0 ||
        pixelX > canvasUtils.canvas.width ||
        pixelY < 0 ||
        pixelY > canvasUtils.canvas.height
      ) {
        console.warn(
          `Point ${point.name} is outside canvas bounds: (${pixelX}, ${pixelY})`
        );
        return;
      }

      // วาดจุด
      canvasUtils.ctx.beginPath();
      canvasUtils.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
      canvasUtils.ctx.fillStyle = point.color;
      canvasUtils.ctx.fill();
      canvasUtils.ctx.strokeStyle = "black";
      canvasUtils.ctx.stroke();

      // วาดชื่อจุด
      canvasUtils.ctx.font = "12px Arial";
      canvasUtils.ctx.fillStyle = "black";
      canvasUtils.ctx.fillText(point.name, pixelX + 15, pixelY);
    });
  };

  // ฟังก์ชันจัดการเมื่อกดที่ตัวอย่างแผนที่
  const handleSampleMapClick = (mapSrc) => {
    // หาแผนที่ใน Firestore ที่มี mapSrc ตรงกับตัวอย่าง
    const matchedMap = maps.find((map) => map.mapSrc === mapSrc);
    if (matchedMap) {
      // ตั้งค่า <select> ให้เลือกแผนที่นั้น
      document.getElementById("map-select").value = matchedMap.id;
      // ดึงข้อมูลจุดของแผนที่นั้น
      fetchPointsFromFirestore();
    } else {
      console.log("No matching map found in Firestore for mapSrc:", mapSrc);
      setSelectedPoints([]);
      canvasUtils?.clearCanvas();
      document.getElementById("map-select").value = ""; // รีเซ็ต <select> ถ้าไม่พบ
    }
  };

  // เริ่มต้น canvas เมื่อ component ถูกโหลด
  useEffect(() => {
    initializeCanvas();
    fetchMapsFromFirestore();
  }, []);

  // ลบ useEffect ที่วาดจุดเมื่อ selectedPoints เปลี่ยน
  // เพราะเราจะวาดจุดใน loadMapToCanvas หลังจากโหลดรูปเสร็จ

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

          {/* ส่วนเลือกแผนที่ */}
          <div id="map-controls" style={{ marginBottom: "20px" }}>
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
                {maps.map((map) => (
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
                  maps.find(
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
            onClick={() => handleSampleMapClick("/map/map1.png")}
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
