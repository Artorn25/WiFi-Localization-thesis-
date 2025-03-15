"use client";
import { useEffect, useState } from "react";
import "@styles/feedback.css";

export default function Feedback() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // โหลดฟอนต์จาก localStorage (ถ้ามี)
    const savedFont = localStorage.getItem("selectedFont");
    if (savedFont) {
      document.body.style.fontFamily = savedFont;
    }
  }, []);

  const handleSubmit = (event) => {
    event.preventDefault();
    setIsSubmitting(true);

    // Simulate submission delay
    setTimeout(() => {
      alert("Thank you for your feedback!");
      event.target.reset();
      setIsSubmitting(false);
    }, 2000);
  };

  return (
    <div className="feedback-body">
      <div className="glass-container">
        <h1>Feedback</h1>
        <form id="feedbackForm" onSubmit={handleSubmit}>
          <div>
            <label className="label-form" htmlFor="name">
              Name:
            </label>
            <input
              className="input-form"
              type="text"
              id="name"
              name="name"
              placeholder="Enter your name"
              required
            />
          </div>
          <div>
            <label className="label-form" htmlFor="email">
              Email:
            </label>
            <input
              className="input-form"
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              required
            />
          </div>
          <div>
            <label className="label-form" htmlFor="feedback">
              Your Feedback (Optional):
            </label>
            <textarea
              className="text-form"
              id="feedback"
              name="feedback"
              placeholder="Write your feedback here (optional)"
            ></textarea>
          </div>
          <button
            className={`submit ${isSubmitting ? "loading" : ""}`}
            type="submit"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Submitting..." : "Submit Feedback"}
          </button>
        </form>
      </div>
    </div>
  );
}