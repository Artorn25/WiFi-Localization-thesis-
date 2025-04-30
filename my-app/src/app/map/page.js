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
  const canvas3DRef = useRef(null);
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
  const show3DMapRef = useRef(null);

  useEffect(() => {
    console.log("Map component useEffect started");
    const canvas = canvasRef.current;
    const canvas3D = canvas3DRef.current;
    const tooltip = document.getElementById("tooltip");

    if (!canvas || !canvas3D || !tooltip) {
      console.warn("Canvas, 3D canvas, or tooltip element not found");
      return;
    }

    const canvasUtils = new CanvasUtils(canvas, tooltip);
    const canvasUtils3D = new CanvasUtils(canvas3D, tooltip);
    const mapManager = new MapManager(mapSelectRef);
    const pointManager = new PointManager(canvasUtils);
    const trilaterationUtils = new TrilaterationUtils(
      canvasUtils,
      pointManager,
      mapManager
    );
    trilaterationUtils.canvasUtils3D = canvasUtils3D;

    pointManager.trilaterationUtils = trilaterationUtils;

    canvasUtils.initializeCanvas();
    mapManager.updateMapSelect();

    const setupListeners = () => {
      console.log("Setting up event listeners");

      const handleCanvasClick =
        (canvasInstance, canvasUtilsInstance, is3D) => async (event) => {
          console.log(`${is3D ? "3D" : "2D"} Canvas clicked, event:`, event);
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

          const rect = canvasInstance.getBoundingClientRect();
          const pixelX = event.clientX - rect.left;
          const pixelY = event.clientY - rect.top;
          const { x, y } = canvasUtilsInstance.toCartesian(pixelX, pixelY);
          console.log(`${is3D ? "3D" : "2D"} Canvas coordinates:`, {
            pixelX,
            pixelY,
            x,
            y,
          });

          try {
            if (pointManager.drawMode) {
              console.log(
                `Adding marker and point on ${is3D ? "3D" : "2D"} canvas`
              );
              await pointManager.addMarkerAndPoint(
                x,
                y,
                pointName,
                selectedIndex
              );
            } else {
              console.log(`Adding point only on ${is3D ? "3D" : "2D"} canvas`);
              await pointManager.addPoint(x, y, pointName, selectedIndex);
            }

            document.getElementById("pointName").value = "";
            console.log("Refreshing map with index:", selectedIndex);
            trilaterationUtils.refreshMap(
              selectedIndex,
              canvas3D.style.display !== "none"
            );
          } catch (error) {
            console.error(
              `Error adding point on ${is3D ? "3D" : "2D"} canvas:`,
              error
            );
            if (error.message !== "ALREADY_HANDLED") {
              mapManager.alert(
                "Error",
                "Failed to add point. Please try again.",
                "error"
              );
            }
          }
        };

      const handleCanvasMouseMove =
        (canvasInstance, canvasUtilsInstance, is3D) => (event) => {
          const rect = canvasInstance.getBoundingClientRect();
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
            canvasUtilsInstance.showCircleTooltip(event);
          }
        };

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
            canvas3D.style.display = "none";
            show3DMapRef.current.style.display = "none";
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
            canvasUtils3D.img.src = mapManager.maps[selectedIndex].src.replace(
              ".png",
              "_3D.png"
            );
            pointManager.points =
              pointManager.pointsPerMap[selectedIndex] || [];
            pointManager.markerCoordinates =
              pointManager.markerCoordinatesPerMap[selectedIndex] || [];
            try {
              trilaterationUtils.refreshMap(selectedIndex);
              trilaterationUtils.startRealTimeUpdate();
              show3DMapRef.current.style.display = "block";
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
            canvas3D.style.display = "none";
            show3DMapRef.current.style.display = "none";
          }
        });
      } else {
        console.warn("Element map-select not found");
      }

      if (show3DMapRef.current) {
        show3DMapRef.current.addEventListener("click", () => {
          console.log("Show 3D map clicked");
          if (canvas3D.style.display === "none") {
            canvas.style.display = "none";
            canvas3D.style.display = "block";
            show3DMapRef.current.textContent = "Show 2D Map";
            trilaterationUtils.refreshMap(mapSelectRef.current.value, true);
          } else {
            canvas.style.display = "block";
            canvas3D.style.display = "none";
            show3DMapRef.current.textContent = "Show 3D Map";
            trilaterationUtils.refreshMap(mapSelectRef.current.value, false);
          }
        });
      } else {
        console.warn("Element show3DMap not found");
      }

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
                    canvasUtils3D.img.src = e.target.result.replace(
                      ".png",
                      "_3D.png"
                    );
                    trilaterationUtils.refreshMap(index);
                    trilaterationUtils.startRealTimeUpdate();
                    show3DMapRef.current.style.display = "block";
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
                  canvasUtils3D.img.src = mapSrc.replace(".png", "_3D.png");
                  trilaterationUtils.refreshMap(index);
                  trilaterationUtils.startRealTimeUpdate();
                  show3DMapRef.current.style.display = "block";
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
          canvas3D.style.display = "none";
          show3DMapRef.current.style.display = "none";

          if (mapManager.maps.length > 0) {
            mapSelect.value = "0";
            const newIndex = mapSelect.value;
            canvasUtils.img.src = mapManager.maps[newIndex].src;
            canvasUtils3D.img.src = mapManager.maps[newIndex].src.replace(
              ".png",
              "_3D.png"
            );
            pointManager.points = pointManager.pointsPerMap[newIndex] || [];
            pointManager.markerCoordinates =
              pointManager.markerCoordinatesPerMap[newIndex] || [];
            trilaterationUtils.refreshMap(newIndex);
            show3DMapRef.current.style.display = "block";
          } else {
            canvasUtils.resetCanvas();
            canvas3D.style.display = "none";
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
          canvasUtils3D.resetCanvas();
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
        });
      } else {
        console.warn("Element editPoint not found");
      }

      if (canvas) {
        canvas.addEventListener(
          "click",
          handleCanvasClick(canvas, canvasUtils, false)
        );
        canvas.addEventListener(
          "mousemove",
          handleCanvasMouseMove(canvas, canvasUtils, false)
        );
      } else {
        console.warn("Canvas element not found");
      }

      if (canvas3D) {
        canvas3D.addEventListener(
          "click",
          handleCanvasClick(canvas3D, canvasUtils3D, true)
        );
        canvas3D.addEventListener(
          "mousemove",
          handleCanvasMouseMove(canvas3D, canvasUtils3D, true)
        );
      } else {
        console.warn("3D Canvas element not found");
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
          canvasUtils3D.showCircles = !event.target.checked;
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
            const selectedIndex = mapSelectRef.current?.value;
            const selectedMapData = {
              mapIndex: selectedIndex,
              mapName: mapManager.maps[selectedIndex]?.name,
              mapSrc: mapManager.maps[selectedIndex]?.src,
              // เพิ่ม mapSrc3D โดยแทนที่ .png ด้วย _3D.png
              mapSrc3D: mapManager.maps[selectedIndex]?.src.replace(
                ".png",
                "_3D.png"
              ),
              points: pointManager.pointsPerMap[selectedIndex] || [],
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
              pointsHtml += `<li>Point ${index + 1}: Name: ${
                point.name
              }, X: ${point.x.toFixed(2)}, Y: ${point.y.toFixed(2)}</li>`;
            });
            pointsHtml += "</ul>";

            const result = await Swal.fire({
              title: "Confirm Save",
              html: `
                <div style="text-align: left;">
                  <p><strong>Map Name:</strong> ${selectedMapData.mapName}</p>
                  <p><strong>2D Map Source:</strong> ${selectedMapData.mapSrc}</p>
                  <p><strong>3D Map Source:</strong> ${selectedMapData.mapSrc3D}</p>
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
        show3DMap: show3DMapRef.current,
      };

      Object.entries(elements).forEach(([key, element]) => {
        if (element) {
          element.removeEventListener("click", () => {});
          element.removeEventListener("change", () => {});
        }
      });

      const mapSamples = document.querySelectorAll(".map-sample");
      mapSamples.forEach((img) => {
        img.removeEventListener("click", () => {});
      });

      if (canvas) {
        canvas.removeEventListener("click", () => {});
        canvas.removeEventListener("mousemove", () => {});
      }

      if (canvas3D) {
        canvas3D.removeEventListener("click", () => {});
        canvas3D.removeEventListener("mousemove", () => {});
      }
    };
  }, []);

  return (
    <>
      <div id="map-container">
        <div className="map-container">
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
          <div id="map-show">
            <label className="checkbox-control">
              <input
                type="checkbox"
                id="showCircleCheckbox"
                ref={showCircleCheckboxRef}
                name="showCircle"
                value="show"
              />
              <span className="checkmark"></span>
              <span className="checkbox-label">Hide circle area</span>
            </label>
          </div>
          <div id="map-controls">
            <div className="controls-group">
              <label htmlFor="mapName">Map Name:</label>
              <select className="select" id="map-select" ref={mapSelectRef}>
                <option value="">Select Map</option>
              </select>
              <input type="text" id="mapName" placeholder="Enter map name" />
              <button className="button" id="updateMapName" ref={updateMapNameRef}>
                Update Map Name
              </button>
              <button className="button" id="delete-map" ref={deleteMapRef}>
                Delete Map
              </button>
              <input
                type="text"
                id="pointName"
                placeholder="Enter point name"
              />
              <button className="button" id="resetPoints" ref={resetPointsRef}>
                Reset
              </button>
              <select className="select" id="pointSelect"></select>
              <button className="button" id="DeletePoint" ref={deletePointRef}>
                Delete Point
              </button>
              <select className="select" id="editPointSelect"></select>
              <input
                type="text"
                id="newPointName"
                placeholder="Enter new point name"
              />
              <button className="button" id="editPoint" ref={editPointRef}>
                Update Point Name
              </button>
              <button className="button"
                id="show3DMap"
                ref={show3DMapRef}
                style={{ display: "none" }}
              >
                Show 3D Map
              </button>
            </div>
            <div className="controls-group">
              <button className="button" id="confirmSave" ref={confirmSaveRef}>
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
        <h3>Example Maps to use</h3>
        <div className="map-samples">
          <NextImage
            src="/map/floor4.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/floor4.png"
            width={400}
            height={200}
          />
          <NextImage
            src="/map/floor1.png"
            alt="Sample Map 2"
            className="map-sample"
            data-map-src="/map/floor1.png"
            width={400}
            height={200}
          />
        </div>
      </div>
    </>
  );
}
