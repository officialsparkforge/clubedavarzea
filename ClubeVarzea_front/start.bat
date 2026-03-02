@echo off
REM Start Clube Varzea Development Server

cd /d "%~dp0"

echo.
echo 🚀 Iniciando Clube Varzea...
echo.

REM Check if node_modules exists
if not exist "node_modules" (
  echo 📦 Instalando dependências...
  call npm install
  echo.
)

REM Check if .env.local exists  
if not exist ".env.local" (
  echo ⚙️  Criando arquivo .env.local...
  copy .env.example .env.local
  echo ✅ Arquivo .env.local criado com sucesso!
  echo.
)

echo 🎨 Iniciando servidor de desenvolvimento...
echo 📖 A aplicação abrirá em http://localhost:5173
echo.
echo Pressione Ctrl+C para parar o servidor
echo.

call npm run dev

pause
