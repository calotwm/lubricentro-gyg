import { z } from 'zod';

export const CATEGORY_NAMES = [
  'motor-oil',
  'filter',
  'battery',
  'general',
] as const;

export const categorySchema = z.object({
  name: z.enum(CATEGORY_NAMES),
  config: z
    .object({
      fields: z.array(z.string()).optional(),
      stockTracked: z.boolean().optional(),
    })
    .optional(),
});

export const createCategoryInput = categorySchema;

export const categoryResponse = categorySchema.extend({
  id: z.string().uuid(),
});

export type CategorySchema = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategoryInput>;
export type CategoryResponse = z.infer<typeof categoryResponse>;
