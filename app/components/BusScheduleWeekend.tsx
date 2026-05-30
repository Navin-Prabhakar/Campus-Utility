"use client";

import React from "react";

interface TimeSlot {
  time: string;
  from: string;
  to: string;
}

interface BusScheduleWeekendsProps {
  rows: string[][];
  isStrictTime: (str: string) => boolean;
}

export default function BusScheduleWeekends({ rows, isStrictTime }: BusScheduleWeekendsProps) {
  const busColumns = [2, 6, 10, 14, 18, 22];
  const nameRowIdx = 16;
  const driverRowIdx = 17;
  const contactRowIdx = 18;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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

        // Extract Weekends strictly from 68 to 110
        const schedule: TimeSlot[] = [];
        for (let i = 68; i <= 110; i++) {
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
          <div key={idx} className="bg-gray-50 border border-gray-200 rounded-2xl shadow-xs overflow-hidden flex flex-col hover:border-indigo-400 transition-all">
            <div className="bg-slate-900 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-base">🚌 {busName}</h3>
                {busNumber && <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-mono font-semibold">{busNumber}</span>}
              </div>
              <p className="text-xs text-slate-400 mt-1">👤 {driverInfo}</p>
              <p className="text-xs text-indigo-400 font-mono mt-0.5">📞 {contact}</p>
            </div>
            <div className="p-4 flex-grow overflow-y-auto max-h-80 bg-white">
              <div className="space-y-2">
                <div className="flex justify-between text-xs text-gray-400 font-semibold px-2 border-b pb-1">
                  <span>TIME</span>
                  <span>ROUTE DIRECTION</span>
                </div>
                {schedule.map((slot, sIdx) => (
                  <div key={sIdx} className="flex justify-between items-center text-xs p-2 bg-gray-50 border border-gray-100 rounded-lg">
                    <span className="font-bold text-indigo-600 shrink-0 bg-indigo-50 px-1.5 py-0.5 rounded">{slot.time}</span>
                    <span className="text-gray-700 text-right font-medium max-w-[170px] truncate">{slot.from} ➔ {slot.to}</span>
                  </div>
                ))}
                {schedule.length === 0 && (
                  <p className="text-gray-400 text-xs text-center py-6 italic">No active weekend trips listed.</p>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}