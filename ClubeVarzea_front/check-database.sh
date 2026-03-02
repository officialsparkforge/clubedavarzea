#!/bin/bash
# Script de verificação e correção do banco de dados

echo "🔍 Verificando banco de dados..."
echo ""

CONTAINER="mysql_docker"
SENHA="j6dyDGOGxi2q4aY"
DB="clube_varzea"

# Cores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  TABELAS EXISTENTES"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec -it $CONTAINER mysql -u root -p$SENHA $DB -e "SHOW TABLES;"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  VERIFICANDO TABELAS NECESSÁRIAS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Lista de tabelas necessárias
TABLES=(
  "categorias"
  "times"
  "produtos"
  "usuarios"
  "orders"
  "cart_items"
  "favorites"
  "reviews"
  "referrals"
  "wallets"
  "coupons"
)

for table in "${TABLES[@]}"; do
  if docker exec -i $CONTAINER mysql -u root -p$SENHA $DB -e "SHOW TABLES LIKE '$table';" 2>/dev/null | grep -q "$table"; then
    echo -e "${GREEN}✅ $table${NC}"
  else
    echo -e "${RED}❌ $table (faltando)${NC}"
  fi
done

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ESTRUTURA DA TABELA ORDERS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec -it $CONTAINER mysql -u root -p$SENHA $DB -e "DESCRIBE orders;" 2>/dev/null || echo -e "${RED}Tabela orders não existe!${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ESTRUTURA DA TABELA WALLETS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec -it $CONTAINER mysql -u root -p$SENHA $DB -e "DESCRIBE wallets;" 2>/dev/null || echo -e "${RED}Tabela wallets não existe!${NC}"

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  CONTAGEM DE REGISTROS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

docker exec -it $CONTAINER mysql -u root -p$SENHA $DB -e "
SELECT 'categorias' as tabela, COUNT(*) as total FROM categorias
UNION ALL
SELECT 'times', COUNT(*) FROM times
UNION ALL
SELECT 'usuarios', COUNT(*) FROM usuarios
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'wallets', COUNT(*) FROM wallets
UNION ALL
SELECT 'coupons', COUNT(*) FROM coupons;
" 2>/dev/null

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  💡 PRÓXIMOS PASSOS"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Se alguma tabela estiver faltando:"
echo "  ./fix-database.sh"
echo ""
echo "Para testar conexão da aplicação:"
echo "  npm install"
echo "  node test-db-connection.js"
echo ""

