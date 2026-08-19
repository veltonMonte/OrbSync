import { useState } from 'react';
import type { EndpointDef } from './types';
import { FiCopy, FiCheck, FiLock } from 'react-icons/fi';
import { API_BASE_URL } from './data';
import { useNavigate } from 'react-router-dom';

interface EndpointCardProps {
  endpoint: EndpointDef;
  onTryIt?: () => void;
  onAiTest?: () => void;
}

export function EndpointCard({ endpoint }: EndpointCardProps) {
  const [activeTab, setActiveTab] = useState<'curl' | 'js' | 'ts' | 'java' | 'python' | 'php'>('curl');
  const [jsSubTab, setJsSubTab] = useState<'nestjs' | 'express' | 'fetch' | 'axios'>('nestjs');
  const [javaSubTab, setJavaSubTab] = useState<'springBoot' | 'httpClient'>('springBoot');
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const navigate = useNavigate();

  const getCodeSnippet = (): string => {
    const snip: any = endpoint.snippet;
    if (activeTab === 'js') {
      if (typeof snip.js === 'object') {
        return snip.js[jsSubTab] || snip.js.nestjs || snip.js.fetch || '';
      }
      return snip.js;
    }
    if (activeTab === 'java') {
      if (typeof snip.java === 'object') {
        return snip.java[javaSubTab] || snip.java.springBoot || snip.java.httpClient || '';
      }
      return snip.java;
    }
    return snip[activeTab] || '';
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(getCodeSnippet());
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(`${API_BASE_URL.replace('/api', '')}${endpoint.path}`);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  return (
    <div className="endpoint-card-container">
      <div className="endpoint-header" id="overview">
        <h1 className="endpoint-title">{endpoint.title}</h1>
        
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <div className="endpoint-route-box">
            <span className="method">{endpoint.method}</span>
            <span className="path">{API_BASE_URL.replace('/api', '')}{endpoint.path}</span>
            <button onClick={handleCopyUrl} title="Copy URL">
              {copiedUrl ? <FiCheck color="var(--success)" /> : <FiCopy />}
            </button>
          </div>
        </div>

        <p className="endpoint-desc">{endpoint.description}</p>
        
        {/* Permission Box */}
        <div className="apidocs-permission-box" onClick={() => navigate('/api-keys')}>
          <div className="apidocs-permission-icon"><FiLock size={20} /></div>
          <div className="apidocs-permission-content">
            <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 600, marginBottom: '0.2rem' }}>Required Permission</div>
            <strong>{endpoint.permission}</strong>
            <p>{endpoint.permissionDesc}</p>
          </div>
          <div style={{ fontSize: '0.8rem', color: 'var(--accent)', fontWeight: 600 }}>Manage →</div>
        </div>
      </div>

      {endpoint.bodyParams && endpoint.bodyParams.length > 0 && (
        <div id="parameters">
          <h3 className="endpoint-section-title">Body Parameters</h3>
          {endpoint.bodyParams.map(param => (
            <div key={param.name} className="param-card">
              <div className="param-card-header">
                <span className="param-name">{param.name}</span>
                <span className="param-type">{param.type}</span>
                <span className={`param-req ${param.required ? 'required' : 'optional'}`}>
                  {param.required ? 'Required' : 'Optional'}
                </span>
              </div>
              <p className="param-desc">{param.description}</p>
              {param.enumValues && (
                <div style={{ marginTop: '0.75rem', fontSize: '0.85rem' }}>
                  <span style={{ color: 'var(--text-tertiary)' }}>Enum: </span>
                  {param.enumValues.map(v => (
                    <span key={v} style={{ background: 'rgba(255,255,255,0.05)', padding: '0.1rem 0.4rem', borderRadius: '4px', margin: '0 0.2rem', fontFamily: 'monospace', color: 'var(--accent-text)' }}>
                      "{v}"
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div id="responses" style={{ marginTop: '3rem' }}>
        <h3 className="endpoint-section-title">Responses</h3>
        {endpoint.responses.map(res => (
          <div key={res.status} className="response-card">
            <div className="response-header">
              <span className="response-status" data-status={res.status}>{res.status}</span>
              <span className="response-label">{res.label}</span>
              <span className="response-desc">{res.description}</span>
            </div>
            <pre className="response-body">
              {JSON.stringify(res.example, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <div id="example" style={{ marginTop: '3rem' }}>
        <h3 className="endpoint-section-title">Example Request</h3>
        <div className="code-tabs">
          <div className="code-tabs-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.2rem' }}>
              {(['curl', 'js', 'ts', 'java', 'python', 'php'] as const).map(tab => (
                <button 
                  key={tab}
                  className={`code-tab-btn ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab === 'js' ? 'JS / NODE' : tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Framework Sub-Pills for JS */}
            {activeTab === 'js' && typeof endpoint.snippet.js === 'object' && (
              <div style={{ display: 'flex', gap: '0.3rem', padding: '0.2rem 0.5rem' }}>
                <button className={`sub-pill-btn ${jsSubTab === 'nestjs' ? 'active' : ''}`} onClick={() => setJsSubTab('nestjs')}>NestJS</button>
                <button className={`sub-pill-btn ${jsSubTab === 'express' ? 'active' : ''}`} onClick={() => setJsSubTab('express')}>Express</button>
                <button className={`sub-pill-btn ${jsSubTab === 'axios' ? 'active' : ''}`} onClick={() => setJsSubTab('axios')}>Axios</button>
                <button className={`sub-pill-btn ${jsSubTab === 'fetch' ? 'active' : ''}`} onClick={() => setJsSubTab('fetch')}>Fetch</button>
              </div>
            )}

            {/* Framework Sub-Pills for Java */}
            {activeTab === 'java' && typeof endpoint.snippet.java === 'object' && (
              <div style={{ display: 'flex', gap: '0.3rem', padding: '0.2rem 0.5rem' }}>
                <button className={`sub-pill-btn ${javaSubTab === 'springBoot' ? 'active' : ''}`} onClick={() => setJavaSubTab('springBoot')}>Spring Boot</button>
                <button className={`sub-pill-btn ${javaSubTab === 'httpClient' ? 'active' : ''}`} onClick={() => setJavaSubTab('httpClient')}>HttpClient (Nativo)</button>
              </div>
            )}
          </div>

          <div className="code-tabs-body">
            <button className="code-copy-btn" onClick={handleCopyCode} title="Copy code">
              {copiedCode ? <FiCheck color="var(--success)" /> : <FiCopy />}
            </button>
            <pre>
              {getCodeSnippet()}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
