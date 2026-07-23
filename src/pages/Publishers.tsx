import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPagedPublishersApi, deletePublisherApi } from '../api/books';
import { TbSearch, TbBookmarkPlus, TbEdit, TbTrash, TbChevronLeft, TbChevronRight, TbLoader } from 'react-icons/tb';
import { toast } from '../utils/toast';

interface Publisher {
  id: string;
  name: string;
  address: string | null;
}

import { PAGE_SIZE } from '../utils/constants';

export const Publishers: React.FC = () => {
  const navigate = useNavigate();
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadPublishers = async (page: number, keyword?: string) => {
    setLoading(true);
    try {
      const res = await getPagedPublishersApi({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchKeyword: keyword || undefined
      });
      if (res.data && res.data.success) {
        const paged = res.data.data;
        setPublishers(paged.items || []);
        setTotalPages(paged.totalPages || 1);
        setTotalCount(paged.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading publishers:', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể lấy danh sách nhà xuất bản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadPublishers(currentPage, searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, currentPage]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà xuất bản "${name}" không?`)) return;
    try {
      setDeletingId(id);
      await deletePublisherApi(id);
      toast.success('Xóa thành công', `Nhà xuất bản "${name}" đã được xóa.`);
      const newPage = publishers.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      loadPublishers(newPage, searchTerm);
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa nhà xuất bản này.');
    } finally {
      setDeletingId(null);
    }
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
    <div className="publishers-view fade-in">
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
        .btn-detail-link {
          background: none;
          border: none;
          color: var(--primary);
          cursor: pointer;
          font-weight: 600;
          font-size: 13.5px;
          transition: var(--transition);
          white-space: nowrap;
        }
        .btn-detail-link:hover {
          text-decoration: underline;
          color: var(--primary-hover);
        }
        .pub-name-cell {
          font-weight: 700;
          color: #4fd1c5;
        }
        .pagination-bar {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-top: 20px;
          gap: 12px;
          flex-wrap: wrap;
        }
        .pagination-info {
          font-size: 13px;
          color: var(--text-muted);
        }
        .pagination-controls {
          display: flex;
          align-items: center;
          gap: 5px;
        }
        .page-btn {
          min-width: 34px;
          height: 34px;
          border-radius: 8px;
          border: 1px solid var(--border);
          background-color: var(--bg-secondary);
          color: var(--text-muted);
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          padding: 0 6px;
        }
        .page-btn:hover:not(:disabled) {
          border-color: var(--primary);
          color: var(--primary);
          background-color: rgba(246, 99, 152, 0.08);
        }
        .page-btn.active {
          background-color: var(--primary);
          border-color: var(--primary);
          color: #fff;
          font-weight: 700;
        }
      `}</style>

      {/* Header & toolbar */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Quản lý Nhà xuất bản</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Danh sách các nhà xuất bản phát hành sách trong hệ thống.</p>
        </div>
        <button className="btn-add-custom" onClick={() => navigate('/publishers/new')}>
          <TbBookmarkPlus style={{ fontSize: '18px' }} /> Thêm nhà xuất bản
        </button>
      </div>

      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm theo tên nhà xuất bản..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>
      </div>

      {/* Table content */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Tên nhà xuất bản</th>
              <th>Địa chỉ</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="pink-spinner-container">
                    <div className="pink-spinner"></div>
                    <span style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--text-light)' }}>
                      Đang tải danh sách nhà xuất bản...
                    </span>
                  </div>
                </td>
              </tr>
            ) : publishers.length === 0 ? (
              <tr>
                <td colSpan={3} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Không tìm thấy nhà xuất bản nào.
                </td>
              </tr>
            ) : (
              publishers.map((pub) => (
                <tr key={pub.id}>
                  <td>
                    <span className="pub-name-cell">{pub.name}</span>
                  </td>
                  <td>
                    <span style={{ fontSize: '13.5px', color: 'var(--text-light)' }}>
                      {pub.address || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Chưa có thông tin địa chỉ</span>}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-detail-link"
                      onClick={() => navigate(`/publishers/edit/${pub.id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination bar */}
      {!loading && totalPages > 1 && (
        <div className="pagination-bar">
          <div className="pagination-info">
            Hiển thị trang {currentPage}/{totalPages} (Tổng số {totalCount} nhà xuất bản)
          </div>
          <div className="pagination-controls">
            <button
              className="page-btn"
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
              className="page-btn"
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
export default Publishers;
