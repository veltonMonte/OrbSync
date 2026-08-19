import { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';

export function NotificationsTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [prefs, setPrefs] = useState(() => {
    const saved = localStorage.getItem('fluxionai_notif_prefs');
    return saved ? JSON.parse(saved) : {
      dailyDigest: true, newLogins: true, productUpdates: false, leadAlerts: true,
      whatsappTeamNotif: true, approvalMode: 'card', teamPhone: '5585999999999', autoAiReply: false
    };
  });

  const toggle = (key: string) => {
    const next = { ...prefs, [key]: !prefs[key] };
    setPrefs(next);
    localStorage.setItem('fluxionai_notif_prefs', JSON.stringify(next));
    showToast('success', 'Preferência atualizada.');
  };

  const updateSetting = (key: string, value: any) => {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    localStorage.setItem('fluxionai_notif_prefs', JSON.stringify(next));
    showToast('success', 'Configuração salva.');
  };

  const items = [
    { key: 'dailyDigest', title: 'Resumo Diário', desc: 'Um email matinal com o resumo de leads capturados e tarefas pendentes.' },
    { key: 'newLogins', title: 'Novos acessos à conta', desc: 'Notificação de segurança quando houver login de um dispositivo ou IP desconhecido.' },
    { key: 'leadAlerts', title: 'Alertas de Leads', desc: 'Aviso instantâneo quando um lead de alta prioridade for identificado pela IA.' },
    { key: 'whatsappTeamNotif', title: 'Notificações de Equipe via WhatsApp', desc: 'Alertar equipe sobre Kanban, Documentos, Commits de Git e novos Leads via Evolution API.' },
  ];

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Notificações e Permissões</h2>
        <p>Defina suas preferências de alerta e permissões para notificações via WhatsApp e respostas da IA.</p>
      </header>

      <div className="stg-toggle-list">
        {items.map(item => (
          <div className="stg-toggle-row" key={item.key}>
            <div className="stg-toggle-info">
              <h4>{item.title}</h4>
              <p>{item.desc}</p>
            </div>
            <label className="stg-switch">
              <input type="checkbox" checked={!!prefs[item.key]} onChange={() => toggle(item.key)} />
              <span className="stg-switch-track" />
            </label>
          </div>
        ))}
      </div>

      <div className="stg-card" style={{ marginTop: 24 }}>
        <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 8 }}>
          <FaWhatsapp style={{ color: '#25D366' }} /> Configurações de Autorização (WhatsApp)
        </h3>

        <div className="stg-field" style={{ marginBottom: 16 }}>
          <label>Modo de Aprovação de Notificações para a Equipe</label>
          <select 
            className="stg-select"
            value={prefs.approvalMode || 'card'}
            onChange={(e) => updateSetting('approvalMode', e.target.value)}
          >
            <option value="card">Sempre pedir autorização no Card no canto da tela (Recomendado)</option>
            <option value="auto">Enviar automaticamente sem solicitar autorização</option>
            <option value="disabled">Desativar notificações de equipe</option>
          </select>
          <span className="stg-field-hint">Quando ativado no modo Card, um pop-up aparecerá perguntando "Notificar Equipe" ou "Negar".</span>
        </div>

        <div className="stg-field">
          <label>Telefone / WhatsApp da Equipe para Recebimento</label>
          <input 
            type="text"
            className="stg-input"
            placeholder="5585999999999"
            value={prefs.teamPhone || ''}
            onChange={(e) => updateSetting('teamPhone', e.target.value)}
          />
        </div>
      </div>
    </section>
  );
}
