import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Wallet as WalletIcon, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';
import { base44 } from '@/api/base44Client';

export default function Wallet() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => base44.auth.me(),
  });

  const { data: wallets = [] } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const user = await base44.auth.me();
      return base44.entities.Wallet.filter({ created_by: user.email });
    },
  });

  const wallet = wallets[0] || { balance: 0, transactions: [] };
  const transactions = wallet.transactions || [];
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(b.date) - new Date(a.date)
  );

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0A0A0A]/95 backdrop-blur-lg border-b border-[#2a2a2a]">
        <div className="flex items-center gap-4 px-4 py-4">
          <Link to={createPageUrl('Profile')} className="p-2 hover:bg-[#1a1a1a] rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-xl font-bold">Minha Carteira</h1>
        </div>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Balance Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br from-[#00FF85] to-[#00cc6a]"
        >
          <div className="absolute inset-0 bg-black/20" />
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <WalletIcon className="w-5 h-5 text-white" />
              <p className="text-white/80 text-sm uppercase tracking-wider">Saldo Disponível</p>
            </div>
            <h2 className="text-4xl font-black text-white mb-2">
              R$ {(wallet.balance || 0).toFixed(2)}
            </h2>
            <p className="text-white/80 text-xs">
              Acumulado através de indicações
            </p>
          </div>
        </motion.div>

        {/* Info Card */}
        <div className="bg-[#141414] rounded-2xl p-4 border border-[#2a2a2a]">
          <div className="flex items-start gap-3">
            <DollarSign className="w-5 h-5 text-[#00FF85] flex-shrink-0 mt-0.5" />
            <div className="text-sm text-[#888]">
              <p>Você ganha comissão toda vez que alguém compra usando seu link de indicação.</p>
              <p className="mt-2">Para sacar seu saldo, entre em contato com nossa equipe.</p>
            </div>
          </div>
        </div>

        {/* Transactions */}
        <div className="bg-[#141414] rounded-2xl p-6 border border-[#2a2a2a]">
          <h3 className="font-bold mb-4">Histórico de Transações</h3>
          {sortedTransactions.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="w-12 h-12 text-[#2a2a2a] mx-auto mb-3" />
              <p className="text-[#888] text-sm">Nenhuma transação ainda</p>
              <p className="text-[#666] text-xs mt-1">Comece a indicar amigos para ganhar comissões!</p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedTransactions.map((transaction, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="flex items-center justify-between p-3 bg-[#1a1a1a] rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    {transaction.type === 'credit' ? (
                      <div className="w-10 h-10 rounded-full bg-[#00FF85]/20 flex items-center justify-center">
                        <TrendingUp className="w-5 h-5 text-[#00FF85]" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
                        <TrendingDown className="w-5 h-5 text-red-500" />
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-sm">{transaction.description}</p>
                      <p className="text-xs text-[#888]">
                        {new Date(transaction.date).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`font-bold ${transaction.type === 'credit' ? 'text-[#00FF85]' : 'text-red-500'}`}>
                      {transaction.type === 'credit' ? '+' : '-'}R$ {transaction.amount.toFixed(2)}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
