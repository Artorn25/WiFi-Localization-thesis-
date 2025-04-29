import Swal from "sweetalert2/dist/sweetalert2.js";

export class MapManager {
  constructor(mapSelectRef) {
    this.maps = [];
    this.mapSelectRef = mapSelectRef; // รับ mapSelectRef จาก constructor
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
    console.log("Editing map name for src:", mapSrc);
    const { value: mapName } = await Swal.fire({
      title: "Enter a name for this map",
      input: "text",
      inputAttributes: {
        style: "width: 80%; margin: 0 auto;", 
        size: "20" 
      },
      placeholder: "Map name",
      showCancelButton: true,
      allowOutsideClick: false,
      allowEscapeKey: false,
      inputValidator: (value) => {
        if (!value.trim()) {
          return "You need to write a map name!";
        }
        if (this.maps.some((map) => map.name === value.trim())) {
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
      console.log("Map added:", this.maps);
      return this.maps.length - 1;
    }
    return null;
  }

  updateMapSelect() {
    console.log("Updating map select, maps:", this.maps);
    const mapSelect = this.mapSelectRef?.current;
    if (!mapSelect) {
      console.warn("Map select element not found");
      return;
    }
    mapSelect.innerHTML = "<option value=''>Select Map</option>";
    this.maps.forEach((map, index) => {
      const option = document.createElement("option");
      option.value = index;
      option.textContent = map.name || `Map ${index + 1}`;
      mapSelect.appendChild(option);
    });
  }

  deleteMap(selectedIndex, canvasUtils) {
    console.log("Deleting map with index:", selectedIndex);
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
          this.mapSelectRef.current.value = 0;
          canvasUtils.img.src = this.maps[0].src;
        }
      }
    });
  }
}
