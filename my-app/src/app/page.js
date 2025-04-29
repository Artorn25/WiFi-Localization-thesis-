"use client";
import { useEffect, useState, useRef } from "react";
import NextImage from "next/image";
import "@styles/homepage.css";
import {
  CanvasUtils,
  MapManager,
  PointManager,
  TrilaterationUtils,
} from "@utils/user/index";
import { collection, getDocs, query, where } from "firebase/firestore";
import { dbfs, dbRef } from "@utils/user/firebaseConfig";
import { onValue, off } from "firebase/database";
import GenText from "@components/Gentext";
import Swal from "sweetalert2/dist/sweetalert2.js";

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [maps, setMaps] = useState([]);
  const [loadedMaps, setLoadedMaps] = useState([]);
  const [allLoadedMaps, setAllLoadedMaps] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showCircles, setShowCircles] = useState(true);
  const [showPoints, setShowPoints] = useState(false);
  const [isLoadingMaps, setIsLoadingMaps] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [sampleMaps, setSampleMaps] = useState([]);
  const [selectedMapId, setSelectedMapId] = useState("");

  const canvasRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);
  const [pointManager, setPointManager] = useState(null);
  const [trilaterationUtils, setTrilaterationUtils] = useState(null);
  const [mapManager] = useState(new MapManager());
  const listenersRef = useRef([]);

  // Normalize mapSrc เพื่อป้องกันปัญหาการเปรียบเทียบ
  const normalizeSrc = (src) => {
    return src.trim().replace(/\/+/g, "/").toLowerCase();
  };

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

  // ดึงข้อมูลแผนที่จาก Firestore โดยใช้ mapId
  const fetchMapsFromFirestore = async (mapId) => {
    setIsLoadingMaps(true);
    setLoadError(null);

    // ตรวจสอบว่า mapId นี้มีอยู่ใน allLoadedMaps แล้วหรือไม่
    const existingMap = allLoadedMaps.find((map) => map.id === mapId);
    if (existingMap) {
      setIsLoadingMaps(false);
      setSelectedMapId(existingMap.id);
      fetchPointsAndListenRealtime(existingMap.id);
      Swal.fire({
        title: "Map Already Loaded",
        text: `Map ${existingMap.mapName} is already loaded.`,
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    try {
      const mapsRef = collection(dbfs, "maps");
      // ดึงเฉพาะ map ที่มี id ตรงกับ mapId
      const q = query(mapsRef, where("__name__", "==", mapId));
      const querySnapshot = await getDocs(q);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      if (mapsData.length === 0) {
        throw new Error("No map found in Firestore for the selected mapId.");
      }

      const loadedMapsData = [];
      for (const map of mapsData) {
        try {
          await checkImageLoad(map.mapSrc);
          loadedMapsData.push(map);
          mapManager.maps.push({
            id: map.id,
            src: map.mapSrc,
            name: map.mapName,
            index: mapManager.maps.length,
          });
        } catch (error) {
          console.error(
            `Failed to load map image for ${map.mapName}:`,
            map.mapSrc
          );
        }
      }

      // อัปเดต state
      setMaps(loadedMapsData);
      setLoadedMaps(loadedMapsData);

      // เพิ่มแผนที่ใหม่ลงใน allLoadedMaps โดยไม่ซ้ำ (ใช้ id ในการตรวจสอบ)
      setAllLoadedMaps((prev) => {
        const existingMapIds = new Set(prev.map((map) => map.id));
        const newMaps = loadedMapsData.filter(
          (map) => !existingMapIds.has(map.id)
        );
        return [...prev, ...newMaps];
      });

      mapManager.loadMaps(loadedMapsData);
      setIsLoadingMaps(false);
      console.log("Loaded maps:", loadedMapsData);

      if (loadedMapsData.length > 0) {
        setSelectedMapId(loadedMapsData[0].id);
        Swal.fire({
          title: "Map Loaded",
          text: `Map ${loadedMapsData[0].mapName} has been loaded.`,
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
      setLoadError("Failed to load map. Please try again later.");
      setIsLoadingMaps(false);
      Swal.fire({
        title: "Error",
        text: error.message || "Failed to load map from Firestore.",
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
    canvasUtils.resetCanvas();
    canvasUtils.drawImageImmediately(mapSrc);
  };

  // จัดการการเลือกแผนที่
  const fetchPointsAndListenRealtime = async (newMapId) => {
    try {
      if (!newMapId) {
        console.log("Please select a map first");
        canvasUtils?.resetCanvas();
        return;
      }

      const selectedMap = allLoadedMaps.find((map) => map.id === newMapId);
      if (!selectedMap) {
        console.log("No map found for this mapId:", newMapId);
        canvasUtils?.resetCanvas();
        return;
      }

      console.log("Selected Map ID:", newMapId, "Selected Map:", selectedMap);
      // อัปเดต state maps และ loadedMaps
      setMaps([selectedMap]);
      setLoadedMaps([selectedMap]);

      // โหลดภาพแผนที่ลง canvas
      loadMapToCanvas(
        selectedMap.mapSrc,
        allLoadedMaps.findIndex((map) => map.id === selectedMap.id)
      );

      // แสดงการแจ้งเตือนเมื่อเลือกแผนที่ (เรียกหลังจากอัปเดต state)
      Swal.fire({
        title: "Map Selected",
        text: `Map ${selectedMap.mapName} has been selected.`,
        icon: "success",
        timer: 1500,
        showConfirmButton: false,
      });
    } catch (error) {
      console.error("Error loading map:", error);
      canvasUtils?.resetCanvas();
    }
  };

  // จัดการการแสดงจุดและวงกลมเมื่อกด "Show Points"
  const handleShowPoints = () => {
    setShowPoints(true);
    if (!selectedMapId) {
      Swal.fire({
        title: "No Map Selected",
        text: "Please select a map first.",
        icon: "warning",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
    if (!selectedMap) {
      console.log("No map found for this mapId");
      canvasUtils?.resetCanvas();
      return;
    }

    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, "value", listener);
    });
    listenersRef.current = [];

    try {
      const initialPoints = selectedMap.points?.length
        ? selectedMap.points.map((point) => ({
            ...point,
            data: [],
          }))
        : [];

      pointManager.stopRealTimeUpdates();
      pointManager.pointsPerMap[selectedMap.mapIndex] = initialPoints;
      pointManager.points = initialPoints;
      setSelectedPoints(initialPoints);

      const dataRef = dbRef;
      const listener = onValue(
        dataRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const nodes = snapshot.val();
            console.log("Realtime snapshot:", nodes);

            selectedMap.points?.forEach((point) => {
              const pointName = point.name;
              const allData = [];

              Object.keys(nodes).forEach((nodeKey) => {
                const nodeData = nodes[nodeKey];
                Object.keys(nodeData).forEach((routerKey) => {
                  if (routerKey.startsWith("Router-")) {
                    const routerData = nodeData[routerKey];
                    if (routerData.ssid === pointName) {
                      allData.push({
                        rssi: routerData.rssi,
                        distance: routerData.distance,
                        mac: nodeData.Mac,
                      });
                    }
                  }
                });
              });

              console.log(`Real-time data for SSID ${pointName}:`, allData);

              const targetPoint = pointManager.pointsPerMap[
                selectedMap.mapIndex
              ].find((p) => p.name === pointName);

              if (targetPoint) {
                targetPoint.data = allData;
              }
            });

            setSelectedPoints([
              ...pointManager.pointsPerMap[selectedMap.mapIndex],
            ]);

            if (trilaterationUtils) {
              trilaterationUtils.refreshMap(selectedMap.mapIndex, true);
            }
          } else {
            console.log("No data found in Firebase");
            selectedMap.points?.forEach((point) => {
              const targetPoint = pointManager.pointsPerMap[
                selectedMap.mapIndex
              ].find((p) => p.name === point.name);
              if (targetPoint) {
                targetPoint.data = [];
              }
            });
            setSelectedPoints([
              ...pointManager.pointsPerMap[selectedMap.mapIndex],
            ]);
            if (trilaterationUtils)
              trilaterationUtils.refreshMap(selectedMap.mapIndex, true);
          }
        },
        (error) => {
          console.error("Error listening to Firebase:", error);
          canvasUtils.alert(
            "Error",
            "Failed to fetch real-time data from Firebase.",
            "error"
          );
        }
      );

      listenersRef.current.push({ ref: dataRef, listener });

      if (trilaterationUtils) {
        trilaterationUtils.refreshMap(selectedMap.mapIndex, true);
      }
    } catch (error) {
      console.error("Error setting up points and real-time listener:", error);
      setSelectedPoints([]);
      setShowPoints(false);
      canvasUtils?.resetCanvas();
    }
  };

  // ฟังก์ชันสำหรับปุ่ม Delete Map
  const handleDeleteMap = async () => {
    if (!selectedMapId) {
      canvasUtils.alert("Warning", "Please select a map to delete.", "warning");
      return;
    }

    const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
    if (!selectedMap) {
      canvasUtils.alert("Error", "Selected map not found.", "error");
      return;
    }

    const confirmation = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to remove ${selectedMap.mapName} from the selector? This will not affect Firestore data.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "No, keep it",
    });

    if (!confirmation.isConfirmed) {
      return;
    }

    const selectedIndex = mapManager.maps.findIndex(
      (map) => map.id === selectedMap.id
    );

    mapManager.deleteMap(selectedIndex, canvasUtils);

    const updatedAllLoadedMaps = allLoadedMaps.filter(
      (map) => map.id !== selectedMapId
    );
    setAllLoadedMaps(updatedAllLoadedMaps);
    setMaps([]);
    setLoadedMaps([]);
    setSelectedPoints([]);
    setShowPoints(false);
    setSelectedMapId("");

    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, "value", listener);
    });
    listenersRef.current = [];

    if (updatedAllLoadedMaps.length > 0) {
      const nextMap = updatedAllLoadedMaps[0];
      setSelectedMapId(nextMap.id);
      setMaps([nextMap]);
      setLoadedMaps([nextMap]);
      loadMapToCanvas(
        nextMap.mapSrc,
        updatedAllLoadedMaps.findIndex((map) => map.id === nextMap.id)
      );
    } else {
      canvasUtils.resetCanvas();
    }

    Swal.fire({
      title: "Deleted",
      text: `${selectedMap.mapName} has been removed from the selector.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  // จัดการการคลิกตัวอย่างแผนที่
  const handleSampleMapClick = async (mapId) => {
    console.log("Sample map clicked, mapId:", mapId);

    // ตรวจสอบว่า mapId นี้มีอยู่ใน allLoadedMaps หรือไม่
    const matchedMapInAll = allLoadedMaps.find((map) => map.id === mapId);

    if (matchedMapInAll) {
      console.log("Map already loaded:", matchedMapInAll);
      setSelectedMapId(matchedMapInAll.id);
      fetchPointsAndListenRealtime(matchedMapInAll.id);
      Swal.fire({
        title: "Map Selected",
        text: `Map ${matchedMapInAll.mapName} is already loaded and selected.`,
        icon: "info",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    // ถ้าไม่มีใน allLoadedMaps ให้ดึงจาก Firestore โดยใช้ mapId
    await fetchMapsFromFirestore(mapId);
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
    initializeCanvasAndManagers();
  }, []);

  // อัปเดตการแสดงวงกลมและจุดเมื่อ showCircles หรือ showPoints เปลี่ยน
  useEffect(() => {
    if (canvasUtils) {
      canvasUtils.showCircles = showCircles;
      if (showPoints && trilaterationUtils && selectedMapId) {
        const selectedMap = allLoadedMaps.find(
          (map) => map.id === selectedMapId
        );
        if (selectedMap) {
          trilaterationUtils.refreshMap(selectedMap.mapIndex, true);
        }
      }
    }
  }, [
    showCircles,
    showPoints,
    canvasUtils,
    trilaterationUtils,
    selectedMapId,
    allLoadedMaps,
  ]);

  // อัปเดตแผนที่เมื่อ selectedMapId เปลี่ยน
  useEffect(() => {
    if (selectedMapId && canvasUtils) {
      const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
      if (selectedMap) {
        setMaps([selectedMap]);
        setLoadedMaps([selectedMap]);
        loadMapToCanvas(
          selectedMap.mapSrc,
          allLoadedMaps.findIndex((map) => map.id === selectedMap.id)
        );
      }
    }
  }, [selectedMapId, canvasUtils, allLoadedMaps]);

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

      <div >
        <GenText />
        <div className="home-container">
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
                  checked={!showCircles}
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
                  <span>Loading map...</span>
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
                      value={selectedMapId}
                      onChange={(e) => {
                        const newMapId = e.target.value;
                        setSelectedMapId(newMapId);
                        fetchPointsAndListenRealtime(newMapId);
                      }}
                    >
                      <option value="">-- Please Select Map --</option>
                      {allLoadedMaps.map((map) => (
                        <option key={map.id} value={map.id}>
                          {map.mapName}
                        </option>
                      ))}
                    </select>
                    <button
                      className="action-btn show-points-btn"
                      onClick={handleShowPoints}
                      disabled={!selectedMapId}
                    >
                      Show Points
                    </button>
                    <button
                      className="action-btn delete-map-btn"
                      onClick={handleDeleteMap}
                      disabled={!selectedMapId}
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
                    onClick={() => handleSampleMapClick(map.id)} // เปลี่ยนจาก map.mapSrc เป็น map.id
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
