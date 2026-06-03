"use client";

import React, { useEffect, useState, useRef } from "react";
import Papa from "papaparse";
import Header from "../components/Header";
import BottomTabs from "../components/BottomTabs";

interface SellItem {
  id: string;
  timestamp: string;
  formattedDate: string;
  email: string;
  sellerName: string;
  rollNo: string;
  phone: string;
  status: string;
  itemName: string;
  picture: string;
  price: string;
}

type TabType = "sell_buy" | "lend_borrow" | "lost_found";

const SELL_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=263432444";

export default function StorePage() {
  const [activeTab, setActiveTab] = useState<TabType>("sell_buy");
  const [items, setItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  // Search & Filter Dropdown Core States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  // MANUAL TICK BOX STATES
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [filterNewestItems, setFilterNewestItems] = useState<boolean>(true); 

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchMarketplaceData() {
      try {
        setLoading(true);
        setError(false);

        const response = await fetch(SELL_SHEET_CSV_URL);
        if (!response.ok) throw new Error("Network request failed");
        const csvText = await response.text();

        Papa.parse(csvText, {
          download: false,
          header: true,
          skipEmptyLines: true,
          complete: (results) => {
            const records = results.data as any[];
            const cleanParsedItems: SellItem[] = [];
            
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
                  if (imageId) {
                    cleanPictureUrl = `https://images.weserv.nl/?url=https://drive.google.com/uc?id=${imageId}`;
                  }
                } else if (trimmedUrl.startsWith("http")) {
                  cleanPictureUrl = trimmedUrl;
                }
              }

              const rawTimestamp = row["Timestamp"] || "";
              let displayDate = "Unknown Date";
              
              // 🟢 FIXED: Internal Conversion Engine from MM/DD/YYYY to DD/MM/YYYY
              if (rawTimestamp) {
                // Extracts the numbers from the date block securely
                const dateMatch = rawTimestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                  const [, month, day, year] = dateMatch;
                  // Zero-pads single digits out (e.g., '6' becomes '06')
                  const cleanDay = day.padStart(2, "0");
                  const cleanMonth = month.padStart(2, "0");
                  displayDate = `${cleanDay}/${cleanMonth}/${year}`;
                } else {
                  // Fallback if the timestamp format does not match basic slashes
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

            setItems(cleanParsedItems);
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

    fetchMarketplaceData();
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCardFlip = (id: string) => {
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // LIVE FEED FILTERING & CONDITIONAL SORTING ENGINE
  const filteredAndSortedItems = items
    .filter((item) => {
      const matchQuery = searchQuery.toLowerCase().trim();
      if (matchQuery) {
        const matchesText = 
          item.itemName.toLowerCase().includes(matchQuery) ||
          item.price.toLowerCase().includes(matchQuery) ||
          item.sellerName.toLowerCase().includes(matchQuery);
        if (!matchesText) return false;
      }

      if (filterAvailableOnly) {
        const isSoldOut = item.status.toLowerCase().includes("sold");
        if (isSoldOut) return false;
      }

      return true;
    })
    .sort((a, b) => {
      if (!filterNewestItems) return 0; 
      const timeA = new Date(a.timestamp).getTime() || 0;
      const timeB = new Date(b.timestamp).getTime() || 0;
      return timeB - timeA;
    });

  // 🟢 NEW FEATURE: Click handler to display message before opening the link
  const handleSellButtonClick = () => {
    // Customize your confirmation prompt alert text message here
    alert("1) please write 'Price:___,your other messages'in 'any comments' column.\n \n2) Upload a clear ,cropped picture.\n \n3) Make sure to mark sold out ,once you sold to someone.");
    
    // Smoothly redirect to the form in a fresh window tab
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSdu2XRFTWTWR6rJh9JwM_1ebtn_sDnGS5S4SsnsNRGSW9l6ag/viewform", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 font-sans text-zinc-600 antialiased flex flex-col items-center relative">
      <Header />

      {/* Persistent Sticky Navigation Control Section */}
      <div className="w-full bg-white border-b border-zinc-200 sticky top-0 z-40 flex flex-col items-center shadow-2xs">
        
        {/* Tab Toggle Row */}
        <div className="w-full py-2 px-3 flex justify-center">
          <div className="w-full max-w-sm flex bg-zinc-100 p-1 rounded-lg gap-1 border border-zinc-200/60">
            {["sell_buy", "lend_borrow", "lost_found"].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab as TabType)}
                className={`flex-1 text-center py-1.5 rounded-md text-[11px] font-bold capitalize transition-all ${
                  activeTab === tab ? "bg-zinc-900 text-white shadow-xs" : "text-zinc-500 hover:text-zinc-800"
                }`}
              >
                {tab.replace("_", " / ")}
              </button>
            ))}
          </div>
        </div>

        {/* Search and Filter Dropdown Structure */}
        {activeTab === "sell_buy" && !loading && !error && (
          <div className="w-[94%] max-w-[365px] pb-2 flex gap-2 items-center relative animate-fade-in">
            
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search items, prices, names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-100 border border-zinc-200 rounded-lg py-1.5 pl-7 pr-2 text-[11px] focus:outline-hidden focus:border-zinc-400 font-medium tracking-tight placeholder-zinc-400 text-zinc-800 transition-all"
              />
              <span className="absolute left-2.5 top-2 text-[10px] grayscale opacity-60">🔍</span>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1.5 text-[10px] text-zinc-400 hover:text-zinc-600 font-bold px-1"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-lg py-1.5 px-3 text-[11px] font-bold flex items-center gap-1 shrink-0 transition-all active:scale-95 shadow-3xs ${
                  isDropdownOpen || filterAvailableOnly || !filterNewestItems
                    ? "bg-indigo-700 border-indigo-900 text-white" 
                    : "bg-zinc-50 border-zinc-200 text-zinc-700 hover:border-zinc-300"
                }`}
              >
                <span>Filter</span>
                <span className={`text-[8px] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {isDropdownOpen && (
                <div className="absolute right-0 mt-1.5 w-44 bg-white border border-zinc-200 rounded-xl shadow-lg py-1.5 z-50 flex flex-col text-[11px] font-medium text-zinc-700 animate-fade-in">
                  
                  <div className="px-2.5 py-1 text-[9px] font-bold text-zinc-400 uppercase tracking-wider border-b border-zinc-100 mb-1">
                    Refine Feed
                  </div>

                  <label className="flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-50 cursor-pointer select-none">
                    <span className={filterAvailableOnly ? "font-bold text-zinc-900" : ""}>Available Only</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filterAvailableOnly}
                        onChange={(e) => setFilterAvailableOnly(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-3.5 h-3.5 border border-indigo-900 rounded-sm bg-zinc-50 peer-checked:bg-blue-600 peer-checked:border-zinc-900 flex items-center justify-center transition-all">
                        {filterAvailableOnly && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between px-2.5 py-1.5 hover:bg-zinc-50 cursor-pointer select-none">
                    <span className={filterNewestItems ? "font-bold text-zinc-900" : ""}>Newest Items</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filterNewestItems}
                        onChange={(e) => setFilterNewestItems(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-3.5 h-3.5 border border-indigo-900 rounded-sm bg-zinc-50 peer-checked:bg-blue-600 peer-checked:border-zinc-900 flex items-center justify-center transition-all">
                        {filterNewestItems && <span className="text-white text-[9px] font-bold leading-none">✓</span>}
                      </div>
                    </div>
                  </label>

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* Main Grid Feed Layout Segment */}
      <main className="w-[94%] max-w-[365px] flex flex-col py-3 pb-24 flex-grow">
        
        {loading ? (
          <div className="grid grid-cols-2 gap-2 w-full">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="aspect-[4/5] w-full animate-pulse rounded-lg bg-zinc-200" />
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-red-500 bg-red-50 rounded-lg border border-red-100 font-medium">
            ⚠️ Unable to sync live marketplace records.
          </div>
        ) : activeTab !== "sell_buy" ? (
          <div className="py-12 text-center text-xs text-zinc-400 bg-white border border-zinc-200 rounded-xl p-4">
            🔄 GID connection required. Waiting for data sync...
          </div>
        ) : filteredAndSortedItems.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-400 bg-white border border-zinc-200/60 rounded-xl">
            No items matching your selected filtering options could be found.
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 w-full">
            {filteredAndSortedItems.map((item) => {
              const isSoldOut = item.status.toLowerCase().includes("sold");
              const isFlipped = !!flippedCards[item.id];

              return (
                <div
                  key={item.id}
                  onClick={() => toggleCardFlip(item.id)}
                  className="w-full aspect-[3/4] cursor-pointer [perspective:1000px] select-none"
                >
                  <div
                    className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
                      isFlipped ? "[transform:rotateY(180deg)]" : ""
                    }`}
                  >
                    
                    {/* FRONT OF THE CARD */}
                    <div className="absolute inset-0 w-full h-full rounded-xl border border-zinc-200 bg-white p-1.5 flex flex-col justify-between shadow-2xs [backface-visibility:hidden]">
                      
                      <div className="relative w-full h-[80%] bg-zinc-100 rounded-lg overflow-hidden shrink-0 flex items-center justify-center">
                        {item.picture ? (
                          <img
                            src={item.picture}
                            alt={item.itemName}
                            className={`w-full h-full object-cover transition-all ${isSoldOut ? "grayscale opacity-50" : ""}`}
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                            <span className="text-[14px] text-zinc-400">Image not available. </span>  
                        )
                        
                        }

                        <div className="absolute bottom-1 right-1 bg-black/60 backdrop-blur-xs text-white text-[7px] font-mono font-medium px-1.5 py-0.5 rounded shadow-xs z-10">
                          {item.formattedDate}
                        </div>

                        {isSoldOut && (
                          <div className="absolute top-1 left-1 bg-red-600 text-white text-[8px] uppercase tracking-wider font-extrabold px-1.5 py-0.5 rounded-full shadow-xs z-10">
                            Sold Out
                          </div>
                        )}
                      </div>

                      <div className="flex flex-col flex-grow justify-end pt-2 px-0.5 min-w-0">
                        <h4 className="truncate text-[11px] font-bold text-zinc-800 leading-tight">
                          {item.itemName}
                        </h4>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="truncate text-[10px] font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100/70 px-1 rounded-sm">
                            {item.price}
                          </span>
                        </div>
                      </div>

                    </div>

                    {/* BACK OF THE CARD */}
                    <div className="absolute inset-0 w-full h-full rounded-xl border border-zinc-900 bg-zinc-900 p-2.5 flex flex-col justify-between text-white shadow-md [backface-visibility:hidden] [transform:rotateY(180deg)]">
                      <div className="border-b border-zinc-800 pb-1 flex justify-between items-center shrink-0">
                        <span className="text-[8px] font-bold uppercase tracking-widest text-indigo-400">
                          Seller Contact Info
                        </span>
                        <span className="text-[7px] font-mono text-zinc-500">
                          {item.formattedDate}
                        </span>
                      </div>

                      <div className="flex flex-col gap-1.5 py-1.5 flex-grow min-w-0 justify-center">
                        <div className="min-w-0">
                          <p className="text-[8px] text-zinc-500 uppercase leading-none font-bold">Name</p>
                          <p className="text-[11px] font-bold text-zinc-100 truncate mt-0.5">{item.sellerName}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] text-zinc-500 uppercase leading-none font-bold">Roll No</p>
                          <p className="text-[10px] font-mono font-medium text-zinc-300 truncate mt-0.5">{item.rollNo}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-[8px] text-zinc-500 uppercase leading-none font-bold">Email</p>
                          <p className="text-[10px] font-medium text-zinc-300 truncate mt-0.5">{item.email}</p>
                        </div>
                      </div>

                      <div className="mt-auto shrink-0 bg-zinc-800 rounded-md p-1 border border-zinc-700/50 flex items-center justify-between">
                        <span className="text-[9px] font-mono font-bold text-emerald-400 tracking-wide px-1">
                          📞 {item.phone}
                        </span>
                        <span className="text-[7px] text-zinc-500 font-bold uppercase shrink-0">
                          Tap to flip
                        </span>
                      </div>

                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}

      </main>

      {/* 🛠️ MODIFIED: Replaced direct <a> anchor tag with an active button invoking the alert trigger script layout */}
      {activeTab === "sell_buy" && (
        <button
          onClick={handleSellButtonClick}
          className="fixed bottom-20 right-4 w-12 h-12 bg-purple-700 backdrop-blur-xs text-white rounded-full flex items-center justify-center font-bold text-2xs shadow-md tracking-wider border border-zinc-900/30 active:scale-95 transition-all z-40 hover:bg-purple-800 cursor-pointer"
          aria-label="Sell Item"
        >
          Sell
        </button>
      )}

      <BottomTabs />
    </div>
  );
}