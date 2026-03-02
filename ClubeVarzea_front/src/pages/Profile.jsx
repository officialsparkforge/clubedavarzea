import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { User, Package, Heart, MapPin, LogOut, ChevronRight, Edit2, Check, X, Truck, CreditCard, Clock, Gift, Crown, Settings } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';
import { useAuth } from '@/lib/AuthContext';

const statusColors = {
  confirmado: 'text-yellow-500',
  separacao: 'text-blue-500',
  enviado: 'text-purple-500',
  saiu_entrega: 'text-orange-500',
  entregue: 'text-[#00FF85]',
  cancelado: 'text-red-500',
};

const statusLabels = {
  confirmado: 'Confirmado',
  separacao: 'Em Separação',
  enviado: 'Enviado',
  saiu_entrega: 'Saiu para Entrega',
  entregue: 'Entregue',
  cancelado: 'Cancelado',
};

export default function Profile() {
  const queryClient = useQueryClient();
  const { user: authUser, changePassword } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [activeTab, setActiveTab] = useState('orders');
  const [userData, setUserData] = useState({
    full_name: '',
    phone: '',
    address: {
      street: '',
      number: '',
      complement: '',
      neighborhood: '',
      city: '',
      state: '',
      zip_code: '',
    },
  });
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const { data: user, isLoading: loadingUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: orders = [], isLoading: loadingOrders } = useQuery({
    queryKey: ['userOrders'],
    queryFn: () => base44.entities.Order.list('-created_date', 20),
  });

  const { data: favorites = [] } = useQuery({
    queryKey: ['favorites'],
    queryFn: () => base44.entities.Favorite.list(),
  });

  useEffect(() => {
    if (user) {
      setUserData({
        full_name: user.full_name || '',
        phone: user.phone || '',
        address: user.address || {
          street: '',
          number: '',
          complement: '',
          neighborhood: '',
          city: '',
          state: '',
          zip_code: '',
        },
      });
    }
  }, [user]);

  const updateUserMutation = useMutation({
    mutationFn: async (data) => {
      await base44.auth.updateMe(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['currentUser']);
      setIsEditing(false);
      toast.success('Dados atualizados com sucesso!');
    },
    onError: () => {
      toast.error('Erro ao atualizar dados');
    },
  });

  const handleLogout = () => {
    base44.auth.logout();
  };

  const handleChangePassword = async (event) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError('As senhas nao conferem');
      return;
    }

    const targetEmail = authUser?.email || user?.email;
    if (!targetEmail) {
      setPasswordError('Voce precisa estar logado para trocar a senha');
      return;
    }

    try {
      await changePassword(targetEmail, passwordForm.currentPassword, passwordForm.newPassword);
      setPasswordMessage('Senha atualizada com sucesso');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      setPasswordError(error.message);
    }
  };

  const tabs = [
    { id: 'orders', label: 'Pedidos', icon: Package, count: orders.length },
    { id: 'favorites', label: 'Favoritos', icon: Heart, count: favorites.length },
    { id: 'data', label: 'Meus Dados', icon: User },
  ];

  if (loadingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-[#00FF85] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="bg-gradient-to-b from-[#1a1a1a] to-[#0A0A0A] px-4 pt-8 pb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-[#00FF85]/20 flex items-center justify-center border-2 border-[#00FF85]">
            <User className="w-8 h-8 text-[#00FF85]" />
          </div>
          <div className="flex-1">
            <h1 className="text-xl font-bold">{user?.full_name || 'Usuário'}</h1>
            <p className="text-sm text-[#888]">{user?.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
        
        {/* Quick Links */}
        <div className="grid grid-cols-3 gap-3">
          <Link to={createPageUrl('Rewards')}>
            <div className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] hover:border-[#00FF85]/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Gift className="w-4 h-4 text-[#00FF85]" />
                <span className="text-xs font-medium">Recompensas</span>
              </div>
              <p className="text-[10px] text-[#888]">Ganhe pontos</p>
            </div>
          </Link>
          <Link to={createPageUrl('Wallet')}>
            <div className="bg-[#141414] rounded-xl p-3 border border-[#2a2a2a] hover:border-[#00FF85]/30 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard className="w-4 h-4 text-[#00FF85]" />
                <span className="text-xs font-medium">Carteira</span>
              </div>
              <p className="text-[10px] text-[#888]">Seu saldo</p>
            </div>
          </Link>
          <Link to={createPageUrl('Club')}>
            <div className="bg-gradient-to-br from-yellow-600/20 to-orange-600/20 rounded-xl p-3 border border-yellow-600/30 hover:border-yellow-600/50 transition-colors">
              <div className="flex items-center gap-2 mb-1">
                <Crown className="w-4 h-4 text-yellow-500" />
                <span className="text-xs font-medium text-yellow-500">Clube VIP</span>
              </div>
              <p className="text-[10px] text-yellow-600/80">Box 3 camisas</p>
            </div>
          </Link>
        </div>
        
        {/* Admin Access - Only visible for admin users */}
        {user?.role === 'admin' && (
          <Link to={createPageUrl('AdminDashboard')}>
            <div className="bg-gradient-to-br from-red-600/20 to-purple-600/20 rounded-xl p-4 border border-red-600/30 hover:border-red-600/50 transition-colors mt-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-red-500" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-red-500">Painel Administrativo</span>
                    <p className="text-[10px] text-red-600/80">Gerenciar produtos e pedidos</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </Link>
        )}
      </div>

      {/* Tabs */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex px-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex-1 flex items-center justify-center gap-2 py-4 border-b-2 transition-all",
                  activeTab === tab.id
                    ? "border-[#00FF85] text-[#00FF85]"
                    : "border-transparent text-[#888] hover:text-white"
                )}
              >
                <Icon className="w-4 h-4" />
                <span className="text-sm font-medium">{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    "text-xs px-1.5 py-0.5 rounded-full",
                    activeTab === tab.id ? "bg-[#00FF85]/20" : "bg-[#2a2a2a]"
                  )}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <div className="px-4 py-6">
        {/* Orders Tab */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            {loadingOrders ? (
              [...Array(3)].map((_, i) => (
                <div key={i} className="bg-[#141414] rounded-2xl h-32 animate-pulse" />
              ))
            ) : orders.length === 0 ? (
              <div className="text-center py-12">
                <Package className="w-16 h-16 text-[#2a2a2a] mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">Nenhum pedido ainda</h2>
                <p className="text-[#888] text-sm mb-6">Explore nossa loja e faça seu primeiro pedido!</p>
                <Link to={createPageUrl('Shop')}>
                  <NeonButton>Ver Produtos</NeonButton>
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <Link
                  key={order.id}
                  to={createPageUrl(`Tracking?orderId=${order.id}`)}
                  className="block bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] hover:border-[#00FF85]/30 transition-colors"
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <p className="font-bold">{order.order_number}</p>
                      <p className="text-xs text-[#888]">
                        {format(new Date(order.created_date), "dd 'de' MMMM, yyyy", { locale: ptBR })}
                      </p>
                    </div>
                    <span className={cn("text-sm font-medium", statusColors[order.status])}>
                      {statusLabels[order.status]}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex -space-x-2">
                      {order.items?.slice(0, 3).map((item, index) => (
                        <div
                          key={index}
                          className="w-10 h-10 bg-[#1a1a1a] rounded-lg border-2 border-[#141414] overflow-hidden"
                        >
                          <img src={item.image_url} alt="" className="w-full h-full object-contain p-1" />
                        </div>
                      ))}
                      {order.items?.length > 3 && (
                        <div className="w-10 h-10 bg-[#1a1a1a] rounded-lg border-2 border-[#141414] flex items-center justify-center text-xs text-[#888]">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-[#888]">{order.items?.length} item(s)</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-[#00FF85]">R$ {order.total?.toFixed(2)}</p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#888]" />
                  </div>
                </Link>
              ))
            )}
          </div>
        )}

        {/* Favorites Tab */}
        {activeTab === 'favorites' && (
          <div>
            {favorites.length === 0 ? (
              <div className="text-center py-12">
                <Heart className="w-16 h-16 text-[#2a2a2a] mx-auto mb-4" />
                <h2 className="text-lg font-bold mb-2">Nenhum favorito</h2>
                <p className="text-[#888] text-sm mb-6">Salve seus produtos favoritos para encontrá-los facilmente</p>
                <Link to={createPageUrl('Shop')}>
                  <NeonButton>Ver Produtos</NeonButton>
                </Link>
              </div>
            ) : (
              <Link to={createPageUrl('Favorites')}>
                <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] flex items-center justify-between hover:border-[#00FF85]/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Heart className="w-5 h-5 text-[#00FF85]" />
                    <span>Ver todos os favoritos</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[#888]">{favorites.length} itens</span>
                    <ChevronRight className="w-5 h-5 text-[#888]" />
                  </div>
                </div>
              </Link>
            )}
          </div>
        )}

        {/* Data Tab */}
        {activeTab === 'data' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold">Informações Pessoais</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-2 hover:bg-[#1a1a1a] rounded-lg transition-colors text-[#00FF85]"
                >
                  <Edit2 className="w-5 h-5" />
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsEditing(false)}
                    className="p-2 hover:bg-red-500/20 rounded-lg transition-colors text-red-500"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => updateUserMutation.mutate(userData)}
                    disabled={updateUserMutation.isPending}
                    className="p-2 hover:bg-[#00FF85]/20 rounded-lg transition-colors text-[#00FF85]"
                  >
                    <Check className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] space-y-4">
              <div>
                <Label className="text-sm text-[#888]">Nome completo</Label>
                {isEditing ? (
                  <Input
                    value={userData.full_name}
                    onChange={(e) => setUserData({ ...userData, full_name: e.target.value })}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  />
                ) : (
                  <p className="font-medium mt-1">{userData.full_name || '-'}</p>
                )}
              </div>
              <div>
                <Label className="text-sm text-[#888]">E-mail</Label>
                <p className="font-medium mt-1">{user?.email}</p>
              </div>
              <div>
                <Label className="text-sm text-[#888]">Telefone</Label>
                {isEditing ? (
                  <Input
                    value={userData.phone}
                    onChange={(e) => setUserData({ ...userData, phone: e.target.value })}
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                    placeholder="(00) 00000-0000"
                  />
                ) : (
                  <p className="font-medium mt-1">{userData.phone || '-'}</p>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#00FF85]" />
                Endereço
              </h3>
              <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] space-y-4">
                {isEditing ? (
                  <>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label className="text-sm text-[#888]">CEP</Label>
                        <Input
                          value={userData.address.zip_code}
                          onChange={(e) => setUserData({
                            ...userData,
                            address: { ...userData.address, zip_code: e.target.value }
                          })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label className="text-sm text-[#888]">Rua</Label>
                        <Input
                          value={userData.address.street}
                          onChange={(e) => setUserData({
                            ...userData,
                            address: { ...userData.address, street: e.target.value }
                          })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-[#888]">Número</Label>
                        <Input
                          value={userData.address.number}
                          onChange={(e) => setUserData({
                            ...userData,
                            address: { ...userData.address, number: e.target.value }
                          })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm text-[#888]">Complemento</Label>
                      <Input
                        value={userData.address.complement}
                        onChange={(e) => setUserData({
                          ...userData,
                          address: { ...userData.address, complement: e.target.value }
                        })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                      />
                    </div>
                    <div>
                      <Label className="text-sm text-[#888]">Bairro</Label>
                      <Input
                        value={userData.address.neighborhood}
                        onChange={(e) => setUserData({
                          ...userData,
                          address: { ...userData.address, neighborhood: e.target.value }
                        })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="col-span-2">
                        <Label className="text-sm text-[#888]">Cidade</Label>
                        <Input
                          value={userData.address.city}
                          onChange={(e) => setUserData({
                            ...userData,
                            address: { ...userData.address, city: e.target.value }
                          })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                        />
                      </div>
                      <div>
                        <Label className="text-sm text-[#888]">Estado</Label>
                        <Input
                          value={userData.address.state}
                          onChange={(e) => setUserData({
                            ...userData,
                            address: { ...userData.address, state: e.target.value }
                          })}
                          className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                        />
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-sm">
                    {userData.address.street ? (
                      <>
                        <p>{userData.address.street}, {userData.address.number}</p>
                        {userData.address.complement && <p>{userData.address.complement}</p>}
                        <p>{userData.address.neighborhood}</p>
                        <p>{userData.address.city} - {userData.address.state}</p>
                        <p>CEP: {userData.address.zip_code}</p>
                      </>
                    ) : (
                      <p className="text-[#888]">Nenhum endereço cadastrado</p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-bold mb-3 flex items-center gap-2">
                <Settings className="w-4 h-4 text-[#00FF85]" />
                Seguranca
              </h3>
              <form
                onSubmit={handleChangePassword}
                className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a] space-y-4"
              >
                <div>
                  <Label className="text-sm text-[#888]">Senha atual</Label>
                  <Input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                    }
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                  />
                </div>
                <div>
                  <Label className="text-sm text-[#888]">Nova senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                    }
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                    placeholder="Minimo 6 caracteres"
                  />
                </div>
                <div>
                  <Label className="text-sm text-[#888]">Confirmar nova senha</Label>
                  <Input
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                    }
                    className="bg-[#1a1a1a] border-[#2a2a2a] text-white focus:border-[#00FF85]/50 mt-1"
                    placeholder="Repita a nova senha"
                  />
                </div>

                {(passwordError || passwordMessage) && (
                  <div
                    className={`rounded-lg p-3 text-xs ${
                      passwordMessage
                        ? 'bg-[#00FF85]/10 border border-[#00FF85]/20 text-[#00FF85]'
                        : 'bg-red-500/10 border border-red-500/20 text-red-400'
                    }`}
                  >
                    {passwordMessage || passwordError}
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-10 rounded-lg bg-[#00FF85] text-black font-semibold hover:bg-[#00FF85]/90"
                >
                  Alterar senha
                </button>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
