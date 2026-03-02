import AdminCoupons from './pages/AdminCoupons';
import AdminDashboard from './pages/AdminDashboard';
import AdminProductForm from './pages/AdminProductForm';
import AdminProducts from './pages/AdminProducts';
import AdminSettings from './pages/AdminSettings';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import Club from './pages/Club';
import Favorites from './pages/Favorites';
import Home from './pages/Home';
import Invoice from './pages/Invoice';
import Payment from './pages/Payment';
import ProductDetail from './pages/ProductDetail';
import Profile from './pages/Profile';
import Rewards from './pages/Rewards';
import Shop from './pages/Shop';
import Tracking from './pages/Tracking';
import Wallet from './pages/Wallet';
import __Layout from './Layout.jsx';


export const PAGES = {
    "AdminCoupons": AdminCoupons,
    "AdminDashboard": AdminDashboard,
    "AdminProductForm": AdminProductForm,
    "AdminProducts": AdminProducts,
    "AdminSettings": AdminSettings,
    "Cart": Cart,
    "Checkout": Checkout,
    "Club": Club,
    "Favorites": Favorites,
    "Home": Home,
    "Invoice": Invoice,
    "Payment": Payment,
    "ProductDetail": ProductDetail,
    "Profile": Profile,
    "Rewards": Rewards,
    "Shop": Shop,
    "Tracking": Tracking,
    "Wallet": Wallet,
}

export const pagesConfig = {
    mainPage: "Home",
    Pages: PAGES,
    Layout: __Layout,
};