"use client";

import { useState } from "react";

export default function NewsletterSignup() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    
    // TODO: Implement newsletter signup API call
    // For now, just simulate success
    setTimeout(() => {
      setSubmitted(true);
      setSubmitting(false);
      setEmail("");
      setTimeout(() => setSubmitted(false), 3000);
    }, 500);
  }

  return (
    <section className="bg-[#FFC107] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Left Side - Icon and Text */}
          <div className="flex items-center gap-4">
            <svg
              className="w-8 h-8 text-black"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
            <p className="text-black font-medium text-sm md:text-base">
              Sign up to Newsletter ...and receive $20 coupon for first shopping.
            </p>
          </div>

          {/* Right Side - Email Input and Button */}
          <form onSubmit={handleSubmit} className="flex gap-2 w-full md:w-auto">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              required
              className="px-4 py-2 bg-white border border-black/10 rounded-md text-black placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-black/20 min-w-[200px]"
            />
            <button
              type="submit"
              disabled={submitting || submitted}
              className="bg-gray-800 text-white px-6 py-2 rounded-md hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-semibold whitespace-nowrap"
            >
              {submitting
                ? "Signing..."
                : submitted
                ? "Signed Up!"
                : "Sign Up"}
            </button>
          </form>
        </div>
      </div>
    </section>
  );
}

