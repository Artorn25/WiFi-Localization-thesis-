import Swal from "sweetalert2/dist/sweetalert2.js";

export class MapManager {
  constructor() {
    this.maps = [];
  }

  alert(topic, text, icon) {
    Swal.fire({ title: topic, text, icon });
  }

  checkCondition = {
    Equal: (condition, message) => {
      if (condition === "" || condition === null) {
        Swal.fire({ title: "Warning", text: message, icon: "warning" });
        return true;
      }
      return false;
    },
    NotEqual: (condition, message) => {
      if (!condition) {
        Swal.fire({ title: "Warning", text: message, icon: "warning" });
        return true;
      }
      return false;
    },
  };

  async editMapName(mapSrc) {
    const { value: mapName } = await Swal.fire({
      title: "Enter a name for this map",
      input: "text",
      inputValue: `Map ${this.maps.length + 1}`,
      showCancelButton: true,
      inputValidator: (value) => {
        if (!value) {
          return "You need to write something!";
        }
        if (this.maps.some((map) => map.name === value)) {
          return "Map name already exists! Please choose a different name.";
        }
        return null;
      },
    });

    if (mapName) {
      this.alert(
        "Success",
        `Map uploaded successfully\nMap name: ${mapName}`,
        "success"
      );
      this.maps.push({ src: mapSrc, name: mapName, index: this.maps.length });
      this.updateMapSelect();
      return this.maps.length - 1;
    }
    return null;
  }

  loadMaps(mapsData) {
    this.maps = mapsData.map((map, index) => ({
      id: map.id,
      src: map.mapSrc,
      name: map.mapName,
      index,
    }));
    this.updateMapSelect();
  }

  updateMapSelect() {
    const mapSelect = document.getElementById("map-select");
    if (!mapSelect) return;
    
    mapSelect.innerHTML = "<option value=''>-- Please Select Map --</option>";
    
    this.maps.forEach((map) => {
      const option = document.createElement("option");
      option.value = map.id;
      option.textContent = map.name || `Map ${map.index + 1}`;
      mapSelect.appendChild(option);
    });
    
    // เลือกแผนที่แรกโดยอัตโนมัติถ้ามีแผนที่เดียว
    if (this.maps.length === 1) {
      mapSelect.value = this.maps[0].id;
    }
  }

  deleteMap(selectedIndex, canvasUtils) {
    if (this.maps.length === 0) {
      Swal.fire({
        title: "No maps available",
        text: "There are no maps to delete.",
        icon: "warning",
        confirmButtonText: "OK",
      });
      return;
    }
    if (selectedIndex < 0 || selectedIndex >= this.maps.length) {
      Swal.fire({
        title: "Warning",
        text: "Please select a map to delete.",
        icon: "warning",
      });
      return;
    }

    // การลบจะเกิดขึ้นใน Home.jsx หลังยืนยัน
    // ฟังก์ชันนี้แค่จัดการการอัปเดต maps และ UI
    this.maps.splice(selectedIndex, 1);
    this.maps.forEach((map, i) => {
      map.index = i;
    });
    this.updateMapSelect();
  }
}