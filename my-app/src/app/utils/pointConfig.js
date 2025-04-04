import Swal from "sweetalert2";
import { dbRef, onValue, dbfs, collection, getDocs, addDoc, query, where, serverTimestamp } from "@utils/firebase-db";

export function validatePoint(pointName, pointsPerMap) {
  if (!pointName) {
    Swal.fire({ title: "Warning", text: "Please enter a name for the point.", icon: "warning" });
    return false;
  }
  for (const mapIndex in pointsPerMap) {
    if (pointsPerMap[mapIndex].some((point) => point.name === pointName)) {
      Swal.fire({ title: "Error", text: "Point name must be unique across all maps.", icon: "error" });
      return false;
    }
  }
  return true;
}

export function addPoint(x, y, name, pointsPerMap, markerCoordinatesPerMap, drawMode, drawPoint, drawMarker, ctx, checkAndDisplayPointData, toCanvas) {
  if (!validatePoint(name, pointsPerMap)) return;

  const color = drawMode ? "blue" : "red";
  drawPoint(ctx, x, y, name, color, toCanvas);

  const selectedIndex = document.getElementById("map-select").value;
  if (!pointsPerMap[selectedIndex]) pointsPerMap[selectedIndex] = [];
  pointsPerMap[selectedIndex].push({ x, y, name, color, distance: 0, rssi: "Not available" });

  if (drawMode) {
    if (!markerCoordinatesPerMap[selectedIndex]) markerCoordinatesPerMap[selectedIndex] = [];
    markerCoordinatesPerMap[selectedIndex].push({ x, y });
    drawMarker(ctx, x, y, "blue", toCanvas);
  }

  checkAndDisplayPointData({ x, y, name });
}

export function checkAndDisplayPointData(point, updatePointData, refreshMap) {
  const routerSSID = point.name;
  onValue(dbRef, (snapshot) => {
    if (snapshot.exists()) {
      const nodes = snapshot.val();
      let foundData = false;
      const allData = [];

      Object.keys(nodes).forEach((nodeKey) => {
        const nodeData = nodes[nodeKey];
        Object.keys(nodeData).forEach((routerKey) => {
          if (routerKey.startsWith("Router-")) {
            const routerData = nodeData[routerKey];
            if (routerData.ssid === routerSSID) {
              allData.push({
                rssi: routerData.rssi,
                distance: routerData.distance,
                mac: nodeData.Mac,
              });
              foundData = true;
            }
          }
        });
      });

      if (foundData) {
        point.data = allData;
        updatePointData(point.name, allData);
        refreshMap();
      }
    }
  });
}

export async function savePointToFirestore(point, mapIndex) {
  try {
    const pointsRef = collection(dbfs, "points");
    const q = query(pointsRef, where("ssid", "==", point.name), where("mapIndex", "==", mapIndex));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      const docRef = await addDoc(pointsRef, {
        coordinates: { x: point.x, y: point.y },
        createdAt: serverTimestamp(),
        details: { color: point.color, scaleX: point.scaleX, scaleY: point.scaleY },
        mapIndex,
        ssid: point.name,
        updatedAt: serverTimestamp(),
      });
      console.log("New point saved to Firestore with ID: ", docRef.id);
    }
  } catch (error) {
    console.error("Error saving point to Firestore: ", error);
  }
}