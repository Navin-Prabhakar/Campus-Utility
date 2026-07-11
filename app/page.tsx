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
  isReserved?: boolean;
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

  // Universal Search System States
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
      setAccessDeniedMessage("Birthday viewer is accessible to developer only.");
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

  // Effect 1: Core Dashboard Initializer & Global Multi-Page Background Pre-fetcher
  useEffect(() => {
    const CACHE_KEY = "swb_home_upcoming_buses_cache";

    async function getNextFourBuses() {
      try {
        setLoading(true);
        setError(false);

        // 1. Instantly pull up local text cache to beat network latency
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              setUpcomingBuses(parsedCache);
              setLoading(false); // Disable core layout spinner instantly
            }
          } catch (e) {
            console.error("Failed to parse local upcoming buses cache string", e);
          }
        }

        const response = await fetch(GOOGLE_SHEET_CSV_URL);
        if (!response.ok) throw new Error("Network response failed");
        
        const csvText = await response.text();

        Papa.parse(csvText, {
          download: false,
          header: false,
          skipEmptyLines: false,
          complete: (results) => {
            const rows = results.data as string[][];

            if (!rows || rows.length < 20) {
              if (!localStorage.getItem(CACHE_KEY)) {
                setError(true);
              }
              setLoading(false);
              return;
            }

            const busColumns = [0, 4, 8, 12, 16, 20, 24, 28];
            
            const currentDay = new Date().getDay(); 
            const isWeekend = currentDay === 0 || currentDay === 6;
            
            const now = new Date();
            const currentMinutes = now.getHours() * 60 + now.getMinutes();

            const cleanAndExtractTime = (str: string): string | null => {
              if (!str) return null;
              const match = str.trim().match(/\b\d{1,2}\s*:\s*\d{2}\b/);
              return match ? match[0].replace(/\s+/g, "") : null;
            };

            const parseTimeToMinutes = (timeString: string) => {
              const cleaned = timeString.trim();
              const match = cleaned.match(/(\d{1,2})\s*:\s*(\d{2})/);
              if (!match) return 0;
              const hours = parseInt(match[1], 10);
              const minutes = parseInt(match[2], 10);
              return hours * 60 + minutes;
            };

            const parseContact = (rawContact: string): string => {
              let contact = "N/A";
              const cleanDigits = rawContact.replace(/\D/g, "");
              if (cleanDigits.length >= 10) {
                contact = cleanDigits.slice(-10);
              }
              return contact;
            };

            const allParsedBusesCollector: Next4BusItem[] = [];

            busColumns.forEach((colIndex) => {
              let rawBusName = "";
              let rawWeekdayContact = "";
              let rawWeekendContact = "";

              // Gather Bus Name & Weekdays Contact (Rows 0 to 40)
              for (let i = 0; i < 40; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();
                
                if (cellLower.startsWith("bus") || cellLower.startsWith("institute")) {
                  rawBusName = cellVal;
                } else if (cellLower.includes("contact") || (i === 18 && cellVal !== "" && /\d+/.test(cellVal))) {
                  rawWeekdayContact = cellVal;
                }
              }

              // Gather Weekend Specific Contact (Rows 73 to 75)
              for (let i = 73; i <= 75; i++) {
                const cellVal = rows[i]?.[colIndex]?.trim() || "";
                const cellLower = cellVal.toLowerCase();

                if (cellLower.includes("contact") || (i === 75 && cellVal !== "" && /\d+/.test(cellVal))) {
                  rawWeekendContact = cellVal;
                }
              }

              if (!rawBusName) {
                rawBusName = `Bus ${Math.floor(colIndex / 4) + 1}`;
              }

              let busName = rawBusName;
              if (busName.includes("-")) {
                busName = busName.split("-")[0].trim();
              }
              
              const cleanContact = parseContact(isWeekend ? rawWeekendContact : rawWeekdayContact);

              const startRow = isWeekend ? 66 : 37;
              const endRow = isWeekend ? rows.length : 61;

              for (let i = startRow; i < endRow; i++) {
                const cellVal = rows[i]?.[colIndex] || "";
                
                if (cellVal.toLowerCase().includes("note")) {
                  break;
                }

                const time = cleanAndExtractTime(cellVal);
                if (time) {
                  let from = rows[i]?.[colIndex + 1]?.trim() || "";
                  let to = rows[i]?.[colIndex + 2]?.trim() || "";
                  const reserveCheck = rows[i]?.[colIndex + 3]?.trim().toLowerCase() || "";
                  
                  if (!from || from === "" || from.toLowerCase().includes("route")) from = "Campus";
                  if (!to || to === "" || to.toLowerCase().includes("route")) to = "Campus";

                  allParsedBusesCollector.push({
                    id: `${isWeekend ? "wknd" : "wkdy"}-${colIndex}-${i}`,
                    name: busName,
                    route: `${from} ➔ ${to}`,
                    time,
                    contact: cleanContact !== "N/A" ? cleanContact : undefined,
                    isReserved: reserveCheck.includes("reserve")
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

            let finalNext4: Next4BusItem[] = [];
            if (sortedBuses.length === 0) {
              const earlyMorningBuses = allParsedBusesCollector.sort(
                (a, b) => parseTimeToMinutes(a.time) - parseTimeToMinutes(b.time)
              );
              finalNext4 = earlyMorningBuses.slice(0, 4);
            } else {
              finalNext4 = sortedBuses.slice(0, 4);
            }

            // 2. Deep comparison: Update layout structure only if data metrics changed
            const serializedData = JSON.stringify(finalNext4);
            if (serializedData !== localStorage.getItem(CACHE_KEY)) {
              setUpcomingBuses(finalNext4);
              localStorage.setItem(CACHE_KEY, serializedData);
            }
            
            setLoading(false);
          },
          error: () => {
            if (!localStorage.getItem(CACHE_KEY)) {
              setError(true);
            }
            setLoading(false);
          }
        });

      } catch (err) {
        if (!localStorage.getItem(CACHE_KEY)) {
          setError(true);
        }
        setLoading(false);
      }
    }

    getNextFourBuses();

    // 2. Silent background pipeline sync sequence targeting down-stream app sections
    if (typeof window !== "undefined" && navigator.onLine) {
      const syncAllAppDataInBackground = async () => {
        try {
          // --- Full Bus Matrix Sync ---
          Papa.parse(GOOGLE_SHEET_CSV_URL, {
            download: true,
            header: false,
            skipEmptyLines: false,
            complete: (results) => {
              const parsedRows = results.data as string[][];
              if (!parsedRows || parsedRows.length < 20) return;

              const busColumns = [0, 4, 8, 12, 16, 20, 24, 28];
              const parsedBusesData: any[] = [];

              const cleanAndExtractTime = (str: string): string | null => {
                if (!str) return null;
                const match = str.trim().match(/\b\d{1,2}\s*:\s*\d{2}\b/);
                return match ? match[0].replace(/\s+/g, "") : null;
              };

              const parseContact = (rawContact: string): string => {
                let contact = "N/A";
                const cleanDigits = rawContact.replace(/\D/g, "");
                if (cleanDigits.length >= 10) contact = cleanDigits.slice(-10);
                return contact;
              };

              const parseDriverName = (rawDriver: string): string => {
                return rawDriver
                  .replace(/Driver\s*-\s*/i, "")
                  .replace(/Conductor\s*-\s*/i, "")
                  .replace(/Conductor\s*/i, "")
                  .trim() || "SWB Assigned Staff";
              };

              busColumns.forEach((colIndex) => {
                let rawBusName = "";
                let rawWeekdayDriver = "SWB Assigned Staff";
                let rawWeekdayContact = "";
                let rawWeekendDriver = "SWB Assigned Staff";
                let rawWeekendContact = "";

                for (let i = 0; i < 40; i++) {
                  const cellVal = parsedRows[i]?.[colIndex]?.trim() || "";
                  const cellLower = cellVal.toLowerCase();
                  if (cellLower.startsWith("bus") || cellLower.startsWith("institute")) {
                    rawBusName = cellVal;
                  } else if (cellLower.includes("driver") || cellLower.includes("conductor") || (i === 17 && cellVal !== "" && !cellLower.includes("contact"))) {
                    rawWeekdayDriver = cellVal; 
                  } else if (cellLower.includes("contact") || (i === 18 && cellVal !== "" && /\d+/.test(cellVal))) {
                    rawWeekdayContact = cellVal;
                  }
                }

                for (let i = 73; i <= 75; i++) {
                  const cellVal = parsedRows[i]?.[colIndex]?.trim() || "";
                  const cellLower = cellVal.toLowerCase();
                  if (cellLower.includes("driver") || cellLower.includes("conductor") || (i === 74 && cellVal !== "" && !cellLower.includes("contact"))) {
                    rawWeekendDriver = cellVal;
                  } else if (cellLower.includes("contact") || (i === 75 && cellVal !== "" && /\d+/.test(cellVal))) {
                    rawWeekendContact = cellVal;
                  }
                }

                if (!rawBusName) rawBusName = `Bus ${Math.floor(colIndex / 4) + 1}`;

                let busName = rawBusName;
                let busNumber = "";
                if (busName.includes("-")) {
                  const parts = busName.split("-");
                  busName = parts[0].trim();
                  busNumber = parts[1]?.replace(/[()]/g, "").trim() || "";
                }

                const weekdaysSchedule: any[] = [];
                for (let i = 37; i <= 60; i++) {
                  const time = cleanAndExtractTime(parsedRows[i]?.[colIndex] || "");
                  if (time) {
                    const reserveCheck = parsedRows[i]?.[colIndex + 3]?.trim().toLowerCase() || "";
                    weekdaysSchedule.push({
                      time,
                      from: parsedRows[i]?.[colIndex + 1]?.trim() || "Campus",
                      to: parsedRows[i]?.[colIndex + 2]?.trim() || "Campus",
                      isReserved: reserveCheck.includes("reserve")
                    });
                  }
                }

                const weekendsSchedule: any[] = [];
                for (let i = 66; i < parsedRows.length; i++) {
                  const cellVal = parsedRows[i]?.[colIndex] || "";
                  if (cellVal.toLowerCase().includes("note")) break;

                  const time = cleanAndExtractTime(cellVal);
                  if (time) {
                    let from = parsedRows[i]?.[colIndex + 1]?.trim() || "";
                    let to = parsedRows[i]?.[colIndex + 2]?.trim() || "";
                    const reserveCheck = parsedRows[i]?.[colIndex + 3]?.trim().toLowerCase() || "";

                    if (!from || from === "" || from.toLowerCase().includes("route")) from = "Campus";
                    if (!to || to === "" || to.toLowerCase().includes("route")) to = "Campus";

                    weekendsSchedule.push({ time, from, to, isReserved: reserveCheck.includes("reserve") });
                  }
                }

                parsedBusesData.push({
                  busName,
                  busNumber,
                  weekdayDriverInfo: parseDriverName(rawWeekdayDriver),
                  weekdayContact: parseContact(rawWeekdayContact),
                  weekendDriverInfo: parseDriverName(rawWeekendDriver),
                  weekendContact: parseContact(rawWeekendContact),
                  weekdaysSchedule,
                  weekendsSchedule
                });
              });

              const serializedBusData = JSON.stringify(parsedBusesData);
              if (serializedBusData !== localStorage.getItem("swb_bus_schedule_cache")) {
                localStorage.setItem("swb_bus_schedule_cache", serializedBusData);
              }
            }
          });

          // --- All Hostel Mess Layout Sync ---
          const MASTER_MESS_SPREADSHEET_ID = "19T-kfoZVs5eEn_ADqvXUWKQW1KfQsnF0Fiau5bckllk";
          const MESS_GIDS = ["0", "1633328713", "1524747018", "754990639", "491167474", "1461673664", "477079361"];
          const MESS_IDS = ["mess1", "mess2", "mess3", "mess4", "mess5", "mess6", "mess7"];

          MESS_GIDS.forEach((gid, index) => {
            const MESS_URL = `https://docs.google.com/spreadsheets/d/${MASTER_MESS_SPREADSHEET_ID}/export?format=csv&gid=${gid}`;
            Papa.parse(MESS_URL, {
              download: true,
              header: false,
              skipEmptyLines: true,
              complete: (messResults) => {
                const mRows = messResults.data as string[][];
                if (!mRows || mRows.length < 4) return;

                let extractedNotice = "";
                if (mRows[14] && mRows[14][1]) extractedNotice = mRows[14][1].trim();

                const headers = mRows[2].map(h => h.trim().toUpperCase());
                const weekdayIdx = headers.indexOf("WEEKDAY");
                const breakfastIdx = headers.indexOf("BREAKFAST");
                const lunchIdx = headers.indexOf("LUNCH");
                const snacksIdx = headers.indexOf("SNACKS");
                const dinnerIdx = headers.indexOf("DINNER");
                const dessertIdx = headers.indexOf("DESSERT");

                if (weekdayIdx === -1 || breakfastIdx === -1 || lunchIdx === -1) return;

                const parsedMenu: any[] = [];
                let tempEverydayMenu: any = null;

                for (let i = 3; i < Math.min(mRows.length, 14); i++) {
                  const row = mRows[i];
                  const dayName = row[weekdayIdx]?.trim() || "";
                  if (!dayName) continue;

                  const itemPayload = {
                    Day: dayName,
                    Breakfast: row[breakfastIdx]?.trim() || "—",
                    Lunch: row[lunchIdx]?.trim() || "—",
                    Snacks: row[snacksIdx]?.trim() || "—",
                    Dinner: row[dinnerIdx]?.trim() || "—",
                    Dessert: dessertIdx !== -1 ? (row[dessertIdx]?.trim() || "—") : "—"
                  };

                  if (dayName.toUpperCase() === "EVERYDAY") {
                    tempEverydayMenu = itemPayload;
                  } else {
                    parsedMenu.push(itemPayload);
                  }
                }

                if (parsedMenu.length > 0) {
                  const cachePayload = { menuData: parsedMenu, everydayMenu: tempEverydayMenu, liveNotice: extractedNotice };
                  const serializedMessData = JSON.stringify(cachePayload);
                  const currentMessCacheKey = `swb_mess_cache_${MESS_IDS[index]}`;
                  if (serializedMessData !== localStorage.getItem(currentMessCacheKey)) {
                    localStorage.setItem(currentMessCacheKey, serializedMessData);
                  }
                }
              }
            });
          });

          // --- Marketplace Store Items Sync ---
          const STORE_SHEET = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=263432444";
          const storeResponse = await fetch(STORE_SHEET);
          if (storeResponse.ok) {
            const storeCsvText = await storeResponse.text();
            Papa.parse(storeCsvText, {
              download: false,
              header: true,
              skipEmptyLines: true,
              complete: (storeResults) => {
                const records = storeResults.data as any[];
                const cleanParsedItems: any[] = [];

                records.forEach((row, idx) => {
                  const itemName = row["Items you want to sell"] || row["Items you want to sell\u00a0"] || row["Items you want to sell "] || "";
                  if (!itemName) return;

                  const rawUrl = row["Reference picture (if you to sell multiple items then attach a pdf)"] || "";
                  let cleanPictureUrl = "";

                  if (rawUrl && typeof rawUrl === "string") {
                    const trimmedUrl = rawUrl.trim();
                    if (trimmedUrl.includes("drive.google.com")) {
                      const match = trimmedUrl.match(/id=([^&]+)|\/d\/([^/]+)/);
                      const imageId = match ? (match[1] || match[2]) : null;
                      if (imageId) cleanPictureUrl = `https://images.weserv.nl/?url=https://drive.google.com/uc?id=${imageId}`;
                    } else if (trimmedUrl.startsWith("http")) {
                      cleanPictureUrl = trimmedUrl;
                    }
                  }

                  const rawTimestamp = row["Timestamp"] || "";
                  let displayDate = "Unknown Date";

                  if (rawTimestamp) {
                    const dateMatch = rawTimestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                    if (dateMatch) {
                      const [, month, day, year] = dateMatch;
                      displayDate = `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`;
                    } else {
                      const datePart = rawTimestamp.split(" ")[0];
                      if (datePart) displayDate = datePart;
                    }
                  }

                  cleanParsedItems.push({
                    id: `item-${idx}-${rawTimestamp || "time"}`,
                    timestamp: rawTimestamp,
                    formattedDate: displayDate,
                    email: row["Email Address"] || "",
                    sellerName: row["Name"] || "Anonymous",
                    rollNo: row["Roll no."] || "N/A",
                    phone: row["Phone no."] || "N/A",
                    status: row["Current status"] || "Available",
                    itemName: itemName.trim(),
                    picture: cleanPictureUrl,
                    price: row["Any comments."] || row["Any comments"] || "Contact Seller",
                  });
                });

                const serializedStoreData = JSON.stringify(cleanParsedItems);
                if (serializedStoreData !== localStorage.getItem("swb_store_marketplace_cache")) {
                  localStorage.setItem("swb_store_marketplace_cache", serializedStoreData);
                }
              }
            });
          }

          // --- NEW: Global Notices Cohorts Matrix Sync ---
          const NOTICE_BASE_URL = "https://docs.google.com/spreadsheets/d/1o3ZTVhnP9_xjzkEtMmKd6JFh-cznagwsCTIAAlAFBZ0/export?format=csv&gid=";
          const NOTICE_COHORTS = [
            { gid: "0", key: "universal" },
            { gid: "621207693", key: "freshers" },
            { gid: "2119507775", key: "sophomores" },
            { gid: "1930386959", key: "juniors" },
            { gid: "1844437553", key: "seniors" }
          ];

          const cachedNoticesMap: Record<string, any[]> = {};

          await Promise.all(
            NOTICE_COHORTS.map(async ({ gid, key }) => {
              try {
                const res = await fetch(`${NOTICE_BASE_URL}${gid}`);
                if (!res.ok) return;
                const rawText = await res.text();
                
                const lines = rawText.split("\n");
                const cleanCsvText = lines.slice(1).join("\n");

                return new Promise<void>((resolve) => {
                  Papa.parse(cleanCsvText, {
                    header: true,
                    skipEmptyLines: true,
                    complete: (noticeResults) => {
                      const nRows = noticeResults.data as any[];
                      const compiledRows: any[] = [];
                      
                      nRows.forEach((row) => {
                        const title = (row["Title"] || row["Tittle"] || row["tittle"] || row["title"] || "").trim();
                        const description = (row["Description"] || row["description"] || "").trim();
                        if (!title && !description) return;

                        compiledRows.push({
                          title,
                          description,
                          date: (row["Date (dd/mm/yyyy)"] || row["Date"] || row["date"] || "").trim(),
                          author: (row["Author"] || row["author"] || "Admin").trim(),
                          phone: (row["Phone No."] || row["phone"] || row["Phone"] || "").trim(),
                          targetBranch: (row["Target Branch"] || row["Target Audience"] || row["target audience"] || "").trim()
                        });
                      });
                      
                      cachedNoticesMap[key] = compiledRows;
                      resolve();
                    },
                    error: () => resolve()
                  });
                });
              } catch (e) {
                console.error(`Failed loading target notice network stream: ${gid}`, e);
              }
            })
          );

          if (Object.keys(cachedNoticesMap).length > 0) {
            const serializedNoticeData = JSON.stringify(cachedNoticesMap);
            if (serializedNoticeData !== localStorage.getItem("swb_global_notices_raw_map")) {
              localStorage.setItem("swb_global_notices_raw_map", serializedNoticeData);
            }
          }

        } catch (error) {
          console.error("SWB Global Sync Error:", error);
        }
      };

      const syncTimeout = setTimeout(syncAllAppDataInBackground, 2500);
      return () => clearTimeout(syncTimeout);
    }
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
              {loading && upcomingBuses.length === 0 ? (
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
                    className="flex items-center justify-between rounded-xl border border-zinc-700 bg-slate-800 px-2 py-2 gap-3"
                  >
                    <div className="flex flex-col min-w-0 flex-1">
                      <span className="truncate text-[14px] font-black text-white leading-tight">
                        {bus.name}
                      </span>
                      <span className="truncate text-[11px] text-zinc-200 mt-1.5 font-bold tracking-tight flex items-center gap-1.5">
                        {bus.isReserved && (
                          <span className="text-[9px] bg-rose-500/20 text-rose-400 px-1 py-0.2 rounded font-mono font-bold uppercase tracking-wide shrink-0 border border-rose-500/30">
                            Reserved
                          </span>
                        )}
                        <span>{bus.route}</span>
                      </span>
                    </div>
                    
                    <div className="flex flex-col items-end shrink-0 gap-1">
                      <span className="font-mono text-[13px] font-extrabold text-yellow-500 bg-amber-200/20 border border-amber-500/20 px-2 py-0.5 rounded-lg shadow-xs leading-none">
                        {bus.time}
                      </span>
                      {bus.contact ? (
                        <a 
                          href={`tel:${bus.contact}`}
                          className="text-[11px] bg-emerald-500/20 hover:bg-emerald-500/40 text-emerald-500 px-1 py-0.5 rounded-xl border border-emerald-500/40 font-mono tracking-tight transition-all duration-150 flex items-center gap-0.5"
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

      <button
        onClick={() => setShowReportModal(true)}
        className="fixed right-3 bottom-18 h-12 w-12 bg-gradient-to-tl from-red-600 to-purple-700/90 hover:from-violet-700 hover:to-pink-700 text-white flex items-center justify-center rounded-full font-black active:scale-90 transition-all duration-150 cursor-pointer text-base z-[90] select-none"
        title="Open Report System"
      >
        ⚠️
      </button>

      <div className="w-full flex justify-center py-2 pb-15 shrink-0 z-10 relative select-none">
        <button
          onClick={() => {
            setAccessDeniedMessage("");
            setShowBirthdayPanel(false);
            setBirthdayList([]);
            setShowDevModal(true);
          }}
          className="text-[10px] font-black tracking-wide text-zinc-400/70 hover:text-white transition-colors cursor-pointer py-1 px-4 rounded-xl hover:bg-white/10"
        >
          Developer Info...
        </button>
      </div>

      {showDevModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 z-[100] animate-in fade-in duration-150">
          <div className="bg-gradient-to-t from-slate-700/90 to-slate-950 rounded-2xl p-3 w-full max-w-[280px] shadow-2xl border border-zinc-800 flex flex-col items-center relative transform overflow-hidden">
            
            {accessDeniedMessage && (
              <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[92%] z-50 rounded-xl bg-rose-950 border border-rose-500 text-center text-[10px] font-black uppercase tracking-wider text-rose-200 px-2.5 py-2 shadow-2xl animate-pulse">
                ⚠️ {accessDeniedMessage}
              </div>
            )}

            <button 
              onClick={() => setShowDevModal(false)}
              className="absolute top-3 right-4 text-zinc-400 hover:text-red-600/90 text-sm font-black transition-colors cursor-pointer z-40"
              aria-label="Close layout panel"
            >
              ✕
            </button>

            <button
              onClick={handleBirthdayClick}
              className={`mb-3 mr-30 flex h-9 w-9 items-center justify-center rounded-2xl text-2xl border transition-all hover:scale-110 active:scale-95 duration-200 cursor-pointer select-none ${
                showBirthdayPanel ? 'bg-rose-600/30 border-rose-500/30 text-white' : 'bg-zinc-800 border-zinc-700 text-white'
              }`}
              title="Toggle Student Finder"
            >
              🎂
            </button>

            <div className="w-50 h-56 relative rounded-2xl overflow-hidden bg-purple-900/60 mb-3 border border-zinc-700/80 shadow-inner">
              <img 
                src="/dev-avatar.png" 
                alt="Developer's Profile"
                className="w-full h-full object-cover opacity-85"
              />
            </div>

            <h3 className="text-sm font-black text-zinc-100 tracking-wide mb-0">~Prabhakar</h3>
            <p className="text-[9px] text-zinc-400 font-mono font-black uppercase tracking-wider mb-2.5">2503AI02</p>

            <div className="w-full border-t border-zinc-950" />

            <div className="flex items-center gap-5 mt-2 mb-1 select-none">
              <a 
                href="https://github.com/Navin-Prabhakar" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-zinc-600 hover:bg-zinc-900 text-zinc-100 hover:text-white border border-zinc-500 rounded-xl transition-all shadow-md active:scale-90 hover:scale-110"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.17 6.839 9.49.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.464-1.11-1.464-.908-.62.069-.061.069-.061 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.579.688.481C19.138 20.167 22 16.418 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
              </a>

              <a 
                href="https://www.linkedin.com/in/navin-prabhakar-5b5070388/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-blue-600 hover:bg-blue-700 text-blue-100 hover:text-white/90 border border-zinc-500 rounded-xl transition-all shadow-md active:scale-90 hover:scale-110"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
                </svg>
              </a>

              <a 
                href="https://instagram.com/prabhakar_2201" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="p-2 bg-pink-600 hover:bg-pink-700/90 text-zinc-100 hover:text-white border border-zinc-500 rounded-xl transition-all shadow-md active:scale-90 hover:scale-110"
              >
                <svg className="h-6 w-6 fill-current" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.051.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                </svg>
              </a>
            </div>

            {showBirthdayPanel && isDeveloper && (
              <div className="mt-2 w-full rounded-xl bg-black p-3 border border-zinc-800 text-left animate-in fade-in zoom-in-95 duration-150">
                
                <div className="flex items-center justify-between border-b border-zinc-700 pb-1 mb-2">
                  <h4 className="text-[14px] font-black tracking- text-zinc-300">🔍 Student's DOB Finder</h4>
                </div>

                <div className="flex gap-2 mb-3">
                  <input
                    type="text"
                    placeholder="Search Name/Roll No."
                    id="universalSearchInput"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        executeSearchQuery((e.target as HTMLInputElement).value);
                      }
                    }}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1.5 text-[12px] text-white placeholder-zinc-500 font-medium outline-hidden focus:border-zinc-700 shadow-inner"
                  />
                  <button
                    onClick={() => {
                      const inputEl = document.getElementById("universalSearchInput") as HTMLInputElement;
                      executeSearchQuery(inputEl?.value || "");
                    }}
                    className="bg-green-700/90 hover:bg-green-600 border border-zinc-700 text-[10px] px-3 rounded-lg font-black text-white transition active:scale-95 cursor-pointer"
                  >
                    {fetchingBirthdays ? "⏳" : "Go"}
                  </button>
                </div>

                <div className="max-h-36 overflow-y-auto style-scrollbar">
                  {birthdayList.length === 0 ? (
                    <p className="text-[10px] text-zinc-600 text-center py-4 font-medium italic">
                      {fetchingBirthdays ? "Querying isolated table matrices..." : "Awaiting parameter inputs..."}
                    </p>
                  ) : (
                    <ul className="space-y-1.5">
                      {birthdayList.map((student: any, idx: number) => (
                        <li key={idx} className="flex flex-col rounded-xl bg-[#121212]/80 p-2 border border-zinc-900 text-[10px]">
                          <div className="flex justify-between items-start gap-2">
                            <span className="font-black text-zinc-200 truncate">{student.name}</span>
                            <span className="text-[11px] font-mono font-black text-amber-500 shrink-0 bg-amber-500/5 border border-amber-500/10 px-1 rounded">{student.birthday}</span>
                          </div>
                          <div className="flex justify-between items-center text-[10px] font-mono font-bold text-zinc-500 uppercase mt-1 pt-1 border-t border-zinc-900/40">
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
    </div>
  );
}