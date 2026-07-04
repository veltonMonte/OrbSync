import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiTerminal, FiRefreshCw } from 'react-icons/fi';
import { terminalService } from '../services/terminal';
import { aiService } from '../services/ai';
import './Git.css';

interface TerminalLine {
  id: string;
  type: 'input' | 'output' | 'error';
  text: string;
}

const COMMON_COMMANDS = [
  'git status', 'git add .', 'git commit -m "update"', 'git push', 'git pull', 
  'git log', 'git branch', 'git checkout -b ', 'clear', 'ls -la', 'npm install', 
  'npm run dev', 'npm start', 'docker ps'
];

export default function GitPage() {
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('pompeli_term_cmd_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftInput, setDraftInput] = useState('');
  const [currentCwd, setCurrentCwd] = useState('~');
  const [machineInfo, setMachineInfo] = useState({ username: 'velton', hostname: 'pompeli' });
  
  useEffect(() => {
    terminalService.getInfo().then(info => {
      setMachineInfo({ username: info.username, hostname: info.hostname });
      if (currentCwd === '~') {
        let displayCwd = info.cwd;
        if (displayCwd.startsWith('/home/' + info.username) || displayCwd.startsWith('C:\\Users\\' + info.username)) {
          displayCwd = displayCwd.replace(new RegExp(`^(/home/${info.username}|C:\\\\Users\\\\${info.username})`), '~');
        }
        setCurrentCwd(displayCwd);
      }
    }).catch(console.error);
  }, []);
  
  const [history, setHistory] = useState<TerminalLine[]>(() => {
    const saved = localStorage.getItem('pompeli_term_history');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', type: 'output', text: 'Pompeli Terminal v1.0.0' },
      { id: '2', type: 'output', text: 'Conectado ao ambiente local. Pressione TAB para sugestões ou Setas para histórico.' },
      { id: '3', type: 'output', text: 'Dica: Digite "ai <seu pedido>" para pedir ajuda à Inteligência Artificial (ex: ai listar arquivos).' }
    ];
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);
  

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('pompeli_term_history', JSON.stringify(history));
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    localStorage.setItem('pompeli_term_cmd_history', JSON.stringify(commandHistory));
  }, [commandHistory]);

  const handleCommand = async () => {
    if (!terminalInput.trim() || isExecuting) return;
    
    const cmd = terminalInput.trim();
    
    // Atualiza Histórico de Comandos
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== cmd);
      return [...filtered, cmd];
    });
    setHistoryIndex(-1);
    setDraftInput('');
    setTerminalInput('');
    
    // Adiciona o comando no histórico com o path atual
    const promptPrefix = `${machineInfo.username}@${machineInfo.hostname}:${currentCwd}$ `;
    setHistory(prev => [...prev, { id: Date.now().toString(), type: 'input', text: promptPrefix + cmd }]);
    
    if (cmd.startsWith('ai ')) {
      const prompt = cmd.substring(3).trim();
      setIsExecuting(true);
      const loadingId = Date.now().toString() + 'loading';
      setHistory(prev => [...prev, { id: loadingId, type: 'output', text: '> [IA DevOps] Analisando o sistema e gerando comando seguro...' }]);
      try {
        const res = await aiService.generateTerminalCommand(prompt);
        setHistory(prev => {
          const filtered = prev.filter(h => h.id !== loadingId);
          return [...filtered, { id: Date.now().toString() + 'aio', type: 'output', text: '[IA DevOps] Comando sugerido preenchido no terminal. Revise e aperte ENTER para executar.' }];
        });
        setTerminalInput(res.command);
      } catch (e) {
        setHistory(prev => {
          const filtered = prev.filter(h => h.id !== loadingId);
          return [...filtered, { id: Date.now().toString() + 'aie', type: 'error', text: 'Erro ao gerar comando com IA.' }];
        });
      } finally {
        setIsExecuting(false);
        setTimeout(() => document.getElementById('dev-term-input')?.focus(), 10);
      }
      return;
    }

    if (cmd === 'clear') {
      const emptyHistory: TerminalLine[] = [];
      setHistory(emptyHistory);
      localStorage.removeItem('pompeli_term_history');
      return;
    }

    setIsExecuting(true);
    try {
      const res = await terminalService.executeCommand(cmd);
      
      // Atualiza o diretório atual se a API retornar um novo cwd
      if (res.cwd) {
        let displayCwd = res.cwd;
        // Simplifica a home do usuário para ~
        if (displayCwd.startsWith('/home/' + machineInfo.username) || displayCwd.startsWith('C:\\Users\\' + machineInfo.username)) {
          displayCwd = displayCwd.replace(new RegExp(`^(/home/${machineInfo.username}|C:\\\\Users\\\\${machineInfo.username})`), '~');
        }
        setCurrentCwd(displayCwd);
      }

      if (res.error) {
        setHistory(prev => [...prev, { id: Date.now().toString() + 'e', type: 'error', text: res.error + '\n' + res.stderr }]);
      } else {
        if (res.stdout) {
          setHistory(prev => [...prev, { id: Date.now().toString() + 'o', type: 'output', text: res.stdout }]);
        }
        if (res.stderr) {
          setHistory(prev => [...prev, { id: Date.now().toString() + 'se', type: 'error', text: res.stderr }]);
        }
      }
    } catch (e) {
      setHistory(prev => [...prev, { id: Date.now().toString() + 'e', type: 'error', text: 'Falha ao comunicar com backend terminal.' }]);
    } finally {
      setIsExecuting(false);
      setTimeout(() => document.getElementById('dev-term-input')?.focus(), 10);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleCommand();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        if (historyIndex === -1) setDraftInput(terminalInput);
        const nextIndex = historyIndex < commandHistory.length - 1 ? historyIndex + 1 : historyIndex;
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const nextIndex = historyIndex - 1;
        setHistoryIndex(nextIndex);
        setTerminalInput(commandHistory[commandHistory.length - 1 - nextIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setTerminalInput(draftInput);
      }
    } else if (e.key === 'Tab') {
      e.preventDefault();
      if (!terminalInput) return;
      const suggestions = COMMON_COMMANDS.filter(c => c.startsWith(terminalInput.toLowerCase()));
      if (suggestions.length > 0) {
        setTerminalInput(suggestions[0]);
      }
    }
  };



  // Sugestões visuais
  const activeSuggestions = terminalInput 
    ? COMMON_COMMANDS.filter(c => c.startsWith(terminalInput.toLowerCase()) && c !== terminalInput.toLowerCase()).slice(0, 4)
    : [];

  return (
    <div className="dev-page">
      <motion.div 
        className="dev-container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        
        {/* Lado Esquerdo: Terminal */}
        <div className="dev-terminal-section">
          <div className="dev-header">
            <FiTerminal className="dev-header-icon" />
            <h2>Terminal Local</h2>
            <div style={{ flex: 1 }}></div>
            {isExecuting && <FiRefreshCw className="dev-spinner" />}
          </div>
          
          <div className="terminal-window" onClick={() => document.getElementById('dev-term-input')?.focus()}>
            <div className="terminal-content">
              <div className="terminal-logo-container" style={{ padding: '1rem 0 2rem 0', opacity: 0.9 }}>
                <pre style={{ margin: 0, color: '#c084fc', fontFamily: '"Fira Code", "Courier New", monospace', fontSize: '0.9rem', fontWeight: 'bold', lineHeight: 1.2, textShadow: '0 0 10px rgba(192, 132, 252, 0.3)' }}>
{`  _ __   ___  _ __ ___  _ __   ___| / |
 | '_ \\ / _ \\| '_ \` _ \\| '_ \\ / _ \\ | |
 | |_) | (_) | | | | | | |_) |  __/ | |
 | .__/ \\___/|_| |_| |_| .__/ \\___|_|_|
 |_|                   |_|             `}
                </pre>
              </div>
              
              {history.map(line => (
                <div key={line.id} className={`terminal-line ${line.type}`}>
                  {/* Para linhas do tipo input, o prefixo já foi inserido com a cor do texto, ou usamos a classe prompt se quisermos colorir. Vamos colorir a primeira palavra */}
                  {line.type === 'input' ? (
                    <>
                      <span className="prompt">{line.text.substring(0, line.text.indexOf('$') + 1)} </span>
                      <span className="text">{line.text.substring(line.text.indexOf('$') + 1)}</span>
                    </>
                  ) : (
                    <span className="text">{line.text}</span>
                  )}
                </div>
              ))}
              
              <div className="terminal-input-row" style={{ position: 'relative' }}>
                {activeSuggestions.length > 0 && (
                  <div className="terminal-suggestions">
                    {activeSuggestions.map(s => (
                      <div key={s} className="suggestion-item" onClick={(e) => { e.stopPropagation(); setTerminalInput(s); document.getElementById('dev-term-input')?.focus(); }}>
                        {s} <span className="tab-hint">TAB</span>
                      </div>
                    ))}
                  </div>
                )}
                <span className="prompt">{machineInfo.username}@{machineInfo.hostname}:{currentCwd}$ </span>
                <input 
                  id="dev-term-input"
                  type="text" 
                  value={terminalInput}
                  onChange={(e) => setTerminalInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  disabled={isExecuting}
                  autoFocus
                  spellCheck={false}
                />
              </div>

              <div ref={terminalEndRef} />
            </div>
          </div>
        </div>

      </motion.div>
    </div>
  );
}
