import { useState, useRef, useEffect } from 'react';
import type { EndpointDef } from './types';
import { FiX, FiSend, FiCpu } from 'react-icons/fi';
import { aiService } from '../../services/ai';
import type { AIMessage } from '../../services/ai';
import { API_BASE_URL } from './data';

interface AiApiTesterProps {
  endpoint: EndpointDef;
  onClose: () => void;
}

export function AiApiTester({ endpoint, onClose }: AiApiTesterProps) {
  const [prompt, setPrompt] = useState('');
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleTest = async () => {
    if (!prompt.trim() || loading) return;
    const userText = prompt.trim();
    setPrompt('');
    setLoading(true);

    const newMsg: AIMessage = { id: Date.now().toString(), role: 'USER', content: userText, createdAt: new Date().toISOString() };
    setMessages(prev => [...prev, newMsg]);

    try {
      // Create a temporary chat just for this test
      const chat = await aiService.createChat('API Test');
      
      // We will send a highly structured prompt to the AI to instruct it to generate a test config
      const systemContext = `
Você é o AI API Tester da FluxionAi. O usuário quer testar o endpoint:
METHOD: ${endpoint.method}
PATH: ${endpoint.path}
BODY_PARAMS: ${JSON.stringify(endpoint.bodyParams)}

Objetivo do usuário: "${userText}"

Você deve responder APENAS com um bloco JSON (sem markdown) no seguinte formato, deduzindo os parâmetros baseados no objetivo do usuário:
{
  "method": "${endpoint.method}",
  "path": "${endpoint.path}",
  "body": { ... }
}
      `;

      const aiResponse = await aiService.sendMessage(chat.id, systemContext);
      
      // Parse the JSON from the AI
      let testConfig;
      try {
        const rawContent = aiResponse.assistantMessage.content.replace(/```json/g, '').replace(/```/g, '').trim();
        testConfig = JSON.parse(rawContent);
      } catch (err) {
        setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ASSISTANT', content: 'A IA falhou em gerar os parâmetros de teste. Tente ser mais específico.', createdAt: new Date().toISOString() }]);
        setLoading(false);
        return;
      }

      // Add "Request prepared" message
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ASSISTANT', 
        content: `Endpoint encontrado: ${endpoint.method} ${endpoint.path}\n\nPermission necessária: ${endpoint.permission}\n\nRequest preparada baseada no seu texto:\n\`\`\`json\n${JSON.stringify(testConfig.body, null, 2)}\n\`\`\``, 
        createdAt: new Date().toISOString() 
      }]);

      // Execute the actual request
      const url = `${API_BASE_URL.replace('/api', '')}${endpoint.path}`;
      const reqInit: RequestInit = {
        method: testConfig.method,
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey ? { 'Authorization': `Bearer ${apiKey}` } : {})
        },
        ...(testConfig.body && testConfig.method !== 'GET' ? { body: JSON.stringify(testConfig.body) } : {})
      };

      const res = await fetch(url, reqInit);
      const data = await res.json().catch(() => null);

      // Now send the result back to AI to explain it
      const explainPrompt = `A requisição foi feita. Status HTTP: ${res.status}. Response: ${JSON.stringify(data)}. Explique o resultado de forma sucinta e indique se foi um sucesso ou o porquê falhou.`;
      const explainResponse = await aiService.sendMessage(chat.id, explainPrompt);

      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        role: 'ASSISTANT', 
        content: `**Result:**\n✓ HTTP ${res.status}\n\n${explainResponse.assistantMessage.content}`, 
        createdAt: new Date().toISOString() 
      }]);

    } catch (e: any) {
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ASSISTANT', content: `Erro ao executar o teste: ${e.message}`, createdAt: new Date().toISOString() }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="api-tester-overlay">
      <div className="api-tester-drawer">
        <div className="api-tester-header">
          <h2 className="api-tester-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <FiCpu color="var(--accent)" /> AI API Tester
          </h2>
          <button className="chat-icon-btn" onClick={onClose}><FiX /></button>
        </div>
        
        <div className="api-tester-body" style={{ background: '#09090B' }}>
          
          <div style={{ marginBottom: '1rem' }}>
            <div className="api-tester-section-title">API Key (Required for execution)</div>
            <input 
              placeholder="Bearer SUA_CHAVE_API" 
              value={apiKey}
              onChange={e => setApiKey(e.target.value)}
              className="api-tester-input" 
            />
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {messages.length === 0 && (
              <div style={{ color: 'var(--text-secondary)', textAlign: 'center', marginTop: '2rem', fontSize: '0.9rem' }}>
                Descreva o que você quer testar neste endpoint. Ex:<br/><br/>
                <i>"Crie uma ação chamada send_message e verifique se a API retorna 201."</i>
              </div>
            )}
            
            {messages.map(msg => (
              <div key={msg.id} style={{ 
                background: msg.role === 'USER' ? 'var(--bg-surface)' : 'transparent',
                border: msg.role === 'USER' ? '1px solid var(--border-subtle)' : 'none',
                padding: '1rem',
                borderRadius: 'var(--radius-md)',
                color: 'var(--text-primary)',
                fontSize: '0.9rem',
                whiteSpace: 'pre-wrap'
              }}>
                <div style={{ fontWeight: 600, color: msg.role === 'USER' ? 'var(--text-primary)' : 'var(--accent)', marginBottom: '0.5rem' }}>
                  {msg.role === 'USER' ? 'Você' : 'AI Tester'}
                </div>
                {msg.content}
              </div>
            ))}
            {loading && (
              <div style={{ padding: '1rem', color: 'var(--text-tertiary)', fontStyle: 'italic' }}>A IA está pensando e executando...</div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        <div className="api-tester-footer" style={{ display: 'flex', gap: '0.5rem' }}>
          <input 
            type="text"
            className="api-tester-input"
            placeholder="Describe what you want to test..."
            value={prompt}
            onChange={e => setPrompt(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleTest()}
          />
          <button className="apidocs-btn primary" onClick={handleTest} disabled={loading || !prompt.trim()}>
            <FiSend />
          </button>
        </div>
      </div>
    </div>
  );
}
