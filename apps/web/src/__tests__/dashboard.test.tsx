import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DashboardPage } from '../pages/dashboard/DashboardPage';
import * as apiClientModule from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
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

describe('DashboardPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the dashboard with quick links', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({ data: [] });

    render(<DashboardPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /dashboard/i })).toBeInTheDocument();
    expect(screen.getByText('View Catalog')).toBeInTheDocument();
    expect(screen.getByText('Manage Stock')).toBeInTheDocument();
    expect(screen.getByText('View Reports')).toBeInTheDocument();
  });

  it('displays low stock alerts section', async () => {
    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({
        data: [
          { productId: 'p1', productName: 'Low Oil', brandName: 'Castrol', currentStock: 2, minStockThreshold: 5 },
          { productId: 'p2', productName: 'Low Filter', brandName: 'Fram', currentStock: 1, minStockThreshold: 3 },
        ],
      })
      .mockResolvedValueOnce({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Low Oil')).toBeInTheDocument();
    });

    expect(screen.getByText('Low Filter')).toBeInTheDocument();
    expect(screen.getByText('2 items')).toBeInTheDocument();
  });

  it('shows "All products have sufficient stock" when no low stock items', async () => {
    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ data: [], pagination: { page: 1, limit: 10, total: 0, totalPages: 0 } });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/all products have sufficient stock/i)).toBeInTheDocument();
    });
  });

  it('displays recent movements section', async () => {
    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        data: [
          {
            id: 'm1',
            productId: 'p1',
            productName: 'Castrol 20W-50',
            movementType: 'entry',
            quantity: 10,
            unitPrice: 50,
            reference: null,
            notes: null,
            username: 'admin',
            createdAt: '2024-08-01T10:00:00Z',
          },
        ],
        pagination: { page: 1, limit: 10, total: 1, totalPages: 1 },
      });

    render(<DashboardPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Castrol 20W-50')).toBeInTheDocument();
    });

    expect(screen.getByText('+10')).toBeInTheDocument();
  });
});
