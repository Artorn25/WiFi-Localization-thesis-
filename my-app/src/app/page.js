"use client";
import Image from "next/image";
import Link from "next/link";
import Head from "next/head";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import "./styles/homepage.css";

export default function Home() {
  const sidebarRef = useRef(null);
  const toggleBtnRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    // ฟังก์ชันสำหรับโหลดฟอนต์จาก localStorage
    function loadFontSetting() {
      const savedFont = localStorage.getItem("selectedFont");
      if (savedFont) {
        document.body.style.fontFamily = savedFont;
      }
    }
    loadFontSetting();

    // ตรวจสอบว่า elements มีอยู่ก่อนหรือไม่
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

  function searchPage(event) {
    event.preventDefault();
    const searchQuery = document
      .getElementById("searchInput")
      .value.toLowerCase();
    const pages = {
      maps: "/maps",
      "free wifi": "/freewifi",
      "wifi router": "/wifirouter",
      dashboard: "/dashboard",
      setting: "/setting",
      feedback: "/feedback",
    };

    for (const page in pages) {
      if (page.includes(searchQuery)) {
        router.push(pages[page]); // ใช้ Next.js navigation
        return;
      }
    }

    alert("No matching page found.");
  }

  return (
    <>
      {/* ✅ แก้ไขให้ใช้ <Head> แทน useEffect */}
      <div className="background-image"></div>
      <div ref={sidebarRef} className="sidebar" aria-hidden="true">
        <span
          className="close-btn"
          id="close-sidebar"
          onClick={() => sidebarRef.current.classList.remove("open")}
        >
          &times;
        </span>
        <ul>
          <li>
            <Link href="/maps">Maps</Link>
          </li>
          <li>
            <Link href="/freewifi">Free Wifi</Link>
          </li>
          <li>
            <Link href="/wifirouter">Wifi Router</Link>
          </li>
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          <li>
            <Link href="/setting">Setting</Link>
          </li>
          <li>
            <Link href="/feedback">Feedback</Link>
          </li>
        </ul>
      </div>

      <main className="main-content">
        <nav className="navbartop navbar-expand-lg bg-body-tertiary">
          <div className="container d-flex justify-content-between">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0">
              <li>
                <Link href="/maps" className="nav-link text-secondary">
                  Maps
                </Link>
              </li>
              <li>
                <Link href="/freewifi" className="nav-link text-secondary">
                  Free Wifi
                </Link>
              </li>
              <li>
                <Link href="/wifirouter" className="nav-link text-secondary">
                  Wifi Router
                </Link>
              </li>
              <li>
                <Link href="/dashboard" className="nav-link text-secondary">
                  Dashboard
                </Link>
              </li>
            </ul>

            <form
              className="d-flex input-group w-auto search-bar"
              onSubmit={searchPage}
            >
              <input
                id="searchInput"
                type="search"
                className="form-control search-input"
                placeholder="Search for maps"
              />
              <button className="btn btn-warning search-button" type="submit">
                Search
              </button>
            </form>

            <button
              ref={toggleBtnRef}
              className="navbar-toggler togglebtn ms-auto"
              type="button"
              aria-controls="sidebar"
              aria-expanded="true"
            >
              <Image
                src="/square-ellipsis.png"
                className="img-fluid"
                alt=""
                width={30}
                height={30}
              />
            </button>
          </div>
        </nav>

        <header>
          <h1>WiFi Localization</h1>
          <p className="subtitle">
            Connect to <span>the world</span> instantly
          </p>
          <button className="cta-button">Get Started</button>
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

        <footer className="bg-body-tertiary text-center text-lg-start">
          <div
            className="text-center p-3"
            style={{ backgroundColor: "rgba(0, 0, 0, 0.05)" }}
          >
            © 2024 test server:{" "}
            <a className="text-body" href="">
              WIFI Project
            </a>
          </div>
        </footer>
      </main>
    </>
  );
}
