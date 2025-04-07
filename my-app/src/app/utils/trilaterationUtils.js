export class TrilaterationUtils {
  constructor(canvasUtils, pointManager, mapManager) {
    this.canvasUtils = canvasUtils;
    this.pointManager = pointManager;
    this.mapManager = mapManager; // เพิ่ม mapManager
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

  refreshMap(selectedIndex) {
    if (!selectedIndex || !this.mapManager.maps[selectedIndex]) return;

    this.canvasUtils.ctx.clearRect(
      0,
      0,
      this.canvasUtils.canvas.width,
      this.canvasUtils.canvas.height
    );
    this.canvasUtils.ctx.drawImage(
      this.canvasUtils.img,
      0,
      0,
      this.canvasUtils.canvas.width,
      this.canvasUtils.canvas.height
    );

    this.canvasUtils.circles = [];
    this.pointManager.points =
      this.pointManager.pointsPerMap[selectedIndex] || [];
    this.pointManager.markerCoordinates =
      this.pointManager.markerCoordinatesPerMap[selectedIndex] || [];

    this.pointManager.points.forEach((point) => {
      this.canvasUtils.drawPoint(point.x, point.y, point.name, point.color);
      if (point.data && Array.isArray(point.data)) {
        // จำกัดให้วาดเพียง 3 วงกลม โดยเลือกจาก MAC ที่แตกต่างกัน
        const uniqueMacData = [];
        const seenMacs = new Set();
        for (const data of point.data) {
          if (!seenMacs.has(data.mac) && uniqueMacData.length < 3) {
            uniqueMacData.push(data);
            seenMacs.add(data.mac);
          }
        }

        uniqueMacData.forEach((data) => {
          if (data.distance && data.rssi && data.mac) {
            this.canvasUtils.drawCircle(
              point.x,
              point.y,
              data.distance,
              data.rssi,
              data.mac
            );
          }
        });
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
              radius: data.distance / this.canvasUtils.scaleX,
              name: point.name,
              mac: data.mac,
              distance: data.distance,
            });
          }
        });
      }
    });

    this.trilaterationPositions = {};
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
          this.canvasUtils.drawIntersectionPoint(
            position.x,
            position.y,
            nodeName,
            mac
          );
        }
      }
    });
  }

  startRealTimeUpdate() {
    this.macToNodeIndex = {};
    this.pointManager.pointsPerMap.forEach((points) => {
      if (points) {
        points.forEach((point) =>
          this.pointManager.checkAndDisplayPointData(point)
        );
      }
    });
  }
}
