import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbSearch, TbLock, TbLockOpen } from 'react-icons/tb';

export const Customers: React.FC = () => {
  const { customers, updateCustomerStatus } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const filteredCustomers = customers.filter(c => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           c.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.phone.includes(searchTerm);
  });

  return (
    <div className="customers-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Quản lý Khách hàng</h1>
          <p className="view-subtitle">Danh sách thành viên đăng ký mua sách trên hệ thống InkPulse.</p>
        </div>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo họ tên, email hoặc số điện thoại..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Họ và Tên</th>
              <th>Email</th>
              <th>Số điện thoại</th>
              <th>Ngày tham gia</th>
              <th>Số đơn hàng</th>
              <th>Tổng chi tiêu</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.length > 0 ? (
              filteredCustomers.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{c.id}</td>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{c.name}</td>
                  <td>{c.email}</td>
                  <td>{c.phone}</td>
                  <td>{c.joinedDate}</td>
                  <td style={{ fontWeight: '600' }}>{c.ordersCount} đơn</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{formatMoney(c.totalSpent)}</td>
                  <td>
                    <span className={`badge ${c.status === 'ACTIVE' ? 'completed' : 'cancelled'}`}>
                      {c.status === 'ACTIVE' ? 'Hoạt động' : 'Bị khóa'}
                    </span>
                  </td>
                  <td>
                    {c.status === 'ACTIVE' ? (
                      <button 
                        className="action-btn-status block" 
                        onClick={() => updateCustomerStatus(c.id, 'BLOCKED')}
                        title="Khóa tài khoản"
                      >
                        <TbLock /> Khóa
                      </button>
                    ) : (
                      <button 
                        className="action-btn-status unblock" 
                        onClick={() => updateCustomerStatus(c.id, 'ACTIVE')}
                        title="Mở khóa tài khoản"
                      >
                        <TbLockOpen /> Kích hoạt
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  Không tìm thấy khách hàng nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <style>{`
        .action-btn-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid var(--border);
          background-color: var(--bg-hover);
        }

        .action-btn-status.block {
          color: var(--accent-red);
        }

        .action-btn-status.block:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: var(--accent-red);
        }

        .action-btn-status.unblock {
          color: var(--accent-green);
        }

        .action-btn-status.unblock:hover {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: var(--accent-green);
        }
      `}</style>
    </div>
  );
};
export default Customers;
