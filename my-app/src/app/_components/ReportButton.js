"use client"; // ต้องใช้ client component เพราะมี interaction

import { useState, useRef, useEffect } from "react";
import "@styles/report.css";

export default function ReportButton() {
  const [message, setMessage] = useState("");
  const textareaRef = useRef(null);

  // ฟังก์ชันสำหรับปรับขนาด textarea อัตโนมัติ
  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // รีเซ็ตความสูงก่อนคำนวณใหม่
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  // เรียกใช้เมื่อ message เปลี่ยนแปลง
  useEffect(() => {
    adjustTextareaHeight();
  }, [message]);

  const handleChange = (e) => {
    setMessage(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ส่งข้อมูลไปยัง API
    try {
      const response = await fetch("/api/report", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message }),
      });

      if (response.ok) {
        alert("ขอบคุณสำหรับรายงานปัญหา!");
        setMessage("");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-80">
      <div className="bg-white rounded-lg shadow-xl p-4 border border-gray-200">
        <h3 className="font-bold text-lg mb-3 text-gray-800">รายงานปัญหา</h3>

        <form onSubmit={handleSubmit}>
          <textarea
            ref={textareaRef}
            value={message}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded-lg p-3 mb-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden"
            rows="1" // ตั้งค่าเริ่มต้นแค่ 1 บรรทัด
            placeholder="พบปัญหาอะไร? แจ้งให้เราทราบ..."
            required
          />

          <div className="flex justify-end">
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg transition-colors"
            >
              ส่งรายงาน
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
