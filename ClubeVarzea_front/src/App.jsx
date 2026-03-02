import { QueryClientProvider } from '@tanstack/react-query';
import { queryClientInstance } from '@/lib/query-client';
import NavigationTracker from '@/lib/NavigationTracker';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider } from '@/lib/AuthContext';
import { ProtectedRoute } from '@/lib/ProtectedRoute';

// Import all pages
import Home from '@/pages/Home';
import Shop from '@/pages/Shop';
import Cart from '@/pages/Cart';
import Checkout from '@/pages/Checkout';
import Payment from '@/pages/Payment';
import Invoice from '@/pages/Invoice';
import Tracking from '@/pages/Tracking';
import ProductDetail from '@/pages/ProductDetail';
import Profile from '@/pages/Profile';
import Favorites from '@/pages/Favorites';
import Club from '@/pages/Club';
import Rewards from '@/pages/Rewards';
import Wallet from '@/pages/Wallet';
import AdminDashboard from '@/pages/AdminDashboard';
import AdminProducts from '@/pages/AdminProducts';
import AdminProductForm from '@/pages/AdminProductForm';
import AdminCoupons from '@/pages/AdminCoupons';
import AdminSettings from '@/pages/AdminSettings';
import Login from '@/pages/Login';
import Layout from './Layout';

const pages = {
  home: Home,
  shop: Shop,
  cart: Cart,
  checkout: Checkout,
  payment: Payment,
  invoice: Invoice,
  tracking: Tracking,
  'product-detail': ProductDetail,
  profile: Profile,
  favorites: Favorites,
  club: Club,
  rewards: Rewards,
  wallet: Wallet,
  AdminDashboard: AdminDashboard,
  AdminProducts: AdminProducts,
  AdminProductForm: AdminProductForm,
  AdminCoupons: AdminCoupons,
  AdminSettings: AdminSettings,
};

const LayoutWrapper = ({ children, currentPageName }) => (
  <Layout currentPageName={currentPageName}>{children}</Layout>
);

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <NavigationTracker />
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/" element={<LayoutWrapper currentPageName="home"><Home /></LayoutWrapper>} />
            
            {Object.entries(pages).map(([path, Page]) => {
              // Admin routes are protected
              const isAdminRoute = path.startsWith('Admin');
              
              return (
                <Route
                  key={path}
                  path={`/${path}`}
                  element={
                    isAdminRoute ? (
                      <ProtectedRoute>
                        <LayoutWrapper currentPageName={path}>
                          <Page />
                        </LayoutWrapper>
                      </ProtectedRoute>
                    ) : (
                      <LayoutWrapper currentPageName={path}>
                        <Page />
                      </LayoutWrapper>
                    )
                  }
                />
              );
            })}
            
            <Route path="*" element={<PageNotFound />} />
          </Routes>
        </Router>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
