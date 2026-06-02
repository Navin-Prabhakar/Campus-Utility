"use client";

import React from "react";

interface TimeSlot {
  time: string;
  from: string;
  to: string;
}

interface BusScheduleWeekdaysProps {
  rows: string[][];
  isStrictTime: (str: string) => boolean;
}

export default function BusScheduleWeekdays({ rows, isStrictTime }: BusScheduleWeekdaysProps) {
  const busColumns = [2, 6, 10, 14, 18, 22];
  const nameRowIdx = 16;
  const driverRowIdx = 17;
  const contactRowIdx = 18;

  return (
    /* 🛠️ UI CHANGE: Reduced grid gaps from gap-6 to gap-3 for mobile optimization */
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 w-full">
      {busColumns.map((colIndex, idx) => {
        let rawBusName = rows[nameRowIdx]?.[colIndex]?.trim() || "";
        let rawDriver = rows[driverRowIdx]?.[colIndex]?.trim() || "Staff Assigned";
        let rawContact = rows[contactRowIdx]?.[colIndex]?.trim() || "";

        if (!rawBusName && colIndex > 0) {
          rawBusName = rows[nameRowIdx]?.[colIndex - 1]?.trim() || rows[nameRowIdx]?.[colIndex - 2]?.trim() || "";
        }
        if (!rawBusName) {
          rawBusName = colIndex === 18 ? "Institute Bus 1" : colIndex === 22 ? "Institute Bus 2" : "Bus Module";
        }

        let busName = rawBusName;
        let busNumber = "";
        if (busName.includes("-")) {
          const parts = busName.split("-");
          busName = parts[0].trim();
          busNumber = parts[1]?.replace(/[()]/g, "").trim() || "";
        }

        let contact = "N/A";
        const cleanDigits = rawContact.replace(/\D/g, "");
        if (cleanDigits.length >= 10) contact = cleanDigits.slice(-10);

        const driverInfo = rawDriver.replace(/Driver\s*-\s*/i, "").replace(/Conductor\s*-\s*/i, "").trim();

        // Extract Weekdays strictly (19 to 65) - LEFT UNTOUCHED AS REQUESTED
        const schedule: TimeSlot[] = [];
        for (let i = 19; i <= 65; i++) {
          const time = rows[i]?.[colIndex]?.trim() || "";
          if (isStrictTime(time)) {
            schedule.push({
              time,
              from: rows[i]?.[colIndex + 1]?.trim() || "Campus",
              to: rows[i]?.[colIndex + 2]?.trim() || "Campus",
            });
          }
        }

        return (
          /* 🛠️ UI CHANGE: Rounded corners updated to rounded-xl and matching background border color theme */
          <div key={idx} className="bg-white border border-zinc-200 rounded-xl shadow-xs overflow-hidden flex flex-col hover:border-zinc-400 transition-all">
            
            {/* Header section: Made tight with smaller spacing & fonts */}
            <div className="bg-zinc-900 px-3 py-2 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-sm tracking-tight">🚌 {busName}</h3>
                {busNumber && (
                  <span className="text-[9px] bg-indigo-600 text-white px-1.5 py-0.2 rounded font-mono font-semibold">
                    {busNumber}
                  </span>
                )}
              </div>
              <div className="flex items-center justify-between mt-0.5 text-[10px] text-zinc-400 font-medium">
                <span className="truncate max-w-[130px]">尊 {driverInfo}</span>
                <span className="font-mono text-zinc-300">📞 {contact}</span>
              </div>
            </div>

            {/* Timetable Slot Lists Container */}
            <div className="p-2 flex-grow overflow-y-auto max-h-64 bg-white">
              <div className="space-y-1">
                {/* Slim Headings Indicator */}
                <div className="flex justify-between text-[9px] text-zinc-400 font-bold uppercase tracking-wider px-1 pb-1 border-b border-zinc-100">
                  <span>TIME</span>
                  <span>ROUTE DIRECTION</span>
                </div>

                {schedule.map((slot, sIdx) => (
                  /* 🛠️ UI CHANGE: Ultra compact vertical spacing (py-1) and cleaner text styling */
                  <div key={sIdx} className="flex justify-between items-center text-[11px] px-2 py-1 bg-zinc-50 border border-zinc-100/60 rounded-md">
                    <span className="font-bold text-indigo-600 shrink-0 bg-indigo-50 border border-indigo-100/50 px-1 py-0.2 rounded font-mono">
                      {slot.time}
                    </span>
                    <span className="text-zinc-700 text-right font-semibold max-w-[160px] truncate" title={`${slot.from} ➔ ${slot.to}`}>
                      {slot.from} ➔ {slot.to}
                    </span>
                  </div>
                ))}
                
                {schedule.length === 0 && (
                  <p className="text-zinc-400 text-[11px] text-center py-4 italic">No active weekday trips listed.</p>
                )}
              </div>
            </div>

          </div>
        );
      })}
    </div>
  );
}