import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../../api/client';

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
  crossRefs?: Array<{ brand: string; code: string }>;
  currentStock: number;
  minStockThreshold: number;
  isActive: boolean;
};

export function ProductFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEditing = !!id;
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState({
    name: '',
    brandId: '',
    categoryId: '',
    code: '',
    description: '',
    productType: 'general',
    viscosity: '',
    capacity: '',
    cca: '',
    voltage: '',
    ah: '',
    dimensions: '',
    currentStock: '0',
    minStockThreshold: '0',
  });

  const { data: existingProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ['product', id],
    queryFn: () => apiClient.get<Product>(`/api/products/${id}`),
    enabled: isEditing,
  });

  useEffect(() => {
    if (existingProduct) {
      setFormData({
        name: existingProduct.name,
        brandId: existingProduct.brandId,
        categoryId: existingProduct.categoryId,
        code: existingProduct.code || '',
        description: existingProduct.description || '',
        productType: existingProduct.productType,
        viscosity: existingProduct.viscosity || '',
        capacity: existingProduct.capacity || '',
        cca: existingProduct.specifications?.cca?.toString() || '',
        voltage: existingProduct.specifications?.voltage?.toString() || '',
        ah: existingProduct.specifications?.ah?.toString() || '',
        dimensions: existingProduct.specifications?.dimensions || '',
        currentStock: (existingProduct.currentStock ?? 0).toString(),
        minStockThreshold: (existingProduct.minStockThreshold ?? 0).toString(),
      });
    }
  }, [existingProduct]);

  const mutation = useMutation({
    mutationFn: (data: unknown) => {
      if (isEditing) {
        return apiClient.put(`/api/products/${id}`, data);
      }
      return apiClient.post('/api/products', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      navigate('/products');
    },
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();

    const payload: Record<string, unknown> = {
      name: formData.name,
      brandId: formData.brandId,
      categoryId: formData.categoryId,
      code: formData.code || null,
      description: formData.description,
      productType: formData.productType,
      currentStock: parseInt(formData.currentStock) || 0,
      minStockThreshold: parseInt(formData.minStockThreshold) || 0,
    };

    if (formData.productType === 'motor-oil') {
      payload.viscosity = formData.viscosity;
      payload.capacity = formData.capacity;
    }

    if (formData.productType === 'battery') {
      payload.specifications = {
        cca: parseInt(formData.cca) || 0,
        voltage: parseInt(formData.voltage) || 0,
        ah: parseInt(formData.ah) || 0,
        dimensions: formData.dimensions,
      };
    }

    mutation.mutate(payload);
  };

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  if (isEditing && isLoadingProduct) {
    return <div className="p-8 text-center">Loading product...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        {isEditing ? 'Edit Product' : 'Create Product'}
      </h1>

      <form onSubmit={handleSubmit} className="bg-white shadow-md rounded-lg p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="code" className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => updateField('code', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="brandId" className="block text-sm font-medium text-gray-700 mb-1">
              Brand ID *
            </label>
            <input
              id="brandId"
              type="text"
              required
              value={formData.brandId}
              onChange={(e) => updateField('brandId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-1">
              Category ID *
            </label>
            <input
              id="categoryId"
              type="text"
              required
              value={formData.categoryId}
              onChange={(e) => updateField('categoryId', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label htmlFor="productType" className="block text-sm font-medium text-gray-700 mb-1">
              Product Type *
            </label>
            <select
              id="productType"
              required
              value={formData.productType}
              onChange={(e) => updateField('productType', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="general">General</option>
              <option value="motor-oil">Motor Oil</option>
              <option value="filter">Filter</option>
              <option value="battery">Battery</option>
            </select>
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {formData.productType === 'motor-oil' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <h2 className="col-span-2 text-lg font-semibold text-gray-900">Oil Specifications</h2>
            <div>
              <label htmlFor="viscosity" className="block text-sm font-medium text-gray-700 mb-1">
                Viscosity
              </label>
              <input
                id="viscosity"
                type="text"
                value={formData.viscosity}
                onChange={(e) => updateField('viscosity', e.target.value)}
                placeholder="e.g., 20W-50"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="capacity" className="block text-sm font-medium text-gray-700 mb-1">
                Capacity
              </label>
              <input
                id="capacity"
                type="text"
                value={formData.capacity}
                onChange={(e) => updateField('capacity', e.target.value)}
                placeholder="e.g., 1L"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        {formData.productType === 'battery' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
            <h2 className="col-span-2 text-lg font-semibold text-gray-900">Battery Specifications</h2>
            <div>
              <label htmlFor="cca" className="block text-sm font-medium text-gray-700 mb-1">
                CCA (Cold Cranking Amps)
              </label>
              <input
                id="cca"
                type="number"
                value={formData.cca}
                onChange={(e) => updateField('cca', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="voltage" className="block text-sm font-medium text-gray-700 mb-1">
                Voltage
              </label>
              <input
                id="voltage"
                type="number"
                value={formData.voltage}
                onChange={(e) => updateField('voltage', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="ah" className="block text-sm font-medium text-gray-700 mb-1">
                AH (Amp Hours)
              </label>
              <input
                id="ah"
                type="number"
                value={formData.ah}
                onChange={(e) => updateField('ah', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label htmlFor="dimensions" className="block text-sm font-medium text-gray-700 mb-1">
                Dimensions
              </label>
              <input
                id="dimensions"
                type="text"
                value={formData.dimensions}
                onChange={(e) => updateField('dimensions', e.target.value)}
                placeholder="e.g., 242x175x190"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t">
          <div>
            <label htmlFor="currentStock" className="block text-sm font-medium text-gray-700 mb-1">
              Current Stock
            </label>
            <input
              id="currentStock"
              type="number"
              value={formData.currentStock}
              onChange={(e) => updateField('currentStock', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label htmlFor="minStockThreshold" className="block text-sm font-medium text-gray-700 mb-1">
              Min Stock Threshold
            </label>
            <input
              id="minStockThreshold"
              type="number"
              value={formData.minStockThreshold}
              onChange={(e) => updateField('minStockThreshold', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4 pt-4">
          <button
            type="button"
            onClick={() => navigate('/products')}
            className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={mutation.isPending}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving...' : isEditing ? 'Update Product' : 'Create Product'}
          </button>
        </div>

        {mutation.isError && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
            Error saving product. Please try again.
          </div>
        )}
      </form>
    </div>
  );
}
