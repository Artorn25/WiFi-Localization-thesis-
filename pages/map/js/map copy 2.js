import { initializeApp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-database.js";
import {
  getFirestore,
  collection,
  getDocs,
  addDoc,
  query,
  where,
  updateDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

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
const dbfs = getFirestore(app);
let pointsPerMap = []; // สร้าง array สำหรับเก็บจุดตามแผนที่
let markerCoordinatesPerMap = {}; // ใช้เก็บ marker แยกตามแผนที่

const tooltip = document.getElementById("tooltip"),
  canvas = document.getElementById("myCanvas"),
  ctx = canvas.getContext("2d");
let points = [],
  drawMode = true,
  markerCoordinates = [],
  maps = [],
  showCircles = true; // ตัวแปรเก็บสถานะการแสดงผลของวงกลม

const img = new Image();
const FIXED_CANVAS_WIDTH = 1000;
const FIXED_CANVAS_HEIGHT = 400;
const CENTER_X = FIXED_CANVAS_WIDTH / 2; // 315
const CENTER_Y = FIXED_CANVAS_HEIGHT / 2; // 118
const realWidth = 63,
  realHeight = 23.6;

let scaleX, scaleY;

img.onload = function () {
  canvas.width = FIXED_CANVAS_WIDTH;
  canvas.height = FIXED_CANVAS_HEIGHT;

  scaleX = realWidth / canvas.width;
  scaleY = realHeight / canvas.height;

  const imgAspect = img.width / img.height;
  const canvasAspect = canvas.width / canvas.height;
  let drawWidth, drawHeight, offsetX, offsetY;

  if (imgAspect > canvasAspect) {
    drawWidth = canvas.width;
    drawHeight = canvas.width / imgAspect;
    offsetX = 0;
    offsetY = (canvas.height - drawHeight) / 2;
  } else {
    drawHeight = canvas.height;
    drawWidth = canvas.height * imgAspect;
    offsetX = (canvas.width - drawWidth) / 2;
    offsetY = 0;
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight);
};

const alert = (topic, text, icon) => {
  Swal.fire({
    title: topic,
    text: text,
    icon: icon,
  });
};

// Check condition
const CheckCondition = {
  Equal: function (condition, massageAlert) {
    if (condition === "" || condition === null) {
      alert("Warning", massageAlert, "warning");
      return;
    }
  },
  NotEqual: function (condition, massageAlert) {
    if (!condition) {
      alert("Warning", massageAlert, "warning");
      return;
    }
  },
};

document.getElementById("updateMapName").addEventListener("click", () => {
  const mapSelect = document.getElementById("map-select");
  const selectedIndex = mapSelect.value;
  const newMapName = document.getElementById("mapName").value;

  CheckCondition.Equal(selectedIndex, "Please select a map to update.");

  if (!newMapName && newMapName !== "") {
    alert("Warning", "Please enter a new name for the map.", "warning");
    return;
  }
  maps[selectedIndex] = { ...maps[selectedIndex], name: newMapName };

  // Refresh dropdown options
  UpdateMapSelect();
  alert(
    "Success",
    `Map ${parseInt(selectedIndex) + 1} renamed to ${newMapName}`,
    "success"
  );
  // Re-select the updated map
  mapSelect.value = selectedIndex;
  console.log(`Map ${parseInt(selectedIndex) + 1} renamed to ${newMapName}`);
  document.getElementById("mapName").value = "";
});

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

// ฟังก์ชันสำหรับเลือกแผนที่จาก dropdown
document.getElementById("map-select").addEventListener("change", (event) => {
  const selectedIndex = event.target.value;
  if (selectedIndex) {
    LoadMap(maps[selectedIndex].src);
    macToNodeIndex = {}; // รีเซ็ต mapping เมื่อเปลี่ยนแผนที่
    trilaterationPositions = {};
    startRealTimeUpdate();
  }
});

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

// แปลงจากพิกัด Canvas (pixelX, pixelY) เป็นพิกัดจตุภาค (x, y)
function toCartesian(pixelX, pixelY) {
  const x = pixelX - CENTER_X;
  const y = -(pixelY - CENTER_Y); // ลบเพื่อให้ Y บวกขึ้นบน
  return { x, y };
}

// แปลงจากพิกัดจตุภาค (x, y) เป็นพิกัด Canvas (pixelX, pixelY)
function toCanvas(x, y) {
  const pixelX = x + CENTER_X;
  const pixelY = -y + CENTER_Y; // ลบ Y เพื่อกลับทิศ
  return { pixelX, pixelY };
}

function LoadMap(mapSrc) {
  img.src = mapSrc;
  img.onload = () => {
    canvas.width = FIXED_CANVAS_WIDTH;
    canvas.height = FIXED_CANVAS_HEIGHT;

    scaleX = realWidth / canvas.width;
    scaleY = realHeight / canvas.height;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const selectedIndex = document.getElementById("map-select").value;
    points = pointsPerMap[selectedIndex] || [];
    markerCoordinates = markerCoordinatesPerMap[selectedIndex] || [];

    if (drawMode) DrawMarkers();

    points.forEach((point) => {
      DrawPoint(point.x, point.y, point.name, point.color);
      if (point.distance > 0) DrawCircle(point.x, point.y, point.distance);
    });

    console.log(`Map loaded: ${mapSrc}`);
    console.log(`Scale X: ${scaleX}, Scale Y: ${scaleY}`);
    RefreshMap();
  };
}

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
    alert(
      "Success",
      `Map uploaded successfully\nMap name: ${mapName}`,
      "success"
    );
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
        alert("Map deleted", "Map deleted successfully", "success");
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
    alert(
      "Info",
      "Please upload or select a map before adding points.",
      "question"
    );
    return;
  }
  if (!ValidatePoint(pointName)) return;

  const rect = canvas.getBoundingClientRect();
  const pixelX = event.clientX - rect.left;
  const pixelY = event.clientY - rect.top;
  const { x, y } = toCartesian(pixelX, pixelY); // แปลงเป็นระบบจตุภาค

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

function ResetCanvas() {
  canvas.width = FIXED_CANVAS_WIDTH;
  canvas.height = FIXED_CANVAS_HEIGHT;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  points = [];

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  off(dbRef);
  console.log("Firebase data listeners reset");
  console.log("Canvas, points, and circles reset");
}

// Draw markers
function DrawMarkers() {
  ctx.save();
  ctx.fillStyle = "blue";
  markerCoordinates.forEach((marker) => DrawMarker(marker.x, marker.y, "blue"));
  ctx.restore();
}

const set_ctx = (x, y, color) => {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();
};

// Draw marker
function DrawMarker(x, y, color) {
  set_ctx(x, y, color);
  ctx.stroke();
}

function DrawPoint(x, y, name, color = "black") {
  const { pixelX, pixelY } = toCanvas(x, y); // แปลงกลับเป็นพิกัด Canvas
  set_ctx(pixelX, pixelY, color);
  ctx.fillStyle = "black";
  ctx.fillText(
    `${name} (${Math.round(x)}, ${Math.round(y)})`,
    pixelX + 5,
    pixelY - 5
  );

  async function savePointToFirestore() {
    try {
      const pointsRef = collection(dbfs, "points");
      const q = query(
        pointsRef,
        where("ssid", "==", name),
        where("mapIndex", "==", document.getElementById("map-select").value)
      );

      const querySnapshot = await getDocs(q);

      if (querySnapshot.empty) {
        const docRef = await addDoc(collection(dbfs, "points"), {
          coordinates: { x, y }, // เก็บพิกัดจตุภาค
          createdAt: serverTimestamp(),
          details: { color, scaleX, scaleY },
          mapIndex: document.getElementById("map-select").value,
          ssid: name,
          updatedAt: serverTimestamp(),
        });
        console.log("New point saved to Firestore with ID: ", docRef.id);
      } else {
        console.log(
          `Point with SSID ${name} on map ${
            document.getElementById("map-select").value
          } already exists. Skipping save.`
        );
      }
    } catch (error) {
      console.error("Error saving point to Firestore: ", error);
    }
  }

  savePointToFirestore();
}

function ValidatePoint(pointName) {
  if (!pointName) {
    alert("Warning", "Please enter a name for the point.", "warning");
    return false;
  }
  for (const mapIndex in pointsPerMap) {
    if (pointsPerMap[mapIndex].some((point) => point.name === pointName)) {
      alert("Error", "Point name must be unique across all maps.", "error");
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
  DrawMarker(x, y, "blue");
  AddPoint(x, y, name);
}

function AddPoint(x, y, name) {
  if (!ValidatePoint(name)) return;

  const color = drawMode ? "blue" : "red";
  const distance = 0;
  const rssi = "Not available";

  DrawPoint(x, y, name, color); // ส่งพิกัดจตุภาค

  const selectedIndex = document.getElementById("map-select").value;
  if (!pointsPerMap[selectedIndex]) pointsPerMap[selectedIndex] = [];
  pointsPerMap[selectedIndex].push({ x, y, name, color, distance, rssi }); // เก็บพิกัดจตุภาค

  console.log(`Point added: ${name} at (${x}, ${y})`);
  document.getElementById("pointName").value = "";
  CheckAndDisplayPointData({ x, y, name });

  UpdatePointSelects();
}

function ShowDistance() {
  const index1 = document.getElementById("point1Select").value;
  const index2 = document.getElementById("point2Select").value;

  if (index1 === index2) {
    alert("Error", "Cannot measure distance between the same point.", "error");
    return;
  }

  if (index1 && index2) {
    const point1 = points[index1];
    const point2 = points[index2];
    const dx = (point2.x - point1.x) * scaleX; // แปลงพิกัดเป็นเมตร
    const dy = (point2.y - point1.y) * scaleY; // แปลงพิกัดเป็นเมตร
    const distance = Math.sqrt(dx * dx + dy * dy); // ระยะทางจริง (เมตร)
    document.getElementById("distanceDisplay").innerText = `Distance between ${
      point1.name
    } and ${point2.name}: ${distance.toFixed(2)} meters`;
  }
}

function DeletePoint() {
  const pointSelect = document.getElementById("pointSelect");
  const selectedPointName = pointSelect.value;

  if (!selectedPointName) {
    alert("Info", "Please select a point to delete.", "question");
    return;
  }

  const mapIndex = document.getElementById("map-select").value;

  if (!pointsPerMap[mapIndex]) {
    alert("Info", "No points available for the selected map.", "question");
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
  const routerSSID = point.name;
  const dbRef = ref(db, "Data");

  onValue(
    dbRef,
    (snapshot) => {
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
          RefreshMap(); // อัปเดตทันทีเมื่อมีข้อมูลใหม่
        }
      }
    },
    { onlyOnce: false } // ฟังการเปลี่ยนแปลงแบบ real-time
  );
}

function updatePointData(pointName, data) {
  const selectedIndex = document.getElementById("map-select").value;
  if (selectedIndex && pointsPerMap[selectedIndex]) {
    pointsPerMap[selectedIndex].forEach((point) => {
      if (point.name === pointName) {
        point.data = data; // เก็บข้อมูลทั้งหมดไว้ใน point.data
      }
    });
  }
}

function calculateTrilateration(point1, point2, point3) {
  const x1 = point1.x;
  const y1 = point1.y;
  const d1 = point1.distance / scaleX; // ปรับระยะทางตาม scale
  const x2 = point2.x;
  const y2 = point2.y;
  const d2 = point2.distance / scaleX;
  const x3 = point3.x;
  const y3 = point3.y;
  const d3 = point3.distance / scaleX;

  // คำนวณจากสมการเชิงเส้น (1.4 Solve Linear System)
  const A = 2 * (x2 - x1);
  const B = 2 * (y2 - y1);
  const C = d1 * d1 - d2 * d2 + x2 * x2 + y2 * y2 - x1 * x1 - y1 * y1;
  const D = 2 * (x3 - x1);
  const E = 2 * (y3 - y1);
  const F = d1 * d1 - d3 * d3 + x3 * x3 + y3 * y3 - x1 * x1 - y1 * y1;

  // แก้สมการ Ax + By = C และ Dx + Ey = F
  const denominator = A * E - B * D;
  if (denominator === 0) {
    console.log("Trilateration: Cannot solve (denominator = 0)");
    return null; // ไม่สามารถคำนวณได้
  }

  const x = (C * E - F * B) / denominator;
  const y = (D * C - A * F) / denominator;
  console.log(`position now ${x}, ${y}`);
  return { x, y };
}

let macToNodeIndex = {};
let trilaterationPositions = {};

// ฟังก์ชันสำหรับกำหนด index ให้ MAC Address
function assignNodeIndex(mac) {
  if (!(mac in macToNodeIndex)) {
    macToNodeIndex[mac] = Object.keys(macToNodeIndex).length + 1;
  }
  return macToNodeIndex[mac];
}

// ปรับปรุงฟังก์ชัน RefreshMap
function RefreshMap() {
  const selectedIndex = document.getElementById("map-select").value;
  if (!selectedIndex || !maps[selectedIndex]) return;

  // ล้าง canvas
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

  circles = [];
  points = pointsPerMap[selectedIndex] || [];
  markerCoordinates = markerCoordinatesPerMap[selectedIndex] || [];

  // วาดจุดพื้นฐาน
  points.forEach((point) => {
    DrawPoint(point.x, point.y, point.name, point.color);
    if (point.data) {
      point.data.forEach((data) => {
        DrawCircle(point.x, point.y, data.distance, data.rssi, data.mac);
      });
    }
  });

  // จัดกลุ่มตาม MAC Address
  const macGroups = {};
  points.forEach((point) => {
    if (point.data) {
      point.data.forEach((data) => {
        if (!macGroups[data.mac]) {
          macGroups[data.mac] = [];
        }
        macGroups[data.mac].push({
          x: point.x,
          y: point.y,
          radius: data.distance / scaleX,
          name: point.name,
          mac: data.mac,
          distance: data.distance,
        });
      });
    }
  });

  // ล้างตำแหน่งเก่าก่อนคำนวณใหม่
  trilaterationPositions = {};

  // คำนวณและวาดจุดใหม่
  Object.keys(macGroups).forEach((mac) => {
    const circlesInNode = macGroups[mac];

    // กำหนด index ให้ MAC Address
    const nodeIndex = assignNodeIndex(mac);
    const nodeName = `Node ${nodeIndex}`;

    if (circlesInNode.length >= 3) {
      // ใช้ 3 จุดแรกสำหรับการคำนวณ
      const position = calculateTrilateration(
        circlesInNode[0],
        circlesInNode[1],
        circlesInNode[2]
      );

      if (position) {
        trilaterationPositions[mac] = {
          x: position.x,
          y: position.y,
          name: nodeName,
        };
        DrawIntersectionPoint(position.x, position.y, nodeName, mac);
        console.log(
          `Trilateration calculated for ${nodeName} (MAC: ${mac}) at (${position.x}, ${position.y})`
        );
      }
    }
  });

  console.log("Map refreshed with real-time trilateration");
}

// ปรับปรุง DrawIntersectionPoint
function DrawIntersectionPoint(x, y, name, mac) {
  if (!intersectionColors[mac]) {
    intersectionColors[mac] = getRandomColor();
  }
  const color = intersectionColors[mac];

  const { pixelX, pixelY } = toCanvas(x, y);

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();

  ctx.fillStyle = "black";
  ctx.fillText(name, pixelX + 5, pixelY - 5); // ใช้ชื่อ Node $index โดยไม่แสดง MAC
}

// อัปเดตฟังก์ชันเริ่มต้น
function startRealTimeUpdate() {
  // รีเซ็ต mapping เมื่อเริ่มใหม่
  macToNodeIndex = {};

  pointsPerMap.forEach((points, mapIndex) => {
    if (points) {
      points.forEach((point) => {
        CheckAndDisplayPointData(point);
      });
    }
  });
}

// เรียกใช้เมื่อเริ่มต้น
document.addEventListener("DOMContentLoaded", () => {
  startRealTimeUpdate();
});

function DrawMidPoint(x1, y1, x2, y2, name, mac) {
  const xMid = (x1 + x2) / 2;
  const yMid = (y1 + y2) / 2;

  // ใช้สีเดิมถ้ามี หรือสุ่มสีใหม่ถ้ายังไม่มี
  if (!intersectionColors[`${mac}-${name}`]) {
    intersectionColors[`${mac}-${name}`] = getRandomColor();
  }
  const color = intersectionColors[`${mac}-${name}`];

  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(xMid, yMid, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = "black"; // ข้อความสีดำ
  ctx.fillText(`${name} (Mac: ${mac})`, xMid + 5, yMid - 5);
  console.log(
    `Midpoint at (${xMid}, ${yMid}) with name: ${name}, Mac: ${mac}, Color: ${color}`
  );
}
let intersectionColors = {}; // เก็บสีของจุดตัดและจุดกึ่งกลางตาม Mac Address
let circles = []; // เก็บข้อมูลของวงกลมทั้งหมด

function DrawCircle(x, y, distance, rssi, mac) {
  if (showCircles && distance > 0) {
    const { pixelX, pixelY } = toCanvas(x, y); // แปลงเป็นพิกัด Canvas
    const radius = distance / scaleX; // ปรับตาม Scale Factor

    ctx.beginPath();
    ctx.arc(pixelX, pixelY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.stroke();

    circles.push({ x, y, radius, rssi, distance, mac }); // เก็บพิกัดจตุภาค
  }
}

function ShowCircleTooltip(event) {
  const rect = canvas.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // ตรวจสอบว่า Cursor อยู่เหนือวงกลมหรือไม่
  const hoveredCircle = circles.find((circle) => {
    const dx = circle.x - mouseX;
    const dy = circle.y - mouseY;
    const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
    return (
      distanceFromCenter <= circle.radius + 5 &&
      distanceFromCenter >= circle.radius - 5
    ); // ตรวจสอบใกล้เส้นวงกลม
  });

  if (hoveredCircle) {
    tooltip.innerText = `Mac: ${hoveredCircle.mac}\nRSSI: ${
      hoveredCircle.rssi
    } dBm\nDistance: ${hoveredCircle.distance.toFixed(2)} m`;
    tooltip.style.display = "block";
    tooltip.style.left = `${event.pageX + 10}px`;
    tooltip.style.top = `${event.pageY + 10}px`;
  } else {
    tooltip.style.display = "none";
  }
}

canvas.addEventListener("mousemove", (event) => {
  ShowCircleTooltip(event);
});

document
  .getElementById("showCircleCheckbox")
  .addEventListener("change", (event) => {
    showCircles = !event.target.checked; // สลับสถานะการแสดงผลของวงกลม
    RefreshMap(); // รีเฟรชแผนที่เพื่ออัปเดตการแสดงผล
  });

function CheckCircleIntersection(circle1, circle2) {
  const dx = circle2.x - circle1.x;
  const dy = circle2.y - circle1.y;
  const d = Math.sqrt(dx * dx + dy * dy); // ระยะห่างระหว่างจุดศูนย์กลางของวงกลมทั้งสอง

  const r1 = circle1.radius;
  const r2 = circle2.radius;

  // ตรวจสอบว่าวงกลมตัดกันหรือไม่
  if (d > r1 + r2) {
    console.log("Circles do not intersect.");
    // คำนวณจุดที่ใกล้ที่สุดบนขอบของวงกลมทั้งสอง
    const ratio1 = r1 / d;
    const ratio2 = r2 / d;
    const nearestPoint1 = {
      x: circle1.x + dx * ratio1,
      y: circle1.y + dy * ratio1,
    };
    const nearestPoint2 = {
      x: circle2.x - dx * ratio2,
      y: circle2.y - dy * ratio2,
    };

    return { type: "noIntersection", points: [nearestPoint1, nearestPoint2] };
  } else if (d < Math.abs(r1 - r2) || d === 0) {
    console.log("One circle is inside the other or they are identical.");
    return { type: "noIntersection", points: [] };
  }

  // หากวงกลมตัดกัน
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const x3 = circle1.x + (a * dx) / d;
  const y3 = circle1.y + (a * dy) / d;

  const intersectX1 = x3 + (h * dy) / d;
  const intersectY1 = y3 - (h * dx) / d;
  const intersectX2 = x3 - (h * dy) / d;
  const intersectY2 = y3 + (h * dx) / d;

  return {
    type: "intersection",
    points: [
      { x: intersectX1, y: intersectY1 },
      { x: intersectX2, y: intersectY2 },
    ],
  };
}

function DrawLine(x1, y1, x2, y2) {
  if (showCircles) {
    // ตรวจสอบสถานะ showCircles
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.stroke();
    console.log(`Draw line from (${x1}, ${y1}) to (${x2}, ${y2})`);
  }
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
    alert("Error", "The new point name already exists.", "error");
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
  alert("Success", `Point name changed to: ${newPointName}`, "success");
  document.getElementById("newPointName").value = "";
});

function getRandomColor() {
  const letters = "0123456789ABCDEF";
  let color = "#";
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}
