import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { TbArrowLeft, TbDeviceFloppy, TbBookUpload, TbLoader2, TbTrash } from 'react-icons/tb';
import { getAuthorDetailApi, createAuthorApi, updateAuthorApi, deleteAuthorApi } from '../api/books';
import { toast } from '../utils/toast';

export const AuthorForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [isDeletingModalOpen, setIsDeletingModalOpen] = useState(false);

  const [name, setName] = useState('');
  const [biography, setBiography] = useState('');
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreviewUrl, setAvatarPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    const loadAuthorDetail = async () => {
      if (!isEdit || !id) return;
      setLoading(true);
      try {
        const res = await getAuthorDetailApi(id);
        if (res.data && res.data.success) {
          const author = res.data.data;
          setName(author.name || '');
          setBiography(author.biography || '');
          setAvatarPreviewUrl(author.avatarUrl || null);
        }
      } catch (error) {
        console.error('Error loading author details:', error);
        toast.error('Lỗi tải dữ liệu', 'Không thể lấy thông tin tác giả.');
      } finally {
        setLoading(false);
      }
    };
    loadAuthorDetail();
  }, [id, isEdit]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setAvatarFile(file);
      setAvatarPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Thiếu thông tin', 'Vui lòng nhập tên tác giả.');
      return;
    }
    try {
      setSubmitting(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      if (biography) formData.append('biography', biography.trim());
      if (avatarFile) formData.append('avatarFile', avatarFile);

      if (isEdit && id) {
        await updateAuthorApi(id, formData);
        toast.success('Cập nhật thành công', `Đã cập nhật thông tin tác giả "${name}".`);
        setAvatarFile(null);
      } else {
        await createAuthorApi(formData);
        toast.success('Thêm thành công', `Đã thêm tác giả "${name}" vào hệ thống.`);
        navigate('/authors');
      }
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi xử lý', error.response?.data?.message || 'Không thể lưu thông tin tác giả.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!isEdit || !id) return;
    try {
      setSubmitting(true);
      await deleteAuthorApi(id);
      toast.success('Xóa thành công', `Tác giả "${name}" đã được xóa.`);
      navigate('/authors');
    } catch (error: any) {
      console.error(error);
      toast.error('Lỗi khi xóa', error.response?.data?.message || 'Không thể xóa tác giả này.');
    } finally {
      setSubmitting(false);
      setIsDeletingModalOpen(false);
    }
  };

  if (loading) {
    return (
      <div className="pink-spinner-container" style={{ minHeight: '300px' }}>
        <div className="pink-spinner"></div>
        <span>Đang tải thông tin tác giả...</span>
      </div>
    );
  }

  return (
    <div className="author-form-view fade-in">
      <style>{`
        .form-card-custom {
          margin-top: 20px;
        }
        .form-field-custom {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-bottom: 20px;
        }
        .form-field-custom > label {
          font-size: 14px;
          font-weight: 600;
          color: #F687B3;
        }
        .required-star {
          color: #ef4444;
          margin-left: 4px;
        }
        .form-field-custom input[type="text"],
        .form-field-custom textarea {
          background-color: #0d0d0f;
          border: 1px solid #2d2d30;
          border-radius: 8px;
          padding: 11px 14px;
          color: #ffffff;
          font-size: 14px;
          font-family: var(--font);
          outline: none;
          transition: var(--transition);
          width: 100%;
          box-sizing: border-box;
        }
        .form-field-custom input:focus,
        .form-field-custom textarea:focus {
          border-color: #4a4a4f !important;
          box-shadow: none !important;
          color: #ffffff !important;
        }
        /* Upload button — no hover effect */
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
          width: fit-content;
        }
        /* Preview: 400×400 no border-radius */
        .avatar-preview-wrap {
          display: inline-block;
          position: relative;
        }
        .avatar-preview-box {
          width: 400px;
          height: 400px;
          border-radius: 0;
          overflow: hidden;
          border: 1px solid #2d2d30;
          box-shadow: 0 4px 12px rgba(0,0,0,0.5);
        }
        .avatar-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
          display: block;
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
        .btn-back-custom:hover { color: #F687B3 !important; }
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
        .btn-add-custom:hover:not(:disabled) { background-color: var(--primary-hover); }
        .btn-add-custom:disabled { opacity: 0.6; cursor: not-allowed; }
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
        .btn-delete-custom:disabled { opacity: 0.5; cursor: not-allowed; }
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
        <Link to="/authors" className="btn-back-custom">
          <TbArrowLeft /> Quay lại danh sách tác giả
        </Link>
        <h1 className="view-title" style={{ fontSize: '28px', marginTop: '4px' }}>
          {isEdit ? 'Chỉnh sửa tác giả' : 'Thêm tác giả mới'}
        </h1>
        <p className="view-subtitle" style={{ margin: 0 }}>
          {isEdit ? 'Cập nhật lại thông tin cá nhân của tác giả.' : 'Nhập thông tin để tạo mới tác giả.'}
        </p>
      </div>

      {/* Form card — full width, no max-width */}
      <form onSubmit={handleSubmit} className="form-card-custom">

        <div className="form-field-custom">
          <label>
            Tên tác giả
            <span className="required-star">*</span>
          </label>
          <input
            type="text"
            placeholder="Nhập tên đầy đủ của tác giả..."
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-field-custom">
          <label>Tiểu sử tác giả</label>
          <textarea
            placeholder="Mô tả tiểu sử, sự nghiệp, các giải thưởng..."
            rows={6}
            value={biography}
            onChange={(e) => setBiography(e.target.value)}
          />
        </div>

        <div className="form-field-custom">
          <label>Ảnh đại diện tác giả</label>
          <div style={{ marginTop: '4px' }}>
            <input
              id="avatar-file-input"
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />
            <div style={{ marginBottom: '12px' }}>
              <label htmlFor="avatar-file-input" className="btn-upload-custom">
                <TbBookUpload style={{ fontSize: '18px' }} /> Chọn File
              </label>
            </div>

            <div className="avatar-preview-wrap">
              <div className="avatar-preview-box">
                <img 
                  src={avatarPreviewUrl || 'https://placehold.co/400x400'} 
                  alt="Avatar Preview" 
                  className="avatar-preview-img" 
                />
              </div>
            </div>
          </div>
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
              <TbTrash style={{ fontSize: '16px' }} /> Xóa tác giả
            </button>
          )}
          <button type="submit" className="btn-add-custom" disabled={submitting}>
            {submitting
              ? <TbLoader2 className="animate-spin-custom" style={{ fontSize: '16px' }} />
              : <TbDeviceFloppy style={{ fontSize: '18px' }} />
            }
            {submitting ? 'Đang lưu...' : 'Lưu thông tin'}
          </button>
        </div>
      </form>

      {/* Delete Confirmation Modal */}
      {isDeletingModalOpen && (
        <div className="modal-overlay-custom">
          <div className="modal-card-custom">
            <div className="modal-header-custom" style={{ borderBottom: 'none', paddingBottom: '0px' }}>
              <h2 style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ef4444' }}>
                <TbTrash /> Xác nhận xóa tác giả
              </h2>
              <button className="modal-close-btn-custom" onClick={() => setIsDeletingModalOpen(false)}>&times;</button>
            </div>
            <div style={{ padding: '16px 24px', color: 'var(--text-main)', fontSize: '14px' }}>
              Bạn có chắc chắn muốn xóa tác giả <strong style={{ color: '#4fd1c5' }}>"{name}"</strong> không? Hành động này không thể hoàn tác.
            </div>
            <div style={{ display: 'flex', gap: '10px', padding: '16px 24px', justifyContent: 'flex-end', borderTop: '1px solid var(--border)', marginTop: '8px' }}>
              <button className="btn-cancel-custom" onClick={() => setIsDeletingModalOpen(false)}>
                Hủy bỏ
              </button>
              <button className="btn-delete-confirm-custom" onClick={handleDelete} disabled={submitting}>
                {submitting ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
export default AuthorForm;
