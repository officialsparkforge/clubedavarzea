import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/lib/AuthContext';
import { base44 } from '@/api/base44Client';
import { getOrCreateAnonymousId } from '@/lib/utils';
import BottomNav from '@/components/ui/BottomNav';
import { LogOut, Settings, Package, LayoutGrid, Menu, X } from 'lucide-react';

export default function Layout({ children, currentPageName }) {
  const navigate = useNavigate();
  const { user, isAdmin, logout } = useAuth();
  const hideNav = ['Checkout', 'Payment', 'Invoice', 'Tracking'].includes(currentPageName);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);
  
  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!currentUser?.email) {
          // Usuário não logado - usar ID anônimo
          return base44.entities.CartItem.filter({ created_by: getOrCreateAnonymousId() });
        }
        return base44.entities.CartItem.filter({ created_by: currentUser.email });
      } catch {
        // Se falhar em obter user, usar ID anônimo
        return base44.entities.CartItem.filter({ created_by: getOrCreateAnonymousId() });
      }
    },
  });
  
  const cartCount = cartItems?.length || 0;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen text-white relative" style={{ background: 'transparent' }}>
      <style>{`
        :root {
          --neon-green: #00FF85;
          --bg-dark: #0A0A0A;
          --bg-card: #141414;
          --border-color: #2a2a2a;
        }
        
        body {
          background: linear-gradient(180deg, #001a0a 0%, #0a1f14 50%, #001a0a 100%);
          background-attachment: fixed;
        }
        
        * {
          scrollbar-width: thin;
          scrollbar-color: #2a2a2a #0A0A0A;
        }
        
        *::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        
        *::-webkit-scrollbar-track {
          background: #0A0A0A;
        }
        
        *::-webkit-scrollbar-thumb {
          background: #2a2a2a;
          border-radius: 3px;
        }

        .neon-text {
          text-shadow: 0 0 10px rgba(0, 255, 133, 0.8);
        }

        .neon-border {
          box-shadow: 0 0 10px rgba(0, 255, 133, 0.3);
        }
      `}</style>

      {/* Header with Auth Info */}
      <header className="sticky top-0 z-50 border-b border-[#00FF85]/20 bg-black/80 backdrop-blur-sm">
        <div className="max-w-[1920px] mx-auto px-4 py-3 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="text-xl font-bold">
            Clube <span className="text-[#00FF85]">Várzea</span>
          </Link>

          {/* User Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-4">
                {/* Admin Menu - Desktop */}
                {isAdmin() && (
                  <Link
                    to="/AdminDashboard"
                    className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#00FF85]/10 text-[#00FF85] hover:bg-[#00FF85]/20 transition-all text-sm font-medium border border-[#00FF85]/30"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                )}

                {/* User Info */}
                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-[#1A1A1A] border border-white/10">
                  <span className="text-2xl">{user.avatar}</span>
                  <div>
                    <p className="text-sm font-medium text-white">{user.name}</p>
                    <p className="text-xs text-gray-400">
                      {isAdmin() ? '👑 Admin Master' : 'Cliente'}
                    </p>
                  </div>
                </div>

                {/* Logout */}
                <button
                  onClick={handleLogout}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg text-red-400 hover:bg-red-500/10 transition-all text-sm font-medium border border-red-500/20"
                  title="Sair"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className="px-4 py-2 rounded-lg bg-[#00FF85] text-black hover:bg-[#00FF85]/90 transition-all text-sm font-semibold"
              >
                Entrar
              </Link>
            )}
          </div>
        </div>
      </header>

      <main className={!hideNav ? "pb-24 max-w-[1920px] mx-auto" : "max-w-[1920px] mx-auto"}>
        {children}
      </main>
      
      {!hideNav && <BottomNav cartCount={cartCount} />}
    </div>
  );
}