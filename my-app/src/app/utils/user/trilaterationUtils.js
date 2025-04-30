export class TrilaterationUtils {
  constructor(canvasUtils, pointManager, mapManager) {
    this.canvasUtils = canvasUtils;
    this.canvasUtils3D = null;
    this.pointManager = pointManager;
    this.mapManager = mapManager;
    this.macToNodeIndex = {};
    this.trilaterationPositions = {};
  }

  calculateTrilateration(point1, point2, point3) {
    const x1 = point1.x,
      y1 = point1.y,
      d1 = point1.distance / this.canvasUtils.scaleX;
    const x2 = point2.x,
      y2 = point2.y,
      d2 = point2.distance / this.canvasUtils.scaleX;
    const x3 = point3.x,
      y3 = point3.y,
      d3 = point3.distance / this.canvasUtils.scaleX;

    const A = 2 * (x2 - x1);
    const B = 2 * (y2 - y1);
    const C = d1 * d1 - d2 * d2 + x2 * x2 + y2 * y2 - x1 * x1 - y1 * y1;
    const D = 2 * (x3 - x1);
    const E = 2 * (y3 - y1);
    const F = d1 * d1 - d3 * d3 + x3 * x3 + y3 * y3 - x1 * x1 - y1 * y1;

    const denominator = A * E - B * D;
    if (denominator === 0) return null;

    const x = (C * E - F * B) / denominator;
    const y = (D * C - A * F) / denominator;
    return { x, y };
  }

  assignNodeIndex(mac) {
    if (!(mac in this.macToNodeIndex)) {
      this.macToNodeIndex[mac] = Object.keys(this.macToNodeIndex).length + 1;
    }
    return this.macToNodeIndex[mac];
  }

  refreshMap(selectedIndex, showPoints = false) {
    console.log("refreshMap called with selectedIndex:", selectedIndex);
    console.log("mapManager.maps:", this.mapManager.maps);

    // ตรวจสอบว่า selectedIndex มีอยู่ใน mapManager.maps หรือไม่
    if (selectedIndex === undefined || selectedIndex === null || !this.mapManager.maps[selectedIndex]) {
      console.log(
        "Skipping refreshMap: Invalid selectedIndex or map not found"
      );
      return;
    }

    const activeCanvasUtils = this.canvasUtils3D && this.canvasUtils3D.canvas.style.display !== "none"
      ? this.canvasUtils3D
      : this.canvasUtils;

    activeCanvasUtils.ctx.clearRect(
      0,
      0,
      activeCanvasUtils.canvas.width,
      activeCanvasUtils.canvas.height
    );
    activeCanvasUtils.ctx.drawImage(
      activeCanvasUtils.img,
      0,
      0,
      activeCanvasUtils.canvas.width,
      activeCanvasUtils.canvas.height
    );

    activeCanvasUtils.circles = [];
    this.trilaterationPositions = {};

    this.pointManager.points =
      this.pointManager.pointsPerMap[selectedIndex] || [];
    this.pointManager.markerCoordinates =
      this.pointManager.markerCoordinatesPerMap[selectedIndex] || [];

    console.log("refreshMap - points to draw:", this.pointManager.points);

    if (showPoints) {
      this.pointManager.points.forEach((point) => {
        activeCanvasUtils.drawPoint(
          point.x,
          point.y,
          point.name,
          point.color,
          showPoints
        );
        if (point.data && Array.isArray(point.data)) {
          console.log(`Drawing circles for point ${point.name}:`, point.data);
          point.data.forEach((data) => {
            if (data.distance && data.rssi && data.mac) {
              if (data.distance <= 0) {
                console.log(
                  `Skipping circle for point ${point.name}: Distance is ${data.distance}`
                );
              } else {
                activeCanvasUtils.drawCircle(
                  point.x,
                  point.y,
                  data.distance,
                  data.rssi,
                  data.mac,
                  showPoints
                );
              }
            } else {
              console.log(
                `Skipping circle for point ${point.name}: Invalid data`,
                data
              );
            }
          });
        } else {
          console.log(`No data for point ${point.name}`);
        }
      });

      const macGroups = {};
      this.pointManager.points.forEach((point) => {
        if (point.data && Array.isArray(point.data)) {
          point.data.forEach((data) => {
            if (data.mac && data.distance) {
              if (!macGroups[data.mac]) macGroups[data.mac] = [];
              macGroups[data.mac].push({
                x: point.x,
                y: point.y,
                radius: data.distance / activeCanvasUtils.scaleX,
                name: point.name,
                mac: data.mac,
                distance: data.distance,
              });
            }
          });
        }
      });

      Object.keys(macGroups).forEach((mac) => {
        const circlesInNode = macGroups[mac];
        const nodeIndex = this.assignNodeIndex(mac);
        const nodeName = `Node ${nodeIndex}`;

        if (
          circlesInNode &&
          Array.isArray(circlesInNode) &&
          circlesInNode.length >= 3 &&
          circlesInNode[0] &&
          circlesInNode[1] &&
          circlesInNode[2] &&
          circlesInNode[0].x !== undefined &&
          circlesInNode[0].y !== undefined &&
          circlesInNode[0].distance !== undefined &&
          circlesInNode[1].x !== undefined &&
          circlesInNode[1].y !== undefined &&
          circlesInNode[1].distance !== undefined &&
          circlesInNode[2].x !== undefined &&
          circlesInNode[2].y !== undefined &&
          circlesInNode[2].distance !== undefined
        ) {
          const position = this.calculateTrilateration(
            circlesInNode[0],
            circlesInNode[1],
            circlesInNode[2]
          );
          if (position) {
            this.trilaterationPositions[mac] = {
              x: position.x,
              y: position.y,
              name: nodeName,
            };
            activeCanvasUtils.drawIntersectionPoint(
              position.x,
              position.y,
              nodeName,
              mac,
              showPoints
            );
          }
        }
      });
    }
  }

  startRealTimeUpdate() {
    this.macToNodeIndex = {};
    this.pointManager.pointsPerMap.forEach((points, mapIndex) => {
      if (points) {
        points.forEach((point) => {
          this.pointManager.startRealTimeUpdate(point, mapIndex);
        });
      }
    });
  }

  startAutoRefresh(interval = 1000) {
    this.stopAutoRefresh();

    this.refreshInterval = setInterval(() => {
      const mapSelect = document.getElementById("map-select");
      if (mapSelect?.value) {
        const selectedMap = this.mapManager.maps.find(
          map => map.id === mapSelect.value
        );
        if (selectedMap) {
          this.refreshMap(selectedMap.index, true);
        }
      }
    }, interval);
  }

  stopAutoRefresh() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
}