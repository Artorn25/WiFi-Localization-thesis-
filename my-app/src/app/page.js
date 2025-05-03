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
  const [showInfoPopup, setShowInfoPopup] = useState(false);
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
  const [is3DMode, setIs3DMode] = useState(false);

  const canvasRef = useRef(null);
  const canvas3DRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);
  const [canvasUtils3D, setCanvasUtils3D] = useState(null);
  const [pointManager, setPointManager] = useState(null);
  const [trilaterationUtils, setTrilaterationUtils] = useState(null);
  const [mapManager] = useState(new MapManager());
  const listenersRef = useRef([]);

  const normalizeSrc = (src) => {
    return src.trim().replace(/\/+/g, "/").toLowerCase();
  };

  // Check localStorage for popup suppression
  useEffect(() => {
    const popupSuppressed = localStorage.getItem("popupSuppressed");
    if (popupSuppressed) {
      const suppressionTime = parseInt(popupSuppressed, 10);
      const currentTime = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000; // 1 day in milliseconds

      if (currentTime - suppressionTime < oneDayInMs) {
        setShowInfoPopup(false);
        return;
      } else {
        localStorage.removeItem("popupSuppressed");
      }
    }
    setShowInfoPopup(true);
  }, []);

  // Handle permanent popup close
  const handlePermanentClose = () => {
    localStorage.setItem("popupSuppressed", Date.now().toString());
    setShowInfoPopup(false);
    setAutoRedirect(false);
  };

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
        reject(new Error(`Failed to load image: ${mapSrc}`));
      };
    });
  };

  const fetchMapsFromFirestore = async (mapId) => {
    setIsLoadingMaps(true);
    setLoadError(null);

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
          let mapSrc3D = null;
          if (map.mapSrc3D) {
            try {
              await checkImageLoad(map.mapSrc3D);
              mapSrc3D = map.mapSrc3D;
            } catch (error) {
              console.warn(
                `Failed to load 3D map image for ${map.mapName}:`,
                map.mapSrc3D
              );
              Swal.fire({
                title: "Warning",
                text: `Failed to load 3D map image for ${map.mapName}. 3D mode will be unavailable.`,
                icon: "warning",
                timer: 2000,
                showConfirmButton: false,
              });
            }
          }
          const mapIndex = parseInt(map.mapIndex, 10) || mapManager.maps.length;
          loadedMapsData.push({ ...map, mapSrc3D, mapIndex });
          mapManager.maps[mapIndex] = {
            id: map.id,
            src: map.mapSrc,
            name: map.mapName,
            src3D: mapSrc3D,
            index: mapIndex,
          };
        } catch (error) {
          console.error(
            `Failed to load map image for ${map.mapName}:`,
            map.mapSrc
          );
          throw error;
        }
      }

      setMaps(loadedMapsData);
      setLoadedMaps(loadedMapsData);

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
      console.log("mapManager.maps after load:", mapManager.maps);

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

  const loadMapToCanvas = (mapSrc, mapSrc3D, selectedIndex) => {
    if (!canvasUtils || !canvasUtils3D) {
      console.error("CanvasUtils not initialized");
      return;
    }

    console.log(
      "Attempting to load map with src:",
      mapSrc,
      "3D src:",
      mapSrc3D
    );
    console.log("is3DMode:", is3DMode, "selectedIndex:", selectedIndex);

    canvasUtils.resetCanvas();
    canvasUtils3D.resetCanvas();

    if (is3DMode && mapSrc3D) {
      console.log("Loading 3D map");
      canvasUtils3D.drawImageImmediately(mapSrc3D);
    } else {
      console.log("Loading 2D map");
      canvasUtils.drawImageImmediately(mapSrc);
    }

    if (selectedIndex >= 0 && mapManager.maps[selectedIndex]) {
      trilaterationUtils.refreshMap(selectedIndex, showPoints);
    } else {
      console.warn("Invalid selectedIndex or map not found in mapManager.maps");
    }
  };

  const fetchPointsAndListenRealtime = async (newMapId) => {
    try {
      if (!newMapId) {
        console.log("Please select a map first");
        canvasUtils?.resetCanvas();
        canvasUtils3D?.resetCanvas();
        return;
      }

      const selectedMap = allLoadedMaps.find((map) => map.id === newMapId);
      if (!selectedMap) {
        console.log("No map found for this mapId:", newMapId);
        canvasUtils?.resetCanvas();
        canvasUtils3D?.resetCanvas();
        return;
      }

      console.log("Selected Map ID:", newMapId, "Selected Map:", selectedMap);
      setMaps([selectedMap]);
      setLoadedMaps([selectedMap]);

      const selectedIndex = selectedMap.mapIndex;
      console.log(
        "Selected Index in fetchPointsAndListenRealtime:",
        selectedIndex
      );

      loadMapToCanvas(selectedMap.mapSrc, selectedMap.mapSrc3D, selectedIndex);
    } catch (error) {
      console.error("Error loading map:", error);
      canvasUtils?.resetCanvas();
      canvasUtils3D?.resetCanvas();
    }
  };

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
      canvasUtils3D?.resetCanvas();
      return;
    }

    const mapIndex = selectedMap.mapIndex;
    console.log("handleShowPoints - mapIndex:", mapIndex);
    console.log("handleShowPoints - selectedMap.points:", selectedMap.points);

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

      console.log("handleShowPoints - initialPoints:", initialPoints);

      pointManager.stopRealTimeUpdates();
      pointManager.pointsPerMap[mapIndex] = initialPoints;
      pointManager.points = initialPoints;
      setSelectedPoints(initialPoints);

      console.log("pointManager.pointsPerMap:", pointManager.pointsPerMap);

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

              const targetPoint = pointManager.pointsPerMap[mapIndex].find(
                (p) => p.name === pointName
              );

              if (targetPoint) {
                targetPoint.data = allData;
              }
            });

            setSelectedPoints([...pointManager.pointsPerMap[mapIndex]]);

            if (trilaterationUtils) {
              trilaterationUtils.refreshMap(mapIndex, true);
            }
          } else {
            console.log("No data found in Firebase");
            selectedMap.points?.forEach((point) => {
              const targetPoint = pointManager.pointsPerMap[mapIndex].find(
                (p) => p.name === point.name
              );
              if (targetPoint) {
                targetPoint.data = [];
              }
            });
            setSelectedPoints([...pointManager.pointsPerMap[mapIndex]]);
            if (trilaterationUtils)
              trilaterationUtils.refreshMap(mapIndex, true);
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
        trilaterationUtils.refreshMap(mapIndex, true);
      }
    } catch (error) {
      console.error("Error setting up points and real-time listener:", error);
      setSelectedPoints([]);
      setShowPoints(false);
      canvasUtils?.resetCanvas();
      canvasUtils3D?.resetCanvas();
    }
  };

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

    const selectedIndex = selectedMap.mapIndex;
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
    setIs3DMode(false);

    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, "value", listener);
    });
    listenersRef.current = [];

    if (updatedAllLoadedMaps.length > 0) {
      const nextMap = updatedAllLoadedMaps[0];
      setSelectedMapId(nextMap.id);
      setMaps([nextMap]);
      setLoadedMaps([nextMap]);
      loadMapToCanvas(nextMap.mapSrc, nextMap.mapSrc3D, nextMap.mapIndex);
    } else {
      canvasUtils.resetCanvas();
      canvasUtils3D.resetCanvas();
    }

    Swal.fire({
      title: "Deleted",
      text: `${selectedMap.mapName} has been removed from the selector.`,
      icon: "success",
      timer: 1500,
      showConfirmButton: false,
    });
  };

  const handleToggle3DMap = () => {
    const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
    if (!selectedMap) {
      Swal.fire({
        title: "Error",
        text: "No map selected.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    if (!selectedMap.mapSrc3D) {
      Swal.fire({
        title: "Error",
        text: "No 3D map available for the selected map.",
        icon: "error",
        timer: 1500,
        showConfirmButton: false,
      });
      return;
    }

    setIs3DMode((prev) => !prev);
  };

  const handleSampleMapClick = async (mapId) => {
    console.log("Sample map clicked, mapId:", mapId);

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

    await fetchMapsFromFirestore(mapId);
  };

  const initializeCanvasAndManagers = () => {
    const canvas = canvasRef.current;
    const canvas3D = canvas3DRef.current;
    const tooltip = document.getElementById("tooltip");

    if (!canvas || !canvas3D || !tooltip) {
      console.error("Canvas, 3D canvas, or tooltip not found");
      return;
    }

    const utils = new CanvasUtils(canvas, tooltip);
    const utils3D = new CanvasUtils(canvas3D, tooltip);
    utils.showCircles = showCircles;
    utils3D.showCircles = showCircles;
    utils.initializeCanvas();
    utils3D.initializeCanvas();

    const pm = new PointManager(utils);
    const tu = new TrilaterationUtils(utils, pm, mapManager);
    pm.trilaterationUtils = tu;
    tu.canvasUtils3D = utils3D;

    setCanvasUtils(utils);
    setCanvasUtils3D(utils3D);
    setPointManager(pm);
    setTrilaterationUtils(tu);
  };

  useEffect(() => {
    fetchSampleMaps();
    initializeCanvasAndManagers();
  }, []);

  useEffect(() => {
    if (canvasUtils && canvasUtils3D) {
      canvasUtils.showCircles = showCircles;
      canvasUtils3D.showCircles = showCircles;
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
    canvasUtils3D,
    trilaterationUtils,
    selectedMapId,
    allLoadedMaps,
  ]);

  useEffect(() => {
    if (selectedMapId && canvasUtils && canvasUtils3D) {
      const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
      if (selectedMap) {
        setMaps([selectedMap]);
        setLoadedMaps([selectedMap]);
        const selectedIndex = selectedMap.mapIndex;
        loadMapToCanvas(
          selectedMap.mapSrc,
          selectedMap.mapSrc3D,
          selectedIndex
        );

        if (is3DMode) {
          canvasRef.current.style.display = "none";
          canvas3DRef.current.style.display = "block";
        } else {
          canvasRef.current.style.display = "block";
          canvas3DRef.current.style.display = "none";
        }
      }
    }
  }, [selectedMapId, canvasUtils, canvasUtils3D, allLoadedMaps, is3DMode]);

  useEffect(() => {
    if (!showInfoPopup || !autoRedirect) return;

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
  }, [showInfoPopup, autoRedirect]);

  useEffect(() => {
    return () => {
      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, "value", listener);
      });
      listenersRef.current = [];
    };
  }, []);

  const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);

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
              <button
                className="popup-permanent-close-btn"
                onClick={handlePermanentClose}
              >
                Don&apos;t Show for 1 Day
              </button>
            </div>
          </div>
        </div>
      )}

      <div>
        <GenText />
        <div className="home-container">
          <div className="canvas-wrapper">
            <canvas
              id="myCanvas"
              ref={canvasRef}
              width="1000px"
              height="400px"
            ></canvas>
            <canvas
              id="myCanvas3D"
              ref={canvas3DRef}
              width="1000px"
              height="400px"
              style={{ display: "none" }}
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
                        setIs3DMode(false);
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
                    {selectedMapId && selectedMap?.mapSrc3D && (
                      <button
                        className="action-btn show-3d-map-btn"
                        onClick={handleToggle3DMap}
                      >
                        {is3DMode ? "Show 2D Map" : "Show 3D Map"}
                      </button>
                    )}
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
                    onClick={() => handleSampleMapClick(map.id)}
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
