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
    <main className="h-full w-full bg-zinc-950 bg-gradient-to-bl from-slate-700/20 to-violet-700/20 font-sans text-zinc-300 antialiased flex flex-col justify-between relative overflow-hidden selection:bg-zinc-800 selection:text-white">
      
      {/* Sticky Control and Selection Bar Sitting Safely Below Global Header Layout */}
      <div className="w-full shrink-0 z-30 flex flex-col items-center">
        {/* Adjusted this container to add gap-3 spacing between your elements */}
        <div className="w-full max-w-[365px] pt-21 pr-1.5  pb-0 flex justify-end items-center gap-3 relative">
          {selectedMess && (
            <div className="pl-0.5 pr-0 rounded-xl bg-transparent p-1.5 shrink-0 flex flex-col items-center gap-1 select-none">
              <a 
                href={GOOGLE_SHEET_BROWSER_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="px-1  text-[13px] font-black font-normal tracking-normal text-yellow-500/80 hover:text-blue-600 uppercase transition-colors"
              >
                <u>Update Mess Menu</u>↗
              </a>
            </div>
          )}
          <div className="relative">
            {/* --- Main Trigger Button with Nestled Checkbox --- */}
            <div className="h-8 pl-1.5 pr-1.5 bg-zinc-700 hover:bg-zinc-800 text-zinc-200 hover:text-white transition-colors rounded-xl flex items-center gap-1 border border-zinc-600 shadow-md">
              
              {/* Inner Checkbox Wrapper */}
              <div 
                className="flex items-center gap-1 border-r border-zinc-600/80 pr-1.5 h-full"
                onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()} // Stops dropdown from toggling when clicking checkbox area
              >
                <button
                  onClick={() => handleDefaultToggle(!isDefaultChecked)}
                  title="Toggle Always Load by Default"
                  className={`h-6 w-6 rounded-xl border flex items-center justify-center transition-all transform active:scale-[0.85] hover:scale-[105%] ${
                    isDefaultChecked 
                      ? "bg-black border-blue-600/90 animate-pulse text-green-500" 
                      : "bg-emerald-600/70 border-zinc-800 text-transparent"
                  }`}
                >
                  <span className="text-[14px] font-black leading-none select-none">✓</span>
                </button>
                
              </div>

              {/* Dropdown Toggle Target */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-1.5 text-[12px] font-black tracking-wide uppercase h-full active:scale-95 transform transition-transform"
              >
                <span>{selectedMess ? selectedMess.name : "Select Mess Stream"}</span> ▼
              </button>
            </div>

            {/* --- Dropdown Menu --- */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-0.5 w-34 bg-slate-950 border border-zinc-800 rounded-xl z-50 overflow-hidden divide-y divide-zinc-800 animate-in fade-in zoom-in-105 duration-100">
                {MESS_CONFIG.map((mess) => (
                  <button
                    key={mess.id}
                    onClick={() => {
                      setSelectedMess(mess);
                      const savedId = localStorage.getItem("user-default-mess");
                      setIsDefaultChecked(savedId === mess.id);
                      setIsDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-1.5 rounded-lg text-[13px] font-bold block transition-colors ${
                      selectedMess?.id === mess.id 
                        ? "bg-zinc-800/90 text-[#10B981]" 
                        : "text-zinc-400 hover:bg-[#161616] hover:text-white"
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
      <div className="w-full flex-1 overflow-y-auto flex flex-col items-center pb-18 style-scrollbar">

        {/* Live Notices Layer: Warn Accentuation Rules */}
        {selectedMess && liveNotice && (
          <div className="w-[94%] max-w-[350px] mt-2 p-2 bg-gradient-to-t from-orange-950/10 to-amber-600/20 border border-amber-500/20 rounded-xl text-sm leading-relaxed text-amber-300/90 shadow-md shrink-0 font-medium">
            <b><u>Announcement:</u></b>
            <span className="text-white font-black tracking-wide uppercase block mb-0.5"></span>
              {liveNotice}
          </div>
        )}

        <main className="flex flex-col items-center justify-start py-3 w-[94%] max-w-[350px] space-y-4 flex-grow">
          
          {!selectedMess ? (
            <div className="flex flex-col items-center justify-center pt-28 text-center select-none animate-pulse">
              <span className="text-4xl mb-3 filter grayscale opacity-40">🍛</span>
              <p className="text-sm font-black uppercase tracking-wider text-zinc-500">Deactivated Stream</p>
              <p className="text-[12px] text-zinc-600 mt-1 max-w-[200px] leading-relaxed">Tap the select action button to choose your Mess.</p>
            </div>
          ) : (
            <>
              {/* PRIMARY DAILY SCHEDULING CARD CONTAINER */}
              <div className="w-full rounded-2xl border border-purple-700/40 bg-gradient-to-b from-slate-800 to-black/60 p-2.5 shadow-xl">
                <div className="mb-2 flex items-center justify-between border-b border-zinc-700 pb-1.5 px-1">
                  <div className="flex items-center gap-1.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(16,185,129,0.5)] animate-pulse" />
                    <h2 className="text-[13px] font-black uppercase tracking-wide font-bold text-green-400/80">Live _ Layout</h2>
                  </div>

                  {/* Day Toggler (Depth Clickable Accent Structure) */}
                  <div className="relative">
                    <button
                      onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                      className="text-[12px] bg-[#2A2A2A] hover:bg-[#333333] border border-zinc-700 text-white font-black px-2 py-0.5 rounded-lg uppercase tracking-widest font-mono flex items-center gap-0.5 shadow-sm active:scale-95 transition-all hover:scale-105"
                    >
                      <span>{selectedDay.slice(0, 3)}</span>
                      <span>▼</span>
                    </button>

                    {isDayDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-16 bg-zinc-800 border border-zinc-700 rounded-lg shadow-2xl z-50 overflow-hidden divide-y divide-zinc-950 animate-in fade-in zoom-in-95 duration-100">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setSelectedDay(d);
                              setIsDayDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[12px] font-black font-mono uppercase tracking-wide font-bold transition-colors  ${
                              selectedDay === d ? "bg-[#1A1A1A] text-[#10B981]" : "text-zinc-300 hover:bg-[#161616] hover:text-zinc-200"
                            }`}
                          >
                            {d.slice(0, 3)} {d === currentDay && "🟢"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Individual Plate Schedules Blocks */}
                <div className="flex flex-col gap-1.5 w-full pt-0.5">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="h-12 w-full animate-pulse rounded-xl bg-[#121212] border border-zinc-800" />
                    ))
                  ) : error ? (
                    <div className="py-4 text-center text-[12px] font-black tracking-wide uppercase text-rose-400 bg-rose-950/10 border border-rose-950/30 rounded-xl">{error}</div>
                  ) : todaysMenu ? (
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-col rounded-2xl border border-zinc-600 bg-gradient-to-b from-zinc-800 to-black/30 px-3 py-0">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-widest"><span className="text-xl">☕️ </span>Breakfast</span>
                        <span className="text-[12px] font-black text-zinc-200 mt-0 mb-1 leading-snug font-bold">{todaysMenu.Breakfast || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-600 bg-gradient-to-b from-zinc-800 to-black/30 px-3 py-0">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-widest"><span className="text-xl">🍛</span> Lunch</span>
                        <span className="text-[12px] font-black text-zinc-200 mt-0 mb-1 leading-snug font-bold">{todaysMenu.Lunch || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-600 bg-gradient-to-b from-zinc-800 to-black/30 px-3 py-0">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-widest"><span className="text-xl">🍟 </span>Snacks</span>
                        <span className="text-[12px] font-black text-zinc-200 mt-0 mb-1 leading-snug font-bold">{todaysMenu.Snacks || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-zinc-600 bg-gradient-to-b from-zinc-800 to-black/30 px-3 py-0">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-widest"><span className="text-xl">🍱 </span>Dinner</span>
                        <span className="text-[12px] font-black text-zinc-200 mt-0 mb-1 qleading-snug font-bold">{todaysMenu.Dinner || "—"}</span>
                      </div>
                      <div className="flex flex-col rounded-xl border border-pink-500/50 bg-gradient-to-b from-zinc-800 to-black/35 px-3 py-0">
                        <span className="text-[11px] font-black text-pink-500 uppercase tracking-widest"><span className="text-xl">🍧</span> Dessert</span>
                        <span className="text-[12px] font-black text-zinc-200 mt-1 mb-1 leading-snug font-bold">{todaysMenu.Dessert || "—"}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-zinc-600 font-medium italic">No listings registered for this index target.</div>
                  )}
                </div>
              </div>

              <div className="w-full rounded-2xl border border-zinc-600 bg-gradient-to-tl from-black/40 to-sky-400/20 p-3 pt-2 shadow-xl">
                <div className="mb-2 flex items-center gap-1 border-b border-zinc-600 pb-1.5 px-1">
                  <span className="text-xs">🔄</span>
                  <h2 className="text-[12px] font-black uppercase tracking-wider text-amber-500">
                    Everyday Constants
                  </h2>
                </div>

                <div className="flex flex-col gap-1.5 w-full">
                  {loading ? (
                    <div className="h-16 w-full animate-pulse rounded-xl bg-[#121212]" />
                  ) : everydayMenu ? (
                    <div className="grid grid-cols-2 gap-2">
                      <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-700/80 to-black/40 p-2 flex flex-col">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-wider">☕️ Breakfast</span>
                        <span className="text-[10px] font-bold text-zinc-200 mt-0.5 leading-tight">{everydayMenu.Breakfast}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-700/80 to-black/40 p-2 flex flex-col">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-wider">🍛 Lunch</span>
                        <span className="text-[10px] font-bold text-zinc-200 mt-0.5 leading-tight">{everydayMenu.Lunch}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-700/80 to-black/40 p-2 flex flex-col">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-wider">🍟 Snacks</span>
                        <span className="text-[10px] font-bold text-zinc-200 mt-0.5 leading-tight">{everydayMenu.Snacks}</span>
                      </div>
                      <div className="rounded-xl border border-zinc-900 bg-gradient-to-br from-zinc-700/80 to-black/40 p-2 flex flex-col">
                        <span className="text-[11px] font-black text-purple-500 uppercase tracking-wider">🍱 Dinner</span>
                        <span className="text-[10px] font-bold text-zinc-200 mt-0.5 leading-tight">{everydayMenu.Dinner}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] text-zinc-600 font-medium italic">No standard elements mapping configured.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/*  Spreadsheets links built specifically using structural Blue design guidelines */}
       
        {selectedMess && (
          <div className="w-full bg-transparent pt-2 pb-5 shrink-0 flex flex-col items-center gap-2 select-none">
           
            <a 
              href={COMPLAINT_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-black uppercase tracking-wider text-rose-400 hover:text-pink-500 transition-colors"
            >
              🔗 <u>Review Complaint Sheets</u> ↗
            </a>
          </div>
        )}
      </div>

       {/*complain button */}
      {selectedMess && (
        <button
          onClick={() => setIsComplaintOpen(true)}
          className="fixed bottom-22 right-3 h-13 w-13 rounded-full bg-gradient-to-t from-pink-700 to-blue-600 hover:from-rose-700 hover:to-indigo-600 text-white font-bold flex flex-col items-center justify-center  border border-slate-900 z-50 cursor-pointer transition transform active:scale-90 select-none"
        >
          <span className="text-base leading-none text-xl">🤬</span> 
          <svg viewBox="0 3 100 20" className="w-full h-4 mt-0 pointer-events-none fill-white font-black select-none">
            <defs>
              <path id="smileTextPath" d="M 10,8 Q 50,28 90,8" />
            </defs>
            <text className="text-[15px] tracking-wide uppercase">
              <textPath href="#smileTextPath" startOffset="50%" textAnchor="middle">
                Complain
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

    </main>
  );
}