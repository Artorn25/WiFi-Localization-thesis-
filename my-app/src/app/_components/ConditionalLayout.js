"use client"; // ระบุว่าเป็น Client Component

import { usePathname } from "next/navigation";
import Header from "@components/Header";
import Footer from "@components/Footer";
import ReportButton from "@components/ReportButton";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";

  return (
    <>
      {!isHomePage && <Header />}
      {children}
      <ReportButton />
      <Footer />
    </>
  );
}
