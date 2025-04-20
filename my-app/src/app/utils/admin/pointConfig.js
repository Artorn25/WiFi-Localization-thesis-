import { dbRef, dbfs } from "./firebaseConfig";
import { onValue, off } from "firebase/database";
import {
  collection,
  doc,
  setDoc,
  serverTimestamp,
  query,
  where,
  getDocs,
} from "firebase/firestore";

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

  // ฟังก์ชันตรวจสอบชื่อจุดซ้ำใน Firestore
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

    // ตรวจสอบชื่อซ้ำใน Firestore
    const isDuplicate = await this.checkDuplicatePointName(pointName);
    if (isDuplicate) {
      this.canvasUtils.alert(
        "Error",
        "Point name already exists in Firestore. Please choose a different name.",
        "error"
      );
      return false;
    }

    // ตรวจสอบชื่อซ้ำในหน่วยความจำท้องถิ่น
    for (const mapIndex in this.pointsPerMap) {
      if (
        this.pointsPerMap[mapIndex].some((point) => point.name === pointName)
      ) {
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

  addMarkerAndPoint(x, y, name, selectedIndex) {
    if (!this.markerCoordinatesPerMap[selectedIndex])
      this.markerCoordinatesPerMap[selectedIndex] = [];
    this.markerCoordinatesPerMap[selectedIndex].push({ x, y });
    this.canvasUtils.drawMarker(x, y, "blue");
    this.addPoint(x, y, name, selectedIndex);
  }

  async addPoint(x, y, name, selectedIndex) {
    console.log("Adding point:", { name, selectedIndex });

    // ตรวจสอบชื่อจุด
    if (!name || name.trim() === "") {
      console.warn("Empty point name");
      this.canvasUtils.alert(
        "Warning",
        "Please enter a name for the point.",
        "warning"
      );
      throw new Error("ALREADY_HANDLED");
    }

    // ตรวจสอบว่า selectedIndex ถูกต้อง
    if (
      selectedIndex === undefined ||
      selectedIndex === null ||
      selectedIndex === ""
    ) {
      console.error("Invalid selectedIndex:", selectedIndex);
      this.canvasUtils.alert(
        "Error",
        "Invalid map index. Please select a map first.",
        "error"
      );
      throw new Error("ALREADY_HANDLED");
    }
    // ตรวจสอบชื่อซ้ำใน Firestore
    const isDuplicate = await this.checkDuplicatePointName(name);
    if (isDuplicate) {
      this.canvasUtils.alert(
        "Error",
        "Point name already exists in Firestore. Please choose a different name.",
        "error"
      );
      throw new Error("ALREADY_HANDLED");
    }

    // ตรวจสอบชื่อซ้ำในหน่วยความจำ
    if (
      this.pointsPerMap[selectedIndex]?.some((point) => point.name === name)
    ) {
      this.canvasUtils.alert(
        "Error",
        "Point name must be unique across all maps locally.",
        "error"
      );
      throw new Error("ALREADY_HANDLED");
    }

    // สร้างจุดใหม่
    const color = this.drawMode ? "blue" : "red";
    if (!this.pointsPerMap[selectedIndex]) {
      this.pointsPerMap[selectedIndex] = [];
    }

    this.canvasUtils.drawPoint(x, y, name, color);
    const newPoint = {
      x,
      y,
      name,
      color,
      distance: 0,
      rssi: "Not available",
      data: [],
    };

    this.pointsPerMap[selectedIndex].push(newPoint);
    this.points = this.pointsPerMap[selectedIndex];
    this.startRealTimeUpdate(newPoint, selectedIndex);
    this.updatePointSelects();

    // แสดง alert เมื่อเพิ่มจุดสำเร็จ
    this.canvasUtils.alert(
      "Success",
      `Point "${name}" added successfully at (${x.toFixed(2)}, ${y.toFixed(
        2
      )})`,
      "success"
    );
  }

  async savePointToFirestore(x, y, name, color) {
    try {
      // ตรวจสอบชื่อซ้ำก่อนบันทึก
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
        mapIndex: document.getElementById("map-select").value,
        ssid: name,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error saving point to Firestore: ", error);
      throw error;
    }
  }

  async saveMapDataToFirestore(mapData) {
    try {
      if (!mapData || !mapData.mapName) {
        throw new Error("Invalid map data");
      }

      const mapsRef = collection(dbfs, "maps");
      const mapDocRef = doc(mapsRef, mapData.mapName);

      const dataToSave = {
        mapIndex: mapData.mapIndex,
        mapName: mapData.mapName,
        mapSrc: mapData.mapSrc,
        points: mapData.points.map((point) => ({
          name: point.name,
          x: point.x,
          y: point.y,
          color: point.color,
          distance: point.distance || 0,
          rssi: point.rssi || "Not available",
          data: point.data || [],
        })),
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(mapDocRef, dataToSave, { merge: true });
      console.log("Map saved successfully:", mapData.mapName);
      return true;
    } catch (error) {
      console.error("Error saving map:", error);
      throw error;
    }
  }

  showDistance(index1, index2) {
    if (index1 === index2) {
      this.canvasUtils.alert(
        "Error",
        "Cannot measure distance between the same point.",
        "error"
      );
      return;
    }
    if (index1 && index2) {
      const point1 = this.points[index1];
      const point2 = this.points[index2];
      const dx = (point2.x - point1.x) * this.canvasUtils.scaleX;
      const dy = (point2.y - point1.y) * this.canvasUtils.scaleY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      document.getElementById(
        "distanceDisplay"
      ).innerText = `Distance between ${point1.name} and ${
        point2.name
      }: ${distance.toFixed(2)} meters`;
    }
  }

  deletePoint(selectedPointName, mapIndex) {
    if (!selectedPointName) {
      this.canvasUtils.alert(
        "Info",
        "Please select a point to delete.",
        "question"
      );
      return;
    }
    if (!this.pointsPerMap[mapIndex]) {
      this.canvasUtils.alert(
        "Info",
        "No points available for the selected map.",
        "question"
      );
      return;
    }

    const listenerIndex = this.listeners.findIndex(
      (l) => l.pointName === selectedPointName
    );
    if (listenerIndex !== -1) {
      off(dbRef, "value", this.listeners[listenerIndex].listener);
      this.listeners.splice(listenerIndex, 1);
    }

    this.pointsPerMap[mapIndex] = this.pointsPerMap[mapIndex].filter(
      (point) => point.name !== selectedPointName
    );
    if (this.markerCoordinatesPerMap[mapIndex]) {
      this.markerCoordinatesPerMap[mapIndex] = this.markerCoordinatesPerMap[
        mapIndex
      ].filter((marker) => marker.name !== selectedPointName);
    }
    this.points = this.pointsPerMap[mapIndex];
    this.updatePointSelects();
  }

  updatePointSelects() {
    const selects = [
      "pointSelect",
      "point1Select",
      "point2Select",
      "editPointSelect",
    ].map((id) => document.getElementById(id));
    selects.forEach((select) => (select.innerHTML = ""));

    this.pointsPerMap.forEach((points) => {
      if (points) {
        points.forEach((point) => {
          const option = document.createElement("option");
          option.value = point.name;
          option.textContent = point.name;
          selects.forEach((select) =>
            select.appendChild(option.cloneNode(true))
          );
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
            this.updatePointData(point.name, allData);
          } else {
            this.canvasUtils.alert(
              "Warning",
              `No data found in Firebase for SSID: ${routerSSID}. Circles removed.`,
              "warning"
            );
            point.data = [];
          }

          const currentSelectedIndex =
            document.getElementById("map-select").value;
          if (currentSelectedIndex && currentSelectedIndex === selectedIndex) {
            this.trilaterationUtils.refreshMap(currentSelectedIndex);
          } else {
            console.log(
              `Skipping refreshMap: Map index mismatch (expected ${selectedIndex}, got ${currentSelectedIndex})`
            );
          }
        } else {
          this.canvasUtils.alert(
            "Error",
            "No data available in Firebase. Circles removed.",
            "error"
          );
          point.data = [];

          const currentSelectedIndex =
            document.getElementById("map-select").value;
          if (currentSelectedIndex && currentSelectedIndex === selectedIndex) {
            this.trilaterationUtils.refreshMap(currentSelectedIndex);
          }
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

  updatePointData(pointName, data) {
    const selectedIndex = document.getElementById("map-select").value;
    if (selectedIndex && this.pointsPerMap[selectedIndex]) {
      this.pointsPerMap[selectedIndex].forEach((point) => {
        if (point.name === pointName) {
          point.data = data;
        }
      });
    }
  }

  async editPoint(selectedPointName, newPointName, mapIndex) {
    if (
      this.canvasUtils.checkCondition.NotEqual(
        selectedPointName,
        "Please select a point to edit."
      ) ||
      this.canvasUtils.checkCondition.NotEqual(
        newPointName,
        "Please enter a new name for the point."
      )
    )
      return;

    // ตรวจสอบชื่อซ้ำใน Firestore
    const isDuplicate = await this.checkDuplicatePointName(newPointName);
    if (isDuplicate) {
      this.canvasUtils.alert(
        "Error",
        "The new point name already exists in Firestore.",
        "error"
      );
      return;
    }

    if (!(await this.validatePoint(newPointName))) {
      this.canvasUtils.alert(
        "Error",
        "The new point name already exists locally.",
        "error"
      );
      return;
    }

    const point = this.pointsPerMap[mapIndex].find(
      (p) => p.name === selectedPointName
    );
    if (point) {
      const listenerIndex = this.listeners.findIndex(
        (l) => l.pointName === selectedPointName
      );
      if (listenerIndex !== -1) {
        off(dbRef, "value", this.listeners[listenerIndex].listener);
        this.listeners.splice(listenerIndex, 1);
      }

      point.name = newPointName;
      this.startRealTimeUpdate(point, mapIndex);
    }

    if (this.markerCoordinatesPerMap[mapIndex]) {
      const marker = this.markerCoordinatesPerMap[mapIndex].find(
        (m) => m.name === selectedPointName
      );
      if (marker) marker.name = newPointName;
    }

    this.updatePointSelects();
    this.canvasUtils.alert(
      "Success",
      `Point name changed to: ${newPointName}`,
      "success"
    );
  }
}
