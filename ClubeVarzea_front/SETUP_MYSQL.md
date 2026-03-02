# Clube Várzea - Setup com MySQL

## Pré-requisitos

1. **Node.js** (v16+)
2. **MySQL Server** (v5.7+)
3. **npm** ou **yarn**

## Instalação

### 1. Setup do Banco de Dados

#### Opção A: Usar MySQL CLI
```bash
mysql -u root -p < banco_dados.sql
```

#### Opção B: Usar MySQL Workbench ou phpMyAdmin
1. Abra seu cliente MySQL
2. Crie um novo banco de dados: `clube_varzea`
3. Copie e execute o conteúdo do arquivo `banco_dados.sql`

### 2. Configurar Backend

```bash
# Copiar o package.json do server
cp server-package.json package.json

# Alternatively, criar package.json do zero
npm init -y

# Instalar dependências
npm install express cors dotenv mysql2 uuid

# (Opcional) Instalar nodemon para desenvolvimento
npm install --save-dev nodemon
```

### 3. Configurar Variáveis de Ambiente

Editar `.env.local` com suas credenciais MySQL:
```
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=sua_senha_aqui
DB_NAME=clube_varzea
PORT=13008
VITE_API_URL=http://localhost:3001
```

### 4. Instalar Dependências do Frontend

```bash
# Na pasta do projeto
npm install
```

## Rodar o Projeto

### Terminal 1 - Backend
```bash
node server.js
# ou com nodemon para desenvolvimentoas
nodemon server.js
```

O servidor estará rodando em: `http://localhost:3001`

### Terminal 2 - Frontend
```bash
npm run dev
```

O frontend estará rodando em: `http://localhost:5173`

## Endpoints da API

### Produtos
- `GET /api/produtos` - Listar todos
- `POST /api/produtos` - Criar novo
- `PUT /api/produtos/:id` - Atualizar
- `DELETE /api/produtos/:id` - Deletar

### Cupons
- `GET /api/cupons` - Listar todos
- `POST /api/cupons` - Criar novo
- `PUT /api/cupons/:id` - Atualizar
- `DELETE /api/cupons/:id` - Deletar

### Times
- `GET /api/times` - Listar todos
- `POST /api/times` - Criar novo
- `DELETE /api/times/:nome` - Deletar

### Categorias
- `GET /api/categorias` - Listar todas
- `POST /api/categorias` - Criar nova
- `DELETE /api/categorias/:id` - Deletar

### Pedidos
- `GET /api/pedidos` - Listar todos
- `GET /api/pedidos/usuario/:usuario_id` - Listar por usuário
- `POST /api/pedidos` - Criar novo
- `PUT /api/pedidos/:id` - Atualizar status

## Solução de Problemas

### "Can't connect to MySQL server"
- Verifique se MySQL está rodando
- Confirme credenciais em `.env.local`
- Verifique a porta padrão (3306)

### "Database does not exist"
- Execute `banco_dados.sql` novamente
- Verifique nome do banco em `.env.local`

### CORS Error
- Verifique se backend está rodando na porta 3001
- Confirme `VITE_API_URL` em `.env.local`

## Estrutura do Banco de Dados

### Tabelas
- **usuarios** - Usuários (admin/customer)
- **produtos** - Catálogo de produtos
- **categorias** - Categorias de produtos
- **times** - Times de futebol
- **cupons** - Códigos de desconto
- **pedidos** - Pedidos dos clientes

## Credenciais Padrão

Admin:
- Email: `admin@clubevarzea.com`
- Senha: `admin123`
