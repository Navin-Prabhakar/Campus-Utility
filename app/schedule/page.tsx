"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";

interface TimetableItem {
  day: string;
  time: string;
  year: number;
  courseCode: string;
  group: string;
  venue: string;
  type: string;
}

export default function SchedulePage() {
  const [academicYear, setAcademicYear] = useState<string>("1");
  const [selectedGroup, setSelectedGroup] = useState<string>("G1");
  const [timetableData, setTimetableData] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchTimetableData() {
      try {
        setLoading(true);
        setError(false);
        
        const res = await fetch("/api/timetable");
        if (!res.ok) throw new Error("Failed to pull secure JSON payload assets");
        
        const data = await res.json();
        setTimetableData(Array.isArray(data) ? data : []);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching secure live timetable database:", err);
        setError(true);
        setLoading(false);
      }
    }
    fetchTimetableData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      const startTimePart = timeStr.split("-")[0].trim().toUpperCase();
      if (startTimePart === "12 NOON") return 12 * 60;
      
      const match = startTimePart.match(/(\d+)(?:\.(\d+))?\s*(AM|PM)?/);
      if (!match) return 0;
      
      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3];
      
      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;
      
      return hours * 60 + minutes;
    } catch (e) {
      return 0;
    }
  };

  const filteredSchedule = timetableData.filter((item) => {
    const matchYear = Number(item.year) === Number(academicYear);
    if (!matchYear) return false;

    const itemGroup = item.group.trim();
    const currentSelection = selectedGroup.trim();

    if (itemGroup === "All Branches" || itemGroup === "All") return true;
    if (itemGroup === currentSelection) return true;

    const targetGroupRegex = new RegExp(`\\b${currentSelection}\\b`);
    return targetGroupRegex.test(itemGroup);
  });

  return (
    <div className="h-full w-full bg-[#050505] font-sans text-zinc-300 antialiased flex flex-col overflow-hidden relative selection:bg-zinc-800 selection:text-white">
      
      {/* Persistent Sticky Navigation Control Bar */}
      <div className="w-full bg-[#0C0C0C]/90 backdrop-blur-md border-b border-zinc-900 shrink-0 z-30 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        {!loading && !error && (
          <div className="w-[94%] max-w-[365px] py-2.5 flex gap-2 items-center relative">
            
            {/* Display Active Selection Metadata Status Layer */}
            <div className="flex-1 bg-[#161616] border border-zinc-800 rounded-xl py-2 px-3.5 text-[11px] font-black tracking-wide text-zinc-300 shadow-inner">
              ⚡ Class Group: <span className="text-white font-mono font-black underline decoration-zinc-700">{selectedGroup}</span>
            </div>

            {/* Filter Open Panel Trigger (Lighter Background contrast for depth perception) */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-xl py-2 px-3.5 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md ${
                  isDropdownOpen
                    ? "bg-[#2A2A2A] border-zinc-600 text-white" 
                    : "bg-[#161616] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>Filter</span>
                <span className={`text-[8px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Dynamic Filtering Panel Popout Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#121212] border border-zinc-800 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] py-3 z-50 flex flex-col text-[11px] font-bold text-zinc-400 animate-in fade-in zoom-in-95 duration-100">
                  
                  <div className="px-3 py-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900 mb-2">
                    Academic Level
                  </div>
                  <div className="px-2 mb-3">
                    <select
                      value={academicYear}
                      onChange={(e) => {
                        setAcademicYear(e.target.value);
                        setSelectedGroup(e.target.value === "1" ? "G1" : "CSE");
                      }}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-lg py-1.5 px-2 text-[11px] font-black text-zinc-200 outline-hidden focus:border-zinc-700 cursor-pointer"
                    >
                      <option value="1">B.Tech 1st Year</option>
                      <option value="2">B.Tech 2nd Year</option>
                      <option value="3">B.Tech 3rd Year</option>
                      <option value="4">B.Tech 4th Year</option>
                    </select>
                  </div>

                  <div className="px-3 py-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900 mb-2">
                    Group Stream Node
                  </div>
                  <div className="px-2">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-[#161616] border border-zinc-800 rounded-lg py-1.5 px-2 text-[11px] font-black text-zinc-200 outline-hidden focus:border-zinc-700 cursor-pointer"
                    >
                      {academicYear === "1" ? (
                        Array.from({ length: 24 }, (_, i) => `G${i + 1}`).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))
                      ) : (
                        <>
                          <option value="CSE">CSE (Computer Science)</option>
                          <option value="MNC">MnC (Maths & Computing)</option>
                          <option value="EE">EE (Electrical Eng.)</option>
                          <option value="ME">ME (Mechanical Eng.)</option>
                        </>
                      )}
                    </select>
                  </div>

                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 📜 SCROLLABLE MIDDLE TRACK CONTAINER */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-2 py-3 pb-36 bg-[#050505] style-scrollbar">
        <main className="w-[94%] max-w-[365px] flex flex-col flex-grow">
          
          {loading ? (
            <div className="flex flex-col gap-3 w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-[#121212] border border-zinc-900" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-400 bg-rose-950/20 rounded-2xl border border-rose-500/20 font-bold uppercase tracking-wide">
              🚨 Unable to sync live timetable records.
            </div>
          ) : (
            <div className="flex flex-col gap-4 w-full">
              {daysOrder.map((day) => {
                const dayClasses = filteredSchedule
                  .filter((c) => c.day === day)
                  .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

                return (
                  <div key={day} className="w-full bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border border-zinc-900 rounded-2xl p-3.5 shadow-xl flex flex-col">
                    
                    {/* Weekday Header Separator */}
                    <div className="border-b border-zinc-900 pb-2 mb-3 flex justify-between items-center select-none">
                      <span className="text-[11px] font-black uppercase tracking-widest text-zinc-400">
                        {day}
                      </span>
                      <span className="text-[9px] font-mono font-black bg-[#121212] text-zinc-500 border border-zinc-800 px-2.5 py-0.5 rounded-lg shadow-inner">
                        {dayClasses.length} Slots
                      </span>
                    </div>

                    {dayClasses.length === 0 ? (
                      <p className="text-[10px] text-zinc-600 font-medium italic py-3 text-center bg-[#121212]/20 border border-dashed border-zinc-900 rounded-xl">
                        🎉 No core matches found! Free block layout.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {dayClasses.map((cls, idx) => {
                          const isLab = cls.type.toLowerCase().includes("lab");
                          const isTut = cls.type === "Tutorial";

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-xl border transition-all duration-150 transform hover:-translate-y-0.5 active:scale-[0.99] ${
                                isLab
                                  ? "bg-emerald-500/5 border-emerald-500/20 shadow-xs" 
                                  : isTut
                                  ? "bg-amber-500/5 border-amber-500/20 shadow-xs"   
                                  : "bg-[#121212]/60 border-zinc-900 shadow-sm"
                              }`}
                            >
                              <div className="flex flex-col gap-1 min-w-0 flex-1 pr-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-black tracking-tight text-white truncate">
                                    {cls.courseCode}
                                  </span>
                                  <span
                                    className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded-md border shrink-0 ${
                                      isLab
                                        ? "bg-emerald-500/10 text-[#10B981] border-emerald-500/20" 
                                        : isTut
                                        ? "bg-amber-500/10 text-[#F59E0B] border-amber-500/20"   
                                        : "bg-zinc-800 text-zinc-400 border-zinc-700"
                                    }`}
                                  >
                                    {cls.type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-zinc-500 font-bold truncate">
                                  📍 Room: <span className="text-zinc-400 font-black">{cls.venue}</span>
                                </div>
                              </div>

                              <div className="text-right shrink-0">
                                <span className="text-[9px] font-black text-zinc-300 bg-[#161616] border border-zinc-800 rounded-lg px-2 py-1 shadow-inner font-mono">
                                  ⏰ {cls.time}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}

                  </div>
                );
              })}
              
              {/* 🚨 Crimson Alerts Discrepancy Button Block */}
              <div className="w-full text-center pt-3 pb-1 shrink-0">
                <Link 
                  href="/?openReport=true" 
                  className="text-[11px] sm:text-xs font-bold tracking-wide uppercase text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 px-4 py-2.5 rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(244,63,94,0.05)] cursor-pointer active:scale-95"
                >
                  🚨 Report Structural Discrepancies
                </Link>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* Global Scroll Tracking Style Tokens */}
      <style jsx global>{`
        .style-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .style-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .style-scrollbar::-webkit-scrollbar-thumb {
          background: #222222;
          border-radius: 20px;
        }
        .style-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333333;
        }
      `}</style>
    </div>
  );
}