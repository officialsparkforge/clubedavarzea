import React from 'react';
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function NeonButton({ children, className, variant = "primary", ...props }) {
  const baseStyles = "relative font-bold uppercase tracking-wider transition-all duration-300";
  
  const variants = {
    primary: `
      bg-[#00FF85] text-black hover:bg-[#00FF85]/90
      shadow-[0_0_20px_rgba(0,255,133,0.4)]
      hover:shadow-[0_0_30px_rgba(0,255,133,0.6),0_0_60px_rgba(0,255,133,0.3)]
    `,
    outline: `
      bg-transparent border-2 border-[#00FF85] text-[#00FF85]
      hover:bg-[#00FF85]/10
      shadow-[0_0_10px_rgba(0,255,133,0.2)]
      hover:shadow-[0_0_20px_rgba(0,255,133,0.4)]
    `,
    ghost: `
      bg-transparent text-[#00FF85] hover:bg-[#00FF85]/10
    `
  };

  return (
    <Button
      className={cn(baseStyles, variants[variant], className)}
      {...props}
    >
      {children}
    </Button>
  );
}