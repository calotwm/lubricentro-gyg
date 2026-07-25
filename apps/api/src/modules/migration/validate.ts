import { z } from 'zod';

/**
 * Row validation schemas per detected sheet type.
 * Each schema validates the cleaned row data before import.
 */

const baseRowSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  price: z.string().optional(),
  code: z.string().optional(),
  brand: z.string().optional(),
});

const oilBrandRowSchema = baseRowSchema.extend({
  viscosity: z.string().optional(),
  capacity: z.string().optional(),
});

const batteryRowSchema = baseRowSchema.extend({
  cca: z.string().optional(),
  voltage: z.string().optional(),
  ah: z.string().optional(),
  dimensions: z.string().optional(),
});

const filterRowSchema = baseRowSchema.extend({
  crossBrand: z.string().optional(),
  crossCode: z.string().optional(),
});

const generalRowSchema = baseRowSchema;

const schemas = {
  'oil-brand': oilBrandRowSchema,
  battery: batteryRowSchema,
  filter: filterRowSchema,
  general: generalRowSchema,
} as const;

export type SheetType = 'oil-brand' | 'battery' | 'filter' | 'general';

export interface ValidationError {
  row: number;
  field: string;
  message: string;
}

export interface ValidationResult {
  success: boolean;
  errors: ValidationError[];
}

/**
 * Validate a single row against the schema for its detected sheet type.
 */
export function validateRow(
  row: Record<string, string>,
  sheetType: SheetType,
  rowIndex: number,
): ValidationResult {
  const schema = schemas[sheetType];
  const errors: ValidationError[] = [];

  const result = schema.safeParse(row);

  if (!result.success) {
    for (const issue of result.error.issues) {
      errors.push({
        row: rowIndex,
        field: issue.path.join('.') || 'unknown',
        message: issue.message,
      });
    }
    return { success: false, errors };
  }

  return { success: true, errors: [] };
}

/**
 * Validate all rows, collecting errors per row without failing on first error.
 */
export function validateRows(
  rows: Record<string, string>[],
  sheetType: SheetType,
): {
  valid: Record<string, string>[];
  errors: ValidationError[];
} {
  const valid: Record<string, string>[] = [];
  const allErrors: ValidationError[] = [];

  for (let i = 0; i < rows.length; i++) {
    const result = validateRow(rows[i], sheetType, i + 1);
    if (result.success) {
      valid.push(rows[i]);
    } else {
      allErrors.push(...result.errors);
    }
  }

  return { valid, errors: allErrors };
}
