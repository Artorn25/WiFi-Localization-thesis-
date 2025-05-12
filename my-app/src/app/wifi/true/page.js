"use client";
import Image from "next/image";
import "@styles/bu.css";
import { useState, useEffect, useRef } from "react";

export default function Bu() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const imageRefs = useRef([]);

  const imageSources = Array.from({ length: 9 }, (_, i) => `/wifit${i + 1}.jpg`);

  useEffect(() => {
    // Load GSAP
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.11.4/gsap.min.js";
    script.async = true;
    document.body.appendChild(script);
    
    return () => {
      document.body.removeChild(script);
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
    let newIndex = currentImageIndex + step;
    if (newIndex >= imageSources.length) newIndex = 0;
    if (newIndex < 0) newIndex = imageSources.length - 1;
    setCurrentImageIndex(newIndex);
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
  }, [isModalOpen]);

  return (
    <div className="main">
      <header>
        <h1 className="topic-bu">BU WiFi</h1>
        <p className="subtitle">
          Experience Lightning-Fast Campus Connectivity
        </p>
        <p className="wifi-speed">Up to 1 Gbps Speed</p>
      </header>

      <div className="bu-container">
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
            {imageSources.map((src, index) => (
              <div 
                key={index} 
                className="image-wrapper"
                onClick={() => openModal(index)}
                ref={el => imageRefs.current[index] = el}
              >
                <Image
                  src={src}
                  alt={`True WiFi Image ${index + 1}`}
                  width={200}
                  height={200}
                  quality={85}
                  loading={index < 3 ? "eager" : "lazy"}
                />
              </div>
            ))}
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
                src={imageSources[currentImageIndex]}
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
              {currentImageIndex + 1} / {imageSources.length}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}