import { z } from 'zod';

export const PRICE_TYPES = ['list', 'cost', 'mechanic', 'card'] as const;

export const productPriceSchema = z.object({
  productId: z.string().uuid(),
  priceType: z.enum(PRICE_TYPES),
  price: z.number().positive('Price must be greater than 0'),
  discountPct: z.number().min(0).max(100).optional(),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().optional(),
  notes: z.string().optional(),
});

export const createPriceInput = productPriceSchema.omit({ productId: true });

export const priceResponse = productPriceSchema.extend({
  id: z.string().uuid(),
});

export type ProductPriceSchema = z.infer<typeof productPriceSchema>;
export type CreatePriceInput = z.infer<typeof createPriceInput>;
export type PriceResponse = z.infer<typeof priceResponse>;
