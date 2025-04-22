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

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  };

  useEffect(() => adjustTextareaHeight(), [message]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (message.trim().length < 10) {
      alert("Please describe the problem with at least 10 characters");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_LOCALHOST}/api/report`, {
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
        throw new Error(data.error || "Failed to submit report");
      }

      alert(
        `Report submitted successfully! (From page: ${pathname})\nWe will respond within 24 hours.`
      );
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      console.error("Error submitting report:", error);
      alert(
        `Error submitting report: ${error.message}\nPlease try again or contact support directly`
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  async function getClientIP() {
    try {
      const response = await fetch("https://api.ipify.org?format=json");
      const data = await response.json();
      return data.ip;
    } catch {
      return "Unknown";
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {isOpen ? (
        <div className="report-box-animation bg-white rounded-xl shadow-lg p-4 border border-gray-200 w-72 sm:w-80">
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <svg
                className="w-5 h-5 text-blue-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <h3 className="font-semibold text-gray-800">Report an Issue</h3>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-gray-500 hover:text-gray-700 text-lg w-6 h-6 flex items-center justify-center rounded-full transition-colors"
              aria-label="Close report form"
            >
              &times;
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full border border-gray-300 rounded-lg p-3 mb-3 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none overflow-hidden placeholder-gray-400"
              rows="1"
              placeholder="Describe the problem you encountered..."
              required
              disabled={isSubmitting}
            />

            <div className="flex justify-between items-center">
              <span className="text-xs text-gray-500 truncate max-w-[120px] sm:max-w-[150px]">
                Page: {pathname || "Not Found"}
              </span>
              <button
                type="submit"
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center gap-1"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-1 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Sending...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Send
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium py-3 px-4 rounded-full shadow-lg transition-all transform hover:scale-105 flex items-center gap-2"
          aria-label="Open report form"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          Report
        </button>
      )}
    </div>
  );
}