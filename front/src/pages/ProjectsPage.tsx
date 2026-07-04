import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMoreHorizontal, FiCalendar, FiArrowLeft, FiLoader, FiFolder } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import './Projects.css';
import { useAuth } from '../contexts/AuthContext';
import { workspacesApi, type Workspace } from '../services/workspaces';
import { projectsApi, boardsApi, columnsApi, type Project, type Board, type Column } from '../services/projects';
import { cardsApi, type Card } from '../services/cards';

interface ColumnWithCards extends Column {
  cards: Card[];
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  // Master View State
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  
  // Detail View State (Kanban)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const [columns, setColumns] = useState<ColumnWithCards[]>([]);
  
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addingToColumn, setAddingToColumn] = useState<string | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  // 1. Carrega apenas o Workspace e a lista de projetos inicialmente
  useEffect(() => {
    async function initWorkspace() {
      setIsLoading(true);
      try {
        let wks = await workspacesApi.getAll();
        let activeWks = wks[0];
        if (!activeWks) {
          activeWks = await workspacesApi.create('Meu Workspace');
        }
        setWorkspace(activeWks);

        const projs = await projectsApi.getAll(activeWks.id);
        setAllProjects(projs);
      } catch (error: any) {
        console.error('Erro ao inicializar Workspace:', error);
        setErrorMsg(error.message || String(error));
      } finally {
        setIsLoading(false);
      }
    }
    initWorkspace();
  }, []);

  // 2. Carrega o Kanban quando um projeto é selecionado
  const handleOpenProject = async (proj: Project) => {
    setSelectedProject(proj);
    setIsLoading(true);
    try {
      let activeBoard = proj.boards && proj.boards.length > 0 ? proj.boards[0] : null;
      if (!activeBoard) {
        activeBoard = await boardsApi.create(proj.id, 'Quadro Principal');
      }


      let cols = await columnsApi.getByBoard(activeBoard.id);
      if (cols.length === 0) {
        const col1 = await columnsApi.create(activeBoard.id, 'A Fazer', 0, '#c084fc');
        const col2 = await columnsApi.create(activeBoard.id, 'Em Progresso', 1, '#3b82f6');
        const col3 = await columnsApi.create(activeBoard.id, 'Concluído', 2, '#10b981');
        cols = [col1, col2, col3];
      }

      const colsWithCards: ColumnWithCards[] = await Promise.all(
        cols.sort((a, b) => a.position - b.position).map(async (col) => {
          const cards = await cardsApi.getByColumn(col.id);
          return { ...col, cards: cards.sort((a, b) => a.position - b.position) };
        })
      );

      setColumns(colsWithCards);
    } catch (error: any) {
      console.error('Erro ao carregar quadro Kanban:', error);
      setErrorMsg(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseProject = () => {
    setSelectedProject(null);

    setColumns([]);
  };

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !workspace) return;

    try {
      setIsLoading(true);
      const newProj = await projectsApi.create(workspace.id, newProjectName.trim());
      setAllProjects(prev => [newProj, ...prev]);
      
      setNewProjectName('');
      setIsCreatingProject(false);
      
      // Abre automaticamente o novo projeto?
      // handleOpenProject(newProj); 
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      setErrorMsg(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (columnId: string) => {
    if (!newTaskTitle.trim() || !user?.id) {
      setAddingToColumn(null);
      return;
    }

    try {
      const newCard = await cardsApi.create(columnId, newTaskTitle.trim(), user.id);
      
      setColumns(prev => prev.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      }));
      
    } catch (error) {
      console.error('Erro ao criar tarefa:', error);
    } finally {
      setNewTaskTitle('');
      setAddingToColumn(null);
    }
  };

  const onDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId } = result;

    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    const sourceColIndex = columns.findIndex(col => col.id === source.droppableId);
    const destColIndex = columns.findIndex(col => col.id === destination.droppableId);

    const sourceCol = columns[sourceColIndex];
    const destCol = columns[destColIndex];

    const sourceCards = [...sourceCol.cards];
    const destCards = source.droppableId === destination.droppableId ? sourceCards : [...destCol.cards];

    const [movedCard] = sourceCards.splice(source.index, 1);
    destCards.splice(destination.index, 0, movedCard);

    const newColumns = [...columns];
    newColumns[sourceColIndex] = { ...sourceCol, cards: sourceCards };
    
    if (source.droppableId !== destination.droppableId) {
      newColumns[destColIndex] = { ...destCol, cards: destCards };
    }

    setColumns(newColumns);

    try {
      await cardsApi.move(draggableId, destination.droppableId, destination.index);
    } catch (error) {
      console.error('Erro ao mover tarefa:', error);
      if (selectedProject) handleOpenProject(selectedProject);
    }
  };

  if (errorMsg) {
    return (
      <div className="projects-page" style={{ alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#ef4444', background: 'rgba(239, 68, 68, 0.1)', padding: '2rem', borderRadius: '12px' }}>
          <h3>Erro ao carregar</h3>
          <p>{errorMsg}</p>
          <button onClick={() => window.location.reload()} style={{ marginTop: '1rem', padding: '0.5rem 1rem', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Tentar Novamente</button>
        </div>
      </div>
    );
  }

  // --- Visão Mestre: Grid de Projetos ---
  if (!selectedProject) {
    return (
      <div className="projects-page">
        <motion.div 
          className="projects-header"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div>
            <h1 className="projects-title">Meus Projetos</h1>
            <p className="projects-subtitle">{workspace?.name} • Escolha um projeto para acessar o quadro Kanban.</p>
          </div>
          
          {isCreatingProject ? (
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <input 
                type="text" 
                className="projects-new-input"
                style={{
                  background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(139, 92, 246, 0.5)',
                  color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', outline: 'none'
                }}
                placeholder="Nome do projeto..."
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
                autoFocus
              />
              <button className="projects-new-btn" onClick={handleCreateProject}>Salvar</button>
              <button className="projects-new-btn" style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.1)' }} onClick={() => setIsCreatingProject(false)}>Cancelar</button>
            </div>
          ) : (
            <button className="projects-new-btn" onClick={() => setIsCreatingProject(true)}>
              <FiPlus /> Novo Projeto
            </button>
          )}
        </motion.div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <FiLoader className="spin" size={32} color="#c084fc" />
          </div>
        ) : (
          <motion.div 
            className="projects-grid"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            {allProjects.map((proj, index) => (
              <motion.div 
                key={proj.id} 
                className="project-grid-card"
                onClick={() => handleOpenProject(proj)}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                whileHover={{ y: -5, boxShadow: '0 10px 25px rgba(139, 92, 246, 0.15)' }}
              >
                <div className="project-grid-icon">
                  <FiFolder size={24} color="#c084fc" />
                </div>
                <h3>{proj.name}</h3>
                <p>Criado em {new Date(proj.createdAt || Date.now()).toLocaleDateString('pt-BR')}</p>
              </motion.div>
            ))}
            
            {allProjects.length === 0 && (
              <div style={{ color: 'rgba(255,255,255,0.5)', gridColumn: '1 / -1', textAlign: 'center', marginTop: '2rem' }}>
                Nenhum projeto encontrado. Clique em "Novo Projeto" para começar.
              </div>
            )}
          </motion.div>
        )}
      </div>
    );
  }

  // --- Visão Detalhe: Kanban ---
  return (
    <div className="projects-page">
      <motion.div 
        className="projects-header"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div>
          <button 
            onClick={handleCloseProject}
            style={{ 
              background: 'transparent', border: 'none', color: '#c084fc', 
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', 
              marginBottom: '0.5rem', fontSize: '0.9rem', padding: 0 
            }}
          >
            <FiArrowLeft /> Voltar para Projetos
          </button>
          <h1 className="projects-title">{selectedProject.name}</h1>
          <p className="projects-subtitle">{workspace?.name} • Kanban</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <FiLoader className="spin" size={32} color="#c084fc" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div 
                    className="kanban-column"
                    ref={provided.innerRef}
                    {...provided.droppableProps}
                    style={{
                      background: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.08)' : undefined
                    }}
                  >
                    <div className="kanban-column-bg" />
                    <div className="kanban-column-header">
                      <h3>{col.name}</h3>
                      <span className="kanban-count">{col.cards.length}</span>
                    </div>
                    
                    <div className="kanban-cards">
                      {col.cards.map((card, cardIndex) => (
                        <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                          {(provided, snapshot) => (
                            <TaskCard 
                              card={card} 
                              color={col.color || '#c084fc'} 
                              provided={provided} 
                              isDragging={snapshot.isDragging}
                            />
                          )}
                        </Draggable>
                      ))}
                      {provided.placeholder}
                    </div>

                    {addingToColumn === col.id ? (
                      <div className="kanban-add-input-wrapper">
                        <input
                          type="text"
                          autoFocus
                          placeholder="O que precisa ser feito?"
                          value={newTaskTitle}
                          onChange={(e) => setNewTaskTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleAddCard(col.id);
                            if (e.key === 'Escape') setAddingToColumn(null);
                          }}
                          onBlur={() => handleAddCard(col.id)}
                        />
                      </div>
                    ) : (
                      <button 
                        className="kanban-add-card" 
                        onClick={() => { setAddingToColumn(col.id); setNewTaskTitle(''); }}
                      >
                        <FiPlus /> Adicionar Tarefa
                      </button>
                    )}
                  </div>
                )}
              </Droppable>
            ))}
          </div>
        </DragDropContext>
      )}
    </div>
  );
}

function TaskCard({ card, color, provided, isDragging }: { card: Card; color: string; provided: any; isDragging: boolean }) {
  return (
    <div
      className="kanban-card"
      ref={provided.innerRef}
      {...provided.draggableProps}
      {...provided.dragHandleProps}
      style={{
        ...provided.draggableProps.style,
        opacity: isDragging ? 0.8 : 1,
        boxShadow: isDragging ? '0 10px 20px rgba(0,0,0,0.2)' : undefined,
        zIndex: isDragging ? 999 : 1,
      }}
    >
      <div className="kanban-card-top">
        <span className="kanban-tag" style={{ background: `${color}20`, color: color }}>
          Task
        </span>
        <button className="kanban-card-more"><FiMoreHorizontal /></button>
      </div>
      <h4 className="kanban-card-title">{card.title}</h4>
      <div className="kanban-card-bottom">
        <div className="kanban-card-meta">
          <FiCalendar /> {new Date(card.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </div>
  );
}
