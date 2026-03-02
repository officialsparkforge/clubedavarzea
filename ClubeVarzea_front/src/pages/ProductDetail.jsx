import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Heart, Minus, Plus, ShoppingCart, Star, Truck, Shield, RotateCcw, ChevronDown, ChevronUp } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import RatingDisplay from '@/components/reviews/RatingDisplay';
import ReviewForm from '@/components/reviews/ReviewForm';
import ReviewList from '@/components/reviews/ReviewList';
import { base44 } from '@/api/base44Client';

const sizeGuide = [
  { size: 'P', chest: '96-100', height: '165-170' },
  { size: 'M', chest: '100-104', height: '170-175' },
  { size: 'G', chest: '104-108', height: '175-180' },
  { size: 'GG', chest: '108-112', height: '180-185' },
  { size: 'XGG', chest: '112-116', height: '185-190' },
];

export default function ProductDetail() {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const referralCode = urlParams.get('ref');
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  
  // Persist referral code
  React.useEffect(() => {
    if (referralCode) {
      sessionStorage.setItem('referralCode', referralCode);
    }
  }, [referralCode]);

  const [selectedSize, setSelectedSize] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showDescription, setShowDescription] = useState(true);
  const [showReviews, setShowReviews] = useState(false);
  const [showCartDialog, setShowCartDialog] = useState(false);
  const [isFirstAddition, setIsFirstAddition] = useState(true);

  const { data: product, isLoading } = useQuery({
    queryKey: ['product', productId],
    queryFn: async () => {
      const products = await base44.entities.Product.filter({ id: productId });
      return products[0];
    },
    enabled: !!productId,
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Favorite.filter({ created_by: user.email });
    },
  });

  const { data: reviews = [] } = useQuery({
    queryKey: ['reviews', productId],
    queryFn: () => base44.entities.Review.filter({ product_id: productId }, '-created_date'),
    enabled: !!productId,
  });

  const { data: currentUser } = useQuery({
    queryKey: ['user'],
    queryFn: () => base44.auth.me(),
  });

  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
    : 0;

  const isFavorite = favorites.some(f => f.product_id === productId);

  const toggleFavoriteMutation = useMutation({
    mutationFn: async () => {
      const existing = favorites.find(f => f.product_id === productId);
      if (existing) {
        await base44.entities.Favorite.delete(existing.id);
      } else {
        await base44.entities.Favorite.create({ product_id: productId });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['favorites']),
  });

  const addToCartMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSize) {
        toast.error('Por favor, selecione um tamanho');
        throw new Error('Selecione um tamanho');
      }
      if (quantity < 1) {
        toast.error('Por favor, selecione a quantidade');
        throw new Error('Selecione a quantidade');
      }
      
      // Save product ID to sessionStorage for back navigation
      sessionStorage.setItem('lastViewedProduct', productId);
      
      const existingItems = await base44.entities.CartItem.filter({
        product_id: productId,
        size: selectedSize,
      });
      
      if (existingItems.length > 0) {
        await base44.entities.CartItem.update(existingItems[0].id, {
          quantity: existingItems[0].quantity + quantity,
        });
      } else {
        await base44.entities.CartItem.create({
          product_id: productId,
          name: product.name,
          team: product.team,
          size: selectedSize,
          quantity: quantity,
          price: product.price,
          image_url: product.image_url,
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      if (isFirstAddition) {
        setShowCartDialog(true);
        setIsFirstAddition(false);
      } else {
        toast.success('Produto adicionado ao carrinho!');
        navigate(createPageUrl('Shop'));
      }
    },
    onError: (error) => {
      // Error already shown via toast
    },
  });

  const addReviewMutation = useMutation({
    mutationFn: async (reviewData) => {
      await base44.entities.Review.create({
        product_id: productId,
        ...reviewData,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['reviews', productId]);
      toast.success('Avaliação publicada com sucesso!');
    },
  });

  if (isLoading || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const hasDiscount = product.original_price && product.original_price > product.price;

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center justify-between px-4 py-4">
          <Link to={createPageUrl('Shop')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-lg font-bold">Detalhes</h1>
          <button
            onClick={() => toggleFavoriteMutation.mutate()}
            className={cn(
              "p-2 rounded-full transition-all duration-300",
              isFavorite ? "bg-[#00FF85] text-black" : "hover:bg-[#1a1a1a]"
            )}
          >
            <Heart className={cn("w-5 h-5", isFavorite && "fill-current")} />
          </button>
        </div>
      </div>

      {/* Product Layout - Side by Side */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 md:py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
          {/* Left - Product Image */}
          <div className="relative bg-gradient-to-b from-[#1a1a1a] to-[#0A0A0A] rounded-xl md:rounded-2xl flex items-center justify-center p-6 md:p-8 border border-[#2a2a2a] aspect-square">
            <div className="absolute inset-0 bg-[#00FF85]/5 rounded-xl md:rounded-2xl" />
            <motion.img
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              src={product.image_url}
              alt={product.name}
              loading="eager"
              className="max-w-[80%] md:max-w-full max-h-[80%] md:max-h-full object-contain relative z-10"
            />
            {product.is_new && (
              <span className="absolute top-4 left-4 px-3 py-1 bg-[#00FF85] text-black text-xs font-bold rounded-full">
                NOVO
              </span>
            )}
            {hasDiscount && (
              <span className="absolute top-4 right-4 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                -{Math.round((1 - product.price / product.original_price) * 100)}%
              </span>
            )}
          </div>

          {/* Right - Product Info */}
          <div className="flex flex-col overflow-y-auto space-y-4 md:space-y-6 pr-2">
            <div>
              <p className="text-[#00FF85] text-xs md:text-sm font-medium uppercase tracking-wider">{product.team}</p>
              <h1 className="text-2xl md:text-3xl font-bold mt-1">{product.name}</h1>
              {product.season && (
                <p className="text-[#888] text-xs md:text-sm mt-1">Temporada {product.season} • Versão {product.version || 'Torcedor'}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-2 md:gap-3">
              <span className="text-3xl md:text-4xl font-bold text-[#00FF85]">R$ {product.price.toFixed(2)}</span>
              {hasDiscount && (
                <span className="text-lg md:text-xl text-[#666] line-through">R$ {product.original_price.toFixed(2)}</span>
              )}
            </div>

            {/* Rating */}
            {reviews.length > 0 && (
              <RatingDisplay rating={averageRating} reviewCount={reviews.length} size="lg" />
            )}


        {/* Size Selection */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs md:text-sm font-medium">Tamanho *</span>
            <button
              onClick={() => setShowSizeGuide(!showSizeGuide)}
              className="text-[#00FF85] text-xs md:text-sm hover:underline min-h-[44px] flex items-center"
            >
              Guia de medidas
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {(product.sizes || ['P', 'M', 'G', 'GG', 'XGG']).map(size => (
              <button
                key={size}
                onClick={() => setSelectedSize(size)}
                className={cn(
                  "min-w-[48px] min-h-[48px] md:w-12 md:h-12 px-3 rounded-xl font-bold text-sm transition-all duration-300 border",
                  selectedSize === size
                    ? "bg-[#00FF85] text-black border-[#00FF85] shadow-[0_0_20px_rgba(0,255,133,0.4)]"
                    : "bg-[#1a1a1a] text-white border-[#2a2a2a] hover:border-[#00FF85]/50"
                )}
              >
                {size}
              </button>
            ))}
          </div>
        </div>

        {/* Size Guide */}
        <AnimatePresence>
          {showSizeGuide && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a]">
                <h3 className="font-bold mb-3">Guia de Medidas</h3>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="font-medium text-[#888]">Tamanho</div>
                  <div className="font-medium text-[#888]">Peito (cm)</div>
                  <div className="font-medium text-[#888]">Altura (cm)</div>
                  {sizeGuide.map(row => (
                    <React.Fragment key={row.size}>
                      <div className="text-[#00FF85]">{row.size}</div>
                      <div>{row.chest}</div>
                      <div>{row.height}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quantity */}
        <div>
          <span className="text-xs md:text-sm font-medium mb-3 block">Quantidade</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="min-w-[44px] min-h-[44px] md:w-10 md:h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#00FF85]/50 transition-colors active:scale-95"
            >
              <Minus className="w-5 h-5 md:w-4 md:h-4" />
            </button>
            <span className="text-xl font-bold min-w-[32px] text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="min-w-[44px] min-h-[44px] md:w-10 md:h-10 rounded-xl bg-[#1a1a1a] border border-[#2a2a2a] flex items-center justify-center hover:border-[#00FF85]/50 transition-colors active:scale-95"
            >
              <Plus className="w-5 h-5 md:w-4 md:h-4" />
            </button>
          </div>
        </div>



            {/* Description */}
            <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowDescription(!showDescription)}
                className="w-full flex items-center justify-between p-4 bg-[#141414]"
              >
                <span className="font-medium">Descrição</span>
                {showDescription ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <AnimatePresence>
                {showDescription && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 text-[#888] text-sm space-y-3">
                      <p>{product.description || 'Camisa oficial de alta qualidade, produzida com materiais premium para máximo conforto e durabilidade.'}</p>
                      {product.composition && (
                        <p><span className="text-white">Composição:</span> {product.composition}</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Reviews Section */}
            <div className="border border-[#2a2a2a] rounded-xl overflow-hidden">
              <button
                onClick={() => setShowReviews(!showReviews)}
                className="w-full flex items-center justify-between p-4 bg-[#141414]"
              >
                <span className="font-medium">Avaliações ({reviews.length})</span>
                {showReviews ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
              <AnimatePresence>
                {showReviews && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="overflow-hidden"
                  >
                    <div className="p-4 space-y-6">
                      {currentUser && (
                        <ReviewForm 
                          onSubmit={(data) => addReviewMutation.mutate(data)}
                          userName={currentUser.full_name}
                        />
                      )}
                      <ReviewList reviews={reviews} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Add to Cart Button */}
            <div className="sticky bottom-0 pt-4 pb-6 md:pb-8">
              <NeonButton
                onClick={() => addToCartMutation.mutate()}
                disabled={addToCartMutation.isPending}
                className="w-full py-4 text-sm md:text-base min-h-[52px]"
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                <span className="truncate">
                  {addToCartMutation.isPending ? 'Adicionando...' : `Adicionar • R$ ${(product.price * quantity).toFixed(2)}`}
                </span>
              </NeonButton>
            </div>
          </div>
        </div>
      </div>

      {/* Cart Dialog */}
      <Dialog open={showCartDialog} onOpenChange={setShowCartDialog}>
        <DialogContent className="bg-[#141414] border-[#2a2a2a] text-white">
          <DialogHeader>
            <DialogTitle className="text-white text-xl">Produto adicionado!</DialogTitle>
            <DialogDescription className="text-[#888]">
              O que você deseja fazer agora?
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-3 mt-4">
            <Button
              onClick={() => {
                setShowCartDialog(false);
                navigate(createPageUrl('Shop'));
              }}
              className="w-full bg-[#1a1a1a] hover:bg-[#2a2a2a] text-white border border-[#2a2a2a]"
            >
              Continuar Comprando
            </Button>
            <Button
              onClick={() => {
                setShowCartDialog(false);
                navigate(createPageUrl('Cart'));
              }}
              className="w-full bg-[#00FF85] hover:bg-[#00FF85]/90 text-black font-semibold"
            >
              Ir para o Carrinho
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
