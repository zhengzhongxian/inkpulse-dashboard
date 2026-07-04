import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbPlus, TbSearch, TbGift, TbBan, TbCheck } from 'react-icons/tb';
import { toast } from '../utils/toast';

export const Vouchers: React.FC = () => {
  const { vouchers, addVoucher, toggleVoucherStatus } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [code, setCode] = useState('');
  const [discount, setDiscount] = useState(10);
  const [description, setDescription] = useState('');
  const [expiryDate, setExpiryDate] = useState('');

  const filteredVouchers = vouchers.filter(v => {
    return v.code.toLowerCase().includes(searchTerm.toLowerCase()) || 
           v.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !description.trim() || !expiryDate) {
      toast.warning('Thiếu thông tin', 'Vui lòng điền đầy đủ thông tin.');
      return;
    }

    addVoucher({
      code: code.trim().toUpperCase(),
      discount: Number(discount),
      description: description.trim(),
      status: 'ACTIVE',
      expiryDate: expiryDate
    });

    setIsFormOpen(false);
    setCode('');
    setDiscount(10);
    setDescription('');
    setExpiryDate('');
    toast.success('Thành công', 'Đã tạo mã giảm giá mới.');
  };

  return (
    <div className="vouchers-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Mã giảm giá (Vouchers)</h1>
          <p className="view-subtitle">Tạo và quản lý các chiến dịch mã khuyến mãi bán hàng.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <TbPlus /> Tạo mã giảm giá
        </button>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm kiếm mã code hoặc mô tả khuyến mãi..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="vouchers-grid">
        {filteredVouchers.map(v => (
          <div key={v.id} className={`voucher-card card ${v.status === 'EXPIRED' ? 'expired-card' : ''}`}>
            <div className="voucher-icon-box">
              <TbGift />
            </div>
            <div className="voucher-body">
              <div className="voucher-header-line">
                <span className="v-code">{v.code}</span>
                <span className={`badge ${v.status === 'ACTIVE' ? 'completed' : 'cancelled'}`}>
                  {v.status === 'ACTIVE' ? 'Hoạt động' : 'Hết hạn'}
                </span>
              </div>
              <span className="v-discount">
                {v.description.includes('%') || v.discount <= 100 ? `Giảm ${v.discount}%` : `Giảm ${v.discount.toLocaleString()}đ`}
              </span>
              <p className="v-desc">{v.description}</p>
              <div className="v-footer">
                <span className="v-expiry">Hạn dùng: {v.expiryDate}</span>
                <button 
                  className={`v-action-btn ${v.status === 'ACTIVE' ? 'deactivate' : 'activate'}`}
                  onClick={() => toggleVoucherStatus(v.id)}
                >
                  {v.status === 'ACTIVE' ? <><TbBan /> Khóa mã</> : <><TbCheck /> Kích hoạt</>}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Add Voucher Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Tạo mã giảm giá mới</h2>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-field">
                <label>Mã Code (viết liền, viết hoa) *</label>
                <input type="text" value={code} onChange={(e) => setCode(e.target.value)} required placeholder="Mã ví dụ: SALE30, SUMMER10..." />
              </div>

              <div className="form-field">
                <label>Giá trị giảm (Nhập % hoặc số tiền cụ thể) *</label>
                <input type="number" value={discount} onChange={(e) => setDiscount(Number(e.target.value))} required min={1} />
              </div>

              <div className="form-field">
                <label>Mô tả chiến dịch khuyến mãi *</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} required placeholder="Ví dụ: Giảm 10% cho đơn từ 200k..." />
              </div>

              <div className="form-field">
                <label>Ngày hết hạn *</label>
                <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} required />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .vouchers-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
          gap: 20px;
        }

        .voucher-card {
          display: flex;
          gap: 16px;
          padding: 20px;
          text-align: left;
          position: relative;
          overflow: hidden;
        }

        .voucher-card::before {
          content: '';
          position: absolute;
          left: 0;
          top: 0;
          bottom: 0;
          width: 5px;
          background-color: var(--primary);
        }

        .expired-card::before {
          background-color: var(--text-light);
        }

        .expired-card {
          opacity: 0.6;
        }

        .voucher-icon-box {
          font-size: 32px;
          color: var(--primary);
          background-color: var(--primary-light);
          width: 56px;
          height: 56px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .expired-card .voucher-icon-box {
          color: var(--text-light);
          background-color: var(--bg-hover);
        }

        .voucher-body {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }

        .voucher-header-line {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .v-code {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: 0.5px;
        }

        .v-discount {
          font-size: 20px;
          font-weight: 800;
          color: var(--primary);
        }

        .expired-card .v-discount {
          color: var(--text-muted);
        }

        .v-desc {
          font-size: 13px;
          color: var(--text-muted);
          line-height: 1.4;
        }

        .v-footer {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-top: 1px dashed var(--border);
          padding-top: 12px;
          margin-top: 6px;
        }

        .v-expiry {
          font-size: 11.5px;
          color: var(--text-light);
          font-weight: 500;
        }

        .v-action-btn {
          background: none;
          border: none;
          font-size: 12px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }

        .v-action-btn.deactivate {
          color: var(--accent-red);
        }

        .v-action-btn.deactivate:hover {
          text-decoration: underline;
        }

        .v-action-btn.activate {
          color: var(--accent-green);
        }

        .v-action-btn.activate:hover {
          text-decoration: underline;
        }
      `}</style>
    </div>
  );
};
export default Vouchers;
