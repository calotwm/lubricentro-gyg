/**
 * CLI: Parse Excel file and detect sheet types.
 * Usage: tsx scripts/migrate-excel/parse.ts <path-to-excel>
 */
import { readFileSync } from 'node:fs';
import { parseWorkbook, detectSheetType } from '../../apps/api/src/modules/migration/parse.js';

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error('Usage: tsx scripts/migrate-excel/parse.ts <path-to-excel>');
    process.exit(1);
  }

  const buffer = readFileSync(filePath);
  const sheets = await parseWorkbook(buffer);

  console.log(`Parsed ${sheets.length} sheets:\n`);
  for (const sheet of sheets) {
    console.log(`  ${sheet.sheetName}`);
    console.log(`    Type: ${sheet.sheetType}`);
    console.log(`    Headers: ${sheet.headers.join(', ')}`);
    console.log(`    Rows: ${sheet.rows.length}`);
    console.log();
  }
}

main().catch(console.error);

export { parseWorkbook, detectSheetType };
