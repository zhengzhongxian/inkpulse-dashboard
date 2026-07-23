import { authClient } from './auth';

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
  parentId?: string | null;
  createdAt?: string;
}

export const getInternalCategoriesApi = () => {
  return authClient.get<any>('/categories');
};

export const createCategoryApi = (data: { name: string; parentId?: string | null }) => {
  return authClient.post<any>('/categories', data);
};

export const updateCategoryApi = (id: string, data: { name: string; parentId?: string | null }) => {
  return authClient.put<any>(`/categories/${id}`, data);
};

export const deleteCategoryApi = (id: string) => {
  return authClient.delete<any>(`/categories/${id}`);
};
