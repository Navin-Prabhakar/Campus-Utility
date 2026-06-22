"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg" | "xl"; 
  editable?: boolean;
}

export default function ProfileAvatar({
  name = "User",
  email,
  image: initialImage,
  size = "md",
  editable = false,
}: ProfileAvatarProps) {
  const { data: session, update } = useSession();
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [isUploading, setIsSubmitting] = useState(false);

  // 🟢 AUTOMATICALLY FETCH RECENT AVATAR FROM DRIVE ON LOAD (FIXED FOR BINARY BLOB STREAMS)
  useEffect(() => {
    let objectUrl: string | null = null;

    async function fetchRecentAvatar() {
      if (!email) return;
      try {
        const response = await fetch(`/api/user/get-avatar?email=${encodeURIComponent(email)}`);
        if (response.ok) {
          // 🛠️ THE FIX: Instead of reading JSON, capture the raw binary stream data
          const blob = await response.blob();
          
          // Generate a secure temporary client URL referencing that stream chunk
          objectUrl = URL.createObjectURL(blob);
          setCurrentImage(objectUrl);
        }
      } catch (err) {
        console.error("Error fetching recent avatar from Drive:", err);
      }
    }

    if (!initialImage) {
      fetchRecentAvatar();
    } else {
      setCurrentImage(initialImage);
    }

    // 🧹 CLEANUP: Release local memory reference when the user leaves or updates email
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [initialImage, email]);

  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0] ?? "User").substring(0, 2).toUpperCase();

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg",
    xl: "h-32 w-32 text-4xl", 
  };

  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
  ];

  const colorIndex = email
    ? email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      alert("Please select a valid image file.");
      return;
    }

    const localPreviewUrl = URL.createObjectURL(file);
    setCurrentImage(localPreviewUrl);
    setIsSubmitting(true);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/user/upload-avatar", {
        method: "POST",
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        setCurrentImage(data.imageUrl); 
        
        // Synchronize with the active NextAuth state
        await update({
          ...session,
          user: {
            ...session?.user,
            image: data.imageUrl
          }
        });
      } else {
        alert(data.error || "Failed to upload image to Google Drive.");
        setCurrentImage(initialImage ?? null); 
      }
    } catch (err) {
      console.error(err);
      alert("Connection timeout targeting the server gateway.");
      setCurrentImage(initialImage ?? null); 
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative group flex items-center justify-center">
      <div
        className={`${sizeClasses[size]} ${colors[colorIndex]} flex items-center justify-center rounded-full font-semibold text-white overflow-hidden relative shadow-md transition-all duration-200`}
        title={`${name} (${email || ""})`}
      >
        {currentImage ? (
          <img src={currentImage} alt={name || "Profile"} className="h-full w-full object-cover rounded-full" />
        ) : (
          initials
        )}

        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-xs text-white font-bold">
            ⏳
          </div>
        )}
      </div>

      {editable && !isUploading && (
        <label className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex flex-col items-center justify-center text-xs font-bold cursor-pointer select-none">
          <span>📷</span>
          <span className="text-[10px] mt-0.5">Edit Photo</span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleAvatarFileChange}
          />
        </label>
      )}
    </div>
  );
}