import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Download, Printer, Package, Truck, CreditCard, MapPin } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { base44 } from '@/api/base44Client';

export default function Invoice() {
  const urlParams = new URLSearchParams(window.location.search);
  const orderId = urlParams.get('orderId');
  const navigate = useNavigate();
  const invoiceRef = useRef(null);

  const { data: order, isLoading } = useQuery({
    queryKey: ['order', orderId],
    queryFn: async () => {
      const orders = await base44.entities.Order.filter({ id: orderId });
      return orders[0];
    },
    enabled: !!orderId,
  });

  const handlePrint = () => {
    window.print();
  };

  const handleDownload = () => {
    // In a real app, this would generate a PDF
    window.print();
  };

  if (isLoading || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const paymentMethodLabel = {
    pix: 'PIX',
    cartao: 'Cartão de Crédito',
    boleto: 'Boleto Bancário',
  };

  const shippingMethodLabel = {
    pac: 'PAC',
    sedex: 'Sedex',
    transportadora: 'Transportadora',
    retirada: 'Retirada na Loja',
  };

  return (
    <div className="min-h-screen pb-8">
      {/* Header - Hidden on print */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a] print:hidden">
        <div className="flex items-center justify-between px-4 py-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Nota Fiscal</h1>
          </div>
          <div className="flex gap-2">
            <button onClick={handlePrint} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
              <Printer className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="px-4 py-6 max-w-2xl mx-auto">
        <div ref={invoiceRef} className="bg-[#141414] rounded-2xl border border-[#2a2a2a] overflow-hidden print:bg-white print:text-black print:border-gray-200">
          {/* Invoice Header */}
          <div className="bg-gradient-to-r from-[#00FF85]/20 to-transparent p-6 border-b border-[#2a2a2a] print:border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-black">
                  <span className="text-white print:text-black">CLUBE DA</span>
                  <span className="text-[#00FF85] print:text-green-600 ml-2">VÁRZEA</span>
                </h1>
                <p className="text-sm text-[#888] print:text-gray-500 mt-1">Nota Fiscal de Venda</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-[#888] print:text-gray-500">Nº do Pedido</p>
                <p className="font-bold text-[#00FF85] print:text-green-600">{order.order_number}</p>
              </div>
            </div>
          </div>

          {/* Customer & Order Info */}
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 border-b border-[#2a2a2a] print:border-gray-200">
            <div>
              <h3 className="text-sm font-bold text-[#00FF85] print:text-green-600 mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4" />
                DADOS DO CLIENTE
              </h3>
              <div className="space-y-1 text-sm">
                <p className="font-medium">{order.customer_name}</p>
                <p className="text-[#888] print:text-gray-500">{order.customer_email}</p>
                <p className="text-[#888] print:text-gray-500">{order.customer_phone}</p>
              </div>
            </div>
            <div>
              <h3 className="text-sm font-bold text-[#00FF85] print:text-green-600 mb-3 flex items-center gap-2">
                <Truck className="w-4 h-4" />
                ENDEREÇO DE ENTREGA
              </h3>
              <div className="text-sm text-[#888] print:text-gray-500 space-y-1">
                <p>{order.shipping_address?.street}, {order.shipping_address?.number}</p>
                {order.shipping_address?.complement && <p>{order.shipping_address.complement}</p>}
                <p>{order.shipping_address?.neighborhood}</p>
                <p>{order.shipping_address?.city} - {order.shipping_address?.state}</p>
                <p>CEP: {order.shipping_address?.zip_code}</p>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="p-6 border-b border-[#2a2a2a] print:border-gray-200">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <p className="text-[#888] print:text-gray-500">Data do Pedido</p>
                <p className="font-medium">
                  {format(new Date(order.created_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                </p>
              </div>
              <div>
                <p className="text-[#888] print:text-gray-500">Forma de Pagamento</p>
                <p className="font-medium flex items-center gap-1">
                  <CreditCard className="w-3 h-3" />
                  {paymentMethodLabel[order.payment_method]}
                </p>
              </div>
              <div>
                <p className="text-[#888] print:text-gray-500">Método de Envio</p>
                <p className="font-medium flex items-center gap-1">
                  <Package className="w-3 h-3" />
                  {shippingMethodLabel[order.shipping_method]}
                </p>
              </div>
              <div>
                <p className="text-[#888] print:text-gray-500">Status</p>
                <p className="font-medium text-[#00FF85] print:text-green-600">
                  {order.payment_status === 'aprovado' ? 'Pago' : 'Pendente'}
                </p>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="p-6 border-b border-[#2a2a2a] print:border-gray-200">
            <h3 className="text-sm font-bold text-[#00FF85] print:text-green-600 mb-4">ITENS DO PEDIDO</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[#2a2a2a] print:border-gray-200">
                    <th className="text-left py-2 text-[#888] print:text-gray-500 font-medium">Produto</th>
                    <th className="text-center py-2 text-[#888] print:text-gray-500 font-medium">Tam.</th>
                    <th className="text-center py-2 text-[#888] print:text-gray-500 font-medium">Qtd.</th>
                    <th className="text-right py-2 text-[#888] print:text-gray-500 font-medium">Preço</th>
                    <th className="text-right py-2 text-[#888] print:text-gray-500 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {order.items?.map((item, index) => (
                    <tr key={index} className="border-b border-[#1a1a1a] print:border-gray-100">
                      <td className="py-3">
                        <div>
                          <p className="font-medium">{item.name}</p>
                          <p className="text-xs text-[#888] print:text-gray-500">{item.team}</p>
                        </div>
                      </td>
                      <td className="py-3 text-center">{item.size}</td>
                      <td className="py-3 text-center">{item.quantity}</td>
                      <td className="py-3 text-right">R$ {item.price?.toFixed(2)}</td>
                      <td className="py-3 text-right font-medium">R$ {(item.price * item.quantity).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="p-6">
            <div className="max-w-xs ml-auto space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[#888] print:text-gray-500">Subtotal</span>
                <span>R$ {order.subtotal?.toFixed(2)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-sm text-[#00FF85] print:text-green-600">
                  <span>Desconto</span>
                  <span>-R$ {order.discount?.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[#888] print:text-gray-500">Frete</span>
                <span>{order.shipping_cost === 0 ? 'Grátis' : `R$ ${order.shipping_cost?.toFixed(2)}`}</span>
              </div>
              <div className="flex justify-between text-lg font-bold pt-2 border-t border-[#2a2a2a] print:border-gray-200">
                <span>Total</span>
                <span className="text-[#00FF85] print:text-green-600">R$ {order.total?.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="bg-[#1a1a1a] print:bg-gray-100 p-4 text-center text-xs text-[#888] print:text-gray-500">
            <p>Obrigado por comprar no Clube da Várzea!</p>
            <p className="mt-1">Dúvidas? contato@clubedavarzea.com.br | (11) 99999-9999</p>
          </div>
        </div>

        {/* Actions - Hidden on print */}
        <div className="mt-6 flex gap-3 print:hidden">
          <NeonButton onClick={handleDownload} className="flex-1">
            <Download className="w-4 h-4 mr-2" />
            Baixar PDF
          </NeonButton>
          <NeonButton variant="outline" onClick={() => navigate(createPageUrl(`Tracking?orderId=${orderId}`))}>
            <Truck className="w-4 h-4 mr-2" />
            Rastrear
          </NeonButton>
        </div>
      </div>
    </div>
  );
}
