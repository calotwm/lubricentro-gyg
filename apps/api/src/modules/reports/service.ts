import {
  findMovementReport,
  findValuation,
  findLowStockProducts,
  type MovementReportFilters,
} from './repository.js';

/**
 * Movement report: filtered list of stock movements with product/brand info.
 */
export async function getMovementReport(filters: MovementReportFilters) {
  const data = await findMovementReport(filters);
  return {
    data: data.map((row) => ({
      ...row,
      totalValue: parseFloat(row.totalValue as unknown as string) || 0,
    })),
  };
}

/**
 * Stock valuation: per-brand subtotals and grand total.
 */
export async function getValuation(filters: { brandId?: string }) {
  const brandRows = await findValuation(filters);

  const brands = brandRows.map((row) => ({
    brandId: row.brand_id,
    brandName: row.brand_name,
    totalProducts: row.total_products,
    totalStock: row.total_stock,
    totalValue: parseFloat(String(row.total_value)) || 0,
  }));

  const grandTotal = brands.reduce((sum, b) => sum + b.totalValue, 0);

  return { brands, grandTotal };
}

/**
 * Low-stock alert: products where current_stock <= min_stock_threshold.
 */
export async function getLowStockReport() {
  const data = await findLowStockProducts();
  return { data };
}

/**
 * CSV export of movement report.
 */
export async function getMovementReportCSV(filters: MovementReportFilters): Promise<string> {
  const data = await findMovementReport(filters);

  if (data.length === 0) {
    return 'date,product,brand,type,quantity,value\n';
  }

  const headers = Object.keys(data[0]).join(',');
  const rows = data.map((row) =>
    Object.values(row)
      .map((v) => {
        if (v === null || v === undefined) return '';
        const str = String(v);
        return str.includes(',') ? `"${str}"` : str;
      })
      .join(','),
  );

  return [headers, ...rows].join('\n');
}
