import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

import { FiMail, FiLock, FiEyeOff, FiEye, FiAlertTriangle } from 'react-icons/fi';
import './Auth.css';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao fazer login');
    } finally {
      setLoading(false);
    }
  };

  const slideInVariant = {
    initial: { opacity: 0, x: 30 },
    animate: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const fadeInUpVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const } }
  };

  const logoVariant = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] as const, delay: 0.1 } }
  };

  return (
    <>


      {/* Left Panel — Illustration */}
      <motion.div className="auth-left" variants={slideInVariant}>
        <div className="auth-left-content">
          <h2 className="auth-left-title">
            Gerencie tudo em <span>um só lugar</span>
          </h2>
          <p className="auth-left-subtitle">
            Kanban, automações, documentos e IA integrada para 
            elevar a produtividade do seu time.
          </p>
          <div className="auth-dots">
            <span className="auth-dot" />
            <span className="auth-dot" />
            <span className="auth-dot" />
            <span className="auth-dot" />
            <span className="auth-dot" />
          </div>
        </div>
      </motion.div>

      {/* Right Column (Form) */}
      <motion.div className="auth-right" variants={fadeInUpVariant}>
        <div className="auth-card">
          <motion.div className="auth-logo" variants={logoVariant}>
            <span className="auth-logo-text">Orb<span className="auth-logo-1">Sync</span></span>
          </motion.div>

          <div className="auth-header">
            <h1 className="auth-title">Bem-vindo de volta</h1>
            <p className="auth-subtitle">
              Entre na sua conta para continuar
            </p>
          </div>

          {error && (
            <div className="auth-error">
              <FiAlertTriangle />
              {error}
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">
                E-mail
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">
                Senha
              </label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Esconder senha' : 'Mostrar senha'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              <span className="auth-submit-content">
                {loading && <span className="auth-spinner" />}
                {loading ? 'Entrando...' : 'Entrar'}
              </span>
            </button>
          </form>

          <div className="auth-footer">
            Não tem uma conta?{' '}
            <Link to="/register">Cadastre-se</Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}
