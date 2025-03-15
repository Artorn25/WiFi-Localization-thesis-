"use client";
import Image from "next/image";
import "@styles/bu.css";
import { useState, useEffect } from "react";

export default function Bu() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [images, setImages] = useState([]);

  useEffect(() => {
    // โค้ดที่เกี่ยวข้องกับ `document` และ `window` ต้องอยู่ใน useEffect
    const imageElements = document.querySelectorAll(".image-grid img");
    setImages(Array.from(imageElements));

    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function openModal(img) {
    const modal = document.getElementById("imageModal");
    const modalImg = document.getElementById("modalImage");
    modal.style.display = "block";
    modalImg.src = img.src;
    setCurrentImageIndex(Array.from(images).indexOf(img));
    setTimeout(() => (modal.style.opacity = "1"), 10);
  }

  function closeModal() {
    const modal = document.getElementById("imageModal");
    modal.style.opacity = "0";
    setTimeout(() => (modal.style.display = "none"), 300);
  }

  function changeImage(step) {
    let newIndex = currentImageIndex + step;
    if (newIndex >= images.length) {
      newIndex = 0;
    } else if (newIndex < 0) {
      newIndex = images.length - 1;
    }
    setCurrentImageIndex(newIndex);
    const modalImg = document.getElementById("modalImage");
    modalImg.src = images[newIndex].src;
    modalImg.style.animation = "none";
    modalImg.offsetHeight; // trigger reflow
    modalImg.style.animation = null;
  }

  useEffect(() => {
    // Close the modal when clicking outside the image
    const handleClickOutside = (event) => {
      const modal = document.getElementById("imageModal");
      if (event.target === modal) {
        closeModal();
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => {
      window.removeEventListener("click", handleClickOutside);
    };
  }, []);

  function testSpeed() {
    const speedResult = document.getElementById("speed-result");
    speedResult.textContent = "Testing...";

    // Simulate a speed test (this is just for demonstration)
    setTimeout(() => {
      const speed = Math.floor(Math.random() * 500) + 500; // Random speed between 500-1000 Mbps
      speedResult.textContent = `Your current WiFi speed: ${speed} Mbps`;

      // Add a visual indicator
      if (speed < 600) {
        speedResult.style.color = "#ff6b6b";
      } else if (speed < 800) {
        speedResult.style.color = "#feca57";
      } else {
        speedResult.style.color = "#48dbfb";
      }
    }, 3000);
  }

  useEffect(() => {
    // Animate WiFi speed on page load
    const speedElement = document.querySelector(".wifi-speed");
    let speed = 0;
    const interval = setInterval(() => {
      speed += 50;
      if (speed <= 1000) {
        speedElement.textContent = `Up to ${speed} Mbps Speed`;
      } else {
        clearInterval(interval);
      }
    }, 50);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <header>
        <h1>BU WiFi</h1>
        <p className="subtitle">
          Experience Lightning-Fast Campus Connectivity
        </p>
        <p className="wifi-speed">Up to 1 Gbps Speed</p>
      </header>

      <div className="container">
        <div className="content">
          <p>
            Welcome to BU WiFi, your gateway to seamless, high-speed internet
            access across the entire campus. Enjoy browsing, streaming, and
            collaborating with unparalleled ease and speed!
          </p>

          <div className="features">
            <div className="feature">
              <div className="feature-icon">🚀</div>
              <h3>High-Speed</h3>
              <p>Lightning-fast connectivity up to 1 Gbps</p>
            </div>
            <div className="feature">
              <div className="feature-icon">🔒</div>
              <h3>Secure</h3>
              <p>Enterprise-level security protocols</p>
            </div>
            <div className="feature">
              <div className="feature-icon">📡</div>
              <h3>Campus-Wide</h3>
              <p>Seamless coverage across all buildings</p>
            </div>
          </div>

          <div className="image-grid">
            {[...Array(9)].map((_, index) => (
              <Image
                key={index}
                src={`/wifib${index + 1}.jpg`} // ตรวจสอบว่ารูปอยู่ใน public
                alt={`BU WiFi Image ${index + 1}`}
                onClick={(e) => openModal(e.target)}
                width={200}
                height={200}
              />
            ))}
          </div>

          <div className="speed-test">
            <h3>Test Your WiFi Speed</h3>
            <button onClick={testSpeed}>Start Speed Test</button>
            <div id="speed-result"></div>
          </div>
        </div>
        <a href="/wifi" className="back-button">
          Back to WiFi Options
        </a>
      </div>

      {/* Modal */}
      <div id="imageModal" className="modal">
        <span className="close" onClick={closeModal}>
          &times;
        </span>
        {images[currentImageIndex] && ( // ตรวจสอบว่ามีภาพก่อนแสดง
          <Image
            className="modal-content"
            id="modalImage"
            src={images[currentImageIndex].src}
            alt={`Modal Image ${currentImageIndex + 1}`}
            width={500}
            height={500}
          />
        )}
        <div className="navigation">
          <a className="prev" onClick={() => changeImage(-1)}>
            &#10094;
          </a>
          <a className="next" onClick={() => changeImage(1)}>
            &#10095;
          </a>
        </div>
      </div>
      <div className="wifi-icon">📶</div>
    </>
  );
}
