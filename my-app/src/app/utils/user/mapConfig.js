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
  }

  // ลบฟังก์ชัน updateMapSelect ออก เนื่องจากจัดการใน React แล้ว
  updateMapSelect() {
    // ไม่ต้องใช้แล้ว เนื่องจากจัดการใน Home.jsx ผ่าน React state
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

    // ลบแผนที่
    this.maps.splice(selectedIndex, 1);
    this.maps.forEach((map, i) => {
      map.index = i;
    });
  }
}