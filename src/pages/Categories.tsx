import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  getInternalCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi
} from '../api/categories';
import type { CategoryResponse } from '../api/categories';
import {
  TbPlus,
  TbSearch,
  TbTrash,
  TbEdit,
  TbChevronDown,
  TbChevronLeft,
  TbChevronRight,
  TbArrowNarrowUp,
  TbArrowNarrowDown,
  TbFolderPlus,
  TbLoader2
} from 'react-icons/tb';
import { CustomDatePicker } from '../components/CustomDatePicker';
import { toast } from '../utils/toast';

import { PAGE_SIZE } from '../utils/constants';

export const Categories: React.FC = () => {
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [loading, setLoading] = useState(false);

  // Filters state
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Sorting state
  const [sortBy, setSortBy] = useState('name');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc' | null>('asc');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Form Modal state
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryResponse | null>(null);
  const [name, setName] = useState('');
  const [parentId, setParentId] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isParentSelectOpen, setIsParentSelectOpen] = useState(false);

  // Fetch list of internal categories from DB
  const loadCategories = async () => {
    setLoading(true);
    try {
      const res = await getInternalCategoriesApi();
      if (res.data && res.data.success) {
        setCategories(res.data.data || []);
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      toast.error('Lỗi', 'Không thể tải danh sách danh mục.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Listen to outside click for custom dropdown
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsParentSelectOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Reset to first page when filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, startDate, endDate]);

  // Form handlers
  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setName('');
    setParentId(null);
    setIsFormOpen(true);
    setIsParentSelectOpen(false);
  };

  const handleOpenEditModal = (cat: CategoryResponse) => {
    setEditingCategory(cat);
    setName(cat.name);
    setParentId(cat.parentId || null);
    setIsFormOpen(true);
    setIsParentSelectOpen(false);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }

    setIsSaving(true);
    try {
      if (editingCategory) {
        const res = await updateCategoryApi(editingCategory.id, {
          name: name.trim(),
          parentId: parentId || null
        });
        if (res.data && res.data.success) {
          toast.success('Thành công', 'Đã cập nhật danh mục thành công.');
          setIsFormOpen(false);
          loadCategories();
        }
      } else {
        const res = await createCategoryApi({
          name: name.trim(),
          parentId: parentId || null
        });
        if (res.data && res.data.success) {
          toast.success('Thành công', 'Đã thêm danh mục mới vào hệ thống.');
          setIsFormOpen(false);
          loadCategories();
        }
      }
    } catch (err) {
      console.error('Error saving category:', err);
      toast.error('Lỗi', 'Không thể lưu danh mục vào hệ thống.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    if (!confirm('Bạn có chắc chắn muốn xóa danh mục này?')) return;
    try {
      const res = await deleteCategoryApi(id);
      if (res.data && res.data.success) {
        toast.success('Thành công', 'Đã xóa danh mục thành công.');
        loadCategories();
      }
    } catch (err) {
      console.error('Error deleting category:', err);
      toast.error('Lỗi', 'Không thể xóa danh mục này.');
    }
  };

  // Client-side sorting function
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
      return <TbArrowNarrowDown style={{ color: 'var(--primary)', marginLeft: '6px', fontSize: '16px', verticalAlign: 'middle', display: 'inline-block' }} />;
    }
    if (sortDirection === 'asc') {
      return <TbArrowNarrowUp style={{ color: 'var(--primary)', marginLeft: '6px', fontSize: '16px', verticalAlign: 'middle', display: 'inline-block' }} />;
    }
    return null;
  };

  // Client-side filters
  const filteredCategories = categories.filter(c => {
    // Search keyword
    const matchSearch = searchTerm.trim() === '' ||
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.slug.toLowerCase().includes(searchTerm.toLowerCase());

    // Date range comparison
    let matchDate = true;
    if (c.createdAt) {
      const createdTime = new Date(c.createdAt).getTime();
      if (startDate) {
        const startTime = new Date(startDate + 'T00:00:00').getTime();
        if (createdTime < startTime) matchDate = false;
      }
      if (endDate) {
        const endTime = new Date(endDate + 'T23:59:59').getTime();
        if (createdTime > endTime) matchDate = false;
      }
    } else if (startDate || endDate) {
      matchDate = false;
    }

    return matchSearch && matchDate;
  });

  // Client-side sorting
  const sortedCategories = [...filteredCategories].sort((a, b) => {
    if (!sortBy || !sortDirection) return 0;

    if (sortBy === 'name') {
      const comp = a.name.localeCompare(b.name, 'vi');
      return sortDirection === 'asc' ? comp : -comp;
    }
    if (sortBy === 'createdAt') {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return sortDirection === 'asc' ? timeA - timeB : timeB - timeA;
    }
    return 0;
  });

  // Client-side pagination
  const totalCount = sortedCategories.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE) || 1;
  const paginatedCategories = sortedCategories.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

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

  const formatDateTime = (dateStr?: string) => {
    if (!dateStr) return 'N/A';
    try {
      const formatted = dateStr.endsWith('Z') || dateStr.includes('+') ? dateStr : dateStr + 'Z';
      const d = new Date(formatted);
      return d.toLocaleString('vi-VN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  return (
    <div className="categories-view fade-in">
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
        .custom-dropdown-container {
          position: relative;
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
          text-align: left;
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
          height: 44px;
          border: none;
          outline: none;
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
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
        .data-table th:hover:not(:last-child) {
          background-color: var(--bg-hover) !important;
          color: #FFFFFF !important;
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

        /* Custom modal matching stock management styles */
        .modal-overlay-custom {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.75);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          backdrop-filter: blur(4px);
        }
        .modal-card-custom {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          width: 100%;
          border-radius: 0px !important; /* Không bo góc theo yêu cầu */
          box-shadow: var(--shadow-lg);
          animation: fadeInCustom 0.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }
        @keyframes fadeInCustom {
          from { opacity: 0; transform: scale(0.96); }
          to { opacity: 1; transform: scale(1); }
        }
        .modal-header-custom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 0px 24px;
          border-bottom: none;
        }
        .modal-close-btn-custom {
          background: none;
          border: none;
          font-size: 24px;
          color: var(--text-light);
          cursor: pointer;
          transition: var(--transition);
          line-height: 1;
        }
        .modal-close-btn-custom:hover {
          color: var(--primary);
        }
        .modal-form-custom {
          padding: 20px 24px;
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
      `}</style>

      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Danh mục Sách</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Phân loại sách phục vụ việc tìm kiếm và lọc sách trên cửa hàng.</p>
        </div>
        <button className="btn-add-custom" onClick={handleOpenCreateModal}>
          <TbFolderPlus /> Tạo danh mục mới
        </button>
      </div>

      {/* Flat Filters bar matching books style */}
      <div className="filters-row" style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div className="search-wrap-custom">
          <input
            type="text"
            className="search-input-custom"
            placeholder="Tìm kiếm theo tên danh mục, đường dẫn (slug)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button className="search-btn-custom" type="button">
            <TbSearch />
          </button>
        </div>

        {/* Creation Date Range filters */}
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
      </div>

      {/* Data Table */}
      <div className="table-container" style={{ position: 'relative' }}>
        {loading && (
          <div className="pink-spinner-container">
            <div className="pink-spinner"></div>
          </div>
        )}
        <table className="data-table">
          <thead>
            <tr>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer' }}>
                Tên Danh Mục {renderSortIcon('name')}
              </th>
              <th>Đường Dẫn (Slug)</th>
              <th>Danh Mục Cha</th>
              <th onClick={() => handleSort('createdAt')} style={{ cursor: 'pointer' }}>
                Ngày Tạo {renderSortIcon('createdAt')}
              </th>
              <th style={{ textAlign: 'center' }}>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {paginatedCategories.length > 0 ? (
              paginatedCategories.map(c => {
                const parentCat = categories.find(parent => parent.id === c.parentId);
                return (
                  <tr key={c.id}>
                    <td style={{ fontWeight: '700', color: '#4fd1c5' }}>{c.name}</td>
                    <td>
                      <code style={{ padding: '3px 6px', borderRadius: '4px', backgroundColor: '#16161a', border: '1px solid #2d2d30', color: '#b794f4', fontFamily: 'monospace', fontSize: '12px' }}>
                        {c.slug}
                      </code>
                    </td>
                    <td>
                      {parentCat ? (
                        <span style={{ color: '#f6ad55', fontWeight: 600 }}>{parentCat.name}</span>
                      ) : (
                        <span style={{ color: 'var(--text-light)', opacity: 0.5 }}>&mdash;</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-light)' }}>{formatDateTime(c.createdAt)}</td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                        <button
                          className="btn-icon-action edit"
                          onClick={() => handleOpenEditModal(c)}
                          title="Sửa danh mục"
                        >
                          <TbEdit />
                        </button>
                        <button
                          className="btn-icon-action delete"
                          onClick={() => handleDeleteCategory(c.id)}
                          title="Xóa danh mục"
                        >
                          <TbTrash />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  {loading ? 'Đang tải dữ liệu...' : 'Không tìm thấy danh mục nào.'}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination component */}
      <div className="pagination-bar">
        <div className="pagination-info">
          Hiển thị <span className="count-highlight">{paginatedCategories.length}</span> / <span className="count-highlight">{filteredCategories.length}</span> danh mục
        </div>
        {totalPages > 1 && (
          <div className="pagination-controls">
            <button
              className="page-btn nav-arrow"
              disabled={currentPage === 1}
              onClick={() => goToPage(currentPage - 1)}
            >
              <TbChevronLeft />
            </button>
            {getPageNumbers().map((pNum, idx) => (
              pNum === '...' ? (
                <span key={`dots-${idx}`} className="page-dots">...</span>
              ) : (
                <button
                  key={`page-${pNum}`}
                  className={`page-btn ${currentPage === pNum ? 'active' : ''}`}
                  onClick={() => goToPage(pNum as number)}
                >
                  {pNum}
                </button>
              )
            ))}
            <button
              className="page-btn nav-arrow"
              disabled={currentPage === totalPages}
              onClick={() => goToPage(currentPage + 1)}
            >
              <TbChevronRight />
            </button>
          </div>
        )}
      </div>

      {/* Add / Edit Category Modal Form */}
      {isFormOpen && createPortal(
        <div className="modal-overlay-custom">
          <div className="modal-card-custom" style={{ maxWidth: '480px' }}>
            <div className="modal-header-custom">
              <h2 style={{ color: 'var(--primary)', fontSize: '20px', fontWeight: 'bold', margin: 0 }}>
                {editingCategory ? 'Chỉnh sửa danh mục' : 'Tạo danh mục sách mới'}
              </h2>
              <button type="button" className="modal-close-btn-custom" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form-custom">
              <div className="form-field">
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px' }}>
                  Tên Danh mục *
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ví dụ: Khoa học viễn tưởng, Lịch sử..."
                  style={{
                    width: '100%',
                    padding: '10px 12px',
                    backgroundColor: '#0d0d0f',
                    border: '1px solid #2d2d30',
                    borderRadius: '4px',
                    color: '#ffffff',
                    fontSize: '14px',
                    outline: 'none'
                  }}
                />
              </div>

              <div className="form-field">
                <label style={{ display: 'block', fontSize: '13.5px', fontWeight: '600', color: 'var(--text-light)', marginBottom: '6px' }}>
                  Danh mục cha (Tùy chọn)
                </label>
                <div className="custom-dropdown-container" style={{ width: '100%' }}>
                  <div
                    className={`custom-dropdown-header ${isParentSelectOpen ? 'active' : ''}`}
                    onClick={() => setIsParentSelectOpen(!isParentSelectOpen)}
                    style={{
                      backgroundColor: '#0d0d0f',
                      border: '1px solid #2d2d30',
                      borderRadius: '4px',
                      padding: '10px 12px',
                      color: '#ffffff'
                    }}
                  >
                    <span>
                      {parentId
                        ? categories.find(c => c.id === parentId)?.name || 'Chọn danh mục cha'
                        : 'Không có (Danh mục gốc)'}
                    </span>
                    <TbChevronDown className={`arrow-icon ${isParentSelectOpen ? 'open' : ''}`} />
                  </div>
                  {isParentSelectOpen && (
                    <div className="custom-dropdown-menu" style={{ position: 'absolute', width: '100%', left: 0, right: 0, zIndex: 10100 }}>
                      <div
                        className={`custom-dropdown-item ${!parentId ? 'selected' : ''}`}
                        onClick={() => { setParentId(null); setIsParentSelectOpen(false); }}
                      >
                        Không có (Danh mục gốc)
                      </div>
                      {/* Filter out current editing category to prevent self-parenting loop */}
                      {categories
                        .filter(c => !editingCategory || c.id !== editingCategory.id)
                        .map(cat => (
                          <div
                            key={cat.id}
                            className={`custom-dropdown-item ${parentId === cat.id ? 'selected' : ''}`}
                            onClick={() => { setParentId(cat.id); setIsParentSelectOpen(false); }}
                          >
                            {cat.name}
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '16px 0px 0px 0px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
                <button
                  type="submit"
                  className="btn-add-custom"
                  style={{
                    backgroundColor: 'var(--primary)',
                    borderColor: 'var(--primary)',
                    color: 'white',
                    height: '34px',
                    padding: '0 16px',
                    fontSize: '13px',
                    margin: 0,
                    fontWeight: 600,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    borderRadius: '4px'
                  }}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <>
                      <TbLoader2 className="animate-spin-custom" style={{ fontSize: '14px' }} />
                      Đang lưu...
                    </>
                  ) : (
                    'Lưu lại'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Categories;
