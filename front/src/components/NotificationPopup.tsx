import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { notificationsApi, type AppNotification } from '../services/notifications';
import { FiX, FiBell, FiCheckSquare, FiSquare } from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import './NotificationPopup.css';

export default function NotificationPopup() {
  const [activeNotif, setActiveNotif] = useState<AppNotification | null>(null);
  const [promptValue, setPromptValue] = useState('');
  const [allowAiResponse, setAllowAiResponse] = useState(false);
  const activeNotifIdRef = useRef<string | null>(null);

  useEffect(() => {
    activeNotifIdRef.current = activeNotif?.id ?? null;
  }, [activeNotif]);

  useEffect(() => {
    const fetchActiveNotification = async () => {
      try {
        const notifs = await notificationsApi.getAll();
        const unreadAction = notifs.find(n => !n.isRead && n.linkUrl);
        
        if (unreadAction && activeNotifIdRef.current !== unreadAction.id) {
          setActiveNotif(unreadAction);
          setPromptValue('');
          setAllowAiResponse(false);
        } else if (!unreadAction && activeNotifIdRef.current) {
          setActiveNotif(null);
        }
      } catch (error) {
        console.error('Failed to fetch notifications for popup', error);
      }
    };

    fetchActiveNotification();
    const interval = setInterval(fetchActiveNotification, 4000);
    return () => clearInterval(interval);
  }, []);

  const handleExecute = async (id: string, actionData?: any) => {
    try {
      await notificationsApi.executeTask(id, actionData);
      setActiveNotif(null);
    } catch (error) {
      console.error('Error executing task', error);
    }
  };

  const handleDismiss = async (id: string) => {
    try {
      await notificationsApi.markAsRead([id]);
      setActiveNotif(null);
    } catch (error) {
      console.error('Error dismissing notification', error);
    }
  };

  if (!activeNotif) return null;

  let payload: any = null;
  try {
    if (activeNotif.linkUrl) {
      payload = JSON.parse(activeNotif.linkUrl);
    }
  } catch (e) {
    // Ignore parse error
  }

  const isTeamWhatsapp = payload?.type === 'TEAM_WHATSAPP_CONFIRM';
  const isAiLeadPermission = payload?.type === 'AI_LEAD_RESPONSE_PERMISSION';

  return (
    <AnimatePresence>
      {activeNotif && payload && (
        <motion.div
          className="notification-popup-container"
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        >
          <div className="notification-popup-header">
            <div className="notification-popup-title-group">
              {isTeamWhatsapp ? (
                <FaWhatsapp className="notification-popup-icon" style={{ color: '#25D366' }} />
              ) : (
                <FiBell className="notification-popup-icon" />
              )}
              <h3>{activeNotif.title}</h3>
            </div>
            <button className="notification-popup-close" onClick={() => handleDismiss(activeNotif.id)}>
              <FiX />
            </button>
          </div>
          
          <div className="notification-popup-content">
            <p>{activeNotif.message}</p>
          </div>
          
          <div className="notification-popup-actions">
            {isTeamWhatsapp ? (
              <div className="notification-popup-btn-group">
                <button 
                  className="notification-popup-btn primary"
                  style={{ background: '#25D366' }}
                  onClick={() => handleExecute(activeNotif.id, { answer: 'yes' })}
                >
                  <FaWhatsapp style={{ marginRight: 6 }} /> Notificar Equipe
                </button>
                <button 
                  className="notification-popup-btn secondary"
                  onClick={() => handleExecute(activeNotif.id, { answer: 'no' })}
                >
                  Negar
                </button>
              </div>
            ) : isAiLeadPermission ? (
              <div className="notification-popup-prompt-group">
                <label 
                  style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem', color: '#ececec', fontWeight: 600 }}
                  onClick={() => setAllowAiResponse(!allowAiResponse)}
                >
                  {allowAiResponse ? <FiCheckSquare style={{ color: '#E2A336', fontSize: '1.1rem' }} /> : <FiSquare style={{ color: '#888', fontSize: '1.1rem' }} />}
                  <span>Permitir que a IA responda aos clientes</span>
                </label>

                <div style={{ position: 'relative' }}>
                  <input 
                    type="text"
                    placeholder={allowAiResponse ? "ex: responda uma pequena frase e seja descontraido" : "Marque a caixa acima para liberar este campo..."}
                    value={promptValue}
                    onChange={(e) => setPromptValue(e.target.value)}
                    disabled={!allowAiResponse}
                    className="notification-popup-input"
                    style={{
                      opacity: allowAiResponse ? 1 : 0.45,
                      cursor: allowAiResponse ? 'text' : 'not-allowed',
                      background: allowAiResponse ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.3)',
                    }}
                  />
                </div>

                <div className="notification-popup-btn-group">
                  <button 
                    className="notification-popup-btn primary"
                    disabled={!allowAiResponse && promptValue.trim() === ''}
                    onClick={() => handleExecute(activeNotif.id, { allowAiResponse, responseInstruction: promptValue })}
                  >
                    Confirmar Instruções
                  </button>
                  <button 
                    className="notification-popup-btn secondary"
                    onClick={() => handleExecute(activeNotif.id, { allowAiResponse: false })}
                  >
                    Recusar
                  </button>
                </div>
              </div>
            ) : payload.actionType === 'prompt' ? (
              <div className="notification-popup-prompt-group">
                <input 
                  type="text"
                  placeholder="Sua resposta..."
                  value={promptValue}
                  onChange={(e) => setPromptValue(e.target.value)}
                  className="notification-popup-input"
                />
                <button 
                  className="notification-popup-btn primary"
                  onClick={() => handleExecute(activeNotif.id, { answer: promptValue })}
                >
                  Enviar
                </button>
              </div>
            ) : payload.actionType === 'choice' ? (
              <div className="notification-popup-btn-group">
                <button 
                  className="notification-popup-btn primary"
                  onClick={() => handleExecute(activeNotif.id, { answer: 'yes' })}
                >
                  Sim
                </button>
                <button 
                  className="notification-popup-btn secondary"
                  onClick={() => handleExecute(activeNotif.id, { answer: 'no' })}
                >
                  Não
                </button>
              </div>
            ) : (
              <div className="notification-popup-btn-group">
                <button 
                  className="notification-popup-btn primary"
                  onClick={() => handleExecute(activeNotif.id)}
                >
                  Aceitar e Executar
                </button>
                <button 
                  className="notification-popup-btn secondary"
                  onClick={() => handleDismiss(activeNotif.id)}
                >
                  Recusar
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


