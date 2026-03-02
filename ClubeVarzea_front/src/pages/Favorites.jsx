import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, ShoppingBag } from 'lucide-react';
import ProductCard from '@/components/ui/ProductCard';
import NeonButton from '@/components/ui/NeonButton';
import { base44 } from '@/api/base44Client';

export default function Favorites() {
  const queryClient = useQueryClient();

  const { data: favorites = [], isLoading: loadingFavorites } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list(),
  });

  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ['products'],
    queryFn: () => base44.entities.Product.list(),
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: async (productId) => {
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['favorites']),
  });

  const favoriteIds = favorites.map(f => f.product_id);
  const favoriteProducts = products
    .filter(p => favoriteIds.includes(p.id))
    .sort((a, b) => a.name.localeCompare(b.name));

  const isLoading = loadingFavorites || loadingProducts;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link to={createPageUrl('Home')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold flex-1">Favoritos</h1>
          <span className="text-[#888]">{favoriteProducts.length} itens</span>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 py-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-[#141414] rounded-2xl aspect-square animate-pulse" />
          ))}
        </div>
      ) : favoriteProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-[#141414] flex items-center justify-center mb-6">
            <Heart className="w-10 h-10 text-[#2a2a2a]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Nenhum favorito</h2>
          <p className="text-[#888] text-center mb-6">Salve seus produtos favoritos para encontrá-los facilmente</p>
          <Link to={createPageUrl('Shop')}>
            <NeonButton>
              <ShoppingBag className="w-4 h-4 mr-2" />
              Explorar Produtos
            </NeonButton>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 px-4 py-6">
          {favoriteProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              isFavorite={true}
              onToggleFavorite={() => toggleFavoriteMutation.mutate(product.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
