import { authClient } from './auth';

export interface PagedList<T> {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalCount: number;
  items: T[];
  hasPrevious: boolean;
  hasNext: boolean;
}

export interface BookEditionResponse {
  id: string;
  bookId: string;
  bookTitle: string;
  isbn: string;
  price: number;
  oldPrice: number | null;
  priceDisplay: string;
  oldPriceDisplay: string | null;
  stockQuantity: number;
  editionNumber: number;
  thumbnailUrl: string;
  filePathPdf: string | null;
  filePathPdfUrl: string | null;
  coverType: string;
  pageCount: number | null;
  publicationYear: number | null;
  weightGram: number | null;
  widthCm: number | null;
  heightCm: number | null;
  lengthCm: number | null;
  language: string | null;
  publisherName: string | null;
  badges?: EditionBadgeDto[];
}

export interface EditionBadgeDto {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
}

export interface BookResponse {
  id: string;
  title: string;
  introduce: string;
  thumbnailUrl: string;
  badgeText: string | null;
  badgeTextColor: string | null;
  badgeBgColor: string | null;
  minPrice: number | null;
  priceDisplay: string;
  wasPriceDisplay: string | null;
  authors: string[];
  totalStock?: number;
  createdAt?: string;
  updatedAt?: string;
  otherVersions?: BookEditionResponse[];
}

export interface CategoryResponse {
  id: string;
  name: string;
  slug: string;
}

export interface AuthorResponse {
  id: string;
  name: string;
  biography: string;
  avatarUrl: string;
}

export const getInternalBooksApi = (params: {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
  categorySlug?: string;
  active?: boolean;
  sortBy?: string;
  sortDirection?: string;
  minPrice?: number;
  maxPrice?: number;
}) => {
  return authClient.get<any>('/books', { params });
};

export const createBookApi = (formData: FormData) => {
  return authClient.post<any>('/books', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateBookApi = (id: string, formData: FormData) => {
  return authClient.put<any>(`/books/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteBookApi = (id: string) => {
  return authClient.delete<any>(`/books/${id}`);
};

export const getInternalBookDetailApi = (id: string) => {
  return authClient.get<any>(`/books/${id}`);
};

export const getInternalBookEditionDetailApi = (id: string) => {
  return authClient.get<any>(`/book-editions/${id}`);
};

export const createBookEditionApi = (formData: FormData) => {
  return authClient.post<any>('/book-editions', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateBookEditionApi = (id: string, formData: FormData) => {
  return authClient.patch<any>(`/book-editions/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteBookEditionApi = (id: string) => {
  return authClient.delete<any>(`/book-editions/${id}`);
};

export const getCategoriesApi = () => {
  return authClient.get<any>('/public/categories');
};

export const getAuthorsApi = (params?: {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
}) => {
  return authClient.get<any>('/authors', { params });
};

export const getPublishersApi = () => {
  return authClient.get<any>('/publishers');
};

export interface BadgeResponse {
  id: string;
  text: string;
  textColor: string;
  bgColor: string;
  shape?: string;
}

export const getBadgesApi = () => {
  return authClient.get<any>('/badges');
};

export const getBadgeDetailApi = (id: string) => {
  return authClient.get<any>(`/badges/${id}`);
};

export const createBadgeApi = (data: { text: string; textColor: string; bgColor: string; shape?: string }) => {
  return authClient.post<any>('/badges', data);
};

export const updateBadgeApi = (id: string, data: { text: string; textColor: string; bgColor: string; shape?: string }) => {
  return authClient.put<any>(`/badges/${id}`, data);
};

export const deleteBadgeApi = (id: string) => {
  return authClient.delete<any>(`/badges/${id}`);
};

export const getAuthorDetailApi = (id: string) => {
  return authClient.get<any>(`/authors/${id}`);
};

export const createAuthorApi = (formData: FormData) => {
  return authClient.post<any>('/authors', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const updateAuthorApi = (id: string, formData: FormData) => {
  return authClient.put<any>(`/authors/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const deleteAuthorApi = (id: string) => {
  return authClient.delete<any>(`/authors/${id}`);
};

// Publisher APIs
export interface PublisherResponse {
  id: string;
  name: string;
  address: string | null;
}

export const getPagedPublishersApi = (params?: {
  pageNumber?: number;
  pageSize?: number;
  searchKeyword?: string;
}) => {
  return authClient.get<any>('/publishers/paged', { params });
};

export const getPublisherDetailApi = (id: string) => {
  return authClient.get<any>(`/publishers/${id}`);
};

export const createPublisherApi = (data: { name: string; address?: string }) => {
  return authClient.post<any>('/publishers', data);
};

export const updatePublisherApi = (id: string, data: { name: string; address?: string }) => {
  return authClient.put<any>(`/publishers/${id}`, data);
};

export const deletePublisherApi = (id: string) => {
  return authClient.delete<any>(`/publishers/${id}`);
};

