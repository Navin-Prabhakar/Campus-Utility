"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import ProfileAvatar from "../components/ProfileAvatar"; 

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;
  const router = useRouter();

  // Interactive Editable States
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState("");

  // Sync state loops cleanly when session loads or local storage exists
  useEffect(() => {
    const savedCustomName = localStorage.getItem("user-custom-display-name");
    if (savedCustomName) {
      setDisplayName(savedCustomName);
    } else if (user?.name) {
      setDisplayName(user.name);
    }
  }, [user]);

  const handleSaveName = () => {
    const trimmed = displayName.trim();
    if (!trimmed) {
      alert("Display alias node cannot be initialized blank!");
      return;
    }
    localStorage.setItem("user-custom-display-name", trimmed);
    setIsEditingName(false);
  };

  return (
    /* 🛠️ OVERRIDE: Modified parent layout wrapper to a absolute fixed center plane modal overlay with backdrop blurring */
    <div 
      onClick={() => router.push("/")}
      className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center p-4 z-50 selection:bg-zinc-800 selection:text-white animate-in fade-in duration-200"
    >
      
      {/* 📜 FLOATING PROFILE APP CONTAINER VIEW */}
      <div 
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl border border-zinc-900 bg-gradient-to-b from-[#0F0F0F] to-[#0A0A0A] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.9)] text-center relative animate-in fade-in zoom-in-95 duration-200"
      >
        
        {/* ✕ DISMISS EXIT TRIGGER (Crimson Hover Sync) */}
        <button
          onClick={() => router.push("/")}
          className="absolute top-4 right-4 text-zinc-500 hover:text-white hover:bg-rose-600/20 border border-transparent hover:border-rose-500/30 font-black text-xs h-7 w-7 flex items-center justify-center rounded-xl bg-[#161616] active:scale-90 transition-all duration-150 cursor-pointer shadow-md select-none"
          title="Exit Profile workspace"
        >
          ✕
        </button>

        <h2 className="text-sm font-black uppercase tracking-widest text-zinc-400 mb-0.5">Profile Matrix</h2>
        <p className="text-[10px] text-zinc-600 font-mono tracking-wide uppercase mb-8">Identity Configuration Hub</p>

        <div className="flex flex-col items-center justify-center gap-4">
          
          {/* Avatar Rendering Segment */}
          <ProfileAvatar
            name={displayName || user?.name}
            email={user?.email}
            image={user?.image}
            size="xl" 
            editable={true} 
          />

          {/* Student Identity Input Field (Permanent Local Storage Engine Switch) */}
          <div className="mt-4 border-t border-zinc-900 pt-5 w-full">
            <div className="flex items-center justify-between px-1 mb-1.5 select-none">
              <label className="block text-left text-[9px] font-black uppercase tracking-widest text-zinc-500">
                Student Identifier
              </label>
              
              {/* Dynamic Edit/Save state action router */}
              {isEditingName ? (
                <button
                  onClick={handleSaveName}
                  className="text-[9px] font-black uppercase tracking-wider text-[#10B981] bg-emerald-500/5 hover:bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  Save Identity
                </button>
              ) : (
                <button
                  onClick={() => setIsEditingName(true)}
                  className="text-[9px] font-black uppercase tracking-wider text-amber-500 bg-amber-500/5 hover:bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg transition-colors cursor-pointer"
                >
                  ✏️ Alter Name
                </button>
              )}
            </div>

            {isEditingName ? (
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSaveName()}
                className="w-full text-center sm:text-left rounded-xl border border-zinc-800 bg-[#161616] px-4 py-3 text-xs text-white font-black outline-hidden focus:border-zinc-700 shadow-inner animate-in fade-in duration-100"
                placeholder="Type display alias name..."
                autoFocus
              />
            ) : (
              <div className="rounded-xl bg-[#161616]/40 px-4 py-3 text-white font-black text-xs text-center sm:text-left border border-zinc-900/60 truncate shadow-inner">
                {displayName || "Campus Student"}
              </div>
            )}
          </div>

          {/* Locked Secure Corporate Institutional Email Node */}
          <div className="w-full">
            <label className="block text-left text-[9px] font-black uppercase tracking-widest text-zinc-500 px-1 mb-1.5 select-none">
              IITP Directory Node Email
            </label>
            <div className="rounded-xl bg-[#161616]/20 px-4 py-3 text-zinc-500 font-mono text-[11px] text-center sm:text-left border border-zinc-900/40 truncate shadow-inner cursor-not-allowed">
              {user?.email || "Resolving security layers..."}
            </div>
          </div>
        </div>

        {/* Informational Subtext Disclaimer */}
        <div className="mt-8 pt-4 border-t border-zinc-900 select-none">
          <p className="text-center text-[10px] leading-relaxed text-zinc-600 font-medium">
            Identity variables persist directly inside local storage caches and sync flawlessly with active server directory requests.
          </p>
        </div>
      </div>

    </div>
  );
}