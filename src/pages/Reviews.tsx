import React, { useState } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { TbSearch, TbStar } from 'react-icons/tb';

export const Reviews: React.FC = () => {
  const { reviews } = useDashboard();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredReviews = reviews.filter(r => {
    return r.bookTitle.toLowerCase().includes(searchTerm.toLowerCase()) || 
           r.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           r.comment.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <div className="reviews-view fade-in">
      <div className="view-header">
        <div>
          <h1 className="view-title">Đánh giá từ độc giả</h1>
          <p className="view-subtitle">Phản hồi và chấm điểm chất lượng sách từ khách hàng mua sản phẩm.</p>
        </div>
      </div>

      <div className="filters-row card">
        <div className="search-wrap" style={{ position: 'relative', width: '100%' }}>
          <TbSearch className="search-icon" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input 
            type="text" 
            placeholder="Tìm theo tên sách, tên độc giả hoặc nội dung đánh giá..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ width: '100%', padding: '10px 12px 10px 38px', fontSize: '14px' }}
          />
        </div>
      </div>

      <div className="reviews-layout-stack">
        {filteredReviews.length > 0 ? (
          filteredReviews.map(r => (
            <div key={r.id} className="review-card card">
              <div className="review-card-header">
                <div className="reviewer-info">
                  <div className="avatar-placeholder">{r.customerName.charAt(0)}</div>
                  <div className="meta">
                    <span className="name">{r.customerName}</span>
                    <span className="date">{r.date}</span>
                  </div>
                </div>
                <div className="stars-row">
                  {Array.from({ length: r.rating }).map((_, i) => (
                    <TbStar key={i} className="star-icon filled" />
                  ))}
                  {Array.from({ length: 5 - r.rating }).map((_, i) => (
                    <TbStar key={i} className="star-icon empty" />
                  ))}
                </div>
              </div>
              
              <div className="review-card-body">
                <p className="comment-text">"{r.comment}"</p>
                <div className="book-link-tag">
                  Sách đánh giá: <strong>{r.bookTitle}</strong>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="card" style={{ textAlign: 'center', padding: '32px', color: 'var(--text-light)' }}>
            Không tìm thấy đánh giá nào hợp lệ.
          </div>
        )}
      </div>

      <style>{`
        .reviews-layout-stack {
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .review-card {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }

        .review-card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        @media (max-width: 576px) {
          .review-card-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 10px;
          }
        }

        .reviewer-info {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .avatar-placeholder {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background-color: var(--bg-hover);
          color: var(--primary);
          font-weight: 700;
          font-size: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--border);
        }

        .reviewer-info .meta {
          display: flex;
          flex-direction: column;
        }

        .reviewer-info .name {
          font-size: 14.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .reviewer-info .date {
          font-size: 11.5px;
          color: var(--text-light);
          margin-top: 2px;
        }

        .stars-row {
          display: flex;
          gap: 2px;
        }

        .star-icon {
          font-size: 16px;
        }

        .star-icon.filled {
          color: var(--accent-orange);
          fill: var(--accent-orange);
        }

        .star-icon.empty {
          color: var(--text-light);
        }

        .comment-text {
          font-size: 14px;
          color: var(--text-main);
          line-height: 1.5;
          font-style: italic;
          margin-bottom: 12px;
        }

        .book-link-tag {
          display: inline-block;
          font-size: 12px;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 4px 10px;
          border-radius: 4px;
          border: 1px solid rgba(246, 99, 152, 0.1);
        }
      `}</style>
    </div>
  );
};
export default Reviews;
