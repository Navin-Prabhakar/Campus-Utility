"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 

interface Ride {
  _id: string;
  poster_name: string;
  poster_email: string;
  roll_number: string;
  phone_number: string;
  route_from: string;
  route_to: string;
  departure_time: string;
  available_seats: number;
  status: string;
}

export default function CabSharingPage() {
  const { data: session } = useSession(); 
  
  const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:5001";
  const CACHE_KEY = "swb_cab_sharing_active_feed_cache";
  
  const [activeTab, setActiveTab] = useState<"share" | "my-rides">("share");
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("IIT Patna Campus");
  const [to, setTo] = useState("Patna Airport");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [departureDate, setDepartureDate] = useState(""); 
  const [departureTimeOnly, setDepartureTimeOnly] = useState(""); 
  const [seats, setSeats] = useState(3);

  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    if (session?.user?.email) fetchUserHistory(session.user.email);
  }, [session]);

  const fetchActiveDashboard = async () => {
    try {
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        try {
          const parsedCache = JSON.parse(cachedData);
          if (Array.isArray(parsedCache) && parsedCache.length > 0) {
            setAllRides(parsedCache);
            setLoading(false);
          }
        } catch (e) {
          console.error("Failed to parse local cab sharing cache string", e);
        }
      }

      const res = await fetch(`${API_BASE}/api/active-rides`);
      if (!res.ok) throw new Error("Connection failed.");
      const data = await res.json();
      
      const serializedData = JSON.stringify(data);
      if (serializedData !== localStorage.getItem(CACHE_KEY)) {
        setAllRides(data);
        localStorage.setItem(CACHE_KEY, serializedData);
      }
    } catch (err) {
      console.error("Dashboard engine down:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserHistory = async (userEmail: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/my-rides?email=${encodeURIComponent(userEmail)}`);
      if (!res.ok) throw new Error("History failed.");
      const data = await res.json();
      setMyRides(data);
    } catch (err) {
      console.error("User history breakdown:", err);
    }
  };

  useEffect(() => {
    fetchActiveDashboard();
  }, []);

  const handlePostRide = async (e: React.FormEvent) => {
    e.preventDefault();
    const activeEmail = session?.user?.email;

    if (!activeEmail) {
      alert("You must be logged in with your IITP account to broadcast a request!");
      return;
    }

    const finalRouteFrom = from === "Other" ? customFrom.trim() : from;
    const finalRouteTo = to === "Other" ? customTo.trim() : to;

    if (!name || !phone || !departureDate || !departureTimeOnly || !finalRouteFrom || !finalRouteTo) {
      alert("Please fill out all fields and custom locations, bro!");
      return;
    }

    const combinedDateTime = `${departureDate}T${departureTimeOnly}:00+05:30`;

    const payload = {
      poster_name: name,
      poster_email: activeEmail,
      phone_number: phone,
      route_from: finalRouteFrom,
      route_to: finalRouteTo,
      departure_time: combinedDateTime,
      available_seats: seats
    };

    try {
      const response = await fetch(`${API_BASE}/api/post-ride`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        alert("🚀 Travel Request broadcasted onto the live feed!");
        setPhone("");
        setDepartureDate("");
        setDepartureTimeOnly("");
        setCustomFrom("");
        setCustomTo("");
        setFrom("IIT Patna Campus");
        setTo("Patna Airport");
        fetchActiveDashboard();
        fetchUserHistory(activeEmail);
      } else {
        alert("Server rejected form schema details.");
      }
    } catch (error) {
      console.error("Submission crash:", error);
    }
  };

  const handleUpdateStatus = async (rideId: string, updatedFields: Partial<Ride>) => {
    try {
      const response = await fetch(`${API_BASE}/api/update-ride/${rideId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedFields)
      });

      if (response.ok) {
        alert("✅ Listing updated successfully!");
        setEditingId(null);
        fetchActiveDashboard();
        if (session?.user?.email) fetchUserHistory(session.user.email);
      }
    } catch (error) {
      console.error("Error executing database revision:", error);
    }
  };

  // 🗑️ GLOBAL DELETION TRIGGER: Wipes it out of MongoDB entirely
  const handleClearRideGlobally = async (rideId: string) => {
    const confirmation = window.confirm("Are you sure you want to permanently delete this ride listing from the app, bro?");
    if (!confirmation) return;

    try {
      const response = await fetch(`${API_BASE}/api/delete-ride/${rideId}`, {
        method: "DELETE"
      });

      if (response.ok) {
        alert("🗑️ Ride successfully deleted and removed from global feeds!");
        fetchActiveDashboard();
        if (session?.user?.email) fetchUserHistory(session.user.email);
      } else {
        alert("Failed to delete the ride from backend nodes.");
      }
    } catch (error) {
      console.error("Database eviction failure:", error);
    }
  };

  return (
    <main className="h-full w-full bg-slate-900 flex flex-col overflow-hidden relative text-zinc-300 font-sans antialiased selection:bg-zinc-800 selection:text-white">
      
      <div className="flex-1 overflow-y-auto px-3 py-21 pb-36 style-scrollbar">
        <div className="max-w-md mx-auto sm:max-w-xl md:max-w-xl flex flex-col min-h-full space-y-4">
          
          <div className="flex p-1 bg-[#121212] border border-zinc-800 rounded-2xl max-w-[290px] mx-auto w-full shadow-inner shrink-0">
            <button
              onClick={() => setActiveTab("share")}
              className={`flex-1 py-2 px-3 font-black text-xs tracking-wider uppercase rounded-xl transition-all duration-300 transform active:scale-95 ${
                activeTab === "share" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-md font-black" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              🤝 Share Ride
            </button>
            <button
              onClick={() => {
                setActiveTab("my-rides");
                if (session?.user?.email) fetchUserHistory(session.user.email);
              }}
              className={`flex-1 py-2 px-3 font-black text-xs tracking-wider uppercase rounded-xl transition-all duration-300 transform active:scale-95 ${
                activeTab === "my-rides" 
                  ? "bg-[#2A2A2A] text-white border border-zinc-700 shadow-md font-black" 
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              📋 My Rides ({myRides.length})
            </button>
          </div>

          {activeTab === "share" && (
            <div className="space-y-4 animate-in fade-in duration-200 flex-grow">
              
              <section className="bg-gradient-to-t from-zinc-950 to-zinc-800/90 rounded-2xl border border-zinc-700 p-3 shadow-xl">
                <h2 className="text-[12px] font-black uppercase tracking-wide text-zinc-400 mb-3.5">Broadcast Route Details</h2>
                <form onSubmit={handlePostRide} className="flex flex-col gap-3.5">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">Display Name</label>
                      <input 
                        type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)}
                        className="rounded-xl border border-slate-500 p-2 text-sm bg-slate-700 text-white outline-hidden focus:border-zinc-600 shadow-inner"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">WhatsApp Number</label>
                      <input 
                        type="tel" placeholder="10-digit number" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl border border-slate-500 p-2 text-sm bg-slate-700 text-white outline-hidden focus:border-zinc-600 shadow-inner"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2  gap-3">
                    <div className="flex flex-col gap-1 ">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1"> Origin</label>
                      <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-slate-500 p-2 px-1 text-xs bg-slate-700 text-zinc-200 font-bold outline-hidden focus:border-zinc-600 cursor-pointer">
                        <option value="IIT Patna Campus">IIT Patna Campus</option>
                        <option value="Patna Airport">Patna Airport</option>
                        <option value="Patna Junction">Patna Junction</option>
                        <option value="Bihta Station">Bihta Station</option>
                        <option value="Other">Other (Custom Field)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">Destination</label>
                      <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-slate-500 p-2 px-1 text-xs bg-slate-700 text-zinc-200 font-bold outline-hidden focus:border-zinc-600 cursor-pointer">
                        <option value="Bihta Station">Bihta Station</option>
                        <option value="Patna Airport">Patna Airport</option>
                        <option value="Patna Junction">Patna Junction</option>
                        <option value="IIT Patna Campus">IIT Patna Campus</option>
                        <option value="Other">Other (Custom Field)</option>
                      </select>
                    </div>
                  </div>

                  {(from === "Other" || to === "Other") && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-1 duration-150">
                      <div>
                        {from === "Other" ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black  uppercase tracking-wide text-amber-500 px-1">Custom Origin</label>
                            <input 
                              type="text" placeholder="e.g.- Danapur" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                              className="rounded-3xl border border-amber-500/20 p-2 text-sm bg-[#1A1815] text-white outline-hidden focus:border-amber-500/40 shadow-inner"
                            />
                          </div>
                        ) : <div />}
                      </div>
                      <div>
                        {to === "Other" ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-[9px] font-black uppercase tracking-wider text-amber-500 px-1">Custom Destination</label>
                            <input 
                              type="text" placeholder="e.g.- Gandhi Maidan" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                              className="rounded-3xl border border-amber-500/20 p-2 text-sm bg-[#1A1815] text-white outline-hidden focus:border-amber-500/40 shadow-inner"
                            />
                          </div>
                        ) : <div />}
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">Departure Day</label>
                      <input 
                        type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                        className="rounded-xl border border-slate-500 p-2.5 px-2 text-xs bg-slate-700 text-white outline-hidden focus:border-zinc-600 shadow-inner font-mono cursor-text"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">Departure Time</label>
                      <input 
                        type="time" value={departureTimeOnly} onChange={(e) => setDepartureTimeOnly(e.target.value)}
                        className="rounded-xl border border-slate-500 p-2.5 text-xs bg-slate-700 text-white outline-hidden focus:border-zinc-600 shadow-inner font-mono cursor-text"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-black uppercase tracking-wide text-zinc-500 px-1">Vacant Seats</label>
                    <input 
                      type="number" min="1" max="7" value={seats} onChange={(e) => setSeats(Number(e.target.value))}
                      className="rounded-xl border border-slate-500 p-2.5 text-xs bg-slate-700 text-white outline-hidden focus:border-zinc-400 shadow-inner font-mono"
                    />
                  </div>

                  <button type="submit" className="w-full bg-amber-700 hover:bg-amber-600 border border-zinc-700 text-white font-black text-xs py-3 rounded-xl shadow-md transition-all active:scale-95 tracking-widest uppercase mt-2 cursor-pointer">
                     🚀 Post Schedule
                  </button>
                </form>
              </section>

              <section className="space-y-3">
                <div className="flex items-center justify-between mb-2 px-1">
                  <h2 className="text-xs font-black uppercase tracking-wide text-zinc-300">Active Cab Schedules</h2>
                  <button onClick={fetchActiveDashboard} className="text-[12px] font-black uppercase tracking-wide text-zinc-400 hover:text-white flex items-center gap-1 transition-colors">
                    🔄  Refresh
                  </button>
                </div>

                {loading && allRides.length === 0 ? (
                  <p className="text-xs text-center text-zinc-500 py-8 italic font-medium">Parsing dashboard registry nodes...</p>
                ) : allRides.length === 0 ? (
                  <div className="bg-[#0C0C0C] border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                    <p className="text-xs text-zinc-500 font-medium">No operational pooling lines opened currently.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">
                    {allRides.map((ride) => (
                      <div key={ride._id} className="group bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] border border-zinc-900 hover:border-zinc-700 rounded-2xl p-3.5 shadow-xl transition-all duration-200 transform active:scale-[0.99]">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="text-xs font-black text-zinc-200 truncate">{ride.poster_name} <span className="text-[10px] font-mono text-zinc-600 font-medium">({ride.roll_number})</span></h3>
                            <p className="text-[11px] font-black text-zinc-300 mt-1 flex items-center gap-1">
                              <span>📍</span> {ride.route_from} <span className="text-[#F59E0B] mx-0.5">➔</span> {ride.route_to}
                            </p>
                          </div>
                          <span className="shrink-0 bg-[#121212] text-[#10B981] border border-zinc-800 text-[10px] px-2.5 py-1 rounded-xl font-black tracking-wide shadow-inner">
                            👥 {ride.available_seats} Slots Left
                          </span>
                        </div>
                        <div className="border-t border-zinc-900 pt-2.5 mt-2.5 flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500 font-mono font-medium">📅 {new Date(ride.departure_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <a 
                            href={`https://wa.me/91${ride.phone_number}`} 
                            target="_blank" 
                            rel="noreferrer" 
                            className="bg-emerald-500/10 hover:bg-emerald-500/20 text-[#10B981] border border-emerald-500/20 font-black px-3 py-1.5 rounded-xl shadow-sm tracking-wider uppercase transition-all active:scale-95"
                          >
                            WhatsApp 💬
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {activeTab === "my-rides" && (
            <div className="space-y-3 pb-70 animate-in fade-in duration-200 flex-grow">
              <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 px-1 mb-1">My Posted Rides</h2>
              
              {!session?.user?.email ? (
                <p className="text-xs text-zinc-500 text-center py-6 italic">Authentication nodes missing. Please authorize account layout access.</p>
              ) : myRides.length === 0 ? (
                <div className="bg-[#0C0C0C] border border-dashed border-zinc-800 rounded-2xl p-8 text-center">
                  <p className="text-sm text-zinc-500 font-medium">No travel records initialized by you, bro ☹️.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {myRides.map((ride) => (
                    <div key={ride._id} className="bg-[#0F0F0F] border border-zinc-900 rounded-2xl p-3.5 shadow-xl flex flex-col gap-3">
                      <div className="flex justify-between items-center gap-2">
                        <div className="min-w-0">
                          <p className="text-[11px] font-black text-zinc-300 truncate">📍 {ride.route_from} <span className="text-zinc-600 mx-0.5">➔</span> {ride.route_to}</p>
                          <p className="text-[10px] font-mono text-zinc-500 font-medium mt-1">Calendar: {new Date(ride.departure_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <span className={`shrink-0 text-[10px] px-2.5 py-0.5 rounded-xl font-black tracking-wider uppercase border ${
                          ride.status === 'Active' ? 'bg-zinc-900 text-zinc-300 border-zinc-700' : 'bg-[#121212] text-zinc-600 border-transparent'
                        }`}>
                          {ride.status}
                        </span>
                      </div>

                      {editingId === ride._id ? (
                        <div className="bg-[#121212] p-3 rounded-xl border border-zinc-800 flex flex-col gap-3">
                          <div className="grid grid-cols-2 gap-2.5">
                            <div>
                              <label className="block text-[8px] font-black uppercase tracking-wider text-zinc-500 mb-1">Modify Vacant Capacity</label>
                              <input 
                                type="number" defaultValue={ride.available_seats} id={`edit-seats-${ride._id}`}
                                className="w-full rounded-lg border border-zinc-800 p-1.5 text-xs bg-[#161616] text-white font-mono outline-hidden focus:border-zinc-600"
                              />
                            </div>
                            <div>
                              <label className="block text-[8px] font-black uppercase tracking-wider text-zinc-500 mb-1">Status Machine State</label>
                              <select id={`edit-status-${ride._id}`} defaultValue={ride.status} className="w-full rounded-lg border border-zinc-800 p-1.5 text-xs bg-[#161616] text-zinc-300 font-bold outline-hidden focus:border-zinc-600 cursor-pointer">
                                <option value="Active">Active</option>
                                <option value="Seat Full">Seat Full</option>
                                <option value="Complete">Complete</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 pt-1">
                            <button onClick={() => setEditingId(null)} className="text-[10px] font-black uppercase tracking-wider text-zinc-500 px-3 py-1.5 rounded-lg transition-colors hover:text-white">Cancel</button>
                            <button 
                              onClick={() => {
                                const s = Number((document.getElementById(`edit-seats-${ride._id}`) as HTMLInputElement).value);
                                const st = (document.getElementById(`edit-status-${ride._id}`) as HTMLSelectElement).value;
                                handleUpdateStatus(ride._id, { available_seats: s, status: st as any });
                              }}
                              className="bg-[#2A2A2A] hover:bg-[#333333] border border-zinc-700 text-white text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-lg shadow-sm transition-all active:scale-95 cursor-pointer"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 border-t border-zinc-900 pt-2.5">
                          {/* 🗑️ UPDATED ACTION: Clears the entire database record for all viewports */}
                          <button 
                            onClick={() => handleClearRideGlobally(ride._id)}
                            className="border border-zinc-800 text-zinc-500 hover:text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all hover:bg-zinc-950/40 active:scale-95"
                          >
                            🗑️ Clear Ride
                          </button>
                          <button 
                            onClick={() => setEditingId(ride._id)}
                            className="border border-zinc-800 text-zinc-400 hover:text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all hover:bg-[#121212] active:scale-95"
                          >
                            ✏️ Edit parameters
                          </button>
                          {ride.status === 'Active' && (
                            <button 
                              onClick={() => handleUpdateStatus(ride._id, { status: 'Cancelled' })}
                              className="border border-rose-950 text-rose-500 hover:text-white text-[10px] font-black uppercase tracking-wider px-3 py-1.5 rounded-xl transition-all hover:bg-rose-950/20 active:scale-95"
                            >
                              🛑 Kill Route
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

    </main>
  );
}