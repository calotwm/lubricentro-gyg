import { z } from 'zod';

export const MOVEMENT_TYPES = ['entry', 'exit', 'adjustment'] as const;

export const stockMovementSchema = z.object({
  productId: z.string().uuid(),
  movementType: z.enum(MOVEMENT_TYPES),
  quantity: z.number().int().refine((val) => val !== 0, {
    message: 'Quantity must not be zero',
  }),
  unitPrice: z.number().min(0).optional(),
  reference: z.string().max(100).optional(),
  notes: z.string().optional(),
  userId: z.string().uuid(),
});

export const createMovementInput = stockMovementSchema.omit({
  productId: true,
  userId: true,
});

export const movementResponse = stockMovementSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
});

export const stockFilterSchema = z.object({
  lowStock: z.boolean().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const movementFilterSchema = z.object({
  productId: z.string().uuid().optional(),
  movementType: z.enum(MOVEMENT_TYPES).optional(),
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export type StockMovementSchema = z.infer<typeof stockMovementSchema>;
export type CreateMovementInput = z.infer<typeof createMovementInput>;
export type MovementResponse = z.infer<typeof movementResponse>;
export type StockFilterSchema = z.infer<typeof stockFilterSchema>;
export type MovementFilterSchema = z.infer<typeof movementFilterSchema>;
