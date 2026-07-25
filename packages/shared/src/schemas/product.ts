import { z } from 'zod';

export const PRODUCT_TYPES = [
  'motor-oil',
  'filter',
  'battery',
  'general',
] as const;

export const crossRefSchema = z.object({
  brand: z.string().min(1),
  code: z.string().min(1),
});

export const specificationsSchema = z.object({
  cca: z.number().min(0),
  voltage: z.number().min(0),
  ah: z.number().min(0),
  dimensions: z.string().optional(),
});

export const baseProductSchema = z.object({
  brandId: z.string().uuid(),
  categoryId: z.string().uuid(),
  code: z.string().max(50).nullable().optional(),
  name: z.string().min(1, 'Name is required').max(200),
  description: z.string().optional(),
  capacity: z.string().max(50).optional(),
  unit: z.string().max(20).default('unit'),
  productType: z.enum(PRODUCT_TYPES),
  viscosity: z.string().optional(),
  crossRefs: z.array(crossRefSchema).optional(),
  specifications: specificationsSchema.optional(),
  extras: z.record(z.string(), z.unknown()).optional(),
  isActive: z.boolean().default(true),
  currentStock: z.number().int().min(0).default(0),
  minStockThreshold: z.number().int().min(0).default(0),
});

export const createProductInput = baseProductSchema;

export const updateProductInput = baseProductSchema.partial();

export const productResponse = baseProductSchema.extend({
  id: z.string().uuid(),
  createdAt: z.date(),
  updatedAt: z.date(),
});

export const productFilterSchema = z.object({
  brandId: z.string().uuid().optional(),
  categoryId: z.string().uuid().optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
  isActive: z.boolean().optional(),
});

export type BaseProductSchema = z.infer<typeof baseProductSchema>;
export type CreateProductInput = z.infer<typeof createProductInput>;
export type UpdateProductInput = z.infer<typeof updateProductInput>;
export type ProductResponse = z.infer<typeof productResponse>;
export type ProductFilterSchema = z.infer<typeof productFilterSchema>;
export type CrossRef = z.infer<typeof crossRefSchema>;
export type Specifications = z.infer<typeof specificationsSchema>;
