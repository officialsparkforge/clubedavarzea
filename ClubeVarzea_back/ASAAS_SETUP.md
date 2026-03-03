# Configuração do Asaas - Guia Completo

## 🚨 Problema: Erro 500 ao gerar QR Code PIX

O erro 500 ao gerar QR Code PIX pode ter várias causas:

### 1. API Key não configurada ou inválida

**Solução:**
1. Acesse https://www.asaas.com/
2. Faça login na sua conta
3. Vá em **Integrações** > **API Key**
4. Copie sua API Key (Sandbox ou Produção)
5. Cole no arquivo `.env`:

```env
# Para Sandbox (Testes)
ASAAS_API_KEY=sua_chave_sandbox_aqui
ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3

# Para Produção
ASAAS_API_KEY=sua_chave_producao_aqui
ASAAS_BASE_URL=https://api.asaas.com/v3
```

### 2. QR Code PIX demora para ser gerado

O Asaas pode levar alguns segundos para gerar o QR Code após criar o pagamento.

**Solução implementada:**
- O servidor agora tenta obter o QR Code até 5 vezes com intervalo de 2 segundos
- Logs detalhados para debugging

### 3. Conta Asaas não configurada para PIX

**Verificar:**
1. Acesse o painel do Asaas
2. Vá em **Configurações** > **Formas de Recebimento**
3. Certifique-se de que **PIX** está habilitado

## 🧪 Testar a Configuração

### 1. Testar conexão com Asaas

Execute no terminal:
```bash
curl http://localhost:3000/api/asaas/test
```

Resposta esperada:
```json
{
  "success": true,
  "message": "Conexão com Asaas OK",
  "apiUrl": "https://sandbox.asaas.com/api/v3",
  "apiKeyConfigured": true
}
```

### 2. Verificar logs do servidor

Inicie o servidor com:
```bash
cd ClubeVarzea_back
npm start
```

Os logs agora mostram:
- ✅ Quando o pagamento é criado com sucesso
- 🔄 Tentativas de obter o QR Code
- ❌ Erros detalhados do Asaas

## 📝 Exemplo de Requisição PIX

```javascript
// Criar pagamento PIX
const response = await fetch('http://localhost:3000/api/asaas/payments/pix', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    orderId: 'ORDER-123',
    value: 100.00,
    description: 'Pedido #123',
    customerData: {
      name: 'João Silva',
      email: 'joao@email.com',
      document: '12345678900', // CPF
      phone: '11999999999'
    }
  })
});

const data = await response.json();

if (data.success) {
  console.log('✅ PIX gerado com sucesso!');
  console.log('QR Code:', data.payment.pixQrCode);
  console.log('Imagem:', data.payment.pixQrCodeImage);
} else {
  console.error('❌ Erro:', data.details);
  console.error('Erro do Asaas:', data.asaasError);
}
```

## 🔍 Debug Avançado

### Verificar resposta do Asaas

Os logs agora incluem:
- Detalhes do erro do Asaas
- Stack trace completo
- Response data da API

### Testar diretamente na API do Asaas

```bash
# Testar API Key
curl -H "access_token: SUA_API_KEY" \
     https://sandbox.asaas.com/api/v3/customers?limit=1

# Criar pagamento PIX
curl -X POST \
     -H "access_token: SUA_API_KEY" \
     -H "Content-Type: application/json" \
     -d '{
       "customer": "cus_xxx",
       "billingType": "PIX",
       "value": 100.00,
       "dueDate": "2026-03-10"
     }' \
     https://sandbox.asaas.com/api/v3/payments

# Obter QR Code
curl -H "access_token: SUA_API_KEY" \
     https://sandbox.asaas.com/api/v3/payments/pay_xxx/pixQrCode
```

## 🛠️ Melhorias Implementadas

1. **Retry Logic:** 5 tentativas com delay de 2 segundos
2. **Logs Detalhados:** Console mostra cada etapa do processo
3. **Validação de API Key:** Alerta se não estiver configurada
4. **Endpoint de Teste:** `/api/asaas/test` para verificar conexão
5. **Tratamento de Erro:** Retorna detalhes do erro do Asaas

## 📞 Suporte

Se o problema persistir:
1. Verifique os logs do servidor
2. Teste o endpoint `/api/asaas/test`
3. Verifique se o PIX está habilitado na conta Asaas
4. Entre em contato com o suporte do Asaas
