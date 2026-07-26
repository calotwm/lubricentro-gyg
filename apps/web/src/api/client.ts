const TOKEN_KEY = 'lubricentro_token';
const API_BASE = import.meta.env.VITE_API_URL || '';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string): void {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  localStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type RequestOptions = {
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function request<T>(url: string, options: RequestOptions = {}): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (options.body) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    method: options.method || 'GET',
    headers,
    body: options.body,
  });

  if (!response.ok) {
    let message = response.statusText;
    try {
      const errorBody = await response.json();
      message = errorBody.message || message;
    } catch {
      // Response may not have JSON body
    }

    if (response.status === 401) {
      clearToken();
    }

    throw new ApiError(response.status, message);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}

function apiUrl(path: string): string {
  return path.startsWith('http') ? path : `${API_BASE}${path}`;
}

export const apiClient = {
  get: <T>(url: string) => request<T>(apiUrl(url)),

  post: <T>(url: string, body: unknown) =>
    request<T>(apiUrl(url), {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(url: string, body: unknown) =>
    request<T>(apiUrl(url), {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(url: string, body: unknown) =>
    request<T>(apiUrl(url), {
      method: 'PATCH',
      body: JSON.stringify(body),
    }),

  delete: <T>(url: string) => request<T>(apiUrl(url), { method: 'DELETE' }),
};
