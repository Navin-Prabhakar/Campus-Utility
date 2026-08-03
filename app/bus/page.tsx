"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

interface TimeSlot {
  time: string;
  from: string;
  to: string;
  isReserved?: boolean;
}

interface BusSchedule {
  busName: string;
  busNumber: string;
  weekdayDriverInfo: string;
  weekdayContact: string;
  weekendDriverInfo: string;
  weekendContact: string;
  weekdaysSchedule: TimeSlot[];
  weekendsSchedule: TimeSlot[];
}

export default function BusPage() {
  const CACHE_KEY = "swb_bus_schedule_cache";

  // 🛠️ FIX: Initialize safe states that look identical on both the Server and Client at frame zero
  const [buses, setBuses] = useState<BusSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<"weekdays" | "weekends">("weekdays");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

  useEffect(() => {
    const currentDay = new Date().getDay();
    setActiveTab(currentDay === 0 || currentDay === 6 ? "weekends" : "weekdays");

    // 🛠️ FIX: Read local cache data inside useEffect AFTER hydration completes safely in the browser
    const cachedData = localStorage.getItem(CACHE_KEY);
    if (cachedData) {
      try {
        const parsedCache = JSON.parse(cachedData);
        if (Array.isArray(parsedCache) && parsedCache.length > 0) {
          setBuses(parsedCache);
          setLoading(false); // Drop loading skeleton instantly since we have cached data
        }
      } catch (e) {
        console.error("Failed to parse local bus cache string", e);
      }
    }

    const fetchAndParseBusData = async () => {
      try {
        // 🛠️ OFFLINE GUARD: If navigator reports offline state, exit quietly if cache is available
        if (typeof window !== "undefined" && !navigator.onLine) {
          if (cachedData) {
            console.log("App operating safely in offline grid mode via local snapshots, bro!");
            setLoading(false);
            return;
          }
        }

        Papa.parse(SHEET_URL, {
          download: true,
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const rows = results.data as string[][];

            if (!rows || rows.length < 20) {
              if (!localStorage.getItem(CACHE_KEY)) {
                setError("Spreadsheet data is too short or empty.");
              }
              setLoading(false);
              return;
            }

            const busColumns = [0, 4, 8, 12, 16, 20, 24, 28];
            const parsedBuses: BusSchedule[] = [];

            const cleanAndExtractTime = (str: string): string | null => {
              if (!str) return null;
              const match = str.trim().match(/\b\d{1,2}\s*:\s*\d{2}\b/);
              return match ? match[0].replace(/\s+/g, "") : null;
            };

            const parseContact = (rawContact: string): string => {
              let contact = "N/A";
              const cleanDigits = rawContact.replace(/\D/g, "");
              if (cleanDigits.length >= 10) {
                contact = cleanDigits.slice(-10);
              }
              return contact;
            };

            const parseDriverName = (rawDriver: string): string => {
              return rawDriver
                .replace(/Driver\s*-\s*/i, "")
                .replace(/Conductor\s*-\s*/i, "")
                .replace(/Conductor\s*/i, "")
                .trim() || "SWB Assigned Staff";
            };

            busColumns.forEach((colIndex) => {
              let rawBusName = "";
              let rawWeekdayDriver = "SWB Assigned Staff";
              let rawWeekdayContact = "";
              let rawWeekendDriver = "SWB Assigned Staff";
              let rawWeekendContact = "";

              for (let i = 0; i < 74; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();
                
                if (cellLower.startsWith("bus") || cellLower.startsWith("institute")) {
                  rawBusName = cellVal;
                } else if (cellLower.includes("driver") || cellLower.includes("conductor") || (i === 17 && cellVal !== "" && !cellLower.includes("contact"))) {
                  rawWeekdayDriver = cellVal; 
                } else if (cellLower.includes("contact") || (i === 18 && cellVal !== "" && /\d+/.test(cellVal))) {
                  rawWeekdayContact = cellVal;
                }
              }

              for (let i = 75; i <= 120; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();

                if (cellLower.includes("driver") || cellLower.includes("conductor") || (i === 74 && cellVal !== "" && !cellLower.includes("contact"))) {
                  rawWeekendDriver = cellVal;
                } else if (cellLower.includes("contact") || (i === 75 && cellVal !== "" && /\d+/.test(cellVal))) {
                  rawWeekendContact = cellVal;
                }
              }

              if (!rawBusName) {
                rawBusName = `Bus ${Math.floor(colIndex / 4) + 1}`;
              }

              let busName = rawBusName;
              let busNumber = "";
              if (busName.includes("-")) {
                const parts = busName.split("-");
                busName = parts[0].trim();
                busNumber = parts[1]?.replace(/[()]/g, "").trim() || "";
              }

              const weekdayDriverInfo = parseDriverName(rawWeekdayDriver);
              const weekdayContact = parseContact(rawWeekdayContact);
              
              const weekendDriverInfo = parseDriverName(rawWeekendDriver);
              const weekendContact = parseContact(rawWeekendContact);

              const weekdaysSchedule: TimeSlot[] = [];
              for (let i = 40; i <= 75; i++) {
                const time = cleanAndExtractTime(rows[i]?.[colIndex] || "");
                if (time) {
                  const reserveCheck = rows[i]?.[colIndex + 3]?.trim().toLowerCase() || "";
                  weekdaysSchedule.push({
                    time,
                    from: rows[i]?.[colIndex + 1]?.trim() || "Campus",
                    to: rows[i]?.[colIndex + 2]?.trim() || "Campus",
                    isReserved: reserveCheck.includes("reserve")
                  });
                }
              }

              const weekendsSchedule: TimeSlot[] = [];
              for (let i = 75; i < rows.length; i++) {
                const cellVal = rows[i]?.[colIndex] || "";
                
                if (cellVal.toLowerCase().includes("note")) {
                  break;
                }

                const time = cleanAndExtractTime(cellVal);
                if (time) {
                  let from = rows[i]?.[colIndex + 1]?.trim() || "";
                  let to = rows[i]?.[colIndex + 2]?.trim() || "";
                  const reserveCheck = rows[i]?.[colIndex + 3]?.trim().toLowerCase() || "";

                  if (!from || from === "" || from.toLowerCase().includes("route")) from = "Campus";
                  if (!to || to === "" || to.toLowerCase().includes("route")) to = "Campus";

                  weekendsSchedule.push({ 
                    time, 
                    from, 
                    to,
                    isReserved: reserveCheck.includes("reserve")
                  });
                }
              }

              parsedBuses.push({
                busName,
                busNumber,
                weekdayDriverInfo,
                weekdayContact,
                weekendDriverInfo,
                weekendContact,
                weekdaysSchedule,
                weekendsSchedule
              });
            });

            const serializedData = JSON.stringify(parsedBuses);
            if (serializedData !== localStorage.getItem(CACHE_KEY)) {
              setBuses(parsedBuses);
              localStorage.setItem(CACHE_KEY, serializedData);
            }
            setLoading(false);
          },
          error: (err) => {
            console.error("Network sync interrupted:", err);
            if (!localStorage.getItem(CACHE_KEY)) {
              setError("Failed to process spreadsheet values.");
            }
            setLoading(false);
          }
        });
      } catch (err) {
        console.error("System error during parsing route engine:", err);
        if (!localStorage.getItem(CACHE_KEY)) {
          setError("Error rendering interface matrices.");
        }
        setLoading(false);
      }
    };

    fetchAndParseBusData();
  }, []);

  if (error) {
    return (
      <div className="h-screen w-full bg-[#050505] flex items-center justify-center p-6 text-center">
        <div className="bg-[#121212] border border-rose-900/40 p-6 rounded-2xl max-w-sm shadow-[0_0_30px_rgba(239,68,68,0.1)]">
          <span className="text-3xl">⚠️</span>
          <p className="mt-3 text-rose-400 font-semibold tracking-wide text-sm">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <main className="w-full min-h-screen bg-gradient-to-br from-zinc-900/10 to-blue-800/30 bg-zinc-950 text-green-600 relative selection:bg-sky-600/60 selection:text-white">
      
      <div className="absolute top-[-1%]  w-[100%] h-[8%] bg-blue-700/60 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="w-full px-2 py-21 pb-20">
        <div className="max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl flex flex-col space-y-4">
          
          <div className="px-1.5 py-2  bg-gradient-to-br from-purple-700/20 to-amber-800/30 border border-amber-500/10 rounded-2xl text-[13px] text-amber-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm space-y-2">
            <div className="font-semibold text-sm flex items-center gap-1.5 text-amber-400/90 tracking-normal uppercase">
              <span>⚠️</span> SWB Campus Notice
            </div>
            <div className="space-y-1.5 font-semibold text-md text-amber-200/70 leading-relaxed">
              <div className="flex items-start gap-1.5">
                <strong className="text-amber-300">1.)</strong> 
                <p>
                  Bus queries? Don't hesitate to call:- <br></br>Admin Staff:{" "}
                  <span className="text-white  px-1.5 ">_______</span> & <br></br>Bus Manager BSRTC:{" "}
                  <span className="text-white  px-1.5 ">Rajeev Ji (6201957967)</span>
                </p>
              </div>
              <div className="flex items-start gap-1.5">
                <strong className="text-amber-300 shrink-0">2.)</strong>
                <p>
                  When boarding the bus outside campus, keep your <span className="text-white font-bold">ID Card</span> handy or you may not be allowed on board.
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-center gap-1 p-1 bg-zinc-950/80 border border-zinc-900/80 rounded-2xl  shadow-inner">
            <button 
              onClick={() => setActiveTab("weekdays")} 
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs tracking-normal uppercase transition-all duration-300 transform active:scale-95 ${
                activeTab === "weekdays" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-extrabold" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Weekdays
            </button>
            <button 
              onClick={() => setActiveTab("weekends")} 
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs tracking-normal uppercase transition-all duration-300 transform active:scale-95 ${
                activeTab === "weekends" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-extrabold" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Weekends
            </button>
          </div>

          {loading && buses.length === 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-[#0F0F0F] border border-zinc-900 rounded-2xl h-64 animate-pulse flex flex-col overflow-hidden">
                  <div className="bg-zinc-900 h-16 w-full" />
                  <div className="p-3 space-y-3 flex-1">
                    <div className="h-3 bg-zinc-900 rounded w-1/3" />
                    <div className="space-y-2 pt-2">
                      <div className="h-8 bg-zinc-900 rounded-xl" />
                      <div className="h-8 bg-zinc-900 rounded-xl" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
              {buses.map((bus, idx) => {
                const activeSchedule = activeTab === "weekdays" ? bus.weekdaysSchedule : bus.weekendsSchedule;
                const activeDriver = activeTab === "weekdays" ? bus.weekdayDriverInfo : bus.weekendDriverInfo;
                const activeContact = activeTab === "weekdays" ? bus.weekdayContact : bus.weekendContact;

                return (
                  <div 
                    key={idx} 
                    className="group  border border-zinc-700 hover:border-zinc-500 rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    <div className="bg-[#161616] p-2.5 pt-1 pb-1 border-b border-zinc-700 shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-md sm:text-base text-zinc-100 flex items-center gap-1.5 tracking-tight group-hover:text-white transition-colors">
                          <span className="text-base">🚌</span> {bus.busName}
                        </h3>
                        {bus.busNumber && (
                          <span className="text-[12px] bg-zinc-700/60 text-slate-200 px-2 py-1 rounded-lg border border-zinc-600 font-mono font-black tracking-normal shadow-xs uppercase">
                            {bus.busNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-0 pt-1 border-t border-zinc-900/10">
                        <p className="text-md text-zinc-300 font-medium truncate max-w-[60%]">
                          <span className="text-zinc-500">👤</span> {activeDriver}
                        </p>
                        {activeContact && activeContact !== "N/A" ? (
                          <a 
                            href={`tel:${activeContact}`} 
                            className="text-[12px] bg-emerald-400/20 hover:bg-emerald-500/30 text-emerald-500 px-1.5 py-1 rounded-lg font-mono font-bold border border-emerald-500/50 transition-all active:scale-95 flex items-center gap-1"
                          >
                            🤙 {activeContact}
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">No Mobile Contact</span>
                        )}
                      </div>
                    </div>

                    <div className="p-3 flex-1 overflow-y-auto max-h-64 bg-gradient-to-br from-blue-900/50 to-black  bg-gradient-to-tr from-pink-800/10 to-black/50 style-scrollbar">
                      <div className="space-y-1.5 ">
                        <div className="flex justify-between text-[11px] text-zinc-500 font-extrabold uppercase tracking-widest px-2 pb-1 border-b border-zinc-900">
                          <span>Departure</span>
                          <span>Route </span>
                        </div>
                        {activeSchedule.map((slot, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="flex justify-between items-center text-sm p-2 bg-zinc-800 hover:bg-zinc-800 border border-zinc-700/50 rounded-xl transition-all duration-150"
                          >
                            <span className="font-extrabold text-[#F59E0B] bg-amber-500/5 px-2 py-0.5 rounded-lg font-mono text-[12px] border border-amber-500/10 shadow-xs">
                              {slot.time}
                            </span>
                            <span className="text-zinc-300 font-medium text-right max-w-[240px] sm:max-w-[220px] truncate flex items-center gap-1.5" title={`${slot.from} ➔ ${slot.to}`}>
                              {slot.isReserved && (
                                <span className="text-[10px] bg-rose-500/20 text-rose-400 px-1 py-0.5 rounded font-mono font-bold uppercase tracking- shrink-0 border border-amber-500/30">
                                  Reserved
                                </span>
                              )}
                              <span>
                                {slot.from} <span className="text-zinc-600 font-black mx-0.5">➔</span> {slot.to}
                              </span>
                            </span>
                          </div>
                        ))}
                        {activeSchedule.length === 0 && (
                          <div className="text-zinc-500 text-xs text-center py-6 font-medium italic bg-[#121212]/40 rounded-xl border border-dashed border-zinc-800">
                            No active trips running today.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="w-full text-center pt-4 pb-2 shrink-0">
            <Link 
              href="/?openReport=true" 
              className="text-[11px] sm:text-xs font-bold tracking-wide uppercase text-rose-400 hover:text-white bg-rose-500/5 hover:bg-rose-600 border border-rose-500/20 hover:border-rose-500 px-4 py-2.5 rounded-xl transition-all duration-300 inline-flex items-center gap-2 shadow-[0_4px_12px_rgba(244,63,94,0.05)] cursor-pointer active:scale-95 hover:shadow-[0_0_20px_rgba(244,63,94,0.2)]"
            >
              🚨 Report Discrepancy / Schedule Issue
            </Link>
          </div>
          
        </div>
      </div>

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
    </main>
  );
}