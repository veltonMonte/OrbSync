import { useState, useRef, useEffect } from 'react';
import { 
  FiTerminal, FiTrash2, FiCopy
} from 'react-icons/fi';
import { terminalService } from '../services/terminal';
import { aiService } from '../services/ai';
import { useToast } from '../contexts/ToastContext';
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
  const toast = useToast();
  const [terminalInput, setTerminalInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>(() => {
    const saved = localStorage.getItem('fluxionai_term_cmd_history');
    return saved ? JSON.parse(saved) : [];
  });
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [draftInput, setDraftInput] = useState('');
  const [currentCwd, setCurrentCwd] = useState('~');
  const [machineInfo, setMachineInfo] = useState({ username: 'velton', hostname: 'fluxionia' });

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
    const saved = localStorage.getItem('fluxionai_term_history');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', type: 'output', text: 'FluxionIA Terminal v1.0.0 — Conectado ao ambiente local' },
      { id: '2', type: 'output', text: '// Digite "ai <pedido>" para assistência de IA ou pressione TAB para autocompletar.' }
    ];
  });
  const [isExecuting, setIsExecuting] = useState(false);
  const terminalEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    localStorage.setItem('fluxionai_term_history', JSON.stringify(history));
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    localStorage.setItem('fluxionai_term_cmd_history', JSON.stringify(commandHistory));
  }, [commandHistory]);

  const handleClearTerminal = () => {
    const initialLines: TerminalLine[] = [
      { id: Date.now().toString(), type: 'output', text: 'FluxionIA Terminal v1.0.0 — Conectado ao ambiente local' }
    ];
    setHistory(initialLines);
    localStorage.setItem('fluxionai_term_history', JSON.stringify(initialLines));
    toast.info('Terminal limpo.');
  };

  const handleCopyHistory = () => {
    const allText = history.map(h => h.text).join('\n');
    navigator.clipboard.writeText(allText);
    toast.success('Histórico do terminal copiado!');
  };

  const handleCommand = async () => {
    if (!terminalInput.trim() || isExecuting) return;
    
    const cmd = terminalInput.trim();
    
    setCommandHistory(prev => {
      const filtered = prev.filter(c => c !== cmd);
      return [...filtered, cmd];
    });
    setHistoryIndex(-1);
    setDraftInput('');
    setTerminalInput('');
    
    const promptPrefix = `${machineInfo.username}@${machineInfo.hostname}:${currentCwd}$ `;
    setHistory(prev => [...prev, { id: Date.now().toString(), type: 'input', text: promptPrefix + cmd }]);
    
    if (cmd.startsWith('ai ')) {
      const prompt = cmd.substring(3).trim();
      setIsExecuting(true);
      const loadingId = Date.now().toString() + 'loading';
      setHistory(prev => [...prev, { id: loadingId, type: 'output', text: '// [IA DevOps] Analisando o sistema e gerando comando seguro...' }]);
      try {
        const res = await aiService.generateTerminalCommand(prompt);
        setHistory(prev => {
          const filtered = prev.filter(h => h.id !== loadingId);
          return [...filtered, { id: Date.now().toString() + 'aio', type: 'output', text: '// [IA DevOps] Comando sugerido preenchido no terminal. Revise e aperte ENTER para executar.' }];
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
      handleClearTerminal();
      return;
    }

    setIsExecuting(true);
    try {
      const res = await terminalService.executeCommand(cmd);
      
      if (res.cwd) {
        let displayCwd = res.cwd;
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

  const activeSuggestions = terminalInput 
    ? COMMON_COMMANDS.filter(c => c.startsWith(terminalInput.toLowerCase()) && c !== terminalInput.toLowerCase()).slice(0, 4)
    : [];

  return (
    <div className="dev-page">
      <div className="dev-container">
        
        {/* Professional Full-Width Terminal Window */}
        <div className="dev-terminal-section full-width">
          {/* macOS / VS Code Window Bar */}
          <div className="terminal-titlebar">
            <div className="window-controls">
              <span className="window-dot red"></span>
              <span className="window-dot yellow"></span>
              <span className="window-dot green"></span>
            </div>
            
            <div className="titlebar-center">
              <FiTerminal className="titlebar-icon" />
              <span className="titlebar-text">Terminal Local</span>
              <span className="status-indicator-dot" title="Sessão ativa"></span>
            </div>

            <div className="titlebar-actions">
              <button className="titlebar-action-btn" onClick={handleCopyHistory} title="Copiar saída">
                <FiCopy size={13} />
              </button>
              <button className="titlebar-action-btn" onClick={handleClearTerminal} title="Limpar terminal">
                <FiTrash2 size={13} />
              </button>
            </div>
          </div>
          
          <div className="terminal-window" onClick={() => document.getElementById('dev-term-input')?.focus()}>
            <div className="terminal-content">
              {history.map(line => (
                <div key={line.id} className={`terminal-line ${line.type}`}>
                  {line.type === 'input' ? (
                    <>
                      <span className="term-prompt-user">{machineInfo.username}@{machineInfo.hostname}</span>
                      <span className="term-prompt-colon">:</span>
                      <span className="term-prompt-cwd">{currentCwd}</span>
                      <span className="term-prompt-symbol">$ </span>
                      <span className="term-cmd-text">{line.text.substring(line.text.indexOf('$') + 1)}</span>
                    </>
                  ) : (
                    <span className="term-output-text">{line.text}</span>
                  )}
                </div>
              ))}
              
              <div className="terminal-input-row">
                {activeSuggestions.length > 0 && (
                  <div className="terminal-suggestions">
                    {activeSuggestions.map(s => (
                      <div key={s} className="suggestion-item" onClick={(e) => { e.stopPropagation(); setTerminalInput(s); document.getElementById('dev-term-input')?.focus(); }}>
                        <span>{s}</span> <span className="tab-hint">TAB</span>
                      </div>
                    ))}
                  </div>
                )}
                <span className="term-prompt-user">{machineInfo.username}@{machineInfo.hostname}</span>
                <span className="term-prompt-colon">:</span>
                <span className="term-prompt-cwd">{currentCwd}</span>
                <span className="term-prompt-symbol">$ </span>
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

      </div>
    </div>
  );
}


