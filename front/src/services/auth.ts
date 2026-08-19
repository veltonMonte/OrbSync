import { API_BASE_URL, authFetch } from './api';

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string | null;
  termsAcceptedAt?: string | null;
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
  acceptedTerms: boolean;
}

async function handleAuthResponse(response: Response): Promise<any> {
  const data = await response.json().catch(() => ({ message: response.statusText }));

  if (!response.ok) {
    throw new Error(data.message || 'Erro na requisição');
  }

  return data;
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

  resendVerification: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleAuthResponse(res);
  },

  forgotPassword: async (email: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    return handleAuthResponse(res);
  },

  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, newPassword }),
    });
    return handleAuthResponse(res);
  },

  verifyEmail: async (token: string): Promise<{ message: string }> => {
    const res = await fetch(`${API_BASE_URL}/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token }),
    });
    return handleAuthResponse(res);
  },

  acceptTerms: async (): Promise<{ success: boolean; termsAcceptedAt?: string }> => {
    const res = await authFetch('/auth/accept-terms', { method: 'POST' });
    return res.json();
  },
};
