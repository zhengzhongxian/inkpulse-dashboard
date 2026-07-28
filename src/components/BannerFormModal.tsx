import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { TbX, TbUpload, TbPlus, TbTrash, TbCheck, TbSearch, TbLoader2, TbGift } from 'react-icons/tb';
import { createBannerApi, updateBannerApi } from '../api/banners';
import { getInternalBooksApi, getInternalBookDetailApi } from '../api/books';
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
  const isEdit = Boolean(bannerToEdit);

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

  // 2-Step Target Selector states (Identical to FlashSaleForm / VoucherForm)
  const [selectedEditions, setSelectedEditions] = useState<BookEditionSelectItem[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  const [selectedBookIdForEdition, setSelectedBookIdForEdition] = useState('');
  const [selectedBookNameForEdition, setSelectedBookNameForEdition] = useState('');
  const [bookEditions, setBookEditions] = useState<any[]>([]);
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
    if (isOpen) {
      loadBooksList();
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
    setSelectedBookIdForEdition('');
    setSelectedBookNameForEdition('');
    setBookEditions([]);
    setBookSearchTerm('');
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

  const handleRemoveImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setImageFile(null);
    setImagePreview('');
  };

  const handleRemoveIcon = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIconFile(null);
    setIconPreview('');
  };

  const loadBooksList = async () => {
    try {
      setLoadingBooks(true);
      const res = await getInternalBooksApi({ pageNumber: 1, pageSize: 200 });
      if (res.data && res.data.success && res.data.data) {
        setBooks(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load books list', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  const loadBookEditions = async (bookId: string) => {
    try {
      setLoadingEditions(true);
      const res = await getInternalBookDetailApi(bookId);
      if (res.data && res.data.success) {
        setBookEditions(res.data.data.editions || []);
      }
    } catch (err) {
      console.error('Failed to load book editions', err);
    } finally {
      setLoadingEditions(false);
    }
  };

  const handleToggleEdition = (ed: any) => {
    const isSel = selectedEditions.some(item => item.editionId === ed.id);
    if (isSel) {
      setSelectedEditions(prev => prev.filter(item => item.editionId !== ed.id));
    } else {
      setSelectedEditions(prev => [
        ...prev,
        {
          editionId: ed.id,
          bookTitle: selectedBookNameForEdition,
          isbn: ed.isbn || '',
          price: Number(ed.price) || 0,
          coverUrl: ed.coverUrl || ed.thumbnailUrl
        }
      ]);
    }
  };

  const filteredBooks = books.filter(b =>
    (b.title || '').toLowerCase().includes(bookSearchTerm.toLowerCase())
  );

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
              className="input-custom title-input-custom"
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

          {/* Image & Icon Upload Area */}
          <div className="form-row-custom">
            <div className="form-group-custom flex-1">
              <label>Ảnh Banner <span className="text-danger">*</span></label>
              <div className="upload-box-custom">
                {imagePreview ? (
                  <div className="preview-wrap">
                    <img src={imagePreview} alt="Banner Preview" className="preview-img" />
                    <label htmlFor="image-file-input" className="preview-hover-overlay">
                      <TbUpload style={{ fontSize: '20px' }} />
                      <span>Thay đổi ảnh</span>
                    </label>
                    <button type="button" className="btn-remove-img" onClick={handleRemoveImage} title="Xóa ảnh">&times;</button>
                  </div>
                ) : (
                  <label htmlFor="image-file-input" className="upload-placeholder">
                    <TbUpload className="upload-icon" />
                    <span>Tải tệp ảnh banner lên</span>
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
              <label>Biểu Tượng / Icon</label>
              <div className="upload-box-custom">
                {iconPreview ? (
                  <div className="preview-wrap icon-wrap">
                    <img src={iconPreview} alt="Icon Preview" className="preview-icon" />
                    <label htmlFor="icon-file-input" className="preview-hover-overlay">
                      <TbUpload style={{ fontSize: '18px' }} />
                      <span>Đổi Icon</span>
                    </label>
                    <button type="button" className="btn-remove-img" onClick={handleRemoveIcon} title="Xóa icon">&times;</button>
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

          {/* Linked Book Editions Section (Identical to FlashSale / Voucher) */}
          <div className="form-group-custom">
            <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3', marginBottom: '8px', display: 'block' }}>
              Sản Phẩm Sách Đính Kèm Banner ({selectedEditions.length})
            </label>

            {/* Selected chips list */}
            {selectedEditions.length > 0 && (
              <div className="selected-editions-list" style={{ marginBottom: '12px' }}>
                {selectedEditions.map((item) => (
                  <div key={item.editionId} className="selected-edition-chip">
                    {item.coverUrl && <img src={item.coverUrl} alt="" className="chip-cover" />}
                    <span className="chip-title">{item.bookTitle} (ISBN: {item.isbn || 'N/A'})</span>
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
            )}

            {/* 2-Step Target Selector (FlashSale & Voucher Style) */}
            <div style={{ padding: '16px', backgroundColor: '#0d0d0f', border: '1px solid #2d2d30', borderRadius: '0' }}>
              {!selectedBookIdForEdition ? (
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>
                    Bước 1: Tìm kiếm & chọn sách chứa phiên bản
                  </div>
                  <div className="search-wrap-custom">
                    <input
                      type="text"
                      className="search-input-custom"
                      placeholder="Tìm sách..."
                      value={bookSearchTerm}
                      onChange={(e) => setBookSearchTerm(e.target.value)}
                    />
                    <button className="search-btn-custom" type="button"><TbSearch /></button>
                  </div>
                  <div className="table-select-container-custom">
                    {loadingBooks ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                        <div className="pink-spinner" />
                      </div>
                    ) : (
                      <table className="table-select-custom">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>Chọn</th>
                            <th>Tên sách</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBooks.map(bk => (
                            <tr
                              key={bk.id}
                              onClick={() => {
                                setSelectedBookIdForEdition(bk.id);
                                setSelectedBookNameForEdition(bk.title);
                                loadBookEditions(bk.id);
                              }}
                            >
                              <td>
                                <TbGift style={{ color: 'var(--primary)', fontSize: '15px' }} />
                              </td>
                              <td>{bk.title}</td>
                            </tr>
                          ))}
                          {filteredBooks.length === 0 && (
                            <tr>
                              <td colSpan={2} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                                Không tìm thấy sách phù hợp.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <span style={{ fontSize: '12px', color: '#4299e1' }}>Sách: <strong>{selectedBookNameForEdition}</strong></span>
                    <button
                      type="button"
                      style={{ background: 'none', border: 'none', color: '#f687b3', fontSize: '12px', cursor: 'pointer', fontWeight: 600 }}
                      onClick={() => {
                        setSelectedBookIdForEdition('');
                        setSelectedBookNameForEdition('');
                        setBookEditions([]);
                      }}
                    >
                      Chọn sách khác
                    </button>
                  </div>
                  <div className="table-select-container-custom">
                    {loadingEditions ? (
                      <div style={{ display: 'flex', justifyContent: 'center', padding: '16px' }}>
                        <div className="pink-spinner" />
                      </div>
                    ) : (
                      <table className="table-select-custom">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>Chọn</th>
                            <th>ISBN</th>
                            <th>PB số</th>
                            <th>Loại bìa</th>
                            <th>Giá gốc (đ)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {bookEditions.map(ed => {
                            const isSel = selectedEditions.some(i => i.editionId === ed.id);
                            return (
                              <tr
                                key={ed.id}
                                className={isSel ? 'selected' : ''}
                                onClick={() => handleToggleEdition(ed)}
                              >
                                <td>
                                  <div className={`circle-checkbox-custom ${isSel ? 'selected' : ''}`} />
                                </td>
                                <td>{ed.isbn}</td>
                                <td>{ed.editionNumber}</td>
                                <td>{ed.coverType}</td>
                                <td style={{ fontWeight: 'bold', color: '#48BB78' }}>
                                  {Number(ed.price || 0).toLocaleString('vi-VN')} đ
                                </td>
                              </tr>
                            );
                          })}
                          {bookEditions.length === 0 && (
                            <tr>
                              <td colSpan={5} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
                                Sách này chưa có phiên bản nào.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Status Toggle Switch */}
          <div className="form-group-custom" style={{ paddingTop: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div
                className={`switch-custom ${isActive ? 'active' : ''}`}
                onClick={() => setIsActive(!isActive)}
              >
                <div className="switch-slider-custom" />
              </div>
              <span
                style={{
                  fontSize: '14px',
                  fontWeight: 600,
                  color: isActive ? '#ed8936' : 'var(--text-light)',
                  cursor: 'pointer',
                  userSelect: 'none'
                }}
                onClick={() => setIsActive(!isActive)}
              >
                Kích hoạt hiển thị Banner ngay sau khi lưu
              </span>
            </div>
          </div>

          {/* Footer Buttons */}
          <div className="banner-modal-footer" style={{ justifyContent: 'flex-end', marginTop: '16px' }}>
            <button type="submit" className="btn-submit-custom" disabled={submitting}>
              {submitting ? <TbLoader2 className="animate-spin" /> : <TbCheck />}
              <span>{isEdit ? 'Lưu Cập Nhật' : 'Tạo Banner'}</span>
            </button>
          </div>
        </form>
      </div>

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
          border-radius: 0px;
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
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }

        .text-danger {
          color: #ef4444 !important;
          margin-left: 3px;
          font-weight: 700;
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

        .title-input-custom {
          color: #4fd1c5 !important;
          font-weight: 700;
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
          color: #94a3b8 !important;
          font-size: 13px;
          cursor: pointer;
          transition: color 0.2s ease;
        }

        .upload-placeholder:hover {
          color: #f8fafc !important;
        }

        .upload-icon {
          font-size: 28px;
          color: #94a3b8 !important;
          transition: color 0.2s ease;
        }

        .upload-placeholder:hover .upload-icon {
          color: #f8fafc !important;
        }

        .preview-wrap {
          width: 100%;
          height: 100%;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          overflow: hidden;
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

        .preview-hover-overlay {
          position: absolute;
          inset: 0;
          background: rgba(0, 0, 0, 0.65);
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #ffffff !important;
          font-size: 12.5px;
          font-weight: 600;
          opacity: 0;
          transition: opacity 0.2s ease;
          cursor: pointer;
          z-index: 2;
        }

        .preview-wrap:hover .preview-hover-overlay {
          opacity: 1;
        }

        .btn-remove-img {
          position: absolute;
          top: 6px;
          right: 6px;
          width: 22px;
          height: 22px;
          border-radius: 50%;
          background: rgba(239, 68, 68, 0.85);
          color: #ffffff;
          border: none;
          font-size: 14px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 5;
          opacity: 0;
          transition: opacity 0.2s ease;
        }

        .preview-wrap:hover .btn-remove-img {
          opacity: 1;
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
          border-radius: 0;
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
          border-radius: 3px;
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
          border-radius: 0px;
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

        /* Pink Search Bar (Identical to BannersList.tsx) */
        .search-wrap-custom {
          display: flex;
          align-items: center;
          width: 100%;
          height: 42px;
          border: 2px solid var(--primary, #da447d);
          border-radius: 10px;
          overflow: hidden;
          background-color: #1a1a1a;
          margin-bottom: 12px;
          transition: all 0.2s ease;
        }
        .search-wrap-custom:focus-within {
          border-color: var(--primary-hover, #e63980);
          box-shadow: 0 0 0 3px rgba(218, 68, 125, 0.2);
        }
        .search-input-custom {
          flex: 1;
          height: 100%;
          border: none !important;
          outline: none !important;
          padding: 0 16px !important;
          font-size: 13.5px;
          color: #f8fafc;
          background-color: transparent !important;
        }
        .search-input-custom::placeholder {
          color: #64748b;
        }
        .search-btn-custom {
          width: 48px;
          height: 100%;
          background-color: var(--primary, #da447d);
          color: #FFFFFF;
          display: flex;
          align-items: center;
          justify-content: center;
          border: none;
          cursor: pointer;
          font-size: 18px;
          transition: background-color 0.2s ease;
        }
        .search-btn-custom:hover {
          background-color: var(--primary-hover, #e63980);
        }
        .table-select-container-custom {
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #2d2d30;
          border-radius: 0;
          background-color: #0d0d0f;
        }
        .table-select-custom {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
          font-size: 13px;
        }
        .table-select-custom th {
          background-color: #161616;
          color: var(--text-light, #94a3b8);
          font-weight: 600;
          padding: 10px 14px;
        }
        .table-select-custom tr {
          border-bottom: 1px solid #1f1f23;
          cursor: pointer;
          transition: background-color 0.15s ease;
        }
        .table-select-custom tr:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }
        .table-select-custom tr.selected {
          background-color: rgba(217, 68, 125, 0.08);
        }
        .table-select-custom td {
          padding: 10px 14px;
          vertical-align: middle;
          color: #f8fafc;
        }
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
        .pink-spinner {
          width: 24px;
          height: 24px;
          border: 3px solid rgba(236, 72, 153, 0.15);
          border-top-color: #ec4899;
          border-radius: 50%;
          animation: pink-spin 0.8s linear infinite;
        }
        @keyframes pink-spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>,
    document.body
  );
};
