// src/pages-config.js
// Configuração de páginas para roteamento

export const pagesConfig = {
  mainPage: 'home',
  Layout: null, // Layout será importado direto
  Pages: {
    'home': () => import('@/pages/Home'),
    'shop': () => import('@/pages/Shop'),
    'cart': () => import('@/pages/Cart'),
    'checkout': () => import('@/pages/Checkout'),
    'payment': () => import('@/pages/Payment'),
    'invoice': () => import('@/pages/Invoice'),
    'tracking': () => import('@/pages/Tracking'),
    'product-detail': () => import('@/pages/ProductDetail'),
    'profile': () => import('@/pages/Profile'),
    'favorites': () => import('@/pages/Favorites'),
    'club': () => import('@/pages/Club'),
    'rewards': () => import('@/pages/Rewards'),
    'wallet': () => import('@/pages/Wallet'),
    'admin-dashboard': () => import('@/pages/AdminDashboard'),
    'admin-products': () => import('@/pages/AdminProducts'),
    'admin-product-form': () => import('@/pages/AdminProductForm'),
    'admin-coupons': () => import('@/pages/AdminCoupons'),
    'admin-settings': () => import('@/pages/AdminSettings'),
  }
};
