import { useState, useEffect } from 'react';
import type { EndpointDef, HttpMethod } from './types';
import { FiX, FiPlay, FiCopy, FiCheck, FiZap, FiCpu, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import { API_BASE_URL } from './data';
import { aiService } from '../../services/ai';
import { authFetch } from '../../services/api';
import { useToast } from '../../contexts/ToastContext';

interface ApiTesterProps {
  endpoint: EndpointDef;
  onClose: () => void;
}

export function ApiTester({ endpoint, onClose }: ApiTesterProps) {
  const toast = useToast();
  const [method, setMethod] = useState<HttpMethod>(endpoint.method);
  const [url, setUrl] = useState(`${API_BASE_URL.replace('/api', '')}${endpoint.path}`);
  const [apiKey, setApiKey] = useState('');
  const [activeTab, setActiveTab] = useState<'headers' | 'body'>('body');
  
  // Initial Body JSON construction
  const initialBody = endpoint.snippet && typeof endpoint.snippet.curl === 'string'
    ? JSON.stringify(
        endpoint.bodyParams?.reduce((acc, p) => ({ 
          ...acc, 
          [p.name]: p.enumValues ? p.enumValues[0] : (p.type === 'object' ? {} : (p.name === 'to' ? '5585999999999' : 'Exemplo')) 
        }), {}),
        null,
        2
      )
    : '{}';

  const [body, setBody] = useState(initialBody);
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [time, setTime] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  // Auto-load available user API key if logged in
  useEffect(() => {
    authFetch('/v1/agents/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].apiKeyPrefix) {
          setApiKey(`${data[0].apiKeyPrefix}sample_key`);
        }
      })
      .catch(() => {});
  }, []);

  const handleSend = async () => {
    setLoading(true);
    setResponse(null);
    setAiAnalysis(null);
    const start = Date.now();

    try {
      const headersInit: Record<string, string> = {
        'Content-Type': 'application/json',
      };
      if (apiKey) {
        headersInit['X-API-Key'] = apiKey;
      }

      const reqInit: RequestInit = {
        method,
        headers: headersInit,
      };

      if (method !== 'GET' && method !== 'DELETE' && body) {
        reqInit.body = body;
      }

      const res = await fetch(url, reqInit);
      const resText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        resJson = resText;
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => { resHeaders[key] = val; });

      setResponse({
        status: res.status,
        statusText: res.statusText || (res.status >= 200 && res.status < 300 ? 'OK' : 'Error'),
        headers: resHeaders,
        data: resJson,
      });
    } catch (err: any) {
      setResponse({
        status: 0,
        statusText: 'Network Error / CORS Blocked',
        data: { error: err.message || 'Falha ao se conectar ao servidor local' },
      });
    } finally {
      setTime(Date.now() - start);
      setLoading(false);
    }
  };

  // AI Helper 1: Generate Payload with AI
  const handleGeneratePayloadWithAi = async () => {
    setAiLoading(true);
    try {
      const chat = await aiService.createChat('Payload Generator');
      const prompt = `Gere APENAS um JSON estritamente válido (sem textos explicativos ou markdown) para o body do endpoint:
METHOD: ${method}
PATH: ${endpoint.path}
PARAMETROS: ${JSON.stringify(endpoint.bodyParams)}
Crie um exemplo realista de dados.`;

      const aiRes = await aiService.sendMessage(chat.id, prompt);
      const cleanJsonStr = aiRes.assistantMessage.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      setBody(JSON.stringify(parsed, null, 2));
    } catch (err: any) {
      toast.error('Erro ao gerar payload com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Helper 2: Analyze Response with AI
  const handleAnalyzeResponseWithAi = async () => {
    if (!response) return;
    setAiLoading(true);
    try {
      const chat = await aiService.createChat('Response Analyzer');
      const prompt = `Analise o retorno HTTP desta requisição:
ENDPOINT: ${method} ${url}
STATUS HTTP: ${response.status} ${response.statusText}
RESPOSTA RECEBIDA: ${JSON.stringify(response.data)}

Explique em 2-3 frases sucintas em português se o resultado foi um sucesso ou, caso tenha falhado, explique a causa exata e o que corrigir.`;

      const aiRes = await aiService.sendMessage(chat.id, prompt);
      setAiAnalysis(aiRes.assistantMessage.content);
    } catch (err: any) {
      setAiAnalysis('Falha ao analisar com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const copyResponse = () => {
    if (response) {
      navigator.clipboard.writeText(JSON.stringify(response.data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="api-tester-overlay">
      <div className="api-tester-drawer" style={{ width: '680px', maxWidth: '95vw' }}>
        
        {/* Postman Header Bar */}
        <div className="api-tester-header" style={{ borderBottom: '1px solid var(--border-subtle)', paddingBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>Postman HTTP Client</span>
            <span style={{ fontSize: '0.75rem', background: 'rgba(37,99,235,0.15)', color: '#3B82F6', padding: '0.1rem 0.5rem', borderRadius: '4px', fontWeight: 600 }}>IA Assistida</span>
          </div>
          <button className="chat-icon-btn" onClick={onClose}><FiX /></button>
        </div>
        
        <div className="api-tester-body" style={{ display: 'flex', flexDirection: 'column', gap: '1rem', padding: '1rem' }}>
          
          {/* Postman URL Input Bar */}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as HttpMethod)}
              style={{
                background: 'var(--bg-elevated)',
                color: method === 'GET' ? '#10B981' : method === 'POST' ? '#3B82F6' : '#F59E0B',
                border: '1px solid var(--border-strong)',
                borderRadius: '6px',
                padding: '0.5rem 0.75rem',
                fontWeight: 700,
                fontSize: '0.85rem'
              }}
            >
              <option value="GET">GET</option>
              <option value="POST">POST</option>
              <option value="PUT">PUT</option>
              <option value="PATCH">PATCH</option>
              <option value="DELETE">DELETE</option>
            </select>

            <input 
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="api-tester-input"
              style={{ flex: 1, fontFamily: 'monospace', fontSize: '0.85rem' }}
              placeholder="https://api.fluxion.ai/v1/..."
            />

            <button 
              className="apidocs-btn primary" 
              onClick={handleSend} 
              disabled={loading}
              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', padding: '0.55rem 1.2rem', whiteSpace: 'nowrap' }}
            >
              <FiPlay /> {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>

          {/* Postman Tabs: Body & Headers */}
          <div style={{ borderBottom: '1px solid var(--border-subtle)', display: 'flex', gap: '1rem' }}>
            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                color: activeTab === 'body' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'body' ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('body')}
            >
              Body (JSON)
            </button>

            <button
              style={{
                background: 'none',
                border: 'none',
                padding: '0.5rem 0',
                color: activeTab === 'headers' ? 'var(--accent)' : 'var(--text-secondary)',
                borderBottom: activeTab === 'headers' ? '2px solid var(--accent)' : '2px solid transparent',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
              onClick={() => setActiveTab('headers')}
            >
              Headers & Auth
            </button>
          </div>

          {/* TAB 1: Body Editor with AI Generator */}
          {activeTab === 'body' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span className="api-tester-section-title" style={{ margin: 0 }}>Corpo da Requisição (JSON)</span>
                <button
                  onClick={handleGeneratePayloadWithAi}
                  disabled={aiLoading}
                  style={{
                    background: 'rgba(226, 163, 54, 0.12)',
                    border: '1px solid rgba(226, 163, 54, 0.3)',
                    color: '#E2A336',
                    borderRadius: '4px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <FiZap size={13} /> {aiLoading ? 'IA Gerando...' : 'IA Sugerir JSON'}
                </button>
              </div>
              <textarea 
                rows={9}
                value={body}
                onChange={e => setBody(e.target.value)}
                className="api-tester-input"
                style={{ fontFamily: 'monospace', fontSize: '0.85rem', lineHeight: '1.4' }}
              />
            </div>
          )}

          {/* TAB 2: Headers & Auth */}
          {activeTab === 'headers' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>X-API-Key (Chave de API)</label>
                <input 
                  placeholder="flx_live_sua_chave_api_aqui" 
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  className="api-tester-input"
                  style={{ fontFamily: 'monospace', fontSize: '0.85rem' }} 
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Content-Type</label>
                <input 
                  value="application/json" 
                  disabled 
                  className="api-tester-input" 
                  style={{ background: 'rgba(255,255,255,0.04)', fontFamily: 'monospace', fontSize: '0.85rem' }} 
                />
              </div>
            </div>
          )}

          {/* Response Box */}
          {response && (
            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '1rem', marginTop: '0.5rem' }}>
              
              {/* Response Header Info */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span className="api-tester-section-title" style={{ margin: 0 }}>Resposta (Response)</span>
                  <span style={{ 
                    background: response.status >= 200 && response.status < 300 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                    color: response.status >= 200 && response.status < 300 ? '#10B981' : '#EF4444',
                    fontWeight: 700,
                    padding: '0.15rem 0.5rem',
                    borderRadius: '4px',
                    fontSize: '0.8rem'
                  }}>
                    {response.status} {response.statusText}
                  </span>
                  {time && <span style={{ color: 'var(--text-tertiary)', fontSize: '0.75rem' }}>⏱ {time}ms</span>}
                </div>

                <button
                  onClick={handleAnalyzeResponseWithAi}
                  disabled={aiLoading}
                  style={{
                    background: 'rgba(59, 130, 246, 0.12)',
                    border: '1px solid rgba(59, 130, 246, 0.3)',
                    color: '#3B82F6',
                    borderRadius: '4px',
                    padding: '0.2rem 0.6rem',
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.3rem'
                  }}
                >
                  <FiCpu size={13} /> {aiLoading ? 'Analisando...' : 'IA Analisar Retorno'}
                </button>
              </div>

              {/* AI Analysis Explanation Result */}
              {aiAnalysis && (
                <div style={{ 
                  background: 'rgba(59, 130, 246, 0.08)', 
                  border: '1px solid rgba(59, 130, 246, 0.2)', 
                  padding: '0.75rem 1rem', 
                  borderRadius: '6px', 
                  fontSize: '0.85rem', 
                  color: '#E2E8F0', 
                  marginBottom: '0.75rem',
                  display: 'flex',
                  gap: '0.5rem',
                  alignItems: 'flex-start'
                }}>
                  {response.status >= 200 && response.status < 300 ? (
                    <FiCheckCircle size={18} color="#10B981" style={{ flexShrink: 0, marginTop: '2px' }} />
                  ) : (
                    <FiAlertTriangle size={18} color="#EF4444" style={{ flexShrink: 0, marginTop: '2px' }} />
                  )}
                  <div>
                    <strong style={{ color: '#3B82F6', display: 'block', marginBottom: '0.2rem' }}>Diagnóstico da IA:</strong>
                    {aiAnalysis}
                  </div>
                </div>
              )}

              {/* Response Code Block */}
              <div style={{ position: 'relative' }}>
                <button 
                  onClick={copyResponse}
                  style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(255,255,255,0.1)', border: 'none', color: '#fff', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                >
                  {copied ? <FiCheck color="#10B981" /> : <FiCopy />} {copied ? 'Copiado' : 'Copiar'}
                </button>
                <pre style={{ margin: 0, background: '#0a0a0c', padding: '1rem', borderRadius: '6px', fontSize: '0.85rem', color: '#e2e8f0', overflowX: 'auto', maxHeight: '250px' }}>
                  {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
                </pre>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
