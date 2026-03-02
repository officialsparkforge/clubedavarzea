import React, { useState } from 'react';
import { Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

export default function ReviewForm({ onSubmit, userName }) {
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (rating === 0) return;
    
    setIsSubmitting(true);
    await onSubmit({ rating, comment, user_name: userName });
    setRating(0);
    setComment('');
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[#141414] border border-[#2a2a2a] rounded-2xl p-6 space-y-4">
      <h3 className="text-lg font-bold">Deixe sua avaliação</h3>
      
      <div>
        <label className="text-sm text-[#888] mb-2 block">Sua nota</label>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoveredRating(star)}
              onMouseLeave={() => setHoveredRating(0)}
              onClick={() => setRating(star)}
              className="transition-transform hover:scale-110"
            >
              <Star
                className={cn(
                  "w-8 h-8 transition-colors",
                  (hoveredRating || rating) >= star
                    ? "fill-[#00FF85] text-[#00FF85]"
                    : "text-[#2a2a2a]"
                )}
              />
            </button>
          ))}
        </div>
      </div>

      <div>
        <label className="text-sm text-[#888] mb-2 block">Comentário (opcional)</label>
        <Textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Conte como foi sua experiência com o produto..."
          className="bg-[#1a1a1a] border-[#2a2a2a] text-white min-h-[100px]"
        />
      </div>

      <Button
        type="submit"
        disabled={rating === 0 || isSubmitting}
        className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 disabled:opacity-50"
      >
        {isSubmitting ? 'Enviando...' : 'Publicar Avaliação'}
      </Button>
    </form>
  );
}