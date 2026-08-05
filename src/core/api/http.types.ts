export type ContentType = 'application/json' | 'multipart/form-data' | 'application/x-www-form-urlencoded';

export interface HttpRequestConfig {
  baseUrl?: string;
  contentType?: ContentType;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
