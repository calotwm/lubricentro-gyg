import { parseWorkbook, type SheetType } from './parse.js';
import { cleanRows } from './clean.js';
import { validateRows, type ValidationError } from './validate.js';
import { importRows, type ImportResult } from './import.js';

/**
 * In-memory store for the latest import status.
 * For v1, this is sufficient since imports are one-time operations.
 */
let latestImportStatus: ImportStatus | null = null;

export interface ImportStatus {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  startedAt: string;
  completedAt?: string;
  result?: ImportResult;
  error?: string;
}

/**
 * Process an Excel file upload: parse → clean → validate → import.
 */
export async function processImport(buffer: Buffer): Promise<ImportResult> {
  const importId = crypto.randomUUID();

  latestImportStatus = {
    id: importId,
    status: 'processing',
    startedAt: new Date().toISOString(),
  };

  try {
    // Step 1: Parse workbook
    const sheets = await parseWorkbook(buffer);

    if (sheets.length === 0) {
      throw new Error('No sheets found in the Excel file');
    }

    // Step 2 & 3: Clean and validate each sheet
    const validatedSheets: Array<{
      sheetName: string;
      sheetType: SheetType;
      rows: Record<string, string>[];
    }> = [];

    const allErrors: Array<{ sheet: string; row: number; field: string; message: string }> = [];
    const allWarnings: string[] = [];

    for (const sheet of sheets) {
      // Clean rows
      const cleanedRows = cleanRows(sheet.rows);

      if (cleanedRows.length === 0) {
        allWarnings.push(`Sheet "${sheet.sheetName}": No valid rows after cleaning`);
        continue;
      }

      // Normalize keys to lowercase for consistent validation
      const normalizedRows = cleanedRows.map((row) => {
        const normalized: Record<string, string> = {};
        for (const [key, value] of Object.entries(row)) {
          normalized[key.toLowerCase().replace(/\s+/g, '_')] = value;
        }
        // Also keep original keys for flexible matching
        for (const [key, value] of Object.entries(row)) {
          normalized[key] = value;
        }
        return normalized;
      });

      // Validate rows
      const validation = validateRows(normalizedRows, sheet.sheetType);

      if (validation.errors.length > 0) {
        for (const err of validation.errors) {
          allErrors.push({
            sheet: sheet.sheetName,
            row: err.row,
            field: err.field,
            message: err.message,
          });
        }
      }

      if (validation.valid.length > 0) {
        validatedSheets.push({
          sheetName: sheet.sheetName,
          sheetType: sheet.sheetType,
          rows: validation.valid,
        });
      }
    }

    // Step 4: Import validated rows
    const result = await importRows(validatedSheets as any);

    // Merge validation errors with import errors
    result.errors.push(...allErrors);
    result.warnings.push(...allWarnings);

    latestImportStatus = {
      id: importId,
      status: 'completed',
      startedAt: latestImportStatus.startedAt,
      completedAt: new Date().toISOString(),
      result,
    };

    return result;
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);

    latestImportStatus = {
      id: importId,
      status: 'failed',
      startedAt: latestImportStatus.startedAt,
      completedAt: new Date().toISOString(),
      error: message,
    };

    throw err;
  }
}

/**
 * Get the latest import status.
 */
export function getImportStatus(): ImportStatus | null {
  return latestImportStatus;
}
