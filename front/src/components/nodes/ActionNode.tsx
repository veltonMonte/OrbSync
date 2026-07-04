import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FiPlay, FiCpu, FiFileText, FiMail, FiTrash2, FiTerminal } from 'react-icons/fi';
import './nodes.css';

export default function ActionNode({ id, data }: any) {
  const { updateNodeData, setNodes, setEdges } = useReactFlow();

  const handleConfigChange = (key: string, value: string) => {
    updateNodeData(id, { [key]: value });
  };

  const handleDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== id));
    setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
  };
  const getIcon = () => {
    switch(data.icon) {
      case 'ai': return <FiCpu />;
      case 'doc': return <FiFileText />;
      case 'mail': return <FiMail />;
      case 'terminal': return <FiTerminal />;
      case 'play':
      default: return <FiPlay />;
    }
  };

  const getStyleClass = () => {
    if (data.icon === 'ai') return 'action-node-ai';
    if (data.icon === 'doc') return 'action-node-doc';
    if (data.icon === 'mail') return 'action-node-mail';
    if (data.icon === 'terminal') return 'action-node-terminal';
    return 'action-node';
  };

  return (
    <div className={`custom-node ${getStyleClass()}`}>
      <Handle type="target" position={Position.Left} id="a" />
      <div className="node-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="node-icon">{getIcon()}</div>
          <div className="node-title">{data.label || 'Ação'}</div>
        </div>
        <button className="node-delete-btn nodrag" onClick={handleDelete} title="Excluir Bloco">
          <FiTrash2 />
        </button>
      </div>
      <div className="node-body">
        <p>{data.description || 'Executar evento...'}</p>
        
        {data.icon === 'ai' && (
          <div className="node-config-area">
            <label>Prompt da IA:</label>
            <textarea 
              className="nodrag nopan" 
              placeholder="Ex: Resuma as tarefas deste card..."
              value={data.aiPrompt || ''}
              onChange={(e) => handleConfigChange('aiPrompt', e.target.value)}
            />
          </div>
        )}

        {data.icon === 'mail' && (
          <div className="node-config-area">
            <label>Email destino:</label>
            <input 
              type="email" 
              className="nodrag nopan" 
              placeholder="contato@empresa.com"
              value={data.mailTo || ''}
              onChange={(e) => handleConfigChange('mailTo', e.target.value)}
            />
          </div>
        )}

        {data.icon === 'terminal' && (
          <div className="node-config-area">
            <label>Comando Bash:</label>
            <input 
              type="text" 
              className="nodrag nopan" 
              placeholder="Ex: npm run build"
              value={data.terminalCommand || ''}
              onChange={(e) => handleConfigChange('terminalCommand', e.target.value)}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="b" />
    </div>
  );
}
