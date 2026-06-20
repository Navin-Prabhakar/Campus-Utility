"use client";

import React from "react";
import { useSession, signOut } from "next-auth/react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation"; 
import ProfileAvatar from "./ProfileAvatar";
// 📝 Import custom hook and your Notification Modal component
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

  // 🔔 Calculate unread counts dynamically
  const unseenCount = useUnseenNotices(showNotificationModal);

  const user = session?.user;
  const loading = status === "loading";

  const handleSignOut = async () => {
    setShowMenu(false);
    await signOut({ callbackUrl: "/signin" });
  };

  return (
    <header className="w-full">
      {/* Upper Header */}
      <div className="flex h-12 items-center justify-between bg-slate-900 px-6 text-white">
        <div className="flex items-center gap-3 text-lg font-semibold">
          <Image
            src="/iitp-logo.png"
            alt="IIT Patna logo"
            width={1080}
            height={1080}
            className="h-10 w-10"
          />
          IITP Unofficial
        </div>

        <div className="flex items-center gap-3">
          {/* 🔔 Notification Bell Button with Badge Counter */}
          <button
            onClick={() => setShowNotificationModal(true)}
            aria-label="Notifications"
            className="relative flex h-10 w-10 items-center justify-center text-sm text-white transition hover:bg-white/10 rounded-lg cursor-pointer"
          >
            <img
              src="/notification_bell.png"
              alt="Notifications"
              className="h-6 w-6 object-contain"
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
                  className="flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-2 py-1 transition hover:bg-white/20"
                  aria-label="Profile menu"
                >
                  <ProfileAvatar
                    name={user.name}
                    email={user.email}
                    image={user.image}
                    size="sm"
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
              <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white text-slate-900 shadow-xl z-50">
                <div className="border-b border-slate-200 px-4 py-3">
                  <p className="font-semibold">{user.name}</p>
                  <p className="text-sm text-slate-600">{user.email}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-slate-100 transition rounded-b-lg"
                >
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Lower Header */}
      <div className="flex h-7 bg-sky-900 items-center justify-between px-3">
        <div className="flex items-center gap-4">
          <Link 
            href="/" 
            className="flex items-center gap-1 text-sky-100 hover:text-white transition-colors text-xs font-bold"
            aria-label="Go to home page"
          >
            <span>🏠</span>
            <span>Home</span>
          </Link>

          <Link 
            href="/tour" 
            className="flex items-center gap-1 text-sky-100 hover:text-white transition-colors text-xs font-bold"
            aria-label="Go to campus tour page"
          >
            <span>Campus Tour</span>
          </Link>
        </div>

        <div className="flex items-center">
          {pathname === "/mess" && messActionSlot}
        </div>
      </div>

      {/* 🔮 Render Notification Overlay Drawer */}
      <NotificationModal 
        isOpen={showNotificationModal}
        onClose={() => setShowNotificationModal(false)}
      />
    </header>
  );
}