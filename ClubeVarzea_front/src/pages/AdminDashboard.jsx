import React, { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { ordersAPI } from '@/lib/api';
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, Settings, BarChart3, ArrowLeft, X } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [selectedModal, setSelectedModal] = useState(null);

  useEffect(() => {
    // Redirecionar se não for admin
    if (user && !isAdmin()) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Carregar pedidos da API
  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: () => ordersAPI.listar(true), // true = show all orders for admin
  });

  const mockProducts = [];
  const products = mockProducts;

  const totalRevenue = orders.reduce((sum, order) => sum + (order.total || 0), 0);
  const totalOrders = orders.length;
  const pendingOrders = orders.filter(o => o.status === 'confirmado' || o.status === 'separacao');
  const completedOrders = orders.filter(o => o.status === 'entregue');

  const recentOrders = orders.slice(0, 10);

  // Dados para gráfico de vendas por mês
  const salesByMonth = orders.reduce((acc, order) => {
    const month = format(new Date(order.created_date), 'MMM/yy', { locale: ptBR });
    if (!acc[month]) {
      acc[month] = { month, total: 0, count: 0 };
    }
    acc[month].total += order.total || 0;
    acc[month].count += 1;
    return acc;
  }, {});
  const monthlyData = Object.values(salesByMonth).slice(-6);

  // Dados para gráfico por região (baseado em estado)
  const salesByRegion = orders.reduce((acc, order) => {
    const state = order.shipping_address?.state || 'N/A';
    if (!acc[state]) {
      acc[state] = { state, total: 0, count: 0 };
    }
    acc[state].total += order.total || 0;
    acc[state].count += 1;
    return acc;
  }, {});
  const regionData = Object.values(salesByRegion).sort((a, b) => b.total - a.total).slice(0, 10);

  const statusColors = {
    confirmado: 'bg-blue-500/20 text-blue-400',
    separacao: 'bg-yellow-500/20 text-yellow-400',
    enviado: 'bg-purple-500/20 text-purple-400',
    saiu_entrega: 'bg-indigo-500/20 text-indigo-400',
    entregue: 'bg-green-500/20 text-green-400',
    cancelado: 'bg-red-500/20 text-red-400',
  };

  const statusLabels = {
    confirmado: 'Confirmado',
    separacao: 'Em Separação',
    enviado: 'Enviado',
    saiu_entrega: 'Saiu p/ Entrega',
    entregue: 'Entregue',
    cancelado: 'Cancelado',
  };

  if (loadingOrders) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/" className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <h1 className="text-2xl font-bold">Dashboard Admin</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Stats Grid - Clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card 
            className="bg-[#141414] border-[#2a2a2a] cursor-pointer hover:border-[#00FF85]/50 transition-colors"
            onClick={() => setSelectedModal('revenue')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#888]">Receita Total</CardTitle>
              <DollarSign className="w-4 h-4 text-[#00FF85]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">R$ {totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#141414] border-[#2a2a2a] cursor-pointer hover:border-[#00FF85]/50 transition-colors"
            onClick={() => setSelectedModal('allOrders')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#888]">Total de Pedidos</CardTitle>
              <ShoppingCart className="w-4 h-4 text-[#00FF85]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{totalOrders}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#141414] border-[#2a2a2a] cursor-pointer hover:border-[#00FF85]/50 transition-colors"
            onClick={() => setSelectedModal('pending')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#888]">Pedidos Pendentes</CardTitle>
              <Package className="w-4 h-4 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{pendingOrders.length}</div>
            </CardContent>
          </Card>

          <Card 
            className="bg-[#141414] border-[#2a2a2a] cursor-pointer hover:border-[#00FF85]/50 transition-colors"
            onClick={() => setSelectedModal('products')}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-[#888]">Produtos Ativos</CardTitle>
              <Package className="w-4 h-4 text-[#00FF85]" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{products.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Menu Admin */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link 
            to="/AdminProducts"
            className="bg-[#141414] border border-[#2a2a2a] hover:border-[#00FF85]/50 rounded-xl p-6 transition-colors text-center group"
          >
            <Settings className="w-8 h-8 mx-auto mb-2 text-[#00FF85] group-hover:text-white transition-colors" />
            <p className="font-bold">Gerenciar Produtos</p>
            <p className="text-xs text-[#888]">Editar catálogo</p>
          </Link>

          <Link 
            to="/AdminCosts"
            className="bg-[#141414] border border-[#2a2a2a] hover:border-[#00FF85]/50 rounded-xl p-6 transition-colors text-center group"
          >
            <BarChart3 className="w-8 h-8 mx-auto mb-2 text-[#00FF85] group-hover:text-white transition-colors" />
            <p className="font-bold">Análise de Custos</p>
            <p className="text-xs text-[#888]">Margem e lucro</p>
          </Link>

          <Link 
            to="/AdminCoupons"
            className="bg-[#141414] border border-[#2a2a2a] hover:border-[#00FF85]/50 rounded-xl p-6 transition-colors text-center group"
          >
            <TrendingUp className="w-8 h-8 mx-auto mb-2 text-[#00FF85] group-hover:text-white transition-colors" />
            <p className="font-bold">Cupons</p>
            <p className="text-xs text-[#888]">Promoções</p>
          </Link>

          <Link 
            to="/AdminSettings"
            className="bg-[#141414] border border-[#2a2a2a] hover:border-[#00FF85]/50 rounded-xl p-6 transition-colors text-center group"
          >
            <Settings className="w-8 h-8 mx-auto mb-2 text-[#00FF85] group-hover:text-white transition-colors" />
            <p className="font-bold">Configurações</p>
            <p className="text-xs text-[#888]">Sistema</p>
          </Link>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card className="bg-[#141414] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white">Vendas por Mês</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="total" stroke="#00FF85" strokeWidth={2} name="Receita" />
                  <Line type="monotone" dataKey="count" stroke="#888" strokeWidth={2} name="Pedidos" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="bg-[#141414] border-[#2a2a2a]">
            <CardHeader>
              <CardTitle className="text-white">Vendas por Estado</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={regionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                  <XAxis dataKey="state" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#141414', border: '1px solid #2a2a2a' }}
                    labelStyle={{ color: '#fff' }}
                    formatter={(value) => `R$ ${value.toFixed(2)}`}
                  />
                  <Legend />
                  <Bar dataKey="total" fill="#00FF85" name="Receita" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recent Orders */}
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader>
            <CardTitle className="text-white">Pedidos Recentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentOrders.length === 0 ? (
                <p className="text-[#666] text-center py-8">Nenhum pedido ainda</p>
              ) : (
                recentOrders.map(order => (
                  <div key={order.id} className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">#{order.order_number}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[order.status]}`}>
                          {statusLabels[order.status]}
                        </span>
                      </div>
                      <p className="text-sm text-[#888] mt-1">{order.customer_name}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-semibold">R$ {order.total.toFixed(2)}</p>
                      <p className="text-xs text-[#666]">{order.items?.length || 0} itens</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modais */}
      <Dialog open={!!selectedModal} onOpenChange={() => setSelectedModal(null)}>
        <DialogContent className="bg-[#141414] border-[#2a2a2a] max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-white">
              {selectedModal === 'revenue' && 'Detalhes da Receita'}
              {selectedModal === 'allOrders' && 'Todos os Pedidos'}
              {selectedModal === 'pending' && 'Pedidos Pendentes'}
              {selectedModal === 'products' && 'Produtos Ativos'}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-3 mt-4">
            {selectedModal === 'revenue' && orders.map(order => (
              <div key={order.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-white">#{order.order_number}</p>
                    <p className="text-sm text-[#888]">{order.customer_name}</p>
                  </div>
                  <p className="text-[#00FF85] font-bold">R$ {order.total.toFixed(2)}</p>
                </div>
              </div>
            ))}

            {selectedModal === 'allOrders' && orders.map(order => (
              <div key={order.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">#{order.order_number}</p>
                    <p className="text-sm text-[#888]">{order.customer_name}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00FF85] font-bold">R$ {order.total.toFixed(2)}</p>
                    <p className="text-xs text-[#666]">{order.items?.length || 0} itens</p>
                  </div>
                </div>
              </div>
            ))}

            {selectedModal === 'pending' && pendingOrders.map(order => (
              <div key={order.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a]">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold text-white">#{order.order_number}</p>
                    <p className="text-sm text-[#888]">{order.customer_name}</p>
                    <span className={`inline-block mt-2 px-2 py-1 rounded-full text-xs ${statusColors[order.status]}`}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00FF85] font-bold">R$ {order.total.toFixed(2)}</p>
                    <p className="text-xs text-[#666]">{order.items?.length || 0} itens</p>
                  </div>
                </div>
              </div>
            ))}

            {selectedModal === 'products' && products.map(product => (
              <div key={product.id} className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] flex items-center gap-4">
                <img src={product.image_url} alt={product.name} className="w-16 h-16 object-contain bg-[#0A0A0A] rounded" />
                <div className="flex-1">
                  <p className="font-semibold text-white">{product.name}</p>
                  <p className="text-sm text-[#888]">{product.team}</p>
                </div>
                <p className="text-[#00FF85] font-bold">R$ {product.price.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
