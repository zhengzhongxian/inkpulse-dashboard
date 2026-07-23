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
  editionNumber?: number;
  coverType?: string;
  isbn?: string;
  isFlashSale?: boolean;
  flashSaleDiscountAmountDisplay?: string;
  flashSaleItemId?: string;
  oldPriceDisplay?: string;
  voucherDiscountAmountDisplay?: string;
  isVoucherApplied?: boolean;
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
  voucherCode?: string;
  voucherDiscountAmountDisplay?: string;
}

export const getInternalOrders = (
  page: number,
  size: number,
  search?: string,
  status?: string,
  startDate?: string,
  endDate?: string,
  paymentMethod?: string,
  minAmount?: number,
  maxAmount?: number,
  hasVoucher?: boolean,
  hasFlashSale?: boolean
) => {
  return authClient.get<ResultRes<any>>(`/orders/internal`, {
    params: {
      page,
      size,
      search: search || undefined,
      status: status && status !== 'ALL' ? status : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      paymentMethod: paymentMethod && paymentMethod !== 'ALL' ? paymentMethod : undefined,
      minAmount: minAmount || undefined,
      maxAmount: maxAmount || undefined,
      hasVoucher: hasVoucher !== undefined ? hasVoucher : undefined,
      hasFlashSale: hasFlashSale !== undefined ? hasFlashSale : undefined
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

export const printOrderLabel = (orderCode: string) => {
  return authClient.post<ResultRes<{ printUrl: string }>>(`/orders/${orderCode}/print`);
};

export const cancelOrder = (orderCode: string) => {
  return authClient.post<ResultRes<any>>(`/orders/${orderCode}/cancel`);
};

export const returnOrder = (orderCode: string) => {
  return authClient.post<ResultRes<any>>(`/orders/${orderCode}/return`);
};

export interface UpdateShippingRequest {
  note?: string;
  requiredNote?: string;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
}

export const updateOrderShipping = (orderCode: string, request: UpdateShippingRequest) => {
  return authClient.post<ResultRes<any>>(`/orders/${orderCode}/shipping-update`, request);
};
