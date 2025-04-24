import Image from "next/image";
import Link from "next/link";

import "@styles/freerouter.css";

export default function FreeWiFi() {
  return (
    <>
      <div className="freerouter">
        <div className="wifi-container">
          <h1>Free WiFi Options</h1>
          <div className="wifi-options">
            <div className="wifi-option" id="bu-wifi">
              <Link href="/wifi/bu" className="wifi-link">
                <div className="logo-container">
                  <Image
                    src="/logob.jpg"
                    alt="BU WiFi Logo"
                    width={120}
                    height={120}
                    className="wifi-logo"
                  />
                </div>
                <h2>BU WiFi</h2>
              </Link>
            </div>
            <div className="wifi-option" id="ais">
              <Link href="/wifi/ais" className="wifi-link">
                <div className="logo-container">
                  <Image
                    src="/logoa.jpg"
                    alt="AIS Logo"
                    width={120}
                    height={120}
                    className="wifi-logo"
                  />
                </div>
                <h2>AIS</h2>
              </Link>
            </div>
            <div className="wifi-option" id="true">
              <Link href="/wifi/true" className="wifi-link">
                <div className="logo-container">
                  <Image
                    src="/logot.jpg"
                    alt="True Logo"
                    width={120}
                    height={120}
                    className="wifi-logo"
                  />
                </div>
                <h2>True</h2>
              </Link>
            </div>
          </div>
          <Link href="/" className="back-button">
            Back to Home
          </Link>
        </div>
      </div>
    </>
  );
}
