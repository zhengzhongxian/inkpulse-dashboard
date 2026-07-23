import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInternalVouchersApi,
  getInternalVoucherDetailApi,
  updateVoucherApi,
  deleteVoucherApi
} from '../api/vouchers';
import type { VoucherResponse, VoucherDetailResponse } from '../api/vouchers';
import { toast } from '../utils/toast';
import {
  TbBookmarkPlus, TbSearch, TbGift, TbBan, TbCheck, TbEdit, TbTrash,
  TbChevronDown, TbChevronLeft, TbChevronRight, TbAdjustments, TbRefresh,
  TbCalendar, TbApps, TbTag, TbBook, TbBookmark, TbCoins, TbShoppingCart, TbTicket, TbEye, TbFolder, TbX
} from 'react-icons/tb';
import { CustomDateTimePicker } from '../components/CustomDateTimePicker';

const getTargetIconAndLabel = (targetType: string) => {
  const wrapperStyle = () => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '38px',
    height: '38px',
    borderRadius: '50%',
    backgroundColor: 'transparent',
    border: '1.5px solid #000000',
    flexShrink: 0
  });

  switch (targetType) {
    case 'ALL':
      return { 
        icon: (
          <div style={wrapperStyle()}>
            <TbShoppingCart style={{ color: '#4fd1c5', fontSize: '18px' }} />
          </div>
        ), 
        label: 'Đơn hàng Tổng' 
      };
    case 'CATEGORY':
      return { 
        icon: (
          <div style={wrapperStyle()}>
            <TbFolder style={{ color: '#f6ad55', fontSize: '18px' }} />
          </div>
        ), 
        label: 'Danh mục' 
      };
    case 'BOOK':
      return { 
        icon: (
          <div style={wrapperStyle()}>
            <TbBook style={{ color: '#b794f4', fontSize: '18px' }} />
          </div>
        ), 
        label: 'Sách' 
      };
    case 'EDITION':
      return { 
        icon: (
          <div style={wrapperStyle()}>
            <TbBookmark style={{ color: '#f6e05e', fontSize: '18px' }} />
          </div>
        ), 
        label: 'Phiên bản' 
      };
    default:
      return { 
        icon: (
          <div style={wrapperStyle()}>
            <TbShoppingCart style={{ color: '#4fd1c5', fontSize: '18px' }} />
          </div>
        ), 
        label: 'Đơn hàng Tổng' 
      };
  }
};

import { PAGE_SIZE } from '../utils/constants';

export const Vouchers: React.FC = () => {
  const navigate = useNavigate();
  const [vouchers, setVouchers] = useState<VoucherResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDiscountType, setFilterDiscountType] = useState('ALL');
  const [filterTargetType, setFilterTargetType] = useState('ALL_TYPES');
  const [filterIsActive, setFilterIsActive] = useState('ALL_STATUS');
  const [minCoinCost, setMinCoinCost] = useState('');
  const [maxCoinCost, setMaxCoinCost] = useState('');

  // Date Range Filters State
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [endDateFrom, setEndDateFrom] = useState('');
  const [endDateTo, setEndDateTo] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // Advanced Filters toggle
  const [isAdvancedFiltersOpen, setIsAdvancedFiltersOpen] = useState(false);

  // Dropdown States for Filters
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Delete Confirm Modal State
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN').format(amount) + ' VNĐ';
  };

  // Load Vouchers
  const loadVouchers = async (page: number) => {
    setLoading(true);

    const formatFilterDateTime = (val: string, isEnd: boolean, hasZ: boolean = true) => {
      if (!val) return undefined;
      if (val.includes('Z')) return val;
      if (!val.includes('T')) {
        const timeStr = isEnd ? 'T23:59:59' : 'T00:00:00';
        const suffix = hasZ ? '.000Z' : '';
        return val + timeStr + suffix;
      }
      const suffix = hasZ ? '.000Z' : '';
      return val + ':00' + suffix;
    };

    try {
      const res = await getInternalVouchersApi({
        page,
        size: PAGE_SIZE,
        search: searchTerm || undefined,
        discountType: filterDiscountType !== 'ALL' ? filterDiscountType : undefined,
        targetType: filterTargetType !== 'ALL_TYPES' ? filterTargetType : undefined,
        isActive: filterIsActive === 'ACTIVE' ? true : filterIsActive === 'INACTIVE' ? false : undefined,
        minCoinCost: minCoinCost ? Number(minCoinCost) : undefined,
        maxCoinCost: maxCoinCost ? Number(maxCoinCost) : undefined,
        startDateFrom: formatFilterDateTime(startDateFrom, false),
        startDateTo: formatFilterDateTime(startDateTo, true),
        endDateFrom: formatFilterDateTime(endDateFrom, false),
        endDateTo: formatFilterDateTime(endDateTo, true),
        createdFrom: formatFilterDateTime(createdFrom, false, false),
        createdTo: formatFilterDateTime(createdTo, true, false)
      });

      if (res.data && res.data.success) {
        setVouchers(res.data.data.items || []);
        setTotalPages(res.data.data.totalPages || 1);
        setTotalCount(res.data.data.totalCount || 0);
      }
    } catch (e) {
      console.error('Failed to load vouchers', e);
      toast.error('Lỗi', 'Không thể tải danh sách mã giảm giá.');
    } finally {
      setLoading(false);
    }
  };

  // Fetch Vouchers list on parameter change
  useEffect(() => {
    setCurrentPage(1);
  }, [
    searchTerm, filterDiscountType, filterTargetType, filterIsActive, minCoinCost, maxCoinCost,
    startDateFrom, startDateTo, endDateFrom, endDateTo, createdFrom, createdTo
  ]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadVouchers(currentPage);
    }, 300);
    return () => clearTimeout(handler);
  }, [
    currentPage, searchTerm, filterDiscountType, filterTargetType, filterIsActive, minCoinCost, maxCoinCost,
    startDateFrom, startDateTo, endDateFrom, endDateTo, createdFrom, createdTo
  ]);

  // Close dropdowns on outside click
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsDiscountDropdownOpen(false);
        setIsTargetDropdownOpen(false);
        setIsStatusDropdownOpen(false);
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

  // Quick Toggle Status Handler
  const handleToggleStatus = async (voucher: VoucherResponse) => {
    try {
      const detailRes = await getInternalVoucherDetailApi(voucher.voucherId);
      if (detailRes.data && detailRes.data.success) {
        const v: VoucherDetailResponse = detailRes.data.data;
        const targetIds = v.targetType !== 'ALL' ? v.targetItems.map(item => item.id) : [];

        await updateVoucherApi(voucher.voucherId, {
          voucherId: voucher.voucherId,
          voucherCode: v.voucherCode,
          description: v.description,
          discountType: v.discountType,
          discountValue: Number(v.discountValue),
          minOrderValue: Number(v.minOrderValue),
          maxUses: v.maxUses,
          maxUsesPerUser: v.maxUsesPerUser,
          isActive: !v.isActive,
          coinCost: v.coinCost,
          targetType: v.targetType,
          targetIds,
          startDate: v.startDate,
          endDate: v.endDate
        });

        toast.success('Thành công', `Đã ${!v.isActive ? 'kích hoạt' : 'khóa'} mã giảm giá.`);
        loadVouchers(currentPage);
      }
    } catch (e: any) {
      console.error('Failed to toggle status', e);
      const errMsg = e.response?.data?.message || 'Không thể cập nhật trạng thái voucher.';
      toast.error('Lỗi', errMsg);
    }
  };

  // Delete Voucher Handler
  const handleDeleteVoucher = async () => {
    if (!deletingId) return;
    try {
      await deleteVoucherApi(deletingId);
      toast.success('Thành công', 'Đã xóa mã giảm giá.');
      setDeletingId(null);
      loadVouchers(currentPage);
    } catch (e: any) {
      console.error('Failed to delete voucher', e);
      const errMsg = e.response?.data?.message || 'Không thể xóa mã giảm giá này.';
      toast.error('Lỗi', errMsg);
    }
  };

  return (
    <div className="vouchers-view fade-in">
      <style>{`
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

        .range-input-custom {
          width: 120px;
          height: 44px;
          background-color: #1a1a1a;
          border: 2px solid var(--border);
          border-radius: 10px;
          padding: 0 12px !important;
          font-size: 14px;
          color: #48BB78;
          font-weight: 600;
          outline: none;
          transition: var(--transition);
        }
        .range-input-custom:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }

        .custom-dropdown-container {
          position: relative;
          width: 190px;
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
          color: var(--text-light);
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          height: 44px;
          transition: var(--transition);
        }
        .custom-dropdown-header.active {
          color: #F687B3 !important;
          border-color: #4a4a4f !important;
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
          min-width: 100%;
          width: max-content;
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
          white-space: nowrap;
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

        /* Voucher Box layout */
        .vouchers-box-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(330px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .v-box-card {
          background-color: #16161a;
          border: 1px solid var(--border);
          border-bottom: 2px solid var(--primary);
          border-radius: 6px;
          padding: 20px;
          display: flex;
          flex-direction: column;
          transition: transform 0.2s ease, border-color 0.2s ease;
        }

        .v-box-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 12px;
        }
        .v-box-code {
          font-size: 18px;
          font-weight: 800;
          color: #4fd1c5;
          letter-spacing: 0.5px;
        }
        .v-box-discount {
          font-size: 22px;
          font-weight: 800;
          color: #38a169;
          margin-bottom: 4px;
        }
        .v-box-desc {
          font-size: 13.5px;
          color: var(--text-light);
          line-height: 1.4;
          margin-bottom: 14px;
          flex: 1;
        }
        .v-box-meta-item {
          display: flex;
          justify-content: space-between;
          font-size: 12.5px;
          color: var(--text-muted);
          padding: 4px 0;
          border-bottom: 1px dashed rgba(255, 255, 255, 0.05);
        }
        .v-box-meta-item:last-of-type {
          border-bottom: none;
        }
        .v-box-value {
          color: var(--text-main);
          font-weight: 600;
        }
        .v-box-actions {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-top: 16px;
          padding-top: 14px;
          border-top: 1px solid var(--border);
        }
        .v-box-btn-group {
          display: flex;
          gap: 8px;
        }
        .v-box-btn {
          background: none;
          border: none;
          cursor: pointer;
          font-size: 18px;
          padding: 6px;
          border-radius: 6px;
          transition: var(--transition);
        }
        .v-box-btn:hover {
          background-color: var(--bg-hover);
        }
        .v-box-btn.detail {
          color: #63B3ED;
        }
        .v-box-btn.detail:hover {
          color: #90cdf4;
        }
        .v-box-btn.delete {
          color: var(--accent-red);
        }
        .v-box-btn.delete:hover {
          color: #fc8181;
        }
        .v-box-status-toggle {
          background: none;
          border: none;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: var(--transition);
          padding: 4px 8px;
          border-radius: 6px;
        }
        .v-box-status-toggle:hover {
          background-color: var(--bg-hover);
        }
        .v-box-status-toggle.active {
          color: var(--accent-green);
        }
        .v-box-status-toggle.inactive {
          color: var(--accent-red);
        }
        .btn-add-custom {
          background-color: var(--primary);
          color: #fff;
          border-radius: 10px;
          align-items: center;
          gap: 8px;
          padding: 10px 24px;
          font-weight: 600;
          display: inline-flex;
          cursor: pointer;
          font-size: 14.5px;
          transition: var(--transition);
          height: 42px;
          border: none;
          outline: none;
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .pink-spinner-container {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 10px;
          padding: 20px;
          color: var(--text-light);
        }
        .pink-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(236, 72, 153, 0.15);
          border-top-color: #ec4899;
          border-radius: 50%;
          animation: pink-spin 0.8s linear infinite;
        }
        .custom-datepicker-container,
        .custom-datetimepicker-container {
          width: 100% !important;
        }
        @keyframes pink-spin {
          to { transform: rotate(360deg); }
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
          font-size: 13.5px;
          color: var(--text-light);
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
        }
      `}</style>

      {/* Header (Flat) */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Mã giảm giá (Vouchers)</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Tạo và quản lý các chiến dịch mã khuyến mãi bán hàng.</p>
        </div>
        <button className="btn-add-custom" onClick={() => navigate('/vouchers/new')}>
          <TbBookmarkPlus /> Tạo mã giảm giá
        </button>
      </div>

      {/* Filter Options (Flat layout, no container panels) */}
      <div className="filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>

        {/* Search Input matching books search bar style */}
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm mã code hoặc mô tả khuyến mãi..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Discount Type Dropdown */}
        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isDiscountDropdownOpen ? 'open' : ''} ${filterDiscountType !== 'ALL' ? 'active' : ''}`}
            onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}
          >
            <span>{filterDiscountType === 'ALL' ? 'Tất cả loại giảm' : filterDiscountType === 'PERCENTAGE' ? '%' : 'VNĐ'}</span>
            <TbChevronDown className={`arrow-icon ${isDiscountDropdownOpen ? 'open' : ''}`} />
          </div>
          {isDiscountDropdownOpen && (
            <div className="custom-dropdown-menu">
              <div
                className={`custom-dropdown-item ${filterDiscountType === 'ALL' ? 'selected' : ''}`}
                onClick={() => { setFilterDiscountType('ALL'); setIsDiscountDropdownOpen(false); }}
              >
                Tất cả loại giảm
              </div>
              <div
                className={`custom-dropdown-item ${filterDiscountType === 'PERCENTAGE' ? 'selected' : ''}`}
                onClick={() => { setFilterDiscountType('PERCENTAGE'); setIsDiscountDropdownOpen(false); }}
              >
                Giảm theo phần trăm (%)
              </div>
              <div
                className={`custom-dropdown-item ${filterDiscountType === 'FIXED_AMOUNT' ? 'selected' : ''}`}
                onClick={() => { setFilterDiscountType('FIXED_AMOUNT'); setIsDiscountDropdownOpen(false); }}
              >
                Giảm theo số tiền (VNĐ)
              </div>
            </div>
          )}
        </div>

        {/* Target Type Dropdown */}
        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isTargetDropdownOpen ? 'open' : ''} ${filterTargetType !== 'ALL_TYPES' ? 'active' : ''}`}
            onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
          >
            <span>
              {filterTargetType === 'ALL_TYPES' ? 'Tất cả đối tượng' :
                filterTargetType === 'ALL' ? 'Đơn hàng Tổng' :
                  filterTargetType === 'CATEGORY' ? 'Danh mục sản phẩm' :
                    filterTargetType === 'BOOK' ? 'Sách' : 'Phiên bản sách'}
            </span>
            <TbChevronDown className={`arrow-icon ${isTargetDropdownOpen ? 'open' : ''}`} />
          </div>
          {isTargetDropdownOpen && (
            <div className="custom-dropdown-menu">
              <div
                className={`custom-dropdown-item ${filterTargetType === 'ALL_TYPES' ? 'selected' : ''}`}
                onClick={() => { setFilterTargetType('ALL_TYPES'); setIsTargetDropdownOpen(false); }}
              >
                Tất cả đối tượng
              </div>
              <div
                className={`custom-dropdown-item ${filterTargetType === 'ALL' ? 'selected' : ''}`}
                onClick={() => { setFilterTargetType('ALL'); setIsTargetDropdownOpen(false); }}
              >
                Đơn hàng Tổng
              </div>
              <div
                className={`custom-dropdown-item ${filterTargetType === 'CATEGORY' ? 'selected' : ''}`}
                onClick={() => { setFilterTargetType('CATEGORY'); setIsTargetDropdownOpen(false); }}
              >
                Danh mục sản phẩm
              </div>
              <div
                className={`custom-dropdown-item ${filterTargetType === 'BOOK' ? 'selected' : ''}`}
                onClick={() => { setFilterTargetType('BOOK'); setIsTargetDropdownOpen(false); }}
              >
                Sách
              </div>
              <div
                className={`custom-dropdown-item ${filterTargetType === 'EDITION' ? 'selected' : ''}`}
                onClick={() => { setFilterTargetType('EDITION'); setIsTargetDropdownOpen(false); }}
              >
                Phiên bản sách
              </div>
            </div>
          )}
        </div>

        {/* Active Status Dropdown */}
        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isStatusDropdownOpen ? 'open' : ''} ${filterIsActive !== 'ALL_STATUS' ? 'active' : ''}`}
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{filterIsActive === 'ALL_STATUS' ? 'Tất cả trạng thái' : filterIsActive === 'ACTIVE' ? 'Đang hoạt động' : 'Ngừng hoạt động'}</span>
            <TbChevronDown className={`arrow-icon ${isStatusDropdownOpen ? 'open' : ''}`} />
          </div>
          {isStatusDropdownOpen && (
            <div className="custom-dropdown-menu">
              <div
                className={`custom-dropdown-item ${filterIsActive === 'ALL_STATUS' ? 'selected' : ''}`}
                onClick={() => { setFilterIsActive('ALL_STATUS'); setIsStatusDropdownOpen(false); }}
              >
                Tất cả trạng thái
              </div>
              <div
                className={`custom-dropdown-item ${filterIsActive === 'ACTIVE' ? 'selected' : ''}`}
                onClick={() => { setFilterIsActive('ACTIVE'); setIsStatusDropdownOpen(false); }}
              >
                Đang hoạt động
              </div>
              <div
                className={`custom-dropdown-item ${filterIsActive === 'INACTIVE' ? 'selected' : ''}`}
                onClick={() => { setFilterIsActive('INACTIVE'); setIsStatusDropdownOpen(false); }}
              >
                Ngừng hoạt động
              </div>
            </div>
          )}
        </div>

        {/* Coin Cost Range filter */}
        <div className="coin-range-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="number"
            className="range-input-custom"
            placeholder="Xu từ..."
            value={minCoinCost}
            onChange={(e) => setMinCoinCost(e.target.value)}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>&mdash;</span>
          <input
            type="number"
            className="range-input-custom"
            placeholder="đến..."
            value={maxCoinCost}
            onChange={(e) => setMaxCoinCost(e.target.value)}
          />
        </div>

        {/* Toggle Advanced Filters Button */}
        <button
          type="button"
          onClick={() => setIsAdvancedFiltersOpen(!isAdvancedFiltersOpen)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: isAdvancedFiltersOpen ? 'rgba(218, 68, 125, 0.15)' : 'none',
            border: isAdvancedFiltersOpen ? '1px solid var(--primary)' : '1px solid #2d2d30',
            borderRadius: '10px',
            color: isAdvancedFiltersOpen ? '#F687B3' : 'var(--text-light)',
            height: '42px',
            padding: '0 16px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '13.5px',
            transition: 'all 0.2s ease',
            outline: 'none'
          }}
        >
          <TbAdjustments style={{ fontSize: '16px' }} />
          Bộ lọc nâng cao
        </button>

        {/* Reset Filters Button */}
        {(searchTerm || filterDiscountType !== 'ALL' || filterTargetType !== 'ALL_TYPES' || filterIsActive !== 'ALL_STATUS' || minCoinCost || maxCoinCost || startDateFrom || startDateTo || endDateFrom || endDateTo || createdFrom || createdTo) && (
          <button
            type="button"
            onClick={() => {
              setSearchTerm('');
              setFilterDiscountType('ALL');
              setFilterTargetType('ALL_TYPES');
              setFilterIsActive('ALL_STATUS');
              setMinCoinCost('');
              setMaxCoinCost('');
              setStartDateFrom('');
              setStartDateTo('');
              setEndDateFrom('');
              setEndDateTo('');
              setCreatedFrom('');
              setCreatedTo('');
            }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: 'none',
              border: 'none',
              color: '#f687b3',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '13.5px',
              height: '42px'
            }}
          >
            <TbRefresh style={{ fontSize: '15px' }} />
            Đặt lại
          </button>
        )}
      </div>

      {/* Advanced Collapsible Date Filters */}
      {isAdvancedFiltersOpen && (
        <div style={{
          marginBottom: '24px',
          marginTop: '8px'
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            {/* Khoảng ngày bắt đầu */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày bắt đầu có hiệu lực
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={startDateFrom}
                    onChange={setStartDateFrom}
                    placeholder="Từ ngày..."
                  />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={startDateTo}
                    onChange={setStartDateTo}
                    placeholder="Đến ngày..."
                    align="right"
                  />
                </div>
              </div>
            </div>

            {/* Khoảng ngày kết thúc */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày kết thúc thời hạn
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={endDateFrom}
                    onChange={setEndDateFrom}
                    placeholder="Từ ngày..."
                  />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={endDateTo}
                    onChange={setEndDateTo}
                    placeholder="Đến ngày..."
                    align="right"
                  />
                </div>
              </div>
            </div>

            {/* Khoảng ngày tạo */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày tạo mã
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={createdFrom}
                    onChange={setCreatedFrom}
                    placeholder="Từ ngày..."
                  />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker
                    value={createdTo}
                    onChange={setCreatedTo}
                    placeholder="Đến ngày..."
                    align="right"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid View of Vouchers (Boxes) */}
      <div style={{ position: 'relative' }}>
        {loading && (
          <div className="pink-spinner-container" style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, background: 'rgba(26,26,26,0.3)', borderRadius: '12px', minHeight: '200px' }}>
            <div className="pink-spinner" />
            <span>Đang tải danh sách voucher...</span>
          </div>
        )}

        <div className="vouchers-box-grid" style={{ opacity: loading ? 0.4 : 1, transition: 'opacity 0.2s' }}>
          {vouchers.map(v => (
            <div key={v.voucherId} className={`v-box-card ${!v.isActive ? 'inactive' : ''}`} style={{ display: 'flex', flexDirection: 'row', gap: '14px', alignItems: 'center', minHeight: '100px', padding: '16px' }}>
              <div className="v-box-left">
                {getTargetIconAndLabel(v.targetType).icon}
              </div>
              <div className="v-box-right" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div className="v-box-header" style={{ marginBottom: '6px' }}>
                  <div className="v-box-code" style={{ fontSize: '17px' }}>{v.voucherCode}</div>
                  <div className="v-box-discount" style={{ fontSize: '20px' }}>
                    {v.discountType === 'PERCENTAGE' ? `${v.discountValue}%` : formatMoney(Number(v.discountValue))}
                  </div>
                </div>
                <p className="v-box-desc" style={{ marginBottom: '4px', fontSize: '13.5px' }}>{v.description || 'Không có mô tả.'}</p>
                {v.discountType === 'PERCENTAGE' && v.maxDiscountAmount && (
                  <span style={{ fontSize: '12px', color: 'var(--primary)', fontWeight: '600', marginBottom: '4px', display: 'block' }}>
                    Giảm tối đa: {formatMoney(Number(v.maxDiscountAmount))}
                  </span>
                )}

                <div className="v-box-actions" style={{ marginTop: 'auto', paddingTop: '8px', borderTop: '1px solid var(--border)' }}>
                  <button 
                    className={`v-box-status-toggle ${v.isActive ? 'active' : 'inactive'}`}
                    onClick={() => handleToggleStatus(v)}
                  >
                    {v.isActive ? <><TbCheck /> Hoạt động</> : <><TbBan /> Bị Khóa</>}
                  </button>
                  <div className="v-box-btn-group">
                    <button className="v-box-btn detail" title="Xem chi tiết" onClick={() => navigate(`/vouchers/edit/${v.voucherId}`)}>
                      <TbEye />
                    </button>
                    <button className="v-box-btn delete" title="Xóa" onClick={() => setDeletingId(v.voucherId)}>
                      <TbX />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {!loading && vouchers.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--text-light)' }}>
              Không tìm thấy mã giảm giá nào.
            </div>
          )}
        </div>
      </div>

      {/* Pagination controls matching Product page */}
      {totalCount > 0 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Hiển thị{' '}
            <span className="count-highlight">{vouchers.length}/{totalCount}</span>
            {' '}mã &mdash; Trang{' '}
            <span className="page-highlight">{currentPage}/{totalPages}</span>
          </span>
          <div className="pagination-controls">
            <button className="page-btn nav-arrow" onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}>
              <TbChevronLeft />
            </button>
            {getPageNumbers().map((p, i) =>
              p === '...'
                ? <span key={`dots-${i}`} className="page-dots">···</span>
                : <button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => goToPage(p as number)}>{p}</button>
            )}
            <button className="page-btn nav-arrow" onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <TbChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingId && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '400px' }}>
            <div className="modal-header">
              <h2>Xác nhận xóa</h2>
              <button className="modal-close-btn" onClick={() => setDeletingId(null)}>&times;</button>
            </div>
            <div className="modal-body" style={{ padding: '10px 0 20px 0', fontSize: '14.5px', color: 'var(--text-light)', textAlign: 'left' }}>
              Bạn có chắc chắn muốn xóa mã giảm giá này? Hành động này sẽ thực hiện soft-delete và không thể khôi phục lại trực tiếp.
            </div>
            <div className="modal-actions-row" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button className="btn-secondary" onClick={() => setDeletingId(null)} style={{ height: '36px', padding: '0 18px', borderRadius: '6px' }}>Hủy</button>
              <button className="btn-primary" onClick={handleDeleteVoucher} style={{ backgroundColor: 'var(--accent-red)', height: '36px', padding: '0 18px', borderRadius: '6px' }}>Xác nhận xóa</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Vouchers;
