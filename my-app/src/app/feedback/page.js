"use client";
import { useEffect } from "react";

import "../styles/feedback.css";

export default function Feedback() {
  useEffect(() => {
    // const style = document.createElement("style");
    // style.innerHTML = `
    //   body {
    //       background: url('https://images.unsplash.com/photo-1506748686214-e9df14d4d9d0?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80') no-repeat center center fixed;
    //       background-size: cover;
    //       font-family: 'Arial', sans-serif;
    //       height: 100vh;
    //       display: flex;
    //       justify-content: center;
    //       align-items: center;
    //       overflow: hidden;
    //   }

    //   .glass-container {
    //       backdrop-filter: blur(20px);
    //       background-color: rgba(255, 255, 255, 0.1);
    //       padding: 2.5rem;
    //       border-radius: 15px;
    //       box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
    //       animation: slideIn 1s ease-in-out forwards;
    //       opacity: 0;
    //       transform: translateY(50px);
    //   }

    //   @keyframes slideIn {
    //       to {
    //           opacity: 1;
    //           transform: translateY(0);
    //       }
    //   }

    //   input, textarea {
    //       background-color: rgba(255, 255, 255, 0.8);
    //       border: 1px solid rgba(0, 0, 0, 0.2);
    //       transition: all 0.3s ease-in-out;
    //   }

    //   input:focus, textarea:focus {
    //       outline: none;
    //       border-color: #3b82f6;
    //       box-shadow: 0 0 10px #3b82f6;
    //   }

    //   button {
    //       background-color: #3b82f6;
    //       font-size: 1.2rem;
    //       transition: background-color 0.3s ease, transform 0.2s ease;
    //   }

    //   button:hover {
    //       background-color: #2563eb;
    //       transform: translateY(-3px);
    //   }

    //   button:active {
    //       background-color: #1d4ed8;
    //       transform: scale(0.95);
    //   }

    //   button.loading {
    //       pointer-events: none;
    //       opacity: 0.7;
    //   }

    //   button.loading::after {
    //       content: '';
    //       display: inline-block;
    //       width: 15px;
    //       height: 15px;
    //       border: 2px solid white;
    //       border-radius: 50%;
    //       border-right-color: transparent;
    //       animation: spin 1s linear infinite;
    //       margin-left: 10px;
    //   }

    //   @keyframes spin {
    //       to {
    //           transform: rotate(360deg);
    //       }
    //   }
    // `;

    // document.head.appendChild(style);

    // ฟังก์ชันสำหรับโหลดฟ้อนต์จาก localStorage
    function loadFontSetting() {
      const savedFont = localStorage.getItem("selectedFont");
      if (savedFont) {
        document.body.style.fontFamily = savedFont;
      }
    }
    loadFontSetting();

    // ทำความสะอาดเมื่อคอมโพเนนต์ถูกถอดออก
    // return () => {
    //   document.head.removeChild(style);
    // };
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    const submitButton = document.getElementById("submitButton");
    submitButton.textContent = "Submitting...";
    submitButton.classList.add("loading");

    setTimeout(() => {
      alert("Thank you for your feedback!");
      document.getElementById("feedbackForm").reset();
      submitButton.textContent = "Submit Feedback";
      submitButton.classList.remove("loading");
    }, 2000);
  };

  return (
    <>
      <title>Feedback</title>
      <div className="glass-container w-11/12 sm:w-3/4 md:w-1/2 lg:w-1/3">
        <h1 className="text-4xl font-bold text-center text-white mb-6">
          Feedback
        </h1>
        <form id="feedbackForm" className="space-y-6">
          <div>
            <label
              htmlFor="name"
              className="block text-lg font-medium text-white"
            >
              Name:
            </label>
            <input
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              required
              className="w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
            />
          </div>
          <div>
            <label
              htmlFor="email"
              className="block text-lg font-medium text-white"
            >
              Email:
            </label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
              className="w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out"
            />
          </div>
          <div>
            <label
              htmlFor="feedback"
              className="block text-lg font-medium text-white"
            >
              Your Feedback (Optional):
            </label>
            <textarea
              id="feedback"
              name="feedback"
              rows={5}
              placeholder="Write your feedback here (optional)"
              className="w-full px-4 py-3 mt-1 border rounded-lg focus:ring-2 focus:ring-blue-500 transition duration-300 ease-in-out resize-none"
              onInput={(e) => {
                const lines = e.target.value.split("\n").length;
                e.target.rows = lines >= 5 ? lines : 5;
              }}
            ></textarea>
          </div>
          <button
            type="submit"
            id="submitButton"
            onClick={handleSubmit}
            className="w-full py-3 text-white font-bold rounded-lg transition duration-300 ease-in-out hover:shadow-lg transform hover:-translate-y-1"
          >
            Submit Feedback
          </button>
        </form>
      </div>
    </>
  );
}
