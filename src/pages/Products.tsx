import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  getInternalBooksApi,
  getCategoriesApi
} from '../api/books';
import type {
  BookResponse,
  CategoryResponse
} from '../api/books';
import { TbSearch, TbChevronDown, TbBookmarkPlus, TbChevronLeft, TbChevronRight, TbArrowNarrowUp, TbArrowNarrowDown } from 'react-icons/tb';

const PAGE_SIZE = 10;

export const Products: React.FC = () => {
  const navigate = useNavigate();
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [isSelectOpen, setIsSelectOpen] = useState(false);

  // Price range filters
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');

  // Sorting
  const [sortBy, setSortBy] = useState('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>(null);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [isActiveDropdownOpen, setIsActiveDropdownOpen] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadStaticData = async () => {
    try {
      const catsRes = await getCategoriesApi();
      if (catsRes.data && catsRes.data.success) {
        setCategories(catsRes.data.data || []);
      }
    } catch (e) {
      console.error('Error loading static data:', e);
    }
  };

  const loadBooks = async (
    page: number,
    keyword?: string,
    catSlug?: string,
    minP?: string,
    maxP?: string,
    sBy?: string,
    sDir?: string | null,
    actFilter?: string
  ) => {
    setLoading(true);
    try {
      const booksRes = await getInternalBooksApi({
        pageNumber: page,
        pageSize: PAGE_SIZE,
        searchKeyword: keyword || undefined,
        categorySlug: catSlug && catSlug !== 'ALL' ? catSlug : undefined,
        minPrice: minP ? Number(minP.replace(/\./g, '')) : undefined,
        maxPrice: maxP ? Number(maxP.replace(/\./g, '')) : undefined,
        sortBy: sBy || undefined,
        sortDirection: sDir || undefined,
        active: actFilter === 'ACTIVE' ? true : actFilter === 'INACTIVE' ? false : undefined
      });
      if (booksRes.data && booksRes.data.success) {
        const paged = booksRes.data.data;
        setBooks(paged.items || []);
        setTotalPages(paged.totalPages || 1);
        setTotalCount(paged.totalCount || 0);
      }
    } catch (error) {
      console.error('Error loading books:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaticData();
  }, []);

  // Reset về page 1 khi filter thay đổi
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, categoryFilter, minPrice, maxPrice, sortBy, sortDirection, activeFilter]);

  useEffect(() => {
    const handler = setTimeout(() => {
      loadBooks(currentPage, searchTerm, categoryFilter, minPrice, maxPrice, sortBy, sortDirection, activeFilter);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm, categoryFilter, currentPage, minPrice, maxPrice, sortBy, sortDirection, activeFilter]);

  const handleSort = (field: string) => {
    if (sortBy === field) {
      if (sortDirection === 'desc') {
        setSortDirection('asc');
      } else if (sortDirection === 'asc') {
        setSortDirection(null);
        setSortBy('');
      } else {
        setSortDirection('desc');
      }
    } else {
      setSortBy(field);
      setSortDirection('desc');
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: string) => {
    if (sortBy !== field) return null;
    if (sortDirection === 'desc') {
      return (
        <TbArrowNarrowDown 
          style={{ 
            color: 'var(--primary)', 
            marginLeft: '6px', 
            fontSize: '16px', 
            verticalAlign: 'middle', 
            display: 'inline-block' 
          }} 
        />
      );
    }
    if (sortDirection === 'asc') {
      return (
        <TbArrowNarrowUp 
          style={{ 
            color: 'var(--primary)', 
            marginLeft: '6px', 
            fontSize: '16px', 
            verticalAlign: 'middle', 
            display: 'inline-block' 
          }} 
        />
      );
    }
    return null;
  };

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsSelectOpen(false);
        setIsActiveDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
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

  return (
    <div className="products-view fade-in">
      <style>{`
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
        .book-title-cell {
          font-weight: 700;
          color: #4fd1c5;
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
        .price-input-custom {
          width: 150px;
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
        .price-input-custom:focus {
          border-color: #4a4a4f !important;
          box-shadow: none;
        }
        .data-table th {
          transition: var(--transition);
        }
        .data-table th:hover:not(:last-child) {
          background-color: var(--bg-hover) !important;
          color: #FFFFFF !important;
        }
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
      `}</style>

      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Kho sách</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Quản lý kho hàng sách, sửa đổi thông tin, giá bán và số lượng trong kho.</p>
        </div>
        <button className="btn-add-custom" onClick={() => navigate('/products/add')}>
          <TbBookmarkPlus /> Thêm sách mới
        </button>
      </div>

      {/* Filters bar */}
      <div className="filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm theo tựa đề sách, tác giả, mã ISBN..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Bộ lọc khoảng giá */}
        <div className="price-range-custom" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="text"
            className="price-input-custom"
            placeholder="Giá từ..."
            value={minPrice}
            onChange={(e) => {
              const formatted = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              setMinPrice(formatted);
            }}
          />
          <span style={{ color: 'var(--text-muted)', fontSize: '14px' }}>&mdash;</span>
          <input
            type="text"
            className="price-input-custom"
            placeholder="đến..."
            value={maxPrice}
            onChange={(e) => {
              const formatted = e.target.value.replace(/\D/g, '').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
              setMaxPrice(formatted);
            }}
          />
        </div>

        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isSelectOpen ? 'active' : ''}`}
            onClick={() => {
              setIsSelectOpen(!isSelectOpen);
              setIsActiveDropdownOpen(false);
            }}
          >
            <span>
              {categoryFilter === 'ALL' ? 'Tất cả danh mục' : categories.find(c => c.slug === categoryFilter)?.name || 'Tất cả danh mục'}
            </span>
            <TbChevronDown className={`arrow-icon ${isSelectOpen ? 'open' : ''}`} />
          </div>
          {isSelectOpen && (
            <div className="custom-dropdown-menu">
              <div
                className={`custom-dropdown-item ${categoryFilter === 'ALL' ? 'selected' : ''}`}
                onClick={() => { setCategoryFilter('ALL'); setIsSelectOpen(false); }}
              >
                Tất cả danh mục
              </div>
              {categories.map(cat => (
                <div
                  key={cat.id}
                  className={`custom-dropdown-item ${categoryFilter === cat.slug ? 'selected' : ''}`}
                  onClick={() => { setCategoryFilter(cat.slug); setIsSelectOpen(false); }}
                >
                  {cat.name}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bộ lọc trạng thái active */}
        <div className="custom-dropdown-container">
          <div
            className={`custom-dropdown-header ${isActiveDropdownOpen ? 'active' : ''}`}
            onClick={() => {
              setIsActiveDropdownOpen(!isActiveDropdownOpen);
              setIsSelectOpen(false);
            }}
          >
            <span>
              {activeFilter === 'ALL' && 'Tất cả trạng thái'}
              {activeFilter === 'ACTIVE' && 'Đang hoạt động'}
              {activeFilter === 'INACTIVE' && 'Ngừng hoạt động'}
            </span>
            <TbChevronDown className={`arrow-icon ${isActiveDropdownOpen ? 'open' : ''}`} />
          </div>
          {isActiveDropdownOpen && (
            <div className="custom-dropdown-menu">
              <div
                className={`custom-dropdown-item ${activeFilter === 'ALL' ? 'selected' : ''}`}
                onClick={() => { setActiveFilter('ALL'); setIsActiveDropdownOpen(false); }}
              >
                Tất cả trạng thái
              </div>
              <div
                className={`custom-dropdown-item ${activeFilter === 'ACTIVE' ? 'selected' : ''}`}
                onClick={() => { setActiveFilter('ACTIVE'); setIsActiveDropdownOpen(false); }}
              >
                Đang hoạt động
              </div>
              <div
                className={`custom-dropdown-item ${activeFilter === 'INACTIVE' ? 'selected' : ''}`}
                onClick={() => { setActiveFilter('INACTIVE'); setIsActiveDropdownOpen(false); }}
              >
                Ngừng hoạt động
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main product table */}
      <div className="table-container" style={{ position: 'relative' }}>
        {loading && (
          <div className="pink-spinner-container">
            <div className="pink-spinner" />
          </div>
        )}
        <table className="data-table" style={{ opacity: loading ? 0.5 : 1, transition: 'opacity 0.2s ease-in-out' }}>
          <thead>
            <tr>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('title')}>
                Tựa đề {renderSortIcon('title')}
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('price')}>
                Giá bán {renderSortIcon('price')}
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('stock')}>
                Trong kho {renderSortIcon('stock')}
              </th>
              <th style={{ cursor: 'pointer', userSelect: 'none' }} onClick={() => handleSort('createdAt')}>
                Ngày tạo {renderSortIcon('createdAt')}
              </th>
              <th>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {books.length > 0 ? (
              books.map(p => {
                const totalStock = p.totalStock || 0;
                return (
                  <tr key={p.id}>
                    <td><span className="book-title-cell">{p.title}</span></td>
                    <td style={{ fontWeight: '700', color: '#F687B3' }}>{p.minPrice ? formatMoney(Number(p.minPrice)) : 'Liên hệ'}</td>
                    <td style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>{totalStock} cuốn</td>
                    <td style={{ whiteSpace: 'nowrap' }}>
                      {p.createdAt ? new Date(p.createdAt).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td>
                      <button className="btn-detail-link" onClick={() => navigate(`/products/edit/${p.id}`)}>
                        Xem chi tiết
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '30px' }}>
                  Không tìm thấy cuốn sách nào trong kho.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages >= 1 && (
        <div className="pagination-bar">
          <span className="pagination-info">
            Hiển thị{' '}
            <span className="count-highlight">{books.length}/{totalCount}</span>
            {' '}sách &mdash; Trang{' '}
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

export default Products;
