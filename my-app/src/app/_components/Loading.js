import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import "@styles/loading.css";

export default function Loading() {
  return (
    <div className="loadingContainer">
      <DotLottieReact
        src="https://lottie.host/f777fc61-f4e1-4ce1-afe6-6c4efab2cdc3/QFhEU9R9jM.lottie"
        loop
        autoplay
        className="loadingAnimation"
      />
      <p className="loadingText">Loading WiFi Localization System...</p>
    </div>
  );
}
