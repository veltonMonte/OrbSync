import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiBell, FiBellOff, FiCheck, FiTrash2 } from 'react-icons/fi';
import { notificationsApi, type AppNotification } from '../services/notifications';
import './NotificationsPanel.css';

interface NotificationsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onUnreadCountChange?: (count: number) => void;
}

export default function NotificationsPanel({ isOpen, onClose, onUnreadCountChange }: NotificationsPanelProps) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promptValues, setPromptValues] = useState<Record<string, string>>({});

  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      const data = await notificationsApi.getAll();
      setNotifications(data);
      const unreadCount = data.filter(n => !n.isRead).length;
      onUnreadCountChange?.(unreadCount);
    } catch (error) {
      console.error('Erro ao buscar notificações', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchNotifications();
    }
  }, [isOpen]);

  const handleMarkAsRead = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.markAsRead([id]);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      const newUnreadCount = notifications.filter(n => !n.isRead && n.id !== id).length;
      onUnreadCountChange?.(newUnreadCount);
    } catch (error) {
      console.error('Erro ao marcar como lida', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unreadIds = notifications.filter(n => !n.isRead).map(n => n.id);
    if (unreadIds.length === 0) return;

    try {
      await notificationsApi.markAsRead(unreadIds);
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Erro ao marcar todas como lidas', error);
    }
  };

  const handleClearAll = async () => {
    if (notifications.length === 0) return;
    try {
      await notificationsApi.deleteAll();
      setNotifications([]);
      onUnreadCountChange?.(0);
    } catch (error) {
      console.error('Erro ao esvaziar notificações', error);
    }
  };

  const handleExecuteTask = async (id: string, e: React.MouseEvent, actionData?: any) => {
    e.stopPropagation();
    try {
      await notificationsApi.executeTask(id, actionData);
      setNotifications(prev => prev.filter(n => n.id !== id));
      // update unread count since we removed one
      const newUnreadCount = notifications.filter(n => !n.isRead && n.id !== id).length;
      onUnreadCountChange?.(newUnreadCount);
      // We could use a toast here if imported, but we'll assume it works
    } catch (error) {
      console.error('Erro ao executar tarefa', error);
    }
  };

  const handleDeleteTask = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await notificationsApi.delete(id);
      setNotifications(prev => prev.filter(n => n.id !== id));
      const newUnreadCount = notifications.filter(n => !n.isRead && n.id !== id).length;
      onUnreadCountChange?.(newUnreadCount);
    } catch (error) {
      console.error('Erro ao remover notificação', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            className="notifications-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="notifications-panel"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="notifications-header">
              <h2><FiBell /> Notificações</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button 
                  className="toast-close" 
                  onClick={handleClearAll}
                  title="Esvaziar notificações"
                >
                  <FiTrash2 />
                </button>
                <button 
                  className="toast-close" 
                  onClick={handleMarkAllAsRead}
                  title="Marcar todas como lidas"
                >
                  <FiCheck />
                </button>
                <button className="notifications-close" onClick={onClose}>
                  <FiX size={20} />
                </button>
              </div>
            </div>

            <div className="notifications-list">
              {isLoading && notifications.length === 0 ? (
                <div className="notifications-empty">Carregando...</div>
              ) : notifications.length === 0 ? (
                <div className="notifications-empty">
                  <FiBellOff className="notifications-empty-icon" />
                  <p>Você não tem novas notificações.</p>
                </div>
              ) : (
                notifications.map(notif => {
                  let payload = null;
                  if (notif.type === 'SYSTEM' && notif.linkUrl) {
                    try {
                      payload = JSON.parse(notif.linkUrl);
                    } catch (e) {
                      // ignore parse error
                    }
                  }

                  return (
                    <div 
                      key={notif.id} 
                      className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                      onClick={(e) => !notif.isRead && handleMarkAsRead(notif.id, e)}
                    >
                      <div className="notification-header">
                        <h4 className="notification-title">{notif.title}</h4>
                        <span className="notification-time">{formatDate(notif.createdAt)}</span>
                      </div>
                      <p className="notification-content">{notif.message}</p>
                      
                      {payload && payload.type && (
                        <div className="notification-actions" style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                          {payload.actionType === 'prompt' ? (
                            <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                              <input 
                                type="text"
                                className="notification-prompt-input"
                                placeholder="Digite sua resposta..."
                                value={promptValues[notif.id] || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setPromptValues({ ...promptValues, [notif.id]: e.target.value })}
                                style={{ flex: 1, padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                              />
                              <button 
                                className="toast-action-btn" 
                                style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={(e) => handleExecuteTask(notif.id, e, { answer: promptValues[notif.id] })}
                              >
                                Enviar
                              </button>
                            </div>
                          ) : payload.actionType === 'choice' ? (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="toast-action-btn" 
                                style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                onClick={(e) => handleExecuteTask(notif.id, e, { answer: 'yes' })}
                              >
                                Sim
                              </button>
                              <button 
                                className="toast-action-btn"
                                style={{ background: '#374151', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                onClick={(e) => handleExecuteTask(notif.id, e, { answer: 'no' })}
                              >
                                Não
                              </button>
                            </div>
                          ) : payload.type === 'AI_LEAD_RESPONSE_PERMISSION' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                              <input 
                                type="text"
                                className="notification-prompt-input"
                                placeholder="Instrução (ex: seja formal)..."
                                value={promptValues[notif.id] || ''}
                                onClick={(e) => e.stopPropagation()}
                                onChange={(e) => setPromptValues({ ...promptValues, [notif.id]: e.target.value })}
                                style={{ padding: '8px 12px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(0,0,0,0.2)', color: 'white' }}
                              />
                              <div style={{ display: 'flex', gap: '8px' }}>
                                <button 
                                  className="toast-action-btn" 
                                  style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                  onClick={(e) => handleExecuteTask(notif.id, e, { allowAiResponse: true, responseInstruction: promptValues[notif.id] || '' })}
                                >
                                  Permitir IA
                                </button>
                                <button 
                                  className="toast-action-btn"
                                  style={{ background: '#374151', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                  onClick={(e) => handleExecuteTask(notif.id, e, { allowAiResponse: false })}
                                >
                                  Recusar
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: '8px' }}>
                              <button 
                                className="toast-action-btn" 
                                style={{ background: '#10b981', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer', flex: 1 }}
                                onClick={(e) => handleExecuteTask(notif.id, e)}
                              >
                                Aceitar e Executar
                              </button>
                              <button 
                                className="toast-action-btn"
                                style={{ background: '#374151', color: 'white', padding: '6px 12px', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                                onClick={(e) => handleDeleteTask(notif.id, e)}
                              >
                                Recusar
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
