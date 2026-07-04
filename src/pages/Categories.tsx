import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbPlus, TbSearch, TbTrash } from 'react-icons/tb';
import { toast } from '../utils/toast';

export const Categories: React.FC = () => {
  const { products } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Custom mock categories list to allow add category simulation
  const [mockCategories, setMockCategories] = useState([
    { id: "CAT-01", name: "Phát triển bản thân", description: "Sách kỹ năng cuộc sống, định hình tư duy và phát triển bản thân." },
    { id: "CAT-02", name: "Văn học & Tiểu thuyết", description: "Các tác phẩm truyện dài, tiểu thuyết đặc sắc trong và ngoài nước." },
    { id: "CAT-03", name: "Lịch sử & Khoa học", description: "Tài liệu lược sử, phát minh khoa học và tri thức nhân loại." },
    { id: "CAT-04", name: "Văn học cổ điển", description: "Các tác phẩm văn học kinh điển vượt thời gian." },
    { id: "CAT-05", name: "Tâm lý học", description: "Nghiên cứu hành vi con người và tư duy nhận thức." }
  ]);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatDesc, setNewCatDesc] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.warning('Thiếu thông tin', 'Vui lòng nhập tên danh mục.');
      return;
    }

    const newId = `CAT-0${mockCategories.length + 1}`;
    setMockCategories([
      ...mockCategories,
      { id: newId, name: newCatName.trim(), description: newCatDesc.trim() }
    ]);

    setIsFormOpen(false);
    setNewCatName('');
    setNewCatDesc('');
    toast.success('Thành công', 'Đã thêm danh mục mới vào hệ thống.');
  };

  const deleteCategory = (id: string) => {
    setMockCategories(mockCategories.filter(c => c.id !== id));
    toast.info('Đã xóa', 'Danh mục đã bị gỡ bỏ.');
  };

  // Get book count per category
  const getBookCount = (catName: string) => {
    return products.filter(p => p.category === catName).length;
  };

  const filteredCategories = mockCategories.filter(c => {
    return c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           c.description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="categories-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Danh mục Sách</h1>
          <p className="view-subtitle">Phân loại sách phục vụ việc tìm kiếm và lọc sách trên cửa hàng.</p>
        </div>
        <button className="btn-primary" onClick={() => setIsFormOpen(true)}>
          <TbPlus /> Tạo danh mục mới
        </button>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm danh mục theo tên hoặc mô tả..." 
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
              <th>ID</th>
              <th>Tên Danh Mục</th>
              <th>Mô Tả Danh Mục</th>
              <th>Số Lượng Sách Hiện Có</th>
              <th>Hành Động</th>
            </tr>
          </thead>
          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map(c => (
                <tr key={c.id}>
                  <td style={{ fontWeight: '700', color: 'var(--text-muted)' }}>{c.id}</td>
                  <td style={{ fontWeight: '700', color: '#ffffff' }}>{c.name}</td>
                  <td style={{ textAlign: 'left', maxWidth: '360px' }}>{c.description}</td>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    {getBookCount(c.name)} cuốn sách
                  </td>
                  <td>
                    <button 
                      className="action-btn delete" 
                      onClick={() => { if (confirm('Xóa danh mục này?')) deleteCategory(c.id); }} 
                      title="Xóa danh mục"
                      style={{ padding: '6px', fontSize: '16px', display: 'inline-flex', alignItems: 'center' }}
                    >
                      <TbTrash />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: 'var(--text-light)', padding: '24px' }}>
                  Không tìm thấy danh mục nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add Category Modal */}
      {isFormOpen && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '440px' }}>
            <div className="modal-header">
              <h2>Tạo danh mục sách mới</h2>
              <button className="modal-close-btn" onClick={() => setIsFormOpen(false)}>&times;</button>
            </div>

            <form onSubmit={handleFormSubmit} className="modal-form">
              <div className="form-field">
                <label>Tên Danh mục *</label>
                <input type="text" value={newCatName} onChange={(e) => setNewCatName(e.target.value)} required placeholder="Ví dụ: Khoa học viễn tưởng, Kinh tế..." />
              </div>

              <div className="form-field">
                <label>Mô tả chi tiết</label>
                <textarea rows={3} value={newCatDesc} onChange={(e) => setNewCatDesc(e.target.value)} placeholder="Mô tả tóm tắt nội dung danh mục sách này..." />
              </div>

              <div className="modal-actions-row">
                <button type="button" className="btn-secondary" onClick={() => setIsFormOpen(false)}>Hủy</button>
                <button type="submit" className="btn-primary">Tạo mới</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
export default Categories;
