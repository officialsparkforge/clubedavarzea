import React from 'react';
import useEmblaCarousel from 'embla-carousel-react';
import ProductCard from './ui/ProductCard';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function ProductCarousel({ products, favoriteIds, onToggleFavorite }) {
  const [emblaRef, emblaApi] = useEmblaCarousel({ 
    loop: false, 
    align: 'start',
    slidesToScroll: 1,
  });

  const scrollPrev = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = React.useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative group">
      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-3 md:gap-4">
          {products.map((product) => (
            <div key={product.id} className="flex-[0_0_calc(50%-6px)] sm:flex-[0_0_calc(33.333%-8px)] lg:flex-[0_0_calc(25%-12px)] min-w-0">
              <ProductCard
                product={product}
                isFavorite={favoriteIds?.includes(product.id)}
                onToggleFavorite={() => onToggleFavorite?.(product.id)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Navigation Buttons */}
      <button
        onClick={scrollPrev}
        className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-[#00FF85]/50 hover:bg-[#1a1a1a]"
      >
        <ChevronLeft className="w-5 h-5" />
      </button>
      <button
        onClick={scrollNext}
        className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-10 h-10 rounded-full bg-[#141414] border border-[#2a2a2a] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:border-[#00FF85]/50 hover:bg-[#1a1a1a]"
      >
        <ChevronRight className="w-5 h-5" />
      </button>
    </div>
  );
}