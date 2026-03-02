import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { cuponsAPI } from '@/lib/api';
import { ArrowLeft, Plus, Edit, Trash2, Tag, Copy } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from 'sonner';
import { format } from 'date-fns';

export default function AdminCoupons() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [showDialog, setShowDialog] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && !isAdmin()) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Carrega cupons da API
  useEffect(() => {
    const loadCoupons = async () => {
      try {
        setLoading(true);
        const data = await cuponsAPI.listar();
        setCoupons(data);
      } catch (error) {
        toast.error('Erro ao carregar cupons: ' + error.message);
        setCoupons([]);
      } finally {
        setLoading(false);
      }
    };

    loadCoupons();
  }, []);

  const [formData, setFormData] = useState({
    code: '',
    discount_percent: '',
    discount_fixed: '',
    min_purchase: '',
    max_uses: -1,
    valid_from: '',
    valid_until: '',
    active: true,
  });

  const handleEdit = (coupon) => {
    setEditingCoupon(coupon);
    setFormData({
      code: coupon.code,
      discount_percent: coupon.discount_percent || '',
      discount_fixed: coupon.discount_fixed || '',
      min_purchase: coupon.min_purchase || '',
      max_uses: coupon.max_uses || -1,
      valid_from: coupon.valid_from || '',
      valid_until: coupon.valid_until || '',
      active: coupon.active !== false,
    });
    setShowDialog(true);
  };

  const handleSubmit = async () => {
    if (!formData.code.trim()) {
      toast.error('Digite o código do cupom');
      return;
    }
    if (!formData.discount_percent && !formData.discount_fixed) {
      toast.error('Configure um desconto percentual ou fixo');
      return;
    }
    
    setSaving(true);
    try {
      const couponData = {
        codigo: formData.code.toUpperCase().trim(),
        desconto_percentual: formData.discount_percent ? parseFloat(formData.discount_percent) : null,
        desconto_fixo: formData.discount_fixed ? parseFloat(formData.discount_fixed) : null,
        compra_minima: formData.min_purchase ? parseFloat(formData.min_purchase) : 0,
        max_usos: formData.max_uses ? parseInt(formData.max_uses) : -1,
        valido_de: formData.valid_from || null,
        valido_ate: formData.valid_until || null,
        ativo: formData.active ? 1 : 0,
      };

      if (editingCoupon) {
        await cuponsAPI.atualizar(editingCoupon.id, couponData);
        // Atualizar na lista local
        setCoupons(coupons.map(c => c.id === editingCoupon.id ? { ...editingCoupon, ...couponData } : c));
        toast.success('Cupom atualizado!');
      } else {
        await cuponsAPI.criar(couponData);
        // Recarregar cupons
        const data = await cuponsAPI.listar();
        setCoupons(data);
        toast.success('Cupom criado!');
      }

      setShowDialog(false);
      setEditingCoupon(null);
      setFormData({
        code: '',
        discount_percent: '',
        discount_fixed: '',
        min_purchase: '',
        max_uses: -1,
        valid_from: '',
        valid_until: '',
        active: true,
      });
    } catch (error) {
      toast.error('Erro ao salvar cupom: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCoupon = async (id) => {
    try {
      setDeleting(true);
      await cuponsAPI.deletar(id);
      setCoupons(coupons.filter(c => c.id !== id));
      toast.success('Cupom deletado!');
    } catch (error) {
      toast.error('Erro ao deletar cupom: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const copyCouponCode = (code) => {
    navigator.clipboard.writeText(code);
    toast.success('Código copiado!');
  };

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/AdminDashboard')}
                className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Cupons de Desconto</h1>
            </div>
            <Dialog open={showDialog} onOpenChange={setShowDialog}>
              <DialogTrigger asChild>
                <Button 
                  className="bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold"
                  onClick={() => {
                    setEditingCoupon(null);
                    setFormData({
                      code: '',
                      discount_percent: '',
                      discount_fixed: '',
                      min_purchase: '',
                      max_uses: -1,
                      valid_from: '',
                      valid_until: '',
                      active: true,
                    });
                  }}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Novo Cupom
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-[#141414] border-[#2a2a2a] max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingCoupon ? 'Editar Cupom' : 'Novo Cupom'}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                  <div>
                    <Label className="text-white">Código do Cupom</Label>
                    <Input
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="Ex: BEMVINDO10"
                      className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2 uppercase"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Desconto (%)</Label>
                      <Input
                        type="number"
                        value={formData.discount_percent}
                        onChange={(e) => setFormData({ ...formData, discount_percent: e.target.value })}
                        placeholder="Ex: 10"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Desconto Fixo (R$)</Label>
                      <Input
                        type="number"
                        value={formData.discount_fixed}
                        onChange={(e) => setFormData({ ...formData, discount_fixed: e.target.value })}
                        placeholder="Ex: 50"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Compra Mínima (R$)</Label>
                      <Input
                        type="number"
                        value={formData.min_purchase}
                        onChange={(e) => setFormData({ ...formData, min_purchase: e.target.value })}
                        placeholder="Ex: 100"
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Máximo de Usos (-1 = ilimitado)</Label>
                      <Input
                        type="number"
                        value={formData.max_uses}
                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-white">Válido De</Label>
                      <Input
                        type="date"
                        value={formData.valid_from}
                        onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-white">Válido Até</Label>
                      <Input
                        type="date"
                        value={formData.valid_until}
                        onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                        className="bg-[#1a1a1a] border-[#2a2a2a] text-white mt-2"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Switch
                      checked={formData.active}
                      onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                    />
                    <Label className="text-white">Cupom Ativo</Label>
                  </div>

                  <Button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold disabled:opacity-50"
                  >
                    {saving ? 'Salvando...' : (editingCoupon ? 'Atualizar' : 'Criar Cupom')}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2a2a2a] border-t-[#00FF85] mx-auto mb-4"></div>
              <p className="text-[#666]">Carregando cupons...</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {coupons.length === 0 ? (
              <Card className="bg-[#141414] border-[#2a2a2a]">
                <CardContent className="py-12 text-center">
                  <Tag className="w-16 h-16 text-[#2a2a2a] mx-auto mb-4" />
                  <p className="text-[#888]">Nenhum cupom criado ainda</p>
                </CardContent>
              </Card>
            ) : (
              coupons.map((coupon) => (
                <Card key={coupon.id} className="bg-[#141414] border-[#2a2a2a]">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <code className="text-2xl font-bold text-[#00FF85] bg-[#00FF85]/10 px-4 py-2 rounded-lg">
                            {coupon.codigo}
                          </code>
                          <button
                            onClick={() => copyCouponCode(coupon.codigo)}
                            className="p-2 hover:bg-[#00FF85]/20 rounded-lg transition-colors"
                          >
                            <Copy className="w-4 h-4 text-[#00FF85]" />
                          </button>
                          {coupon.ativo === 0 && (
                            <span className="px-3 py-1 bg-red-500/20 text-red-500 text-xs rounded-full">
                              Inativo
                            </span>
                          )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mt-4">
                          <div>
                            <p className="text-[#666]">Desconto</p>
                            <p className="text-white font-semibold">
                              {coupon.desconto_percentual ? `${coupon.desconto_percentual}%` : `R$ ${coupon.desconto_fixo}`}
                            </p>
                          </div>
                          {coupon.compra_minima && coupon.compra_minima > 0 && (
                            <div>
                              <p className="text-[#666]">Compra Mínima</p>
                              <p className="text-white font-semibold">R$ {parseFloat(coupon.compra_minima).toFixed(2)}</p>
                            </div>
                          )}
                          <div>
                            <p className="text-[#666]">Usos</p>
                            <p className="text-white font-semibold">
                              {coupon.usos_atuais || 0} / {coupon.max_usos === -1 ? '∞' : coupon.max_usos}
                            </p>
                          </div>
                          {coupon.valido_ate && (
                            <div>
                              <p className="text-[#666]">Válido Até</p>
                              <p className="text-white font-semibold">
                                {format(new Date(coupon.valido_ate), 'dd/MM/yyyy')}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          className="border-[#2a2a2a] hover:bg-[#1a1a1a]"
                          onClick={() => handleEdit(coupon)}
                          disabled={deleting}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          className="border-red-500/50 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                          onClick={() => handleDeleteCoupon(coupon.id)}
                          disabled={deleting}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
