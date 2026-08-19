import { useState, useEffect } from 'react';
import { FiSave } from 'react-icons/fi';
import { useAuth } from '../../../contexts/AuthContext';
import { ConfirmModal } from '../../../components/ui/Modal';

export function AccountTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const { user } = useAuth();
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  useEffect(() => {
    setDirty(name !== (user?.name || '') || email !== (user?.email || ''));
  }, [name, email, user]);

  const handleSave = async () => {
    setSaving(true);
    showToast('error', 'Funcionalidade em breve — a edição de perfil ainda não está conectada ao backend.');
    setSaving(false);
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Conta e Perfil</h2>
        <p>Informações de identidade e configurações de exibição do seu perfil.</p>
      </header>

      <div className="stg-card">
        <div className="stg-avatar-row">
          <div className="stg-avatar">
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user?.name || 'User'} style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }} />
            ) : (
              user?.name?.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          <div className="stg-avatar-info">
            <button className="stg-btn stg-btn--secondary stg-btn--sm">Alterar foto</button>
            <span className="stg-text-muted">PNG, JPG ou WebP. Máx. 2 MB.</span>
          </div>
        </div>
      </div>

      <div className="stg-form-grid">
        <div className="stg-field">
          <label>Nome completo</label>
          <input type="text" value={name} onChange={e => setName(e.target.value)} className="stg-input" />
        </div>
        <div className="stg-field">
          <label>Email principal</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="stg-input" />
          <span className="stg-field-hint">Usado para login e notificações críticas do sistema.</span>
        </div>
      </div>

      <div className="stg-actions">
        <button className="stg-btn stg-btn--primary" onClick={handleSave} disabled={!dirty || saving}>
          {saving ? <span className="stg-spinner" /> : <FiSave />}
          {saving ? 'Salvando…' : 'Salvar alterações'}
        </button>
      </div>

      <div className="stg-danger-zone">
        <div>
          <h4>Excluir conta permanentemente</h4>
          <p>Todos os dados, projetos, automações e integrações serão apagados. Essa ação é irreversível.</p>
        </div>
        <button className="stg-btn stg-btn--danger stg-btn--sm" onClick={() => setDeleteModalOpen(true)}>
          Excluir minha conta
        </button>
      </div>

      <ConfirmModal
        open={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => { setDeleteModalOpen(false); showToast('error', 'Funcionalidade em breve.'); }}
        title="Excluir conta permanentemente"
        description="Esta ação apagará todos os seus projetos, automações, integrações e dados de forma irreversível. Tem certeza absoluta?"
        confirmLabel="Sim, excluir tudo"
      />
    </section>
  );
}
