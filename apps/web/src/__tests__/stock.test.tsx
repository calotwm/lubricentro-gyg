import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StockPage } from '../pages/stock/StockPage';
import * as apiClientModule from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
  },
  getToken: vi.fn(() => 'test-token'),
}));

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
    defaultOptions: { queries: { retry: false } },
  });

  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('StockPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the stock management page with tabs', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    render(<StockPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /stock management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new movement/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /movement log/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stock balance/i })).toBeInTheDocument();
  });

  it('shows movement form by default with product selector and type selector', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [
        { id: 'p1', name: 'Castrol 20W-50', brandId: 'b1', categoryId: 'c1', productType: 'motor-oil', currentStock: 10, isActive: true },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });

    render(<StockPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByLabelText(/product/i)).toBeInTheDocument();
    });

    expect(screen.getByLabelText(/movement type/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/quantity/i)).toBeInTheDocument();
  });

  it('submits a stock entry movement', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [
        { id: 'p1', name: 'Castrol 20W-50', brandId: 'b1', categoryId: 'c1', productType: 'motor-oil', currentStock: 10, isActive: true },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({ id: 'm1' });

    render(<StockPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const select = screen.getByLabelText(/product/i);
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1);
    });

    const productSelect = screen.getByLabelText(/product/i);
    await user.selectOptions(productSelect, 'p1');

    const quantityInput = screen.getByLabelText(/quantity/i);
    await user.type(quantityInput, '5');

    const submitButton = screen.getByRole('button', { name: /record movement/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/stock/movements',
        expect.objectContaining({
          productId: 'p1',
          movementType: 'entry',
          quantity: 5,
        }),
      );
    });
  });

  it('shows success message after recording movement', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [
        { id: 'p1', name: 'Test Product', brandId: 'b1', categoryId: 'c1', productType: 'general', currentStock: 10, isActive: true },
      ],
      pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
    });
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({ id: 'm1' });

    render(<StockPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      const select = screen.getByLabelText(/product/i);
      expect(select.querySelectorAll('option').length).toBeGreaterThan(1);
    });

    await user.selectOptions(screen.getByLabelText(/product/i), 'p1');
    await user.type(screen.getByLabelText(/quantity/i), '3');
    await user.click(screen.getByRole('button', { name: /record movement/i }));

    await waitFor(() => {
      expect(screen.getByText(/movement recorded successfully/i)).toBeInTheDocument();
    });
  });

  it('switches to movement log tab and shows movements', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({
        data: [{ id: 'p1', name: 'Product', brandId: 'b1', categoryId: 'c1', productType: 'general', currentStock: 10, isActive: true }],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'm1',
            productId: 'p1',
            productName: 'Castrol 20W-50',
            movementType: 'entry',
            quantity: 10,
            unitPrice: 50.0,
            reference: 'PO-001',
            notes: null,
            username: 'admin',
            createdAt: '2024-08-01T10:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

    render(<StockPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /movement log/i }));

    await waitFor(() => {
      expect(screen.getByText('Castrol 20W-50')).toBeInTheDocument();
    });

    expect(screen.getByText('PO-001')).toBeInTheDocument();
    expect(screen.getByText('admin')).toBeInTheDocument();
  });

  it('switches to stock balance tab and shows balance with low stock alerts', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({
        data: [{ id: 'p1', name: 'Product', brandId: 'b1', categoryId: 'c1', productType: 'general', currentStock: 10, isActive: true }],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        data: [
          {
            productId: 'p1',
            productName: 'Low Stock Oil',
            brandName: 'Castrol',
            categoryName: 'motor-oil',
            currentStock: 2,
            minStockThreshold: 5,
          },
        ],
        pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
      });

    render(<StockPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /stock balance/i }));

    await waitFor(() => {
      expect(screen.getByText('Low Stock Oil')).toBeInTheDocument();
    });

    expect(screen.getByText('Low Stock')).toBeInTheDocument();
  });

  it('filters movement log by type', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({
        data: [{ id: 'p1', name: 'Product', brandId: 'b1', categoryId: 'c1', productType: 'general', currentStock: 10, isActive: true }],
        pagination: { page: 1, limit: 100, total: 1, totalPages: 1 },
      })
      .mockResolvedValueOnce({
        data: [],
        pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      });

    render(<StockPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /movement log/i }));

    const typeFilter = screen.getByLabelText(/type/i);
    await user.selectOptions(typeFilter, 'entry');

    await waitFor(() => {
      expect(apiClientModule.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('movementType=entry'),
      );
    });
  });
});
