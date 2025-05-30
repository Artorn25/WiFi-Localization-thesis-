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
  const [countdown, setCountdown] = useState(10);
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
  const [calculatedPositions, setCalculatedPositions] = useState({}); // เปลี่ยนชื่อ state เพื่อสะท้อนว่าเป็นหลายพิกัด

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

  useEffect(() => {
    const popupSuppressed = localStorage.getItem("popupSuppressed");
    if (popupSuppressed) {
      const suppressionTime = parseInt(popupSuppressed, 10);
      const currentTime = Date.now();
      const oneDayInMs = 24 * 60 * 60 * 1000;

      if (currentTime - suppressionTime < oneDayInMs) {
        setShowInfoPopup(false);
        return;
      } else {
        localStorage.removeItem("popupSuppressed");
      }
    }
    setShowInfoPopup(true);
  }, []);

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
          const mapIndex = allLoadedMaps.length + loadedMapsData.length;
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

      mapManager.loadMaps([...mapManager.maps, ...loadedMapsData]);
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
      const positions = trilaterationUtils?.refreshMap(
        selectedIndex,
        showPoints
      );
      setCalculatedPositions(positions || {});
    } else {
      console.warn("Invalid selectedIndex or map not found in mapManager.maps");
      setCalculatedPositions({});
    }
  };

  const fetchPointsAndListenRealtime = async (newMapId) => {
    try {
      if (!newMapId) {
        console.log("Please select a map first");
        canvasUtils?.resetCanvas();
        canvasUtils3D?.resetCanvas();
        setSelectedPoints([]);
        setShowPoints(false);
        setCalculatedPositions({});
        return;
      }

      const selectedMap = allLoadedMaps.find((map) => map.id === newMapId);
      if (!selectedMap) {
        console.log("No map found for this mapId:", newMapId);
        canvasUtils?.resetCanvas();
        canvasUtils3D?.resetCanvas();
        setSelectedPoints([]);
        setShowPoints(false);
        setCalculatedPositions({});
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

      listenersRef.current.forEach(({ ref, listener }) => {
        off(ref, "value", listener);
      });
      listenersRef.current = [];

      pointManager.resetPointsForMap(selectedIndex);

      loadMapToCanvas(selectedMap.mapSrc, selectedMap.mapSrc3D, selectedIndex);
    } catch (error) {
      console.error("Error loading map:", error);
      canvasUtils?.resetCanvas();
      canvasUtils3D?.resetCanvas();
      setSelectedPoints([]);
      setShowPoints(false);
      setCalculatedPositions({});
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
      setCalculatedPositions({});
      return;
    }

    const selectedMap = allLoadedMaps.find((map) => map.id === selectedMapId);
    if (!selectedMap) {
      console.log("No map found for this mapId");
      canvasUtils?.resetCanvas();
      canvasUtils3D?.resetCanvas();
      setSelectedPoints([]);
      setShowPoints(false);
      setCalculatedPositions({});
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
      pointManager.resetPointsForMap(mapIndex);
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
                pointManager.updatePointData(pointName, allData, mapIndex);
              }
            });

            setSelectedPoints([...pointManager.pointsPerMap[mapIndex]]);

            if (trilaterationUtils) {
              const positions = trilaterationUtils.refreshMap(mapIndex, true);
              setCalculatedPositions(positions || {});
            }
          } else {
            console.log("No data found in Firebase");
            selectedMap.points?.forEach((point) => {
              const targetPoint = pointManager.pointsPerMap[mapIndex].find(
                (p) => p.name === point.name
              );
              if (targetPoint) {
                targetPoint.data = [];
                pointManager.updatePointData(point.name, [], mapIndex);
              }
            });
            setSelectedPoints([...pointManager.pointsPerMap[mapIndex]]);
            if (trilaterationUtils) {
              const positions = trilaterationUtils.refreshMap(mapIndex, true);
              setCalculatedPositions(positions || {});
            }
          }
        },
        (error) => {
          console.error("Error listening to Firebase:", error);
          canvasUtils.alert(
            "Error",
            "Failed to fetch real-time data from Firebase.",
            "error"
          );
          setCalculatedPositions({});
        }
      );

      listenersRef.current.push({ ref: dataRef, listener });

      if (trilaterationUtils) {
        const positions = trilaterationUtils.refreshMap(mapIndex, true);
        setCalculatedPositions(positions || {});
      }
    } catch (error) {
      console.error("Error setting up points and real-time listener:", error);
      setSelectedPoints([]);
      setShowPoints(false);
      canvasUtils?.resetCanvas();
      canvasUtils3D?.resetCanvas();
      setCalculatedPositions({});
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
    setCalculatedPositions({});

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
          const positions = trilaterationUtils.refreshMap(
            selectedMap.mapIndex,
            true
          );
          setCalculatedPositions(positions || {});
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
    }, 10000);

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
          <div className="popup-container">
            <div className="popup-header">
              <h2 className="popup-title">
                <svg className="popup-icon" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M11,9H13V7H11M12,20C7.59,20 4,16.41 4,12C4,7.59 7.59,4 12,4C16.41,4 20,7.59 20,12C20,16.41 16.41,20 12,20M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M11,17H13V11H11V17Z"
                  />
                </svg>
                WiFi Localization Technology
              </h2>
              <button
                className="combined-close-btn"
                onClick={handlePermanentClose}
                aria-label="Don't show for 1 day and close"
              >
                <span className="dont-show-text">
                  Don&apos;t show for 1 day
                </span>
                <span className="close-icon">×</span>
              </button>
            </div>

            <div className="popup-content">
              <p className="popup-intro">
                Our WiFi-based positioning system provides accurate indoor
                location tracking without GPS.
              </p>

              <div className="feature-grid">
                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4M12,10.5A1.5,1.5 0 0,0 10.5,12A1.5,1.5 0 0,0 12,13.5A1.5,1.5 0 0,0 13.5,12A1.5,1.5 0 0,0 12,10.5M7.5,10.5A1.5,1.5 0 0,0 6,12A1.5,1.5 0 0,0 7.5,13.5A1.5,1.5 0 0,0 9,12A1.5,1.5 0 0,0 7.5,10.5M16.5,10.5A1.5,1.5 0 0,0 15,12A1.5,1.5 0 0,0 16.5,13.5A1.5,1.5 0 0,0 18,12A1.5,1.5 0 0,0 16.5,10.5Z"
                      />
                    </svg>
                  </div>
                  <h3>Precise Indoor Tracking</h3>
                  <p>
                    Works in environments where GPS signals are weak or
                    unavailable
                  </p>
                </div>

                <div className="feature-card">
                  <div className="feature-icon">
                    <svg viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12,15A2,2 0 0,1 10,13C10,11.89 10.9,11 12,11A2,2 0 0,1 14,13A2,2 0 0,1 12,15M7,10C5.89,10 5,10.9 5,12A2,2 0 0,0 7,14A2,2 0 0,0 9,12C9,10.89 8.1,10 7,10M17,10C15.89,10 15,10.9 15,12A2,2 0 0,0 17,14A2,2 0 0,0 19,12C19,10.89 18.1,10 17,10M12,2L4,5V11.09C4,16.14 7.41,20.85 12,22C16.59,20.85 20,16.14 20,11.09V5L12,2Z"
                      />
                    </svg>
                  </div>
                  <h3>Minimal Setup</h3>
                  <p>
                    Uses existing WiFi infrastructure with no additional
                    hardware
                  </p>
                </div>
              </div>

              {autoRedirect && (
                <div className="countdown-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${(countdown / 10) * 100}%` }}
                    ></div>
                  </div>
                  <span className="countdown-text">
                    Auto-closing in {countdown} second
                    {countdown !== 1 ? "s" : ""}
                  </span>
                </div>
              )}
            </div>

            <div className="popup-footer">
              <label className="toggle-control">
                <input
                  type="checkbox"
                  checked={autoRedirect}
                  onChange={() => setAutoRedirect(!autoRedirect)}
                />
                <span className="toggle-slider"></span>
                <span className="toggle-label">Auto-close</span>
              </label>

              <button
                className="primary-btn"
                onClick={() => setShowInfoPopup(false)}
              >
                Got it!
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

            {Object.keys(calculatedPositions).length > 0 && (
              <div className="position-display">
                <h3>Calculated Positions</h3>
                {Object.entries(calculatedPositions).map(([mac, pos]) => (
                  <p key={mac}>
                    {pos.name}: X: {pos.x}, Y: {pos.y} (MAC: {mac})
                  </p>
                ))}
              </div>
            )}
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
