import React from 'react';
import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function RatingDisplay({ rating, reviewCount, size = 'md', showCount = true }) {
  const sizes = {
    sm: { star: 'w-3 h-3', text: 'text-xs' },
    md: { star: 'w-4 h-4', text: 'text-sm' },
    lg: { star: 'w-5 h-5', text: 'text-base' },
  };

  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className="flex items-center gap-2">
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => {
          const isFull = star <= fullStars;
          const isHalf = star === fullStars + 1 && hasHalfStar;
          
          return (
            <div key={star} className="relative">
              <Star className={cn(sizes[size].star, "text-[#2a2a2a]")} />
              {(isFull || isHalf) && (
                <div 
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: isHalf ? '50%' : '100%' }}
                >
                  <Star className={cn(sizes[size].star, "fill-[#00FF85] text-[#00FF85]")} />
                </div>
              )}
            </div>
          );
        })}
      </div>
      <span className={cn("text-[#00FF85] font-semibold", sizes[size].text)}>
        {rating.toFixed(1)}
      </span>
      {showCount && reviewCount > 0 && (
        <span className={cn("text-[#666]", sizes[size].text)}>
          ({reviewCount})
        </span>
      )}
    </div>
  );
}