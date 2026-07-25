import { db } from '../../db/index.js';
import { brands, categories, products, productPrices } from '../../db/schema/index.js';
import { eq, sql } from 'drizzle-orm';
import type { SheetType } from './parse.js';

export interface ImportRow {
  name: string;
  price?: string;
  code?: string;
  brand?: string;
  viscosity?: string;
  capacity?: string;
  cca?: string;
  voltage?: string;
  ah?: string;
  dimensions?: string;
  crossBrand?: string;
  crossCode?: string;
}

export interface ImportResult {
  sheetsProcessed: number;
  rowsImported: number;
  errors: Array<{ sheet: string; row: number; field: string; message: string }>;
  warnings: string[];
}

/**
 * Import validated rows into the database within a single transaction.
 * Creates brands/categories as needed, then products and prices.
 */
export async function importRows(
  sheets: Array<{
    sheetName: string;
    sheetType: SheetType;
    rows: ImportRow[];
  }>,
): Promise<ImportResult> {
  const result: ImportResult = {
    sheetsProcessed: 0,
    rowsImported: 0,
    errors: [],
    warnings: [],
  };

  await db.transaction(async (tx) => {
    // Cache for brand/category lookups to avoid duplicate inserts
    const brandCache = new Map<string, string>();
    const categoryCache = new Map<string, string>();

    // Pre-load existing brands and categories
    const existingBrands = await tx.select({ id: brands.id, name: brands.name }).from(brands);
    for (const b of existingBrands) {
      brandCache.set(b.name.toLowerCase(), b.id);
    }

    const existingCategories = await tx
      .select({ id: categories.id, name: categories.name })
      .from(categories);
    for (const c of existingCategories) {
      categoryCache.set(c.name.toLowerCase(), c.id);
    }

    for (const sheet of sheets) {
      result.sheetsProcessed++;

      // Determine category based on sheet type
      const categoryName = sheetTypeToCategory(sheet.sheetType);
      let categoryId = categoryCache.get(categoryName.toLowerCase());

      if (!categoryId) {
        const [newCategory] = await tx
          .insert(categories)
          .values({ name: categoryName })
          .returning({ id: categories.id });
        categoryId = newCategory.id;
        categoryCache.set(categoryName.toLowerCase(), categoryId);
      }

      for (let i = 0; i < sheet.rows.length; i++) {
        const row = sheet.rows[i];
        const rowNum = i + 1;

        try {
          // Resolve or create brand
          let brandId: string | null = null;
          const brandName = row.brand?.trim();
          if (brandName) {
            brandId = brandCache.get(brandName.toLowerCase()) ?? null;
            if (!brandId) {
              const [newBrand] = await tx
                .insert(brands)
                .values({ name: brandName })
                .returning({ id: brands.id });
              brandId = newBrand.id;
              brandCache.set(brandName.toLowerCase(), brandId);
            }
          }

          if (!brandId) {
            result.warnings.push(
              `Sheet "${sheet.sheetName}" row ${rowNum}: No brand specified, skipping`,
            );
            continue;
          }

          // Determine product type
          const productType = sheetTypeToProductType(sheet.sheetType);

          // Build product data
          const productData: Record<string, unknown> = {
            name: row.name.trim(),
            brandId,
            categoryId,
            productType,
          };

          if (row.code?.trim()) {
            productData.code = row.code.trim();
          }

          // Type-specific fields
          if (sheet.sheetType === 'oil-brand') {
            productData.viscosity = row.viscosity || null;
            productData.capacity = row.capacity || null;
          } else if (sheet.sheetType === 'battery') {
            productData.specifications = {
              cca: row.cca ? parseFloat(row.cca) : null,
              voltage: row.voltage ? parseFloat(row.voltage) : null,
              ah: row.ah ? parseFloat(row.ah) : null,
              dimensions: row.dimensions || null,
            };
          } else if (sheet.sheetType === 'filter') {
            if (row.crossBrand || row.crossCode) {
              productData.crossRefs = [
                { brand: row.crossBrand || '', code: row.crossCode || '' },
              ];
            }
          }

          // Truncate strings to column limits
          if (productData.name && typeof productData.name === 'string' && productData.name.length > 490) {
            productData.name = (productData.name as string).substring(0, 490);
          }
          if (productData.code && typeof productData.code === 'string' && (productData.code as string).length > 95) {
            productData.code = (productData.code as string).substring(0, 95);
          }
          if (productData.capacity && typeof productData.capacity === 'string' && (productData.capacity as string).length > 95) {
            productData.capacity = (productData.capacity as string).substring(0, 95);
          }
          if (productData.product_type && typeof productData.product_type === 'string' && (productData.product_type as string).length > 95) {
            productData.product_type = (productData.product_type as string).substring(0, 95);
          }

          // Check for duplicate code
          if (productData.code) {
            const [existing] = await tx
              .select({ id: products.id })
              .from(products)
              .where(eq(products.code, productData.code as string))
              .limit(1);

            if (existing) {
              result.warnings.push(
                `Sheet "${sheet.sheetName}" row ${rowNum}: Duplicate code "${productData.code}", skipping`,
              );
              continue;
            }
          }

          // Insert product
          const [newProduct] = await tx
            .insert(products)
            .values(productData as any)
            .returning({ id: products.id });

          // Insert price if present
          if (row.price) {
            const priceValue = parseFloat(row.price);
            if (!isNaN(priceValue) && priceValue > 0) {
              await tx.insert(productPrices).values({
                productId: newProduct.id,
                priceType: 'list',
                price: priceValue.toFixed(2),
                effectiveFrom: new Date().toISOString(),
              } as any);
            }
          }

          result.rowsImported++;
        } catch (err) {
          // Collect error but continue processing
          const message = err instanceof Error ? err.message : String(err);
          result.errors.push({
            sheet: sheet.sheetName,
            row: rowNum,
            field: 'unknown',
            message,
          });
        }
      }
    }

    // If there are fatal errors (e.g., DB constraint violations), the transaction
    // will be rolled back automatically. For now, we allow partial imports with warnings.
  });

  return result;
}

function sheetTypeToCategory(sheetType: SheetType): string {
  switch (sheetType) {
    case 'oil-brand':
      return 'motor-oil';
    case 'battery':
      return 'battery';
    case 'filter':
      return 'filter';
    case 'general':
    default:
      return 'general';
  }
}

function sheetTypeToProductType(sheetType: SheetType): string {
  switch (sheetType) {
    case 'oil-brand':
      return 'motor-oil';
    case 'battery':
      return 'battery';
    case 'filter':
      return 'filter';
    case 'general':
    default:
      return 'general';
  }
}
