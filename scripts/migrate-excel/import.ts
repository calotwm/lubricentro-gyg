/**
 * CLI: Import validated rows into the database.
 * Usage: tsx scripts/migrate-excel/import.ts <path-to-excel>
 *
 * Full pipeline: parse → clean → validate → import.
 */
import { readFileSync } from 'node:fs';
import { parseWorkbook } from '../../apps/api/src/modules/migration/parse.js';
import { cleanRows } from '../../apps/api/src/modules/migration/clean.js';
import { validateRows } from '../../apps/api/src/modules/migration/validate.js';
import { importRows } from '../../apps/api/src/modules/migration/import.js';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx scripts/migrate-excel/import.ts <path-to-excel>');
    process.exit(1);
  }

  console.log('Reading Excel file...');
  const buffer = readFileSync(filePath);

  console.log('Parsing workbook...');
  const sheets = await parseWorkbook(buffer);

  const validatedSheets: Array<{
    sheetName: string;
    sheetType: any;
    rows: Record<string, string>[];
  }> = [];

  let totalErrors = 0;

  for (const sheet of sheets) {
    console.log(`  Processing "${sheet.sheetName}" (${sheet.sheetType})...`);

    const cleaned = cleanRows(sheet.rows);
    const normalized = cleaned.map((row) => {
      const n: Record<string, string> = {};
      for (const [k, v] of Object.entries(row)) {
        n[k.toLowerCase().replace(/\s+/g, '_')] = v;
        n[k] = v;
      }
      return n;
    });

    const validation = validateRows(normalized, sheet.sheetType);
    totalErrors += validation.errors.length;

    if (validation.valid.length > 0) {
      validatedSheets.push({
        sheetName: sheet.sheetName,
        sheetType: sheet.sheetType,
        rows: validation.valid,
      });
    }
  }

  console.log(`\nValidation complete. ${totalErrors} errors found.`);
  console.log(`Importing ${validatedSheets.reduce((s, sh) => s + sh.rows.length, 0)} rows...\n`);

  const result = await importRows(validatedSheets);

  console.log('Import complete:');
  console.log(`  Sheets processed: ${result.sheetsProcessed}`);
  console.log(`  Rows imported: ${result.rowsImported}`);
  console.log(`  Errors: ${result.errors.length}`);
  console.log(`  Warnings: ${result.warnings.length}`);

  if (result.errors.length > 0) {
    console.log('\nErrors:');
    for (const err of result.errors.slice(0, 20)) {
      console.log(`  [${err.sheet} row ${err.row}] ${err.field}: ${err.message}`);
    }
    if (result.errors.length > 20) {
      console.log(`  ... and ${result.errors.length - 20} more`);
    }
  }

  if (result.warnings.length > 0) {
    console.log('\nWarnings:');
    for (const w of result.warnings.slice(0, 10)) {
      console.log(`  ${w}`);
    }
  }
}

main().catch((err) => {
  console.error('Import failed:', err.message);
  process.exit(1);
});
