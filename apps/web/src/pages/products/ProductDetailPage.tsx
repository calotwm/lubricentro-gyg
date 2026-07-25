import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';
import { ArrowLeft, Edit, AlertTriangle } from 'lucide-react';

type Product = {
  id: string;
  name: string;
  brandId: string;
  categoryId: string;
  code?: string | null;
  description?: string;
  productType: string;
  viscosity?: string | null;
  capacity?: string | null;
  specifications?: {
    cca?: number;
    voltage?: number;
    ah?: number;
    dimensions?: string;
  };
  currentStock: number;
  minStockThreshold: number;
  isActive: boolean;
};

type Price = {
  id: string;
  productId: string;
  priceType: string;
  price: number;
  discountPct?: number;
  effectiveFrom: string;
  effectiveTo?: string | null;
  notes?: string;
};

export function ProductDetailPage() {
  const { id } = useParams<{ id: string }>();
  const queryClient = useQueryClient();
  const [showPriceForm, setShowPriceForm] = useState(false);
  const [newPrice, setNewPrice] = useState({
    priceType: 'list',
    price: '',
    discountPct: '',
    notes: '',
  });

  const { data: product, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get<Product>(`/api/products/${id}`),
  });

  const { data: prices = [] } = useQuery({
    queryKey: ['product-prices', id],
    queryFn: () => apiClient.get<Price[]>(`/api/products/${id}/prices`),
  });

  const priceMutation = useMutation({
    mutationFn: (data: unknown) => apiClient.post(`/api/products/${id}/prices`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['product-prices', id] });
      setShowPriceForm(false);
      setNewPrice({ priceType: 'list', price: '', discountPct: '', notes: '' });
    },
  });

  const handleSetPrice = (e: React.FormEvent) => {
    e.preventDefault();
    priceMutation.mutate({
      priceType: newPrice.priceType,
      price: parseFloat(newPrice.price),
      discountPct: newPrice.discountPct ? parseFloat(newPrice.discountPct) : undefined,
      notes: newPrice.notes || undefined,
      effectiveFrom: new Date().toISOString(),
    });
  };

  if (isLoadingProduct) {
    return <div className="p-8 text-center">Loading product...</div>;
  }

  if (!product) {
    return <div className="p-8 text-center text-red-600">Product not found</div>;
  }

  const isLowStock = product.currentStock <= product.minStockThreshold;
  const currentPrices = prices.filter((p) => !p.effectiveTo);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            to="/products"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">{product.name}</h1>
        </div>
        <Link
          to={`/products/${id}/edit`}
          className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Edit className="w-4 h-4" />
          <span>Edit</span>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h2>
          <dl className="space-y-3">
            <div>
              <dt className="text-sm font-medium text-gray-500">Type</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.productType}</dd>
            </div>
            {product.code && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Code</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.code}</dd>
              </div>
            )}
            {product.description && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Description</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.description}</dd>
              </div>
            )}
            {product.viscosity && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Viscosity</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.viscosity}</dd>
              </div>
            )}
            {product.capacity && (
              <div>
                <dt className="text-sm font-medium text-gray-500">Capacity</dt>
                <dd className="mt-1 text-sm text-gray-900">{product.capacity}</dd>
              </div>
            )}
            {product.specifications && (
              <>
                {product.specifications.cca !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">CCA</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.specifications.cca}</dd>
                  </div>
                )}
                {product.specifications.voltage !== undefined && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Voltage</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.specifications.voltage}V</dd>
                  </div>
                )}
                {product.specifications.dimensions && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Dimensions</dt>
                    <dd className="mt-1 text-sm text-gray-900">{product.specifications.dimensions}</dd>
                  </div>
                )}
              </>
            )}
            <div>
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1">
                <span
                  className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.isActive
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {product.isActive ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>

        <div className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Stock Balance</h2>
          <div className="space-y-4">
            <div>
              <dt className="text-sm font-medium text-gray-500">Current Stock</dt>
              <dd className="mt-1 text-3xl font-bold text-gray-900">{product.currentStock}</dd>
            </div>
            <div>
              <dt className="text-sm font-medium text-gray-500">Min Threshold</dt>
              <dd className="mt-1 text-sm text-gray-900">{product.minStockThreshold}</dd>
            </div>
            {isLowStock && (
              <div className="flex items-center space-x-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <span className="text-sm text-yellow-800 font-medium">Low Stock</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white shadow-md rounded-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Current Prices</h2>
          <button
            onClick={() => setShowPriceForm(!showPriceForm)}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Set Price
          </button>
        </div>

        {showPriceForm && (
          <form onSubmit={handleSetPrice} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="priceType" className="block text-sm font-medium text-gray-700 mb-1">
                  Price Type
                </label>
                <select
                  id="priceType"
                  value={newPrice.priceType}
                  onChange={(e) => setNewPrice({ ...newPrice, priceType: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="list">List</option>
                  <option value="cost">Cost</option>
                  <option value="mechanic">Mechanic</option>
                  <option value="card">Card</option>
                </select>
              </div>
              <div>
                <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
                  Price *
                </label>
                <input
                  id="price"
                  type="number"
                  step="0.01"
                  required
                  value={newPrice.price}
                  onChange={(e) => setNewPrice({ ...newPrice, price: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="discountPct" className="block text-sm font-medium text-gray-700 mb-1">
                  Discount %
                </label>
                <input
                  id="discountPct"
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={newPrice.discountPct}
                  onChange={(e) => setNewPrice({ ...newPrice, discountPct: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                  Notes
                </label>
                <input
                  id="notes"
                  type="text"
                  value={newPrice.notes}
                  onChange={(e) => setNewPrice({ ...newPrice, notes: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setShowPriceForm(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={priceMutation.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {priceMutation.isPending ? 'Saving...' : 'Save Price'}
              </button>
            </div>
          </form>
        )}

        {currentPrices.length === 0 ? (
          <div className="text-center py-8 text-gray-500">No prices set yet</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Discount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Effective
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {currentPrices.map((price) => (
                  <tr key={price.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {price.priceType}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      ${price.price.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {price.discountPct ? `${price.discountPct}%` : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(price.effectiveFrom).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
