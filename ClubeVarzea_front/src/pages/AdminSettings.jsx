import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { timesAPI, categoriasAPI, cuponsAPI } from '@/lib/api';
import { ArrowLeft, Plus, X, Edit, Trash2, Tag } from 'lucide-react';
// Não usando React Query para esta página
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from 'sonner';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // Redirecionar se não for admin
  useEffect(() => {
    if (user && !isAdmin()) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Estados para Times
  const [teams, setTeams] = useState([]);
  const [loadingTeams, setLoadingTeams] = useState(true);
  const [newTeam, setNewTeam] = useState('');
  const [newTeamCategoryId, setNewTeamCategoryId] = useState('');
  const [teamCategoryFilter, setTeamCategoryFilter] = useState('');
  const [showTeamDialog, setShowTeamDialog] = useState(false);
  const [savingTeam, setSavingTeam] = useState(false);
  
  // Estados para Categorias
  const [categories, setCategories] = useState([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [newCategory, setNewCategory] = useState({ id: '', label: '' });
  const [showCategoryDialog, setShowCategoryDialog] = useState(false);
  const [savingCategory, setSavingCategory] = useState(false);
  
  // Estados para Cupons
  const [coupons, setCoupons] = useState([]);
  const [loadingCoupons, setLoadingCoupons] = useState(true);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount_percent: '', discount_fixed: '', active: true });
  const [showCouponDialog, setShowCouponDialog] = useState(false);
  const [savingCoupon, setSavingCoupon] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Carrega dados da API ao montar
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingTeams(true);
        const teamsData = await timesAPI.listar();
        setTeams(teamsData);
      } catch (error) {
        toast.error('Erro ao carregar times: ' + error.message);
      } finally {
        setLoadingTeams(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCategories(true);
        const categoriesData = await categoriasAPI.listar();
        setCategories(categoriesData);
      } catch (error) {
        toast.error('Erro ao carregar categorias: ' + error.message);
      } finally {
        setLoadingCategories(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoadingCoupons(true);
        const couponsData = await cuponsAPI.listar();
        setCoupons(couponsData);
      } catch (error) {
        toast.error('Erro ao carregar cupons: ' + error.message);
      } finally {
        setLoadingCoupons(false);
      }
    };
    loadData();
  }, []);

  const handleAddTeam = async () => {
    if (!newTeam.trim()) {
      toast.error('Digite o nome do time');
      return;
    }
    if (!newTeamCategoryId) {
      toast.error('Selecione uma categoria');
      return;
    }
    if (teams.some(t => t.nome === newTeam.trim())) {
      toast.error('Este time já existe');
      return;
    }
    
    setSavingTeam(true);
    try {
      await timesAPI.criar(newTeam.trim(), newTeamCategoryId);
      const teamsData = await timesAPI.listar();
      setTeams(teamsData);
      setNewTeam('');
      setNewTeamCategoryId('');
      setShowTeamDialog(false);
      toast.success('Time adicionado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar time: ' + error.message);
    } finally {
      setSavingTeam(false);
    }
  };

  const handleRemoveTeam = async (teamName) => {
    try {
      setDeleting(true);
      await timesAPI.deletar(teamName);
      setTeams(teams.filter(t => t.nome !== teamName));
      toast.success('Time removido com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover time: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleAddCategory = async () => {
    if (!newCategory.id.trim() || !newCategory.label.trim()) {
      toast.error('Preencha todos os campos');
      return;
    }
    if (categories.some(c => c.id === newCategory.id)) {
      toast.error('Esta categoria já existe');
      return;
    }
    
    setSavingCategory(true);
    try {
      await categoriasAPI.criar(newCategory.id.trim().toLowerCase(), newCategory.label.trim());
      const categoriesData = await categoriasAPI.listar();
      setCategories(categoriesData);
      setNewCategory({ id: '', label: '' });
      setShowCategoryDialog(false);
      toast.success('Categoria adicionada com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar categoria: ' + error.message);
    } finally {
      setSavingCategory(false);
    }
  };

  const handleRemoveCategory = async (id) => {
    try {
      setDeleting(true);
      await categoriasAPI.deletar(id);
      setCategories(categories.filter(c => c.id !== id));
      toast.success('Categoria removida com sucesso!');
    } catch (error) {
      toast.error('Erro ao remover categoria: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  // Cupons - usando API
  const handleAddCoupon = async () => {
    if (!newCoupon.code.trim()) {
      toast.error('Digite o código do cupom');
      return;
    }
    if (!newCoupon.discount_percent && !newCoupon.discount_fixed) {
      toast.error('Defina um desconto');
      return;
    }
    
    setSavingCoupon(true);
    try {
      const couponData = {
        codigo: newCoupon.code.toUpperCase().trim(),
        desconto_percentual: newCoupon.discount_percent ? parseFloat(newCoupon.discount_percent) : null,
        desconto_fixo: newCoupon.discount_fixed ? parseFloat(newCoupon.discount_fixed) : null,
        ativo: newCoupon.active ? 1 : 0,
      };
      await cuponsAPI.criar(couponData);
      const couponsData = await cuponsAPI.listar();
      setCoupons(couponsData);
      setShowCouponDialog(false);
      setNewCoupon({ code: '', discount_percent: '', discount_fixed: '', active: true });
      toast.success('Cupom criado com sucesso!');
    } catch (error) {
      toast.error('Erro ao adicionar cupom: ' + error.message);
    } finally {
      setSavingCoupon(false);
    }
  };

  const handleToggleCoupon = async (id, currentStatus) => {
    try {
      setDeleting(true);
      await cuponsAPI.atualizar(id, { ativo: currentStatus === 1 ? 0 : 1 });
      setCoupons(coupons.map(c => c.id === id ? { ...c, ativo: currentStatus === 1 ? 0 : 1 } : c));
      toast.success('Cupom atualizado!');
    } catch (error) {
      toast.error('Erro ao atualizar cupom: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      setDeleting(true);
      await cuponsAPI.deletar(id);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Cupom removido!');
    } catch (error) {
      toast.error('Erro ao remover cupom: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const categoryById = categories.reduce((acc, category) => {
    acc[category.id] = category;
    return acc;
  }, {});

  const filteredTeams = teamCategoryFilter
    ? teams.filter((team) => team.categoria_id === teamCategoryFilter)
    : teams;

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/AdminDashboard')}
              className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">Configurações</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Gerenciar Categorias */}
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Categorias</CardTitle>
            <Dialog open={showCategoryDialog} onOpenChange={setShowCategoryDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Categoria
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141414] border-[#2a2a2a]">
                <DialogHeader>
                  <DialogTitle className="text-white">Nova Categoria</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white">ID da Categoria</Label>
                    <Input
                      value={newCategory.id}
                      onChange={(e) => setNewCategory({ ...newCategory, id: e.target.value.toLowerCase().replace(/\s/g, '_') })}
                      placeholder="Ex: internacionais"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                    />
                    <p className="text-xs text-[#666] mt-1">Use apenas letras minúsculas e underscores</p>
                  </div>
                  <div>
                    <Label className="text-white">Nome da Categoria</Label>
                    <Input
                      value={newCategory.label}
                      onChange={(e) => setNewCategory({ ...newCategory, label: e.target.value })}
                      placeholder="Ex: Internacionais"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                    />
                  </div>
                  <Button
                    onClick={handleAddCategory}
                    disabled={savingCategory}
                    className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold disabled:opacity-50"
                  >
                    {savingCategory ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {loadingCategories ? (
                <div className="text-center py-4 text-[#666]">Carregando categorias...</div>
              ) : (
                categories.map((category) => (
                  <div
                    key={category.id}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] flex items-center justify-between"
                  >
                    <div>
                      <p className="text-white font-medium">{category.label}</p>
                      <p className="text-xs text-[#666]">ID: {category.id}</p>
                    </div>
                    <button
                      onClick={() => handleRemoveCategory(category.id)}
                      className="p-2 hover:bg-red-500/20 rounded text-red-500 transition-colors disabled:opacity-50"
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gerenciar Times */}
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white">Times</CardTitle>
            <Dialog open={showTeamDialog} onOpenChange={setShowTeamDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Time
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141414] border-[#2a2a2a]">
                <DialogHeader>
                  <DialogTitle className="text-white">Novo Time</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white">Nome do Time</Label>
                    <Input
                      value={newTeam}
                      onChange={(e) => setNewTeam(e.target.value)}
                      placeholder="Ex: Internacional"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      onKeyPress={(e) => e.key === 'Enter' && handleAddTeam()}
                    />
                  </div>
                  <div>
                    <Label className="text-white">Categoria do Time</Label>
                    <select
                      value={newTeamCategoryId}
                      onChange={(e) => setNewTeamCategoryId(e.target.value)}
                      className="bg-[#1a1a1a] border border-[#2a2a2a] text-white mt-2 w-full rounded-md h-10 px-3"
                      disabled={loadingCategories}
                    >
                      <option value="">Selecione a categoria</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <Button
                    onClick={handleAddTeam}
                    disabled={savingTeam}
                    className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold disabled:opacity-50"
                  >
                    {savingTeam ? 'Adicionando...' : 'Adicionar'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-2 pb-4 sm:flex-row sm:items-center sm:justify-between">
              <Label className="text-white">Filtrar por categoria</Label>
              <select
                value={teamCategoryFilter}
                onChange={(e) => setTeamCategoryFilter(e.target.value)}
                className="bg-[#1a1a1a] border border-[#2a2a2a] text-white w-full rounded-md h-10 px-3 sm:max-w-[280px]"
                disabled={loadingCategories}
              >
                <option value="">Todas</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
              {loadingTeams ? (
                <div className="col-span-full text-center py-4 text-[#666]">Carregando times...</div>
              ) : (
                filteredTeams.map((team) => (
                  <div
                    key={team.id}
                    className="bg-[#1a1a1a] rounded-lg p-3 border border-[#2a2a2a] flex items-center justify-between"
                  >
                    <div>
                      <span className="text-white text-sm">{team.nome}</span>
                      <p className="text-xs text-[#666]">
                        {categoryById[team.categoria_id]?.label || 'Sem categoria'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveTeam(team.nome)}
                      className="p-1 hover:bg-red-500/20 rounded text-red-500 transition-colors disabled:opacity-50"
                      disabled={deleting}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Gerenciar Cupons */}
        <Card className="bg-[#141414] border-[#2a2a2a]">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-white flex items-center gap-2">
              <Tag className="w-5 h-5 text-[#00FF85]" />
              Cupons de Desconto
            </CardTitle>
            <Dialog open={showCouponDialog} onOpenChange={setShowCouponDialog}>
              <DialogTrigger asChild>
                <Button className="bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold">
                  <Plus className="w-4 h-4 mr-2" />
                  Criar Cupom
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141414] border-[#2a2a2a]">
                <DialogHeader>
                  <DialogTitle className="text-white">Novo Cupom</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white">Código do Cupom *</Label>
                    <Input
                      value={newCoupon.code}
                      onChange={(e) => setNewCoupon({ ...newCoupon, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: VERAO2024"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Desconto % (opcional)</Label>
                      <Input
                        type="number"
                        value={newCoupon.discount_percent}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_percent: e.target.value })}
                        placeholder="10"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Desconto R$ (opcional)</Label>
                      <Input
                        type="number"
                        value={newCoupon.discount_fixed}
                        onChange={(e) => setNewCoupon({ ...newCoupon, discount_fixed: e.target.value })}
                        placeholder="50.00"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                  </div>
                  <Button
                    onClick={handleAddCoupon}
                    disabled={savingCoupon}
                    className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold disabled:opacity-50"
                  >
                    {savingCoupon ? 'Criando...' : 'Criar Cupom'}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {loadingCoupons ? (
              <div className="text-center py-8 text-[#666]">Carregando cupons...</div>
            ) : coupons.length === 0 ? (
              <p className="text-[#666] text-center py-8">Nenhum cupom criado ainda</p>
            ) : (
              <div className="space-y-2">
                {coupons.map((coupon) => (
                  <div
                    key={coupon.id}
                    className="bg-[#1a1a1a] rounded-lg p-4 border border-[#2a2a2a] flex items-center justify-between"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <p className="text-white font-bold text-lg">{coupon.codigo}</p>
                        <span className={`px-2 py-1 rounded-full text-xs ${coupon.ativo === 1 ? 'bg-[#00FF85]/20 text-[#00FF85]' : 'bg-[#666]/20 text-[#666]'}`}>
                          {coupon.ativo === 1 ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="text-sm text-[#888] mt-1">
                        {coupon.desconto_percentual ? `${coupon.desconto_percentual}% de desconto` : `R$ ${parseFloat(coupon.desconto_fixo).toFixed(2)} de desconto`}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <Switch
                        checked={coupon.ativo === 1}
                        onCheckedChange={() => handleToggleCoupon(coupon.id, coupon.ativo)}
                        className="data-[state=checked]:bg-[#00FF85]"
                        disabled={deleting}
                      />
                      <button
                        onClick={() => handleDeleteCoupon(coupon.id)}
                        className="p-2 hover:bg-red-500/20 rounded text-red-500 transition-colors disabled:opacity-50"
                        disabled={deleting}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
          <p className="text-green-500 text-sm">
            ✅ <strong>Integrado com MySQL:</strong> Times, categorias e cupons agora são salvos e recuperados do banco de dados em tempo real!
          </p>
        </div>
      </div>
    </div>
  );
}
