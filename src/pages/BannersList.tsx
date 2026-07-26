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
  TbChevronLeft, TbChevronRight, TbRefresh, TbLoader2, TbCheck, TbX, TbExternalLink
} from 'react-icons/tb';

export const BannersList: React.FC = () => {
  const [banners, setBanners] = useState<BannerResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');

  // Modal states
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

  return (
    <div className="banners-page-container">
      {/* Page Header */}
      <div className="page-header-custom">
        <div className="header-title-wrap">
          <div className="icon-badge">
            <TbPhoto />
          </div>
          <div>
            <h2>Quản Lý Banner Quảng Cáo</h2>
            <p>Tạo mới, chỉnh sửa banner MinIO và gán các sản phẩm sách đính kèm</p>
          </div>
        </div>
        <button className="btn-create-banner" onClick={handleCreateNew}>
          <TbPlus /> <span>Tạo Banner Mới</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar-custom">
        <div className="search-input-wrap">
          <TbSearch className="search-icon" />
          <input
            type="text"
            placeholder="Tìm kiếm banner theo tên..."
            value={searchTerm}
            onChange={e => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
          />
        </div>

        <div className="filter-tabs-custom">
          <button
            className={`tab-btn ${filterStatus === 'ALL' ? 'active' : ''}`}
            onClick={() => { setFilterStatus('ALL'); setCurrentPage(1); }}
          >
            Tất Cả ({totalCount})
          </button>
          <button
            className={`tab-btn ${filterStatus === 'ACTIVE' ? 'active' : ''}`}
            onClick={() => { setFilterStatus('ACTIVE'); setCurrentPage(1); }}
          >
            Đang Kích Hoạt
          </button>
          <button
            className={`tab-btn ${filterStatus === 'INACTIVE' ? 'active' : ''}`}
            onClick={() => { setFilterStatus('INACTIVE'); setCurrentPage(1); }}
          >
            Đã Ẩn
          </button>
        </div>

        <button className="btn-refresh" onClick={fetchBanners}>
          <TbRefresh />
        </button>
      </div>

      {/* Table Area */}
      <div className="table-card-custom">
        {loading ? (
          <div className="table-loading"><TbLoader2 className="animate-spin" /> Đang tải dữ liệu banner...</div>
        ) : banners.length > 0 ? (
          <div className="table-responsive">
            <table className="banners-table">
              <thead>
                <tr>
                  <th>Ảnh Banner (MinIO)</th>
                  <th>Tiêu Đề & Phụ Đề</th>
                  <th>Icon</th>
                  <th>Thứ Tự</th>
                  <th>Sách Đính Kèm</th>
                  <th>Trạng Thái</th>
                  <th className="text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody>
                {banners.map(b => (
                  <tr key={b.bannerId}>
                    <td>
                      <div className="banner-thumb-wrap">
                        {b.imageUrl ? (
                          <img src={b.imageUrl} alt={b.title} className="banner-thumb" />
                        ) : (
                          <div className="no-thumb">No Image</div>
                        )}
                      </div>
                    </td>
                    <td>
                      <div className="banner-title-cell">
                        <span className="banner-title-text">{b.title}</span>
                        {b.subtitle && <span className="banner-sub-text">{b.subtitle}</span>}
                        {b.linkUrl && (
                          <a href={b.linkUrl} target="_blank" rel="noreferrer" className="banner-link">
                            <TbExternalLink /> {b.linkUrl}
                          </a>
                        )}
                      </div>
                    </td>
                    <td>
                      {b.iconUrl ? (
                        <img src={b.iconUrl} alt="icon" className="icon-thumb" />
                      ) : (
                        <span className="text-muted">-</span>
                      )}
                    </td>
                    <td>
                      <span className="order-badge">#{b.displayOrder}</span>
                    </td>
                    <td>
                      <span className="editions-count-badge">
                        {b.editions ? b.editions.length : 0} cuốn sách
                      </span>
                    </td>
                    <td>
                      <button
                        className={`status-pill ${b.isActive ? 'active' : 'inactive'}`}
                        onClick={() => handleToggleStatus(b.bannerId)}
                      >
                        {b.isActive ? 'ĐANG HIỂN THỊ' : 'ĐÃ ẨN'}
                      </button>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="btn-action edit" onClick={() => handleEdit(b)} title="Chỉnh sửa">
                          <TbEdit />
                        </button>
                        <button className="btn-action delete" onClick={() => setDeleteId(b.bannerId)} title="Xóa">
                          <TbTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="table-empty">Không tìm thấy banner quảng cáo nào.</div>
        )}

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="pagination-footer-custom">
            <span className="pagination-info">
              Trang {currentPage} / {totalPages} (Tổng {totalCount} banner)
            </span>
            <div className="pagination-controls">
              <button
                disabled={currentPage <= 1}
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              >
                <TbChevronLeft />
              </button>
              <button
                disabled={currentPage >= totalPages}
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              >
                <TbChevronRight />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create / Edit Form Modal */}
      <BannerFormModal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        onSuccess={fetchBanners}
        bannerToEdit={selectedBanner}
      />

      {/* Delete Confirmation Modal */}
      {deleteId && (
        <div className="confirm-modal-overlay">
          <div className="confirm-modal-box">
            <h4>Xác Nhận Xóa Banner</h4>
            <p>Bạn có chắc chắn muốn xóa banner quảng cáo này? Thao tác này sẽ gỡ bỏ banner khỏi trang chủ.</p>
            <div className="confirm-modal-actions">
              <button className="btn-cancel" onClick={() => setDeleteId(null)} disabled={deleting}>
                Hủy
              </button>
              <button className="btn-danger" onClick={handleDeleteConfirm} disabled={deleting}>
                {deleting ? <TbLoader2 className="animate-spin" /> : <TbCheck />}
                <span>Xác Nhận Xóa</span>
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .banners-page-container {
          padding: 28px;
          color: #f8fafc;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        .page-header-custom {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .header-title-wrap {
          display: flex;
          align-items: center;
          gap: 16px;
        }

        .icon-badge {
          width: 44px;
          height: 44px;
          background: rgba(218, 68, 125, 0.1);
          color: #da447d;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
        }

        .header-title-wrap h2 {
          margin: 0;
          font-size: 22px;
          font-weight: 700;
          color: #f8fafc;
        }

        .header-title-wrap p {
          margin: 4px 0 0 0;
          font-size: 13.5px;
          color: #94a3b8;
        }

        .btn-create-banner {
          background: #da447d;
          border: none;
          color: #ffffff;
          padding: 10px 20px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 8px;
          transition: opacity 0.2s ease;
        }

        .btn-create-banner:hover {
          opacity: 0.9;
        }

        .filter-bar-custom {
          display: flex;
          align-items: center;
          gap: 16px;
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 12px 16px;
        }

        .search-input-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 8px 14px;
          flex: 1;
        }

        .search-input-wrap input {
          background: transparent;
          border: none;
          color: #f8fafc;
          outline: none;
          width: 100%;
          font-size: 14px;
        }

        .search-icon { color: #64748b; font-size: 18px; }

        .filter-tabs-custom {
          display: flex;
          gap: 6px;
        }

        .tab-btn {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #94a3b8;
          padding: 6px 14px;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
        }

        .tab-btn.active {
          background: rgba(218, 68, 125, 0.12);
          color: #da447d;
          border-color: #da447d;
          font-weight: 600;
        }

        .btn-refresh {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #94a3b8;
          width: 36px;
          height: 36px;
          border-radius: 8px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
        }

        .table-card-custom {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          overflow: hidden;
        }

        .banners-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }

        .banners-table th {
          background: #1a1a1a;
          padding: 14px 18px;
          font-size: 13px;
          font-weight: 700;
          color: #cbd5e1;
          border-bottom: 1px solid #2a2a2a;
        }

        .banners-table td {
          padding: 14px 18px;
          border-bottom: 1px solid #2a2a2a;
          font-size: 14px;
          vertical-align: middle;
        }

        .banner-thumb-wrap {
          width: 120px;
          height: 60px;
          background: #1a1a1a;
          border-radius: 6px;
          overflow: hidden;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid #2a2a2a;
        }

        .banner-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .no-thumb {
          font-size: 11px;
          color: #64748b;
        }

        .banner-title-cell {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }

        .banner-title-text {
          font-weight: 700;
          color: #f8fafc;
        }

        .banner-sub-text {
          font-size: 12.5px;
          color: #94a3b8;
        }

        .banner-link {
          font-size: 12px;
          color: #da447d;
          display: flex;
          align-items: center;
          gap: 4px;
          text-decoration: none;
        }

        .icon-thumb {
          width: 32px;
          height: 32px;
          object-fit: contain;
        }

        .order-badge {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: 700;
          color: #cbd5e1;
        }

        .editions-count-badge {
          background: rgba(218, 68, 125, 0.08);
          color: #da447d;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 600;
        }

        .status-pill {
          border: none;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 11.5px;
          font-weight: 800;
          cursor: pointer;
          letter-spacing: 0.5px;
        }

        .status-pill.active {
          background: rgba(72, 187, 120, 0.15);
          color: #48bb78;
          border: 1px solid rgba(72, 187, 120, 0.3);
        }

        .status-pill.inactive {
          background: rgba(148, 163, 184, 0.15);
          color: #94a3b8;
          border: 1px solid rgba(148, 163, 184, 0.3);
        }

        .text-right { text-align: right; }

        .action-buttons {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
        }

        .btn-action {
          width: 32px;
          height: 32px;
          border-radius: 6px;
          border: 1px solid #2a2a2a;
          background: #1a1a1a;
          color: #94a3b8;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
        }

        .btn-action.edit:hover { color: #da447d; border-color: #da447d; }
        .btn-action.delete:hover { color: #ef4444; border-color: #ef4444; }

        .table-loading, .table-empty {
          padding: 40px;
          text-align: center;
          color: #64748b;
          font-size: 14px;
        }

        .pagination-footer-custom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 20px;
          border-top: 1px solid #2a2a2a;
        }

        .pagination-info { font-size: 13px; color: #94a3b8; }

        .pagination-controls { display: flex; gap: 8px; }

        .pagination-controls button {
          width: 32px;
          height: 32px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          color: #f8fafc;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .pagination-controls button:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }

        .confirm-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          z-index: 1200;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .confirm-modal-box {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 10px;
          padding: 24px;
          max-width: 400px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .confirm-modal-box h4 { margin: 0; color: #ef4444; font-size: 18px; }
        .confirm-modal-box p { margin: 0; color: #cbd5e1; font-size: 14px; line-height: 1.5; }

        .confirm-modal-actions {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .btn-cancel {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #94a3b8;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
        }

        .btn-danger {
          background: #ef4444;
          border: none;
          color: #ffffff;
          padding: 8px 16px;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
          font-weight: 600;
        }
      `}</style>
    </div>
  );
};
