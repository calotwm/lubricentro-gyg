/**
 * CLI: Validate rows against Zod schemas per sheet type.
 * Re-exports the validate module from the API.
 */
export { validateRow, validateRows } from '../../apps/api/src/modules/migration/validate.js';
export type { SheetType, ValidationError, ValidationResult } from '../../apps/api/src/modules/migration/validate.js';
