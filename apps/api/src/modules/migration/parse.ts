/**
 * Excel parsing: read workbook, detect sheet types by name and headers.
 */

export type SheetType = 'oil-brand' | 'battery' | 'filter' | 'general';

const OIL_SHEETS = new Set([
  'VALVOLINE', 'TOTAL', 'MOBIL', 'CASTROL', 'ELF', 'SHELL', 'YPF',
  'MOTUL', 'TUTELA', 'BARDAHL', 'LIQUI MOLY', 'QUIMBAT',
]);

const FILTER_SHEETS = new Set([
  'FILTROS ORIGINALES', 'MASTERFILT', 'FAP', 'TECNECO', 'FARO ', 'FRAM',
  'GULF', 'MANN FILTER', 'DM', 'PUMA', 'WEGA', 'MARENO', 'FARO',
]);

export function detectSheetType(sheetName: string, headers: string[]): SheetType {
  const name = sheetName.trim().toUpperCase();
  const normalized = headers.map((h) => h.toUpperCase().trim());

  if (name === 'BATERIA') return 'battery';
  if (OIL_SHEETS.has(sheetName.trim())) return 'oil-brand';
  if (FILTER_SHEETS.has(sheetName.trim())) return 'filter';

  // Header fallback
  if (normalized.some((h) => h.includes('CCA') && h.includes('VOLTAJE'))) return 'battery';
  if (normalized.some((h) => h === 'LTS' || h === 'LTS.' || h.includes('CAPACIDAD'))) return 'oil-brand';
  if (normalized.some((h) => h.includes('CÓDIGO') || h.includes('CODIGO') || h.includes('ARTICULO'))) return 'filter';

  return 'general';
}

/**
 * Map raw xlsx rows to normalized { name, capacity, price, code, ... } per sheet type.
 * Each sheet type has a known column layout.
 */
export function mapOilRow(rowVals: string[], sheetName: string): Record<string, string> | null {
  // Oil sheets: col0=product name, col1-2=capacity, cols 3+=prices/discounts
  const name = (rowVals[0] || '').trim();
  if (!name || name === 'DETALLE' || name === '+') return null;

  const capacity = (rowVals[1] || rowVals[2] || '').trim();
  // Find the first price-like value (numeric with > 2 digits in rowVals[4..8])
  const priceVals = rowVals.slice(2).filter(v => /^\d{3,}$/.test(v.replace(/[,.]/g, '')));
  const price = priceVals.length > 0 ? priceVals[0] : '0';

  return { name, capacity, brand: sheetName.trim(), price, code: '', viscosity: name.replace(/^.*?(\d+w\d+).*$/i, '$1') };
}

export function mapFilterRow(rowVals: string[], sheetName: string): Record<string, string> | null {
  // Filter sheets: col0=code, col1+=description/cross-refs
  const code = (rowVals[0] || '').trim();
  if (!code || code === 'CODIGO' || code === 'COD.' || code === 'Codigo Producto') return null;

  // Find the first description-like column that isn't a code
  const name = (rowVals[1] || rowVals[2] || code).trim();
  // Find first price
  const priceVals = rowVals.slice(2).filter(v => /^\d{3,}$/.test(v.replace(/[,.]/g, '')));
  const price = priceVals.length > 0 ? priceVals[0] : '0';

  return { name, code, brand: sheetName.trim(), price, capacity: '' };
}

export function mapBatteryRow(rowVals: string[], sheetName: string): Record<string, string> | null {
  // Battery: UB model, specs, price
  const name = (rowVals[0] || '').trim();
  if (!name || name === 'BATERIAS WILLARD') return null;
  const priceVals = rowVals.slice(2).filter(v => /^\d{3,}$/.test(v.replace(/[,.]/g, '')));
  return { name, brand: 'WILLARD', price: priceVals[0] || '0', code: name, capacity: (rowVals[1] || '').trim() };
}

export function mapGeneralRow(rowVals: string[]): Record<string, string> | null {
  const name = (rowVals[0] || '').trim();
  if (!name || name.length < 3) return null;
  const priceVals = rowVals.slice(1).filter(v => /^\d{3,}$/.test(v.replace(/[,.]/g, '')));
  return { name, brand: '', price: priceVals[0] || '0', code: '', capacity: '' };
}

export async function parseWorkbook(buffer: Buffer): Promise<
  Array<{
    sheetName: string;
    sheetType: SheetType;
    headers: string[];
    rows: Record<string, string>[];
  }>
> {
  const XLSX = await import('xlsx');
  const workbook = XLSX.read(buffer, { type: 'buffer' });

  return workbook.SheetNames.map((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    // Get ALL data as arrays (no header mapping)
    const range = XLSX.utils.decode_range(sheet['!ref'] || 'A1');
    const rawRows: string[][] = [];
    for (let r = range.s.r + 2; r <= range.e.r; r++) { // skip first 2 rows (title/header)
      const rowVals: string[] = [];
      for (let c = range.s.c; c <= range.e.c; c++) {
        const cell = sheet[XLSX.utils.encode_cell({ r, c })];
        rowVals.push(cell ? String(cell.v).trim() : '');
      }
      // Skip empty rows
      if (rowVals.some(v => v.length > 0)) {
        rawRows.push(rowVals);
      }
    }

    const headers = rawRows.length > 0 ? rawRows[0] : [];
    const sheetType = detectSheetType(sheetName, headers);

    // Map rows based on type
    let rows: Record<string, string>[];
    if (sheetType === 'oil-brand') {
      rows = rawRows.map(r => mapOilRow(r, sheetName)).filter(Boolean) as Record<string, string>[];
    } else if (sheetType === 'filter') {
      rows = rawRows.map(r => mapFilterRow(r, sheetName)).filter(Boolean) as Record<string, string>[];
    } else if (sheetType === 'battery') {
      rows = rawRows.map(r => mapBatteryRow(r, sheetName)).filter(Boolean) as Record<string, string>[];
    } else {
      rows = rawRows.map(r => mapGeneralRow(r)).filter(Boolean) as Record<string, string>[];
    }

    return { sheetName, sheetType, headers, rows };
  });
}
