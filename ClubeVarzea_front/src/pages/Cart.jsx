import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Minus, Plus, Trash2, ShoppingBag, Tag, X } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { Input } from "@/components/ui/input";
import { base44 } from '@/api/base44Client';

const validCoupons = {
  'VARZEA10': 10,
  'PRIMEIRACOMPRA': 15,
  'FUTEBOL20': 20,
};

export default function Cart() {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const queryClient = useQueryClient();

  const { data: cartItems = [], isLoading } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.filter({ active: true }),
  });

  const updateQuantityMutation = useMutation({
    mutationFn: async ({ id, quantity }) => {
      if (quantity <= 0) {
        await base44.entities.CartItem.delete(id);
      } else {
        await base44.entities.CartItem.update(id, { quantity });
      }
    },
    onSuccess: () => queryClient.invalidateQueries(['cart']),
  });

  const removeItemMutation = useMutation({
    mutationFn: async (id) => {
      await base44.entities.CartItem.delete(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['cart']);
      toast.success('Item removido do carrinho');
    },
  });

  const applyCoupon = () => {
    const coupon = coupons.find(c => c.code === couponCode.toUpperCase());
    if (coupon) {
      setAppliedCoupon(coupon);
      const discountText = coupon.discount_percent 
        ? `${coupon.discount_percent}% de desconto` 
        : `R$ ${coupon.discount_fixed?.toFixed(2)} de desconto`;
      toast.success(`Cupom aplicado! ${discountText}`);
    } else {
      toast.error('Cupom inválido ou inativo');
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    toast.success('Cupom removido');
  };

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const discount = appliedCoupon 
    ? appliedCoupon.discount_percent 
      ? (subtotal * appliedCoupon.discount_percent / 100)
      : appliedCoupon.discount_fixed || 0
    : 0;
  const total = subtotal - discount;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <button 
            onClick={() => {
              const lastProductId = sessionStorage.getItem('lastViewedProduct');
              if (lastProductId) {
                window.location.href = createPageUrl('ProductDetail') + `?id=${lastProductId}`;
              } else {
                window.location.href = createPageUrl('Shop');
              }
            }}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold flex-1">Carrinho</h1>
          <span className="text-[#888]">{cartItems.length} itens</span>
        </div>
      </div>

      {cartItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <div className="w-24 h-24 rounded-full bg-[#141414] flex items-center justify-center mb-6">
            <ShoppingBag className="w-10 h-10 text-[#2a2a2a]" />
          </div>
          <h2 className="text-xl font-bold mb-2">Carrinho vazio</h2>
          <p className="text-[#888] text-center mb-6">Adicione produtos para começar suas compras</p>
          <Link to={createPageUrl('Shop')}>
            <NeonButton>Explorar Produtos</NeonButton>
          </Link>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-4">
          {/* Cart Items */}
          <AnimatePresence>
            {cartItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]"
              >
                <div className="flex gap-4">
                  <div className="w-24 h-24 bg-[#1a1a1a] rounded-xl overflow-hidden flex-shrink-0">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-contain p-2"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-[#888] text-xs uppercase">{item.team}</p>
                        <h3 className="font-semibold text-sm line-clamp-2">{item.name}</h3>
                        <p className="text-[#888] text-xs mt-1">Tamanho: {item.size}</p>
                      </div>
                      <button
                        onClick={() => removeItemMutation.mutate(item.id)}
                        className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 bg-[#1a1a1a] rounded-lg">
                        <button
                          onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity - 1 })}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantityMutation.mutate({ id: item.id, quantity: item.quantity + 1 })}
                          className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                      <p className="font-bold text-[#00FF85]">R$ {(item.price * item.quantity).toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Coupon */}
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-3">
              <Tag className="w-4 h-4 text-[#00FF85]" />
              <span className="text-sm font-medium">Cupom de desconto</span>
            </div>
            {appliedCoupon ? (
              <div className="flex items-center justify-between bg-[#00FF85]/10 border border-[#00FF85]/30 rounded-xl px-4 py-3">
                <div>
                  <p className="text-[#00FF85] font-bold">{appliedCoupon.code}</p>
                  <p className="text-sm text-[#888]">
                    {appliedCoupon.discount_percent 
                      ? `${appliedCoupon.discount_percent}% de desconto` 
                      : `R$ ${appliedCoupon.discount_fixed?.toFixed(2)} de desconto`}
                  </p>
                </div>
                <button onClick={removeCoupon} className="p-2 hover:bg-[#00FF85]/20 rounded-lg transition-colors">
                  <X className="w-4 h-4 text-[#00FF85]" />
                </button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Digite o código"
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50"
                />
                <NeonButton variant="outline" onClick={applyCoupon}>
                  Aplicar
                </NeonButton>
              </div>
            )}
          </div>

          {/* Summary */}
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-[#888]">Subtotal</span>
              <span>R$ {subtotal.toFixed(2)}</span>
            </div>
            {appliedCoupon && (
              <div className="flex justify-between text-sm text-[#00FF85]">
                <span>Desconto {appliedCoupon.code}</span>
                <span>-R$ {discount.toFixed(2)}</span>
              </div>
            )}
            <p className="text-xs text-[#888] pt-2 border-t border-[#2a2a2a]">
              📦 Prazo de entrega: até 20 dias úteis
            </p>
            <div className="border-t border-[#2a2a2a] pt-3 flex justify-between">
              <span className="font-bold">Total</span>
              <span className="text-xl font-bold text-[#00FF85]">R$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}

      {/* Fixed Bottom Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-20 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-[#2a2a2a] p-4 z-40">
          <div className="max-w-7xl mx-auto px-4">
            <Link to={createPageUrl(`Checkout?coupon=${appliedCoupon?.code || ''}&ref=${sessionStorage.getItem('referralCode') || ''}`)}>
              <NeonButton className="w-full py-4 text-lg">
                Finalizar Compra • R$ {total.toFixed(2)}
              </NeonButton>
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
