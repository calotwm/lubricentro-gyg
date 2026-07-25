import { z } from 'zod';

export const supplierSchema = z.object({
  name: z.string().min(1, 'Name is required').max(150),
  contact: z.string().max(100).optional(),
  phone: z.string().max(30).optional(),
  email: z.string().email().max(100).optional().or(z.literal('')),
  notes: z.string().optional(),
});

export const createSupplierInput = supplierSchema;

export const updateSupplierInput = supplierSchema.partial();

export const supplierResponse = supplierSchema.extend({
  id: z.string().uuid(),
});

export const productSupplierSchema = z.object({
  productId: z.string().uuid(),
  supplierId: z.string().uuid(),
  supplierCode: z.string().max(50).optional(),
  isPrimary: z.boolean().default(false),
  notes: z.string().optional(),
});

export type SupplierSchema = z.infer<typeof supplierSchema>;
export type CreateSupplierInput = z.infer<typeof createSupplierInput>;
export type UpdateSupplierInput = z.infer<typeof updateSupplierInput>;
export type SupplierResponse = z.infer<typeof supplierResponse>;
export type ProductSupplierSchema = z.infer<typeof productSupplierSchema>;
