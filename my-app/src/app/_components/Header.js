import "@styles/homepage.css";
import Link from "next/link";
import Image from "next/image";
// import SearchForm from "./SearchForm"; // นำเข้า Client Component

export default function Header() {
  return (
    <>
      <div className="sidebar oswald-bold">
        
        <ul className="menu-list">
        <div className="sidebar-logo">
          <Image
            src="/logo.png"
            alt="Website Logo"
            width={40} // ปรับขนาดตามต้องการ
            height={40}
          />
          <span className="logo-text">WiFi Localization</span>{" "}
          {/* ข้อความเสริม (optional) */}
        </div>
          <li>
            <Link href="/">Home</Link>
          </li>
          <li>
            <Link href="/map">Maps</Link>
          </li>
          <li>
            <Link href="/wifi">Free Wifi</Link>
          </li>
          {/* <li>
            <Link href="/wifi-router">Wifi Router</Link>
          </li> */}
          <li>
            <Link href="/dashboard">Dashboard</Link>
          </li>
          {/* <li>
            <Link href="/setting">Setting</Link>
          </li> */}
          {/* <li>
            <Link href="/feedback">Feedback</Link>
          </li> */}
          {/* <SearchForm /> ใช้ Client Component ที่สร้างขึ้น */}
        </ul>
      </div>
    </>
  );
}
