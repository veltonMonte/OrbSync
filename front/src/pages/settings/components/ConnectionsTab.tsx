import { useState, useEffect } from 'react';
import {
  FiGithub, FiMail, FiCpu, FiCheck,
  FiTrash2, FiEye, FiEyeOff, FiSave, FiExternalLink,
  FiRefreshCw, FiSend
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import { Modal, ConfirmModal } from '../../../components/ui/Modal';
import { useAuth } from '../../../contexts/AuthContext';
import { aiService, AI_PROVIDER_MODELS } from '../../../services/ai';
import type { AiProvider, AiConfig } from '../../../services/ai';
import { whatsappApi } from '../../../services/whatsapp';

export function ConnectionsTab({ showToast }: { showToast: (t: 'success' | 'error', m: string) => void }) {
  const { user } = useAuth();
  const ghTokenKey = user?.id ? `fluxionai_gh_token_${user.id}` : 'fluxionai_gh_token';
  const [savedGhToken, setSavedGhToken] = useState(() => localStorage.getItem(ghTokenKey) || '');
  const [aiConfig, setAiConfig] = useState<AiConfig | null>(null);
  const [aiLoading, setAiLoading] = useState(true);

  const isGmailConnected = user?.email?.endsWith('@gmail.com') || user?.email?.endsWith('@googlemail.com');

  // Modal states
  const [ghModalOpen, setGhModalOpen] = useState(false);
  const [aiModalOpen, setAiModalOpen] = useState(false);
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [disconnectGhModal, setDisconnectGhModal] = useState(false);
  const [deleteAiModal, setDeleteAiModal] = useState(false);

  useEffect(() => {
    setSavedGhToken(localStorage.getItem(ghTokenKey) || '');
    loadAiConfig();
  }, [ghTokenKey]);

  const loadAiConfig = async () => {
    setAiLoading(true);
    try {
      const config = await aiService.getConfig();
      setAiConfig(config);
    } catch { setAiConfig(null); }
    finally { setAiLoading(false); }
  };

  const handleDisconnectGh = () => {
    localStorage.removeItem(ghTokenKey);
    localStorage.removeItem('fluxionai_gh_token');
    setSavedGhToken('');
    setDisconnectGhModal(false);
    showToast('success', 'GitHub desconectado.');
  };

  const handleDeleteAi = async () => {
    try {
      await aiService.deleteConfig();
      setAiConfig(null);
      setDeleteAiModal(false);
      showToast('success', 'Configuração de IA removida. Usando Gemini padrão.');
    } catch { showToast('error', 'Erro ao remover configuração.'); }
  };

  const PROVIDER_COLORS: Record<AiProvider, string> = {
    gemini: '#4285f4',
    openai: '#10a37f',
    anthropic: '#d97706',
  };

  return (
    <section className="stg-section">
      <header className="stg-header">
        <h2>Conexões e Integrações</h2>
        <p>Vincule serviços externos para automatizar fluxos e expandir as capacidades do workspace.</p>
      </header>

      <div className="stg-integrations">

        {/* ─── GitHub Card ─── */}
        <div className={`stg-intg-card${savedGhToken ? ' is-connected' : ''}`}>
          <div className="stg-intg-icon" style={{ background: '#24292e' }}><FiGithub /></div>
          <div className="stg-intg-body">
            <div className="stg-intg-top">
              <h3>GitHub</h3>
              {savedGhToken
                ? <span className="stg-badge stg-badge--ok"><span className="stg-badge-dot" /> Conectado</span>
                : <span className="stg-badge stg-badge--off"><span className="stg-badge-dot" /> Não conectado</span>
              }
            </div>
            <p>Sincronize repositórios, acesse insights de commits e habilite automações de CI/CD.</p>
            {savedGhToken ? (
              <div className="stg-intg-connected-row">
                <code className="stg-intg-token-mask">ghp_…{savedGhToken.slice(-6)}</code>
                <div className="stg-intg-config-actions">
                  <button className="stg-btn stg-btn--secondary stg-btn--sm" onClick={() => setGhModalOpen(true)}>Alterar token</button>
                  <button className="stg-btn stg-btn--danger-ghost stg-btn--sm" onClick={() => setDisconnectGhModal(true)} aria-label="Desconectar GitHub"><FiTrash2 /></button>
                </div>
              </div>
            ) : (
              <button className="stg-btn stg-btn--primary stg-btn--sm" style={{ marginTop: 12 }} onClick={() => setGhModalOpen(true)}>
                Conectar GitHub
              </button>
            )}
          </div>
        </div>

        {/* ─── Email Card ─── */}
        <div className={`stg-intg-card${isGmailConnected ? ' is-connected' : ''}`}>
          <div className="stg-intg-icon" style={{ background: '#ea4335' }}><FiMail /></div>
          <div className="stg-intg-body">
            <div className="stg-intg-top">
              <h3>Conta de Email</h3>
              {isGmailConnected ? (
                <span className="stg-badge stg-badge--ok"><span className="stg-badge-dot" /> Conectado</span>
              ) : (
                <span className="stg-badge stg-badge--off"><span className="stg-badge-dot" /> Não conectado</span>
              )}
            </div>
            <p>Vincule Google Workspace ou SMTP para campanhas e alertas de leads.</p>
            {isGmailConnected ? (
              <div className="stg-intg-connected-row" style={{ marginTop: 12 }}>
                <code className="stg-intg-token-mask">{user?.email}</code>
                <div className="stg-intg-config-actions">
                  <button className="stg-btn stg-btn--secondary stg-btn--sm" onClick={() => setEmailModalOpen(true)}>Alterar</button>
                </div>
              </div>
            ) : (
              <button className="stg-btn stg-btn--primary stg-btn--sm" style={{ marginTop: 12 }} onClick={() => setEmailModalOpen(true)}>
                Conectar Conta
              </button>
            )}
          </div>
        </div>

        {/* ─── WhatsApp Card (Evolution API) ─── */}
        <div className="stg-intg-card">
          <div className="stg-intg-icon" style={{ background: '#25D366' }}><FaWhatsapp /></div>
          <div className="stg-intg-body">
            <div className="stg-intg-top">
              <h3>WhatsApp (Evolution API)</h3>
              <span className="stg-badge stg-badge--ok"><span className="stg-badge-dot" /> Atendimento IA</span>
            </div>
            <p>Conecte instâncias do WhatsApp para envio automático e atendimento inteligente de clientes e leads.</p>
            <div style={{ marginTop: 12 }}>
              <button className="stg-btn stg-btn--primary stg-btn--sm" onClick={() => setWhatsappModalOpen(true)}>
                Gerenciar Conexão WhatsApp
              </button>
            </div>
          </div>
        </div>

        {/* ─── AI Provider Card ─── */}
        <div className={`stg-intg-card${aiConfig ? ' is-connected' : ''}`}>
          <div className="stg-intg-icon" style={{ background: aiConfig ? PROVIDER_COLORS[aiConfig.provider] : '#6366f1' }}>
            <FiCpu />
          </div>
          <div className="stg-intg-body">
            <div className="stg-intg-top">
              <h3>Provider de IA (BYOK)</h3>
              {aiLoading ? (
                <span className="stg-badge stg-badge--off"><span className="stg-spinner stg-spinner--sm" /></span>
              ) : aiConfig ? (
                <span className="stg-badge stg-badge--ok">
                  <span className="stg-badge-dot" style={{ background: PROVIDER_COLORS[aiConfig.provider] }} />
                  {AI_PROVIDER_MODELS[aiConfig.provider]?.label || aiConfig.provider}
                </span>
              ) : (
                <span className="stg-badge stg-badge--off">Gemini Padrão</span>
              )}
            </div>
            <p>Configure sua própria chave de API (Google Gemini, OpenAI ou Anthropic Claude) para uso nos agentes e chat.</p>
            {aiConfig ? (
              <div className="stg-intg-connected-row">
                <span className="stg-ai-model-tag">{aiConfig.model}</span>
                <div className="stg-intg-config-actions">
                  <button className="stg-btn stg-btn--secondary stg-btn--sm" onClick={() => setAiModalOpen(true)}>Alterar</button>
                  <button className="stg-btn stg-btn--danger-ghost stg-btn--sm" onClick={() => setDeleteAiModal(true)} aria-label="Remover configuração de IA"><FiTrash2 /></button>
                </div>
              </div>
            ) : (
              <button className="stg-btn stg-btn--primary stg-btn--sm" style={{ marginTop: 12 }} onClick={() => setAiModalOpen(true)}>
                Configurar Chave Própria
              </button>
            )}
          </div>
        </div>

      </div>

      {/* MODALS */}
      <GitHubModal
        open={ghModalOpen}
        onClose={() => setGhModalOpen(false)}
        onSaved={token => {
          setSavedGhToken(token);
          setGhModalOpen(false);
          showToast('success', 'GitHub conectado com sucesso!');
        }}
      />

      <AiProviderModal
        open={aiModalOpen}
        onClose={() => setAiModalOpen(false)}
        currentConfig={aiConfig}
        onSaved={() => {
          loadAiConfig();
          setAiModalOpen(false);
          showToast('success', 'Configuração de IA salva com sucesso!');
        }}
        showToast={showToast}
      />

      <EmailModal open={emailModalOpen} onClose={() => setEmailModalOpen(false)} />

      <WhatsappModal
        open={whatsappModalOpen}
        onClose={() => setWhatsappModalOpen(false)}
        showToast={showToast}
      />

      <ConfirmModal
        open={disconnectGhModal}
        onClose={() => setDisconnectGhModal(false)}
        onConfirm={handleDisconnectGh}
        title="Desconectar GitHub"
        description="O token de acesso será removido localmente. Você precisará inseri-lo novamente para usar as integrações de repositório."
        confirmLabel="Desconectar"
      />

      <ConfirmModal
        open={deleteAiModal}
        onClose={() => setDeleteAiModal(false)}
        onConfirm={handleDeleteAi}
        title="Remover configuração de IA"
        description="A chave de API será apagada e o sistema voltará a usar o Gemini padrão. Seus chats e dados não serão afetados."
        confirmLabel="Remover"
      />
    </section>
  );
}

function GitHubModal({ open, onClose, onSaved }: {
  open: boolean;
  onClose: () => void;
  onSaved: (token: string) => void;
}) {
  const { user } = useAuth();
  const ghTokenKey = user?.id ? `fluxionai_gh_token_${user.id}` : 'fluxionai_gh_token';
  const [token, setToken] = useState('');
  const [show, setShow] = useState(false);

  const handleSave = () => {
    if (!token.trim()) return;
    localStorage.setItem(ghTokenKey, token.trim());
    onSaved(token.trim());
    setToken('');
  };

  return (
    <Modal
      open={open}
      onClose={() => { onClose(); setToken(''); }}
      title="Conectar GitHub"
      description="Insira um Personal Access Token (classic) com permissões de repo para conectar seus repositórios."
      icon={<FiGithub />}
      iconColor="#24292e"
    >
      <div className="stg-modal-form">
        <div className="stg-field">
          <label>Personal Access Token</label>
          <div className="stg-input-wrap">
            <input
              type={show ? 'text' : 'password'}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              value={token}
              onChange={e => setToken(e.target.value)}
              className="stg-input stg-input--mono"
              autoFocus
            />
            <button className="stg-input-action" onClick={() => setShow(v => !v)} type="button" tabIndex={-1} aria-label="Mostrar ou ocultar token">
              {show ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
          <a href="https://github.com/settings/tokens" target="_blank" rel="noopener noreferrer" className="stg-link" style={{ marginTop: 4 }}>
            Criar token no GitHub <FiExternalLink />
          </a>
        </div>
      </div>
      <div className="stg-modal-footer">
        <button className="stg-btn stg-btn--ghost" onClick={() => { onClose(); setToken(''); }}>Cancelar</button>
        <button className="stg-btn stg-btn--primary" onClick={handleSave} disabled={!token.trim()}>
          <FiSave /> Salvar token
        </button>
      </div>
    </Modal>
  );
}

function AiProviderModal({ open, onClose, currentConfig, onSaved, showToast }: {
  open: boolean;
  onClose: () => void;
  currentConfig: AiConfig | null;
  onSaved: () => void;
  showToast: (t: 'success' | 'error', m: string) => void;
}) {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>(currentConfig?.provider || 'gemini');
  const [selectedModel, setSelectedModel] = useState(currentConfig?.model || 'gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedProvider(currentConfig?.provider || 'gemini');
      setSelectedModel(currentConfig?.model || 'gemini-2.5-flash');
      setApiKey('');
      setShowKey(false);
    }
  }, [open, currentConfig]);

  useEffect(() => {
    setSelectedModel(AI_PROVIDER_MODELS[selectedProvider].models[0]);
  }, [selectedProvider]);

  const providers = Object.entries(AI_PROVIDER_MODELS) as [AiProvider, { label: string; models: string[] }][];
  const PROVIDER_COLORS: Record<AiProvider, string> = { gemini: '#4285f4', openai: '#10a37f', anthropic: '#d97706' };

  const handleSave = async () => {
    if (!apiKey.trim()) { showToast('error', 'Cole sua API Key antes de salvar.'); return; }
    setSaving(true);
    try {
      await aiService.saveConfig(selectedProvider, selectedModel, apiKey.trim());
      onSaved();
    } catch { showToast('error', 'Falha ao salvar. Verifique a chave e tente novamente.'); }
    finally { setSaving(false); }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Configurar Provider de IA"
      description="Escolha o provider, modelo e insira sua chave de API. Sem configuração, o sistema usa o Gemini padrão."
      icon={<FiCpu />}
      iconColor={PROVIDER_COLORS[selectedProvider]}
      size="lg"
    >
      <div className="stg-modal-form">
        <div className="stg-field">
          <label>Provider</label>
          <div className="stg-ai-providers">
            {providers.map(([key, meta]) => (
              <button
                key={key}
                className={`stg-ai-provider${selectedProvider === key ? ' is-selected' : ''}`}
                onClick={() => setSelectedProvider(key)}
                style={selectedProvider === key ? { borderColor: PROVIDER_COLORS[key], background: `${PROVIDER_COLORS[key]}10` } : {}}
              >
                <span className="stg-ai-provider-dot" style={{ background: PROVIDER_COLORS[key] }} />
                <span className="stg-ai-provider-name">{meta.label}</span>
                {selectedProvider === key && <FiCheck className="stg-ai-provider-check" />}
              </button>
            ))}
          </div>
        </div>

        <div className="stg-field">
          <label>Modelo</label>
          <select value={selectedModel} onChange={e => setSelectedModel(e.target.value)} className="stg-select">
            {AI_PROVIDER_MODELS[selectedProvider].models.map(m => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>

        <div className="stg-field">
          <div className="stg-field-header">
            <label>API Key</label>
            <a
              href={
                selectedProvider === 'openai' ? 'https://platform.openai.com/api-keys'
                : selectedProvider === 'anthropic' ? 'https://console.anthropic.com/keys'
                : 'https://aistudio.google.com/apikey'
              }
              target="_blank" rel="noopener noreferrer" className="stg-link"
            >
              Obter chave <FiExternalLink />
            </a>
          </div>
          <div className="stg-input-wrap">
            <input
              type={showKey ? 'text' : 'password'}
              placeholder={currentConfig ? 'Nova chave para substituir…' : 'Cole sua API Key aqui…'}
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="stg-input stg-input--mono"
              autoComplete="off"
            />
            <button className="stg-input-action" onClick={() => setShowKey(v => !v)} type="button" tabIndex={-1} aria-label="Mostrar ou ocultar chave">
              {showKey ? <FiEyeOff /> : <FiEye />}
            </button>
          </div>
        </div>
      </div>

      <div className="stg-modal-footer">
        <button className="stg-btn stg-btn--ghost" onClick={onClose} disabled={saving}>Cancelar</button>
        <button className="stg-btn stg-btn--primary" onClick={handleSave} disabled={saving || !apiKey.trim()}>
          {saving ? <span className="stg-spinner" /> : <FiSave />}
          {saving ? 'Salvando…' : 'Salvar configuração'}
        </button>
      </div>
    </Modal>
  );
}

function EmailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conectar Conta de Email"
      description="Vincule uma conta de email para enviar campanhas e receber alertas de leads diretamente pela plataforma."
      icon={<FiMail />}
      iconColor="#ea4335"
    >
      <div className="stg-modal-form">
        <div className="stg-field">
          <label>Provedor</label>
          <select className="stg-select" defaultValue="">
            <option value="" disabled>Selecione um provedor…</option>
            <option value="google">Google Workspace / Gmail</option>
            <option value="outlook">Microsoft 365 / Outlook</option>
            <option value="smtp">SMTP Personalizado</option>
          </select>
        </div>
        <div className="stg-field">
          <label>Endereço de email</label>
          <input type="email" placeholder="contato@suaempresa.com.br" className="stg-input" />
        </div>
      </div>
      <div className="stg-modal-footer">
        <button className="stg-btn stg-btn--ghost" onClick={onClose}>Cancelar</button>
        <button className="stg-btn stg-btn--primary" onClick={onClose} title="Em breve">
          <FiMail /> Conectar (Em breve)
        </button>
      </div>
    </Modal>
  );
}

function WhatsappModal({ open, onClose, showToast }: { open: boolean; onClose: () => void; showToast: (t: 'success' | 'error', m: string) => void }) {
  const [loading, setLoading] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [status, setStatus] = useState<'open' | 'connecting' | 'close'>('close');
  const [testPhone, setTestPhone] = useState('');
  const [testMsg, setTestMsg] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const instanceName = 'fluxionai';

  useEffect(() => {
    if (!open) return;
    checkStatus();

    const interval = setInterval(async () => {
      try {
        const res = await whatsappApi.getStatus(instanceName);
        if (res?.instance?.state) {
          const currentState = res.instance.state;
          setStatus(prev => {
            if (prev !== 'open' && currentState === 'open') {
              showToast('success', 'WhatsApp conectado com sucesso!');
              setQrCodeData(null);
              setPairingCode(null);
            }
            return currentState;
          });
        }
      } catch {
        // Silent background poll catch
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [open]);

  const checkStatus = async () => {
    try {
      const res = await whatsappApi.getStatus(instanceName);
      if (res?.instance?.state) {
        setStatus(res.instance.state);
        if (res.instance.state === 'open') {
          setQrCodeData(null);
          setPairingCode(null);
        }
      }
    } catch {
      setStatus('close');
    }
  };

  const handleGenerateQr = async () => {
    setLoading(true);
    setQrCodeData(null);
    setPairingCode(null);

    let createResult: any = null;
    try {
      createResult = await whatsappApi.createInstance(instanceName);
    } catch {
      // Ignore if instance already created
    }

    const createQr = createResult?.qrcode?.base64 || createResult?.base64;
    if (createQr) {
      setQrCodeData(createQr);
      if (createResult?.qrcode?.pairingCode || createResult?.pairingCode) {
        setPairingCode(createResult.qrcode?.pairingCode || createResult.pairingCode);
      }
      setStatus('connecting');
      showToast('success', 'QR Code gerado! Escaneie no seu WhatsApp.');
      setLoading(false);
      return;
    }

    try {
      const qrRes = await whatsappApi.getQrCode(instanceName);
      const b64 = qrRes?.base64 || qrRes?.qrcode?.base64;
      const pairCode = qrRes?.pairingCode || qrRes?.qrcode?.pairingCode;

      if (b64) {
        setQrCodeData(b64);
        if (pairCode) setPairingCode(pairCode);
        setStatus('connecting');
        showToast('success', 'QR Code gerado! Escaneie no seu WhatsApp.');
      } else if (qrRes?.code || qrRes?.qrcode?.code) {
        setQrCodeData(qrRes.code || qrRes.qrcode?.code || null);
        setStatus('connecting');
      } else if (qrRes?.instance?.state === 'open') {
        setStatus('open');
        showToast('success', 'WhatsApp já está conectado!');
      } else {
        checkStatus();
        showToast('success', 'Instância verificada.');
      }
    } catch {
      showToast('error', 'Certifique-se de que a Evolution API está em execução no Docker.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendTest = async () => {
    if (!testPhone.trim() || !testMsg.trim()) return;
    setSendingTest(true);
    try {
      const res = await whatsappApi.sendTestMessage(instanceName, testPhone.trim(), testMsg.trim());
      if (res?.key?.id || res?.status === 'PENDING' || res?.status === 'SUCCESS') {
        showToast('success', 'Mensagem enviada com sucesso no WhatsApp!');
        setTestMsg('');
      } else {
        const errorDetail = res?.error || res?.message || (Array.isArray(res?.response?.message) ? res.response.message.join(', ') : null) || 'Erro ao enviar mensagem';
        showToast('error', `Erro WhatsApp: ${errorDetail}`);
      }
    } catch (err: any) {
      showToast('error', `Falha ao enviar: ${err?.message || 'Verifique a conexão com a Evolution API.'}`);
    } finally {
      setSendingTest(false);
    }
  };

  const handleDisconnect = async () => {
    setLoading(true);
    try {
      await whatsappApi.logout(instanceName);
      setStatus('close');
      setQrCodeData(null);
      setPairingCode(null);
      showToast('success', 'WhatsApp desconectado.');
    } catch {
      showToast('error', 'Erro ao desconectar.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Conectar WhatsApp (Evolution API)"
      description="Conecte seu WhatsApp corporativo para permitir atendimento 24/7 com IA e disparos automáticos."
      icon={<FaWhatsapp />}
      iconColor="#25D366"
    >
      <div className="stg-modal-form">
        <div className="stg-field" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-secondary)', padding: '12px 16px', borderRadius: '8px' }}>
          <div>
            <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Status da Conexão</div>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              {status === 'open' ? '🟢 Conectado e Ativo' : status === 'connecting' ? '🟡 Aguardando Leitura do QR Code' : '🔴 Desconectado'}
            </div>
          </div>
          <button className="stg-btn stg-btn--secondary stg-btn--sm" onClick={checkStatus}>
            <FiRefreshCw /> Atualizar
          </button>
        </div>

        {status === 'close' && !qrCodeData && (
          <div style={{ textAlign: 'center', padding: '1.5rem 0' }}>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>
              Clique no botão abaixo para gerar o QR Code de conexão.
            </p>
            <button className="stg-btn stg-btn--primary" onClick={handleGenerateQr} disabled={loading}>
              {loading ? <span className="stg-spinner" /> : <FaWhatsapp />}
              {loading ? 'Gerando QR Code…' : 'Gerar QR Code WhatsApp'}
            </button>
          </div>
        )}

        {qrCodeData && status !== 'open' && (
          <div style={{ textAlign: 'center', padding: '1.2rem', background: '#ffffff', borderRadius: '12px', width: '100%', maxWidth: '320px', margin: '0 auto', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }}>
            {qrCodeData.startsWith('data:image') || qrCodeData.length > 200 ? (
              <img src={qrCodeData.startsWith('data:') ? qrCodeData : `data:image/png;base64,${qrCodeData}`} alt="QR Code WhatsApp" style={{ width: 220, height: 220, margin: '0 auto', display: 'block', borderRadius: '8px' }} />
            ) : (
              <div style={{ padding: '1rem', background: '#111', color: '#fff', fontFamily: 'monospace', borderRadius: '8px', wordBreak: 'break-all' }}>
                Código: {qrCodeData}
              </div>
            )}
            
            {pairingCode && (
              <div style={{ marginTop: '0.8rem', padding: '6px 12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '0.85rem', fontWeight: 600 }}>
                Código de Pareamento: {pairingCode}
              </div>
            )}

            <p style={{ marginTop: '0.8rem', color: '#333333', fontSize: '0.82rem', fontWeight: 600, lineHeight: 1.4 }}>
              Abra o WhatsApp no celular &gt; Aparelhos Conectados &gt; Conectar um Aparelho
            </p>
          </div>
        )}

        {status === 'open' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
            <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-primary)' }}>Enviar Mensagem de Teste</div>
            <input
              type="text"
              placeholder="Número com DDD (Ex: 5585999999999)"
              value={testPhone}
              onChange={e => setTestPhone(e.target.value)}
              className="stg-input"
            />
            <textarea
              placeholder="Mensagem de teste…"
              value={testMsg}
              onChange={e => setTestMsg(e.target.value)}
              className="stg-input"
              rows={3}
            />
            <button className="stg-btn stg-btn--primary" onClick={handleSendTest} disabled={sendingTest || !testPhone || !testMsg}>
              {sendingTest ? <span className="stg-spinner" /> : <FiSend />} Enviar Teste
            </button>
          </div>
        )}
      </div>

      <div className="stg-modal-footer">
        {status === 'open' && (
          <button className="stg-btn stg-btn--danger-ghost" onClick={handleDisconnect} disabled={loading}>
            Desconectar WhatsApp
          </button>
        )}
        <button className="stg-btn stg-btn--ghost" onClick={onClose}>Fechar</button>
      </div>
    </Modal>
  );
}
