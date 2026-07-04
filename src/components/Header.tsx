import React from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useNavigate } from 'react-router-dom';
import { TbMenu2, TbLogout, TbBell } from 'react-icons/tb';
import { toast } from '../utils/toast';

interface HeaderProps {
  onOpenSidebar: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenSidebar }) => {
  const { currentUser, logout } = useDashboard();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const getInitials = (name: string) => {
    if (!name) return 'U';
    const parts = name.split(' ');
    return parts[parts.length - 1].charAt(0).toUpperCase();
  };

  return (
    <header className="navbar-top">
      <div className="navbar-left">
        <button className="mobile-menu-trigger" onClick={onOpenSidebar}>
          <TbMenu2 />
        </button>
      </div>

      <div className="navbar-right">
        <button className="nav-notification-btn" onClick={() => toast.info('Thông báo', 'Chưa có thông báo mới!')}>
          <TbBell />
          <span className="notif-badge"></span>
        </button>

        {currentUser && (
          <div className="user-profile-menu">
            <div className="avatar-circle">
              {getInitials(currentUser.name)}
            </div>
            <div className="user-meta">
              <span className="user-name">{currentUser.name}</span>
              <span className="user-role">{currentUser.role}</span>
            </div>
            <button className="logout-btn" onClick={handleLogout} title="Đăng xuất">
              <TbLogout />
            </button>
          </div>
        )}
      </div>

      {/* Styled JSX */}
      <style>{`
        .navbar-top {
          height: 70px;
          background-color: var(--bg-secondary);
          border-bottom: 1px solid var(--border);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 24px;
          position: sticky;
          top: 0;
          z-index: 999;
          margin-left: 220px; /* Offset for sidebar */
        }

        @media (max-width: 992px) {
          .navbar-top {
            margin-left: 0;
            padding: 0 16px;
          }
        }

        .navbar-left {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .mobile-menu-trigger {
          display: none;
          background: none;
          border: none;
          color: var(--text-main);
          font-size: 24px;
        }

        @media (max-width: 992px) {
          .mobile-menu-trigger {
            display: flex;
            align-items: center;
          }
        }

        .navbar-search {
          display: flex;
          align-items: center;
          position: relative;
        }

        .navbar-search input {
          padding: 8px 12px 8px 36px;
          font-size: 13.5px;
          background-color: var(--bg-primary);
          border: 1px solid var(--border);
          width: 240px;
        }

        @media (max-width: 576px) {
          .navbar-search {
            display: none;
          }
        }

        .search-icon {
          position: absolute;
          left: 12px;
          color: var(--text-muted);
          font-size: 18px;
        }

        .navbar-right {
          display: flex;
          align-items: center;
          gap: 20px;
        }

        .nav-notification-btn {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 22px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .nav-notification-btn:hover {
          color: var(--primary);
        }

        .notif-badge {
          position: absolute;
          top: 2px;
          right: 2px;
          width: 8px;
          height: 8px;
          background-color: var(--primary);
          border-radius: 50%;
        }

        .user-profile-menu {
          display: flex;
          align-items: center;
          gap: 12px;
          border-left: 1px solid var(--border);
          padding-left: 20px;
        }

        .avatar-circle {
          width: 38px;
          height: 38px;
          background: linear-gradient(135deg, var(--primary), var(--primary-hover));
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #ffffff;
          font-weight: 700;
          font-size: 15px;
        }

        .user-meta {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        @media (max-width: 576px) {
          .user-meta {
            display: none;
          }
        }

        .user-name {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
        }

        .user-role {
          font-size: 11px;
          font-weight: 600;
          color: var(--primary);
          text-transform: uppercase;
        }

        .logout-btn {
          background: none;
          border: none;
          color: var(--accent-red);
          font-size: 20px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
          border-radius: var(--radius-sm);
        }

        .logout-btn:hover {
          background-color: rgba(239, 68, 68, 0.1);
        }
      `}</style>
    </header>
  );
};
export default Header;
