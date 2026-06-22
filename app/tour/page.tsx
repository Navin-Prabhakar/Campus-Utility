"use client";

import React from "react";

export default function CampusTourPage() {
  // 🔗 Using the official verified institutional tour directory endpoint
  const officialTourUrl = "https://www.iitp.ac.in/visit/campus-tour";

  return (
    <div className="flex h-full w-full flex-col bg-[#050608] p-3 sm:p-6 selection:bg-indigo-500/30 selection:text-white">
      
      {/* Title Header metadata bar */}
      <div className="mb-4 flex flex-col justify-between gap-2 border-b border-indigo-950/40 pb-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-lg font-black tracking-widest uppercase text-white flex items-center gap-2">
            <span>🗺️</span> Virtual Campus Tour
          </h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">
            Explore hostels, tutorial blocks, and academic infrastructures live.
          </p>
        </div>
        
        {/* Indigo-themed interactive action trigger button */}
        <a
          href={officialTourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-xl bg-gradient-to-b from-[#2A2E54] to-[#1B1D36] border border-indigo-500/30 px-4 py-2 text-xs font-black uppercase tracking-widest text-white transition-all shadow-[0_4px_14px_rgba(99,102,241,0.2)] hover:shadow-[0_0_20px_rgba(99,102,241,0.35)] active:scale-95 text-center"
        >
          Open External Window ↗
        </a>
      </div>

      {/* The Frame Viewport handling the embedding layout with Indigo bounding ring */}
      <div className="relative w-full flex-1 overflow-hidden rounded-2xl border border-indigo-500/20 bg-[#121424]/40 backdrop-blur-2xl shadow-[0_12px_40px_rgba(0,0,0,0.6)]">
        <iframe
          src={officialTourUrl}
          title="Official IIT Patna Virtual Campus Tour Map"
          className="absolute left-0 top-0 h-full w-full border-0 rounded-2xl"
          allow="accelerometer; gyroscope; magnetometer; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}