import {
  findAll,
  findById,
  create,
  update,
  remove,
  hasStockMovements,
  findByCode,
  type ProductFilters,
} from './repository.js';
import { AppError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { paginateResponse } from '../../lib/pagination.js';

export async function listProducts(filters: ProductFilters, pagination: PaginationParams) {
  const { data, total } = await findAll(filters, pagination);
  return paginateResponse(data, pagination, total);
}

export async function getProduct(id: string) {
  const product = await findById(id);
  if (!product) {
    throw AppError.notFound('Product not found');
  }
  return product;
}

export async function createProduct(data: Parameters<typeof create>[0]) {
  // Check for duplicate code
  if (data.code) {
    const existing = await findByCode(data.code);
    if (existing) {
      throw AppError.conflict(`Product code '${data.code}' already exists`);
    }
  }

  return create(data);
}

export async function updateProduct(id: string, data: Parameters<typeof update>[1]) {
  const existing = await findById(id);
  if (!existing) {
    throw AppError.notFound('Product not found');
  }

  // Check for duplicate code if code is being updated
  if (data.code && data.code !== existing.code) {
    const withCode = await findByCode(data.code);
    if (withCode) {
      throw AppError.conflict(`Product code '${data.code}' already exists`);
    }
  }

  const updated = await update(id, data);
  return updated;
}

export async function deleteProduct(id: string) {
  const existing = await findById(id);
  if (!existing) {
    throw AppError.notFound('Product not found');
  }

  const hasMovements = await hasStockMovements(id);
  if (hasMovements) {
    throw AppError.conflict(
      'Cannot delete product — stock movements exist. Deactivate instead',
    );
  }

  await remove(id);
}
