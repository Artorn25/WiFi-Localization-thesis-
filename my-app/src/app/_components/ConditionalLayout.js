"use client"; // ระบุว่าเป็น Client Component

import { usePathname } from "next/navigation";
import Header from "@components/Header";
import Footer from "@components/Footer";
import ReportButton from "@components/ReportButton";
import Loading from "@components/Loading";
import { useEffect, useState } from "react";

export default function ConditionalLayout({ children }) {
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        await new Promise((resolve) => setTimeout(resolve, 2500));
      } finally {
        setIsInitialLoading(false);
      }
    };
    initialize();
  }, []);

  return (
    <>
     {isInitialLoading ? (
          <Loading />
        ) : (
          <>
            {!isHomePage && <Header />}
            {children}
            <ReportButton />
            <Footer />
          </>
        )}
    </>
  );
}
