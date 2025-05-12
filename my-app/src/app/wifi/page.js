import Image from "next/image";
import Link from "next/link";
import "@styles/freerouter.css";

export default function FreeWiFi() {
  return (
    <div className="freerouter">
      <div className="wifi-container">
        <div className="header-section">
          <h1 className="topic-wifi">Free WiFi Options</h1>
          <p className="subtitle">Choose your preferred WiFi service provider</p>
        </div>
        
        <div className="wifi-options">
          <div className="wifi-option" id="bu-wifi">
            <Link href="/wifi/bu" className="wifi-link">
              <div className="logo-container">
                <div className="logo-bg"></div>
                <Image
                  src="/logob.jpg"
                  alt="BU WiFi Logo"
                  width={120}
                  height={120}
                  className="wifi-logo"
                />
              </div>
              <h2>BU WiFi</h2>
              <p className="wifi-description">University-wide high-speed network</p>
              <div className="hover-indicator">
                <span>Click to explore</span>
                <div className="arrow">→</div>
              </div>
            </Link>
          </div>

          <div className="wifi-option" id="ais">
            <Link href="/wifi/ais" className="wifi-link">
              <div className="logo-container">
                <div className="logo-bg"></div>
                <Image
                  src="/logoa.jpg"
                  alt="AIS Logo"
                  width={120}
                  height={120}
                  className="wifi-logo"
                />
              </div>
              <h2>AIS WiFi</h2>
              <p className="wifi-description">Public WiFi hotspots nationwide</p>
              <div className="hover-indicator">
                <span>Click to explore</span>
                <div className="arrow">→</div>
              </div>
            </Link>
          </div>

          <div className="wifi-option" id="true">
            <Link href="/wifi/true" className="wifi-link">
              <div className="logo-container">
                <div className="logo-bg"></div>
                <Image
                  src="/logot.jpg"
                  alt="True Logo"
                  width={120}
                  height={120}
                  className="wifi-logo"
                />
              </div>
              <h2>True WiFi</h2>
              <p className="wifi-description">High-speed internet access</p>
              <div className="hover-indicator">
                <span>Click to explore</span>
                <div className="arrow">→</div>
              </div>
            </Link>
          </div>
        </div>

        <Link href="/" className="back-button">
          <span>Back to Home</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </Link>
      </div>
    </div>
  );
}