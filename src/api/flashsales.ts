import { authClient } from './auth';

export interface FlashSaleResponse {
  flashSaleId: string;
  name: string;
  itemCount: number;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
}

export interface FlashSaleItemResponse {
  flashSaleItemId: string;
  flashSaleId: string;
  name: string;
  bookEditionId: string;
  bookTitle: string;
  editionTitle: string; // isbn
  thumbnailUrl: string;
  originalPrice: number;
  discountAmount: number;
  flashSalePrice: number;
  flashSaleStock: number;
  soldCount: number;
  startDate: string;
  endDate: string;
}

export interface FlashSaleDetailResponse {
  flashSaleId: string;
  name: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
  createdAt: string;
  items: FlashSaleItemResponse[];
}

export interface CreateFlashSaleRequest {
  name: string;
  startDate: string;
  endDate: string;
  items?: Array<{
    bookEditionId: string;
    discountAmount: number;
    flashSaleStock: number;
  }>;
}

export interface UpdateFlashSaleRequest {
  name?: string;
  isActive?: boolean;
  startDate?: string;
  endDate?: string;
}

export const getInternalFlashSalesApi = (params: {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
  isActive?: boolean;
  startDateFrom?: string;
  startDateTo?: string;
  endDateFrom?: string;
  endDateTo?: string;
  createdFrom?: string;
  createdTo?: string;
  minStock?: number;
  maxStock?: number;
  minDiscount?: number;
  maxDiscount?: number;
}) => {
  return authClient.get<any>('/flash-sales/internal', { params });
};

export const getInternalFlashSaleDetailApi = (id: string) => {
  return authClient.get<any>(`/flash-sales/internal/${id}`);
};

export const createFlashSaleApi = (data: CreateFlashSaleRequest) => {
  return authClient.post<any>('/flash-sales', data);
};

export const updateFlashSaleApi = (id: string, data: UpdateFlashSaleRequest) => {
  return authClient.put<any>(`/flash-sales/${id}`, data);
};

export const deleteFlashSaleApi = (id: string) => {
  return authClient.delete<any>(`/flash-sales/${id}`);
};

// ------------------- NEW ITEM-LEVEL APIs -------------------

export const addFlashSaleItemApi = (flashSaleId: string, data: { bookEditionId: string; discountAmount: number; flashSaleStock: number; }) => {
  return authClient.post<any>(`/flash-sales/${flashSaleId}/items`, data);
};

export const addFlashSaleItemsBatchApi = (flashSaleId: string, data: { items: Array<{ bookEditionId: string; discountAmount: number; flashSaleStock: number; }> }) => {
  return authClient.post<any>(`/flash-sales/${flashSaleId}/items/batch`, data);
};

export const removeFlashSaleItemApi = (flashSaleId: string, itemId: string) => {
  return authClient.delete<any>(`/flash-sales/${flashSaleId}/items/${itemId}`);
};

export const removeFlashSaleItemsBatchApi = (flashSaleId: string, data: { itemIds: string[] }) => {
  return authClient.delete<any>(`/flash-sales/${flashSaleId}/items/batch`, { data });
};

export const updateFlashSaleItemApi = (flashSaleId: string, itemId: string, data: { discountAmount?: number; flashSaleStock?: number; }) => {
  return authClient.put<any>(`/flash-sales/${flashSaleId}/items/${itemId}`, data);
};

export const updateFlashSaleItemsBatchApi = (flashSaleId: string, data: { items: Array<{ flashSaleItemId: string; discountAmount?: number; flashSaleStock?: number; }> }) => {
  return authClient.put<any>(`/flash-sales/${flashSaleId}/items/batch`, data);
};
