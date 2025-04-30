import Swal from "sweetalert2";

const FIXED_CANVAS_WIDTH = 1000;
const FIXED_CANVAS_HEIGHT = 400;
const CENTER_X = FIXED_CANVAS_WIDTH / 2;
const CENTER_Y = FIXED_CANVAS_HEIGHT / 2;
const realWidth = 63;
const realHeight = 23.6;

export class CanvasUtils {
  constructor(canvas, tooltip) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.tooltip = tooltip;
    this.img = new Image();
    this.routerImg = new Image();
    this.routerImg.src = "/symbols/router.png"; // Adjust the path to your router image
    this.scaleX = realWidth / FIXED_CANVAS_WIDTH;
    this.scaleY = realHeight / FIXED_CANVAS_HEIGHT;
    this.showCircles = true;
    this.intersectionColors = {};
    this.circles = [];
  }

  initializeCanvas() {
    this.canvas.width = FIXED_CANVAS_WIDTH;
    this.canvas.height = FIXED_CANVAS_HEIGHT;

    const imgAspect = this.img.width / this.img.height || 1;
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
    if (this.img.complete && this.img.naturalWidth !== 0) {
      this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
    }
  }

  drawImageImmediately(imgSrc) {
    console.log("Attempting to draw image with src:", imgSrc);
    this.img = new Image();
    this.img.src = imgSrc;
    if (this.img.complete && this.img.naturalWidth !== 0) {
      console.log("Drawing cached image:", imgSrc);
      this.initializeCanvas();
    } else {
      this.img.onload = () => {
        console.log("Drawing loaded image:", imgSrc);
        this.initializeCanvas();
      };
      this.img.onerror = () => {
        console.error("Failed to load image:", imgSrc);
        this.alert("Error", `Failed to load map image: ${imgSrc}`, "error");
      };
    }
  }

  toCartesian(pixelX, pixelY) {
    const x = pixelX - CENTER_X;
    const y = -(pixelY - CENTER_Y);
    return { x, y };
  }

  toCanvas(x, y) {
    const pixelX = x + CENTER_X;
    const pixelY = -y + CENTER_Y;
    return { pixelX, pixelY };
  }

  drawMarker(x, y, color) {
    const { pixelX, pixelY } = this.toCanvas(x, y);
    this.ctx.fillStyle = color;
    this.ctx.beginPath();
    this.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
    this.ctx.fill();
    this.ctx.stroke();
  }

  drawPoint(x, y, name, color = "black", showPoints = false) {
    if (!showPoints) return;
    const { pixelX, pixelY } = this.toCanvas(x, y);

    const routerSize = 20;
    if (this.routerImg.complete && this.routerImg.naturalWidth !== 0) {
      this.ctx.drawImage(
        this.routerImg,
        pixelX - routerSize / 2,
        pixelY - routerSize / 2,
        routerSize,
        routerSize
      );
    } else {
      this.ctx.fillStyle = color;
      this.ctx.beginPath();
      this.ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
      this.ctx.fill();
      this.routerImg.onload = () => {
        this.initializeCanvas();
        this.drawPoint(x, y, name, color, showPoints);
      };
      this.routerImg.onerror = () => {
        console.error("Failed to load router image");
      };
    }

    // Draw point label
    this.ctx.fillStyle = "black";
    this.ctx.fillText(
      `${name} (${Math.round(x)}, ${Math.round(y)})`,
      pixelX + 5,
      pixelY - 5
    );
  }

  drawCircle(x, y, distance, rssi, mac, showPoints = false) {
    if (this.showCircles && distance > 0 && showPoints) {
      const { pixelX, pixelY } = this.toCanvas(x, y);
      const radius = distance / this.scaleX;

      this.ctx.beginPath();
      this.ctx.arc(pixelX, pixelY, radius, 0, 2 * Math.PI);
      this.ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
      this.ctx.stroke();

      this.circles.push({ x, y, radius, rssi, distance, mac });
    }
  }

  drawIntersectionPoint(x, y, name, mac, showPoints = false) {
    if (!showPoints) return;
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
    this.ctx.fillText(name, pixelX + 5, pixelY - 5);
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
    this.img = new Image(); // รีเซ็ตภาพเพื่อป้องกันการแคช
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
      } dBm\nDistance: ${hoveredCircle.distance.toFixed(2)} m`;
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

  clearCircles() {
    this.circles = [];
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    if (this.img.complete) {
      this.ctx.drawImage(this.img, 0, 0, this.canvas.width, this.canvas.height);
    }
  }
}