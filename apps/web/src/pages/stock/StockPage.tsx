import { useState } from 'react';
import { useStockBalance, useStockMovements, useCreateMovement } from '../../hooks/useStock';
import { useProducts } from '../../hooks/useProducts';
import { AlertTriangle, ArrowDownCircle, ArrowUpCircle, RefreshCw } from 'lucide-react';

type Tab = 'movement' | 'log' | 'balance';

export function StockPage() {
  const [activeTab, setActiveTab] = useState<Tab>('movement');

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Stock Management</h1>

      <div className="border-b border-gray-200">
        <nav className="flex space-x-4">
          <button
            onClick={() => setActiveTab('movement')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'movement'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            New Movement
          </button>
          <button
            onClick={() => setActiveTab('log')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'log'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Movement Log
          </button>
          <button
            onClick={() => setActiveTab('balance')}
            className={`py-2 px-4 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'balance'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Stock Balance
          </button>
        </nav>
      </div>

      {activeTab === 'movement' && <MovementForm />}
      {activeTab === 'log' && <MovementLog />}
      {activeTab === 'balance' && <StockBalance />}
    </div>
  );
}

function MovementForm() {
  const [productId, setProductId] = useState('');
  const [movementType, setMovementType] = useState<'entry' | 'exit' | 'adjustment'>('entry');
  const [quantity, setQuantity] = useState('');
  const [unitPrice, setUnitPrice] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const { data: productsData } = useProducts({ limit: 100 });
  const createMovement = useCreateMovement();
  const products = productsData?.data || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await createMovement.mutateAsync({
        productId,
        movementType,
        quantity: parseInt(quantity, 10),
        unitPrice: unitPrice ? parseFloat(unitPrice) : undefined,
        reference: reference || undefined,
        notes: notes || undefined,
      });
      setSuccessMessage('Movement recorded successfully');
      setQuantity('');
      setUnitPrice('');
      setReference('');
      setNotes('');
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to record movement');
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Record Stock Movement</h2>

      {successMessage && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {successMessage}
        </div>
      )}

      {errorMessage && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {errorMessage}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="productId" className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <select
              id="productId"
              required
              value={productId}
              onChange={(e) => setProductId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a product...</option>
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="movementType" className="block text-sm font-medium text-gray-700 mb-1">
              Movement Type *
            </label>
            <select
              id="movementType"
              required
              value={movementType}
              onChange={(e) => setMovementType(e.target.value as 'entry' | 'exit' | 'adjustment')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="entry">Entry (stock in)</option>
              <option value="exit">Exit (stock out)</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-gray-700 mb-1">
              {movementType === 'adjustment' ? 'Target Stock Value *' : 'Quantity *'}
            </label>
            <input
              id="quantity"
              type="number"
              required
              min={movementType === 'adjustment' ? 0 : 1}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {movementType === 'entry' && (
            <div>
              <label htmlFor="unitPrice" className="block text-sm font-medium text-gray-700 mb-1">
                Unit Price
              </label>
              <input
                id="unitPrice"
                type="number"
                step="0.01"
                min="0"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          <div>
            <label htmlFor="reference" className="block text-sm font-medium text-gray-700 mb-1">
              Reference
            </label>
            <input
              id="reference"
              type="text"
              maxLength={100}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="md:col-span-2">
            <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              id="notes"
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={createMovement.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
          >
            {createMovement.isPending ? 'Recording...' : 'Record Movement'}
          </button>
        </div>
      </form>
    </div>
  );
}

function MovementLog() {
  const [movementType, setMovementType] = useState<string>('');
  const [from, setFrom] = useState('');
  const [to, setTo] = useState('');
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useStockMovements({
    movementType: movementType as 'entry' | 'exit' | 'adjustment' | undefined || undefined,
    from: from || undefined,
    to: to || undefined,
    page,
    limit: 20,
  });

  const movements = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label htmlFor="filterType" className="block text-xs font-medium text-gray-500 mb-1">
              Type
            </label>
            <select
              id="filterType"
              value={movementType}
              onChange={(e) => { setMovementType(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">All types</option>
              <option value="entry">Entry</option>
              <option value="exit">Exit</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>
          <div>
            <label htmlFor="filterFrom" className="block text-xs font-medium text-gray-500 mb-1">
              From
            </label>
            <input
              id="filterFrom"
              type="date"
              value={from}
              onChange={(e) => { setFrom(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="filterTo" className="block text-xs font-medium text-gray-500 mb-1">
              To
            </label>
            <input
              id="filterTo"
              type="date"
              value={to}
              onChange={(e) => { setTo(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      {isLoading && <div className="p-8 text-center text-gray-500">Loading movements...</div>}

      {error && (
        <div className="p-8 text-center text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && movements.length === 0 && (
        <div className="p-8 text-center text-gray-500">No movements found</div>
      )}

      {!isLoading && movements.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Qty</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reference</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">User</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {movements.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(m.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.productName}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <MovementTypeBadge type={m.movementType} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {m.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.reference || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {m.username}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function StockBalance() {
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [page, setPage] = useState(1);

  const { data, isLoading, error } = useStockBalance({
    lowStock: showLowStockOnly || undefined,
    page,
    limit: 20,
  });

  const items = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={showLowStockOnly}
            onChange={(e) => { setShowLowStockOnly(e.target.checked); setPage(1); }}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm text-gray-700">Show low stock only</span>
        </label>
      </div>

      {isLoading && <div className="p-8 text-center text-gray-500">Loading stock balance...</div>}

      {error && (
        <div className="p-8 text-center text-red-600">
          Error: {error instanceof Error ? error.message : 'Unknown error'}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="p-8 text-center text-gray-500">
          {showLowStockOnly ? 'No low stock items' : 'No stock data'}
        </div>
      )}

      {!isLoading && items.length > 0 && (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Brand</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Current Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Threshold</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => {
                  const isLow = item.currentStock <= item.minStockThreshold;
                  return (
                    <tr key={item.productId} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.productName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.brandName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.currentStock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {item.minStockThreshold}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {isLow ? (
                          <span className="inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span>Low Stock</span>
                          </span>
                        ) : (
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            OK
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <div className="text-sm text-gray-700">
              Page {pagination.page} of {pagination.totalPages}
            </div>
            <div className="flex space-x-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={pagination.page <= 1}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={pagination.page >= pagination.totalPages}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function MovementTypeBadge({ type }: { type: string }) {
  const config = {
    entry: { icon: ArrowDownCircle, color: 'text-green-600 bg-green-50', label: 'Entry' },
    exit: { icon: ArrowUpCircle, color: 'text-red-600 bg-red-50', label: 'Exit' },
    adjustment: { icon: RefreshCw, color: 'text-yellow-600 bg-yellow-50', label: 'Adjustment' },
  };

  const { icon: Icon, color, label } = config[type as keyof typeof config] || config.entry;

  return (
    <span className={`inline-flex items-center space-x-1 px-2 py-1 text-xs font-semibold rounded-full ${color}`}>
      <Icon className="w-3 h-3" />
      <span>{label}</span>
    </span>
  );
}
