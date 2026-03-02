import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, resetPassword, isLoadingAuth, authError } = useAuth();
  const urlParams = new URLSearchParams(window.location.search);
  const redirectParam = urlParams.get('redirect');
  const redirectTo = redirectParam && redirectParam.startsWith('/') ? redirectParam : '/';
  const [mode, setMode] = useState('login'); // 'login' ou 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [localError, setLocalError] = useState('');
  const [infoMessage, setInfoMessage] = useState('');
  const [showReset, setShowReset] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetPasswordValue, setResetPasswordValue] = useState('');
  const [resetConfirmPassword, setResetConfirmPassword] = useState('');

  const handleSubmitLogin = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');

    try {
      await login(email, password);
      navigate(redirectTo);
    } catch (error) {
      setLocalError(error.message);
    }
  };

  const handleSubmitRegister = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');

    try {
      await register(name, email, password);
      navigate(redirectTo);
    } catch (error) {
      setLocalError(error.message);
    }
  };

  const handleSubmitReset = async (e) => {
    e.preventDefault();
    setLocalError('');
    setInfoMessage('');

    if (resetPasswordValue !== resetConfirmPassword) {
      setLocalError('As senhas nao conferem');
      return;
    }

    try {
      await resetPassword(resetEmail.trim(), resetPasswordValue);
      setInfoMessage('Senha atualizada com sucesso. Voce ja pode entrar.');
      setShowReset(false);
      setPassword('');
      setResetPasswordValue('');
      setResetConfirmPassword('');
    } catch (error) {
      setLocalError(error.message);
    }
  };


  return (
    <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
      {/* Neon grid background */}
      <div className="absolute inset-0 opacity-10">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              'linear-gradient(0deg, transparent 24%, rgba(0, 255, 133, 0.1) 25%, rgba(0, 255, 133, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 133, 0.1) 75%, rgba(0, 255, 133, 0.1) 76%, transparent 77%, transparent), linear-gradient(90deg, transparent 24%, rgba(0, 255, 133, 0.1) 25%, rgba(0, 255, 133, 0.1) 26%, transparent 27%, transparent 74%, rgba(0, 255, 133, 0.1) 75%, rgba(0, 255, 133, 0.1) 76%, transparent 77%, transparent)',
            backgroundSize: '50px 50px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="bg-[#0A0A0A] border-[#00FF85]/20 p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">
              Clube <span className="text-[#00FF85]">Várzea</span>
            </h1>
            <p className="text-gray-400">Bem-vindo</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 mb-6 border-b border-[#2a2a2a]">
            <button
              onClick={() => {
                setMode('login');
                setLocalError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-all ${
                mode === 'login'
                  ? 'text-[#00FF85] border-b-2 border-[#00FF85]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Entrar
            </button>
            <button
              onClick={() => {
                setMode('register');
                setLocalError('');
              }}
              className={`flex-1 pb-3 text-sm font-medium transition-all ${
                mode === 'register'
                  ? 'text-[#00FF85] border-b-2 border-[#00FF85]'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
            >
              Registrar
            </button>
          </div>

          {/* Error message */}
          {(authError || localError || infoMessage) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`mb-6 p-4 rounded-lg flex items-start gap-3 ${
                infoMessage
                  ? 'bg-[#00FF85]/10 border border-[#00FF85]/20'
                  : 'bg-red-500/10 border border-red-500/20'
              }`}
            >
              <AlertCircle
                className={`w-5 h-5 flex-shrink-0 mt-0.5 ${
                  infoMessage ? 'text-[#00FF85]' : 'text-red-400'
                }`}
              />
              <p className={`text-sm ${infoMessage ? 'text-[#00FF85]' : 'text-red-400'}`}>
                {infoMessage || authError || localError}
              </p>
            </motion.div>
          )}

          {/* Login Form */}
          {mode === 'login' && (
            <motion.form
              key="login"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitLogin}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
                <button
                  type="button"
                  onClick={() => {
                    setShowReset((prev) => !prev);
                    setLocalError('');
                    setInfoMessage('');
                    setResetEmail(email);
                  }}
                  className="mt-2 text-xs text-[#00FF85] hover:text-[#00FF85]/80"
                >
                  Esqueci a senha
                </button>
              </div>

              <Button
                type="submit"
                disabled={isLoadingAuth || !email || !password}
                className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold h-10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,133,0.5)]"
              >
                {isLoadingAuth ? 'Entrando...' : 'Entrar'}
              </Button>
            </motion.form>
          )}

          {mode === 'login' && showReset && (
            <motion.form
              key="reset"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitReset}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={resetEmail}
                  onChange={(e) => setResetEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nova senha
                </label>
                <Input
                  type="password"
                  value={resetPasswordValue}
                  onChange={(e) => setResetPasswordValue(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Confirmar nova senha
                </label>
                <Input
                  type="password"
                  value={resetConfirmPassword}
                  onChange={(e) => setResetConfirmPassword(e.target.value)}
                  placeholder="Repita a nova senha"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoadingAuth || !resetEmail || !resetPasswordValue || !resetConfirmPassword}
                className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold h-10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,133,0.5)]"
              >
                {isLoadingAuth ? 'Atualizando...' : 'Redefinir senha'}
              </Button>
            </motion.form>
          )}

          {/* Register Form */}
          {mode === 'register' && (
            <motion.form
              key="register"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onSubmit={handleSubmitRegister}
              className="space-y-4 mb-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome Completo
                </label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Email
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Senha
                </label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="bg-[#1A1A1A] border-[#00FF85]/20 text-white placeholder-gray-500"
                  disabled={isLoadingAuth}
                />
              </div>

              <Button
                type="submit"
                disabled={isLoadingAuth || !name || !email || !password}
                className="w-full bg-[#00FF85] text-black hover:bg-[#00FF85]/90 font-semibold h-10 shadow-lg hover:shadow-[0_0_20px_rgba(0,255,133,0.5)]"
              >
                {isLoadingAuth ? 'Registrando...' : 'Criar Conta'}
              </Button>
            </motion.form>
          )}

          {/* Info */}
          {mode === 'login' && (
            <div className="mt-6 p-4 bg-[#1A1A1A] border border-[#00FF85]/10 rounded-lg">
              <p className="text-xs text-gray-400">
                <span className="text-[#00FF85] font-semibold">Admin</span>: Acesso
                total ao dashboard, criar produtos e gerenciar configurações
              </p>
            </div>
          )}

          {mode === 'register' && (
            <div className="mt-6 p-4 bg-[#1A1A1A] border border-[#00FF85]/10 rounded-lg">
              <p className="text-xs text-gray-400">
                Criar uma conta para fazer pedidos e gerenciar suas compras
              </p>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
