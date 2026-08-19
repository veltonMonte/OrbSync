import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithTokens: (userData: AuthUser, tokens: { accessToken: string; refreshToken: string }) => void;
  register: (name: string, email: string, password: string, acceptedTerms?: boolean) => Promise<void>;
  acceptTerms: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('fluxionai_user');
    const storedToken = localStorage.getItem('fluxionai_access_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch {
        localStorage.removeItem('fluxionai_user');
        localStorage.removeItem('fluxionai_access_token');
        localStorage.removeItem('fluxionai_refresh_token');
      }
    }

    setIsLoading(false);
  }, []);

  const saveAuth = (userData: AuthUser, tokens: { accessToken: string; refreshToken: string }) => {
    setUser(userData);
    setAccessToken(tokens.accessToken);
    localStorage.setItem('fluxionai_user', JSON.stringify(userData));
    localStorage.setItem('fluxionai_access_token', tokens.accessToken);
    localStorage.setItem('fluxionai_refresh_token', tokens.refreshToken);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    saveAuth(response.user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
  };

  const loginWithTokens = (userData: AuthUser, tokens: { accessToken: string; refreshToken: string }) => {
    saveAuth(userData, tokens);
  };

  const register = async (name: string, email: string, password: string, acceptedTerms = true) => {
    const response = await authApi.register({ name, email, password, acceptedTerms });
    saveAuth(response.user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
  };

  const acceptTerms = async () => {
    const res = await authApi.acceptTerms();
    if (user) {
      const updatedUser = { ...user, termsAcceptedAt: res.termsAcceptedAt || new Date().toISOString() };
      setUser(updatedUser);
      localStorage.setItem('fluxionai_user', JSON.stringify(updatedUser));
    }
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('fluxionai_refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }

    const currentUserId = user?.id;
    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('fluxionai_user');
    localStorage.removeItem('fluxionai_access_token');
    localStorage.removeItem('fluxionai_refresh_token');
    localStorage.removeItem('fluxionai_term_history');
    localStorage.removeItem('fluxionai_term_cmd_history');
    localStorage.removeItem('fluxionai_gh_token');
    if (currentUserId) {
      localStorage.removeItem(`fluxionai_gh_token_${currentUserId}`);
    }
    sessionStorage.removeItem('splashShown');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user && !!accessToken,
        isLoading,
        login,
        loginWithTokens,
        register,
        acceptTerms,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
