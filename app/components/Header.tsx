"use client";

import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import ProfileAvatar from "./ProfileAvatar";
// Import custom hook and your Notification Modal component
import NotificationModal from "./NoticeBox";
import { useUnseenNotices } from "../../hooks/useUnseenNotices";

interface HeaderProps {
  messActionSlot?: React.ReactNode; 
}

export default function Header({ messActionSlot }: HeaderProps) {
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = React.useState(false);
  const [showNotificationModal, setShowNotificationModal] = React.useState(false); // Modal control state
  
  // 🟢 NEW: Local state marker to manage your compact floating tour portal window
  const [showTourDropdown, setShowTourDropdown] = React.useState(false);

  const pathname = usePathname();

  // Calculate unread counts dynamically
  const unseenCount = useUnseenNotices(showNotificationModal);

  // 📱 NEW: State markers for track scrolling hide/show effects safely on phone/desktop
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  const officialTourUrl = "https://www.iitp.ac.in/visit/campus-tour";

  useEffect(() => {
    const handleScrollVector = () => {
      const currentScrollY = window.scrollY;
      const windowHeight = window.innerHeight;
      const totalDocumentHeight = document.documentElement.scrollHeight;

      // 1. Safe boundary: Skip calculating negative/out-of-bound elastic tracking common on iOS safari
      if (currentScrollY < 0) return;

      // 🎯 THE BOTTOM DETECTION TRAP:
      // Evaluates view offsets dynamically to force header visibility 
      // when hitting the base threshold limit (with a safe 3px display matrix buffer).
      const isAtAbsoluteBottom = (currentScrollY + windowHeight) >= (totalDocumentHeight - 3);

      if (isAtAbsoluteBottom) {
        setIsVisible(true);
        setLastScrollY(currentScrollY);
        return;
      }

      const maxScrollableHeight = totalDocumentHeight - windowHeight;
      if (currentScrollY > maxScrollableHeight) return;

      // 2. Intentionality boundary: Skip layout shifting for tiny micro-movements (under 5px)
      if (Math.abs(currentScrollY - lastScrollY) < 5) return;

      // 3. Evaluate scroll heading
      if (currentScrollY > lastScrollY && currentScrollY > 60) {
        setIsVisible(false); // Scrolling down -> hide
      } else {
        setIsVisible(true);  // Scrolling up -> show
      }

      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScrollVector, { passive: true });
    return () => window.removeEventListener("scroll", handleScrollVector);
  }, [lastScrollY]);

  const user = session?.user;
  const loading = status === "loading";

  const handleSignOut = async () => {
    setShowMenu(false);
    await signOut({ callbackUrl: "/signin" });
  };

  // Determine active states for sub-navigation links
  const isHomeActive = pathname === "/";

  return (
    <>
    {/* 🛠️ THE FIX: Added pointer-events-none here so the structural overlay bounds don't hijack background frame click vectors */}
    <header className={`w-full fixed top-0 left-0 z-50 pointer-events-none transition-transform duration-300 ease-in-out ${
      isVisible ? "translate-y-0" : "-translate-y-full"
    }`}>
      {/* Upper Header */}
      {/* 🛠️ THE FIX: Restored active clickable events using pointer-events-auto */}
      <div className="flex h-12 items-center justify-between bg-sky-900 px-1 text-white pointer-events-auto">
        <div className="flex items-center gap-0 text-2xl">
          <Image
            src="/CU-logo1.png"
            alt="CU logo"
            width={1080}
            height={1080}
            className="h-13 w-13"
          />
          Campus Utility
        </div>

        <div className="flex items-center gap-1.5">
          {/* Notification Bell Button with Badge Counter */}
          <button
            onClick={() => {
              setShowNotificationModal(true);
              setShowTourDropdown(false); // Close tour popup if open
            }}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center text-sm text-white transition hover:bg-white/10 active:bg-white/10 active:scale-95 rounded-lg cursor-pointer select-none"
          >
            <img
              src="/notification_bell.png"
              alt="Notifications"
              className="h-7 w-7 object-contain"
            />
            {unseenCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-600 text-[9px] font-extrabold text-white animate-pulse shadow-md border border-slate-900">
                {unseenCount > 9 ? "9+" : unseenCount}
              </span>
            )}
          </button>

          <div className="relative">
            {!loading ? (
              user ? (
                <button
                  onClick={() => {
                    setShowMenu(!showMenu);
                    setShowTourDropdown(false); // Close tour popup if open
                  }}
                  className="flex items-center gap-1.5 rounded-full border border-zinc-700/80 bg-white/10 px-0 py-0 transition hover:bg-white/20"
                  aria-label="Profile menu"
                >
                  <ProfileAvatar
                    name={user.name}
                    email={user.email}
                    size="md"
                  />
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="flex h-10 w-10 flex-col items-center justify-center rounded-full border border-white/40 bg-white/10 font-semibold transition hover:bg-white/20 select-none"
                >
                  <span className="text-[12px]  tracking-normal leading-[1.1]">Sign</span>
                  <span className="text-[12px]  tracking-normals leading-[1.1]">In</span>
                </Link>
              )
            ) : (
              <div className="h-10 w-10 rounded-full bg-white/10 animate-pulse" />
            )}

            {/* Profile Dropdown Menu */}
            {user && showMenu && (
              <div className="absolute right-0 top-full mt-2 w-52 rounded-lg bg-slate-900 text-slate-100 shadow-xl z-50 py-0 border border-slate-700">
                <div className="border-b border-slate-400 px-4 py-2">
                  <p className="font-semibold text-sm truncate">{user.name}</p>
                  <p className="text-xs text-slate-400 truncate font-mono">{user.email}</p>
                </div>
                
                {/* NEW: Link navigation to profile settings workspace route */}
                <Link
                  href="/profile"
                  onClick={() => setShowMenu(false)}
                  className="flex w-full px-4 py-2 text-left text-md text-slate-200 hover:bg-slate-100 hover:text-zinc-800 transition items-center gap-2"
                >
                  ⚙️ Profile Settings
                </Link>

                <hr className="border-slate-400 my-0" />

                {/* 🛠️ FIX: Replaced invalid px-18 class with standard px-4 alignment layout rules */}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-600 hover:text-white font-bold transition rounded-b-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Header */}
      {/* 🛠️ THE FIX: Restored active clickable events using pointer-events-auto */}
      <div className="flex h-8 bg-sky-900 items-center justify-between px-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* 🛠️ MODIFIED: Added dynamic text/bg classes based on active state */}
          <div className={`rounded-xl items-center justify-between px-1.5 py-0.5 transition-colors duration-100 ${
            isHomeActive ? "bg-slate-300 text-zinc-800 " : "bg-zinc-600 text-white"
          }`}>
            <Link 
              href="/" 
              className="flex items-center gap-0 text-inherit text-md"
              aria-label="Go to home page"
            >
              <span>Home</span>
            </Link>
          </div>
          
          {/* 🟢 FLOATING DROPDOWN CONTAINER FOR CAMPUS TOUR */}
          <div className="relative">
            <button 
              onClick={() => {
                setShowTourDropdown(!showTourDropdown);
                setShowMenu(false); // Close profile dropdown if open
              }}
              className={`rounded-xl items-center justify-between px-1.5 py-0.5 transition-colors duration-200 text-md cursor-pointer select-none ${
                showTourDropdown ? "bg-slate-300 text-zinc-800" : "bg-zinc-600 text-white"
              }`}
              aria-label="Toggle campus tour links menu"
            >
              <span>Campus Tour</span>
            </button>

            {/* FLOATING TEXT OVERLAY PANEL */}
            {showTourDropdown && (
              <div className="absolute left-0 top-full mt-2 w-60 rounded-xl bg-slate-900 text-slate-100 shadow-2xl z-50 p-3.5 border border-slate-700 animate-in fade-in slide-in-from-top-1 duration-150">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-sky-400 mb-1">
                  <span>🗺️</span> Campus Tour
                </div>
                
                <p className="text-[11px] text-slate-300 leading-relaxed mb-3 font-medium">
                  Explore hostels, tutorial blocks, and academic infrastructures live.
                </p>
                
                <div className="flex gap-2">
                  <a
                    href={officialTourUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setShowTourDropdown(false)}
                    className="flex-1 bg-sky-600 hover:bg-sky-500 transition text-white font-bold text-[11px] py-1.5 px-3 rounded-lg text-center shadow-md shadow-sky-600/20"
                  >
                    Open Window ↗
                  </a>
                  <button
                    onClick={() => setShowTourDropdown(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 transition text-zinc-400 text-[11px] py-1.5 px-2.5 rounded-lg font-medium"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center">
          {pathname === "/mess" && messActionSlot}
        </div>
      </div>
    </header>      

    {/* Render Notification Overlay Drawer */}
    <NotificationModal 
      isOpen={showNotificationModal}
      onClose={() => setShowNotificationModal(false)}
    />
    </>
  );
}