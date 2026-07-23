import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  getInternalFlashSalesApi,
  deleteFlashSaleApi,
  createFlashSaleApi
} from '../api/flashsales';
import type { FlashSaleResponse } from '../api/flashsales';
import { toast } from '../utils/toast';
import {
  TbBolt, TbSearch, TbCheck, TbEdit, TbTrash,
  TbChevronDown, TbChevronLeft, TbChevronRight, TbAdjustments, TbRefresh,
  TbCalendar, TbX, TbEye, TbLoader
} from 'react-icons/tb';
import { CustomDateTimePicker } from '../components/CustomDateTimePicker';
import { PAGE_SIZE } from '../utils/constants';

const FlashSales: React.FC = () => {
  const navigate = useNavigate();
  const [flashSales, setFlashSales] = useState<FlashSaleResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Smart Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('ALL'); // ALL, RUNNING, UPCOMING, ENDED, INACTIVE
  const [minStock, setMinStock] = useState('');
  const [maxStock, setMaxStock] = useState('');
  const [minDiscount, setMinDiscount] = useState('');
  const [maxDiscount, setMaxDiscount] = useState('');

  // Collapsible Advanced Filters
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);

  // Date Range Filters State
  const [startDateFrom, setStartDateFrom] = useState('');
  const [startDateTo, setStartDateTo] = useState('');
  const [endDateFrom, setEndDateFrom] = useState('');
  const [endDateTo, setEndDateTo] = useState('');
  const [createdFrom, setCreatedFrom] = useState('');
  const [createdTo, setCreatedTo] = useState('');

  // Dropdown UI state
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCampaignName, setNewCampaignName] = useState('');
  const [newStartDate, setNewStartDate] = useState('');
  const [newEndDate, setNewEndDate] = useState('');
  const [submittingCampaign, setSubmittingCampaign] = useState(false);

  const fetchFlashSales = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        pageNumber: currentPage,
        pageSize: PAGE_SIZE,
        searchKeyword: searchTerm.trim() || undefined,
        minStock: minStock ? parseInt(minStock) : undefined,
        maxStock: maxStock ? parseInt(maxStock) : undefined,
        minDiscount: minDiscount ? parseFloat(minDiscount) : undefined,
        maxDiscount: maxDiscount ? parseFloat(maxDiscount) : undefined,
        startDateFrom: startDateFrom || undefined,
        startDateTo: startDateTo || undefined,
        endDateFrom: endDateFrom || undefined,
        endDateTo: endDateTo || undefined,
        createdFrom: createdFrom || undefined,
        createdTo: createdTo || undefined
      };

      if (filterStatus === 'INACTIVE') {
        params.isActive = false;
      } else if (filterStatus === 'RUNNING' || filterStatus === 'UPCOMING' || filterStatus === 'ENDED') {
        params.isActive = true;
      }

      const res = await getInternalFlashSalesApi(params);
      if (res.data && res.data.success) {
        let items = res.data.data.items || [];
        
        // Frontend local filtering for status time ranges if active status
        if (filterStatus === 'RUNNING') {
          const now = new Date();
          items = items.filter((x: any) => new Date(x.startDate) <= now && new Date(x.endDate) >= now);
        } else if (filterStatus === 'UPCOMING') {
          const now = new Date();
          items = items.filter((x: any) => new Date(x.startDate) > now);
        } else if (filterStatus === 'ENDED') {
          const now = new Date();
          items = items.filter((x: any) => new Date(x.endDate) < now);
        }

        setFlashSales(items);
        setTotalCount(res.data.data.totalItems || items.length);
        setTotalPages(res.data.data.totalPages || 1);
      }
    } catch (e: any) {
      console.error(e);
      toast.error('Lấy danh sách Flash Sale thất bại!');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus, minStock, maxStock, minDiscount, maxDiscount, startDateFrom, startDateTo, endDateFrom, endDateTo, createdFrom, createdTo]);

  useEffect(() => {
    fetchFlashSales();
  }, [fetchFlashSales]);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setMinStock('');
    setMaxStock('');
    setMinDiscount('');
    setMaxDiscount('');
    setStartDateFrom('');
    setStartDateTo('');
    setEndDateFrom('');
    setEndDateTo('');
    setCreatedFrom('');
    setCreatedTo('');
    setCurrentPage(1);
    toast.success('Đã đặt lại bộ lọc');
  };

  const hasActiveFilters = 
    searchTerm || filterStatus !== 'ALL' || minStock || maxStock || minDiscount || maxDiscount ||
    startDateFrom || startDateTo || endDateFrom || endDateTo || createdFrom || createdTo;

  // Format currency helper
  const formatVnd = (amount: number) => {
    return amount.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  };

  // Status text helper
  const getStatusText = (status: string) => {
    switch (status) {
      case 'RUNNING': return 'Đang diễn ra';
      case 'UPCOMING': return 'Sắp diễn ra';
      case 'ENDED': return 'Đã kết thúc';
      case 'INACTIVE': return 'Ngừng hoạt động';
      default: return 'Tất cả trạng thái';
    }
  };

  // Calculate live badge status
  const getLiveBadge = (sale: FlashSaleResponse) => {
    if (!sale.isActive) {
      return <span className="badge inactive">Bị khóa</span>;
    }
    const now = new Date();
    const start = new Date(sale.startDate);
    const end = new Date(sale.endDate);

    if (now >= start && now <= end) {
      return <span className="badge running">Đang diễn ra</span>;
    } else if (now < start) {
      return <span className="badge upcoming">Sắp diễn ra</span>;
    } else {
      return <span className="badge ended">Đã kết thúc</span>;
    }
  };


  const localDateToApi = (dateTimeStr: string, isEnd?: boolean) => {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('+07:00') || dateTimeStr.includes('Z')) return dateTimeStr;
    if (!dateTimeStr.includes('T')) {
      const timeStr = isEnd ? 'T23:59:59.000+07:00' : 'T00:00:00.000+07:00';
      return dateTimeStr + timeStr;
    }
    return dateTimeStr + ':00.000+07:00';
  };

  const handleCreateCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newCampaignName.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch!');
      return;
    }
    if (!newStartDate || !newEndDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc!');
      return;
    }
    if (new Date(newStartDate) >= new Date(newEndDate)) {
      toast.error('Thời gian bắt đầu phải trước thời gian kết thúc!');
      return;
    }

    try {
      setSubmittingCampaign(true);
      const res = await createFlashSaleApi({
        name: newCampaignName.trim(),
        startDate: localDateToApi(newStartDate, false),
        endDate: localDateToApi(newEndDate, true)
      });
      if (res.data && res.data.success) {
        toast.success('Tạo chiến dịch Flash Sale thành công! Tiếp tục cấu hình sản phẩm.');
        setIsCreateModalOpen(false);
        setNewCampaignName('');
        setNewStartDate('');
        setNewEndDate('');
        navigate(`/flash-sales/edit/${res.data.data.flashSaleId}`);
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Tạo chiến dịch thất bại!');
    } finally {
      setSubmittingCampaign(false);
    }
  };

  return (
    <div className="view-container">
      <style>{`
        .view-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }
        .view-subtitle {
          font-size: 14px;
          color: var(--text-light);
          margin: 0;
        }
        .custom-datetimepicker-container {
          width: 100% !important;
        }
        .animate-spin-custom {
          animation: spin-key-custom 0.8s linear infinite;
        }
        @keyframes spin-key-custom {
          to { transform: rotate(360deg); }
        }
        .btn-add-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: var(--primary);
          border: none;
          color: #ffffff;
          font-weight: 600;
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 14.5px;
          cursor: pointer;
          transition: var(--transition);
          height: 42px;
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .filters-row {
          display: flex;
          gap: 16px;
          align-items: center;
          margin-bottom: 24px;
          flex-wrap: wrap;
        }
        .search-wrap-custom {
          display: flex;
          align-items: center;
          flex: 2;
          min-width: 320px;
          height: 44px;
          border: 2px solid var(--primary);
          border-radius: 10px;
          background-color: #1a1a1a;
          padding: 0;
          overflow: hidden;
          transition: var(--transition);
        }
        .search-wrap-custom:focus-within {
          border-color: var(--primary-hover);
        }
        .search-input-custom {
          flex: 1;
          height: 100%;
          background: none !important;
          border: none !important;
          color: var(--text-main);
          font-size: 14px;
          outline: none !important;
          padding: 0 16px !important;
        }
        .search-input-custom::placeholder {
          color: var(--text-light);
        }
        .search-btn-custom {
          background-color: var(--primary);
          border: none;
          color: #ffffff;
          width: 52px;
          height: 100%;
          font-size: 18px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
        }
        .search-btn-custom:hover {
          background-color: var(--primary-hover);
        }
        .btn-detail-link {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          cursor: pointer;
          font-size: 13.5px;
          padding: 0;
          transition: var(--transition);
        }
        .btn-detail-link:hover {
          text-decoration: underline;
        }
        .range-input-custom {
          background-color: #1a1a1a;
          border: 1px solid var(--border);
          border-radius: 10px;
          color: var(--text-main);
          height: 42px;
          padding: 0 12px !important;
          font-size: 14px;
          width: 130px;
          outline: none;
          transition: var(--transition);
        }
        .range-input-custom:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }
        .range-input-custom::placeholder {
          color: var(--text-light);
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
          height: 42px;
          transition: var(--transition);
        }
        .custom-dropdown-header.active {
          color: #F687B3 !important;
          border-color: #4a4a4f !important;
        }
        .custom-dropdown-header:hover {
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
        .btn-advanced-toggle {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          height: 42px;
          padding: 0 16px;
          border-radius: 10px;
          background-color: #1a1a1a;
          border: 1px solid var(--border);
          color: var(--text-light);
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          outline: none;
        }
        .btn-advanced-toggle:hover, .btn-advanced-toggle.active {
          border-color: #4a4a4f;
          color: var(--text-main);
        }
        .btn-reset-custom {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          height: 42px;
          padding: 0 16px;
          border: none;
          background: none;
          color: #f687b3;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-reset-custom:hover {
          color: var(--primary-hover);
        }
        .advanced-filters-panel {
          border-radius: var(--radius-md);
          padding: 0;
          margin-bottom: 24px;
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 20px;
        }
        .filter-group-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .filter-group-custom label {
          font-size: 13px;
          font-weight: 600;
          color: #F687B3;
        }
        .date-range-inputs {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 11px;
          font-weight: 600;
        }
        .badge.running {
          background-color: rgba(72, 187, 120, 0.15);
          color: #48BB78;
        }
        .badge.upcoming {
          background-color: rgba(237, 137, 54, 0.15);
          color: #ED8936;
        }
        .badge.ended {
          background-color: rgba(229, 62, 62, 0.15);
          color: #E53E3E;
        }
        .badge.inactive {
          background-color: rgba(160, 174, 192, 0.15);
          color: #A0AEC0;
        }
        .book-info-cell {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .book-thumb-mini {
          width: 38px;
          height: 52px;
          border-radius: 4px;
          object-fit: cover;
          border: 1px solid var(--border);
        }
        .book-title-cell {
          font-weight: 700;
          color: #4fd1c5;
          text-decoration: none;
          font-size: 14px;
          transition: var(--transition);
        }
        .book-title-cell:hover {
          color: #4fd1c5;
          text-decoration: underline;
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
        .actions-cell {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
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
      `}</style>

      {/* Header section */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Quản lý Flash Sale</h1>
          <p className="view-subtitle">Tạo và cấu hình các chương trình Flash Sale khuyến mãi giảm giá cực sốc.</p>
        </div>
        <button className="btn-add-custom" onClick={() => setIsCreateModalOpen(true)}>
          <TbBolt />
          <span>Tạo Flash Sale</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-row">
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm theo tên chiến dịch..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Status filter dropdown */}
        <div className="custom-dropdown-container" style={{ width: '180px' }}>
          <div
            className={`custom-dropdown-header ${filterStatus !== 'ALL' ? 'active' : ''}`}
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusText(filterStatus)}</span>
            <TbChevronDown className={`arrow-icon ${isStatusDropdownOpen ? 'open' : ''}`} />
          </div>
          {isStatusDropdownOpen && (
            <div className="custom-dropdown-menu">
              {['ALL', 'RUNNING', 'UPCOMING', 'ENDED', 'INACTIVE'].map((st) => (
                <div
                  key={st}
                  className={`custom-dropdown-item ${filterStatus === st ? 'selected' : ''}`}
                  onClick={() => { setFilterStatus(st); setIsStatusDropdownOpen(false); }}
                >
                  {getStatusText(st)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock range */}
        <input
          type="number"
          className="range-input-custom"
          placeholder="Tồn kho từ..."
          value={minStock}
          onChange={(e) => setMinStock(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
        <input
          type="number"
          className="range-input-custom"
          placeholder="đến..."
          value={maxStock}
          onChange={(e) => setMaxStock(e.target.value)}
        />

        {/* Discount range */}
        <input
          type="number"
          className="range-input-custom"
          placeholder="Giảm giá từ..."
          value={minDiscount}
          onChange={(e) => setMinDiscount(e.target.value)}
        />
        <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
        <input
          type="number"
          className="range-input-custom"
          placeholder="đến..."
          value={maxDiscount}
          onChange={(e) => setMaxDiscount(e.target.value)}
        />

        {/* Advanced trigger toggle */}
        <button
          type="button"
          onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: showAdvancedFilters ? 'rgba(218, 68, 125, 0.15)' : 'none',
            border: showAdvancedFilters ? '1px solid var(--primary)' : '1px solid #2d2d30',
            borderRadius: '10px',
            color: showAdvancedFilters ? '#F687B3' : 'var(--text-light)',
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

        {/* Reset Filters button */}
        {hasActiveFilters && (
          <button
            type="button"
            onClick={handleResetFilters}
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

      {/* Advanced Filters Panel */}
      {showAdvancedFilters && (
        <div style={{ marginBottom: '24px', marginTop: '8px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày bắt đầu có hiệu lực
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={startDateFrom} onChange={setStartDateFrom} placeholder="Từ ngày..." />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={startDateTo} onChange={setStartDateTo} placeholder="Đến ngày..." align="right" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày kết thúc thời hạn
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={endDateFrom} onChange={setEndDateFrom} placeholder="Từ ngày..." />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={endDateTo} onChange={setEndDateTo} placeholder="Đến ngày..." align="right" />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#F687B3' }}>
                Khoảng ngày tạo chiến dịch
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={createdFrom} onChange={setCreatedFrom} placeholder="Từ ngày..." />
                </div>
                <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                <div style={{ flex: 1 }}>
                  <CustomDateTimePicker value={createdTo} onChange={setCreatedTo} placeholder="Đến ngày..." align="right" />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Table */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, borderRadius: 0 }}>
        {loading && (
          <div className="pink-spinner-container">
            <div className="pink-spinner"></div>
          </div>
        )}

        <table className="data-table">
          <thead>
            <tr>
              <th>Tên chiến dịch</th>
              <th>Số sản phẩm</th>
              <th>Thời gian bắt đầu</th>
              <th>Thời gian kết thúc</th>
              <th style={{ width: '150px' }}>Trạng thái</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {flashSales.length > 0 ? (
              flashSales.map((fs) => (
                <tr key={fs.flashSaleId}>
                  <td>
                    <Link to={`/flash-sales/edit/${fs.flashSaleId}`} className="book-title-cell">
                      {fs.name}
                    </Link>
                  </td>
                  <td>
                    <span style={{ fontSize: '14px', fontWeight: '600', color: '#f687b3' }}>
                      {fs.itemCount} sản phẩm
                    </span>
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    {new Date(fs.startDate).toLocaleString('vi-VN')}
                  </td>
                  <td style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                    {new Date(fs.endDate).toLocaleString('vi-VN')}
                  </td>
                  <td>{getLiveBadge(fs)}</td>
                  <td>
                    <div className="actions-cell">
                      <button
                        className="btn-detail-link"
                        onClick={() => navigate(`/flash-sales/edit/${fs.flashSaleId}`)}
                      >
                        Chi tiết
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '32px' }}>
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy chương trình Flash Sale nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {!loading && totalCount > 0 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Hiển thị{' '}
            <span className="count-highlight">{flashSales.length}/{totalCount}</span>
            {' '}chiến dịch &mdash; Trang{' '}
            <span className="page-highlight">{currentPage}/{totalPages}</span>
          </span>
          <div className="pagination-controls">
            <button className="page-btn nav-arrow" onClick={() => setCurrentPage(currentPage - 1)} disabled={currentPage === 1}>
              <TbChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button key={p} className={`page-btn ${currentPage === p ? 'active' : ''}`} onClick={() => setCurrentPage(p)}>{p}</button>
            ))}
            <button className="page-btn nav-arrow" onClick={() => setCurrentPage(currentPage + 1)} disabled={currentPage === totalPages}>
              <TbChevronRight />
            </button>
          </div>
        </div>
      )}


      {/* Create Campaign Modal */}
      {isCreateModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1100
        }}>
          <div className="modal-content card" style={{ width: '600px', padding: '24px', position: 'relative', borderRadius: '0' }}>

            <h3 style={{ fontSize: '20px', fontWeight: 'bold', margin: '0 0 16px 0', color: '#da447d' }}>
              Tạo mới chiến dịch Flash Sale
            </h3>

            {/* Banner warning at the top of the form content, with no border-radius */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              backgroundColor: 'rgba(218, 68, 125, 0.08)', border: '1px solid rgba(218, 68, 125, 0.3)',
              borderRadius: '0', padding: '16px', color: '#F687B3', fontSize: '13.5px', marginBottom: '20px'
            }}>
              <span>Vui lòng tạo chiến dịch Flash Sale trước, sau đó bạn có thể thêm các sản phẩm áp dụng giảm giá vào chiến dịch.</span>
            </div>

            <form onSubmit={handleCreateCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Campaign name */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Tên chiến dịch Flash Sale</label>
                <input
                  type="text"
                  placeholder="Ví dụ: Flash Sale Cuối Tuần T7-CN"
                  value={newCampaignName}
                  onChange={(e) => setNewCampaignName(e.target.value)}
                  style={{
                    backgroundColor: '#0d0d0f', border: '1px solid #2d2d30', borderRadius: '8px',
                    color: '#4fd1c5', fontWeight: '700', height: '44px', padding: '0 12px', fontSize: '14.5px',
                    outline: 'none'
                  }}
                />
              </div>

              {/* Start and End date time in one row */}
              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '220px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Thời gian bắt đầu</label>
                  <CustomDateTimePicker value={newStartDate} onChange={setNewStartDate} placeholder="Chọn thời gian bắt đầu..." />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', flex: '1', minWidth: '220px' }}>
                  <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Thời gian kết thúc</label>
                  <CustomDateTimePicker value={newEndDate} onChange={setNewEndDate} placeholder="Chọn thời gian kết thúc..." />
                </div>
              </div>

              {/* Right-aligned action buttons */}
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCreateModalOpen(false)}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: '1px solid var(--border)',
                    backgroundColor: 'transparent', color: '#ffffff', cursor: 'pointer', fontSize: '14px'
                  }}
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={submittingCampaign}
                  style={{
                    padding: '10px 20px', borderRadius: '8px', border: 'none',
                    backgroundColor: 'var(--primary)', color: '#ffffff', fontWeight: '600', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: '6px', fontSize: '14px'
                  }}
                >
                  {submittingCampaign ? (
                    <>
                      <TbLoader className="animate-spin-custom" />
                      <span>Đang tạo...</span>
                    </>
                  ) : (
                    <>
                      <TbBolt />
                      <span>Tạo chiến dịch</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSales;
