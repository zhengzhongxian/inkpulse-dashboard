import { authClient } from './auth';

export interface VoucherResponse {
  voucherId: string;
  startDate: string;
  endDate: string;
  voucherCode: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  minOrderValue: string;
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  isActive: boolean;
  coinCost: number;
  targetType: 'ALL' | 'CATEGORY' | 'BOOK' | 'EDITION';
  maxDiscountAmount?: string | null;
  createdAt: string;
}

export interface VoucherTargetItemResponse {
  id: string;
  name: string;
}

export interface VoucherDetailResponse {
  voucherId: string;
  startDate: string;
  endDate: string;
  voucherCode: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: string;
  minOrderValue: string;
  maxUses: number;
  usedCount: number;
  maxUsesPerUser: number;
  isActive: boolean;
  coinCost: number;
  targetType: 'ALL' | 'CATEGORY' | 'BOOK' | 'EDITION';
  maxDiscountAmount?: string | null;
  createdAt: string;
  targetItems: VoucherTargetItemResponse[];
}

export interface CreateVoucherRequest {
  voucherCode: string;
  description: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  minOrderValue: number;
  maxUses: number;
  maxUsesPerUser: number;
  isActive: boolean;
  coinCost: number;
  targetType: 'ALL' | 'CATEGORY' | 'BOOK' | 'EDITION';
  targetIds: string[];
  startDate: string; // ISO datetime
  endDate: string; // ISO datetime
  maxDiscountAmount?: number | null;
}

export interface UpdateVoucherRequest extends CreateVoucherRequest {
  voucherId: string;
}

export const getInternalVouchersApi = (params: {
  page?: number;
  size?: number;
  search?: string;
  discountType?: string;
  targetType?: string;
  minDiscount?: number;
  maxDiscount?: number;
  minUses?: number;
  maxUses?: number;
  minCoinCost?: number;
  maxCoinCost?: number;
  createdFrom?: string;
  createdTo?: string;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  isActive?: boolean;
}) => {
  return authClient.get<any>('/vouchers/internal', { params });
};

export const getInternalVoucherDetailApi = (voucherId: string) => {
  return authClient.get<any>(`/vouchers/internal/${voucherId}`);
};

export const createVoucherApi = (data: CreateVoucherRequest) => {
  return authClient.post<any>('/vouchers', data);
};

export const updateVoucherApi = (voucherId: string, data: UpdateVoucherRequest) => {
  return authClient.put<any>(`/vouchers/${voucherId}`, data);
};

export const deleteVoucherApi = (voucherId: string) => {
  return authClient.delete<any>(`/vouchers/${voucherId}`);
};
