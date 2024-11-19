import { initializeApp } from "https://www.gstatic.com/firebasejs/10.14.1/firebase-app.js";
import {
  getDatabase,
  ref,
  get,
  onValue,
} from "https://www.gstatic.com/firebasejs/10.14.1/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyCFhkQgV566VA1QjexbaCsAJ8iCfQXpW0g",
  authDomain: "esp8266-t1-37f02.firebaseapp.com",
  databaseURL:
    "https://esp8266-t1-37f02-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "esp8266-t1-37f02",
  storageBucket: "esp8266-t1-37f02.appspot.com",
  messagingSenderId: "201166852539",
  appId: "1:201166852539:web:42c3ad90a0611b17d5b49e",
};
const app = initializeApp(firebaseConfig);
const db = getDatabase(app),
  dbRef = ref(db, "Data");
let pointsPerMap = []; // สร้าง array สำหรับเก็บจุดตามแผนที่
let markerCoordinatesPerMap = {}; // ใช้เก็บ marker แยกตามแผนที่

const tooltip = document.getElementById("tooltip");
const canvas = document.getElementById("myCanvas"),
  ctx = canvas.getContext("2d");
let points = [],
  drawMode = true,
  markerCoordinates = [],
  maps = [];

const img = new Image();

// Check condition
const CheckCondition = {
  Equal: function (condition, massageAlert) {
    if (condition === "" || condition === null) {
      Swal.fire({
        title: "Warning",
        text: massageAlert,
        icon: "warning",
      });
      return;
    }
  },
  NotEqual: function (condition, massageAlert) {
    if (!condition) {
      Swal.fire({
        title: "Warning",
        text: massageAlert,
        icon: "warning",
      });
      return;
    }
  },
};

// Add function to update map name
document.getElementById("updateMapName").addEventListener("click", () => {
  const mapSelect = document.getElementById("map-select");
  const selectedIndex = mapSelect.value;
  const newMapName = document.getElementById("mapName").value;

  CheckCondition.Equal(selectedIndex, "Please select a map to update.");

  if (!newMapName && newMapName !== "") {
    Swal.fire({
      title: "Warning",
      text: "Please enter a new name for the map.",
      icon: "warning",
    });
    return;
  }
  maps[selectedIndex] = { ...maps[selectedIndex], name: newMapName };

  // Refresh dropdown options
  UpdateMapSelect();
  Swal.fire({
    title: "Success",
    text: `Map ${parseInt(selectedIndex) + 1} renamed to ${newMapName}`,
    icon: "success",
  });
  // Re-select the updated map
  mapSelect.value = selectedIndex;
  console.log(`Map ${parseInt(selectedIndex) + 1} renamed to ${newMapName}`);
  document.getElementById("mapName").value = "";
});

// Update map select
function UpdateMapSelect() {
  const mapSelect = document.getElementById("map-select");
  mapSelect.innerHTML = "<option value=''>Select Map</option>";
  maps.forEach((map, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = map.name || `Map ${index + 1}`;
    mapSelect.appendChild(option);
  });
}

// Load map
function LoadMap(mapSrc) {
  img.src = mapSrc;
  img.onload = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // เคลียร์จุดก่อนหน้า
    const selectedIndex = document.getElementById("map-select").value;
    points = pointsPerMap[selectedIndex] || []; // โหลดจุดจาก pointsPerMap
    markerCoordinates = markerCoordinatesPerMap[selectedIndex] || []; // โหลด marker จาก markerCoordinatesPerMap

    if (drawMode) {
      DrawMarkers();
    }

    // วาดจุดที่มีอยู่ในแผนที่
    points.forEach((point) => {
      DrawPoint(point.x, point.y, point.name, point.color);
      if (point.distance > 0) {
        DrawCircle(point.x, point.y, point.distance);
      }
    });
  };
}

// Edit name map
async function EditMapName(mapSrc) {
  const { value: mapName } = await Swal.fire({
    title: "Enter a name for this map",
    input: "text",
    inputLabel: "Map Name",
    inputValue: `Map ${maps.length + 1}`,
    showCancelButton: true,
    inputValidator: (value) => {
      if (!value) {
        return "You need to write something!";
      }
    },
  });

  if (mapName) {
    Swal.fire({
      title: "Map uploaded successfully",
      text: `Map name: ${mapName}`,
      icon: "success",
    });
    maps.push({ src: mapSrc, name: mapName });
    UpdateMapSelect();
    document.getElementById("map-select").value = maps.length - 1;
    LoadMap(mapSrc);
  }
}

// Load sample maps
document.querySelectorAll(".map-sample").forEach((img) => {
  img.addEventListener("click", () => {
    const mapSrc = img.getAttribute("data-map-src");
    EditMapName(mapSrc);
  });
});

// Upload map
document.getElementById("map-upload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const mapSrc = e.target.result;
      EditMapName(mapSrc);
    };
    reader.readAsDataURL(file);
  }
});

// Select map
document.getElementById("map-select").addEventListener("change", (event) => {
  const selectedIndex = event.target.value;
  if (selectedIndex) {
    // โหลดแผนที่ตามที่ผู้ใช้เลือก
    LoadMap(maps[selectedIndex].src);

    document.getElementById("map-select").value = selectedIndex;
  }
});

// Delete map
document.getElementById("delete-map").addEventListener("click", () => {
  const mapSelect = document.getElementById("map-select"),
    selectedIndex = mapSelect.value;
  if (maps.length === 0) {
    Swal.fire({
      title: "No maps available",
      text: "There are no maps to delete.",
      icon: "warning",
      confirmButtonText: "OK",
    });
    return;
  }
  CheckCondition.Equal(selectedIndex, "Please select a map to delete.");

  if (selectedIndex !== null && selectedIndex >= 0) {
    Swal.fire({
      title: `Are you sure you want to delete map ${
        parseInt(selectedIndex) + 1
      }?`,
      icon: "question",
      confirmButtonText: "Delete",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      showCloseButton: true,
    }).then((result) => {
      if (result.isConfirmed) {
        // ถ้ายืนยันการลบ
        Swal.fire({
          title: "Map deleted",
          icon: "success",
        });
        maps.splice(selectedIndex, 1);
        UpdateMapSelect();

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        points = [];
        markerCoordinates = [];

        if (maps.length > 0) {
          mapSelect.value = 0;
          LoadMap(maps[0].src); // แก้ไขตรงนี้เพื่อโหลดแผนที่หลังจากการลบ
        } else {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        console.log(`Map ${parseInt(selectedIndex) + 1} deleted`);
      }
    });
  }
});

canvas.addEventListener("click", (event) => {
  const pointName = document.getElementById("pointName").value;
  if (maps.length === 0) {
    Swal.fire({
      title: "Info",
      text: "Please upload or select a map before adding points.",
      icon: "question",
    });
    return;
  }
  console.log("Test");
  if (!ValidatePoint(pointName)) return;

  const rect = canvas.getBoundingClientRect(),
    x = event.clientX - rect.left,
    y = event.clientY - rect.top;

  if (drawMode) AddMarkerAndPoint(x, y, pointName);
  else AddPoint(x, y, pointName);
});

canvas.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect(),
    x = event.clientX - rect.left,
    y = event.clientY - rect.top;

  const hoveredPoint = points.find((point) => {
    const dx = point.x - x;
    const dy = point.y - y;
    return Math.sqrt(dx * dx + dy * dy) < 5; // Adjust the radius as needed
  });
  // console.log(hoveredPoint);

  if (hoveredPoint) {
    tooltip.innerText = `Name: ${
      hoveredPoint.name
    }\nDistance: ${hoveredPoint.distance.toFixed(2)} m\nRSSI: ${
      hoveredPoint.rssi
    } dBm`;
    tooltip.style.display = "block";
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
  } else tooltip.style.display = "none";
});

// reset canvas
function ResetCanvas() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  points = [];

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  off(dbRef); // ยกเลิกการฟังข้อมูล
  console.log("Firebase data listeners reset");
  console.log("Canvas, points, and circles reset");
}

// Draw markers
function DrawMarkers() {
  ctx.save();
  ctx.fillStyle = "blue";
  markerCoordinates.forEach((marker) => DrawMarker(marker.x, marker.y));
  ctx.restore();
}

// Draw marker
function DrawMarker(x, y) {
  ctx.fillStyle = "blue";
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

function DrawPoint(x, y, name, color = "black") {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.fillText(`${name} (${Math.round(x)}, ${Math.round(y)})`, x + 5, y - 5);
}

function ValidatePoint(pointName) {
  if (!pointName) {
    Swal.fire({
      title: "Warning",
      text: "Please enter a name for the point.",
      icon: "warning",
    });
    return false;
  }
  for (const mapIndex in pointsPerMap) {
    if (pointsPerMap[mapIndex].some((point) => point.name === pointName)) {
      Swal.fire({
        title: "Error",
        text: "Point name must be unique across all maps.",
        icon: "error",
      });
      return false;
    }
  }
  return true;
}

function AddMarkerAndPoint(x, y, name) {
  const selectedIndex = document.getElementById("map-select").value;
  if (!markerCoordinatesPerMap[selectedIndex])
    markerCoordinatesPerMap[selectedIndex] = [];
  markerCoordinatesPerMap[selectedIndex].push({ x, y });
  DrawMarker(x, y);
  AddPoint(x, y, name);
}

function AddPoint(x, y, name) {
  if (!ValidatePoint(name)) return;

  const color = drawMode ? "blue" : "red";
  DrawPoint(x, y, name, color);

  const distance = 0;
  const rssi = "Not available";

  const selectedIndex = document.getElementById("map-select").value;
  if (!pointsPerMap[selectedIndex]) pointsPerMap[selectedIndex] = [];
  pointsPerMap[selectedIndex].push({ x, y, name, color, distance, rssi });

  console.log(`Point added: ${name} at (${x}, ${y})`);
  document.getElementById("pointName").value = "";
  // ดึงข้อมูลจาก Firebase และวาดวงกลม
  CheckAndDisplayPointData({ x, y, name });

  UpdatePointSelects();
}

function ShowDistance() {
  const index1 = document.getElementById("point1Select").value;
  const index2 = document.getElementById("point2Select").value;

  if (index1 === index2) {
    Swal.fire({
      title: "Error",
      text: "Cannot measure distance between the same point.",
      icon: "error",
    });
    return;
  }

  if (index1 && index2) {
    const distance = calculateDistance(points[index1], points[index2]);
    document.getElementById("distanceDisplay").innerText = `Distance between ${
      points[index1].name
    } and ${points[index2].name}: ${distance.toFixed(2)} meters`;
  }
}

function DeletePoint() {
  const pointSelect = document.getElementById("pointSelect");
  const selectedPointName = pointSelect.value;

  if (!selectedPointName) {
    Swal.fire({
      title: "Info",
      text: "Please select a point to delete.",
      icon: "question",
    });
    return;
  }

  const mapIndex = document.getElementById("map-select").value;

  if (!pointsPerMap[mapIndex]) {
    Swal.fire({
      title: "Info",
      text: "No points available for the selected map.",
      icon: "question",
    });
    return;
  }

  // ลบจุดจาก pointsPerMap
  pointsPerMap[mapIndex] = pointsPerMap[mapIndex].filter(
    (point) => point.name !== selectedPointName
  );

  // ลบจุดจาก markerCoordinatesPerMap
  if (markerCoordinatesPerMap[mapIndex]) {
    markerCoordinatesPerMap[mapIndex] = markerCoordinatesPerMap[
      mapIndex
    ].filter((marker) => marker.name !== selectedPointName);
  }

  points = pointsPerMap[mapIndex];

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  points.forEach((point) => {
    DrawPoint(point.x, point.y, point.name, point.color);
    if (point.distance > 0) DrawCircle(point.x, point.y, point.distance);
  });

  UpdatePointSelects();
  console.log("Points after deletion:", points);
}

function UpdatePointSelects() {
  const pointSelect = document.getElementById("pointSelect");
  const point1Select = document.getElementById("point1Select");
  const point2Select = document.getElementById("point2Select");
  const editPointSelect = document.getElementById("editPointSelect");

  // ล้างค่าที่มีอยู่ใน select
  pointSelect.innerHTML = "";
  point1Select.innerHTML = "";
  point2Select.innerHTML = "";
  editPointSelect.innerHTML = "";

  // แทรก option สำหรับชื่อจุดในทุก select
  pointsPerMap.forEach((points) => {
    if (points) {
      points.forEach((point) => {
        const option = document.createElement("option");
        option.value = point.name; // ค่า value เป็นชื่อจุด
        option.textContent = point.name; // ข้อความแสดงใน select

        // เพิ่ม option ไปยังทุก select
        pointSelect.appendChild(option.cloneNode(true));
        point1Select.appendChild(option.cloneNode(true));
        point2Select.appendChild(option.cloneNode(true));
        editPointSelect.appendChild(option.cloneNode(true));
      });
    }
  });
}

function CheckAndDisplayPointData(point) {
  if (point.name === "TP-Link_2536_1" || point.name === "TP-Link_2536_2") {
    const routerKey = point.name === "TP-Link_2536_1" ? "Router1" : "Router2";

    // ใช้ onValue แทน get เพื่อฟังข้อมูลจาก Firebase แบบเรียลไทม์
    onValue(
      ref(db, `Data/${routerKey}`),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.val();
          if (data.rssi && data.Log && data.Log.distance) {
            point.rssi = data.rssi;
            point.distance = data.Log.distance;

            console.log(
              `Data for ${point.name} found: RSSI = ${point.rssi}, Distance = ${point.distance}`
            );

            updatePointDistance(point.name, point.rssi, point.distance);

            RefreshMap();
          } else {
            console.log(
              `Data found but missing rssi or distance for ${point.name}`
            );
          }
        } else {
          console.log(`No data found for ${point.name}`);
        }
      },
      (error) => {
        console.error("Error fetching data:", error);
      }
    );
  }
}

function updatePointDistance(pointName, rssi, distance) {
  const selectedIndex = document.getElementById("map-select").value;
  if (selectedIndex && pointsPerMap[selectedIndex]) {
    pointsPerMap[selectedIndex].forEach((point) => {
      if (point.name === pointName) {
        point.rssi = rssi;
        point.distance = distance;
      }
    });
  }
}

function RefreshMap() {
  const selectedIndex = document.getElementById("map-select").value;
  if (selectedIndex && maps[selectedIndex]) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // โหลดจุดจาก pointsPerMap
    points = pointsPerMap[selectedIndex] || [];
    markerCoordinates = markerCoordinatesPerMap[selectedIndex] || [];

    points.forEach((point, index) => {
      DrawPoint(point.x, point.y, point.name, point.color);
      if (point.distance > 0) {
        DrawCircle(point.x, point.y, point.distance);
      }

      // ตรวจสอบการตัดกันของวงกลมแต่ละคู่
      for (let i = index + 1; i < points.length; i++) {
        CheckCircleIntersection(point, points[i]);
      }
    });

    console.log("Map refreshed with updated points and circles.");
  }
}

function DrawCircle(x, y, distance) {
  if (distance > 0) {
    console.log(
      `Drawing circle at (${x}, ${y}) with radius: ${distance * 100}`
    );
    ctx.beginPath();
    ctx.arc(x, y, distance * 100, 0, 2 * Math.PI); // ปรับขนาดวงกลมตามระยะทาง
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.stroke();
  }
}

function CheckCircleIntersection(point1, point2) {
  // d = √(x1 - x2)^2 + (y1 - y2)^2
  const d = Math.sqrt(
    Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2)
  );
  const r1 = point1.distance * 100,
    r2 = point2.distance * 100;

  // ตรวจสอบว่ามีการตัดกันหรือไม่ d > r1 + r2
  if (d > r1 + r2) {
    console.log(
      `Circles of ${point1.name} and ${point2.name} are close but do not intersect.`
    );
    // คำนวณจุดที่ใกล้กันที่สุดบนขอบของวงกลมทั้งสอง
    const ratio1 = r1 / d,
      ratio2 = r2 / d;
    const nearestPoint1 = {
      x: point1.x + (point2.x - point1.x) * ratio1,
      y: point1.y + (point2.y - point1.y) * ratio1,
    };
    const nearestPoint2 = {
      x: point2.x + (point1.x - point2.x) * ratio2,
      y: point2.y + (point1.y - point2.y) * ratio2,
    };
    DrawLine(
      nearestPoint1.x,
      nearestPoint1.y,
      nearestPoint2.x,
      nearestPoint2.y
    );
    DrawMidPoint(
      nearestPoint1.x,
      nearestPoint1.y,
      nearestPoint2.x,
      nearestPoint2.y
    );
    console.log(
      `Draw line between nearest points of ${point1.name} and ${point2.name}`
    );
    return [];
  } else if (d < Math.abs(r1 - r2) || d === 0) {
    console.log(
      `Circles of ${point1.name} and ${point2.name} are within each other or identical.`
    );
    return [];
  }

  // หากวงกลมตัดกัน (กรณีที่วงกลมสองวงตัดกัน)
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const x3 = point1.x + (a * (point2.x - point1.x)) / d,
    y3 = point1.y + (a * (point2.y - point1.y)) / d;
  const intersectX1 = x3 + (h * (point2.y - point1.y)) / d,
    intersectY1 = y3 - (h * (point2.x - point1.x)) / d;
  const intersectX2 = x3 - (h * (point2.y - point1.y)) / d,
    intersectY2 = y3 + (h * (point2.x - point1.x)) / d;

  console.log(`Intersection points for ${point1.name} and ${point2.name}:
                 Point 1: (${intersectX1}, ${intersectY1})
                 Point 2: (${intersectX2}, ${intersectY2})`);
  // วาดจุดตัด
  DrawPoint(intersectX1, intersectY1, "Intersection", "green");
  DrawPoint(intersectX2, intersectY2, "Intersection", "green");
  return [
    { x: intersectX1, y: intersectY1 },
    { x: intersectX2, y: intersectY2 },
  ];
}

function DrawLine(x1, y1, x2, y2) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
  ctx.stroke();
  console.log(`Draw line from (${x1}, ${y1}) to (${x2}, ${y2})`);
}

function DrawMidPoint(x1, y1, x2, y2) {
  // จุดกึ่งกลางของเส้น
  const xMid = (x1 + x2) / 2;
  const yMid = (y1 + y2) / 2;

  // จุดกึ่งกลางบนแผนที่
  ctx.beginPath();
  ctx.arc(xMid, yMid, 5, 0, 2 * Math.PI); // จุดกึ่งกลางเป็นวงกลม
  ctx.fillStyle = "green";
  ctx.fill();
  console.log(`Midpoint at (${xMid}, ${yMid})`);
}

document.getElementById("resetPoints").addEventListener("click", ResetCanvas);
document.getElementById("ShowDistance").addEventListener("click", ShowDistance);
document.getElementById("DeletePoint").addEventListener("click", DeletePoint);
document.getElementById("editPoint").addEventListener("click", async () => {
  const selectedPointName = document.getElementById("editPointSelect").value;
  const newPointName = document.getElementById("newPointName").value;
  const mapIndex = document.getElementById("map-select").value;

  CheckCondition.NotEqual(selectedPointName, "Please select a point to edit.");
  CheckCondition.NotEqual(
    newPointName,
    "Please enter a new name for the point."
  );

  // ตรวจสอบไม่ให้ชื่อใหม่ซ้ำกับชื่อจุดอื่น
  if (!ValidatePoint(newPointName)) {
    Swal.fire({
      title: "Error",
      text: "The new point name already exists.",
      icon: "error",
    });
    return;
  }

  // แก้ไขชื่อจุดใน pointsPerMap
  const point = pointsPerMap[mapIndex].find(
    (p) => p.name === selectedPointName
  );
  if (point) {
    point.name = newPointName;
  } else {
    console.error(`Point with name "${selectedPointName}" not found.`);
    return;
  }

  // แก้ไขชื่อจุดใน markerCoordinatesPerMap (ถ้ามี)
  if (markerCoordinatesPerMap[mapIndex]) {
    const marker = markerCoordinatesPerMap[mapIndex].find(
      (m) => m.name === selectedPointName
    );
    if (marker) {
      marker.name = newPointName;
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  pointsPerMap[mapIndex].forEach((point) => {
    DrawPoint(point.x, point.y, point.name, point.color);
    if (point.distance > 0) DrawCircle(point.x, point.y, point.distance);
  });

  // อัปเดตการเลือกจุดใหม่
  UpdatePointSelects();

  Swal.fire({
    title: "Success",
    text: `Point name changed to: ${newPointName}`,
    icon: "success",
  });

  document.getElementById("newPointName").value = "";
});
