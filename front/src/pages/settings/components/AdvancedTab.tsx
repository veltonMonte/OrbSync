import { useState } from 'react';

export function AdvancedTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [devMode, setDevMode] = useState(() => localStorage.getItem('fluxionai_dev_mode') === 'true');
  const toggleDev = () => {
    const next = !devMode;
    setDevMode(next);
    localStorage.setItem('fluxionai_dev_mode', String(next));
    showToast('success', next ? 'Modo desenvolvedor ativado.' : 'Modo desenvolvedor desativado.');
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Configurações Avançadas</h2>
        <p>Recursos experimentais, webhooks e ferramentas de diagnóstico.</p>
      </header>
      <div className="stg-card stg-card--row stg-card--warning">
        <div>
          <h4>Modo Desenvolvedor</h4>
          <p className="stg-text-muted">Habilita logs detalhados, painéis de debug e acesso a APIs experimentais.</p>
        </div>
        <label className="stg-switch">
          <input type="checkbox" checked={devMode} onChange={toggleDev} />
          <span className="stg-switch-track" />
        </label>
      </div>
      <div className="stg-card stg-card--row" style={{ marginTop: 16 }}>
        <div>
          <h4>Exportar Dados</h4>
          <p className="stg-text-muted">Baixe um arquivo JSON com todos os seus projetos, documentos e configurações.</p>
        </div>
        <button className="stg-btn stg-btn--secondary stg-btn--sm" onClick={() => showToast('success', 'Exportação iniciada. Você receberá um email em breve.')}>
          Exportar
        </button>
      </div>
    </section>
  );
}
