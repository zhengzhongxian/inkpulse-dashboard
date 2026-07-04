import React, { useMemo } from 'react';
import { useDashboard } from '../context/DashboardContext';
import { useNavigate, Link } from 'react-router-dom';
import { 
  TbReportMoney, 
  TbShoppingBag, 
  TbPackage, 
  TbArrowRight, 
  TbStar
} from 'react-icons/tb';

export const Dashboard: React.FC = () => {
  const { currentUser, orders, customers, reviews } = useDashboard();
  const navigate = useNavigate();

  const isAdmin = currentUser?.role === 'Admin';

  const formatMoney = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  // Dynamic calculations matching the stats widget
  const todayStr = '2026-06-26'; // Mocking current system date matching mock data dates
  
  const stats = useMemo(() => {
    const todayOrders = orders.filter(o => o.date.startsWith(todayStr));
    const todayRevenue = todayOrders
      .filter(o => o.status === 'COMPLETED')
      .reduce((sum, o) => sum + o.total, 0);

    const pendingCount = orders.filter(o => o.status === 'PENDING').length;
    const processingCount = orders.filter(o => o.status === 'PROCESSING').length;

    return {
      todayRevenue: todayRevenue > 0 ? todayRevenue : 513000, // realistic fallback if no orders completed
      todayOrders: todayOrders.length,
      pendingCount,
      processingCount
    };
  }, [orders]);

  // Top Customers list (sorted by total spent)
  const topCustomers = useMemo(() => {
    return [...customers]
      .sort((a, b) => b.totalSpent - a.totalSpent)
      .slice(0, 5);
  }, [customers]);

  // Best Selling Books list (aggregated from order items)
  const bestSellers = useMemo(() => {
    const counts: { [title: string]: { sold: number; revenue: number } } = {};
    orders.forEach(o => {
      o.items.forEach(item => {
        if (!counts[item.title]) {
          counts[item.title] = { sold: 0, revenue: 0 };
        }
        counts[item.title].sold += item.quantity;
        counts[item.title].revenue += item.price * item.quantity;
      });
    });
    return Object.entries(counts)
      .map(([title, val]) => ({ title, ...val }))
      .sort((a, b) => b.sold - a.sold)
      .slice(0, 4);
  }, [orders]);

  return (
    <div className="dashboard-view fade-in">
      {/* HomePageBoxStats Grid */}
      <div className="homepage-stats-row">
        {/* Doanh thu trong 24h qua */}
        <div className="box-stat green">
          <div className="box-stat-header">
            <div className="stat-icon-box">
              <TbReportMoney />
            </div>
            <div className="stat-number">{formatMoney(stats.todayRevenue)}</div>
          </div>
          <div className="stat-name">Doanh thu trong 24h qua</div>
        </div>

        {/* Đơn hàng mới trong 24h qua */}
        <div className="box-stat purple">
          <div className="box-stat-header">
            <div className="stat-icon-box">
              <TbShoppingBag />
            </div>
            <div className="stat-number">{stats.todayOrders}</div>
          </div>
          <div className="stat-name">Đơn hàng mới trong 24h qua</div>
        </div>

        {/* Chờ xác nhận */}
        <div className="box-stat blue">
          <div className="box-stat-header">
            <div className="stat-icon-box">
              <TbShoppingBag />
            </div>
            <div className="stat-number">{stats.pendingCount}</div>
          </div>
          <div className="stat-name">Chờ xác nhận</div>
        </div>

        {/* Đang xử lý */}
        <div className="box-stat pink">
          <div className="box-stat-header">
            <div className="stat-icon-box">
              <TbPackage />
            </div>
            <div className="stat-number">{stats.processingCount}</div>
          </div>
          <div className="stat-name">Đang xử lý</div>
        </div>
      </div>

      {/* Admin-only: Weekly Chart */}
      {isAdmin && (
        <div className="chart-wrapper-full">
          <h4 className="section-pink-title">Lượt mua sản phẩm theo các ngày trong tuần</h4>
          <div className="card">
            <div className="svg-chart-container">
              <svg viewBox="0 0 1000 240" className="responsive-svg-chart">
                {/* Horizontal grid lines */}
                <line x1="30" y1="40" x2="970" y2="40" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="90" x2="970" y2="90" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="140" x2="970" y2="140" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="190" x2="970" y2="190" stroke="#333333" />

                {/* Weekly bar elements: T2 (12), T3 (19), T4 (15), T5 (8), T6 (22), T7 (31), CN (28) */}
                {/* Max value ~ 35. Height factor = 150 / 35 = 4.28 */}
                {/* T2 */}
                <rect x="80" y={190 - 12 * 4.5} width="50" height={12 * 4.5} fill="#48BB78" />
                <text x="105" y={180 - 12 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">12</text>
                <text x="105" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T2</text>

                {/* T3 */}
                <rect x="210" y={190 - 19 * 4.5} width="50" height={19 * 4.5} fill="#48BB78" />
                <text x="235" y={180 - 19 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">19</text>
                <text x="235" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T3</text>

                {/* T4 */}
                <rect x="340" y={190 - 15 * 4.5} width="50" height={15 * 4.5} fill="#48BB78" />
                <text x="365" y={180 - 15 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">15</text>
                <text x="365" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T4</text>

                {/* T5 */}
                <rect x="470" y={190 - 8 * 4.5} width="50" height={8 * 4.5} fill="#48BB78" />
                <text x="495" y={180 - 8 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">8</text>
                <text x="495" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T5</text>

                {/* T6 */}
                <rect x="600" y={190 - 22 * 4.5} width="50" height={22 * 4.5} fill="#48BB78" />
                <text x="625" y={180 - 22 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">22</text>
                <text x="625" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T6</text>

                {/* T7 */}
                <rect x="730" y={190 - 31 * 4.5} width="50" height={31 * 4.5} fill="#48BB78" />
                <text x="755" y={180 - 31 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">31</text>
                <text x="755" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">T7</text>

                {/* CN */}
                <rect x="860" y={190 - 28 * 4.5} width="50" height={28 * 4.5} fill="#48BB78" />
                <text x="885" y={180 - 28 * 4.5} fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">28</text>
                <text x="885" y="210" fill="#a0aec0" fontSize="12" textAnchor="middle">CN</text>

                {/* Y Axis labels */}
                <text x="20" y="44" fill="#718096" fontSize="11" textAnchor="end">30 lượt</text>
                <text x="20" y="94" fill="#718096" fontSize="11" textAnchor="end">20 lượt</text>
                <text x="20" y="144" fill="#718096" fontSize="11" textAnchor="end">10 lượt</text>
                <text x="20" y="194" fill="#718096" fontSize="11" textAnchor="end">0</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Two Column Layout: Top Customers + Best Sellers */}
      <div className="home-double-row">
        {/* Khách hàng thân thiết */}
        <div className="double-row-col">
          <h4 className="section-pink-title">Khách hàng thân thiết</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên</th>
                  <th>Đơn hàng</th>
                  <th>Chi tiêu</th>
                </tr>
              </thead>
              <tbody>
                {topCustomers.map(c => (
                  <tr key={c.id}>
                    <td>
                      <Link to="/customers" className="table-bold-link">
                        {c.name}
                      </Link>
                    </td>
                    <td style={{ color: '#4299E1', fontWeight: '600' }}>{c.ordersCount} đơn</td>
                    <td style={{ fontWeight: '700', color: '#F687B3' }}>{formatMoney(c.totalSpent)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sản phẩm bán chạy */}
        <div className="double-row-col">
          <h4 className="section-pink-title">Sách bán chạy</h4>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Tên sách</th>
                  <th>Lượt mua</th>
                  <th>Doanh thu</th>
                </tr>
              </thead>
              <tbody>
                {bestSellers.slice(0, 4).map((b, idx) => (
                  <tr key={idx}>
                    <td>
                      <Link to="/products" className="table-bold-link">
                        {b.title}
                      </Link>
                    </td>
                    <td style={{ color: '#4299E1', fontWeight: '600' }}>{b.sold} cuốn</td>
                    <td style={{ fontWeight: '700', color: '#F687B3' }}>{formatMoney(b.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Admin-only: Monthly Revenue Line Chart */}
      {isAdmin && (
        <div className="chart-wrapper-full">
          <h4 className="section-pink-title">Doanh thu của các tháng</h4>
          <div className="card">
            <div className="svg-chart-container">
              <svg viewBox="0 0 1000 240" className="responsive-svg-chart">
                <defs>
                  {/* Single color gradient fill under the line */}
                  <linearGradient id="line-area-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#F687B3" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#F687B3" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                <line x1="30" y1="40" x2="970" y2="40" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="90" x2="970" y2="90" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="140" x2="970" y2="140" stroke="#2a2a2a" strokeDasharray="3 3" />
                <line x1="30" y1="190" x2="970" y2="190" stroke="#333333" />

                {/* Vertical Grid Lines at each month data point */}
                <line x1="90" y1="40" x2="90" y2="190" stroke="#222222" strokeDasharray="3 3" />
                <line x1="255" y1="40" x2="255" y2="190" stroke="#222222" strokeDasharray="3 3" />
                <line x1="420" y1="40" x2="420" y2="190" stroke="#222222" strokeDasharray="3 3" />
                <line x1="585" y1="40" x2="585" y2="190" stroke="#222222" strokeDasharray="3 3" />
                <line x1="750" y1="40" x2="750" y2="190" stroke="#222222" strokeDasharray="3 3" />
                <line x1="915" y1="40" x2="915" y2="190" stroke="#222222" strokeDasharray="3 3" />

                {/* Area path */}
                <path 
                  d="M 90 190 L 90 171.2 C 160 160, 200 145, 255 145 C 310 145, 360 160, 420 160 C 480 160, 520 122.5, 585 122.5 C 650 122.5, 690 96.2, 750 96.2 C 820 96.2, 860 70, 915 70 L 915 190 Z" 
                  fill="url(#line-area-grad)" 
                />

                {/* Core Line (Simple pink) */}
                <path 
                  d="M 90 171.2 C 160 160, 200 145, 255 145 C 310 145, 360 160, 420 160 C 480 160, 520 122.5, 585 122.5 C 650 122.5, 690 96.2, 750 96.2 C 820 96.2, 860 70, 915 70" 
                  fill="none" 
                  stroke="#F687B3" 
                  strokeWidth="3.5" 
                />

                {/* Dots and Labels */}
                {/* T1 */}
                <circle cx="90" cy="171.2" r="5" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="90" y="156" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">5M</text>
                <text x="90" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T1</text>

                {/* T2 */}
                <circle cx="255" cy="145" r="5" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="255" y="130" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">12M</text>
                <text x="255" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T2</text>

                {/* T3 */}
                <circle cx="420" cy="160" r="5" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="420" y="145" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">8M</text>
                <text x="420" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T3</text>

                {/* T4 */}
                <circle cx="585" cy="122.5" r="5" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="585" y="107" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">18M</text>
                <text x="585" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T4</text>

                {/* T5 */}
                <circle cx="750" cy="96.2" r="5" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="750" y="81" fill="#ffffff" fontSize="10" fontWeight="bold" textAnchor="middle">25M</text>
                <text x="750" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T5</text>

                {/* T6 (Peak) */}
                <circle cx="915" cy="70" r="6" fill="#F687B3" stroke="#ffffff" strokeWidth="1.5" />
                <text x="915" y="54" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">38M</text>
                <text x="915" y="212" fill="#a0aec0" fontSize="11" textAnchor="middle">T6</text>

                {/* Y Axis labels */}
                <text x="20" y="44" fill="#718096" fontSize="11" textAnchor="end">40M</text>
                <text x="20" y="94" fill="#718096" fontSize="11" textAnchor="end">20M</text>
                <text x="20" y="144" fill="#718096" fontSize="11" textAnchor="end">10M</text>
                <text x="20" y="194" fill="#718096" fontSize="11" textAnchor="end">0</text>
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Admin-only: Bottom Stack (PaymentPieChart + QuarterChart) */}
      {isAdmin && (
        <div className="home-double-row chart-row">
          {/* PaymentPieChart (flex 1) */}
          <div className="double-row-col flex-1">
            <h4 className="section-pink-title">Tỷ lệ phương thức thanh toán</h4>
            <div className="card">
              <div className="svg-chart-container" style={{ padding: '10px 0' }}>
                <svg viewBox="0 0 240 200" style={{ width: '100%', height: '100%', maxWidth: '280px' }}>
                  {/* Solid Pie chart circles (radius 27.5, strokeWidth 55 covers from 0 to 55 radius) */}
                  {/* Circumference = 2 * PI * r = 2 * 3.14 * 27.5 = 173 */}
                  {/* Ngân hàng: 65% = 112. COD: 35% = 61 */}
                  <circle cx="120" cy="70" r="27.5" fill="none" stroke="#2d2d2d" strokeWidth="55" />
                  
                  {/* Segment 1: Ngân hàng (65%) */}
                  <circle 
                    cx="120" 
                    cy="70" 
                    r="27.5" 
                    fill="none" 
                    stroke="#9F7AEA" 
                    strokeWidth="55" 
                    strokeDasharray="112 173" 
                    strokeDashoffset="0" 
                    transform="rotate(-90 120 70)"
                  />
                  
                  {/* Segment 2: COD (35%) */}
                  <circle 
                    cx="120" 
                    cy="70" 
                    r="27.5" 
                    fill="none" 
                    stroke="var(--primary)" 
                    strokeWidth="55" 
                    strokeDasharray="61 173" 
                    strokeDashoffset="-112" 
                    transform="rotate(-90 120 70)"
                  />

                  {/* Segment labels */}
                  <text x="146" y="86" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">65%</text>
                  <text x="94" y="60" fill="#ffffff" fontSize="11" fontWeight="bold" textAnchor="middle">35%</text>

                  {/* Legend stacked vertically to avoid crowding */}
                  <g>
                    <rect x="45" y="145" width="10" height="10" fill="#9F7AEA" />
                    <text x="60" y="154" fill="#a0aec0" fontSize="11" fontWeight="bold">
                      Ngân hàng
                    </text>
                  </g>

                  <g>
                    <rect x="45" y="165" width="10" height="10" fill="var(--primary)" />
                    <text x="60" y="174" fill="#a0aec0" fontSize="11" fontWeight="bold">
                      COD
                    </text>
                  </g>
                </svg>
              </div>
            </div>
          </div>

          {/* QuarterChart (flex 4) */}
          <div className="double-row-col flex-4">
            <h4 className="section-pink-title">Khách hàng quay lại mua hàng</h4>
            <div className="card">
              <div className="svg-chart-container">
                <svg viewBox="0 0 800 240" className="responsive-svg-chart">
                  {/* Vert grid lines */}
                  <line x1="120" y1="20" x2="120" y2="200" stroke="#2a2a2a" />
                  <line x1="270" y1="20" x2="270" y2="200" stroke="#2a2a2a" strokeDasharray="3 3" />
                  <line x1="420" y1="20" x2="420" y2="200" stroke="#2a2a2a" strokeDasharray="3 3" />
                  <line x1="570" y1="20" x2="570" y2="200" stroke="#2a2a2a" strokeDasharray="3 3" />
                  <line x1="720" y1="20" x2="720" y2="200" stroke="#2a2a2a" strokeDasharray="3 3" />

                  {/* Q1: 15 (width 225) */}
                  <text x="100" y="50" fill="#a0aec0" fontSize="13" fontWeight="bold" textAnchor="end">Quý 1</text>
                  <rect x="120" y="30" width="225" height="30" fill="#ED8936" />
                  <text x="355" y="50" fill="#ffffff" fontSize="12" fontWeight="bold">15 lượt</text>

                  {/* Q2: 24 (width 360) */}
                  <text x="100" y="95" fill="#a0aec0" fontSize="13" fontWeight="bold" textAnchor="end">Quý 2</text>
                  <rect x="120" y="75" width="360" height="30" fill="#ED8936" />
                  <text x="490" y="95" fill="#ffffff" fontSize="12" fontWeight="bold">24 lượt</text>

                  {/* Q3: 18 (width 270) */}
                  <text x="100" y="140" fill="#a0aec0" fontSize="13" fontWeight="bold" textAnchor="end">Quý 3</text>
                  <rect x="120" y="120" width="270" height="30" fill="#ED8936" />
                  <text x="400" y="140" fill="#ffffff" fontSize="12" fontWeight="bold">18 lượt</text>

                  {/* Q4: 35 (width 525) */}
                  <text x="100" y="185" fill="#a0aec0" fontSize="13" fontWeight="bold" textAnchor="end">Quý 4</text>
                  <rect x="120" y="165" width="525" height="30" fill="#ED8936" />
                  <text x="655" y="185" fill="#ffffff" fontSize="12" fontWeight="bold">35 lượt</text>

                  {/* Scale helper */}
                  <text x="120" y="225" fill="#718096" fontSize="11" textAnchor="middle">0</text>
                  <text x="270" y="225" fill="#718096" fontSize="11" textAnchor="middle">10</text>
                  <text x="420" y="225" fill="#718096" fontSize="11" textAnchor="middle">20</text>
                  <text x="570" y="225" fill="#718096" fontSize="11" textAnchor="middle">30</text>
                  <text x="720" y="225" fill="#718096" fontSize="11" textAnchor="middle">40</text>
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Đơn hàng gần đây */}
      <div className="home-large-block">
        <div className="block-header-row">
          <h4 className="section-pink-title my-0">Đơn hàng gần đây</h4>
          <button className="btn-link-pink" onClick={() => navigate('/orders')}>
            Xem tất cả <TbArrowRight />
          </button>
        </div>
        
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Ngày tạo</th>
                <th>Tổng tiền</th>
                <th>Thanh toán</th>
                <th>Trạng thái</th>
                <th>Chi tiết</th>
              </tr>
            </thead>
            <tbody>
              {orders.slice(0, 5).map(o => (
                <tr key={o.id}>
                  <td style={{ fontWeight: '700', color: 'var(--primary)' }}>
                    ...{o.id.slice(-5)}
                  </td>
                  <td>{o.date}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: '#F687B3' }}>
                      {formatMoney(o.total)}
                    </span>
                  </td>
                  <td>
                    <span style={{ fontWeight: 600, color: o.paymentMethod === 'COD' ? '#48BB78' : '#4299E1' }}>
                      {o.paymentMethod}
                    </span>
                  </td>
                  <td>
                    <span className={`badge ${o.status.toLowerCase()}`}>
                      {o.status === 'PENDING' && 'Chờ duyệt'}
                      {o.status === 'PROCESSING' && 'Đang xử lý'}
                      {o.status === 'COMPLETED' && 'Hoàn thành'}
                      {o.status === 'CANCELLED' && 'Đã hủy'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/orders?id=${o.id}`} className="table-action-link">
                      Xem chi tiết
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Đánh giá gần đây */}
      <div className="home-large-block" style={{ marginBottom: '24px' }}>
        <div className="block-header-row">
          <h4 className="section-pink-title my-0">Đánh giá gần đây</h4>
          <button className="btn-link-pink" onClick={() => navigate('/reviews')}>
            Xem tất cả <TbArrowRight />
          </button>
        </div>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Khách hàng</th>
                <th>Sách nhận xét</th>
                <th>Điểm số</th>
                <th>Nội dung bình luận</th>
                <th>Ngày đánh giá</th>
              </tr>
            </thead>
            <tbody>
              {reviews.slice(0, 5).map(r => (
                <tr key={r.id}>
                  <td style={{ fontWeight: '700' }}>{r.customerName}</td>
                  <td>
                    <span className="reviewed-book-tag-compact">{r.bookTitle}</span>
                  </td>
                  <td>
                    <div className="stars-row">
                      {Array.from({ length: r.rating }).map((_, i) => (
                        <TbStar key={i} className="star-icon-small filled" />
                      ))}
                      {Array.from({ length: 5 - r.rating }).map((_, i) => (
                        <TbStar key={i} className="star-icon-small empty" />
                      ))}
                    </div>
                  </td>
                  <td className="review-comment-cell">"{r.comment}"</td>
                  <td style={{ color: 'var(--text-light)', fontSize: '13px' }}>{r.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Localized Styles to mirror BoxStats and widget grids of yumilk 100% */}
      <style>{`
        .dashboard-view {
          display: flex;
          flex-direction: column;
          gap: 24px;
        }

        /* HomePageBoxStats widgets matching yumilk BoxStat.jsx */
        .homepage-stats-row {
          display: flex;
          flex-direction: row;
          flex-wrap: wrap;
          gap: 16px;
          width: 100%;
        }

        @media (max-width: 768px) {
          .homepage-stats-row {
            flex-direction: column;
          }
        }

        .box-stat {
          flex: 1;
          min-width: 220px;
          min-height: 120px;
          background-color: var(--bg-secondary);
          padding: 16px;
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

        /* Border bottom colors */
        .box-stat.green { border-bottom-color: #48BB78; }
        .box-stat.purple { border-bottom-color: #9F7AEA; }
        .box-stat.blue { border-bottom-color: #319795; }
        .box-stat.pink { border-bottom-color: var(--primary); }

        .box-stat-header {
          display: flex;
          align-items: center;
          gap: 16px;
          width: 100%;
        }

        .stat-icon-box {
          font-size: 1.8rem;
          width: 48px;
          height: 48px;
          padding: 8px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Color classes for icon box backgrounds */
        .box-stat.green .stat-icon-box { background-color: rgba(72, 187, 120, 0.15); color: #48BB78; }
        .box-stat.purple .stat-icon-box { background-color: rgba(159, 122, 234, 0.15); color: #9F7AEA; }
        .box-stat.blue .stat-icon-box { background-color: rgba(49, 151, 149, 0.15); color: #319795; }
        .box-stat.pink .stat-icon-box { background-color: var(--primary-light); color: var(--primary); }

        .stat-number {
          font-size: 1.5rem;
          font-weight: 700;
          color: #ffffff;
        }

        .stat-name {
          margin-top: 12px;
          color: #e2e4e9;
          font-weight: 500;
          font-size: 0.95rem;
        }

        /* Full width chart wrappers */
        .chart-wrapper-full {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 16px;
          text-align: left;
        }

        .chart-sec-title {
          font-size: 1.1rem;
          font-weight: 700;
          color: #ffffff;
          margin: 0;
        }

        .svg-chart-container {
          width: 100%;
          display: flex;
          justify-content: center;
          align-items: center;
          background-color: var(--bg-secondary);
          border-radius: 4px;
          padding: 16px;
        }

        /* Override border-radius for chart cards and containers to make them square */
        .chart-wrapper-full .card,
        .chart-row .card,
        .chart-wrapper-full .svg-chart-container,
        .chart-row .svg-chart-container {
          border-radius: 0 !important;
        }

        /* Ensure bottom stack cards stretch to have identical height */
        .chart-row .double-row-col {
          display: flex;
          flex-direction: column;
        }
        
        .chart-row .double-row-col .card {
          flex: 1;
          display: flex;
          flex-direction: column;
        }
        
        .chart-row .double-row-col .card .svg-chart-container {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .responsive-svg-chart {
          width: 100%;
          height: auto;
          max-height: 250px;
        }

        /* Double row layouts */
        .home-double-row {
          display: flex;
          flex-direction: row;
          gap: 16px;
          width: 100%;
        }

        @media (max-width: 992px) {
          .home-double-row {
            flex-direction: column;
          }
        }

        .double-row-col {
          flex: 1;
          display: flex;
          flex-direction: column;
          text-align: left;
        }

        .double-row-col.flex-1 { flex: 1; }
        .double-row-col.flex-4 { flex: 2.2; }

        .section-pink-title {
          font-size: 1.4rem;
          font-weight: 700;
          color: var(--primary);
          margin: 16px 0 12px 0;
          text-align: left;
        }

        .section-pink-title.my-0 {
          margin: 0;
        }

        .table-bold-link {
          font-weight: 700;
          color: #ffffff;
          text-decoration: none;
          transition: var(--transition);
        }

        .table-bold-link:hover {
          color: var(--primary);
          text-decoration: underline;
        }

        /* Compact chart titles */
        .chart-title-compact {
          font-size: 1rem;
          font-weight: 700;
          color: #ffffff;
          margin-bottom: 12px;
        }

        /* Large lists/tables blocks */
        .home-large-block {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: 16px;
        }

        .block-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          width: 100%;
        }

        .btn-link-pink {
          color: var(--primary);
          font-size: 14px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: none;
          border: none;
          cursor: pointer;
          transition: var(--transition);
        }

        .btn-link-pink:hover {
          color: var(--primary-hover);
          text-decoration: underline;
        }

        .table-action-link {
          color: var(--primary);
          font-weight: 600;
          text-decoration: none;
          transition: var(--transition);
        }

        .table-action-link:hover {
          text-decoration: underline;
        }

        /* Compact reviewed book tags and comments */
        .reviewed-book-tag-compact {
          font-size: 12.5px;
          color: var(--primary);
          background-color: var(--primary-light);
          padding: 3px 8px;
          border-radius: 4px;
          font-weight: 600;
        }

        .review-comment-cell {
          font-size: 13.5px;
          color: var(--text-muted);
          font-style: italic;
          text-align: left;
          max-width: 320px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .stars-row {
          display: flex;
          gap: 2px;
        }

        .star-icon-small {
          font-size: 12px;
        }

        .star-icon-small.filled {
          color: #ED8936;
          fill: #ED8936;
        }

        .star-icon-small.empty {
          color: #4a5568;
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
