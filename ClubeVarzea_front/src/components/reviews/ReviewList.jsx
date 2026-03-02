import React from 'react';
import { Star, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

function StarRating({ rating }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating ? "fill-[#00FF85] text-[#00FF85]" : "text-[#2a2a2a]"
          )}
        />
      ))}
    </div>
  );
}

export default function ReviewList({ reviews }) {
  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-8 text-[#666]">
        <p>Ainda não há avaliações para este produto.</p>
        <p className="text-sm mt-1">Seja o primeiro a avaliar!</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {reviews.map((review) => (
        <div
          key={review.id}
          className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-4 space-y-3"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#00FF85]/20 flex items-center justify-center">
                <User className="w-5 h-5 text-[#00FF85]" />
              </div>
              <div>
                <p className="font-semibold text-white">{review.user_name}</p>
                <p className="text-xs text-[#666]">
                  {format(new Date(review.created_date), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
              </div>
            </div>
            <StarRating rating={review.rating} />
          </div>
          
          {review.comment && (
            <p className="text-[#ccc] text-sm leading-relaxed">{review.comment}</p>
          )}
        </div>
      ))}
    </div>
  );
}