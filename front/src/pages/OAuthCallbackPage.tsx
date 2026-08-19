import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import type { AuthUser } from '../services/auth';

export default function OAuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { loginWithTokens } = useAuth();

  useEffect(() => {
    const accessToken = searchParams.get('accessToken');
    const refreshToken = searchParams.get('refreshToken');
    const userStr = searchParams.get('user');

    // Clean up sensitive tokens from address bar/history immediately
    if (window.location.search) {
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (accessToken && refreshToken && userStr) {
      try {
        const user = JSON.parse(decodeURIComponent(userStr)) as AuthUser;
        loginWithTokens(user, { accessToken, refreshToken });
        navigate('/', { replace: true });
      } catch (e) {
        console.error('Failed to parse OAuth data', e);
        navigate('/login', { replace: true });
      }
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, navigate, loginWithTokens]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{
          width: 28,
          height: 28,
          border: '2px solid var(--border-subtle)',
          borderTopColor: 'var(--accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
          margin: '0 auto 1rem',
        }} />
        <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Autenticando com o Google...</p>
      </div>
    </div>
  );
}
