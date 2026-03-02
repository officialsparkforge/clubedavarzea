import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { ChevronRight, Sparkles, Trophy, Globe, Star, Shirt, Clock, Settings } from 'lucide-react';
import SearchBar from '@/components/ui/SearchBar';
import CategoryPill from '@/components/ui/CategoryPill';
import ProductCard from '@/components/ui/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import NeonButton from '@/components/ui/NeonButton';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

function PromoCountdown() {
  const [timeLeft, setTimeLeft] = useState({ days: 7, hours: 12, minutes: 30, seconds: 0 });

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev.seconds > 0) return { ...prev, seconds: prev.seconds - 1 };
        if (prev.minutes > 0) return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        if (prev.hours > 0) return { ...prev, hours: prev.hours - 1, minutes: 59, seconds: 59 };
        if (prev.days > 0) return { ...prev, days: prev.days - 1, hours: 23, minutes: 59, seconds: 59 };
        return prev;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex items-center gap-3">
      <Clock className="w-5 h-5 text-[#00FF85]" />
      <div className="flex gap-2">
        {[
          { value: timeLeft.days, label: 'Dias' },
          { value: timeLeft.hours, label: 'Hrs' },
          { value: timeLeft.minutes, label: 'Min' },
          { value: timeLeft.seconds, label: 'Seg' },
        ].map((item, i) => (
          <div key={i} className="text-center">
            <div className="bg-[#00FF85]/10 border border-[#00FF85]/30 rounded-lg px-3 py-2 min-w-[60px]">
              <span className="text-2xl font-bold text-[#00FF85]">{String(item.value).padStart(2, '0')}</span>
            </div>
            <span className="text-[10px] text-[#666] mt-1 block">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

const categories = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'brasileirao', label: 'Brasileirão', icon: Trophy },
  { id: 'europeus', label: 'Europeus', icon: Globe },
  { id: 'selecoes', label: 'Seleções', icon: Star },
  { id: 'raros', label: 'Raros', icon: Shirt },
];

export default function Home() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const referralCode = urlParams.get('ref');
  
  // Persist referral code
  React.useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
    }
  }, [referralCode]);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 50),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Favorite.filter({ created_by: user.email });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId) => {
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ product_id: productId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['favorites']),
  });

  const favoriteIds = favorites.map(f => f.product_id);

  const featuredProducts = products.filter(p => p.is_featured);
  const newProducts = products.filter(p => p.is_new);

  const filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.team.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    return matchSearch && matchCategory;
  });

  return (
    <div className="min-h-screen">
      {/* Hero Banner */}
      <div className="relative h-[260px] md:h-[400px] overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#1a1a1a] via-[#0A0A0A] to-[#0A0A0A]" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800')] bg-cover bg-center opacity-20" style={{ backgroundAttachment: 'fixed' }} />

        {/* Neon glow effects */}
        <div className="absolute top-1/2 left-1/4 w-64 h-64 bg-[#00FF85] rounded-full blur-[150px] opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-48 h-48 bg-[#00FF85] rounded-full blur-[120px] opacity-15" />

        <div className="relative z-10 h-full flex flex-col items-center justify-center px-4 md:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-3 md:mb-4"
          >
            <img 
              src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/695d56a3bfdac72952de5270/2cbe98b7c_logo.png"
              alt="Clube da Várzea"
              loading="eager"
              className="h-32 md:h-40 w-auto mx-auto drop-shadow-[0_0_30px_rgba(0,255,133,0.6)]"
            />
          </motion.div>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-[#888] text-xs md:text-base max-w-md px-4"
          >
            As melhores camisas de futebol do mundo em um só lugar
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-4 md:mt-6"
          >
            <Link to={createPageUrl('Shop')}>
              <NeonButton className="text-sm md:text-base px-6 py-3">
                Ver Coleção
                <ChevronRight className="w-4 h-4 ml-1" />
              </NeonButton>
            </Link>
          </motion.div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6 space-y-8">
        {/* Promoção de Inauguração */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-[#00FF85]/20 via-[#00FF85]/10 to-transparent border border-[#00FF85]/50 rounded-2xl p-6 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAwIDEwIEwgNDAgMTAgTSAxMCAwIEwgMTAgNDAgTSAwIDIwIEwgNDAgMjAgTSAyMCAwIEwgMjAgNDAgTSAwIDMwIEwgNDAgMzAgTSAzMCAwIEwgMzAgNDAiIGZpbGw9Im5vbmUiIHN0cm9rZT0icmdiYSgwLDI1NSwxMzMsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-30" />
          <div className="relative z-10 flex items-center justify-between flex-wrap gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="px-2.5 md:px-3 py-1 bg-[#00FF85] text-black text-[10px] md:text-xs font-bold rounded-full animate-pulse whitespace-nowrap">
                  🎉 INAUGURAÇÃO
                </span>
                <span className="text-[#00FF85] text-[10px] md:text-xs font-semibold whitespace-nowrap">ATÉ 50% OFF</span>
              </div>
              <h3 className="text-lg md:text-2xl font-bold text-white mb-1">Mega Promoção de Inauguração!</h3>
              <p className="text-[#888] text-xs md:text-sm">Descontos imperdíveis em camisas selecionadas</p>
            </div>
            <div className="hidden md:block">
              <PromoCountdown />
            </div>
          </div>
        </motion.div>

        {/* Search */}
        <SearchBar value={search} onChange={setSearch} />

        {/* Categories */}
        <div className="overflow-x-auto -mx-4 px-4">
          <div className="flex gap-2 pb-2">
            {categories.map(cat => (
              <CategoryPill
                key={cat.id}
                label={cat.label}
                icon={cat.icon}
                isActive={activeCategory === cat.id}
                onClick={() => setActiveCategory(cat.id)}
              />
            ))}
          </div>
        </div>

        {/* Featured Section */}
        {!search && activeCategory === 'all' && featuredProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-[#00FF85]" />
                Destaques
              </h2>
              <Link to={createPageUrl('Shop')} className="text-[#00FF85] text-sm hover:underline flex items-center">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <ProductCarousel
              products={featuredProducts}
              favoriteIds={favoriteIds}
              onToggleFavorite={(productId) => toggleFavoriteMutation.mutate(productId)}
            />
          </section>
        )}

        {/* New Arrivals */}
        {!search && activeCategory === 'all' && newProducts.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Star className="w-5 h-5 text-[#00FF85]" />
                Drops da Semana
              </h2>
              <Link to={createPageUrl('Shop')} className="text-[#00FF85] text-sm hover:underline flex items-center">
                Ver todos <ChevronRight className="w-4 h-4" />
              </Link>
            </div>
            <ProductCarousel
              products={newProducts}
              favoriteIds={favoriteIds}
              onToggleFavorite={(productId) => toggleFavoriteMutation.mutate(productId)}
            />
          </section>
        )}

        {/* All Products / Filtered */}
        <section>
          <h2 className="text-base md:text-lg font-bold mb-3 md:mb-4">
            {search ? 'Resultados da busca' : 'Todos os Produtos'}
          </h2>
          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-[#141414] rounded-xl md:rounded-2xl aspect-square animate-pulse" />
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 md:gap-4">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  isFavorite={favoriteIds.includes(product.id)}
                  onToggleFavorite={() => toggleFavoriteMutation.mutate(product.id)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <Shirt className="w-16 h-16 text-[#2a2a2a] mx-auto mb-4" />
              <p className="text-[#666]">Nenhum produto encontrado</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
