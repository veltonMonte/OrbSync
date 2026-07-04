import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FiSend, FiPaperclip, FiMic, FiUser } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';
import './AiChat.css';
import { aiService } from '../services/ai';
import { useAuth } from '../contexts/AuthContext';
import { terminalService } from '../services/terminal';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
}

const TerminalCodeBlock = ({ children, displayLang, syntaxLang }: any) => {
  const [output, setOutput] = useState<{stdout: string; stderr: string; error?: string} | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const codeString = String(children).replace(/\n$/, '');

  const handleRun = async () => {
    setIsRunning(true);
    setOutput(null);
    try {
      const res = await terminalService.executeCommand(codeString);
      setOutput(res);
    } catch (err: any) {
      setOutput({ stdout: '', stderr: '', error: err.response?.data?.message || err.message || 'Erro ao executar comando' });
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div className="code-block-wrapper">
      <div className="code-block-header">
        <div className="mac-dots">
          <span className="dot red"></span>
          <span className="dot yellow"></span>
          <span className="dot green"></span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <span className="code-lang-label">{displayLang}</span>
          {displayLang === 'CMD' && (
            <button 
              onClick={handleRun} 
              disabled={isRunning}
              className="run-cmd-btn"
              title="Executar no Servidor"
            >
              {isRunning ? 'Executando...' : '▶ Executar'}
            </button>
          )}
        </div>
      </div>
      <SyntaxHighlighter
        PreTag="div"
        children={codeString}
        language={syntaxLang}
        style={vscDarkPlus}
        showLineNumbers={true}
        codeTagProps={{
          style: {
            fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace"
          }
        }}
        customStyle={{
          margin: '0',
          borderRadius: output ? '0' : '0 0 12px 12px',
          padding: '1.25rem',
          background: '#0d1117',
          border: 'none',
          fontSize: '0.9rem',
          fontFamily: "'Fira Code', 'JetBrains Mono', 'Consolas', 'Courier New', monospace"
        }}
      />
      {output && (
        <div className="terminal-output">
          <div className="terminal-output-header">Saída do Terminal</div>
          {output.stdout && <pre className="stdout">{output.stdout}</pre>}
          {output.stderr && <pre className="stderr">{output.stderr}</pre>}
          {output.error && <pre className="error">{output.error}</pre>}
        </div>
      )}
    </div>
  );
};

export default function AiChatPage() {
  const { user } = useAuth();
  const [chatId, setChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([
    { id: 'welcome', sender: 'ai', text: 'Olá! Sou a assistente IA da Pompeli conectada ao seu Workspace. Como posso ajudar com seus projetos ou documentos hoje?' }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const initChat = async () => {
      try {
        const chats = await aiService.getChats();
        if (chats.length > 0) {
          const currentChat = chats[0];
          setChatId(currentChat.id);
          
          if (currentChat.messages && currentChat.messages.length > 0) {
            const mapped: Message[] = currentChat.messages.map(m => ({
              id: m.id,
              sender: m.role === 'USER' ? 'user' : 'ai',
              text: m.content
            }));
            // Prepend welcome message if we want, or just use history
            setMessages([{ id: 'welcome', sender: 'ai' as const, text: 'Histórico carregado. Como posso ajudar agora?' }, ...mapped]);
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

  const handleSend = async () => {
    if (!input.trim() || !chatId || isLoading) return;
    
    const userText = input.trim();
    setInput('');
    setIsLoading(true);
    
    // Add user message optimistically
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, sender: 'user' as const, text: userText }]);

    try {
      const response = await aiService.sendMessage(chatId, userText);
      setMessages(prev => [...prev, { 
        id: response.assistantMessage.id, 
        sender: 'ai' as const, 
        text: response.assistantMessage.content 
      }]);
    } catch (e) {
      setMessages(prev => [...prev, { 
        id: Date.now().toString(), 
        sender: 'ai' as const, 
        text: 'Erro de comunicação com o servidor. Tente novamente.' 
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-page">
      <motion.div 
        className="chat-container"
        initial={{ opacity: 0, y: 15, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >


        <div className="chat-messages-area">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                className={`chat-message-wrapper ${msg.sender}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
              >
                {msg.sender === 'ai' && (
                  <div className="chat-message-avatar ai">IA</div>
                )}
                <div className={`chat-message-bubble ${msg.sender}`}>
                  {msg.sender === 'ai' ? (
                    <ReactMarkdown
                      components={{
                        code(props) {
                          const { children, className, node, ...rest } = props;
                          const match = /language-(\w+)/.exec(className || '');
                          if (match) {
                            const language = match[1].toLowerCase();
                            const isTerminal = ['bash', 'sh', 'shell', 'terminal', 'cmd', 'powershell'].includes(language);
                            const displayLang = isTerminal ? 'CMD' : language.toUpperCase();
                            
                            // Força a sintaxe do bash para comandos de terminal para garantir o highlight colorido
                            const syntaxLang = isTerminal ? 'bash' : language;

                            return (
                              <TerminalCodeBlock 
                                children={children} 
                                language={language}
                                displayLang={displayLang}
                                syntaxLang={syntaxLang}
                              />
                            );
                          }
                          return (
                            <code {...rest} className={`inline-code ${className || ''}`.trim()}>
                              {children}
                            </code>
                          );
                        }
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  ) : (
                    msg.text
                  )}
                </div>
                {msg.sender === 'user' && (
                  <div className="chat-message-avatar user">
                    {user?.name?.charAt(0).toUpperCase() || <FiUser />}
                  </div>
                )}
              </motion.div>
            ))}
            {isLoading && (
              <motion.div
                key="loading"
                className="chat-message-wrapper ai"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
              >
                <div className="chat-message-avatar ai">IA</div>
                <div className="chat-message-bubble ai typing-indicator">
                  <span></span><span></span><span></span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>

        <div className="chat-input-area">
          <div className="chat-input-wrapper">
            <button className="chat-icon-btn"><FiPaperclip /></button>
            <input 
              type="text" 
              placeholder="Digite sua mensagem para a IA..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            />
            <button className="chat-icon-btn"><FiMic /></button>
            <button 
              className={`chat-send-btn ${(input.trim() && !isLoading) ? 'active' : ''}`}
              onClick={handleSend}
              disabled={isLoading}
            >
              <FiSend />
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
