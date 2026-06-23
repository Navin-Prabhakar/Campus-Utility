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
  const pathname = usePathname();

  // Calculate unread counts dynamically
  const unseenCount = useUnseenNotices(showNotificationModal);

  // 📱 NEW: State markers for track scrolling hide/show effects safely on phone/desktop
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

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
  const isTourActive = pathname === "/tour";

  return (
    <>
    {/* 🛠️ THE FIX: Added pointer-events-none here so the structural overlay bounds don't hijack background frame click vectors */}
    <header className={`w-full fixed top-0 left-0 z-50 pointer-events-none transition-transform duration-300 ease-in-out ${
      isVisible ? "translate-y-0" : "-translate-y-full"
    }`}>
      {/* Upper Header */}
      {/* 🛠️ THE FIX: Restored active clickable events using pointer-events-auto */}
      <div className="flex h-12 items-center justify-between bg-black px-2 text-white pointer-events-auto">
        <div className="flex items-center gap-2 text-xl font-semibold">
          <Image
            src="/iitp-logo.png"
            alt="IIT Patna logo"
            width={1080}
            height={1080}
            className="h-10 w-10"
          />
          IITP Unofficial
        </div>

        <div className="flex items-center gap-1.5">
          {/* Notification Bell Button with Badge Counter */}
          <button
            onClick={() => setShowNotificationModal(true)}
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
                  onClick={() => setShowMenu(!showMenu)}
                  className="flex items-center gap-1.5 rounded-full border border-purple-700/80 bg-white/10 px-0 py-0 transition hover:bg-white/20"
                  aria-label="Profile menu"
                >
                  <ProfileAvatar
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    size="md"
                  />
                  <span className="hidden sm:inline text-sm font-medium max-w-[100px] truncate">
                    {user.name || user.email}
                  </span>
                </button>
              ) : (
                <Link
                  href="/signin"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-white/40 bg-white/10 text-sm font-semibold transition hover:bg-white/20 sm:w-auto sm:px-4"
                >
                  <span className="sm:hidden">Sign In</span>
                  <span className="hidden sm:inline">Sign In</span>
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
      <div className="flex h-8 bg-zinc-900 items-center justify-between px-2 pointer-events-auto">
        <div className="flex items-center gap-2">
          {/* 🛠️ MODIFIED: Added dynamic text/bg classes based on active state */}
          <div className={`rounded-xl items-center justify-between px-2 transition-colors duration-100 ${
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
          
          {/* 🛠️ MODIFIED: Added dynamic text/bg classes based on active state */}
          <div className={`rounded-xl items-center justify-between px-2 transition-colors duration-200 ${
            isTourActive ? "bg-slate-300 text-zinc-800 " : "bg-zinc-600 text-white"
          }`}>
            <Link 
              href="/tour" 
              className="flex items-center gap-0 text-inherit text-md"
              aria-label="Go to campus tour page"
            >
              <span>Campus Tour</span>
            </Link>
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