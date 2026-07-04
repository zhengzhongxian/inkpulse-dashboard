import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getBadgesApi } from '../api/books';
import { TbBookmarkPlus } from 'react-icons/tb';
import { toast } from '../utils/toast';

interface Badge {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
  shape?: string;
}

export const Badges: React.FC = () => {
  const navigate = useNavigate();
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(false);

  const loadBadges = async () => {
    setLoading(true);
    try {
      const res = await getBadgesApi();
      if (res.data && res.data.success) {
        setBadges(res.data.data || []);
      }
    } catch (error) {
      console.error('Error loading badges:', error);
      toast.error('Lỗi tải dữ liệu', 'Không thể lấy danh sách nhãn dán.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBadges();
  }, []);

  const getShapeStyle = (shape: string | undefined) => {
    switch (shape) {
      case 'pill': return { borderRadius: '20px' };
      case 'rectangle': return { borderRadius: '4px' };
      case 'circle': return { borderRadius: '50%', width: '36px', height: '36px', padding: '4px 8px', justifyContent: 'center' };
      default: return { borderRadius: '20px' };
    }
  };

  const getShapeLabel = (shape: string | undefined) => {
    switch (shape) {
      case 'pill': return 'Viên thuốc';
      case 'rectangle': return 'Chữ nhật';
      case 'circle': return 'Tròn';
      default: return 'Viên thuốc';
    }
  };

  return (
    <div className="badges-view fade-in">
      <style>{`
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
        .btn-add-custom:hover {
          background-color: var(--primary-hover);
        }
        .badge-preview-pill {
          display: inline-flex;
          align-items: center;
          padding: 6px 14px;
          border-radius: 20px;
          font-size: 12.5px;
          font-weight: 700;
          box-shadow: 0 2px 4px rgba(0,0,0,0.15);
          letter-spacing: 0.3px;
        }
        .color-code-box {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          font-family: monospace;
          font-size: 13px;
          color: var(--text-light);
        }
        .color-dot {
          width: 12px;
          height: 12px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
        }
        .btn-detail-link {
          background: none;
          border: none;
          color: var(--primary);
          font-weight: 600;
          padding: 0;
          cursor: pointer;
          font-size: 13.5px;
          transition: var(--transition);
          white-space: nowrap;
        }
        .btn-detail-link:hover {
          text-decoration: underline;
          color: var(--primary-hover);
        }
      `}</style>

      {/* Header & toolbar */}
      <div className="view-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '20px', marginBottom: '24px' }}>
        <div>
          <h1 className="view-title">Quản lý Nhãn dán</h1>
          <p className="view-subtitle" style={{ margin: 0 }}>Danh sách các nhãn gắn lên sách để thu hút sự chú ý của khách hàng.</p>
        </div>
        <button className="btn-add-custom" onClick={() => navigate('/badges/new')}>
          <TbBookmarkPlus style={{ fontSize: '18px' }} /> Thêm nhãn dán
        </button>
      </div>

      {/* Table content */}
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>Xem trước nhãn</th>
              <th>Màu chữ</th>
              <th>Màu nền</th>
              <th>Hình dạng</th>
              <th style={{ width: '120px', textAlign: 'center' }}>Chi tiết</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0' }}>
                  <div className="pink-spinner-container">
                    <div className="pink-spinner"></div>
                    <span style={{ marginLeft: '12px', fontSize: '14px', color: 'var(--text-light)' }}>
                      Đang tải danh sách nhãn dán...
                    </span>
                  </div>
                </td>
              </tr>
            ) : badges.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', padding: '40px 0', color: 'var(--text-muted)' }}>
                  Không tìm thấy nhãn dán nào.
                </td>
              </tr>
            ) : (
              badges.map((badge) => (
                <tr key={badge.id}>
                  <td>
                    <span
                      className="badge-preview-pill"
                      style={{
                        backgroundColor: badge.bgColor,
                        color: badge.textColor,
                        ...getShapeStyle(badge.shape)
                      }}
                    >
                      {badge.text}
                    </span>
                  </td>
                  <td>
                    <div className="color-code-box">
                      <span className="color-dot" style={{ backgroundColor: badge.textColor }} />
                      {badge.textColor}
                    </div>
                  </td>
                  <td>
                    <div className="color-code-box">
                      <span className="color-dot" style={{ backgroundColor: badge.bgColor }} />
                      {badge.bgColor}
                    </div>
                  </td>
                  <td>
                    <span style={{ color: 'var(--text-light)', fontSize: '13px' }}>
                      {getShapeLabel(badge.shape)}
                    </span>
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <button
                      className="btn-detail-link"
                      onClick={() => navigate(`/badges/edit/${badge.id}`)}
                    >
                      Xem chi tiết
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
export default Badges;