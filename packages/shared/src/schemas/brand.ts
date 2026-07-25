import { z } from 'zod';

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  notes: z.string().optional(),
});

export const createBrandInput = brandSchema;

export const updateBrandInput = brandSchema.partial();

export const brandResponse = brandSchema.extend({
  id: z.string().uuid(),
});

export type BrandSchema = z.infer<typeof brandSchema>;
export type CreateBrandInput = z.infer<typeof createBrandInput>;
export type UpdateBrandInput = z.infer<typeof updateBrandInput>;
export type BrandResponse = z.infer<typeof brandResponse>;
