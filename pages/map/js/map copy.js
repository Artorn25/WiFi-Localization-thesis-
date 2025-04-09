import { initializeApp } from "https://www.gstatic.com/firebasejs/11.4.0/firebase-app.js";
import {
  getDatabase,
  ref,
  onValue,
} from "https://www.gstatic.com/firebasejs/11.4.0/firebase-database.js";

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

const tooltip = document.getElementById("tooltip"),
  canvas = document.getElementById("myCanvas"),
  ctx = canvas.getContext("2d");
let points = [],
  drawMode = true,
  markerCoordinates = [],
  maps = [],
  showCircles = true; // ตัวแปรเก็บสถานะการแสดงผลของวงกลม

const img = new Image();
const realWidth = 63,
  realHeight = 23.6;

let scaleX, scaleY;

img.onload = function () {
  // ปรับขนาด Canvas ให้ตรงกับขนาดรูปภาพ
  canvas.width = img.width;
  canvas.height = img.height;

  // คำนวณ Scale Factor
  scaleX = realWidth / canvas.width;
  scaleY = realHeight / canvas.height;

  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
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

function LoadMap(mapSrc) {
  img.src = mapSrc;
  img.onload = () => {
    // ปรับขนาด Canvas ให้ตรงกับขนาดรูปภาพ
    canvas.width = img.width;
    canvas.height = img.height;

    // คำนวณ Scale Factor ใหม่
    scaleX = realWidth / canvas.width;
    scaleY = realHeight / canvas.height;

    // ล้าง Canvas และวาดรูปภาพใหม่
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // โหลดจุดและ marker จากแผนที่ที่เลือก
    const selectedIndex = document.getElementById("map-select").value;
    points = pointsPerMap[selectedIndex] || [];
    markerCoordinates = markerCoordinatesPerMap[selectedIndex] || [];

    // วาด marker และจุดที่มีอยู่
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

    console.log(`Map loaded: ${mapSrc}`);
    console.log(`Scale X: ${scaleX}, Scale Y: ${scaleY}`);
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
  set_ctx(x, y, color);
  ctx.fillStyle = "black";
  ctx.fillText(`${name} (${Math.round(x)}, ${Math.round(y)})`, x + 5, y - 5);
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
  if (
    point.name === "TP-Link_2536_1" ||
    point.name === "TP-Link_2536_2" ||
    point.name === "TP-Link_2536_3"
  ) {
    const routerKey =
      point.name === "TP-Link_2536_1"
        ? "Router1"
        : point.name === "TP-Link_2536_2"
        ? "Router2"
        : "Router3";
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
    });

    // หา Router ทั้ง 3 ตัว
    const routers = points.filter(
      (point) =>
        point.name === "TP-Link_2536_1" ||
        point.name === "TP-Link_2536_2" ||
        point.name === "TP-Link_2536_3"
    );

    if (routers.length === 3) {
      // ตรวจสอบระยะทางของ Router ทั้ง 3 ตัว
      const distances = routers.map((router) => router.distance);
      const maxDistance = Math.max(...distances);
      const minDistance = Math.min(...distances);

      // หากระยะทางไกลที่สุดมากกว่าระยะทางอื่น ๆ เกินเกณฑ์ (เช่น 20%) ให้ไม่นำมาคำนวณ
      const threshold = 1.2; // 20% threshold
      if (maxDistance > minDistance * threshold) {
        // ตัด Router ที่มีระยะทางไกลที่สุดออก
        const filteredRouters = routers.filter(
          (router) => router.distance !== maxDistance
        );

        if (filteredRouters.length === 2) {
          // คำนวณจุดตัดจาก Router 2 ตัวที่เหลือ
          const intersectionPoints = CheckCircleIntersection(
            filteredRouters[0],
            filteredRouters[1]
          );
          if (intersectionPoints) {
            intersectionPoints.forEach((point) => {
              DrawIntersectionPoint(point.x, point.y);
            });
          }
        }
      } else {
        // หากระยะทางไม่เกินเกณฑ์ ให้คำนวณจุดตัดจาก Router ทั้ง 3 ตัว
        const intersectionPoint = CalculateIntersectionThreeRouters(
          routers[0],
          routers[1],
          routers[2]
        );
        if (intersectionPoint) {
          DrawIntersectionPoint(intersectionPoint.x, intersectionPoint.y);
        }
      }
    } else if (routers.length === 2) {
      // คำนวณจุดตัดจาก Router 2 ตัว
      const intersectionPoints = CheckCircleIntersection(
        routers[0],
        routers[1]
      );
      if (intersectionPoints) {
        intersectionPoints.forEach((point) => {
          DrawIntersectionPoint(point.x, point.y);
        });
      }
    } else {
      console.log("Not enough routers to calculate intersection.");
    }

    console.log("Map refreshed with updated points and circles.");
  }
}

function CalculateIntersectionThreeRouters(point1, point2, point3) {
  // ฟังก์ชันสำหรับคำนวณระยะทางระหว่างจุดสองจุด
  function distance(p1, p2) {
    return Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));
  }

  // ฟังก์ชันสำหรับคำนวณตำแหน่งโดยใช้ Least Squares Method
  function trilaterate(p1, p2, p3) {
    const A = 2 * (p2.x - p1.x);
    const B = 2 * (p2.y - p1.y);
    const C =
      Math.pow(p1.distance / scaleX, 2) -
      Math.pow(p2.distance / scaleX, 2) -
      Math.pow(p1.x, 2) +
      Math.pow(p2.x, 2) -
      Math.pow(p1.y, 2) +
      Math.pow(p2.y, 2);
    const D = 2 * (p3.x - p2.x);
    const E = 2 * (p3.y - p2.y);
    const F =
      Math.pow(p2.distance / scaleX, 2) -
      Math.pow(p3.distance / scaleX, 2) -
      Math.pow(p2.x, 2) +
      Math.pow(p3.x, 2) -
      Math.pow(p2.y, 2) +
      Math.pow(p3.y, 2);

    const x = (C * E - F * B) / (E * A - B * D);
    const y = (C * D - A * F) / (B * D - A * E);

    return { x, y };
  }

  // ตรวจสอบระยะทางของ Router ทั้ง 3 ตัว
  const distances = [point1.distance, point2.distance, point3.distance];
  const maxDistance = Math.max(...distances);
  const minDistance = Math.min(...distances);

  // หากระยะทางไกลที่สุดมากกว่าระยะทางอื่น ๆ เกินเกณฑ์ (เช่น 20%) ให้ไม่นำมาคำนวณ
  const threshold = 1.2; // 20% threshold
  if (maxDistance > minDistance * threshold) {
    // ตัด Router ที่มีระยะทางไกลที่สุดออก
    const filteredPoints = [point1, point2, point3].filter(
      (point) => point.distance !== maxDistance
    );

    if (filteredPoints.length === 2) {
      // คำนวณจุดตัดจาก Router 2 ตัวที่เหลือ
      const intersectionPoints = CheckCircleIntersection(
        filteredPoints[0],
        filteredPoints[1]
      );
      if (intersectionPoints) {
        return intersectionPoints[0]; // ใช้จุดตัดแรก
      }
    }
    return null;
  }

  // หากระยะทางไม่เกินเกณฑ์ ให้คำนวณจุดตัดจาก Router ทั้ง 3 ตัว
  const estimatedPosition = trilaterate(point1, point2, point3);

  // คำนวณความคลาดเคลื่อน (Error) ของตำแหน่งที่ประมาณได้
  const error1 = Math.abs(
    distance(estimatedPosition, point1) - point1.distance / scaleX
  );
  const error2 = Math.abs(
    distance(estimatedPosition, point2) - point2.distance / scaleX
  );
  const error3 = Math.abs(
    distance(estimatedPosition, point3) - point3.distance / scaleX
  );

  const totalError = error1 + error2 + error3;

  console.log(
    `Estimated position: (${estimatedPosition.x}, ${estimatedPosition.y})`
  );
  console.log(`Total error: ${totalError}`);

  return estimatedPosition;
}

function DrawIntersectionPoint(x, y) {
  set_ctx(x, y, "red");
  ctx.stroke();
  console.log(`Intersection point drawn at (${x}, ${y})`);
}

// ฟังก์ชันวาดวงกลม
function DrawCircle(x, y, distance) {
  if (showCircles && distance > 0) {
    const radius = distance / scaleX; // ปรับขนาดรัศมีตาม Scale Factor
    console.log(
      `Drawing circle at (${x}, ${y}) with radius: ${distance * 100}`
    );
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
    ctx.stroke();
  }
}

document
  .getElementById("showCircleCheckbox")
  .addEventListener("change", (event) => {
    showCircles = !event.target.checked; // สลับสถานะการแสดงผลของวงกลม
    RefreshMap(); // รีเฟรชแผนที่เพื่ออัปเดตการแสดงผล
  });

function CheckCircleIntersection(point1, point2) {
  // คำนวณระยะห่างระหว่างจุดศูนย์กลางของวงกลมทั้งสอง
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  const d = Math.sqrt(dx * dx + dy * dy);

  // รัศมีของวงกลมทั้งสอง (แปลงเป็นพิกัด Canvas)
  const r1 = point1.distance / scaleX;
  const r2 = point2.distance / scaleX;

  // ตรวจสอบว่าวงกลมตัดกันหรือไม่
  if (d > r1 + r2) {
    console.log("Circles do not intersect.");
    // คำนวณจุดที่ใกล้ที่สุดบนขอบของวงกลมทั้งสอง
    const ratio1 = r1 / d;
    const ratio2 = r2 / d;
    const nearestPoint1 = {
      x: point1.x + dx * ratio1,
      y: point1.y + dy * ratio1,
    };
    const nearestPoint2 = {
      x: point2.x - dx * ratio2,
      y: point2.y - dy * ratio2,
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

    return [];
  } else if (d < Math.abs(r1 - r2) || d === 0) {
    console.log("One circle is inside the other or they are identical.");

    // ตรวจสอบว่าวงกลมใดครอบอีกวงกลมหนึ่ง
    if (r1 > r2) {
      console.log("Circle 1 (point1) is the outer circle.");
      // จุดที่อยู่บนขอบของวงกลมที่ครอบ (วงกลม 1)
      const nearestPointOuter = {
        x: point1.x + dx * (r1 / d),
        y: point1.y + dy * (r1 / d),
      };

      DrawPoint(
        nearestPointOuter.x,
        nearestPointOuter.y,
        "Propbality Position device",
        "blue"
      );
      // DrawPoint(nearestPointInner.x, nearestPointInner.y, "Inner Circle Nearest Point", "red");
    } else if (r2 > r1) {
      console.log("Circle 2 (point2) is the outer circle.");
      // จุดที่อยู่บนขอบของวงกลมที่ครอบ (วงกลม 2)
      const nearestPointOuter = {
        x: point2.x - dx * (r2 / d),
        y: point2.y - dy * (r2 / d),
      };

      DrawPoint(
        nearestPointOuter.x,
        nearestPointOuter.y,
        "Propbality Position device",
        "blue"
      );
    } else {
      console.log("Both circles are identical.");
      // หากวงกลมทั้งสองมีขนาดเท่ากันและจุดศูนย์กลางเดียวกัน
      DrawPoint(point1.x, point1.y, "Identical Circles", "purple");
    }

    return [];
  }

  // หากวงกลมตัดกัน
  const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
  const h = Math.sqrt(r1 * r1 - a * a);

  const x3 = point1.x + (a * dx) / d;
  const y3 = point1.y + (a * dy) / d;

  const intersectX1 = x3 + (h * dy) / d;
  const intersectY1 = y3 - (h * dx) / d;
  const intersectX2 = x3 - (h * dy) / d;
  const intersectY2 = y3 + (h * dx) / d;

  // วาดจุดตัดบน Canvas
  DrawPoint(intersectX1, intersectY1, "Intersection", "green");
  DrawPoint(intersectX2, intersectY2, "Intersection", "green");

  return [
    { x: intersectX1, y: intersectY1 },
    { x: intersectX2, y: intersectY2 },
  ];
}

function DrawLine(x1, y1, x2, y2) {
  if (showCircles) { // ตรวจสอบสถานะ showCircles
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
    ctx.stroke();
    console.log(`Draw line from (${x1}, ${y1}) to (${x2}, ${y2})`);
  }
}


function DrawMidPoint(x1, y1, x2, y2) {
  const xMid = (x1 + x2) / 2;
  const yMid = (y1 + y2) / 2;

  // จุดกึ่งกลางบนแผนที่
  set_ctx(xMid, yMid, "red");
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
  // ...

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
