import Swal from "sweetalert2";

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
      this.maps.push({ src: mapSrc, name: mapName });
      this.updateMapSelect();
      return this.maps.length - 1;
    }
    return null;
  }

  updateMapSelect() {
    const mapSelect = document.getElementById("map-select");
    mapSelect.innerHTML = "<option value=''>Select Map</option>";
    this.maps.forEach((map, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = map.name || `Map ${index + 1}`;
      mapSelect.appendChild(option);
    });
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
    if (
      this.checkCondition.Equal(selectedIndex, "Please select a map to delete.")
    )
      return;

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
        this.alert("Map deleted", "Map deleted successfully", "success");
        this.maps.splice(selectedIndex, 1);
        this.updateMapSelect();

        canvasUtils.resetCanvas();
        if (this.maps.length > 0) {
          document.getElementById("map-select").value = 0;
          canvasUtils.img.src = this.maps[0].src;
        }
      }
    });
  }
}
