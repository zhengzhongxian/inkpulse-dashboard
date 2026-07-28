import React, { useState, useEffect, useCallback } from 'react';
import {
  getPagedBannersApi,
  deleteBannerApi,
  toggleBannerStatusApi
} from '../api/banners';
import type { BannerResponse } from '../api/banners';
import { BannerFormModal } from '../components/BannerFormModal';
import { toast } from '../utils/toast';
import {
  TbPhoto, TbSearch, TbPlus, TbEdit, TbTrash,
  TbChevronLeft, TbChevronRight, TbRefresh, TbCheck, TbX, TbExternalLink, TbChevronDown, TbEye, TbEyeOff
} from 'react-icons/tb';

export const BannersList: React.FC = () => {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL'); // ALL, ACTIVE, INACTIVE
  const [isStatusDropdownOpen, setIsStatusDropdownOpen] = useState(false);

  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<BannerResponse | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchBanners = useCallback(async () => {
    try {
      setLoading(true);
      const params: any = {
        pageNumber: currentPage,
        pageSize: 10,
        searchKeyword: searchTerm.trim() || undefined,
        isActive: filterStatus === 'ACTIVE' ? true : filterStatus === 'INACTIVE' ? false : undefined
      };

      const res = await getPagedBannersApi(params);
      if (res.data && res.data.success && res.data.data) {
        const pagedData = res.data.data;
        setBanners(pagedData.items || []);
        setTotalCount(pagedData.totalCount || 0);
        setTotalPages(pagedData.totalPages || 1);
      }
    } catch (err) {
      console.error('Failed to fetch banners', err);
      toast.error('Lỗi khi tải danh sách banner.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, filterStatus]);

  useEffect(() => {
    fetchBanners();
  }, [fetchBanners]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsStatusDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const handleCreateNew = () => {
    setSelectedBanner(null);
    setIsFormModalOpen(true);
  };

  const handleEdit = (banner: BannerResponse) => {
    setSelectedBanner(banner);
    setIsFormModalOpen(true);
  };

  const handleToggleStatus = async (id: string) => {
    try {
      await toggleBannerStatusApi(id);
      toast.success('Cập nhật trạng thái banner thành công.');
      fetchBanners();
    } catch (err) {
      toast.error('Cập nhật trạng thái thất bại.');
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteId) return;
    try {
      setDeleting(true);
      await deleteBannerApi(deleteId);
      toast.success('Xóa banner thành công.');
      setDeleteId(null);
      fetchBanners();
    } catch (err) {
      toast.error('Xóa banner thất bại.');
    } finally {
      setDeleting(false);
    }
  };

  const getStatusText = (st: string) => {
    switch (st) {
      case 'ACTIVE': return 'Đang kích hoạt';
      case 'INACTIVE': return 'Đã ẩn';
      default: return 'Tất cả trạng thái';
    }
  };

  const hasActiveFilters = searchTerm !== '' || filterStatus !== 'ALL';

  const handleResetFilters = () => {
    setSearchTerm('');
    setFilterStatus('ALL');
    setCurrentPage(1);
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
        .badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
        }
        .badge.running {
          background-color: rgba(72, 187, 120, 0.15);
          color: #48BB78;
        }
        .badge.inactive {
          background-color: rgba(160, 174, 192, 0.15);
          color: #A0AEC0;
        }
        .banner-preview-img {
          width: 140px;
          height: 64px;
          border-radius: 8px;
          object-fit: cover;
          border: 1px solid var(--border);
          box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        .banner-icon-img {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          object-fit: cover;
          border: 1px solid var(--border);
        }
        .order-badge-pill {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.06);
          color: #F687B3;
          font-weight: 700;
          font-size: 13px;
          border: 1px solid var(--border);
        }
        .editions-count-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 10px;
          border-radius: 6px;
          background-color: rgba(246, 135, 179, 0.1);
          color: #f687b3;
          font-size: 12.5px;
          font-weight: 600;
        }
        .btn-action-icon {
          width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background: #1a1a1a;
          color: var(--text-light);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
          font-size: 16px;
        }
        .btn-action-icon:hover {
          color: #F687B3;
          border-color: #F687B3;
          background: rgba(246, 135, 179, 0.1);
        }
        .btn-action-icon.danger:hover {
          color: #E53E3E;
          border-color: #E53E3E;
          background: rgba(229, 62, 62, 0.1);
        }
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
        }
        .pagination-info .page-highlight {
          color: #76e4f7;
          font-weight: 700;
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
        .pink-spinner-container {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(20, 20, 20, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          backdrop-filter: blur(2px);
        }
        .pink-spinner {
          width: 36px;
          height: 36px;
          border: 3px solid rgba(246, 135, 179, 0.2);
          border-top-color: #F687B3;
          border-radius: 50%;
          animation: pink-spin 0.8s linear infinite;
        }
        @keyframes pink-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header section */}
      <div className="view-header">
        <div>
          <h1 className="view-title">Quản lý Banner</h1>
          <p className="view-subtitle">Tạo và cấu hình các banner quảng cáo đính kèm sách hiển thị sinh động trên trang chủ.</p>
        </div>
        <button className="btn-add-custom" onClick={handleCreateNew}>
          <TbPlus />
          <span>Tạo Banner Mới</span>
        </button>
      </div>

      {/* Filters Bar */}
      <div className="filters-row">
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm theo tiêu đề banner..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Status Dropdown */}
        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isStatusDropdownOpen ? 'active' : ''}`}
            onClick={() => setIsStatusDropdownOpen(!isStatusDropdownOpen)}
          >
            <span>{getStatusText(filterStatus)}</span>
            <TbChevronDown className={`arrow-icon ${isStatusDropdownOpen ? 'open' : ''}`} />
          </div>
          {isStatusDropdownOpen && (
            <div className="custom-dropdown-menu">
              {['ALL', 'ACTIVE', 'INACTIVE'].map((st) => (
                <div
                  key={st}
                  className={`custom-dropdown-item ${filterStatus === st ? 'selected' : ''}`}
                  onClick={() => { setFilterStatus(st); setIsStatusDropdownOpen(false); setCurrentPage(1); }}
                >
                  {getStatusText(st)}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reset Filter Button */}
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

      {/* Data Table */}
      <div className="card" style={{ position: 'relative', overflow: 'hidden', padding: 0, borderRadius: 0 }}>
        {loading && (
          <div className="pink-spinner-container">
            <div className="pink-spinner"></div>
          </div>
        )}

        <table className="data-table" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease-in-out' }}>
          <thead>
            <tr>
              <th style={{ width: '160px' }}>Ảnh Banner</th>
              <th>Tiêu đề & Phụ đề</th>
              <th style={{ width: '70px', textAlign: 'center' }}>Icon</th>
              <th style={{ width: '90px', textAlign: 'center' }}>Thứ tự</th>
              <th style={{ width: '140px' }}>Sách đính kèm</th>
              <th style={{ width: '140px' }}>Trạng thái</th>
              <th style={{ width: '130px', textAlign: 'center' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {banners.length > 0 ? (
              banners.map((b) => (
                <tr key={b.bannerId}>
                  <td>
                    <img
                      src={b.imageUrl}
                      alt={b.title}
                      className="banner-preview-img"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <span style={{ fontWeight: 700, color: '#4fd1c5', fontSize: '14.5px' }}>
                        {b.title}
                      </span>
                      {b.subtitle && (
                        <span style={{ fontSize: '13px', color: 'var(--text-light)' }}>
                          {b.subtitle}
                        </span>
                      )}
                      {b.linkUrl && (
                        <a
                          href={b.linkUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: '12px',
                            color: '#f687b3',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            textDecoration: 'none'
                          }}
                        >
                          <TbExternalLink /> {b.linkUrl}
                        </a>
                      )}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {b.iconUrl ? (
                      <img src={b.iconUrl} alt="icon" className="banner-icon-img" />
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>&mdash;</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <span className="order-badge-pill">{b.displayOrder}</span>
                  </td>
                  <td>
                    <span className="editions-count-tag">
                      <TbPhoto style={{ fontSize: '14px' }} />
                      {b.editions ? b.editions.length : 0} sản phẩm
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${b.isActive ? 'running' : 'inactive'}`}>
                      {b.isActive ? 'Đang kích hoạt' : 'Đã ẩn'}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                      <button
                        className="btn-action-icon"
                        title={b.isActive ? 'Ẩn Banner' : 'Kích hoạt Banner'}
                        onClick={() => handleToggleStatus(b.bannerId)}
                      >
                        {b.isActive ? <TbEyeOff /> : <TbEye />}
                      </button>
                      <button
                        className="btn-action-icon"
                        title="Chỉnh sửa Banner"
                        onClick={() => handleEdit(b)}
                      >
                        <TbEdit />
                      </button>
                      <button
                        className="btn-action-icon danger"
                        title="Xóa Banner"
                        onClick={() => setDeleteId(b.bannerId)}
                      >
                        <TbTrash />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '48px 24px' }}>
                  {loading ? (
                    'Đang tải danh sách banner...'
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                      <TbPhoto style={{ fontSize: '48px', color: 'var(--text-muted)', opacity: 0.5 }} />
                      <span style={{ fontSize: '15px', fontWeight: 500 }}>Không tìm thấy banner quảng cáo nào.</span>
                    </div>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalCount > 0 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Hiển thị{' '}
            <span className="count-highlight">{banners.length}/{totalCount}</span>
            {' '}banner &mdash; Trang{' '}
            <span className="page-highlight">{currentPage}/{totalPages}</span>
          </span>
          <div className="pagination-controls">
            <button
              className="page-btn nav-arrow"
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <TbChevronLeft />
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                className={`page-btn ${currentPage === p ? 'active' : ''}`}
                onClick={() => setCurrentPage(p)}
              >
                {p}
              </button>
            ))}
            <button
              className="page-btn nav-arrow"
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <TbChevronRight />
            </button>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {isFormModalOpen && (
        <BannerFormModal
          isOpen={isFormModalOpen}
          onClose={() => setIsFormModalOpen(false)}
          onSuccess={() => {
            setIsFormModalOpen(false);
            fetchBanners();
          }}
          bannerToEdit={selectedBanner}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1100,
            padding: '20px'
          }}
        >
          <div
            style={{
              backgroundColor: '#161616',
              border: '1px solid var(--border)',
              borderRadius: '0px',
              width: '100%',
              maxWidth: '440px',
              padding: '24px',
              boxShadow: 'var(--shadow-lg)',
              position: 'relative'
            }}
          >
            <button
              onClick={() => setDeleteId(null)}
              style={{
                position: 'absolute',
                top: '16px',
                right: '16px',
                background: 'none',
                border: 'none',
                color: '#94a3b8',
                fontSize: '20px',
                cursor: 'pointer'
              }}
            >
              <TbX />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
              <div
                style={{
                  width: '44px',
                  height: '44px',
                  borderRadius: '12px',
                  backgroundColor: 'rgba(229, 62, 62, 0.15)',
                  color: '#E53E3E',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}
              >
                <TbTrash />
              </div>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#fff' }}>Xác nhận xóa Banner</h3>
                <p style={{ margin: '4px 0 0', fontSize: '13px', color: 'var(--text-light)' }}>Hành động này không thể hoàn tác.</p>
              </div>
            </div>

            <p style={{ fontSize: '14px', color: 'var(--text-main)', marginBottom: '24px', lineHeight: 1.5 }}>
              Bạn có chắc chắn muốn xóa banner quảng cáo này khỏi hệ thống không? Tất cả các thiết lập gán sản phẩm đính kèm cũng sẽ bị xóa.
            </p>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                onClick={handleDeleteConfirm}
                disabled={deleting}
                style={{
                  height: '40px',
                  padding: '0 24px',
                  borderRadius: '8px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #e53e3e, #c53030)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '13.5px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}
              >
                {deleting ? 'Đang xóa...' : 'Xóa Banner'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
