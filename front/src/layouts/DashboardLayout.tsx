import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { NavLink, Outlet } from 'react-router-dom';
import { FiHome, FiFolder, FiFileText, FiMessageCircle, FiTerminal, FiLogOut } from 'react-icons/fi';
import './DashboardLayout.css';

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const [showSplash, setShowSplash] = useState(() => {
    return !sessionStorage.getItem('splashShown');
  });

  useEffect(() => {
    if (showSplash) {
      const timer = setTimeout(() => {
        setShowSplash(false);
        sessionStorage.setItem('splashShown', 'true');
      }, 3500);
      return () => clearTimeout(timer);
    }
  }, [showSplash]);

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
            <div className="dashboard-splash-logo">Orb<span>Sync</span></div>
          </motion.div>
        ) : (
          <motion.div 
            key="content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
            style={{ width: '100%', display: 'flex', flexDirection: 'column' }}
          >
            {/* Fixed Pill Navbar */}
            <div className="dashboard-header-wrapper">
              <motion.header
                className="dashboard-header"
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="dashboard-brand">
                  <span className="dashboard-logo">Orb<span className="dashboard-logo-1">Sync</span></span>
                </div>

                <nav className="dashboard-nav">
                  <NavLink to="/" end className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <FiHome className="dashboard-nav-icon" />
                    <span className="dashboard-nav-text">Início</span>
                  </NavLink>
                  <NavLink to="/projetos" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <FiFolder className="dashboard-nav-icon" />
                    <span className="dashboard-nav-text">Projetos</span>
                  </NavLink>
                  <NavLink to="/automacoes" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <svg stroke="currentColor" fill="none" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round" height="1em" width="1em" xmlns="http://www.w3.org/2000/svg" className="dashboard-nav-icon"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                    <span className="dashboard-nav-text">Automações</span>
                  </NavLink>
                  <NavLink to="/docs" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <FiFileText className="dashboard-nav-icon" />
                    <span className="dashboard-nav-text">Docs</span>
                  </NavLink>
                  <NavLink to="/chat" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <FiMessageCircle className="dashboard-nav-icon" />
                    <span className="dashboard-nav-text">IA Chat</span>
                  </NavLink>
                  <NavLink to="/dev" className={({ isActive }) => `dashboard-nav-link ${isActive ? 'active' : ''}`}>
                    <FiTerminal className="dashboard-nav-icon" />
                    <span className="dashboard-nav-text">DevOps</span>
                  </NavLink>
                </nav>

                <div className="dashboard-user">
                  <div className="dashboard-avatar">
                    {user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div className="dashboard-user-info">
                    <span className="dashboard-user-name">{user?.name}</span>
                    <span className="dashboard-user-email">{user?.email}</span>
                  </div>
                  <button className="dashboard-logout" onClick={logout}>
                    <FiLogOut className="dashboard-logout-icon" />
                    <span className="dashboard-logout-text">Sair</span>
                  </button>
                </div>
              </motion.header>
            </div>

            {/* Main Content Rendered by Outlet */}
            <Outlet />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
