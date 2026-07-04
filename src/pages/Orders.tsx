import React, { useState, useEffect } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useSearchParams } from 'react-router-dom';
import { TbSearch, TbAlertCircle } from 'react-icons/tb';

export const Orders: React.FC = () => {
  const { orders, updateOrderStatus } = useDashboard();
  const [searchParams, setSearchParams] = useSearchParams();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);

  // Read URL search param for direct linking (e.g. from Dashboard Home)
  useEffect(() => {
    const idParam = searchParams.get('id');
    if (idParam) {
      setSelectedOrderId(idParam);
    } else if (orders.length > 0 && !selectedOrderId) {
      setSelectedOrderId(orders[0].id);
    }
  }, [searchParams, orders]);

  const selectOrder = (id: string) => {
    setSelectedOrderId(id);
    setSearchParams({ id });
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Filter orders
  const filteredOrders = orders.filter(o => {
    const matchesSearch = o.id.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          o.phone.includes(searchTerm);
    const matchesStatus = statusFilter === 'ALL' || o.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const selectedOrder = orders.find(o => o.id === selectedOrderId);

  return (
    <div className="orders-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Quản lý Đơn hàng</h1>
          <p className="view-subtitle">Xử lý, phê duyệt và giao vận đơn hàng sách từ khách hàng.</p>
        </div>
      </div>

      <div className="orders-layout-grid">
        {/* Left Side: Order List */}
        <div className="orders-list-sec card">
          <div className="list-filters-row">
            <div className="search-wrap">
              <TbSearch className="search-icon" />
              <input 
                type="text" 
                placeholder="Tìm mã đơn, tên khách hàng, SĐT..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select 
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="filter-select"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="PROCESSING">Đang đóng gói/giao</option>
              <option value="COMPLETED">Đã hoàn thành</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>
          </div>

          <div className="table-container" style={{ border: 'none' }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>Mã đơn</th>
                  <th>Khách hàng</th>
                  <th>Tổng tiền</th>
                  <th>Trạng thái</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length > 0 ? (
                  filteredOrders.map(o => (
                    <tr 
                      key={o.id} 
                      onClick={() => selectOrder(o.id)}
                      className={selectedOrderId === o.id ? 'row-selected' : ''}
                    >
                      <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{o.id}</td>
                      <td>
                        <div className="customer-cell">
                          <span className="c-name">{o.customerName}</span>
                          <span className="c-date">{o.date}</span>
                        </div>
                      </td>
                      <td>{formatMoney(o.total)}</td>
                      <td>
                        <span className={`badge ${o.status.toLowerCase()}`}>
                          {o.status === 'PENDING' && 'Chờ duyệt'}
                          {o.status === 'PROCESSING' && 'Đang xử lý'}
                          {o.status === 'COMPLETED' && 'Hoàn thành'}
                          {o.status === 'CANCELLED' && 'Đã hủy'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                      Không tìm thấy đơn hàng nào phù hợp.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Side: Order Details */}
        <div className="order-detail-sec card">
          {selectedOrder ? (
            <div className="detail-wrap">
              <div className="detail-header">
                <h3>Chi tiết đơn: <span className="highlight-text">{selectedOrder.id}</span></h3>
                <span className="detail-date">{selectedOrder.date}</span>
              </div>

              {/* Status Manager */}
              <div className="status-manager-box">
                <label className="section-title">Trạng thái hiện tại</label>
                <div className="status-selector-row">
                  <span className={`badge ${selectedOrder.status.toLowerCase()} large-badge`}>
                    {selectedOrder.status === 'PENDING' && 'Chờ xác nhận'}
                    {selectedOrder.status === 'PROCESSING' && 'Đang đóng gói/giao hàng'}
                    {selectedOrder.status === 'COMPLETED' && 'Đã giao / Hoàn thành'}
                    {selectedOrder.status === 'CANCELLED' && 'Đã hủy đơn'}
                  </span>
                  
                  <select 
                    value={selectedOrder.status}
                    onChange={(e) => updateOrderStatus(selectedOrder.id, e.target.value as any)}
                    className="status-action-select"
                  >
                    <option value="PENDING">Chuyển sang: Chờ duyệt</option>
                    <option value="PROCESSING">Chuyển sang: Đang xử lý</option>
                    <option value="COMPLETED">Chuyển sang: Hoàn thành</option>
                    <option value="CANCELLED">Chuyển sang: Hủy đơn</option>
                  </select>
                </div>
              </div>

              {/* Customer and Recipient details */}
              <div className="detail-section">
                <h4 className="section-title">Thông tin giao nhận</h4>
                <div className="info-item">
                  <span className="lbl">Người nhận:</span>
                  <span className="val">{selectedOrder.customerName}</span>
                </div>
                <div className="info-item">
                  <span className="lbl">Điện thoại:</span>
                  <span className="val">{selectedOrder.phone}</span>
                </div>
                <div className="info-item">
                  <span className="lbl">Email:</span>
                  <span className="val">{selectedOrder.email}</span>
                </div>
                <div className="info-item">
                  <span className="lbl">Địa chỉ nhận:</span>
                  <span className="val address-val">{selectedOrder.address}</span>
                </div>
              </div>

              {/* Items Table */}
              <div className="detail-section">
                <h4 className="section-title">Sách đã mua</h4>
                <div className="order-items-list">
                  {selectedOrder.items.map((item, idx) => (
                    <div key={idx} className="order-item-row">
                      <div className="item-title-col">
                        <span className="i-title">{item.title}</span>
                        <span className="i-qty">x{item.quantity}</span>
                      </div>
                      <span className="i-price">{formatMoney(item.price * item.quantity)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="detail-total-section">
                <div className="total-row">
                  <span>Tạm tính</span>
                  <span>{formatMoney(selectedOrder.total)}</span>
                </div>
                <div className="total-row">
                  <span>Phí ship (GHN)</span>
                  <span>Miễn phí</span>
                </div>
                <div className="total-row grand-total">
                  <span>Tổng tiền thanh toán</span>
                  <span>{formatMoney(selectedOrder.total)}</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="no-order-selected">
              <TbAlertCircle style={{ fontSize: '48px', color: 'var(--text-light)', marginBottom: '16px' }} />
              <p>Chọn một đơn hàng từ danh sách bên trái để hiển thị chi tiết.</p>
            </div>
          )}
        </div>
      </div>

      {/* CSS Styles */}
      <style>{`
        .orders-layout-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
          align-items: start;
        }

        @media (max-width: 992px) {
          .orders-layout-grid {
            grid-template-columns: 1fr;
          }
        }

        .list-filters-row {
          display: flex;
          gap: 12px;
          margin-bottom: 20px;
        }

        @media (max-width: 576px) {
          .list-filters-row {
            flex-direction: column;
          }
        }

        .search-wrap {
          flex: 1;
          position: relative;
        }

        .search-wrap input {
          width: 100%;
          padding: 10px 12px 10px 38px;
          font-size: 14px;
        }

        .filter-select {
          padding: 10px 14px;
          font-size: 14px;
          width: 180px;
        }

        @media (max-width: 576px) {
          .filter-select {
            width: 100%;
          }
        }

        /* Order List table style enhancements */
        .row-selected td {
          background-color: var(--bg-hover) !important;
          border-left: 3px solid var(--primary);
        }

        .customer-cell {
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .c-name {
          font-weight: 600;
          color: #ffffff;
        }

        .c-date {
          font-size: 11px;
          color: var(--text-light);
          margin-top: 2px;
        }

        /* Detail column styles */
        .detail-wrap {
          text-align: left;
        }

        .detail-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          border-bottom: 1px solid var(--border);
          padding-bottom: 12px;
          margin-bottom: 20px;
        }

        .detail-header h3 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
        }

        .highlight-text {
          color: var(--primary);
        }

        .detail-date {
          font-size: 12px;
          color: var(--text-muted);
        }

        /* Status manager box styling */
        .status-manager-box {
          background-color: var(--bg-secondary);
          border: 1px solid var(--border);
          padding: 16px;
          border-radius: var(--radius-sm);
          margin-bottom: 20px;
        }

        .status-selector-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 8px;
          gap: 12px;
        }

        @media (max-width: 576px) {
          .status-selector-row {
            flex-direction: column;
            align-items: stretch;
          }
        }

        .large-badge {
          padding: 8px 16px;
          font-size: 13px;
          text-align: center;
          display: block;
        }

        .status-action-select {
          padding: 8px 12px;
          font-size: 13.5px;
          cursor: pointer;
        }

        /* Detail section styles */
        .detail-section {
          margin-bottom: 24px;
        }

        .section-title {
          font-size: 12.5px;
          font-weight: 700;
          text-transform: uppercase;
          color: var(--text-muted);
          letter-spacing: 0.5px;
          margin-bottom: 10px;
          display: block;
        }

        .info-item {
          display: flex;
          font-size: 14px;
          margin-bottom: 8px;
        }

        .info-item .lbl {
          width: 110px;
          color: var(--text-muted);
          font-weight: 500;
        }

        .info-item .val {
          flex: 1;
          color: #ffffff;
          font-weight: 600;
        }

        .info-item .val.address-val {
          font-weight: 500;
          line-height: 1.4;
          color: var(--text-main);
        }

        /* Order Items List compact view */
        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: var(--bg-secondary);
          padding: 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }

        .order-item-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13.5px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 8px;
        }

        .order-item-row:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }

        .item-title-col {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .i-title {
          color: #ffffff;
          font-weight: 600;
        }

        .i-qty {
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 700;
        }

        .i-price {
          font-weight: 600;
          color: var(--text-main);
        }

        /* Calculation total box */
        .detail-total-section {
          border-top: 1px solid var(--border);
          padding-top: 16px;
          display: flex;
          flex-direction: column;
          gap: 8px;
          font-size: 14px;
        }

        .total-row {
          display: flex;
          justify-content: space-between;
          color: var(--text-muted);
        }

        .total-row.grand-total {
          font-size: 16px;
          font-weight: 800;
          color: #ffffff;
          border-top: 1px dashed var(--border);
          padding-top: 10px;
          margin-top: 4px;
        }

        .total-row.grand-total span:last-child {
          color: var(--primary);
        }

        .no-order-selected {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 300px;
          color: var(--text-muted);
          font-size: 14px;
          text-align: center;
          padding: 24px;
        }
      `}</style>
    </div>
  );
};
export default Orders;
