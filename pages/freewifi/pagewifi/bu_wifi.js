let currentImageIndex = 0;
const images = document.querySelectorAll('.image-grid img');

function openModal(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = img.src;
    currentImageIndex = Array.from(images).indexOf(img);
}

function closeModal() {
    document.getElementById("imageModal").style.display = "none";
}

function changeImage(step) {
    currentImageIndex += step;
    if (currentImageIndex >= images.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = images.length - 1;
    }
    const modalImg = document.getElementById("modalImage");
    modalImg.src = images[currentImageIndex].src;
}

// Close the modal when clicking outside the image
window.onclick = function(event) {
    const modal = document.getElementById("imageModal");
    if (event.target == modal) {
        closeModal();
    }
}