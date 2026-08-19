import { useState, useEffect, useMemo } from 'react';
import { FiKey } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import './ApiDocs.css';
import { API_ENDPOINTS } from '../components/apidocs/data';
import { ApiDocsSidebar } from '../components/apidocs/ApiDocsSidebar';
import { ApiDocsToc } from '../components/apidocs/ApiDocsToc';
import { EndpointCard } from '../components/apidocs/EndpointCard';
import { ApiTester } from '../components/apidocs/ApiTester';
import { AiApiTester } from '../components/apidocs/AiApiTester';

export default function ApiDocsPage() {
  const navigate = useNavigate();
  const [selectedId, setSelectedId] = useState('auth'); // 'auth' or an endpoint ID
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [testerOpen, setTesterOpen] = useState(false);
  const [aiTesterOpen, setAiTesterOpen] = useState(false);

  // Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        document.getElementById('api-search-input')?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const endpoint = useMemo(() => API_ENDPOINTS.find(e => e.id === selectedId) || null, [selectedId]);

  return (
    <div className="apidocs-page">
      {/* Header */}
      <header className="apidocs-header">
        <div className="apidocs-header-left">
          <button className="apidocs-btn" style={{ display: 'none' }} onClick={() => setSidebarOpen(!sidebarOpen)}>
            Menu
          </button>
          <div className="apidocs-logo">FluxionAi</div>
          <div className="apidocs-badge">API v1</div>
          <div className="apidocs-status"><div className="dot"></div> Operational</div>
        </div>

        <div className="apidocs-header-search">
          <input 
            id="api-search-input"
            type="text" 
            placeholder="Search documentation..." 
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
          />
          <span className="shortcut">Ctrl K</span>
        </div>

        <div className="apidocs-header-right">
          <button className="apidocs-btn" onClick={() => navigate('/api-keys')} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiKey /> API Keys
          </button>
        </div>
      </header>

      {/* 3 Column Layout */}
      <div className="apidocs-layout">
        <ApiDocsSidebar 
          selectedId={selectedId} 
          onSelect={id => { setSelectedId(id); setSidebarOpen(false); }} 
          searchQuery={searchQuery} 
        />
        
        <main className="apidocs-main">
          <div className="apidocs-main-container">
            {selectedId === 'auth' ? (
              <div id="authentication">
                <h1 className="endpoint-title">Authentication</h1>
                <p className="endpoint-desc">Todas as requisições protegidas à API da FluxionAi exigem uma API Key válida fornecida via cabeçalho HTTP Bearer.</p>
                
                <div className="api-code-block" style={{ margin: '2rem 0' }}>
                  <pre style={{ background: '#0d1117', padding: '1rem', borderRadius: '8px', color: '#e2e8f0' }}>
                    Authorization: Bearer SUA_CHAVE_API
                  </pre>
                </div>
                
                <div className="apidocs-permission-box" onClick={() => navigate('/api-keys')}>
                  <div className="apidocs-permission-icon"><FiKey size={20} /></div>
                  <div className="apidocs-permission-content">
                    <strong>Manage API Keys</strong>
                    <p>Sua API key deve ter as permissões necessárias para acessar cada endpoint.</p>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Manage →</div>
                </div>
                
                <div style={{ background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '8px', border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
                  <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)' }}>
                    API Key <br/>↓<br/> Authorization Header <br/>↓<br/> FluxionAi API <br/>↓<br/> Permissions Check <br/>↓<br/> Endpoint Executed
                  </div>
                </div>
              </div>
            ) : endpoint ? (
              <EndpointCard 
                endpoint={endpoint} 
                onTryIt={() => setTesterOpen(true)}
                onAiTest={() => setAiTesterOpen(true)}
              />
            ) : (
              <div>Endpoint not found.</div>
            )}
          </div>
        </main>

        <ApiDocsToc endpoint={endpoint} />
      </div>

      {testerOpen && endpoint && (
        <ApiTester endpoint={endpoint} onClose={() => setTesterOpen(false)} />
      )}
      
      {aiTesterOpen && endpoint && (
        <AiApiTester endpoint={endpoint} onClose={() => setAiTesterOpen(false)} />
      )}
    </div>
  );
}
