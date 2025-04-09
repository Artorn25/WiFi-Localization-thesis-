"use client";
import { useEffect, useRef } from "react";
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
      });

      document
        .getElementById("map-select")
        .addEventListener("change", async (event) => {
          const selectedIndex = event.target.value;
          if (selectedIndex) {
            pointManager.stopRealTimeUpdates();

            canvasUtils.img.src = mapManager.maps[selectedIndex].src;
            pointManager.points =
              pointManager.pointsPerMap[selectedIndex] || [];
            pointManager.markerCoordinates =
              pointManager.markerCoordinatesPerMap[selectedIndex] || [];

            console.log(
              `Loaded points for map ${selectedIndex}:`,
              pointManager.points
            ); // ดีบัก

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
          }
        });

      document
        .getElementById("map-upload")
        .addEventListener("change", (event) => {
          const file = event.target.files[0];
          if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
              mapManager.editMapName(e.target.result).then((index) => {
                if (index !== null) {
                  document.getElementById("map-select").value = index;
                  canvasUtils.img.src = e.target.result;
                  trilaterationUtils.refreshMap(index);
                  trilaterationUtils.startRealTimeUpdate();
                }
              });
            };
            reader.readAsDataURL(file);
          }
        });

      document.querySelectorAll(".map-sample").forEach((img) => {
        img.addEventListener("click", () => {
          const mapSrc = img.getAttribute("data-map-src");
          mapManager.editMapName(mapSrc).then((index) => {
            if (index !== null) {
              document.getElementById("map-select").value = index;
              canvasUtils.img.src = mapSrc;
              trilaterationUtils.refreshMap(index);
              trilaterationUtils.startRealTimeUpdate();
            }
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
        // ลบจุดที่เกี่ยวข้องกับแผนที่ที่ถูกลบ
        delete pointManager.pointsPerMap[selectedIndex];
        delete pointManager.markerCoordinatesPerMap[selectedIndex];
        pointManager.savePointsToStorage();
        trilaterationUtils.refreshMap(mapSelect.value);
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
        pointManager.savePointsToStorage();
        trilaterationUtils.refreshMap(selectedIndex);
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
      });

      canvas.addEventListener("click", async (event) => {
        const pointName = document.getElementById("pointName").value;
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
        if (!selectedIndex) {
          mapManager.alert(
            "Warning",
            "Please select a map before adding a point.",
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
      canvas.removeEventListener("click", () => {});
      canvas.removeEventListener("mousemove", () => {});
      document
        .getElementById("showCircleCheckbox")
        .removeEventListener("change", () => {});
      document.removeEventListener("DOMContentLoaded", () => {});
    };
  }, []);

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
