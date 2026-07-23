import { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { DashboardProvider, useDashboard } from './context/DashboardContext';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import { Refunds } from './pages/Refunds';
import Products from './pages/Products';
import ProductForm from './pages/ProductForm';
import Customers from './pages/Customers';
import Staff from './pages/Staff';
import Vouchers from './pages/Vouchers';
import { VoucherForm } from './pages/VoucherForm';
import FlashSales from './pages/FlashSales';
import FlashSaleForm from './pages/FlashSaleForm';
import Reviews from './pages/Reviews';
import Posts from './pages/Posts';
import Categories from './pages/Categories';
import EditionForm from './pages/EditionForm';
import { Authors } from './pages/Authors';
import { AuthorForm } from './pages/AuthorForm';
import { Badges } from './pages/Badges';
import { BadgeForm } from './pages/BadgeForm';
import { Publishers } from './pages/Publishers';
import { PublisherForm } from './pages/PublisherForm';
import { SystemSettings } from './pages/SystemSettings';
import './App.css';

// Protected Layout wrapper to guard dashboard routes
const DashboardLayout = () => {
  const { currentUser } = useDashboard();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Header onOpenSidebar={() => setSidebarOpen(true)} />
        <main className="main-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

// Guest Guard wrapper to block authenticated users from accessing login page
const PublicOnlyRoute = () => {
  const { currentUser } = useDashboard();

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
};

function App() {
  return (
    <DashboardProvider>
      <BrowserRouter>
        <Routes>
          {/* Public Login Route */}
          <Route element={<PublicOnlyRoute />}>
            <Route path="/login" element={<Login />} />
          </Route>

          {/* Protected Dashboard Routes */}
          <Route element={<DashboardLayout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/orders/:id" element={<Orders />} />
            <Route path="/refunds" element={<Refunds />} />
            <Route path="/products" element={<Products />} />
            <Route path="/products/add" element={<ProductForm />} />
            <Route path="/products/edit/:id" element={<ProductForm />} />
            <Route path="/products/:bookId/editions/add" element={<EditionForm />} />
            <Route path="/products/:bookId/editions/edit/:editionId" element={<EditionForm />} />
            <Route path="/customers" element={<Customers />} />
            <Route path="/staff" element={<Staff />} />
            <Route path="/vouchers" element={<Vouchers />} />
            <Route path="/vouchers/new" element={<VoucherForm />} />
            <Route path="/vouchers/edit/:id" element={<VoucherForm />} />
            <Route path="/flash-sales" element={<FlashSales />} />
            <Route path="/flash-sales/new" element={<FlashSaleForm />} />
            <Route path="/flash-sales/edit/:id" element={<FlashSaleForm />} />
            <Route path="/reviews" element={<Reviews />} />
            <Route path="/posts" element={<Posts />} />
            <Route path="/categories" element={<Categories />} />
            <Route path="/authors" element={<Authors />} />
            <Route path="/authors/new" element={<AuthorForm />} />
            <Route path="/authors/edit/:id" element={<AuthorForm />} />
            <Route path="/badges" element={<Badges />} />
            <Route path="/badges/new" element={<BadgeForm />} />
            <Route path="/badges/edit/:id" element={<BadgeForm />} />
            <Route path="/publishers" element={<Publishers />} />
            <Route path="/publishers/new" element={<PublisherForm />} />
            <Route path="/publishers/edit/:id" element={<PublisherForm />} />
            <Route path="/system-settings" element={<SystemSettings />} />
          </Route>

          {/* Catch-all Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </DashboardProvider>
  );
}

export default App;
