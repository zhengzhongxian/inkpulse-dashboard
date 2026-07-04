export interface BookProduct {
  id: string;
  title: string;
  author: string;
  category: string;
  price: number;
  quantity: number;
  status: 'ACTIVE' | 'INACTIVE';
  description: string;
  coverColor: string;
}

export interface OrderItem {
  bookId: string;
  title: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  customerName: string;
  email: string;
  phone: string;
  address: string;
  total: number;
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';
  date: string;
  paymentMethod: 'COD' | 'Ngân hàng';
  items: OrderItem[];
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: 'ACTIVE' | 'BLOCKED';
  joinedDate: string;
  ordersCount: number;
  totalSpent: number;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: 'Admin' | 'Staff';
  status: 'ACTIVE' | 'INACTIVE';
  joinedDate: string;
}

export interface Voucher {
  id: string;
  code: string;
  discount: number;
  description: string;
  status: 'ACTIVE' | 'EXPIRED';
  expiryDate: string;
}

export interface Review {
  id: string;
  bookTitle: string;
  customerName: string;
  rating: number;
  comment: string;
  date: string;
}

export interface Post {
  id: string;
  title: string;
  author: string;
  status: 'PUBLISHED' | 'DRAFT';
  date: string;
}

export const initialProducts: BookProduct[] = [
  {
    id: "B-001",
    title: "Đắc Nhân Tâm",
    author: "Dale Carnegie",
    category: "Phát triển bản thân",
    price: 89000,
    quantity: 52,
    status: 'ACTIVE',
    coverColor: '#4A154B',
    description: "Đắc nhân tâm (How to Win Friends and Influence People) là cuốn sách tự lực nổi tiếng nhất thế giới, đưa ra các lời khuyên về cách thức giao tiếp và ứng xử hàng ngày để đạt được thành công trong cuộc sống."
  },
  {
    id: "B-002",
    title: "Nhà Giả Kim",
    author: "Paulo Coelho",
    category: "Văn học & Tiểu thuyết",
    price: 79000,
    quantity: 28,
    status: 'ACTIVE',
    coverColor: '#D97706',
    description: "Nhà giả kim là một trong những cuốn sách bán chạy nhất lịch sử, kể về hành trình theo đuổi vận mệnh của cậu bé chăn cừu Santiago qua sa mạc Ai Cập."
  },
  {
    id: "B-003",
    title: "Sapiens: Lược Sử Loài Người",
    author: "Yuval Noah Harari",
    category: "Lịch sử & Khoa học",
    price: 149000,
    quantity: 14,
    status: 'ACTIVE',
    coverColor: '#1E3A8A',
    description: "Sapiens lược dịch lịch sử loài người từ thời kỳ đồ đá cho đến thế kỷ 21, đặt ra các câu hỏi lớn về vị trí của loài người tinh khôn trong dòng chảy lịch sử."
  },
  {
    id: "B-004",
    title: "Bắt Trẻ Đồng Xanh",
    author: "J.D. Salinger",
    category: "Văn học cổ điển",
    price: 68000,
    quantity: 0,
    status: 'INACTIVE',
    coverColor: '#991B1B',
    description: "Bắt trẻ đồng xanh kể về nhân vật chính Holden Caulfield trong những ngày lang thang ở New York sau khi bị đuổi học, phản ánh tâm lý nổi loạn của tuổi trẻ."
  },
  {
    id: "B-005",
    title: "Tư Duy Nhanh Và Chậm",
    author: "Daniel Kahneman",
    category: "Tâm lý học",
    price: 189000,
    quantity: 35,
    status: 'ACTIVE',
    coverColor: '#065F46',
    description: "Cuốn sách phân tích hai hệ thống tư duy điều khiển hành vi con người: Hệ thống 1 hoạt động nhanh, tự động và Hệ thống 2 hoạt động chậm, đòi hỏi nỗ lực suy nghĩ."
  }
];

export const initialOrders: Order[] = [
  {
    id: "ORD-9821",
    customerName: "Trần Thị Cẩm Tú",
    email: "camtu.tran@gmail.com",
    phone: "0918234857",
    address: "123 Đường Láng, Láng Thượng, Đống Đa, Hà Nội",
    total: 247000,
    status: 'PENDING',
    date: "2026-06-26 15:45",
    paymentMethod: 'COD',
    items: [
      { bookId: "B-002", title: "Nhà Giả Kim", quantity: 2, price: 79000 },
      { bookId: "B-001", title: "Đắc Nhân Tâm", quantity: 1, price: 89000 }
    ]
  },
  {
    id: "ORD-9820",
    customerName: "Nguyễn Văn Hùng",
    email: "hungnv.99@gmail.com",
    phone: "0987654321",
    address: "Tòa S2.05 Vinhomes Grand Park, Long Thạnh Mỹ, Quận 9, Hồ Chí Minh",
    total: 149000,
    status: 'PROCESSING',
    date: "2026-06-26 11:20",
    paymentMethod: 'Ngân hàng',
    items: [
      { bookId: "B-003", title: "Sapiens: Lược Sử Loài Người", quantity: 1, price: 149000 }
    ]
  },
  {
    id: "ORD-9819",
    customerName: "Lê Minh Triết",
    email: "minhtriet.le@yahoo.com",
    phone: "0905112233",
    address: "45 Lê Lợi, Thạch Thang, Hải Châu, Đà Nẵng",
    total: 357000,
    status: 'COMPLETED',
    date: "2026-06-25 09:30",
    paymentMethod: 'Ngân hàng',
    items: [
      { bookId: "B-001", title: "Đắc Nhân Tâm", quantity: 3, price: 89000 },
      { bookId: "B-002", title: "Nhà Giả Kim", quantity: 1, price: 79000 }
    ]
  },
  {
    id: "ORD-9818",
    customerName: "Phạm Hải Đăng",
    email: "haidang.pham@gmail.com",
    phone: "0345678912",
    address: "78 Mậu Thân, Xuân Khánh, Ninh Kiều, Cần Thơ",
    total: 68000,
    status: 'CANCELLED',
    date: "2026-06-24 18:15",
    paymentMethod: 'COD',
    items: [
      { bookId: "B-004", title: "Bắt Trẻ Đồng Xanh", quantity: 1, price: 68000 }
    ]
  }
];

export const initialCustomers: Customer[] = [
  {
    id: "C-001",
    name: "Trần Thị Cẩm Tú",
    email: "camtu.tran@gmail.com",
    phone: "0918234857",
    status: 'ACTIVE',
    joinedDate: "2026-05-14",
    ordersCount: 3,
    totalSpent: 678000
  },
  {
    id: "C-002",
    name: "Nguyễn Văn Hùng",
    email: "hungnv.99@gmail.com",
    phone: "0987654321",
    status: 'ACTIVE',
    joinedDate: "2026-06-01",
    ordersCount: 1,
    totalSpent: 149000
  },
  {
    id: "C-003",
    name: "Lê Minh Triết",
    email: "minhtriet.le@yahoo.com",
    phone: "0905112233",
    status: 'ACTIVE',
    joinedDate: "2026-04-20",
    ordersCount: 8,
    totalSpent: 2150000
  },
  {
    id: "C-004",
    name: "Hoàng Thị Mai",
    email: "maihoang@gmail.com",
    phone: "0382991188",
    status: 'BLOCKED',
    joinedDate: "2026-03-10",
    ordersCount: 2,
    totalSpent: 310000
  }
];

export const initialStaff: Staff[] = [
  {
    id: "ST-001",
    name: "Nguyễn Văn Admin",
    email: "admin@inkpulse.com",
    role: 'Admin',
    status: 'ACTIVE',
    joinedDate: "2026-01-01"
  },
  {
    id: "ST-002",
    name: "Lê Thị Thu",
    email: "thule@inkpulse.com",
    role: 'Staff',
    status: 'ACTIVE',
    joinedDate: "2026-02-15"
  },
  {
    id: "ST-003",
    name: "Phan Văn Đức",
    email: "ducphan@inkpulse.com",
    role: 'Staff',
    status: 'INACTIVE',
    joinedDate: "2026-03-01"
  }
];

export const initialVouchers: Voucher[] = [
  {
    id: "V-001",
    code: "WELCOME50",
    discount: 50000,
    description: "Giảm 50k cho khách hàng đăng ký tài khoản mới",
    status: 'ACTIVE',
    expiryDate: "2026-12-31"
  },
  {
    id: "V-002",
    code: "IPBOOK10",
    discount: 10,
    description: "Giảm 10% tổng giá trị đơn hàng (tối đa 100k)",
    status: 'ACTIVE',
    expiryDate: "2026-08-30"
  },
  {
    id: "V-003",
    code: "HELLOSUMMER",
    discount: 20000,
    description: "Mã giảm giá chào hè 20k cho đơn từ 200k",
    status: 'EXPIRED',
    expiryDate: "2026-06-15"
  }
];

export const initialReviews: Review[] = [
  {
    id: "R-001",
    bookTitle: "Nhà Giả Kim",
    customerName: "Trần Thị Cẩm Tú",
    rating: 5,
    comment: "Cuốn sách tuyệt vời, mang lại nhiều động lực sống và giúp mình có niềm tin hơn vào vận mệnh bản thân.",
    date: "2026-06-25"
  },
  {
    id: "R-002",
    bookTitle: "Sapiens: Lược Sử Loài Người",
    customerName: "Lê Minh Triết",
    rating: 4,
    comment: "Góc nhìn lịch sử rất mới lạ và sâu sắc. Dịch thuật tốt, đọc trôi chảy.",
    date: "2026-06-24"
  },
  {
    id: "R-003",
    bookTitle: "Đắc Nhân Tâm",
    customerName: "Nguyễn Văn Hùng",
    rating: 5,
    comment: "Sách gối đầu giường của bất cứ ai muốn học cách giao tiếp và kết nối với mọi người xung quanh.",
    date: "2026-06-23"
  }
];

export const initialPosts: Post[] = [
  {
    id: "P-001",
    title: "Top 5 cuốn sách tự lực đáng đọc nhất năm 2026",
    author: "Nguyễn Văn Admin",
    status: 'PUBLISHED',
    date: "2026-06-20"
  },
  {
    id: "P-002",
    title: "Review chi tiết cuốn sách 'Sapiens: Lược sử loài người'",
    author: "Lê Thị Thu",
    status: 'PUBLISHED',
    date: "2026-06-18"
  },
  {
    id: "P-003",
    title: "Bí quyết đọc sách hiệu quả mỗi ngày cho người bận rộn",
    author: "Nguyễn Văn Admin",
    status: 'DRAFT',
    date: "2026-06-25"
  }
];
