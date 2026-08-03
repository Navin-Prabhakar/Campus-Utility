"use client";

import React, { useEffect, useState, useRef } from "react";
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
  const [selectedElective, setSelectedElective] = useState<string>("ALL");
  const [timetableData, setTimetableData] = useState<TimetableItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isPersistedDefault, setIsPersistedDefault] = useState<boolean>(false);

  const [currentDayName, setCurrentDayName] = useState<string>("");
  const [currentMinutesNow, setCurrentMinutesNow] = useState<number>(0);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const activeClassRef = useRef<HTMLDivElement>(null);
  const activeDayRef = useRef<HTMLDivElement>(null);

  const CACHE_KEY = "swb_timetable_schedule_cache";

  // Electives Configuration Lookup
  const ELECTIVES_CONFIG: Record<string, { code: string; name: string }[]> = {
    "2": [
      { code: "HS2110", name: "Language Human Mind and Indian Society" },
      { code: "HS2111", name: "Introductory Sociology" },
      { code: "HS2112", name: "Introduction to Demography" },
    ],
    "3": [
      { code: "CB3106", name: "IDE-II (Chemical)" },
      { code: "ME3106", name: "IDE-II (Mechanical)" },
      { code: "CS3106", name: "IDE-II (Computer Science)" },
      { code: "MM3106", name: "IDE-II (Metallurgical)" },
      { code: "HS3108", name: "IDE-II (Humanities)" },
    ],
  };

  // Live device time tracking for auto-scrolling & highlighting
  useEffect(() => {
    const updateTimeContext = () => {
      const now = new Date();
      const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
      setCurrentDayName(days[now.getDay()]);
      setCurrentMinutesNow(now.getHours() * 60 + now.getMinutes());
    };

    updateTimeContext();
    const interval = setInterval(updateTimeContext, 30000);
    return () => clearInterval(interval);
  }, []);

  // Client-side storage pins extraction inside safe mount window
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedYear = localStorage.getItem("iitp_default_year") || "1";
      const storedGroup = localStorage.getItem("iitp_default_group") || (storedYear === "1" ? "G1" : "AI");
      const storedElective = localStorage.getItem("iitp_default_elective") || "ALL";
      
      setAcademicYear(storedYear);
      setSelectedGroup(storedGroup);
      setSelectedElective(storedElective);
    }
  }, []);

  // Sync live asset JSON registers
  useEffect(() => {
    async function fetchTimetableData() {
      try {
        setLoading(true);
        setError(false);
        
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              setTimetableData(parsedCache);
              setLoading(false);
            }
          } catch (e) {
            console.error("Failed parsing timetable persistence layer blocks:", e);
          }
        }

        if (typeof window !== "undefined" && !navigator.onLine) {
          if (cachedData) {
            setLoading(false);
            return;
          }
        }

        const res = await fetch("/static/timetable.json");
        if (!res.ok) throw new Error("Failed to pull secure JSON payload assets");
        
        const data = await res.json();
        const parsedData = Array.isArray(data) ? data : [];

        if (process.env.NODE_ENV === "development") {
          setTimetableData(parsedData);
          setLoading(false);
          return;
        }

        const serializedData = JSON.stringify(parsedData);
        if (serializedData !== localStorage.getItem(CACHE_KEY)) {
          setTimetableData(parsedData);
          localStorage.setItem(CACHE_KEY, serializedData);
        }
        setLoading(false);
      } catch (err) {
        console.error("Error fetching secure live timetable database:", err);
        if (!localStorage.getItem(CACHE_KEY)) {
          setError(true);
        }
        setLoading(false);
      }
    }
    fetchTimetableData();
  }, []);

  // Re-evaluate pinned synchronization states context
  useEffect(() => {
    const savedYear = localStorage.getItem("iitp_default_year");
    const savedGroup = localStorage.getItem("iitp_default_group");
    const savedElective = localStorage.getItem("iitp_default_elective") || "ALL";

    setIsPersistedDefault(
      savedYear === academicYear && 
      savedGroup === selectedGroup && 
      savedElective === selectedElective
    );
  }, [academicYear, selectedGroup, selectedElective]);

  // Click outside interception
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-scroll to current day / active class slot
  useEffect(() => {
    if (!loading && timetableData.length > 0) {
      setTimeout(() => {
        if (activeClassRef.current) {
          activeClassRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
        } else if (activeDayRef.current) {
          activeDayRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      }, 300);
    }
  }, [loading, timetableData, academicYear, selectedGroup, selectedElective]);

  const handlePersistenceToggle = () => {
    if (isPersistedDefault) {
      localStorage.removeItem("iitp_default_year");
      localStorage.removeItem("iitp_default_group");
      localStorage.removeItem("iitp_default_elective");
      setIsPersistedDefault(false);
    } else {
      localStorage.setItem("iitp_default_year", academicYear);
      localStorage.setItem("iitp_default_group", selectedGroup);
      localStorage.setItem("iitp_default_elective", selectedElective);
      setIsPersistedDefault(true);
    }
  };

  const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

  const parseTimeToMinutes = (timeStr: string): number => {
    try {
      const startTimePart = timeStr.split("-")[0].trim().toUpperCase();
      if (startTimePart.includes("NOON")) return 12 * 60;
      
      const match = startTimePart.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
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

  const parseEndTimeToMinutes = (timeStr: string): number => {
    try {
      const parts = timeStr.split("-");
      if (parts.length < 2) return parseTimeToMinutes(timeStr) + 55;
      
      const endTimePart = parts[1].trim().toUpperCase();
      const match = endTimePart.match(/(\d+)(?::(\d+))?\s*(AM|PM)?/);
      if (!match) return parseTimeToMinutes(timeStr) + 55;

      let hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      const period = match[3];

      if (period === "PM" && hours !== 12) hours += 12;
      if (period === "AM" && hours === 12) hours = 0;

      return hours * 60 + minutes;
    } catch (e) {
      return parseTimeToMinutes(timeStr) + 55;
    }
  };

  const filteredSchedule = timetableData.filter((item) => {
    const matchYear = Number(item.year) === Number(academicYear);
    if (!matchYear) return false;

    // Filter out electives if specific elective is chosen
    if (selectedElective !== "ALL" && (academicYear === "2" || academicYear === "3")) {
      const isElectiveCourse = ELECTIVES_CONFIG[academicYear]?.some((e) => item.courseCode.includes(e.code));
      if (isElectiveCourse && !item.courseCode.includes(selectedElective)) {
        return false;
      }
    }

    const itemGroup = item.group.trim();
    const currentSelection = selectedGroup.trim();

    if (itemGroup === "All Branches" || itemGroup === "All") return true;
    if (itemGroup === currentSelection) return true;

    const targetGroupRegex = new RegExp(`\\b${currentSelection}\\b`);
    return targetGroupRegex.test(itemGroup);
  });

  return (
    <div 
      className="h-full w-full py-20 font-sans text-zinc-300 antialiased flex flex-col overflow-hidden relative selection:bg-blue-500 selection:text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle at top left, rgba(38, 22, 94, 0.51), transparent 45%),
          radial-gradient(circle at top right, rgba(32, 18, 47, 0.39), transparent 50%),
          radial-gradient(circle at bottom, rgba(25, 25, 66, 0.47), transparent 65%)
        `,
        backgroundColor: '#110f11'
      }}
    >
      
      {/* Persistent Sticky Navigation Control Bar */}
      <div className="w-full bg-[#0A0A0A]/60 backdrop-blur-md shrink-0 z-30 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
        {!loading && !error && (
          <div className="w-[94%] max-w-[365px] py-2 flex gap-2 items-center relative">
            
            {/* Display Pinned Group Block Tracker */}
            <div 
              onClick={handlePersistenceToggle}
              className={`flex-1 bg-zinc-800 border rounded-xl py-2 px-2 flex items-center justify-between cursor-pointer select-none transition-all duration-200 shadow-inner hover:border-zinc-600 active:scale-[0.98] ${
                isPersistedDefault ? 'border-zinc-700 bg-[#141414]' : 'border-zinc-900'
              }`}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className={`w-4.5 h-4.5 rounded-xl border flex items-center justify-center transition-all shrink-0 ${
                  isPersistedDefault 
                    ? "bg-blue-600 border-blue-500 text-white" 
                    : "border-zinc-700 bg-[#0A0A0A]"
                }`}>
                  {isPersistedDefault && (
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className="w-2 h-2">
                      <polyline points="20 6 9 17 4 12"></polyline>
                    </svg>
                  )}
                </div>
                
                <div className="flex items-center gap-1 text-[12px] font-black tracking-wide truncate">
                  <span className="text-zinc-300 font-sans font-bold truncate">
                    B.Tech {academicYear === "1" ? "1st" : academicYear === "2" ? "2nd" : academicYear === "3" ? "3rd" : "4th"} Year
                  </span>
                  <span className="text-white font-mono font-black shrink-0">
                    ({selectedGroup}{selectedElective !== "ALL" ? ` • ${selectedElective}` : ""})
                  </span>
                </div>
              </div>

              
            </div>

            {/* Filter Open Panel Trigger */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-xl py-2 px-3.5 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md ${
                  isDropdownOpen
                    ? "bg-zinc-900 border-zinc-500 text-white" 
                    : "bg-zinc-800 border-zinc-900 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>Filter</span>
                <span className={`text-[9px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Dynamic Filtering Panel Popout Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-1 w-52 bg-zinc-900 backdrop-blur-xl border border-zinc-800 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.9)] py-2 z-50 flex flex-col text-[11px] font-bold text-zinc-400 animate-in fade-in zoom-in-95 duration-100">
                  
                  <div className="px-3 text-[12px] font-black text-zinc-400 tracking-wide mb-1">
                    Year
                  </div>
                  <div className="px-2 mb-2">
                    <select
                      value={academicYear}
                      onChange={(e) => {
                        const nextYear = e.target.value;
                        setAcademicYear(nextYear);
                        setSelectedGroup(nextYear === "1" ? "G1" : "AI");
                        setSelectedElective("ALL");
                      }}
                      className="w-full bg-[#121212] border border-zinc-800 rounded-lg py-1.5 px-2 text-[11px] font-black text-zinc-200 outline-hidden focus:border-zinc-700 cursor-pointer"
                    >
                      <option value="1">B.Tech 1st Year</option>
                      <option value="2">B.Tech 2nd Year</option>
                      <option value="3">B.Tech 3rd Year</option>
                      <option value="4">B.Tech 4th Year</option>
                    </select>
                  </div>

                  <div className="px-3 py-1 text-[11px] font-black text-zinc-400 tracking-widest mb-1">
                    Group / Stream
                  </div>
                  <div className="px-2 mb-2">
                    <select
                      value={selectedGroup}
                      onChange={(e) => setSelectedGroup(e.target.value)}
                      className="w-full bg-[#121212] border border-zinc-800 rounded-lg py-1.5 px-2 text-[11px] font-black text-zinc-200 outline-hidden focus:border-zinc-700 cursor-pointer"
                    >
                      {academicYear === "1" ? (
                        Array.from({ length: 24 }, (_, i) => `G${i + 1}`).map((g) => (
                          <option key={g} value={g}>{g}</option>
                        ))
                      ) : (
                        <>
                          <option value="AI">AI (Ai & Data Science)</option>
                          <option value="CB">CB (Chemical Eng.)</option>
                          <option value="CS">CS (Computer Science & Eng.)</option>
                          <option value="CT">CT (Chemical Science & Technology)</option>
                          <option value="MC">MC (Mathematics & Computing)</option>
                          <option value="CE">CE (Civil Eng.)</option>
                          <option value="ES">ES (BS Economics)</option>
                          <option value="EC">EC (Electronics and Communication Eng.)</option>
                          <option value="EE">EE (Electrical Eng.)</option>
                          <option value="MM">MM (Metallurgical and Materials Eng.)</option>
                          <option value="ME">ME (Mechanical Eng.)</option>
                          <option value="EP">EP (BTech. in Engineering Physics)</option>
                        </>
                      )}
                    </select>
                  </div>

                  {/* 🎯 ELECTIVE SELECTION MENU (For 2nd and 3rd Years) */}
                  {(academicYear === "2" || academicYear === "3") && (
                    <>
                      <div className="px-3 py-1 text-[11px] font-black text-zinc-400 tracking-widest mb-1">
                        Elective Course
                      </div>
                      <div className="px-2">
                        <select
                          value={selectedElective}
                          onChange={(e) => setSelectedElective(e.target.value)}
                          className="w-full bg-[#121212] border border-zinc-800 rounded-lg py-1.5 px-2 text-[10px] font-black text-zinc-200 outline-hidden focus:border-zinc-700 cursor-pointer truncate"
                        >
                          <option value="ALL">Show All Electives</option>
                          {ELECTIVES_CONFIG[academicYear]?.map((ele) => (
                            <option key={ele.code} value={ele.code}>
                              {ele.code} - {ele.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </>
                  )}

                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* 📜 SCROLLABLE MIDDLE TRACK CONTAINER */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-2 py-2 pb-2 style-scrollbar">
        <main className="w-[97%] max-w-[365px] flex flex-col flex-grow">
          
          {loading && timetableData.length === 0 ? (
            <div className="flex flex-col gap-3 w-full">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="h-24 w-full animate-pulse rounded-2xl bg-[#121212]/50 border border-zinc-900" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-400 bg-rose-950/20 rounded-2xl border border-rose-500/20 font-bold uppercase tracking-wide">
              🚨 Unable to sync live timetable records.
            </div>
          ) : (
            <div className="flex flex-col gap-4.5 w-full">
              {daysOrder.map((day) => {
                const isToday = currentDayName === day;
                const dayClasses = filteredSchedule
                  .filter((c) => c.day === day)
                  .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time));

                return (
                  <div 
                    key={day} 
                    ref={isToday ? activeDayRef : null}
                    className={`w-full border rounded-2xl p-3 shadow-xl flex flex-col transition-all duration-300 ${
                      isToday 
                        ? "bg-gradient-to-b from-sky-400/30 via-slate-900/80 to-black border-sky-400/80 ring-1 ring-sky-500/50" 
                        : "bg-gradient-to-b from-sky-300/10 to-black border-sky-600/20"
                    }`}
                  >
                    
                    <div className="border-b border-zinc-950 pb-2 mb-2.5 flex justify-between items-center select-none">
                      <div className="flex items-center gap-2">
                        <span className={`text-[12px] font-black uppercase tracking-wider ${isToday ? "text-sky-300" : "text-zinc-300"}`}>
                          {day}
                        </span>
                        {isToday && (
                          <span className="text-[9px] bg-sky-500 text-black font-black uppercase px-1.5 py-0.2 rounded-md animate-pulse">
                            Today
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] font-mono font-black bg-[#121212] text-zinc-400 border border-zinc-800 px-2.5 py-0.5 rounded-lg shadow-inner">
                        {dayClasses.length} Slots
                      </span>
                    </div>

                    {dayClasses.length === 0 ? (
                      <p className="text-[12px] text-zinc-500 font-medium italic py-3 text-center bg-[#121212]/40 border border-dashed border-zinc-950 rounded-2xl">
                        🎉 No Class Schedule found!
                      </p>
                    ) : (
                      <div className="flex flex-col gap-2">
                        {dayClasses.map((cls, idx) => {
                          const isLab = cls.type.toLowerCase().includes("lab");
                          const isTut = cls.type === "Tutorial";

                          const startMin = parseTimeToMinutes(cls.time);
                          const endMin = parseEndTimeToMinutes(cls.time);
                          const isOngoing = isToday && currentMinutesNow >= startMin && currentMinutesNow <= endMin;

                          return (
                            <div
                              key={idx}
                              ref={isOngoing ? activeClassRef : null}
                              className={`flex justify-between p-2.5 rounded-xl border transition-all duration-150 transform active:scale-[0.99] relative overflow-hidden ${
                                isOngoing
                                  ? "bg-sky-950/90 border-sky-400 ring-2 ring-sky-400/80 shadow-[0_0_15px_rgba(56,189,248,0.3)] animate-pulse"
                                  : isLab
                                  ? "bg-emerald-950 border-green-800 border-2 shadow-sm"
                                  : isTut
                                  ? "bg-zinc-700 border-amber-800 border-2 shadow-xs"
                                  : "bg-zinc-700 border-zinc-700 shadow-sm"
                              }`}
                            >
                              {/* Left section: Course info and Venue */}
                              <div className="flex flex-col gap-2 min-w-0 flex-1 pr-1.5">
                                <div className="flex items-center gap-2">
                                  <span className="text-[13px] font-black tracking-tight text-white truncate">
                                    {cls.courseCode}
                                  </span>
                                </div>
                                <div className="text-[14px]">
                                  📍 <span className="text-[11px] text-zinc-200 font-black">{cls.venue}</span>
                                </div>
                              </div>

                              {/* Right section: Time and Type badge stacked vertically */}
                              <div className="flex flex-col items-end gap-2 shrink-0">
                                <span className={`text-[11px] font-black border rounded-2xl px-2 py-1 shadow-inner ${
                                  isOngoing 
                                    ? "bg-sky-400 text-black border-sky-300 font-bold"
                                    : "text-amber-500 bg-zinc-700 border-amber-500/70"
                                }`}>
                                  {cls.time}
                                </span>
                                <span
                                  className={`text-[9px] font-black uppercase tracking-normal px-1.5 py-0.5 rounded-lg border ${
                                    isOngoing
                                      ? "bg-sky-500 text-black border-sky-300 font-bold"
                                      : isLab
                                      ? "bg-green-800 text-zinc-100 border-green-800"
                                      : isTut
                                      ? "bg-amber-800 text-zinc-100 border-amber-800"
                                      : "bg-zinc-700 text-zinc-200 border-zinc-500"
                                  }`}
                                >
                                  {isOngoing ? "Active Now" : cls.type}
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
    </div>
  );
}