import { useState } from 'react';
import { FiKey } from 'react-icons/fi';

export function SecurityTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [saving, setSaving] = useState(false);

  const pwValid = newPw.length >= 8;
  const pwMatch = newPw === confirmPw && confirmPw.length > 0;

  const handleChangePassword = async () => {
    setSaving(true);
    showToast('error', 'Funcionalidade em breve — a troca de senha ainda não está conectada ao backend.');
    setSaving(false);
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Privacidade e Segurança</h2>
        <p>Proteja sua conta com autenticação reforçada e troque sua senha quando necessário.</p>
      </header>

      <div className="stg-card stg-card--row">
        <div>
          <h4>Autenticação de Dois Fatores (2FA)</h4>
          <p className="stg-text-muted">Exige um código temporário gerado por app autenticador além da senha.</p>
        </div>
        <button
          className="stg-btn stg-btn--sm stg-btn--secondary"
          onClick={() => showToast('error', 'Funcionalidade em breve — 2FA ainda não está implementado.')}
          title="Em breve"
        >
          Habilitar 2FA
        </button>
      </div>

      <h3 className="stg-section-title" style={{ marginTop: 32 }}>Alterar senha</h3>

      <div className="stg-form-stack">
        <div className="stg-field">
          <label>Senha atual</label>
          <input type="password" value={currentPw} onChange={e => setCurrentPw(e.target.value)} placeholder="••••••••" className="stg-input" />
        </div>
        <div className="stg-field">
          <label>Nova senha</label>
          <input type="password" value={newPw} onChange={e => setNewPw(e.target.value)} placeholder="Mínimo 8 caracteres" className={`stg-input${newPw && !pwValid ? ' is-error' : ''}`} />
          {newPw && !pwValid && <span className="stg-field-error">Mínimo de 8 caracteres.</span>}
        </div>
        <div className="stg-field">
          <label>Confirmar nova senha</label>
          <input type="password" value={confirmPw} onChange={e => setConfirmPw(e.target.value)} placeholder="Repita a nova senha" className={`stg-input${confirmPw && !pwMatch ? ' is-error' : ''}`} />
          {confirmPw && !pwMatch && <span className="stg-field-error">Senhas não coincidem.</span>}
        </div>
      </div>

      <div className="stg-actions">
        <button className="stg-btn stg-btn--primary" onClick={handleChangePassword} disabled={saving || !currentPw || !pwValid || !pwMatch}>
          {saving ? <span className="stg-spinner" /> : <FiKey />}
          {saving ? 'Atualizando…' : 'Atualizar senha'}
        </button>
      </div>
    </section>
  );
}
