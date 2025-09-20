import React from "react";
import { User } from "lucide-react";

interface AvatarProps {
  src?: string;
  alt?: string;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  isOnline?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  alt = "Avatar",
  size = "md",
  className = "",
  isOnline,
}) => {
  const sizeClasses = {
    sm: "w-8 h-8",
    md: "w-12 h-12",
    lg: "w-16 h-16",
    xl: "w-24 h-24",
  };

  const iconSizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };

  // Determine the image source - handle data URLs and regular paths
  const getImageSrc = () => {
    if (!src) return null;

    // If it's already a data URL, use it directly
    if (src.startsWith("data:")) {
      return src;
    }

    // If it's a filename (no path separators), prepend the assets path
    if (
      !src.includes("/") &&
      !src.startsWith("http") &&
      src !== "default.png"
    ) {
      return `/assets/avatars/${src}`;
    }

    // For default.png or full paths, use as-is
    return src.startsWith("/") || src.startsWith("http")
      ? src
      : `/assets/avatars/${src}`;
  };

  const imageSrc = getImageSrc();

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div
        className={`${sizeClasses[size]} rounded-full overflow-hidden bg-gray-200 flex items-center justify-center`}
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = "none";
              target.nextElementSibling?.classList.remove("hidden");
            }}
          />
        ) : null}
        <User
          className={`${iconSizes[size]} text-gray-400 ${
            imageSrc ? "hidden" : ""
          }`}
        />
      </div>

      {isOnline && (
        <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
      )}
    </div>
  );
};
