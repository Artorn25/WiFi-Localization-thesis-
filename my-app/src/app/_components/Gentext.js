import { useState, useEffect } from "react";
import "@styles/gentext.css";

export default function GenText() {
  const [displayText, setDisplayText] = useState("");
  const fullText = "WIFI LOCALIZATION SYSTEM..";
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
        }, 3000 / fullText.length);
      } else {
        // Typing complete, wait 2 seconds then reset
        resetTimeout = setTimeout(() => {
          setIsTyping(false);
        }, 5000);
      }
    } else {
      // Reset animation
      if (displayText.length > 0) {
        // Backspace effect
        timeout = setTimeout(() => {
          setDisplayText((prev) => prev.slice(0, -1));
        }, 0 / fullText.length);
      } else {
        // Ready to type again
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
    <div className="loadingContainer">
      {/* <div className="textAnimationContainer"> */}
        <p className="animatedText">{displayText}</p>
      {/* </div> */}
    </div>
  );
}
