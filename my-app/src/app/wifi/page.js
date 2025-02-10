import Image from "next/image";
import Link from "next/link";

import "../styles/freerouter.css";

export default function FreeWiFi() {
  return (
    <>
      <div className="container">
        <h1>Free WiFi Options</h1>
        <div className="wifi-options">
          <div className="wifi-option" id="bu-wifi">
            <Link href="/wifi/bu">
              <Image
                src="/logob.jpg"
                alt="BU WiFi Logo"
                width={100}
                height={100}
              />
              <h2>BU WiFi</h2>
            </Link>
          </div>
          <div className="wifi-option" id="ais">
            <a href="/wifi/ais">
              <Image src="/logoa.jpg" alt="AIS Logo" width={100} height={100} />
              <h2>AIS</h2>
            </a>
          </div>
          <div className="wifi-option" id="true">
            <a href="/wifi/true">
              <Image
                src="/logot.jpg"
                alt="True Logo"
                width={100}
                height={100}
              />
              <h2>True</h2>
            </a>
          </div>
        </div>
        <Link href="/" className="back-button">
          Back to Home
        </Link>
      </div>
    </>
  );
}
