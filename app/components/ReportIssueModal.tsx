"use client";

import React, { useState } from "react";

// 🛠️ FIX 1: Aligned prop type signatures with your parent page state declarations
interface ReportIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ReportIssueModal({ isOpen, onClose }: ReportIssueModalProps) {
  const [category, setCategory] = useState("Bug");
  const [description, setDescription] = useState("");
  const [contactInfo, setContactInfo] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    setStatus("idle");

    const ENDPOINT = "https://api.web3forms.com/submit";

    const web3payload = {
      access_key: process.env.NEXT_PUBLIC_WEB3FORMS_KEY, 
      subject: `🚨 New App Report: [${category}]`,
      from_name: "App Feedback Portal",
      category: category,
      issue_details: description,
      user_contact: contactInfo || "Anonymous",
    };

    try {
      const response = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(web3payload),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        setStatus("success");
        setDescription("");
        setContactInfo("");
        setTimeout(() => {
          onClose(); // 🛠️ FIX 2: Standard unified state close signature call
          setStatus("idle");
        }, 2200);
      } else {
        setStatus("error");
      }
    } catch (err) {
      setStatus("error");
    } finally {
      setIsSubmitting(false);
    }
  };

  // 🛠️ FIX 3: Removed the duplicate hardcoded floating trigger button completely. 
  // The trigger button is managed elegantly by home screen root flows.
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-white w-full max-w-sm rounded-xl p-4 shadow-xl border border-zinc-200 text-zinc-800 font-sans">
        
        {/* Modal Header */}
        <div className="flex justify-between items-center border-b border-zinc-100 pb-2 mb-3">
          <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-1.5">
            <span>⚠️</span> Report an Issue / Feedback
          </h3>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-600 text-xs font-bold p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Main Form Elements */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3 text-xs">
          
          {/* Anti-Spam Honeypot Field */}
          <input type="checkbox" name="botcheck" className="hidden" style={{ display: "none" }} />

          {/* Tag Category Selector */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Type</label>
            <div className="flex gap-2">
              {["Bug", "Suggestion", "Other"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setCategory(type)}
                  className={`flex-1 py-1 rounded-md font-bold border transition-all cursor-pointer ${
                    category === type 
                      ? "bg-zinc-900 border-zinc-900 text-white shadow-xs" 
                      : "bg-zinc-50 border-zinc-200 text-zinc-600 hover:bg-zinc-100"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Text Area Description */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">What went wrong?</label>
            <textarea
              required
              rows={3}
              placeholder="Describe the bug or feature request clearly..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 focus:outline-hidden focus:border-zinc-400 font-medium tracking-tight text-zinc-800 transition-all"
            />
          </div>

          {/* Contact Information Input */}
          <div>
            <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wide mb-1">Your Contact Info (Optional)</label>
            <input
              type="text"
              placeholder="Email, Roll No, or Phone number"
              value={contactInfo}
              onChange={(e) => setContactInfo(e.target.value)}
              className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1.5 px-2 focus:outline-hidden focus:border-zinc-400 font-medium tracking-tight text-zinc-800 transition-all"
            />
          </div>

          {/* Status Notifications */}
          {status === "success" && (
            <div className="text-center text-emerald-600 bg-emerald-50 py-1.5 rounded-md font-bold animate-fade-in">
              ✓ Report sent to admin email successfully!
            </div>
          )}
          {status === "error" && (
            <div className="text-center text-red-500 bg-red-50 py-1.5 rounded-md font-bold animate-fade-in">
              ❌ Web3Forms error. Check your access key configuration.
            </div>
          )}

          {/* Interactive Submission Button Control */}
          <button
            type="submit"
            disabled={isSubmitting || status === "success"}
            className="w-full mt-1 bg-red-600 hover:bg-red-700 text-white font-bold py-2 rounded-lg transition-all active:scale-[0.98] disabled:opacity-50 disabled:pointer-events-none cursor-pointer shadow-xs text-center text-xs"
          >
            {isSubmitting ? "Sending to Admin..." : "Submit Report"}
          </button>

        </form>
      </div>
    </div>
  );
}