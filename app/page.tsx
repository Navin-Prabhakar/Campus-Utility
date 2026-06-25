"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react"; 
import Link from "next/link";
import Papa from "papaparse";
import ReportIssueModal from "./components/ReportIssueModal";

const GOOGLE_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=0";

interface Next4BusItem {
  id: string;
  name: string;
  route: string;
  time: string;
  contact?: string;
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

  //  Universal Search System States
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

              // 📞 Robust Contact Parsing with Next-Row Lookahead Lookups
              let rawContact = "";
              for (let i = 0; i < 40; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();
                
                if (cellLower.includes("contact") || (i === 18 && cellVal !== "" && /\d+/.test(cellVal))) {
                  if (cellLower.replace(/[^a-z]/g, "") === "contact" && rows[i + 1]?.[colIndex]) {
                    rawContact = rows[i + 1][colIndex].trim();
                  } else {
                    rawContact = cellVal;
                  }
                }
              }
              
              let contactDigits = rawContact.replace(/\D/g, "");
              const cleanContact = contactDigits.length >= 10 ? contactDigits.slice(-10) : "";

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
                    contact: cleanContact,
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
    <div 
      className="min-h-screen w-full font-sans text-zinc-300 antialiased flex flex-col items-center justify-between relative selection:bg-zinc-800 selection:text-white"
      style={{
        backgroundImage: `
          radial-gradient(circle at top left, rgba(30 58 138 / 0.6), transparent 50%),
          radial-gradient(circle at top right, rgba(16, 60, 27, 0.8), transparent 50%),
          radial-gradient(circle at bottom left, rgba(18, 41, 18, 0.95), transparent 50%),
          radial-gradient(circle at bottom right, rgba(25, 29, 81, 0.82), transparent 50%)
          `,
        backgroundColor: '#2d162f'
      }}
    >
      
      <Suspense fallback={null}>
        <SearchParamsHandler setShowReportModal={setShowReportModal} />
      </Suspense>

      <div className="w-full flex flex-col items-center">
        {/* 📜 APP WINDOW MIDDLE TRACK CONTAINER */}
        <main className="flex flex-col items-center justify-start py-21 w-[96%] max-w-[350px]">
          <div className="w-full rounded-3xl border border-zinc-500 bg-gradient-to-tr from-purple-900/40 to-zinc-950 p-3 shadow-xl backdrop-blur-xl">
            
            <div className="mb-1.5 flex items-center justify-between border-b border-zinc-600 pb-2 px-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] bg-rose-600/90 text-rose-100 animate-pulse border border-rose-700 font-black px-1.5 py-0.5 rounded-lg uppercase tracking-wider">
                  Live
                </span>
                <h2 className="text-[14px] font-black uppercase tracking-wider text-zinc-200">
                   Upcoming _ Buses
                </h2>
              </div>
              
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              {loading ? (
                [...Array(4)].map((_, i) => (
                  <div key={i} className="h-13 w-full animate-pulse rounded-xl bg-[#121212]/50 border border-zinc-600/80" />
                ))
              ) : error ? (
                <div className="py-4 text-center text-[13px] font-bold text-rose-400 bg-rose-950/10 rounded-xl border border-rose-900/20 uppercase tracking-wide">
                  ⚠️ Connection Error.
                </div>
              ) : upcomingBuses.length === 0 ? (
                <div className="py-4 text-center text-[13px] text-zinc-500 font-medium italic bg-[#121212]/40 rounded-xl border border-dashed border-zinc-900">
                  No active routes found.
                </div>
              ) : (
                upcomingBuses.map((bus) => (
                  <div 
                    key={bus.id} 
                    className="flex items-center justify-between rounded-xl border border-zinc-500 bg-slate-800 px-2 py-2  gap-3"
                  >
                    {/* Left details pane: Bus identification header and routing track text matrices */}
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-[14px] font-black text-white leading-tight">
                        {bus.name}
                      </span>
                      <span className="truncate text-[11px] text-zinc-200 mt-1.5 font-bold tracking-tight">
                        {bus.route}
                      </span>
                    </div>
                    
                    {/* Right action block: Departure runtime parameter matrix layout with call trigger underneath */}
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="font-mono text-[13px] font-extrabold text-yellow-500 bg-amber-200/20 border border-amber-500/20 px-2 py-0.5 rounded-lg shadow-xs leading-none">
                        {bus.time}
                      </span>
                      {bus.contact ? (
                        <a 
                          href={`tel:${bus.contact}`}
                          className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 px-1 py-0.5 rounded border border-emerald-500/40 font-mono tracking-tight transition-all duration-150 flex items-center gap-0.5"
                          title="Call Driver"
                        >
                          🤙 {bus.contact}
                        </a>
                      ) : (
                        <span className="text-[9px] text-zinc-500 font-mono tracking-tight">No Mobile Contact</span>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="mt-3 ">
              <Link 
                href="/bus"
                className="flex w-full items-center justify-center rounded-2xl bg-zinc-700 hover:bg-zinc-800 border border-zinc-400/80 py-2 text-[14px] font-black tracking-wide text-white transition-all transform hover:-translate-y-0.5 active:scale-[0.99] backdrop-blur-xs "
              >
                View Full Schedule
              </Link>
            </div>

          </div>
        </main>
      </div>

      {/* 🚨 FLOATING ROUND RED TRIGGER ISSUE BUTTON */}
      <button
        onClick={() => setShowReportModal(true)}
        className="fixed right-3 bottom-18 h-12 w-12 bg-gradient-to-tl from-red-600 to-purple-700/90 hover:from-violet-700 hover:to-pink-700 text-white flex items-center justify-center rounded-full font-black  active:scale-90 transition-all duration-150 cursor-pointer text-base z-[90] select-none"
        title="Open Report System"
      >
        ⚠️
      </button>

      {/* FOOTER LAYER DEVELOPER SIGN AREA */}
      <div className="w-full flex justify-center py-2 pb-16 shrink-0 z-10 relative select-none">
        <button
          onClick={() => {
            setAccessDeniedMessage("");
            setShowBirthdayPanel(false);
            setBirthdayList([]);
            setShowDevModal(true);
          }}
          className="text-[11px] font-black  tracking-wide text-zinc-400/70 hover:text-white transition-colors cursor-pointer py-1.5 px-4 rounded-xl hover:bg-white/5"
        >
          Developer Info...
        </button>
      </div>

      {/* DEVELOPER MODAL INTERFACE DRAWER */}
      {showDevModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-[#0A0A0A] rounded-2xl p-5 w-full max-w-[280px] shadow-2xl border border-zinc-900 flex flex-col items-center relative transform overflow-hidden">
            
            {accessDeniedMessage && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[92%] z-50 rounded-xl bg-rose-950 border border-rose-500 text-center text-[10px] font-black uppercase tracking-wider text-rose-200 px-2.5 py-2 shadow-2xl animate-pulse">
                ⚠️ {accessDeniedMessage}
              </div>
            )}

            <button 
              onClick={() => setShowDevModal(false)}
              className="absolute top-3 right-4 text-zinc-500 hover:text-white text-xs font-black transition-colors cursor-pointer z-40"
              aria-label="Close layout panel"
            >
              ✕
            </button>

            <button
              onClick={handleBirthdayClick}
              className={`mb-3 flex h-8 w-8 items-center justify-center rounded-xl text-sm border transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer select-none ${
                showBirthdayPanel ? 'bg-rose-950 border-rose-500 text-white' : 'bg-[#161616] border-zinc-800 text-white'
              }`}
              title="Toggle Student Finder"
            >
              🎂
            </button>

            <div className="w-44 h-48 relative rounded-2xl overflow-hidden bg-zinc-900 mb-3 border border-zinc-800/80 shadow-inner">
              <img 
                src="/dev-avatar.jpg" 
                alt="Developer's Profile"
                className="w-full h-full object-cover grayscale opacity-80"
              />
            </div>

            <h3 className="text-sm font-black text-zinc-100 tracking-wide mb-0">~Prabhakar</h3>
            <p className="text-[9px] text-zinc-500 font-mono font-black uppercase tracking-widest mb-3.5">2503AI02</p>

            <div className="w-full border-t border-zinc-900" />

            <div className="flex items-center gap-4 mt-3 mb-1 select-none">
              <a 
                href="https://github.com/Navin-Prabhakar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-[#161616] hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800/60 rounded-xl transition-all shadow-md active:scale-90"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>

              <a 
                href="https://www.linkedin.com/in/navin-prabhakar-5b5070388/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-[#161616] hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800/60 rounded-xl transition-all shadow-md active:scale-90"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              <a 
                href="https://instagram.com/prabhakar_2201" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-[#161616] hover:bg-zinc-900 text-zinc-500 hover:text-white border border-zinc-800/60 rounded-xl transition-all shadow-md active:scale-90"
              >
                <svg className="h-4 w-4 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>

            {/* HIDDEN INJECTED ADMIN TERMINAL LAYOUT PANEL */}
            {showBirthdayPanel && isDeveloper && (
              <div className="mt-4 w-full rounded-xl bg-black p-3 border border-zinc-800 text-left animate-in fade-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between border-b border-zinc-900 pb-2 mb-2.5">
                  <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-400">🔍 Student DB Terminal</h4>
                </div>

                <div className="flex gap-1.5 mb-2.5">
                  <input
                    type="text"
                    placeholder="Search query params..."
                    id="universalSearchInput"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        executeSearchQuery((e.target as HTMLInputElement).value);
                      }
                    }}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-lg px-2 py-1.5 text-[10px] text-white placeholder-zinc-600 font-medium outline-hidden focus:border-zinc-700 shadow-inner"
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById("universalSearchInput") as HTMLInputElement;
                      executeSearchQuery(inputEl?.value || "");
                    }}
                    className="bg-[#2A2A2A] hover:bg-[#333333] border border-zinc-700 text-[10px] px-3 rounded-lg font-black text-white transition active:scale-95 cursor-pointer"
                  >
                    {fetchingBirthdays ? "⏳" : "Go"}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto style-scrollbar">
                  {birthdayList.length === 0 ? (
                    <p className="text-[9px] text-zinc-600 text-center py-4 font-medium italic">
                      {fetchingBirthdays ? "Querying isolated table matrices..." : "Awaiting parameter inputs..."}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {birthdayList.map((student: any, idx: number) => (
                        <li key={idx} className="flex flex-col rounded-xl bg-[#121212]/80 p-2 border border-zinc-900 text-[10px]">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-black text-zinc-200 truncate">{student.name}</span>
                            <span className="text-[9px] font-mono font-black text-amber-500 shrink-0 bg-amber-500/5 border border-amber-500/10 px-1 rounded">{student.birthday}</span>
                          </div>
                          <div className="flex justify-between items-center text-[8px] font-mono font-bold text-zinc-500 uppercase mt-1 pt-1 border-t border-zinc-900/40">
                            <span>{student.roll}</span>
                            <span className="text-zinc-400 font-sans normal-case font-black">{student.gender}</span>
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
      
      <ReportIssueModal 
        isOpen={showReportModal} 
        onClose={() => setShowReportModal(false)} 
      />

      {/* Internal Custom Micro-Scrollbars */}
      <style jsx global>{`
        .style-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .style-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .style-scrollbar::-webkit-scrollbar-thumb {
          background: #108b22;
          border-radius: 20px;
        }
        .style-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333333;
        }
      `}</style>
    </div>
  );
}