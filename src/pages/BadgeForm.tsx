import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TbArrowLeft, TbDeviceFloppy, TbTrash, TbLoader } from 'react-icons/tb';
import { getBadgeDetailApi, createBadgeApi, updateBadgeApi, deleteBadgeApi } from '../api/books';
import { toast } from '../utils/toast';

export const BadgeForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Form states
  const [text, setText] = useState('');
  const [textColor, setTextColor] = useState('#FFFFFF');
  const [bgColor, setBgColor] = useState('#DA447D');
  const [shape, setShape] = useState('pill');

  useEffect(() => {
    const loadBadgeDetail = async () => {
      if (!isEdit || !id) return;
      setLoading(true);
      try {
        const res = await getBadgeDetailApi(id);
        if (res.data && res.data.success) {
          const badge = res.data.data;
          setText(badge.text || '');
          setTextColor(badge.textColor || '#FFFFFF');
          setBgColor(badge.bgColor || '#DA447D');
          setShape(badge.shape || 'pill');
        }
      } catch (error) {
        console.error('Error loading badge details:', error);
        toast.error('Lỗi tải dữ liệu', 'Không thể lấy thông tin nhãn dán.');
      } finally {
        setLoading(false);
      }
    };

    loadBadgeDetail();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập nội dung nhãn dán.');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        text: text.trim(),
        textColor: textColor.trim(),
        bgColor: bgColor.trim(),
        shape: shape
      };

      if (isEdit && id) {
        await updateBadgeApi(id, data);
        toast.success('Cập nhật thành công', `Đã cập nhật nhãn dán "${text}".`);
      } else {
        await createBadgeApi(data);
        toast.success('Thêm thành công', `Đã thêm nhãn dán "${text}" vào hệ thống.`);
      }
      navigate('/badges');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi xử lý', error.response?.data?.message || 'Không thể lưu nhãn dán.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhãn dán "${text}" không?`)) return;

    try {
      setSubmitting(true);
      await deleteBadgeApi(id);
      toast.success('Xóa thành công', `Nhãn dán "${text}" đã được xóa.`);
      navigate('/badges');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa nhãn dán này.');
    } finally {
      setSubmitting(false);
    }
  };

  const getShapePreviewStyle = (shapeType: string) => {
    switch (shapeType) {
      case 'pill': return { borderRadius: '20px' };
      case 'rectangle': return { borderRadius: '4px' };
      case 'circle': return { borderRadius: '50%', width: '60px', height: '60px', justifyContent: 'center' };
      default: return { borderRadius: '20px' };
    }
  };

  if (loading) {
    return (
      <div className="pink-spinner-container" style={{ minHeight: '300px' }}>
        <div className="pink-spinner"></div>
        <span>Đang tải thông tin nhãn dán...</span>
      </div>
    );
  }

  return (
    <div className="badge-form-view fade-in">
      <style>{`
        .form-card-custom {
          margin-top: 20px;
          max-width: 600px;
        }
        .form-field-custom {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }
        .form-field-custom label {
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }
        .form-field-custom input[type="text"] {
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--text-main);
          font-size: 14px;
          transition: var(--transition);
          outline: none;
          width: 100%;
        }
        .form-field-custom input[type="text"]:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
          color: #ffffff !important;
        }
        .form-field-custom select {
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          padding: 10px 14px;
          color: var(--text-main);
          font-size: 14px;
          transition: var(--transition);
          outline: none;
          width: 100%;
          cursor: pointer;
        }
        .form-field-custom select:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
        }
        .color-inputs-group {
          display: flex;
          gap: 16px;
        }
        .color-picker-custom {
          width: 42px;
          height: 42px;
          border: 1px solid #2d2d30;
          padding: 0;
          background: none;
          cursor: pointer;
          border-radius: 8px;
          overflow: hidden;
          flex-shrink: 0;
        }
        .preview-panel-custom {
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 80px;
          margin-top: 8px;
        }
        .badge-preview-pill {
          display: inline-flex;
          align-items: center;
          padding: 8px 18px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: 700;
          box-shadow: 0 4px 10px rgba(0,0,0,0.3);
          letter-spacing: 0.5px;
          transition: all 0.2s ease;
        }
        .required-star {
          color: #ef4444;
          margin-left: 4px;
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
        .btn-add-custom:hover:not(:disabled) {
          background-color: var(--primary-hover);
        }
        .btn-add-custom:disabled {
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
          gap: 6px;
        }
        .btn-delete-custom:hover:not(:disabled) {
          color: #ef4444 !important;
          border-color: #ef4444 !important;
          background-color: rgba(239, 68, 68, 0.05) !important;
        }
        .btn-delete-custom:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .form-action-bar {
          display: flex;
          justify-content: flex-end;
          gap: 12px;
          padding: 18px 0;
          margin-top: 24px;
          border-top: 1px solid var(--border);
        }
        .animate-spin-custom {
          animation: spin-key 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin-key {
          to { transform: rotate(360deg); }
        }
        .shape-option-group {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
        }
        .shape-option-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 14px;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          background-color: #0d0d0f;
          color: var(--text-light);
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .shape-option-btn:hover {
          border-color: #4a4a4f;
          color: #fff;
        }
        .shape-option-btn.active {
          border-color: #F687B3;
          color: #F687B3;
          background-color: rgba(218, 68, 125, 0.08);
        }
        .shape-mini-preview {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          width: 24px;
          height: 24px;
          background-color: #F687B3;
          flex-shrink: 0;
        }
      `}</style>

      {/* Header bar */}
      <div>
        <Link to="/badges" className="btn-back-custom">
          <TbArrowLeft /> Quay lại danh sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '4px' }}>
          {isEdit ? 'Chỉnh sửa nhãn dán' : 'Thêm nhãn dán mới'}
        </h1>
        <p className="view-subtitle" style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật lại nội dung, màu sắc và hình dạng hiển thị của nhãn dán.' : 'Tạo mới một nhãn dán sách.'}
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="form-card-custom">
        <div className="form-field-custom">
          <label>
            Nội dung nhãn dán
            <span className="required-star">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: Bán chạy, Mới nhất, Giảm giá 20%..."
            maxLength={50}
            value={text}
            onChange={(e) => setText(e.target.value)}
            required
          />
        </div>

        <div className="form-field-custom">
          <label>Hình dạng</label>
          <div className="shape-option-group">
            <button
              type="button"
              className={`shape-option-btn ${shape === 'pill' ? 'active' : ''}`}
              onClick={() => setShape('pill')}
            >
              <span className="shape-mini-preview" style={{ borderRadius: '10px' }} />
              Viên thuốc
            </button>
            <button
              type="button"
              className={`shape-option-btn ${shape === 'rectangle' ? 'active' : ''}`}
              onClick={() => setShape('rectangle')}
            >
              <span className="shape-mini-preview" style={{ borderRadius: '3px' }} />
              Chữ nhật
            </button>
            <button
              type="button"
              className={`shape-option-btn ${shape === 'circle' ? 'active' : ''}`}
              onClick={() => setShape('circle')}
            >
              <span className="shape-mini-preview" style={{ borderRadius: '50%' }} />
              Tròn
            </button>
          </div>
        </div>

        <div className="color-inputs-group">
          <div className="form-field-custom" style={{ flex: 1 }}>
            <label>Màu chữ</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                className="color-picker-custom"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
              />
              <input
                type="text"
                value={textColor}
                onChange={(e) => setTextColor(e.target.value)}
                maxLength={7}
              />
            </div>
          </div>

          <div className="form-field-custom" style={{ flex: 1 }}>
            <label>Màu nền</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="color"
                className="color-picker-custom"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
              />
              <input
                type="text"
                value={bgColor}
                onChange={(e) => setBgColor(e.target.value)}
                maxLength={7}
              />
            </div>
          </div>
        </div>

        <div className="form-field-custom">
          <label>Xem trước hiển thị</label>
          <div className="preview-panel-custom">
            <span
              className="badge-preview-pill"
              style={{
                backgroundColor: bgColor,
                color: textColor,
                ...getShapePreviewStyle(shape)
              }}
            >
              {text.trim() || 'Xem trước nhãn dán'}
            </span>
          </div>
        </div>

        {/* Action bar */}
        <div className="form-action-bar">
          {isEdit && (
            <button
              type="button"
              className="btn-delete-custom"
              disabled={submitting}
              onClick={handleDelete}
            >
              <TbTrash style={{ fontSize: '16px' }} /> Xóa nhãn dán
            </button>
          )}
          <button type="submit" className="btn-add-custom" disabled={submitting}>
            {submitting ? (
              <TbLoader className="animate-spin-custom" style={{ fontSize: '16px' }} />
            ) : (
              <TbDeviceFloppy style={{ fontSize: '18px' }} />
            )}
            {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>
    </div>
  );
};
export default BadgeForm;