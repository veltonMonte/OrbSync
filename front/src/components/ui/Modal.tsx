import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX, FiAlertTriangle } from 'react-icons/fi';
import './Modal.css';

export function Modal({ open, onClose, title, description, icon, iconColor, children, size = 'md' }: {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  iconColor?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}) {
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="stg-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          onClick={handleBackdropClick}
        >
          <motion.div
            className={`stg-modal stg-modal--${size}`}
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="stg-modal-header">
              <div className="stg-modal-header-left">
                {icon && (
                  <div className="stg-modal-icon" style={iconColor ? { background: iconColor } : {}}>
                    {icon}
                  </div>
                )}
                <div>
                  <h3 className="stg-modal-title">{title}</h3>
                  {description && <p className="stg-modal-desc">{description}</p>}
                </div>
              </div>
              <button className="stg-modal-close" onClick={onClose}><FiX /></button>
            </div>
            <div className="stg-modal-body">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function ConfirmModal({ open, onClose, onConfirm, title, description, confirmLabel, loading }: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmLabel?: string;
  loading?: boolean;
}) {
  return (
    <Modal open={open} onClose={onClose} title={title} icon={<FiAlertTriangle />} iconColor="var(--danger)" size="sm">
      <p className="stg-confirm-text">{description}</p>
      <div className="stg-modal-footer">
        <button className="stg-btn stg-btn--ghost" onClick={onClose} disabled={loading}>Cancelar</button>
        <button className="stg-btn stg-btn--danger" onClick={onConfirm} disabled={loading}>
          {loading ? <span className="stg-spinner" /> : null}
          {confirmLabel || 'Confirmar'}
        </button>
      </div>
    </Modal>
  );
}
