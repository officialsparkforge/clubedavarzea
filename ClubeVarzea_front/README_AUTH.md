# 🔐 Sistema de Autenticação - Clube Várzea

## Credenciais de Teste

### 👑 Usuário Admin Master
- **Email**: `admin@clubevarzea.com`
- **Senha**: `admin123`
- **Papel**: Admin
- **Permissões**:
  - ✅ Acessar dashboard administrativo
  - ✅ Criar e gerenciar produtos
  - ✅ Visualizar e editar configurações
  - ✅ Gerenciar cupons
  - ✅ Acessar todas as funcionalidades administrativas

### 👤 Usuário Cliente
- **Email**: `user@example.com`
- **Senha**: `user123`
- **Papel**: Customer
- **Permissões**:
  - ✅ Navegar na loja
  - ✅ Adicionar itens ao carrinho
  - ✅ Fazer compras
  - ✅ Ver perfil e histórico
  - ❌ Acesso negado às páginas admin

---

## 🛠 Implementação Técnica

### Arquivo: `src/lib/AuthContext.jsx`
Define o contexto de autenticação com:
- `login(email, password)` - Faz login com credenciais
- `logout()` - Faz logout e limpa sessionStorage
- `isAdmin()` - Verifica se o usuário é admin
- Persistência em localStorage

### Arquivo: `src/lib/ProtectedRoute.jsx`
Componente que protege rotas admin:
- Redireciona para `/login` se não autenticado
- Redireciona para `/` se não é admin
- Permite acesso apenas para `admin@clubevarzea.com`

### Arquivo: `src/pages/Login.jsx`
Página de login com:
- Formulário de login
- Botões de acesso rápido para contas de demonstração
- Validação de credenciais
- Redirecionamento após autenticação bem-sucedida

### Arquivo: `src/Layout.jsx`
Header atualizado com:
- Exibição do usuário logado
- Links de admin (Dashboard, Produtos)
- Botão de logout
- Indicador de role do usuário

---

## 📍 Rotas Protegidas

As seguintes rotas são **protegidas** e só acessíveis para admins:
- `/admin-dashboard` - Dashboard principal
- `/admin-products` - Gerenciamento de produtos
- `/admin-product-form` - Formulário de criar/editar produto
- `/admin-coupons` - Gerenciamento de cupons
- `/admin-settings` - Configurações do sistema

---

## 🔄 Fluxo de Autenticação

```
1. Usuário acessa /login
2. Insere email e senha
3. AuthContext valida contra MOCK_USERS
4. Se válido:
   - Salva usuário em localStorage
   - Redireciona para home (/)
   - Header exibe dados do usuário
5. Se admin:
   - Links de admin aparecem no header
   - Pode acessar /admin-*
6. Logout:
   - Remove usuário do localStorage
   - Redireciona para home
```

---

## 📝 Adicionando Novos Usuários

Edite `src/lib/AuthContext.jsx` e adicione à constante `MOCK_USERS`:

```javascript
const MOCK_USERS = {
  'newuser@example.com': {
    email: 'newuser@example.com',
    password: 'senha123',
    name: 'Novo Usuário',
    role: 'customer', // ou 'admin'
    id: 'user-002',
    avatar: '👨‍🦱', // Emoji do avatar
  },
  // ... outros usuários
};
```

---

## 🎨 Customização

### Trocar tema de cores do login
Edite as cores em `src/pages/Login.jsx`:
- `#00FF85` - Cor neon (verde)
- `#0A0A0A` - Fundo escuro
- `#1A1A1A` - Cards/inputs

### Adicionar campos extras de usuário
Atualize a interface de usuário em:
1. `MOCK_USERS` - Estrutura de dados
2. `Login.jsx` - Formulário de login
3. `AuthContext.jsx` - Tipo de dados do usuário

---

## 🚀 Próximos Passos

- [ ] Integrar com API real de autenticação
- [ ] Implementar JWT tokens
- [ ] Adicionar recuperação de senha
- [ ] Implementar autenticação com OAuth (Google, GitHub)
- [ ] Adicionar 2FA (autenticação de dois fatores)
- [ ] Criar página de registro de usuários

---

## 🐛 Troubleshooting

**Problema**: Não consegue fazer login
- Verifique se está usando as credenciais corretas (email e senha)
- Confirme se está digitando exatamente

**Problema**: Admin não tem acesso às rotas protegidas
- Verifique se `role` é exatamente `'admin'`
- Limpe localStorage e faça login novamente

**Problema**: Header não mostra o usuário
- Abra DevTools > Console
- Verifique se há erros de importação
- Confirme que `AuthProvider` envolve o `App`
