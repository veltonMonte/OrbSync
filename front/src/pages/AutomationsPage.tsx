import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiZap, FiTrash2, FiSettings, FiActivity } from 'react-icons/fi';
import { automationsApi, type Automation } from '../services/automations';
import { workspacesApi } from '../services/workspaces';
import AutomationsEditor from '../components/AutomationsEditor';
import { ReactFlowProvider } from '@xyflow/react';
import './Automations.css';

export default function AutomationsPage() {
  const [automations, setAutomations] = useState<Automation[]>([]);
  const [workspaceId, setWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditingWorkflow, setIsEditingWorkflow] = useState(false);
  const [selectedAutomation, setSelectedAutomation] = useState<Automation | null>(null);

  // Função para recarregar automações após salvar
  const reloadAutomations = async () => {
    if (!workspaceId) return;
    try {
      const data = await automationsApi.getAll(workspaceId);
      setAutomations(data);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        const gmailCode = urlParams.get('gmail_mock_code');
        if (gmailCode) {
          const token = localStorage.getItem('token');
          await fetch('http://localhost:3000/gmail/callback', {
            headers: { Authorization: `Bearer ${token}` }
          });
          alert('Integração com Gmail concluída com sucesso!');
          window.history.replaceState({}, document.title, '/automacoes');
        }

        const wks = await workspacesApi.getAll();
        if (wks && wks.length > 0) {
          setWorkspaceId(wks[0].id);
          const data = await automationsApi.getAll(wks[0].id);
          setAutomations(data);
        }
      } catch (err) {
        console.error('Erro ao carregar automações', err);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = async (id: string, currentStatus: boolean) => {
    try {
      const updated = await automationsApi.toggle(id, !currentStatus);
      setAutomations(prev => prev.map(a => a.id === id ? updated : a));
    } catch (err) {
      console.error('Erro ao alternar status', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Deseja realmente excluir esta automação?")) return;
    try {
      await automationsApi.delete(id);
      setAutomations(prev => prev.filter(a => a.id !== id));
    } catch (err) {
      console.error('Erro ao excluir automação', err);
    }
  };

  const handleCreateNew = () => {
    setSelectedAutomation(null);
    setIsEditingWorkflow(true);
  };

  const handleEdit = (auto: Automation) => {
    setSelectedAutomation(auto);
    setIsEditingWorkflow(true);
  };

  const handleSaveSuccess = () => {
    setIsEditingWorkflow(false);
    setSelectedAutomation(null);
    reloadAutomations();
  };

  const triggerLabels: Record<string, string> = {
    'CARD_MOVED': 'Quando um Card for movido',
    'CARD_CREATED': 'Quando um Card for criado',
    'DUE_DATE_REACHED': 'Quando o prazo expirar',
    'STATUS_CHANGED': 'Quando o status mudar'
  };

  if (isEditingWorkflow) {
    return (
      <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', zIndex: 9999, background: '#0f0f14' }}>
        <ReactFlowProvider>
          <AutomationsEditor 
            workspaceId={workspaceId} 
            existingAutomation={selectedAutomation}
            onBack={() => setIsEditingWorkflow(false)} 
            onSaveSuccess={handleSaveSuccess}
          />
        </ReactFlowProvider>
      </div>
    );
  }

  return (
    <div className="automations-page">
      <motion.div 
        className="automations-header"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <h1 className="automations-title">Workflows & Automações</h1>
          <p className="automations-subtitle">Automatize processos repetitivos e ganhe produtividade no seu Kanban.</p>
        </div>
        <div style={{ display: 'flex', gap: '1rem' }}>
          <button 
            className="automations-new-btn" 
            style={{ background: '#ea4335', color: '#fff' }}
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3000/gmail/auth', {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const data = await res.json();
                if (data.url) {
                  window.location.href = data.url;
                }
              } catch (e) {
                console.error("Erro ao iniciar auth do Gmail", e);
              }
            }}
          >
            <FiZap /> Conectar Gmail
          </button>
          <button 
            className="automations-new-btn" 
            style={{ background: '#4285F4', color: '#fff' }}
            onClick={async () => {
              try {
                const token = localStorage.getItem('token');
                const res = await fetch('http://localhost:3000/gmail/trigger', {
                  method: 'POST',
                  headers: { Authorization: `Bearer ${token}` }
                });
                if (res.ok) {
                  alert('Sincronização concluída! Verifique suas notificações e quadros.');
                }
              } catch (e) {
                console.error("Erro ao sincronizar Gmail", e);
              }
            }}
          >
            <FiActivity /> Sincronizar Gmail
          </button>
          <button className="automations-new-btn" onClick={handleCreateNew}>
            <FiPlus /> Novo Workflow
          </button>
        </div>
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <FiActivity className="spin" size={32} color="#c084fc" />
        </div>
      ) : (
        <motion.div 
          className="automations-grid"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {automations.length === 0 ? (
            <div style={{ color: '#a1a1aa', marginTop: '2rem' }}>
              Nenhuma automação configurada. Clique em "Nova Regra" para criar uma.
            </div>
          ) : (
            automations.map((auto, index) => (
              <motion.div 
                key={auto.id} 
                className="automation-card"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <div className="automation-card-top">
                  <div className="automation-card-icon">
                    <FiZap />
                  </div>
                  <label className="toggle-switch">
                    <input 
                      type="checkbox" 
                      checked={auto.isActive} 
                      onChange={() => handleToggle(auto.id, auto.isActive)} 
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
                
                <div style={{ cursor: 'pointer' }} onClick={() => handleEdit(auto)}>
                  <h3 className="automation-card-title">{auto.name}</h3>
                  <div className="automation-card-trigger">
                    <FiSettings size={14}/> {triggerLabels[auto.trigger] || auto.trigger}
                  </div>
                </div>

                <div className="automation-card-actions">
                  <span style={{ fontSize: '0.8rem', color: '#71717a' }}>
                    Criado em {new Date(auto.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                  <button className="automation-delete-btn" onClick={() => handleDelete(auto.id)}>
                    <FiTrash2 />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </motion.div>
      )}
    </div>
  );
}
