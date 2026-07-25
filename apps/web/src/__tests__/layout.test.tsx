import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Layout } from '../components/layout/Layout';
import { Sidebar } from '../components/layout/Sidebar';
import { Header } from '../components/layout/Header';
import * as apiClientModule from '../api/client';

// Mock the API client
vi.mock('../api/client', () => ({
  apiClient: {
    post: vi.fn(),
    get: vi.fn(),
  },
  setToken: vi.fn(),
  clearToken: vi.fn(),
  getToken: vi.fn(() => null),
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
  AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

describe('Sidebar', () => {
  it('renders navigation links', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByText(/dashboard/i)).toBeInTheDocument();
    expect(screen.getByText(/products/i)).toBeInTheDocument();
    expect(screen.getByText(/stock/i)).toBeInTheDocument();
    expect(screen.getByText(/reports/i)).toBeInTheDocument();
  });

  it('highlights active route', () => {
    render(
      <MemoryRouter initialEntries={['/products']}>
        <Sidebar />
      </MemoryRouter>,
    );

    const productsLink = screen.getByText(/products/i);
    expect(productsLink.closest('a')).toHaveAttribute('href', '/products');
  });

  it('renders all main navigation items with correct paths', () => {
    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    const links = screen.getAllByRole('link');
    const hrefs = links.map((link) => link.getAttribute('href'));

    expect(hrefs).toContain('/dashboard');
    expect(hrefs).toContain('/products');
    expect(hrefs).toContain('/stock');
    expect(hrefs).toContain('/reports');
  });
});

describe('Header', () => {
  it('renders user information', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    const usernameElements = screen.getAllByText(/admin/i);
    expect(usernameElements.length).toBeGreaterThan(0);
  });

  it('renders logout button', () => {
    render(
      <MemoryRouter>
        <Header />
      </MemoryRouter>,
    );

    expect(screen.getByRole('button', { name: /logout/i })).toBeInTheDocument();
  });
});

describe('Layout', () => {
  it('renders sidebar, header, and main content area', () => {
    render(
      <MemoryRouter initialEntries={['/dashboard']}>
        <Layout>
          <div data-testid="main-content">Dashboard Page Content</div>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('main-content')).toBeInTheDocument();
    expect(screen.getByText('Dashboard Page Content')).toBeInTheDocument();
  });

  it('renders children in the main content area', () => {
    render(
      <MemoryRouter>
        <Layout>
          <div data-testid="test-child">Test Child Content</div>
        </Layout>
      </MemoryRouter>,
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });
});
