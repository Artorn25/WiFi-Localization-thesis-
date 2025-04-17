"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import "@styles/report.css";

export default function ReportButton() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef(null);
  const pathname = usePathname();

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => adjustTextareaHeight(), [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ตรวจสอบความยาวข้อความ
    if (message.trim().length < 10) {
      alert("กรุณากรอกคำอธิบายปัญหาอย่างน้อย 10 ตัวอักษร");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Requested-With": "XMLHttpRequest", // เพิ่ม header นี้
        },
        body: JSON.stringify({
          message,
          page: pathname,
          timestamp: new Date().toISOString(),
          ip: await getClientIP(), // หากต้องการเก็บ IP
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to submit report");
      }

      alert(
        `รายงานปัญหาสำเร็จ! (จากหน้า: ${pathname})\nเราจะติดต่อกลับภายใน 24 ชั่วโมง`
      );
      setMessage("");
    } catch (error) {
      console.error("Error submitting report:", error);
      alert(
        `เกิดข้อผิดพลาดในการส่งรายงาน: ${error.message}\nกรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบโดยตรง`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันเสริมสำหรับดึง IP
  async function getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "unknown";
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800">รายงานปัญหา</h3>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
            rows="1"
            placeholder="พบปัญหาอะไร? แจ้งให้เราทราบ..."
            required
            disabled={isSubmitting}
          />

          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">
              หน้า: {pathname || "ไม่ทราบ"}
            </span>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50"
              disabled={isSubmitting}
            >
              {isSubmitting ? "กำลังส่ง..." : "ส่งรายงาน"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
