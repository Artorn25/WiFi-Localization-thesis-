"use client";
import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";
import "@styles/usermap.css";
import "@styles/homepage.css";
import {
  CanvasUtils,
  MapManager,
  PointManager,
  TrilaterationUtils,
} from "@utils/user/index";
import { collection, getDocs } from "firebase/firestore";
import { dbfs, dbRef } from "@utils/user/firebaseConfig";
import { onValue, off } from "firebase/database";
import GenText from "@components/Gentext";
import Swal from "sweetalert2/dist/sweetalert2.js";
import Loading from "@components/Loading";

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [maps, setMaps] = useState([]);
  const [loadedMaps, setLoadedMaps] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showCircles, setShowCircles] = useState(true);
  const [showPoints, setShowPoints] = useState(false);
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [sampleMaps, setSampleMaps] = useState([]);
  const [isAppLoading, setIsAppLoading] = useState(true);

  const canvasRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);
  const [pointManager, setPointManager] = useState(null);
  const [trilaterationUtils, setTrilaterationUtils] = useState(null);
  const [mapManager] = useState(new MapManager());
  const listenersRef = useRef([]);

  // ดึงข้อมูลตัวอย่างแผนที่จาก Firestore
  const fetchSampleMaps = async () => {
    try {
      const mapsRef = collection(dbfs, "maps");
      const querySnapshot = await getDocs(mapsRef);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      const samples = mapsData.filter((map) => map.isSample || true);
      setSampleMaps(samples);
      console.log("Sample maps loaded:", samples);
    } catch (error) {
      console.error("Error fetching sample maps: ", error);
      setSampleMaps([]);
      Swal.fire({
        title: "Error",
        text: "Failed to load sample maps.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // ตรวจสอบการโหลดรูปภาพ
  const checkImageLoad = (mapSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = mapSrc;
      img.onload = () => {
        console.log("Image loaded successfully:", mapSrc);
        resolve(true);
      };
      img.onerror = () => {
        console.error("Failed to load image:", mapSrc);
        reject(false);
      };
    });
  };

  // ดึงข้อมูลแผนที่จาก Firestore
  const fetchMapsFromFirestore = async () => {
    setIsLoadingMaps(true);
    setLoadError(null);
    try {
      const mapsRef = collection(dbfs, "maps");
      const querySnapshot = await getDocs(mapsRef);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (mapsData.length === 0) {
        throw new Error("No maps found in Firestore.");
      }

      const loadedMapsData = [];
      mapManager.maps = [];
      for (const map of mapsData) {
        try {
          await checkImageLoad(map.mapSrc);
          loadedMapsData.push(map);
          mapManager.maps.push({
            id: map.id,
            src: map.mapSrc,
            name: map.mapName,
            index: loadedMapsData.length - 1,
          });
        } catch (error) {
          console.error(
            `Failed to load map image for ${map.mapName}:`,
            map.mapSrc
          );
        }
      }

      setMaps(mapsData);
      setLoadedMaps(loadedMapsData);
      setIsLoadingMaps(false);
      console.log("Loaded maps:", loadedMapsData);

      if (loadedMapsData.length > 0) {
        Swal.fire({
          title: "Maps Loaded",
          text: `${loadedMapsData.length} map(s) have been loaded.`,
          icon: "success",
          timer: 1500,
          showConfirmButton: false,
        });
      } else {
        throw new Error("No valid map images could be loaded.");
      }
    } catch (error) {
      console.error("Error fetching maps from Firestore: ", error);
      setMaps([]);
      setLoadedMaps([]);
      setLoadError("Failed to load maps. Please try again later.");
      setIsLoadingMaps(false);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to load maps from Firestore.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // โหลดแผนที่ลงใน Canvas
  const loadMapToCanvas = (mapSrc, selectedIndex) => {
    if (!canvasUtils) {
      console.error("CanvasUtils not initialized");
      return;
    }

    console.log("Attempting to load map with src:", mapSrc);
    canvasUtils.resetCanvas(); // ล้าง canvas ก่อนวาด
    canvasUtils.drawImageImmediately(mapSrc);
  };

  // จัดการการเลือกแผนที่ (โหลดเฉพาะภาพแผนที่)
  const fetchPointsAndListenRealtime = async () => {
    try {
      const mapSelect = document.getElementById("map-select");
      if (!mapSelect) {
        console.log("Map select element not found");
        return;
      }

      const currentMapId = mapSelect.value;
      if (!currentMapId) {
        console.log("Please select a map first");
        canvasUtils?.resetCanvas();
        return;
      }

      const selectedMap = maps.find((map) => map.id === currentMapId);
      if (!selectedMap) {
        console.log("No map found for this mapId:", currentMapId);
        canvasUtils?.resetCanvas();
        return;
      }

      if (trilaterationUtils) {
        trilaterationUtils.startAutoRefresh();
      }

      // แสดงการแจ้งเตือนเมื่อเลือกแผนที่
      Swal.fire({
        title: "Map Selected",
        text: `Map ${selectedMap.mapName} has been selected.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });

      // โหลดเฉพาะภาพแผนที่ลง canvas
      loadMapToCanvas(
        selectedMap.mapSrc,
        mapManager.maps.findIndex((map) => map.id === selectedMap.id)
      );
    } catch (error) {
      console.error("Error loading map:", error);
      canvasUtils?.resetCanvas();
    }
  };

  const handleShowPoints = () => {
    setShowPoints((prev) => !prev); // Toggle state

    if (!showPoints) {
      // ถ้ากำลังจะแสดงจุด
      const mapSelect = document.getElementById("map-select");
      if (!mapSelect || !mapSelect.value) {
        Swal.fire({
          title: "No Map Selected",
          text: "Please select a map first.",
          icon: "warning",
          timer: 1500,
          showConfirmButton: false,
        });
        return;
      }

      fetchPointsAndListenRealtime();
    } else {
      // หยุดการอัปเดตเมื่อปิดโหมดแสดงจุด
      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, "value", listener);
      });
      listenersRef.current = [];
    }
  };

  // ฟังก์ชันสำหรับปุ่ม Delete Map
  const handleDeleteMap = () => {
    const mapSelect = document.getElementById("map-select");
    if (!mapSelect || !mapSelect.value) {
      canvasUtils.alert("Warning", "Please select a map to delete.", "warning");
      return;
    }

    const currentMapId = mapSelect.value;
    const selectedMap = maps.find((map) => map.id === currentMapId);
    if (!selectedMap) {
      canvasUtils.alert("Error", "Selected map not found.", "error");
      return;
    }

    const selectedIndex = mapManager.maps.findIndex(
      (map) => map.id === selectedMap.id
    );

    // ลบแผนที่จาก MapManager
    mapManager.deleteMap(selectedIndex, canvasUtils);

    // อัปเดต state
    const updatedMaps = maps.filter((map) => map.id !== currentMapId);
    const updatedLoadedMaps = loadedMaps.filter(
      (map) => map.id !== currentMapId
    );
    setMaps(updatedMaps);
    setLoadedMaps(updatedLoadedMaps);
    setSelectedPoints([]);
    setShowPoints(false);

    // หยุดการฟังข้อมูลเรียลไทม์
    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, "value", listener);
    });
    listenersRef.current = [];

    // อัปเดต UI
    if (updatedLoadedMaps.length > 0) {
      const nextMap = updatedLoadedMaps[0];
      mapSelect.value = nextMap.id;
      loadMapToCanvas(
        nextMap.mapSrc,
        mapManager.maps.findIndex((map) => map.id === nextMap.id)
      );
    } else {
      mapSelect.value = "";
      canvasUtils.resetCanvas();
    }
  };

  // จัดการการคลิกตัวอย่างแผนที่
  const handleSampleMapClick = async (mapSrc) => {
    const mapSelect = document.getElementById("map-select");
    if (!mapSelect) return;

    // Normalize mapSrc เพื่อให้ตรงกัน
    const normalizeSrc = (src) => {
      return src.replace(/^\/+/, "").replace(/\/+/g, "/");
    };

    const normalizedMapSrc = normalizeSrc(mapSrc);
    console.log("Sample map clicked, normalized src:", normalizedMapSrc);

    let matchedMap = maps.find(
      (map) => normalizeSrc(map.mapSrc) === normalizedMapSrc
    );
    if (!matchedMap) {
      console.log("Map not found, fetching from Firestore...");
      await fetchMapsFromFirestore();
      matchedMap = maps.find(
        (map) => normalizeSrc(map.mapSrc) === normalizedMapSrc
      );
    }

    if (matchedMap) {
      console.log("Matched map found:", matchedMap);
      mapSelect.value = matchedMap.id;
      setShowPoints(false);
      fetchPointsAndListenRealtime();
    } else {
      console.log("No matching map found in Firestore for mapSrc:", mapSrc);
      setSelectedPoints([]);
      setShowPoints(false);
      canvasUtils?.resetCanvas();
      mapSelect.value = "";
      Swal.fire({
        title: "Error",
        text: "Selected map not found in Firestore. Please check the map source.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
    }
  };

  // เริ่มต้น Canvas และ Managers
  const initializeCanvasAndManagers = () => {
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

    if (!canvas || !tooltip) {
      console.error("Canvas or tooltip not found");
      return;
    }

    const utils = new CanvasUtils(canvas, tooltip);
    utils.showCircles = showCircles;
    utils.initializeCanvas();

    const pm = new PointManager(utils);
    const tu = new TrilaterationUtils(utils, pm, mapManager);
    pm.trilaterationUtils = tu;

    setCanvasUtils(utils);
    setPointManager(pm);
    setTrilaterationUtils(tu);
  };

  // เรียกเมื่อคอมโพเนนต์โหลด
  useEffect(() => {
    fetchSampleMaps();
    const timer = setTimeout(() => {
      setIsAppLoading(false);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  // เริ่มต้น canvas เมื่อหน้าโหลดหายไป
  useEffect(() => {
    if (!isAppLoading) {
      initializeCanvasAndManagers();
    }
  }, [isAppLoading]);

  // อัปเดตการแสดงวงกลมและจุด
  useEffect(() => {
    if (canvasUtils) {
      canvasUtils.showCircles = showCircles;
      if (showPoints && trilaterationUtils) {
        const mapSelect = document.getElementById("map-select");
        if (mapSelect && mapSelect.value) {
          const selectedMap = maps.find((map) => map.id === mapSelect.value);
          if (selectedMap) {
            trilaterationUtils.refreshMap(selectedMap.mapIndex, showPoints);
          }
        }
      }
    }
  }, [showCircles, showPoints, canvasUtils, trilaterationUtils, maps]);

  // อัปเดต UI เมื่อ loadedMaps เปลี่ยนแปลง
  useEffect(() => {
    const mapSelect = document.getElementById("map-select");
    if (mapSelect && loadedMaps.length > 0) {
      if (!mapSelect.value || !maps.find((map) => map.id === mapSelect.value)) {
        mapSelect.value = loadedMaps[0].id;
        const selectedMap = maps.find((map) => map.id === loadedMaps[0].id);
        if (selectedMap) {
          loadMapToCanvas(
            selectedMap.mapSrc,
            mapManager.maps.findIndex((map) => map.id === selectedMap.id)
          );
        }
      }
    }
  }, [loadedMaps]);

  // จัดการป๊อปอัป
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

  // ทำความสะอาด listeners เมื่อคอมโพเนนต์ unmount
  useEffect(() => {
    return () => {
      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, "value", listener);
      });
      listenersRef.current = [];
    };
  }, []);

  useEffect(() => {
    if (!showPoints || !trilaterationUtils || !pointManager) return;

    const mapSelect = document.getElementById("map-select");
    if (!mapSelect?.value) return;

    const currentMapId = mapSelect.value;
    const selectedMap = maps.find((map) => map.id === currentMapId);
    if (!selectedMap) return;

    // ตั้งค่า interval สำหรับ refresh อัตโนมัติ
    const refreshInterval = setInterval(() => {
      trilaterationUtils.refreshMap(selectedMap.mapIndex, true);
    }, 1000); // อัปเดตทุก 1 วินาที

    return () => clearInterval(refreshInterval);
  }, [showPoints, maps, trilaterationUtils, pointManager]);

  useEffect(() => {
    return () => {
      if (trilaterationUtils) {
        trilaterationUtils.stopAutoRefresh();
      }
    };
  }, [trilaterationUtils]);

  // แสดงหน้าโหลดเมื่อ isAppLoading เป็น true
  if (isAppLoading) {
    return <Loading />;
  }

  return (
    <>
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

      <div id="map-container">
        <GenText />
        <div className="container">
          <div className="canvas-wrapper">
            <canvas
              id="myCanvas"
              ref={canvasRef}
              width="1000px"
              height="400px"
            ></canvas>
          </div>

          <div className="controls-container">
            <div className="control-item">
              <label className="checkbox-control">
                <input
                  type="checkbox"
                  id="showCircleCheckbox"
                  checked={showCircles}
                  onChange={(e) => setShowCircles(!e.target.checked)}
                />
                <span className="checkmark"></span>
                <span className="checkbox-label">Hide circle area</span>
              </label>
            </div>

            <div className="control-item">
              {isLoadingMaps ? (
                <div className="loading-maps">
                  <div className="loading-spinner"></div>
                  <span>Loading maps...</span>
                </div>
              ) : loadError ? (
                <div className="error-message">
                  <span className="error-icon">⚠️</span>
                  <span>{loadError}</span>
                </div>
              ) : (
                <div className="map-selector">
                  <label htmlFor="map-select" className="selector-label">
                    Select Map:
                  </label>
                  <div className="select-btn-group">
                    <select
                      id="map-select"
                      className="map-select"
                      onChange={fetchPointsAndListenRealtime}
                    >
                      <option value="">-- Please Select Map --</option>
                      {loadedMaps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.mapName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="action-btn show-points-btn"
                      onClick={handleShowPoints}
                      disabled={!document.getElementById("map-select")?.value}
                    >
                      Show Points
                    </button>
                    <button
                      className="action-btn delete-map-btn"
                      onClick={handleDeleteMap}
                      disabled={!document.getElementById("map-select")?.value}
                    >
                      Delete Map
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="map-sample-container">
            <h3 className="sample-maps-title">Example Maps</h3>
            {sampleMaps.length > 0 ? (
              <div className="map-samples-grid">
                {sampleMaps.map((map) => (
                  <div
                    key={map.id}
                    className="map-sample-item"
                    onClick={() => handleSampleMapClick(map.mapSrc)}
                  >
                    <div className="map-image-wrapper">
                      <NextImage
                        src={map.mapSrc}
                        alt={map.mapName}
                        width={400}
                        height={200}
                        className="map-sample-img"
                      />
                    </div>
                    <div className="map-sample-overlay">
                      <span className="map-name">{map.mapName}</span>
                      <span className="click-hint">Click to select</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-maps-message">
                No sample maps available. Please upload maps in the admin panel.
              </div>
            )}
          </div>
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
    </>
  );
}
