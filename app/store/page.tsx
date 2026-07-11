"use client";

import React, { useEffect, useState, useRef } from "react";
import Papa from "papaparse";

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

const SELL_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1p0WTx2O5rUEatdvpVtoQwnPEhv86_nZf5F-LMPwEe_s/export?format=csv&gid=263432444";

export default function StorePage() {
  const [items, setItems] = useState<SellItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);
  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Search & Filter Dropdown Core States
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);
  
  // MANUAL TICK BOX STATES
  const [filterAvailableOnly, setFilterAvailableOnly] = useState<boolean>(false);
  const [filterNewestItems, setFilterNewestItems] = useState<boolean>(true); 

  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const CACHE_KEY = "swb_store_marketplace_cache";

    async function fetchMarketplaceData() {
      try {
        setLoading(true);
        setError(false);

        // 1. Instantly pull up local text cache to beat network latency
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          try {
            const parsedCache = JSON.parse(cachedData);
            if (Array.isArray(parsedCache) && parsedCache.length > 0) {
              setItems(parsedCache);
              setLoading(false);
            }
          } catch (e) {
            console.error("Failed to parse local store cache string", e);
          }
        }

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
              
              if (rawTimestamp) {
                const dateMatch = rawTimestamp.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
                if (dateMatch) {
                  const [, month, day, year] = dateMatch;
                  const cleanDay = day.padStart(2, "0");
                  const cleanMonth = month.padStart(2, "0");
                  displayDate = `${cleanDay}/${cleanMonth}/${year}`;
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

            // 2. Deep comparison logic verification sequence
            const serializedData = JSON.stringify(cleanParsedItems);
            if (serializedData !== localStorage.getItem(CACHE_KEY)) {
              setItems(cleanParsedItems);
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

  const handleCopyPhone = (e: React.MouseEvent, id: string, phone: string) => {
    e.stopPropagation(); 
    navigator.clipboard.writeText(phone);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

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

  const handleSellButtonClick = () => {
    alert("1) please write 'Price:___,your other messages' in 'any comments' column.\n \n2) Upload a clear, cropped picture.\n \n3) Make sure to mark sold out once you sold to someone.");
    window.open("https://docs.google.com/forms/d/e/1FAIpQLSdu2XRFTWTWR6rJh9JwM_1ebtn_sDnGS5S4SsnsNRGSW9l6ag/viewform", "_blank", "noopener,noreferrer");
  };

  return (
    <div className="h-full w-full bg-slate-900 py-21 font-sans text-zinc-300 antialiased flex flex-col overflow-hidden relative selection:bg-zinc-800 selection:text-white">
      
      {/* Persistent Sticky Controls Bar */}
      <div className="w-full bg-slate-900 backdrop-blur-md border-b border-zinc-900 shrink-0 z-30 flex flex-col items-center shadow-[0_4px_20px_rgba(0,0,0,0.4)]">
        
        {!loading && !error && (
          <div className="w-[96%] max-w-[365px] py-1.5 flex gap-2 items-center relative">
            
            {/* Search Input Box */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Search items, prices, names..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-zinc-300 border border-zinc-800 rounded-2xl py-2 pl-8 pr-8 text-[13px]  focus:border-zinc-600 focus:outline-hidden font-medium tracking-tight placeholder-zinc-600 text-black transition-all shadow-inner"
              />
              <span className="absolute left-2.5 top-2.5 text-[14px]">🔍</span>
              {searchQuery && (
                <button 
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2.5 text-sm text-zinc-800 hover:text-red-600 font-bold px-1 transition-colors"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Filter Toggle Button */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className={`border rounded-xl py-2 px-3.5 text-[11px] font-black tracking-wider uppercase flex items-center gap-1.5 shrink-0 transition-all active:scale-95 shadow-md ${
                  isDropdownOpen || filterAvailableOnly || !filterNewestItems
                    ? "bg-[#2D2D2D] border-zinc-600 text-white" 
                    : "bg-[#161616] border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700"
                }`}
              >
                <span>Filter</span>
                <span className={`text-[9x] transition-transform duration-200 ${isDropdownOpen ? "rotate-180" : ""}`}>
                  ▼
                </span>
              </button>

              {/* Dropdown Card */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-44 bg-[#121212] border border-zinc-800 rounded-xl shadow-[0_10px_30px_rgba(0,0,0,0.8)] py-1.5 z-50 flex flex-col text-[11px] font-bold text-zinc-400 animate-in fade-in zoom-in-95 duration-150">
                  
                  <div className="px-3 py-1 text-[9px] font-black text-zinc-600 uppercase tracking-widest border-b border-zinc-900 mb-1">
                    Refine Feed
                  </div>

                  <label className="flex items-center justify-between px-3 py-2 hover:bg-[#1A1A1A] hover:text-white cursor-pointer select-none transition-colors">
                    <span className={filterAvailableOnly ? "text-white font-black" : ""}>Available Only</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filterAvailableOnly}
                        onChange={(e) => setFilterAvailableOnly(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border border-zinc-700 rounded bg-[#161616] peer-checked:bg-[#333333] peer-checked:border-zinc-400 flex items-center justify-center transition-all shadow-sm">
                        {filterAvailableOnly && <span className="text-white text-[9px] font-black leading-none">✓</span>}
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center justify-between px-3 py-2 hover:bg-[#1A1A1A] hover:text-white cursor-pointer select-none transition-colors">
                    <span className={filterNewestItems ? "text-white font-black" : ""}>Newest Items</span>
                    <div className="relative flex items-center">
                      <input
                        type="checkbox"
                        checked={filterNewestItems}
                        onChange={(e) => setFilterNewestItems(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-4 h-4 border border-zinc-700 rounded bg-[#161616] peer-checked:bg-[#333333] peer-checked:border-zinc-400 flex items-center justify-center transition-all shadow-sm">
                        {filterNewestItems && <span className="text-white text-[9px] font-black leading-none">✓</span>}
                      </div>
                    </div>
                  </label>

                </div>
              )}
            </div>

          </div>
        )}

      </div>

      {/* 📜 SCROLLABLE MIDDLE CONTAINER */}
      <div className="flex-1 overflow-y-auto w-full flex flex-col items-center px-2 py-1 pb-32 bg-slate-800 style-scrollbar">
        <main className="w-[99%] max-w-[365px] flex flex-col py-2 flex-grow">
          
          {loading && items.length === 0 ? (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="aspect-[3/4] w-full animate-pulse rounded-2xl bg-[#121212] border border-zinc-900" />
              ))}
            </div>
          ) : error ? (
            <div className="py-8 text-center text-xs text-rose-400 bg-rose-950/20 rounded-2xl border border-rose-500/20 font-bold uppercase tracking-wide">
              🚨 Unable to sync live marketplace records.
            </div>
          ) : filteredAndSortedItems.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 bg-[#0C0C0C] border border-zinc-900 rounded-2xl italic font-medium">
              No items matching your selections.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2.5 w-full">
              {filteredAndSortedItems.map((item) => {
                const isSoldOut = item.status.toLowerCase().includes("sold");
                const isFlipped = !!flippedCards[item.id];

                return (
                  <div
                    key={item.id}
                    onClick={() => toggleCardFlip(item.id)}
                    className="w-full aspect-[3/4] cursor-pointer [perspective:1000px] transform active:scale-[0.98] transition-transform duration-150"
                  >
                    <div
                      className={`relative w-full h-full duration-500 [transform-style:preserve-3d] transition-transform ${
                        isFlipped ? "[transform:rotateY(180deg)]" : ""
                      }`}
                    >
                      
                      {/* CARD FRONT LAYER */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl border border-zinc-700 bg-gradient-to-t from-zinc-800 to-[#0A0A0A] hover:border-zinc-600 p-2 flex flex-col justify-between shadow-xl [backface-visibility:hidden] select-none transition-all">
                        
                        <div className="relative w-full h-[76%] bg-[#161616] rounded-xl overflow-hidden shrink-0 flex items-center justify-center border border-zinc-900/60">
                          {item.picture ? (
                            <img
                              src={item.picture}
                              alt={item.itemName}
                              className={`w-full h-full object-cover transition-all duration-300 ${isSoldOut ? "grayscale opacity-20 blur-[1px]" : "group-hover:scale-105"}`}
                              referrerPolicy="no-referrer"
                            />
                          ) : (
                            <span className="text-[10px] text-zinc-600 font-bold uppercase tracking-wider text-center px-2">No Image Spec</span>  
                          )}

                          {/* Date Stamp Tag */}
                          <div className="absolute bottom-1 right-1 bg-black/75 backdrop-blur-xs text-zinc-400 text-[7px] font-mono font-bold px-1.5 py-0.5 rounded shadow-md border border-zinc-800/40">
                            {item.formattedDate}
                          </div>

                          {/* Semantic Indicator */}
                          {isSoldOut && (
                            <div className="absolute top-1 left-1 bg-rose-600 text-white text-[8px] uppercase tracking-widest font-black px-2 py-0.5 rounded-md shadow-lg">
                              Sold Out
                            </div>
                          )}
                        </div>

                        {/* Title and Pricing Details Layout */}
                        <div className="flex flex-col flex-grow justify-end pt-1.5 px-0.5 min-w-0">
                          <h4 className="truncate text-[11px] font-black text-zinc-100 leading-tight tracking-tight">
                            {item.itemName}
                          </h4>
                          <div className="mt-1 flex items-center justify-between">
                            <span className="truncate text-[10px] font-mono font-extrabold text-[#F59E0B] bg-amber-500/5 border border-amber-500/10 px-1.5 py-0.5 rounded-md shadow-xs">
                              {item.price}
                            </span>
                          </div>
                        </div>

                      </div>

                      {/* CARD BACK LAYER */}
                      <div className="absolute inset-0 w-full h-full rounded-2xl border border-zinc-800 bg-[#0A0A0A] p-3 flex flex-col justify-between text-white shadow-2xl [backface-visibility:hidden] [transform:rotateY(180deg)]">
                        <div className="border-b border-zinc-900 pb-1 flex justify-between items-center shrink-0 select-none">
                          <span className="text-[8px] font-black uppercase tracking-widest text-zinc-500">
                            Seller Identity Token
                          </span>
                          <span className="text-[7px] font-mono text-zinc-600">
                            {item.formattedDate}
                          </span>
                        </div>

                        {/* Middle Credentials Cluster */}
                        <div className="flex flex-col gap-2 py-2 flex-grow min-w-0 justify-center">
                          <div className="min-w-0">
                            <p className="text-[8px] text-zinc-600 uppercase font-black tracking-wider select-none">Full Name</p>
                            <p className="text-[11px] font-black text-zinc-200 truncate mt-0.5 select-text" onClick={(e) => e.stopPropagation()}>{item.sellerName}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-zinc-600 uppercase font-black tracking-wider select-none">Roll Reference</p>
                            <p className="text-[10px] font-mono font-bold text-zinc-400 truncate mt-0.5 select-text" onClick={(e) => e.stopPropagation()}>{item.rollNo}</p>
                          </div>
                          <div className="min-w-0">
                            <p className="text-[8px] text-zinc-600 uppercase font-black tracking-wider select-none">Email Node</p>
                            <p className="text-[10px] font-medium text-zinc-400 truncate mt-0.5 select-text" onClick={(e) => e.stopPropagation()}>{item.email}</p>
                          </div>
                        </div>

                        {/* Phone Container Box */}
                        <div 
                          onClick={(e) => e.stopPropagation()} 
                          className="mt-auto shrink-0 bg-[#161616] rounded-xl p-1.5 border border-zinc-800 flex items-center justify-between shadow-inner"
                        >
                          <span className="text-[10px] font-mono font-black text-emerald-400 tracking-wide px-1 select-text">
                            📞 {item.phone}
                          </span>
                          <button
                            onClick={(e) => handleCopyPhone(e, item.id, item.phone)}
                            className="text-[8px] bg-[#2A2A2A] hover:bg-[#333333] text-white border border-zinc-700 px-2 py-1 rounded-lg font-black uppercase transition-colors active:scale-95"
                          >
                            {copiedId === item.id ? "Copied" : "Copy"}
                          </button>
                        </div>

                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </main>
      </div>

      {/* Floating Action Button */}
      <button
        onClick={handleSellButtonClick}
        className="fixed bottom-24 right-4 w-12 h-12 bg-gradient-to-tr from-blue-600/80 to-purple-500 hover:bg-blue-700 text-white rounded-full flex flex-col items-center justify-center font-black text-[12px] tracking-widest uppercase shadow-[0_4px_20px_rgba(59,130,246,0.3)] border border-blue-400/30 active:scale-90 transition-all z-40 cursor-pointer select-none"
        aria-label="Sell Item"
      >
        <span>Sell</span>
      </button>

      <style jsx global>{`
        .style-scrollbar::-webkit-scrollbar {
          width: 5px;
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
      
    </div>
  );
}