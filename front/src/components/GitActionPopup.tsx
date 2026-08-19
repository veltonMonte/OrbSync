import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiTerminal, FiX, FiCheck, FiGithub } from 'react-icons/fi';
import type { Card } from '../services/cards';
import type { Project } from '../services/projects';

interface GitActionPopupProps {
  isOpen: boolean;
  card: Card | null;
  project: Project | null;
  actionType: 'start_progress' | 'finish' | null;
  onConfirm: (cmd: string) => void;
  onCancel: () => void;
}

export default function GitActionPopup({ isOpen, card, project, actionType, onConfirm, onCancel }: GitActionPopupProps) {
  const [command, setCommand] = useState('');

  useEffect(() => {
    if (isOpen && card) {
      const sanitizedTitle = card.title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      const branchName = card.branchName || `feature/${card.id.substring(0, 5)}-${sanitizedTitle}`;
      
      if (actionType === 'start_progress') {
        setCommand(`git checkout -b ${branchName}`);
      } else if (actionType === 'finish') {
        setCommand(`git add . && git commit -m "Resolve: ${card.title}" && git push`);
      }
    }
  }, [isOpen, card, actionType]);

  if (!isOpen || !card || !project) return null;

  const isConfigured = !!project.localPath;

  return (
    <AnimatePresence>
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          style={{
            background: 'var(--bg-secondary)', padding: '2rem', borderRadius: '16px',
            width: '90%', maxWidth: '500px', border: '1px solid var(--border-subtle)',
            boxShadow: '0 20px 40px rgba(0,0,0,0.4)', position: 'relative'
          }}
        >
          <button onClick={onCancel} style={{
            position: 'absolute', top: '1rem', right: '1rem', background: 'transparent',
            border: 'none', color: 'var(--text-secondary)', cursor: 'pointer'
          }}>
            <FiX size={24} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', color: '#c084fc' }}>
            <FiGithub size={24} />
            <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Ação Git Detectada</h2>
          </div>

          <p style={{ color: 'var(--text-secondary)', marginBottom: '1.5rem', lineHeight: 1.5 }}>
            Você moveu o card <strong>"{card.title}"</strong> para {actionType === 'start_progress' ? 'Em Progresso' : 'Concluído'}. 
            {isConfigured ? ' Deseja executar o seguinte comando no seu repositório local?' : ' Configure o caminho local do projeto para usar integrações Git automáticas.'}
          </p>

          {isConfigured && (
            <div style={{ marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '0.8rem', color: 'var(--text-tertiary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <FiTerminal /> Comando a ser executado em <code>{project.localPath}</code>
              </div>
              <input
                type="text"
                value={command}
                onChange={e => setCommand(e.target.value)}
                style={{
                  width: '100%', padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(139, 92, 246, 0.4)', color: '#00e6cc',
                  fontFamily: 'monospace', borderRadius: '8px', outline: 'none'
                }}
              />
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
            <button onClick={onCancel} style={{
              padding: '0.5rem 1rem', background: 'transparent', border: '1px solid var(--border-subtle)',
              color: 'var(--text-primary)', borderRadius: '8px', cursor: 'pointer'
            }}>
              Ignorar
            </button>
            {isConfigured && (
              <button onClick={() => onConfirm(command)} style={{
                padding: '0.5rem 1rem', background: '#c084fc', border: 'none',
                color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem',
                fontWeight: 600
              }}>
                <FiCheck /> Executar Comando
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
