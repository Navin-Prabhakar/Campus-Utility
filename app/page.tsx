"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react"; 
import Link from "next/link";
import Papa from "papaparse";
import BottomTabs from "./components/BottomTabs";
import Header from "./components/Header";
import ReportIssueModal from "./components/ReportIssueModal";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

interface Next4BusItem {
  id: string;
  name: string;
  route: string;
  time: string;
}

function SearchParamsHandler({ setShowReportModal }: { setShowReportModal: (val: boolean) => void }) {
  const searchParams = useSearchParams();
  
  useEffect(() => {
    if (searchParams.get("openReport") === "true") {
      setShowReportModal(true);
    }
  }, [searchParams, setShowReportModal]);

  return null;
}

export default function Home() {
  const { data: realSession } = useSession(); 
  const [upcomingBuses, setUpcomingBuses] = useState<Next4BusItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  const [showDevModal, setShowDevModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false); 

  // 🎂 Universal Search System States
  const [showBirthdayPanel, setShowBirthdayPanel] = useState(false);
  const [birthdayList, setBirthdayList] = useState([]);
  const [fetchingBirthdays, setFetchingBirthdays] = useState(false);
  const [accessDeniedMessage, setAccessDeniedMessage] = useState("");

  const ALLOWED_DEVELOPERS = ["navin_2503ai02@iitp.ac.in"];

  const isLocalhost = typeof window !== "undefined" && window.location.hostname === "localhost";
  const isDeveloper = isLocalhost || (realSession?.user?.email && ALLOWED_DEVELOPERS.includes(realSession.user.email));

  const handleBirthdayClick = () => {
    setAccessDeniedMessage("");

    if (!isDeveloper) {
      setAccessDeniedMessage("Birthday viewer is accessible to only developer.");
      setTimeout(() => setAccessDeniedMessage(""), 3500);
      return;
    }

    if (showBirthdayPanel) {
      setShowBirthdayPanel(false);
      setBirthdayList([]); 
    } else {
      setShowBirthdayPanel(true);
    }
  };

  const executeSearchQuery = async (queryVal: string) => {
    setFetchingBirthdays(true);
    try {
      const res = await fetch(`/api/admin/birthdays?query=${encodeURIComponent(queryVal)}`);
      const data = await res.json();
      if (res.ok && data.success) {
        setBirthdayList(data.filteredResults);
      } else {
        setAccessDeniedMessage(data.error || "Failed to process search payload.");
        setTimeout(() => setAccessDeniedMessage(""), 3500);
      }
    } catch (err) {
      console.error(err);
      setAccessDeniedMessage("Connection timeout targeting database container.");
      setTimeout(() => setAccessDeniedMessage(""), 3500);
    } finally {
      setFetchingBirthdays(false);
    }
  };

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
              return /\d{1,2}\s*:\s*\d{2}/.test(str.trim());
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

            busColumns.forEach((colIndex, listIdx) => {
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

              let targetCol = colIndex;
              if (isWeekend) {
                if (listIdx === 1) targetCol = 11;
                else if (listIdx === 4) targetCol = 23;
                else return; 
              }

              const startRow = isWeekend ? 66 : 19;
              const endRow = isWeekend ? rows.length : 65;

              for (let i = startRow; i < endRow; i++) {
                const timeCell = rows[i]?.[targetCol]?.trim() || "";
                
                if (timeCell.toLowerCase().includes("note")) {
                  break;
                }

                if (isStrictTime(timeCell)) {
                  const cleanTime = timeCell.replace(/\s+/g, "");
                  
                  let from = rows[i]?.[targetCol + 1]?.trim() || "";
                  let to = rows[i]?.[targetCol + 2]?.trim() || "";
                  
                  if (!from || from === "" || from.toLowerCase().includes("route")) from = "Campus";
                  if (!to || to === "" || to.toLowerCase().includes("route")) to = "Campus";

                  allParsedBusesCollector.push({
                    id: `${isWeekend ? "wknd" : "wkdy"}-${targetCol}-${i}`,
                    name: busName,
                    route: `${from} ➔ ${to}`,
                    time: cleanTime,
                  });
                }
              }
            });

            const upcomingOnly = allParsedBusesCollector.filter(bus => {
              return parseTimeToMinutes(bus.time) >= currentMinutes;
            });

            const sortedBuses = upcomingOnly.sort((a, b) => {
              return parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time);
            });

            if (sortedBuses.length === 0) {
              const earlyMorningBuses = allParsedBusesCollector.sort(
                (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
              );
              setUpcomingBuses(earlyMorningBuses.slice(0, 4));
            } else {
              setUpcomingBuses(sortedBuses.slice(0, 4));
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
    <div className="min-h-screen w-full bg-zinc-100 font-sans text-zinc-600 antialiased flex flex-col items-center justify-between relative">
      
      <Suspense fallback={null}>
        <SearchParamsHandler setShowReportModal={setShowReportModal} />
      </Suspense>

      <div className="w-full flex flex-col items-center">
        <Header />

        <main className="flex flex-col items-center justify-start py-2 w-[92%] max-w-[350px]">
          <div className="w-full rounded-xl border border-zinc-300 bg-white p-2 shadow-xs">
            
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

      {/* 🔴 FLOATING ROUND RED TRIGGER BUTTON */}
      <button
        onClick={() => setShowReportModal(true)}
        className="fixed right-6 bottom-24 h-12 w-12 bg-red-600 border border-red-700 text-white flex items-center justify-center rounded-full font-black shadow-2xl hover:bg-red-700 active:scale-90 transition-all duration-150 cursor-pointer text-lg z-[90]"
        title="Open Report System"
      >
        ⚠️
      </button>

      {/* FOOTER LAYER AREA */}
      <div className="w-full flex justify-center py-2 pb-24 shrink-0 z-10 relative">
        <button
          onClick={() => {
            setAccessDeniedMessage("");
            setShowBirthdayPanel(false);
            setBirthdayList([]);
            setShowDevModal(true);
          }}
          className="text-[11px] font-bold text-zinc-400 hover:text-zinc-700 transition-colors tracking-wide cursor-pointer py-1 px-3 rounded-md"
        >
          Developer Info...
        </button>
      </div>

      {showDevModal && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-md flex items-center justify-center p-4 z-[100] transition-all duration-200">
          
          <div className="bg-slate-900 rounded-2xl p-5 w-full max-w-[260px] shadow-2xl border border-yellow-500 flex flex-col items-center relative transform scale-100 overflow-hidden">
            
            {accessDeniedMessage && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[90%] z-50 rounded-lg bg-red-600 px-2 py-1.5 text-center text-[10px] font-bold text-white shadow-lg border border-red-500 animate-pulse">
                ⚠️ {accessDeniedMessage}
              </div>
            )}

            <button 
              onClick={() => setShowDevModal(false)}
              className="absolute top-1.5 right-2 text-red-500 hover:text-red-700 text-m font-bold cursor-pointer z-40"
              aria-label="Close layout panel"
            >
              ✕
            </button>

            <button
              onClick={handleBirthdayClick}
              className={`mb-2 flex h-8 w-8 items-center justify-center rounded-full text-sm border shadow-md transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer ${
                showBirthdayPanel ? 'bg-pink-600 border-pink-500 text-white' : 'bg-slate-800 border-slate-700 text-white'
              }`}
              title="Toggle Student Finder"
            >
              🎂
            </button>

            <div className="w-44 h-48 relative rounded-2xl overflow-hidden bg-zinc-100 mb-3 border border-indigo-900 shadow-inner">
              <img 
                src="/dev-avatar.jpg" 
                alt="Developer's Profile"
                className="w-full h-full object-cover"
              />
            </div>

            <h3 className="text-sm font-bold text-white tracking-wide mb-0">~Prabhakar</h3>
            <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider mb-3">2503AI02</p>

            <div className="w-full border-t border-zinc-100/60" />

            <div className="flex items-center gap-4 mt-2 mb-1">
              <a 
                href="https://github.com/Navin-Prabhakar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-200 hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-200 rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>

              <a 
                href="https://www.linkedin.com/in/navin-prabhakar-5b5070388/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-200 hover:bg-blue-800 text-zinc-500 hover:text-white rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              <a 
                href="https://instagram.com/prabhakar_2201" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-100 hover:bg-pink-600  text-zinc-500 hover:text-white rounded-xl transition-all shadow-xs"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>

            {showBirthdayPanel && isDeveloper && (
              <div className="mt-3 w-full rounded-xl bg-slate-950 p-3 border border-pink-500/30 text-left">
                
                <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-2">
                  <h4 className="text-[10px] font-bold uppercase tracking-wider text-pink-400">🔍 Universal Student Finder</h4>
                </div>

                <div className="flex gap-1.5 mb-2">
                  <input
                    type="text"
                    placeholder="Search name, roll, or date (DD-MM)..."
                    id="universalSearchInput"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        executeSearchQuery((e.target as HTMLInputElement).value);
                      }
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[10px] text-white placeholder-slate-500 focus:outline-none focus:border-pink-500/50"
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById("universalSearchInput") as HTMLInputElement;
                      executeSearchQuery(inputEl?.value || "");
                    }}
                    className="bg-pink-600 hover:bg-pink-700 active:scale-95 text-[10px] px-2.5 rounded font-bold text-white transition cursor-pointer"
                  >
                    {fetchingBirthdays ? "⏳" : "Go"}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto custom-scrollbar">
                  {birthdayList.length === 0 ? (
                    <p className="text-[9px] text-zinc-500 text-center py-3">
                      {fetchingBirthdays ? "Querying secure storage database stream..." : "Type parameters and press Enter to match records."}
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {birthdayList.map((student: any, idx: number) => (
                        <li key={idx} className="flex flex-col rounded bg-slate-900/80 p-1.5 border border-slate-800/60 text-[10px]">
                          <div className="flex justify-between items-start">
                            <span className="font-semibold text-zinc-200 truncate max-w-[70%]">{student.name}</span>
                            <span className="text-[9px] font-bold text-pink-400 shrink-0 font-mono">{student.birthday}</span>
                          </div>
                          <div className="flex justify-between items-center text-[8px] text-zinc-500 font-mono uppercase mt-0.5">
                            <span>{student.roll}</span>
                            <span className="text-zinc-400 font-sans tracking-normal font-medium">{student.gender}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

              </div>
            )}

          </div>
        </div>
      )}

      <BottomTabs />
      
      <ReportIssueModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />
    </div>
  );
}