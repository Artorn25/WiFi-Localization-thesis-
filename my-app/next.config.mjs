/** @type {import('next').NextConfig} */
// next.config.js
const nextConfig = {
  images: {
    domains: ["wifi.localization.com"], // อนุญาตให้ใช้รูปภาพจาก localhost
    // หรือใช้ remotePatterns สำหรับการกำหนดค่าแบบละเอียด
    remotePatterns: [
      {
        protocol: "https",
        hostname: "wifi.localization.com",
        port: "3000",
        pathname: "/**", // อนุญาตทุก path ภายใต้ localhost:3000
      },
    ],
    unoptimized: false, // ค่า default คือ false
  },
};

export default nextConfig;
