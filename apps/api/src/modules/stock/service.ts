import { db } from '../../db/index.js';
import { products, stockMovements } from '../../db/schema/index.js';
import { eq } from 'drizzle-orm';
import { findMovements, findStockBalance, type MovementFilters } from './repository.js';
import { AppError } from '../../lib/errors.js';
import type { PaginationParams } from '../../lib/pagination.js';
import { paginateResponse } from '../../lib/pagination.js';

export interface CreateMovementData {
  productId: string;
  movementType: 'entry' | 'exit' | 'adjustment';
  quantity: number;
  unitPrice?: number;
  reference?: string;
  notes?: string;
  userId: string;
}

/**
 * Create a stock movement with pessimistic locking (SELECT ... FOR UPDATE).
 * Ensures atomic stock updates and prevents negative stock on exits.
 */
export async function createMovement(data: CreateMovementData) {
  return db.transaction(async (tx) => {
    // Lock the product row for the duration of the transaction
    const [product] = await tx
      .select({ currentStock: products.currentStock })
      .from(products)
      .where(eq(products.id, data.productId))
      .for('update');

    if (!product) {
      throw AppError.notFound('Product not found');
    }

    let movementQuantity: number;
    let newStock: number;

    switch (data.movementType) {
      case 'entry': {
        if (data.quantity <= 0) {
          throw AppError.badRequest('Entry quantity must be positive');
        }
        movementQuantity = data.quantity;
        newStock = product.currentStock + data.quantity;
        break;
      }

      case 'exit': {
        if (data.quantity <= 0) {
          throw AppError.badRequest('Exit quantity must be positive');
        }
        if (product.currentStock < data.quantity) {
          throw AppError.unprocessable(
            `Insufficient stock. Available: ${product.currentStock}, requested: ${data.quantity}`,
          );
        }
        movementQuantity = -data.quantity;
        newStock = product.currentStock - data.quantity;
        break;
      }

      case 'adjustment': {
        if (data.quantity < 0) {
          throw AppError.badRequest('Adjustment target must be non-negative');
        }
        if (data.quantity === product.currentStock) {
          throw AppError.badRequest('Stock is already at that value');
        }
        movementQuantity = data.quantity - product.currentStock;
        newStock = data.quantity;
        break;
      }

      default:
        throw AppError.badRequest('Invalid movement type');
    }

    // Insert movement record
    const [movement] = await tx
      .insert(stockMovements)
      .values({
        productId: data.productId,
        movementType: data.movementType,
        quantity: movementQuantity,
        unitPrice: data.unitPrice?.toString(),
        reference: data.reference,
        notes: data.notes,
        userId: data.userId,
      })
      .returning();

    // Update product stock atomically
    await tx
      .update(products)
      .set({ currentStock: newStock, updatedAt: new Date() })
      .where(eq(products.id, data.productId));

    return movement;
  });
}

export async function listMovements(
  filters: MovementFilters,
  pagination: PaginationParams,
) {
  const { data, total } = await findMovements(filters, pagination);
  return paginateResponse(data, pagination, total);
}

export async function getStockBalance(
  filters: { lowStock?: boolean },
  pagination: PaginationParams,
) {
  const { data, total } = await findStockBalance(filters, pagination);
  return paginateResponse(data, pagination, total);
}
