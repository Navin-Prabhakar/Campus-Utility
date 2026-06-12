"use client";

import React, { useEffect, useState } from "react";
import Papa from "papaparse";
import Header from "../components/Header";
import BottomTabs from "../components/BottomTabs";

interface MenuItem {
  Day: string;
  Breakfast: string;
  Lunch: string;
  Snacks: string;
  Dinner: string;
  Dessert: string;
}

const MESS_CONFIG = [
  { id: "mess1", name: "CVR (4)", gid: "0", contact: "918317731691" }, 
  { id: "mess2", name: "Aryabhatta (5)", gid: "1633328713", contact: "919999999999" }, 
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
const COMPLAINT_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxmvz1KxuSiB6zEUDDjeS_RYt842dXW7GEj01wwIskmshe15JOkMcEHbMkjTtXB3EfFiw/exec";

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
        mode: "no-cors", 
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

  const HeaderDropdownAction = (
    <div className="flex items-center gap-1.5 relative">
      {selectedMess && (
        <button
          onClick={() => handleDefaultToggle(!isDefaultChecked)}
          title="Toggle Always Load by Default"
          className={`h-5 w-5 rounded-md border flex items-center justify-center transition transform active:scale-90 ${
            isDefaultChecked 
              ? "bg-blue-500 border-blue-600 text-white" 
              : "bg-slate-800/60 border-white/10 text-transparent"
          }`}
        >
          <span className="text-[10px] font-extrabold leading-none select-none">✓</span>
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          className="h-5 px-2 bg-slate-900/40 text-sky-100 hover:text-white transition-colors text-[10px] font-bold rounded-md flex items-center gap-1 border border-white/20 active:scale-95 transform"
        >
          <span>{selectedMess ? selectedMess.name.split(" ")[0] : "All Mess"}</span> ▼
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full mt-1.5 w-44 bg-white border border-zinc-300 rounded-xl shadow-xl z-[60] overflow-hidden divide-y divide-zinc-100">
            {MESS_CONFIG.map((mess) => (
              <button
                key={mess.id}
                onClick={() => {
                  setSelectedMess(mess);
                  const savedId = localStorage.getItem("user-default-mess");
                  setIsDefaultChecked(savedId === mess.id);
                }}
                className={`w-full text-left px-3.5 py-2 text-[11px] font-bold block ${
                  selectedMess?.id === mess.id ? "bg-blue-50 text-blue-600" : "text-zinc-700 hover:bg-zinc-50"
                }`}
              >
                {mess.name}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <main className="h-screen max-h-screen w-full bg-zinc-100 font-sans text-zinc-600 antialiased flex flex-col justify-between relative overflow-hidden">
      
      {/* FIXED AREA: Main Header layout remains pinned */}
      <div className="w-full flex flex-col items-center shrink-0 RegalZIndex bg-zinc-100 shadow-3xs">
        <Header messActionSlot={HeaderDropdownAction} />
      </div>

      {/* SCROLLABLE WRAPPER BODY FRAME CONTAINER */}
      <div className="w-full flex-1 overflow-y-auto px-[0%] flex flex-col items-center pb-4">
        
        {/* UNPINNED LAYER: Mess Indicator Layer inside scroll track */}
        {selectedMess && (
          <div className="w-[96%] max-w-[350px] mt-2 bg-zinc-800 text-zinc-100 rounded-xl py-1 px-4 text-center text-[12px] font-bold tracking-wide shadow-xs shrink-0 select-none border border-zinc-700">
            📍 Viewing <span className="text-sky-300 font-extrabold">{selectedMess.name}</span> Mess Menu
          </div>
        )}

        {/* LIVE DYNAMIC NOTICE BANNER SECTION BOX */}
        {selectedMess && liveNotice && (
          <div className="w-[95%] max-w-[350px] mt-2.5 p-2 bg-amber-50 border border-amber-200 rounded-xl text-[13px] leading-relaxed text-amber-900 shadow-3xs shrink-0">
            <u>{liveNotice}</u>
          </div>
        )}

        <main className="flex flex-col items-center justify-start py-3 w-[95%] max-w-[350px] space-y-3">
          
          {!selectedMess ? (
            <div className="flex flex-col items-center justify-center pt-28 text-center select-none">
              <span className="text-3xl mb-2">🍛</span>
              <p className="text-sm font-semibold text-zinc-700/80 tracking-wide">Choose your mess</p>
              <p className="text-[10px] text-zinc-400 mt-0.5 font-medium">Tap "All Mess" at the top right to start viewing.</p>
            </div>
          ) : (
            <>
              {/* PRIMARY WEEKDAY MENU CONTAINER CARD */}
              <div className="w-full rounded-xl border border-zinc-300 bg-white p-2 shadow-xs">
                <div className="mb-1 flex items-center justify-between border-b border-zinc-500 pb-1 px-1">
                  <div className="flex items-center gap-1">
                    <span className="h-1 w-1 rounded-full bg-red-500 animate-pulse" />
                    <h2 className="text-[10px] font-bold uppercase tracking-wider text-green-500">Today's Layout</h2>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setIsDayDropdownOpen(!isDayDropdownOpen)}
                      className="text-[9px] bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-1.5 py-0.5 rounded uppercase tracking-wider font-mono flex items-center gap-0.5"
                    >
                      <span>{selectedDay.slice(0, 3)}</span>
                      <span>▼</span>
                    </button>

                    {isDayDropdownOpen && (
                      <div className="absolute right-0 mt-1 w-24 bg-white border border-zinc-200 rounded-lg shadow-lg z-50 overflow-hidden divide-y divide-zinc-100">
                        {DAYS_OF_WEEK.map((d) => (
                          <button
                            key={d}
                            onClick={() => {
                              setSelectedDay(d);
                              setIsDayDropdownOpen(false);
                            }}
                            className={`w-full text-left px-2 py-1.5 text-[10px] font-bold font-mono uppercase ${
                              selectedDay === d ? "bg-indigo-50 text-indigo-600" : "text-zinc-600 hover:bg-zinc-50"
                            }`}
                          >
                            {d.slice(0, 3)} {d === currentDay && "•"}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  {loading ? (
                    [...Array(5)].map((_, i) => (
                      <div key={i} className="h-11 w-full animate-pulse rounded-md bg-zinc-200" />
                    ))
                  ) : error ? (
                    <div className="py-2.5 text-center text-[11px] text-red-500 bg-red-50/50 border border-red-100 rounded-lg">{error}</div>
                  ) : todaysMenu ? (
                    <div className="flex flex-col gap-1.5 p-0.5">
                      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-200/30 px-2.5 py-1.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">☕️<u>Breakfast</u></span>
                          <span className="text-[11px] font-bold text-zinc-800 mt-0.5 leading-snug">{todaysMenu.Breakfast || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-200/30 px-2.5 py-1.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider"><u>🍛Lunch</u></span>
                          <span className="text-[11px] font-bold text-zinc-800 mt-0.5 leading-snug">{todaysMenu.Lunch || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-200/30 px-2.5 py-1.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">🍟<u>Snacks</u></span>
                          <span className="text-[11px] font-bold text-zinc-800 mt-0.5 leading-snug">{todaysMenu.Snacks || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-zinc-200 bg-zinc-200/30 px-2.5 py-1.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-blue-600 uppercase tracking-wider">🍱<u>Dinner</u></span>
                          <span className="text-[11px] font-bold text-zinc-800 mt-0.5 leading-snug">{todaysMenu.Dinner || "—"}</span>
                        </div>
                      </div>
                      <div className="flex items-center justify-between rounded-md border border-pink-200 bg-pink-50/40 px-2.5 py-1.5">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-extrabold text-pink-600 uppercase tracking-wider flex items-center gap-0.5">🍧<u>Dessert</u></span>
                          <span className="text-[11px] font-bold text-zinc-800 mt-0.5 leading-snug">{todaysMenu.Dessert || "—"}</span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="py-4 text-center text-[11px] text-zinc-400 italic">No menu matches found for today.</div>
                  )}
                </div>
              </div>

              {/* SECONDARY CARD: EVERYDAY ESSENTIALS STUFF BOX */}
              <div className="w-full rounded-xl border border-amber-300 bg-amber-50/20 p-2 shadow-xs">
                <div className="mb-2 flex items-center gap-1 border-b border-amber-400 pb-1 px-1">
                  <span className="text-xs">🔄</span>
                  <h2 className="text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
                    Everyday Essentials
                  </h2>
                </div>

                <div className="flex flex-col gap-1 w-full">
                  {loading ? (
                    <div className="h-16 w-full animate-pulse rounded-md bg-zinc-200" />
                  ) : everydayMenu ? (
                    <div className="grid grid-cols-2 gap-1 ">
                      <div className="rounded-md border border-zinc-200 bg-white p-1.5 flex flex-col">
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">☕️ Breakfast</span>
                        <span className="text-[10px] font-medium text-zinc-700 mt-0.5 leading-tight">{everydayMenu.Breakfast}</span>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white p-1.5 flex flex-col">
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">🍛 Lunch</span>
                        <span className="text-[10px] font-medium text-zinc-700 mt-0.5 leading-tight">{everydayMenu.Lunch}</span>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white p-1.5 flex flex-col">
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">🍟 Snacks</span>
                        <span className="text-[10px] font-medium text-zinc-700 mt-0.5 leading-tight">{everydayMenu.Snacks}</span>
                      </div>
                      <div className="rounded-md border border-zinc-200 bg-white p-1.5 flex flex-col">
                        <span className="text-[10px] font-extrabold text-amber-700 uppercase tracking-wider">🍱 Dinner</span>
                        <span className="text-[10px] font-medium text-zinc-700 mt-0.5 leading-tight">{everydayMenu.Dinner}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="py-2 text-center text-[10px] text-zinc-400 italic">No standard everyday entries parsed.</div>
                  )}
                </div>
              </div>
            </>
          )}
        </main>

        {/* SCROLLABLE LINKS PREFERENCE CONTAINER: Re-nested safely within the viewport wrapper stream */}
        {selectedMess && (
          <div className="w-full bg-transparent  pb-12 shrink-0 flex flex-col items-center gap-1 select-none">
            <a 
              href={GOOGLE_SHEET_BROWSER_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold tracking-wide text-green-500 hover:text-emerald-600 underline active:scale-95 transition-transform"
            >
              View Full MessMenu Spreadsheet
            </a>
            <a 
              href={COMPLAINT_SPREADSHEET_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[12px] font-bold tracking-wide text-rose-600/80 hover:text-rose-700 underline active:scale-95 transition-transform"
            >
              View Full MessComplaint Spreadsheet
            </a>
          </div>
        )}
      </div>

     {/* FLOATING ACTION ALERTS COMPLAINT BUTTON */}
{selectedMess && (
  <button
    onClick={() => setIsComplaintOpen(true)}
    className="fixed bottom-20 right-4 h-12 w-12 rounded-full bg-gradient-to-br from-blue-600 to-rose-600 text-white font-bold flex flex-col items-center justify-center shadow-[0_4px_10px_rgba(225,29,72,0.4),inset_0_2px_3px_rgba(255,255,255,0.3)] border border-rose-600 z-50 cursor-pointer transition transform active:scale-90"
  >
    {/* Center Siren Emoji */}
    <span className="text-lg leading-none mt-1.5 select-none">🚨</span> 

    {/*  Curve/Smile Text SVG Wrapper */}
    <svg 
      viewBox="0 0 100 40" 
      className="w-full h-5 mt-0.5 pointer-events-none fill-yellow-300 font-bold select-none"
    >
      <defs>
        {/* This defines the downward arc/smile mathematical path shape */}
        <path 
          id="smileTextPath" 
          d="M 10,10 Q 50,32 90,10" 
        />
      </defs>
      <text className="text-[17px] tracking-wide uppercase">
        {/* textAnchor="middle" and startOffset="50%" locks the text right in the dead center of the smile path */}
        <textPath href="#smileTextPath" startOffset="50%" textAnchor="middle">
          complain
        </textPath>
      </text>
    </svg>
  </button>
)}

      {/* COMPLAINT MODAL */}
      {isComplaintOpen && (
        <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-[100] animate-fadeIn">
          <div className="bg-white rounded-2xl p-4 w-full max-w-[320px] shadow-2xl border border-zinc-200 flex flex-col relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={resetModalFormState}
              className="absolute top-2.5 right-3 text-zinc-400 hover:text-zinc-600 text-sm font-bold cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xs font-extrabold uppercase tracking-wider text-red-600 mb-3 flex items-center gap-1">
              <span>🚨</span> File Mess Complaint
            </h3>

            {!isDataLogged ? (
              <form onSubmit={handleLogDataToSheets} className="space-y-2.5">
                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">Full Name</label>
                  <input 
                    type="text" required
                    value={complaintForm.name}
                    onChange={(e) => setComplaintForm({...complaintForm, name: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-[11px] bg-zinc-50 text-zinc-800 font-medium outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">Roll Number</label>
                  <input 
                    type="text" required
                    value={complaintForm.roll}
                    onChange={(e) => setComplaintForm({...complaintForm, roll: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-[11px] bg-zinc-50 text-zinc-800 font-medium outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">Issue Category</label>
                  <select
                    value={complaintForm.category}
                    onChange={(e) => setComplaintForm({...complaintForm, category: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-1.5 py-1 text-[11px] bg-zinc-50 font-bold text-zinc-700 outline-hidden"
                  >
                    <option value="Food Quality">Food Quality / Raw Rice</option>
                    <option value="Hygiene Issue">Hygiene / Insect / Dirt</option>
                    <option value="Shortage of Meals">Shortage of Food Item</option>
                    <option value="Staff Behavior">Catering Staff Behavior</option>
                    <option value="Other">Other Miscellaneous Issue</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">Description</label>
                  <textarea 
                    required rows={3}
                    value={complaintForm.desc}
                    onChange={(e) => setComplaintForm({...complaintForm, desc: e.target.value})}
                    className="w-full border border-zinc-300 rounded-lg px-2 py-1 text-[11px] bg-zinc-50 text-zinc-800 font-medium outline-hidden resize-none"
                    placeholder="Explain the detailed grievance here..."
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold uppercase tracking-wide text-zinc-500 mb-0.5">
                    Photo Evidence ({selectedImages.length}/3)
                  </label>
                  <input 
                    type="file" 
                    accept="image/*" 
                    multiple 
                    onChange={handleImageChange}
                    className="w-full text-[10px] text-zinc-500 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-zinc-800 file:text-white file:cursor-pointer"
                  />

                  {selectedImages.length > 0 && (
                    <div className="mt-2 flex gap-1.5 overflow-x-auto py-1">
                      {selectedImages.map((file, idx) => (
                        <div key={idx} className="relative h-12 w-12 rounded-lg border border-zinc-200 overflow-hidden shrink-0 bg-zinc-50 flex items-center justify-center shadow-3xs">
                          <span className="text-[9px] font-mono font-bold text-zinc-400 truncate max-w-full px-1">
                            📷 Img {idx + 1}
                          </span>
                          <button
                            type="button"
                            onClick={() => setSelectedImages(selectedImages.filter((_, i) => i !== idx))}
                            className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-bold h-3.5 w-3.5 flex items-center justify-center rounded-bl-md shadow-xs active:scale-75 transition-transform"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={submittingComplaint}
                  className="w-full mt-2 py-1.5 bg-zinc-800 text-white rounded-lg text-xs font-bold shadow-xs active:scale-95 transition transform disabled:opacity-50 cursor-pointer"
                >
                  {submittingComplaint ? "Uploading Images & Logging..." : "Continue to Next Step ➔"}
                </button>
              </form>
            ) : (
              <div className="space-y-4 text-center py-4 animate-fadeIn">
                <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto text-base font-bold">✓</div>
                <div>
                  <p className="text-xs font-bold text-zinc-800">Grievance Logged Successfully!</p>
                  <p className="text-[10px] text-zinc-400 mt-0.5">Tap below to open WhatsApp cleanly and alert your mess representative.</p>
                </div>
                
                <a
                  href={finalWhatsappUrl}
                  onClick={resetModalFormState}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full inline-flex items-center justify-center py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold shadow-md transition transform active:scale-95 tracking-wide cursor-pointer"
                >
                  🚀 Open Official WhatsApp Chat
                </a>
              </div>
            )}
          </div>
        </div>
      )} 

      <BottomTabs />
    </main>
  );
}