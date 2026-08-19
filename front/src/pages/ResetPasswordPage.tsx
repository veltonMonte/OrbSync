import { useState, type FormEvent } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiLock, FiEyeOff, FiEye, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { authApi } from '../services/auth';
import './Auth.css';

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!token) {
      setStatus('error');
      setMessage('Token inválido ou ausente.');
      return;
    }
    if (!password.trim() || password.length < 6) {
      setStatus('error');
      setMessage('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setStatus('loading');
    setMessage('');

    try {
      const data = await authApi.resetPassword(token, password);
      setStatus('success');
      setMessage(data.message || 'Senha redefinida com sucesso!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err: any) {
      setStatus('error');
      setMessage(err.message || 'Ocorreu um erro ao redefinir a senha.');
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
          <h1 className="auth-title">Nova Senha</h1>
          <p className="auth-subtitle">Digite sua nova senha abaixo.</p>
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
            <label className="auth-label" htmlFor="reset-password">Nova Senha</label>
            <div className="auth-input-wrapper">
              <FiLock className="auth-input-icon" />
              <input
                id="reset-password"
                className="auth-input"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <button type="submit" className="auth-submit" disabled={status === 'loading' || status === 'success'}>
            <span className="auth-submit-content">
              {status === 'loading' && <span className="auth-spinner" />}
              {status === 'loading' ? 'Salvando...' : 'Salvar Nova Senha'}
            </span>
          </button>
        </form>
        
        <div className="auth-footer" style={{ marginTop: '2rem' }}>
          <Link to="/login">Voltar para Login</Link>
        </div>
      </motion.div>
    </div>
  );
}
