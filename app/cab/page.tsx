"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react"; 
import Header from "../components/Header";       // 📌 Imported Global Header
import BottomTabs from "../components/BottomTabs"; // 📌 Imported Global Navigation Footer

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
  
  // App Navigation View States
  const [activeTab, setActiveTab] = useState<"share" | "my-rides">("share");
  
  // Data Feeds States
  const [allRides, setAllRides] = useState<Ride[]>([]);
  const [myRides, setMyRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Interactive Editing States
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form Field States
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [from, setFrom] = useState("IIT Patna Campus");
  const [to, setTo] = useState("Patna Airport");
  
  // Custom Input States for "Other" selections
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  
  // Split Time states to force native round analog clock wheel interface
  const [departureDate, setDepartureDate] = useState(""); 
  const [departureTimeOnly, setDepartureTimeOnly] = useState(""); 
  const [seats, setSeats] = useState(3);

  // Sync profile parameters when session mounts asynchronously
  useEffect(() => {
    if (session?.user?.name) setName(session.user.name);
    if (session?.user?.email) fetchUserHistory(session.user.email);
  }, [session]);

  // 📡 FETCH METHOD 1: Active Global Dashboard Feeds
  const fetchActiveDashboard = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://127.0.0.1:5001/api/active-rides");
      if (!res.ok) throw new Error("Connection failed.");
      const data = await res.json();
      setAllRides(data);
    } catch (err) {
      console.error("Dashboard engine down:", err);
    } finally {
      setLoading(false);
    }
  };

  // 📡 FETCH METHOD 2: Logged-in Student's Personal Posting Log
  const fetchUserHistory = async (userEmail: string) => {
    try {
      const res = await fetch(`http://127.0.0.1:5001/api/my-rides?email=${encodeURIComponent(userEmail)}`);
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

  // 📝 HANDLER: Submit a New Ride Post
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

    const combinedDateTime = `${departureDate}T${departureTimeOnly}`;

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
      const response = await fetch("http://127.0.0.1:5001/api/post-ride", {
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

  // 🔄 HANDLER: Update Status / Seats
  const handleUpdateStatus = async (rideId: string, updatedFields: Partial<Ride>) => {
    try {
      const response = await fetch(`http://127.0.0.1:5001/api/update-ride/${rideId}`, {
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

  return (
    // Wrapper matches BusPage structural properties to secure layout boundaries perfectly
    <main className="h-screen max-h-screen w-full bg-gray-50 flex flex-col overflow-hidden relative text-zinc-800">
      
      {/* 📌 PINNED GLOBAL HEADER */}
      <div className="shrink-0 z-40">
        <Header />
      </div>

      {/* 📜 MIDDLE SCROLLABLE CONTAINER */}
      <div className="flex-1 overflow-y-auto px-4 py-5 pb-28 bg-zinc-50/50">
        <div className="max-w-2xl mx-auto flex flex-col min-h-full">
          
          {/* 🎛️ TAB CONTROLLER TOGGLE BUTTONS */}
          <div className="grid grid-cols-2 gap-2 bg-gray-100 p-1.5 rounded-xl mb-5 shrink-0 border border-gray-200/60 max-w-xs mx-auto w-full shadow-inner">
            <button
              onClick={() => setActiveTab("share")}
              className={`py-1.5 px-3 font-bold text-xs rounded-lg transition-all ${
                activeTab === "share" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"
              }`}
            >
              🤝 Share a Ride
            </button>
            <button
              onClick={() => {
                setActiveTab("my-rides");
                if (session?.user?.email) fetchUserHistory(session.user.email);
              }}
              className={`py-1.5 px-3 font-bold text-xs rounded-lg transition-all ${
                activeTab === "my-rides" ? "bg-slate-900 text-white shadow-xs" : "text-gray-500 hover:text-slate-900"
              }`}
            >
              📋 My Rides ({myRides.length})
            </button>
          </div>

          {/* ========================================================= */}
          {/* 🤝 VIEW A: SHARE RIDE FORM VIEW                          */}
          {/* ========================================================= */}
          {activeTab === "share" && (
            <div className="space-y-5 animate-fadeIn flex-grow">
              <section className="bg-white rounded-2xl border border-gray-200 p-4 shadow-3xs">
                <h2 className="text-xs font-black uppercase tracking-wider text-zinc-400 mb-3">Post Travel Schedule</h2>
                <form onSubmit={handlePostRide} className="flex flex-col gap-3">
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">Display Name</label>
                      <input 
                        type="text" placeholder="Your Name" value={name} onChange={(e) => setName(e.target.value)}
                        className="rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">Contact WhatsApp</label>
                      <input 
                        type="tel" placeholder="Ten digit mobile" value={phone} onChange={(e) => setPhone(e.target.value)}
                        className="rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">From Location</label>
                      <select value={from} onChange={(e) => setFrom(e.target.value)} className="rounded-xl border border-zinc-300 p-2.5 text-xs bg-white">
                        <option value="IIT Patna Campus">IIT Patna Campus</option>
                        <option value="Patna Airport">Patna Airport</option>
                        <option value="Patna Junction">Patna Junction</option>
                        <option value="Bihta Station">Bihta Station</option>
                        <option value="Other">Other (Type custom location)</option>
                      </select>
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">To Destination</label>
                      <select value={to} onChange={(e) => setTo(e.target.value)} className="rounded-xl border border-zinc-300 p-2.5 text-xs bg-white">
                        <option value="Patna Airport">Patna Airport</option>
                        <option value="Patna Junction">Patna Junction</option>
                        <option value="Bihta Station">Bihta Station</option>
                        <option value="IIT Patna Campus">IIT Patna Campus</option>
                        <option value="Other">Other (Type custom location)</option>
                      </select>
                    </div>
                  </div>

                  {/* CONDITIONAL "OTHER" TEXT FIELDS */}
                  {(from === "Other" || to === "Other") && (
                    <div className="grid grid-cols-2 gap-3 animate-fadeIn">
                      <div>
                        {from === "Other" ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-blue-500 px-1">Custom Starting Point</label>
                            <input 
                              type="text" placeholder="e.g., Amrapali Cantt" value={customFrom} onChange={(e) => setCustomFrom(e.target.value)}
                              className="rounded-xl border border-blue-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                            />
                          </div>
                        ) : <div />}
                      </div>
                      <div>
                        {to === "Other" ? (
                          <div className="flex flex-col gap-1">
                            <label className="text-[10px] font-bold text-blue-500 px-1">Custom Destination</label>
                            <input 
                              type="text" placeholder="e.g., Fraser Road" value={customTo} onChange={(e) => setCustomTo(e.target.value)}
                              className="rounded-xl border border-blue-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-blue-50/30"
                            />
                          </div>
                        ) : <div />}
                      </div>
                    </div>
                  )}

                  {/* TIME SELECTION SEPARATION */}
                  <div className="grid grid-cols-2 gap-3 items-end">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">Departure Date</label>
                      <input 
                        type="date" value={departureDate} onChange={(e) => setDepartureDate(e.target.value)}
                        className="rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-zinc-400 px-1">Select Time (Clock Face)</label>
                      <input 
                        type="time" value={departureTimeOnly} onChange={(e) => setDepartureTimeOnly(e.target.value)}
                        className="rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] font-bold text-zinc-400 px-1">Vacant Seats</label>
                    <input 
                      type="number" min="1" max="7" value={seats} onChange={(e) => setSeats(Number(e.target.value))}
                      className="rounded-xl border border-zinc-300 p-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                    />
                  </div>

                  <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs py-3 rounded-xl shadow-sm transition mt-2">
                     🚀 Post Ride
                  </button>
                </form>
              </section>

              {/* LIVE ACTIVE BOARD VIEW */}
              <section>
                <div className="flex items-center justify-between mb-3 px-1">
                  <h2 className="text-sm font-bold text-zinc-700">Active Board Postings</h2>
                  <button onClick={fetchActiveDashboard} className="text-xs font-semibold text-blue-500 hover:underline">🔄 Refresh</button>
                </div>

                {loading ? (
                  <p className="text-xs text-center text-zinc-400 py-8">Parsing logs feed...</p>
                ) : allRides.length === 0 ? (
                  <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                    <p className="text-xs text-gray-400 font-medium">No active co-travelers listed right now.</p>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {allRides.map((ride) => (
                      <div key={ride._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-3xs flex flex-col gap-2 hover:border-indigo-400 border transition-all">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-xs font-bold text-zinc-800">{ride.poster_name} <span className="text-[10px] font-medium text-zinc-400">({ride.roll_number})</span></h3>
                            <p className="text-[11px] font-bold text-indigo-600 mt-0.5">📍 {ride.route_from} ➔ {ride.route_to}</p>
                          </div>
                          <span className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] px-2.5 py-1 rounded-full font-bold">
                            👥 {ride.available_seats} Seats Left
                          </span>
                        </div>
                        <div className="border-t border-zinc-100 pt-2 mt-1 flex justify-between items-center text-[10px]">
                          <span className="text-zinc-500 font-medium">📅 {new Date(ride.departure_time).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</span>
                          <a href={`https://wa.me/91${ride.phone_number}`} target="_blank" rel="noreferrer" className="bg-green-600 text-white font-bold px-3 py-1.5 rounded-lg shadow-2xs">
                            Ping via WhatsApp 💬
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

          {/* ========================================================= */}
          {/* 📋 VIEW B: MY RIDES USER LOG VIEW                       */}
          {/* ========================================================= */}
          {activeTab === "my-rides" && (
            <div className="space-y-3 animate-fadeIn flex-grow">
              <h2 className="text-sm font-bold text-zinc-700 px-1 mb-2">Your Active & Past Postings</h2>
              
              {!session?.user?.email ? (
                <p className="text-xs text-zinc-400 text-center py-6">Please log in to track your personal history.</p>
              ) : myRides.length === 0 ? (
                <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-8 text-center">
                  <p className="text-xs text-gray-400 font-medium">You haven't posted any travel slots yet, bro.</p>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  {myRides.map((ride) => (
                    <div key={ride._id} className="bg-white border border-gray-200 rounded-2xl p-4 shadow-3xs flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-[11px] font-bold text-indigo-600">📍 {ride.route_from} ➔ {ride.route_to}</p>
                          <p className="text-[10px] text-zinc-400 mt-0.5">Departure: {new Date(ride.departure_time).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</p>
                        </div>
                        <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold border ${
                          ride.status === 'Active' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                        }`}>
                          {ride.status}
                        </span>
                      </div>

                      {/* INLINE EDIT CONTROLS */}
                      {editingId === ride._id ? (
                        <div className="bg-zinc-50 p-3 rounded-xl border border-zinc-200 flex flex-col gap-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[9px] font-bold text-zinc-400">Modify Available Seats</label>
                              <input 
                                type="number" defaultValue={ride.available_seats} id={`edit-seats-${ride._id}`}
                                className="w-full rounded-lg border border-zinc-300 p-1.5 text-xs bg-white"
                              />
                            </div>
                            <div>
                              <label className="text-[9px] font-bold text-zinc-400">Change Status</label>
                              <select id={`edit-status-${ride._id}`} defaultValue={ride.status} className="w-full rounded-lg border border-zinc-300 p-1.5 text-xs bg-white">
                                <option value="Active">Active</option>
                                <option value="Seat Full">Seat Full</option>
                                <option value="Complete">Complete</option>
                                <option value="Cancelled">Cancelled</option>
                              </select>
                            </div>
                          </div>
                          <div className="flex justify-end gap-2 mt-1">
                            <button onClick={() => setEditingId(null)} className="text-[10px] font-bold text-zinc-500 px-3 py-1">Cancel</button>
                            <button 
                              onClick={() => {
                                const s = Number((document.getElementById(`edit-seats-${ride._id}`) as HTMLInputElement).value);
                                const st = (document.getElementById(`edit-status-${ride._id}`) as HTMLSelectElement).value;
                                handleUpdateStatus(ride._id, { available_seats: s, status: st as any });
                              }}
                              className="bg-slate-900 text-white text-[10px] font-bold px-4 py-1 rounded-lg"
                            >
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-end gap-2 border-t border-zinc-100 pt-2">
                          <button 
                            onClick={() => setEditingId(ride._id)}
                            className="border border-zinc-300 text-zinc-600 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-zinc-50"
                          >
                            ✏️ Edit details
                          </button>
                          {ride.status === 'Active' && (
                            <button 
                              onClick={() => handleUpdateStatus(ride._id, { status: 'Cancelled' })}
                              className="border border-red-200 text-red-500 text-[10px] font-bold px-3 py-1.5 rounded-lg hover:bg-red-50"
                            >
                              🛑 Cancel Ride
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

      {/* 📌 PINNED BOTTOM TABS */}
      <div className="shrink-0 z-40">
        <BottomTabs />
      </div>
    </main>
  );
}