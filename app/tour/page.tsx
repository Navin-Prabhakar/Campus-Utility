"use client";

import React from "react";

export default function CampusTourPage() {
  // 🔗 Using the official verified institutional tour directory endpoint
  const officialTourUrl = "https://www.iitp.ac.in/visit/campus-tour";

  return (
    <div className="flex h-[calc(110vh-5rem)] w-full flex-col bg-slate-50 p-3 sm:p-6">
      {/* Title Header metadata bar */}
      <div className="mb-3 flex flex-col justify-between gap-1 border-b border-slate-200 pb-3 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-xl text-center font-bold tracking-tight text-slate-800 sm:text-2xl">
            Virtual Campus Tour
          </h1>
          <p className="text-xs text-slate-500">
            Explore hostels, tutorial blocks, and academic infrastructures and others.
          </p>
        </div>
        <a
          href={officialTourUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-lg bg-sky-900 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-sky-800"
        >
          Open External Window ↗
        </a>
      </div>

      {/* The Frame Viewport handling the embedding layout */}
      <div className="relative w-full flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
        <iframe
          src={officialTourUrl}
          title="Official IIT Patna Virtual Campus Tour Map"
          className="absolute left-0 top-0 h-full w-full border-0"
          allow="accelerometer; gyroscope; magnetometer; picture-in-picture"
          loading="lazy"
        />
      </div>
    </div>
  );
}