"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import Header from "../../components/Header";
import Footer from "../../components/Footer";

import "./styles/homepage.css";

export default function Home() {
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const router = useRouter();

  const scrollToDiscover = () => {
    const discoverSection = document.getElementById("discover-section");
    discoverSection.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    function loadFontSetting() {
      const savedFont = localStorage.getItem("selectedFont");
      if (savedFont) {
        document.body.style.fontFamily = savedFont;
      }
    }
    loadFontSetting();

    const sidebar = sidebarRef.current;
    const toggleBtn = toggleBtnRef.current;

    if (toggleBtn) {
      toggleBtn.addEventListener("click", () => {
        sidebar.classList.toggle("open");
        toggleBtn.setAttribute(
          "aria-expanded",
          sidebar.classList.contains("open")
        );
      });
    }

    return () => {
      if (toggleBtn) toggleBtn.removeEventListener("click", () => {});
    };
  }, []);

  return (
    <>
      <div className="background-image"></div>
      <Header />

      <main className="main-content">
        <header>
          <h1>WiFi Localization</h1>
          <p className="subtitle">
            Connect to <span>the world</span> instantly
          </p>
          <button className="cta-button" onClick={scrollToDiscover}>
            What is Wifi Localization?
          </button>
        </header>

        <div className="container">
          <section className="features">
            <div className="feature-grid">
              <div className="feature-card revealed">
                <Image
                  src="/maps-icon.gif"
                  alt="Feature 1"
                  width={30}
                  height={30}
                />
                <h3>Real-time Mapping</h3>
                <p>Stay connected with up-to-date maps and data.</p>
              </div>
              <div className="feature-card revealed">
                <Image
                  src="/wifi-icon.gif"
                  alt="Feature 2"
                  width={30}
                  height={30}
                />
                <h3>High-Speed WiFi</h3>
                <p>Enjoy blazing-fast internet on the go.</p>
              </div>
              <div className="feature-card revealed">
                <Image
                  src="/locate-icon.gif"
                  alt="Feature 3"
                  width={30}
                  height={30}
                />
                <h3>Easy Setup</h3>
                <p>Get started with just a few clicks.</p>
              </div>
            </div>
          </section>
        </div>

        <section id="discover-section" className="mt-20 p-10 bg-gray-100">
          <h2 className="text-3xl font-bold text-center mb-6">
            What is Wifi localization?
          </h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            WiFi Localization is a technique used to determine the location of a
            device (such as a smartphone, laptop, or IoT device) using WiFi
            signals instead of GPS or other sensors. This method is useful for
            both indoor and outdoor positioning.
          </p>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              How WiFi Localization Works
            </h3>
            <ul className="list-disc list-inside space-y-4">
              <li>
                <strong>Received Signal Strength Indicator (RSSI):</strong>{" "}
                Measures the strength of WiFi signals from multiple Access
                Points (APs) and calculates the distance from each AP to
                determine the device&apos;s location.
              </li>
              <li>
                <strong>Time of Flight (ToF) or Round Trip Time (RTT):</strong>{" "}
                Uses the travel time of signals to calculate the distance
                between the device and APs.
              </li>
              <li>
                <strong>Fingerprinting:</strong> Creates a database of WiFi
                signal characteristics at different locations and compares
                real-time data with this database to determine the device’s
                position.
              </li>
              <li>
                <strong>Angle of Arrival (AoA):</strong> Measures the angle at
                which the signal reaches the APs to calculate the device’s
                location.
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Advantages of WiFi Localization
            </h3>
            <ul className="list-disc list-inside space-y-4">
              <li>Works well indoors, where GPS is less effective.</li>
              <li>
                Requires minimal additional hardware since most modern devices
                already support WiFi.
              </li>
              <li>
                Can be combined with other technologies like Bluetooth, LiDAR,
                and AI to improve accuracy.
              </li>
            </ul>
          </div>

          <div className="mt-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              Applications
            </h3>
            <ul className="list-disc list-inside space-y-4">
              <li>
                <strong>Indoor Navigation:</strong> Used in shopping malls,
                airports, and hospitals for navigation assistance.
              </li>
              <li>
                <strong>Asset and Personnel Tracking:</strong> Used in
                industries, warehouses, and logistics for monitoring the
                movement of devices or people.
              </li>
              <li>
                <strong>Smart Homes & IoT:</strong> Helps detect device movement
                and enable automation based on location.
              </li>
            </ul>
          </div>

          <p className="mt-8 text-lg text-gray-700 leading-relaxed">
            Are you interested in a specific application of WiFi localization?
          </p>
        </section>

        <Footer />
      </main>
    </>
  );
}
