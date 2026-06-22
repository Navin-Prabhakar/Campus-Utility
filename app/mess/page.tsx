"use client";

import React, { useEffect, useState } from "react";
import Papa from "papaparse";

interface MenuItem {
  Day: string;
  Breakfast: string;
  Lunch: string;
  Snacks: string;
  Dinner: string;
  Dessert: string;
}

const MESS_CONFIG = [
  { id: "mess1", name: "CVR (4)", gid: "0", contact: "919999999999" }, 
  { id: "mess2", name: "Aryabhatta (5)", gid: "1633328713", contact: "919140688647" }, 
  { id: "mess3", name: "Aryabhatta (6)", gid: "1524747018", contact: "919999999999" },
  { id: "mess4", name: "Kalam ()", gid: "754990639", contact: "919999999999" },
  { id: "mess5", name: "Kalam (?)", gid: "491167474", contact: "919999999999" }, 
  { id: "mess6", name: "Asima ()", gid: "1461673664", contact: "919999999999" },
  { id: "mess7", name: "Asima (?)", gid: "477079361", contact: "919999999999" },
];

const DAYS_OF_WEEK = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const MASTER_SPREADSHEET_ID = "19T-kfoZVs5eEn_ADqvXUWKQW1KfQsnF0Fiau5bckllk";
const GOOGLE_SHEET_BROWSER_URL = `https://docs.google.com/spreadsheets/d/${MASTER_SPREADSHEET_ID}/edit?usp=sharing`;
const COMPLAINT_SPREADSHEET_URL = "https://docs.google.com/spreadsheets/d/1RXapvmvXqpLOJw5n0PHlSmSW9-hmxWzaFM9rXpcjAHc/edit?"; 
const COMPLAINT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbw2vwDIx8ht6zrOIaS39oQ3oFNCesYpICmn-FJAceynT1CvNhEN5sAUcnjP5wXxp3tpog/exec";

export default function MessPage() {
  const [menuData, setMenuData] = useState<MenuItem[]>([]);
  const [everydayMenu, setEverydayMenu] = useState<MenuItem | null>(null);
  const [liveNotice, setLiveNotice] = useState<string>(""); 
  const [currentDay, setCurrentDay] = useState<string>("");
  const [selectedDay, setSelectedDay] = useState<string>("");
  const [selectedMess, setSelectedMess] = useState<typeof MESS_CONFIG[0] | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  const [isDayDropdownOpen, setIsDayDropdownOpen] = useState<boolean>(false);
  const [isDefaultChecked, setIsDefaultChecked] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Complaint Modal States
  const [isComplaintOpen, setIsComplaintOpen] = useState<boolean>(false);
  const [complaintForm, setComplaintForm] = useState({ name: "", roll: "", category: "Food Quality", desc: "" });
  const [selectedImages, setSelectedImages] = useState<File[]>([]);
  const [isDataLogged, setIsDataLogged] = useState<boolean>(false);
  const [submittingComplaint, setSubmittingComplaint] = useState<boolean>(false);

  useEffect(() => {
    const dayName = DAYS_OF_WEEK[new Date().getDay()];
    setCurrentDay(dayName);
    setSelectedDay(dayName);

    const storedMessId = localStorage.getItem("user-default-mess");
    if (storedMessId) {
      const savedMess = MESS_CONFIG.find(m => m.id === storedMessId);
      if (savedMess) {
        setSelectedMess(savedMess);
        setIsDefaultChecked(true);
      }
    } else {
      // Fallback to initial default mess if no preference cached
      setSelectedMess(MESS_CONFIG[0]);
    }
  }, []);

  useEffect(() => {
    if (!selectedMess) return;
    setLoading(true);
    setError(null);
    setIsDropdownOpen(false); 
    setEverydayMenu(null);
    setLiveNotice(""); 

    const GOOGLE_SHEET_CSV_URL = `https://docs.google.com/spreadsheets/d/${MASTER_SPREADSHEET_ID}/export?format=csv&gid=${selectedMess.gid}`;

    Papa.parse(GOOGLE_SHEET_CSV_URL, {
      download: true,
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as string[][];
        if (!rows || rows.length < 4) {
          setError("Spreadsheet layout is empty or formatting is too short.");
          setLoading(false);
          return;
        }

        if (rows[14] && rows[14][1]) {
          const extractedNotice = rows[14][1].trim();
          setLiveNotice(extractedNotice);
        }

        const headers = rows[2].map(h => h.trim().toUpperCase());
        const weekdayIdx = headers.indexOf("WEEKDAY");
        const breakfastIdx = headers.indexOf("BREAKFAST");
        const lunchIdx = headers.indexOf("LUNCH");
        const snacksIdx = headers.indexOf("SNACKS");
        const dinnerIdx = headers.indexOf("DINNER");
        const dessertIdx = headers.indexOf("DESSERT");

        if (weekdayIdx === -1 || breakfastIdx === -1 || lunchIdx === -1) {
          setError("Columns alignment mismatch. Row 3 layout is modified.");
          setLoading(false);
          return;
        }

        const parsedMenu: MenuItem[] = [];
        for (let i = 3; i < Math.min(rows.length, 14); i++) { 
          const row = rows[i];
          const dayName = row[weekdayIdx]?.trim() || "";
          if (!dayName) continue;

          const itemPayload: MenuItem = {
            Day: dayName,
            Breakfast: row[breakfastIdx]?.trim() || "—",
            Lunch: row[lunchIdx]?.trim() || "—",
            Snacks: row[snacksIdx]?.trim() || "—",
            Dinner: row[dinnerIdx]?.trim() || "—",
            Dessert: dessertIdx !== -1 ? (row[dessertIdx]?.trim() || "—") : "—"
          };

          if (dayName.toUpperCase() === "EVERYDAY") {
            setEverydayMenu(itemPayload);
          } else {
            parsedMenu.push(itemPayload);
          }
        }

        if (parsedMenu.length > 0) {
          setMenuData(parsedMenu);
        } else {
          setError("Unable to parse worksheet structural fields.");
        }
        setLoading(false);
      },
      error: (err) => {
        console.error(err);
        setError("Failed to fetch live schedule rows.");
        setLoading(false);
      },
    });
  }, [selectedMess]);

  const handleDefaultToggle = (checked: boolean) => {
    setIsDefaultChecked(checked);
    if (!selectedMess) return;
    if (checked) {
      localStorage.setItem("user-default-mess", selectedMess.id);
    } else {
      localStorage.removeItem("user-default-mess");
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files).slice(0, 3);
      setSelectedImages(filesArray);
    }
  };

  const convertFileToBase64 = (file: File): Promise<{ base64: string; filename: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const rawBase64 = (reader.result as string).split(",")[1];
        const cleanMessPrefix = selectedMess ? selectedMess.name.replace(/[()]/g, "").replace(/\s+/g, "_") : "Unknown_Mess";
        const formattedTimestamp = new Date().toISOString().slice(0, 10);
        
        resolve({
          base64: rawBase64,
          filename: `${cleanMessPrefix}_${formattedTimestamp}_${file.name}`,
          mimeType: file.type
        });
      };
      reader.onerror = (error) => reject(error);
    });
  };

  const handleLogDataToSheets = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMess) return;
    setSubmittingComplaint(true);

    try {
      const base64ImagesArray = await Promise.all(
        selectedImages.map(file => convertFileToBase64(file))
      );

      await fetch(COMPLAINT_SCRIPT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "text/plain;charset=utf-8", 
        },
        body: JSON.stringify({
          messName: selectedMess.name,
          name: complaintForm.name,
          rollNumber: complaintForm.roll,
          category: complaintForm.category,
          description: complaintForm.desc,
          images: base64ImagesArray
        })
      });

      setIsDataLogged(true); 
    } catch (err) {
      console.error("Sheet saving error:", err);
      alert("Network transmission failure. Check configuration link parameters.");
    }
    setSubmittingComplaint(false);
  };

  const cleanMessName = selectedMess ? selectedMess.name.replace(/[()]/g, "").trim() : "";
  const boldTitle = `*🚨 IITP MESS COMPLAINT REGISTERED*`;
  const messagePayload = `${boldTitle}\n\n• Mess: ${cleanMessName}\n• Student Name: ${complaintForm.name}\n• Roll No: ${complaintForm.roll}\n• Category: ${complaintForm.category}\n• Description: ${complaintForm.desc}\n\n_(Note: Photo proofs are ready inside the media drawer)_`;
  
  const cleanNumber = selectedMess ? selectedMess.contact.replace(/\s+/g, "") : "";
  const finalWhatsappUrl = `https://wa.me/${cleanNumber}?text=${encodeURIComponent(messagePayload)}`;

  const resetModalFormState = () => {
    setIsComplaintOpen(false);
    setIsDataLogged(false);
    setComplaintForm({ name: "", roll: "", category: "Food Quality", desc: "" });
    setSelectedImages([]);
  };

  const todaysMenu = menuData.find(item => item.Day?.toLowerCase().trim() === selectedDay.toLowerCase());

  return (
    <main className="h-full w-full bg-[#050505] font-sans text-zinc-300 antialiased flex flex-col justify-between relative overflow-hidden selection:bg-zinc-800 selection:text-white">
      
      {/* 🛠️ RESTORED: Sticky Control and Selection Bar Sitting Safely Below Global Header Layout */}
      <div className="w-full bg-[#0C0C0C]/90 backdrop-blur-md border-b border-zinc-900 shrink-0 z-30 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        <div className="w-[94%] max-w-[365px] py-2.5 flex justify-between items-center relative">
          
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDefaultToggle(!isDefaultChecked)}
              title="Toggle Always Load by Default"
              className={`h-5 w-5 rounded-md border flex items-center justify-center transition-all transform active:scale-[0.85] ${
                isDefaultChecked 
                  ? "bg-[#2A2A2A] border-zinc-600 text-[#10B981]" 
                  : "bg-[#141414] border-zinc-800 text-transparent"
              }`}
            >
              <span className="text-[10px] font-black leading-none select-none">✓</span>
            </button>
            <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Set Default</span>
          </div>

          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="h-7 px-3 bg-[#161616] hover:bg-[#222222] text-zinc-300 hover:text-white transition-colors text-[10px] font-black tracking-wider uppercase rounded-xl flex items-center gap-1.5 border border-zinc-800 active:scale-95 transform shadow-md"
            >
              <span>{selectedMess ? selectedMess.name : "Select Mess Stream"}</span> ▼
            </button>

            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-44 bg-[#121212] border border-zinc-800 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] z-50 overflow-hidden divide-y divide-zinc-900/60 animate-in fade-in zoom-in-95 duration-100">
                {MESS_CONFIG.map((mess) => (
                  <button
                    key={mess.id}
                    onClick={() => {
                      setSelectedMess(mess);
                      const savedId = localStorage.getItem("user-default-mess");
                      setIsDefaultChecked(savedId === mess.id);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-[11px] font-bold block transition-colors ${
                      selectedMess?.id === mess.id ? "bg-[#1A1A1A] text-[#10B981]" : "text-zinc-400 hover:bg-[#161616] hover:text-white"
                    }`}
                  >
                    {mess.name}
                  </button>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* 📜 SCROLLABLE APP WRAPPER WINDOW */}
      <div className="w-full flex-1 overflow-y-auto flex flex-col items-center pb-36 style-scrollbar">
        
        {/* Active Node Indicator Badge */}
        {selectedMess && (
          <div className="w-[94%] max-w-[350px] mt-3.5 bg-gradient-to-r from-[#0F0F0F] to-[#0A0A0A] text-zinc-400 border border-zinc-800 rounded-xl py-1.5 px-4 text-center text-[11px] font-black tracking-widest uppercase shadow-md shrink-0 select-none">
            📍 Node: <span className="text-zinc-200 font-black">{selectedMess.name}</span> System
          </div>
        )}

        {/* Live Notices Layer: Warn Accentuation Rules */}
        {selectedMess && liveNotice && (
          <div className="w-[94%] max-w-[350px] mt-3 p-3 bg-gradient-to-br from-[#14120F] to-[#0D0B0A] border border-amber-500/10 rounded-xl text-xs leading-relaxed text-amber-200/80 shadow-md shrink-0 font-medium">
            <span className="text-[#F59E0B] font-black tracking-wide uppercase block mb-0.5">⚠️ Broadcast Log:</span>
            <p className="italic">"{liveNotice}"</p>
          </div>
        )}

        <main className="flex flex-col items-center justify-start py-3 w-[94%] max-w-[350px] space-y-3 flex-grow">
          
          {!selectedMess ? (
            <div className="flex flex-col items-center justify-center pt-28 text-center select-none animate-pulse">
              <span className="text-4xl mb-3 filter grayscale opacity-40">🍛</span>
              <p className="text-xs font-black uppercase tracking-wider text-zinc-500">Deactivated Stream</p>
              <p className="text-[10px] text-zinc-600 mt-1 max-w-[200px] leading-relaxed">Tap the select action button to open terminal records.</p>
            </div>
          ) : (
            <>
              {/* PRIMARY DAILY SCHEDULING CARD CONTAINER */}
              <div className="w-full rounded-2xl border border-zinc-900 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] p-3 shadow-xl">
                <div className="mb-2 flex items-center justify-between border-b border-zinc-900 pb-2 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#10B981] shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <h2 className="text-[10px] font-black uppercase tracking-widest text-[#10B981]">Live Layout</h2>
                  </div>

                  {/* Day Toggler (Depth Clickable Accent Structure) */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                      className="text-[9px] bg-[#2A2A2A] hover:bg-[#333333] border border-zinc-700 text-white font-black px-2 py-1 rounded-lg uppercase tracking-widest font-mono flex items-center gap-0.5 shadow-sm active:scale-95 transition-all"
                    >
                      <span>{selectedDay.slice(0, 3)}</span>
                      <span>▼</span>
                    </button>

                    {isDayDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-24 bg-[#121212] border border-zinc-800 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-zinc-900 animate-in fade-in zoom-in-95 duration-100">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setSelectedDay(d);
                              setIsDayDropdownOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-[10px] font-black font-mono uppercase tracking-wider transition-colors ${
                              selectedDay === d ? "bg-[#1A1A1A] text-[#10B981]" : "text-zinc-500 hover:bg-[#161616] hover:text-zinc-300"
                            }`}
                          >
                            {d.slice(0, 3)} {d === currentDay && "•"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Plate Schedules Blocks */}
                <div className="flex flex-col gap-1.5 w-full pt-1">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-[#121212] border border-zinc-900" />
                    ))
                  ) : error ? (
                    <div className="py-4 text-center text-[11px] font-black tracking-wide uppercase text-rose-400 bg-rose-950/10 border border-rose-950/30 rounded-xl">{error}</div>
                  ) : todaysMenu ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col rounded-xl border border-zinc-900 bg-[#121212]/50 px-3 py-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">☕️ Breakfast</span>
                        <span className="text-[11px] font-black text-zinc-200 mt-1 leading-snug">{todaysMenu.Breakfast || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-900 bg-[#121212]/50 px-3 py-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">🍛 Lunch</span>
                        <span className="text-[11px] font-black text-zinc-200 mt-1 leading-snug">{todaysMenu.Lunch || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-900 bg-[#121212]/50 px-3 py-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">🍟 Snacks</span>
                        <span className="text-[11px] font-black text-zinc-200 mt-1 leading-snug">{todaysMenu.Snacks || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-900 bg-[#121212]/50 px-3 py-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">🍱 Dinner</span>
                        <span className="text-[11px] font-black text-zinc-200 mt-1 leading-snug">{todaysMenu.Dinner || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-900 bg-gradient-to-b from-[#140F11] to-[#0D0A0B] px-3 py-2">
                        <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">🍧 Dessert</span>
                        <span className="text-[11px] font-black text-zinc-200 mt-1 leading-snug">{todaysMenu.Dessert || "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[10px] text-zinc-600 font-medium italic">No listings registered for this index target.</div>
                  )}
                </div>
              </div>

              {/* SECONDARY CARD CONTAINER: STANDARD CALORIC CONSTANTS (Amber Notice Layer) */}
              <div className="w-full rounded-2xl border border-zinc-900 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] p-3 shadow-xl">
                <div className="mb-2 flex items-center gap-1.5 border-b border-zinc-900 pb-2 px-1">
                  <span className="text-xs">🔄</span>
                  <h2 className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                    Everyday Constants
                  </h2>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  {loading ? (
                    <div className="h-16 w-full animate-pulse rounded-xl bg-[#121212]" />
                  ) : everydayMenu ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-900 bg-[#121212]/30 p-2 flex flex-col">
                        <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-wider">☕️ Breakfast</span>
                        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 leading-tight">{everydayMenu.Breakfast}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-[#121212]/30 p-2 flex flex-col">
                        <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-wider">🍛 Lunch</span>
                        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 leading-tight">{everydayMenu.Lunch}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-[#121212]/30 p-2 flex flex-col">
                        <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-wider">🍟 Snacks</span>
                        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 leading-tight">{everydayMenu.Snacks}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-[#121212]/30 p-2 flex flex-col">
                        <span className="text-[9px] font-black text-amber-500/70 uppercase tracking-wider">🍱 Dinner</span>
                        <span className="text-[10px] font-bold text-zinc-400 mt-0.5 leading-tight">{everydayMenu.Dinner}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] text-zinc-600 font-medium italic">No standard elements map configured.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* 🔗 Spreadsheets links built specifically using structural Blue design guidelines */}
        {selectedMess && (
          <div className="w-full bg-transparent pt-2 pb-6 shrink-0 flex flex-col items-center gap-2 select-none">
            <a 
              href={GOOGLE_SHEET_BROWSER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-400 underline transition-colors"
            >
              Export Global Menu Matrix ↗
            </a>
            <a 
              href={COMPLAINT_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[11px] font-black uppercase tracking-wider text-blue-500 hover:text-blue-400 underline transition-colors"
            >
              Review Complaint Databanks ↗
            </a>
          </div>
        )}
      </div>

      {/* 🚨 CRIMSON HARSH ALERTS COMPLAINT SYSTEM ACTION TRIGGER BUTTON */}
      {selectedMess && (
        <button
          onClick={() => setIsComplaintOpen(true)}
          className="fixed bottom-24 right-4 h-12 w-12 rounded-full bg-gradient-to-b from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold flex flex-col items-center justify-center shadow-[0_4px_15px_rgba(244,63,94,0.3)] border border-rose-500/30 z-50 cursor-pointer transition transform active:scale-90 select-none"
        >
          <span className="text-base leading-none mt-1">🚨</span> 
          <svg viewBox="0 0 100 40" className="w-full h-4 mt-0.5 pointer-events-none fill-white font-black select-none">
            <defs>
              <path id="smileTextPath" d="M 10,8 Q 50,28 90,8" />
            </defs>
            <text className="text-[16px] tracking-widest uppercase">
              <textPath href="#smileTextPath" startOffset="50%" textAnchor="middle">
                report
              </textPath>
            </text>
          </svg>
        </button>
      )}

      {/* COMPLAINT MODAL WINDOW (PRO DARK GLASSMORPHISM STYLING OVERHAUL) */}
      {isComplaintOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-[#0A0A0A] border border-zinc-900 rounded-2xl p-4 w-full max-w-[320px] shadow-2xl flex flex-col relative max-h-[86vh] overflow-y-auto style-scrollbar">
            <button 
              onClick={resetModalFormState}
              className="absolute top-3 right-4 text-zinc-500 hover:text-white text-xs font-black transition-colors cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xs font-black uppercase tracking-widest text-rose-500 mb-4 flex items-center gap-1.5">
              <span>🚨</span> File Mess Grievance
            </h3>

            {!isDataLogged ? (
              <form onSubmit={handleLogDataToSheets} className="space-y-3">
                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Full Identity</label>
                  <input 
                    type="text" required
                    value={complaintForm.name}
                    onChange={(e) => setComplaintForm({...complaintForm, name: e.target.value})}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium outline-hidden focus:border-zinc-700 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Roll Reference</label>
                  <input 
                    type="text" required
                    value={complaintForm.roll}
                    onChange={(e) => setComplaintForm({...complaintForm, roll: e.target.value})}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-mono font-medium outline-hidden focus:border-zinc-700 shadow-inner"
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Grievance Category</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-2 py-2 text-xs font-black text-zinc-300 outline-hidden focus:border-zinc-700 cursor-pointer"
                  >
                    <option value="Food Quality">Food Quality / Raw Rice</option>
                    <option value="Hygiene Issue">Hygiene / Insect / Dirt</option>
                    <option value="Shortage of Meals">Shortage of Food Item</option>
                    <option value="Staff Behavior">Catering Staff Behavior</option>
                    <option value="Other">Other Miscellaneous Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">Incident Report Logs</label>
                  <textarea 
                    required rows={3}
                    value={complaintForm.desc}
                    onChange={(e) => setComplaintForm({...complaintForm, desc: e.target.value})}
                    className="w-full bg-[#121212] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-white font-medium outline-hidden focus:border-zinc-700 resize-none shadow-inner"
                    placeholder="Provide explicit event metrics..."
                  />
                </div>

                <div>
                  <label className="block text-[9px] font-black uppercase tracking-wider text-zinc-500 mb-1">
                    Evidence Media Capture ({selectedImages.length}/3)
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageChange}
                    className="w-full text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:uppercase file:bg-[#1A1A1A] file:text-white file:cursor-pointer"
                  />

                  {selectedImages.length > 0 && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto py-1 style-scrollbar">
                      {selectedImages.map((file, idx) => (
                        <div key={idx} className="relative h-12 w-12 rounded-xl border border-zinc-800 overflow-hidden shrink-0 bg-[#121212] flex items-center justify-center shadow-md">
                          <span className="text-[8px] font-mono font-bold text-zinc-600 truncate max-w-[60%] px-1">
                            📷 File {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-rose-600 text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-bl-lg shadow-md active:scale-75 transition-transform"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Light colored button trigger for depth perception */}
                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full mt-2 py-2 bg-[#2A2A2A] hover:bg-[#333333] border border-zinc-700 text-white rounded-xl text-xs font-black tracking-wider uppercase shadow-md active:scale-95 transition transform disabled:opacity-50 cursor-pointer"
                >
                  {submittingComplaint ? "Uploading Framework Nodes..." : "Commit To Sheets ➔"}
                </button>
              </form>
            ) : (
              /* Success confirmation state */
              <div className="space-y-4 text-center py-4 animate-in fade-in duration-200">
                <div className="h-10 w-10 rounded-full bg-emerald-500/10 text-[#10B981] border border-emerald-500/20 flex items-center justify-center mx-auto text-base font-bold">✓</div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-zinc-200">Grievance Logged!</p>
                  <p className="text-[10px] text-zinc-500 mt-1 leading-relaxed">System rows modified successfully. Access the emergency chat stream to contact representatives.</p>
                </div>
                
                <a
                  href={finalWhatsappUrl}
                  onClick={resetModalFormState}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black uppercase tracking-widest shadow-lg transition transform active:scale-95 cursor-pointer"
                >
                  🚀 Route WhatsApp Chat
                </a>
              </div>
            )}
          </div>
        </div>
      )} 

      {/* Custom Scrollbars */}
      <style jsx global>{`
        .style-scrollbar::-webkit-scrollbar {
          width: 5px;
          height: 4px;
        }
        .style-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .style-scrollbar::-webkit-scrollbar-thumb {
          background: #222222;
          border-radius: 20px;
        }
        .style-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #333333;
        }
      `}</style>
    </main>
  );
}