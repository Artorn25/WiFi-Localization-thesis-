import { dbRef, dbfs } from "./firebaseConfig";
import { onValue, off } from "firebase/database";
import { collection, doc, setDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";

export class PointManager {
  constructor(canvasUtils, trilaterationUtils) {
    this.canvasUtils = canvasUtils;
    this.trilaterationUtils = trilaterationUtils;
    this.pointsPerMap = []; // เปลี่ยนเป็น array เหมือนไฟล์ 2
    this.markerCoordinatesPerMap = {};
    this.points = [];
    this.markerCoordinates = [];
    this.drawMode = true;
    this.listeners = [];
    if (this.pointsPerMap[""]) {
      delete this.pointsPerMap[""];
    }
  }

  async checkDuplicatePointName(pointName) {
    try {
      const pointsRef = collection(dbfs, "points");
      const q = query(pointsRef, where("ssid", "==", pointName));
      const querySnapshot = await getDocs(q);
      return !querySnapshot.empty;
    } catch (error) {
      console.error("Error checking duplicate point name:", error);
      return false;
    }
  }

  async validatePoint(pointName) {
    if (!pointName) {
      this.canvasUtils.alert(
        "Warning",
        "Please enter a name for the point.",
        "warning"
      );
      return false;
    }
    const isDuplicate = await this.checkDuplicatePointName(pointName);
    if (isDuplicate) {
      this.canvasUtils.alert(
        "Error",
        "Point name already exists in Firestore.",
        "error"
      );
      return false;
    }
    for (let mapIndex = 0; mapIndex < this.pointsPerMap.length; mapIndex++) {
      if (this.pointsPerMap[mapIndex]?.some((point) => point.name === pointName)) {
        this.canvasUtils.alert(
          "Error",
          "Point name must be unique across all maps locally.",
          "error"
        );
        return false;
      }
    }
    return true;
  }

  async savePointToFirestore(x, y, name, color) {
    try {
      const isDuplicate = await this.checkDuplicatePointName(name);
      if (isDuplicate) {
        throw new Error("Point name already exists in Firestore.");
      }
      const pointsRef = collection(dbfs, "points");
      await setDoc(doc(pointsRef, name), {
        coordinates: { x, y },
        createdAt: serverTimestamp(),
        details: {
          color,
          scaleX: this.canvasUtils.scaleX,
          scaleY: this.canvasUtils.scaleY,
        },
        mapIndex: document.getElementById("map-select")?.value,
        ssid: name,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving point to Firestore: ", error);
      throw error;
    }
  }

  addMarkerAndPoint(x, y, name, selectedIndex) {
    if (!this.markerCoordinatesPerMap[selectedIndex])
      this.markerCoordinatesPerMap[selectedIndex] = [];
    this.markerCoordinatesPerMap[selectedIndex].push({ x, y, name });
    this.canvasUtils.drawMarker(x, y, "blue");
    if (this.trilaterationUtils.canvasUtils3D) {
      this.trilaterationUtils.canvasUtils3D.drawMarker(x, y, "blue");
    }
    this.addPoint(x, y, name, selectedIndex);
  }

  async addPoint(x, y, name, selectedIndex) {
    if (!(await this.validatePoint(name))) {
      return;
    }
    if (!this.pointsPerMap[selectedIndex]) {
      this.pointsPerMap[selectedIndex] = [];
    }
    const color = this.drawMode ? "blue" : "red";
    this.canvasUtils.drawPoint(x, y, name, color);
    if (this.trilaterationUtils.canvasUtils3D) {
      this.trilaterationUtils.canvasUtils3D.drawPoint(x, y, name, color);
    }
    const newPoint = {
      x, y, name, color, distance: 0, rssi: "Not available", data: []
    };
    this.pointsPerMap[selectedIndex].push(newPoint);
    this.points = this.pointsPerMap[selectedIndex];
    await this.savePointToFirestore(x, y, name, color);
    this.startRealTimeUpdate(newPoint, selectedIndex);
    this.updatePointSelects();
    this.canvasUtils.alert(
      "Success",
      `Point "${name}" added successfully at (${x.toFixed(2)}, ${y.toFixed(2)})`,
      "success"
    );
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
    if (!this.pointsPerMap[selectedIndex]) {
      this.pointsPerMap[selectedIndex] = [];
    }
    const validData = data.filter(
      item => item.rssi && item.distance > 0 && item.mac
    );
    this.pointsPerMap[selectedIndex].forEach((point) => {
      if (point.name === pointName) {
        point.data = validData;
        console.log(`Updated ${pointName} with ${validData.length} valid records`);
      }
    });
    this.points = this.pointsPerMap[selectedIndex] || [];
    if (this.trilaterationUtils) {
      this.trilaterationUtils.refreshMap(selectedIndex, true);
    }
  }

  resetPointsForMap(selectedIndex) {
    this.pointsPerMap[selectedIndex] = [];
    this.points = [];
    this.markerCoordinatesPerMap[selectedIndex] = [];
    this.markerCoordinates = [];
    this.stopRealTimeUpdates();
  }
}