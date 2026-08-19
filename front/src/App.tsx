import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import VerifyEmailPage from './pages/VerifyEmailPage.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import ResetPasswordPage from './pages/ResetPasswordPage.tsx';
import OAuthCallbackPage from './pages/OAuthCallbackPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import DocsPage from './pages/DocsPage.tsx';
import AiChatPage from './pages/AiChatPage.tsx';
import GithubDashboardPage from './pages/GithubDashboardPage.tsx';
import SettingsPage from './pages/SettingsPage.tsx';
import ApiKeysPage from './pages/ApiKeysPage.tsx';
import ApiDocsPage from './pages/ApiDocsPage.tsx';
import ApiTesterPage from './pages/ApiTesterPage.tsx';
import LeadsPage from './pages/LeadsPage.tsx';
import SobrePage from './pages/SobrePage.tsx';
import MonitorPage from './pages/MonitorPage.tsx';
import DemoFluidParticlesBackground from './pages/DemoFluidParticles.tsx';
import BentoDemoPage from './pages/BentoDemoPage.tsx';
import DashboardLayout from './layouts/DashboardLayout.tsx';
import { AnimatePresence, motion } from 'framer-motion';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
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
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

const pageVariants = {
  initial: { opacity: 0, scale: 0.95, filter: 'blur(10px)' },
  animate: { 
    opacity: 1, scale: 1, filter: 'blur(0px)',
    transitionEnd: { scale: 'none', filter: 'none', transform: 'none' },
    transition: { duration: 0.5, staggerChildren: 0.15, delayChildren: 0.2, ease: [0.16, 1, 0.3, 1] as const }
  },
  exit: { opacity: 0, scale: 1.05, filter: 'blur(10px)', transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] as const } }
};

function AuthLayout() {
  const location = useLocation();
  return (
    <div className="auth-page">
      <AnimatePresence mode="wait">
        <motion.div
          key={location.pathname}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ display: 'flex', flex: 1, minHeight: '100vh', position: 'relative', zIndex: 1, width: '100%' }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

import { FluidParticlesBackground } from './components/ui/FluidParticlesBackground.tsx';
import { useEffect } from 'react';

function AppContent() {
  const location = useLocation();
  const showParticles = location.pathname === '/' || location.pathname.startsWith('/login') || location.pathname.startsWith('/register') || location.pathname.startsWith('/auth') || location.pathname.startsWith('/forgot') || location.pathname.startsWith('/reset');

  useEffect(() => {
    const theme = localStorage.getItem('fluxionai_theme') || 'dark';
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }

    const lang = localStorage.getItem('fluxionai_lang') || 'pt-BR';
    document.documentElement.lang = lang;
  }, []);

  return (
    <>
      {showParticles && <FluidParticlesBackground />}
      <Routes>
        <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify" element={<VerifyEmailPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/callback" element={<OAuthCallbackPage />} />
        </Route>
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <DashboardLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="projetos" element={<ProjectsPage />} />
          <Route path="docs" element={<DocsPage />} />
          <Route path="chat" element={<AiChatPage />} />
          <Route path="dev" element={<Navigate to="/github" replace />} />
          <Route path="github" element={<GithubDashboardPage />} />
          <Route path="leads" element={<LeadsPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
          <Route path="api-keys" element={<ApiKeysPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="api-tester" element={<ApiTesterPage />} />
          <Route path="sobre" element={<SobrePage />} />
          <Route path="monitor" element={<MonitorPage />} />
        </Route>
        
        <Route path="/demo" element={<DemoFluidParticlesBackground />} />
        <Route path="/bento-demo" element={<BentoDemoPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
