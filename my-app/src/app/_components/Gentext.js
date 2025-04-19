import { useState, useEffect } from "react";
import "@styles/gentext.css";

export default function GenText() {
  const [displayText, setDisplayText] = useState("");
  const fullText = "WiFi Localization System";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);

  useEffect(() => {
    let timeout;
    let resetTimeout;

    if (isTyping) {
      if (currentIndex < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev + fullText[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, 100); // ความเร็วในการพิมพ์ (100ms ต่อตัวอักษร)
      } else {
        // รอ 3 วินาทีหลังพิมพ์เสร็จก่อนลบ
        resetTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    } else {
      if (displayText.length > 0) {
        // เอฟเฟกต์ลบตัวอักษร
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, 50); // ความเร็วในการลบ (50ms ต่อตัวอักษร)
      } else {
        // เริ่มพิมพ์ใหม่
        setCurrentIndex(0);
        setIsTyping(true);
      }
    }

    return () => {
      clearTimeout(timeout);
      clearTimeout(resetTimeout);
    };
  }, [currentIndex, isTyping, displayText, fullText]);

  return (
    <div className="loading-container">
      <div className="text-animation-container">
        <p className="animated-text">
          {displayText}
          <span className="cursor" />
        </p>
      </div>
    </div>
  );
}