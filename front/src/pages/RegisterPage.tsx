import { useState, type FormEvent, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

import { FiMail, FiLock, FiEyeOff, FiEye, FiUser, FiAlertTriangle } from 'react-icons/fi';
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
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const passwordStrength = useMemo(() => getPasswordStrength(password), [password]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !password.trim()) return;

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
      await register(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao criar conta');
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
            Comece sua jornada <span>hoje</span>
          </h2>
          <p className="auth-left-subtitle">
            Crie sua conta e desbloqueie o potencial completo da 
            plataforma de produtividade mais completa.
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
            <h1 className="auth-title">Criar conta</h1>
            <p className="auth-subtitle">
              Preencha os dados abaixo para começar
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
              <label className="auth-label" htmlFor="register-name">
                Nome
              </label>
              <div className="auth-input-wrapper">
                <FiUser className="auth-input-icon" />
                <input
                  id="register-name"
                  className="auth-input"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                  autoFocus
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-email">
                E-mail
              </label>
              <div className="auth-input-wrapper">
                <FiMail className="auth-input-icon" />
                <input
                  id="register-email"
                  className="auth-input"
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-password">
                Senha
              </label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Mínimo 6 caracteres"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
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
                <>
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
                  <span className="auth-strength-text">
                    {passwordStrength.text}
                  </span>
                </>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-label" htmlFor="register-confirm-password">
                Confirmar Senha
              </label>
              <div className="auth-input-wrapper">
                <FiLock className="auth-input-icon" />
                <input
                  id="register-confirm-password"
                  className="auth-input"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Confirme sua senha"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit"
              disabled={loading}
            >
              <span className="auth-submit-content">
                {loading && <span className="auth-spinner" />}
                {loading ? 'Criando conta...' : 'Criar conta'}
              </span>
            </button>
          </form>

          <div className="auth-footer">
            Já tem uma conta?{' '}
            <Link to="/login">Entrar</Link>
          </div>
        </div>
      </motion.div>
    </>
  );
}
