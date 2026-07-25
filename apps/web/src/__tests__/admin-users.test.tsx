import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AdminUsersPage } from '../pages/admin/AdminUsersPage';
import * as apiClientModule from '../api/client';

vi.mock('../api/client', () => ({
  apiClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
  getToken: vi.fn(() => 'test-token'),
}));

const mockAdminUser = {
  user: { id: '1', username: 'admin', role: 'admin' },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

const mockEmployeeUser = {
  user: { id: '2', username: 'employee', role: 'employee' },
  isAuthenticated: true,
  isLoading: false,
  login: vi.fn(),
  logout: vi.fn(),
};

let currentAuthMock = mockAdminUser;

vi.mock('../contexts/AuthContext', () => ({
  useAuth: () => currentAuthMock,
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

describe('AdminUsersPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    currentAuthMock = mockAdminUser;
  });

  it('renders the user management page', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce([
      { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    ]);

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    expect(screen.getByRole('heading', { name: /user management/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /new user/i })).toBeInTheDocument();
  });

  it('displays user list with roles and status', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce([
      { id: '1', username: 'admin', email: 'admin@test.com', role: 'admin', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
      { id: '2', username: 'employee1', email: 'emp@test.com', role: 'employee', isActive: true, createdAt: '2024-02-01T00:00:00Z' },
    ]);

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('employee1')).toBeInTheDocument();
    });

    expect(screen.getByText('admin@test.com')).toBeInTheDocument();
    expect(screen.getByText('emp@test.com')).toBeInTheDocument();
    expect(screen.getAllByText('admin').length).toBeGreaterThanOrEqual(1);
  });

  it('shows create user form when clicking New User', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce([]);

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /new user/i }));

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/role/i)).toBeInTheDocument();
  });

  it('creates a new user via form submission', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValue({ id: '3' });

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /new user/i }));

    await user.type(screen.getByLabelText(/username/i), 'newuser');
    await user.type(screen.getByLabelText(/email/i), 'new@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.selectOptions(screen.getByLabelText(/role/i), 'employee');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith(
        '/api/users',
        expect.objectContaining({
          username: 'newuser',
          email: 'new@test.com',
          password: 'password123',
          role: 'employee',
        }),
      );
    });
  });

  it('shows error message when user creation fails', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValue([]);
    vi.mocked(apiClientModule.apiClient.post).mockRejectedValue(new Error('Username already exists'));

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    await user.click(screen.getByRole('button', { name: /new user/i }));
    await user.type(screen.getByLabelText(/username/i), 'existing');
    await user.type(screen.getByLabelText(/email/i), 'test@test.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');

    await user.click(screen.getByRole('button', { name: /create user/i }));

    await waitFor(() => {
      expect(screen.getByText(/username already exists/i)).toBeInTheDocument();
    });
  });

  it('shows deactivate button for active users', async () => {
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce([
      { id: '2', username: 'employee1', email: 'emp@test.com', role: 'employee', isActive: true, createdAt: '2024-01-01T00:00:00Z' },
    ]);

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(screen.getByText('employee1')).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: /deactivate/i })).toBeInTheDocument();
  });

  it('shows access denied for non-admin users', async () => {
    currentAuthMock = mockEmployeeUser;

    render(<AdminUsersPage />, { wrapper: createWrapper() });

    expect(screen.getByText(/access denied/i)).toBeInTheDocument();

    currentAuthMock = mockAdminUser;
  });
});
