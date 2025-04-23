"use client";
import { useEffect, useRef } from "react";
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
  const updateMapNameRef = useRef(null);
  const mapSelectRef = useRef(null);
  const mapUploadRef = useRef(null);
  const deleteMapRef = useRef(null);
  const resetPointsRef = useRef(null);
  const showDistanceRef = useRef(null);
  const deletePointRef = useRef(null);
  const editPointRef = useRef(null);
  const confirmSaveRef = useRef(null);
  const showCircleCheckboxRef = useRef(null);

  useEffect(() => {
    console.log("Map component useEffect started");
    const canvas = canvasRef.current;
    const tooltip = document.getElementById("tooltip");

    if (!canvas || !tooltip) {
      console.warn("Canvas or tooltip element not found");
      return;
    }

    const canvasUtils = new CanvasUtils(canvas, tooltip);
    const mapManager = new MapManager(mapSelectRef);
    const pointManager = new PointManager(canvasUtils);
    const trilaterationUtils = new TrilaterationUtils(
      canvasUtils,
      pointManager,
      mapManager
    );

    pointManager.trilaterationUtils = trilaterationUtils;

    canvasUtils.initializeCanvas();
    mapManager.updateMapSelect();

    const setupListeners = () => {
      console.log("Setting up event listeners");
      if (updateMapNameRef.current) {
        updateMapNameRef.current.addEventListener("click", () => {
          const mapSelect = mapSelectRef.current;
          const selectedIndex = mapSelect?.value;
          const newMapName = document.getElementById("mapName")?.value;
          console.log("Update map name clicked:", {
            selectedIndex,
            newMapName,
          });

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
        });
      } else {
        console.warn("Element updateMapName not found");
      }

      if (mapSelectRef.current) {
        mapSelectRef.current.addEventListener("change", async (event) => {
          const selectedIndex = event.target.value;
          console.log("Map selected:", {
            selectedIndex,
            maps: mapManager.maps,
          });
          if (mapManager.maps.length === 0) {
            mapManager.alert(
              "Warning",
              "No maps available. Please upload or select a map.",
              "warning"
            );
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
            canvasUtils.resetCanvas();
          }
        });
      } else {
        console.warn("Element map-select not found");
      }

      if (mapUploadRef.current) {
        mapUploadRef.current.addEventListener("change", (event) => {
          const file = event.target.files[0];
          console.log("Map upload triggered:", file?.name);
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
                    mapSelectRef.current.value = index;
                    canvasUtils.img.src = e.target.result;
                    trilaterationUtils.refreshMap(index);
                    trilaterationUtils.startRealTimeUpdate();
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
      } else {
        console.warn("Element map-upload not found");
      }

      const mapSamples = document.querySelectorAll(".map-sample");
      if (mapSamples.length > 0) {
        mapSamples.forEach((img) => {
          img.addEventListener("click", () => {
            const mapSrc = img.getAttribute("data-map-src");
            console.log("Sample map clicked:", mapSrc);
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
                  mapSelectRef.current.value = index;
                  canvasUtils.img.src = mapSrc;
                  trilaterationUtils.refreshMap(index);
                  trilaterationUtils.startRealTimeUpdate();
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
      } else {
        console.warn("No map-sample elements found");
      }

      if (deleteMapRef.current) {
        deleteMapRef.current.addEventListener("click", () => {
          const mapSelect = mapSelectRef.current;
          const selectedIndex = mapSelect?.value;
          console.log("Delete map clicked:", { selectedIndex });
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
            trilaterationUtils.refreshMap(newIndex);
          } else {
            canvasUtils.resetCanvas();
          }

          console.log("Map deleted, maps:", mapManager.maps);
        });
      } else {
        console.warn("Element delete-map not found");
      }

      if (resetPointsRef.current) {
        resetPointsRef.current.addEventListener("click", () => {
          const selectedIndex = mapSelectRef.current?.value;
          console.log("Reset points clicked:", { selectedIndex });
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

          console.log("Points reset, maps:", mapManager.maps);
        });
      } else {
        console.warn("Element resetPoints not found");
      }

      if (showDistanceRef.current) {
        showDistanceRef.current.addEventListener("click", () => {
          const index1 = document.getElementById("point1Select")?.value;
          const index2 = document.getElementById("point2Select")?.value;
          console.log("Show distance clicked:", { index1, index2 });
          pointManager.showDistance(index1, index2);
        });
      } else {
        console.warn("Element ShowDistance not found");
      }

      if (deletePointRef.current) {
        deletePointRef.current.addEventListener("click", () => {
          const selectedPointName =
            document.getElementById("pointSelect")?.value;
          const mapIndex = mapSelectRef.current?.value;
          console.log("Delete point clicked:", { selectedPointName, mapIndex });
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
        });
      } else {
        console.warn("Element DeletePoint not found");
      }

      if (editPointRef.current) {
        editPointRef.current.addEventListener("click", () => {
          const selectedPointName =
            document.getElementById("editPointSelect")?.value;
          const newPointName = document.getElementById("newPointName")?.value;
          const mapIndex = mapSelectRef.current?.value;
          console.log("Edit point clicked:", {
            selectedPointName,
            newPointName,
            mapIndex,
          });
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
        });
      } else {
        console.warn("Element editPoint not found");
      }

      if (canvas) {
        canvas.addEventListener("click", async (event) => {
          console.log("Canvas clicked, event:", event);
          const pointName = document.getElementById("pointName")?.value.trim();
          console.log("Point name:", pointName, "maps:", mapManager.maps);
          if (mapManager.maps.length === 0) {
            mapManager.alert(
              "Info",
              "Please upload or select a map before adding points.",
              "question"
            );
            return;
          }

          const selectedIndex = mapSelectRef.current?.value;
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

          const rect = canvas.getBoundingClientRect();
          const pixelX = event.clientX - rect.left;
          const pixelY = event.clientY - rect.top;
          const { x, y } = canvasUtils.toCartesian(pixelX, pixelY);
          console.log("Canvas coordinates:", { pixelX, pixelY, x, y });

          try {
            if (pointManager.drawMode) {
              console.log("Adding marker and point");
              await pointManager.addMarkerAndPoint(
                x,
                y,
                pointName,
                selectedIndex
              );
            } else {
              console.log("Adding point only");
              await pointManager.addPoint(x, y, pointName, selectedIndex);
            }

            document.getElementById("pointName").value = "";
            console.log("Refreshing map with index:", selectedIndex);
            trilaterationUtils.refreshMap(selectedIndex);
          } catch (error) {
            console.error("Error adding point:", error);
            if (error.message !== "ALREADY_HANDLED") {
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
            tooltip.innerText = `Name: ${hoveredPoint.name
              }\nDistance: ${hoveredPoint.distance.toFixed(2)} m\nRSSI: ${hoveredPoint.rssi
              } dBm`;
            tooltip.style.display = "block";
            tooltip.style.left = `${event.pageX + 10}px`;
            tooltip.style.top = `${event.pageY + 10}px`;
          } else {
            canvasUtils.showCircleTooltip(event);
          }
        });
      } else {
        console.warn("Canvas element not found");
      }

      if (showCircleCheckboxRef.current) {
        showCircleCheckboxRef.current.addEventListener("change", (event) => {
          const selectedIndex = mapSelectRef.current?.value;
          console.log("Show circle checkbox changed:", event.target.checked);
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
      } else {
        console.warn("Element showCircleCheckbox not found");
      }

      if (confirmSaveRef.current) {
        confirmSaveRef.current.addEventListener("click", async () => {
          console.log("Confirm save clicked");
          try {
            const selectedMapData = {
              mapIndex: mapSelectRef.current?.value,
              mapName: mapManager.maps[mapSelectRef.current?.value]?.name,
              mapSrc: mapManager.maps[mapSelectRef.current?.value]?.src,
              points:
                pointManager.pointsPerMap[mapSelectRef.current?.value] || [],
            };

            if (!selectedMapData.mapIndex || !selectedMapData.mapName) {
              mapManager.alert(
                "Warning",
                "Please select a map and add points before saving.",
                "warning"
              );
              return;
            }

            const selectedPointData =
              pointManager.pointsPerMap[selectedMapData.mapIndex] || [];

            console.log("Selected Map Data:", selectedMapData);
            console.log("Selected Point Data:", selectedPointData);

            let pointsHtml = "<ul>";
            selectedPointData.forEach((point, index) => {
              pointsHtml += `<li>Point ${index + 1}: Name: ${point.name
                }, X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}</li>`;
            });
            pointsHtml += "</ul>";

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
      } else {
        console.warn("Element confirmSave not found");
      }
    };

    const elementIds = [
      "mapName",
      "pointName",
      "pointSelect",
      "editPointSelect",
      "newPointName",
      "tooltip",
      "distanceDisplay",
    ];
    elementIds.forEach((id) => {
      if (!document.getElementById(id)) {
        console.warn(`Element with ID ${id} not found in DOM`);
      }
    });

    setupListeners();
    trilaterationUtils.startRealTimeUpdate();

    return () => {
      console.log("Cleaning up event listeners");
      pointManager.stopRealTimeUpdates();

      const elements = {
        updateMapName: updateMapNameRef.current,
        mapSelect: mapSelectRef.current,
        mapUpload: mapUploadRef.current,
        deleteMap: deleteMapRef.current,
        resetPoints: resetPointsRef.current,
        showDistance: showDistanceRef.current,
        deletePoint: deletePointRef.current,
        editPoint: editPointRef.current,
        confirmSave: confirmSaveRef.current,
        showCircleCheckbox: showCircleCheckboxRef.current,
      };

      Object.entries(elements).forEach(([key, element]) => {
        if (element) {
          element.removeEventListener("click", () => { });
          element.removeEventListener("change", () => { });
        }
      });

      const mapSamples = document.querySelectorAll(".map-sample");
      mapSamples.forEach((img) => {
        img.removeEventListener("click", () => { });
      });

      if (canvas) {
        canvas.removeEventListener("click", () => { });
        canvas.removeEventListener("mousemove", () => { });
      }
    };
  }, []);

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
          <div id="map-show" >
            <form action="">
              <input
                type="checkbox"
                id="showCircleCheckbox"
                ref={showCircleCheckboxRef}
                name="showCircle"
                value="show"
              />
              <label htmlFor="showCircleCheckbox">Hide circle area</label>
              <br />
            </form>
          </div>
          <div id="map-controls">
            <div className="controls-group">
              <label htmlFor="mapName">Map Name:</label>
              <select id="map-select" ref={mapSelectRef}>
                <option value="">Select Map</option>
              </select>
              <input type="text" id="mapName" placeholder="Enter map name" />
              <button id="updateMapName" ref={updateMapNameRef}>
                Update Map Name
              </button>
              <button id="delete-map" ref={deleteMapRef}>
                Delete Map
              </button>
              <input
                type="text"
                id="pointName"
                placeholder="Enter point name"
              />
              <button id="resetPoints" ref={resetPointsRef}>
                Reset
              </button>
              <select id="pointSelect"></select>
              <button id="DeletePoint" ref={deletePointRef}>
                Delete Point
              </button>
              <select id="editPointSelect"></select>
              <input
                type="text"
                id="newPointName"
                placeholder="Enter new point name"
              />
              <button id="editPoint" ref={editPointRef}>
                Update Point Name
              </button>
            </div>
            <div className="controls-group">
              <button id="confirmSave" ref={confirmSaveRef}>
                Confirm Save
              </button>
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
