import { useState, useRef, useCallback } from 'react';
import { motion, type Variants } from 'framer-motion';
import { 
  FiTarget, FiMessageSquare, FiZap, FiLayout, FiFileText, 
  FiGithub, FiCode, FiCpu, FiSend, FiLayers, FiCopy, FiCheck
} from 'react-icons/fi';
import './Sobre.css';

// ─── Cursor glow hook ───
function useGlowTracker() {
  const ref = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const onMouseMove = useCallback((e: React.MouseEvent) => {
    if (!ref.current || !glowRef.current) return;
    const rect = ref.current.getBoundingClientRect();
    glowRef.current.style.left = `${e.clientX - rect.left}px`;
    glowRef.current.style.top = `${e.clientY - rect.top}px`;
  }, []);

  return { ref, glowRef, onMouseMove };
}

// ─── Animations ───
const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07 } },
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
};

// ─── Feature card ───
function FeatureCard({ icon, title, badge, children, className }: {
  icon: React.ReactNode;
  title: string;
  badge?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const { ref, glowRef, onMouseMove } = useGlowTracker();

  return (
    <motion.div
      className={`sobre-card ${className || ''}`}
      ref={ref}
      onMouseMove={onMouseMove}
      variants={itemVariants}
      whileHover={{ y: -4, transition: { duration: 0.25, ease: "easeOut" } }}
    >
      <div ref={glowRef} className="sobre-card-glow" />
      <div className="sobre-card-header-row">
        <div className="sobre-card-icon-wrapper">
          <div className="sobre-card-icon">{icon}</div>
        </div>
        {badge && <span className="sobre-card-badge">{badge}</span>}
      </div>
      <div className="sobre-card-body">
        <h2>{title}</h2>
        {children}
      </div>
    </motion.div>
  );
}

export default function SobrePage() {
  const [activeApiTab, setActiveApiTab] = useState<'events' | 'messages' | 'actions'>('events');
  const [copiedCode, setCopiedCode] = useState(false);

  const apiSnippets = {
    events: `// Enviar um Evento do seu sistema para a FluxionIA
POST /api/v1/events
Header: x-api-key: flx_live_sua_chave_aqui
Content-Type: application/json

{
  "eventType": "payment_failed",
  "customer": {
    "name": "Carlos Eduardo",
    "email": "carlos@email.com",
    "phone": "5585999999999"
  },
  "payload": {
    "orderId": "ORD-9482",
    "amount": 249.90,
    "reason": "Cartão recusado"
  }
}`,
    messages: `// Disparar Atendimento Inteligente por IA
POST /api/v1/messages
Header: x-api-key: flx_live_sua_chave_aqui
Content-Type: application/json

{
  "channel": "whatsapp",
  "to": "5585999999999",
  "message": "Qual é o prazo de entrega para o pedido #1042?",
  "history": [
    { "role": "USER", "content": "Olá, preciso de informações." }
  ]
}`,
    actions: `// Registrar Ação Externa no Workflow do Workspace
POST /api/v1/actions
Header: x-api-key: flx_live_sua_chave_aqui
Content-Type: application/json

{
  "actionType": "lead_captured",
  "data": {
    "name": "Mariana Silva",
    "company": "Tech Solutions",
    "budget": "R$ 15.000,00"
  }
}`
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(apiSnippets[activeApiTab]);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  return (
    <div className="sobre-page">
      <motion.div variants={containerVariants} initial="hidden" animate="show">

        {/* ─── Hero / O que Somos ─── */}
        <motion.div className="sobre-header" variants={itemVariants}>
          <div className="sobre-label">
            <FiCpu /> Arquitetura & Visão Geral
          </div>
          <h1 className="sobre-heading">
            O que é a <em>FluxionIA</em>?
          </h1>
          <p className="sobre-subtitle">
            A <strong>FluxionIA</strong> é uma plataforma corporativa <em>enterprise-grade</em> de produtividade unificada. Combinamos a gestão de tarefas, documentação e CRM à potência de <strong>Agentes de IA autônomos</strong> e automações conectadas diretamente ao seu terminal local e API.
          </p>
        </motion.div>

        {/* ─── Diferencial de Arquitetura Banner ─── */}
        <motion.div className="sobre-diff-banner" variants={itemVariants}>
          <div className="sobre-diff-badge">Diferencial Arquitetural & Automação Inteligente</div>
          <div className="sobre-diff-grid">
            <div className="sobre-diff-col">
              <h3>❌ Automações Tradicionais (Connectors Estáticos)</h3>
              <ul>
                <li><strong>Nós Rígidos:</strong> Exigem que você desenhe dezenas de blocos <code>If/Else</code> manuais.</li>
                <li><strong>Sem Contexto do Negócio:</strong> São "cegos" aos dados da sua empresa (não possuem Kanban, CRM ou docs nativos).</li>
                <li><strong>Setup Complexo:</strong> Exigem montagem visual trabalhosa para qualquer condicional.</li>
              </ul>
            </div>
            <div className="sobre-diff-divider" />
            <div className="sobre-diff-col highlight">
              <h3>⚡ FluxionIA (Agentes Autônomos + Workspace)</h3>
              <ul>
                <li><strong>Raciocínio com Agentic AI:</strong> O agente decide em tempo real a melhor ação com base na intenção do cliente (<code>ToolDispatcher</code>).</li>
                <li><strong>Contexto Nativo do Workspace:</strong> A IA lê seu Kanban, Documentos TipTap e Leads antes de responder.</li>
                <li><strong>Integrado ao DevOps:</strong> Funciona conectado ao seu Terminal local e repositórios GitHub.</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* ─── O Que Cada Coisa Faz (Bento Grid) ─── */}
        <motion.div className="sobre-section-title" variants={itemVariants}>
          <h2>O que cada módulo faz</h2>
          <p>Tudo o que você precisa para gerenciar sua operação em um único painel.</p>
        </motion.div>

        <div className="sobre-grid">

          <FeatureCard icon={<FiLayout size={24} />} title="Meus Projetos & Quadro Kanban" badge="Produtividade Visual">
            <p>
              Organização visual intuitiva por colunas (A Fazer, Em Progresso, Concluído) com arrastar e soltar (`@hello-pangea/dnd`), prazos e prioridades.
            </p>
          </FeatureCard>

          <FeatureCard icon={<FiMessageSquare size={24} />} title="Assistente de IA Contextual" badge="Gemini / OpenAI / Anthropic">
            <p>
              Interface minimalista estilo Claude/ChatGPT. O assistente possui acesso ao contexto real do workspace: ele responde dúvidas sobre prazos, documentos e cartões pendentes.
            </p>
            <p>
              Permite alternar provedores de IA nas configurações (Google Gemini, OpenAI, Claude) com chave própria (BYOK).
            </p>
          </FeatureCard>

          <FeatureCard icon={<FiTarget size={24} />} title="CRM & Captura de Leads" badge="Geolocalização + IA">
            <p>
              Prospecção inteligente integrada ao Google Maps. Digite o nicho (ex: <em>"oficina mecânica"</em>) e a cidade para obter dados completos de contato.
            </p>
            <p>
              Para cada lead encontrado, a IA gera automaticamente uma <strong>abordagem comercial personalizada para WhatsApp</strong>, pronta para copiar e enviar.
            </p>
          </FeatureCard>

          <FeatureCard icon={<FiFileText size={24} />} title="Editor de Documentos (TipTap)" badge="Rich-Text & PDF">
            <p>
              Editor de texto avançado com formatação rich-text, salvamento em tempo real com debounce, organização por pastas no workspace e exportação em PDF.
            </p>
          </FeatureCard>

          <FeatureCard icon={<FiZap size={24} />} title="Motor de Automações" badge="Canvas XYFlow">
            <p>
              Canvas gráfico com XYFlow para conectar disparadores (Card Movido, E-mail Recebido, PR do GitHub) a ações automáticas do sistema, tudo processado de forma resiliente no backend NestJS.
            </p>
          </FeatureCard>

          <FeatureCard icon={<FiGithub size={24} />} title="GitHub Insights & Repositórios" badge="REST API Segura">
            <p>
              Painel seguro conectado via API oficial do GitHub. Visualize commits recentes, pull requests abertos, branches e métricas dos seus repositórios sem expor seu ambiente local.
            </p>
          </FeatureCard>

        </div>

        {/* ─── Explicação da API & Ponto de Vista do Cliente ─── */}
        <motion.div className="sobre-api-section" variants={itemVariants}>
          <div className="sobre-api-header">
            <div className="sobre-label"><FiCode /> Integração via API (v1)</div>
            <h2>Como funciona a API da FluxionIA no ponto de vista do Cliente?</h2>
            <p>
              A API foi desenhada para que <strong>qualquer sistema externo</strong> (seu e-commerce, CRM atual, app mobile ou formulário web) possa utilizar a inteligência da FluxionIA com <strong>apenas 1 chave de API (<code>x-api-key</code>)</strong>.
            </p>
          </div>

          {/* Exemplo de Código Interativo */}
          <div className="sobre-api-box">
            <div className="sobre-api-nav">
              <button 
                className={activeApiTab === 'events' ? 'active' : ''} 
                onClick={() => setActiveApiTab('events')}
              >
                <FiZap /> Notificar Evento (<code>/v1/events</code>)
              </button>
              <button 
                className={activeApiTab === 'messages' ? 'active' : ''} 
                onClick={() => setActiveApiTab('messages')}
              >
                <FiSend /> Atendimento IA (<code>/v1/messages</code>)
              </button>
              <button 
                className={activeApiTab === 'actions' ? 'active' : ''} 
                onClick={() => setActiveApiTab('actions')}
              >
                <FiLayers /> Registrar Ação (<code>/v1/actions</code>)
              </button>

              <button className="sobre-api-copy" onClick={handleCopyCode}>
                {copiedCode ? <><FiCheck /> Copiado!</> : <><FiCopy /> Copiar cURL</>}
              </button>
            </div>

            <pre className="sobre-api-code">
              <code>{apiSnippets[activeApiTab]}</code>
            </pre>
          </div>

          {/* 3 Casos de Uso Práticos do Cliente */}
          <div className="sobre-usecases-grid">
            <div className="sobre-usecase-card">
              <div className="sobre-usecase-num">01</div>
              <h3>E-commerce & Recuperação de Vendas</h3>
              <p>
                Seu e-commerce dispara um `POST /v1/events` quando um pagamento via Pix expira. O Agente de IA da FluxionIA gera uma mensagem persuasiva com link atualizado e envia no WhatsApp do cliente sem intervenção humana.
              </p>
            </div>

            <div className="sobre-usecase-card">
              <div className="sobre-usecase-num">02</div>
              <h3>Atendimento 24/7 pelo WhatsApp</h3>
              <p>
                As mensagens recebidas no seu WhatsApp corporativo chegam via webhook na API `/v1/messages`. O Agente consulta o estoque e os documentos do seu workspace para responder dúvidas e agendar reuniões sozinho.
              </p>
            </div>

            <div className="sobre-usecase-card">
              <div className="sobre-usecase-num">03</div>
              <h3>Qualificação Automática de Leads</h3>
              <p>
                Um formulário de contato do seu site envia os dados para `/v1/actions`. A IA analisa o porte da empresa, cria o cartão na coluna "Leads Qualificados" do Kanban e atribui a tarefa ao vendedor responsável.
              </p>
            </div>
          </div>
        </motion.div>

        {/* ─── Footer CTA ─── */}
        <motion.div className="sobre-footer-cta" variants={itemVariants}>
          <h2>Pronto para elevar a produtividade da sua empresa?</h2>
          <p>Experimente o ecossistema completo da FluxionIA e integre sua operação com Agentes Autônomos de Inteligência Artificial.</p>
        </motion.div>

      </motion.div>
    </div>
  );
}

