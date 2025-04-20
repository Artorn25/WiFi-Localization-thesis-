"use client";
import { useEffect, useRef, useState } from "react";
import NextImage from "next/image";
import {
  CanvasUtils,
  MapManager,
  PointManager,
  TrilaterationUtils,
} from "@utils/admin/index";
import Swal from "sweetalert2";
import "@styles/map.css";

export default function Map() {
  const canvasRef = useRef(null);
  const [selectedMapData, setSelectedMapData] = useState([]);
  const [selectedPointData, setSelectedPointData] = useState([]); // เพิ่ม state สำหรับจุด

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

        if (
          mapManager.maps.some(
            (map, idx) =>
              idx !== parseInt(selectedIndex) && map.name === newMapName
          )
        ) {
          mapManager.alert(
            "Error",
            "Map name already exists. Please choose a different name.",
            "error"
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
          points: pointManager.pointsPerMap[selectedIndex] || [], // ใช้ selectedPointData แทน
        };
        console.log("MapData: ", mapData);
        setSelectedMapData(mapData);
        setSelectedPointData(pointManager.pointsPerMap[selectedIndex] || []); // อัปเดต selectedPointData
        console.log("Map name updated, maps:", mapManager.maps);
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
          );
          if (mapManager.maps.length === 0) {
            mapManager.alert(
              "Warning",
              "No maps available. Please upload or select a map.",
              "warning"
            );
            setSelectedMapData(null);
            setSelectedPointData([]); // รีเซ็ต selectedPointData
            canvasUtils.resetCanvas();
            return;
          }
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
              points: pointManager.pointsPerMap[selectedIndex] || [],
            };
            setSelectedMapData(mapData);
            setSelectedPointData(
              pointManager.pointsPerMap[selectedIndex] || []
            ); // อัปเดต selectedPointData
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
            setSelectedPointData([]); // รีเซ็ต selectedPointData
            canvasUtils.resetCanvas();
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
                  );
                  if (index !== null) {
                    document.getElementById("map-select").value = index;
                    canvasUtils.img.src = e.target.result;
                    trilaterationUtils.refreshMap(index);
                    trilaterationUtils.startRealTimeUpdate();
                    const mapData = {
                      mapIndex: index,
                      mapName: mapManager.maps[index].name,
                      mapSrc: e.target.result,
                      points: pointManager.pointsPerMap[index] || [],
                    };
                    setSelectedMapData(mapData);
                    setSelectedPointData(
                      pointManager.pointsPerMap[index] || []
                    ); // อัปเดต selectedPointData
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
              );
              if (index !== null) {
                document.getElementById("map-select").value = index;
                canvasUtils.img.src = mapSrc;
                trilaterationUtils.refreshMap(index);
                trilaterationUtils.startRealTimeUpdate();
                const mapData = {
                  mapIndex: index,
                  mapName: mapManager.maps[index].name,
                  mapSrc: mapSrc,
                  points: pointManager.pointsPerMap[index] || [],
                };
                setSelectedMapData(mapData);
                setSelectedPointData(pointManager.pointsPerMap[index] || []); // อัปเดต selectedPointData
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

        if (mapManager.maps.length > 0) {
          mapSelect.value = "0";
          const newIndex = mapSelect.value;
          canvasUtils.img.src = mapManager.maps[newIndex].src;
          pointManager.points = pointManager.pointsPerMap[newIndex] || [];
          pointManager.markerCoordinates =
            pointManager.markerCoordinatesPerMap[newIndex] || [];
          const mapData = {
            mapIndex: newIndex,
            mapName: mapManager.maps[newIndex].name,
            mapSrc: mapManager.maps[newIndex].src,
            points: pointManager.pointsPerMap[newIndex] || [],
          };
          setSelectedMapData(mapData);
          setSelectedPointData(pointManager.pointsPerMap[newIndex] || []); // อัปเดต selectedPointData
          trilaterationUtils.refreshMap(newIndex);
        } else {
          setSelectedMapData(null);
          setSelectedPointData([]); // รีเซ็ต selectedPointData
          canvasUtils.resetCanvas();
        }

        console.log("Map deleted, maps:", mapManager.maps);
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
        setSelectedPointData([]); // รีเซ็ต selectedPointData
        console.log("Points reset, maps:", mapManager.maps);
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
          points: pointManager.pointsPerMap[mapIndex] || [],
        };
        setSelectedMapData(mapData);
        setSelectedPointData(pointManager.pointsPerMap[mapIndex] || []); // อัปเดต selectedPointData
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
          points: pointManager.pointsPerMap[mapIndex] || [],
        };
        setSelectedMapData(mapData);
        setSelectedPointData(pointManager.pointsPerMap[mapIndex] || []); // อัปเดต selectedPointData
      });

      canvas.addEventListener("click", async (event) => {
        const pointName = document.getElementById("pointName").value.trim();
        console.log("Canvas clicked, maps:", mapManager.maps);
        console.log("length: ", mapManager.maps.length);
        // ตรวจสอบเงื่อนไขทั้งหมดก่อนทำอะไรต่อ
        if (mapManager.maps.length === 0) {
          mapManager.alert(
            "Info",
            "Please upload or select a map before adding points.",
            "question"
          );
          return;
        }

        const selectedIndex = document.getElementById("map-select").value;
        console.log("Selected index:", selectedIndex);

        if (!selectedIndex || !mapManager.maps[selectedIndex]) {
          mapManager.alert(
            "Warning",
            "Please select a valid map before adding a point.",
            "warning"
          );
          return;
        }

        if (!pointName) {
          mapManager.alert(
            "Warning",
            "Please enter a name for the point before clicking on the map.",
            "warning"
          );
          return;
        }

        // ดำเนินการเพิ่มจุด
        const rect = canvas.getBoundingClientRect();
        const pixelX = event.clientX - rect.left;
        const pixelY = event.clientY - rect.top;
        const { x, y } = canvasUtils.toCartesian(pixelX, pixelY);

        try {
          if (pointManager.drawMode) {
            await pointManager.addMarkerAndPoint(
              x,
              y,
              pointName,
              selectedIndex
            );
          } else {
            await pointManager.addPoint(x, y, pointName, selectedIndex);
          }

          document.getElementById("pointName").value = "";
          trilaterationUtils.refreshMap(selectedIndex);

          const mapData = {
            mapIndex: selectedIndex,
            mapName: mapManager.maps[selectedIndex].name,
            mapSrc: mapManager.maps[selectedIndex].src,
            points: pointManager.pointsPerMap[selectedIndex] || [],
          };
          setSelectedMapData(mapData);
          setSelectedPointData(pointManager.pointsPerMap[selectedIndex] || []);
        } catch (error) {
          console.error("Error adding point:", error);
          if (error.message !== "ALREADY_HANDLED") {
            // ตรวจสอบว่า error นี้ยังไม่ถูกจัดการ
            mapManager.alert(
              "Error",
              "Failed to add point. Please try again.",
              "error"
            );
          }
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
          try {
            if (!selectedMapData) {
              mapManager.alert(
                "Warning",
                "Please select a map and add points before saving.",
                "warning"
              );
              return;
            }

            console.log("Selected Map Data:", selectedMapData);
            console.log("Selected Point Data:", selectedPointData);

            // สร้าง HTML สำหรับแสดงข้อมูล
            let pointsHtml = "<ul>";
            selectedPointData.forEach((point, index) => {
              pointsHtml += `<li>Point ${index + 1}: Name: ${
                point.name
              }, X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}</li>`;
            });
            pointsHtml += "</ul>";

            // เรียกใช้ SweetAlert2
            const result = await Swal.fire({
              title: "Confirm Save",
              html: `
                <div style="text-align: left;">
                  <p><strong>Map Name:</strong> ${selectedMapData.mapName}</p>
                  <p><strong>Points:</strong></p>
                  ${pointsHtml}
                </div>
              `,
              icon: "question",
              showCancelButton: true,
              confirmButtonText: "Save",
              cancelButtonText: "Cancel",
              confirmButtonColor: "#3085d6",
              cancelButtonColor: "#d33",
            });

            console.log("Swal Result:", result);

            if (result.isConfirmed) {
              const mapDataToSave = {
                ...selectedMapData,
                points: selectedPointData.map((point) => ({
                  name: point.name,
                  x: point.x,
                  y: point.y,
                  color: point.color,
                })),
              };

              console.log("Data to save:", mapDataToSave);
              await pointManager.saveMapDataToFirestore(mapDataToSave);
              Swal.fire("Saved!", "Your map data has been saved.", "success");
            } else {
              Swal.fire("Cancelled", "Save was cancelled", "info");
            }
          } catch (error) {
            console.error("Save error:", error);
            Swal.fire("Error", "Failed to save data", "error");
          }
        });

      document.addEventListener("DOMContentLoaded", () => {
        trilaterationUtils.startRealTimeUpdate();
      });
    };

    setupListeners();

    return () => {
      pointManager.stopRealTimeUpdates();

      // ตรวจสอบว่า element มีอยู่ก่อนจะลบ listener
      const updateMapNameBtn = document.getElementById("updateMapName");
      const mapSelect = document.getElementById("map-select");
      const mapUpload = document.getElementById("map-upload");
      const deleteMapBtn = document.getElementById("delete-map");
      const resetPointsBtn = document.getElementById("resetPoints");
      const showDistanceBtn = document.getElementById("ShowDistance");
      const deletePointBtn = document.getElementById("DeletePoint");
      const editPointBtn = document.getElementById("editPoint");
      const confirmSaveBtn = document.getElementById("confirmSave");
      const showCircleCheckbox = document.getElementById("showCircleCheckbox");

      if (updateMapNameBtn)
        updateMapNameBtn.removeEventListener("click", () => {});
      if (mapSelect) mapSelect.removeEventListener("change", () => {});
      if (mapUpload) mapUpload.removeEventListener("change", () => {});
      if (deleteMapBtn) deleteMapBtn.removeEventListener("click", () => {});
      if (resetPointsBtn) resetPointsBtn.removeEventListener("click", () => {});
      if (showDistanceBtn)
        showDistanceBtn.removeEventListener("click", () => {});
      if (deletePointBtn) deletePointBtn.removeEventListener("click", () => {});
      if (editPointBtn) editPointBtn.removeEventListener("click", () => {});
      if (confirmSaveBtn) confirmSaveBtn.removeEventListener("click", () => {});
      if (canvas) {
        canvas.removeEventListener("click", () => {});
        canvas.removeEventListener("mousemove", () => {});
      }
      if (showCircleCheckbox)
        showCircleCheckbox.removeEventListener("change", () => {});
    };
  }, [selectedMapData]);

  return (
    <>
      <div id="map-container">
        <div className="container">
          <canvas
            id="myCanvas"
            ref={canvasRef}
            width="1000px"
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
              <select id="pointSelect"></select>
              <button id="DeletePoint">🗑️ Delete Point</button>
              <select id="editPointSelect"></select>
              <input
                type="text"
                id="newPointName"
                placeholder="Enter new point name"
              />
              <button id="editPoint">✏️ Update Point Name</button>
            </div>
            <div className="controls-group">
              <button id="confirmSave">💾 Confirm Save to Firestore</button>
              <select id="point1Select"></select>
              <select id="point2Select"></select>
              <button id="ShowDistance">📏 Show Distance</button>
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
