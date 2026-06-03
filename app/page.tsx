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
  
  // Controls the visibility of the developer info modal
  const [showDevModal, setShowDevModal] = useState(false);

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

            // 🛠️ FIX LOGIC HERE: Sort strictly by time sequence relative to right now 
            const sortedBuses = allParsedBusesCollector.sort((a, b) => {
              const timeA = parseTimeToMinutes(a.time);
              const timeB = parseTimeToMinutes(b.time);

              // Check if the bus time has already passed today
              const hasPassedA = timeA < currentMinutes;
              const hasPassedB = timeB < currentMinutes;

              // If one has passed and the other hasn't, prioritize the upcoming one
              if (hasPassedA !== hasPassedB) {
                return hasPassedA ? 1 : -1;
              }

              // Otherwise, sort chronically by standard timestamp minutes
              return timeA - timeB;
            });

            // Pick the top 4 remaining chronologically
            setUpcomingBuses(sortedBuses.slice(0, 4));
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
    <div className="min-h-screen w-full bg-zinc-100 font-sans text-zinc-600 antialiased flex flex-col items-center justify-between relative">
      
      {/* Upper Layout Section to group Header and Main Content */}
      <div className="w-full flex flex-col items-center">
        <Header />

        {/* FORCE PACKAGING */}
        <main className="flex flex-col items-center justify-start py-2 w-[92%] max-w-[350px]">
          
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
              <span className="text-[9px] bg-red-600 font-medium px-1.5 py-0.2 rounded text-zinc-100">
                <b>• Live</b>
              </span>
            </div>

            {/* ULTRA DENSE COMPRESSION */}
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
      </div>

      {/* Interactive Text Button positioned cleanly right above BottomTabs */}
      <div className="w-full flex justify-center py-2 pb-15 shrink-0 z-40">
        <button
          onClick={() => setShowDevModal(true)}
          className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors tracking-wide cursor-pointer py-1 px-3 rounded-md"
        >
          Developer Info...
        </button>
      </div>

      {/* Backdrop-blurred floating profile panel */}
     {showDevModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-all duration-200">
          
          {/* Rectangular Profile Container Card */}
          <div className="bg-slate-900 rounded-2xl p-5 w-full max-w-[250px] shadow-2xl border border-yellow-500 flex flex-col items-center relative transform scale-100">
            
            {/* Close "✕" Trigger Button */}
            <button 
              onClick={() => setShowDevModal(false)}
              className="absolute top-1.5 right-2 text-red-500 hover:text-red-700 text-m font-bold cursor-pointer"
              aria-label="Close layout panel"
            >
              ✕
            </button>

            {/* Square/Rectangular Profile Picture Container */}
            <div className="w-48 h-52 relative rounded-2xl overflow-hidden bg-zinc-100 mb-3 border border-indigo-900 shadow-inner">
              <img 
                src="/dev-avatar.jpg" 
                alt="Developer's Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-sm font-bold text-white tracking-wide mb-0">~Prabhakar</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-3">2503AI02</p>

            <div className="w-full border-t border-zinc-100/60" />

            {/* Social Profile Media Links (GitHub, LinkedIn, Instagram) */}
            <div className="flex items-center gap-4 mt-2">
              {/* GitHub Link */}
              <a 
                href="https://github.com/Navin-Prabhakar" // ⚠️ Paste your actual link here
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-200 hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-200 rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>

              {/* LinkedIn Link */}
              <a 
                href="https://www.linkedin.com/in/navin-prabhakar-5b5070388/?lipi=urn%3Ali%3Apage%3Ad_flagship3_profile_view_base_contact_details%3B1sSAnfJ0TQ220Ak%2BxuQa8g%3D%3D" // ⚠️ Paste your actual link here
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-200 hover:bg-blue-800 text-zinc-500 hover:text-white rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              {/* Instagram Link */}
              <a 
                href="https://instagram.com/prabhakar_2201" // ⚠️ Paste your actual link here
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-100 hover:bg-pink-600  text-zinc-500 hover:text-white rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>

          </div>
        </div>
      )}

      <BottomTabs />
    </div>
  );
}