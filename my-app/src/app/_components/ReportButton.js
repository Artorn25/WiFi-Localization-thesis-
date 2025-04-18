"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import "@styles/report.css";

export default function ReportButton() {
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const textareaRef = useRef(null);
  const pathname = usePathname();

  // ปรับความสูงของ Textarea อัตโนมัติ
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
          "X-Requested-With": "XMLHttpRequest",
        },
        body: JSON.stringify({
          message,
          page: pathname,
          timestamp: new Date().toISOString(),
          ip: await getClientIP(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "ส่งรายงานไม่สำเร็จ");
      }

      alert(
        `Send Report Success! (From page: ${pathname})\nWe will respond to you within 24 hours.`
      );
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Sorry, we couldn't submit your report due to an error.:", error);
      alert(
        `Sorry, we couldn't submit your report due to an error.: ${error.message}\nกรุณาลองอีกครั้งหรือติดต่อผู้ดูแลระบบโดยตรง`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // ฟังก์ชันดึง IP ผู้ใช้
  async function getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "ไม่ทราบ";
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      {isOpen ? (
        <div className="bg-white rounded-lg shadow-xl p-3 border border-gray-200 w-64 sm:w-72">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-bold text-sm sm:text-base text-gray-800">
              Report
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className=" from-purple-400 to-indigo-500 text-white  text-sm w-5 h-5 flex items-center justify-center rounded-full transition-colors"
              aria-label="ปิดฟอร์มรายงาน"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-2 mb-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
              rows="1"
              placeholder="What Problem? Report to us..."
              required
              disabled={isSubmitting}
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 truncate max-w-[100px] sm:max-w-[120px]">
                page: {pathname || "Not Found"}
              </span>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-1 px-3 rounded transition-colors disabled:opacity-50"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-3 rounded-full shadow-md transition-colors"
          aria-label="เปิดฟอร์มรายงาน"
        >
          Report
        </button>
      )}
    </div>
  );
}
