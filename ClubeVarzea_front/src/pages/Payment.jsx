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

export default function Payment() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);
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

  const confirmPaymentMutation = useMutation({
    mutationFn: async () => {
      const trackingCode = `BR${Date.now().toString(36).toUpperCase()}CDV`;
      await base44.entities.Order.update(orderId, {
        payment_status: 'pago',
        status: 'separacao',
        tracking_code: trackingCode,
      });
      
      // Enviar email com nota fiscal
      const invoiceUrl = `${window.location.origin}${createPageUrl(`Invoice?orderId=${orderId}`)}`;
      await base44.integrations.Core.SendEmail({
        to: order.customer_email,
        subject: `Clube da Várzea - Pedido #${order.order_number} Confirmado!`,
        body: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #0A0A0A 0%, #1a3a1a 100%); padding: 30px; text-align: center;">
              <h1 style="color: #00FF85; margin: 0;">🎉 Pedido Confirmado!</h1>
            </div>
            <div style="padding: 30px; background: #f5f5f5;">
              <h2 style="color: #333;">Olá ${order.customer_name},</h2>
              <p style="color: #666; line-height: 1.6;">
                Seu pedido #${order.order_number} foi confirmado com sucesso!
              </p>
              
              <div style="background: white; padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #00FF85; margin-top: 0;">Resumo do Pedido</h3>
                <p style="color: #666;">
                  <strong>Total:</strong> R$ ${order.total.toFixed(2)}<br>
                  <strong>Código de Rastreio:</strong> ${trackingCode}<br>
                  <strong>Previsão de Entrega:</strong> ${new Date(order.estimated_delivery).toLocaleDateString('pt-BR')}
                </p>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${invoiceUrl}" style="background: #00FF85; color: black; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                  Ver Nota Fiscal
                </a>
              </div>
              
              <p style="color: #999; font-size: 12px; margin-top: 30px;">
                Você pode acompanhar seu pedido a qualquer momento através do nosso site.
              </p>
            </div>
          </div>
        `
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['order', orderId]);
      setPaymentConfirmed(true);
    },
  });

  const pixCode = `00020126580014BR.GOV.BCB.PIX0136${orderId}520400005303986540${order?.total?.toFixed(2) || '0.00'}5802BR5925CLUBE DA VARZEA6009SAO PAULO62070503***6304`;

  const copyPixCode = () => {
    navigator.clipboard.writeText(pixCode);
    setCopied(true);
    toast.success('Código PIX copiado!');
    setTimeout(() => setCopied(false), 2000);
  };

  // Simulate payment confirmation after 5 seconds for PIX
  useEffect(() => {
    if (order?.payment_method === 'pix' && !paymentConfirmed) {
      const timer = setTimeout(() => {
        confirmPaymentMutation.mutate();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [order]);

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
              <p className="text-xl font-bold text-[#00FF85]">R$ {order.total?.toFixed(2)}</p>
            </div>
          </div>
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
              <div className="bg-white rounded-xl p-4 inline-block mb-4 relative overflow-hidden">
                <div className="w-48 h-48 bg-gradient-to-br from-[#1a1a1a] to-[#0A0A0A] rounded-lg flex items-center justify-center">
                  <div className="grid grid-cols-8 gap-1">
                    {[...Array(64)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-4 h-4 ${Math.random() > 0.5 ? 'bg-black' : 'bg-white'}`}
                      />
                    ))}
                  </div>
                </div>
                <div className="absolute inset-0 bg-[#00FF85]/10" />
              </div>

              <p className="text-sm text-[#888] mb-4">
                Escaneie o QR Code ou copie o código abaixo
              </p>

              {/* PIX Code */}
              <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center gap-2">
                <code className="flex-1 text-xs text-[#888] truncate">{pixCode.slice(0, 50)}...</code>
                <button
                  onClick={copyPixCode}
                  className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-[#00FF85]" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Timer */}
              <div className="flex items-center justify-center gap-2 mt-4 text-[#888]">
                <Clock className="w-4 h-4 animate-pulse" />
                <span className="text-sm">Aguardando pagamento...</span>
              </div>
            </div>

            <div className="text-center text-sm text-[#888]">
              <p>O pagamento será confirmado automaticamente</p>
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
                        {i}x de R$ {(order.total / i).toFixed(2)} sem juros
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <NeonButton 
              onClick={() => confirmPaymentMutation.mutate()} 
              disabled={confirmPaymentMutation.isPending}
              className="w-full py-4"
            >
              {confirmPaymentMutation.isPending ? 'Processando...' : 'Pagar Agora'}
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

              <div className="bg-[#1a1a1a] rounded-xl p-4 mb-4">
                <p className="text-xs text-[#888] mb-2">Código de barras</p>
                <code className="text-sm break-all">
                  23793.38128 60000.000003 00000.000400 1 92850000{(order.total * 100).toFixed(0)}
                </code>
              </div>

              <NeonButton 
                onClick={() => {
                  toast.success('Boleto gerado! Download iniciado.');
                  confirmPaymentMutation.mutate();
                }}
                className="w-full"
              >
                Gerar Boleto PDF
              </NeonButton>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
