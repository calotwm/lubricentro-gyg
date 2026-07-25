import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../api/client';

type MovementReportRow = {
  date: string;
  productId: string;
  productName: string;
  brandName: string;
  movementType: string;
  totalQuantity: number;
  totalValue: number;
};

type ValuationBrand = {
  brandId: string;
  brandName: string;
  totalProducts: number;
  totalStock: number;
  totalValue: number;
};

type ValuationSummary = {
  brands: ValuationBrand[];
  grandTotal: number;
};

type LowStockItem = {
  productId: string;
  productName: string;
  brandName: string;
  currentStock: number;
  minStockThreshold: number;
};

type MovementReportFilters = {
  from?: string;
  to?: string;
  groupBy?: 'day' | 'week' | 'month';
  productId?: string;
  brandId?: string;
  movementType?: 'entry' | 'exit' | 'adjustment';
};

function buildReportQuery(filters: MovementReportFilters): string {
  const params = new URLSearchParams();
  if (filters.from) params.append('from', filters.from);
  if (filters.to) params.append('to', filters.to);
  if (filters.groupBy) params.append('groupBy', filters.groupBy);
  if (filters.productId) params.append('productId', filters.productId);
  if (filters.brandId) params.append('brandId', filters.brandId);
  if (filters.movementType) params.append('movementType', filters.movementType);
  const qs = params.toString();
  return qs ? `/api/reports/movements?${qs}` : '/api/reports/movements';
}

export function useMovementReport(filters: MovementReportFilters = {}) {
  return useQuery({
    queryKey: ['movement-report', filters],
    queryFn: () =>
      apiClient.get<{ data: MovementReportRow[] }>(buildReportQuery(filters)),
  });
}

export function useValuation(brandId?: string) {
  const params = brandId ? `?brandId=${brandId}` : '';
  return useQuery({
    queryKey: ['valuation', brandId],
    queryFn: () => apiClient.get<ValuationSummary>(`/api/reports/valuation${params}`),
  });
}

export function useLowStockReport() {
  return useQuery({
    queryKey: ['low-stock-report'],
    queryFn: () => apiClient.get<{ data: LowStockItem[] }>('/api/reports/low-stock'),
  });
}
