document.addEventListener('DOMContentLoaded', function() {
    const zoomIn = document.getElementById('zoom-in');
    const zoomOut = document.getElementById('zoom-out');
    const mapSelect = document.getElementById('map-select');
    const deleteMap = document.getElementById('delete-map');
    const mapUpload = document.getElementById('map-upload');
    const mapImage = document.getElementById('map-image');

    let scale = 1;
    let maps = {};

    // Load data from localStorage if available
    const savedMaps = localStorage.getItem('campusMaps');
    if (savedMaps) {
        maps = JSON.parse(savedMaps);
        updateMapSelect();
    }

    zoomIn.addEventListener('click', function() {
        scale *= 1.1;
        mapImage.style.transform = `scale(${scale})`;
    });

    zoomOut.addEventListener('click', function() {
        scale /= 1.1;
        mapImage.style.transform = `scale(${scale})`;
    });

    mapSelect.addEventListener('change', function(e) {
        if (e.target.value) {
            mapImage.src = maps[e.target.value].url;
        }
    });

    deleteMap.addEventListener('click', function() {
        const selectedMap = mapSelect.value;
        if (!selectedMap) {
            alert('Please select a map to delete');
            return;
        }
        if (confirm(`Are you sure you want to delete the map "${selectedMap}"?`)) {
            delete maps[selectedMap];
            updateMapSelect();
            saveMaps();
            if (Object.keys(maps).length > 0) {
                mapSelect.value = Object.keys(maps)[0];
                mapImage.src = maps[Object.keys(maps)[0]].url;
            } else {
                mapImage.src = 'campus-map-placeholder.jpg';
            }
        }
    });

    mapUpload.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (file) {
            const mapName = prompt('Please enter a name for the map:');
            if (mapName) {
                const reader = new FileReader();
                reader.onload = function(event) {
                    maps[mapName] = {
                        url: event.target.result
                    };
                    mapImage.src = event.target.result;
                    updateMapSelect();
                    saveMaps();
                };
                reader.readAsDataURL(file);
            }
        }
    });

    function updateMapSelect() {
        mapSelect.innerHTML = '<option value="">Select Map</option>';
        for (let mapName in maps) {
            const option = document.createElement('option');
            option.value = mapName;
            option.textContent = mapName;
            mapSelect.appendChild(option);
        }
    }

    function saveMaps() {
        localStorage.setItem('campusMaps', JSON.stringify(maps));
    }
});