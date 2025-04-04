export function setupCanvas(img, canvas, ctx, realWidth, realHeight) {
  const FIXED_CANVAS_WIDTH = 1400;
  const FIXED_CANVAS_HEIGHT = 700;

  canvas.width = FIXED_CANVAS_WIDTH;
  canvas.height = FIXED_CANVAS_HEIGHT;

  const scaleX = realWidth / canvas.width;
  const scaleY = realHeight / canvas.height;

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

  return { scaleX, scaleY };
}

export function drawPoint(ctx, x, y, name, color = "black", toCanvas) {
  const { pixelX, pixelY } = toCanvas(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.fillStyle = "black";
  ctx.fillText(`${name} (${Math.round(x)}, ${Math.round(y)})`, pixelX + 5, pixelY - 5);
}

export function drawMarker(ctx, x, y, color, toCanvas) {
  const { pixelX, pixelY } = toCanvas(x, y);
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.stroke();
}

export function drawCircle(ctx, x, y, distance, scaleX, toCanvas) {
  const { pixelX, pixelY } = toCanvas(x, y);
  const radius = distance / scaleX;
  ctx.beginPath();
  ctx.arc(pixelX, pixelY, radius, 0, 2 * Math.PI);
  ctx.strokeStyle = "rgba(0, 0, 255, 0.5)";
  ctx.stroke();
}

export function drawIntersectionPoint(ctx, x, y, name, mac, color) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, 2 * Math.PI);
  ctx.fill();
  ctx.strokeStyle = color;
  ctx.stroke();
  ctx.fillStyle = "black";
  ctx.fillText(`${name} (Mac: ${mac})`, x + 5, y - 5);
}