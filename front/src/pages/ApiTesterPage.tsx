import React, { useState, useEffect } from 'react';
import { 
  FiPlus, FiTrash2, FiZap, FiCpu, 
  FiAlertTriangle, FiCopy, FiCheck, FiLayers, FiPlay, FiCode 
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { aiService } from '../services/ai';
import { authFetch, API_BASE_URL } from '../services/api';
import { useToast } from '../contexts/ToastContext';
import './ApiTesterPage.css';

interface RequestItem {
  id: string;
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  url: string;
  headers: { key: string; value: string }[];
  params: { key: string; value: string }[];
  body: string;
}

const DEFAULT_COLLECTIONS: RequestItem[] = [
  {
    id: 'req_1',
    name: 'Disparo de WhatsApp por IA',
    method: 'POST',
    url: `${API_BASE_URL}/v1/messages`,
    headers: [
      { key: 'X-API-Key', value: 'flx_live_sua_chave_aqui' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    params: [],
    body: JSON.stringify({
      channel: 'whatsapp',
      to: '5585999999999',
      message: 'Notifique o cliente Carlos sobre o envio do pedido #1042',
      context: { clientName: 'Carlos', orderId: '1042' }
    }, null, 2)
  },
  {
    id: 'req_2',
    name: 'Registrar Ação no Sistema',
    method: 'POST',
    url: `${API_BASE_URL}/v1/actions`,
    headers: [
      { key: 'X-API-Key', value: 'flx_live_sua_chave_aqui' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    params: [],
    body: JSON.stringify({
      actionType: 'lead_generated',
      data: { source: 'landing_page' }
    }, null, 2)
  },
  {
    id: 'req_3',
    name: 'Disparar Evento do Sistema',
    method: 'POST',
    url: `${API_BASE_URL}/v1/events`,
    headers: [
      { key: 'X-API-Key', value: 'flx_live_sua_chave_aqui' },
      { key: 'Content-Type', value: 'application/json' }
    ],
    params: [],
    body: JSON.stringify({
      eventType: 'user_signup',
      payload: { userId: 'usr_99' }
    }, null, 2)
  }
];

export default function ApiTesterPage() {
  const toast = useToast();
  const [requests, setRequests] = useState<RequestItem[]>(() => {
    const saved = localStorage.getItem('fluxionai_postman_history');
    return saved ? JSON.parse(saved) : DEFAULT_COLLECTIONS;
  });

  const [activeReqId, setActiveReqId] = useState<string>(DEFAULT_COLLECTIONS[0].id);

  // Active Request State
  const [method, setMethod] = useState<RequestItem['method']>('POST');
  const [url, setUrl] = useState('');
  const [headers, setHeaders] = useState<{ key: string; value: string }[]>([]);
  const [params, setParams] = useState<{ key: string; value: string }[]>([]);
  const [body, setBody] = useState('{}');

  const [activeTab, setActiveTab] = useState<'body' | 'headers' | 'params'>('body');
  const [activeResponseTab, setActiveResponseTab] = useState<'ai' | 'raw'>('ai');

  // Response State
  const [response, setResponse] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copiedRaw, setCopiedRaw] = useState(false);
  const [copiedAi, setCopiedAi] = useState(false);

  // AI Copilot State
  const [aiPrompt, setAiPrompt] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);

  // Save requests to localStorage
  useEffect(() => {
    localStorage.setItem('fluxionai_postman_history', JSON.stringify(requests));
  }, [requests]);

  // Load selected request into workbench
  useEffect(() => {
    const current = requests.find(r => r.id === activeReqId);
    if (current) {
      setMethod(current.method);
      setUrl(current.url);
      setHeaders(current.headers);
      setParams(current.params);
      setBody(current.body);
    }
  }, [activeReqId, requests]);

  // Auto-fetch user's real API Key prefix if logged in
  useEffect(() => {
    authFetch('/v1/agents/list')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0 && data[0].apiKeyPrefix) {
          const userKey = `${data[0].apiKeyPrefix}sample_key`;
          setHeaders(prev => prev.map(h => h.key === 'X-API-Key' ? { ...h, value: userKey } : h));
        }
      })
      .catch(() => {});
  }, []);

  const handleCreateNewRequest = () => {
    const newReq: RequestItem = {
      id: `req_${Date.now()}`,
      name: 'Nova Requisição HTTP',
      method: 'GET',
      url: 'https://api.github.com/users/octocat',
      headers: [{ key: 'Content-Type', value: 'application/json' }],
      params: [],
      body: '{}'
    };

    setRequests([newReq, ...requests]);
    setActiveReqId(newReq.id);
  };

  const handleDeleteRequest = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = requests.filter(r => r.id !== id);
    setRequests(filtered);
    if (filtered.length > 0) {
      setActiveReqId(filtered[0].id);
    }
  };

  const handleSendRequest = async () => {
    setLoading(true);
    setResponse(null);
    setAiAnalysis(null);
    const start = Date.now();

    try {
      // Build final URL with query params
      const urlObj = new URL(url);
      params.forEach(p => {
        if (p.key) urlObj.searchParams.append(p.key, p.value);
      });

      // Build Headers object
      const headersObj: Record<string, string> = {};
      headers.forEach(h => {
        if (h.key) headersObj[h.key] = h.value;
      });

      const reqInit: RequestInit = {
        method,
        headers: headersObj,
      };

      if (method !== 'GET' && method !== 'DELETE' && body) {
        reqInit.body = body;
      }

      const res = await fetch(urlObj.toString(), reqInit);
      const resText = await res.text();
      let resJson: any = null;
      try {
        resJson = JSON.parse(resText);
      } catch (e) {
        resJson = resText;
      }

      const resHeaders: Record<string, string> = {};
      res.headers.forEach((value, key) => {
        resHeaders[key] = value;
      });

      const resObj = {
        status: res.status,
        statusText: res.statusText || (res.status >= 200 && res.status < 300 ? 'OK' : 'Error'),
        headers: resHeaders,
        data: resJson,
      };

      setResponse(resObj);

      // Auto-trigger AI analysis on response
      autoAnalyzeResponseWithAi(resObj);
    } catch (err: any) {
      const errObj = {
        status: 0,
        statusText: 'Erro de Conexão / CORS',
        headers: {},
        data: { error: err.message || 'Falha ao conectar à URL. Verifique se o servidor remoto permite CORS ou se a URL está acessível.' }
      };
      setResponse(errObj);
      autoAnalyzeResponseWithAi(errObj);
    } finally {
      setResponseTime(Date.now() - start);
      setLoading(false);
    }
  };

  // Automatic AI Analysis
  const autoAnalyzeResponseWithAi = async (resObj: any) => {
    setAiLoading(true);
    try {
      const chat = await aiService.createChat('Response Analyzer');
      const promptText = `Analise este retorno HTTP:
METHOD: ${method}
URL: ${url}
STATUS HTTP: ${resObj.status} ${resObj.statusText}
RESPOSTA: ${JSON.stringify(resObj.data)}

Forneça a análise formatada em Markdown com as seguintes seções estruturadas:
### O que aconteceu
(Explicação em 1-2 frases do resultado da chamada)

### Causa
(Causa técnica do status ${resObj.status})

### Como corrigir
(Passos práticos claros se houver erro, ou confirmação de sucesso)`;

      const aiRes = await aiService.sendMessage(chat.id, promptText);
      setAiAnalysis(aiRes.assistantMessage.content);
      setActiveResponseTab('ai');
    } catch (err: any) {
      setAiAnalysis(`### Erro na Análise\nFalha ao consultar a IA: ${err.message}`);
    } finally {
      setAiLoading(false);
    }
  };

  // AI Helper: Generate Body from Natural Language Prompt
  const handleGenerateBodyWithAi = async () => {
    if (!aiPrompt.trim()) return;
    setAiLoading(true);
    try {
      const chat = await aiService.createChat('Body Generator');
      const promptText = `O usuário quer um JSON para a seguinte instrução: "${aiPrompt}".
METHOD: ${method}
URL: ${url}
Gere APENAS um JSON estritamente válido (sem textos explicativos ou markdown).`;

      const aiRes = await aiService.sendMessage(chat.id, promptText);
      const cleanJsonStr = aiRes.assistantMessage.content.replace(/```json/g, '').replace(/```/g, '').trim();
      const parsed = JSON.parse(cleanJsonStr);
      setBody(JSON.stringify(parsed, null, 2));
      setAiPrompt('');
    } catch (err: any) {
      toast.error('Erro ao gerar JSON com IA: ' + err.message);
    } finally {
      setAiLoading(false);
    }
  };

  const copyRawResponse = () => {
    if (response) {
      navigator.clipboard.writeText(typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data);
      setCopiedRaw(true);
      setTimeout(() => setCopiedRaw(false), 2000);
    }
  };

  const copyAiAnalysis = () => {
    if (aiAnalysis) {
      navigator.clipboard.writeText(aiAnalysis);
      setCopiedAi(true);
      setTimeout(() => setCopiedAi(false), 2000);
    }
  };

  return (
    <div className="api-tester-page">
      {/* Header */}
      <div className="api-tester-page-header">
        <div>
          <h1 className="api-tester-page-title">
            <FiLayers color="var(--accent)" /> API Studio
            <span className="api-tester-badge">Com IA Integrada</span>
          </h1>
          <p className="api-tester-subtitle">
            Testador de requisições HTTP e diagnóstico inteligente assistido por IA.
          </p>
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="api-tester-grid">
        
        {/* Sidebar History / Collections */}
        <aside className="api-tester-history-panel">
          <button className="api-tester-new-btn" onClick={handleCreateNewRequest}>
            <FiPlus /> Nova Requisição
          </button>

          <div style={{ fontSize: '0.75rem', textTransform: 'uppercase', color: 'var(--text-tertiary)', fontWeight: 700, marginTop: '0.5rem' }}>
            Histórico & Coleções
          </div>

          <div className="api-tester-history-list">
            {requests.map(req => (
              <div 
                key={req.id} 
                className={`api-tester-history-item ${req.id === activeReqId ? 'active' : ''}`}
                onClick={() => setActiveReqId(req.id)}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', overflow: 'hidden' }}>
                  <span className={`api-tester-method-tag ${req.method}`}>{req.method}</span>
                  <span style={{ fontSize: '0.82rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: 'var(--text-primary)' }}>
                    {req.name}
                  </span>
                </div>

                <button 
                  style={{ background: 'none', border: 'none', color: '#8A8A8A', cursor: 'pointer', padding: '2px' }}
                  onClick={(e) => handleDeleteRequest(req.id, e)}
                  title="Excluir requisição"
                >
                  <FiTrash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </aside>

        {/* Workbench Container */}
        <main className="api-tester-workbench">
          
          {/* URL Input Bar */}
          <div className="api-tester-url-row">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value as RequestItem['method'])}
              className="api-tester-method-select"
              style={{
                color: method === 'GET' ? '#10B981' : method === 'POST' ? '#3B82F6' : '#F59E0B'
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
              className="api-tester-url-input"
              placeholder="https://api.exemplo.com/v1/..."
            />

            <button 
              className="api-tester-send-btn" 
              onClick={handleSendRequest}
              disabled={loading}
            >
              <FiPlay /> {loading ? 'Enviando...' : 'Enviar'}
            </button>
          </div>

          {/* Config Tabs Header */}
          <div className="api-tester-tabs-bar">
            <button 
              className={`api-tester-tab-btn ${activeTab === 'body' ? 'active' : ''}`}
              onClick={() => setActiveTab('body')}
            >
              Body (JSON)
            </button>
            <button 
              className={`api-tester-tab-btn ${activeTab === 'headers' ? 'active' : ''}`}
              onClick={() => setActiveTab('headers')}
            >
              Headers ({headers.length})
            </button>
            <button 
              className={`api-tester-tab-btn ${activeTab === 'params' ? 'active' : ''}`}
              onClick={() => setActiveTab('params')}
            >
              Params ({params.length})
            </button>
          </div>

          {/* TAB 1: Body JSON + Unified AI Sparkle Prompt */}
          {activeTab === 'body' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              
              {/* AI Prompt Bar */}
              <div className="api-tester-ai-prompt-box">
                <FiZap color="#3B82F6" size={16} />
                <input 
                  type="text"
                  placeholder="Descreva o payload... Ex: Lead chamado Carlos com e-mail carlos@empresa.com"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleGenerateBodyWithAi()}
                  className="api-tester-url-input"
                  style={{ background: 'transparent', border: 'none', fontSize: '0.85rem' }}
                />
                <button 
                  onClick={handleGenerateBodyWithAi}
                  disabled={aiLoading || !aiPrompt.trim()}
                  className="api-tester-ai-btn-unified"
                >
                  {aiLoading ? 'IA Gerando...' : 'Gerar com IA'}
                </button>
              </div>

              <textarea 
                rows={10}
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="api-tester-json-editor"
              />
            </div>
          )}

          {/* TAB 2: Headers */}
          {activeTab === 'headers' && (
            <div>
              <table className="api-tester-kv-table">
                <thead>
                  <tr>
                    <th>Chave (Header)</th>
                    <th>Valor</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {headers.map((h, i) => (
                    <tr key={i}>
                      <td>
                        <input 
                          value={h.key} 
                          onChange={(e) => {
                            const newH = [...headers];
                            newH[i].key = e.target.value;
                            setHeaders(newH);
                          }}
                          className="api-tester-kv-input"
                          placeholder="Content-Type"
                        />
                      </td>
                      <td>
                        <input 
                          value={h.value} 
                          onChange={(e) => {
                            const newH = [...headers];
                            newH[i].value = e.target.value;
                            setHeaders(newH);
                          }}
                          className="api-tester-kv-input"
                          placeholder="application/json"
                        />
                      </td>
                      <td>
                        <button 
                          onClick={() => setHeaders(headers.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                onClick={() => setHeaders([...headers, { key: '', value: '' }])}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <FiPlus /> Adicionar Header
              </button>
            </div>
          )}

          {/* TAB 3: Params */}
          {activeTab === 'params' && (
            <div>
              <table className="api-tester-kv-table">
                <thead>
                  <tr>
                    <th>Parâmetro (Query)</th>
                    <th>Valor</th>
                    <th style={{ width: '40px' }}></th>
                  </tr>
                </thead>
                <tbody>
                  {params.map((p, i) => (
                    <tr key={i}>
                      <td>
                        <input 
                          value={p.key} 
                          onChange={(e) => {
                            const newP = [...params];
                            newP[i].key = e.target.value;
                            setParams(newP);
                          }}
                          className="api-tester-kv-input"
                          placeholder="limit"
                        />
                      </td>
                      <td>
                        <input 
                          value={p.value} 
                          onChange={(e) => {
                            const newP = [...params];
                            newP[i].value = e.target.value;
                            setParams(newP);
                          }}
                          className="api-tester-kv-input"
                          placeholder="10"
                        />
                      </td>
                      <td>
                        <button 
                          onClick={() => setParams(params.filter((_, idx) => idx !== i))}
                          style={{ background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}
                        >
                          <FiTrash2 />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <button 
                onClick={() => setParams([...params, { key: '', value: '' }])}
                style={{ background: 'none', border: 'none', color: '#3B82F6', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', marginTop: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
              >
                <FiPlus /> Adicionar Parâmetro
              </button>
            </div>
          )}

          {/* Response Viewer Section */}
          {response && (
            <div className="api-tester-response-panel">
              
              {/* Response Bar Header */}
              <div className="api-tester-response-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>Retorno HTTP</span>
                  <span className={`api-tester-status-badge ${response.status >= 200 && response.status < 300 ? 'ok' : 'err'}`}>
                    {response.status} {response.statusText}
                  </span>
                  {responseTime && <span style={{ fontSize: '0.75rem', color: '#8A8A8A' }}>⏱ {responseTime} ms</span>}
                </div>

                {/* Sub-tabs for Response View */}
                <div style={{ display: 'flex', gap: '0.4rem' }}>
                  <button 
                    className={`api-tester-ai-btn-unified ${activeResponseTab === 'ai' ? 'active' : ''}`}
                    onClick={() => setActiveResponseTab('ai')}
                  >
                    <FiCpu size={14} /> Análise da IA
                  </button>
                  <button 
                    className={`api-tester-ai-btn-unified ${activeResponseTab === 'raw' ? 'active' : ''}`}
                    onClick={() => setActiveResponseTab('raw')}
                    style={{ background: activeResponseTab === 'raw' ? 'rgba(255,255,255,0.1)' : 'transparent', color: '#ECECEC', borderColor: 'rgba(255,255,255,0.1)' }}
                  >
                    <FiCode size={14} /> Payload RAW (JSON)
                  </button>
                </div>
              </div>

              {/* TAB 1: Markdown Formatted AI Diagnostic Card */}
              {activeResponseTab === 'ai' && (
                <div>
                  {aiLoading ? (
                    <div style={{ padding: '1.5rem', color: '#8A8A8A', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <FiZap className="spin" color="#3B82F6" /> A IA está analisando a resposta HTTP...
                    </div>
                  ) : aiAnalysis ? (
                    <div className="api-tester-ai-card">
                      <div className="api-tester-ai-card-header">
                        <div className="api-tester-ai-card-title">
                          {response.status >= 200 && response.status < 300 ? (
                            <FiZap size={18} color="#3B82F6" />
                          ) : (
                            <FiAlertTriangle size={18} color="#EF4444" />
                          )}
                          Diagnóstico da IA
                        </div>
                        <button 
                          onClick={copyAiAnalysis}
                          style={{
                            background: 'rgba(255,255,255,0.06)',
                            border: '1px solid rgba(255,255,255,0.1)',
                            color: '#ECECEC',
                            padding: '0.25rem 0.6rem',
                            borderRadius: '4px',
                            fontSize: '0.75rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.3rem'
                          }}
                        >
                          {copiedAi ? <FiCheck color="#10B981" /> : <FiCopy />} {copiedAi ? 'Copiado' : 'Copiar Análise'}
                        </button>
                      </div>

                      <div className="api-tester-markdown-body">
                        <ReactMarkdown>{aiAnalysis}</ReactMarkdown>
                      </div>
                    </div>
                  ) : null}
                </div>
              )}

              {/* TAB 2: Payload RAW Code Viewer */}
              {activeResponseTab === 'raw' && (
                <div style={{ position: 'relative' }}>
                  <button 
                    onClick={copyRawResponse}
                    style={{ position: 'absolute', top: 10, right: 10, background: 'rgba(255,255,255,0.08)', border: 'none', color: '#FFFFFF', padding: '4px 8px', borderRadius: 4, cursor: 'pointer', fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    {copiedRaw ? <FiCheck color="#10B981" /> : <FiCopy />} {copiedRaw ? 'Copiado' : 'Copiar'}
                  </button>
                  <pre style={{ margin: 0, background: '#09090B', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', color: '#E2E8F0', overflowX: 'auto', maxHeight: '300px' }}>
                    {typeof response.data === 'object' ? JSON.stringify(response.data, null, 2) : response.data}
                  </pre>
                </div>
              )}

            </div>
          )}

        </main>
      </div>
    </div>
  );
}
