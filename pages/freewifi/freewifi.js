document.addEventListener('DOMContentLoaded', function() {
    const wifiOptions = document.querySelectorAll('.wifi-option');

    wifiOptions.forEach(option => {
        option.addEventListener('click', function() {
            const wifiName = this.querySelector('h2').textContent;
            alert(`You selected ${wifiName}. Connecting...`);
            // Here you would typically add logic to actually connect to the WiFi
        });
    });
});