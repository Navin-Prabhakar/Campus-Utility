"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Papa from "papaparse";
import { parseStudentEmail } from "../../utils/rollParser";

const GIDS = {
  UNIVERSAL: "0",
  FRESHERS: "621207693",
  SOPHOMORES: "2119507775",
  JUNIORS: "1930386959",
  SENIORS: "1844437553",
};

interface NoticeItem {
  date: string;
  title: string;
  description: string;
  targetBranch: string;
  author: string;
  phone: string;
  timestamp: number; 
}

interface NotificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function NotificationModal({ isOpen, onClose }: NotificationModalProps) {
  const { data: session } = useSession();
  const [notices, setNotices] = useState<NoticeItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // 🎬 NEW: States to orchestrate DOM mounting and visual animation timing
  const [shouldRender, setShouldRender] = useState(isOpen);
  const [animate, setAnimate] = useState(false);

  const normalizeYear = (yearStr: string): number => {
    let year = parseInt(yearStr, 10);
    if (yearStr.length === 2) {
      year += 2000;
    }
    return year;
  };

  const getTimestampFromDDMMYYYY = (dateStr: string): number => {
    if (!dateStr) return 0;
    const parts = dateStr.trim().replace(/-/g, "/").split("/");
    if (parts.length === 3) {
      const day = parseInt(parts[0], 10);
      const month = parseInt(parts[1], 10) - 1; 
      const year = normalizeYear(parts[2].trim());
      const parsedDate = new Date(year, month, day);
      return parsedDate.getTime() || 0;
    }
    return Date.parse(dateStr) || 0;
  };

  // 🎬 NEW: Effect handler to schedule exit and entry animations gracefully
  useEffect(() => {
    if (isOpen) {
      setShouldRender(true);
      // Small timeout to allow DOM mounting before trigger classes toggle
      const timer = setTimeout(() => setAnimate(true), 10);
      return () => clearTimeout(timer);
    } else {
      setAnimate(false);
      // Wait exactly 300ms (matching duration-300 below) before unmounting completely
      const timer = setTimeout(() => setShouldRender(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;

    localStorage.setItem("iitp_last_viewed_notices", Date.now().toString());

    async function fetchAndFilterNotices() {
      setLoading(true);
      try {
        const profile = parseStudentEmail(session?.user?.email);
        const baseUrl = "https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/export?format=csv&gid=";
        
        const urlsToFetch = [
          { url: `${baseUrl}${GIDS.UNIVERSAL}`, type: "universal" }
        ];

        if (profile.yearGroup === "Freshers") urlsToFetch.push({ url: `${baseUrl}${GIDS.FRESHERS}`, type: "freshers" });
        if (profile.yearGroup === "Sophomores") urlsToFetch.push({ url: `${baseUrl}${GIDS.SOPHOMORES}`, type: "batch" });
        if (profile.yearGroup === "Juniors") urlsToFetch.push({ url: `${baseUrl}${GIDS.JUNIORS}`, type: "batch" });
        if (profile.yearGroup === "Seniors") urlsToFetch.push({ url: `${baseUrl}${GIDS.SENIORS}`, type: "batch" });

        let combinedNotices: NoticeItem[] = [];

        await Promise.all(
          urlsToFetch.map(async ({ url, type }) => {
            try {
              const res = await fetch(url);
              const rawText = await res.text();
              
              const lines = rawText.split("\n");
              const cleanCsvText = lines.slice(1).join("\n");

              return new Promise<void>((resolve) => {
                Papa.parse(cleanCsvText, {
                  header: true,
                  skipEmptyLines: true,
                  complete: (results) => {
                    const rows = results.data as any[];
                    
                    rows.forEach((row) => {
                      const title = (row["Title"] || row["Tittle"] || row["tittle"] || row["title"] || "").trim();
                      const description = (row["Description"] || row["description"] || "").trim();
                      const date = (row["Date (dd/mm/yyyy)"] || row["Date"] || row["date"] || "").trim();
                      const author = (row["Author"] || row["author"] || "Admin").trim();
                      const phone = (row["Phone No."] || row["phone"] || row["Phone"] || "").trim();
                      
                      if (!title && !description) return;

                      const targetBranchText = (
                        row["Target Branch"] || 
                        row["Target Audience"] || 
                        row["target audience"] || 
                        ""
                      ).trim().toUpperCase();
                      
                      const isUniversal = type === "universal";
                      const isFresherOverride = type === "freshers";
                      
                      const userYearGroupUpper = `ALL ${profile.yearGroup.toUpperCase()}`;
                      const isBatchWideOverride = targetBranchText === userYearGroupUpper;

                      const userBranch = (profile.branch || "").toUpperCase();
                      const isTargetedBranchMatch = 
                        targetBranchText === "ALL" || 
                        targetBranchText === "" || 
                        isBatchWideOverride ||
                        targetBranchText.split(/[\s,]+/).some((b: string) => b.trim() === userBranch);

                      if (isUniversal || isFresherOverride || isTargetedBranchMatch) {
                        combinedNotices.push({
                          date,
                          title,
                          description,
                          targetBranch: isUniversal ? "Universal" : (targetBranchText || "ALL"),
                          author,
                          phone,
                          timestamp: getTimestampFromDDMMYYYY(date)
                        });
                      }
                    });
                    resolve();
                  },
                  error: () => resolve(),
                });
              });
            } catch (fetchErr) {
              console.error(`Failed loading target network stream: ${url}`, fetchErr);
            }
          })
        );

        combinedNotices.sort((a, b) => b.timestamp - a.timestamp);
        setNotices(combinedNotices);

        const seenIds = combinedNotices.map(notice => {
          return `${notice.title}_${notice.date}_${notice.author}`.replace(/\s+/g, "_");
        });
        if (seenIds.length > 0) {
          localStorage.setItem("iitp_seen_notice_ids", JSON.stringify(seenIds));
        }
        
      } catch (err) {
        console.error("Error running notice configuration loop:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchAndFilterNotices();
  }, [isOpen, session]);

  const copyToClipboard = (text: string, index: number) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 1800);
  };

  const isToday = (dateString: string) => {
    if (!dateString) return false;
    try {
      const cleanInput = dateString.trim().replace(/-/g, "/");
      const parts = cleanInput.split("/");
      if (parts.length !== 3) return false;

      const inputDay = parseInt(parts[0], 10);
      const inputMonth = parseInt(parts[1], 10);
      const inputYear = normalizeYear(parts[2].trim());

      const systemDate = new Date();
      return (
        inputDay === systemDate.getDate() &&
        inputMonth === (systemDate.getMonth() + 1) &&
        inputYear === systemDate.getFullYear()
      );
    } catch {
      return false;
    }
  };

  if (!shouldRender) return null;

  return (
    <div 
      onClick={onClose}
      // 🛠️ CHANGED: Dynamic transition for background opacity
      className={`fixed inset-0 bg-sky/80 backdrop-blur-md flex items-center justify-center p-2 sm:p-4 z-[100] pointer-events-auto transition-opacity duration-300 ease-out ${
        animate ? "opacity-100" : "opacity-0"
      }`}
     >
      <div 
        onClick={(e) => e.stopPropagation()}
        // 🛠️ CHANGED: Swapped tailwind dynamic animate-in properties with manual transition-all duration-300 scale rules tracking center expansion vectors
        className={`bg-sky-700 w-full sm:max-w-[800px] max-h-[91vh] rounded-[16px] sm:rounded-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.9)] border border-zinc-800 flex flex-col relative overflow-hidden transition-all duration-300 ease-[cubic-bezier(0.34,1.56,0.64,1)] origin-center transform ${
          animate ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
       >
        {/* Tactile Mobile Drag Pull Indicator Bar */}
        <div className="w-full flex justify-center py-1.5 sm:hidden shrink-0">
          <div className="w-12 h-1 bg-zinc-800 rounded-full" />
        </div>

        {/* Modal App Header Row */}
        <div className="flex items-center justify-between px-2 pb-2 pt-2 sm:pt-4 border-b border-zinc-950 bg-zinc-900 shrink-0">
          <div>
            <h3 className="text-lg font-black text-white uppercase flex items-center gap-1.5">
              <span>🔔</span> Notices
            </h3>
          </div>
          
          <div className="flex items-center gap-2 select-none">
            {session?.user && (
              <a 
                href="https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[14px] font-black tracking-normal text-blue-600 hover:text-blue-500 bg-blue-500/10 hover:bg-blue-500/30 border border-blue-700/40 px-1.5 py-2 rounded-xl transition-colors duration-150 active:scale-95 shadow-sm"
              >
                <u> Full Notice Sheet</u> ↗
              </a>
            )}

            <button 
              onClick={onClose} 
              className="text-red-500 border border-red-900 hover:text-white hover:bg-rose-500/30  hover:border-rose-500/50 font-black text-xs h-7 w-7 flex items-center justify-center rounded-2xl bg-[#161616] active:scale-90 transition-all duration-150 cursor-pointer shadow-md"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scroll Body */}
        <div className="overflow-y-auto flex-1 px-2 py-3 space-y-3 style-modal-scrollbar touch-pan-y bg-[#050505]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-7 h-7 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 animate-pulse">Loading Notices...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20 select-none">
              <span className="text-4xl filter grayscale opacity-30">🏜️</span>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mt-4">Buffer Vacant</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[220px] mx-auto leading-relaxed">No otice for you.</p>
            </div>
          ) : (
            notices.map((notice, index) => {
              const currentDayActive = isToday(notice.date);
              const isUniversalTag = notice.targetBranch.toLowerCase() === "universal";
              
              return (
                <div 
                  key={index} 
                  className="rounded-xl border border-zinc-900 bg-gradient-to-b from-slate-800 to-zinc- p-3 flex flex-col gap-2 shadow-lg"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1 select-none">
                      <span className={`text-[10px] font-mono px-2 py-1 rounded-md tracking-wider font-zinc-black border transition-all ${
                        currentDayActive 
                          ? "bg-rose-600/70 text-zinc-200 font-bold border-rose-500/50  shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" 
                          : "bg-zinc-800/90 text-zinc-200 font-bold border-zinc-500  " 
                      }`}>
                        {currentDayActive ? "TODAY" : notice.date}
                      </span>

                      <span className={`text-[10px] font-black px-1 py-0.5 rounded-md uppercase tracking-wider border max-w-[115px] truncate ${
                        isUniversalTag 
                          ? "bg-yellow-600/10 text-yellow-500 font-bold border-amber-500/50" 
                          : "bg-green-600/10 text-green-500 font-bold border-emerald-500/50"
                      }`}>
                        {notice.targetBranch}
                      </span>
                    </div>

                    {notice.phone && (
                      <button 
                        onClick={() => copyToClipboard(notice.phone, index)}
                        className={`text-[10px] font-mono font-black flex items-center gap-1 px-1 py-1 rounded-md border tracking- transition-all duration-150 cursor-pointer active:scale-95 ${
                          copiedIndex === index 
                            ? "bg-emerald-500/10 text-[#10B981] border-emerald-500/20 font-sans" 
                            : "bg-zinc-900 text-slate-300  border-zinc-700 hover:text-zinc-950 hover:bg-slate-600 hover:border-zinc-500"
                        }`}
                      >
                        <span>{copiedIndex === index ? "✓" : "🤙"}</span>
                        <span>{copiedIndex === index ? "COPIED" : notice.phone}</span>
                      </button>
                    )}
                  </div>

                  <h4 className="text-[15px] font-black text-purple-300/80 leading-snug tracking-tight pr-1">
                  ❄️ {notice.title} 
                  </h4>
                  
                  <p className="text-[14px] text-slate-100/90 gap-0 font-md whitespace-pre-wrap break-words">
                    {notice.description}
                  </p>

                  <div className="pt-2  flex items-center w-full border-t border-zinc-700/80 mt-0 select-none">
                    <div className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider">
                      Published By: <span className="text-zinc-300/80 font-black normal-case">{notice.author}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>

      <style jsx global>{`
        .style-modal-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .style-modal-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .style-modal-scrollbar::-webkit-scrollbar-thumb {
          background: #0e1432;
          border-radius: 20px;
        }
        .style-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #161545;
        }
      `}</style>
    </div>
  );
}