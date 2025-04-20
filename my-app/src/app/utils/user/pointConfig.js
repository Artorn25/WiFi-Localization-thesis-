import { dbRef, dbfs } from "./firebaseConfig";
import { onValue, off } from "firebase/database";

export class PointManager {
  constructor(canvasUtils, trilaterationUtils) {
    this.canvasUtils = canvasUtils;
    this.trilaterationUtils = trilaterationUtils;
    this.pointsPerMap = [];
    this.markerCoordinatesPerMap = {};
    this.points = [];
    this.markerCoordinates = [];
    this.drawMode = true;
    this.listeners = [];
    if (this.pointsPerMap[""]) {
      delete this.pointsPerMap[""];
    }
  }

  validatePoint(pointName) {
    if (!pointName) {
      this.canvasUtils.alert(
        "Warning",
        "Please enter a name for the point.",
        "warning"
      );
      return false;
    }
    for (const mapIndex in this.pointsPerMap) {
      if (
        this.pointsPerMap[mapIndex].some((point) => point.name === pointName)
      ) {
        this.canvasUtils.alert(
          "Error",
          "Point name must be unique across all maps.",
          "error"
        );
        return false;
      }
    }
    return true;
  }

  addMarkerAndPoint(x, y, name, selectedIndex) {
    if (!this.markerCoordinatesPerMap[selectedIndex])
      this.markerCoordinatesPerMap[selectedIndex] = [];
    this.markerCoordinatesPerMap[selectedIndex].push({ x, y });
    this.canvasUtils.drawMarker(x, y, "blue");
    this.addPoint(x, y, name, selectedIndex);
  }

  updatePointSelects() {
    const selects = [
      "pointSelect",
      "point1Select",
      "point2Select",
      "editPointSelect",
    ].map((id) => document.getElementById(id));
    selects.forEach((select) => {
      if (select) select.innerHTML = "";
    });

    this.pointsPerMap.forEach((points) => {
      if (points) {
        points.forEach((point) => {
          const option = document.createElement("option");
          option.value = point.name;
          option.textContent = point.name;
          selects.forEach((select) => {
            if (select) select.appendChild(option.cloneNode(true));
          });
        });
      }
    });
  }

  startRealTimeUpdate(point, selectedIndex) {
    const routerSSID = point.name;
    const listener = onValue(
      dbRef,
      (snapshot) => {
        if (snapshot.exists()) {
          const nodes = snapshot.val();
          const allData = [];

          Object.keys(nodes).forEach((nodeKey) => {
            const nodeData = nodes[nodeKey];
            Object.keys(nodeData).forEach((routerKey) => {
              if (routerKey.startsWith("Router-")) {
                const routerData = nodeData[routerKey];
                if (routerData.ssid === routerSSID) {
                  if (
                    routerData.rssi !== undefined &&
                    routerData.distance !== undefined &&
                    nodeData.Mac !== undefined
                  ) {
                    allData.push({
                      rssi: routerData.rssi,
                      distance: routerData.distance,
                      mac: nodeData.Mac,
                    });
                  }
                }
              }
            });
          });

          console.log(`Real-time data for SSID ${routerSSID}:`, allData);

          if (allData.length) {
            point.data = allData;
            this.updatePointData(point.name, allData, selectedIndex);
          } else {
            this.canvasUtils.alert(
              "Warning",
              `No data found in Firebase for SSID: ${routerSSID}. Circles removed.`,
              "warning"
            );
            point.data = [];
            this.updatePointData(point.name, [], selectedIndex);
          }
        } else {
          this.canvasUtils.alert(
            "Error",
            "No data available in Firebase. Circles removed.",
            "error"
          );
          point.data = [];
          this.updatePointData(point.name, [], selectedIndex);
        }
      },
      (error) => {
        console.error("Error listening to Firebase:", error);
        this.canvasUtils.alert(
          "Error",
          "Failed to listen to Firebase updates.",
          "error"
        );
      }
    );

    this.listeners.push({ pointName: point.name, listener });
  }

  stopRealTimeUpdates() {
    this.listeners.forEach(({ pointName, listener }) => {
      off(dbRef, "value", listener);
      console.log(`Stopped listening for point: ${pointName}`);
    });
    this.listeners = [];
  }

  updatePointData(pointName, data, selectedIndex) {
    if (!this.pointsPerMap[selectedIndex]) return;
  
    // กรองข้อมูลที่ไม่สมบูรณ์
    const validData = data.filter(
      item => item.rssi && item.distance > 0 && item.mac
    );
  
    this.pointsPerMap[selectedIndex].forEach((point) => {
      if (point.name === pointName) {
        point.data = validData;
        console.log(`Updated ${pointName} with ${validData.length} valid records`);
      }
    });
  }
}