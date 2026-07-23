import React, { useState, useEffect } from 'react';
import { getRefundRequests, approveRefund } from '../api/refunds';
import type { RefundRequestDto } from '../api/refunds';
import {
  TbSearch,
  TbCheck,
  TbLoader,
  TbChevronLeft,
  TbChevronRight,
  TbChevronDown,
  TbCash,
  TbX
} from 'react-icons/tb';
import { toast } from '../utils/toast';
import { CustomDatePicker } from '../components/CustomDatePicker';

import { PAGE_SIZE } from '../utils/constants';

const formatDateTime = (dateStr?: string) => {
  if (!dateStr) return '';
  const formatted = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
  return new Date(formatted).toLocaleString('vi-VN');
};

export const Refunds: React.FC = () => {
  const [refunds, setRefunds] = useState<RefundRequestDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Date range filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modal manual bank input override
  const [selectedRefund, setSelectedRefund] = useState<RefundRequestDto | null>(null);
  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [accountNumber, setAccountNumber] = useState('');
  const [bankBin, setBankBin] = useState('970415'); // default Vietinbank for testing
  const [accountName, setAccountName] = useState('');
  const [processingAction, setProcessingAction] = useState(false);

  const loadRefundRequests = async (page: number, keyword: string, status: string, startD?: string, endD?: string) => {
    setLoading(true);
    try {
      const res = await getRefundRequests(page, PAGE_SIZE, keyword, status, startD, endD);
      if (res.data && res.data.success && res.data.data) {
        const paged = res.data.data;
        setRefunds(paged.items || []);
        setTotalPages(paged.totalPages || 1);
        setTotalCount(paged.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading refunds:', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể lấy danh sách phiếu hoàn tiền.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, startDate, endDate]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadRefundRequests(currentPage, searchTerm, statusFilter, startDate, endDate);
    }, 400);
    return () => clearTimeout(handler);
  }, [currentPage, searchTerm, statusFilter, startDate, endDate]);

  const handleApproveRefund = async (refund: RefundRequestDto, isManualOverride: boolean = false) => {
    if (!isManualOverride) {
      if (!window.confirm(`Xác nhận duyệt hoàn trả số tiền ${formatMoney(refund.amount)} cho đơn hàng ${refund.orderCode}? Hệ thống sẽ tự động lấy thông tin tài khoản chuyển đi cũ của khách.`)) {
        return;
      }
    }

    setProcessingAction(true);
    try {
      const bankInfo = isManualOverride ? {
        accountNumber: accountNumber || undefined,
        bin: bankBin || undefined,
        accountName: accountName || undefined
      } : undefined;

      const res = await approveRefund(refund.id, bankInfo);
      if (res.data && res.data.success) {
        toast.success('Duyệt hoàn tiền thành công', `Đã chuyển khoản chi hộ hoàn trả số tiền ${formatMoney(refund.amount)}.`);
        setShowOverrideModal(false);
        loadRefundRequests(currentPage, searchTerm, statusFilter, startDate, endDate);
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi duyệt hoàn tiền', error.response?.data?.message || 'Có lỗi xảy ra khi hoàn tiền qua PayOS.');
    } finally {
      setProcessingAction(false);
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang hoàn tiền';
      case 'SUCCESS': return 'Thành công';
      case 'FAILED': return 'Lỗi / Thất bại';
      default: return status;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'ALL': return 'Tất cả trạng thái';
      case 'PENDING': return 'Chờ duyệt';
      case 'PROCESSING': return 'Đang xử lý';
      case 'SUCCESS': return 'Hoàn thành';
      case 'FAILED': return 'Lỗi hoàn tiền';
      default: return status;
    }
  };

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

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

  return (
    <div className="refunds-view fade-in">
      <div className="view-header" style={{ marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Quản lý Hoàn tiền</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Duyệt phiếu hoàn tiền tự động và thực hiện chi hộ hoàn tiền qua cổng thanh toán PayOS.</p>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm theo mã đơn hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Bộ lọc khoảng ngày tạo */}
        <div className="date-range-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <CustomDatePicker
            value={startDate}
            onChange={setStartDate}
            placeholder="Từ ngày..."
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>&mdash;</span>
          <CustomDatePicker
            value={endDate}
            onChange={setEndDate}
            placeholder="đến..."
            align="right"
          />
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
              {['ALL', 'PENDING', 'PROCESSING', 'SUCCESS', 'FAILED'].map((st) => (
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

      {/* Refunds Table */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, borderRadius: 0, border: '1px solid #2a2a2e', backgroundColor: '#16161a' }}>
        {loading && (
          <div className="pink-spinner-container" style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(22, 22, 26, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 5
          }}>
            <div className="pink-spinner"></div>
          </div>
        )}

        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid #2a2a2e', backgroundColor: '#0f0f11' }}>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Mã Đơn hàng</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Số tiền hoàn</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Lý do hoàn trả</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Người duyệt</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Ngày yêu cầu</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', color: 'var(--text-light)', fontSize: '13px' }}>Trạng thái</th>
              <th style={{ padding: '14px 16px', textAlign: 'center', color: 'var(--text-light)', fontSize: '13px', width: '220px' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {refunds.length > 0 ? (
              refunds.map((r) => (
                <tr key={r.id} style={{ borderBottom: '1px solid #2a2a2e' }}>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: 'var(--primary)' }}>{r.orderCode}</td>
                  <td style={{ padding: '14px 16px', fontWeight: '700', color: '#48BB78' }}>{formatMoney(r.amount)}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-main)', fontSize: '13.5px' }}>{r.reason}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: '13px' }}>{r.approvedByUsername || '-'}</td>
                  <td style={{ padding: '14px 16px', color: 'var(--text-light)', fontSize: '13px' }}>
                    {formatDateTime(r.createdAt)}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <span className={`badge ${r.status.toLowerCase()}`}>
                      {getStatusLabel(r.status)}
                    </span>
                    {r.status === 'FAILED' && r.errorMessage && (
                      <div style={{ fontSize: '11px', color: '#F56565', marginTop: '4px', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={r.errorMessage}>
                        Lỗi: {r.errorMessage}
                      </div>
                    )}
                  </td>
                  <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      {(r.status === 'PENDING' || r.status === 'FAILED') && (
                        <>
                          <button
                            className="btn-action-primary"
                            disabled={processingAction}
                            onClick={() => handleApproveRefund(r)}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <TbCheck /> {r.status === 'FAILED' ? 'Thử lại' : 'Duyệt'}
                          </button>
                          <button
                            className="btn-action-secondary"
                            disabled={processingAction}
                            onClick={() => {
                              setSelectedRefund(r);
                              setAccountNumber('');
                              setAccountName('');
                              setBankBin('970415');
                              setShowOverrideModal(true);
                            }}
                            style={{
                              padding: '6px 12px',
                              fontSize: '12px',
                              backgroundColor: '#2a2a2e',
                              borderColor: '#2a2a2e',
                              color: '#ffffff',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <TbCash /> Thủ công
                          </button>
                        </>
                      )}
                      {r.status === 'SUCCESS' && r.payosRefundId && (
                        <div style={{ fontSize: '12px', color: '#4fd1c5', fontWeight: 600 }}>
                          ID: {r.payosRefundId}
                        </div>
                      )}
                      {r.status === 'PROCESSING' && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-light)' }}>
                          <TbLoader className="spin" /> Đang chuyển khoản...
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px' }}>
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy yêu cầu hoàn tiền nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalCount > 0 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Đang xem trang <span className="page-highlight">{currentPage}</span> / {totalPages} (Tổng cộng <span className="count-highlight">{totalCount}</span> phiếu)
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

      {/* Manual Override Bank Info Modal */}
      {showOverrideModal && selectedRefund && (
        <div className="modal-overlay" style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 15, 17, 0.85)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          backdropFilter: 'blur(4px)'
        }}>
          <div className="card" style={{
            width: '100%',
            maxWidth: '440px',
            padding: '24px',
            borderRadius: '8px',
            border: '1px solid #2a2a2e',
            backgroundColor: '#16161a',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            position: 'relative'
          }}>
            <button
              style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none', color: 'var(--text-light)', cursor: 'pointer', fontSize: '18px' }}
              onClick={() => setShowOverrideModal(false)}
            >
              <TbX />
            </button>
            <h3 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--primary)', marginBottom: '6px' }}>
              Duyệt Hoàn Tiền Thủ Công
            </h3>
            <p style={{ fontSize: '13px', color: 'var(--text-light)', marginBottom: '20px' }}>
              Điền thông tin tài khoản ngân hàng của khách để chuyển khoản chi hộ hoàn trả số tiền <strong>{formatMoney(selectedRefund.amount)}</strong>.
            </p>

            <form onSubmit={(e) => { e.preventDefault(); handleApproveRefund(selectedRefund, true); }} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, marginBottom: '6px' }}>
                  Ngân hàng thụ hưởng (BIN)
                </label>
                <select
                  value={bankBin}
                  onChange={(e) => setBankBin(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: '#0f0f11',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                >
                  <option value="970415">VietinBank (970415)</option>
                  <option value="970436">Vietcombank (970436)</option>
                  <option value="970418">BIDV (970418)</option>
                  <option value="970405">Agribank (970405)</option>
                  <option value="970407">Techcombank (970407)</option>
                  <option value="970416">ACB (970416)</option>
                  <option value="970422">MBBank (970422)</option>
                  <option value="970423">TPBank (970423)</option>
                </select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, marginBottom: '6px' }}>
                  Số tài khoản nhận tiền
                </label>
                <input
                  type="text"
                  placeholder="Nhập số tài khoản ngân hàng của khách..."
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: '#0f0f11',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-light)', fontWeight: 600, marginBottom: '6px' }}>
                  Tên chủ tài khoản (Viết hoa không dấu)
                </label>
                <input
                  type="text"
                  placeholder="Ví dụ: NGUYEN VAN A..."
                  value={accountName}
                  onChange={(e) => setAccountName(e.target.value.toUpperCase())}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '6px',
                    backgroundColor: '#0f0f11',
                    border: '1px solid #2a2a2e',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                  required
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
                <button
                  type="button"
                  className="btn-action-secondary"
                  onClick={() => setShowOverrideModal(false)}
                  style={{
                    backgroundColor: '#2a2a2e',
                    borderColor: '#2a2a2e',
                    color: '#ffffff',
                    padding: '8px 16px',
                    fontSize: '13px'
                  }}
                  disabled={processingAction}
                >
                  Đóng
                </button>
                <button
                  type="submit"
                  className="btn-action-primary"
                  style={{
                    padding: '8px 16px',
                    fontSize: '13px'
                  }}
                  disabled={processingAction}
                >
                  {processingAction ? <TbLoader className="spin" /> : <TbCheck />}
                  Duyệt Hoàn Tiền
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .search-wrap-custom {
          display: flex;
          align-items: center;
          width: 320px;
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
          border-color: #4a4a4f;
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
      `}</style>
    </div>
  );
};
