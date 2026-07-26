import api from './client';

export interface BannerEditionItem {
  editionId: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  price: string;
  oldPrice?: string;
  coverUrl?: string;
  displayOrder: number;
}

export interface BannerResponse {
  bannerId: string;
  title: string;
  subtitle?: string;
  imageUrl: string;
  iconUrl?: string;
  linkUrl?: string;
  displayOrder: number;
  isActive: boolean;
  startDate?: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
  editions: BannerEditionItem[];
}

export interface PagedBannersParams {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
  isActive?: boolean;
}

export const getPagedBannersApi = async (params?: PagedBannersParams) => {
  return await api.get('/v1/internal/banners', { params });
};

export const getBannerDetailApi = async (id: string) => {
  return await api.get(`/v1/internal/banners/${id}`);
};

export const createBannerApi = async (formData: FormData) => {
  return await api.post('/v1/internal/banners', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const updateBannerApi = async (id: string, formData: FormData) => {
  return await api.put(`/v1/internal/banners/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
};

export const deleteBannerApi = async (id: string) => {
  return await api.delete(`/v1/internal/banners/${id}`);
};

export const toggleBannerStatusApi = async (id: string) => {
  return await api.patch(`/v1/internal/banners/${id}/status`);
};
