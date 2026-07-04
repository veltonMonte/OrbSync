import { Handle, Position, useReactFlow } from '@xyflow/react';
import { FiZap, FiClock, FiTrash2, FiTerminal } from 'react-icons/fi';
import './nodes.css';

export default function TriggerNode({ id, data }: any) {
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
      case 'clock': return <FiClock />;
      case 'terminal': return <FiTerminal />;
      case 'zap': 
      default: return <FiZap />;
    }
  };

  const getStyleClass = () => {
    if (data.icon === 'clock') return 'trigger-node-clock';
    if (data.icon === 'terminal') return 'trigger-node-terminal';
    return 'trigger-node';
  };

  return (
    <div className={`custom-node ${getStyleClass()}`}>
      <div className="node-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className="node-icon">{getIcon()}</div>
          <div className="node-title">{data.label || 'Gatilho'}</div>
        </div>
        <button className="node-delete-btn nodrag" onClick={handleDelete} title="Excluir Bloco">
          <FiTrash2 />
        </button>
      </div>
      <div className="node-body">
        <p>{data.description || 'Configurar evento...'}</p>
        
        {data.icon === 'zap' && (
          <div className="node-config-area">
            <label>Para a coluna:</label>
            <select 
              className="nodrag nopan"
              value={data.targetColumn || ''}
              onChange={(e) => handleConfigChange('targetColumn', e.target.value)}
            >
              <option value="">Selecione...</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="DONE">Done</option>
            </select>
          </div>
        )}

        {data.icon === 'clock' && (
          <div className="node-config-area">
            <label>Dias de Atraso:</label>
            <input 
              type="number" 
              className="nodrag nopan" 
              placeholder="Ex: 2"
              value={data.delayDays || ''}
              onChange={(e) => handleConfigChange('delayDays', e.target.value)}
            />
          </div>
        )}

        {data.icon === 'terminal' && (
          <div className="node-config-area">
            <label>Esperar Comando (contém):</label>
            <input 
              type="text" 
              className="nodrag nopan" 
              placeholder="Ex: npm run build"
              value={data.targetCommand || ''}
              onChange={(e) => handleConfigChange('targetCommand', e.target.value)}
            />
          </div>
        )}
      </div>
      <Handle type="source" position={Position.Right} id="a" />
    </div>
  );
}
