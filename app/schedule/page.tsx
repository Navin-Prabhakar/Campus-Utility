"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Header from "../components/Header";
import BottomTabs from "../components/BottomTabs";

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

  // 🌐 MODIFIED: Fetch parsed dataset stream dynamically from the secure internal backend route
  useEffect(() => {
    async function fetchTimetableData() {
      try {
        setLoading(true);
        setError(false);
        
        // Target your internal server proxy node endpoint safely
        const res = await fetch("/api/timetable");
        if (!res.ok) throw new Error("Failed to pull secure JSON payload assets");
        
        const data = await res.json();
        
        // Handle array validation fallback guards gracefully
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
    <div className="h-screen max-h-screen w-full bg-zinc-50 font-sans text-zinc-600 antialiased flex flex-col overflow-hidden relative">
      
      <div className="shrink-0 z-40">
        <Header />
      </div>

      <div className="w-full bg-white border-b border-zinc-200 shrink-0 z-30 flex flex-col items-center shadow-2xs">
        {!loading && !error && (
          <div className="w-[94%] max-w-[365px] py-2 flex gap-2 items-center relative animate-fade-in">
            
            <div className="flex-1 bg-zinc-100 border border-zinc-200 rounded-lg py-1.5 px-3 text-[11px] font-bold text-zinc-800 tracking-tight">
              ⚡ Group: <span className="text-indigo-600 font-mono font-black">{selectedGroup}</span> (Year {academicYear})
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-lg py-1.5 px-3 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-3xs ${
                  isDropdownOpen
                    ? "bg-indigo-700 border-indigo-900 text-white" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <span>Filter Options</span>
                <span className={`text-[8px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-48 bg-white border border-zinc-200 rounded-xl shadow-lg py-2.5 z-50 flex flex-col text-[11px] font-medium text-zinc-700 animate-fade-in">
                  
                  <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-2">
                    Academic Year
                  </div>
                  <div className="px-2 mb-2">
                    <select
                      value={academicYear}
                      onChange={(e) => {
                        setAcademicYear(e.target.value);
                        setSelectedGroup(e.target.value === "1" ? "G1" : "CSE");
                      }}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2 text-[11px] font-bold text-zinc-700 outline-hidden"
                    >
                      <option value="1">B.Tech 1st Year</option>
                      <option value="2">B.Tech 2nd Year</option>
                      <option value="3">B.Tech 3rd Year</option>
                      <option value="4">B.Tech 4th Year</option>
                    </select>
                  </div>

                  <div className="px-3 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-2">
                    Group / Stream
                  </div>
                  <div className="px-2">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2 text-[11px] font-bold text-zinc-700 outline-hidden"
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

      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-2 py-3 pb-28 bg-zinc-50/50">
        <main className="w-[94%] max-w-[365px] flex flex-col flex-grow">
          
          {loading ? (
            <div className="flex flex-col gap-2 w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-28 w-full animate-pulse rounded-xl bg-zinc-200" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-red-500 bg-red-50 rounded-lg border border-red-100 font-medium">
              ⚠️ Unable to sync live timetable records.
            </div>
          ) : (
            <div className="flex flex-col gap-3.5 w-full">
              {daysOrder.map((day) => {
                const dayClasses = filteredSchedule
                  .filter((c) => c.day === day)
                  .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

                return (
                  <div key={day} className="w-full bg-white border border-zinc-200 rounded-xl p-3 shadow-2xs flex flex-col">
                    
                    <div className="border-b border-zinc-100 pb-1.5 mb-2.5 flex justify-between items-center select-none">
                      <span className="text-[10px] font-black uppercase tracking-wider text-zinc-700">
                        {day}
                      </span>
                      <span className="text-[8px] font-mono font-bold bg-zinc-100 text-zinc-500 px-2 py-0.5 rounded-full border border-zinc-200/40">
                        {dayClasses.length} Slots
                      </span>
                    </div>

                    {dayClasses.length === 0 ? (
                      <p className="text-[10px] text-zinc-400 italic py-2 text-center">
                        🎉 No core matches found! Free day or self lab study.
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {dayClasses.map((cls, idx) => {
                          const isLab = cls.type.toLowerCase().includes("lab");
                          const isTut = cls.type === "Tutorial";

                          return (
                            <div
                              key={idx}
                              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all ${
                                isLab
                                  ? "bg-emerald-100/15 border-emerald-300" 
                                  : isTut
                                  ? "bg-amber-100/20 border-amber-300"   
                                  : "bg-zinc-50/60 border-zinc-100"
                              }`}
                            >
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[11px] font-black tracking-tight text-zinc-800 truncate">
                                    {cls.courseCode}
                                  </span>
                                  <span
                                    className={`text-[8px] font-extrabold uppercase px-1 py-0.2 rounded-xs border shrink-0 ${
                                      isLab
                                        ? "bg-emerald-600 text-white border-emerald-700" 
                                        : isTut
                                        ? "bg-amber-500 text-white border-amber-600"   
                                        : "bg-blue-50 text-blue-700 border-blue-100"
                                    }`}
                                  >
                                    {cls.type}
                                  </span>
                                </div>
                                <div className="text-[10px] text-zinc-400 font-semibold truncate">
                                  📍 {cls.venue}
                                </div>
                              </div>

                              <div className="text-right ml-2 shrink-0">
                                <span className="text-[10px] font-bold text-zinc-700 bg-white border border-zinc-200 rounded-md px-2 py-0.5 shadow-3xs block">
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
              
              <div className="w-full text-center mt-4 mb-2 shrink-0">
                <Link 
                  href="/?openReport=true" 
                  className="text-[11px] sm:text-xs font-bold text-rose-500 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 px-3 py-1.5 rounded-xl transition-all inline-flex items-center gap-1 shadow-2xs cursor-pointer select-none"
                >
                  ⚠️ Report Incorrect Timing / Issue
                </Link>
              </div>

            </div>
          )}

        </main>
      </div>

      <div className="shrink-0 z-40">
        <BottomTabs />
      </div>
    </div>
  );
}