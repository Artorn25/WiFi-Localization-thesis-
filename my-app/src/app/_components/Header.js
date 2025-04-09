import "@styles/homepage.css";
import Link from "next/link";
import SearchForm from "./SearchForm"; // นำเข้า Client Component

export default function Header() {
  return (
    <>
      <div className="sidebar oswald-bold">
        <ul className="menu-list">
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
          <li>
            <Link href="/feedback">Feedback</Link>
          </li>
          <SearchForm /> {/* ใช้ Client Component ที่สร้างขึ้น */}
        </ul>
      </div>
    </>
  );
}
