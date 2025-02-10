"use client";
import React, { useEffect } from "react";

const TrueWifi = () => {
  // ฟังก์ชันสำหรับโหลดฟ้อนต์จาก localStorage
  useEffect(() => {
    const loadFontSetting = () => {
      const savedFont = localStorage.getItem("selectedFont");
      if (savedFont) {
        document.body.style.fontFamily = savedFont; // ตั้งฟ้อนต์ที่บันทึกไว้จาก localStorage
      }
    };
    loadFontSetting(); // เรียกใช้เมื่อหน้าโหลด
  }, []);

  // สไตล์ทั้งหมด
  const styles = {
    root: {
      fontFamily: "'Poppins', sans-serif",
      margin: 0,
      padding: 0,
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      minHeight: "100vh",
      color: "#333",
      background: "linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%)",
    },
    container: {
      backgroundColor: "rgba(255, 255, 255, 0.9)",
      padding: "3rem",
      borderRadius: "20px",
      boxShadow: "0 10px 30px rgba(0, 0, 0, 0.1)",
      maxWidth: "600px",
      width: "90%",
      position: "relative",
      overflow: "hidden",
    },
    containerBefore: {
      content: '""',
      position: "absolute",
      top: "-50%",
      left: "-50%",
      width: "200%",
      height: "200%",
      background:
        "radial-gradient(circle, rgba(255,82,82,0.1) 0%, rgba(255,255,255,0) 70%)",
      animation: "pulse 15s infinite",
    },
    h1: {
      color: "#bc0404",
      textAlign: "center",
      fontSize: "2.5rem",
      marginBottom: "1.5rem",
      textTransform: "uppercase",
      letterSpacing: "2px",
      position: "relative",
    },
    content: {
      marginBottom: "2rem",
      lineHeight: "1.6",
      position: "relative",
    },
    features: {
      display: "flex",
      justifyContent: "space-around",
      marginBottom: "2rem",
    },
    feature: {
      textAlign: "center",
      flexBasis: "30%",
    },
    featureIcon: {
      fontSize: "2rem",
      color: "#bc0404",
      marginBottom: "0.5rem",
    },
    backButton: {
      display: "inline-block",
      padding: "12px 24px",
      background: "linear-gradient(45deg, #bc0404, #ff5252)",
      color: "white",
      textDecoration: "none",
      borderRadius: "50px",
      transition: "all 0.3s ease",
      textAlign: "center",
      fontWeight: "600",
      textTransform: "uppercase",
      letterSpacing: "1px",
      boxShadow: "0 4px 15px rgba(188, 4, 4, 0.2)",
      position: "relative",
      overflow: "hidden",
    },
    backButtonHover: {
      transform: "translateY(-3px)",
      boxShadow: "0 6px 20px rgba(188, 4, 4, 0.3)",
    },
    backButtonAfter: {
      content: '""',
      position: "absolute",
      top: "-50%",
      left: "-50%",
      width: "200%",
      height: "200%",
      background:
        "radial-gradient(circle, rgba(255,255,255,0.3) 0%, rgba(255,255,255,0) 70%)",
      transform: "scale(0)",
      transition: "transform 0.5s",
    },
    backButtonAfterHover: {
      transform: "scale(1)",
    },
    wifiIcon: {
      display: "block",
      width: "80px",
      height: "80px",
      margin: "0 auto 1.5rem",
      background: "linear-gradient(45deg, #bc0404, #ff5252)",
      WebkitMask:
        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 6C8.62 6 5.5 7.12 3 9L1.2 6.6C4.21 4.34 7.95 3 12 3C16.05 3 19.79 4.34 22.8 6.6L21 9C18.5 7.12 15.38 6 12 6M16.84 13.41C17.18 13.75 17.18 14.09 16.84 14.43C15.25 16.02 13.75 16.82 12 16.82C10.25 16.82 8.75 16.02 7.16 14.43C6.82 14.09 6.82 13.75 7.16 13.41C7.5 13.07 7.84 13.07 8.18 13.41C9.77 15.00 10.89 15.80 12 15.80C13.11 15.80 14.23 15.00 15.82 13.41C16.16 13.07 16.5 13.07 16.84 13.41M12 9C9.3 9 6.81 9.89 4.8 11.4L6.6 13.8C8.1 12.67 9.97 12 12 12C14.03 12 15.9 12.67 17.4 13.8L19.2 11.4C17.19 9.89 14.7 9 12 9Z'/%3E%3C/svg%3E\") no-repeat 50% 50%",
      mask: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 6C8.62 6 5.5 7.12 3 9L1.2 6.6C4.21 4.34 7.95 3 12 3C16.05 3 19.79 4.34 22.8 6.6L21 9C18.5 7.12 15.38 6 12 6M16.84 13.41C17.18 13.75 17.18 14.09 16.84 14.43C15.25 16.02 13.75 16.82 12 16.82C10.25 16.82 8.75 16.02 7.16 14.43C6.82 14.09 6.82 13.75 7.16 13.41C7.5 13.07 7.84 13.07 8.18 13.41C9.77 15.00 10.89 15.80 12 15.80C13.11 15.80 14.23 15.00 15.82 13.41C16.16 13.07 16.5 13.07 16.84 13.41M12 9C9.3 9 6.81 9.89 4.8 11.4L6.6 13.8C8.1 12.67 9.97 12 12 12C14.03 12 15.9 12.67 17.4 13.8L19.2 11.4C17.19 9.89 14.7 9 12 9Z'/%3E%3C/svg%3E\") no-repeat 50% 50%",
      animation: "pulse 2s infinite",
    },
  };

  return (
    <div style={styles.root}>
      <div style={styles.container}>
        <div style={styles.wifiIcon}></div>
        <h1 style={styles.h1}>True WiFi</h1>
        <div style={styles.content}>
          <p>
            Experience True WiFi for lightning-fast, reliable internet
            connectivity. Stay connected anywhere, anytime with our cutting-edge
            network technology.
          </p>
          <p>
            Enjoy seamless streaming, gaming, and browsing with True WiFi&apos;s
            unparalleled speed and coverage.
          </p>
        </div>
        <div style={styles.features}>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🚀</div>
            <h3>Lightning Fast</h3>
            <p>Blazing speeds for all your needs</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🔒</div>
            <h3>Secure</h3>
            <p>Advanced encryption for your safety</p>
          </div>
          <div style={styles.feature}>
            <div style={styles.featureIcon}>🌐</div>
            <h3>Everywhere</h3>
            <p>Wide coverage across the country</p>
          </div>
        </div>
        <a href="/wifi" style={styles.backButton}>
          Back to WiFi Options
        </a>
      </div>
    </div>
  );
};

export default TrueWifi;
