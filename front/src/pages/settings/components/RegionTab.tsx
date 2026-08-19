import { useState } from 'react';
import { FiSave } from 'react-icons/fi';

export function RegionTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [lang, setLang] = useState(() => localStorage.getItem('fluxionai_lang') || 'pt-BR');
  const [tz, setTz] = useState(() => localStorage.getItem('fluxionai_tz') || 'America/Sao_Paulo');
  const [dirty, setDirty] = useState(false);

  const handleSave = () => {
    localStorage.setItem('fluxionai_lang', lang);
    localStorage.setItem('fluxionai_tz', tz);
    document.documentElement.lang = lang;
    setDirty(false);
    showToast('success', 'Preferências regionais salvas.');
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Idioma e Região</h2>
        <p>Configure formatos de data, hora e o idioma de exibição da interface.</p>
      </header>
      <div className="stg-form-grid">
        <div className="stg-field">
          <label>Idioma da Interface</label>
          <select value={lang} onChange={e => { setLang(e.target.value); setDirty(true); }} className="stg-select">
            <option value="pt-BR">Português (Brasil)</option>
            <option value="en-US">English (US)</option>
            <option value="es-ES">Español (España)</option>
          </select>
        </div>
        <div className="stg-field">
          <label>Fuso Horário</label>
          <select value={tz} onChange={e => { setTz(e.target.value); setDirty(true); }} className="stg-select">
            <option value="America/Sao_Paulo">Brasília (UTC−03:00)</option>
            <option value="America/Manaus">Manaus (UTC−04:00)</option>
            <option value="America/New_York">Nova York (UTC−05:00)</option>
            <option value="Europe/Lisbon">Lisboa (UTC±00:00)</option>
            <option value="UTC">UTC</option>
          </select>
        </div>
      </div>
      <div className="stg-actions">
        <button className="stg-btn stg-btn--primary" disabled={!dirty} onClick={handleSave}>
          <FiSave /> Salvar preferências
        </button>
      </div>
    </section>
  );
}
