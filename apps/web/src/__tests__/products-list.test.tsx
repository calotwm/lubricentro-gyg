import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductListPage } from '../pages/products/ProductListPage';
import * as apiClientModule from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
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

function createWrapper() {
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
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('ProductListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the products list page with search and filters', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    render(<ProductListPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /products/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/search/i)).toBeInTheDocument();
  });

  it('displays products from API response', async () => {
    const mockProducts = {
      data: [
        {
          id: '1',
          name: 'Castrol GTX 20W-50',
          brandId: 'brand-1',
          categoryId: 'cat-1',
          productType: 'motor-oil',
          currentStock: 10,
          isActive: true,
        },
        {
          id: '2',
          name: 'Fram PH8A Oil Filter',
          brandId: 'brand-2',
          categoryId: 'cat-2',
          productType: 'filter',
          currentStock: 25,
          isActive: true,
        },
      ],
      pagination: { page: 1, limit: 20, total: 2, totalPages: 1 },
    };

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce(mockProducts);

    render(<ProductListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Castrol GTX 20W-50')).toBeInTheDocument();
      expect(screen.getByText('Fram PH8A Oil Filter')).toBeInTheDocument();
    });
  });

  it('shows "No products found" when search returns empty', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    render(<ProductListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no products found/i)).toBeInTheDocument();
    });
  });

  it('calls API with search parameter when user types in search', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    render(<ProductListPage />, { wrapper: createWrapper() });

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, 'castrol');

    await waitFor(() => {
      expect(apiClientModule.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('search=castrol'),
      );
    });
  });

  it('displays pagination controls when there are multiple pages', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce({
      data: [
        {
          id: '1',
          name: 'Product 1',
          brandId: 'brand-1',
          categoryId: 'cat-1',
          productType: 'general',
          currentStock: 5,
          isActive: true,
        },
      ],
      pagination: { page: 1, limit: 20, total: 50, totalPages: 3 },
    });

    render(<ProductListPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/page 1 of 3/i)).toBeInTheDocument();
    });
  });
});
