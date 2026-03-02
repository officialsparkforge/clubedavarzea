import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { produtosAPI } from '@/lib/api';
import { Plus, Edit, Trash2, ArrowLeft, Search } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function AdminProducts() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const [search, setSearch] = useState('');
  const [deleteId, setDeleteId] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (user && !isAdmin()) {
      navigate('/');
    } else if (!user) {
      navigate('/login');
    }
  }, [user, isAdmin, navigate]);

  // Carrega produtos da API ao montar
  useEffect(() => {
    const loadProducts = async () => {
      try {
        setLoading(true);
        const data = await produtosAPI.listar();
        setProducts(data);
      } catch (error) {
        toast.error('Erro ao carregar produtos: ' + error.message);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    loadProducts();
  }, []);

  const handleDeleteProduct = async (id) => {
    try {
      setDeleting(true);
      await produtosAPI.deletar(id);
      setProducts(products.filter(p => p.id !== id));
      setDeleteId(null);
      toast.success('Produto deletado com sucesso!');
    } catch (error) {
      toast.error('Erro ao deletar produto: ' + error.message);
    } finally {
      setDeleting(false);
    }
  };

  const filteredProducts = products.filter(p =>
    p.nome.toLowerCase().includes(search.toLowerCase()) ||
    p.team.toLowerCase().includes(search.toLowerCase())
  );

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
              <h1 className="text-2xl font-bold">Gerenciar Produtos</h1>
            </div>
            <Link to="/AdminProductForm" className="flex items-center gap-2 bg-[#00FF85] text-black px-4 py-2 rounded-lg hover:bg-[#00dd6d] transition-colors font-medium">
              <Plus className="w-5 h-5" />
              Novo Produto
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#666]" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-[#141414] border-[#2a2a2a] text-white"
          />
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-2 border-[#2a2a2a] border-t-[#00FF85] mx-auto mb-4"></div>
              <p className="text-[#666]">Carregando produtos...</p>
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-[#666]">{search ? 'Nenhum produto encontrado' : 'Nenhum produto cadastrado'}</p>
          </div>
        ) : (
          /* Products Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProducts.map(product => (
              <div key={product.id} className="bg-[#141414] rounded-lg border border-[#2a2a2a] overflow-hidden">
                <div className="aspect-square bg-[#1a1a1a] flex items-center justify-center p-4">
                  <img
                    src={product.image_url}
                    alt={product.nome}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="p-4">
                  <p className="text-[#888] text-xs uppercase">{product.team}</p>
                  <h3 className="text-white font-semibold mt-1 line-clamp-2">{product.nome}</h3>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[#00FF85] font-bold">R$ {Number(product.preco || 0).toFixed(2)}</span>
                    {product.preco_original && Number(product.preco_original) > Number(product.preco) && (
                      <span className="text-[#666] text-sm line-through">
                        R$ {Number(product.preco_original || 0).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2 mt-4">
                    <Link to={`/AdminProductForm?id=${product.id}`} className="flex-1">
                      <Button className="w-full bg-[#00FF85] text-white hover:bg-[#00FF85]/90 font-semibold border-0">
                        <Edit className="w-4 h-4 mr-2" />
                        Editar Produto
                      </Button>
                    </Link>
                    <Button
                      variant="outline"
                      className="border-red-500/50 text-red-500 hover:bg-red-500/10 disabled:opacity-50"
                      onClick={() => setDeleteId(product.id)}
                      disabled={deleting}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => !deleting && setDeleteId(null)}>
        <AlertDialogContent className="bg-[#141414] border-[#2a2a2a]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription className="text-[#888]">
              Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel 
              className="bg-[#1a1a1a] border-[#2a2a2a] text-white hover:bg-[#2a2a2a]"
              disabled={deleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-500 text-white hover:bg-red-600 disabled:opacity-50"
              onClick={() => handleDeleteProduct(deleteId)}
              disabled={deleting}
            >
              {deleting ? 'Deletando...' : 'Excluir'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
