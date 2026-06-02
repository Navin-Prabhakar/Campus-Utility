"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Papa from "papaparse";
import BottomTabs from "./components/BottomTabs";
import Header from "./components/Header";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

interface Next4BusItem {
  id: string;
  name: string;
  route: string;
  time: string;
}

export default function Home() {
  const [upcomingBuses, setUpcomingBuses] = useState<Next4BusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function getNextFourBuses() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) throw new Error("Network response failed");
        
        const csvText = await response.text();

        Papa.parse(csvText, {
          download: false,
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const rows = results.data as string[][];

            if (!rows || rows.length < 110) {
              setError(true);
              setLoading(false);
              return;
            }

            const busColumns = [2, 6, 10, 14, 18, 22];
            const nameRowIdx = 16;
            
            const currentDay = new Date().getDay(); 
            const isWeekend = currentDay === 0 || currentDay === 6;
            
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const isStrictTime = (str: string) => {
              if (!str) return false;
              return /\d+:\d+/.test(str.trim());
            };

            const parseTimeToMinutes = (timeString: string) => {
              const cleaned = timeString.trim();
              const match = cleaned.match(/(\d{1,2})\s*:\s*(\d{2})/);
              if (!match) return 0;
              const hours = parseInt(match[1], 10);
              const minutes = parseInt(match[2], 10);
              return hours * 60 + minutes;
            };

            const allParsedBusesCollector: Next4BusItem[] = [];

            busColumns.forEach((colIndex) => {
              let rawBusName = rows[nameRowIdx]?.[colIndex]?.trim() || "";
              if (!rawBusName && colIndex > 0) {
                rawBusName = rows[nameRowIdx]?.[colIndex - 1]?.trim() || rows[nameRowIdx]?.[colIndex - 2]?.trim() || "";
              }

              if (!rawBusName || rawBusName.toLowerCase().includes("contact") || rawBusName.toLowerCase().includes("driver")) {
                if (colIndex === 2) rawBusName = "Bus 01";
                else if (colIndex === 6) rawBusName = "Bus 02";
                else if (colIndex === 10) rawBusName = "Bus 03";
                else if (colIndex === 14) rawBusName = "Bus 04";
                else if (colIndex === 18) rawBusName = "Institute Bus 1";
                else if (colIndex === 22) rawBusName = "Institute Bus 2";
                else rawBusName = "Campus Bus";
              }

              let busName = rawBusName;
              if (busName.includes("-")) {
                busName = busName.split("-")[0].trim();
              }

              const startRow = isWeekend ? 68 : 19;
              const endRow = isWeekend ? 110 : 65;

              for (let i = startRow; i <= endRow; i++) {
                const time = rows[i]?.[colIndex]?.trim() || "";
                if (isStrictTime(time)) {
                  const from = rows[i]?.[colIndex + 1]?.trim() || "Campus";
                  const to = rows[i]?.[colIndex + 2]?.trim() || "Campus";

                  allParsedBusesCollector.push({
                    id: `${isWeekend ? "wknd" : "wkdy"}-${colIndex}-${i}`,
                    name: busName,
                    route: `${from} ➔ ${to}`,
                    time,
                  });
                }
              }
            });

            const liveFilteredBuses = allParsedBusesCollector
              .filter((bus) => parseTimeToMinutes(bus.time) >= currentMinutes)
              .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
              .slice(0, 4);

            if (liveFilteredBuses.length === 0 && allParsedBusesCollector.length > 0) {
              const staticTopFour = allParsedBusesCollector
                .sort((a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time))
                .slice(0, 4);
              setUpcomingBuses(staticTopFour);
            } else {
              setUpcomingBuses(liveFilteredBuses);
            }

            setLoading(false);
          },
          error: () => {
            setError(true);
            setLoading(false);
          }
        });

      } catch (err) {
        setError(true);
        setLoading(false);
      }
    }

    getNextFourBuses();
  }, []);

  return (
    <div className="min-h-screen w-full bg-zinc-100 font-sans text-zinc-600 antialiased flex flex-col items-center">
      <Header />

      {/* 🛠️ FORCE PACKAGING: Enforces exact width reduction safely on global styles */}
      <main className="flex flex-col items-center justify-start py-2 pb-20 w-[92%] max-w-[350px]">
        
        {/* Main Dashboard Widget Card */}
        <div className="w-full rounded-xl border border-zinc-300 bg-white p-2 shadow-xs">
          
          {/* Header Bar */}
          <div className="mb-1.5 flex items-center justify-between border-b border-zinc-500 pb-1 px-1">
            <div className="flex items-center gap-1">
              <span className={`h-1 w-1 rounded-full ${error ? 'bg-red-500' : 'bg-emerald-500 animate-pulse'}`} />
              <h2 className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                Next 4 Upcoming Buses
              </h2>
            </div>
            <span className="text-[9px] bg-red-600 font-medium  px-1.5 py-0.2 rounded text-zinc-100">
              <b>• Live</b>
            </span>
          </div>

          {/* 🛠️ ULTRA DENSE COMPRESSION: gap-1 reduces spacing to a tiny tight line */}
          <div className="flex flex-col gap-1 w-full">
            {loading ? (
              [...Array(4)].map((_, i) => (
                <div key={i} className="h-10 w-full animate-pulse rounded-md bg-zinc-200" />
              ))
            ) : error ? (
              <div className="py-4 text-center text-[11px] text-red-500 bg-red-50/50 rounded-md px-2 border border-red-100">
                ⚠️ Connection Error.
              </div>
            ) : upcomingBuses.length === 0 ? (
              <div className="py-4 text-center text-[11px] text-zinc-400">
                No active routes found.
              </div>
            ) : (
              upcomingBuses.map((bus) => (
                /* 🛠️ MINIMAL CARD INTERFACE: Tightened vertical layout to absolute minimum padding */
                <div 
                  key={bus.id} 
                  className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-200/30 px-2 py-1.5 transition-colors"
                >
                  <div className="flex flex-col min-w-0 pr-1.5">
                    <span className="truncate text-[11px] font-bold text-zinc-800 leading-tight">
                      🚌 {bus.name}
                    </span>
                    <span className="truncate text-[9px] text-zinc-400 mt-0.5 font-medium leading-none">
                      {bus.route}
                    </span>
                  </div>
                  {/* Slimmed timeline text badge padding layout element */}
                  <span className="shrink-0 font-mono text-[11px] font-bold text-indigo-600 bg-indigo-100 border border-indigo-100 px-1 py-0.5 rounded">
                    {bus.time}
                  </span>
                </div>
              ))
            )}
          </div>

          {/* View Full Schedule Slim Action Control */}
          <div className="mt-1.5 px-0.5">
            <Link 
              href="/bus"
              className="flex w-full items-center justify-center rounded-md bg-zinc-800 py-1.5 text-[11px] font-medium text-white transition-colors hover:bg-zinc-900"
            >
              View Full Schedule
            </Link>
          </div>

        </div>
      </main>

      <BottomTabs />
    </div>
  );
}