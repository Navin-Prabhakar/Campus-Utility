"use client";

import React, { useEffect, useState } from "react";
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
    // --- AUTOMATIC LIVE DAY DETECTION ---
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
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

            const busColumns = [2, 6, 10, 14, 18, 22]; // Core strict columns
            const parsedBuses: BusSchedule[] = [];

            // Robust validation to accept any real clock formatted sequence
            const cleanAndExtractTime = (str: string): string | null => {
              if (!str) return null;
              const match = str.trim().match(/\b\d{1,2}\s*:\s*\d{2}\b/);
              return match ? match[0].replace(/\s+/g, "") : null;
            };

            busColumns.forEach((colIndex, listIdx) => {
              // ==========================================
              // 👤 STEP 1: FIX METADATA FROM STEADY TOP BLOCK
              // ==========================================
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

              // Merged fallback bounds check
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

              // ==========================================
              //  STEP 2: WEEKDAYS SCAN (Rows 19 to 65)
              // ==========================================
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

              // ==========================================
              // ⛺ STEP 3: WEEKENDS UNRESTRICTED GLOBAL RESOLVER
              // ==========================================
              const weekendsSchedule: TimeSlot[] = [];
              
              // Direct index mapping rules based on your precise raw trace metrics
              let weekendTargetCol = -1;
              if (listIdx === 1) weekendTargetCol = 11;  // Bus 02 shifts to Index 11
              if (listIdx === 4) weekendTargetCol = 23;  // Institute Bus 1 shifts to Index 23

              if (weekendTargetCol !== -1) {
                // Poori row 66 se end tak scanning bina range bounding crash ke
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

  if (loading) return <div className="p-6 text-center text-gray-500 font-medium animate-pulse">Syncing live SWB schedule configurations...</div>;
  if (error) return <div className="p-6 text-center text-red-500 font-medium">{error}</div>;

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Campus Utilities</h1>
        
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          {/* Notice header block */}
          <div className="mb-6 p-5 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-900 shadow-xs space-y-2">
            <div className="font-bold text-base flex items-center gap-1.5 mb-1 text-amber-950">⚠️ SWB Notice:</div>
            <p className="leading-relaxed">
              <strong>1.</strong> For any bus related queries, don't hesitate to call admin staff- 
              <span className="font-semibold text-slate-900"> Mantu Ji (8986162721)</span> and Bus Manager BSRTC - 
              <span className="font-semibold text-slate-900"> Rajeev Ji (6201957967)</span>.
            </p>
            <p className="leading-relaxed">
              <strong>2.</strong> When boarding the bus outside campus, keep your ID card handy or you may not be allowed on board.
            </p>
          </div>

          {/* Auto-Detection Status Banner */}
          <div className="mb-6 flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-3 max-w-md mx-auto">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider"> Auto-Selected:</span>
            <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize">
              {activeTab === "weekdays" ? "⚡️ Weekday Schedule" : "⛺️ Weekend Schedule"}
            </span>
          </div>

          {/* Manual Mode Toggle Controls */}
          <div className="flex justify-center gap-4 mb-8 bg-gray-100 p-1.5 rounded-xl max-w-xs mx-auto shadow-inner">
            <button onClick={() => setActiveTab("weekdays")} className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "weekdays" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"}`}>Weekdays</button>
            <button onClick={() => setActiveTab("weekends")} className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${activeTab === "weekends" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"}`}>Weekends</button>
          </div>

          {/* Grid container layout for Bus profiles */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {buses.map((bus, idx) => {
              const activeSchedule = activeTab === "weekdays" ? bus.weekdaysSchedule : bus.weekendsSchedule;

              return (
                <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:border-indigo-400 transition-all">
                  <div className="bg-slate-900 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-base flex items-center gap-2">🚌 {bus.busName}</h3>
                      {bus.busNumber && <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded font-mono font-semibold shadow-xs">{bus.busNumber}</span>}
                    </div>
                    <p className="text-xs text-slate-400 mt-1">👤 {bus.driverInfo}</p>
                    <p className="text-xs text-indigo-400 font-mono mt-0.5">📞 {bus.contact}</p>
                  </div>

                  <div className="p-4 flex-grow overflow-y-auto max-h-80 bg-white">
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs text-gray-400 font-semibold px-2 border-b pb-1">
                        <span>TIME</span>
                        <span>ROUTE DIRECTION</span>
                      </div>
                      {activeSchedule.map((slot, sIdx) => (
                        <div key={sIdx} className="flex justify-between items-center text-xs p-2 bg-gray-50 border border-gray-100 rounded-lg">
                          <span className="font-bold text-indigo-600 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded">{slot.time}</span>
                          <span className="text-gray-700 text-right font-medium max-w-[170px] truncate" title={`${slot.from} ➔ ${slot.to}`}>{slot.from} ➔ {slot.to}</span>
                        </div>
                      ))}
                      {activeSchedule.length === 0 && (
                        <p className="text-gray-400 text-xs text-center py-6 italic">No active trips scheduled for today.</p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </main>
  );
}