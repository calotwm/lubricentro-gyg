import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

type Product = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  productType: string;
  currentStock: number;
  isActive: boolean;
};

type ProductsResponse = {
  data: Product[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type ProductFilters = {
  search?: string;
  brandId?: string;
  categoryId?: string;
  page?: number;
  limit?: number;
};

function buildQueryString(filters: ProductFilters): string {
  const params = new URLSearchParams();

  if (filters.search) params.append('search', filters.search);
  if (filters.brandId) params.append('brand_id', filters.brandId);
  if (filters.categoryId) params.append('category_id', filters.categoryId);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());

  const queryString = params.toString();
  return queryString ? `/api/products?${queryString}` : '/api/products';
}

export function useProducts(filters: ProductFilters = {}) {
  const queryKey = ['products', filters];
  const queryFn = () => apiClient.get<ProductsResponse>(buildQueryString(filters));

  return useQuery({
    queryKey,
    queryFn,
  });
}
