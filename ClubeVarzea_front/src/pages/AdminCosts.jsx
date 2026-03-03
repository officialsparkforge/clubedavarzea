import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { ArrowLeft, Search, TrendingUp, Package, DollarSign, BarChart3, ChevronDown } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { toast } from 'sonner';
import NeonButton from '@/components/ui/NeonButton';

const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';
const resolveApiUrl = () => {
  if (typeof window === 'undefined') return RAW_API_URL;
  const isHttpsPage = window.location.protocol === 'https:';
  const isInsecureConfiguredApi = RAW_API_URL.startsWith('http://');
  if (isHttpsPage && isInsecureConfiguredApi) return window.location.origin;
  return RAW_API_URL;
};
const RESOLVED_API_URL = resolveApiUrl().replace(/\/$/, '');
const API_URL = RESOLVED_API_URL.endsWith('/api')
  ? RESOLVED_API_URL
  : `${RESOLVED_API_URL}/api`;

const formatCurrency = (value) => {
  const num = Number(value) || 0;
  return `R$ ${num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.')}`;
};

const formatPercent = (value) => `${(value || 0).toFixed(1)}%`;

export default function AdminCosts() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [filterTime, setFilterTime] = useState('');
  const [sortBy, setSortBy] = useState('lucro'); // nome, custo, venda, margem, lucro, quantidade

  if (!isAdmin()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Acesso negado</p>
      </div>
    );
  }

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-custos'],
    queryFn: async () => {
      const response = await fetch(`${API_URL}/admin/analise-custos`);
      if (!response.ok) throw new Error('Erro ao carregar análise');
      return response.json();
    },
  });

  const filteredProducts = useMemo(() => {
    if (!data?.produtos) return [];
    
    let filtered = data.produtos.filter(p =>
      p.nome.toLowerCase().includes(search.toLowerCase()) ||
      (p.time?.toLowerCase().includes(search.toLowerCase())) ||
      (p.categoria?.toLowerCase().includes(search.toLowerCase()))
    );

    if (filterTime) {
      filtered = filtered.filter(p => p.time === filterTime);
    }

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case 'nome':
          return a.nome.localeCompare(b.nome);
        case 'custo':
          return b.custo_unitario - a.custo_unitario;
        case 'venda':
          return b.preco_venda - a.preco_venda;
        case 'margem':
          return b.margem_lucro_unitaria - a.margem_lucro_unitaria;
        case 'quantidade':
          return b.quantidade_vendida - a.quantidade_vendida;
        case 'lucro':
        default:
          return b.lucro_total - a.lucro_total;
      }
    });
  }, [data?.produtos, search, filterTime, sortBy]);

  const times = useMemo(() => {
    if (!data?.produtos) return [];
    return [...new Set(data.produtos.map(p => p.time).filter(Boolean))];
  }, [data?.produtos]);

  const resumo = data?.resumo || {
    total_produtos: 0,
    quantidade_vendida_total: 0,
    receita_total: 0,
    custo_total: 0,
    lucro_total: 0,
    margem_media: 0,
  };

  const chartData = filteredProducts.slice(0, 10).map(p => ({
    name: p.nome.substring(0, 20),
    margem: parseFloat(p.margem_lucro_unitaria.toFixed(1)),
    lucro: parseFloat(p.lucro_total.toFixed(2)),
  }));

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">Erro ao carregar dados</p>
          <NeonButton onClick={() => window.location.reload()}>
            Tentar novamente
          </NeonButton>
        </div>
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
              <Link to="/AdminDashboard" className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Análise de Custos e Margens</h1>
                <p className="text-[#888] text-sm">BI completo de vendas e rentabilidade</p>
              </div>
            </div>
            <BarChart3 className="w-8 h-8 text-[#00FF85]" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Resumo em Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#888] text-sm">Receita Total</p>
              <DollarSign className="w-5 h-5 text-[#00FF85]" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(resumo.receita_total)}</p>
            <p className="text-[#888] text-xs mt-2">{resumo.quantidade_vendida_total} vendas</p>
          </div>

          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#888] text-sm">Lucro Total</p>
              <TrendingUp className="w-5 h-5 text-[#00FF85]" />
            </div>
            <p className="text-2xl font-bold text-[#00FF85]">{formatCurrency(resumo.lucro_total)}</p>
            <p className="text-[#888] text-xs mt-2">Margem média: {formatPercent(resumo.margem_media)}</p>
          </div>

          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[#888] text-sm">Custo Total</p>
              <Package className="w-5 h-5 text-[#00FF85]" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(resumo.custo_total)}</p>
            <p className="text-[#888] text-xs mt-2">{resumo.total_produtos} produtos</p>
          </div>
        </div>

        {/* Gráfico de Margens */}
        {chartData.length > 0 && (
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] mb-8">
            <h3 className="text-lg font-bold mb-4">Top 10 Produtos por Margem</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2a2a2a" />
                <XAxis dataKey="name" stroke="#888" style={{ fontSize: '12px' }} />
                <YAxis stroke="#888" />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #2a2a2a', borderRadius: '8px' }}
                  formatter={(value, name) => {
                    if (name === 'margem') return [`${value}%`, 'Margem'];
                    return [`R$ ${value.toFixed(2)}`, 'Lucro'];
                  }}
                />
                <Bar dataKey="margem" fill="#00FF85" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Filtros e Busca */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a] mb-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#666]" />
              <Input
                placeholder="Buscar produto..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 bg-[#1a1a1a] border-[#2a2a2a]"
              />
            </div>

            <select
              value={filterTime}
              onChange={(e) => setFilterTime(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white"
            >
              <option value="">Todos os times</option>
              {times.map(time => (
                <option key={time} value={time}>{time}</option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-2 text-sm text-white"
            >
              <option value="nome">Nome</option>
              <option value="custo">Custo</option>
              <option value="venda">Preço de Venda</option>
              <option value="margem">Margem Unitária</option>
              <option value="quantidade">Quantidade Vendida</option>
              <option value="lucro">Lucro Total</option>
            </select>

            <div className="text-sm text-[#888]">
              {filteredProducts.length} produtos encontrados
            </div>
          </div>
        </div>

        {/* Tabela de Produtos */}
        <div className="space-y-2">
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-[#888]">
              Nenhum produto encontrado
            </div>
          ) : (
            filteredProducts.map(product => (
              <div key={product.id}>
                <div
                  onClick={() => setExpandedProduct(expandedProduct === product.id ? null : product.id)}
                  className="bg-[#141414] rounded-xl p-4 border border-[#2a2a2a] hover:border-[#00FF85]/50 transition-colors cursor-pointer"
                >
                  <div className="grid grid-cols-2 md:grid-cols-10 gap-3 items-center">
                    <div className="md:col-span-2">
                      <p className="font-bold truncate">{product.nome}</p>
                      <p className="text-xs text-[#888]">
                        {product.time && <Badge variant="outline" className="mr-2 text-xs">{product.time}</Badge>}
                        {product.categoria && <Badge variant="outline" className="text-xs">{product.categoria}</Badge>}
                      </p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-[#888]">Custo</p>
                      <p className="font-bold text-sm">{formatCurrency(product.custo_unitario)}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-[#888]">Venda</p>
                      <p className="font-bold text-sm">{formatCurrency(product.preco_venda)}</p>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-[#888]">Margem</p>
                      <p className={`font-bold text-sm ${product.margem_lucro_unitaria >= 30 ? 'text-[#00FF85]' : product.margem_lucro_unitaria >= 15 ? 'text-yellow-400' : 'text-red-400'}`}>
                        {formatPercent(product.margem_lucro_unitaria)}
                      </p>
                    </div>

                    <div className="text-center hidden md:block">
                      <p className="text-xs text-[#888]">Qtd Vendida</p>
                      <p className="font-bold text-sm">{product.quantidade_vendida}</p>
                    </div>

                    <div className="text-center hidden md:block">
                      <p className="text-xs text-[#888]">Receita</p>
                      <p className="font-bold text-sm text-[#00FF85]">{formatCurrency(product.receita_total)}</p>
                    </div>

                    <div className="text-center hidden md:block">
                      <p className="text-xs text-[#888]">Custo Total</p>
                      <p className="font-bold text-sm">{formatCurrency(product.custo_total)}</p>
                    </div>

                    <div className="text-center md:col-span-2">
                      <p className="text-xs text-[#888]">Lucro</p>
                      <p className="font-bold text-sm text-[#00FF85]">{formatCurrency(product.lucro_total)}</p>
                    </div>

                    <div className="text-right">
                      <ChevronDown className={`w-4 h-4 transition-transform ${expandedProduct === product.id ? 'rotate-180' : ''}`} />
                    </div>
                  </div>
                </div>

                {/* Expansão de Detalhes */}
                {expandedProduct === product.id && (
                  <div className="bg-[#1a1a1a] rounded-b-xl p-4 border border-t-0 border-[#2a2a2a] grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-[#888] mb-1">Estoque</p>
                      <p className="font-bold">{product.estoque}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888] mb-1">Margem Bruta Total</p>
                      <p className="font-bold text-[#00FF85]">{formatPercent(product.margem_lucro_bruta)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888] mb-1">Ticket Médio</p>
                      <p className="font-bold">{formatCurrency(product.receita_total / Math.max(product.quantidade_vendida, 1))}</p>
                    </div>
                    <div>
                      <p className="text-xs text-[#888] mb-1">Lucro Médio por Venda</p>
                      <p className="font-bold text-[#00FF85]">{formatCurrency(product.lucro_total / Math.max(product.quantidade_vendida, 1))}</p>
                    </div>

                    {product.historico_custos.length > 0 && (
                      <div className="md:col-span-4 pt-4 border-t border-[#2a2a2a]">
                        <p className="text-xs text-[#888] font-bold mb-2">Histórico de Custos (Últimas Alterações)</p>
                        <div className="space-y-2">
                          {product.historico_custos.map((h, i) => (
                            <div key={i} className="text-xs bg-[#141414] p-2 rounded flex justify-between">
                              <span>{new Date(h.data).toLocaleDateString('pt-BR')}</span>
                              <span>Custo: {formatCurrency(h.custo)} | Venda: {formatCurrency(h.venda)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
