const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('clubevarzea_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const request = async (path, options = {}) => {
  const user = getStoredUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (user?.email) {
    headers['X-User-Email'] = user.email;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro na requisicao');
  }

  if (response.status === 204) return null;
  return response.json();
};

const buildQuery = (params = {}) => {
  const entries = Object.entries(params)
    .filter(([, value]) => value !== undefined && value !== null && value !== '')
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`);
  return entries.length > 0 ? `?${entries.join('&')}` : '';
};

export const base44 = {
  auth: {
    async me() {
      const user = getStoredUser();
      if (!user) throw new Error('Nao autenticado');
      return user;
    },
    async updateMe(data) {
      const user = getStoredUser();
      if (!user) throw new Error('Nao autenticado');
      const updated = { ...user, ...data };
      localStorage.setItem('clubevarzea_user', JSON.stringify(updated));
      return updated;
    },
    async logout() {
      localStorage.removeItem('clubevarzea_user');
    },
  },
  integrations: {
    Core: {
      async SendEmail() {
        return { ok: true };
      },
    },
  },
  entities: {
    Product: {
      list: async (sort, limit) => request(`/api/products${buildQuery({ sort, limit })}`),
      filter: async (criteria = {}, sort) => request(`/api/products${buildQuery({ ...criteria, sort })}`),
      get: async (id) => request(`/api/products/${id}`),
      create: async (data) => request('/api/products', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async (id) => request(`/api/products/${id}`, { method: 'DELETE' }),
    },
    Coupon: {
      list: async () => request('/api/coupons'),
      filter: async (criteria = {}) => request(`/api/coupons${buildQuery(criteria)}`),
    },
    CartItem: {
      list: async () => request('/api/cart-items'),
      filter: async (criteria = {}) => request(`/api/cart-items${buildQuery(criteria)}`),
      create: async (data) => request('/api/cart-items', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/cart-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async (id) => request(`/api/cart-items/${id}`, { method: 'DELETE' }),
    },
    Favorite: {
      list: async () => request('/api/favorites'),
      filter: async (criteria = {}) => request(`/api/favorites${buildQuery(criteria)}`),
      create: async (data) => request('/api/favorites', { method: 'POST', body: JSON.stringify(data) }),
      delete: async (id) => request(`/api/favorites/${id}`, { method: 'DELETE' }),
    },
    Review: {
      list: async () => request('/api/reviews'),
      filter: async (criteria = {}, sort) => request(`/api/reviews${buildQuery({ ...criteria, sort })}`),
      create: async (data) => request('/api/reviews', { method: 'POST', body: JSON.stringify(data) }),
    },
    Referral: {
      list: async () => request('/api/referrals'),
      filter: async (criteria = {}) => request(`/api/referrals${buildQuery(criteria)}`),
      create: async (data) => request('/api/referrals', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/referrals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Subscription: {
      list: async () => request('/api/subscriptions'),
      create: async (data) => request('/api/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Wallet: {
      list: async () => request('/api/wallets'),
      filter: async () => request('/api/wallets'),
      create: async (data) => request('/api/wallets', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Order: {
      list: async (sort, limit) => request(`/api/orders${buildQuery({ sort, limit })}`),
      filter: async (criteria = {}) => request(`/api/orders${buildQuery(criteria)}`),
      get: async (id) => request(`/api/orders/${id}`),
      create: async (data) => request('/api/orders', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/api/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async () => ({ ok: true }),
    },
  },
};

export default base44;
