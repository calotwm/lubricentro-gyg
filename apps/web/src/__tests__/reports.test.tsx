import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReportsPage } from '../pages/reports/ReportsPage';
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

describe('ReportsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the reports page with tabs', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({ data: [] });

    render(<ReportsPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /reports/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /movement report/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /stock valuation/i })).toBeInTheDocument();
  });

  it('shows movement report with filters', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({ data: [] });

    render(<ReportsPage />, { wrapper: createWrapper() });

    expect(screen.getByLabelText(/from/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/to/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/group by/i)).toBeInTheDocument();
  });

  it('displays movement report data', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({
      data: [
        {
          date: '2024-08-01',
          productId: 'p1',
          productName: 'Castrol 20W-50',
          brandName: 'Castrol',
          movementType: 'entry',
          totalQuantity: 50,
          totalValue: 2500.0,
        },
      ],
    });

    render(<ReportsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('Castrol 20W-50')).toBeInTheDocument();
    });

    expect(screen.getByText('Castrol')).toBeInTheDocument();
    expect(screen.getByText('$2500.00')).toBeInTheDocument();
  });

  it('shows "No movements found" when report is empty', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({ data: [] });

    render(<ReportsPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText(/no movements found/i)).toBeInTheDocument();
    });
  });

  it('switches to valuation tab and shows valuation data', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({
        brands: [
          { brandId: 'b1', brandName: 'Castrol', totalProducts: 5, totalStock: 100, totalValue: 5000 },
          { brandId: 'b2', brandName: 'Mobil', totalProducts: 3, totalStock: 60, totalValue: 3000 },
        ],
        grandTotal: 8000,
      });

    render(<ReportsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /stock valuation/i }));

    await waitFor(() => {
      expect(screen.getByText('Castrol')).toBeInTheDocument();
    });

    expect(screen.getByText('Mobil')).toBeInTheDocument();
    expect(screen.getByText('$8000.00')).toBeInTheDocument();
    expect(screen.getByText('Grand Total')).toBeInTheDocument();
  });

  it('shows "No valuation data available" when empty', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get)
      .mockResolvedValueOnce({ data: [] })
      .mockResolvedValueOnce({ brands: [], grandTotal: 0 });

    render(<ReportsPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /stock valuation/i }));

    await waitFor(() => {
      expect(screen.getByText(/no valuation data available/i)).toBeInTheDocument();
    });
  });

  it('calls API with date filter parameters', async () => {
    const user = userEvent.setup();

    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue({ data: [] });

    render(<ReportsPage />, { wrapper: createWrapper() });

    const fromInput = screen.getByLabelText(/^from$/i);
    await user.type(fromInput, '2024-08-01');

    await waitFor(() => {
      expect(apiClientModule.apiClient.get).toHaveBeenCalledWith(
        expect.stringContaining('from=2024-08-01'),
      );
    });
  });
});
