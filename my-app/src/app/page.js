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
} from "@utils/user/index";
import { collection, getDocs } from "firebase/firestore";
import { dbfs, dbRef, db } from "@utils/user/firebaseConfig";
import { onValue, off, get } from "firebase/database";
import GenText from "@components/Gentext";

export default function Home() {
  const [showInfoPopup, setShowInfoPopup] = useState(true);
  const [countdown, setCountdown] = useState(5);
  const [autoRedirect, setAutoRedirect] = useState(true);
  const [maps, setMaps] = useState([]);
  const [loadedMaps, setLoadedMaps] = useState([]);
  const [selectedPoints, setSelectedPoints] = useState([]);
  const [showCircles, setShowCircles] = useState(true);

  const canvasRef = useRef(null);
  const [canvasUtils, setCanvasUtils] = useState(null);
  const [pointManager, setPointManager] = useState(null);
  const [trilaterationUtils, setTrilaterationUtils] = useState(null);
  const [mapManager] = useState(new MapManager());
  const listenersRef = useRef([]); // Store Firebase listeners for cleanup

  const initializeCanvasAndManagers = () => {
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

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

  const checkImageLoad = (mapSrc) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = mapSrc;
      img.onload = () => resolve(true);
      img.onerror = () => reject(false);
    });
  };

  const fetchMapsFromFirestore = async () => {
    try {
      const mapsRef = collection(dbfs, "maps");
      const querySnapshot = await getDocs(mapsRef);
      const mapsData = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setLoadedMaps([]);
      mapManager.maps = []; // Ensure maps is an array

      const loadedMapsData = [];
      for (const map of mapsData) {
        if (loadedMapsData.some((loadedMap) => loadedMap.id === map.id)) {
          console.log(`Duplicate map id found: ${map.id}, skipping...`);
          continue;
        }

        try {
          await checkImageLoad(map.mapSrc);
          loadedMapsData.push(map);
          mapManager.maps.push({
            src: map.mapSrc,
            name: map.mapName,
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
      mapManager.updateMapSelect();

      console.log("Loaded maps:", loadedMapsData);
    } catch (error) {
      console.error("Error fetching maps from Firestore: ", error);
      setMaps([]);
      setLoadedMaps([]);
    }
  };

  const fetchPointsAndListenRealtime = async () => {
    // Clean up existing listeners
    listenersRef.current.forEach(({ ref, listener }) => {
      off(ref, "value", listener);
    });
    listenersRef.current = [];

    try {
      const currentMapId = document.getElementById("map-select").value;

      if (!currentMapId) {
        console.log("Please select a map first");
        setSelectedPoints([]);
        canvasUtils?.resetCanvas();
        return;
      }

      const selectedMap = maps.find((map) => map.id === currentMapId);
      if (!selectedMap) {
        setSelectedPoints([]);
        pointManager.pointsPerMap[currentMapId] = [];
        pointManager.points = [];
        canvasUtils?.resetCanvas();
        console.log("No map found for this mapId");
        return;
      }

      // Load map image to canvas
      loadMapToCanvas(
        selectedMap.mapSrc,
        mapManager.maps.findIndex((map) => map.src === selectedMap.mapSrc)
      );

      if (!selectedMap.points || selectedMap.points.length === 0) {
        setSelectedPoints([]);
        pointManager.pointsPerMap[selectedMap.mapIndex] = [];
        pointManager.points = [];
        console.log("No points found for this map");
        trilaterationUtils.refreshMap(selectedMap.mapIndex);
        return;
      }

      // Initialize points
      const initialPoints = selectedMap.points.map((point) => ({
        ...point,
        data: [], // Array to store real-time data from all nodes
      }));

      pointManager.stopRealTimeUpdates();
      pointManager.pointsPerMap[selectedMap.mapIndex] = initialPoints;
      pointManager.points = initialPoints;
      setSelectedPoints(initialPoints);

      // Set up real-time listener at the root 'Data' node
      const dataRef = dbRef;
      const listener = onValue(
        dataRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const nodes = snapshot.val();
            console.log("Realtime snapshot:", nodes);

            // Update data for each point
            selectedMap.points.forEach((point) => {
              const pointName = point.name;
              const allData = [];

              // Iterate through each node (e.g., Node-80D703A47F098)
              Object.keys(nodes).forEach((nodeKey) => {
                const nodeData = nodes[nodeKey];
                // Iterate through each router in the node (e.g., Router-1, Router-2)
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

              // Update the point's data
              const targetPoint = pointManager.pointsPerMap[
                selectedMap.mapIndex
              ].find((p) => p.name === pointName);

              if (targetPoint) {
                targetPoint.data = allData;
              }
            });

            // Update UI
            setSelectedPoints([
              ...pointManager.pointsPerMap[selectedMap.mapIndex],
            ]);

            // Refresh canvas to draw circles and calculate trilateration
            trilaterationUtils.refreshMap(selectedMap.mapIndex);
          } else {
            console.log("No data found in Firebase");
            selectedMap.points.forEach((point) => {
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
            trilaterationUtils.refreshMap(selectedMap.mapIndex);
          }
        },
        (error) => {
          console.error("Error listening to Firebase:", error);
          canvasUtils.alert(
            "Error",
            "Failed to fetch0800 real-time data from Firebase.",
            "error"
          );
        }
      );

      // Store listener for cleanup
      listenersRef.current.push({ ref: dataRef, listener });
    } catch (error) {
      console.error("Error setting up real-time listener:", error);
      setSelectedPoints([]);
      canvasUtils?.resetCanvas();
    }
  };

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

  const handleSampleMapClick = (mapSrc) => {
    const matchedMap = maps.find((map) => map.mapSrc === mapSrc);
    if (matchedMap) {
      document.getElementById("map-select").value = matchedMap.id;
      fetchPointsAndListenRealtime();
    } else {
      console.log("No matching map found in Firestore for mapSrc:", mapSrc);
      setSelectedPoints([]);
      canvasUtils?.resetCanvas();
      document.getElementById("map-select").value = "";
    }
  };

  useEffect(() => {
    initializeCanvasAndManagers();
    fetchMapsFromFirestore();
  }, []);

  useEffect(() => {
    if (canvasUtils) {
      canvasUtils.showCircles = showCircles;
      const currentMapId = document.getElementById("map-select").value;
      if (currentMapId) {
        const selectedMap = maps.find((map) => map.id === currentMapId);
        if (selectedMap) {
          trilaterationUtils.refreshMap(selectedMap.mapIndex);
        }
      }
    }
  }, [showCircles, canvasUtils, trilaterationUtils]);

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

  // Cleanup listeners on component unmount
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

      <div id="map-container">
        <GenText />
        <div className="container">
          <canvas
            id="myCanvas"
            ref={canvasRef}
            width="1000px"
            height="400px"
          ></canvas>

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
                Select Map:
              </label>
              <select
                id="map-select"
                style={{ padding: "5px" }}
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
                onClick={fetchPointsAndListenRealtime}
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
                    {point.data && point.data.length > 0 ? (
                      <ul
                        style={{ listStyleType: "none", paddingLeft: "20px" }}
                      >
                        {point.data.map((nodeData, nodeIndex) => (
                          <li key={nodeIndex}>
                            Node {nodeIndex + 1}: Distance:{" "}
                            {nodeData.distance.toFixed(2)}, RSSI:{" "}
                            {nodeData.rssi.toFixed(2)}, MAC: {nodeData.mac}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <div>No node data available for this point.</div>
                    )}
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

      <div
        id="map-sample-container"
        className="container"
        style={{ marginTop: "30px" }}
      >
        <h3 style={{ marginBottom: "15px" }}>Example Maps</h3>
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
