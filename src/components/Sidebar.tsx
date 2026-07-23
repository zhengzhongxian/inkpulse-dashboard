import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useDashboard } from '../context/DashboardContext';
import {
  TbDashboard,
  TbReceipt,
  TbMilk,
  TbUser,
  TbUserHeart,
  TbNews,
  TbChevronDown,
  TbChevronUp,
  TbSettings
} from 'react-icons/tb';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { currentUser } = useDashboard();
  const [expandedMenus, setExpandedMenus] = useState<{ [key: string]: boolean }>({
    orders: true,
    products: true
  });

  const toggleMenu = (menuKey: string) => {
    setExpandedMenus(prev => ({ ...prev, [menuKey]: !prev[menuKey] }));
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
      <div className="sidebar-header">
        <div className="logo-area">
          <img src="/logo.png" alt="InkPulse Logo" className="logo-img" />
        </div>
        <button className="mobile-close" onClick={onClose}>&times;</button>
      </div>

      <nav className="sidebar-nav">
        {/* Trang chủ */}
        <NavLink
          to="/"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <TbDashboard className="nav-icon" />
          <span>Trang chủ</span>
        </NavLink>

        {/* Đơn hàng Dropdown */}
        <div className="nav-group">
          <div className="nav-group-header" onClick={() => toggleMenu('orders')}>
            <div className="header-left">
              <TbReceipt className="nav-icon" />
              <span>Đơn hàng</span>
            </div>
            {expandedMenus.orders ? <TbChevronUp className="chevron" /> : <TbChevronDown className="chevron" />}
          </div>
          {expandedMenus.orders && (
            <div className="nav-group-items">
              <NavLink
                to="/orders"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Danh sách đơn</span>
              </NavLink>
              <NavLink
                to="/vouchers"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Mã giảm giá</span>
              </NavLink>
              <NavLink
                to="/flash-sales"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Flash Sale</span>
              </NavLink>
              <NavLink
                to="/refunds"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Phiếu hoàn tiền</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Sản phẩm Dropdown */}
        <div className="nav-group">
          <div className="nav-group-header" onClick={() => toggleMenu('products')}>
            <div className="header-left">
              <TbMilk className="nav-icon" />
              <span>Sản phẩm</span>
            </div>
            {expandedMenus.products ? <TbChevronUp className="chevron" /> : <TbChevronDown className="chevron" />}
          </div>
          {expandedMenus.products && (
            <div className="nav-group-items">
              <NavLink
                to="/products"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Danh sách sách</span>
              </NavLink>
              <NavLink
                to="/reviews"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Đánh giá sách</span>
              </NavLink>
              <NavLink
                to="/categories"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Danh mục sách</span>
              </NavLink>
              <NavLink
                to="/authors"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Tác giả</span>
              </NavLink>
              <NavLink
                to="/badges"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Nhãn dán</span>
              </NavLink>
              <NavLink
                to="/publishers"
                className={({ isActive }) => `sub-nav-item ${isActive ? 'active' : ''}`}
                onClick={onClose}
              >
                <span className="bullet"></span>
                <span>Nhà xuất bản</span>
              </NavLink>
            </div>
          )}
        </div>

        {/* Khách hàng */}
        <NavLink
          to="/customers"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <TbUserHeart className="nav-icon" />
          <span>Khách hàng</span>
        </NavLink>

        {/* Nhân viên (Chỉ Admin mới xem được) */}
        {isAdmin && (
          <NavLink
            to="/staff"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <TbUser className="nav-icon" />
            <span>Nhân viên</span>
          </NavLink>
        )}

        {/* Bài viết */}
        <NavLink
          to="/posts"
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          onClick={onClose}
        >
          <TbNews className="nav-icon" />
          <span>Bài viết</span>
        </NavLink>

        {/* Cấu hình hệ thống */}
        {isAdmin && (
          <NavLink
            to="/system-settings"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={onClose}
          >
            <TbSettings className="nav-icon" />
            <span>Cấu hình hệ thống</span>
          </NavLink>
        )}
      </nav>

      {/* CSS For Sidebar styling inside this component or index.css */}
      <style>{`
        .sidebar {
          width: 220px;
          height: 100vh;
          position: fixed;
          top: 0;
          left: 0;
          background-color: var(--bg-secondary);
          border-right: 1px solid var(--border);
          display: flex;
          flex-direction: column;
          z-index: 1000;
          transition: transform 0.3s ease;
        }
        
        @media (max-width: 992px) {
          .sidebar {
            transform: translateX(-100%);
          }
          .sidebar.open {
            transform: translateX(0);
          }
        }

        .sidebar-header {
          padding: 20px 24px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-bottom: 1px solid var(--border);
          position: relative;
        }

        .logo-area {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 48px;
          overflow: hidden;
        }

        .logo-img {
          height: 100px;
          max-width: 220px;
          margin-top: -26px;
          margin-bottom: -30px;
          object-fit: contain;
        }

        .logo-text {
          font-family: var(--font-title);
          font-style: italic;
          font-size: 20px;
          font-weight: 700;
          color: #ffffff;
        }

        .logo-text span {
          color: var(--primary);
        }

        .mobile-close {
          position: absolute;
          right: 20px;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 28px;
          display: none;
        }

        @media (max-width: 992px) {
          .mobile-close {
            display: block;
          }
        }

        .sidebar-nav {
          flex: 1;
          padding: 24px 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          overflow-y: auto;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-weight: 500;
          font-size: 14.5px;
          transition: var(--transition);
          white-space: nowrap;
        }

        .nav-item:hover, .nav-item.active {
          color: #ffffff;
          background-color: var(--bg-hover);
        }

        .nav-item.active {
          background-color: var(--primary);
          color: #ffffff;
        }

        .nav-icon {
          font-size: 20px;
          flex-shrink: 0;
        }

        /* Nav Groups */
        .nav-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .nav-group-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px 16px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-weight: 500;
          font-size: 14.5px;
          cursor: pointer;
          transition: var(--transition);
          user-select: none;
          white-space: nowrap;
        }

        .nav-group-header:hover {
          color: #ffffff;
          background-color: var(--bg-hover);
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .chevron {
          font-size: 16px;
        }

        .nav-group-items {
          padding-left: 8px;
          display: flex;
          flex-direction: column;
          gap: 2px;
          margin-left: 14px;
          margin-top: 4px;
          margin-bottom: 4px;
        }

        .sub-nav-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 9px 12px;
          border-radius: var(--radius-sm);
          color: var(--text-muted);
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
          white-space: nowrap;
          position: relative;
        }

        .sub-nav-item:hover {
          color: #ffffff;
          background-color: var(--bg-hover);
        }

        .sub-nav-item.active {
          font-weight: 600;
          color: var(--primary);
          background-color: rgba(246, 99, 152, 0.1);
        }

        .bullet {
          width: 6px;
          height: 6px;
          background-color: var(--text-light);
          border-radius: 1px;
          flex-shrink: 0;
          transition: var(--transition);
        }

        .sub-nav-item:hover .bullet {
          background-color: #ffffff;
        }

        .sub-nav-item.active .bullet {
          background-color: var(--primary);
          transform: scale(1.2);
          border-radius: 50%;
        }`}</style>
    </aside>
  );
};
export default Sidebar;
