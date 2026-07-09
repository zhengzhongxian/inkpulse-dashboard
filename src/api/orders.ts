import { authClient } from './auth';

export interface ResultRes<T> {
  success: boolean;
  message: string;
  code: number;
  data: T;
}

export interface OrderLogDto {
  logId: string;
  fromStatus: string;
  toStatus: string;
  changedBy: string;
  adminNote: string;
  userNote: string;
  createdAt: string;
}

export interface OrderItemDetailDto {
  editionId: string;
  bookTitle: string;
  authorName: string;
  thumbnailUrl: string | null;
  quantity: number;
  priceDisplay: string;
  subtotalDisplay: string;
}

export interface OrderDetailDto {
  id: string;
  userId: string;
  orderCode: string;
  ghnOrderCode: string | null;
  orderStatus: string;
  paymentMethod: string;
  paymentStatus: string;
  receiverName: string;
  recipientPhone: string;
  shippingAddress: string;
  addressLabel: string;
  orderFeeDisplay: string;
  shippingFeeDisplay: string;
  totalDisplay: string;
  items: OrderItemDetailDto[];
  createdAt: string;
}

export const getInternalOrders = (page: number, size: number, search?: string, status?: string) => {
  return authClient.get<ResultRes<any>>(`/orders/internal`, {
    params: {
      page,
      size,
      search: search || undefined,
      status: status && status !== 'ALL' ? status : undefined
    }
  });
};

export const getInternalOrderDetail = (orderId: string) => {
  return authClient.get<ResultRes<OrderDetailDto>>(`/orders/internal/${orderId}`);
};

export const getOrderLogs = (orderCode: string) => {
  return authClient.get<ResultRes<OrderLogDto[]>>(`/orders/${orderCode}/logs`);
};

export const packOrder = (orderCode: string) => {
  return authClient.post<ResultRes<any>>(`/orders/${orderCode}/pack`);
};

export const approveOrder = (orderCode: string) => {
  return authClient.post<ResultRes<any>>(`/orders/${orderCode}/approve`);
};
