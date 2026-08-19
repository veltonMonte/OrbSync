import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEye, FiEyeOff, FiSave, FiTrash2, FiCheckCircle, FiAlertCircle, FiCpu } from 'react-icons/fi';
import { aiService, AI_PROVIDER_MODELS } from '../services/ai';
import type { AiProvider } from '../services/ai';
import './AiSettings.css';

const PROVIDER_META: Record<AiProvider, { color: string; gradient: string; icon: string }> = {
  gemini: {
    color: '#4285f4',
    gradient: 'linear-gradient(135deg, #4285f4 0%, #0f9d58 100%)',
    icon: '✦',
  },
  openai: {
    color: '#10a37f',
    gradient: 'linear-gradient(135deg, #10a37f 0%, #1a7f64 100%)',
    icon: '⬡',
  },
  anthropic: {
    color: '#d97706',
    gradient: 'linear-gradient(135deg, #d97706 0%, #b45309 100%)',
    icon: '◈',
  },
};

export default function AiSettingsPage() {
  const [selectedProvider, setSelectedProvider] = useState<AiProvider>('gemini');
  const [selectedModel, setSelectedModel] = useState('gemini-2.5-flash');
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [currentConfig, setCurrentConfig] = useState<{ provider: AiProvider; model: string; apiKeyMasked: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    loadConfig();
  }, []);

  useEffect(() => {
    // Reset model when provider changes
    setSelectedModel(AI_PROVIDER_MODELS[selectedProvider].models[0]);
  }, [selectedProvider]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const loadConfig = async () => {
    setLoading(true);
    try {
      const config = await aiService.getConfig();
      setCurrentConfig(config);
      if (config) {
        setSelectedProvider(config.provider);
        setSelectedModel(config.model);
      }
    } catch {
      setCurrentConfig(null);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!apiKey.trim()) {
      showToast('error', 'Insira sua API Key antes de salvar.');
      return;
    }
    setSaving(true);
    try {
      await aiService.saveConfig(selectedProvider, selectedModel, apiKey.trim());
      setApiKey('');
      await loadConfig();
      showToast('success', 'Configuração salva! A IA agora usará seu provider.');
    } catch {
      showToast('error', 'Erro ao salvar configuração. Tente novamente.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      await aiService.deleteConfig();
      setCurrentConfig(null);
      setApiKey('');
      showToast('success', 'Configuração removida. Voltando ao Gemini do sistema.');
    } catch {
      showToast('error', 'Erro ao remover configuração.');
    } finally {
      setSaving(false);
    }
  };

  const providers = Object.entries(AI_PROVIDER_MODELS) as [AiProvider, { label: string; models: string[] }][];

  return (
    <div className="ai-settings-page">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            className={`ai-settings-toast ${toast.type}`}
            initial={{ opacity: 0, y: -20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: -20, x: '-50%' }}
          >
            {toast.type === 'success' ? <FiCheckCircle /> : <FiAlertCircle />}
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="ai-settings-container">
        {/* Header */}
        <motion.div
          className="ai-settings-header"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="ai-settings-header-icon">
            <FiCpu />
          </div>
          <div>
            <h1 className="ai-settings-title">Configurações de IA</h1>
            <p className="ai-settings-subtitle">
              Use sua própria chave de API para ChatGPT, Claude ou Gemini. Sem configuração, o sistema usa o Gemini padrão.
            </p>
          </div>
        </motion.div>

        {/* Current Config Banner */}
        {!loading && (
          <motion.div
            className={`ai-settings-current ${currentConfig ? 'active' : 'default'}`}
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1, duration: 0.4 }}
          >
            {currentConfig ? (
              <>
                <div
                  className="ai-settings-current-dot"
                  style={{ background: PROVIDER_META[currentConfig.provider].color }}
                />
                <div>
                  <span className="ai-settings-current-label">Provider ativo:</span>
                  <span
                    className="ai-settings-current-value"
                    style={{ color: PROVIDER_META[currentConfig.provider].color }}
                  >
                    {AI_PROVIDER_MODELS[currentConfig.provider].label}
                  </span>
                  <span className="ai-settings-current-model">· {currentConfig.model}</span>
                  <span className="ai-settings-current-key">· {currentConfig.apiKeyMasked}</span>
                </div>
                <button className="ai-settings-reset-btn" onClick={handleDelete} disabled={saving}>
                  <FiTrash2 /> Restaurar padrão
                </button>
              </>
            ) : (
              <>
                <div className="ai-settings-current-dot" style={{ background: '#4285f4' }} />
                <div>
                  <span className="ai-settings-current-label">Provider ativo:</span>
                  <span className="ai-settings-current-value" style={{ color: '#4285f4' }}>
                    Gemini do sistema
                  </span>
                  <span className="ai-settings-current-model">· gemini-2.5-flash (padrão)</span>
                </div>
              </>
            )}
          </motion.div>
        )}

        {/* Provider Cards */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.4 }}
        >
          <h2 className="ai-settings-section-title">Escolha o Provider</h2>
          <div className="ai-settings-providers">
            {providers.map(([key, meta]) => {
              const pm = PROVIDER_META[key];
              const isSelected = selectedProvider === key;
              return (
                <motion.button
                  key={key}
                  className={`ai-provider-card ${isSelected ? 'selected' : ''}`}
                  style={isSelected ? { '--provider-color': pm.color, background: `${pm.color}15`, borderColor: pm.color } as any : {}}
                  onClick={() => setSelectedProvider(key)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="ai-provider-icon" style={{ background: pm.gradient }}>
                    {pm.icon}
                  </div>
                  <div className="ai-provider-info">
                    <span className="ai-provider-name">{meta.label}</span>
                    <span className="ai-provider-models">{meta.models.length} modelos disponíveis</span>
                  </div>
                  {isSelected && (
                    <motion.div
                      className="ai-provider-check"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      style={{ color: pm.color }}
                    >
                      <FiCheckCircle />
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        {/* Model + API Key Form */}
        <motion.div
          className="ai-settings-form"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.4 }}
        >
          <div className="ai-settings-field">
            <label className="ai-settings-label">Modelo</label>
            <select
              className="ai-settings-select"
              value={selectedModel}
              onChange={e => setSelectedModel(e.target.value)}
            >
              {AI_PROVIDER_MODELS[selectedProvider].models.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div className="ai-settings-field">
            <label className="ai-settings-label">
              API Key
              <a
                href={
                  selectedProvider === 'openai'
                    ? 'https://platform.openai.com/api-keys'
                    : selectedProvider === 'anthropic'
                    ? 'https://console.anthropic.com/keys'
                    : 'https://aistudio.google.com/apikey'
                }
                target="_blank"
                rel="noopener noreferrer"
                className="ai-settings-link"
              >
                Obter chave →
              </a>
            </label>
            <div className="ai-settings-key-wrapper">
              <input
                className="ai-settings-input"
                type={showKey ? 'text' : 'password'}
                placeholder={
                  currentConfig ? 'Insira uma nova chave para substituir...' : 'Cole sua API Key aqui...'
                }
                value={apiKey}
                onChange={e => setApiKey(e.target.value)}
                autoComplete="off"
              />
              <button
                className="ai-settings-eye"
                type="button"
                onClick={() => setShowKey(v => !v)}
                tabIndex={-1}
              >
                {showKey ? <FiEyeOff /> : <FiEye />}
              </button>
            </div>
          </div>

          <motion.button
            className="ai-settings-save-btn"
            style={{ background: PROVIDER_META[selectedProvider].gradient }}
            onClick={handleSave}
            disabled={saving || !apiKey.trim()}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
          >
            {saving ? (
              <span className="ai-settings-spinner" />
            ) : (
              <FiSave />
            )}
            {saving ? 'Salvando...' : 'Salvar configuração'}
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
