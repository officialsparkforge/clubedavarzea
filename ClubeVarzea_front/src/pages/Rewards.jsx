import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Trophy, TrendingUp, Gift, Users, Copy, Share2, DollarSign, Award, Zap, Crown, Star } from 'lucide-react';
import NeonButton from '@/components/ui/NeonButton';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { cn } from "@/lib/utils";
import { base44 } from '@/api/base44Client';

const levels = [
  { id: 1, name: 'Bronze', minPoints: 0, color: 'from-orange-900 to-orange-700', icon: Award, commission: 5 },
  { id: 2, name: 'Prata', minPoints: 500, color: 'from-gray-400 to-gray-600', icon: Star, commission: 10 },
  { id: 3, name: 'Ouro', minPoints: 1000, color: 'from-yellow-400 to-yellow-600', icon: Crown, commission: 15 },
  { id: 4, name: 'Diamante', minPoints: 2000, color: 'from-purple-400 to-pink-600', icon: Trophy, commission: 20 },
];

export default function Rewards() {
  const queryClient = useQueryClient();
  const [showShareMenu, setShowShareMenu] = useState(false);

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: referrals = [], isLoading } = useQuery({
    queryKey: ['referrals'],
    queryFn: () => base44.entities.Referral.list(),
  });

  const myReferral = referrals.find(r => r.created_by === user?.email) || null;

  // Gera código determinístico baseado apenas no email (não muda nunca)
  const generateReferralCode = (email) => {
    if (!email) return '';
    // Hash simples do email para gerar sempre o mesmo código
    let hash = 0;
    for (let i = 0; i < email.length; i++) {
      hash = ((hash << 5) - hash) + email.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    const hashStr = Math.abs(hash).toString(36).toUpperCase().padStart(6, '0').slice(0, 6);
    return `VARZEA${hashStr}`;
  };

  const createReferralMutation = useMutation({
    mutationFn: async () => {
      const code = generateReferralCode(user?.email);
      return await base44.entities.Referral.create({
        referral_code: code,
        total_sales: 0,
        total_points: 0,
        level: 1,
        level_name: 'Bronze',
        referred_orders: [],
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['referrals']);
      toast.success('Código de referência criado!');
    },
    onError: (error) => {
      console.error('Erro ao criar código:', error);
      // Não mostrar erro se já existir
      if (!error.message?.includes('já existe')) {
        toast.error('Erro ao criar código de referência');
      }
    },
  });

  useEffect(() => {
    if (user && !myReferral && !isLoading) {
      createReferralMutation.mutate();
    }
  }, [user, myReferral, isLoading]);

  const currentLevel = levels.find(l => l.id === (myReferral?.level || 1)) || levels[0];
  const nextLevel = levels.find(l => l.id === currentLevel.id + 1);
  const progressToNext = nextLevel 
    ? ((myReferral?.total_points || 0) - currentLevel.minPoints) / (nextLevel.minPoints - currentLevel.minPoints) * 100
    : 100;

  const referralUrl = myReferral?.referral_code 
    ? `${window.location.origin}${createPageUrl('Home')}?ref=${myReferral.referral_code}`
    : '';

  const copyReferralLink = () => {
    if (referralUrl) {
      navigator.clipboard.writeText(referralUrl);
      toast.success('Link copiado!');
    }
  };

  const copyReferralCode = () => {
    if (myReferral?.referral_code) {
      navigator.clipboard.writeText(myReferral.referral_code);
      toast.success('Código copiado!');
    }
  };

  const shareReferral = () => {
    if (navigator.share) {
      navigator.share({
        title: 'Clube da Várzea',
        text: `Use meu código ${myReferral?.referral_code} e ganhe desconto na sua primeira compra!`,
        url: referralUrl,
      });
    } else {
      setShowShareMenu(true);
    }
  };

  const LevelIcon = currentLevel.icon;

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link to={createPageUrl('Profile')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Programa de Recompensas</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Level Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br",
            currentLevel.color
          )}
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <LevelIcon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/80 text-xs uppercase tracking-wider">Seu Nível</p>
                  <h2 className="text-2xl font-black text-white">{currentLevel.name}</h2>
                </div>
              </div>
              <div className="text-right">
                <p className="text-white/80 text-xs">Comissão</p>
                <p className="text-2xl font-bold text-white">{currentLevel.commission}%</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between text-sm text-white/90">
                <span>{myReferral?.total_points || 0} pontos</span>
                {nextLevel && <span>{nextLevel.minPoints} pontos</span>}
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNext}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white rounded-full shadow-[0_0_10px_rgba(255,255,255,0.5)]"
                />
              </div>
              {nextLevel && (
                <p className="text-xs text-white/80">
                  Faltam {nextLevel.minPoints - (myReferral?.total_points || 0)} pontos para {nextLevel.name}
                </p>
              )}
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <DollarSign className="w-4 h-4 text-[#00FF85]" />
              <span className="text-xs text-[#888]">Vendas Totais</span>
            </div>
            <p className="text-2xl font-bold text-[#00FF85]">R$ {(myReferral?.total_sales || 0).toFixed(2)}</p>
          </div>
          <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
            <div className="flex items-center gap-2 mb-2">
              <Users className="w-4 h-4 text-[#00FF85]" />
              <span className="text-xs text-[#888]">Referências</span>
            </div>
            <p className="text-2xl font-bold text-[#00FF85]">{myReferral?.referred_orders?.length || 0}</p>
          </div>
        </div>

        {/* Referral Code */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-[#00FF85]" />
            <h3 className="font-bold">Seu Código de Referência</h3>
          </div>

          <div className="bg-[#1a1a1a] rounded-xl p-4 border border-[#00FF85]/30 mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-[#888]">Código</p>
              <button onClick={copyReferralCode} className="text-[#00FF85] text-xs hover:underline flex items-center gap-1">
                <Copy className="w-3 h-3" />
                Copiar
              </button>
            </div>
            <p className="text-2xl font-bold text-[#00FF85] font-mono tracking-wider">
              {myReferral?.referral_code || 'GERANDO...'}
            </p>
          </div>

          <NeonButton onClick={copyReferralLink} className="w-full">
            <Copy className="w-4 h-4 mr-2" />
            Copiar Link
          </NeonButton>
        </div>

        {/* How it works */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
          <h3 className="font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-[#00FF85]" />
            Como Funciona
          </h3>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00FF85] font-bold">1</span>
              </div>
              <div>
                <p className="font-medium">Compartilhe seu código</p>
                <p className="text-sm text-[#888]">Envie para amigos e família</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00FF85] font-bold">2</span>
              </div>
              <div>
                <p className="font-medium">Eles ganham desconto</p>
                <p className="text-sm text-[#888]">10% OFF na primeira compra</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00FF85] font-bold">3</span>
              </div>
              <div>
                <p className="font-medium">Você ganha pontos</p>
                <p className="text-sm text-[#888]">1 ponto = R$ 1 em vendas referenciadas</p>
              </div>
            </div>
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#00FF85]/20 flex items-center justify-center flex-shrink-0">
                <span className="text-[#00FF85] font-bold">4</span>
              </div>
              <div>
                <p className="font-medium">Suba de nível</p>
                <p className="text-sm text-[#888]">Quanto mais pontos, maior sua comissão</p>
              </div>
            </div>
          </div>
        </div>

        {/* Levels Overview */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
          <h3 className="font-bold mb-4">Todos os Níveis</h3>
          <div className="space-y-3">
            {levels.map((level) => {
              const Icon = level.icon;
              const isCurrentLevel = level.id === currentLevel.id;
              const isUnlocked = (myReferral?.total_points || 0) >= level.minPoints;
              
              return (
                <div
                  key={level.id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-xl border transition-all",
                    isCurrentLevel
                      ? "border-[#00FF85] bg-[#00FF85]/10"
                      : isUnlocked
                      ? "border-[#2a2a2a] bg-[#1a1a1a]"
                      : "border-[#2a2a2a] bg-[#1a1a1a] opacity-50"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center bg-gradient-to-br",
                      level.color
                    )}>
                      <Icon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm">{level.name}</p>
                      <p className="text-xs text-[#888]">{level.minPoints} pontos</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[#00FF85] font-bold">{level.commission}%</p>
                    <p className="text-xs text-[#888]">comissão</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent Referrals */}
        {myReferral?.referred_orders && myReferral.referred_orders.length > 0 && (
          <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
            <h3 className="font-bold mb-4">Vendas Recentes</h3>
            <div className="space-y-3">
              {myReferral.referred_orders.slice(0, 5).map((order, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg">
                  <div>
                    <p className="font-medium text-sm">{order.order_number}</p>
                    <p className="text-xs text-[#888]">{order.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-[#00FF85]">+{order.points_earned} pts</p>
                    <p className="text-xs text-[#888]">R$ {order.amount?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
