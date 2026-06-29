"use client";

import React from "react";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  size?: "sm" | "md" | "lg" | "xl"; 
}

export default function ProfileAvatar({
  name = "User",
  email,
  size = "md",
}: ProfileAvatarProps) {
  
  // 1. Generate clean initials from the user's name
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0] ?? "User").substring(0, 2).toUpperCase();

  // 2. Clear mapping for structural dimensions
  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-32 w-32 text-4xl", 
  };

  // 3. Stable background color generation based on the unique email string
  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
  ];

  const colorIndex = email
    ? email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  return (
    <div className="flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colors[colorIndex]} flex items-center justify-center rounded-full font-semibold text-white overflow-hidden shadow-md`}
        title={`${name} (${email || ""})`}
      >
        {initials}
      </div>
    </div>
  );
}