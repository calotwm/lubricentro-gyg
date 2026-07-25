import { z } from 'zod';

export const movementReportFilterSchema = z.object({
  from: z.coerce.date().optional(),
  to: z.coerce.date().optional(),
  groupBy: z.enum(['day', 'week', 'month']).default('day'),
  productId: z.string().uuid().optional(),
  brandId: z.string().uuid().optional(),
  movementType: z.enum(['entry', 'exit', 'adjustment']).optional(),
});

export const valuationFilterSchema = z.object({
  brandId: z.string().uuid().optional(),
});

export const reportMovementRow = z.object({
  date: z.string(),
  productId: z.string().uuid(),
  productName: z.string(),
  brandName: z.string(),
  movementType: z.string(),
  totalQuantity: z.number(),
  totalValue: z.number(),
});

export const valuationRow = z.object({
  brandId: z.string().uuid(),
  brandName: z.string(),
  totalProducts: z.number(),
  totalStock: z.number(),
  totalValue: z.number(),
});

export const valuationSummary = z.object({
  brands: z.array(valuationRow),
  grandTotal: z.number(),
});

export type MovementReportFilter = z.infer<typeof movementReportFilterSchema>;
export type ValuationFilter = z.infer<typeof valuationFilterSchema>;
export type ReportMovementRow = z.infer<typeof reportMovementRow>;
export type ValuationRow = z.infer<typeof valuationRow>;
export type ValuationSummary = z.infer<typeof valuationSummary>;
