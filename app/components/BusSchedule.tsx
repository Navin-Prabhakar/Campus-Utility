"use client";

import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import BusScheduleWeekdays from "./BusScheduleWeekdays";
import BusScheduleWeekends from "./BusScheduleWeekend";

export default function BusScheduleTab() {
  const [rows, setRows] = useState<string[][]>([]);
  const [activeTab, setActiveTab] = useState<"weekdays" | "weekends">("weekdays");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const SHEET_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

  useEffect(() => {
    const currentDay = new Date().getDay(); // 0 = Sunday, 6 = Saturday
    setActiveTab(currentDay === 0 || currentDay === 6 ? "weekends" : "weekdays");

    const fetchBusData = async () => {
      try {
        Papa.parse(SHEET_URL, {
          download: true,
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const data = results.data as string[][];
            if (!data || data.length < 110) {
              setError("Spreadsheet records are incomplete.");
            } else {
              setRows(data);
            }
            setLoading(false);
          },
          error: (err) => {
            console.error(err);
            setError("Failed to fetch Google sheet stream.");
            setLoading(false);
          }
        });
      } catch (err) {
        setError("Error rendering interface matrices.");
        setLoading(false);
      }
    };

    fetchBusData();
  }, []);

  const isStrictTime = (str: string) => {
    if (!str) return false;
    return /\d+:\d+/.test(str.trim());
  };

  if (loading) return <div className="p-8 text-center text-red-500 font-medium animate-pulse">Syncing live SWB schedule configurations...</div>;
  if (error) return <div className="p-6 text-center text-red-500 font-medium">{error}</div>;

  return (
    <div className="p-6 max-w-7xl mx-auto bg-white rounded-2xl">
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

      {/* Auto-Detection Banner */}
      <div className="mb-6 flex justify-between items-center bg-gray-50 border border-gray-200 rounded-xl p-3 max-w-md mx-auto">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">📅 Auto-Selected:</span>
        <span className="text-xs font-bold bg-blue-100 text-blue-700 px-3 py-1 rounded-full capitalize">
          {activeTab === "weekdays" ? "⚡ Weekday Schedule" : "⛺ Weekend Schedule"}
        </span>
      </div>

      {/* Manual Switcher Controls */}
      <div className="flex justify-center gap-4 mb-8 bg-gray-100 p-1.5 rounded-xl max-w-xs mx-auto shadow-inner">
        <button
          onClick={() => setActiveTab("weekdays")}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
            activeTab === "weekdays" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"
          }`}
        >
          Weekdays
        </button>
        <button
          onClick={() => setActiveTab("weekends")}
          className={`flex-1 py-1.5 px-3 rounded-lg font-semibold text-xs transition-all ${
            activeTab === "weekends" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"
          }`}
        >
          Weekends
        </button>
      </div>

      {/* RENDER THE INDEPENDENT COMPONENT SEGMENT BASED ON STATE ACCORDINGLY */}
      {activeTab === "weekdays" ? (
        <BusScheduleWeekdays rows={rows} isStrictTime={isStrictTime} />
      ) : (
        <BusScheduleWeekends rows={rows} isStrictTime={isStrictTime} />
      )}
    </div>
  );
}