export interface PaginationParams {
  page: number;
  limit: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export function calculateOffset(params: PaginationParams): number {
  return (params.page - 1) * params.limit;
}

export function buildPaginationMeta(
  params: PaginationParams,
  total: number,
): PaginationMeta {
  return {
    page: params.page,
    limit: params.limit,
    total,
    totalPages: Math.ceil(total / params.limit),
  };
}

export function paginateResponse<T>(
  data: T[],
  params: PaginationParams,
  total: number,
): PaginatedResponse<T> {
  return {
    data,
    meta: buildPaginationMeta(params, total),
  };
}
