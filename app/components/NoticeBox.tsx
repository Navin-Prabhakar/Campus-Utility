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

  useEffect(() => {
    if (!isOpen) return;

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

  if (!isOpen) return null;

  return (
    <div 
      onClick={onClose}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-end sm:items-center justify-center p-0 sm:p-4 z-[99999] animate-in fade-in duration-200"
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-[#0A0A0A] w-full sm:max-w-[380px] max-h-[75vh] rounded-t-[24px] sm:rounded-2xl shadow-[0_-10px_40px_rgba(0,0,0,0.5),0_20px_50px_rgba(0,0,0,0.9)] border border-zinc-950 flex flex-col relative overflow-hidden animate-in slide-in-from-bottom duration-300 ease-out"
      >
        {/* Tactile Mobile Drag Pull Indicator Bar */}
        <div className="w-full flex justify-center py-2.5 sm:hidden shrink-0">
          <div className="w-12 h-1 bg-zinc-800 rounded-full" />
        </div>

        {/* Modal App Header Row */}
        <div className="flex items-center justify-between px-4 pb-3.5 pt-1 sm:pt-4 border-b border-zinc-900 bg-[#0A0A0A] shrink-0">
          <div>
            <h3 className="text-xs font-black text-white tracking-widest uppercase flex items-center gap-1.5">
              <span>🔔</span> System Notices
            </h3>
          </div>
          
          <div className="flex items-center gap-2 select-none">
            {/* 🛠️ MODIFIED: Wrapped master log button inside session validation check */}
            {session?.user && (
              <a 
                href="https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/edit"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[10px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/20 px-2.5 py-1.5 rounded-xl transition-colors duration-150 active:scale-95 shadow-sm"
              >
                Master log ↗
              </a>
            )}

            <button 
              onClick={onClose} 
              className="text-zinc-500 hover:text-white hover:bg-rose-600/20 border border-transparent hover:border-rose-500/30 font-black text-xs h-7 w-7 flex items-center justify-center rounded-xl bg-[#161616] active:scale-90 transition-all duration-150 cursor-pointer shadow-md"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scroll Body */}
        <div className="overflow-y-auto flex-1 px-4 py-4 space-y-3.5 style-modal-scrollbar touch-pan-y bg-[#050505]">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-3">
              <div className="w-7 h-7 border-2 border-zinc-700 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500 animate-pulse">Mapping notice buffers...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-20 select-none">
              <span className="text-4xl filter grayscale opacity-30">🏜️</span>
              <p className="text-xs font-black uppercase tracking-widest text-zinc-500 mt-4">Buffer Vacant</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[220px] mx-auto leading-relaxed">No matching operational broadcast files align with your authentication token.</p>
            </div>
          ) : (
            notices.map((notice, index) => {
              const currentDayActive = isToday(notice.date);
              const isUniversalTag = notice.targetBranch.toLowerCase() === "universal";
              
              return (
                <div 
                  key={index} 
                  className="rounded-xl border border-zinc-900 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] p-3.5 flex flex-col gap-2 shadow-xl"
                >
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1.5 select-none">
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md tracking-wider font-black border transition-all ${
                        currentDayActive 
                          ? "bg-rose-600 border-rose-500 text-white shadow-[0_0_8px_rgba(244,63,94,0.4)] animate-pulse" 
                          : "bg-[#161616] border-zinc-800 text-zinc-400" 
                      }`}>
                        {currentDayActive ? "TODAY" : notice.date}
                      </span>

                      <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border max-w-[150px] truncate ${
                        isUniversalTag 
                          ? "bg-amber-500/5 text-[#F59E0B] border-amber-500/20" 
                          : "bg-zinc-800 text-zinc-300 border-zinc-700"
                      }`}>
                        {notice.targetBranch}
                      </span>
                    </div>

                    {notice.phone && (
                      <button 
                        onClick={() => copyToClipboard(notice.phone, index)}
                        className={`text-[9px] font-mono font-black flex items-center gap-1 px-2.5 py-1 rounded-lg border tracking-wide transition-all duration-150 cursor-pointer active:scale-95 ${
                          copiedIndex === index 
                            ? "bg-emerald-500/10 text-[#10B981] border-emerald-500/20 font-sans" 
                            : "bg-[#161616] text-zinc-400 border-zinc-800 hover:text-white hover:border-zinc-700"
                        }`}
                      >
                        <span>{copiedIndex === index ? "✓" : "📞"}</span>
                        <span>{copiedIndex === index ? "COPIED" : notice.phone}</span>
                      </button>
                    )}
                  </div>

                  <h4 className="text-[13px] font-black text-white leading-snug tracking-tight pr-1">
                    {notice.title}
                  </h4>
                  
                  <p className="text-[11px] text-zinc-400 leading-relaxed font-medium whitespace-pre-wrap break-words">
                    {notice.description}
                  </p>

                  <div className="pt-2 flex items-center w-full border-t border-zinc-900/60 mt-0.5 select-none">
                    <div className="text-[9px] text-zinc-600 font-bold uppercase tracking-wider">
                      Node Authority: <span className="text-zinc-400 font-black normal-case">{notice.author}</span>
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
          background: #1c1c1c;
          border-radius: 20px;
        }
        .style-modal-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #2D2D2D;
        }
      `}</style>
    </div>
  );
}