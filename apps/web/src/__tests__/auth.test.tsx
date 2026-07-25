import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter, MemoryRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { LoginPage } from '../pages/auth/LoginPage';
import { ProtectedRoute } from '../components/ProtectedRoute';
import * as apiClientModule from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(),
}));

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('provides null user when not authenticated', () => {
    let authValue: ReturnType<typeof useAuth> | null = null;

    function TestConsumer() {
      authValue = useAuth();
      return null;
    }

    render(
      <BrowserRouter>
        <AuthProvider>
          <TestConsumer />
        </AuthProvider>
      </BrowserRouter>,
    );

    expect(authValue!.user).toBeNull();
    expect(authValue!.isAuthenticated).toBe(false);
  });

  it('login calls apiClient.post with credentials', async () => {
    const user = userEvent.setup();
    const mockLoginResponse = {
      token: 'jwt-token-123',
      user: { id: 'user-1', username: 'admin', role: 'admin' },
    };
    vi.mocked(apiClientModule.apiClient.post).mockResolvedValueOnce(mockLoginResponse);

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>,
    );

    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login|sign in|entrar/i }));

    await waitFor(() => {
      expect(apiClientModule.apiClient.post).toHaveBeenCalledWith('/api/auth/login', {
        username: 'admin',
        password: 'password123',
      });
    });
  });

  it('shows error message on login failure', async () => {
    const user = userEvent.setup();
    vi.mocked(apiClientModule.apiClient.post).mockRejectedValueOnce(
      new Error('Invalid credentials'),
    );

    render(
      <BrowserRouter>
        <AuthProvider>
          <LoginPage />
        </AuthProvider>
      </BrowserRouter>,
    );

    await user.type(screen.getByLabelText(/username/i), 'admin');
    await user.type(screen.getByLabelText(/password/i), 'wrong');
    await user.click(screen.getByRole('button', { name: /login|sign in|entrar/i }));

    await waitFor(() => {
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });
  });
});

describe('ProtectedRoute', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to /login when not authenticated', () => {
    vi.mocked(apiClientModule.getToken).mockReturnValue(null);

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Dashboard Content')).not.toBeInTheDocument();
  });

  it('renders children when authenticated', async () => {
    vi.mocked(apiClientModule.getToken).mockReturnValue('valid-token');
    vi.mocked(apiClientModule.apiClient.get).mockResolvedValueOnce({
      id: 'user-1',
      username: 'admin',
      role: 'admin',
    });

    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <AuthProvider>
          <Routes>
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <div>Dashboard Content</div>
                </ProtectedRoute>
              }
            />
            <Route path="/login" element={<div>Login Page</div>} />
          </Routes>
        </AuthProvider>
      </MemoryRouter>,
    );

    await waitFor(() => {
      expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
    });
  });
});
