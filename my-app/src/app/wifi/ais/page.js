"use client";
import "@styles/ais.css";
import Image from "next/image";
import { useState, useEffect, useRef } from "react";

export default function Ais() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("android");
  const [showScrollButton, setShowScrollButton] = useState(false);
  const imageRefs = useRef([]);

  // กำหนดรูปภาพสำหรับแต่ละ Tab
  const imageSources = {
    android: [
      "/wifia1.jpg",
      "/wifia2.jpg",
      "/wifia3.jpg"
    ],
    ios: [
      "/wifia4.jpg",
      "/wifia5.jpg",
      "/wifia6.jpg",
      "/wifia7.jpg"
    ]
  };

  useEffect(() => {
    // Load GSAP
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js";
    script.async = true;
    document.body.appendChild(script);

    // Handle scroll event
    const handleScroll = () => {
      if (window.scrollY > 300) {
        setShowScrollButton(true);
      } else {
        setShowScrollButton(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      document.body.removeChild(script);
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const openModal = (index) => {
    setCurrentImageIndex(index);
    setIsModalOpen(true);
    document.body.style.overflow = 'hidden';
  };

  const closeModal = () => {
    setIsModalOpen(false);
    document.body.style.overflow = 'auto';
  };

  const changeImage = (step) => {
    const currentImages = imageSources[activeTab];
    let newIndex = currentImageIndex + step;
    if (newIndex >= currentImages.length) newIndex = 0;
    if (newIndex < 0) newIndex = currentImages.length - 1;
    setCurrentImageIndex(newIndex);
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth"
    });
  };

  const openTab = (e, tabName) => {
    e.preventDefault();
    setActiveTab(tabName);
    setCurrentImageIndex(0); // รีเซ็ต index เมื่อเปลี่ยน Tab
  };

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!isModalOpen) return;
      if (e.key === 'Escape') closeModal();
      if (e.key === 'ArrowLeft') changeImage(-1);
      if (e.key === 'ArrowRight') changeImage(1);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen, activeTab, currentImageIndex]);

  return (
    <div className="main">
      <div className="ais-container">
        <h1 className="topic-ais">AIS WiFi</h1>
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
              className={`tab-button ${activeTab === "android" ? "active" : ""}`}
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
              {imageSources.android.map((src, index) => (
                <div 
                  key={`android-${index}`} 
                  className="image-wrapper"
                  onClick={() => openModal(index)}
                  ref={el => imageRefs.current[`android-${index}`] = el}
                >
                  <Image
                    src={src}
                    alt={`AIS Android WiFi ${index + 1}`}
                    width={200}
                    height={200}
                    quality={85}
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>
          
          <div
            id="ios"
            className={`tab-content ${activeTab === "ios" ? "active" : ""}`}
          >
            <h2>iOS Instructions</h2>
            <div className="image-grid">
              {imageSources.ios.map((src, index) => (
                <div 
                  key={`ios-${index}`} 
                  className="image-wrapper"
                  onClick={() => openModal(index)}
                  ref={el => imageRefs.current[`ios-${index}`] = el}
                >
                  <Image
                    src={src}
                    alt={`AIS iOS WiFi ${index + 1}`}
                    width={200}
                    height={200}
                    quality={85}
                    loading="eager"
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        <a href="/wifi" className="back-button">
          Back to WiFi Options
        </a>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <span className="close" onClick={closeModal}>
              &times;
            </span>
            
            <div className="modal-image-container">
              <Image
                className="modal-content"
                src={imageSources[activeTab][currentImageIndex]}
                alt={`Modal Image ${currentImageIndex + 1}`}
                width={800}
                height={600}
                quality={100}
              />
            </div>
            
            <div className="navigation">
              <button className="nav-button prev" onClick={(e) => {
                e.stopPropagation();
                changeImage(-1);
              }}>
                &#10094;
              </button>
              <button className="nav-button next" onClick={(e) => {
                e.stopPropagation();
                changeImage(1);
              }}>
                &#10095;
              </button>
            </div>
            
            <div className="image-counter">
              {currentImageIndex + 1} / {imageSources[activeTab].length}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to top button */}
      <div 
        className={`scroll-to-top ${showScrollButton ? "show" : ""}`} 
        onClick={scrollToTop}
      >
        ↑
      </div>
    </div>
  );
}