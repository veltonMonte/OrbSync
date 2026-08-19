import { useState, useRef, useEffect, useMemo, Component, type ReactNode } from 'react';
import {
  FiSend, FiCopy, FiCheck,
  FiThumbsUp, FiThumbsDown, FiTrash2, FiAlertTriangle,
  FiSearch, FiCode, FiMessageSquare, FiMail, FiFileText, FiZap,
  FiPlus, FiChevronDown, FiX
} from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './AiChat.css';
import { aiService } from '../services/ai';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp?: string;
  feedback?: 'like' | 'dislike' | null;
}

interface ChatTag {
  id: string;
  label: string;
  icon: ReactNode;
  description: string;
  placeholder: string;
}

const CHAT_TAGS: ChatTag[] = [
  {
    id: 'pesquisar',
    label: 'Pesquisar',
    icon: <FiSearch size={14} />,
    description: 'Prospecção de empresas, leads e dados na web',
    placeholder: 'O que deseja pesquisar? Ex: Empresas de energia solar em Fortaleza...'
  },
  {
    id: 'codigo',
    label: 'Código',
    icon: <FiCode size={14} />,
    description: 'Gere scripts, componentes ou refatore código',
    placeholder: 'Descreva o código ou lógica que deseja implementar...'
  },
  {
    id: 'mensagem',
    label: 'Mensagem',
    icon: <FiMessageSquare size={14} />,
    description: 'Disparo de WhatsApp e comunicação direta',
    placeholder: 'Envie um WhatsApp para [número] com a mensagem...'
  },
  {
    id: 'email',
    label: 'Email',
    icon: <FiMail size={14} />,
    description: 'Redação de e-mails profissionais e comerciais',
    placeholder: 'Escreva um e-mail formal sobre...'
  },
  {
    id: 'documento',
    label: 'Documento',
    icon: <FiFileText size={14} />,
    description: 'Criação de relatórios, atas e documentações',
    placeholder: 'Crie um documento estruturado sobre...'
  },
  {
    id: 'resumo',
    label: 'Resumo',
    icon: <FiZap size={14} />,
    description: 'Síntese executiva e pontos principais',
    placeholder: 'Faça um resumo prático sobre...'
  },
];

// Error Boundary for safe markdown rendering
class ChatErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("Chat Error Boundary caught an error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.08)', color: '#ef4444', borderRadius: '8px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FiAlertTriangle /> Erro ao renderizar esta mensagem.
        </div>
      );
    }
    return this.props.children;
  }
}

const PROMPT_SUGGESTIONS = [
  {
    title: 'Prospecção WhatsApp',
    prompt: 'Crie uma mensagem persuasiva de abordagem inicial para WhatsApp oferecendo criação de sites para barbearias locais.'
  },
  {
    title: 'Script de Vendas',
    prompt: 'Elabore um roteiro de vendas em 4 etapas para qualificar donos de clínicas estéticas.'
  },
  {
    title: 'Estratégia de Conteúdo',
    prompt: 'Sugira um calendário editorial de 1 semana para o Instagram focado em atração de clientes B2B.'
  },
  {
    title: 'Plano de Ação Semanal',
    prompt: 'Revise as principais tarefas em andamento e elabore um plano de ação para a semana.'
  }
];

interface CodeSnippetBlockProps {
  codeString: string;
  displayLang: string;
  syntaxLang: string;
  onCopy: (text: string) => void;
}

const CodeSnippetBlock = ({ codeString, displayLang, syntaxLang, onCopy }: CodeSnippetBlockProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopyCode = () => {
    onCopy(codeString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <span className="code-lang-label">{displayLang}</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            onClick={handleCopyCode}
            className="code-action-btn"
            title="Copiar código"
            aria-label="Copiar código para a área de transferência"
          >
            {copied ? <FiCheck color="#10b981" /> : <FiCopy />}
            <span>{copied ? 'Copiado' : 'Copiar'}</span>
          </button>
        </div>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        language={syntaxLang || 'text'}
        style={vscDarkPlus}
        showLineNumbers={true}
        codeTagProps={{
          style: {
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace"
          }
        }}
        customStyle={{
          margin: '0',
          borderRadius: '0 0 8px 8px',
          padding: '1rem 1.25rem',
          background: '#0D0D0D',
          border: 'none',
          fontSize: '0.85rem',
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', monospace"
        }}
      >
        {codeString}
      </SyntaxHighlighter>
    </div>
  );
};

export default function AiChatPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [selectedTag, setSelectedTag] = useState<ChatTag | null>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const getCurrentTimeStr = () => {
    return new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chats = await aiService.getChats();
        if (chats && chats.length > 0) {
          const currentChat = chats[0];
          setChatId(currentChat.id);

          if (currentChat.messages && currentChat.messages.length > 0) {
            const mapped: Message[] = currentChat.messages.map(m => ({
              id: m.id,
              sender: m.role === 'USER' ? 'user' : 'ai',
              text: m.content,
              timestamp: getCurrentTimeStr()
            }));
            setMessages(mapped);
          }
        } else {
          const newChat = await aiService.createChat('Nova Conversa');
          setChatId(newChat.id);
        }
      } catch (e) {
        console.error('Failed to init chat', e);
      }
    };
    initChat();
  }, []);

  // Auto-resize textarea as text grows
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [input]);

  const handleCopyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copiado para a área de transferência!');
  };

  const handleSend = async (customText?: string) => {
    const rawText = customText || input;
    if (!rawText.trim() || isLoading) return;

    const userText = rawText.trim();
    let promptToSend = userText;
    if (selectedTag && !customText) {
      promptToSend = `[Modo: ${selectedTag.label}] ${userText}`;
    }

    if (!customText) {
      setInput('');
    }
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
    setIsLoading(true);

    const tempId = Date.now().toString();
    const userMsg: Message = {
      id: tempId,
      sender: 'user',
      text: selectedTag && !customText ? `[${selectedTag.label}] ${userText}` : userText,
      timestamp: getCurrentTimeStr()
    };
    setMessages(prev => [...prev, userMsg]);

    try {
      let activeChatId = chatId;
      if (!activeChatId) {
        const newChat = await aiService.createChat('Nova Conversa');
        activeChatId = newChat.id;
        setChatId(activeChatId);
      }

      const response = await aiService.sendMessage(activeChatId, promptToSend);
      const aiMsg: Message = {
        id: response.assistantMessage?.id || Date.now().toString(),
        sender: 'ai',
        text: response.assistantMessage?.content || 'Sem resposta recebida.',
        timestamp: getCurrentTimeStr()
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (e) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        sender: 'ai',
        text: 'Erro de comunicação com o serviço de IA. Verifique se o servidor backend está online e tente novamente.',
        timestamp: getCurrentTimeStr()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopyMessage = (msg: Message) => {
    handleCopyText(msg.text);
    setCopiedMsgId(msg.id);
    setTimeout(() => setCopiedMsgId(null), 2000);
  };

  const handleFeedback = (msgId: string, type: 'like' | 'dislike') => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        const nextFeedback = m.feedback === type ? null : type;
        if (nextFeedback === 'like') toast.success('Obrigado pelo feedback positivo!');
        if (nextFeedback === 'dislike') toast.info('Feedback registrado para melhoria.');
        return { ...m, feedback: nextFeedback };
      }
      return m;
    }));
  };

  const handleClearHistory = () => {
    if (window.confirm('Deseja limpar as mensagens desta conversa?')) {
      setMessages([]);
      toast.info('Histórico da conversa limpo.');
    }
  };

  const markdownComponents = useMemo(() => ({
    code({ node, inline, className, children, ...props }: any) {
      const match = /language-(\w+)/.exec(className || '');
      const codeString = Array.isArray(children)
        ? children.join('')
        : String(children || '').replace(/\n$/, '');

      if (!inline && (match || codeString.includes('\n'))) {
        const language = match ? match[1].toLowerCase() : 'text';
        const isTerminal = ['bash', 'sh', 'shell', 'terminal', 'cmd', 'powershell'].includes(language);
        const displayLang = isTerminal ? 'CMD' : language.toUpperCase();
        const syntaxLang = isTerminal ? 'bash' : language;

        return (
          <CodeSnippetBlock
            codeString={codeString}
            displayLang={displayLang}
            syntaxLang={syntaxLang}
            onCopy={handleCopyText}
          />
        );
      }

      return (
        <code className={`inline-code ${className || ''}`.trim()} {...props}>
          {children}
        </code>
      );
    }
  }), [toast]);

  return (
    <div className="chat-page">
      <div className="chat-container">
        {/* Minimal Discrete Header (Claude/ChatGPT Style) */}
        <header className="minimal-chat-header">
          <div className="header-info">
            <span className="model-name">FluxionIA Copilot</span>
            <span className="model-sub">Gemini 1.5 Enterprise</span>
          </div>

          {messages.length > 0 && (
            <button
              className="minimal-trash-btn"
              onClick={handleClearHistory}
              title="Limpar Conversa"
            >
              <FiTrash2 size={16} />
            </button>
          )}
        </header>

        {/* Chat Conversation Content */}
        <div className="chat-messages-area">
          {messages.length === 0 ? (
            <div className="minimal-welcome-container">
              <h1 className="minimal-welcome-title">Como posso ajudar você hoje?</h1>

              <div className="minimal-suggestions-grid">
                {PROMPT_SUGGESTIONS.map((s, idx) => (
                  <button
                    key={idx}
                    className="minimal-prompt-btn"
                    onClick={() => handleSend(s.prompt)}
                  >
                    <span className="prompt-btn-title">{s.title}</span>
                    <span className="prompt-btn-desc">{s.prompt}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="messages-list">
              {messages.map((msg) => (
                <div key={msg.id} className={`message-row ${msg.sender}`}>
                  <div className="message-header-line">
                    <span className="message-author">
                      {msg.sender === 'user' ? (user?.name || 'Você') : 'FluxionIA'}
                    </span>
                    {msg.timestamp && (
                      <span className="message-hover-time">{msg.timestamp}</span>
                    )}
                  </div>

                  <div className={`message-content ${msg.sender}`}>
                    {msg.sender === 'ai' ? (
                      <ChatErrorBoundary>
                        <ReactMarkdown components={markdownComponents}>
                          {msg.text}
                        </ReactMarkdown>
                      </ChatErrorBoundary>
                    ) : (
                      <p>{msg.text}</p>
                    )}

                    {/* Discreet Hover Actions */}
                    <div className="hover-actions-bar">
                      <button
                        className="hover-action-btn"
                        onClick={() => handleCopyMessage(msg)}
                        title="Copiar texto"
                        aria-label="Copiar texto da mensagem"
                      >
                        {copiedMsgId === msg.id ? <FiCheck color="#10b981" /> : <FiCopy size={13} />}
                      </button>

                      {msg.sender === 'ai' && (
                        <>
                          <button
                            className={`hover-action-btn ${msg.feedback === 'like' ? 'active-like' : ''}`}
                            onClick={() => handleFeedback(msg.id, 'like')}
                            title="Boa resposta"
                            aria-label="Avaliar como boa resposta"
                          >
                            <FiThumbsUp size={13} />
                          </button>
                          <button
                            className={`hover-action-btn ${msg.feedback === 'dislike' ? 'active-dislike' : ''}`}
                            onClick={() => handleFeedback(msg.id, 'dislike')}
                            title="Resposta ruim"
                            aria-label="Avaliar como resposta ruim"
                          >
                            <FiThumbsDown size={13} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="message-row ai">
                  <div className="message-header-line">
                    <span className="message-author">FluxionIA</span>
                  </div>
                  <div className="message-content ai">
                    <div className="minimal-typing-dots">
                      <span></span><span></span><span></span>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Minimal Input Bar */}
        <div className="chat-input-area">
          <div className="input-box">
            <textarea
              ref={textareaRef}
              rows={1}
              placeholder={
                selectedTag
                  ? selectedTag.placeholder
                  : 'Escreva uma mensagem ou escolha um modo abaixo...'
              }
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div className="input-actions">
              {/* Left Actions: Tag / Mode Selector Menu or Active Chip */}
              <div className="input-actions-left">
                {!selectedTag ? (
                  <div className="tag-menu-container" ref={menuRef}>
                    <button
                      type="button"
                      className="tag-menu-trigger-btn"
                      onClick={() => setIsMenuOpen(!isMenuOpen)}
                      title="Escolher modo / especialidade"
                    >
                      <FiPlus size={13} />
                      <span>Modo</span>
                      <FiChevronDown size={12} className={isMenuOpen ? 'rotate-180' : ''} />
                    </button>

                    {isMenuOpen && (
                      <div className="tag-menu-dropdown">
                        <div className="tag-menu-header">Especialidade / Modo</div>
                        <div className="tag-menu-items">
                          {CHAT_TAGS.map((tag) => (
                            <button
                              key={tag.id}
                              type="button"
                              className="tag-menu-item"
                              onClick={() => {
                                setSelectedTag(tag);
                                setIsMenuOpen(false);
                                if (textareaRef.current) textareaRef.current.focus();
                              }}
                            >
                              <span className="tag-menu-item-icon">{tag.icon}</span>
                              <div className="tag-menu-item-info">
                                <span className="tag-menu-item-label">{tag.label}</span>
                                <span className="tag-menu-item-desc">{tag.description}</span>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="selected-tag-chip">
                    <span className="selected-tag-icon">{selectedTag.icon}</span>
                    <span className="selected-tag-label">{selectedTag.label}</span>
                    <button
                      type="button"
                      className="selected-tag-close-btn"
                      onClick={() => {
                        setSelectedTag(null);
                        if (textareaRef.current) textareaRef.current.focus();
                      }}
                      title="Remover modo"
                    >
                      <FiX size={12} />
                    </button>
                  </div>
                )}
              </div>

              {/* Right Actions: Hint and Send button */}
              <div className="input-actions-right">
                <span className="input-hint">Enter para enviar, Shift+Enter para nova linha</span>
                <button
                  className={`minimal-send-btn ${(input.trim() && !isLoading) ? 'active' : ''}`}
                  onClick={() => handleSend()}
                  disabled={isLoading || !input.trim()}
                  title="Enviar"
                  aria-label="Enviar mensagem"
                >
                  <FiSend size={14} />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
