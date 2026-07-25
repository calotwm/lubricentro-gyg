import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../api/client';

type StockBalanceItem = {
  productId: string;
  productName: string;
  brandName: string;
  categoryName: string;
  currentStock: number;
  minStockThreshold: number;
};

type Movement = {
  id: string;
  productId: string;
  productName: string;
  movementType: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  unitPrice: number | null;
  reference: string | null;
  notes: string | null;
  username: string;
  createdAt: string;
};

type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

type StockFilters = {
  lowStock?: boolean;
  page?: number;
  limit?: number;
};

type MovementFilters = {
  productId?: string;
  movementType?: 'entry' | 'exit' | 'adjustment';
  from?: string;
  to?: string;
  page?: number;
  limit?: number;
};

type CreateMovementData = {
  productId: string;
  movementType: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
};

function buildStockQuery(filters: StockFilters): string {
  const params = new URLSearchParams();
  if (filters.lowStock) params.append('lowStock', 'true');
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return qs ? `/api/stock?${qs}` : '/api/stock';
}

function buildMovementQuery(filters: MovementFilters): string {
  const params = new URLSearchParams();
  if (filters.productId) params.append('productId', filters.productId);
  if (filters.movementType) params.append('movementType', filters.movementType);
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.page) params.append('page', filters.page.toString());
  if (filters.limit) params.append('limit', filters.limit.toString());
  const qs = params.toString();
  return qs ? `/api/stock/movements?${qs}` : '/api/stock/movements';
}

export function useStockBalance(filters: StockFilters = {}) {
  return useQuery({
    queryKey: ['stock-balance', filters],
    queryFn: () => apiClient.get<PaginatedResponse<StockBalanceItem>>(buildStockQuery(filters)),
  });
}

export function useStockMovements(filters: MovementFilters = {}) {
  return useQuery({
    queryKey: ['stock-movements', filters],
    queryFn: () => apiClient.get<PaginatedResponse<Movement>>(buildMovementQuery(filters)),
  });
}

export function useCreateMovement() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateMovementData) =>
      apiClient.post('/api/stock/movements', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stock-balance'] });
      queryClient.invalidateQueries({ queryKey: ['stock-movements'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['product'] });
    },
  });
}

export function useLowStock() {
  return useStockBalance({ lowStock: true, limit: 100 });
}
