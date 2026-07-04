import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbPlus, TbSearch, TbBan, TbCheck } from 'react-icons/tb';
import { toast } from '../utils/toast';

export const Posts: React.FC = () => {
  const { posts, addPost, updatePostStatus } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Form Fields
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [status, setStatus] = useState<'PUBLISHED' | 'DRAFT'>('PUBLISHED');

  const filteredPosts = posts.filter(p => {
    return p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
           p.author.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !author.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    addPost({
      title: title.trim(),
      author: author.trim(),
      status: status
    });

    setIsFormOpen(false);
    setTitle('');
    setAuthor('');
    setStatus('PUBLISHED');
    toast.success('Thành công', 'Đã tạo bài viết mới.');
  };

  return (
    <div className="posts-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Bài viết & Tin tức</h1>
          <p className="view-subtitle">Soạn thảo bài viết, hướng dẫn đọc sách và tin tức giới thiệu sách mới.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <TbPlus /> Viết bài mới
        </button>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm bài viết theo tiêu đề hoặc người viết..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Mã bài</th>
              <th>Tiêu đề</th>
              <th>Người viết</th>
              <th>Ngày tạo</th>
              <th>Trạng thái</th>
              <th>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length > 0 ? (
              filteredPosts.map(p => (
                <tr key={p.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{p.id}</td>
                  <td style={{ fontWeight: '600', color: '#ffffff', textAlign: 'left' }}>{p.title}</td>
                  <td>{p.author}</td>
                  <td>{p.date}</td>
                  <td>
                    <span className={`badge ${p.status === 'PUBLISHED' ? 'completed' : 'pending'}`}>
                      {p.status === 'PUBLISHED' ? 'Đã xuất bản' : 'Bản nháp'}
                    </span>
                  </td>
                  <td>
                    {p.status === 'PUBLISHED' ? (
                      <button 
                        className="action-btn-status draft-btn" 
                        onClick={() => updatePostStatus(p.id, 'DRAFT')}
                        title="Chuyển thành bản nháp"
                      >
                        <TbBan /> Gỡ bài
                      </button>
                    ) : (
                      <button 
                        className="action-btn-status publish-btn" 
                        onClick={() => updatePostStatus(p.id, 'PUBLISHED')}
                        title="Xuất bản bài viết"
                      >
                        <TbCheck /> Xuất bản
                      </button>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  Không tìm thấy bài viết nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Post Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h2>Tạo bài viết mới</h2>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-field">
                <label>Tiêu đề bài viết *</label>
                <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required placeholder="Nhập tiêu đề hấp dẫn..." />
              </div>

              <div className="form-field">
                <label>Tác giả bài viết *</label>
                <input type="text" value={author} onChange={(e) => setAuthor(e.target.value)} required placeholder="Họ tên người viết..." />
              </div>

              <div className="form-field">
                <label>Trạng thái xuất bản</label>
                <select value={status} onChange={(e) => setStatus(e.target.value as any)}>
                  <option value="PUBLISHED">Công khai (Xuất bản)</option>
                  <option value="DRAFT">Lưu bản nháp</option>
                </select>
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo bài</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style>{`
        .action-btn-status {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          font-size: 12.5px;
          font-weight: 600;
          border: 1px solid var(--border);
          background-color: var(--bg-hover);
        }

        .action-btn-status.draft-btn {
          color: var(--accent-orange);
        }

        .action-btn-status.draft-btn:hover {
          background-color: rgba(245, 158, 11, 0.1);
          border-color: var(--accent-orange);
        }

        .action-btn-status.publish-btn {
          color: var(--accent-green);
        }

        .action-btn-status.publish-btn:hover {
          background-color: rgba(16, 185, 129, 0.1);
          border-color: var(--accent-green);
        }
      `}</style>
    </div>
  );
};
export default Posts;
