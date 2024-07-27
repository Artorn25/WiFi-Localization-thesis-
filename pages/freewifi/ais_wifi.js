let currentImageIndex = 0;
let currentImages = [];

function openTab(evt, tabName) {
    const tabContents = document.getElementsByClassName("tab-content");
    for (let i = 0; i < tabContents.length; i++) {
        tabContents[i].classList.remove("active");
    }

    const tabButtons = document.getElementsByClassName("tab-button");
    for (let i = 0; i < tabButtons.length; i++) {
        tabButtons[i].classList.remove("active");
    }

    document.getElementById(tabName).classList.add("active");
    evt.currentTarget.classList.add("active");

    // อัปเดตรายการรูปภาพสำหรับแท็บปัจจุบัน
    currentImages = Array.from(document.querySelectorAll(`#${tabName} .image-grid img`));
}

function openModal(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = img.src;
    currentImageIndex = currentImages.indexOf(img);
}

function closeModal() {
    document.getElementById("imageModal").style.display = "none";
}

function changeImage(step) {
    currentImageIndex += step;
    if (currentImageIndex >= currentImages.length) {
        currentImageIndex = 0;
    } else if (currentImageIndex < 0) {
        currentImageIndex = currentImages.length - 1;
    }
    const modalImg = document.getElementById("modalImage");
    modalImg.src = currentImages[currentImageIndex].src;
}

// ปิดโมดัลเมื่อคลิกนอกรูปภาพ
window.onclick = function(event) {
    const modal = document.getElementById("imageModal");
    if (event.target == modal) {
        closeModal();
    }
}

// เพิ่มการจัดการคีย์บอร์ด
document.addEventListener('keydown', function(event) {
    if (document.getElementById("imageModal").style.display === "block") {
        if (event.key === "ArrowRight") {
            changeImage(1);
        } else if (event.key === "ArrowLeft") {
            changeImage(-1);
        } else if (event.key === "Escape") {
            closeModal();
        }
    }
});

// เริ่มต้นแท็บแรก
document.querySelector('.tab-button').click();