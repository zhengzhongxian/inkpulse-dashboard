import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthorsApi, deleteAuthorApi } from '../api/books';
import { TbSearch, TbUserPlus, TbEdit, TbTrash, TbChevronLeft, TbChevronRight, TbLoader2 } from 'react-icons/tb';
import { toast } from '../utils/toast';

interface Author {
  id: string;
  name: string;
  biography: string | null;
  avatarUrl: string | null;
}

const PAGE_SIZE = 10;

export const Authors: React.FC = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const loadAuthors = async (page: number, keyword?: string) => {
    setLoading(true);
    try {
      const res = await getAuthorsApi({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchKeyword: keyword || undefined
      });
      if (res.data && res.data.success) {
        const paged = res.data.data;
        setAuthors(paged.items || []);
        setTotalPages(paged.totalPages || 1);
        setTotalCount(paged.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading authors:', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể lấy danh sách tác giả.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadAuthors(currentPage, searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, currentPage]);

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa tác giả "${name}" không?`)) return;
    try {
      setDeletingId(id);
      await deleteAuthorApi(id);
      toast.success('Xóa thành công', `Tác giả "${name}" đã được xóa.`);
      const newPage = authors.length === 1 && currentPage > 1 ? currentPage - 1 : currentPage;
      setCurrentPage(newPage);
      loadAuthors(newPage, searchTerm);
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa tác giả này.');
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
    <div className="authors-view fade-in">
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
          box-shadow: 0 2px 8px rgba(218, 68, 125, 0.4);
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
        .author-avatar-img {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          object-fit: cover;
          border: 2px solid var(--border);
          background-color: #1a1a1e;
          display: block;
        }
        .author-avatar-placeholder {
          width: 42px;
          height: 42px;
          border-radius: 50%;
          background: linear-gradient(135deg, #2d2d30, #3d3d42);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 15px;
          font-weight: 700;
          color: var(--text-light);
          border: 2px solid var(--border);
          flex-shrink: 0;
        }
        .author-name-cell {
          font-weight: 700;
          color: #4fd1c5;
          font-size: 14px;
        }
        .btn-icon-action {
          width: 32px;
          height: 32px;
          border-radius: 7px;
          border: 1px solid var(--border);
          background-color: transparent;
          color: var(--text-muted);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 15px;
          transition: all 0.18s ease;
        }
        .btn-icon-action.edit:hover {
          color: #F687B3;
          border-color: #F687B3;
          background-color: rgba(246, 135, 179, 0.07);
        }
        .btn-icon-action.delete:hover {
          color: #ef4444;
          border-color: #ef4444;
          background-color: rgba(239, 68, 68, 0.07);
        }
        .btn-icon-action:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .btn-detail-link {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          padding: 0;
          cursor: pointer;
          font-size: 13.5px;
          transition: var(--transition);
          white-space: nowrap;
        }
        .btn-detail-link:hover {
          text-decoration: underline;
          color: var(--primary-hover);
        }
        .animate-spin-custom {
          animation: btn-spin-key 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes btn-spin-key {
          to { transform: rotate(360deg); }
        }
      `}</style>

      {/* Header & toolbar */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Quản lý Tác giả</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Xem, thêm mới, cập nhật và xóa thông tin tác giả trong hệ thống.</p>
        </div>
        <button className="btn-add-custom" onClick={() => navigate('/authors/new')}>
          <TbUserPlus style={{ fontSize: '18px' }} /> Thêm tác giả
        </button>
      </div>

      {/* Filter bar */}
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm tác giả theo tên..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="table-container">
        {loading && (
          <div style={{ padding: '20px', textAlign: 'center', color: '#fff' }}>
            Đang xử lý dữ liệu...
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '64px' }}>Ảnh</th>
              <th style={{ width: '200px' }}>Tên tác giả</th>
              <th>Tiểu sử</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {!loading && authors.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '30px' }}>
                  Không tìm thấy tác giả nào.
                </td>
              </tr>
            ) : (
              authors.map((author) => (
                <tr key={author.id}>
                  <td>
                    {author.avatarUrl ? (
                      <img src={author.avatarUrl} alt={author.name} className="author-avatar-img" />
                    ) : (
                      <div className="author-avatar-placeholder">
                        {author.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="author-name-cell">{author.name}</span>
                  </td>
                  <td>
                    <div style={{
                      maxHeight: '60px',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      fontSize: '13.5px',
                      color: 'var(--text-light)',
                      lineHeight: '1.5'
                    }}>
                      {author.biography || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Không có thông tin tiểu sử</span>}
                    </div>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-detail-link"
                      onClick={() => navigate(`/authors/edit/${author.id}`)}
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

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Hiển thị{' '}
            <span className="count-highlight">{authors.length}/{totalCount}</span>
            {' '}tác giả &mdash; Trang{' '}
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
    </div>
  );
};
