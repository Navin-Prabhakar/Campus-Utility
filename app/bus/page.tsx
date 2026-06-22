"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";

interface TimeSlot {
  time: string;
  from: string;
  to: string;
}

interface BusSchedule {
  busName: string;
  busNumber: string;
  driverInfo: string;
  contact: string;
  weekdaysSchedule: TimeSlot[];
  weekendsSchedule: TimeSlot[];
}

export default function BusPage() {
  const [buses, setBuses] = useState<BusSchedule[]>([]);
  const [activeTab, setActiveTab] = useState<"weekdays" | "weekends">("weekdays");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

  useEffect(() => {
    const currentDay = new Date().getDay();
    setActiveTab(currentDay === 0 || currentDay === 6 ? "weekends" : "weekdays");

    const fetchAndParseBusData = async () => {
      try {
        Papa.parse(SHEET_URL, {
          download: true,
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const rows = results.data as string[][];

            if (!rows || rows.length < 20) {
              setError("Spreadsheet data is too short or empty.");
              setLoading(false);
              return;
            }

            const busColumns = [2, 6, 10, 14, 18, 22];
            const parsedBuses: BusSchedule[] = [];

            const cleanAndExtractTime = (str: string): string | null => {
              if (!str) return null;
              const match = str.trim().match(/\b\d{1,2}\s*:\s*\d{2}\b/);
              return match ? match[0].replace(/\s+/g, "") : null;
            };

            busColumns.forEach((colIndex, listIdx) => {
              let rawBusName = "";
              let rawDriver = "SWB Assigned Staff";
              let rawContact = "";

              for (let i = 0; i < 40; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();
                
                if (cellLower.startsWith("bus") || cellLower.startsWith("institute")) {
                  rawBusName = cellVal;
                } else if (cellLower.includes("driver") || cellLower.includes("conductor") || (i === 17 && cellVal !== "" && !cellLower.includes("contact"))) {
                  rawDriver = cellVal; 
                } else if (cellLower.includes("contact") || (i === 18 && cellVal !== "" && /\d+/.test(cellVal))) {
                  rawContact = cellVal;
                }
              }

              if (!rawBusName && colIndex > 0) {
                rawBusName = rows[16]?.[colIndex - 1] || rows[16]?.[colIndex - 2] || "";
              }
              if (!rawBusName) {
                rawBusName = colIndex === 18 ? "Institute Bus 1" : colIndex === 22 ? "Institute Bus 2" : `Bus Module`;
              }

              let busName = rawBusName;
              let busNumber = "";
              if (busName.includes("-")) {
                const parts = busName.split("-");
                busName = parts[0].trim();
                busNumber = parts[1]?.replace(/[()]/g, "").trim() || "";
              }

              const cleanedDriver = rawDriver
                .replace(/Driver\s*-\s*/i, "")
                .replace(/Conductor\s*-\s*/i, "")
                .replace(/Conductor\s*/i, "")
                .trim();
              const driverInfo = cleanedDriver || "SWB Assigned Staff";

              let contact = "N/A";
              const cleanDigits = rawContact.replace(/\D/g, "");
              if (cleanDigits.length >= 10) {
                contact = cleanDigits.slice(-10);
              }

              const weekdaysSchedule: TimeSlot[] = [];
              for (let i = 19; i <= 65; i++) {
                const time = cleanAndExtractTime(rows[i]?.[colIndex] || "");
                if (time) {
                  weekdaysSchedule.push({
                    time,
                    from: rows[i]?.[colIndex + 1]?.trim() || "Campus",
                    to: rows[i]?.[colIndex + 2]?.trim() || "Campus"
                  });
                }
              }

              const weekendsSchedule: TimeSlot[] = [];
              let weekendTargetCol = -1;
              if (listIdx === 1) weekendTargetCol = 11;
              if (listIdx === 4) weekendTargetCol = 23;

              if (weekendTargetCol !== -1) {
                for (let i = 66; i < rows.length; i++) {
                  const time = cleanAndExtractTime(rows[i]?.[weekendTargetCol] || "");
                  
                  if (rows[i]?.[weekendTargetCol]?.toLowerCase().includes("note")) {
                    break;
                  }

                  if (time) {
                    let from = rows[i]?.[weekendTargetCol + 1]?.trim() || "";
                    let to = rows[i]?.[weekendTargetCol + 2]?.trim() || "";
                    if (!from || from === "" || from.toLowerCase().includes("route")) from = "Campus";
                    if (!to || to === "" || to.toLowerCase().includes("route")) to = "Campus";

                    weekendsSchedule.push({ time, from, to });
                  }
                }
              }

              parsedBuses.push({
                busName,
                busNumber,
                driverInfo,
                contact,
                weekdaysSchedule,
                weekendsSchedule
              });
            });

            setBuses(parsedBuses);
            setLoading(false);
          },
          error: (err) => {
            console.error(err);
            setError("Failed to process spreadsheet values.");
            setLoading(false);
          }
        });
      } catch (err) {
        setError("Error rendering interface matrices.");
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
    <main className="h-full w-full bg-[#050505] text-[#F8FAFC] flex flex-col overflow-hidden relative selection:bg-zinc-800 selection:text-white">
      
      {/* 🌌 High-depth radial gradient masking (No blues/indigos) */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[40%] bg-zinc-900/40 blur-[120px] rounded-full pointer-events-none" />
      
      {/* 📜 APP WINDOW SCROLL BODY */}
      <div className="flex-1 overflow-y-auto px-4 py-4 pb-32 style-scrollbar">
        <div className="max-w-md mx-auto sm:max-w-xl md:max-w-4xl lg:max-w-6xl flex flex-col min-h-full space-y-4">
          
          {/* Notice Banner - Warning Token */}
          <div className="p-3.5 bg-gradient-to-br from-[#14120F] to-[#0D0B0A] border border-amber-500/10 rounded-2xl text-[13px] text-amber-200/90 shadow-[0_4px_20px_rgba(0,0,0,0.4)] backdrop-blur-sm space-y-2">
            <div className="font-extrabold text-sm flex items-center gap-2 text-amber-400 tracking-wide uppercase">
              <span>⚠️</span> SWB Campus Notice
            </div>
            <div className="space-y-1.5 text-xs text-amber-100/70 leading-relaxed font-medium">
              <p>
                <strong className="text-amber-300">1.)</strong> Bus queries? Tap contacts below or call Admin Staff:{" "}
                <span className="text-white bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold border border-amber-500/20">Mantu Ji (8986162721)</span> & Bus Manager BSRTC:{" "}
                <span className="text-white bg-amber-500/10 px-1.5 py-0.5 rounded font-semibold border border-amber-500/20">Rajeev Ji (6201957967)</span>.
              </p>
              <p>
                <strong className="text-amber-300">2.)</strong> Always carry your physical <span className="text-white font-bold underline decoration-amber-500">ID Card</span> outside campus boundaries to guarantee boarding privileges.
              </p>
            </div>
          </div>

          {/* iOS-Style Pill Toggle Controls (Mono Dark Contrast Shift) */}
          <div className="flex justify-center p-1 bg-[#121212] border border-zinc-800 rounded-2xl max-w-[280px] mx-auto shadow-inner">
            <button 
              onClick={() => setActiveTab("weekdays")} 
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 transform active:scale-95 ${
                activeTab === "weekdays" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-extrabold" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Weekdays
            </button>
            <button 
              onClick={() => setActiveTab("weekends")} 
              className={`flex-1 py-2 px-4 rounded-xl font-bold text-xs tracking-wider uppercase transition-all duration-300 transform active:scale-95 ${
                activeTab === "weekends" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-[0_2px_10px_rgba(0,0,0,0.5)] font-extrabold" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              Weekends
            </button>
          </div>

          {/* Main Grid Section */}
          {loading ? (
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

                return (
                  <div 
                    key={idx} 
                    className="group bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border border-zinc-900 hover:border-zinc-700 rounded-2xl shadow-2xl transition-all duration-300 flex flex-col overflow-hidden transform hover:-translate-y-0.5 active:scale-[0.99]"
                  >
                    {/* Card App-Header (Raised Contrast clickable layer) */}
                    <div className="bg-[#161616] p-3 border-b border-zinc-900 shrink-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-extrabold text-sm sm:text-base text-zinc-100 flex items-center gap-1.5 tracking-tight group-hover:text-white transition-colors">
                          <span className="text-base">🚌</span> {bus.busName}
                        </h3>
                        {bus.busNumber && (
                          <span className="text-[10px] bg-zinc-800 text-zinc-300 px-2 py-0.5 rounded-lg border border-zinc-700 font-mono font-black tracking-wider shadow-xs uppercase">
                            {bus.busNumber}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-zinc-900/60">
                        <p className="text-xs text-zinc-400 font-medium truncate max-w-[60%]">
                          <span className="text-zinc-500">👤</span> {bus.driverInfo}
                        </p>
                        {bus.contact && bus.contact !== "N/A" ? (
                          <a 
                            href={`tel:${bus.contact}`} 
                            className="text-[11px] bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-lg font-mono font-bold border border-emerald-500/20 transition-all active:scale-95 flex items-center gap-1"
                          >
                            📞 {bus.contact}
                          </a>
                        ) : (
                          <span className="text-[11px] text-zinc-600 font-mono">No Mobile Contact</span>
                        )}
                      </div>
                    </div>

                    {/* Inside Schedule Scroll List */}
                    <div className="p-2.5 flex-1 overflow-y-auto max-h-64 bg-[#070707] style-scrollbar">
                      <div className="space-y-1.5">
                        <div className="flex justify-between text-[10px] text-zinc-500 font-extrabold uppercase tracking-widest px-2 pb-1 border-b border-zinc-900">
                          <span>Departure</span>
                          <span>Route Matrix</span>
                        </div>
                        {activeSchedule.map((slot, sIdx) => (
                          <div 
                            key={sIdx} 
                            className="flex justify-between items-center text-xs p-2 bg-[#121212] hover:bg-[#1A1A1A] border border-zinc-900/50 rounded-xl transition-all duration-150"
                          >
                            <span className="font-extrabold text-[#F59E0B] bg-amber-500/5 px-2 py-0.5 rounded-lg font-mono text-[11px] border border-amber-500/10 shadow-xs">
                              {slot.time}
                            </span>
                            <span className="text-zinc-300 font-medium text-right max-w-[180px] sm:max-w-[220px] truncate" title={`${slot.from} ➔ ${slot.to}`}>
                              {slot.from} <span className="text-zinc-600 font-black mx-0.5">➔</span> {slot.to}
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

          {/* 🚨 Crimson Red Report Button Layer */}
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

      {/* Embedded CSS Tricks for Custom Micro Scrollbars inside Cards */}
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