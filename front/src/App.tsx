import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext.tsx';
import LoginPage from './pages/LoginPage.tsx';
import RegisterPage from './pages/RegisterPage.tsx';
import DashboardPage from './pages/DashboardPage.tsx';
import ProjectsPage from './pages/ProjectsPage.tsx';
import DocsPage from './pages/DocsPage.tsx';
import AiChatPage from './pages/AiChatPage.tsx';
import GitPage from './pages/GitPage.tsx';
import AutomationsPage from './pages/AutomationsPage.tsx';
import DashboardLayout from './layouts/DashboardLayout.tsx';
import { Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { GlobalBackground } from './GlobalBackground';

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0d0b1a',
        color: '#f4f0ff',
        fontFamily: 'Inter, sans-serif',
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: 40,
            height: 40,
            border: '3px solid rgba(139,92,246,0.2)',
            borderTopColor: '#8b5cf6',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem',
          }} />
          <p>Carregando...</p>
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
          style={{ display: 'flex', flex: 1, minHeight: '100vh', position: 'relative', zIndex: 1 }}
        >
          <Outlet />
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <GlobalBackground />
        <Routes>
          <Route element={<PublicRoute><AuthLayout /></PublicRoute>}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
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
            <Route path="dev" element={<GitPage />} />
            <Route path="automacoes" element={<AutomationsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
