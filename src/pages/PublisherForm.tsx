import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { TbArrowLeft, TbDeviceFloppy, TbTrash, TbLoader2 } from 'react-icons/tb';
import { getPublisherDetailApi, createPublisherApi, updatePublisherApi, deletePublisherApi } from '../api/books';
import { toast } from '../utils/toast';

export const PublisherForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    const loadPublisherDetail = async () => {
      if (!isEdit || !id) return;
      setLoading(true);
      try {
        const res = await getPublisherDetailApi(id);
        if (res.data && res.data.success) {
          const pub = res.data.data;
          setName(pub.name || '');
          setAddress(pub.address || '');
        }
      } catch (error) {
        console.error('Error loading publisher details:', error);
        toast.error('Lỗi tải dữ liệu', 'Không thể lấy thông tin nhà xuất bản.');
      } finally {
        setLoading(false);
      }
    };

    loadPublisherDetail();
  }, [id, isEdit]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập tên nhà xuất bản.');
      return;
    }

    try {
      setSubmitting(true);
      const data = {
        name: name.trim(),
        address: address.trim() || undefined
      };

      if (isEdit && id) {
        await updatePublisherApi(id, data);
        toast.success('Cập nhật thành công', `Đã cập nhật nhà xuất bản "${name}".`);
      } else {
        await createPublisherApi(data);
        toast.success('Thêm thành công', `Đã thêm nhà xuất bản "${name}" vào hệ thống.`);
      }
      navigate('/publishers');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi xử lý', error.response?.data?.message || 'Không thể lưu nhà xuất bản.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    if (!window.confirm(`Bạn có chắc chắn muốn xóa nhà xuất bản "${name}" không?`)) return;

    try {
      setSubmitting(true);
      await deletePublisherApi(id);
      toast.success('Xóa thành công', `Nhà xuất bản "${name}" đã được xóa.`);
      navigate('/publishers');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa nhà xuất bản này.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="pink-spinner-container" style={{ minHeight: '300px' }}>
        <div className="pink-spinner"></div>
        <span>Đang tải thông tin nhà xuất bản...</span>
      </div>
    );
  }

  return (
    <div className="publisher-form-view fade-in">
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
        .form-field-custom input[type="text"],
        .form-field-custom textarea {
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
        .form-field-custom input[type="text"]:focus,
        .form-field-custom textarea:focus {
          border-color: #4a4a4f;
          box-shadow: none;
          color: #ffffff;
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
          margin-top: 8px;
          border-top: 1px solid var(--border);
        }
        /* Modal */
        .modal-overlay-custom {
          position: fixed;
          inset: 0;
          background: rgba(0,0,0,0.65);
          backdrop-filter: blur(4px);
          z-index: 9999;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .modal-card-custom {
          background-color: #161616;
          border: 1px solid #2d2d30;
          border-radius: 12px;
          width: 90%;
          max-width: 440px;
          box-shadow: 0 20px 60px rgba(0,0,0,0.5);
          animation: modalSlideIn 0.2s ease;
        }
        @keyframes modalSlideIn {
          from { transform: translateY(-16px); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }
        .modal-header-custom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 20px 24px 12px;
        }
        .modal-header-custom h2 {
          font-size: 17px;
          font-weight: 700;
          margin: 0;
        }
        .modal-close-btn-custom {
          background: none;
          border: none;
          color: var(--text-muted);
          font-size: 22px;
          cursor: pointer;
          line-height: 1;
          padding: 0 4px;
          transition: var(--transition);
        }
        .modal-close-btn-custom:hover { color: #fff; }
        .btn-cancel-custom {
          background-color: #27272a;
          color: #ffffff;
          border: 1px solid #3f3f46;
          border-radius: 0;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-cancel-custom:hover { background-color: #3f3f46; }
        .btn-delete-confirm-custom {
          background-color: #ef4444;
          color: #ffffff;
          border: none;
          border-radius: 0;
          padding: 8px 16px;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          transition: var(--transition);
        }
        .btn-delete-confirm-custom:hover { background-color: #dc2626; }
        .animate-spin-custom {
          animation: spin-custom 0.8s linear infinite;
          display: inline-block;
        }
        @keyframes spin-custom { to { transform: rotate(360deg); } }
      `}</style>

      {/* Header bar */}
      <div>
        <Link to="/publishers" className="btn-back-custom">
          <TbArrowLeft /> Quay lại danh sách
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '4px' }}>
          {isEdit ? 'Chỉnh sửa nhà xuất bản' : 'Thêm nhà xuất bản mới'}
        </h1>
        <p className="view-subtitle" style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật lại thông tin của nhà xuất bản.' : 'Nhập thông tin để tạo mới nhà xuất bản.'}
        </p>
      </div>

      {/* Form card */}
      <form onSubmit={handleSubmit} className="form-card-custom">
        <div className="form-field-custom">
          <label>
            Tên nhà xuất bản
            <span className="required-star">*</span>
          </label>
          <input
            type="text"
            placeholder="Ví dụ: NXB Trẻ, NXB Kim Đồng..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-field-custom">
          <label>Địa chỉ</label>
          <textarea
            placeholder="Địa chỉ trụ sở của nhà xuất bản..."
            rows={4}
            value={address}
            onChange={(e) => setAddress(e.target.value)}
          />
        </div>

        {/* Action bar */}
        <div className="form-action-bar">
          {isEdit && (
            <button
              type="button"
              className="btn-delete-custom"
              disabled={submitting}
              onClick={() => setIsDeletingModalOpen(true)}
            >
              <TbTrash style={{ fontSize: '16px' }} /> Xóa nhà xuất bản
            </button>
          )}
          <button type="submit" className="btn-add-custom" disabled={submitting}>
            {submitting ? (
              <TbLoader2 className="animate-spin-custom" style={{ fontSize: '16px' }} />
            ) : (
              <TbDeviceFloppy style={{ fontSize: '18px' }} />
            )}
            {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeletingModalOpen && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom">
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2>Xác nhận xóa</h2>
              <button className="modal-close-btn-custom" onClick={() => setIsDeletingModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px 24px' }}>
              <p style={{ margin: '0 0 24px', fontSize: '14.5px', color: 'var(--text-light)', lineHeight: '1.6' }}>
                Bạn có chắc chắn muốn xóa nhà xuất bản <strong>{name}</strong> không? Hành động này không thể hoàn tác.
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                <button className="btn-cancel-custom" onClick={() => setIsDeletingModalOpen(false)}>Hủy</button>
                <button className="btn-delete-confirm-custom" onClick={handleDelete} disabled={submitting}>
                  {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default PublisherForm;
