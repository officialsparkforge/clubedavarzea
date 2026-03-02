import React from 'react';
import { cn } from "@/lib/utils";

export default function CategoryPill({ label, icon: Icon, isActive, onClick }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all duration-300 border",
        isActive
          ? "bg-[#00FF85] text-black border-[#00FF85] shadow-[0_0_15px_rgba(0,255,133,0.4)]"
          : "bg-[#1a1a1a] text-white border-[#2a2a2a] hover:border-[#00FF85]/50 hover:shadow-[0_0_10px_rgba(0,255,133,0.2)]"
      )}
    >
      {Icon && <Icon className="w-4 h-4" />}
      <span className="text-sm font-medium">{label}</span>
    </button>
  );
}