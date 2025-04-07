import { dbRef, dbfs } from "./firebaseConfig";
import { onValue, off } from "firebase/database";
import { collection, getDocs, addDoc, query, where, serverTimestamp } from "firebase/firestore";

export class PointManager {
  constructor(canvasUtils) {
    this.canvasUtils = canvasUtils;
    this.pointsPerMap = [];
    this.markerCoordinatesPerMap = {};
    this.points = [];
    this.markerCoordinates = [];
    this.drawMode = true;
  }

  validatePoint(pointName) {
    if (!pointName) {
      this.canvasUtils.alert("Warning", "Please enter a name for the point.", "warning");
      return false;
    }
    for (const mapIndex in this.pointsPerMap) {
      if (this.pointsPerMap[mapIndex].some((point) => point.name === pointName)) {
        this.canvasUtils.alert("Error", "Point name must be unique across all maps.", "error");
        return false;
      }
    }
    return true;
  }

  addMarkerAndPoint(x, y, name, selectedIndex) {
    if (!this.markerCoordinatesPerMap[selectedIndex]) this.markerCoordinatesPerMap[selectedIndex] = [];
    this.markerCoordinatesPerMap[selectedIndex].push({ x, y });
    this.canvasUtils.drawMarker(x, y, "blue");
    this.addPoint(x, y, name, selectedIndex);
  }

  addPoint(x, y, name, selectedIndex) {
    if (!this.validatePoint(name)) return;

    const color = this.drawMode ? "blue" : "red";
    if (!this.pointsPerMap[selectedIndex]) this.pointsPerMap[selectedIndex] = [];

    this.canvasUtils.drawPoint(x, y, name, color);
    const newPoint = {
      x,
      y,
      name,
      color,
      distance: 0,
      rssi: "Not available",
      data: [], // กำหนดค่าเริ่มต้นเป็น array ว่าง
    };
    this.pointsPerMap[selectedIndex].push(newPoint);
    this.points = this.pointsPerMap[selectedIndex];
    this.checkAndDisplayPointData(newPoint);
    this.updatePointSelects();
  }

  async savePointToFirestore(x, y, name, color) {
    try {
      const pointsRef = collection(dbfs, "points");
      const q = query(pointsRef, where("ssid", "==", name), where("mapIndex", "==", document.getElementById("map-select").value));
      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        await addDoc(pointsRef, {
          coordinates: { x, y },
          createdAt: serverTimestamp(),
          details: { color, scaleX: this.canvasUtils.scaleX, scaleY: this.canvasUtils.scaleY },
          mapIndex: document.getElementById("map-select").value,
          ssid: name,
          updatedAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error saving point to Firestore: ", error);
    }
  }

  showDistance(index1, index2) {
    if (index1 === index2) {
      this.canvasUtils.alert("Error", "Cannot measure distance between the same point.", "error");
      return;
    }
    if (index1 && index2) {
      const point1 = this.points[index1];
      const point2 = this.points[index2];
      const dx = (point2.x - point1.x) * this.canvasUtils.scaleX;
      const dy = (point2.y - point1.y) * this.canvasUtils.scaleY;
      const distance = Math.sqrt(dx * dx + dy * dy);
      document.getElementById("distanceDisplay").innerText = `Distance between ${point1.name} and ${point2.name}: ${distance.toFixed(2)} meters`;
    }
  }

  deletePoint(selectedPointName, mapIndex) {
    if (!selectedPointName) {
      this.canvasUtils.alert("Info", "Please select a point to delete.", "question");
      return;
    }
    if (!this.pointsPerMap[mapIndex]) {
      this.canvasUtils.alert("Info", "No points available for the selected map.", "question");
      return;
    }

    this.pointsPerMap[mapIndex] = this.pointsPerMap[mapIndex].filter((point) => point.name !== selectedPointName);
    if (this.markerCoordinatesPerMap[mapIndex]) {
      this.markerCoordinatesPerMap[mapIndex] = this.markerCoordinatesPerMap[mapIndex].filter(
        (marker) => marker.name !== selectedPointName
      );
    }
    this.points = this.pointsPerMap[mapIndex];
    this.updatePointSelects();
  }

  updatePointSelects() {
    const selects = ["pointSelect", "point1Select", "point2Select", "editPointSelect"].map((id) =>
      document.getElementById(id)
    );
    selects.forEach((select) => (select.innerHTML = ""));

    this.pointsPerMap.forEach((points) => {
      if (points) {
        points.forEach((point) => {
          const option = document.createElement("option");
          option.value = point.name;
          option.textContent = point.name;
          selects.forEach((select) => select.appendChild(option.cloneNode(true)));
        });
      }
    });
  }

  checkAndDisplayPointData(point) {
    return new Promise((resolve) => {
      const routerSSID = point.name;
      onValue(
        dbRef,
        (snapshot) => {
          if (snapshot.exists()) {
            const nodes = snapshot.val();
            const allData = [];
  
            Object.keys(nodes).forEach((nodeKey) => {
              const nodeData = nodes[nodeKey];
              // ดึงข้อมูลจากทุก SSID ที่เกี่ยวข้อง
              const relatedSSIDs = ["TP-Link_2536_1", "TP-Link_2536_2", "TP-Link_2536_3"];
              Object.keys(nodeData).forEach((routerKey) => {
                if (routerKey.startsWith("Router-")) {
                  const routerData = nodeData[routerKey];
                  // ตรวจสอบว่า SSID อยู่ใน relatedSSIDs และ routerSSID ต้องอยู่ใน relatedSSIDs ด้วย
                  if (
                    relatedSSIDs.includes(routerData.ssid) &&
                    relatedSSIDs.includes(routerSSID)
                  ) {
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
  
            console.log(`Data for SSID ${routerSSID}:`, allData);
  
            if (allData.length) {
              point.data = allData;
              this.updatePointData(point.name, allData);
            } else {
              this.canvasUtils.alert("Warning", `No data found in Firebase for SSID: ${routerSSID}`, "warning");
            }
          } else {
            this.canvasUtils.alert("Error", "No data available in Firebase", "error");
          }
          resolve();
        },
        { onlyOnce: true }
      );
    });
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

  editPoint(selectedPointName, newPointName, mapIndex) {
    if (
      this.canvasUtils.checkCondition.NotEqual(selectedPointName, "Please select a point to edit.") ||
      this.canvasUtils.checkCondition.NotEqual(newPointName, "Please enter a new name for the point.")
    ) return;

    if (!this.validatePoint(newPointName)) {
      this.canvasUtils.alert("Error", "The new point name already exists.", "error");
      return;
    }

    const point = this.pointsPerMap[mapIndex].find((p) => p.name === selectedPointName);
    if (point) {
      point.name = newPointName;
    }

    if (this.markerCoordinatesPerMap[mapIndex]) {
      const marker = this.markerCoordinatesPerMap[mapIndex].find((m) => m.name === selectedPointName);
      if (marker) marker.name = newPointName;
    }

    this.updatePointSelects();
    this.canvasUtils.alert("Success", `Point name changed to: ${newPointName}`, "success");
  }
}