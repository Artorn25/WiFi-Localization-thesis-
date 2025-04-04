import Swal from "sweetalert2";

export function updateMapSelect(maps, mapSelect) {
  mapSelect.innerHTML = "<option value=''>Select Map</option>";
  maps.forEach((map, index) => {
    const option = document.createElement("option");
    option.value = index;
    option.textContent = map.name || `Map ${index + 1}`;
    mapSelect.appendChild(option);
  });
}

export async function editMapName(mapSrc, maps, updateMapSelect, loadMap) {
  const { value: mapName } = await Swal.fire({
    title: "Enter a name for this map",
    input: "text",
    inputLabel: "Map Name",
    inputValue: `Map ${maps.length + 1}`,
    showCancelButton: true,
    inputValidator: (value) => !value && "You need to write something!",
  });

  if (mapName) {
    Swal.fire({
      title: "Success",
      text: `Map uploaded successfully\nMap name: ${mapName}`,
      icon: "success",
    });
    maps.push({ src: mapSrc, name: mapName });
    updateMapSelect(maps, document.getElementById("map-select"));
    document.getElementById("map-select").value = maps.length - 1;
    loadMap(mapSrc);
  }
}

export function loadMap(mapSrc, img, ctx, pointsPerMap, markerCoordinatesPerMap, drawMode, drawMarkers, drawPoint, drawCircle, refreshMap) {
  img.src = mapSrc;
  img.onload = () => {
    const selectedIndex = document.getElementById("map-select").value;
    const points = pointsPerMap[selectedIndex] || [];
    const markerCoordinates = markerCoordinatesPerMap[selectedIndex] || [];

    if (drawMode) drawMarkers(ctx, markerCoordinates);
    points.forEach((point) => {
      drawPoint(ctx, point.x, point.y, point.name, point.color);
      if (point.distance > 0) drawCircle(ctx, point.x, point.y, point.distance);
    });
    refreshMap();
  };
}