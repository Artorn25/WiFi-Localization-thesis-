"use client";
import "@styles/ais.css";
import Image from "next/image";
import { useState, useEffect } from "react";

export default function Ais() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState("android");
  const images = [
    { src: "/wifia1.jpg" },
    { src: "/wifia2.jpg" },
    { src: "/wifia3.jpg" },
    { src: "/wifia4.jpg" },
    { src: "/wifia5.jpg" },
    { src: "/wifia6.jpg" },
    { src: "/wifia7.jpg" },
  ];

  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  function closeModal() {
    var modal = document.getElementById("imageModal");
    modal.classList.remove("show");
    setTimeout(() => (modal.style.display = "none"), 300);
  }

  function changeImage(n) {
    let newIndex = currentImageIndex + n;
    if (newIndex >= images.length) {
      newIndex = 0;
    } else if (newIndex < 0) {
      newIndex = images.length - 1;
    }
    setCurrentImageIndex(newIndex);
    document.getElementById("modalImage").src = images[newIndex].src;
  }

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function openTab(event, tabName) {
    event.preventDefault();
    setActiveTab(tabName);
  }

  if (typeof window !== "undefined") {
    window.onscroll = function () {
      var scrollTopBtn = document.querySelector(".scroll-to-top");
      if (
        document.body.scrollTop > 20 ||
        document.documentElement.scrollTop > 20
      ) {
        scrollTopBtn.classList.add("show");
      } else {
        scrollTopBtn.classList.remove("show");
      }
    };
  }

  return (
    <>
      <div className="container">
        <h1>AIS WiFi</h1>
        <div className="content">
          <svg
            className="wifi-icon"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M5 12.55a11 11 0 0 1 14.08 0"></path>
            <path d="M1.42 9a16 16 0 0 1 21.16 0"></path>
            <path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path>
            <line x1="12" y1="20" x2="12" y2="20"></line>
          </svg>
          <p>
            Connect to AIS WiFi for blazing-fast internet access. Choose your
            device type below to get started:
          </p>
          <div className="tabs">
            <button
              className={`tab-button ${
                activeTab === "android" ? "active" : ""
              }`}
              onClick={(e) => openTab(e, "android")}
            >
              Android
            </button>
            <button
              className={`tab-button ${activeTab === "ios" ? "active" : ""}`}
              onClick={(e) => openTab(e, "ios")}
            >
              iOS
            </button>
          </div>

          <div
            id="android"
            className={`tab-content ${activeTab === "android" ? "active" : ""}`}
          >
            <h2>Android Instructions</h2>
            <div className="image-grid">
              {images.map((image, index) => (
                <Image
                  key={index}
                  src={image.src}
                  alt={`AIS Android WiFi ${index + 1}`}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    document.getElementById("imageModal").style.display =
                      "block";
                    document.getElementById("imageModal").classList.add("show");
                  }}
                  width={200}
                  height={200}
                />
              ))}
            </div>
          </div>
          <div
            id="ios"
            className={`tab-content ${activeTab === "ios" ? "active" : ""}`}
          >
            <h2>iOS Instructions</h2>
            <div className="image-grid">
              {images.map((image, index) => (
                <Image
                  key={index}
                  src={image.src}
                  alt={`AIS iOS WiFi ${index + 1}`}
                  onClick={() => {
                    setCurrentImageIndex(index);
                    document.getElementById("imageModal").style.display =
                      "block";
                    document.getElementById("imageModal").classList.add("show");
                  }}
                  width={200}
                  height={200}
                />
              ))}
            </div>
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
        <Image
          className="modal-content"
          id="modalImage"
          src={images[currentImageIndex].src}
          alt={`Modal Image ${currentImageIndex + 1}`} // เพิ่มบรรทัดนี้
          width={500}
          height={500}
        />
        <div className="navigation">
          <a className="prev" onClick={() => changeImage(-1)}>
            &#10094;
          </a>
          <a className="next" onClick={() => changeImage(1)}>
            &#10095;
          </a>
        </div>
      </div>
      <div className="scroll-to-top" onClick={scrollToTop}>
        ↑
      </div>
    </>
  );
}
