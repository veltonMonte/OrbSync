import { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { API_BASE_URL } from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Modal } from '../components/ui/Modal';

import { FiMail, FiLock, FiEyeOff, FiEye, FiUser, FiAlertTriangle, FiShield } from 'react-icons/fi';
import { FaGoogle } from 'react-icons/fa';
import logoImg from '../assets/logo.png';
import './Auth.css';

function getPasswordStrength(password: string): { level: number; text: string } {
  if (!password) return { level: 0, text: '' };

  let score = 0;
  if (password.length >= 6) score++;
  if (password.length >= 8) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 1) return { level: 1, text: 'Fraca' };
  if (score <= 3) return { level: 2, text: 'Média' };
  return { level: 3, text: 'Forte' };
}

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  // Focus states for input styling
  const [nameFocused, setNameFocused] = useState(false);
  const [emailFocused, setEmailFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

    if (!acceptedTerms) {
      setError('Você precisa ler e aceitar os Termos de Serviço e Privacidade para se cadastrar.');
      return;
    }

    if (password !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await register(name.trim(), email.trim(), password, acceptedTerms);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
    } finally {
      setLoading(false);
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
            Comece sua<br/>jornada hoje.
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
        <div className="auth-form-wrapper" style={{ marginTop: '2rem' }}>
          <div className="auth-card-header">
            <h2 className="auth-card-title">Criar conta</h2>
            <p className="auth-card-subtitle">
              Preencha os dados abaixo para começar.
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            
            <div className="auth-field">
              <label className="auth-label" htmlFor="register-name">Nome completo</label>
              <div className={`auth-input-container ${nameFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiUser className="auth-input-icon" />
                <input
                  id="register-name"
                  className="auth-input"
                  type="text"
                  placeholder="Seu nome"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onFocus={() => setNameFocused(true)}
                  onBlur={() => setNameFocused(false)}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-email">E-mail corporativo</label>
              <div className={`auth-input-container ${emailFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiMail className="auth-input-icon" />
                <input
                  id="register-email"
                  className="auth-input"
                  type="email"
                  placeholder="nome@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  onFocus={() => setEmailFocused(true)}
                  onBlur={() => setEmailFocused(false)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-password">Senha</label>
              <div className={`auth-input-container ${passwordFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiLock className="auth-input-icon" />
                <input
                  id="register-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onFocus={() => setPasswordFocused(true)}
                  onBlur={() => setPasswordFocused(false)}
                  required
                  minLength={6}
                  autoComplete="new-password"
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
              
              {/* Password strength indicator */}
              {password && (
                <div style={{ marginTop: '0.5rem' }}>
                  <div className="auth-password-strength">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`auth-strength-bar ${
                          passwordStrength.level >= i ? 'active' : ''
                        } ${
                          passwordStrength.level === 2 ? 'medium' : ''
                        } ${
                          passwordStrength.level >= 3 ? 'strong' : ''
                        }`}
                      />
                    ))}
                  </div>
                  <span className="auth-strength-text" style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {passwordStrength.text}
                  </span>
                </div>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-confirm-password">Confirmar Senha</label>
              <div className={`auth-input-container ${confirmPasswordFocused ? 'focused' : ''} ${error ? 'error-field' : ''}`}>
                <FiLock className="auth-input-icon" />
                <input
                  id="register-confirm-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onFocus={() => setConfirmPasswordFocused(true)}
                  onBlur={() => setConfirmPasswordFocused(false)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', marginTop: '1.25rem', marginBottom: '1.25rem' }}>
              <input
                id="register-terms-check"
                type="checkbox"
                checked={acceptedTerms}
                onChange={(e) => setAcceptedTerms(e.target.checked)}
                style={{ width: '16px', height: '16px', marginTop: '2px', cursor: 'pointer', accentColor: 'var(--accent)' }}
                required
              />
              <label htmlFor="register-terms-check" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', cursor: 'pointer', lineHeight: 1.4 }}>
                Eu li e concordo com os{' '}
                <button 
                  type="button" 
                  onClick={() => setShowTermsModal(true)} 
                  style={{ background: 'none', border: 'none', color: 'var(--accent)', textDecoration: 'underline', cursor: 'pointer', padding: 0, font: 'inherit' }}
                >
                  Termos de Serviço & Privacidade
                </button> (obrigatório).
              </label>
            </div>

            <button
              type="submit"
              className={`auth-submit-btn ${loading ? 'auth-btn-submitting' : ''}`}
              disabled={loading || !acceptedTerms}
              style={!acceptedTerms ? { opacity: 0.55, cursor: 'not-allowed' } : {}}
            >
              <span className="auth-btn-inner">
                {loading ? (
                  <>
                    <div className="auth-btn-spinner" />
                    <span>Criando conta...</span>
                  </>
                ) : (
                  <>
                    <span>Criar conta</span>
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
          </div>

          <div className="auth-card-footer">
            Já tem uma conta?{' '}
            <Link to="/login">Entrar no workspace</Link>
          </div>
        </div>
      </motion.div>

      {/* Terms & Conditions Modal */}
      <Modal 
        open={showTermsModal} 
        onClose={() => setShowTermsModal(false)} 
        title="Termos de Serviço & Política de Privacidade"
        description="Diretrizes corporativas de uso da plataforma FluxionIA"
        icon={<FiShield />}
        size="lg"
      >
        <div style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: 1.6, maxHeight: '55vh', overflowY: 'auto', paddingRight: '0.5rem' }}>
          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem', marginTop: 0 }}>1. Aceitação dos Termos</h4>
          <p style={{ marginBottom: '1rem' }}>
            Ao realizar o cadastro na plataforma <strong>FluxionIA</strong>, você concorda expressamente em cumprir estes Termos de Serviço, nossa Política de Privacidade e toda a legislação aplicável (incluindo a Lei Geral de Proteção de Dados - LGPD). O aceite é registrado em nosso banco de dados com data e hora.
          </p>

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>2. Propriedade dos Dados do Workspace</h4>
          <p style={{ marginBottom: '1rem' }}>
            Todos os dados do seu Workspace — incluindo quadros Kanban, documentos TipTap, prospecções de CRM/Leads e código-fonte — pertencem exclusivamente a você e à sua empresa. A FluxionIA não comercializa, compartilha ou utiliza seus dados corporativos para treinamento de modelos públicos.
          </p>

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>3. Uso de Agentes de IA & Chaves de API</h4>
          <p style={{ marginBottom: '1rem' }}>
            A FluxionIA opera como orquestradora de inteligência artificial autônoma. O uso de chaves de API de terceiros (Google Gemini, OpenAI, Anthropic) inseridas nas suas configurações é de sua estrita responsabilidade.
          </p>

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>4. Integrações Seguras via API e GitHub</h4>
          <p style={{ marginBottom: '1rem' }}>
            A FluxionIA integra-se com serviços em nuvem como o GitHub via REST API segura, sem executar comandos de shell locais ou expor seu ambiente operacional.
          </p>

          <h4 style={{ color: 'var(--text-primary)', marginBottom: '0.4rem' }}>5. Recusa e Bloqueio de Acesso</h4>
          <p style={{ marginBottom: '0' }}>
            Caso o usuário recuse ou desmarque o aceite dos Termos de Serviço, o cadastro e a criação da conta serão imediatamente barrados por motivos de segurança jurídica e integridade da plataforma.
          </p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-subtle)' }}>
          <button 
            type="button" 
            className="stg-btn stg-btn--ghost" 
            onClick={() => { setAcceptedTerms(false); setShowTermsModal(false); }}
          >
            Recusar (Barrar Cadastro)
          </button>
          <button 
            type="button" 
            className="auth-submit" 
            style={{ width: 'auto', padding: '0.5rem 1.5rem' }} 
            onClick={() => { setAcceptedTerms(true); setShowTermsModal(false); }}
          >
            Aceitar e Concordar
          </button>
        </div>
      </Modal>
    </div>
  );
}
