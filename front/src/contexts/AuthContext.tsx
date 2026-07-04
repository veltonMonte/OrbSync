import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authApi, type AuthUser } from '../services/auth';

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data on mount
    const storedUser = localStorage.getItem('pompeli_user');
    const storedToken = localStorage.getItem('pompeli_access_token');

    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
        setAccessToken(storedToken);
      } catch {
        localStorage.removeItem('pompeli_user');
        localStorage.removeItem('pompeli_access_token');
        localStorage.removeItem('pompeli_refresh_token');
      }
    }

    setIsLoading(false);
  }, []);

  const saveAuth = (userData: AuthUser, tokens: { accessToken: string; refreshToken: string }) => {
    setUser(userData);
    setAccessToken(tokens.accessToken);
    localStorage.setItem('pompeli_user', JSON.stringify(userData));
    localStorage.setItem('pompeli_access_token', tokens.accessToken);
    localStorage.setItem('pompeli_refresh_token', tokens.refreshToken);
  };

  const login = async (email: string, password: string) => {
    const response = await authApi.login({ email, password });
    saveAuth(response.user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
  };

  const register = async (name: string, email: string, password: string) => {
    const response = await authApi.register({ name, email, password });
    saveAuth(response.user, { accessToken: response.accessToken, refreshToken: response.refreshToken });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem('pompeli_refresh_token');
    if (refreshToken) {
      try {
        await authApi.logout(refreshToken);
      } catch {
        // Ignore logout errors
      }
    }

    setUser(null);
    setAccessToken(null);
    localStorage.removeItem('pompeli_user');
    localStorage.removeItem('pompeli_access_token');
    localStorage.removeItem('pompeli_refresh_token');
    localStorage.removeItem('pompeli_term_history');
    localStorage.removeItem('pompeli_term_cmd_history');
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
        register,
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
