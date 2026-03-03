/**
 * Script de teste para API do Asaas
 * 
 * Execute com: node test-asaas.js
 */

require('dotenv').config();
const axios = require('axios');

const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_BASE_URL = process.env.ASAAS_BASE_URL || 'https://api.asaas.com/v3';

console.log('🔍 Testando conexão com Asaas...\n');
console.log('URL:', ASAAS_BASE_URL);
console.log('API Key:', ASAAS_API_KEY ? `${ASAAS_API_KEY.substring(0, 20)}...` : 'NÃO CONFIGURADA');
console.log('');

const asaasAPI = axios.create({
  baseURL: ASAAS_BASE_URL,
  headers: {
    'access_token': ASAAS_API_KEY,
    'Content-Type': 'application/json',
  },
});

async function testAsaas() {
  try {
    console.log('1️⃣ Testando autenticação...');
    const authTest = await asaasAPI.get('/customers?limit=1');
    console.log('✅ Autenticação OK\n');
    
    console.log('2️⃣ Criando cliente de teste...');
    const customerData = {
      name: 'Teste PIX',
      email: 'teste@teste.com',
      cpfCnpj: '12345678900',
      notificationDisabled: true,
    };
    
    const customerResponse = await asaasAPI.post('/customers', customerData);
    const customer = customerResponse.data;
    console.log('✅ Cliente criado:', customer.id, '\n');
    
    console.log('3️⃣ Criando pagamento PIX...');
    const paymentData = {
      customer: customer.id,
      billingType: 'PIX',
      value: 10.00,
      dueDate: new Date().toISOString().split('T')[0],
      description: 'Teste de PIX',
    };
    
    const paymentResponse = await asaasAPI.post('/payments', paymentData);
    const payment = paymentResponse.data;
    console.log('✅ Pagamento criado:', payment.id);
    console.log('Status:', payment.status);
    console.log('Valor:', payment.value, '\n');
    
    console.log('4️⃣ Aguardando 3 segundos para gerar QR Code...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('5️⃣ Obtendo QR Code PIX...');
    const pixResponse = await asaasAPI.get(`/payments/${payment.id}/pixQrCode`);
    const pixData = pixResponse.data;
    
    if (pixData && pixData.payload) {
      console.log('✅ QR Code gerado com sucesso!\n');
      console.log('📋 PIX Copia e Cola:');
      console.log(pixData.payload.substring(0, 80) + '...');
      console.log('\nTamanho do payload:', pixData.payload.length, 'caracteres');
      console.log('Imagem base64:', pixData.encodedImage ? `${pixData.encodedImage.substring(0, 50)}...` : 'Não disponível');
      console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO! 🎉');
    } else {
      console.log('❌ QR Code não foi gerado');
      console.log('Response:', JSON.stringify(pixData, null, 2));
    }
    
    console.log('\n6️⃣ Limpando: Deletando cliente de teste...');
    await asaasAPI.delete(`/customers/${customer.id}`);
    console.log('✅ Cliente removido\n');
    
  } catch (error) {
    console.error('\n❌ ERRO:', error.message);
    
    if (error.response) {
      console.error('\nStatus:', error.response.status);
      console.error('Dados:', JSON.stringify(error.response.data, null, 2));
      
      if (error.response.status === 401) {
        console.error('\n🔴 ERRO DE AUTENTICAÇÃO!');
        console.error('Verifique se a ASAAS_API_KEY está correta no arquivo .env');
      }
    }
    
    process.exit(1);
  }
}

testAsaas();
