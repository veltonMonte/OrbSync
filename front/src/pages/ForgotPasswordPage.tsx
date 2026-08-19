import { useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiMail, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { authApi } from '../services/auth';
import './Auth.css';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setStatus('loading');
    setMessage('');

    try {
      const data = await authApi.forgotPassword(email.trim());
      setStatus('success');
      setMessage(data.message || 'E-mail de recuperação enviado!');
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Ocorreu um erro ao solicitar a recuperação de senha.');
    }
  };

  return (
    <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ maxWidth: 440, width: '100%' }}
      >
        <div className="auth-header">
          <h1 className="auth-title">Recuperar Senha</h1>
          <p className="auth-subtitle">
            Informe seu e-mail e enviaremos um link para você redefinir sua senha.
          </p>
        </div>

        <AnimatePresence>
          {status === 'error' && (
            <motion.div className="auth-error" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <FiAlertTriangle /> {message}
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div className="auth-error" style={{ background: 'rgba(52, 211, 153, 0.15)', borderColor: 'rgba(52, 211, 153, 0.3)', color: '#34d399' }} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <FiCheckCircle /> {message}
            </motion.div>
          )}
        </AnimatePresence>

        <form className="auth-form" onSubmit={handleSubmit}>
          <div className="auth-field">
            <label className="auth-label" htmlFor="forgot-email">E-mail</label>
            <div className="auth-input-wrapper">
              <FiMail className="auth-input-icon" />
              <input
                id="forgot-email"
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

          <button type="submit" className="auth-submit" disabled={status === 'loading'}>
            <span className="auth-submit-content">
              {status === 'loading' && <span className="auth-spinner" />}
              {status === 'loading' ? 'Enviando...' : 'Enviar Link'}
            </span>
          </button>
        </form>

        <div className="auth-footer">
          Lembrou a senha? <Link to="/login">Voltar para Login</Link>
        </div>
      </motion.div>
    </div>
  );
}
