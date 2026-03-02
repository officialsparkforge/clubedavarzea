import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Home, ShoppingBag, ShoppingCart, Heart, User } from 'lucide-react';
import { cn } from "@/lib/utils";

const navItems = [
  { name: 'Início', icon: Home, page: 'Home' },
  { name: 'Loja', icon: ShoppingBag, page: 'Shop' },
  { name: 'Carrinho', icon: ShoppingCart, page: 'Cart' },
  { name: 'Perfil', icon: User, page: 'Profile' },
];

export default function BottomNav({ cartCount = 0 }) {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A]/98 backdrop-blur-lg border-t border-[#2a2a2a] safe-area-bottom">
      <div className="max-w-lg mx-auto flex items-center justify-around py-2 pb-safe">
        {navItems.map((item) => {
          const isActive = currentPath.includes(item.page);
          const Icon = item.icon;
          
          return (
            <Link
              key={item.name}
              to={createPageUrl(item.page)}
              className={cn(
                "flex flex-col items-center gap-1 px-3 md:px-4 py-2 rounded-xl transition-all duration-300 relative min-w-[64px] min-h-[56px] active:scale-95",
                isActive 
                  ? "text-[#00FF85]" 
                  : "text-[#666] hover:text-white"
              )}
            >
              {isActive && (
                <div className="absolute inset-0 bg-[#00FF85]/10 rounded-xl" />
              )}
              <div className="relative">
                <Icon className={cn(
                  "w-6 h-6 transition-all",
                  isActive && "drop-shadow-[0_0_8px_rgba(0,255,133,0.8)]"
                )} />
                {item.page === 'Cart' && cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 min-w-[18px] h-[18px] px-1 bg-[#00FF85] text-black text-[10px] font-bold rounded-full flex items-center justify-center">
                    {cartCount > 99 ? '99+' : cartCount}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium relative z-10 whitespace-nowrap">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}