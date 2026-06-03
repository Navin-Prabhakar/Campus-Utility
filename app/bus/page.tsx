"use client";

import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Header from "../components/Header";
import BottomTabs from "../components/BottomTabs";

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

  if (error) return <div className="p-8 text-center text-red-500 font-medium">{error}</div>;

  return (
    <main className="h-screen max-h-screen w-full bg-gray-50 flex flex-col overflow-hidden">
      {/* 🏠 GLOBAL HEADER INSERTED HERE */}
      <Header />
      
      {/* STICKY TOP CONTAINER */}
      <div className="w-full bg-gray-50 shrink-0 z-30 px-2 pt-2 pb-1 border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto">
          {/* Notice Header Block */}
          <div className="p-1 bg-amber-50 border border-amber-200 rounded-xl text-xs sm:text-sm text-amber-900 space-y-0 max-w-4xl mx-auto shadow-2xs">
            <div className="font-bold text-sm flex items-center gap-1.5 text-amber-950">⚠️ <u>SWB Notice</u>:</div>
            <p className="leading-relaxed">
              <strong>1.)</strong> For any bus related queries, call admin staff- 
              <span className="font-semibold text-slate-900"> Mantu Ji (8986162721)</span> & Bus Manager BSRTC - 
              <span className="font-semibold text-slate-900"> Rajeev Ji (6201957967)</span>.
            </p>
            <p className="leading-relaxed">
              <strong>2.)</strong> Outside campus, keep your ID card handy or boarding may be denied.
            </p>
          </div>

          {/* Manual Mode Toggle Controls inside Sticky Container */}
          <div className="flex justify-center gap-2 mt-1 bg-gray-100 p-1.5 rounded-xl max-w-xs mx-auto shadow-inner border border-gray-200/60">
            <button 
              onClick={() => setActiveTab("weekdays")} 
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${activeTab === "weekdays" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"}`}
            >
              Weekdays
            </button>
            <button 
              onClick={() => setActiveTab("weekends")} 
              className={`flex-1 py-1.5 px-3 rounded-lg font-bold text-xs transition-all ${activeTab === "weekends" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"}`}
            >
              Weekends
            </button>
          </div>
        </div>
      </div>

      {/* SCROLLABLE GRID FLOW CONTAINER */}
      <div className="flex-1 overflow-y-auto px-2 py-1 pb-24 bg-zinc-50/50">
        <div className="max-w-7xl mx-auto">
          
          {/* Handled loading inline using a clean Skeleton Layout Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {[...Array(3)].map((_, idx) => (
                <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-3xs overflow-hidden flex flex-col animate-pulse">
                  {/* Fake Top Banner */}
                  <div className="bg-zinc-300 h-16 w-full" />
                  {/* Fake Rows Box */}
                  <div className="p-3 space-y-2">
                    <div className="h-3 bg-zinc-200 rounded w-1/3 mb-4" />
                    {[...Array(4)].map((_, rowIdx) => (
                      <div key={rowIdx} className="flex justify-between items-center h-7 bg-zinc-100 rounded-lg px-2" />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
              {buses.map((bus, idx) => {
                const activeSchedule = activeTab === "weekdays" ? bus.weekdaysSchedule : bus.weekendsSchedule;

                return (
                  <div key={idx} className="bg-white border border-gray-200 rounded-2xl shadow-3xs overflow-hidden flex flex-col hover:border-indigo-400 transition-all">
                    <div className="bg-slate-900 p-2 text-white shrink-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-sm sm:text-base flex items-center gap-1.5">🚌 {bus.busName}</h3>
                        {bus.busNumber && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-semibold shadow-xs">{bus.busNumber}</span>}
                      </div>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-xs text-slate-300">👤 {bus.driverInfo}</p>
                        {bus.contact && <span className="text-[11px] bg-green-600 text-white px-1.5 py-0.5 rounded font-mono font-semibold shadow-xs">📞 {bus.contact}</span>}
                      </div>
                    </div>

                    {/* Individual Bus List Box */}
                    <div className="p-2 flex-grow overflow-y-auto max-h-64 bg-white">
                      <div className="space-y-1">
                        <div className="flex justify-between text-[10px] text-gray-500 font-bold uppercase tracking-wider px-3 border-b pb-1">
                          <span>TIME</span>
                          <span>ROUTE DIRECTION</span>
                        </div>
                        {activeSchedule.map((slot, sIdx) => (
                          <div key={sIdx} className="flex justify-between items-center text-xs p-1 bg-gray-100 border border-gray-100 rounded-lg">
                            <span className="font-bold text-indigo-600 shrink-0 bg-indigo-100 px-1.5 py-0.5 rounded font-mono text-[11px] border border-indigo-100/60">{slot.time}</span>
                            <span className="text-gray-700 text-right max-w-[220px] truncate" title={`${slot.from} ➔ ${slot.to}`}>{slot.from} ➔ {slot.to}</span>
                          </div>
                        ))}
                        {activeSchedule.length === 0 && (
                          <p className="text-gray-400 text-xs text-center py-2 italic">No active trips scheduled for today.</p>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
        </div>
      </div>

      <BottomTabs />
    </main>
  );
}