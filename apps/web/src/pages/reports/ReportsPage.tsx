import { useState } from 'react';
import { useMovementReport, useValuation } from '../../hooks/useReports';
import { Download } from 'lucide-react';

type Tab = 'movements' | 'valuation';

export function ReportsPage() {
  const [activeTab, setActiveTab] = useState<Tab>('movements');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Reports</h1>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('movements')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'movements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Movement Report
          </button>
          <button
            onClick={() => setActiveTab('valuation')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'valuation'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stock Valuation
          </button>
        </nav>
      </div>

      {activeTab === 'movements' && <MovementReport />}
      {activeTab === 'valuation' && <ValuationReport />}
    </div>
  );
}

function MovementReport() {
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [groupBy, setGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [movementType, setMovementType] = useState<string>('');

  const { data, isLoading, error } = useMovementReport({
    from: from || undefined,
    to: to || undefined,
    groupBy,
    movementType: movementType as 'entry' | 'exit' | 'adjustment' | undefined || undefined,
  });

  const rows = data?.data || [];

  const handleExportCSV = () => {
    if (rows.length === 0) return;

    const headers = ['Date', 'Product', 'Brand', 'Type', 'Quantity', 'Value'];
    const csvRows = rows.map((r) => [
      r.date,
      r.productName,
      r.brandName,
      r.movementType,
      r.totalQuantity,
      r.totalValue.toFixed(2),
    ]);

    const csv = [headers.join(','), ...csvRows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `movement-report-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="reportFrom" className="block text-xs font-medium text-gray-500 mb-1">
              From
            </label>
            <input
              id="reportFrom"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="reportTo" className="block text-xs font-medium text-gray-500 mb-1">
              To
            </label>
            <input
              id="reportTo"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="reportGroupBy" className="block text-xs font-medium text-gray-500 mb-1">
              Group By
            </label>
            <select
              id="reportGroupBy"
              value={groupBy}
              onChange={(e) => setGroupBy(e.target.value as 'day' | 'week' | 'month')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="day">Day</option>
              <option value="week">Week</option>
              <option value="month">Month</option>
            </select>
          </div>
          <div>
            <label htmlFor="reportType" className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              id="reportType"
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All types</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 flex justify-end">
        <button
          onClick={handleExportCSV}
          disabled={rows.length === 0}
          className="flex items-center space-x-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
        >
          <Download className="w-4 h-4" />
          <span>Export CSV</span>
        </button>
      </div>

      {isLoading && <div className="p-8 text-center text-gray-500">Loading report...</div>}

      {error && (
        <div className="p-8 text-center text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && rows.length === 0 && (
        <div className="p-8 text-center text-gray-500">No movements found for the selected filters</div>
      )}

      {!isLoading && rows.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Quantity</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rows.map((row, i) => (
                <tr key={i} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.date}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.productName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{row.brandName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{row.movementType}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">{row.totalQuantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">${row.totalValue.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ValuationReport() {
  const { data, isLoading, error } = useValuation();

  const brands = data?.brands || [];
  const grandTotal = data?.grandTotal || 0;

  return (
    <div className="bg-white rounded-lg shadow">
      {isLoading && <div className="p-8 text-center text-gray-500">Loading valuation...</div>}

      {error && (
        <div className="p-8 text-center text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && brands.length === 0 && (
        <div className="p-8 text-center text-gray-500">No valuation data available</div>
      )}

      {!isLoading && brands.length > 0 && (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Products</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Stock</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Value</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {brands.map((brand) => (
                <tr key={brand.brandId} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {brand.brandName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {brand.totalProducts}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    {brand.totalStock}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-900">
                    ${brand.totalValue.toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">
                  Grand Total
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {brands.reduce((sum, b) => sum + b.totalProducts, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  {brands.reduce((sum, b) => sum + b.totalStock, 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                  ${grandTotal.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  );
}
