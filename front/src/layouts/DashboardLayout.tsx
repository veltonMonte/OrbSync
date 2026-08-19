import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiFolder, FiFileText, FiMessageCircle, FiLogOut, FiBell, FiSettings, FiTarget, FiGithub, FiActivity, FiKey, FiBook, FiSend, FiShield } from 'react-icons/fi';
import NotificationsPanel from '../components/NotificationsPanel';
import NotificationPopup from '../components/NotificationPopup';
import { notificationsApi } from '../services/notifications';
import { Modal } from '../components/ui/Modal';
import logoImg from '../assets/logo.png';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { user, logout, acceptTerms } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('splashShown', 'true');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

  const [showFirstLoginTerms, setShowFirstLoginTerms] = useState(false);
  const [isAcceptingTerms, setIsAcceptingTerms] = useState(false);

  useEffect(() => {
    if (user && !user.termsAcceptedAt) {
      setShowFirstLoginTerms(true);
    } else {
      setShowFirstLoginTerms(false);
    }
  }, [user]);

  const handleAcceptFirstLoginTerms = async () => {
    setIsAcceptingTerms(true);
    try {
      await acceptTerms();
      setShowFirstLoginTerms(false);
    } catch (e) {
      console.error('Error accepting terms', e);
      if (user) {
        const updatedUser = { ...user, termsAcceptedAt: new Date().toISOString() };
        localStorage.setItem('fluxionai_user', JSON.stringify(updatedUser));
      }
      setShowFirstLoginTerms(false);
    } finally {
      setIsAcceptingTerms(false);
    }
  };

  const handleDeclineFirstLoginTerms = () => {
    logout();
  };

  // Fetch initial unread count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const data = await notificationsApi.getUnreadCount();
        setUnreadCount(data.count);
      } catch (error) {
        console.error('Failed to fetch unread count', error);
      }
    };
    if (user) {
      fetchUnread();
    }
  }, [user]);

  return (
    <div className="dashboard-layout">
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div 
            key="splash"
            className="dashboard-splash-screen"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
          >
            <div className="dashboard-splash-logo" style={{ display: 'flex', alignItems: 'center', gap: '12px', justifyContent: 'center' }}>
              <img src={logoImg} alt="FluxionIA Logo" style={{ height: '60px' }} />
              <span>FluxionIA<span className="sidebar-logo-dot" /></span>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            className="dashboard-app-wrapper"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            {/* Sidebar Navigation */}
            <aside className="dashboard-sidebar">
              <div className="sidebar-header">
                <span className="sidebar-logo" style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <img src={logoImg} alt="FluxionIA Logo" style={{ height: '32px' }} />
                  <span>FluxionIA<span className="sidebar-logo-dot" /></span>
                </span>
              </div>

              <div className="sidebar-nav-section">
                <div className="sidebar-nav-title">Workspace</div>
                <nav className="sidebar-nav">
                  <NavLink to="/" end className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiHome className="sidebar-icon" />
                    <span>Overview</span>
                  </NavLink>
                  <NavLink to="/projetos" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiFolder className="sidebar-icon" />
                    <span>Projects</span>
                  </NavLink>
                  <NavLink to="/docs" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiFileText className="sidebar-icon" />
                    <span>Documents</span>
                  </NavLink>
                  <NavLink to="/leads" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiTarget className="sidebar-icon" />
                    <span>CRM / Leads</span>
                  </NavLink>
                </nav>
              </div>


              <div className="sidebar-nav-section">
                <div className="sidebar-nav-title">Developer</div>
                <nav className="sidebar-nav">
                  <NavLink to="/api-keys" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiKey className="sidebar-icon" />
                    <span>API Keys</span>
                  </NavLink>
                  <NavLink to="/api-docs" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiBook className="sidebar-icon" />
                    <span>API Docs</span>
                  </NavLink>
                  <NavLink to="/api-tester" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiSend className="sidebar-icon" />
                    <span>API Studio</span>
                  </NavLink>
                </nav>
              </div>

              <div className="sidebar-nav-section">
                <div className="sidebar-nav-title">Integrations</div>
                <nav className="sidebar-nav">
                  <NavLink to="/github" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiGithub className="sidebar-icon" />
                    <span>GitHub Insights</span>
                  </NavLink>
                </nav>
              </div>

              <div className="sidebar-nav-section">
                <div className="sidebar-nav-title">AI</div>
                <nav className="sidebar-nav">
                  <NavLink to="/chat" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiMessageCircle className="sidebar-icon" />
                    <span>AI Chat</span>
                  </NavLink>
                </nav>
              </div>

              <div className="sidebar-nav-section">
                <div className="sidebar-nav-title">System</div>
                <nav className="sidebar-nav">
                  <NavLink to="/monitor" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiActivity className="sidebar-icon" />
                    <span>Monitoring</span>
                  </NavLink>
                  <NavLink to="/configuracoes" className={({ isActive }) => `sidebar-nav-link ${isActive ? 'active' : ''}`}>
                    <FiSettings className="sidebar-icon" />
                    <span>Settings</span>
                  </NavLink>
                </nav>
              </div>

              <div className="sidebar-footer">

                <div className="sidebar-user-card">
                  <div className="user-avatar">
                    {user?.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
                    ) : (
                      user?.name?.charAt(0).toUpperCase() || 'U'
                    )}
                  </div>
                  <div className="user-info">
                    <span className="user-name">{user?.name}</span>
                    <span className="user-email">{user?.email}</span>
                  </div>
                </div>
              </div>
            </aside>

            {/* Main Content Area */}
            <main className="dashboard-main-content">
              {/* Topbar inside main content for mobile or global actions */}
              <header className="dashboard-topbar">
                <div className="topbar-breadcrumbs">
                  {/* Breadcrumbs can go here in the future */}
                </div>
                <div className="topbar-actions">
                  <button className="icon-button notification-button" onClick={() => setIsNotificationsOpen(true)}>
                    <FiBell size={20} />
                    {unreadCount > 0 && <span className="notification-badge" />}
                  </button>
                  <button className="icon-button logout-button" onClick={logout} title="Sair">
                    <FiLogOut size={20} />
                  </button>
                </div>
              </header>

              <div className="dashboard-page-container">
                <Outlet />
              </div>
            </main>
            
            <NotificationsPanel 
              isOpen={isNotificationsOpen} 
              onClose={() => setIsNotificationsOpen(false)}
              onUnreadCountChange={setUnreadCount}
            />
            
            <NotificationPopup />

            {/* First Login Mandatory Terms Modal */}
            <Modal
              open={showFirstLoginTerms}
              onClose={handleDeclineFirstLoginTerms}
              title="Aceite dos Termos de Serviço & Privacidade"
              description="Identificamos que este é o seu primeiro acesso à FluxionIA."
              icon={<FiShield />}
              size="lg"
            >
              <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem', marginTop: 0 }}>1. Aceitação dos Termos</h4>
                <p style={{ marginBottom: '1rem' }}>
                  Para continuar utilizando a plataforma <strong>FluxionIA</strong>, você deve aceitar estes Termos de Serviço e nossa Política de Privacidade. O aceite é armazenado com registro de data e hora no nosso banco de dados.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>2. Propriedade dos Dados do Workspace</h4>
                <p style={{ marginBottom: '1rem' }}>
                  Todos os dados do seu Workspace pertencem exclusivamente à sua empresa. A FluxionIA não compartilha seus dados para treinamento de IAs públicas.
                </p>

                <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>3. Bloqueio por Recusa</h4>
                <p style={{ marginBottom: '0' }}>
                  Se você recusar este aceite, sua sessão será encerrada por razões de segurança jurídica e você será redirecionado para a tela de login.
                </p>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
                <button 
                  type="button" 
                  className="stg-btn stg-btn--ghost" 
                  onClick={handleDeclineFirstLoginTerms}
                  disabled={isAcceptingTerms}
                >
                  Recusar (Encerrar Sessão)
                </button>
                <button 
                  type="button" 
                  style={{ 
                    padding: '0.5rem 1.5rem', 
                    background: 'var(--accent)', 
                    color: '#09090b', 
                    fontWeight: 650, 
                    border: 'none', 
                    borderRadius: 'var(--radius-md)', 
                    cursor: isAcceptingTerms ? 'not-allowed' : 'pointer',
                    opacity: isAcceptingTerms ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }} 
                  onClick={handleAcceptFirstLoginTerms}
                  disabled={isAcceptingTerms}
                >
                  {isAcceptingTerms ? 'Processando...' : 'Aceitar e Continuar'}
                </button>
              </div>
            </Modal>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
