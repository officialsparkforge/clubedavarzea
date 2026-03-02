import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, MapPin, Truck, CreditCard, QrCode, FileText, ChevronRight, Check } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import axios from 'axios';
import { base44 } from '@/api/base44Client';



const shippingMethods = [
  { id: 'padrao', name: 'Frete Padrão', days: 'Até 20 dias úteis', price: 0 },
];

const paymentMethods = [
  { id: 'pix', name: 'PIX', description: '10% de desconto', icon: QrCode },
  { id: 'cartao', name: 'Cartão de Crédito', description: 'Até 12x sem juros', icon: CreditCard },
  { id: 'boleto', name: 'Boleto Bancário', description: 'Vencimento em 3 dias', icon: FileText },
];

export default function Checkout() {
  const urlParams = new URLSearchParams(window.location.search);
  const couponFromCart = urlParams.get('coupon');
  const referralCode = urlParams.get('ref');
  const isSubscription = urlParams.get('subscription') === 'true';
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [loadingCep, setLoadingCep] = useState(false);
  const [attemptedSubmit, setAttemptedSubmit] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zip_code: '',
  });
  const [shippingMethod, setShippingMethod] = useState('padrao');
  const [paymentMethod, setPaymentMethod] = useState('pix');

  useEffect(() => {
    let active = true;

    const requireLoginAndPrefill = async () => {
      try {
        const currentUser = await base44.auth.me();
        if (!active) return;

        setFormData((prev) => ({
          ...prev,
          name: currentUser?.full_name || currentUser?.name || prev.name,
          email: currentUser?.email || prev.email,
          phone: currentUser?.phone || prev.phone,
          street: currentUser?.address?.street || prev.street,
          number: currentUser?.address?.number || prev.number,
          complement: currentUser?.address?.complement || prev.complement,
          neighborhood: currentUser?.address?.neighborhood || prev.neighborhood,
          city: currentUser?.address?.city || prev.city,
          state: currentUser?.address?.state || prev.state,
          zip_code: currentUser?.address?.zip_code || prev.zip_code,
        }));
      } catch {
        if (!active) return;
        const returnTo = `${window.location.pathname}${window.location.search}`;
        toast.error('Faça login para continuar o pagamento');
        navigate(createPageUrl(`Login?redirect=${encodeURIComponent(returnTo)}`));
        return;
      } finally {
        if (active) setCheckingAuth(false);
      }
    };

    requireLoginAndPrefill();

    return () => {
      active = false;
    };
  }, [navigate]);

  const { data: cartItems = [] } = useQuery({
    queryKey: ['cart'],
    queryFn: () => base44.entities.CartItem.list(),
  });

  const { data: coupons = [] } = useQuery({
    queryKey: ['coupons'],
    queryFn: () => base44.entities.Coupon.filter({ active: true }),
  });

  const appliedCoupon = couponFromCart 
    ? coupons.find(c => c.code === couponFromCart.toUpperCase())
    : null;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const couponDiscount = appliedCoupon 
    ? appliedCoupon.discount_percent 
      ? (subtotal * appliedCoupon.discount_percent / 100)
      : appliedCoupon.discount_fixed || 0
    : 0;
  const selectedShipping = shippingMethods.find(s => s.id === shippingMethod);
  const shippingCost = selectedShipping?.price || 0;
  const pixDiscount = paymentMethod === 'pix' ? ((subtotal - couponDiscount) * 0.1) : 0;
  const total = subtotal - couponDiscount + shippingCost - pixDiscount;

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Auto-fetch CEP data
    if (name === 'zip_code' && value.replace(/\D/g, '').length === 8) {
      fetchCepData(value.replace(/\D/g, ''));
    }
  };

  const fetchCepData = async (cep) => {
    setLoadingCep(true);
    try {
      const apiBaseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001';
      const result = await axios.get(`${apiBaseUrl}/api/cep/${cep}`);
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
  };

  const createOrderMutation = useMutation({
    mutationFn: async () => {
      const orderNumber = `CDV${Date.now().toString(36).toUpperCase()}`;
      const estimatedDays = parseInt(selectedShipping?.days) || 10;
      const estimatedDelivery = new Date();
      estimatedDelivery.setDate(estimatedDelivery.getDate() + estimatedDays);

      const order = await base44.entities.Order.create({
        order_number: orderNumber,
        status: 'confirmado',
        items: cartItems.map(item => ({
          product_id: item.product_id,
          name: item.name,
          team: item.team,
          size: item.size,
          quantity: item.quantity,
          price: item.price,
          image_url: item.image_url,
        })),
        subtotal,
        shipping_cost: shippingCost,
        discount: couponDiscount + pixDiscount,
        total,
        coupon_code: appliedCoupon?.code || '',
        customer_name: formData.name,
        customer_email: formData.email,
        customer_phone: formData.phone,
        shipping_address: {
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state,
          zip_code: formData.zip_code,
        },
        shipping_method: shippingMethod,
        payment_method: paymentMethod,
        payment_status: 'pendente',
        estimated_delivery: estimatedDelivery.toISOString().split('T')[0],
      });

      // Process referral points if referral code exists
      const finalReferralCode = referralCode || sessionStorage.getItem('referralCode');
      if (finalReferralCode) {
        try {
          const referrals = await base44.entities.Referral.filter({ referral_code: finalReferralCode });
          if (referrals.length > 0) {
            const referral = referrals[0];
            
            // Calculate commission based on level
            let commissionRate = 0.05; // Default 5% for Bronze
            if (referral.level === 2) commissionRate = 0.10; // Prata 10%
            else if (referral.level === 3) commissionRate = 0.15; // Ouro 15%
            else if (referral.level === 4) commissionRate = 0.20; // Diamante 20%
            
            const commissionAmount = total * commissionRate;
            const pointsEarned = Math.floor(total); // 1 ponto por real
            
            const updatedOrders = [...(referral.referred_orders || []), {
              order_id: order.id,
              order_number: orderNumber,
              amount: total,
              points_earned: pointsEarned,
              commission_amount: commissionAmount,
              date: new Date().toISOString().split('T')[0],
            }];
            
            const newTotalPoints = (referral.total_points || 0) + pointsEarned;
            const newTotalSales = (referral.total_sales || 0) + total;
            
            // Calculate new level
            let newLevel = 1;
            let newLevelName = 'Bronze';
            if (newTotalPoints >= 2000) { newLevel = 4; newLevelName = 'Diamante'; }
            else if (newTotalPoints >= 1000) { newLevel = 3; newLevelName = 'Ouro'; }
            else if (newTotalPoints >= 500) { newLevel = 2; newLevelName = 'Prata'; }
            
            await base44.entities.Referral.update(referral.id, {
              total_sales: newTotalSales,
              total_points: newTotalPoints,
              level: newLevel,
              level_name: newLevelName,
              referred_orders: updatedOrders,
            });
            
            // Update or create wallet
            const wallets = await base44.entities.Wallet.filter({ created_by: referral.created_by });
            if (wallets.length > 0) {
              const wallet = wallets[0];
              const newBalance = (wallet.balance || 0) + commissionAmount;
              const transactions = [...(wallet.transactions || []), {
                amount: commissionAmount,
                type: 'credit',
                description: `Comissão de ${(commissionRate * 100).toFixed(0)}% - Pedido ${orderNumber}`,
                order_id: order.id,
                date: new Date().toISOString(),
              }];
              
              await base44.entities.Wallet.update(wallet.id, {
                balance: newBalance,
                transactions,
              });
            } else {
              await base44.entities.Wallet.create({
                balance: commissionAmount,
                transactions: [{
                  amount: commissionAmount,
                  type: 'credit',
                  description: `Comissão de ${(commissionRate * 100).toFixed(0)}% - Pedido ${orderNumber}`,
                  order_id: order.id,
                  date: new Date().toISOString(),
                }],
              });
            }
          }
          
          // Clear referral code from session
          sessionStorage.removeItem('referralCode');
        } catch (error) {
          console.error('Erro ao processar pontos de referência:', error);
        }
      }

      // Send confirmation email
      const itemsList = cartItems.map(item => 
        `- ${item.name} (${item.team}) - Tamanho ${item.size} - Quantidade: ${item.quantity} - R$ ${(item.price * item.quantity).toFixed(2)}`
      ).join('\n');

      const emailBody = `
Olá ${formData.name},

Seu pedido foi recebido com sucesso! 🎉

**Detalhes do Pedido:**
Número do Pedido: ${orderNumber}
Data: ${new Date().toLocaleDateString('pt-BR')}

**Itens:**
${itemsList}

**Resumo:**
Subtotal: R$ ${subtotal.toFixed(2)}
${couponDiscount > 0 ? `Desconto (Cupom): -R$ ${couponDiscount.toFixed(2)}\n` : ''}${pixDiscount > 0 ? `Desconto PIX: -R$ ${pixDiscount.toFixed(2)}\n` : ''}Frete: R$ ${shippingCost.toFixed(2)}
**Total: R$ ${total.toFixed(2)}**

**Endereço de Entrega:**
${formData.street}, ${formData.number}${formData.complement ? ` - ${formData.complement}` : ''}
${formData.neighborhood} - ${formData.city}/${formData.state}
CEP: ${formData.zip_code}

**Forma de Pagamento:** ${paymentMethod === 'pix' ? 'PIX' : paymentMethod === 'cartao' ? 'Cartão de Crédito' : 'Boleto Bancário'}

Previsão de entrega: ${new Date(estimatedDelivery).toLocaleDateString('pt-BR')}

Acompanhe seu pedido através do nosso site.

Obrigado pela preferência!
Clube da Várzea
      `.trim();

      try {
        await base44.integrations.Core.SendEmail({
          to: formData.email,
          subject: `Pedido Recebido - ${orderNumber} - Clube da Várzea`,
          body: emailBody,
          from_name: 'Clube da Várzea',
        });
      } catch (error) {
        console.error('Erro ao enviar email:', error);
      }

      // Clear cart
      for (const item of cartItems) {
        await base44.entities.CartItem.delete(item.id);
      }

      return order;
    },
    onSuccess: (order) => {
      queryClient.invalidateQueries(['cart']);
      navigate(createPageUrl(`Payment?orderId=${order.id}`));
    },
    onError: (error) => {
      toast.error('Erro ao criar pedido. Tente novamente.');
    },
  });

  const validateStep1 = () => {
    if (!formData.name.trim()) {
      toast.error('Digite seu nome completo');
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim() || !emailRegex.test(formData.email)) {
      toast.error('Digite um e-mail válido');
      return false;
    }
    const phoneDigits = formData.phone.replace(/\D/g, '');
    if (phoneDigits.length < 10 || phoneDigits.length > 11) {
      toast.error('Digite um telefone válido com DDD');
      return false;
    }
    return true;
  };

  const validateStep2 = () => {
    if (!formData.zip_code.trim() || formData.zip_code.replace(/\D/g, '').length !== 8) {
      toast.error('Digite um CEP válido');
      return false;
    }
    if (!formData.street.trim()) {
      toast.error('Digite o nome da rua');
      return false;
    }
    if (!formData.number.trim()) {
      toast.error('Digite o número');
      return false;
    }
    if (!formData.neighborhood.trim()) {
      toast.error('Digite o bairro');
      return false;
    }
    if (!formData.city.trim()) {
      toast.error('Digite a cidade');
      return false;
    }
    if (!formData.state.trim() || formData.state.length !== 2) {
      toast.error('Digite um estado válido (UF)');
      return false;
    }
    return true;
  };

  const handleNext = () => {
    setAttemptedSubmit(true);
    if (step === 1 && validateStep1()) {
      setStep(2);
      setAttemptedSubmit(false);
    } else if (step === 2 && validateStep2()) {
      setStep(3);
      setAttemptedSubmit(false);
    }
  };

  const steps = [
    { number: 1, title: 'Dados' },
    { number: 2, title: 'Endereço' },
    { number: 3, title: 'Pagamento' },
  ];

  if (checkingAuth) {
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
            onClick={() => step > 1 ? setStep(step - 1) : navigate(-1)}
            className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Checkout</h1>
        </div>
        
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-2 pb-4 px-4">
          {steps.map((s, i) => (
            <React.Fragment key={s.number}>
              <button
                onClick={() => s.number < step && setStep(s.number)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all",
                  step >= s.number
                    ? "bg-[#00FF85] text-black"
                    : "bg-[#1a1a1a] text-[#666]"
                )}
              >
                {step > s.number ? <Check className="w-3 h-3" /> : s.number}
                <span className="hidden sm:inline">{s.title}</span>
              </button>
              {i < steps.length - 1 && (
                <div className={cn(
                  "w-8 h-0.5 rounded",
                  step > s.number ? "bg-[#00FF85]" : "bg-[#2a2a2a]"
                )} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        {/* Step 1: Personal Data */}
        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold mb-4">Dados Pessoais</h2>
            <div className="space-y-4">
              <div>
                <Label htmlFor="name" className="text-sm text-[#888]">Nome completo *</Label>
                <Input
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  placeholder="Seu nome"
                />
                {attemptedSubmit && !formData.name && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
              <div>
                <Label htmlFor="email" className="text-sm text-[#888]">E-mail *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  placeholder="seu@email.com"
                />
                {attemptedSubmit && !formData.email && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
              <div>
                <Label htmlFor="phone" className="text-sm text-[#888]">Telefone *</Label>
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  placeholder="(00) 00000-0000"
                />
                {attemptedSubmit && !formData.phone && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 2: Address */}
        {step === 2 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <MapPin className="w-5 h-5 text-[#00FF85]" />
              Endereço de Entrega
            </h2>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label className="text-sm text-[#888]">CEP *</Label>
                <Input
                  name="zip_code"
                  value={formData.zip_code}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  placeholder="00000-000"
                  maxLength={9}
                  disabled={loadingCep}
                />
                {loadingCep && <p className="text-xs text-[#00FF85] mt-1">Buscando CEP...</p>}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label className="text-sm text-[#888]">Rua *</Label>
                <Input
                  name="street"
                  value={formData.street}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                />
                {attemptedSubmit && !formData.street && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
              <div>
                <Label className="text-sm text-[#888]">Número *</Label>
                <Input
                  name="number"
                  value={formData.number}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                />
                {attemptedSubmit && !formData.number && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
            </div>
            <div>
              <Label className="text-sm text-[#888]">Complemento</Label>
              <Input
                name="complement"
                value={formData.complement}
                onChange={handleInputChange}
                className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                placeholder="Apto, bloco, etc."
              />
            </div>
            <div>
              <Label className="text-sm text-[#888]">Bairro *</Label>
              <Input
                name="neighborhood"
                value={formData.neighborhood}
                onChange={handleInputChange}
                className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
              />
              {attemptedSubmit && !formData.neighborhood && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <Label className="text-sm text-[#888]">Cidade *</Label>
                <Input
                  name="city"
                  value={formData.city}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                />
                {attemptedSubmit && !formData.city && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
              <div>
                <Label className="text-sm text-[#888]">Estado *</Label>
                <Input
                  name="state"
                  value={formData.state}
                  onChange={handleInputChange}
                  className="bg-[#141414] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  placeholder="SP"
                  maxLength={2}
                />
                {attemptedSubmit && !formData.state && <p className="text-red-500 text-xs mt-1">Campo obrigatório</p>}
              </div>
            </div>
          </motion.div>
        )}

        {/* Step 3: Payment */}
        {step === 3 && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-4"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-[#00FF85]" />
              Forma de Pagamento
            </h2>
            <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <div
                    key={method.id}
                    className={cn(
                      "flex items-center justify-between p-4 rounded-xl border cursor-pointer transition-all",
                      paymentMethod === method.id
                        ? "border-[#00FF85] bg-[#00FF85]/10"
                        : "border-[#2a2a2a] bg-[#141414] hover:border-[#00FF85]/50"
                    )}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="flex items-center gap-3">
                      <RadioGroupItem value={method.id} id={method.id} className="border-[#00FF85] text-[#00FF85]" />
                      <Icon className={cn(
                        "w-5 h-5",
                        paymentMethod === method.id ? "text-[#00FF85]" : "text-[#888]"
                      )} />
                      <div>
                        <p className="font-medium">{method.name}</p>
                        <p className="text-sm text-[#888]">{method.description}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#888]" />
                  </div>
                );
              })}
            </RadioGroup>

            {/* Order Summary */}
            <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] space-y-3 mt-6">
              <h3 className="font-bold">Resumo do Pedido</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-[#888]">Subtotal ({cartItems.length} itens)</span>
                  <span>R$ {subtotal.toFixed(2)}</span>
                </div>
                {appliedCoupon && (
                  <div className="flex justify-between text-[#00FF85]">
                    <span>Cupom {appliedCoupon.code}</span>
                    <span>-R$ {couponDiscount.toFixed(2)}</span>
                  </div>
                )}
                {pixDiscount > 0 && (
                  <div className="flex justify-between text-[#00FF85]">
                    <span>Desconto PIX (10%)</span>
                    <span>-R$ {pixDiscount.toFixed(2)}</span>
                  </div>
                )}
                <div className="border-t border-[#2a2a2a] pt-2 flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-[#00FF85]">R$ {total.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#0A0A0A]/95 backdrop-blur-lg border-t border-[#2a2a2a] p-4 z-[60] mb-16 md:mb-0">
        <div className="max-w-7xl mx-auto px-4">
          {step < 3 ? (
            <NeonButton onClick={handleNext} className="w-full py-4">
              Continuar
              <ChevronRight className="w-4 h-4 ml-2" />
            </NeonButton>
          ) : (
            <NeonButton 
              onClick={() => createOrderMutation.mutate()} 
              disabled={createOrderMutation.isPending}
              className="w-full py-4"
            >
              {createOrderMutation.isPending ? 'Processando...' : 'Confirmar Pedido'}
            </NeonButton>
          )}
        </div>
      </div>
    </div>
  );
}
