"use client";
import { useState, useEffect, useRef } from "react";
import NextImage from "next/image";
import {
  CanvasUtils,
  MapManager,
  PointManager,
  TrilaterationUtils,
} from "@utils/index.js";
import "@styles/map.css";

export default function Map() {
  const canvasRef = useRef(null);
  const [selectedMapData, setSelectedMapData] = useState(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

    const canvasUtils = new CanvasUtils(canvas, tooltip);
    const mapManager = new MapManager();
    const pointManager = new PointManager(canvasUtils);
    const trilaterationUtils = new TrilaterationUtils(
      canvasUtils,
      pointManager,
      mapManager
    );

    pointManager.trilaterationUtils = trilaterationUtils;

    canvasUtils.initializeCanvas();

    const setupListeners = () => {
      document.getElementById("updateMapName").addEventListener("click", () => {
        const mapSelect = document.getElementById("map-select");
        const selectedIndex = mapSelect.value;
        const newMapName = document.getElementById("mapName").value;

        if (
          mapManager.checkCondition.Equal(
            selectedIndex,
            "Please select a map to update."
          )
        )
          return;
        if (!newMapName) {
          mapManager.alert(
            "Warning",
            "Please enter a new name for the map.",
            "warning"
          );
          return;
        }
        mapManager.maps[selectedIndex] = {
          ...mapManager.maps[selectedIndex],
          name: newMapName,
        };
        mapManager.updateMapSelect();
        mapManager.alert(
          "Success",
          `Map ${parseInt(selectedIndex) + 1} renamed to ${newMapName}`,
          "success"
        );
        mapSelect.value = selectedIndex;
        document.getElementById("mapName").value = "";

        const mapData = {
          mapIndex: selectedIndex,
          mapName: newMapName,
          mapSrc: mapManager.maps[selectedIndex].src,
          points:
            pointManager.pointsPerMap[selectedIndex]?.map((point) => ({
              name: point.name,
              x: point.x,
              y: point.y,
            })) || [],
        };
        setSelectedMapData(mapData);
        console.log("Map name updated, maps:", mapManager.maps); // ดีบัก
      });

      document
        .getElementById("map-select")
        .addEventListener("change", async (event) => {
          const selectedIndex = event.target.value;
          console.log(
            "Map selected, selectedIndex:",
            selectedIndex,
            "maps:",
            mapManager.maps
          ); // ดีบัก
          if (selectedIndex) {
            if (!mapManager.maps[selectedIndex]) {
              mapManager.alert(
                "Error",
                "Selected map is not available. Please select another map.",
                "error"
              );
              return;
            }
            pointManager.stopRealTimeUpdates();
            canvasUtils.img.src = mapManager.maps[selectedIndex].src;
            pointManager.points =
              pointManager.pointsPerMap[selectedIndex] || [];
            pointManager.markerCoordinates =
              pointManager.markerCoordinatesPerMap[selectedIndex] || [];
            const mapData = {
              mapIndex: selectedIndex,
              mapName: mapManager.maps[selectedIndex].name,
              mapSrc: mapManager.maps[selectedIndex].src,
              points:
                pointManager.pointsPerMap[selectedIndex]?.map((point) => ({
                  name: point.name,
                  x: point.x,
                  y: point.y,
                })) || [],
            };
            setSelectedMapData(mapData);
            try {
              trilaterationUtils.refreshMap(selectedIndex);
              trilaterationUtils.startRealTimeUpdate();
            } catch (error) {
              console.error("Error refreshing map after map change:", error);
              mapManager.alert(
                "Error",
                "Failed to refresh map. Please try again.",
                "error"
              );
            }
          } else {
            pointManager.stopRealTimeUpdates();
            setSelectedMapData(null);
            canvasUtils.resetCanvas(); // รีเซ็ต canvas เมื่อไม่ได้เลือกแผนที่
          }
        });

      document
        .getElementById("map-upload")
        .addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              mapManager
                .editMapName(e.target.result)
                .then((index) => {
                  console.log(
                    "Map uploaded, index:",
                    index,
                    "maps:",
                    mapManager.maps
                  ); // ดีบัก
                  if (index !== null) {
                    document.getElementById("map-select").value = index;
                    canvasUtils.img.src = e.target.result;
                    trilaterationUtils.refreshMap(index);
                    trilaterationUtils.startRealTimeUpdate();
                    const mapData = {
                      mapIndex: index,
                      mapName: mapManager.maps[index].name,
                      mapSrc: e.target.result,
                      points:
                        pointManager.pointsPerMap[index]?.map((point) => ({
                          name: point.name,
                          x: point.x,
                          y: point.y,
                        })) || [],
                    };
                    setSelectedMapData(mapData);
                  } else {
                    mapManager.alert(
                      "Warning",
                      "Map upload cancelled. Please upload a map to continue.",
                      "warning"
                    );
                  }
                })
                .catch((error) => {
                  console.error("Error uploading map:", error);
                  mapManager.alert(
                    "Error",
                    "Failed to upload map. Please try again.",
                    "error"
                  );
                });
            };
            reader.readAsDataURL(file);
          }
        });

      document.querySelectorAll(".map-sample").forEach((img) => {
        img.addEventListener("click", () => {
          const mapSrc = img.getAttribute("data-map-src");
          mapManager
            .editMapName(mapSrc)
            .then((index) => {
              console.log(
                "Sample map selected, index:",
                index,
                "maps:",
                mapManager.maps
              ); // ดีบัก
              if (index !== null) {
                document.getElementById("map-select").value = index;
                canvasUtils.img.src = mapSrc;
                trilaterationUtils.refreshMap(index);
                trilaterationUtils.startRealTimeUpdate();
                const mapData = {
                  mapIndex: index,
                  mapName: mapManager.maps[index].name,
                  mapSrc: mapSrc,
                  points:
                    pointManager.pointsPerMap[index]?.map((point) => ({
                      name: point.name,
                      x: point.x,
                      y: point.y,
                    })) || [],
                };
                setSelectedMapData(mapData);
              } else {
                mapManager.alert(
                  "Warning",
                  "Map selection cancelled. Please select a map to continue.",
                  "warning"
                );
              }
            })
            .catch((error) => {
              console.error("Error selecting sample map:", error);
              mapManager.alert(
                "Error",
                "Failed to select sample map. Please try again.",
                "error"
              );
            });
        });
      });

      document.getElementById("delete-map").addEventListener("click", () => {
        const mapSelect = document.getElementById("map-select");
        const selectedIndex = mapSelect.value;
        if (!selectedIndex) {
          mapManager.alert(
            "Warning",
            "Please select a map to delete.",
            "warning"
          );
          return;
        }
        mapManager.deleteMap(selectedIndex, canvasUtils);
        pointManager.stopRealTimeUpdates();
        trilaterationUtils.refreshMap(mapSelect.value);
        setSelectedMapData(null);
        console.log("Map deleted, maps:", mapManager.maps); // ดีบัก
      });

      document.getElementById("resetPoints").addEventListener("click", () => {
        const selectedIndex = document.getElementById("map-select").value;
        if (!selectedIndex) {
          mapManager.alert(
            "Warning",
            "Please select a map before resetting points.",
            "warning"
          );
          return;
        }
        canvasUtils.resetCanvas();
        pointManager.stopRealTimeUpdates();
        pointManager.points = [];
        pointManager.markerCoordinates = [];
        pointManager.pointsPerMap[selectedIndex] = [];
        pointManager.markerCoordinatesPerMap[selectedIndex] = [];
        trilaterationUtils.refreshMap(selectedIndex);

        const mapData = {
          mapIndex: selectedIndex,
          mapName: mapManager.maps[selectedIndex].name,
          mapSrc: mapManager.maps[selectedIndex].src,
          points: [],
        };
        setSelectedMapData(mapData);
        console.log("Points reset, maps:", mapManager.maps); // ดีบัก
      });

      document.getElementById("ShowDistance").addEventListener("click", () => {
        const index1 = document.getElementById("point1Select").value;
        const index2 = document.getElementById("point2Select").value;
        pointManager.showDistance(index1, index2);
      });

      document.getElementById("DeletePoint").addEventListener("click", () => {
        const selectedPointName = document.getElementById("pointSelect").value;
        const mapIndex = document.getElementById("map-select").value;
        if (!mapIndex) {
          mapManager.alert(
            "Warning",
            "Please select a map before deleting a point.",
            "warning"
          );
          return;
        }
        pointManager.deletePoint(selectedPointName, mapIndex);
        trilaterationUtils.refreshMap(mapIndex);

        const mapData = {
          mapIndex: mapIndex,
          mapName: mapManager.maps[mapIndex].name,
          mapSrc: mapManager.maps[mapIndex].src,
          points:
            pointManager.pointsPerMap[mapIndex]?.map((point) => ({
              name: point.name,
              x: point.x,
              y: point.y,
            })) || [],
        };
        setSelectedMapData(mapData);
      });

      document.getElementById("editPoint").addEventListener("click", () => {
        const selectedPointName =
          document.getElementById("editPointSelect").value;
        const newPointName = document.getElementById("newPointName").value;
        const mapIndex = document.getElementById("map-select").value;
        if (!mapIndex) {
          mapManager.alert(
            "Warning",
            "Please select a map before editing a point.",
            "warning"
          );
          return;
        }
        pointManager.editPoint(selectedPointName, newPointName, mapIndex);
        trilaterationUtils.refreshMap(mapIndex);
        document.getElementById("newPointName").value = "";

        const mapData = {
          mapIndex: mapIndex,
          mapName: mapManager.maps[mapIndex].name,
          mapSrc: mapManager.maps[mapIndex].src,
          points:
            pointManager.pointsPerMap[mapIndex]?.map((point) => ({
              name: point.name,
              x: point.x,
              y: point.y,
            })) || [],
        };
        setSelectedMapData(mapData);
      });

      canvas.addEventListener("click", async (event) => {
        const pointName = document.getElementById("pointName").value;
        console.log("Canvas clicked, maps:", mapManager.maps); // ดีบัก
        if (mapManager.maps.length === 0) {
          mapManager.alert(
            "Info",
            "Please upload or select a map before adding points.",
            "question"
          );
          return;
        }
        const rect = canvas.getBoundingClientRect();
        const pixelX = event.clientX - rect.left;
        const pixelY = event.clientY - rect.top;
        const { x, y } = canvasUtils.toCartesian(pixelX, pixelY);
        const selectedIndex = document.getElementById("map-select").value;
        console.log("Selected index:", selectedIndex); // ดีบัก
        if (!selectedIndex || !mapManager.maps[selectedIndex]) {
          mapManager.alert(
            "Warning",
            "Please select a valid map before adding a point.",
            "warning"
          );
          return;
        }
        if (pointManager.drawMode)
          pointManager.addMarkerAndPoint(x, y, pointName, selectedIndex);
        else pointManager.addPoint(x, y, pointName, selectedIndex);
        document.getElementById("pointName").value = "";

        try {
          trilaterationUtils.refreshMap(selectedIndex);
          const mapData = {
            mapIndex: selectedIndex,
            mapName: mapManager.maps[selectedIndex].name,
            mapSrc: mapManager.maps[selectedIndex].src,
            points:
              pointManager.pointsPerMap[selectedIndex]?.map((point) => ({
                name: point.name,
                x: point.x,
                y: point.y,
              })) || [],
          };
          setSelectedMapData(mapData);
        } catch (error) {
          console.error("Error refreshing map after adding point:", error);
          mapManager.alert(
            "Error",
            "Failed to refresh map after adding point. Please try again.",
            "error"
          );
        }
      });

      canvas.addEventListener("mousemove", (event) => {
        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const hoveredPoint = pointManager.points.find((point) => {
          const dx = point.x - x;
          const dy = point.y - y;
          return Math.sqrt(dx * dx + dy * dy) < 5;
        });

        if (hoveredPoint) {
          tooltip.innerText = `Name: ${
            hoveredPoint.name
          }\nDistance: ${hoveredPoint.distance.toFixed(2)} m\nRSSI: ${
            hoveredPoint.rssi
          } dBm`;
          tooltip.style.display = "block";
          tooltip.style.left = `${event.pageX + 10}px`;
          tooltip.style.top = `${event.pageY + 10}px`;
        } else {
          canvasUtils.showCircleTooltip(event);
        }
      });

      document
        .getElementById("showCircleCheckbox")
        .addEventListener("change", (event) => {
          const selectedIndex = document.getElementById("map-select").value;
          if (!selectedIndex) {
            mapManager.alert(
              "Warning",
              "Please select a map before toggling circles.",
              "warning"
            );
            return;
          }
          canvasUtils.showCircles = !event.target.checked;
          if (!canvasUtils.showCircles) {
            mapManager.alert(
              "Info",
              "Circles are hidden. Real-time updates will not display new circles until you unhide them.",
              "info"
            );
          }
          trilaterationUtils.refreshMap(selectedIndex);
        });

      document
        .getElementById("confirmSave")
        .addEventListener("click", async () => {
          if (!selectedMapData) {
            mapManager.alert(
              "Warning",
              "Please select a map and add points before saving.",
              "warning"
            );
            return;
          }

          if (!selectedMapData.mapIndex) {
            mapManager.alert(
              "Error",
              "Map index is missing. Please select a map again.",
              "error"
            );
            return;
          }

          try {
            await pointManager.saveMapDataToFirestore(selectedMapData);
          } catch (error) {
            console.error("Error saving map data to Firestore:", error);
            mapManager.alert(
              "Error",
              error.message ||
                "Failed to save map data to Firestore. Please try again.",
              "error"
            );
          }
        });

      document.addEventListener("DOMContentLoaded", () => {
        trilaterationUtils.startRealTimeUpdate();
      });
    };

    setupListeners();

    return () => {
      pointManager.stopRealTimeUpdates();
      document
        .getElementById("updateMapName")
        .removeEventListener("click", () => {});
      document
        .getElementById("map-select")
        .removeEventListener("change", () => {});
      document
        .getElementById("map-upload")
        .removeEventListener("change", () => {});
      document
        .getElementById("delete-map")
        .removeEventListener("click", () => {});
      document
        .getElementById("resetPoints")
        .removeEventListener("click", () => {});
      document
        .getElementById("ShowDistance")
        .removeEventListener("click", () => {});
      document
        .getElementById("DeletePoint")
        .removeEventListener("click", () => {});
      document
        .getElementById("editPoint")
        .removeEventListener("click", () => {});
      document
        .getElementById("confirmSave")
        .removeEventListener("click", () => {});
      canvas.removeEventListener("click", () => {});
      canvas.removeEventListener("mousemove", () => {});
      document
        .getElementById("showCircleCheckbox")
        .removeEventListener("change", () => {});
      document.removeEventListener("DOMContentLoaded", () => {});
    };
  }, [selectedMapData]);

  return (
    <>
      <div id="map-container">
        <div className="container">
          <canvas
            id="myCanvas"
            ref={canvasRef}
            width="900px"
            height="400px"
          ></canvas>
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
              {/* เพิ่มปุ่ม Confirm */}
              <button id="confirmSave">💾 Confirm Save to Firestore</button>
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
          <NextImage
            src="/map/map1.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/map1.png"
            width={400}
            height={200}
          />
          <NextImage
            src="/map/map2.png"
            alt="Sample Map 2"
            className="map-sample"
            data-map-src="/map/map2.png"
            width={400}
            height={200}
          />
        </div>
      </div>
    </>
  );
}
