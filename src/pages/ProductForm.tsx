import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createBookApi,
  updateBookApi,
  getCategoriesApi,
  getAuthorsApi,
  getInternalBookDetailApi,
  deleteBookApi,
  getBadgesApi
} from '../api/books';
import type { CategoryResponse, AuthorResponse } from '../api/books';
import { TbArrowLeft, TbDeviceFloppy, TbBookUpload, TbSearch, TbLoader2, TbBookmarkPlus, TbTrash, TbCheck } from 'react-icons/tb';
import { toast } from '../utils/toast';

export const ProductForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEdit = !!id;
  const initialValuesRef = useRef<any>(null);

  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [authors, setAuthors] = useState<AuthorResponse[]>([]);
  const [selectedAuthors, setSelectedAuthors] = useState<AuthorResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Book Editions
  const [editions, setEditions] = useState<any[]>([]);
  const [active, setActive] = useState(false);

  // Badge selection
  const [badges, setBadges] = useState<any[]>([]);
  const [selectedBadgeId, setSelectedBadgeId] = useState<string>('');

  // Form Fields
  const [title, setTitle] = useState('');
  const [introduce, setIntroduce] = useState('');
  const [description, setDescription] = useState('');
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const [selectedAuthorIds, setSelectedAuthorIds] = useState<string[]>([]);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Search filter terms for tables
  const [authorSearchTerm, setAuthorSearchTerm] = useState('');
  const [categorySearchTerm, setCategorySearchTerm] = useState('');

  // Author Pagination State
  const [authorPageNumber, setAuthorPageNumber] = useState(1);
  const [authorHasMore, setAuthorHasMore] = useState(true);
  const [authorLoadingMore, setAuthorLoadingMore] = useState(false);

  const fetchAuthors = async (page: number, keyword: string, isAppend: boolean) => {
    setAuthorLoadingMore(true);
    try {
      const res = await getAuthorsApi({
        pageNumber: page,
        pageSize: 4, // Mặc định 4 bản ghi mỗi lần fetch
        searchKeyword: keyword || undefined
      });
      if (res.data && res.data.success) {
        const paged = res.data.data;
        const newItems = paged.items || [];
        if (isAppend) {
          setAuthors(prev => {
            const combined = [...prev, ...newItems];
            const uniqueMap = new Map(combined.map(item => [item.id, item]));
            return Array.from(uniqueMap.values());
          });
        } else {
          setAuthors(newItems);
        }
        setAuthorHasMore(page < paged.totalPages);
      }
    } catch (err) {
      console.error('Lỗi tải danh sách tác giả:', err);
    } finally {
      setAuthorLoadingMore(false);
    }
  };

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const catRes = await getCategoriesApi();
        setCategories(catRes.data.data || []);

        // Fetch trang 1 tác giả
        await fetchAuthors(1, '', false);

        // Fetch badges
        const badgeRes = await getBadgesApi();
        if (badgeRes.data && badgeRes.data.success) {
          setBadges(badgeRes.data.data || []);
        }

        if (isEdit && id) {
          const detailRes = await getInternalBookDetailApi(id);
          if (detailRes.data && detailRes.data.success) {
            const detail = detailRes.data.data;
            setTitle(detail.title || '');
            setIntroduce(detail.introduce || '');
            setDescription(detail.description || '');
            setSelectedCategoryIds(detail.categoryIds || []);
            setSelectedAuthorIds(detail.authorIds || []);
            setPreviewUrl(detail.thumbnailUrl || null);
            setEditions(detail.editions || []);
            setActive((detail.editions && detail.editions.length > 0) ? (detail.active || false) : false);

            if (detail.authors) {
              setSelectedAuthors(detail.authors.map((a: any) => ({
                id: a.id,
                name: a.name,
                biography: null,
                avatarUrl: null
              })));
            }

            // Save initial values for dirty-checking
            setSelectedBadgeId(detail.badgeId || '');

            initialValuesRef.current = {
              title: detail.title || '',
              introduce: detail.introduce || '',
              description: detail.description || '',
              categoryIds: detail.categoryIds || [],
              authorIds: detail.authorIds || [],
              active: (detail.editions && detail.editions.length > 0) ? (detail.active || false) : false,
              badgeId: detail.badgeId || ''
            };
          }
        }
      } catch (error) {
        console.error('Lỗi khi tải dữ liệu form sách:', error);
      } finally {
        setLoading(false);
      }
    };

    loadInitialData();
  }, [id, isEdit]);

  // Effect để search tác giả khi typing
  useEffect(() => {
    const handler = setTimeout(() => {
      setAuthorPageNumber(1);
      fetchAuthors(1, authorSearchTerm, false);
    }, 400);

    return () => clearTimeout(handler);
  }, [authorSearchTerm]);

  const handleAuthorScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    if (target.scrollHeight - target.scrollTop <= target.clientHeight + 10) {
      if (!authorLoadingMore && authorHasMore) {
        const nextPage = authorPageNumber + 1;
        setAuthorPageNumber(nextPage);
        fetchAuthors(nextPage, authorSearchTerm, true);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;

    // Validate size (max 10MB on frontend before resize)
    if (file.size > 10 * 1024 * 1024) {
      toast.warning("Kích thước tệp quá lớn", "Tệp ảnh bìa không được vượt quá 10MB!");
      return;
    }

    // Validate format type
    if (!file.type.startsWith("image/")) {
      toast.warning("Định dạng không hợp lệ", "Vui lòng chọn đúng tệp hình ảnh!");
      return;
    }

    // Resize image using HTML5 Canvas to 400x400 JPEG
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          // Crop and draw center square portion of original image
          const size = Math.min(img.width, img.height);
          const x = (img.width - size) / 2;
          const y = (img.height - size) / 2;
          ctx.drawImage(img, x, y, size, size, 0, 0, 400, 400);

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const newFileName = file.name.substring(0, file.name.lastIndexOf('.')) + ".jpg";
                const resizedFile = new File([blob], newFileName, { type: "image/jpeg" });
                setCoverFile(resizedFile);
                setPreviewUrl(URL.createObjectURL(resizedFile));
              }
            },
            "image/jpeg",
            0.9
          );
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const isFormChanged = () => {
    if (!isEdit) return true;
    if (!initialValuesRef.current) return false;

    const init = initialValuesRef.current;

    // Check cover file
    if (coverFile !== null) return true;

    // Compare fields
    if (title.trim() !== init.title) return true;
    if (introduce.trim() !== init.introduce) return true;
    if (description.trim() !== init.description) return true;
    if (active !== init.active) return true;
    if (selectedBadgeId !== init.badgeId) return true;

    // Compare categoryIds
    const currentCatIds = [...selectedCategoryIds].sort();
    const initCatIds = [...init.categoryIds].sort();
    if (JSON.stringify(currentCatIds) !== JSON.stringify(initCatIds)) return true;

    // Compare authorIds
    const currentAuthorIds = [...selectedAuthorIds].sort();
    const initAuthorIds = [...init.authorIds].sort();
    if (JSON.stringify(currentAuthorIds) !== JSON.stringify(initAuthorIds)) return true;

    return false;
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isEdit && !isFormChanged()) {
      toast.info('Không có thay đổi', 'Bạn chưa thay đổi thông tin nào của sách.');
      navigate('/products');
      return;
    }
    if (!title.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tựa đề sách.');
      return;
    }
    if (selectedCategoryIds.length === 0) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn ít nhất một danh mục.');
      return;
    }
    if (selectedAuthorIds.length === 0) {
      toast.warning('Thiếu thông tin', 'Vui lòng chọn ít nhất một tác giả.');
      return;
    }

    setSubmitting(true);
    try {
      const bookFormData = new FormData();
      bookFormData.append('title', title.trim());
      bookFormData.append('introduce', introduce.trim());
      bookFormData.append('description', description.trim());

      selectedCategoryIds.forEach(catId => {
        bookFormData.append('categoryIds', catId);
      });
      selectedAuthorIds.forEach(autId => {
        bookFormData.append('authorIds', autId);
      });
      if (selectedBadgeId) {
        bookFormData.append('badgeId', selectedBadgeId);
      }

      if (coverFile) {
        bookFormData.append('coverFile', coverFile);
      }

      if (isEdit && id) {
        // Update Book
        bookFormData.append('active', String(editions.length > 0 ? active : false));
        await updateBookApi(id, bookFormData);
        toast.success('Cập nhật thành công', 'Thông tin sách đã được lưu lại.');
        navigate('/products');
      } else {
        // Create Book
        if (!coverFile) {
          toast.warning('Thiếu thông tin', 'Vui lòng tải lên ảnh bìa cho sách mới.');
          setSubmitting(false);
          return;
        }

        const bookRes = await createBookApi(bookFormData);
        if (bookRes.data && bookRes.data.success) {
          toast.success('Tạo sách thành công', 'Cuốn sách mới đã được lưu vào hệ thống.');
          navigate('/products');
        }
      }
    } catch (error: any) {
      console.error('Error submitting book form:', error);
      toast.error('Lỗi lưu trữ', error.response?.data?.message || error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!id) return;
    try {
      const res = await deleteBookApi(id);
      if (res.data && res.data.success) {
        toast.success('Xóa sách thành công', 'Cuốn sách đã được xóa khỏi hệ thống.');
        navigate('/products');
      } else {
        toast.error('Lỗi khi xóa sách', res.data?.message || 'Có lỗi xảy ra.');
      }
    } catch (err: any) {
      console.error('Lỗi khi xóa sách:', err);
      toast.error('Lỗi khi xóa sách', err.response?.data?.message || err.message);
    } finally {
      setIsDeletingModalOpen(false);
    }
  };



  // Filter lists based on user search term inputs
  const allAvailableAuthors = (() => {
    const combined = [...selectedAuthors, ...authors];
    const uniqueMap = new Map(combined.map(item => [item.id, item]));
    return Array.from(uniqueMap.values());
  })();

  const filteredAuthors = allAvailableAuthors.filter(a =>
    a.name.toLowerCase().includes(authorSearchTerm.toLowerCase())
  );

  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(categorySearchTerm.toLowerCase())
  );

  return (
    <div className="product-form-view fade-in" style={{ width: '100%', padding: '10px 0' }}>
      <style>{`
        .form-card-custom {
          margin-top: 20px;
        }
        .form-grid-custom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
          margin-bottom: 20px;
        }
        @media (max-width: 768px) {
          .form-grid-custom {
            grid-template-columns: 1fr;
          }
        }
        .cover-desc-grid-custom {
          display: grid;
          grid-template-columns: 400px 1fr;
          gap: 40px;
          margin-bottom: 20px;
        }
        @media (max-width: 992px) {
          .cover-desc-grid-custom {
            grid-template-columns: 1fr;
          }
        }
        .form-field-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-field-custom > label {
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }
        .required-star {
          color: #ef4444; /* Dấu sao đỏ */
          margin-left: 4px;
        }
        .form-field-custom input[type="text"],
        .form-field-custom input[type="number"],
        .form-field-custom select,
        .form-field-custom textarea {
          background-color: #0d0d0f; /* Nền tối sâu thẳm, không dùng xám đen */
          border: 1px solid #2d2d30; /* Viền zinc tinh tế */
          border-radius: 8px; /* Có bo góc theo yêu cầu */
          padding: 11px 14px;
          color: #ffffff;
          font-size: 14px;
          font-family: var(--font);
          outline: none;
          transition: var(--transition);
        }
        .form-field-custom input:focus,
        .form-field-custom select:focus,
        .form-field-custom textarea:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }
        .form-field-custom textarea {
          border-radius: 0px !important;
        }
        .title-input-custom {
          color: #4fd1c5 !important;
          border-radius: 8px !important;
        }

        /* Search wrap custom inside select boxes */
        .search-select-wrap-custom {
          display: flex;
          align-items: center;
          height: 40px;
          border: 2px solid var(--primary);
          border-radius: 10px;
          overflow: hidden;
          background-color: #1a1a1a;
          transition: var(--transition);
          margin-bottom: 12px;
        }
        .search-select-wrap-custom:focus-within {
          border-color: var(--primary-hover);
          box-shadow: 0 0 0 3px rgba(218, 68, 125, 0.15);
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
        }
        .btn-detail-link:hover {
          text-decoration: underline;
          color: var(--primary-hover);
        }

        /* Custom styles for Edition Detail Modal */
        .modal-overlay-custom {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.7);
          z-index: 10000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        .modal-card-custom {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          width: 100%;
          max-width: 680px;
          border-radius: 0px !important; /* Không bo góc theo yêu cầu */
          box-shadow: var(--shadow-lg);
          animation: fadeInCustom 0.25s ease;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
        .modal-header-custom {
          padding: 16px 24px;
          border-bottom: 1px solid var(--border);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-header-custom h2 {
          font-size: 16px;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }
        .modal-close-btn-custom {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 28px;
          line-height: 1;
          cursor: pointer;
          outline: none;
        }
        .modal-close-btn-custom:hover {
          color: #ffffff;
        }
        .edition-detail-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 16px;
          text-align: left;
        }
        @media (max-width: 576px) {
          .edition-detail-grid {
            grid-template-columns: 1fr;
          }
        }
        .edition-detail-item {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .edition-detail-label {
          font-size: 12px;
          color: #F687B3; /* Nhãn màu hồng đồng bộ */
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .edition-detail-value {
          font-size: 14px;
          color: #ffffff;
          font-weight: 500;
        }
        @keyframes fadeInCustom {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .search-select-input-custom {
          flex: 1;
          height: 100%;
          border: none !important;
          outline: none !important;
          padding: 0 14px !important;
          font-size: 13.5px;
          color: var(--text-main);
          background-color: transparent !important;
        }
        .search-select-input-custom::placeholder {
          color: var(--text-light);
        }
        .search-select-btn-custom {
          width: 44px;
          height: 100%;
          background-color: var(--primary);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          border-radius: 0;
          cursor: pointer;
          font-size: 16px;
          transition: var(--transition);
        }
        .search-select-btn-custom:hover {
          background-color: var(--primary-hover);
        }

        /* Table selector component */
        .table-select-container-custom {
          border: 1px solid #2d2d30;
          border-radius: 0px;
          max-height: 180px;
          overflow-y: auto;
          background-color: #0d0d0f;
        }
        .table-select-custom th {
          background-color: #111115;
          border-bottom: 1px solid #2d2d30;
          padding: 12px 16px;
          color: #ffffff; /* Header màu trắng */
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .table-select-custom {
          width: 100%;
          border-collapse: collapse;
          font-size: 13.5px;
          text-align: left;
        }
        .table-select-custom tr {
          border-bottom: 1px solid #161619;
          cursor: pointer;
          transition: background-color 0.15s;
        }
        .table-select-custom tr:last-child {
          border-bottom: none;
        }
        .table-select-custom tr:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }
        .table-select-custom tr.selected {
          background-color: rgba(217, 68, 125, 0.05);
        }
        .table-select-custom td {
          padding: 12px 16px;
          vertical-align: middle;
        }
        .item-name-cell {
          color: #48bb78 !important; /* Tên tác giả, danh mục màu xanh lá */
          font-weight: 500;
        }
        .table-select-custom tr.selected .item-name-cell {
          color: #48bb78 !important;
          font-weight: 500;
        }
        .checkbox-cell-custom {
          width: 40px;
          text-align: center;
        }
        
        /* Custom circle checkbox */
        .circle-checkbox-custom {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          border: 1.5px solid #4a4a4f;
          display: inline-block;
          position: relative;
          transition: all 0.15s ease;
          vertical-align: middle;
        }
        .circle-checkbox-custom.selected {
          border-color: #4299E1;
          background-color: transparent;
        }
        .circle-checkbox-custom.selected::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: #4299E1;
        }

        /* Custom Upload File Button */
        .btn-upload-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          background-color: #1f1f23;
          color: var(--text-main);
          border: 1px solid #3f3f46;
          border-radius: 8px;
          padding: 10px 18px;
          font-size: 13.5px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
          width: fit-content;
        }
        .btn-upload-custom:hover {
          background-color: #27272c;
          border-color: #3f3f46;
        }
        /* Custom image preview styling without dashed panel */
        .cover-preview-container-new {
          margin-top: 12px;
          display: flex;
          gap: 16px;
          align-items: center;
        }
        .preview-wrap-new {
          position: relative;
          width: 400px;
          height: 400px;
          border-radius: 0px;
          overflow: hidden;
          border: 1px solid #2d2d30;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.5);
        }
        .cover-preview-img-new {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
        .btn-remove-cover-new {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background-color: rgba(0, 0, 0, 0.7);
          color: #fff;
          border: none;
          font-size: 14px;
          line-height: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-remove-cover-new:hover {
          background-color: rgba(239, 68, 68, 0.9);
        }
        .btn-save-custom {
          background-color: var(--primary);
          color: #fff;
          border-radius: 8px !important;
          padding: 0 24px !important;
          font-weight: 600;
          font-size: 13.5px !important;
          display: inline-flex !important;
          align-items: center;
          justify-content: center;
          gap: 8px;
          border: none;
          cursor: pointer;
          transition: var(--transition);
          height: 42px !important;
          min-width: 160px;
        }
        .btn-save-custom:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-save-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
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
        .btn-secondary:hover {
          color: #F687B3 !important;
          border-color: #F687B3 !important;
        }

        /* Custom pink spinner */
        .pink-spinner-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 24px 0;
          color: var(--text-muted);
          font-size: 13px;
          gap: 8px;
        }
        .pink-spinner {
          width: 28px;
          height: 28px;
          border: 3px solid rgba(236, 72, 153, 0.15);
          border-top-color: #ec4899;
          border-radius: 50%;
          animation: pink-spin 0.8s linear infinite;
        }
        .animate-spin-custom {
          animation: btn-spin-key 0.8s linear infinite;
        }
        @keyframes btn-spin-key {
          to { transform: rotate(360deg); }
        }

        /* Custom Toggle Switch */
        .switch-custom {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          background-color: #4a4a4f; /* Màu xám khi tắt */
          border-radius: 24px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }
        .switch-custom.active {
          background-color: #ed8936; /* Màu vàng cam khi kích hoạt phát hành */
        }
        .switch-custom.disabled {
          cursor: not-allowed;
          opacity: 0.4;
          background-color: #2d2d30;
        }
        .switch-slider-custom {
          position: absolute;
          top: 3px;
          left: 3px;
          width: 18px;
          height: 18px;
          background-color: #ffffff;
          border-radius: 50%;
          transition: transform 0.2s ease;
        }
        .switch-custom.active .switch-slider-custom {
          transform: translateX(20px);
        }
        .btn-add-custom {
          background-color: var(--primary);
          color: #fff !important;
          border-radius: 10px;
          align-items: center;
          gap: 8px;
          padding: 8px 18px;
          font-weight: 600;
          display: inline-flex;
          cursor: pointer;
          font-size: 13.5px;
          transition: var(--transition);
          height: 36px;
          border: none;
          outline: none;
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .btn-delete-custom {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          height: 42px;
          padding: 0 20px;
          border: 1px solid #2d2d30;
          background-color: transparent;
          color: var(--text-light);
          font-weight: 600;
          font-size: 13.5px;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          user-select: none;
        }
        .btn-delete-custom:hover {
          color: #ef4444 !important;
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.05) !important;
        }
        .btn-cancel-custom {
          background-color: #27272a;
          color: #ffffff;
          border: 1px solid #3f3f46;
          border-radius: 0px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-cancel-custom:hover {
          background-color: #3f3f46;
        }
        .btn-delete-confirm-custom {
          background-color: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 0px;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-delete-confirm-custom:hover {
          background-color: #dc2626;
        }
      `}</style>

      <div>
        <Link to="/products" className="btn-back-custom">
          <TbArrowLeft /> Quay lại danh sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '4px' }}>
          {isEdit ? 'Chỉnh sửa thông tin sách' : 'Thêm cuốn sách mới'}
        </h1>
        <p className="view-subtitle" style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật lại các thông tin mô tả, tác giả, danh mục cho đầu sách.' : 'Nhập thông tin ban đầu để thêm một cuốn sách mới vào kho.'}
        </p>
      </div>

      <form onSubmit={handleFormSubmit} className="form-card-custom">
        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>
              Tựa đề sách
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              className="title-input-custom"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Nhập tên sách..."
            />
          </div>
          <div className="form-field-custom">
            <label>
              Mô tả sách
              <span className="required-star">*</span>
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              placeholder="Nhập nội dung mô tả sách..."
            />
          </div>
        </div>

        <div className="form-field-custom" style={{ marginTop: '20px', marginBottom: '25px' }}>
          <label style={{ display: 'block', marginBottom: '8px' }}>Nhãn dán nổi bật</label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px' }}>
            {badges.map((badge: any) => {
              const isSelected = selectedBadgeId === badge.id;
              return (
                <button
                  key={badge.id}
                  type="button"
                  onClick={() => {
                    if (isSelected) {
                      setSelectedBadgeId('');
                    } else {
                      setSelectedBadgeId(badge.id);
                    }
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 16px',
                    borderRadius: '20px',
                    border: '1px solid #2d2d30',
                    backgroundColor: isSelected ? badge.bgColor : '#161616',
                    color: isSelected ? badge.textColor : '#a0a0a0',
                    fontSize: '13px',
                    fontWeight: '500',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    boxShadow: 'none'
                  }}
                >
                  {isSelected ? (
                    <TbCheck style={{ fontSize: '14px', strokeWidth: 3 }} />
                  ) : (
                    <span style={{
                      display: 'inline-block',
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor: badge.bgColor,
                      border: '1px solid rgba(255,255,255,0.2)'
                    }} />
                  )}
                  {badge.text}
                </button>
              );
            })}
            {badges.length === 0 && (
              <span style={{ fontSize: '13.5px', color: '#5a5a5a' }}>
                Không có nhãn dán nào khả dụng trong hệ thống.
              </span>
            )}
          </div>
        </div>

        {isEdit && (
          <div className="form-field-custom" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '10px', marginBottom: '20px' }}>
            <div
              className={`switch-custom ${(active && editions.length > 0) ? 'active' : ''} ${editions.length > 0 ? '' : 'disabled'}`}
              onClick={() => {
                if (editions.length > 0) {
                  setActive(!active);
                }
              }}
            >
              <div className="switch-slider-custom" />
            </div>
            <span
              style={{
                margin: 0,
                cursor: editions.length > 0 ? 'pointer' : 'not-allowed',
                color: editions.length > 0
                  ? (active ? '#ed8936' : '#e2e4e9')
                  : 'var(--text-muted)',
                fontSize: '14px',
                fontWeight: '600',
                userSelect: 'none'
              }}
              onClick={() => {
                if (editions.length > 0) {
                  setActive(!active);
                }
              }}
            >
              Phát hành ra thị trường
            </span>
            {editions.length === 0 && (
              <span style={{ fontSize: '12.5px', color: '#ed8936', fontStyle: 'italic', marginLeft: '6px' }}>
                (Yêu cầu có ít nhất 1 phiên bản sách để kích hoạt phát hành)
              </span>
            )}
          </div>
        )}

        <div className="form-grid-custom">
          <div className="form-field-custom">
            <label>
              Tác giả
              <span className="required-star">*</span>
            </label>
            <div>
              <div className="search-select-wrap-custom">
                <input
                  type="text"
                  className="search-select-input-custom"
                  placeholder="Tìm kiếm tác giả..."
                  value={authorSearchTerm}
                  onChange={(e) => setAuthorSearchTerm(e.target.value)}
                />
                <button className="search-select-btn-custom" type="button">
                  <TbSearch />
                </button>
              </div>
              <div className="table-select-container-custom" onScroll={handleAuthorScroll}>
                {loading ? (
                  <div className="pink-spinner-container">
                    <div className="pink-spinner" />
                    <span>Đang tải tác giả...</span>
                  </div>
                ) : (
                  <table className="table-select-custom">
                    <thead>
                      <tr>
                        <th className="checkbox-cell-custom" style={{ borderBottom: '1px solid #2d2d30' }}>Chọn</th>
                        <th style={{ borderBottom: '1px solid #2d2d30' }}>Tên Tác giả</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAuthors.map(a => {
                        const isSelected = selectedAuthorIds.includes(a.id);
                        return (
                          <tr
                            key={a.id}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedAuthorIds(selectedAuthorIds.filter(id => id !== a.id));
                                setSelectedAuthors(selectedAuthors.filter(item => item.id !== a.id));
                              } else {
                                setSelectedAuthorIds([...selectedAuthorIds, a.id]);
                                setSelectedAuthors([...selectedAuthors, a]);
                              }
                            }}
                          >
                            <td className="checkbox-cell-custom">
                              <div className={`circle-checkbox-custom ${isSelected ? 'selected' : ''}`} />
                            </td>
                            <td className="item-name-cell">{a.name}</td>
                          </tr>
                        );
                      })}
                      {authorLoadingMore && (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', padding: '12px' }}>
                            <div className="pink-spinner" style={{ width: '20px', height: '20px', margin: '0 auto' }} />
                          </td>
                        </tr>
                      )}
                      {filteredAuthors.length === 0 && !authorLoadingMore && (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                            Không tìm thấy tác giả nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
          <div className="form-field-custom">
            <label>
              Danh mục
              <span className="required-star">*</span>
            </label>
            <div>
              <div className="search-select-wrap-custom">
                <input
                  type="text"
                  className="search-select-input-custom"
                  placeholder="Tìm kiếm danh mục..."
                  value={categorySearchTerm}
                  onChange={(e) => setCategorySearchTerm(e.target.value)}
                />
                <button className="search-select-btn-custom" type="button">
                  <TbSearch />
                </button>
              </div>
              <div className="table-select-container-custom">
                {loading ? (
                  <div className="pink-spinner-container">
                    <div className="pink-spinner" />
                    <span>Đang tải danh mục...</span>
                  </div>
                ) : (
                  <table className="table-select-custom">
                    <thead>
                      <tr>
                        <th className="checkbox-cell-custom" style={{ borderBottom: '1px solid #2d2d30' }}>Chọn</th>
                        <th style={{ borderBottom: '1px solid #2d2d30' }}>Tên Danh mục</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCategories.map(c => {
                        const isSelected = selectedCategoryIds.includes(c.id);
                        return (
                          <tr
                            key={c.id}
                            className={isSelected ? 'selected' : ''}
                            onClick={() => {
                              if (isSelected) {
                                setSelectedCategoryIds(selectedCategoryIds.filter(id => id !== c.id));
                              } else {
                                setSelectedCategoryIds([...selectedCategoryIds, c.id]);
                              }
                            }}
                          >
                            <td className="checkbox-cell-custom">
                              <div className={`circle-checkbox-custom ${isSelected ? 'selected' : ''}`} />
                            </td>
                            <td className="item-name-cell">{c.name}</td>
                          </tr>
                        );
                      })}
                      {filteredCategories.length === 0 && (
                        <tr>
                          <td colSpan={2} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                            Không tìm thấy danh mục nào.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="cover-desc-grid-custom" style={{ marginTop: '10px' }}>
          {/* Cột trái: Ảnh đại diện sách */}
          <div className="form-field-custom">
            <label>
              Ảnh đại diện sách
              {!isEdit && <span className="required-star">*</span>}
            </label>
            <div style={{ marginTop: '4px' }}>
              <input
                id="cover-file-input"
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                required={!isEdit}
                style={{ display: 'none' }} /* Ẩn hoàn toàn input chọn file mặc định */
              />
              <label htmlFor="cover-file-input" className="btn-upload-custom">
                <TbBookUpload style={{ fontSize: '18px' }} /> Chọn File
              </label>

              <div className="cover-preview-container-new">
                <div className="preview-wrap-new">
                  <img
                    src={previewUrl || 'https://placehold.co/400x400'}
                    alt="Bìa sách"
                    className="cover-preview-img-new"
                  />
                  {previewUrl && (
                    <button
                      type="button"
                      className="btn-remove-cover-new"
                      onClick={() => {
                        setCoverFile(null);
                        setPreviewUrl(null);
                      }}
                    >
                      &times;
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Cột phải: Giới thiệu chi tiết sách */}
          <div className="form-field-custom" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            <label>Giới thiệu chi tiết sách</label>
            <textarea
              style={{ flex: 1, minHeight: '400px', resize: 'vertical' }}
              value={introduce}
              onChange={(e) => setIntroduce(e.target.value)}
              placeholder="Nhập nội dung giới thiệu chi tiết cuốn sách này..."
            />
          </div>
        </div>

        {isEdit && (
          <div style={{ marginTop: '20px', marginBottom: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
              <label style={{ margin: 0, fontSize: '14px', fontWeight: '600', color: '#F687B3', textAlign: 'left' }}>
                Danh sách phiên bản sách
              </label>
              <button
                type="button"
                className="btn-add-custom"
                onClick={() => navigate(`/products/${id}/editions/add`)}
              >
                <TbBookmarkPlus style={{ fontSize: '16px' }} /> Thêm phiên bản mới
              </button>
            </div>
            <div className="table-container" style={{ border: '1px solid var(--border)', borderRadius: '0px', overflow: 'hidden' }}>
              <table className="data-table" style={{ margin: 0 }}>
                <thead>
                  <tr>
                    <th>Phiên bản</th>
                    <th>Mã ISBN</th>
                    <th>Giá bán</th>
                    <th>Trong kho</th>
                    <th>Đã bán</th>
                    <th style={{ textAlign: 'center' }}>Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {editions.length > 0 ? (
                    editions.map((ed: any) => (
                      <tr key={ed.id}>
                        <td style={{ fontWeight: '700', color: '#4fd1c5' }}>Phiên bản {ed.editionNumber}</td>
                        <td>{ed.isbn || '—'}</td>
                        <td style={{ fontWeight: '700', color: '#F687B3' }}>{ed.priceDisplay}</td>
                        <td style={{ fontWeight: '600', color: 'var(--accent-blue)' }}>{ed.stockQuantity} cuốn</td>
                        <td style={{ fontWeight: '600', color: 'var(--text-muted)' }}>{ed.soldCount} cuốn</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            type="button"
                            className="btn-detail-link"
                            onClick={() => navigate(`/products/${id}/editions/edit/${ed.id}`)}
                          >
                            Xem chi tiết
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '20px' }}>
                        Chưa có phiên bản nào được tạo cho cuốn sách này.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          {isEdit && (
            <button
              type="button"
              className="btn-delete-custom"
              onClick={() => setIsDeletingModalOpen(true)}
            >
              <TbTrash style={{ fontSize: '16px', marginRight: '6px' }} /> Xóa cuốn sách này
            </button>
          )}
          <button type="submit" className="btn-save-custom" disabled={submitting}>
            {submitting ? (
              <TbLoader2 className="animate-spin-custom" style={{ fontSize: '16px' }} />
            ) : (
              <TbDeviceFloppy />
            )}
            {submitting ? 'Đang lưu' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal (Flat, Square, Dark Theme) */}
      {isDeletingModalOpen && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom" style={{ maxWidth: '440px', borderRadius: '0px' }}>
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <TbTrash /> Xác nhận xóa sách
              </h2>
              <button className="modal-close-btn-custom" onClick={() => setIsDeletingModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px', textAlign: 'left' }}>
              Hành động này sẽ xóa mềm đầu sách và các thông tin liên quan. Bạn có chắc chắn muốn thực hiện không?
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
              <button
                className="btn-cancel-custom"
                onClick={() => setIsDeletingModalOpen(false)}
              >
                Hủy bỏ
              </button>
              <button
                className="btn-delete-confirm-custom"
                onClick={handleDeleteBook}
              >
                Xác nhận xóa
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductForm;
