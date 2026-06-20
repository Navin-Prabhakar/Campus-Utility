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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-end justify-center sm:items-center p-0 sm:p-4 z-[100]">
      <div className="bg-white w-full sm:max-w-[400px] rounded-t-[24px] sm:rounded-2xl shadow-2xl border border-zinc-100 flex flex-col relative max-h-[97vh] pb-4 sm:pb-5">
        
        {/* Pull Drawer Bar */}
        <div className="w-full flex justify-center py-2 sm:hidden">
          <div className="w-12 h-1.5 bg-zinc-300 rounded-full" />
        </div>

        {/* Modal App Header */}
        <div className="flex items-center justify-between px-3 pb-2 pt-1 sm:pt-9 border-b border-zinc-100">
          <div>
            <h3 className="text-lg font-black text-zinc-900 font-large tracking-tight flex items-center gap-1.5">
              <span>🔔</span> Notice Board
            </h3>
          </div>
          
          {/* Header Action Controls Area */}
          <div className="flex items-center px-0 gap-1">
            {/* 🛠️ NEW: Master Sheet External Navigation Button */}
            <a 
              href="https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/edit"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-bold text-sky-600 hover:text-sky-800 bg-sky-50 hover:bg-sky-100/80 border border-sky-100 px-1.5 py-1 rounded-xl transition duration-150 active:scale-95"
            >
              View Notice_MasterSheet
            </a>

            {/* 🛠️ MODIFIED: Cross Button turns crimson red instantly on hover/active press */}
            <button 
              onClick={onClose} 
              className="text-zinc-500 hover:text-red-600 hover:bg-red-50 font-bold text-lg h-8 w-8 flex items-center justify-center rounded-full bg-zinc-100 active:scale-95 transition-all duration-150 cursor-pointer"
              title="Close modal"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Scroll Body */}
        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4 scrollbar-none touch-pan-y">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-8 h-8 border-4 border-sky-600 border-t-transparent rounded-full animate-spin" />
              <p className="text-sm font-semibold text-zinc-500 animate-pulse">Syncing notice channels...</p>
            </div>
          ) : notices.length === 0 ? (
            <div className="text-center py-16">
              <span className="text-3xl">🏜️</span>
              <p className="text-sm font-bold text-zinc-700 mt-3">All caught up!</p>
              <p className="text-xs text-zinc-400 mt-1">No active notices match your profile.</p>
            </div>
          ) : (
            notices.map((notice, index) => {
              const currentDayActive = isToday(notice.date);
              const isUniversalTag = notice.targetBranch.toLowerCase() === "universal";
              
              return (
                <div 
                  key={index} 
                  className="rounded-2xl border border-zinc-200/80 bg-white p-4 flex flex-col gap-2.5 shadow-sm"
                >
                  {/* Badge & Upper Right Phone Wrapper */}
                  <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded-md border tracking-wide font-black transition-colors ${
                        currentDayActive 
                          ? "bg-red-600 border-red-600 text-white shadow-md animate-pulse" 
                          : "bg-zinc-900 border-zinc-950 text-white" 
                      }`}>
                        {currentDayActive ? "TODAY" : notice.date}
                      </span>

                      <span className={`text-[9.5px] font-black px-2 py-0.5 rounded-md uppercase tracking-wider border max-w-[140px] truncate ${
                        isUniversalTag 
                          ? "bg-amber-100 text-amber-800 border-amber-200" 
                          : "bg-sky-50 text-sky-700 border-sky-100"
                      }`}>
                        {notice.targetBranch}
                      </span>
                    </div>

                    {/* Upper Right Action */}
                    {notice.phone && (
                      <button 
                        onClick={() => copyToClipboard(notice.phone, index)}
                        className={`text-[11px] font-mono font-black flex items-center gap-1 px-2.5 py-0.5 rounded-md border tracking-tight transition-all duration-150 cursor-pointer active:scale-95 ${
                          copiedIndex === index 
                            ? "bg-emerald-600 text-white border-emerald-600 font-sans text-[10px]" 
                            : "bg-zinc-50 text-zinc-700 border-zinc-200 hover:bg-zinc-100"
                        }`}
                      >
                        <span>{copiedIndex === index ? "✓" : "📞"}</span>
                        <span>{copiedIndex === index ? "Copied!" : notice.phone}</span>
                      </button>
                    )}
                  </div>

                  {/* Headline Title */}
                  <h4 className="text-[16px] font-black text-zinc-950 leading-snug tracking-tight pr-2">
                    {notice.title}
                  </h4>
                  
                  {/* Body Text */}
                  <p className="text-[13.5px] text-zinc-700 leading-relaxed font-normal whitespace-pre-wrap break-words">
                    {notice.description}
                  </p>

                  {/* Author Box */}
                  <div className="pt-1 flex items-center w-full">
                    <div className="text-[11.5px] text-zinc-400 font-medium">
                      By: <span className="text-zinc-600 font-bold">{notice.author}</span>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}