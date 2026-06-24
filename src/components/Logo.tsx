import React from 'react';
import Image from 'next/image';

interface LogoProps {
  className?: string;
  showText?: boolean;
  iconSize?: "sm" | "md" | "lg" | "xl";
}

export default function Logo({ className = "", showText = true, iconSize = "md" }: LogoProps) {
  // Define sizes
  const sizes = {
    sm: { container: "w-8 h-8", text: "text-base" },
    md: { container: "w-12 h-12", text: "text-[22px]" },
    lg: { container: "w-16 h-16", text: "text-[28px]" },
    xl: { container: "w-24 h-24", text: "text-4xl" },
  };

  const activeSize = sizes[iconSize];

  return (
    <div className={`flex items-center justify-center gap-3 ${className}`}>
      {/* Icon Container */}
      <div className={`flex-shrink-0 ${activeSize.container} relative flex items-center justify-center`}>
        <Image 
          src="/smi-logo-clean.png" 
          alt="Support Mission India Logo" 
          fill
          className="object-contain drop-shadow-sm"
          priority
        />
      </div>

      {/* Text */}
      {showText && (
        <div className="flex flex-col text-left">
          <h1 className={`${activeSize.text} leading-tight font-black tracking-tight text-[#0f172a]`}>
            SUPPORT MISSION INDIA
          </h1>
        </div>
      )}
    </div>
  );
}
