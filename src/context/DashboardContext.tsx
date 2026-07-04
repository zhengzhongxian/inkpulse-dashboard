import React, { createContext, useContext, useState } from 'react';
import type { ReactNode } from 'react';
import { internalLoginApi, logOutClient, logoutApi } from '../api/auth';
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
  
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; role: string } | null>(() => {
    const token = localStorage.getItem('inkpulse_access_token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return {
          name: payload.username === 'admin' ? 'Nguyễn Văn Admin' : 'Lê Thị Thu',
          email: payload.username + '@inkpulse.com',
          role: payload.roles && payload.roles.includes('ADMIN') ? 'Admin' : 'Staff'
        };
      } catch (e) {
        return null;
      }
    }
    return null;
  });

  const login = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await internalLoginApi({ login: username, password });
      const data = response.data;
      if (data && data.success && data.data) {
        const { accessToken, refreshToken } = data.data;
        localStorage.setItem('inkpulse_access_token', accessToken);
        localStorage.setItem('inkpulse_refresh_token', refreshToken);

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
    const refreshToken = localStorage.getItem('inkpulse_refresh_token');
    if (refreshToken) {
      try {
        await logoutApi(refreshToken);
      } catch (e) {
        console.error('Failed to logout from backend', e);
      }
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
