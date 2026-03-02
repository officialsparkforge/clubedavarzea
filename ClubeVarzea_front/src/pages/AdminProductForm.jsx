import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { produtosAPI, timesAPI } from '@/lib/api';
import { ArrowLeft, Upload, X, Loader2, GripVertical, ImagePlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { toast } from 'sonner';

export default function AdminProductForm() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [uploading, setUploading] = useState(false);

  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get('id');
  const isEdit = !!productId;

  useEffect(() => {
    if (user && !isAdmin()) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  const [formData, setFormData] = useState({
    id: productId || '',
    name: '',
    team: '',
    category: 'brasileirao',
    season: '2024/25',
    version: 'torcedor',
    price: '',
    original_price: '',
    image_url: '',
    images: [],
    sizes: ['P', 'M', 'G', 'GG'],
    description: '',
    composition: 'Poliéster',
    is_featured: false,
    is_new: false,
    stock: 10,
  });
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(false);

  // Carregar times e produto para edição
  useEffect(() => {
    const loadData = async () => {
      try {
        const timesData = await timesAPI.listar();
        setTeams(timesData);

        if (isEdit && productId) {
          const products = await produtosAPI.listar();
          const product = products.find(p => p.id === productId);
          if (product) {
            // Migrar image_url para images array se necessário
            let images = [];
            if (product.images) {
              images = typeof product.images === 'string' ? JSON.parse(product.images) : product.images;
            } else if (product.image_url) {
              images = [product.image_url];
            }
            
            setFormData({
              id: product.id,
              name: product.nome,
              team: product.team,
              category: product.categoria_id,
              season: product.season,
              version: product.versao,
              price: product.preco,
              original_price: product.preco_original,
              image_url: product.image_url || '',
              images: images,
              sizes: JSON.parse(product.tamanhos || '[]'),
              description: product.descricao,
              composition: product.composicao,
              is_featured: Boolean(product.is_featured),
              is_new: Boolean(product.is_new),
              stock: product.estoque,
            });
          }
        }
      } catch (error) {
        toast.error('Erro ao carregar dados: ' + error.message);
      }
    };
    loadData();
  }, [isEdit, productId]);

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    try {
      const newImages = [];
      
      for (const file of files) {
        const reader = new FileReader();
        const result = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target?.result);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
        newImages.push(result);
      }
      
      setFormData(prev => ({
        ...prev,
        images: [...prev.images, ...newImages],
        image_url: prev.images.length === 0 && newImages.length > 0 ? newImages[0] : prev.image_url
      }));
      
      toast.success(`${newImages.length} imagem(ns) carregada(s) com sucesso!`);
    } catch (error) {
      toast.error('Erro ao fazer upload das imagens');
    } finally {
      setUploading(false);
    }
  };
  
  const handleRemoveImage = (index) => {
    setFormData(prev => {
      const newImages = prev.images.filter((_, i) => i !== index);
      return {
        ...prev,
        images: newImages,
        image_url: newImages.length > 0 ? newImages[0] : ''
      };
    });
    toast.success('Imagem removida');
  };
  
  const handleMoveImage = (fromIndex, toIndex) => {
    setFormData(prev => {
      const newImages = [...prev.images];
      const [movedImage] = newImages.splice(fromIndex, 1);
      newImages.splice(toIndex, 0, movedImage);
      return {
        ...prev,
        images: newImages,
        image_url: newImages.length > 0 ? newImages[0] : ''
      };
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast.error('Digite o nome do produto');
      return;
    }
    if (!formData.price) {
      toast.error('Digite o preço');
      return;
    }
    if (!formData.team.trim()) {
      toast.error('Selecione um time');
      return;
    }

    setLoading(true);
    try {
      const productData = {
        nome: formData.name,
        team: formData.team,
        categoria_id: formData.category,
        season: formData.season,
        versao: formData.version,
        preco: parseFloat(formData.price),
        preco_original: formData.original_price ? parseFloat(formData.original_price) : null,
        image_url: formData.images.length > 0 ? formData.images[0] : formData.image_url,
        images: JSON.stringify(formData.images),
        tamanhos: JSON.stringify(formData.sizes),
        descricao: formData.description,
        composicao: formData.composition,
        is_featured: formData.is_featured ? 1 : 0,
        is_new: formData.is_new ? 1 : 0,
        estoque: parseInt(formData.stock),
      };

      if (isEdit) {
        // Atualizar produto existente
        await produtosAPI.atualizar(formData.id, productData);
        toast.success('Produto atualizado com sucesso!');
      } else {
        // Criar novo produto
        await produtosAPI.criar(productData);
        toast.success('Produto criado com sucesso!');
      }
      
      setTimeout(() => navigate('/AdminProducts'), 1500);
    } catch (error) {
      toast.error('Erro ao salvar produto: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const uniqueTeams = teams.map((team) => (typeof team === 'string' ? team : team.nome));

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {/* Header */}
      <div className="bg-[#141414] border-b border-[#2a2a2a] sticky top-0 z-40">
        <div className="max-w-4xl mx-auto px-6 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/AdminProducts')}
              className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold">{isEdit ? 'Editar Produto' : 'Novo Produto'}</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Multiple Images Upload */}
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6">
            <div className="flex items-center justify-between mb-4">
              <Label className="text-white">Imagens do Produto</Label>
              <span className="text-xs text-[#888]">{formData.images.length} imagem(ns)</span>
            </div>
            
            {/* Grid de imagens */}
            {formData.images.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 mb-4">
                {formData.images.map((image, index) => (
                  <div 
                    key={index} 
                    className="relative aspect-square bg-[#1a1a1a] rounded-lg overflow-hidden group border-2 border-transparent hover:border-[#00FF85] transition-colors"
                  >
                    {index === 0 && (
                      <span className="absolute top-2 left-2 z-10 px-2 py-1 bg-[#00FF85] text-black text-xs font-bold rounded">
                        PRINCIPAL
                      </span>
                    )}
                    <img 
                      src={image} 
                      alt={`Preview ${index + 1}`} 
                      className="w-full h-full object-contain" 
                    />
                    <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                      <div className="flex gap-2">
                        {index > 0 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, index - 1)}
                            className="p-2 bg-[#00FF85] text-black rounded hover:bg-[#00FF85]/80"
                            title="Mover para esquerda"
                          >
                            ←
                          </button>
                        )}
                        {index < formData.images.length - 1 && (
                          <button
                            type="button"
                            onClick={() => handleMoveImage(index, index + 1)}
                            className="p-2 bg-[#00FF85] text-black rounded hover:bg-[#00FF85]/80"
                            title="Mover para direita"
                          >
                            →
                          </button>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(index)}
                        className="p-2 bg-red-500 rounded hover:bg-red-600"
                        title="Remover imagem"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Upload button */}
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                multiple
                onChange={handleImageUpload}
                className="hidden"
                id="image-upload"
                disabled={uploading}
              />
              <label
                htmlFor="image-upload"
                className="flex flex-col items-center justify-center w-full p-8 border-2 border-dashed border-[#2a2a2a] rounded-lg cursor-pointer hover:border-[#00FF85]/50 transition-colors"
              >
                {uploading ? (
                  <Loader2 className="w-8 h-8 text-[#00FF85] animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="w-8 h-8 text-[#666] mb-2" />
                    <p className="text-[#888] text-sm">Clique para adicionar imagens</p>
                    <p className="text-[#666] text-xs mt-1">Você pode selecionar múltiplas imagens</p>
                  </>
                )}
              </label>
            </div>
          </div>

          {/* Basic Info */}
          <div className="bg-[#141414] rounded-lg border border-[#2a2a2a] p-6 space-y-4">
            <div>
              <Label htmlFor="name" className="text-white">Nome do Produto</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                required
              />
            </div>

            <div>
              <Label htmlFor="team" className="text-white">Time</Label>
              <Select 
                value={formData.team} 
                onValueChange={(value) => {
                  if (value === '__new__') {
                    const newTeam = prompt('Digite o nome do time:');
                    if (newTeam) setFormData({ ...formData, team: newTeam });
                  } else {
                    setFormData({ ...formData, team: value });
                  }
                }}
              >
                <SelectTrigger className="bg-white border-[#2a2a2a] text-black">
                  <SelectValue placeholder="Selecione um time" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#2a2a2a] text-black">
                  {uniqueTeams.map(team => (
                    <SelectItem key={team} value={team} className="text-black">{team}</SelectItem>
                  ))}
                  <SelectItem value="__new__" className="text-[#00FF85] font-bold">+ Adicionar novo time</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category" className="text-white">Categoria</Label>
                <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                  <SelectTrigger className="bg-white border-[#2a2a2a] text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#2a2a2a]">
                    <SelectItem value="brasileirao" className="text-black">Brasileirão</SelectItem>
                    <SelectItem value="europeus" className="text-black">Europeus</SelectItem>
                    <SelectItem value="selecoes" className="text-black">Seleções</SelectItem>
                    <SelectItem value="raros" className="text-black">Raros</SelectItem>
                    <SelectItem value="personalizadas" className="text-black">Personalizadas</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="version" className="text-white">Versão</Label>
                <Select value={formData.version} onValueChange={(value) => setFormData({ ...formData, version: value })}>
                  <SelectTrigger className="bg-white border-[#2a2a2a] text-black">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-white border-[#2a2a2a]">
                    <SelectItem value="torcedor" className="text-black">Torcedor</SelectItem>
                    <SelectItem value="jogador" className="text-black">Jogador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price" className="text-white">Preço (R$)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                  required
                />
              </div>

              <div>
                <Label htmlFor="original_price" className="text-white">Preço Original (opcional)</Label>
                <Input
                  id="original_price"
                  type="number"
                  step="0.01"
                  value={formData.original_price}
                  onChange={(e) => setFormData({ ...formData, original_price: e.target.value })}
                  className="bg-[#1a1a1a] border-[#2a2a2a] text-white"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-white">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-[#1a1a1a] border-[#2a2a2a] text-white h-24"
              />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_featured}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
                />
                <Label className="text-white">Destaque</Label>
              </div>

              <div className="flex items-center gap-2">
                <Switch
                  checked={formData.is_new}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_new: checked })}
                />
                <Label className="text-white">Novo</Label>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => navigate('/AdminProducts')}
              className="flex-1 border-[#2a2a2a] hover:bg-[#1a1a1a]"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold disabled:opacity-50"
            >
              {loading ? 'Salvando...' : (isEdit ? 'Salvar Alterações' : 'Criar Produto')}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
