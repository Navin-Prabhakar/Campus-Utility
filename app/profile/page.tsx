"use client";

import { useSession } from "next-auth/react";
import ProfileAvatar from "../components/ProfileAvatar"; 

export default function ProfileSettingsPage() {
  const { data: session } = useSession();
  const user = session?.user;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-slate-900 to-slate-800 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl text-center">
        <h2 className="text-xl font-bold text-slate-900">Profile Settings</h2>
        <p className="text-sm text-slate-500 mb-8">Customize your campus utility card details</p>

        <div className="flex flex-col items-center justify-center gap-4">
          {/* Invoking your modular avatar component in 'xl' size */}
          <ProfileAvatar
            name={user?.name}
            email={user?.email}
            image={user?.image}
            size="xl" 
            editable={true} 
          />

          {/* Student Info Fields */}
          <div className="mt-4 border-t border-slate-100 pt-4 w-full">
            <label className="block text-left text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Student Name
            </label>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-slate-800 font-medium text-left border border-slate-200 truncate">
              {user?.name || "Campus Student"}
            </div>
          </div>

          <div className="w-full">
            <label className="block text-left text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              IITP Campus Email
            </label>
            <div className="rounded-lg bg-slate-50 px-4 py-3 text-slate-600 font-mono text-sm text-left border border-slate-200 truncate">
              {user?.email || "Loading connection..."}
            </div>
          </div>
        </div>

        <div className="mt-6 pt-4 border-t border-slate-100">
          <p className="text-center text-xs text-slate-400">
            Profile changes sync instantly with your secure Google Drive campus directory.
          </p>
        </div>
      </div>
    </div>
  );
}