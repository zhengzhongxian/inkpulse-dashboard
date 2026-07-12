import { authClient } from './auth';
import type { ResultRes } from './orders';

export interface RefundRequestDto {
  id: string;
  orderId: string;
  orderCode: string;
  amount: number;
  status: string;
  reason: string;
  approvedByUsername: string | null;
  payosRefundId: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

export const getRefundRequests = (page: number, size: number, search?: string, status?: string, startDate?: string, endDate?: string) => {
  return authClient.get<ResultRes<any>>(`/refunds`, {
    params: {
      page,
      size,
      search: search || undefined,
      status: status && status !== 'ALL' ? status : undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined
    }
  });
};

export const approveRefund = (id: string, bankInfo?: { accountNumber?: string; bin?: string; accountName?: string }) => {
  return authClient.post<ResultRes<any>>(`/refunds/${id}/approve`, bankInfo || {});
};
