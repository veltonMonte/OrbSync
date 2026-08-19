import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FiCheckCircle, FiXCircle, FiLoader, FiArrowRight } from 'react-icons/fi';
import { authApi } from '../services/auth';
import './Auth.css'; // Reusing auth styles for consistency

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();

  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Verificando seu e-mail...');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token de verificação ausente na URL.');
      return;
    }

    const verify = async () => {
      try {
        const data = await authApi.verifyEmail(token);
        setStatus('success');
        setMessage(data.message || 'E-mail verificado com sucesso!');
      } catch (error: any) {
        setStatus('error');
        setMessage(error.message || 'Falha ao verificar o e-mail. O link pode ter expirado.');
      }
    };

    verify();
  }, [token]);

  return (
    <div className="auth-page" style={{ justifyContent: 'center', alignItems: 'center', minHeight: '100vh', display: 'flex' }}>
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        style={{ textAlign: 'center', maxWidth: 440, width: '100%' }}
      >
        <div style={{ marginBottom: 32 }}>
          {status === 'loading' && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', color: 'var(--accent)', fontSize: 48 }}
            >
              <FiLoader />
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ color: 'var(--success)', fontSize: 48 }}
            >
              <FiCheckCircle />
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              style={{ color: 'var(--danger)', fontSize: 48 }}
            >
              <FiXCircle />
            </motion.div>
          )}
        </div>

        <h1 className="auth-title" style={{ marginBottom: 16 }}>
          {status === 'loading' ? 'Verificando...' : 
           status === 'success' ? 'Conta Verificada!' : 
           'Ops, algo deu errado'}
        </h1>
        
        <p className="auth-subtitle" style={{ marginBottom: 32, lineHeight: 1.5 }}>
          {message}
        </p>

        {status !== 'loading' && (
          <button 
            className="auth-submit" 
            onClick={() => navigate('/login')}
          >
            <span className="auth-submit-content">
              Ir para o Login <FiArrowRight />
            </span>
          </button>
        )}
      </motion.div>
    </div>
  );
}
