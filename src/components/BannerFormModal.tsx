import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TbX, TbUpload, TbPlus, TbTrash, TbCheck, TbSearch, TbLoader2 } from 'react-icons/tb';
import { createBannerApi, updateBannerApi } from '../api/banners';
import { getPagedBookEditionsApi } from '../api/books';
import { toast } from '../utils/toast';

interface BookEditionSelectItem {
  editionId: string;
  bookTitle: string;
  isbn: string;
  price: number;
  coverUrl?: string;
}

interface BannerFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bannerToEdit?: any;
}

export const BannerFormModal: React.FC<BannerFormModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  bannerToEdit
}) => {
  const isEdit = !!bannerToEdit;

  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [displayOrder, setDisplayOrder] = useState<number>(0);
  const [isActive, setIsActive] = useState(true);

  // MinIO File upload states
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [iconFile, setIconFile] = useState<File | null>(null);
  const [iconPreview, setIconPreview] = useState<string>('');

  // Book Edition Selector states
  const [selectedEditions, setSelectedEditions] = useState<BookEditionSelectItem[]>([]);
  const [isEditionPickerOpen, setIsEditionPickerOpen] = useState(false);
  const [availableEditions, setAvailableEditions] = useState<any[]>([]);
  const [editionSearch, setEditionSearch] = useState('');
  const [loadingEditions, setLoadingEditions] = useState(false);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (bannerToEdit) {
      setTitle(bannerToEdit.title || '');
      setSubtitle(bannerToEdit.subtitle || '');
      setLinkUrl(bannerToEdit.linkUrl || '');
      setDisplayOrder(bannerToEdit.displayOrder || 0);
      setIsActive(bannerToEdit.isActive !== false);
      setImagePreview(bannerToEdit.imageUrl || '');
      setIconPreview(bannerToEdit.iconUrl || '');

      if (bannerToEdit.editions && Array.isArray(bannerToEdit.editions)) {
        setSelectedEditions(
          bannerToEdit.editions.map((e: any) => ({
            editionId: e.editionId,
            bookTitle: e.bookTitle || 'Ấn phẩm sách',
            isbn: e.isbn || '',
            price: Number(e.price) || 0,
            coverUrl: e.coverUrl
          }))
        );
      } else {
        setSelectedEditions([]);
      }
    } else {
      resetForm();
    }
  }, [bannerToEdit, isOpen]);

  const resetForm = () => {
    setTitle('');
    setSubtitle('');
    setLinkUrl('');
    setDisplayOrder(0);
    setIsActive(true);
    setImageFile(null);
    setImagePreview('');
    setIconFile(null);
    setIconPreview('');
    setSelectedEditions([]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleIconChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setIconFile(file);
      setIconPreview(URL.createObjectURL(file));
    }
  };

  const fetchAvailableEditions = async (keyword: string) => {
    try {
      setLoadingEditions(true);
      const res = await getPagedBookEditionsApi({ pageNumber: 1, pageSize: 20, searchKeyword: keyword });
      if (res.data && res.data.success && res.data.data) {
        setAvailableEditions(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load editions', err);
    } finally {
      setLoadingEditions(false);
    }
  };

  const openEditionPicker = () => {
    setIsEditionPickerOpen(true);
    fetchAvailableEditions('');
  };

  const toggleEditionSelection = (item: any) => {
    const exists = selectedEditions.some(e => e.editionId === (item.editionId || item.id));
    if (exists) {
      setSelectedEditions(prev => prev.filter(e => e.editionId !== (item.editionId || item.id)));
    } else {
      setSelectedEditions(prev => [
        ...prev,
        {
          editionId: item.editionId || item.id,
          bookTitle: item.bookTitle || item.title || 'Ấn phẩm sách',
          isbn: item.isbn || '',
          price: Number(item.price) || 0,
          coverUrl: item.coverUrl
        }
      ]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      toast.error('Vui lòng nhập tên banner quảng cáo.');
      return;
    }
    if (!isEdit && !imageFile && !imagePreview) {
      toast.error('Vui lòng tải tệp ảnh cho banner quảng cáo.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      const requestPayload = {
        title: title.trim(),
        subtitle: subtitle.trim() || undefined,
        imageUrl: imagePreview && !imageFile ? imagePreview : undefined,
        iconUrl: iconPreview && !iconFile ? iconPreview : undefined,
        linkUrl: linkUrl.trim() || undefined,
        displayOrder,
        isActive,
        editionIds: selectedEditions.map(e => e.editionId)
      };

      formData.append('request', JSON.stringify(requestPayload));
      if (imageFile) {
        formData.append('imageFile', imageFile);
      }
      if (iconFile) {
        formData.append('iconFile', iconFile);
      }

      if (isEdit && bannerToEdit.bannerId) {
        await updateBannerApi(bannerToEdit.bannerId, formData);
        toast.success('Cập nhật banner thành công.');
      } else {
        await createBannerApi(formData);
        toast.success('Tạo banner mới thành công.');
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || 'Thao tác thất bại.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="banner-modal-overlay">
      <div className="banner-modal-container">
        {/* Header */}
        <div className="banner-modal-header">
          <h3>{isEdit ? 'Chỉnh Sửa Banner Quảng Cáo' : 'Tạo Banner Quảng Cáo Mới'}</h3>
          <button className="btn-close-modal" onClick={onClose}>
            <TbX />
          </button>
        </div>

        {/* Body Form */}
        <form onSubmit={handleSubmit} className="banner-modal-body">
          <div className="form-group-custom">
            <label>Tiêu Đề Banner <span className="text-danger">*</span></label>
            <input
              type="text"
              className="input-custom"
              placeholder="VD: Siêu Sale Sách Lập Trình CQRS & Microservices"
              value={title}
              onChange={e => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group-custom">
            <label>Phụ Đề / Mô Tả Ngắn</label>
            <input
              type="text"
              className="input-custom"
              placeholder="VD: Giảm ngay 30% cho các đầu sách tuyển chọn"
              value={subtitle}
              onChange={e => setSubtitle(e.target.value)}
            />
          </div>

          <div className="form-row-custom">
            <div className="form-group-custom flex-1">
              <label>Đường Dẫn Liên Kết (Link URL)</label>
              <input
                type="text"
                className="input-custom"
                placeholder="VD: /books?category=architecture"
                value={linkUrl}
                onChange={e => setLinkUrl(e.target.value)}
              />
            </div>
            <div className="form-group-custom width-140">
              <label>Thứ Tự Hiển Thị</label>
              <input
                type="number"
                className="input-custom"
                value={displayOrder}
                onChange={e => setDisplayOrder(parseInt(e.target.value) || 0)}
              />
            </div>
          </div>

          {/* MinIO Image & Icon Upload Area */}
          <div className="form-row-custom">
            <div className="form-group-custom flex-1">
              <label>Ảnh Banner (MinIO Upload) <span className="text-danger">*</span></label>
              <div className="upload-box-custom">
                {imagePreview ? (
                  <div className="preview-wrap">
                    <img src={imagePreview} alt="Banner Preview" className="preview-img" />
                    <label htmlFor="image-file-input" className="btn-change-img">
                      <TbUpload /> Đổi Ảnh
                    </label>
                  </div>
                ) : (
                  <label htmlFor="image-file-input" className="upload-placeholder">
                    <TbUpload className="upload-icon" />
                    <span>Tải tệp ảnh banner lên MinIO</span>
                  </label>
                )}
                <input
                  id="image-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>

            <div className="form-group-custom width-200">
              <label>Biểu Tượng / Icon (MinIO)</label>
              <div className="upload-box-custom">
                {iconPreview ? (
                  <div className="preview-wrap icon-wrap">
                    <img src={iconPreview} alt="Icon Preview" className="preview-icon" />
                    <label htmlFor="icon-file-input" className="btn-change-img">
                      <TbUpload /> Đổi
                    </label>
                  </div>
                ) : (
                  <label htmlFor="icon-file-input" className="upload-placeholder">
                    <TbUpload className="upload-icon" />
                    <span>Tải Icon</span>
                  </label>
                )}
                <input
                  id="icon-file-input"
                  type="file"
                  accept="image/*"
                  onChange={handleIconChange}
                  style={{ display: 'none' }}
                />
              </div>
            </div>
          </div>

          {/* Linked Book Editions Section */}
          <div className="form-group-custom">
            <div className="edition-section-header">
              <label>Sản Phẩm Sách Đính Kèm ({selectedEditions.length})</label>
              <button type="button" className="btn-add-edition" onClick={openEditionPicker}>
                <TbPlus /> Chọn Sách Đính Kèm
              </button>
            </div>

            {selectedEditions.length > 0 ? (
              <div className="selected-editions-list">
                {selectedEditions.map((item, idx) => (
                  <div key={item.editionId} className="selected-edition-chip">
                    {item.coverUrl && <img src={item.coverUrl} alt="" className="chip-cover" />}
                    <span className="chip-title">{item.bookTitle}</span>
                    <button
                      type="button"
                      className="btn-remove-chip"
                      onClick={() => setSelectedEditions(prev => prev.filter(e => e.editionId !== item.editionId))}
                    >
                      <TbX />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-editions-text">Chưa chọn sản phẩm sách nào cho Banner này.</div>
            )}
          </div>

          {/* Status Checkbox */}
          <div className="form-group-custom checkbox-group">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={isActive}
                onChange={e => setIsActive(e.target.checked)}
              />
              <span>Kích hoạt hiển thị Banner ngay sau khi lưu</span>
            </label>
          </div>

          {/* Footer Buttons */}
          <div className="banner-modal-footer">
            <button type="button" className="btn-cancel-custom" onClick={onClose} disabled={submitting}>
              Hủy
            </button>
            <button type="submit" className="btn-submit-custom" disabled={submitting}>
              {submitting ? <TbLoader2 className="animate-spin" /> : <TbCheck />}
              <span>{isEdit ? 'Lưu Cập Nhật' : 'Tạo Banner'}</span>
            </button>
          </div>
        </form>
      </div>

      {/* Book Edition Selection Picker Modal */}
      {isEditionPickerOpen && (
        <div className="inner-picker-overlay">
          <div className="inner-picker-modal">
            <div className="inner-picker-header">
              <h4>Chọn Sản Phẩm Sách Đính Kèm Banner</h4>
              <button className="btn-close-modal" onClick={() => setIsEditionPickerOpen(false)}>
                <TbX />
              </button>
            </div>
            <div className="inner-picker-search">
              <div className="search-wrap">
                <TbSearch className="search-icon" />
                <input
                  type="text"
                  placeholder="Tìm kiếm theo tên sách hoặc mã ISBN..."
                  value={editionSearch}
                  onChange={e => {
                    setEditionSearch(e.target.value);
                    fetchAvailableEditions(e.target.value);
                  }}
                />
              </div>
            </div>
            <div className="inner-picker-body">
              {loadingEditions ? (
                <div className="loading-state"><TbLoader2 className="animate-spin" /> Đang tải...</div>
              ) : availableEditions.length > 0 ? (
                <div className="editions-picker-grid">
                  {availableEditions.map(item => {
                    const id = item.editionId || item.id;
                    const isSelected = selectedEditions.some(e => e.editionId === id);
                    return (
                      <div
                        key={id}
                        className={`picker-card ${isSelected ? 'selected' : ''}`}
                        onClick={() => toggleEditionSelection(item)}
                      >
                        <div className="picker-card-check">
                          <input type="checkbox" checked={isSelected} readOnly />
                        </div>
                        {item.coverUrl && <img src={item.coverUrl} alt="" className="picker-cover" />}
                        <div className="picker-card-info">
                          <div className="picker-book-title">{item.bookTitle || item.title}</div>
                          <div className="picker-book-isbn">ISBN: {item.isbn || 'N/A'}</div>
                          <div className="picker-book-price">{Number(item.price || 0).toLocaleString('vi-VN')} đ</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="empty-state">Không tìm thấy sản phẩm phù hợp.</div>
              )}
            </div>
            <div className="inner-picker-footer">
              <button className="btn-submit-custom" onClick={() => setIsEditionPickerOpen(false)}>
                Xác Nhận Đã Chọn ({selectedEditions.length})
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .banner-modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.75);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 20px;
        }

        .banner-modal-container {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          width: 100%;
          max-width: 760px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.5);
          color: #f8fafc;
        }

        .banner-modal-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px;
          border-bottom: 1px solid #2a2a2a;
        }

        .banner-modal-header h3 {
          margin: 0;
          font-size: 20px;
          font-weight: 700;
          color: #da447d;
        }

        .btn-close-modal {
          background: transparent;
          border: none;
          color: #94a3b8;
          font-size: 22px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .btn-close-modal:hover {
          color: #f8fafc;
        }

        .banner-modal-body {
          padding: 24px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 18px;
        }

        .form-group-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .form-group-custom label {
          font-size: 13px;
          font-weight: 600;
          color: #cbd5e1;
        }

        .input-custom {
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 10px 14px;
          color: #f8fafc;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }

        .input-custom:focus {
          border-color: #da447d;
        }

        .form-row-custom {
          display: flex;
          gap: 16px;
        }

        .flex-1 { flex: 1; }
        .width-140 { width: 140px; }
        .width-200 { width: 200px; }

        .upload-box-custom {
          background: #1a1a1a;
          border: 2px dashed #2a2a2a;
          border-radius: 8px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
          position: relative;
        }

        .upload-placeholder {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 8px;
          color: #64748b;
          font-size: 13px;
          cursor: pointer;
        }

        .upload-icon {
          font-size: 28px;
          color: #da447d;
        }

        .preview-wrap {
          width: 100%;
          height: 100%;
          position: relative;
        }

        .preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .preview-icon {
          width: 100%;
          height: 100%;
          object-fit: contain;
          padding: 10px;
        }

        .btn-change-img {
          position: absolute;
          bottom: 8px;
          right: 8px;
          background: rgba(0, 0, 0, 0.75);
          color: #ffffff;
          font-size: 11px;
          padding: 4px 8px;
          border-radius: 4px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 4px;
        }

        .edition-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .btn-add-edition {
          background: rgba(218, 68, 125, 0.12);
          color: #da447d;
          border: 1px solid rgba(218, 68, 125, 0.3);
          border-radius: 6px;
          padding: 6px 12px;
          font-size: 12.5px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .selected-editions-list {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          background: #1a1a1a;
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #2a2a2a;
        }

        .selected-edition-chip {
          display: flex;
          align-items: center;
          gap: 8px;
          background: #262626;
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12.5px;
        }

        .chip-cover {
          width: 20px;
          height: 26px;
          object-fit: cover;
          border-radius: 2px;
        }

        .btn-remove-chip {
          background: transparent;
          border: none;
          color: #94a3b8;
          cursor: pointer;
          font-size: 14px;
          display: flex;
        }

        .no-editions-text {
          font-size: 13px;
          color: #64748b;
          font-style: italic;
        }

        .checkbox-group {
          padding-top: 6px;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13.5px;
          color: #cbd5e1;
          cursor: pointer;
        }

        .banner-modal-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 12px;
          padding-top: 12px;
          border-top: 1px solid #2a2a2a;
        }

        .btn-cancel-custom {
          background: transparent;
          border: 1px solid #2a2a2a;
          color: #94a3b8;
          padding: 10px 18px;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-submit-custom {
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
        }

        /* Inner Picker Dialog */
        .inner-picker-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.8);
          z-index: 1100;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }

        .inner-picker-modal {
          background: #141414;
          border: 1px solid #2a2a2a;
          border-radius: 12px;
          width: 100%;
          max-width: 620px;
          max-height: 80vh;
          display: flex;
          flex-direction: column;
        }

        .inner-picker-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          border-bottom: 1px solid #2a2a2a;
        }

        .inner-picker-header h4 {
          margin: 0;
          font-size: 16px;
          color: #f8fafc;
        }

        .inner-picker-search {
          padding: 12px 20px;
          border-bottom: 1px solid #2a2a2a;
        }

        .search-wrap {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 6px;
          padding: 8px 12px;
        }

        .search-wrap input {
          background: transparent;
          border: none;
          color: #f8fafc;
          outline: none;
          width: 100%;
          font-size: 13.5px;
        }

        .search-icon { color: #64748b; font-size: 18px; }

        .inner-picker-body {
          padding: 16px 20px;
          overflow-y: auto;
          max-height: 360px;
        }

        .editions-picker-grid {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .picker-card {
          display: flex;
          align-items: center;
          gap: 12px;
          background: #1a1a1a;
          border: 1px solid #2a2a2a;
          border-radius: 8px;
          padding: 10px 14px;
          cursor: pointer;
          transition: border-color 0.2s ease;
        }

        .picker-card.selected {
          border-color: #da447d;
          background: rgba(218, 68, 125, 0.08);
        }

        .picker-cover {
          width: 32px;
          height: 44px;
          object-fit: cover;
          border-radius: 4px;
        }

        .picker-card-info {
          flex: 1;
        }

        .picker-book-title {
          font-size: 13.5px;
          font-weight: 600;
          color: #f8fafc;
        }

        .picker-book-isbn {
          font-size: 12px;
          color: #64748b;
        }

        .picker-book-price {
          font-size: 13px;
          font-weight: 700;
          color: #da447d;
        }

        .inner-picker-footer {
          padding: 16px 20px;
          border-top: 1px solid #2a2a2a;
          display: flex;
          justify-content: flex-end;
        }

        .animate-spin {
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};
