import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  getInternalOrders,
  getInternalOrderDetail,
  getOrderLogs,
  packOrder,
  approveOrder
} from '../api/orders';
import type {
  OrderDetailDto,
  OrderLogDto
} from '../api/orders';
import {
  TbSearch,
  TbAlertCircle,
  TbLoader,
  TbChevronLeft,
  TbChevronRight,
  TbCheck,
  TbTruck,
  TbPrinter,
  TbHistory,
  TbArrowLeft,
  TbChevronDown,
  TbChevronsDown
} from 'react-icons/tb';
import { toast } from '../utils/toast';

const PAGE_SIZE = 10;

// Sub-component: Order List View (full page table layout like Books inventory)
const OrderListView: React.FC<{ navigate: ReturnType<typeof useNavigate> }> = ({ navigate }) => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadOrders = async (page: number, keyword: string, status: string) => {
    setLoading(true);
    try {
      const res = await getInternalOrders(page, PAGE_SIZE, keyword, status);
      if (res.data && res.data.success && res.data.data) {
        const paged = res.data.data;
        setOrders(paged.items || []);
        setTotalPages(paged.totalPages || 1);
        setTotalCount(paged.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể lấy danh sách đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadOrders(currentPage, searchTerm, statusFilter);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm, statusFilter, currentPage]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsSelectOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const getPageNumbers = (): (number | '...')[] => {
    const pages: (number | '...')[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) pages.push(i);
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Chờ thanh toán';
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao thành công';
      case 'CANCELLED': return 'Đã hủy đơn';
      default: return status;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ALL': return 'Tất cả trạng thái';
      case 'PENDING': return 'Chờ duyệt';
      case 'PENDING_PAYMENT': return 'Chờ thanh toán';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao';
      case 'DELIVERED': return 'Đã hoàn thành';
      case 'CANCELLED': return 'Đã hủy';
      default: return status;
    }
  };

  return (
    <div className="orders-view fade-in">
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Quản lý Đơn hàng</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Phê duyệt, đóng gói, đồng bộ đơn vị vận chuyển GHN và quản lý trạng thái giao nhận.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm theo mã đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isSelectOpen ? 'active' : ''}`}
            onClick={() => setIsSelectOpen(!isSelectOpen)}
          >
            <span>{getStatusText(statusFilter)}</span>
            <TbChevronDown className={`arrow-icon ${isSelectOpen ? 'open' : ''}`} />
          </div>
          {isSelectOpen && (
            <div className="custom-dropdown-menu">
              {['ALL', 'PENDING', 'PENDING_PAYMENT', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'CANCELLED'].map((st) => (
                <div
                  key={st}
                  className={`custom-dropdown-item ${statusFilter === st ? 'selected' : ''}`}
                  onClick={() => { setStatusFilter(st); setIsSelectOpen(false); }}
                >
                  {getStatusText(st)}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Orders Data Table */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, borderRadius: 0 }}>
        {loading && (
          <div className="pink-spinner-container">
            <div className="pink-spinner"></div>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Mã đơn hàng</th>
              <th>Sách mua</th>
              <th>Ngày đặt</th>
              <th>Thanh toán</th>
              <th>Tổng tiền</th>
              <th>Trạng thái</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((o) => (
                <tr key={o.orderId}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>{o.orderCode}</td>
                  <td>
                    <span className="book-title-cell">
                      {o.firstItemTitle || 'Đơn hàng sách'}
                    </span>
                  </td>
                  <td style={{ fontSize: '13.5px', color: 'var(--text-light)' }}>
                    {new Date(o.createdAt).toLocaleString('vi-VN')}
                  </td>
                  <td>
                    <div style={{
                      fontSize: '13.5px',
                      fontWeight: 'bold',
                      color: o.paymentMethod === 'PAYOS' ? '#48BB78' : '#ffffff'
                    }}>
                      {o.paymentMethod}
                    </div>
                    <div style={{
                      fontSize: '11px',
                      fontWeight: '600',
                      color: o.paymentStatus === 'PAID' ? '#F687B3' : '#ED8936',
                      marginTop: '2px'
                    }}>
                      {o.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                    </div>
                  </td>
                  <td style={{ fontWeight: '700', color: '#48BB78' }}>{o.totalDisplay}</td>
                  <td>
                    <span className={`badge ${o.orderStatus.toLowerCase()}`}>
                      {getStatusLabel(o.orderStatus)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-detail-link"
                      onClick={() => navigate(`/orders/${o.orderId}`)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px' }}>
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy đơn hàng nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalPages >= 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Đang xem trang <span className="page-highlight">{currentPage}</span> / {totalPages} (Tổng cộng <span className="count-highlight">{totalCount}</span> đơn hàng)
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn nav-arrow"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <TbChevronLeft />
            </button>
            {getPageNumbers().map((pageNum, idx) => (
              <button
                key={idx}
                className={`page-btn ${pageNum === currentPage ? 'active' : ''}`}
                disabled={pageNum === '...'}
                onClick={() => typeof pageNum === 'number' && goToPage(pageNum)}
              >
                {pageNum}
              </button>
            ))}
            <button
              className="page-btn nav-arrow"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <TbChevronRight />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Sub-component: Order Detail View (full page detail view layout)
const OrderDetailView: React.FC<{ orderId: string; navigate: ReturnType<typeof useNavigate> }> = ({ orderId, navigate }) => {
  const [orderDetail, setOrderDetail] = useState<OrderDetailDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [logs, setLogs] = useState<OrderLogDto[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [processingAction, setProcessingAction] = useState(false);
  const [showLogs, setShowLogs] = useState(false);

  const fetchDetailsAndLogs = async () => {
    setLoading(true);
    try {
      const res = await getInternalOrderDetail(orderId);
      if (res.data && res.data.success && res.data.data) {
        const detail = res.data.data;
        setOrderDetail(detail);

        // Fetch logs using orderCode
        setLoadingLogs(true);
        try {
          const logRes = await getOrderLogs(detail.orderCode);
          if (logRes.data && logRes.data.success) {
            setLogs(logRes.data.data || []);
          }
        } catch (logErr) {
          console.error('Error loading order logs:', logErr);
        } finally {
          setLoadingLogs(false);
        }
      }
    } catch (err) {
      console.error('Error loading order details:', err);
      toast.error('Lỗi tải chi tiết', 'Không thể lấy chi tiết đơn hàng.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetailsAndLogs();
  }, [orderId]);

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return 'Chờ thanh toán';
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SHIPPED': return 'Đang giao hàng';
      case 'DELIVERED': return 'Đã giao thành công';
      case 'CANCELLED': return 'Đã hủy đơn';
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING_PAYMENT': return '#ED8936';      // Cam ấm
      case 'PENDING': return '#ED8936';              // Cam ấm
      case 'PROCESSING': return '#76e4f7';           // Cyan
      case 'SHIPPED': return '#9F7AEA';              // Tím
      case 'DELIVERED': return '#48BB78';            // Xanh lá
      case 'CANCELLED': return '#F56565';            // Đỏ
      default: return '#a0aec0';                     // Xám
    }
  };

  const formatAdminNote = (note: string) => {
    if (!note) return '';
    return note.replace(/\(asynced\)/gi, '').replace(/\(async\)/gi, '').trim();
  };

  const handleApprove = async (orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn duyệt đơn hàng ${orderCode} không?`)) return;
    setProcessingAction(true);
    try {
      const res = await approveOrder(orderCode);
      if (res.data && res.data.success) {
        toast.success('Duyệt đơn thành công', `Đơn hàng ${orderCode} đã chuyển sang đóng gói.`);
        fetchDetailsAndLogs();
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi duyệt đơn', error.response?.data?.message || 'Không thể duyệt đơn hàng này.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePack = async (orderCode: string) => {
    if (!window.confirm(`Bạn có chắc chắn xác nhận đóng gói và gửi vận đơn GHN cho đơn hàng ${orderCode} không?`)) return;
    setProcessingAction(true);
    try {
      const res = await packOrder(orderCode);
      if (res.data && res.data.success) {
        toast.success('Đóng gói thành công', `Mã vận đơn GHN đã được tạo thành công.`);
        fetchDetailsAndLogs();
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi đóng gói', error.response?.data?.message || 'Không thể tạo vận đơn GHN.');
    } finally {
      setProcessingAction(false);
    }
  };

  const handlePrintPickingList = () => {
    if (!orderDetail) return;
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Popup Blocker', 'Vui lòng cho phép mở popup để in phiếu.');
      return;
    }

    const itemsRows = orderDetail.items.map(item => `
      <tr>
        <td style="border: 1px solid #ddd; padding: 10px;">${item.bookTitle}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: center;">${item.quantity}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${item.priceDisplay}</td>
        <td style="border: 1px solid #ddd; padding: 10px; text-align: right;">${item.subtotalDisplay}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <html>
      <head>
        <title>Phiếu nhặt hàng - #${orderDetail.orderCode}</title>
        <style>
          body { font-family: sans-serif; padding: 30px; color: #333; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .info-table { width: 100%; margin-bottom: 20px; border-collapse: collapse; }
          .info-table td { padding: 6px 0; font-size: 14px; }
          .items-table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          .items-table th { background: #f2f2f2; border: 1px solid #ddd; padding: 10px; text-align: left; }
          .totals { text-align: right; margin-top: 20px; font-size: 16px; font-weight: bold; }
          @media print {
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h2>INKPULSE - PHIẾU NHẶT HÀNG (PICKING LIST)</h2>
          <p>Mã đơn hàng: <strong>${orderDetail.orderCode}</strong></p>
          <p>Mã vận đơn GHN: <strong>${orderDetail.ghnOrderCode || 'Chưa tạo'}</strong></p>
        </div>
        
        <table class="info-table">
          <tr>
            <td style="width: 50%;"><strong>Khách nhận:</strong> ${orderDetail.receiverName}</td>
            <td><strong>Ngày đặt:</strong> ${new Date(orderDetail.createdAt).toLocaleString('vi-VN')}</td>
          </tr>
          <tr>
            <td><strong>Số điện thoại:</strong> ${orderDetail.recipientPhone}</td>
            <td><strong>Phương thức:</strong> ${orderDetail.paymentMethod}</td>
          </tr>
          <tr>
            <td colspan="2"><strong>Địa chỉ giao:</strong> ${orderDetail.shippingAddress}</td>
          </tr>
        </table>

        <h3 style="margin-top: 30px;">Danh sách sản phẩm cần nhặt:</h3>
        <table class="items-table">
          <thead>
            <tr>
              <th>Tên cuốn sách</th>
              <th style="text-align: center; width: 80px;">Số lượng</th>
              <th style="text-align: right; width: 120px;">Đơn giá</th>
              <th style="text-align: right; width: 140px;">Thành tiền</th>
            </tr>
          </thead>
          <tbody>
            ${itemsRows}
          </tbody>
        </table>

        <div class="totals">
          <p>Tạm tính: ${orderDetail.orderFeeDisplay}</p>
          <p>Phí ship: ${orderDetail.shippingFeeDisplay}</p>
          <p style="font-size: 18px; margin-top: 10px; color: #4f46e5;">Tổng thu hộ (COD): ${orderDetail.paymentMethod === 'COD' ? orderDetail.totalDisplay : '0đ (Đã thanh toán Online)'}</p>
        </div>

        <div style="margin-top: 50px; text-align: center;" class="no-print">
          <button onclick="window.print()" style="padding: 10px 20px; font-size: 15px; font-weight: bold; background: #4f46e5; color: white; border: none; border-radius: 6px; cursor: pointer;">In Phiếu Này</button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="orders-view fade-in" style={{ position: 'relative', padding: '16px 0' }}>
      {loading && (
        <div className="pink-spinner-container">
          <div className="pink-spinner"></div>
        </div>
      )}

      {/* Detail view header */}
      <div style={{ marginBottom: '32px', borderBottom: '1px solid #2a2a2e', paddingBottom: '20px' }}>
        <Link to="/orders" className="btn-back-custom">
          <TbArrowLeft /> Quay lại danh sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '8px', display: 'flex', alignItems: 'center', gap: '10px' }}>
          Chi tiết đơn hàng: <span style={{ color: 'var(--primary)' }}>{orderDetail?.orderCode}</span>
        </h1>
        <p className="view-subtitle" style={{ margin: 0, marginTop: '4px' }}>
          {orderDetail ? `Đặt ngày: ${new Date(orderDetail.createdAt).toLocaleString('vi-VN')}` : 'Đang tải thông tin đơn hàng...'}
        </p>
      </div>

      {orderDetail && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
          
          {/* Upper Part (Full width): Section 1: Status & Action buttons */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', borderBottom: '1px solid #2a2a2e', paddingBottom: '24px' }}>
            <div>
              <div style={{ fontSize: '15px', color: 'var(--primary)', fontWeight: 800, letterSpacing: '0.5px', marginBottom: '6px' }}>Trạng thái đơn hàng</div>
              <span className={`badge ${orderDetail.orderStatus.toLowerCase()} large-badge`}>
                {getStatusLabel(orderDetail.orderStatus)}
              </span>
            </div>

            <div className="action-buttons-wrap">
              {orderDetail.orderStatus === 'PENDING' && (
                <button 
                  className="btn-action-primary" 
                  disabled={processingAction}
                  onClick={() => handleApprove(orderDetail.orderCode)}
                >
                  {processingAction ? <TbLoader className="spin" /> : <TbCheck />}
                  Duyệt đơn hàng
                </button>
              )}

              {orderDetail.orderStatus === 'PROCESSING' && !orderDetail.ghnOrderCode && (
                <button 
                  className="btn-action-primary" 
                  disabled={processingAction}
                  onClick={() => handlePack(orderDetail.orderCode)}
                >
                  {processingAction ? <TbLoader className="spin" /> : <TbTruck />}
                  Đóng gói & Tạo vận đơn GHN
                </button>
              )}

              {orderDetail && (
                <button 
                  className="btn-action-primary" 
                  onClick={handlePrintPickingList}
                >
                  <TbPrinter />
                  In Phiếu nhặt hàng
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Receiver Info (Full width row) */}
          <div style={{ borderBottom: '1px solid #2a2a2e', paddingBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '20px' }}>Thông tin giao nhận</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '24px' }}>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Người nhận</div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginTop: '4px' }}>{orderDetail.receiverName}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Điện thoại</div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginTop: '4px' }}>{orderDetail.recipientPhone}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Mã vận đơn GHN</div>
                <div style={{ fontSize: '15px', color: orderDetail.ghnOrderCode ? '#76e4f7' : '#ED8936', fontWeight: 700, marginTop: '4px' }}>{orderDetail.ghnOrderCode || 'Chưa tạo'}</div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Phương thức thanh toán</div>
                <div style={{ fontSize: '15px', color: '#ffffff', fontWeight: 700, marginTop: '4px' }}>
                  {orderDetail.paymentMethod} &mdash; <span style={{ color: orderDetail.paymentStatus === 'PAID' ? '#F687B3' : '#ED8936' }}>{orderDetail.paymentStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}</span>
                </div>
              </div>
              <div style={{ gridColumn: 'span 2' }}>
                <div style={{ fontSize: '11px', color: 'var(--text-light)', textTransform: 'uppercase', fontWeight: 600 }}>Địa chỉ nhận hàng</div>
                <div style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: 500, marginTop: '4px', lineHeight: '1.5' }}>{orderDetail.shippingAddress}</div>
              </div>
            </div>
          </div>

          {/* Section 3: Purchased Products + Payment Summary side by side */}
          <div style={{ borderBottom: '1px solid #2a2a2e', paddingBottom: '32px' }}>
            <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '20px' }}>Sản phẩm đã mua ({orderDetail.items.length})</h3>
            <div style={{ display: 'flex', gap: '40px', alignItems: 'flex-start' }}>

              {/* Left: product list */}
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {orderDetail.items.map((item, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '14px', paddingBottom: '14px', borderBottom: '1px solid #2a2a2e' }}>
                    {item.thumbnailUrl && (
                      <img src={item.thumbnailUrl} alt={item.bookTitle} style={{ width: '48px', height: '68px', objectFit: 'cover', borderRadius: '4px', flexShrink: 0 }} />
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: '14px', fontWeight: 700, color: '#4fd1c5', marginBottom: '4px' }}>{item.bookTitle}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-light)' }}>Tác giả: {item.authorName || 'Không có tác giả'}</div>
                      <div style={{ fontSize: '12px', color: '#F687B3', marginTop: '2px', fontWeight: 600 }}>Đơn giá: {item.priceDisplay}</div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 700 }}>x{item.quantity}</div>
                      <div style={{ fontSize: '14px', fontWeight: 800, color: '#ffffff', marginTop: '4px' }}>{item.subtotalDisplay || item.priceDisplay}</div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Right: Payment summary */}
              <div style={{ width: '260px', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-light)' }}>
                  <span>Tạm tính sách:</span>
                  <span style={{ fontWeight: 600, color: '#F687B3' }}>{orderDetail.orderFeeDisplay}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', color: 'var(--text-light)' }}>
                  <span>Phí giao hàng (GHN):</span>
                  <span style={{ fontWeight: 600, color: '#63B3ED' }}>{orderDetail.shippingFeeDisplay}</span>
                </div>
                <div style={{ height: '1px', background: '#2a2a2e', margin: '2px 0' }}></div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '17px', fontWeight: 800 }}>
                  <span style={{ color: '#ffffff' }}>Tổng cộng:</span>
                  <span style={{ color: '#48BB78' }}>{orderDetail.totalDisplay}</span>
                </div>
              </div>

            </div>
          </div>

          {/* Lower Part (Full width): Section 5: Log History (Collapsed by default) */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
              <button 
                className="btn-toggle-logs-simple"
                onClick={() => setShowLogs(!showLogs)}
              >
                <span>Xem lịch sử đơn hàng</span>
                <TbChevronsDown className="arrow-icon-down" style={{ transform: showLogs ? 'rotate(180deg)' : 'none' }} />
              </button>
            </div>

            {showLogs && (
              <div className="fade-in" style={{ borderTop: '1px dashed #2a2a2e', paddingTop: '24px' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 800, color: 'var(--primary)', letterSpacing: '0.5px', marginBottom: '20px' }}>
                  Lịch sử xử lý chi tiết
                </h3>
                {loadingLogs ? (
                  <div className="logs-loading"><TbLoader className="spin" /> Đang tải lịch sử...</div>
                ) : logs.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '24px' }}>
                    {logs.map((logItem, idx) => (
                      <div key={logItem.logId} style={{ display: 'grid', gridTemplateColumns: '120px 30px 1fr', alignItems: 'stretch' }}>
                        {/* Left: Time and Date */}
                        <div style={{ textAlign: 'right', paddingRight: '12px', paddingTop: '2px' }}>
                          <div style={{ fontSize: '13px', color: '#ffffff', fontWeight: 600 }}>
                            {new Date(logItem.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                          <div style={{ fontSize: '11px', color: 'var(--text-light)', marginTop: '2px' }}>
                            {new Date(logItem.createdAt).toLocaleDateString('vi-VN')}
                          </div>
                        </div>

                        {/* Center: Glowing Dot & Line */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}>
                          <div style={{
                            width: '10px',
                            height: '10px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--primary)',
                            boxShadow: '0 0 8px var(--primary)',
                            border: '2px solid #0f0f11',
                            zIndex: 2,
                            marginTop: '6px'
                          }}></div>
                          {idx < logs.length - 1 && (
                            <div style={{
                              width: '2px',
                              flex: 1,
                              minHeight: '30px',
                              backgroundColor: 'var(--primary)',
                              opacity: 0.4,
                              marginTop: '4px'
                            }}></div>
                          )}
                        </div>

                        {/* Right: Content */}
                        <div style={{ paddingLeft: '12px', paddingBottom: '24px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: getStatusColor(logItem.fromStatus), fontWeight: 700, fontSize: '13px' }}>
                              {getStatusLabel(logItem.fromStatus)}
                            </span>
                            <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>&rarr;</span>
                            <span style={{ color: getStatusColor(logItem.toStatus), fontWeight: 700, fontSize: '13px' }}>
                              {getStatusLabel(logItem.toStatus)}
                            </span>
                          </div>
                          <p style={{ margin: 0, marginTop: '6px', fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.5' }}>
                            {formatAdminNote(logItem.adminNote || logItem.userNote)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="no-logs" style={{ margin: 0, padding: '16px 0' }}>Chưa ghi nhận lịch sử xử lý cho đơn hàng này.</p>
                )}
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
};

// Main Orders Component routing handler
export const Orders: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  return (
    <>
      {id ? (
        <OrderDetailView orderId={id} navigate={navigate} />
      ) : (
        <OrderListView navigate={navigate} />
      )}
      <style>{`
        .orders-view {
          padding: 0;
        }
        .btn-back-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
          margin-bottom: 8px;
        }
        .btn-back-custom:hover {
          color: #F687B3 !important;
        }
        .btn-detail-link {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          padding: 0;
          cursor: pointer;
          font-size: 14px;
          transition: var(--transition);
        }
        .btn-detail-link:hover {
          text-decoration: underline;
          color: var(--primary-hover);
        }
        .book-title-cell {
          font-weight: 700;
          color: #4fd1c5;
        }
        .search-wrap-custom {
          display: flex;
          align-items: center;
          flex: 1;
          height: 44px;
          border: 2px solid var(--primary);
          border-radius: 10px;
          overflow: hidden;
          background-color: #1a1a1a;
          transition: var(--transition);
        }
        .search-wrap-custom:focus-within {
          border-color: var(--primary-hover);
          box-shadow: 0 0 0 3px rgba(218, 68, 125, 0.15);
        }
        .search-input-custom {
          flex: 1;
          height: 100%;
          border: none !important;
          outline: none !important;
          padding: 0 16px !important;
          font-size: 14px;
          color: var(--text-main);
          background-color: transparent !important;
        }
        .search-input-custom::placeholder {
          color: var(--text-light);
        }
        .search-btn-custom {
          width: 52px;
          height: 100%;
          background-color: var(--primary);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-size: 18px;
          transition: var(--transition);
        }
        .search-btn-custom:hover {
          background-color: var(--primary-hover);
        }
        .custom-dropdown-container {
          position: relative;
          width: 220px;
          user-select: none;
        }
        .custom-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #1a1a1a;
          border: 2px solid var(--border);
          border-radius: 10px;
          padding: 0 16px;
          color: #F687B3;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          height: 44px;
          transition: var(--transition);
        }
        .custom-dropdown-header.active {
          border-color: var(--primary);
        }
        .custom-dropdown-header .arrow-icon {
          color: #da447d;
          font-size: 18px;
          transition: transform 0.2s ease;
        }
        .custom-dropdown-header .arrow-icon.open {
          transform: rotate(180deg);
        }
        .custom-dropdown-menu {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background-color: #161616;
          border: 1px solid var(--border);
          border-radius: 10px;
          box-shadow: var(--shadow-lg);
          z-index: 10;
          max-height: 250px;
          overflow-y: auto;
          padding: 6px 0;
        }
        .custom-dropdown-item {
          padding: 10px 16px;
          font-size: 13.5px;
          color: var(--text-main);
          font-weight: 500;
          cursor: pointer;
          transition: var(--transition);
        }
        .custom-dropdown-item:hover {
          background-color: var(--primary-light);
          color: #F687B3;
        }
        .custom-dropdown-item.selected {
          color: #F687B3;
          font-weight: 700;
          background-color: rgba(218, 68, 125, 0.08);
        }

        /* Badge status overrides and definitions */
        .badge.pending_payment {
          background-color: rgba(159, 122, 234, 0.15) !important;
          color: #B794F4 !important;
        }
        .badge.shipped {
          background-color: rgba(59, 130, 246, 0.15) !important;
          color: var(--accent-blue) !important;
        }
        .badge.delivered {
          background-color: rgba(16, 185, 129, 0.15) !important;
          color: var(--accent-green) !important;
        }

        /* Pagination */
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 24px;
          padding-top: 16px;
          border-top: 1px solid var(--border);
          gap: 12px;
          flex-wrap: wrap;
        }
        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
        }
        .pagination-info .count-highlight {
          color: #f6ad55;
          font-weight: 700;
          font-size: 13px;
        }
        .pagination-info .page-highlight {
          color: #76e4f7;
          font-weight: 700;
          font-size: 13px;
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 4px;
          background-color: #111113;
          border: 1px solid #2a2a2e;
          border-radius: 12px;
          padding: 4px 6px;
        }
        .page-btn {
          min-width: 32px;
          height: 32px;
          border-radius: 8px;
          border: none;
          background-color: transparent;
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.18s ease;
          padding: 0 6px;
        }
        .page-btn:hover:not(:disabled) {
          color: #F687B3;
          background-color: rgba(246, 135, 179, 0.1);
        }
        .page-btn.active {
          background: linear-gradient(135deg, #da447d, #b83469);
          color: #fff;
          font-weight: 700;
        }
        .page-btn.nav-arrow {
          color: var(--text-muted);
          font-size: 16px;
        }
        .page-btn.nav-arrow:hover:not(:disabled) {
          color: #F687B3;
          background-color: rgba(246, 135, 179, 0.1);
        }
        .page-btn:disabled {
          opacity: 0.25;
          cursor: not-allowed;
        }
        .page-dots {
          color: #3a3a40;
          font-size: 14px;
          padding: 0 2px;
          user-select: none;
          line-height: 32px;
        }

        /* Spinner & Loading */
        .pink-spinner-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(26, 26, 26, 0.45);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(2px);
          border-radius: 12px;
        }
        .pink-spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(236, 72, 153, 0.15);
          border-top-color: #ec4899;
          border-radius: 50%;
          animation: pink-spin 0.8s linear infinite;
        }
        @keyframes pink-spin {
          to { transform: rotate(360deg); }
        }

        /* Detail layout and cards styles */
        .large-badge {
          padding: 8px 16px;
          font-size: 13px;
          text-align: center;
        }
        .action-buttons-wrap {
          display: flex;
          gap: 10px;
        }
        .btn-action-primary, .btn-action-outline {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 16px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .btn-action-primary {
          background-color: var(--primary);
          color: #ffffff;
          border: none;
        }
        .btn-action-primary:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-action-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-action-outline {
          background-color: transparent;
          color: var(--text-main);
          border: 1px solid var(--border);
        }
        .btn-action-outline:hover {
          background-color: var(--bg-hover);
          border-color: var(--primary);
        }
        .btn-action-print-pink {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          background-color: var(--primary);
          color: #ffffff;
          border: none;
          outline: none;
          height: 42px;
        }
        .btn-action-print-pink:hover {
          background-color: var(--primary-hover);
        }
        .btn-toggle-logs-simple {
          display: inline-flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
          background: transparent;
          border: none;
          color: var(--text-light);
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          padding: 8px 16px;
        }
        .btn-toggle-logs-simple:hover {
          color: #F687B3 !important;
        }
        .btn-toggle-logs-simple .arrow-icon-down {
          opacity: 0;
          transform: translateY(-4px);
          transition: all 0.2s ease;
          font-size: 16px;
          color: #F687B3;
          margin-top: 4px;
        }
        .btn-toggle-logs-simple:hover .arrow-icon-down {
          opacity: 1;
          transform: translateY(0);
        }

        .spin {
          animation: spin-detail 1s linear infinite;
        }
        @keyframes spin-detail {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .info-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
          background-color: var(--bg-secondary);
          padding: 16px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .info-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
          font-size: 13.5px;
        }
        .info-item.full-width {
          grid-column: span 2;
        }
        .info-item .lbl {
          color: var(--text-muted);
          font-weight: 500;
          font-size: 11.5px;
          text-transform: uppercase;
        }
        .info-item .val {
          color: #ffffff;
          font-weight: 600;
        }
        .info-item .val.address-val {
          font-weight: 500;
          line-height: 1.4;
          color: var(--text-main);
        }

        .order-items-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          background-color: var(--bg-secondary);
          padding: 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border);
        }
        .order-item-row-advanced {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 13.5px;
          border-bottom: 1px solid var(--border);
          padding-bottom: 10px;
        }
        .order-item-row-advanced:last-child {
          border-bottom: none;
          padding-bottom: 0;
        }
        .item-thumbnail-mini {
          width: 40px;
          height: 56px;
          object-fit: cover;
          border-radius: 4px;
          background-color: var(--bg-hover);
        }
        .item-details-mini {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 2px;
          min-width: 0;
        }
        .item-details-mini .i-title {
          font-weight: 600;
          color: #ffffff;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-details-mini .i-author {
          font-size: 11px;
          color: var(--text-muted);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .item-pricing-mini {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 4px;
        }
        .item-pricing-mini .i-price {
          font-weight: 600;
          color: var(--text-main);
        }
        .item-pricing-mini .i-qty {
          color: var(--primary);
          background-color: var(--bg-hover);
          padding: 1px 6px;
          border-radius: 4px;
          font-size: 10.5px;
          font-weight: 700;
        }

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

        /* Timeline styles obsolete (inlined in JSX grid) */
        .no-logs, .logs-loading {
          font-size: 13px;
          color: var(--text-muted);
          padding: 10px 0;
          text-align: center;
        }
      `}</style>
    </>
  );
};

export default Orders;
