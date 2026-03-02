import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Package, Truck, CheckCircle2, MapPin, Copy, ExternalLink, Clock } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

const statusSteps = [
  { id: 'confirmado', label: 'Pedido Confirmado', icon: CheckCircle2 },
  { id: 'separacao', label: 'Em Separação', icon: Package },
  { id: 'enviado', label: 'Enviado', icon: Truck },
  { id: 'saiu_entrega', label: 'Saiu para Entrega', icon: MapPin },
  { id: 'entregue', label: 'Entregue', icon: CheckCircle2 },
];

export default function Tracking() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const navigate = useNavigate();

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  const copyTrackingCode = () => {
    if (order?.tracking_code) {
      navigator.clipboard.writeText(order.tracking_code);
      toast.success('Código de rastreio copiado!');
    }
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const currentStepIndex = statusSteps.findIndex(s => s.id === order.status);

  return (
    <div className="min-h-screen pb-8">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-xl font-bold">Rastreamento</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6 max-w-lg mx-auto">
        {/* Order Info */}
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="flex justify-between items-start mb-4">
            <div>
              <p className="text-sm text-[#888]">Pedido</p>
              <p className="font-bold">{order.order_number}</p>
            </div>
            <Link to={createPageUrl(`Invoice?orderId=${orderId}`)}>
              <NeonButton variant="ghost" className="text-xs">
                Ver Nota
              </NeonButton>
            </Link>
          </div>
          
          {order.tracking_code && (
            <div className="bg-[#1a1a1a] rounded-xl p-3 flex items-center justify-between">
              <div>
                <p className="text-xs text-[#888]">Código de Rastreio</p>
                <p className="font-mono font-bold text-[#00FF85]">{order.tracking_code}</p>
              </div>
              <button
                onClick={copyTrackingCode}
                className="p-2 hover:bg-[#2a2a2a] rounded-lg transition-colors"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>

        {/* Status Timeline */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
          <h2 className="font-bold mb-6">Status do Pedido</h2>
          
          <div className="space-y-0">
            {statusSteps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = index <= currentStepIndex;
              const isCurrent = index === currentStepIndex;
              const isLast = index === statusSteps.length - 1;

              return (
                <div key={step.id} className="flex gap-4">
                  {/* Icon and Line */}
                  <div className="flex flex-col items-center">
                    <motion.div
                      initial={{ scale: 0.8, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300",
                        isCompleted
                          ? "bg-[#00FF85] text-black shadow-[0_0_15px_rgba(0,255,133,0.4)]"
                          : "bg-[#1a1a1a] text-[#666] border border-[#2a2a2a]",
                        isCurrent && "ring-2 ring-[#00FF85]/50 ring-offset-2 ring-offset-[#141414]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                    </motion.div>
                    {!isLast && (
                      <div className={cn(
                        "w-0.5 h-12 transition-colors duration-300",
                        index < currentStepIndex ? "bg-[#00FF85]" : "bg-[#2a2a2a]"
                      )} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 pb-8">
                    <p className={cn(
                      "font-medium",
                      isCompleted ? "text-white" : "text-[#666]"
                    )}>
                      {step.label}
                    </p>
                    {isCurrent && (
                      <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-sm text-[#00FF85] flex items-center gap-1 mt-1"
                      >
                        <Clock className="w-3 h-3 animate-pulse" />
                        Status atual
                      </motion.p>
                    )}
                    {isCompleted && !isCurrent && (
                      <p className="text-xs text-[#888] mt-1">
                        Concluído
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Delivery Info */}
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <Truck className="w-5 h-5 text-[#00FF85]" />
            Informações de Entrega
          </h3>
          
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-[#888]">Método</span>
              <span className="font-medium">
                {order.shipping_method === 'pac' && 'PAC'}
                {order.shipping_method === 'sedex' && 'Sedex'}
                {order.shipping_method === 'transportadora' && 'Transportadora'}
                {order.shipping_method === 'retirada' && 'Retirada na Loja'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#888]">Previsão</span>
              <span className="font-medium text-[#00FF85]">
                {order.estimated_delivery 
                  ? format(new Date(order.estimated_delivery), "dd 'de' MMMM", { locale: ptBR })
                  : 'A calcular'
                }
              </span>
            </div>
            <div className="pt-3 border-t border-[#2a2a2a]">
              <p className="text-[#888] mb-1">Endereço de Entrega</p>
              <p className="text-[#888] text-xs">
                {order.shipping_address?.street}, {order.shipping_address?.number}
                {order.shipping_address?.complement && ` - ${order.shipping_address.complement}`}
                <br />
                {order.shipping_address?.neighborhood}, {order.shipping_address?.city} - {order.shipping_address?.state}
                <br />
                CEP: {order.shipping_address?.zip_code}
              </p>
            </div>
          </div>
        </div>

        {/* Items Summary */}
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <h3 className="font-bold mb-4">Itens do Pedido</h3>
          <div className="space-y-3">
            {order.items?.map((item, index) => (
              <div key={index} className="flex gap-3">
                <div className="w-16 h-16 bg-[#1a1a1a] rounded-lg overflow-hidden flex-shrink-0">
                  <img src={item.image_url} alt={item.name} className="w-full h-full object-contain p-1" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm line-clamp-1">{item.name}</p>
                  <p className="text-xs text-[#888]">{item.team} • Tam: {item.size}</p>
                  <p className="text-xs text-[#888]">Qtd: {item.quantity}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="text-center text-sm text-[#888]">
          <p>Precisa de ajuda?</p>
          <a href="mailto:contato@clubedavarzea.com.br" className="text-[#00FF85] hover:underline">
            contato@clubedavarzea.com.br
          </a>
        </div>
      </div>
    </div>
  );
}
