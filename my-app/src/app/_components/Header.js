"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import "@styles/header.css";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [isClient, setIsClient] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const navItems = [
    { path: "/", name: "Home" },
    { path: "/map", name: "Interactive Map" },
    { path: "/wifi", name: "WiFi Hotspots" },
    { path: "/dashboard", name: "Analytics" },
  ];

  return (
    <header className="header">
      <div className="header-container">
        <Link
          href="/"
          className="logo-wrapper"
          onClick={() => setMenuOpen(false)}
        >
          <div className="logo-3d">
            <Image
              src="/logo.png"
              alt="WiFi Localization Logo"
              width={40}
              height={40}
              priority
              className="logo-image"
            />
          </div>
          <span className="logo-text">WiFi Localization</span>
        </Link>

        <button
          className={`menu-toggle ${menuOpen ? "open" : ""}`}
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
          <span className="toggle-bar"></span>
        </button>

        <nav className={`nav-menu ${menuOpen ? "open" : ""}`}>
          <ul className="nav-list">
            {navItems.map((item) => (
              <li key={item.path}>
                <Link
                  href={item.path}
                  className={`nav-link ${
                    pathname === item.path ? "active" : ""
                  }`}
                  onClick={() => setMenuOpen(false)}
                >
                  {item.name}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
