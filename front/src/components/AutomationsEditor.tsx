import { useState, useCallback, useRef, useEffect } from 'react';
import {
  ReactFlow,
  addEdge,
  useNodesState,
  useEdgesState,
  Controls,
  Background,
  reconnectEdge,
} from '@xyflow/react';
import type { Connection, Edge, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import TriggerNode from './nodes/TriggerNode';
import ActionNode from './nodes/ActionNode';
import { FiArrowLeft, FiSave, FiZap, FiPlay, FiFileText, FiCpu, FiMail, FiClock, FiTerminal } from 'react-icons/fi';
import { automationsApi } from '../services/automations';

const nodeTypes: NodeTypes = {
  trigger: TriggerNode,
  action: ActionNode,
};

const initialNodes = [
  {
    id: 'trigger-1',
    type: 'trigger',
    position: { x: 250, y: 150 },
    data: { label: 'Gatilho de Entrada', description: 'Quando o evento ocorrer...' },
  },
];

export default function AutomationsEditor({ workspaceId, existingAutomation, onBack, onSaveSuccess }: any) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [workflowName, setWorkflowName] = useState('Novo Workflow');
  const [isSaving, setIsSaving] = useState(false);
  const reactFlowWrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (existingAutomation) {
      setWorkflowName(existingAutomation.name);
      if (existingAutomation.actionRules) {
        try {
          const rules = typeof existingAutomation.actionRules === 'string'
            ? JSON.parse(existingAutomation.actionRules)
            : existingAutomation.actionRules;
          
          if (rules.nodes) setNodes(rules.nodes);
          if (rules.edges) setEdges(rules.edges);
        } catch (err) {
          console.error("Erro ao carregar os dados do workflow", err);
          setNodes(initialNodes);
        }
      }
    } else {
      setNodes(initialNodes);
      setEdges([]);
    }
  }, [existingAutomation, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection | Edge) => setEdges((eds) => addEdge({ ...params, animated: true, style: { stroke: '#c084fc', strokeWidth: 2 } }, eds)),
    [setEdges]
  );

  const onReconnect = useCallback(
    (oldEdge: Edge, newConnection: Connection) => setEdges((els) => reconnectEdge(oldEdge, newConnection, els)),
    [setEdges]
  );

  const onDragStart = (event: any, nodeType: string, label?: string, desc?: string, icon?: string) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    if (label) event.dataTransfer.setData('customLabel', label);
    if (desc) event.dataTransfer.setData('customDesc', desc);
    if (icon) event.dataTransfer.setData('customIcon', icon);
    event.dataTransfer.effectAllowed = 'move';
  };

  const onDrop = useCallback(
    (event: any) => {
      event.preventDefault();
      
      const reactFlowBounds = reactFlowWrapper.current?.getBoundingClientRect();
      const type = event.dataTransfer.getData('application/reactflow');
      
      if (typeof type === 'undefined' || !type || !reactFlowBounds) {
        return;
      }

      // Very simple dropping calculation (React Flow standard)
      const position = {
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      };

      const customLabel = event.dataTransfer.getData('customLabel');
      const customDesc = event.dataTransfer.getData('customDesc');
      const customIcon = event.dataTransfer.getData('customIcon');

      let label = customLabel || 'Ação';
      let description = customDesc || 'Fazer algo...';
      
      if (type === 'trigger' && !customLabel) {
        label = 'Novo Gatilho';
        description = 'Ao acontecer evento...';
      }

      const newNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label, description, icon: customIcon || 'default' },
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const onDragOver = useCallback((event: any) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const handleSave = async () => {
    try {
      setIsSaving(true);
      
      let rootTrigger = 'CARD_MOVED';
      const triggerNode = nodes.find(n => n.type === 'trigger');
      if (triggerNode) {
        if (triggerNode.data?.icon === 'clock') rootTrigger = 'DUE_DATE_REACHED';
        if (triggerNode.data?.icon === 'terminal') rootTrigger = 'TERMINAL_COMMAND';
      }

      if (existingAutomation) {
        await automationsApi.update(existingAutomation.id, workflowName, rootTrigger, { nodes, edges });
      } else {
        await automationsApi.create(workspaceId, workflowName, rootTrigger, { nodes, edges });
      }
      
      onSaveSuccess();
    } catch (err) {
      console.error('Erro ao salvar workflow', err);
      alert('Erro ao salvar o workflow');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="automations-editor-container" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: 9999, display: 'flex', width: '100vw', height: '100vh', background: '#0f0f14' }}>
      {/* Sidebar */}
      <div className="automations-sidebar" style={{ width: '280px', background: 'rgba(15, 15, 20, 0.5)', borderRight: '1px solid rgba(255, 255, 255, 0.05)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'transparent', border: 'none', color: '#a1a1aa', cursor: 'pointer', marginBottom: '20px' }}>
            <FiArrowLeft /> Voltar para Lista
          </button>
          
          <input 
            type="text" 
            value={workflowName}
            onChange={e => setWorkflowName(e.target.value)}
            style={{ width: '100%', padding: '10px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontFamily: '"Fredoka", sans-serif' }}
          />
        </div>
        
        <div style={{ padding: '20px', flex: 1, overflowY: 'auto' }}>
          <h3 style={{ fontSize: '0.85rem', color: '#6b5f8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Gatilhos (Triggers)</h3>
          
          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'trigger', 'Card Movido', 'Quando um card mudar de coluna', 'zap')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#f472b6', background: 'rgba(236,72,153,0.1)', padding: '6px', borderRadius: '6px' }}><FiZap /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Card Movido</span>
          </div>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'trigger', 'Prazo Expirado', 'Quando a data limite chegar', 'clock')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#facc15', background: 'rgba(250,204,21,0.1)', padding: '6px', borderRadius: '6px' }}><FiClock /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Prazo Expirado</span>
          </div>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'trigger', 'Comando Concluído', 'Quando o terminal terminar um script', 'terminal')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '25px' }}
          >
            <div style={{ color: '#2dd4bf', background: 'rgba(45,212,191,0.1)', padding: '6px', borderRadius: '6px' }}><FiTerminal /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Comando Concluído</span>
          </div>
          
          <h3 style={{ fontSize: '0.85rem', color: '#6b5f8a', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '15px' }}>Ações (Actions)</h3>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'action', 'Agente IA', 'Pedir análise inteligente para a IA', 'ai')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#c084fc', background: 'rgba(192,132,252,0.1)', padding: '6px', borderRadius: '6px' }}><FiCpu /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Agente IA</span>
          </div>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'action', 'Gerar Documento', 'Criar um documento ou relatório', 'doc')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#34d399', background: 'rgba(52,211,153,0.1)', padding: '6px', borderRadius: '6px' }}><FiFileText /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Gerar Documento</span>
          </div>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'action', 'Notificar Equipe', 'Enviar alerta de aviso (Email/App)', 'mail')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#fb923c', background: 'rgba(251,146,60,0.1)', padding: '6px', borderRadius: '6px' }}><FiMail /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Notificar Equipe</span>
          </div>

          <div 
            className="dnd-node-btn"
            onDragStart={(event) => onDragStart(event, 'action', 'Rodar Comando', 'Executa um script no servidor de backend', 'terminal')} 
            draggable={true} 
            style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '8px', cursor: 'grab', marginBottom: '10px' }}
          >
            <div style={{ color: '#2dd4bf', background: 'rgba(45,212,191,0.1)', padding: '6px', borderRadius: '6px' }}><FiTerminal /></div>
            <span style={{ fontSize: '0.9rem', color: '#e5e5e5' }}>Rodar Comando</span>
          </div>
        </div>
        
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg, #c084fc, #60a5fa)', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}
          >
            <FiSave /> {isSaving ? 'Salvando...' : 'Salvar Workflow'}
          </button>
        </div>
      </div>

      {/* Canvas */}
      <div className="automations-canvas" style={{ flex: 1, position: 'relative' }} ref={reactFlowWrapper}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onReconnect={onReconnect}
          onInit={() => console.log('flow init')}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          className="dark-theme-flow"
        >
          <Background color="#3f3f46" gap={20} size={1} />
          <Controls position="top-right" style={{ background: 'rgba(15, 15, 20, 0.9)', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }} />
        </ReactFlow>
      </div>
    </div>
  );
}
