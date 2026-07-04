const API_BASE_URL = 'http://localhost:3001/api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
}

export interface AuthResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
}

async function handleAuthResponse(response: Response): Promise<AuthResponse> {
  const data = await response.json().catch(() => ({ message: response.statusText }));

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição');
  }

  return data as AuthResponse;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleAuthResponse(res);
  },

  register: async (payload: RegisterPayload): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return handleAuthResponse(res);
  },

  refresh: async (refreshToken: string): Promise<AuthResponse> => {
    const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
    return handleAuthResponse(res);
  },

  logout: async (refreshToken: string): Promise<void> => {
    await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });
  },
};
