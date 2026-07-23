import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { 
  getInternalVoucherDetailApi, 
  createVoucherApi, 
  updateVoucherApi
} from '../api/vouchers';
import type { CreateVoucherRequest, UpdateVoucherRequest } from '../api/vouchers';
import { 
  getCategoriesApi, 
  getInternalBooksApi, 
  getInternalBookDetailApi
} from '../api/books';
import type { CategoryResponse, BookResponse } from '../api/books';
import { toast } from '../utils/toast';
import { 
  TbArrowLeft, TbSearch, TbCheck, TbGift, TbLoader, TbDeviceFloppy, TbChevronDown, TbTicket, TbCoins, TbBan, TbCalendar
} from 'react-icons/tb';
import { CustomDateTimePicker } from '../components/CustomDateTimePicker';

const getRemainingTime = (startDateStr: string, endDateStr: string, used: number, max: number) => {
  if (!startDateStr || !endDateStr) return 'N/A';
  if (used >= max && max > 0) return 'Đã hết lượt';
  
  const now = new Date();
  const start = new Date(startDateStr);
  const end = new Date(endDateStr);
  
  if (now < start) {
    return 'Chưa diễn ra';
  }
  
  if (now > end) {
    return 'Đã hết hạn';
  }
  
  const diffTime = end.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays <= 0) {
    return 'Hết hạn hôm nay';
  }
  return `Còn ${diffDays} ngày`;
};

export const VoucherForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form Fields State
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [discountType, setDiscountType] = useState<'PERCENTAGE' | 'FIXED_AMOUNT'>('PERCENTAGE');
  const [discountValue, setDiscountValue] = useState('');
  const [minOrderValue, setMinOrderValue] = useState('');
  const [maxDiscountAmount, setMaxDiscountAmount] = useState('');
  const [maxUses, setMaxUses] = useState('');
  const [usedCount, setUsedCount] = useState(0);
  const [maxUsesPerUser, setMaxUsesPerUser] = useState('1');
  const [isActive, setIsActive] = useState(true);
  const [coinCost, setCoinCost] = useState('0');
  const [targetType, setTargetType] = useState<'ALL' | 'CATEGORY' | 'BOOK' | 'EDITION'>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Dropdown states for custom selectors
  const [isDiscountDropdownOpen, setIsDiscountDropdownOpen] = useState(false);
  const [isTargetDropdownOpen, setIsTargetDropdownOpen] = useState(false);

  // Click outside to close dropdowns
  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.custom-dropdown-container')) {
        setIsDiscountDropdownOpen(false);
        setIsTargetDropdownOpen(false);
      }
    };
    document.addEventListener('click', handleOutsideClick);
    return () => document.removeEventListener('click', handleOutsideClick);
  }, []);

  // Target Selections States (Multi-select)
  const [selectedTargetIds, setSelectedTargetIds] = useState<string[]>([]);
  const [selectedTargetNames, setSelectedTargetNames] = useState<string[]>([]);

  // Auxiliary Database Lists for Form Selector
  const [categories, setCategories] = useState<CategoryResponse[]>([]);
  const [books, setBooks] = useState<BookResponse[]>([]);
  const [loadingAux, setLoadingAux] = useState(false);

  // Selector Search Terms
  const [catSearchTerm, setCatSearchTerm] = useState('');
  const [bookSearchTerm, setBookSearchTerm] = useState('');

  // Selected Book for Edition Mode
  const [selectedBookIdForEdition, setSelectedBookIdForEdition] = useState<string>('');
  const [selectedBookNameForEdition, setSelectedBookNameForEdition] = useState<string>('');
  const [bookEditions, setBookEditions] = useState<any[]>([]);
  const [loadingEditions, setLoadingEditions] = useState(false);

  const handleToggleTarget = (id: string, name: string) => {
    setSelectedTargetIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
    setSelectedTargetNames(prev => 
      prev.includes(name) ? prev.filter(x => x !== name) : [...prev, name]
    );
  };

  // Utility Date Converters for CustomDateTimePicker (date & time)
  const apiDateToLocal = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return '';
    const vnOffset = 7 * 60 * 60 * 1000;
    const vnDate = new Date(date.getTime() + vnOffset);
    return vnDate.toISOString().substring(0, 16);
  };

  const localDateToApi = (dateTimeStr: string, isEnd?: boolean) => {
    if (!dateTimeStr) return '';
    if (dateTimeStr.includes('+07:00') || dateTimeStr.includes('Z')) return dateTimeStr;
    if (!dateTimeStr.includes('T')) {
      const timeStr = isEnd ? 'T23:59:59.000+07:00' : 'T00:00:00.000+07:00';
      return dateTimeStr + timeStr;
    }
    return dateTimeStr + ':00.000+07:00';
  };

  // Helper to format raw number to string with dot separators
  const formatNumberWithDots = (val: string) => {
    const rawDigits = val.replace(/\D/g, '');
    if (!rawDigits) return '';
    return rawDigits.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const cleanNumStr = (val: string | number) => {
    return String(val).replace(/\./g, '');
  };

  // Load Auxiliary Data (Categories & Books)
  const loadAuxiliaryData = async () => {
    setLoadingAux(true);
    try {
      const catRes = await getCategoriesApi();
      if (catRes.data && catRes.data.success) {
        setCategories(catRes.data.data || []);
      }
      
      const bookRes = await getInternalBooksApi({ pageNumber: 1, pageSize: 100 });
      if (bookRes.data && bookRes.data.success) {
        setBooks(bookRes.data.data.items || []);
      }
    } catch (e) {
      console.error('Failed to load categories/books for form', e);
    } finally {
      setLoadingAux(false);
    }
  };

  // Load Book Editions when selecting Edition target type
  const loadBookEditions = async (bookId: string) => {
    setLoadingEditions(true);
    try {
      const res = await getInternalBookDetailApi(bookId);
      if (res.data && res.data.success) {
        setBookEditions(res.data.data.editions || []);
      }
    } catch (e) {
      console.error('Failed to load book editions', e);
      toast.error('Lỗi', 'Không thể tải phiên bản của sách.');
    } finally {
      setLoadingEditions(false);
    }
  };

  // Fetch Voucher Detail if in Edit mode
  useEffect(() => {
    const fetchDetail = async () => {
      if (!isEdit || !id) return;
      setLoading(true);
      try {
        const res = await getInternalVoucherDetailApi(id);
        if (res.data && res.data.success) {
          const v = res.data.data;
          setCode(v.voucherCode);
          setDescription(v.description);
          setDiscountType(v.discountType);
          setDiscountValue(v.discountType === 'PERCENTAGE' ? String(v.discountValue) : formatNumberWithDots(String(v.discountValue)));
          setMinOrderValue(formatNumberWithDots(String(v.minOrderValue)));
          setMaxDiscountAmount(v.maxDiscountAmount ? formatNumberWithDots(String(v.maxDiscountAmount)) : '');
          setMaxUses(v.maxUses.toString());
          setUsedCount(v.usedCount || 0);
          setMaxUsesPerUser(v.maxUsesPerUser.toString());
          setIsActive(v.isActive);
          setCoinCost(formatNumberWithDots(String(v.coinCost)));
          setTargetType(v.targetType);
          setStartDate(apiDateToLocal(v.startDate));
          setEndDate(apiDateToLocal(v.endDate));

          if (v.targetType !== 'ALL' && v.targetItems && v.targetItems.length > 0) {
            setSelectedTargetIds(v.targetItems.map((item: any) => item.id));
            setSelectedTargetNames(v.targetItems.map((item: any) => item.name));
          }
        }
      } catch (e) {
        console.error('Failed to load voucher detail', e);
        toast.error('Lỗi tải dữ liệu', 'Không thể lấy thông tin chi tiết voucher.');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
    loadAuxiliaryData();
  }, [id, isEdit]);

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!code.trim()) {
      toast.warning('Cảnh báo', 'Vui lòng nhập mã giảm giá.');
      return;
    }
    const cleanDiscount = discountType === 'PERCENTAGE' ? Number(discountValue) : Number(cleanNumStr(discountValue));
    if (discountType === 'PERCENTAGE' && (cleanDiscount <= 0 || cleanDiscount > 100)) {
      toast.warning('Cảnh báo', 'Giá trị giảm giá theo phần trăm phải từ 1% đến 100%.');
      return;
    }
    if (discountType === 'FIXED_AMOUNT' && cleanDiscount <= 0) {
      toast.warning('Cảnh báo', 'Giá trị giảm giá cố định phải lớn hơn 0.');
      return;
    }
    if (targetType !== 'ALL' && selectedTargetIds.length === 0) {
      toast.warning('Cảnh báo', 'Vui lòng chọn đối tượng áp dụng giảm giá.');
      return;
    }
    if (!startDate || !endDate) {
      toast.warning('Cảnh báo', 'Vui lòng cấu hình ngày bắt đầu và kết thúc.');
      return;
    }

    setSubmitting(true);
    const targetIds = targetType !== 'ALL' ? selectedTargetIds : [];

    const requestPayload = {
      voucherCode: code.trim().toUpperCase(),
      description: description.trim(),
      discountType,
      discountValue: cleanDiscount,
      minOrderValue: Number(cleanNumStr(minOrderValue || 0)),
      maxUses: Number(maxUses),
      maxUsesPerUser: Number(maxUsesPerUser),
      isActive,
      coinCost: Number(cleanNumStr(coinCost || 0)),
      targetType,
      targetIds,
      startDate: localDateToApi(startDate, false),
      endDate: localDateToApi(endDate, true),
      maxDiscountAmount: discountType === 'PERCENTAGE' && maxDiscountAmount ? Number(cleanNumStr(maxDiscountAmount)) : null
    };

    try {
      if (isEdit && id) {
        await updateVoucherApi(id, { ...requestPayload, voucherId: id });
        toast.success('Thành công', 'Đã cập nhật thông tin mã giảm giá.');
      } else {
        await createVoucherApi(requestPayload);
        toast.success('Thành công', 'Đã tạo mã giảm giá mới.');
      }
      navigate('/vouchers');
    } catch (error: any) {
      console.error('Failed to save voucher', error);
      const errMsg = error.response?.data?.message || 'Có lỗi xảy ra khi lưu mã giảm giá.';
      toast.error('Lỗi', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  // Client Filter for Categories selection
  const filteredCategories = categories.filter(c =>
    c.name.toLowerCase().includes(catSearchTerm.toLowerCase())
  );

  // Client Filter for Books selection
  const filteredBooks = books.filter(b =>
    b.title.toLowerCase().includes(bookSearchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="pink-spinner-container" style={{ minHeight: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <div className="pink-spinner" />
        <span style={{ marginTop: '10px' }}>Đang tải thông tin chi tiết...</span>
      </div>
    );
  }

  return (
    <div className="voucher-form-view fade-in">
      <style>{`
        .form-container-custom {
          margin-top: 20px;
        }
        .required-star {
          color: #ef4444;
          margin-left: 4px;
        }
        .form-grid-custom {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 40px;
        }
        @media (max-width: 768px) {
          .form-grid-custom {
            grid-template-columns: 1fr;
            gap: 20px;
          }
        }
        .form-field-custom {
          display: flex;
          flex-direction: column;
          gap: 8px;
          margin-bottom: 20px;
        }
        .form-field-custom > label {
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }
        .form-field-custom input[type="text"],
        .form-field-custom input[type="number"],
        .form-field-custom input[type="datetime-local"],
        .form-field-custom textarea {
          background-color: #0d0d0f; /* Nền tối sâu thẳm, không dùng xám đen */
          border: 1px solid #2d2d30; /* Viền zinc tinh tế */
          border-radius: 8px; /* Có bo góc theo yêu cầu */
          padding: 11px 14px;
          color: #ffffff;
          font-size: 14px;
          font-family: inherit;
          outline: none;
          transition: var(--transition);
          box-sizing: border-box;
          width: 100%;
        }
        .form-field-custom input[type="datetime-local"] {
          color-scheme: dark;
        }
        .form-field-custom input:focus,
        .form-field-custom textarea:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }

        /* Custom Dropdown styling matching EditionForm.tsx exactly */
        .custom-dropdown-container {
          position: relative;
          width: 100%;
          user-select: none;
        }
        .custom-dropdown-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          padding: 11px 16px;
          color: var(--text-main);
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          min-height: 44px;
          box-sizing: border-box;
          transition: var(--transition);
        }
        .custom-dropdown-header:hover {
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
          border-radius: 8px;
          box-shadow: var(--shadow-lg);
          z-index: 1000;
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

        /* Override date & datetime picker default width */
        .custom-datepicker-container,
        .custom-datetimepicker-container {
          width: 100% !important;
        }

        /* Custom Toggle Switch */
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

        .blue-input-custom {
          color: #3182ce !important;
          font-weight: bold !important;
        }
        .green-input-custom {
          color: #38a169 !important;
          font-weight: bold !important;
        }
        .light-blue-input-custom {
          color: #4fd1c5 !important;
          font-weight: bold !important;
        }

        /* Selector Search Table */
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
          max-height: 250px;
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
        .item-name-cell {
          color: #48bb78 !important;
          font-weight: 500;
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

        /* HomePageBoxStats widgets matching Dashboard.tsx */
        .homepage-stats-row {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
          margin-top: 20px;
          margin-bottom: 28px;
        }
        @media (max-width: 768px) {
          .homepage-stats-row {
            flex-direction: column;
          }
        }
        .box-stat {
          flex: 1;
          min-width: 200px;
          min-height: 80px;
          background-color: var(--bg-secondary);
          padding: 12px;
          border-bottom: 2px solid;
          border-radius: 4px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          box-shadow: var(--shadow-sm);
          transition: var(--transition);
        }
        .box-stat:hover {
          box-shadow: var(--shadow-md);
        }
        .box-stat.green { border-bottom-color: #48BB78; }
        .box-stat.purple { border-bottom-color: #9F7AEA; }
        .box-stat.blue { border-bottom-color: #319795; }
        .box-stat.pink { border-bottom-color: var(--primary); }

        .box-stat-header {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
        }
        .stat-icon-box {
          font-size: 1.2rem;
          width: 36px;
          height: 36px;
          padding: 4px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .box-stat.green .stat-icon-box { background-color: rgba(72, 187, 120, 0.15); color: #48BB78; }
        .box-stat.purple .stat-icon-box { background-color: rgba(159, 122, 234, 0.15); color: #9F7AEA; }
        .box-stat.blue .stat-icon-box { background-color: rgba(49, 151, 149, 0.15); color: #319795; }
        .box-stat.pink .stat-icon-box { background-color: var(--primary-light); color: var(--primary); }

        .stat-number {
          font-size: 1.2rem;
          font-weight: 700;
          color: #ffffff;
        }
        .stat-name {
          margin-top: 6px;
          color: #e2e4e9;
          font-weight: 500;
          font-size: 0.85rem;
        }
      `}</style>

      {/* Back Button */}
      <Link to="/vouchers" className="btn-back-custom">
        <TbArrowLeft /> Quay lại danh sách
      </Link>

      <div className="view-header">
        <h1 className="view-title">{isEdit ? 'Chỉnh sửa mã giảm giá' : 'Tạo mã giảm giá mới'}</h1>
        <p className="view-subtitle">Cấu hình các điều kiện áp dụng, chiết khấu và đối tượng áp dụng.</p>
      </div>

      {isEdit && (
        <div className="homepage-stats-row">
          {/* Box 1: Lượt sử dụng (purple) */}
          <div className="box-stat purple">
            <div className="box-stat-header">
              <div className="stat-icon-box">
                <TbTicket />
              </div>
              <div className="stat-number">{usedCount} / {maxUses}</div>
            </div>
            <div className="stat-name">Số lượt đã sử dụng</div>
          </div>

          {/* Box 2: Tỷ lệ sử dụng (blue) */}
          <div className="box-stat blue">
            <div className="box-stat-header">
              <div className="stat-icon-box">
                <TbCoins />
              </div>
              <div className="stat-number">
                {Number(maxUses) > 0 ? `${Math.round((usedCount / Number(maxUses)) * 100)}%` : '0%'}
              </div>
            </div>
            <div className="stat-name">Tỷ lệ sử dụng thực tế</div>
          </div>

          {/* Box 3: Thời hạn áp dụng còn lại (green) */}
          <div className="box-stat green">
            <div className="box-stat-header">
              <div className="stat-icon-box">
                <TbCalendar />
              </div>
              <div className="stat-number">
                {getRemainingTime(startDate, endDate, usedCount, Number(maxUses))}
              </div>
            </div>
            <div className="stat-name">Thời hạn áp dụng còn lại</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="form-container-custom">
        <div className="form-grid-custom">
          {/* Cột trái: Thông tin cơ bản */}
          <div>
            <div className="form-field-custom">
              <label>
                Mã Voucher (viết liền, không dấu, tự động viết hoa)
                <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                className="light-blue-input-custom"
                value={code} 
                onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s/g, ''))} 
                required 
                placeholder="SALE20, SUMMER50,..." 
                disabled={isEdit} // Thường không nên cho sửa mã khi đã tạo
              />
            </div>

            <div className="form-field-custom">
              <label>
                Mô tả chiến dịch khuyến mãi
                <span className="required-star">*</span>
              </label>
              <textarea 
                value={description} 
                onChange={(e) => setDescription(e.target.value)} 
                required 
                rows={3} 
                placeholder="Ví dụ: Giảm 10% tối đa 50k cho đơn từ 200k..."
              />
            </div>

            <div className="form-field-custom">
              <label>
                Loại chiết khấu
                <span className="required-star">*</span>
              </label>
              <div className="custom-dropdown-container">
                <div 
                  className={`custom-dropdown-header ${isDiscountDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsDiscountDropdownOpen(!isDiscountDropdownOpen)}
                >
                  <span>{discountType === 'PERCENTAGE' ? 'Phần trăm (%)' : 'Số tiền cố định (VNĐ)'}</span>
                  <TbChevronDown className={`arrow-icon ${isDiscountDropdownOpen ? 'open' : ''}`} />
                </div>
                {isDiscountDropdownOpen && (
                  <div className="custom-dropdown-menu">
                    <div 
                      className={`custom-dropdown-item ${discountType === 'PERCENTAGE' ? 'selected' : ''}`}
                      onClick={() => { 
                        setDiscountType('PERCENTAGE'); 
                        setIsDiscountDropdownOpen(false); 
                        const clean = discountValue.replace(/\D/g, '');
                        if (Number(clean) > 100) {
                          setDiscountValue('');
                        } else {
                          setDiscountValue(clean);
                        }
                      }}
                    >
                      Phần trăm (%)
                    </div>
                    <div 
                      className={`custom-dropdown-item ${discountType === 'FIXED_AMOUNT' ? 'selected' : ''}`}
                      onClick={() => { 
                        setDiscountType('FIXED_AMOUNT'); 
                        setIsDiscountDropdownOpen(false); 
                        setDiscountValue(formatNumberWithDots(discountValue));
                      }}
                    >
                      Số tiền cố định (VNĐ)
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="form-field-custom">
              <label>
                Giá trị giảm giá
                <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                className="green-input-custom"
                value={discountValue} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (discountType === 'PERCENTAGE') {
                    const clean = val.replace(/\D/g, '');
                    if (clean === '' || (Number(clean) >= 0 && Number(clean) <= 100)) {
                      setDiscountValue(clean);
                    }
                  } else {
                    setDiscountValue(formatNumberWithDots(val));
                  }
                }} 
                required 
                placeholder={discountType === 'PERCENTAGE' ? 'Nhập phần trăm (1-100)' : 'Nhập số tiền giảm (VNĐ)'} 
              />
            </div>

            {discountType === 'PERCENTAGE' && (
              <div className="form-field-custom">
                <label>
                  Giá trị giảm giá tối đa (VNĐ)
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '6px', fontWeight: 'normal' }}>
                    (để trống nếu không giới hạn)
                  </span>
                </label>
                <input 
                  type="text" 
                  className="green-input-custom"
                  value={maxDiscountAmount} 
                  onChange={(e) => setMaxDiscountAmount(formatNumberWithDots(e.target.value))} 
                  placeholder="Ví dụ: 50.000" 
                />
              </div>
            )}

            <div className="form-field-custom">
              <label>
                Giá trị đơn hàng tối thiểu áp dụng (VNĐ)
                <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                value={minOrderValue} 
                onChange={(e) => setMinOrderValue(formatNumberWithDots(e.target.value))} 
                required 
                placeholder="Ví dụ: 150.000" 
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
              <div className="form-field-custom" style={{ marginBottom: 0 }}>
                <label>
                  Ngày bắt đầu có hiệu lực
                  <span className="required-star">*</span>
                </label>
                <CustomDateTimePicker
                  value={startDate}
                  onChange={setStartDate}
                  placeholder="Từ ngày..."
                />
              </div>

              <div className="form-field-custom" style={{ marginBottom: 0 }}>
                <label>
                  Ngày kết thúc thời hạn
                  <span className="required-star">*</span>
                </label>
                <CustomDateTimePicker
                  value={endDate}
                  onChange={setEndDate}
                  placeholder="Đến ngày..."
                />
              </div>
            </div>
          </div>

          {/* Cột phải: Ràng buộc giới hạn & Đối tượng áp dụng */}
          <div>
            <div className="form-field-custom">
              <label>
                Tổng số lượt sử dụng tối đa của mã
                <span className="required-star">*</span>
              </label>
              <input 
                type="number" 
                value={maxUses} 
                onChange={(e) => setMaxUses(e.target.value)} 
                required 
                min={1} 
                placeholder="Ví dụ: 100"
              />
            </div>

            <div className="form-field-custom">
              <label>
                Số lượt sử dụng tối đa cho mỗi khách hàng
                <span className="required-star">*</span>
              </label>
              <input 
                type="number" 
                value={maxUsesPerUser} 
                onChange={(e) => setMaxUsesPerUser(e.target.value)} 
                required 
                min={1} 
              />
            </div>

            <div className="form-field-custom">
              <label>
                Chi phí mua mã bằng xu
                <span className="required-star">*</span>
              </label>
              <input 
                type="text" 
                className="blue-input-custom"
                value={coinCost} 
                onChange={(e) => setCoinCost(formatNumberWithDots(e.target.value))} 
                required 
                placeholder="Nhập 0 nếu quy đổi miễn phí"
              />
            </div>

            <div className="form-field-custom" style={{ flexDirection: 'row', alignItems: 'center', gap: '12px', marginTop: '10px', marginBottom: '20px' }}>
              <div
                className={`switch-custom ${isActive ? 'active' : ''}`}
                onClick={() => setIsActive(!isActive)}
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
                  userSelect: 'none'
                }}
                onClick={() => setIsActive(!isActive)}
              >
                Kích hoạt cho phép sử dụng ngay lập tức
              </span>
            </div>

            <div className="form-field-custom">
              <label>
                Đối tượng được áp dụng mã
                <span className="required-star">*</span>
              </label>
              <div className="custom-dropdown-container">
                <div 
                  className={`custom-dropdown-header ${isTargetDropdownOpen ? 'open' : ''}`}
                  onClick={() => setIsTargetDropdownOpen(!isTargetDropdownOpen)}
                >
                  <span>
                    {targetType === 'ALL' ? 'Đơn hàng Tổng' : 
                     targetType === 'CATEGORY' ? 'Danh mục sản phẩm' : 
                     targetType === 'BOOK' ? 'Sách' : 'Phiên bản sách'}
                  </span>
                  <TbChevronDown className={`arrow-icon ${isTargetDropdownOpen ? 'open' : ''}`} />
                </div>
                {isTargetDropdownOpen && (
                  <div className="custom-dropdown-menu">
                    <div 
                      className={`custom-dropdown-item ${targetType === 'ALL' ? 'selected' : ''}`}
                      onClick={() => {
                        setTargetType('ALL');
                        setSelectedTargetIds([]);
                        setSelectedTargetNames([]);
                        setSelectedBookIdForEdition('');
                        setSelectedBookNameForEdition('');
                        setBookEditions([]);
                        setIsTargetDropdownOpen(false);
                      }}
                    >
                      Đơn hàng Tổng
                    </div>
                    <div 
                      className={`custom-dropdown-item ${targetType === 'CATEGORY' ? 'selected' : ''}`}
                      onClick={() => {
                        setTargetType('CATEGORY');
                        setSelectedTargetIds([]);
                        setSelectedTargetNames([]);
                        setSelectedBookIdForEdition('');
                        setSelectedBookNameForEdition('');
                        setBookEditions([]);
                        setIsTargetDropdownOpen(false);
                      }}
                    >
                      Danh mục sản phẩm
                    </div>
                    <div 
                      className={`custom-dropdown-item ${targetType === 'BOOK' ? 'selected' : ''}`}
                      onClick={() => {
                        setTargetType('BOOK');
                        setSelectedTargetIds([]);
                        setSelectedTargetNames([]);
                        setSelectedBookIdForEdition('');
                        setSelectedBookNameForEdition('');
                        setBookEditions([]);
                        setIsTargetDropdownOpen(false);
                      }}
                    >
                      Sách
                    </div>
                    <div 
                      className={`custom-dropdown-item ${targetType === 'EDITION' ? 'selected' : ''}`}
                      onClick={() => {
                        setTargetType('EDITION');
                        setSelectedTargetIds([]);
                        setSelectedTargetNames([]);
                        setSelectedBookIdForEdition('');
                        setSelectedBookNameForEdition('');
                        setBookEditions([]);
                        setIsTargetDropdownOpen(false);
                      }}
                    >
                      Phiên bản sách
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Target selection table matching specifications */}
            {targetType !== 'ALL' && (
              <div style={{ marginTop: '10px', padding: '16px', backgroundColor: '#0d0d0f', border: '1px solid #2d2d30', borderRadius: '8px' }}>
                {/* CATEGORY SELECT TABLE */}
                {targetType === 'CATEGORY' && (
                  <div>
                    <div className="search-select-wrap-custom">
                      <input
                        type="text"
                        className="search-select-input-custom"
                        placeholder="Tìm kiếm danh mục..."
                        value={catSearchTerm}
                        onChange={(e) => setCatSearchTerm(e.target.value)}
                      />
                      <button className="search-select-btn-custom" type="button"><TbSearch /></button>
                    </div>
                    <div className="table-select-container-custom">
                      <table className="table-select-custom">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>Chọn</th>
                            <th>Tên danh mục</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredCategories.map(cat => {
                            const isSel = selectedTargetIds.includes(cat.id);
                            return (
                              <tr 
                                key={cat.id} 
                                className={isSel ? 'selected' : ''} 
                                onClick={() => {
                                  handleToggleTarget(cat.id, cat.name);
                                }}
                              >
                                <td>
                                  <div className={`circle-checkbox-custom ${isSel ? 'selected' : ''}`} />
                                </td>
                                <td className="item-name-cell">{cat.name}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* BOOK SELECT TABLE */}
                {targetType === 'BOOK' && (
                  <div>
                    <div className="search-select-wrap-custom">
                      <input
                        type="text"
                        className="search-select-input-custom"
                        placeholder="Tìm kiếm tựa sách..."
                        value={bookSearchTerm}
                        onChange={(e) => setBookSearchTerm(e.target.value)}
                      />
                      <button className="search-select-btn-custom" type="button"><TbSearch /></button>
                    </div>
                    <div className="table-select-container-custom">
                      <table className="table-select-custom">
                        <thead>
                          <tr>
                            <th style={{ width: '40px' }}>Chọn</th>
                            <th>Tên sách</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredBooks.map(bk => {
                            const isSel = selectedTargetIds.includes(bk.id);
                            return (
                              <tr 
                                key={bk.id} 
                                className={isSel ? 'selected' : ''} 
                                onClick={() => {
                                  handleToggleTarget(bk.id, bk.title);
                                }}
                              >
                                <td>
                                  <div className={`circle-checkbox-custom ${isSel ? 'selected' : ''}`} />
                                </td>
                                <td className="item-name-cell">{bk.title}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* EDITION SELECT TABLE */}
                {targetType === 'EDITION' && (
                  <div>
                    {!selectedBookIdForEdition ? (
                      <div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginBottom: '6px' }}>Bước 1: Tìm kiếm & chọn sách chứa phiên bản</div>
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
                              setSelectedTargetIds([]);
                              setSelectedTargetNames([]);
                            }}
                          >
                            Chọn sách khác
                          </button>
                        </div>
                        <div className="table-select-container-custom">
                          {loadingEditions ? (
                            <div className="pink-spinner-container">
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
                                </tr>
                              </thead>
                              <tbody>
                                {bookEditions.map(ed => {
                                  const isSel = selectedTargetIds.includes(ed.id);
                                  const edName = `${selectedBookNameForEdition} - PB ${ed.editionNumber} (ISBN: ${ed.isbn})`;
                                  return (
                                    <tr 
                                      key={ed.id} 
                                      className={isSel ? 'selected' : ''} 
                                      onClick={() => {
                                        handleToggleTarget(ed.id, edName);
                                      }}
                                    >
                                      <td>
                                        <div className={`circle-checkbox-custom ${isSel ? 'selected' : ''}`} />
                                      </td>
                                      <td>{ed.isbn}</td>
                                      <td>{ed.editionNumber}</td>
                                      <td>{ed.coverType}</td>
                                    </tr>
                                  );
                                })}
                                {bookEditions.length === 0 && (
                                  <tr>
                                    <td colSpan={4} style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)' }}>
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
                )}
              </div>
            )}
          </div>
        </div>

        {/* Save Row */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '30px', borderTop: '1px solid var(--border)', paddingTop: '20px' }}>
          <button 
            type="submit" 
            className="btn-primary" 
            disabled={submitting} 
            style={{ height: '44px', padding: '0 28px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}
          >
            {submitting ? (
              <>
                <TbLoader className="animate-spin" /> Lưu dữ liệu...
              </>
            ) : (
              <>
                <TbDeviceFloppy /> {isEdit ? 'Lưu thay đổi' : 'Tạo voucher'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default VoucherForm;
