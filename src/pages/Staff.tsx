import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbPlus, TbSearch, TbUserCheck, TbUserMinus } from 'react-icons/tb';
import { toast } from '../utils/toast';

export const Staff: React.FC = () => {
  const { staff, addStaff, updateStaffStatus } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'Admin' | 'Staff'>('Staff');

  const filteredStaff = staff.filter(s => {
    return s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
           s.email.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    addStaff({
      name: name.trim(),
      email: email.trim(),
      role: role,
      status: 'ACTIVE'
    });
    
    setIsFormOpen(false);
    setName('');
    setEmail('');
    setRole('Staff');
    toast.success('Thành công', 'Đã thêm nhân sự mới vào hệ thống.');
  };

  return (
    <div className="staff-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Quản trị viên & Nhân viên</h1>
          <p className="view-subtitle">Danh sách nhân sự quản lý vận hành của hệ thống InkPulse.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <TbPlus /> Thêm nhân sự
        </button>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo họ tên hoặc địa chỉ email..." 
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
              <th>Quyền hạn</th>
              <th>Ngày gia nhập</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredStaff.length > 0 ? (
              filteredStaff.map(s => (
                <tr key={s.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{s.id}</td>
                  <td style={{ fontWeight: '600', color: '#ffffff' }}>{s.name}</td>
                  <td>{s.email}</td>
                  <td>
                    <span className={`badge ${s.role === 'Admin' ? 'completed' : 'processing'}`}>
                      {s.role}
                    </span>
                  </td>
                  <td>{s.joinedDate}</td>
                  <td>
                    <span className={`badge ${s.status === 'ACTIVE' ? 'completed' : 'cancelled'}`}>
                      {s.status === 'ACTIVE' ? 'Đang làm việc' : 'Nghỉ việc'}
                    </span>
                  </td>
                  <td>
                    {s.status === 'ACTIVE' ? (
                      <button 
                        className="action-btn-status deactivate" 
                        onClick={() => updateStaffStatus(s.id, 'INACTIVE')}
                        title="Vô hiệu hóa"
                      >
                        <TbUserMinus /> Vô hiệu hóa
                      </button>
                    ) : (
                      <button 
                        className="action-btn-status activate" 
                        onClick={() => updateStaffStatus(s.id, 'ACTIVE')}
                        title="Kích hoạt lại"
                      >
                        <TbUserCheck /> Kích hoạt lại
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  Không tìm thấy nhân viên nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Staff Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Thêm nhân viên mới</h2>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-field">
                <label>Họ và Tên *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required placeholder="Nguyễn Văn B..." />
              </div>

              <div className="form-field">
                <label>Email liên kết *</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="username@inkpulse.com..." />
              </div>

              <div className="form-field">
                <label>Vai trò hệ thống</label>
                <select value={role} onChange={(e) => setRole(e.target.value as any)}>
                  <option value="Staff">Staff (Nhân viên)</option>
                  <option value="Admin">Admin (Quản trị viên)</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Thêm mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

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

        .action-btn-status.deactivate {
          color: var(--accent-red);
        }

        .action-btn-status.deactivate:hover {
          background-color: rgba(239, 68, 68, 0.1);
          border-color: var(--accent-red);
        }

        .action-btn-status.activate {
          color: var(--accent-green);
        }

        .action-btn-status.activate:hover {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: var(--accent-green);
        }

        /* Modal Overlay and Modal Card are styled globally in index.css and Products.tsx */
      `}</style>
    </div>
  );
};
export default Staff;
