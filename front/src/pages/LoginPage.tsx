import { useState, type FormEvent, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/api';
import { authApi } from '../services/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';
import logoImg from '../assets/logo.png';
import { useToast } from '../contexts/ToastContext';

import { 
  FiMail, 
  FiLock, 
  FiEye, 
  FiEyeOff, 
  FiAlertTriangle, 
  FiShield,
  FiArrowRight
} from 'react-icons/fi';
import { FaGoogle, FaGithub } from 'react-icons/fa';
import './Auth.css';


export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);

  // Reset error when typing
  useEffect(() => {
    if (error) setError(null);
  }, [email, password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) return;

    setLoading(true);
    setError(null);

    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Credenciais inválidas ou sessão expirada.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email.trim()) return;
    try {
      const data = await authApi.resendVerification(email.trim());
      toast.success(data.message || 'E-mail de verificação reenviado!');
    } catch (error: any) {
      toast.error(error.message || 'Erro ao tentar reenviar o e-mail.');
    }
  };

  return (
    <div className="auth-page">
      {/* ═══ LEFT PANEL (BRANDING & VISUAL) ═══ */}
      <motion.div 
        className="auth-left"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <div className="auth-left-header">
          <img src={logoImg} alt="FluxionIA Logo" className="auth-brand-logo" />
          <span className="auth-brand-text">Fluxion<span>IA</span></span>
        </div>

        <div className="auth-visual-wrapper">
          <motion.h1 
            className="auth-editorial-title"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            Sua operação,<br/>em fluxo.
          </motion.h1>
        </div>

        <div className="auth-left-footer">
          © {new Date().getFullYear()} FluxionIA Inc. Inteligência e orquestração B2B.
        </div>
      </motion.div>

      {/* ═══ RIGHT PANEL (FORM) ═══ */}
      <motion.div 
        className="auth-right"
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="auth-form-wrapper">
          <div className="auth-card-header">
            <h2 className="auth-card-title">Acessar workspace</h2>
            <p className="auth-card-subtitle">
              Insira suas credenciais corporativas para continuar.
            </p>
          </div>

          <AnimatePresence>
            {error && (
              <motion.div 
                className="auth-error-box"
                initial={{ opacity: 0, height: 0, y: -10 }}
                animate={{ opacity: 1, height: 'auto', y: 0 }}
                exit={{ opacity: 0, height: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <FiAlertTriangle className="auth-error-icon" />
                <div style={{ flex: 1 }}>
                  <div>{error}</div>
                  {error.includes('não verificado') && (
                    <button 
                      type="button" 
                      onClick={handleResendVerification}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        marginTop: '0.6rem',
                        background: 'transparent',
                        border: '1px solid rgba(229, 72, 77, 0.4)',
                        color: '#FF8589',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        cursor: 'pointer',
                        fontSize: '0.8rem',
                        fontWeight: 500,
                        transition: 'background 0.2s ease'
                      }}
                      onMouseOver={(e) => e.currentTarget.style.background = 'rgba(229, 72, 77, 0.1)'}
                      onMouseOut={(e) => e.currentTarget.style.background = 'transparent'}
                    >
                      Reenviar e-mail de verificação
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            <div className="auth-field">
              <label className="auth-label" htmlFor="login-email">E-mail corporativo</label>
              <div className={`auth-input-container ${emailFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiMail className="auth-input-icon" />
                <input
                  id="login-email"
                  className="auth-input"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="email"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="login-password">Senha</label>
              <div className={`auth-input-container ${passwordFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiLock className="auth-input-icon" />
                <input
                  id="login-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="auth-password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                >
                  {showPassword ? <FiEyeOff /> : <FiEye />}
                </button>
              </div>
              <div className="auth-field-actions">
                <label className="auth-checkbox-label">
                  <input 
                    type="checkbox" 
                    checked={rememberMe} 
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="auth-checkbox"
                  />
                  <span>Lembrar de mim</span>
                </label>
                <Link to="/forgot-password" className="auth-forgot-link">
                  Esqueceu a senha?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'auth-btn-submitting' : ''}`}
              disabled={loading || !email.trim() || !password.trim()}
            >
              <span className="auth-btn-inner">
                {loading ? (
                  <>
                    <div className="auth-btn-spinner" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Continuar</span>
                    <FiArrowRight size={16} className="auth-btn-arrow" />
                  </>
                )}
              </span>
            </button>
          </form>

          <div className="auth-divider">
            <span className="auth-divider-line" />
            <span className="auth-divider-text">SSO Alternativo</span>
            <span className="auth-divider-line" />
          </div>

          <div className="auth-social-group">
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => { window.location.href = `${API_BASE_URL}/auth/google`; }}
            >
              <FaGoogle size={15} /> Google
            </button>
            <button
              type="button"
              className="auth-social-btn"
              onClick={() => toast.info("O OAuth com GitHub requer a configuração de credenciais no servidor.")}
            >
              <FaGithub size={16} /> GitHub
            </button>
          </div>

          <div className="auth-card-footer">
            Não possui uma conta? <Link to="/register">Solicitar acesso</Link>
          </div>

          <div className="auth-terms-note">
            Ao continuar, você concorda com os{' '}
            <button 
              type="button" 
              className="auth-terms-btn"
              onClick={() => setShowTermsModal(true)}
            >
              Termos de Serviço
            </button> e{' '}
            <button 
              type="button" 
              className="auth-terms-btn"
              onClick={() => setShowTermsModal(true)}
            >
              Política de Privacidade
            </button>.
          </div>
        </div>
      </motion.div>

      {/* Terms Modal */}
      <Modal 
        open={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        title="Termos & Privacidade"
        description="Diretrizes corporativas de uso"
        icon={<FiShield />}
        size="lg"
      >
        <div style={{ color: '#A1A1AA', fontSize: '0.9rem', lineHeight: 1.6, maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <h4 style={{ color: '#F4F4F5', marginBottom: '0.5rem', marginTop: 0, fontWeight: 500 }}>1. Aceitação dos Termos</h4>
          <p style={{ marginBottom: '1.25rem' }}>
            Ao acessar ou utilizar a plataforma <strong>FluxionIA</strong>, você concorda em cumprir estes Termos de Serviço, nossa Política de Privacidade e a legislação aplicável.
          </p>

          <h4 style={{ color: '#F4F4F5', marginBottom: '0.5rem', fontWeight: 500 }}>2. Propriedade e Soberania de Dados</h4>
          <p style={{ marginBottom: '1.25rem' }}>
            Todos os dados no seu Workspace pertencem exclusivamente à sua empresa. A FluxionIA garante que seus dados não serão comercializados, compartilhados ou utilizados para treinamento de IA de terceiros sem autorização explícita.
          </p>

          <h4 style={{ color: '#F4F4F5', marginBottom: '0.5rem', fontWeight: 500 }}>3. Segurança</h4>
          <p style={{ marginBottom: '0' }}>
            Acesso protegido por autenticação validada. O controle previne vazamentos entre workspaces através de tokens de sessão autenticados.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button 
            type="button"
            className="auth-submit-btn" 
            style={{ width: 'auto', padding: '0 1.5rem' }} 
            onClick={() => setShowTermsModal(false)}
          >
            Ciente e De Acordo
          </button>
        </div>
      </Modal>
    </div>
  );
}
