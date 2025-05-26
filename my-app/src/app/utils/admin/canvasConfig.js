import Swal from "sweetalert2";

const FIXED_CANVAS_WIDTH = 1000;
const FIXED_CANVAS_HEIGHT = 400;
const CENTER_X = FIXED_CANVAS_WIDTH / 2; // 500
const CENTER_Y = FIXED_CANVAS_HEIGHT / 2; // 200
const realWidth = 63;
const realHeight = 24;

export class CanvasUtils {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tooltip = tooltip;
    this.img = new Image();
    this.routerImg = new Image();
    this.routerImg.src = "/symbols/router.png";
    this.scaleX = realWidth / FIXED_CANVAS_WIDTH;
    this.scaleY = realHeight / FIXED_CANVAS_HEIGHT;
    this.showCircles = true;
    this.intersectionColors = {};
    this.circles = [];
  }

  initializeCanvas() {
    this.img.onload = () => {
      this.canvas.width = FIXED_CANVAS_WIDTH;
      this.canvas.height = FIXED_CANVAS_HEIGHT;

      const imgAspect = this.img.width / this.img.height;
      const canvasAspect = this.canvas.width / this.canvas.height;
      let drawWidth, drawHeight, offsetX, offsetY;

      if (imgAspect > canvasAspect) {
        drawWidth = this.canvas.width;
        drawHeight = this.canvas.width / imgAspect;
        offsetX = 0;
        offsetY = (this.canvas.height - drawHeight) / 2;
      } else {
        drawHeight = this.canvas.height;
        drawWidth = this.canvas.height * imgAspect;
        offsetX = (this.canvas.width - drawWidth) / 2;
        offsetY = 0;
      }

      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.fillStyle = "#000000";
      this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
    };
    this.img.onerror = () => {
      console.error("Failed to load map image:", this.img.src);
      this.alert("Error", "Failed to load map image. Please check the file path.", "error");
    };
  }

  /**
   * Converts canvas pixel coordinates to Cartesian coordinates
   * - (0,0) is at canvas center (CENTER_X, CENTER_Y)
   * - Quadrants:
   *   - Top-right: (+x, +y)
   *   - Top-left: (-x, +y)
   *   - Bottom-left: (-x, -y)
   *   - Bottom-right: (+x, -y)
   */
  toCartesian(pixelX, pixelY) {
    const x = pixelX - CENTER_X;
    const y = -(pixelY - CENTER_Y); // Invert y-axis for Cartesian system
    console.log(`toCartesian: pixel(${pixelX}, ${pixelY}) -> Cartesian(${x}, ${y}) [${this.getQuadrant(x, y)}]`);
    return { x, y };
  }

  /**
   * Converts Cartesian coordinates to canvas pixel coordinates
   * - (0,0) in Cartesian maps to (CENTER_X, CENTER_Y) on canvas
   * - Quadrants are preserved as described in toCartesian
   */
  toCanvas(x, y) {
    const pixelX = x + CENTER_X;
    const pixelY = -y + CENTER_Y; // Invert y-axis for canvas
    console.log(`toCanvas: Cartesian(${x}, ${y}) [${this.getQuadrant(x, y)}] -> pixel(${pixelX}, ${pixelY})`);
    return { pixelX, pixelY };
  }

  /**
   * Determines the quadrant of a Cartesian point
   * @param {number} x - Cartesian x coordinate
   * @param {number} y - Cartesian y coordinate
   * @returns {string} - Quadrant description
   */
  getQuadrant(x, y) {
    if (x > 0 && y > 0) return "Top-right (+,+)";
    if (x < 0 && y > 0) return "Top-left (-,+)";
    if (x < 0 && y < 0) return "Bottom-left (-,-)";
    if (x > 0 && y < 0) return "Bottom-right (+,-)";
    return "Origin (0,0)";
  }

  drawMarker(x, y, color) {
    const { pixelX, pixelY } = this.toCanvas(x, y);
    if (this.routerImg.complete && this.routerImg.naturalWidth !== 0) {
      this.ctx.drawImage(this.routerImg, pixelX - 10, pixelY - 10, 20, 20);
    } else {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
      this.ctx.fill();
      this.ctx.stroke();
    }
  }

  drawPoint(x, y, name, color = "black") {
    const { pixelX, pixelY } = this.toCanvas(x, y);
    if (this.routerImg.complete && this.routerImg.naturalWidth !== 0) {
      this.ctx.drawImage(this.routerImg, pixelX - 10, pixelY - 10, 20, 20);
    } else {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
      this.ctx.fill();
    }
    this.ctx.fillStyle = "black";
    this.ctx.font = "12px Arial";
    this.ctx.fillText(
      `${name} (x: ${Math.round(x)}, y: ${Math.round(y)})`,
      // [${this.getQuadrant(x, y)}]
      pixelX + 15,
      pixelY - 15
    );
  }

  drawCircle(x, y, distance, rssi, mac) {
    if (this.showCircles && distance > 0) {
      const { pixelX, pixelY } = this.toCanvas(x, y);
      const radius = distance / this.scaleX;

      this.ctx.beginPath();
      this.ctx.arc(pixelX, pixelY, radius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
      this.ctx.stroke();

      this.circles.push({ x, y, radius, rssi, distance, mac });
    }
  }

  drawIntersectionPoint(x, y, name, mac) {
    if (!this.intersectionColors[mac]) {
      this.intersectionColors[mac] = this.getRandomColor();
    }
    const color = this.intersectionColors[mac];
    const { pixelX, pixelY } = this.toCanvas(x, y);

    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.strokeStyle = color;
    this.ctx.stroke();
    this.ctx.fillStyle = "black";
    this.ctx.fillText(`${name} [${this.getQuadrant(x, y)}]`, pixelX + 5, pixelY - 5);
  }

  drawLine(x1, y1, x2, y2) {
    if (this.showCircles) {
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = "rgba(255, 0, 0, 0.5)";
      this.ctx.stroke();
    }
  }

  resetCanvas() {
    this.canvas.width = FIXED_CANVAS_WIDTH;
    this.canvas.height = FIXED_CANVAS_HEIGHT;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.circles = [];
  }

  showCircleTooltip(event) {
    const rect = this.canvas.getBoundingClientRect();
    const mouseX = event.clientX - rect.left;
    const mouseY = event.clientY - rect.top;

    const hoveredCircle = this.circles.find((circle) => {
      const dx = circle.x - mouseX;
      const dy = circle.y - mouseY;
      const distanceFromCenter = Math.sqrt(dx * dx + dy * dy);
      return (
        distanceFromCenter <= circle.radius + 5 &&
        distanceFromCenter >= circle.radius - 5
      );
    });

    if (hoveredCircle) {
      this.tooltip.innerText = `Mac: ${hoveredCircle.mac}\nRSSI: ${
        hoveredCircle.rssi
      } dBm\nDistance: ${hoveredCircle.distance.toFixed(2)} m\nQuadrant: ${this.getQuadrant(hoveredCircle.x, hoveredCircle.y)}`;
      this.tooltip.style.display = "block";
      this.tooltip.style.left = `${event.pageX + 10}px`;
      this.tooltip.style.top = `${event.pageY + 10}px`;
    } else {
      this.tooltip.style.display = "none";
    }
  }

  getRandomColor() {
    const letters = "0123456789ABCDEF";
    let color = "#";
    for (let i = 0; i < 6; i++) {
      color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
  }

  alert(title, text, icon) {
    Swal.fire({
      title,
      text,
      icon,
      confirmButtonText: "OK",
    });
  }
}