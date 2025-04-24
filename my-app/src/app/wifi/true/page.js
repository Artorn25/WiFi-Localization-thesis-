"use client";
import React, { useEffect } from "react";
import "@styles/true.css";
const TrueWifi = () => {
  return (
    <div className="main">
      <div className="true-container">
        <div className="wifiIcon"></div>
        <h1>True WiFi</h1>
        <div className="content">
          <p>
            Experience True WiFi for lightning-fast, reliable internet
            connectivity. Stay connected anywhere, anytime with our cutting-edge
            network technology.
          </p>
          <p>
            Enjoy seamless streaming, gaming, and browsing with True WiFi&apos;s
            unparalleled speed and coverage.
          </p>
        </div>
        <div className="features">
          <div className="feature">
            <div className="featureIcon">🚀</div>
            <h3>Lightning Fast</h3>
            <p>Blazing speeds for all your needs</p>
          </div>
          <div className="feature">
            <div className="featureIcon">🔒</div>
            <h3>Secure</h3>
            <p>Advanced encryption for your safety</p>
          </div>
          <div className="feature">
            <div className="featureIcon">🌐</div>
            <h3>Everywhere</h3>
            <p>Wide coverage across the country</p>
          </div>
        </div>
        <a href="/wifi" className="backButton">
          Back to WiFi Options
        </a>
      </div>
    </div>
  );
};

export default TrueWifi;
