"use client";

interface ProfileAvatarProps {
  name?: string | null;
  email?: string | null;
  image?: string | null;
  size?: "sm" | "md" | "lg";
}

export default function ProfileAvatar({
  name = "User",
  email,
  image,
  size = "md",
}: ProfileAvatarProps) {
  const parts = name?.trim().split(/\s+/).filter(Boolean) ?? [];
  const initials =
    parts.length > 1
      ? `${parts[0][0]}${parts[1][0]}`.toUpperCase()
      : (parts[0] ?? "User").substring(0, 2).toUpperCase();

  const sizeClasses = {
    sm: "h-8 w-8 text-xs",
    md: "h-10 w-10 text-sm",
    lg: "h-12 w-12 text-base",
  };

  const colors = [
    "bg-red-500",
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
    "bg-indigo-500",
    "bg-cyan-500",
  ];

  // Generate consistent color based on email
  const colorIndex =
    email
      ? email
          .split("")
          .reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length
      : 0;

  return (
    <div
      className={`${sizeClasses[size]} ${colors[colorIndex]} flex items-center justify-center rounded-full font-semibold text-white`}
      title={`${name} ${email ? `(${email})` : ""}`}
    >
      {image ? (
        <img src={image} alt={name || "Profile"} className="h-full w-full rounded-full object-cover" />
      ) : (
        initials
      )}
    </div>
  );
}
