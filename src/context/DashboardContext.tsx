import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { internalLoginApi, logOutClient, logoutApi, setAccessToken, refreshSession } from '../api/auth';
import type {
  BookProduct,
  Order,
  Customer,
  Staff,
  Voucher,
  Review,
  Post
} from '../utils/mockData';

import {
  initialProducts,
  initialOrders,
  initialCustomers,
  initialStaff,
  initialVouchers,
  initialReviews,
  initialPosts
} from '../utils/mockData';

interface DashboardContextType {
  products: BookProduct[];
  orders: Order[];
  customers: Customer[];
  staff: Staff[];
  vouchers: Voucher[];
  reviews: Review[];
  posts: Post[];
  currentUser: { name: string; email: string; role: string } | null;
  
  // Auth actions
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  
  // Product actions
  addProduct: (product: Omit<BookProduct, 'id'>) => void;
  updateProduct: (product: BookProduct) => void;
  deleteProduct: (id: string) => void;
  
  // Order actions
  updateOrderStatus: (id: string, status: Order['status']) => void;
  
  // Customer actions
  updateCustomerStatus: (id: string, status: Customer['status']) => void;
  
  // Staff actions
  addStaff: (member: Omit<Staff, 'id' | 'joinedDate'>) => void;
  updateStaffStatus: (id: string, status: Staff['status']) => void;
  
  // Voucher actions
  addVoucher: (voucher: Omit<Voucher, 'id'>) => void;
  toggleVoucherStatus: (id: string) => void;
  
  // Post actions
  addPost: (post: Omit<Post, 'id' | 'date'>) => void;
  updatePostStatus: (id: string, status: Post['status']) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export const DashboardProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [products, setProducts] = useState<BookProduct[]>(initialProducts);
  const [orders, setOrders] = useState<Order[]>(initialOrders);
  const [customers, setCustomers] = useState<Customer[]>(initialCustomers);
  const [staff, setStaff] = useState<Staff[]>(initialStaff);
  const [vouchers, setVouchers] = useState<Voucher[]>(initialVouchers);
  const [reviews] = useState<Review[]>(initialReviews);
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [initializing, setInitializing] = useState(true);

  useEffect(() => {
    const initSession = async () => {
      try {
        const token = await refreshSession();
        if (token) {
          const payload = JSON.parse(atob(token.split('.')[1]));
          setCurrentUser({
            name: payload.username === 'admin' ? 'Nguyễn Văn Admin' : 'Lê Thị Thu',
            email: payload.username + '@inkpulse.com',
            role: payload.roles && (payload.roles.includes('ADMIN') || payload.roles.includes('Admin')) ? 'Admin' : 'Staff'
          });
        }
      } catch (e) {
        console.error('Silent refresh failed on init:', e);
      } finally {
        setInitializing(false);
      }
    };
    initSession();
  }, []);

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await internalLoginApi({ login: username, password });
      const data = response.data;
      if (data && data.success && data.data) {
        const { accessToken } = data.data;
        setAccessToken(accessToken);

        const payload = JSON.parse(atob(accessToken.split('.')[1]));
        setCurrentUser({
          name: payload.username === 'admin' ? 'Nguyễn Văn Admin' : 'Lê Thị Thu',
          email: payload.username + '@inkpulse.com',
          role: payload.roles && (payload.roles.includes('ADMIN') || payload.roles.includes('Admin')) ? 'Admin' : 'Staff'
        });
        return { success: true };
      } else {
        return { success: false, error: data.message || 'Tài khoản hoặc mật khẩu không chính xác.' };
      }
    } catch (e: any) {
      console.error('Login error', e);
      const errorMsg = e.response?.data?.message || 'Không thể kết nối đến máy chủ xác thực.';
      return { success: false, error: errorMsg };
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch (e) {
      console.error('Failed to logout from backend', e);
    }
    logOutClient();
  };

  const addProduct = (prod: Omit<BookProduct, 'id'>) => {
    const newId = `B-00${products.length + 1}`;
    setProducts([...products, { ...prod, id: newId }]);
  };

  const updateProduct = (updated: BookProduct) => {
    setProducts(products.map(p => p.id === updated.id ? updated : p));
  };

  const deleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
  };

  const updateOrderStatus = (id: string, status: Order['status']) => {
    setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
  };

  const updateCustomerStatus = (id: string, status: Customer['status']) => {
    setCustomers(customers.map(c => c.id === id ? { ...c, status } : c));
  };

  const addStaff = (member: Omit<Staff, 'id' | 'joinedDate'>) => {
    const newId = `ST-00${staff.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    setStaff([...staff, { ...member, id: newId, joinedDate: today }]);
  };

  const updateStaffStatus = (id: string, status: Staff['status']) => {
    setStaff(staff.map(s => s.id === id ? { ...s, status } : s));
  };

  const addVoucher = (v: Omit<Voucher, 'id'>) => {
    const newId = `V-00${vouchers.length + 1}`;
    setVouchers([...vouchers, { ...v, id: newId }]);
  };

  const toggleVoucherStatus = (id: string) => {
    setVouchers(vouchers.map(v => v.id === id ? { ...v, status: v.status === 'ACTIVE' ? 'EXPIRED' : 'ACTIVE' } : v));
  };

  const addPost = (p: Omit<Post, 'id' | 'date'>) => {
    const newId = `P-00${posts.length + 1}`;
    const today = new Date().toISOString().split('T')[0];
    setPosts([...posts, { ...p, id: newId, date: today }]);
  };

  const updatePostStatus = (id: string, status: Post['status']) => {
    setPosts(posts.map(p => p.id === id ? { ...p, status } : p));
  };

  if (initializing) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#0a0a0a', position: 'relative' }}>
        <div style={{ textAlign: 'center' }}>
          <img src="/favicon.svg" alt="Loading..." style={{ width: '96px', height: '96px', animation: 'pulse-fav 1.5s infinite ease-in-out' }} />
          <style>{`
            @keyframes pulse-fav {
              0% { transform: scale(0.85); opacity: 0.6; }
              50% { transform: scale(1.05); opacity: 1; }
              100% { transform: scale(0.85); opacity: 0.6; }
            }
          `}</style>
        </div>
        <div style={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)', opacity: 0.8, height: '48px', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/logo.png" alt="InkPulse Logo" style={{ height: '100px', maxWidth: '220px', objectFit: 'contain', marginTop: '-26px', marginBottom: '-30px' }} />
        </div>
      </div>
    );
  }

  return (
    <DashboardContext.Provider value={{
      products,
      orders,
      customers,
      staff,
      vouchers,
      reviews,
      posts,
      currentUser,
      login,
      logout,
      addProduct,
      updateProduct,
      deleteProduct,
      updateOrderStatus,
      updateCustomerStatus,
      addStaff,
      updateStaffStatus,
      addVoucher,
      toggleVoucherStatus,
      addPost,
      updatePostStatus
    }}>
      {children}
    </DashboardContext.Provider>
  );
};

export const useDashboard = () => {
  const context = useContext(DashboardContext);
  if (!context) {
    throw new Error('useDashboard must be used within a DashboardProvider');
  }
  return context;
};
