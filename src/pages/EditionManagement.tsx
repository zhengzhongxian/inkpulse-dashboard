import React, { useState, useEffect } from 'react';
import { useParams, Link, useLocation } from 'react-router-dom';
import { TbArrowLeft, TbTrash, TbEdit, TbInfoCircle, TbLoader } from 'react-icons/tb';
import { 
  getInternalBookDetailApi, 
  getPublishersApi, 
  createBookEditionApi, 
  updateBookEditionApi, 
  deleteBookEditionApi,
  importStockApi,
  adjustStockApi,
  getStockHistoryApi
} from '../api/books';
import { toast } from '../utils/toast';

interface Edition {
  id: string;
  isbn: string;
  price: number;
  oldPrice: number | null;
  priceDisplay: string;
  oldPriceDisplay: string | null;
  stockQuantity: number;
  editionNumber: number;
  thumbnailUrl: string;
  filePathPdf: string | null;
  filePathPdfUrl: string | null;
  coverType: string;
  pageCount: number | null;
  publicationYear: number | null;
  weightGram: number | null;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  language: string | null;
  publisherName: string | null;
}

interface Publisher {
  id: string;
  name: string;
}

export default function EditionManagement() {
  const { id: bookId } = useParams<{ id: string }>();
  const location = useLocation();

  const [bookTitle, setBookTitle] = useState('');
  const [editions, setEditions] = useState<Edition[]>([]);
  const [publishers, setPublishers] = useState<Publisher[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [editingEditionId, setEditingEditionId] = useState<string | null>(null);
  const [isbn, setIsbn] = useState('');
  const [price, setPrice] = useState('');
  const [oldPrice, setOldPrice] = useState('');
  const [stockQuantity, setStockQuantity] = useState('0');
  const [editionNumber, setEditionNumber] = useState('1');
  const [coverType, setCoverType] = useState('SOFT_COVER');
  const [pageCount, setPageCount] = useState('');
  const [publicationYear, setPublicationYear] = useState('');
  const [weightGram, setWeightGram] = useState('');
  const [widthCm, setWidthCm] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [lengthCm, setLengthCm] = useState('');
  const [language, setLanguage] = useState('Tiếng Việt');
  const [publisherId, setPublisherId] = useState('');
  
  // File states
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [additionalImages, setAdditionalImages] = useState<FileList | null>(null);

  // Modal confirm delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Stock management modal states
  const [stockModalEdition, setStockModalEdition] = useState<Edition | null>(null);
  const [stockModalType, setStockModalType] = useState<'IMPORT' | 'ADJUST' | null>(null);
  const [stockInputQty, setStockInputQty] = useState<number>(0);
  const [stockInputNote, setStockInputNote] = useState<string>('');
  const [isStockSubmitting, setIsStockSubmitting] = useState<boolean>(false);

  const loadData = async () => {
    if (!bookId) return;
    try {
      setLoading(true);
      // Fetch book detail for title and editions list
      const bookRes = await getInternalBookDetailApi(bookId);
      if (bookRes.data && bookRes.data.success) {
        setBookTitle(bookRes.data.data.title || '');
        setEditions(bookRes.data.data.editions || []);
      }

      // Fetch active publishers list
      const pubRes = await getPublishersApi();
      if (pubRes.data && pubRes.data.success) {
        setPublishers(pubRes.data.data || []);
      }
    } catch (error) {
      console.error('Failed to load editions data', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể tải thông tin sách và phiên bản.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bookId]);

  useEffect(() => {
    if (location.state?.editEditionId && editions.length > 0) {
      const edToEdit = editions.find(e => e.id === location.state.editEditionId);
      if (edToEdit) {
        handleEditClick(edToEdit);
      }
    }
  }, [editions, location.state]);

  const resetForm = () => {
    setEditingEditionId(null);
    setIsbn('');
    setPrice('');
    setOldPrice('');
    setStockQuantity('0');
    setEditionNumber((editions.length + 1).toString());
    setCoverType('SOFT_COVER');
    setPageCount('');
    setPublicationYear(new Date().getFullYear().toString());
    setWeightGram('');
    setWidthCm('');
    setHeightCm('');
    setLengthCm('');
    setLanguage('Tiếng Việt');
    setPublisherId(publishers.length > 0 ? publishers[0].id : '');
    setCoverFile(null);
    setPdfFile(null);
    setAdditionalImages(null);
  };

  const handleEditClick = (edition: Edition) => {
    setEditingEditionId(edition.id);
    setIsbn(edition.isbn || '');
    setPrice(edition.price?.toString() || '');
    setOldPrice(edition.oldPrice?.toString() || '');
    setStockQuantity(edition.stockQuantity?.toString() || '0');
    setEditionNumber(edition.editionNumber?.toString() || '1');
    setCoverType(edition.coverType || 'SOFT_COVER');
    setPageCount(edition.pageCount?.toString() || '');
    setPublicationYear(edition.publicationYear?.toString() || '');
    setWeightGram(edition.weightGram?.toString() || '');
    setWidthCm(edition.widthCm?.toString() || '');
    setHeightCm(edition.heightCm?.toString() || '');
    setLengthCm(edition.lengthCm?.toString() || '');
    setLanguage(edition.language || 'Tiếng Việt');
    
    // Find publisher id matching the publisherName
    const matchingPub = publishers.find(p => p.name === edition.publisherName);
    setPublisherId(matchingPub ? matchingPub.id : '');
    
    // Reset file selections
    setCoverFile(null);
    setPdfFile(null);
    setAdditionalImages(null);

    // Scroll form into view if needed
    const formElement = document.getElementById('edition-form-panel');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteClick = (id: string) => {
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      setLoading(true);
      await deleteBookEditionApi(deletingId);
      toast.success('Xóa thành công', 'Phiên bản sách đã được xóa khỏi hệ thống.');
      setDeletingId(null);
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa phiên bản sách.');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenStockModal = (edition: Edition, type: 'IMPORT' | 'ADJUST') => {
    setStockModalEdition(edition);
    setStockModalType(type);
    setStockInputQty(type === 'IMPORT' ? 10 : edition.stockQuantity);
    setStockInputNote('');
  };

  const handleStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stockModalEdition || !stockModalType) return;
    
    try {
      setIsStockSubmitting(true);
      if (stockModalType === 'IMPORT') {
        if (stockInputQty <= 0) {
          toast.error('Lỗi nhập kho', 'Số lượng nhập phải lớn hơn 0.');
          setIsStockSubmitting(false);
          return;
        }
        await importStockApi({
          editionId: stockModalEdition.id,
          quantity: stockInputQty,
          note: stockInputNote || 'Nhập kho thủ công'
        });
        toast.success('Nhập kho thành công', `Đã nhập +${stockInputQty} cuốn vào kho.`);
      } else {
        if (stockInputQty < 0) {
          toast.error('Lỗi điều chỉnh', 'Số lượng kho mới không được âm.');
          setIsStockSubmitting(false);
          return;
        }
        await adjustStockApi({
          editionId: stockModalEdition.id,
          newQuantity: stockInputQty,
          note: stockInputNote || 'Điều chỉnh kho thủ công'
        });
        toast.success('Điều chỉnh thành công', `Đã cập nhật tồn kho về ${stockInputQty} cuốn.`);
      }

      setStockModalEdition(null);
      setStockModalType(null);
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error(
        stockModalType === 'IMPORT' ? 'Nhập kho thất bại' : 'Điều chỉnh thất bại',
        error.response?.data?.message || 'Có lỗi xảy ra khi thực hiện cập nhật kho.'
      );
    } finally {
      setIsStockSubmitting(false);
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookId) return;

    if (!isbn.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập mã ISBN.');
      return;
    }
    if (!price || Number(price) <= 0) {
      toast.error('Dữ liệu không hợp lệ', 'Giá bán phải lớn hơn 0.');
      return;
    }
    if (!editingEditionId && !pdfFile) {
      toast.error('Thiếu thông tin', 'Vui lòng tải lên tệp PDF đọc thử cho phiên bản mới.');
      return;
    }

    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('bookId', bookId);
      formData.append('isbn', isbn.trim());
      formData.append('price', price);
      if (oldPrice) formData.append('oldPrice', oldPrice);
      formData.append('stockQuantity', stockQuantity);
      formData.append('editionNumber', editionNumber);
      formData.append('coverType', coverType);
      if (pageCount) formData.append('pageCount', pageCount);
      if (publicationYear) formData.append('publicationYear', publicationYear);
      if (weightGram) formData.append('weightGram', weightGram);
      if (widthCm) formData.append('widthCm', widthCm);
      if (heightCm) formData.append('heightCm', heightCm);
      if (lengthCm) formData.append('lengthCm', lengthCm);
      if (language) formData.append('language', language.trim());
      if (publisherId) formData.append('publisherId', publisherId);

      if (coverFile) {
        formData.append('coverFile', coverFile);
      }
      if (pdfFile) {
        formData.append('pdfFile', pdfFile);
      }
      if (additionalImages && additionalImages.length > 0) {
        for (let i = 0; i < additionalImages.length; i++) {
          formData.append('additionalImages', additionalImages[i]);
        }
      }

      if (editingEditionId) {
        // Update (PATCH)
        await updateBookEditionApi(editingEditionId, formData);
        toast.success('Cập nhật thành công', 'Phiên bản sách đã được cập nhật.');
      } else {
        // Create (POST)
        await createBookEditionApi(formData);
        toast.success('Thêm thành công', 'Đã thêm phiên bản sách mới.');
      }

      resetForm();
      await loadData();
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi xử lý', error.response?.data?.message || 'Không thể lưu phiên bản sách.');
    } finally {
      setSubmitting(false);
    }
  };

  const formatVnd = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  if (loading && editions.length === 0) {
    return (
      <div className="pink-spinner-container" style={{ minHeight: '300px' }}>
        <div className="pink-spinner"></div>
        <span>Đang tải danh sách phiên bản...</span>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative' }}>
      {/* CSS internal styles */}
      <style>{`
        .editions-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: 24px;
          margin-top: 20px;
          align-items: start;
        }
        @media (max-width: 1024px) {
          .editions-layout {
            grid-template-columns: 1fr;
          }
        }
        .editions-table-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: 0px !important;
          box-shadow: var(--shadow-sm);
        }
        .editions-form-card {
          background-color: var(--bg-card);
          border: 1px solid var(--border);
          padding: 24px;
          border-radius: 0px !important;
          box-shadow: var(--shadow-sm);
          position: sticky;
          top: 20px;
        }
        .btn-pink-custom {
          background-color: var(--primary);
          color: white;
          border: none;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: var(--transition);
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          border-radius: 0px !important;
        }
        .btn-pink-custom:hover {
          background-color: #c5386d;
        }
        .btn-pink-custom:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        .btn-cancel-custom {
          background: none;
          border: 1px solid var(--border);
          color: var(--text-muted);
          padding: 10px 18px;
          font-weight: 600;
          font-size: 13.5px;
          cursor: pointer;
          transition: var(--transition);
          border-radius: 0px !important;
        }
        .btn-cancel-custom:hover {
          border-color: #F687B3 !important;
          color: #F687B3 !important;
        }
        .form-grid-2col {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
        }
        .form-field-edition {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 12px;
        }
        .form-field-edition label {
          font-size: 12.5px;
          font-weight: 600;
          color: #D9447D; /* Hồng ngọt ngào cho label */
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .form-field-edition input,
        .form-field-edition select {
          background-color: #1e1e24;
          border: 1px solid var(--border);
          color: var(--text-main);
          padding: 8px 12px;
          font-size: 13.5px;
          width: 100%;
          outline: none;
          transition: var(--transition);
          border-radius: 0px !important;
        }
        .form-field-edition input:focus,
        .form-field-edition select:focus {
          border-color: #ec4899;
          box-shadow: 0 0 0 1px rgba(236, 72, 153, 0.2);
        }
        .form-field-edition input[type="file"] {
          background-color: transparent;
          border: 1px dashed var(--border);
          padding: 6px;
          cursor: pointer;
        }
        .form-field-edition input[type="file"]::file-selector-button {
          background-color: #2d2d35;
          color: var(--text-main);
          border: 1px solid var(--border);
          padding: 4px 8px;
          cursor: pointer;
          font-size: 12px;
        }
        .form-field-edition input[type="file"]::file-selector-button:hover {
          background-color: #3e3e48;
        }
        .required-star-edition {
          color: #f56565;
          margin-left: 2px;
        }
        .btn-icon-custom {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          padding: 6px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          transition: var(--transition);
          color: var(--text-muted);
        }
        .btn-icon-custom:hover {
          color: var(--text-main);
        }
        .btn-icon-custom.delete:hover {
          color: #f56565;
        }
        .btn-icon-custom.edit:hover {
          color: #4fd1c5;
        }
        .badge-edition-number {
          background-color: #2d3748;
          color: #cbd5e0;
          font-size: 11px;
          font-weight: 700;
          padding: 2px 6px;
          border-radius: 4px;
        }
      `}</style>

      {/* Header bar */}
      <div>
        <Link to={`/products/edit/${bookId}`} className="btn-back-custom">
          <TbArrowLeft /> Quay lại thông tin sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '26px', marginTop: '4px' }}>
          Quản lý phiên bản sách
        </h1>
        <p className="view-subtitle" style={{ margin: 0 }}>
          Cuốn sách: <span style={{ color: '#4fd1c5', fontWeight: 600 }}>{bookTitle}</span>
        </p>
      </div>

      {/* Main Layout (Left: Table, Right: Form) */}
      <div className="editions-layout">
        
        {/* Left Side: Table of Editions */}
        <div className="editions-table-card">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Danh sách phiên bản ({editions.length})
          </h2>

          {editions.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
              <TbInfoCircle size={40} style={{ marginBottom: '12px', color: 'var(--text-muted)' }} />
              <p style={{ margin: 0, fontSize: '13.5px' }}>Cuốn sách này chưa có phiên bản nào.</p>
              <p style={{ margin: '4px 0 0 0', fontSize: '12px' }}>Hãy điền form bên phải để thêm phiên bản đầu tiên.</p>
            </div>
          ) : (
            <div className="table-responsive-custom">
              <table className="table-custom">
                <thead>
                  <tr>
                    <th style={{ width: '60px' }}>Ảnh</th>
                    <th style={{ width: '80px' }}>Bản #</th>
                    <th>Mã ISBN</th>
                    <th style={{ textAlign: 'right' }}>Giá bán</th>
                    <th style={{ textAlign: 'right' }}>Giá gốc</th>
                    <th style={{ textAlign: 'center' }}>Trong kho</th>
                    <th style={{ textAlign: 'center' }}>Đã bán</th>
                    <th>Loại bìa</th>
                    <th>PDF</th>
                    <th style={{ textAlign: 'center', width: '210px' }}>Hành động</th>
                  </tr>
                </thead>
                <tbody>
                  {editions.map((edition) => (
                    <tr key={edition.id}>
                      <td>
                        <img 
                          src={edition.thumbnailUrl || 'https://via.placeholder.com/40x40?text=No+Cover'} 
                          alt="Cover" 
                          style={{ width: '36px', height: '36px', objectFit: 'cover', border: '1px solid var(--border)' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <span className="badge-edition-number">#{edition.editionNumber}</span>
                      </td>
                      <td style={{ fontWeight: '600', color: '#e2e4e9' }}>
                        {edition.isbn}
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: '700', color: '#4fd1c5' }}>
                        {formatVnd(edition.price)}
                      </td>
                      <td style={{ textAlign: 'right', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                        {edition.oldPrice ? formatVnd(edition.oldPrice) : '-'}
                      </td>
                      <td style={{ textAlign: 'center', color: edition.stockQuantity === 0 ? '#f687b3' : '#e2e4e9' }}>
                        {edition.stockQuantity}
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {edition.stockQuantity - (edition.stockQuantity - (edition.stockQuantity > 0 ? 0 : 0)) /* placeholder */} 0
                      </td>
                      <td>
                        <span style={{ fontSize: '12px' }}>
                          {edition.coverType === 'HARD_COVER' ? 'Bìa cứng' : 'Bìa mềm'}
                        </span>
                      </td>
                      <td>
                        {edition.filePathPdf ? (
                          <a 
                            href={edition.filePathPdfUrl || '#'} 
                            target="_blank" 
                            rel="noreferrer"
                            style={{ color: '#ec4899', fontSize: '12px', textDecoration: 'underline' }}
                          >
                            Tải xem thử
                          </a>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '12px' }}>Không có</span>
                        )}
                      </td>
                      <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                        <button 
                          className="btn-small-action import" 
                          style={{ 
                            marginRight: '6px', 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            borderRadius: '2px', 
                            backgroundColor: '#319795', 
                            color: 'white', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          onClick={() => handleOpenStockModal(edition, 'IMPORT')}
                          title="Nhập thêm sách vào kho"
                        >
                          Nhập
                        </button>
                        <button 
                          className="btn-small-action adjust" 
                          style={{ 
                            marginRight: '6px', 
                            padding: '4px 8px', 
                            fontSize: '11px', 
                            borderRadius: '2px', 
                            backgroundColor: '#d69e2e', 
                            color: 'white', 
                            border: 'none', 
                            cursor: 'pointer',
                            fontWeight: '600'
                          }}
                          onClick={() => handleOpenStockModal(edition, 'ADJUST')}
                          title="Điều chỉnh hoặc xuất kho"
                        >
                          Chỉnh
                        </button>
                        <button 
                          className="btn-icon-custom edit" 
                          title="Chỉnh sửa phiên bản này"
                          onClick={() => handleEditClick(edition)}
                          style={{ padding: '4px' }}
                        >
                          <TbEdit />
                        </button>
                        <button 
                          className="btn-icon-custom delete" 
                          title="Xóa phiên bản này"
                          onClick={() => handleDeleteClick(edition.id)}
                          style={{ padding: '4px' }}
                        >
                          <TbTrash />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Side: Add / Edit Form */}
        <div className="editions-form-card" id="edition-form-panel">
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'white', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            {editingEditionId ? `Sửa phiên bản #${editionNumber}` : 'Thêm phiên bản mới'}
          </h2>

          <form onSubmit={handleFormSubmit}>
            
            <div className="form-field-edition">
              <label>
                Mã ISBN
                <span className="required-star-edition">*</span>
              </label>
              <input 
                type="text" 
                placeholder="Ví dụ: 9786041185012"
                value={isbn} 
                onChange={(e) => setIsbn(e.target.value)} 
                required
              />
            </div>

            <div className="form-grid-2col">
              <div className="form-field-edition">
                <label>
                  Giá bán (VND)
                  <span className="required-star-edition">*</span>
                </label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 95000"
                  value={price} 
                  onChange={(e) => setPrice(e.target.value)} 
                  required
                />
              </div>

              <div className="form-field-edition">
                <label>Giá gốc (VND)</label>
                <input 
                  type="number" 
                  placeholder="Để trống nếu không có"
                  value={oldPrice} 
                  onChange={(e) => setOldPrice(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-field-edition">
                <label>Số lượng kho</label>
                <input 
                  type="number" 
                  value={stockQuantity} 
                  onChange={(e) => setStockQuantity(e.target.value)} 
                  min="0"
                  disabled={editingEditionId !== null}
                  style={editingEditionId !== null ? { backgroundColor: '#2d3748', cursor: 'not-allowed' } : {}}
                />
                {editingEditionId !== null && (
                  <span style={{ fontSize: '11px', color: '#a0aec0', marginTop: '4px', display: 'block' }}>
                    Sử dụng nút [Nhập kho] / [Chỉnh kho] trong danh sách để điều chỉnh tồn kho.
                  </span>
                )}
              </div>

              <div className="form-field-edition">
                <label>Thứ tự phiên bản</label>
                <input 
                  type="number" 
                  value={editionNumber} 
                  onChange={(e) => setEditionNumber(e.target.value)} 
                  min="1"
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-field-edition">
                <label>Loại bìa</label>
                <select value={coverType} onChange={(e) => setCoverType(e.target.value)}>
                  <option value="SOFT_COVER">Bìa mềm</option>
                  <option value="HARD_COVER">Bìa cứng</option>
                </select>
              </div>

              <div className="form-field-edition">
                <label>Nhà xuất bản</label>
                <select value={publisherId} onChange={(e) => setPublisherId(e.target.value)}>
                  <option value="">-- Chọn NXB --</option>
                  {publishers.map(pub => (
                    <option key={pub.id} value={pub.id}>{pub.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-field-edition">
                <label>Số trang</label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 350"
                  value={pageCount} 
                  onChange={(e) => setPageCount(e.target.value)} 
                />
              </div>

              <div className="form-field-edition">
                <label>Năm xuất bản</label>
                <input 
                  type="number" 
                  placeholder="Ví dụ: 2026"
                  value={publicationYear} 
                  onChange={(e) => setPublicationYear(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-grid-2col">
              <div className="form-field-edition">
                <label>Thông số giao hàng (Cân nặng / Rộng × Dài × Cao)</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                  <div>
                    <input 
                      type="number" 
                      placeholder="Nặng (g)"
                      value={weightGram} 
                      onChange={(e) => setWeightGram(e.target.value)} 
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      placeholder="Rộng (cm)"
                      value={widthCm} 
                      onChange={(e) => setWidthCm(e.target.value)} 
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      placeholder="Dài (cm)"
                      value={lengthCm} 
                      onChange={(e) => setLengthCm(e.target.value)} 
                    />
                  </div>
                  <div>
                    <input 
                      type="number" 
                      placeholder="Cao (cm)"
                      value={heightCm} 
                      onChange={(e) => setHeightCm(e.target.value)} 
                    />
                  </div>
                </div>
              </div>

              <div className="form-field-edition">
                <label>Ngôn ngữ</label>
                <input 
                  type="text" 
                  placeholder="Ví dụ: Tiếng Việt"
                  value={language} 
                  onChange={(e) => setLanguage(e.target.value)} 
                />
              </div>
            </div>

            <div className="form-field-edition" style={{ marginTop: '10px' }}>
              <label>
                Tải ảnh bìa phiên bản
                {editingEditionId && <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'none', marginLeft: '6px' }}>(Để trống nếu giữ ảnh cũ)</span>}
              </label>
              <input 
                type="file" 
                accept="image/*"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setCoverFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            <div className="form-field-edition">
              <label>
                Tải tệp PDF đọc thử
                {!editingEditionId && <span className="required-star-edition">*</span>}
                {editingEditionId && <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'none', marginLeft: '6px' }}>(Để trống nếu giữ file cũ)</span>}
              </label>
              <input 
                type="file" 
                accept="application/pdf"
                onChange={(e) => {
                  if (e.target.files && e.target.files.length > 0) {
                    setPdfFile(e.target.files[0]);
                  }
                }}
                required={!editingEditionId}
              />
            </div>

            <div className="form-field-edition">
              <label>
                Ảnh bộ sưu tập (gallery)
                {editingEditionId && <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'none', marginLeft: '6px' }}>(Tải lên sẽ thay thế ảnh bộ sưu tập cũ)</span>}
              </label>
              <input 
                type="file" 
                accept="image/*"
                multiple
                onChange={(e) => setAdditionalImages(e.target.files)}
              />
            </div>

            <div style={{ display: 'flex', gap: '10px', marginTop: '24px', justifyContent: 'flex-end' }}>
              {editingEditionId ? (
                <button 
                  type="button" 
                  className="btn-cancel-custom"
                  onClick={resetForm}
                >
                  Hủy sửa
                </button>
              ) : (
                <button 
                  type="button" 
                  className="btn-cancel-custom"
                  onClick={resetForm}
                >
                  Xóa trắng
                </button>
              )}
              
              <button 
                type="submit" 
                className="btn-pink-custom"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <TbLoader className="animate-spin-custom" /> Đang lưu...
                  </>
                ) : (
                  <>
                    Lưu thông tin
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

      </div>

      {/* Delete Confirmation Modal (Flat, Square, Dark Theme) */}
      {deletingId && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom" style={{ maxWidth: '440px', borderRadius: '0px !important' }}>
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2>Xác nhận xóa phiên bản</h2>
              <button className="modal-close-btn-custom" onClick={() => setDeletingId(null)}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px', textAlign: 'left' }}>
              Hành động này sẽ xóa mềm phiên bản sách khỏi cơ sở dữ liệu và xóa vật lý tài liệu trên Elasticsearch. Bạn có chắc chắn muốn thực hiện không?
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
              <button 
                className="btn-cancel-custom" 
                onClick={() => setDeletingId(null)}
              >
                Hủy bỏ
              </button>
              <button 
                className="btn-pink-custom" 
                style={{ backgroundColor: '#f56565' }}
                onClick={confirmDelete}
              >
                Đồng ý xóa
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Stock Management Modal (Flat, Square, Dark Theme) */}
      {stockModalEdition && stockModalType && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom" style={{ maxWidth: '480px', borderRadius: '0px !important' }}>
            <div className="modal-header-custom">
              <h2>
                {stockModalType === 'IMPORT' 
                  ? `Nhập kho: Phiên bản #${stockModalEdition.editionNumber}`
                  : `Điều chỉnh kho: Phiên bản #${stockModalEdition.editionNumber}`
                }
              </h2>
              <button 
                className="modal-close-btn-custom" 
                onClick={() => {
                  setStockModalEdition(null);
                  setStockModalType(null);
                }}
              >
                &times;
              </button>
            </div>
            
            <form onSubmit={handleStockSubmit}>
              <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', textAlign: 'left' }}>
                
                <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                  <p style={{ margin: '0 0 4px 0' }}><strong>ISBN:</strong> {stockModalEdition.isbn}</p>
                  <p style={{ margin: '0' }}><strong>Tồn kho hiện tại:</strong> {stockModalEdition.stockQuantity} cuốn</p>
                </div>

                <div className="form-field-edition" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>
                    {stockModalType === 'IMPORT' 
                      ? 'Số lượng nhập thêm'
                      : 'Số lượng kho mới (Tồn kho thực tế)'
                    }
                    <span className="required-star-edition">*</span>
                  </label>
                  <input 
                    type="number" 
                    value={stockInputQty}
                    onChange={(e) => setStockInputQty(parseInt(e.target.value, 10) || 0)}
                    min={stockModalType === 'IMPORT' ? '1' : '0'}
                    required
                    style={{ width: '100%', padding: '8px 12px', boxSizing: 'border-box' }}
                  />
                </div>

                <div className="form-field-edition" style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  <label style={{ fontSize: '13px', fontWeight: '600' }}>
                    Ghi chú / Lý do điều chỉnh
                    <span className="required-star-edition">*</span>
                  </label>
                  <textarea 
                    value={stockInputNote}
                    onChange={(e) => setStockInputNote(e.target.value)}
                    required
                    placeholder={stockModalType === 'IMPORT' ? 'Ví dụ: Nhập bổ sung từ nhà in Kim Đồng' : 'Ví dụ: Cân đối kiểm kê kho cuối tháng'}
                    style={{ 
                      width: '100%', 
                      padding: '8px 12px', 
                      minHeight: '80px', 
                      backgroundColor: 'var(--bg-input)', 
                      border: '1px solid var(--border)', 
                      color: 'var(--text-main)',
                      fontFamily: 'inherit',
                      resize: 'vertical',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

              </div>

              <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)' }}>
                <button 
                  type="button"
                  className="btn-cancel-custom" 
                  onClick={() => {
                    setStockModalEdition(null);
                    setStockModalType(null);
                  }}
                  disabled={isStockSubmitting}
                >
                  Hủy bỏ
                </button>
                <button 
                  type="submit"
                  className="btn-save-custom"
                  style={{ 
                    backgroundColor: stockModalType === 'IMPORT' ? '#319795' : '#d69e2e',
                    color: 'white',
                    padding: '8px 16px',
                    border: 'none',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                  disabled={isStockSubmitting}
                >
                  {isStockSubmitting ? (
                    <>
                      <TbLoader className="animate-spin-custom" /> Đang cập nhật...
                    </>
                  ) : (
                    stockModalType === 'IMPORT' ? 'Nhập kho' : 'Xác nhận'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
