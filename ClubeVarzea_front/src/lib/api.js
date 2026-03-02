const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// =============== PRODUTOS ===============

export const produtosAPI = {
  async listar() {
    const response = await fetch(`${API_URL}/produtos`);
    if (!response.ok) throw new Error('Erro ao listar produtos');
    return response.json();
  },

  async criar(data) {
    const response = await fetch(`${API_URL}/produtos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar produto');
    return response.json();
  },

  async atualizar(id, data) {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar produto');
    return response.json();
  },

  async deletar(id) {
    const response = await fetch(`${API_URL}/produtos/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar produto');
    return response.json();
  },
};

// =============== CUPONS ===============

export const cuponsAPI = {
  async listar() {
    const response = await fetch(`${API_URL}/cupons`);
    if (!response.ok) throw new Error('Erro ao listar cupons');
    return response.json();
  },

  async criar(data) {
    const response = await fetch(`${API_URL}/cupons`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar cupom');
    return response.json();
  },

  async atualizar(id, data) {
    const response = await fetch(`${API_URL}/cupons/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar cupom');
    return response.json();
  },

  async deletar(id) {
    const response = await fetch(`${API_URL}/cupons/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar cupom');
    return response.json();
  },
};

// =============== TIMES ===============

export const timesAPI = {
  async listar() {
    const response = await fetch(`${API_URL}/times`);
    if (!response.ok) throw new Error('Erro ao listar times');
    return response.json();
  },

  async criar(nome, categoria_id = null) {
    const response = await fetch(`${API_URL}/times`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ nome, categoria_id }),
    });
    if (!response.ok) throw new Error('Erro ao criar time');
    return response.json();
  },

  async deletar(nome) {
    const response = await fetch(`${API_URL}/times/${encodeURIComponent(nome)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar time');
    return response.json();
  },
};

// =============== CATEGORIAS ===============

export const categoriasAPI = {
  async listar() {
    const response = await fetch(`${API_URL}/categorias`);
    if (!response.ok) throw new Error('Erro ao listar categorias');
    return response.json();
  },

  async criar(id, label) {
    const response = await fetch(`${API_URL}/categorias`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, label }),
    });
    if (!response.ok) throw new Error('Erro ao criar categoria');
    return response.json();
  },

  async deletar(id) {
    const response = await fetch(`${API_URL}/categorias/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
    if (!response.ok) throw new Error('Erro ao deletar categoria');
    return response.json();
  },
};

// =============== PEDIDOS ===============

export const pedidosAPI = {
  async listar() {
    const response = await fetch(`${API_URL}/pedidos`);
    if (!response.ok) throw new Error('Erro ao listar pedidos');
    return response.json();
  },

  async listarPorUsuario(usuario_id) {
    const response = await fetch(`${API_URL}/pedidos/usuario/${usuario_id}`);
    if (!response.ok) throw new Error('Erro ao listar pedidos do usuário');
    return response.json();
  },

  async criar(data) {
    const response = await fetch(`${API_URL}/pedidos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao criar pedido');
    return response.json();
  },

  async atualizar(id, status) {
    const response = await fetch(`${API_URL}/pedidos/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!response.ok) throw new Error('Erro ao atualizar pedido');
    return response.json();
  },
};

// =============== ORDERS (Base44) ===============

export const ordersAPI = {
  async listar(showAll = false) {
    const url = showAll ? `${API_URL}/orders?all=true` : `${API_URL}/orders`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Erro ao listar pedidos');
    return response.json();
  },

  async atualizar(id, data) {
    const response = await fetch(`${API_URL}/orders/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error('Erro ao atualizar pedido');
    return response.json();
  },
};
