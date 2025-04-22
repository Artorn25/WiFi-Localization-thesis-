import { useState, useEffect } from "react";
import "@styles/gentext.css";

export default function GenText() {
  const [displayText, setDisplayText] = useState("");
  const fullText = "WiFi Localization System";
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(true);
  const [fontSize, setFontSize] = useState("2rem"); // Default font size

  useEffect(() => {
    // Responsive font size adjustment
    const handleResize = () => {
      if (window.innerWidth < 480) {
        setFontSize("1.2rem");
      } else if (window.innerWidth < 768) {
        setFontSize("1.5rem");
      } else {
        setFontSize("2rem");
      }
    };

    // Set initial size
    handleResize();
    
    // Add event listener
    window.addEventListener('resize', handleResize);
    
    // Cleanup
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    let timeout;
    let resetTimeout;

    if (isTyping) {
      if (currentIndex < fullText.length) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev + fullText[currentIndex]);
          setCurrentIndex((prev) => prev + 1);
        }, 100);
      } else {
        resetTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 3000);
      }
    } else {
      if (displayText.length > 0) {
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, 50);
      } else {
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
        <p className="animated-text" style={{ fontSize }}>
          {displayText}
          <span className="cursor" style={{ height: fontSize }} />
        </p>
      </div>
    </div>
  );
}