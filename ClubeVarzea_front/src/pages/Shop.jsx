import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, SlidersHorizontal, Sparkles, Trophy, Globe, Star, Shirt, X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import SearchBar from '@/components/ui/SearchBar';
import CategoryPill from '@/components/ui/CategoryPill';
import ProductCard from '@/components/ui/ProductCard';
import ProductCarousel from '@/components/ProductCarousel';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Button } from "@/components/ui/button";
import { base44 } from '@/api/base44Client';

const categories = [
  { id: 'all', label: 'Todos', icon: Sparkles },
  { id: 'brasileirao', label: 'Brasileirão', icon: Trophy },
  { id: 'europeus', label: 'Europeus', icon: Globe },
  { id: 'selecoes', label: 'Seleções', icon: Star },
  { id: 'raros', label: 'Raros', icon: Shirt },
  { id: 'personalizadas', label: 'Personalizadas', icon: Shirt },
];

const sortOptions = [
  { id: 'recent', label: 'Mais recentes' },
  { id: 'price_asc', label: 'Menor preço' },
  { id: 'price_desc', label: 'Maior preço' },
  { id: 'name', label: 'Nome A-Z' },
];

export default function Shop() {
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [priceRange, setPriceRange] = useState([0, 500]);
  const [sortBy, setSortBy] = useState('name');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const queryClient = useQueryClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list('-created_date', 100),
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

  let filteredProducts = products.filter(p => {
    const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) ||
                        p.team.toLowerCase().includes(search.toLowerCase());
    const matchCategory = activeCategory === 'all' || p.category === activeCategory;
    const matchPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
    return matchSearch && matchCategory && matchPrice;
  });

  // Sort
  filteredProducts = [...filteredProducts].sort((a, b) => {
    switch (sortBy) {
      case 'price_asc': return a.price - b.price;
      case 'price_desc': return b.price - a.price;
      case 'name': return a.name.localeCompare(b.name);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="px-4 py-4">
          <div className="flex items-center gap-4 mb-4">
            <Link to={createPageUrl('Home')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-bold flex-1">Loja</h1>
            <Sheet open={isFilterOpen} onOpenChange={setIsFilterOpen}>
              <SheetTrigger asChild>
                <button className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors border border-[#2a2a2a]">
                  <SlidersHorizontal className="w-5 h-5" />
                </button>
              </SheetTrigger>
              <SheetContent side="right" className="bg-[#141414] border-[#2a2a2a] text-white">
                <SheetHeader>
                  <SheetTitle className="text-white">Filtros</SheetTitle>
                </SheetHeader>
                <div className="py-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-4">Faixa de Preço</h3>
                    <Slider
                      value={priceRange}
                      onValueChange={setPriceRange}
                      max={500}
                      step={10}
                      className="[&_[role=slider]]:bg-[#00FF85] [&_[role=slider]]:border-[#00FF85]"
                    />
                    <div className="flex justify-between mt-2 text-sm text-[#888]">
                      <span>R$ {priceRange[0]}</span>
                      <span>R$ {priceRange[1]}</span>
                    </div>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium mb-4">Ordenar por</h3>
                    <div className="space-y-2">
                      {sortOptions.map(option => (
                        <button
                          key={option.id}
                          onClick={() => setSortBy(option.id)}
                          className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                            sortBy === option.id
                              ? 'bg-[#00FF85]/20 text-[#00FF85] border border-[#00FF85]/50'
                              : 'bg-[#1a1a1a] hover:bg-[#2a2a2a]'
                          }`}
                        >
                          {option.label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <Button
                    onClick={() => setIsFilterOpen(false)}
                    className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90"
                  >
                    Aplicar Filtros
                  </Button>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <SearchBar value={search} onChange={setSearch} />
        </div>
        
        {/* Categories */}
        <div className="overflow-x-auto px-4 pb-4">
          <div className="flex gap-2">
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
      </div>

      {/* Products */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-[#888]">{filteredProducts.length} produtos</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />
            ))}
          </div>
        ) : filteredProducts.length > 0 ? (
          <ProductCarousel
            products={filteredProducts}
            favoriteIds={favoriteIds}
            onToggleFavorite={(productId) => toggleFavoriteMutation.mutate(productId)}
          />
        ) : (
          <div className="text-center py-12">
            <Shirt className="w-16 h-16 text-[#2a2a2a] mx-auto mb-4" />
            <p className="text-[#666]">Nenhum produto encontrado</p>
            <p className="text-[#444] text-sm mt-1">Tente ajustar os filtros</p>
          </div>
        )}
      </div>
    </div>
  );
}
