"use client";

import React, { useEffect, useState } from "react";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
  editable?: boolean; // 🟢 Toggle to allow uploading on profile pages
}

export default function ProfileAvatar({
  name = "User",
  email,
  image: initialImage,
  size = "md",
  editable = false,
}: ProfileAvatarProps) {
  const [currentImage, setCurrentImage] = useState<string | null>(initialImage || null);
  const [isUploading, setIsSubmitting] = useState(false);

  // Sync image if props load asynchronously from Next-Auth session
  useEffect(() => {
    if (initialImage) setCurrentImage(initialImage);
  }, [initialImage]);

  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0] ?? "User").substring(0, 2).toUpperCase();

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-16 w-16 text-lg", // Slightly increased lg size for better display on settings/profile cards
  };

  const colors = [
    "bg-red-500", "bg-blue-500", "bg-green-500", "bg-yellow-500",
    "bg-purple-500", "bg-pink-500", "bg-indigo-500", "bg-cyan-500",
  ];

  const colorIndex = email
    ? email.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
    : 0;

  // 🛠️ Handle Upload File Vector Conversion (Converts to Base64 String for Lifetime Secure Sync)
  const handleAvatarFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Guard constraint sizing limits (Keep it under 1MB for smooth DB storage)
    if (file.size > 1024 * 1024) {
      alert("Image profile file size must be less than 1MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;
      setIsSubmitting(true);

      try {
        const response = await fetch("/api/user/profile-picture", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ imageUrl: base64String }),
        });

        if (response.ok) {
          setCurrentImage(base64String);
        } else {
          alert("Failed to synchronize user picture database entry.");
        }
      } catch (err) {
        console.error(err);
        alert("Connection timeout targeting database profile matrix.");
      } finally {
        setIsSubmitting(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative group">
      <div
        className={`${sizeClasses[size]} ${colors[colorIndex]} flex items-center justify-center rounded-full font-semibold text-white overflow-hidden relative shadow-sm`}
        title={`${name} ${email ? `(${email})` : ""}`}
      >
        {currentImage ? (
          <img src={currentImage} alt={name || "Profile"} className="h-full w-full object-cover rounded-full" />
        ) : (
          initials
        )}

        {/* 🟢 Loading overlay during database sync process */}
        {isUploading && (
          <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-[10px] text-white">
            ⏳
          </div>
        )}
      </div>

      {/* 🟢 Interactive Click-to-Upload layer overlay (Shows only if editable is passed true) */}
      {editable && !isUploading && (
        <label className="absolute inset-0 rounded-full bg-black/40 text-white opacity-0 hover:opacity-100 transition-opacity duration-150 flex items-center justify-center text-[10px] font-bold cursor-pointer select-none">
          <span>Edit 📷</span>
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