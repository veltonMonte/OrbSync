const API_BASE_URL = 'http://localhost:3001/api';

export interface User {
  id: number;
  name: string;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserPayload {
  name: string;
  email: string;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Erro na requisição');
  }
  return response.json();
}

export async function authFetch(endpoint: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('orbsync_access_token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('orbsync_user');
    localStorage.removeItem('orbsync_access_token');
    localStorage.removeItem('orbsync_refresh_token');
    window.location.href = '/login';
    throw new Error('Sessão expirada. Faça login novamente.');
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Erro na requisição');
  }

  return response;
}

export const api = {
  users: {
    getAll: async (): Promise<User[]> => {
      const res = await fetch(`${API_BASE_URL}/users`);
      return handleResponse<User[]>(res);
    },

    getById: async (id: number): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`);
      return handleResponse<User>(res);
    },

    create: async (data: CreateUserPayload): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<User>(res);
    },

    update: async (id: number, data: Partial<CreateUserPayload>): Promise<User> => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return handleResponse<User>(res);
    },

    delete: async (id: number): Promise<void> => {
      const res = await fetch(`${API_BASE_URL}/users/${id}`, {
        method: 'DELETE',
      });
      if (!res.ok) {
        const error = await res.json().catch(() => ({ message: res.statusText }));
        throw new Error(error.message || 'Erro ao deletar');
      }
    },
  },
};
