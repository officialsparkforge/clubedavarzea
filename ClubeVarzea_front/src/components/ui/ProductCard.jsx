import React from 'react';
import { Heart } from 'lucide-react';
import { cn } from "@/lib/utils";
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import RatingDisplay from '@/components/reviews/RatingDisplay';

export default function ProductCard({ product, isFavorite, onToggleFavorite }) {
  const hasDiscount = product.original_price && product.original_price > product.price;
  const discountPercent = hasDiscount 
    ? Math.round((1 - product.price / product.original_price) * 100) 
    : 0;

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', product.id],
    queryFn: () => base44.entities.Review.filter({ product_id: product.id }),
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  return (
    <div className="group relative bg-[#141414] rounded-xl md:rounded-2xl overflow-hidden border border-[#2a2a2a] hover:border-[#00FF85]/50 transition-all duration-300 hover:shadow-[0_0_30px_rgba(0,255,133,0.15)] w-full">
      {/* Badges */}
      <div className="absolute top-3 left-3 z-10 flex flex-col gap-2">
        {product.is_new && (
          <span className="px-2 py-1 bg-[#00FF85] text-black text-xs font-bold rounded-full">
            NOVO
          </span>
        )}
        {hasDiscount && (
          <span className="px-2 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
            -{discountPercent}%
          </span>
        )}
      </div>

      {/* Favorite Button */}
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onToggleFavorite?.(product.id);
        }}
        className={cn(
          "absolute top-2 right-2 md:top-3 md:right-3 z-10 p-2 md:p-2.5 rounded-full transition-all duration-300 min-w-[44px] min-h-[44px] md:min-w-0 md:min-h-0 flex items-center justify-center",
          isFavorite 
            ? "bg-[#00FF85] text-black" 
            : "bg-black/50 text-white hover:bg-[#00FF85]/20 hover:text-[#00FF85]"
        )}
      >
        <Heart className={cn("w-5 h-5 md:w-4 md:h-4", isFavorite && "fill-current")} />
      </button>

      {/* Image */}
      <Link to={createPageUrl(`ProductDetail?id=${product.id}`) + (sessionStorage.getItem('referralCode') ? `&ref=${sessionStorage.getItem('referralCode')}` : '')}>
        <div className="aspect-square p-3 md:p-4 flex items-center justify-center bg-gradient-to-b from-[#1a1a1a] to-[#141414]">
          <img
            src={product.image_url}
            alt={product.name}
            loading="lazy"
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
        </div>

        {/* Info */}
        <div className="p-3 md:p-4 space-y-1.5 md:space-y-2">
          <p className="text-[#888] text-[10px] md:text-xs uppercase tracking-wider">{product.team}</p>
          <h3 className="text-white font-semibold text-xs md:text-sm line-clamp-2 min-h-[32px] md:min-h-[40px] leading-tight">
            {product.name}
          </h3>
          {reviews.length > 0 && (
            <RatingDisplay rating={averageRating} reviewCount={reviews.length} size="sm" />
          )}
          <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
            <span className="text-[#00FF85] font-bold text-sm md:text-base">
              R$ {product.price.toFixed(2)}
            </span>
            {hasDiscount && (
              <span className="text-[#666] text-[10px] md:text-xs line-through">
                R$ {product.original_price.toFixed(2)}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}