/**
 * Data cleaning: normalize separators, strip whitespace, skip error rows.
 */

/**
 * Clean a single row: strip whitespace, normalize decimal separators, skip #REF! rows.
 * Returns null if the row should be skipped.
 */
export function cleanRow(row: Record<string, string>): Record<string, string> | null {
  const cleaned: Record<string, string> = {};

  for (const [key, value] of Object.entries(row)) {
    const strValue = value ?? '';

    // Skip rows with #REF! errors in any field
    if (strValue.includes('#REF!')) {
      return null;
    }

    // Strip whitespace
    let normalized = strValue.trim();

    // Normalize decimal separators: remove thousand separators (dots before comma),
    // then replace comma with dot
    // Pattern: "1.234,56" → "1234.56"
    if (normalized.includes(',') && normalized.includes('.')) {
      // Check if comma is the decimal separator (European style)
      const lastComma = normalized.lastIndexOf(',');
      const lastDot = normalized.lastIndexOf('.');
      if (lastComma > lastDot) {
        // European: dots are thousands, comma is decimal
        normalized = normalized.replace(/\./g, '').replace(',', '.');
      }
    } else if (normalized.includes(',') && !normalized.includes('.')) {
      // Only comma — treat as decimal separator
      normalized = normalized.replace(',', '.');
    }

    cleaned[key] = normalized;
  }

  // Skip rows with empty name (check common name fields)
  const name = cleaned['name'] || cleaned['PRODUCTO'] || cleaned['Nombre'] || '';
  if (!name || name.trim() === '') {
    return null;
  }

  return cleaned;
}

/**
 * Clean multiple rows, filtering out invalid/skipped rows.
 */
export function cleanRows(rows: Record<string, string>[]): Record<string, string>[] {
  const result: Record<string, string>[] = [];

  for (const row of rows) {
    const cleaned = cleanRow(row);
    if (cleaned !== null) {
      result.push(cleaned);
    }
  }

  return result;
}
