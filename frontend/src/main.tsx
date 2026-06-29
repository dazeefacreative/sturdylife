import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate, useLocation } from "react-router";
import { AuthProvider, useAuth } from "@/app/context/AuthContext";
import { CartProvider } from "@/app/context/CartContext";

import HomePage        from "@/app/pages/HomePage";
import ShopPage        from "@/app/pages/ShopPage";
import ProductPage     from "@/app/pages/ProductPage";
import CartPage        from "@/app/pages/CartPage";
import CheckoutPage    from "@/app/pages/CheckoutPage";
import PaymentSuccess  from "@/app/pages/PaymentSuccess";
import PaymentFailed   from "@/app/pages/PaymentFailed";
import AboutPage       from "@/app/pages/AboutPage";
import ContactPage     from "@/app/pages/ContactPage";
import LoginPage       from "@/app/pages/LoginPage";
import RegisterPage    from "@/app/pages/RegisterPage";
import AccountPage     from "@/app/pages/AccountPage";
import OrdersPage      from "@/app/pages/OrdersPage";
import OrderDetailPage from "@/app/pages/OrderDetailPage";
import WishlistPage    from "@/app/pages/WishlistPage";
import ProfilePage     from "@/app/pages/ProfilePage";
import NotFoundPage    from "@/app/pages/NotFoundPage";

import AdminLayout     from "@/app/pages/admin/AdminLayout";
import DashboardPage   from "@/app/pages/admin/DashboardPage";
import AdminProducts   from "@/app/pages/admin/ProductsPage";
import ProductFormPage from "@/app/pages/admin/ProductFormPage";
import AdminOrders     from "@/app/pages/admin/OrdersPage";
import AdminCustomers  from "@/app/pages/admin/CustomersPage";

import "@/styles/tailwind.css";
import "@/styles/fonts.css";

function ProtectedRoute({ children }: { children: React.ReactElement }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? children : <Navigate to="/login" replace />;
}

function AdminRoute({ children }: { children: React.ReactElement }) {
  const { user, isAdmin, loading } = useAuth();
  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/" replace />;
  return children;
}

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function AppRoutes() {
  return (
    <>
    <ScrollToTop />
    <Routes>
      <Route path="/"                element={<HomePage />} />
      <Route path="/shop"            element={<ShopPage />} />
      <Route path="/shop/:category"  element={<ShopPage />} />
      <Route path="/product/:slug"   element={<ProductPage />} />
      <Route path="/about"           element={<AboutPage />} />
      <Route path="/contact"         element={<ContactPage />} />
      <Route path="/cart"            element={<CartPage />} />
      <Route path="/login"           element={<LoginPage />} />
      <Route path="/register"        element={<RegisterPage />} />
      <Route path="/payment/success" element={<PaymentSuccess />} />
      <Route path="/payment/failed"  element={<PaymentFailed />} />

      <Route path="/checkout"        element={<ProtectedRoute><CheckoutPage /></ProtectedRoute>} />
      <Route path="/account"          element={<ProtectedRoute><AccountPage /></ProtectedRoute>} />
      <Route path="/account/orders"   element={<ProtectedRoute><OrdersPage /></ProtectedRoute>} />
      <Route path="/account/orders/:orderNumber" element={<ProtectedRoute><OrderDetailPage /></ProtectedRoute>} />
      <Route path="/account/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
      <Route path="/account/profile"  element={<ProtectedRoute><ProfilePage /></ProtectedRoute>} />

      <Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
        <Route index                    element={<DashboardPage />} />
        <Route path="products"          element={<AdminProducts />} />
        <Route path="products/new"      element={<ProductFormPage />} />
        <Route path="products/:id/edit" element={<ProductFormPage />} />
        <Route path="orders"            element={<AdminOrders />} />
        <Route path="customers"         element={<AdminCustomers />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
