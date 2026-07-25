import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductDetailPage } from '../pages/products/ProductDetailPage';
import * as apiClientModule from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getToken: vi.fn(() => 'test-token'),
}));

// Mock AuthContext
vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', username: 'admin', role: 'admin' },
    isAuthenticated: true,
    isLoading: false,
    login: vi.fn(),
    logout: vi.fn(),
  }),
}));

function createWrapper(initialPath = '/products/product-123') {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <Routes>
            <Route path="/products/:id" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('ProductDetailPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('displays product information', async () => {
    const mockProduct = {
      id: 'product-123',
      name: 'Castrol GTX 20W-50',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      productType: 'motor-oil',
      viscosity: '20W-50',
      capacity: '1L',
      currentStock: 15,
      minStockThreshold: 5,
      isActive: true,
    };

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce(mockProduct);

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Castrol GTX 20W-50')).toBeInTheDocument();
    });

    expect(screen.getAllByText(/20W-50/i).length).toBeGreaterThan(0);
    expect(screen.getByText('15')).toBeInTheDocument();
  });

  it('displays current price information', async () => {
    const mockProduct = {
      id: 'product-123',
      name: 'Test Product',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      productType: 'general',
      currentStock: 10,
      minStockThreshold: 5,
      isActive: true,
    };

    const mockPrices = [
      {
        id: 'price-1',
        productId: 'product-123',
        priceType: 'list',
        price: 100.5,
        discountPct: 0,
        effectiveFrom: '2024-01-01T00:00:00Z',
        effectiveTo: null,
      },
      {
        id: 'price-2',
        productId: 'product-123',
        priceType: 'cost',
        price: 75.0,
        discountPct: 0,
        effectiveFrom: '2024-01-01T00:00:00Z',
        effectiveTo: null,
      },
    ];

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce(mockProduct)
      .mockResolvedValueOnce(mockPrices);

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText(/\$100.50/i)).toBeInTheDocument();
    });
  });

  it('displays stock balance with low stock warning', async () => {
    const mockProduct = {
      id: 'product-123',
      name: 'Low Stock Product',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      productType: 'general',
      currentStock: 3,
      minStockThreshold: 5,
      isActive: true,
    };

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce(mockProduct);

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
    });
  });

  it('allows setting a new price', async () => {
    const user = userEvent.setup();
    const mockProduct = {
      id: 'product-123',
      name: 'Test Product',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      productType: 'general',
      currentStock: 10,
      minStockThreshold: 5,
      isActive: true,
    };

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce(mockProduct);
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce({ id: 'new-price' });

    render(<ProductDetailPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    const setPriceButton = screen.getByRole('button', { name: /set price/i });
    await user.click(setPriceButton);

    const priceInput = screen.getByLabelText(/price \*/i);
    await user.type(priceInput, '150.00');

    const saveButton = screen.getByRole('button', { name: /save price/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/products/product-123/prices',
        expect.objectContaining({
          price: 150,
        }),
      );
    });
  });
});
