import { useState } from 'react';
import { motion } from 'framer-motion';
import { FiCheck } from 'react-icons/fi';

export function AppearanceTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('fluxionai_theme') || 'dark');

  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem('fluxionai_theme', value);
    if (value === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
    showToast('success', `Tema alterado para ${value === 'dark' ? 'escuro' : value === 'light' ? 'claro' : 'automático'}.`);
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Aparência</h2>
        <p>Personalize o visual da interface. No momento o tema escuro é o padrão do sistema.</p>
      </header>
      <div className="stg-theme-grid">
        {[
          { value: 'system', label: 'Sistema' },
          { value: 'light', label: 'Claro' },
          { value: 'dark', label: 'Escuro' },
        ].map(t => (
          <label key={t.value} className={`stg-theme-option${theme === t.value ? ' is-active' : ''}`}>
            <input type="radio" name="theme" value={t.value} checked={theme === t.value} onChange={() => handleThemeChange(t.value)} />
            <div className={`stg-theme-preview stg-theme-preview--${t.value}`}>
              {theme === t.value && (
                <motion.div className="stg-theme-check" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                  <FiCheck />
                </motion.div>
              )}
            </div>
            <span>{t.label}</span>
          </label>
        ))}
      </div>
    </section>
  );
}
