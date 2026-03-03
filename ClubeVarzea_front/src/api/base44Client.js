const RAW_API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

const resolveApiUrl = () => {
  if (typeof window === 'undefined') {
    return RAW_API_URL;
  }

  const isHttpsPage = window.location.protocol === 'https:';
  const isInsecureConfiguredApi = RAW_API_URL.startsWith('http://');

  if (isHttpsPage && isInsecureConfiguredApi) {
    return window.location.origin;
  }

  return RAW_API_URL;
};

const ensureApiPrefix = (url) => {
  const clean = (url || '').replace(/\/$/, '');
  if (!clean) return '/api';
  if (clean.endsWith('/api')) return clean;
  return `${clean}/api`;
};

const API_URL = ensureApiPrefix(resolveApiUrl());

const getStoredUser = () => {
  try {
    const raw = localStorage.getItem('clubevarzea_user');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    return null;
  }
};

const getOrCreateAnonymousId = () => {
  const key = 'clubevarzea_anon_id';
  let anonId = localStorage.getItem(key);
  if (!anonId) {
    anonId = 'anon_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    localStorage.setItem(key, anonId);
  }
  return anonId;
};

const request = async (path, options = {}) => {
  const user = getStoredUser();
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (user?.email) {
    headers['X-User-Email'] = user.email;
  } else {
    // Se não estiver logado, passar ID anônimo
    headers['X-Anonymous-Id'] = getOrCreateAnonymousId();
  }

  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`${API_URL}${normalizedPath}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Erro na requisicao');
  }

  if (response.status === 204) return null;
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const body = await response.text();
    throw new Error(`Resposta inesperada do servidor (${contentType || 'sem content-type'}): ${body.slice(0, 120)}`);
  }

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
      list: async (sort, limit) => request(`/products${buildQuery({ sort, limit })}`),
      filter: async (criteria = {}, sort) => request(`/products${buildQuery({ ...criteria, sort })}`),
      get: async (id) => request(`/products/${id}`),
      create: async (data) => request('/products', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async (id) => request(`/products/${id}`, { method: 'DELETE' }),
    },
    Coupon: {
      list: async () => request('/coupons'),
      filter: async (criteria = {}) => request(`/coupons${buildQuery(criteria)}`),
    },
    CartItem: {
      list: async () => request('/cart-items'),
      filter: async (criteria = {}) => request(`/cart-items${buildQuery(criteria)}`),
      create: async (data) => request('/cart-items', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/cart-items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async (id) => request(`/cart-items/${id}`, { method: 'DELETE' }),
    },
    Favorite: {
      list: async () => request('/favorites'),
      filter: async (criteria = {}) => request(`/favorites${buildQuery(criteria)}`),
      create: async (data) => request('/favorites', { method: 'POST', body: JSON.stringify(data) }),
      delete: async (id) => request(`/favorites/${id}`, { method: 'DELETE' }),
    },
    Review: {
      list: async () => request('/reviews'),
      filter: async (criteria = {}, sort) => request(`/reviews${buildQuery({ ...criteria, sort })}`),
      create: async (data) => request('/reviews', { method: 'POST', body: JSON.stringify(data) }),
    },
    Referral: {
      list: async () => request('/referrals'),
      filter: async (criteria = {}) => request(`/referrals${buildQuery(criteria)}`),
      create: async (data) => request('/referrals', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/referrals/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Subscription: {
      list: async () => request('/subscriptions'),
      create: async (data) => request('/subscriptions', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/subscriptions/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Wallet: {
      list: async () => request('/wallets'),
      filter: async () => request('/wallets'),
      create: async (data) => request('/wallets', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/wallets/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    },
    Order: {
      list: async (sort, limit) => request(`/orders${buildQuery({ sort, limit })}`),
      filter: async (criteria = {}) => request(`/orders${buildQuery(criteria)}`),
      get: async (id) => request(`/orders/${id}`),
      create: async (data) => request('/orders', { method: 'POST', body: JSON.stringify(data) }),
      update: async (id, data) => request(`/orders/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
      delete: async () => ({ ok: true }),
    },
  },
};

export default base44;
