import { useState, useEffect } from 'react';
import { FiCopy, FiPlus, FiSettings, FiTrash2, FiAlertTriangle, FiSearch, FiKey, FiEyeOff } from 'react-icons/fi';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../contexts/ToastContext';
import './ApiKeysPage.css';

const PERMISSION_DOMAINS = [
  {
    domain: 'PROJECTS',
    items: [
      { id: 'projects:read', label: 'Read projects' },
      { id: 'projects:create', label: 'Create projects' },
      { id: 'projects:update', label: 'Update projects' },
      { id: 'projects:delete', label: 'Delete projects', destructive: true },
    ]
  },
  {
    domain: 'TASKS',
    items: [
      { id: 'tasks:read', label: 'Read tasks' },
      { id: 'tasks:create', label: 'Create tasks' },
      { id: 'tasks:update', label: 'Update tasks' },
      { id: 'tasks:delete', label: 'Delete tasks', destructive: true },
    ]
  },
  {
    domain: 'AI',
    items: [
      { id: 'ai:use', label: 'Use AI models' },
      { id: 'ai:execute', label: 'Execute AI Agents' },
    ]
  },
  {
    domain: 'MESSAGING',
    items: [
      { id: 'messages:read', label: 'Read messages' },
      { id: 'messages:send', label: 'Send messages', destructive: true },
    ]
  },
  {
    domain: 'TERMINAL',
    items: [
      { id: 'terminal:execute', label: 'Execute commands', destructive: true },
    ]
  }
];

export default function ApiKeysPage() {
  const [agents, setAgents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create Key State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKeyData, setNewKeyData] = useState({ name: '', description: '', environment: 'PRODUCTION' });
  const [creating, setCreating] = useState(false);
  const [selectedPerms, setSelectedPerms] = useState<string[]>([]);
  const [searchPerms, setSearchPerms] = useState('');
  const [allowedOrigins, setAllowedOrigins] = useState('');
  
  // Edit State
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingAgent, setEditingAgent] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  
  // Newly Created Key State
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  
  // Revoke State
  const [revokingAgent, setRevokingAgent] = useState<any>(null);
  
  const toast = useToast();
  
  const showToast = (type: 'success' | 'error', message: string) => {
    if (type === 'success') toast.success(message);
    else toast.error(message);
  };

  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      const { authFetch } = await import('../services/api');
      const res = await authFetch('/v1/agents/list');
      const data = await res.json();
      setAgents(data);
    } catch (err) {
      showToast('error', 'Erro ao carregar API Keys.');
    } finally {
      setLoading(false);
    }
  };

  const generateApiKey = async () => {
    if (!newKeyData.name) {
      showToast('error', 'Key name is required');
      return;
    }
    if (!allowedOrigins.trim()) {
      showToast('error', 'You MUST specify allowed URLs/IPs for security, or type * to explicitly disable this protection.');
      return;
    }
    
    setCreating(true);
    try {
      const { authFetch } = await import('../services/api');
      const res = await authFetch('/v1/agents/generate', {
        method: 'POST',
        body: JSON.stringify({ 
          name: newKeyData.name, 
          description: newKeyData.description,
          environment: newKeyData.environment,
          planType: 'BASIC',
          permissions: { 
            scopes: selectedPerms.length > 0 ? selectedPerms : ['*'],
            allowedOrigins: allowedOrigins.trim()
          }
        }), 
      });
      if (res.ok) {
        const result = await res.json();
        setNewlyCreatedKey(result.apiKey);
        setNewKeyData({ name: '', description: '', environment: 'PRODUCTION' });
        setSelectedPerms([]);
        setAllowedOrigins('');
        setShowCreateModal(false);
        loadAgents();
      }
    } catch (err) {
      showToast('error', 'Failed to create API key.');
    } finally {
      setCreating(false);
    }
  };
  
  const openEditModal = (agent: any) => {
    setEditingAgent(agent);
    let perms = [];
    let origins = '';
    try { 
      const p = typeof agent.permissions === 'string' ? JSON.parse(agent.permissions) : agent.permissions; 
      perms = p.scopes || [];
      origins = p.allowedOrigins || '';
    } catch(e) {}
    setSelectedPerms(perms);
    setAllowedOrigins(origins);
    setShowEditModal(true);
  };
  
  const savePermissions = async () => {
    if (!editingAgent) return;
    if (!allowedOrigins.trim()) {
      showToast('error', 'You MUST specify allowed URLs/IPs for security, or type * to explicitly disable this protection.');
      return;
    }
    
    setUpdating(true);
    try {
      const { authFetch } = await import('../services/api');
      const res = await authFetch(`/v1/agents/update/${editingAgent.id}`, {
        method: 'POST',
        body: JSON.stringify({
          permissions: { 
            scopes: selectedPerms.length > 0 ? selectedPerms : ['*'],
            allowedOrigins: allowedOrigins.trim()
          }
        }), 
      });
      if (res.ok) {
        showToast('success', 'Permissions updated!');
        setShowEditModal(false);
        loadAgents();
      } else {
        showToast('error', 'Failed to update permissions.');
      }
    } catch (err) {
      showToast('error', 'Failed to update permissions.');
    } finally {
      setUpdating(false);
    }
  };
  
  const revokeKey = async () => {
    if (!revokingAgent) return;
    
    try {
      const { authFetch } = await import('../services/api');
      const res = await authFetch(`/v1/agents/revoke/${revokingAgent.id}`, {
        method: 'POST'
      });
      if (res.ok) {
        showToast('success', 'API Key revoked successfully.');
        setRevokingAgent(null);
        loadAgents();
      } else {
        showToast('error', 'Failed to revoke API key.');
      }
    } catch (err) {
      showToast('error', 'Failed to revoke API key.');
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showToast('success', 'Copiado para a área de transferência!');
  };

  const togglePerm = (permId: string) => {
    setSelectedPerms(prev => prev.includes(permId) ? prev.filter(p => p !== permId) : [...prev, permId]);
  };
  
  const applyPreset = (type: string) => {
    if (type === 'full') setSelectedPerms(['*']);
    else if (type === 'read') setSelectedPerms(['projects:read', 'tasks:read', 'messages:read']);
    else if (type === 'ai') setSelectedPerms(['ai:use', 'ai:execute', 'projects:read']);
    else setSelectedPerms([]);
  };

  const hasDestructive = selectedPerms.some(p => PERMISSION_DOMAINS.flatMap(d => d.items).find(i => i.id === p)?.destructive || p === '*');

  return (
    <div className="api-keys-page">
      <div className="api-keys-header">
        <div>
          <h1 className="api-keys-title">API Keys</h1>
          <p className="api-keys-subtitle">Manage credentials and granular access policies for your workspace.</p>
        </div>
        <button className="api-btn-primary" onClick={() => setShowCreateModal(true)}>
          <FiPlus /> Create API Key
        </button>
      </div>

      <div className="api-keys-list">
        <div className="api-key-env-group">
          <div className="api-key-env-title">Production</div>
          
          {loading ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>Loading keys...</p>
          ) : agents.filter(a => a.environment === 'PRODUCTION').length === 0 ? (
            <div className="api-key-card" style={{ alignItems: 'center', padding: '3rem', borderStyle: 'dashed' }}>
              <p style={{ color: 'var(--text-secondary)' }}>No API keys found in Production.</p>
            </div>
          ) : (
            agents.filter(a => a.environment === 'PRODUCTION').map(a => (
              <ApiKeyCard key={a.id} a={a} openEditModal={openEditModal} copyToClipboard={copyToClipboard} requestRevoke={setRevokingAgent} />
            ))
          )}
        </div>
        
        <div className="api-key-env-group" style={{ marginTop: '2rem' }}>
          <div className="api-key-env-title">Development</div>
          
          {agents.filter(a => a.environment === 'DEVELOPMENT').length === 0 ? (
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.85rem' }}>No development keys.</p>
          ) : (
            agents.filter(a => a.environment === 'DEVELOPMENT').map(a => (
              <ApiKeyCard key={a.id} a={a} openEditModal={openEditModal} copyToClipboard={copyToClipboard} requestRevoke={setRevokingAgent} />
            ))
          )}
        </div>
      </div>

      {/* Create Modal */}
      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New API Key" size="lg">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="api-form-group">
            <label className="api-form-label">Name</label>
            <input type="text" className="api-form-input" placeholder="e.g. Frontend App" value={newKeyData.name} onChange={e => setNewKeyData({...newKeyData, name: e.target.value})} autoFocus />
          </div>
          <div className="api-form-group">
            <label className="api-form-label">Environment</label>
            <select className="api-form-select" value={newKeyData.environment} onChange={e => setNewKeyData({...newKeyData, environment: e.target.value})}>
              <option value="DEVELOPMENT">Development</option>
              <option value="PRODUCTION">Production</option>
            </select>
          </div>
        </div>
        <div className="api-form-group" style={{ marginBottom: '2rem' }}>
          <label className="api-form-label">Description (optional)</label>
          <input type="text" className="api-form-input" placeholder="What is this key used for?" value={newKeyData.description} onChange={e => setNewKeyData({...newKeyData, description: e.target.value})} />
        </div>

        <div className="api-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="api-form-label">Permissions</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="preset-btn" onClick={() => applyPreset('read')}>Read Only</button>
              <button className="preset-btn" onClick={() => applyPreset('ai')}>AI Agent</button>
              <button className="preset-btn" onClick={() => applyPreset('full')}>Full Access</button>
            </div>
          </div>
          
          <div className="permissions-search">
            <FiSearch style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Search permissions..." value={searchPerms} onChange={e => setSearchPerms(e.target.value)} />
          </div>

          <div className="permissions-container">
            {PERMISSION_DOMAINS.map(domain => {
              const filtered = domain.items.filter(i => i.label.toLowerCase().includes(searchPerms.toLowerCase()) || i.id.toLowerCase().includes(searchPerms.toLowerCase()));
              if (filtered.length === 0) return null;
              
              return (
                <div key={domain.domain} className="permission-domain-group">
                  <div className="permission-domain-title">{domain.domain}</div>
                  {filtered.map(item => (
                    <div key={item.id} className="permission-item">
                      <input 
                        type="checkbox" 
                        id={item.id} 
                        checked={selectedPerms.includes('*') || selectedPerms.includes(item.id)} 
                        onChange={() => togglePerm(item.id)} 
                        disabled={selectedPerms.includes('*')}
                      />
                      <label htmlFor={item.id}>{item.label} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>({item.id})</span></label>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="api-form-group" style={{ marginTop: '1.5rem' }}>
          <label className="api-form-label">Allowed Origins / URLs (Required for security)</label>
          <input 
            type="text" 
            className="api-form-input" 
            placeholder="e.g. https://meusite.com, 192.168.1.10 (comma separated). Type * for anywhere." 
            value={allowedOrigins} 
            onChange={e => setAllowedOrigins(e.target.value)} 
          />
          {allowedOrigins.trim() === '*' ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block', fontWeight: 'bold' }}>
              ⚠️ WARNING: Using * disables network protection. If this key leaks, it can be used from anywhere!
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block' }}>
              Type <strong>*</strong> to explicitly allow usage from anywhere (Not Recommended).
            </span>
          )}
        </div>

        {hasDestructive && (
          <div className="warning-box">
            <FiAlertTriangle />
            <span><strong>Warning:</strong> This key has destructive or unrestricted permissions. Use only in trusted environments.</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-strong)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {selectedPerms.includes('*') ? 'All permissions selected' : `${selectedPerms.length} permissions selected`}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="api-btn-secondary" onClick={() => setShowCreateModal(false)}>Cancel</button>
            <button className="api-btn-primary" onClick={generateApiKey} disabled={creating}>
              {creating ? 'Creating...' : 'Create API Key'}
            </button>
          </div>
        </div>
      </Modal>
      {/* Edit Modal */}
      <Modal open={showEditModal} onClose={() => setShowEditModal(false)} title={`Configure Key: ${editingAgent?.name}`} size="lg">
        <div className="api-form-group">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <label className="api-form-label">Permissions</label>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button className="preset-btn" onClick={() => applyPreset('read')}>Read Only</button>
              <button className="preset-btn" onClick={() => applyPreset('ai')}>AI Agent</button>
              <button className="preset-btn" onClick={() => applyPreset('full')}>Full Access</button>
            </div>
          </div>
          
          <div className="permissions-search">
            <FiSearch style={{ color: 'var(--text-tertiary)' }} />
            <input type="text" placeholder="Search permissions..." value={searchPerms} onChange={e => setSearchPerms(e.target.value)} />
          </div>

          <div className="permissions-container">
            {PERMISSION_DOMAINS.map(domain => {
              const filtered = domain.items.filter(i => i.label.toLowerCase().includes(searchPerms.toLowerCase()) || i.id.toLowerCase().includes(searchPerms.toLowerCase()));
              if (filtered.length === 0) return null;
              
              return (
                <div key={domain.domain} className="permission-domain-group">
                  <div className="permission-domain-title">{domain.domain}</div>
                  {filtered.map(item => (
                    <div key={item.id} className="permission-item">
                      <input 
                        type="checkbox" 
                        id={`edit_${item.id}`} 
                        checked={selectedPerms.includes('*') || selectedPerms.includes(item.id)} 
                        onChange={() => togglePerm(item.id)} 
                        disabled={selectedPerms.includes('*')}
                      />
                      <label htmlFor={`edit_${item.id}`}>{item.label} <span style={{ color: 'var(--text-tertiary)', fontSize: '0.7rem' }}>({item.id})</span></label>
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </div>
        
        <div className="api-form-group" style={{ marginTop: '1.5rem' }}>
          <label className="api-form-label">Allowed Origins / URLs (Required for security)</label>
          <input 
            type="text" 
            className="api-form-input" 
            placeholder="e.g. https://meusite.com, 192.168.1.10 (comma separated). Type * for anywhere." 
            value={allowedOrigins} 
            onChange={e => setAllowedOrigins(e.target.value)} 
          />
          {allowedOrigins.trim() === '*' ? (
            <span style={{ fontSize: '0.75rem', color: 'var(--danger)', marginTop: '0.25rem', display: 'block', fontWeight: 'bold' }}>
              ⚠️ WARNING: Using * disables network protection. If this key leaks, it can be used from anywhere!
            </span>
          ) : (
            <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', marginTop: '0.25rem', display: 'block' }}>
              Type <strong>*</strong> to explicitly allow usage from anywhere (Not Recommended).
            </span>
          )}
        </div>

        {hasDestructive && (
          <div className="warning-box">
            <FiAlertTriangle />
            <span><strong>Warning:</strong> This key has destructive or unrestricted permissions. Use only in trusted environments.</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1.5rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-strong)' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
            {selectedPerms.includes('*') ? 'All permissions selected' : `${selectedPerms.length} permissions selected`}
          </span>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button className="api-btn-secondary" onClick={() => setShowEditModal(false)}>Cancel</button>
            <button className="api-btn-primary" onClick={savePermissions} disabled={updating}>
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Secret Key Modal */}
      <Modal open={!!newlyCreatedKey} onClose={() => setNewlyCreatedKey(null)} title="Save your API Key" size="md">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(34, 197, 94, 0.1)', color: 'var(--success)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <FiKey size={24} />
          </div>
          <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>Key generated successfully!</p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Please copy this key and save it somewhere safe. For your security, <strong style={{ color: 'var(--text-primary)' }}>you will not be able to see it again</strong>.
          </p>
        </div>
        
        <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-strong)', padding: '1rem', borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
          <code style={{ flex: 1, color: 'var(--text-primary)', fontSize: '0.9rem', wordBreak: 'break-all' }}>{newlyCreatedKey}</code>
          <button className="api-icon-btn" onClick={() => copyToClipboard(newlyCreatedKey!)} title="Copy Key">
            <FiCopy size={20} />
          </button>
        </div>
        
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="api-btn-primary" onClick={() => setNewlyCreatedKey(null)}>I have saved it</button>
        </div>
      </Modal>

      {/* Revoke Confirmation Modal */}
      <Modal open={!!revokingAgent} onClose={() => setRevokingAgent(null)} title="Revoke API Key" size="sm">
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: 'var(--danger)', width: '48px', height: '48px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem auto' }}>
            <FiTrash2 size={24} />
          </div>
          <p style={{ color: 'var(--text-primary)', marginBottom: '0.5rem', fontWeight: 500 }}>
            Are you absolutely sure?
          </p>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
            Revoking <strong>{revokingAgent?.name}</strong> will instantly break any applications currently using it. This action cannot be undone.
          </p>
        </div>
        
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="api-btn-secondary" onClick={() => setRevokingAgent(null)}>Cancel</button>
          <button className="api-btn-primary" style={{ background: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={revokeKey}>
            Yes, Revoke Key
          </button>
        </div>
      </Modal>

    </div>
  );
}

function ApiKeyCard({ a, openEditModal, copyToClipboard, requestRevoke }: any) {
  const toast = useToast();
  const displayKey = a.apiKey || `${a.apiKeyPrefix}••••••••••••••••••••••••`;
  
  let permsObj: any = { scopes: [], allowedOrigins: '' };
  try { permsObj = typeof a.permissions === 'string' ? JSON.parse(a.permissions) : a.permissions; } catch(e){}
  const permCount = permsObj?.scopes?.includes('*') ? 'Full Access' : `${permsObj?.scopes?.length || 0} permissions`;
  
  const showMissingEyeAlert = () => {
    toast.info("SECURITY RESTRICTION: Your API Key is hashed via SHA-256 and cannot be recovered or viewed again. If you lost it, you must revoke this key and create a new one.");
  };

  return (
    <div className="api-key-card">
      <div className="api-key-card-header">
        <div>
          <div className="api-key-name">{a.name}</div>
          <div className="api-key-meta">
            <span style={{ color: a.status === 'ACTIVE' ? 'var(--success)' : 'var(--danger)' }}>{a.status}</span>
            <span>•</span>
            <span>{permCount}</span>
            {permsObj?.allowedOrigins && (
              <>
                <span>•</span>
                <span style={{ color: 'var(--accent)' }}>URL Restricted</span>
              </>
            )}
            <span>•</span>
            <span>Last used: {a.lastUsedAt ? new Date(a.lastUsedAt).toLocaleDateString() : 'Never'}</span>
          </div>
        </div>
        <div className="api-key-actions">
          {a.status === 'ACTIVE' && (
            <>
              <button className="api-btn-secondary" onClick={() => openEditModal(a)}><FiSettings /> Configure</button>
              <button className="api-btn-secondary" onClick={() => requestRevoke(a)} style={{ color: 'var(--danger)', borderColor: 'var(--danger-muted)' }}>
                <FiTrash2 /> Revoke
              </button>
            </>
          )}
        </div>
      </div>
      
      <div className="api-key-secret-row">
        <span className="api-key-secret-code">{displayKey}</span>
        <button className="api-icon-btn" onClick={showMissingEyeAlert} title="Por que a chave está oculta?" aria-label="Informação sobre mascaramento da chave">
          <FiEyeOff size={16} />
        </button>
        <button className="api-icon-btn" onClick={() => copyToClipboard(displayKey)} title="Copiar Chave" aria-label="Copiar chave de API">
          <FiCopy size={16} />
        </button>
      </div>
    </div>
  );
}
