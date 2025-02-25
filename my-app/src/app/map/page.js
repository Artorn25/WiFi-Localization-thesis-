// "use client";
// import { useEffect } from "react";
// import Image from "next/image";
// import Link from "next/link";

// import "../styles/map.css";

// import Script from "next/script";

// import Header from "../../../components/Header";
// import Footer from "../../../components/Footer";

// export default function Map() {
//   useEffect(() => {
//     // ฟังก์ชันสำหรับโหลดฟอนต์จาก localStorage
//     const loadFontSetting = () => {
//       const savedFont = localStorage.getItem("selectedFont");
//       if (savedFont) {
//         document.body.style.fontFamily = savedFont;
//       }
//     };
//     loadFontSetting();
//   }, []);

//   return (
//     <>
//       <Header />

//       <div id="map-container">
//         <div className="container">
//           <canvas id="myCanvas" width="1400px" height="700px"></canvas>
//           <div id="map-controls">
//             <div className="controls-group">
//               <label htmlFor="mapName">Map Name:</label>
//               <select id="map-select">
//                 <option value="">Select Map</option>
//               </select>
//               <input type="text" id="mapName" placeholder="Enter map name" />
//               <button id="updateMapName">Update Map Name</button>
//               <button id="delete-map">🗑️ Delete Map</button>

//               <div className="upload-btn-wrapper">
//                 <button className="btn-upload">
//                   📤 Upload Map
//                   <input type="file" id="map-upload" accept="image/*" />
//                 </button>
//               </div>

//               <input
//                 type="text"
//                 id="pointName"
//                 placeholder="Enter point name"
//               />
//               <button id="resetPoints">🔄 Reset</button>
//             </div>

//             <div className="controls-group">
//               <select id="pointSelect"></select>
//               <button id="DeletePoint">🗑️ Delete Point</button>
//               <select id="point1Select"></select>
//               <select id="point2Select"></select>
//               <button id="ShowDistance">📏 Show Distance</button>
//               <select id="editPointSelect"></select>
//               <input
//                 type="text"
//                 id="newPointName"
//                 placeholder="Enter new point name"
//               />
//               <button id="editPoint">✏️ Update Point Name</button>
//             </div>
//           </div>

//           <div id="distanceDisplay"></div>
//         </div>
//       </div>

//       <div
//         id="tooltip"
//         style={{
//           boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
//           padding: "0.8rem",
//           borderRadius: "6px",
//           fontSize: "0.9rem",
//           position: "absolute",
//           display: "none",
//           backgroundColor: "white",
//           border: "1px solid black",
//           pointerEvents: "none",
//         }}
//       ></div>

//       <div id="map-sample-container" className="container">
//         <h3>Example Maps</h3>
//         <div className="map-samples">
//           <Image
//             src="/map/map1.png"
//             alt="Sample Map 1"
//             className="map-sample"
//             data-map-src="/map/map1.png"
//             width={200}
//             height={400}
//           />
//           <Image
//             src="/map/map2.png"
//             alt="Sample Map 2"
//             className="map-sample"
//             data-map-src="/map/map2.png"
//             width={200}
//             height={400}
//           />
//         </div>
//       </div>
//       <Footer />
//       <Script src=".././script/module.js" strategy="afterInteractive" />
//     </>
//   );
// }
"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import Header from "../../../components/Header";
import Footer from "../../../components/Footer";
import "../styles/map.css";

export default function Map() {
  const [selectedFont, setSelectedFont] = useState("");

  useEffect(() => {
    // โหลดฟอนต์จาก localStorage
    const savedFont = localStorage.getItem("selectedFont");
    if (savedFont) {
      setSelectedFont(savedFont);
      document.body.style.fontFamily = savedFont;
    }

    return () => {
      document.body.style.fontFamily = ""; // รีเซ็ตฟอนต์เมื่อคอมโพเนนต์ถูก unmount
    };
  }, []);

  return (
    <>
      <Header />
      <div id="map-container">
        <div className="container">
          <canvas id="myCanvas" width="1400px" height="700px"></canvas>
          <div id="map-controls">
            <div className="controls-group">
              <label htmlFor="mapName">Map Name:</label>
              <select id="map-select">
                <option value="">Select Map</option>
              </select>
              <input type="text" id="mapName" placeholder="Enter map name" />
              <button id="updateMapName">Update Map Name</button>
              <button id="delete-map">🗑️ Delete Map</button>

              <div className="upload-btn-wrapper">
                <button className="btn-upload">
                  📤 Upload Map
                  <input type="file" id="map-upload" accept="image/*" />
                </button>
              </div>

              <input
                type="text"
                id="pointName"
                placeholder="Enter point name"
              />
              <button id="resetPoints">🔄 Reset</button>
            </div>

            <div className="controls-group">
              <select id="pointSelect"></select>
              <button id="DeletePoint">🗑️ Delete Point</button>
              <select id="point1Select"></select>
              <select id="point2Select"></select>
              <button id="ShowDistance">📏 Show Distance</button>
              <select id="editPointSelect"></select>
              <input
                type="text"
                id="newPointName"
                placeholder="Enter new point name"
              />
              <button id="editPoint">✏️ Update Point Name</button>
            </div>
          </div>

          <div id="distanceDisplay"></div>
        </div>
      </div>

      <div
        id="tooltip"
        style={{
          boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
          padding: "0.8rem",
          borderRadius: "6px",
          fontSize: "0.9rem",
          position: "absolute",
          display: "none",
          backgroundColor: "white",
          border: "1px solid black",
          pointerEvents: "none",
        }}
      ></div>

      <div id="map-sample-container" className="container">
        <h3>Example Maps</h3>
        <div className="map-samples">
          <Image
            src="/map/map1.png"
            alt="Sample Map 1"
            className="map-sample"
            data-map-src="/map/map1.png"
            width={200}
            height={400}
          />
          <Image
            src="/map/map2.png"
            alt="Sample Map 2"
            className="map-sample"
            data-map-src="/map/map2.png"
            width={200}
            height={400}
          />
        </div>
      </div>
      <Footer />
      <Script src="../../../scripts/module.js" strategy="afterInteractive" />
    </>
  );
}
