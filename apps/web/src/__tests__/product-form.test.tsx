import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ProductFormPage } from '../pages/products/ProductFormPage';
import * as apiClientModule from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
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

function createWrapper(initialPath = '/products/new') {
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
            <Route path="/products/new" element={children} />
            <Route path="/products/:id/edit" element={children} />
          </Routes>
        </MemoryRouter>
      </QueryClientProvider>
    );
  };
}

describe('ProductFormPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders create product form with base fields', () => {
    render(<ProductFormPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/product type/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create product/i })).toBeInTheDocument();
  });

  it('shows viscosity and capacity fields when product type is motor-oil', async () => {
    const user = userEvent.setup();
    render(<ProductFormPage />, { wrapper: createWrapper() });

    const typeSelect = screen.getByLabelText(/product type/i);
    await user.selectOptions(typeSelect, 'motor-oil');

    expect(screen.getByLabelText(/viscosity/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/capacity/i)).toBeInTheDocument();
  });

  it('shows CCA, voltage, and dimensions fields when product type is battery', async () => {
    const user = userEvent.setup();
    render(<ProductFormPage />, { wrapper: createWrapper() });

    const typeSelect = screen.getByLabelText(/product type/i);
    await user.selectOptions(typeSelect, 'battery');

    expect(screen.getByLabelText(/cca/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/voltage/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/dimensions/i)).toBeInTheDocument();
  });

  it('submits form with motor-oil specific data', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce({
      id: 'new-product-id',
    });

    render(<ProductFormPage />, { wrapper: createWrapper() });

    await user.type(screen.getByLabelText(/name/i), 'Castrol GTX 20W-50');
    await user.type(screen.getByLabelText(/brand id/i), 'brand-uuid-1234');
    await user.type(screen.getByLabelText(/category id/i), 'cat-uuid-1234');
    await user.selectOptions(screen.getByLabelText(/product type/i), 'motor-oil');
    await user.type(screen.getByLabelText(/viscosity/i), '20W-50');
    await user.type(screen.getByLabelText(/^capacity/i), '1L');

    await user.click(screen.getByRole('button', { name: /create product/i }));

    await waitFor(() => {
      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/products',
        expect.objectContaining({
          name: 'Castrol GTX 20W-50',
          productType: 'motor-oil',
          viscosity: '20W-50',
          capacity: '1L',
        }),
      );
    });
  });

  it('loads existing product data when editing', async () => {
    const mockProduct = {
      id: 'existing-id',
      name: 'Existing Product',
      brandId: 'brand-1',
      categoryId: 'cat-1',
      productType: 'battery',
      viscosity: null,
      capacity: null,
      specifications: {
        cca: 600,
        voltage: 12,
        dimensions: '242x175x190',
      },
      currentStock: 10,
      minStockThreshold: 5,
      isActive: true,
    };

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce(mockProduct);

    render(<ProductFormPage />, { wrapper: createWrapper('/products/existing-id/edit') });

    await waitFor(() => {
      expect(screen.getByLabelText(/name/i)).toHaveValue('Existing Product');
    });

    expect(screen.getByLabelText(/cca/i)).toHaveValue(600);
    expect(screen.getByLabelText(/voltage/i)).toHaveValue(12);
  });
});
