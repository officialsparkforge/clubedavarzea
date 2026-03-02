import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Box, Zap, Gift, Sparkles, CheckCircle, X, MapPin, Calendar, Package, Crown } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { base44 } from '@/api/base44Client';

const frequencies = [
  { id: 'monthly', label: 'Mensal', description: 'Box a cada mês', deliveries: 12 },
  { id: 'quarterly', label: 'Trimestral', description: 'Box a cada 3 meses', deliveries: 4 },
  { id: 'biannual', label: 'Semestral', description: 'Box a cada 6 meses', deliveries: 2 },
];

const benefits = [
  'Box com 3 camisas aleatórias exclusivas',
  'Produtos de edições limitadas',
  'Frete grátis em todas as entregas',
  'Acesso antecipado a lançamentos',
  'Suporte prioritário',
  'Surpresas extras nas boxes',
];

export default function Club() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showCheckout, setShowCheckout] = useState(false);
  const [frequency, setFrequency] = useState('monthly');
  const [loadingCep, setLoadingCep] = useState(false);
  const [formData, setFormData] = useState({
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
    preferred_categories: [],
    preferred_sizes: [],
  });

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: subscriptions = [] } = useQuery({
    queryKey: ['subscriptions'],
    queryFn: () => base44.entities.Subscription.list(),
  });

  const mySubscription = subscriptions.find(s => s.created_by === user?.email && s.status === 'active');

  const createSubscriptionMutation = useMutation({
    mutationFn: async () => {
      const nextDelivery = new Date();
      if (frequency === 'monthly') nextDelivery.setMonth(nextDelivery.getMonth() + 1);
      else if (frequency === 'quarterly') nextDelivery.setMonth(nextDelivery.getMonth() + 3);
      else nextDelivery.setMonth(nextDelivery.getMonth() + 6);

      return await base44.entities.Subscription.create({
        plan_type: 'mystery_box',
        status: 'active',
        price: 500,
        frequency,
        next_delivery_date: nextDelivery.toISOString().split('T')[0],
        boxes_received: 0,
        shipping_address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        },
        preferences: {
          preferred_categories: formData.preferred_categories,
          preferred_sizes: formData.preferred_sizes,
        },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      toast.success('Assinatura ativada com sucesso!');
      setShowCheckout(false);
    },
  });

  const cancelSubscriptionMutation = useMutation({
    mutationFn: async () => {
      await base44.entities.Subscription.update(mySubscription.id, {
        status: 'cancelled',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['subscriptions']);
      toast.success('Assinatura cancelada');
    },
  });

  const handleSubscribe = async () => {
    if (!formData.street || !formData.number || !formData.city || !formData.state || !formData.zip_code) {
      toast.error('Preencha o endereço de entrega');
      return;
    }
    if (formData.preferred_sizes.length === 0) {
      toast.error('Selecione pelo menos um tamanho');
      return;
    }
    
    // Add subscription as cart item
    await base44.entities.CartItem.create({
      product_id: 'subscription_mystery_box',
      name: `Assinatura Mystery Box - ${frequency === 'monthly' ? 'Mensal' : frequency === 'quarterly' ? 'Trimestral' : 'Semestral'}`,
      team: 'Clube VIP',
      size: formData.preferred_sizes.join(', '),
      quantity: 1,
      price: 500,
      image_url: 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=400',
    });
    
    toast.success('Assinatura adicionada ao carrinho!');
    navigate(createPageUrl('Cart'));
  };

  const toggleSize = (size) => {
    setFormData(prev => ({
      ...prev,
      preferred_sizes: prev.preferred_sizes.includes(size)
        ? prev.preferred_sizes.filter(s => s !== size)
        : [...prev.preferred_sizes, size]
    }));
  };

  const toggleCategory = (category) => {
    setFormData(prev => ({
      ...prev,
      preferred_categories: prev.preferred_categories.includes(category)
        ? prev.preferred_categories.filter(c => c !== category)
        : [...prev.preferred_categories, category]
    }));
  };

  const handleCepChange = async (cep) => {
    setFormData({ ...formData, zip_code: cep });
    
    if (cep.replace(/\D/g, '').length === 8) {
      setLoadingCep(true);
      try {
        const result = await axios.get(`/api/cep/${cep.replace(/\D/g, '')}`);
        const data = result.data;
        
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro || prev.street,
            neighborhood: data.bairro || prev.neighborhood,
            city: data.localidade || prev.city,
            state: data.uf || prev.state,
          }));
          toast.success('CEP encontrado!');
        } else {
          toast.error('CEP não encontrado');
        }
      } catch (error) {
        toast.error('Erro ao buscar CEP');
      } finally {
        setLoadingCep(false);
      }
    }
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link to={createPageUrl('Home')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-[#00FF85]" />
            <h1 className="text-xl font-bold">Clube VIP</h1>
          </div>
        </div>
      </div>

      {mySubscription ? (
        <div className="px-4 py-6 space-y-6">
          {/* Active Subscription */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-yellow-600 to-orange-600"
          >
            <div className="absolute inset-0 bg-black/20" />
            <div className="relative z-10">
              <div className="flex items-center gap-2 mb-4">
                <Crown className="w-6 h-6 text-white" />
                <span className="text-white font-bold">ASSINATURA ATIVA</span>
              </div>
              <p className="text-white/90 text-sm mb-4">
                Você é membro VIP do Clube da Várzea!
              </p>
              <div className="flex items-center justify-between text-white">
                <div>
                  <p className="text-xs opacity-80">Boxes Recebidas</p>
                  <p className="text-2xl font-bold">{mySubscription.boxes_received}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs opacity-80">Próxima Entrega</p>
                  <p className="text-lg font-bold">
                    {new Date(mySubscription.next_delivery_date).toLocaleDateString('pt-BR')}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Subscription Details */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] space-y-4">
            <h3 className="font-bold">Detalhes da Assinatura</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-[#888]">Plano</span>
                <span>Mystery Box Premium</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Frequência</span>
                <span>
                  {mySubscription.frequency === 'monthly' && 'Mensal'}
                  {mySubscription.frequency === 'quarterly' && 'Trimestral'}
                  {mySubscription.frequency === 'biannual' && 'Semestral'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#888]">Valor</span>
                <span className="font-bold text-[#00FF85]">R$ 500,00</span>
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <h3 className="font-bold mb-3 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#00FF85]" />
              Endereço de Entrega
            </h3>
            <div className="text-sm text-[#888]">
              <p>{mySubscription.shipping_address?.street}, {mySubscription.shipping_address?.number}</p>
              {mySubscription.shipping_address?.complement && <p>{mySubscription.shipping_address.complement}</p>}
              <p>{mySubscription.shipping_address?.neighborhood}</p>
              <p>{mySubscription.shipping_address?.city} - {mySubscription.shipping_address?.state}</p>
              <p>CEP: {mySubscription.shipping_address?.zip_code}</p>
            </div>
          </div>

          {/* Actions */}
          <NeonButton
            variant="outline"
            onClick={() => {
              if (confirm('Deseja realmente cancelar sua assinatura?')) {
                cancelSubscriptionMutation.mutate();
              }
            }}
            className="w-full text-red-500 border-red-500 hover:bg-red-500/10"
          >
            Cancelar Assinatura
          </NeonButton>
        </div>
      ) : (
        <div className="px-4 py-6 space-y-6">
          {/* Hero */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative overflow-hidden rounded-2xl p-8 text-center bg-gradient-to-br from-[#00FF85]/20 to-transparent border border-[#00FF85]/30"
          >
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800')] bg-cover bg-center opacity-10" />
            <div className="relative z-10">
              <Box className="w-16 h-16 mx-auto mb-4 text-[#00FF85]" />
              <h2 className="text-2xl font-black mb-2">
                <span className="text-[#00FF85]">MYSTERY BOX</span> PREMIUM
              </h2>
              <p className="text-[#888] mb-4">
                3 camisas exclusivas por apenas R$ 500/mês
              </p>
            </div>
          </motion.div>

          {/* Benefits */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <h3 className="font-bold mb-4 flex items-center gap-2">
              <Gift className="w-5 h-5 text-[#00FF85]" />
              O que você recebe
            </h3>
            <div className="space-y-3">
              {benefits.map((benefit, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-[#00FF85] flex-shrink-0 mt-0.5" />
                  <p className="text-sm">{benefit}</p>
                </motion.div>
              ))}
            </div>
          </div>

          {/* How it works */}
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <h3 className="font-bold mb-4">Como Funciona</h3>
            <div className="space-y-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00FF85] font-bold">1</span>
                </div>
                <div>
                  <p className="font-medium">Escolha sua frequência</p>
                  <p className="text-sm text-[#888]">Mensal, trimestral ou semestral</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00FF85] font-bold">2</span>
                </div>
                <div>
                  <p className="font-medium">Defina suas preferências</p>
                  <p className="text-sm text-[#888]">Tamanhos e categorias favoritas</p>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                  <span className="text-[#00FF85] font-bold">3</span>
                </div>
                <div>
                  <p className="font-medium">Receba sua box</p>
                  <p className="text-sm text-[#888]">3 camisas selecionadas especialmente para você</p>
                </div>
              </div>
            </div>
          </div>

          <AnimatePresence>
            {!showCheckout ? (
              <motion.div
                initial={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <NeonButton onClick={() => setShowCheckout(true)} className="w-full py-4">
                  <Sparkles className="w-4 h-4 mr-2" />
                  Assinar Agora
                </NeonButton>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6"
              >
                {/* Frequency Selection */}
                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[#00FF85]" />
                    Frequência de Entrega
                  </h3>
                  <RadioGroup value={frequency} onValueChange={setFrequency}>
                    {frequencies.map((freq) => (
                      <div
                        key={freq.id}
                        className={cn(
                          "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all mb-2",
                          frequency === freq.id
                            ? "border-[#00FF85] bg-[#00FF85]/10"
                            : "border-[#2a2a2a] hover:border-[#00FF85]/50"
                        )}
                        onClick={() => setFrequency(freq.id)}
                      >
                        <div className="flex items-center gap-3">
                          <RadioGroupItem value={freq.id} className="border-[#00FF85] text-[#00FF85]" />
                          <div>
                            <p className="font-medium">{freq.label}</p>
                            <p className="text-sm text-[#888]">{freq.description}</p>
                          </div>
                        </div>
                        <p className="text-xs text-[#888]">{freq.deliveries} boxes/ano</p>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                {/* Preferences */}
                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                  <h3 className="font-bold mb-4">Preferências</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm text-[#888] mb-2 block">Tamanhos (obrigatório)</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['P', 'M', 'G', 'GG', 'XGG'].map(size => (
                          <button
                            key={size}
                            onClick={() => toggleSize(size)}
                            className={cn(
                              "w-12 h-12 rounded-xl font-bold text-sm transition-all border",
                              formData.preferred_sizes.includes(size)
                                ? "bg-[#00FF85] text-black border-[#00FF85]"
                                : "bg-[#1a1a1a] text-white border-[#2a2a2a]"
                            )}
                          >
                            {size}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-[#888] mb-2 block">Categorias Favoritas (opcional)</Label>
                      <div className="flex gap-2 flex-wrap">
                        {['brasileirao', 'europeus', 'selecoes', 'raros'].map(cat => (
                          <button
                            key={cat}
                            onClick={() => toggleCategory(cat)}
                            className={cn(
                              "px-3 py-2 rounded-lg text-xs font-medium transition-all border",
                              formData.preferred_categories.includes(cat)
                                ? "bg-[#00FF85]/20 text-[#00FF85] border-[#00FF85]"
                                : "bg-[#1a1a1a] text-white border-[#2a2a2a]"
                            )}
                          >
                            {cat.charAt(0).toUpperCase() + cat.slice(1)}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address */}
                <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
                  <h3 className="font-bold mb-4 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#00FF85]" />
                    Endereço de Entrega
                  </h3>
                  <div className="space-y-3">
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="CEP"
                          value={formData.zip_code}
                          onChange={(e) => handleCepChange(e.target.value)}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                          maxLength={9}
                          disabled={loadingCep}
                        />
                        {loadingCep && <p className="text-xs text-[#00FF85] mt-1">Buscando CEP...</p>}
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="Rua"
                          value={formData.street}
                          onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        />
                      </div>
                      <Input
                        placeholder="Número"
                        value={formData.number}
                        onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                    <Input
                      placeholder="Complemento (opcional)"
                      value={formData.complement}
                      onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                    <Input
                      placeholder="Bairro"
                      value={formData.neighborhood}
                      onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                    />
                    <div className="grid grid-cols-3 gap-3">
                      <div className="col-span-2">
                        <Input
                          placeholder="Cidade"
                          value={formData.city}
                          onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                        />
                      </div>
                      <Input
                        placeholder="UF"
                        value={formData.state}
                        onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                      />
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <NeonButton
                    variant="outline"
                    onClick={() => setShowCheckout(false)}
                    className="flex-1"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Cancelar
                  </NeonButton>
                  <NeonButton
                    onClick={handleSubscribe}
                    disabled={createSubscriptionMutation.isPending}
                    className="flex-1"
                  >
                    {createSubscriptionMutation.isPending ? 'Processando...' : 'Confirmar Assinatura'}
                  </NeonButton>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
