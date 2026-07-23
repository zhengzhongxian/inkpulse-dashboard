import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import {
  createFlashSaleApi,
  getInternalFlashSaleDetailApi,
  updateFlashSaleApi,
  addFlashSaleItemApi,
  removeFlashSaleItemApi,
  updateFlashSaleItemApi,
  deleteFlashSaleApi
} from '../api/flashsales';
import { getInternalBooksApi, getInternalBookDetailApi } from '../api/books';
import { toast } from '../utils/toast';
import { TbArrowLeft, TbDeviceFloppy, TbSearch, TbLoader, TbTrash, TbGift, TbAlertCircle } from 'react-icons/tb';
import { CustomDateTimePicker } from '../components/CustomDateTimePicker';

interface FlashSaleFormItem {
  flashSaleItemId: string;
  bookEditionId: string;
  bookTitle: string;
  editionTitle: string;
  originalPrice: number;
  discountAmount: number;
  flashSaleStock: number;
}

const FlashSaleForm: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const isEditMode = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Campaign General States
  const [name, setName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [items, setItems] = useState<FlashSaleFormItem[]>([]);

  // Search & Selector Auxiliary States
  const [books, setBooks] = useState<any[]>([]);
  const [loadingBooks, setLoadingBooks] = useState(false);
  const [bookSearchTerm, setBookSearchTerm] = useState('');
  
  const [selectedBookIdForEdition, setSelectedBookIdForEdition] = useState('');
  const [selectedBookNameForEdition, setSelectedBookNameForEdition] = useState('');
  const [bookEditions, setBookEditions] = useState<any[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  // Load Initial Data (Books for selector)
  const loadBooksData = async () => {
    try {
      setLoadingBooks(true);
      const res = await getInternalBooksApi({ pageNumber: 1, pageSize: 200 });
      if (res.data && res.data.success) {
        setBooks(res.data.data.items || []);
      }
    } catch (err) {
      console.error('Failed to load books list', err);
    } finally {
      setLoadingBooks(false);
    }
  };

  // Fetch campaign details in Edit mode
  useEffect(() => {
    loadBooksData();

    if (!isEditMode) return;

    const fetchDetail = async () => {
      try {
        setLoading(true);
        const res = await getInternalFlashSaleDetailApi(id!);
        if (res.data && res.data.success) {
          const detail = res.data.data;
          const apiDateToLocal = (dateStr: string) => {
            if (!dateStr) return '';
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return '';
            const vnOffset = 7 * 60 * 60 * 1000;
            const vnDate = new Date(date.getTime() + vnOffset);
            return vnDate.toISOString().substring(0, 16);
          };
          setName(detail.name || '');
          setStartDate(apiDateToLocal(detail.startDate));
          setEndDate(apiDateToLocal(detail.endDate));
          setIsActive(detail.isActive);
          
          // Map items list
          const list = (detail.items || []).map((x: any) => ({
            flashSaleItemId: x.flashSaleItemId,
            bookEditionId: x.bookEditionId,
            bookTitle: x.bookTitle || 'Phiên bản sách',
            editionTitle: x.editionTitle || '',
            originalPrice: x.originalPrice,
            discountAmount: x.discountAmount,
            flashSaleStock: x.flashSaleStock
          }));
          setItems(list);
        }
      } catch (err) {
        toast.error('Không thể tải thông tin chiến dịch Flash Sale!');
        navigate('/flash-sales');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, isEditMode, navigate]);

  // Load Editions
  const loadBookEditions = async (bookId: string) => {
    try {
      setLoadingEditions(true);
      const res = await getInternalBookDetailApi(bookId);
      if (res.data && res.data.success) {
        setBookEditions(res.data.data.editions || []);
      }
    } catch (err) {
      console.error('Failed to load book editions', err);
      toast.error('Không thể tải các phiên bản sách');
    } finally {
      setLoadingEditions(false);
    }
  };

  // Client Filter for selector Books list
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(bookSearchTerm.toLowerCase())
  );

  // Toggle Edition addition/removal directly via APIs in edit mode
  const handleToggleEdition = async (ed: any) => {
    const existingIndex = items.findIndex(i => i.bookEditionId === ed.id);
    if (existingIndex > -1) {
      // Remove
      const itemToRemove = items[existingIndex];
      try {
        await removeFlashSaleItemApi(id!, itemToRemove.flashSaleItemId);
        setItems(prev => prev.filter((_, idx) => idx !== existingIndex));
        toast.success('Đã xóa sản phẩm khỏi chiến dịch');
      } catch (err) {
        toast.error('Xóa sản phẩm thất bại!');
      }
    } else {
      // Add
      try {
        const defaultDiscount = Math.floor(ed.price * 0.2); // Default 20% discount
        const defaultStock = 10;
        const res = await addFlashSaleItemApi(id!, {
          bookEditionId: ed.id,
          discountAmount: defaultDiscount,
          flashSaleStock: defaultStock
        });
        if (res.data && res.data.success) {
          const newItem = res.data.data;
          setItems(prev => [...prev, {
            flashSaleItemId: newItem.flashSaleItemId,
            bookEditionId: ed.id,
            bookTitle: selectedBookNameForEdition,
            editionTitle: ed.isbn,
            originalPrice: ed.price,
            discountAmount: defaultDiscount,
            flashSaleStock: defaultStock
          }]);
          toast.success('Đã thêm sản phẩm vào chiến dịch');
        }
      } catch (err) {
        toast.error('Thêm sản phẩm thất bại!');
      }
    }
  };

  // Remove directly
  const handleRemoveItem = async (index: number) => {
    const item = items[index];
    try {
      await removeFlashSaleItemApi(id!, item.flashSaleItemId);
      setItems(prev => prev.filter((_, idx) => idx !== index));
      toast.success('Đã xóa sản phẩm khỏi chiến dịch');
    } catch (err) {
      toast.error('Xóa sản phẩm thất bại!');
    }
  };

  // Modify local fields values
  const handleUpdateItemState = (index: number, field: 'discountAmount' | 'flashSaleStock', value: string) => {
    setItems(prev => prev.map((item, i) => {
      if (i === index) {
        const val = parseFloat(value) || 0;
        return {
          ...item,
          [field]: field === 'discountAmount' ? Math.min(item.originalPrice, val) : val
        };
      }
      return item;
    }));
  };

  // Trigger Save Updates on Blur
  const handleSaveItemUpdates = async (item: FlashSaleFormItem) => {
    if (item.discountAmount <= 0) {
      toast.error('Giảm giá phải lớn hơn 0!');
      return;
    }
    if (item.flashSaleStock <= 0) {
      toast.error('Tồn kho phải lớn hơn 0!');
      return;
    }
    try {
      await updateFlashSaleItemApi(id!, item.flashSaleItemId, {
        discountAmount: item.discountAmount,
        flashSaleStock: item.flashSaleStock
      });
      toast.success(`Đã lưu thay đổi sản phẩm`);
    } catch (err) {
      toast.error('Cập nhật sản phẩm thất bại!');
    }
  };

  // Create Campaign metadata or Edit campaign metadata
  const handleSubmitCampaign = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Vui lòng nhập tên chiến dịch!');
      return;
    }
    if (!startDate || !endDate) {
      toast.error('Vui lòng chọn thời gian bắt đầu và kết thúc!');
      return;
    }
    if (new Date(startDate) >= new Date(endDate)) {
      toast.error('Thời gian bắt đầu phải trước thời gian kết thúc!');
      return;
    }

    try {
      setSubmitting(true);
      const localDateToApi = (dateTimeStr: string, isEnd?: boolean) => {
        if (!dateTimeStr) return '';
        if (dateTimeStr.includes('+07:00') || dateTimeStr.includes('Z')) return dateTimeStr;
        if (!dateTimeStr.includes('T')) {
          const timeStr = isEnd ? 'T23:59:59.000+07:00' : 'T00:00:00.000+07:00';
          return dateTimeStr + timeStr;
        }
        return dateTimeStr + ':00.000+07:00';
      };

      if (isEditMode) {
        const res = await updateFlashSaleApi(id!, {
          name: name.trim(),
          startDate: localDateToApi(startDate, false),
          endDate: localDateToApi(endDate, true),
          isActive
        });
        if (res.data && res.data.success) {
          toast.success('Cập nhật chiến dịch thành công!');
          navigate('/flash-sales');
        }
      } else {
        const res = await createFlashSaleApi({
          name: name.trim(),
          startDate: localDateToApi(startDate, false),
          endDate: localDateToApi(endDate, true)
        });
        if (res.data && res.data.success) {
          toast.success('Tạo chiến dịch Flash Sale thành công! Tiếp tục cấu hình sản phẩm.');
          navigate(`/flash-sales/edit/${res.data.data.flashSaleId}`);
        }
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Lưu chiến dịch thất bại!');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCampaign = async () => {
    try {
      setIsDeleting(true);
      const res = await deleteFlashSaleApi(id!);
      if (res.data && res.data.success) {
        toast.success('Xóa chiến dịch Flash Sale thành công!');
        setIsDeleteModalOpen(false);
        navigate('/flash-sales');
      }
    } catch (err) {
      toast.error('Xóa chiến dịch Flash Sale thất bại!');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="view-container">
      <style>{`
        .btn-back-custom {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: var(--text-light);
          text-decoration: none;
          font-size: 14px;
          font-weight: 500;
          transition: var(--transition);
          margin-bottom: 12px;
        }
        .btn-back-custom:hover {
          color: #F687B3 !important;
        }
        .form-container-custom {
          margin-top: 20px;
          display: flex;
          flex-direction: column;
          gap: 24px;
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
        .form-group label {
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }
        .custom-datetimepicker-container {
          width: 100% !important;
        }
        .animate-spin-custom {
          animation: spin-key-custom 0.8s linear infinite;
        }
        @keyframes spin-key-custom {
          to { transform: rotate(360deg); }
        }
        .form-control {
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          color: #ffffff;
          height: 44px;
          padding: 0 12px;
          font-size: 14.5px;
          outline: none;
          transition: var(--transition);
        }
        .form-control:focus {
          border-color: #4a4a4f !important;
        }
        
        /* Custom Toggle Switch - matching book edition yellow style */
        .switch-custom {
          position: relative;
          display: inline-block;
          width: 44px;
          height: 24px;
          background-color: #4a4a4f;
          border-radius: 24px;
          cursor: pointer;
          transition: background-color 0.2s ease;
          flex-shrink: 0;
        }
        .switch-custom.active {
          background-color: #ed8936;
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
          padding: 10px 22px;
          font-weight: 600;
          display: inline-flex;
          cursor: pointer;
          font-size: 14px;
          border: none;
          transition: var(--transition);
        }
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .items-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        .items-table th {
          text-align: left;
          padding: 10px;
          font-size: 13px;
          color: var(--text-light);
          border-bottom: 1px solid var(--border);
        }
        .items-table td {
          padding: 12px 10px;
          border-bottom: 1px solid var(--border);
          color: #ffffff;
          font-size: 14px;
        }
        
        /* Selector Search Table matching VoucherForm */
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
        .search-select-input-custom {
          flex: 1;
          height: 100%;
          border: none !important;
          outline: none !important;
          padding: 0 12px !important;
          font-size: 13px;
          color: var(--text-main);
          background-color: transparent !important;
        }
        .search-select-btn-custom {
          width: 40px;
          height: 100%;
          background-color: var(--primary);
          color: #fff;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }
        .table-select-container-custom {
          max-height: 220px;
          overflow-y: auto;
          border: 1px solid #2d2d30;
          border-radius: 8px;
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
          color: var(--text-light);
          font-weight: 600;
          padding: 10px 14px;
        }
        .table-select-custom tr {
          border-bottom: 1px solid #1f1f23;
          cursor: pointer;
          transition: var(--transition);
        }
        .table-select-custom tr:hover {
          background-color: rgba(255, 255, 255, 0.03);
        }
        .table-select-custom tr.selected {
          background-color: rgba(217, 68, 125, 0.05);
        }
        .table-select-custom td {
          padding: 10px 14px;
          vertical-align: middle;
          color: var(--text-main);
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
          to { transform: rotate(360deg); }
        }
        .callout-box {
          display: flex;
          align-items: center;
          gap: 12px;
          background-color: rgba(218, 68, 125, 0.08);
          border: 1px solid rgba(218, 68, 125, 0.3);
          border-radius: 8px;
          padding: 16px;
          color: #F687B3;
          font-size: 14px;
        }
      `}</style>

      {/* Back button */}
      <Link to="/flash-sales" className="btn-back-custom">
        <TbArrowLeft /> Quay lại danh sách
      </Link>

      {/* Global standard large header */}
      <div className="view-header">
        <h1 className="view-title">{isEditMode ? 'Chi tiết chiến dịch Flash Sale' : 'Tạo mới chiến dịch Flash Sale'}</h1>
        <p className="view-subtitle">Thiết lập thông tin thời gian chạy và cấu hình danh sách sản phẩm giảm giá.</p>
      </div>

      {!isEditMode && (
        <div className="callout-box" style={{ marginTop: '16px', borderRadius: '0' }}>
          <TbAlertCircle style={{ fontSize: '20px', flexShrink: 0 }} />
          <span>Vui lòng tạo chiến dịch Flash Sale trước, sau đó bạn có thể thêm các sản phẩm áp dụng giảm giá vào chiến dịch.</span>
        </div>
      )}

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '64px' }}>
          <TbLoader className="pink-spinner" style={{ fontSize: '32px' }} />
        </div>
      ) : (
        <div className="form-container-custom">
          {/* Main Campaign Form details (No panels, flat design) */}
          <form onSubmit={handleSubmitCampaign} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Campaign General Metadata */}
            <div className="form-group">
              <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Tên chiến dịch Flash Sale</label>
              <input
                type="text"
                className="form-control"
                style={{ color: '#4fd1c5', fontWeight: '700' }}
                placeholder="Ví dụ: Flash Sale Cuối Tuần T7-CN"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            {/* Start and End date time + Active status inline */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: '1', minWidth: '240px', maxWidth: '300px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Thời gian bắt đầu</label>
                <CustomDateTimePicker value={startDate} onChange={setStartDate} placeholder="Chọn thời gian bắt đầu..." />
              </div>
              <div className="form-group" style={{ flex: '1', minWidth: '240px', maxWidth: '300px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Thời gian kết thúc</label>
                <CustomDateTimePicker value={endDate} onChange={setEndDate} placeholder="Chọn thời gian kết thúc..." />
              </div>
              <div className="form-group" style={{ minWidth: '180px' }}>
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Trạng thái</label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', height: '44px' }}>
                  <div
                    className={`switch-custom ${isActive ? 'active' : ''}`}
                    onClick={() => {
                      if (!isEditMode) {
                        toast.warning('Tạo mới luôn tự kích hoạt hoạt động. Có thể chỉnh sửa sau.');
                        return;
                      }
                      setIsActive(!isActive);
                    }}
                  >
                    <div className="switch-slider-custom" />
                  </div>
                  <span
                    style={{
                      margin: 0,
                      cursor: 'pointer',
                      color: isActive ? '#ed8936' : '#e2e4e9',
                      fontSize: '14px',
                      fontWeight: '600',
                      userSelect: 'none',
                      transition: 'color 0.2s ease'
                    }}
                    onClick={() => {
                      if (!isEditMode) return;
                      setIsActive(!isActive);
                    }}
                  >
                    {isActive ? 'Đang hoạt động' : 'Tạm khóa'}
                  </span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: '12px', marginTop: '20px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
              {isEditMode && (
                <button
                  type="button"
                  className="btn-delete-custom"
                  onClick={() => setIsDeleteModalOpen(true)}
                  style={{
                    backgroundColor: 'transparent',
                    color: 'var(--accent-red)',
                    border: '1px solid var(--accent-red)',
                    borderRadius: '8px',
                    height: '38px',
                    padding: '0 16px',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '13px'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'rgba(229, 62, 62, 0.1)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.backgroundColor = 'transparent';
                  }}
                >
                  <TbTrash /> Xóa chiến dịch
                </button>
              )}
              
              <button 
                type="submit" 
                className="btn-add-custom" 
                disabled={submitting} 
                style={{ 
                  gap: '8px', 
                  height: '38px', 
                  padding: '0 18px',
                  borderRadius: '8px',
                  fontSize: '13.5px',
                  fontWeight: 600
                }}
              >
                {submitting ? (
                  <>
                    <TbLoader className="animate-spin-custom" />
                    <span>Đang lưu...</span>
                  </>
                ) : (
                  <>
                    <TbDeviceFloppy />
                    <span>{isEditMode ? 'Lưu thông tin chung' : 'Tạo chiến dịch'}</span>
                  </>
                )}
              </button>
            </div>
          </form>

          {/* Campaign Products selection list (Flat design, no panels) */}
          {isEditMode ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', marginTop: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '10px 0 0 0', color: '#ffffff' }}>Sản phẩm áp dụng</h2>
              
              {/* Two-step target selector style VoucherForm */}
              <div className="form-group">
                <label style={{ fontSize: '14px', fontWeight: '600', color: '#F687B3' }}>Thêm sản phẩm áp dụng</label>
                <div style={{ padding: '16px', backgroundColor: '#0d0d0f', border: '1px solid #2d2d30', borderRadius: '8px' }}>
                  {!selectedBookIdForEdition ? (
                    <div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '8px' }}>Bước 1: Tìm kiếm & chọn sách chứa phiên bản</div>
                      <div className="search-select-wrap-custom">
                        <input
                          type="text"
                          className="search-select-input-custom"
                          placeholder="Tìm sách..."
                          value={bookSearchTerm}
                          onChange={(e) => setBookSearchTerm(e.target.value)}
                        />
                        <button className="search-select-btn-custom" type="button"><TbSearch /></button>
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
                                const isSel = items.some(i => i.bookEditionId === ed.id);
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
                                      {ed.price.toLocaleString('vi-VN')} đ
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

              {/* Items Table List (Flat design) */}
              <div style={{ overflowX: 'auto', marginTop: '10px' }}>
                <table className="items-table">
                  <thead>
                    <tr>
                      <th>Sản phẩm / Phiên bản</th>
                      <th style={{ width: '130px' }}>Giá gốc (đ)</th>
                      <th style={{ width: '150px' }}>Giảm giá (đ)</th>
                      <th style={{ width: '120px' }}>Tồn kho Flash</th>
                      <th style={{ width: '60px', textAlign: 'center' }}>Xóa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.length > 0 ? (
                      items.map((item, index) => (
                        <tr key={item.bookEditionId}>
                          <td>
                            <div style={{ fontWeight: '600' }}>{item.bookTitle}</div>
                            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>ISBN: {item.editionTitle}</div>
                          </td>
                          <td style={{ fontWeight: 'bold' }}>
                            {item.originalPrice.toLocaleString('vi-VN')}
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={item.discountAmount}
                              onChange={(e) => handleUpdateItemState(index, 'discountAmount', e.target.value)}
                              onBlur={() => handleSaveItemUpdates(item)}
                              style={{ height: '36px', width: '130px' }}
                            />
                          </td>
                          <td>
                            <input
                              type="number"
                              className="form-control"
                              value={item.flashSaleStock}
                              onChange={(e) => handleUpdateItemState(index, 'flashSaleStock', e.target.value)}
                              onBlur={() => handleSaveItemUpdates(item)}
                              style={{ height: '36px', width: '100px' }}
                            />
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button
                              type="button"
                              className="action-icon-btn delete"
                              onClick={() => handleRemoveItem(index)}
                              style={{ border: 'none', background: 'none', cursor: 'pointer', color: '#E53E3E' }}
                            >
                              <TbTrash style={{ fontSize: '18px' }} />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                          Chưa có sản phẩm nào được chọn trong chiến dịch này.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && (
        <div className="modal-overlay" style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.65)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 1100
        }}>
          <div className="modal-content card" style={{ width: '400px', padding: '24px', borderRadius: '0' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 12px 0', color: '#E53E3E' }}>
              Xác nhận xóa
            </h3>
            <p style={{ fontSize: '14.5px', color: 'var(--text-light)', margin: '0 0 20px 0', lineHeight: '1.5' }}>
              Bạn có chắc chắn muốn xóa chương trình Flash Sale này không? Hành động này không thể hoàn tác.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--border)',
                  backgroundColor: 'transparent', color: '#ffffff', cursor: 'pointer'
                }}
              >
                Hủy
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={isDeleting}
                onClick={handleDeleteCampaign}
                style={{
                  padding: '8px 16px', borderRadius: '6px', border: 'none',
                  backgroundColor: '#E53E3E', color: '#ffffff', fontWeight: '600', cursor: 'pointer'
                }}
              >
                {isDeleting ? 'Đang xóa...' : 'Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FlashSaleForm;
