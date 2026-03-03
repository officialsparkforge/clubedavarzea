import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Copy, Check, Clock, QrCode, CreditCard, FileText, CheckCircle2 } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { base44 } from '@/api/base44Client';

const toNumber = (value) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => toNumber(value).toFixed(2);

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const resolveApiUrl = () => {
  if (typeof window === 'undefined') {
    return RAW_API_URL;
  }

  const isHttpsPage = window.location.protocol === 'https:';
  const isInsecureConfiguredApi = RAW_API_URL.startsWith('http://');

  if (isHttpsPage && isInsecureConfiguredApi) {
    return window.location.origin;
  }

  return RAW_API_URL;
};

const RESOLVED_API_URL = resolveApiUrl().replace(/\/$/, '');
const API_URL = RESOLVED_API_URL.endsWith('/api')
  ? RESOLVED_API_URL
  : `${RESOLVED_API_URL}/api`;

export default function Payment() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [pixData, setPixData] = useState(null);
  const [boletoData, setBoletoData] = useState(null);
  const [customerDocument, setCustomerDocument] = useState('');
  const [cardData, setCardData] = useState({
    number: '',
    name: '',
    expiry: '',
    cvv: '',
    installments: '1',
  });

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  useEffect(() => {
    if (order?.payment_status === 'pago') {
      setPaymentConfirmed(true);
    }
    if (order?.customer_document) {
      setCustomerDocument(order.customer_document);
    }
  }, [order]);

  const buildCustomerData = () => {
    const shipping = order?.shipping_address || {};

    return {
      name: order?.customer_name || '',
      email: order?.customer_email || '',
      phone: order?.customer_phone || '',
      document: customerDocument || order?.customer_document || '',
      address: shipping.street || '',
      addressNumber: shipping.number || '',
      complement: shipping.complement || '',
      province: shipping.neighborhood || '',
      city: shipping.city || '',
      postalCode: shipping.zip_code || '',
    };
  };

  const generatePixMutation = useMutation({
    mutationFn: async () => {
      const customerData = buildCustomerData();
      if (!customerData.document) {
        throw new Error('CPF/CNPJ é obrigatório para gerar PIX');
      }

      const response = await fetch(`${API_URL}/asaas/payments/pix`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerData,
          value: toNumber(order?.total),
          description: `Pedido #${order?.order_number || orderId}`,
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.details || payload?.error || 'Falha ao gerar PIX');
      }

      return payload;
    },
    onSuccess: (payload) => {
      setPixData(payload.payment);
      queryClient.invalidateQueries(['order', orderId]);
      toast.success('PIX gerado com sucesso!');
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao gerar PIX');
    },
  });

  const processCardMutation = useMutation({
    mutationFn: async () => {
      const customerData = buildCustomerData();
      if (!customerData.document) {
        throw new Error('CPF/CNPJ é obrigatório para pagamento com cartão');
      }

      const [expiryMonth = '', expiryYearRaw = ''] = String(cardData.expiry || '').split('/');
      const expiryYear = expiryYearRaw.length === 2 ? `20${expiryYearRaw}` : expiryYearRaw;

      const response = await fetch(`${API_URL}/asaas/payments/card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerData,
          value: toNumber(order?.total),
          description: `Pedido #${order?.order_number || orderId}`,
          installments: Number(cardData.installments || 1),
          cardData: {
            holderName: cardData.name,
            number: cardData.number,
            expiryMonth,
            expiryYear,
            ccv: cardData.cvv,
          },
        }),
      });

      const payload = await response.json();
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || payload?.details || 'Falha ao processar cartão');
      }

      return payload;
    },
    onSuccess: async (payload) => {
      const paymentStatus = payload?.payment?.status;
      if (paymentStatus === 'CONFIRMED' || paymentStatus === 'RECEIVED') {
        setPaymentConfirmed(true);
      } else {
        toast.success('Pagamento enviado para análise. Aguarde confirmação.');
      }
      await queryClient.invalidateQueries(['order', orderId]);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao processar cartão');
    },
  });

  const generateBoletoMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch(`${API_URL}/asaas/payments/boleto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderId,
          customerData: buildCustomerData(),
          value: toNumber(order?.total),
          description: `Pedido #${order?.order_number || orderId}`,
        }),
      });

      const payload = await response.json();
      console.log('🎫 Resposta Boleto:', payload);
      if (!response.ok || payload?.success === false) {
        throw new Error(payload?.error || payload?.details || 'Falha ao gerar boleto');
      }

      return payload;
    },
    onSuccess: async (data) => {
      toast.success('Boleto gerado com sucesso!');
      // Armazenar dados do boleto para exibição
      setBoletoData(data.payment);
      // Abrir PDF do boleto automaticamente
      if (data.payment?.bankSlipUrl) {
        window.open(data.payment.bankSlipUrl, '_blank');
      }
      await queryClient.invalidateQueries(['order', orderId]);
    },
    onError: (error) => {
      toast.error(error.message || 'Erro ao gerar boleto');
    },
  });

  const pixCode = pixData?.pixQrCode || order?.pix_qr_code || '';

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const hasDocument = (customerDocument || order?.customer_document || '').replace(/\D/g, '').length >= 11;

    if (
      order?.payment_method === 'pix' &&
      hasDocument &&
      !order?.asaas_payment_id &&
      !generatePixMutation.isPending &&
      !generatePixMutation.isSuccess &&
      !pixCode
    ) {
      generatePixMutation.mutate();
    }
  }, [order, pixCode, customerDocument]);

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (paymentConfirmed) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring" }}
            className="w-24 h-24 rounded-full bg-[#00FF85]/20 flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircle2 className="w-12 h-12 text-[#00FF85]" />
          </motion.div>
          <h1 className="text-2xl font-bold mb-2">Pagamento Confirmado!</h1>
          <p className="text-[#888] mb-8">Seu pedido foi processado com sucesso</p>
          <div className="space-y-3">
            <NeonButton onClick={() => navigate(createPageUrl(`Invoice?orderId=${orderId}`))}>
              Ver Nota Fiscal
            </NeonButton>
            <NeonButton variant="outline" onClick={() => navigate(createPageUrl(`Tracking?orderId=${orderId}`))}>
              Rastrear Pedido
            </NeonButton>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Pagamento</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Order Info */}
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="flex justify-between items-center">
            <div>
              <p className="text-sm text-[#888]">Pedido</p>
              <p className="font-bold">{order.order_number}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-[#888]">Total</p>
              <p className="text-xl font-bold text-[#00FF85]">R$ {formatCurrency(order.total)}</p>
            </div>
          </div>
        </div>

        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <Label className="text-sm text-[#888]">CPF/CNPJ (obrigatório para pagamento)</Label>
          <Input
            value={customerDocument}
            onChange={(e) => setCustomerDocument(e.target.value)}
            className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
            placeholder="Digite seu CPF ou CNPJ"
          />
          {!customerDocument && (
            <p className="text-xs text-amber-400 mt-2">Preencha o CPF/CNPJ para gerar cobrança no Asaas.</p>
          )}
        </div>

        {/* PIX Payment */}
        {order.payment_method === 'pix' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <QrCode className="w-5 h-5 text-[#00FF85]" />
                <span className="font-bold">Pague com PIX</span>
              </div>
              
              {/* QR Code Container */}
              <div className="bg-white rounded-xl p-4 inline-block mb-4 relative overflow-hidden min-h-56 min-w-56">
                {(pixData?.pixQrCodeImage || order?.pix_qr_code_image) ? (
                  <img
                    src={pixData?.pixQrCodeImage || order?.pix_qr_code_image}
                    alt="QR Code PIX"
                    className="w-48 h-48 object-contain"
                  />
                ) : (
                  <div className="w-48 h-48 bg-[#f5f5f5] rounded-lg flex items-center justify-center text-[#666] text-sm">
                    {generatePixMutation.isPending ? 'Gerando QR Code...' : 'QR Code indisponível'}
                  </div>
                )}
              </div>

              <p className="text-sm text-[#888] mb-4">
                Escaneie o QR Code ou copie o código abaixo
              </p>

              {!pixCode && !generatePixMutation.isPending && (
                <div className="mb-4">
                  <NeonButton
                    onClick={() => generatePixMutation.mutate()}
                    disabled={generatePixMutation.isPending}
                    className="w-full"
                  >
                    {generatePixMutation.isPending ? 'Gerando PIX...' : 'Gerar QR Code PIX'}
                  </NeonButton>
                </div>
              )}

              {/* PIX Code */}
              <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-2">
                <code className="flex-1 text-xs text-[#888] truncate">{pixCode ? `${pixCode.slice(0, 50)}...` : 'Gerando código PIX...'}</code>
                <button
                  disabled={!pixCode}
                  onClick={copyPixCode}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00FF85]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mt-4 text-[#888]">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Aguardando pagamento real no Asaas...</span>
              </div>
            </div>

            <div className="text-center text-sm text-[#888]">
              <p>A confirmação acontece após o Asaas aprovar o pagamento</p>
            </div>
          </motion.div>
        )}

        {/* Card Payment */}
        {order.payment_method === 'cartao' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
              <div className="flex items-center gap-2 mb-6">
                <CreditCard className="w-5 h-5 text-[#00FF85]" />
                <span className="font-bold">Dados do Cartão</span>
              </div>

              <div className="space-y-4">
                <div>
                  <Label className="text-sm text-[#888]">Número do Cartão</Label>
                  <Input
                    value={cardData.number}
                    onChange={(e) => setCardData({ ...cardData, number: e.target.value })}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                    placeholder="0000 0000 0000 0000"
                  />
                </div>
                <div>
                  <Label className="text-sm text-[#888]">Nome no Cartão</Label>
                  <Input
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value })}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                    placeholder="NOME COMPLETO"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm text-[#888]">Validade</Label>
                    <Input
                      value={cardData.expiry}
                      onChange={(e) => setCardData({ ...cardData, expiry: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                      placeholder="MM/AA"
                    />
                  </div>
                  <div>
                    <Label className="text-sm text-[#888]">CVV</Label>
                    <Input
                      value={cardData.cvv}
                      onChange={(e) => setCardData({ ...cardData, cvv: e.target.value })}
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                      placeholder="000"
                      type="password"
                    />
                  </div>
                </div>
                <div>
                  <Label className="text-sm text-[#888]">Parcelas</Label>
                  <select
                    value={cardData.installments}
                    onChange={(e) => setCardData({ ...cardData, installments: e.target.value })}
                    className="w-full bg-[#1a1a1a] border border-[#2a2a2a] text-white rounded-md p-3 mt-1 focus:border-[#00FF85]/50 outline-none"
                  >
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((i) => (
                      <option key={i} value={i}>
                        {i}x de R$ {(toNumber(order.total) / i).toFixed(2)} sem juros
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <NeonButton 
              onClick={() => processCardMutation.mutate()} 
              disabled={processCardMutation.isPending}
              className="w-full py-4"
            >
              {processCardMutation.isPending ? 'Processando...' : 'Pagar Agora'}
            </NeonButton>
          </motion.div>
        )}

        {/* Boleto Payment */}
        {order.payment_method === 'boleto' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] text-center">
              <div className="flex items-center justify-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-[#00FF85]" />
                <span className="font-bold">Boleto Bancário</span>
              </div>
              
              <p className="text-[#888] text-sm mb-6">
                O boleto vence em 3 dias úteis. Após o pagamento, a confirmação pode levar até 2 dias úteis.
              </p>

              {boletoData && (
                <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                  <p className="text-xs text-[#888] mb-2">Código de barras</p>
                  <code className="text-sm break-all font-mono">
                    {boletoData.barCode || boletoData.identificationField || 'Aguardando geração...'}
                  </code>
                </div>
              )}

              <NeonButton 
                onClick={() => {
                  generateBoletoMutation.mutate();
                }}
                className="w-full"
              >
                {generateBoletoMutation.isPending ? 'Gerando...' : 'Gerar Boleto PDF'}
              </NeonButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
