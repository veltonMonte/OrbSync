import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiPlus, FiMoreHorizontal, FiCalendar, FiArrowLeft, FiLoader, FiFolder, FiTrash2 } from 'react-icons/fi';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import type { DropResult } from '@hello-pangea/dnd';
import './Projects.css';
import { useAuth } from '../contexts/AuthContext';
import { workspacesApi, type Workspace } from '../services/workspaces';
import { projectsApi, boardsApi, columnsApi, type Project, type Column } from '../services/projects';
import { cardsApi, type Card } from '../services/cards';
import { useToast } from '../contexts/ToastContext';

interface ColumnWithCards extends Column {
  cards: Card[];
}

export default function ProjectsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [workspace, setWorkspace] = useState<Workspace | null>(null);
  
  // Master View State
  const [allProjects, setAllProjects] = useState<Project[]>([]);
  const [isCreatingProject, setIsCreatingProject] = useState(false);
  const [isSubmittingProject, setIsSubmittingProject] = useState(false);
  const [isSubmittingCard, setIsSubmittingCard] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectLocalPath, setNewProjectLocalPath] = useState('');
  const [newProjectGithubRepo, setNewProjectGithubRepo] = useState('');
  
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

  // 2. Carrega o Kanban quando um projeto é selecionado (Requisição Única sem N+1)
  const handleOpenProject = async (proj: Project) => {
    setSelectedProject(proj);
    setIsLoading(true);
    try {
      const fullProj = await projectsApi.getById(proj.id);
      let activeBoard = fullProj.boards && fullProj.boards.length > 0 ? fullProj.boards[0] : null;
      
      if (!activeBoard) {
        activeBoard = await boardsApi.create(proj.id, 'Quadro Principal');
      }

      let cols = activeBoard.columns || [];
      if (cols.length === 0) {
        const col1 = await columnsApi.create(activeBoard.id, 'A Fazer', 0, '#c084fc');
        const col2 = await columnsApi.create(activeBoard.id, 'Em Progresso', 1, '#3b82f6');
        const col3 = await columnsApi.create(activeBoard.id, 'Concluído', 2, '#10b981');
        cols = [
          { ...col1, cards: [] },
          { ...col2, cards: [] },
          { ...col3, cards: [] }
        ];
      }

      const colsWithCards: ColumnWithCards[] = cols
        .sort((a, b) => a.position - b.position)
        .map(col => ({
          ...col,
          cards: (col.cards || []).sort((a, b) => a.position - b.position)
        }));

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
    if (!newProjectName.trim() || !workspace || isSubmittingProject) return;

    try {
      setIsSubmittingProject(true);
      const newProj = await projectsApi.create(workspace.id, newProjectName.trim(), newProjectLocalPath.trim(), newProjectGithubRepo.trim());
      setAllProjects(prev => [newProj, ...prev]);
      
      setNewProjectName('');
      setNewProjectLocalPath('');
      setNewProjectGithubRepo('');
      setIsCreatingProject(false);
      toast.success('Projeto criado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao criar projeto:', error);
      setErrorMsg(error.message || String(error));
      toast.error(error.message || 'Erro ao criar projeto');
    } finally {
      setIsSubmittingProject(false);
    }
  };

  const handleDeleteProject = async (e: React.MouseEvent, projectId: string) => {
    e.stopPropagation();
    if (!window.confirm('Tem certeza que deseja excluir este projeto permanentemente? Toda a automação e cards associados serão perdidos.')) return;
    
    try {
      setIsLoading(true);
      await projectsApi.delete(projectId);
      setAllProjects(prev => prev.filter(p => p.id !== projectId));
    } catch (error: any) {
      console.error('Erro ao excluir projeto:', error);
      setErrorMsg(error.message || String(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddCard = async (columnId: string) => {
    if (!newTaskTitle.trim() || !user?.id || isSubmittingCard) {
      setAddingToColumn(null);
      return;
    }

    try {
      setIsSubmittingCard(true);
      const newCard = await cardsApi.create(columnId, newTaskTitle.trim(), user.id);
      
      setColumns(prev => prev.map(col => {
        if (col.id === columnId) {
          return { ...col, cards: [...col.cards, newCard] };
        }
        return col;
      }));
      toast.success('Tarefa adicionada!');
    } catch (error: any) {
      console.error('Erro ao criar tarefa:', error);
      toast.error(error.message || 'Erro ao criar tarefa');
    } finally {
      setNewTaskTitle('');
      setAddingToColumn(null);
      setIsSubmittingCard(false);
    }
  };

  const handleUpdateCard = async (cardId: string, updates: Partial<Card>) => {
    try {
      const updated = await cardsApi.update(cardId, updates);
      setColumns(prev => prev.map(col => ({
        ...col,
        cards: col.cards.map(c => c.id === cardId ? updated : c)
      })));
    } catch (error) {
      console.error('Erro ao atualizar tarefa:', error);
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
    } catch (error: any) {
      console.error('Erro ao mover tarefa:', error);
      toast.error(error.message || 'Erro ao mover tarefa no servidor');
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
            <div className="projects-create-form">
              <input 
                type="text" 
                className="projects-new-input"
                placeholder="Nome do projeto... *"
                value={newProjectName}
                onChange={e => setNewProjectName(e.target.value)}
                autoFocus
              />
              <input 
                type="text" 
                className="projects-new-input"
                placeholder="Caminho Local (Ex: C:\Projetos\MeuApp)"
                value={newProjectLocalPath}
                onChange={e => setNewProjectLocalPath(e.target.value)}
              />
              <input 
                type="text" 
                className="projects-new-input"
                placeholder="Repositório GitHub (Ex: owner/repo)"
                value={newProjectGithubRepo}
                onChange={e => setNewProjectGithubRepo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleCreateProject()}
              />
              <div className="projects-create-actions">
                <button className="projects-new-btn" onClick={handleCreateProject} disabled={isSubmittingProject}>
                  {isSubmittingProject ? 'Salvando...' : 'Salvar'}
                </button>
                <button className="projects-btn-secondary" onClick={() => setIsCreatingProject(false)} disabled={isSubmittingProject}>Cancelar</button>
              </div>
            </div>
          ) : (
            <button className="projects-new-btn" onClick={() => setIsCreatingProject(true)}>
              <FiPlus /> Novo Projeto
            </button>
          )}
        </motion.div>

        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
            <FiLoader className="spin" size={32} color="var(--accent)" />
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
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 + (index * 0.05) }}
                whileHover={{ y: -4 }}
              >
                <div className="project-card-header">
                  <div className="project-card-icon-wrapper">
                    <FiFolder className="project-card-icon" />
                  </div>
                  <button 
                    className="project-card-delete-btn"
                    onClick={(e) => handleDeleteProject(e, proj.id)}
                    title="Excluir projeto"
                    aria-label={`Excluir projeto ${proj.name}`}
                  >
                    <FiTrash2 size={14} />
                  </button>
                </div>
                <div className="project-card-body">
                  <h3 className="project-card-title">{proj.name}</h3>
                  <div className="project-card-meta">
                    <FiCalendar size={13} />
                    <span>Criado em {new Date(proj.createdAt || Date.now()).toLocaleDateString('pt-BR')}</span>
                  </div>
                </div>
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
            className="projects-back-btn"
            aria-label="Voltar para a lista de projetos"
          >
            <FiArrowLeft /> Voltar para Projetos
          </button>
          <h1 className="projects-title">{selectedProject.name}</h1>
          <p className="projects-subtitle">{workspace?.name} • Kanban</p>
        </div>
      </motion.div>

      {isLoading ? (
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: '4rem' }}>
          <FiLoader className="spin" size={32} color="var(--accent)" />
        </div>
      ) : (
        <DragDropContext onDragEnd={onDragEnd}>
          <div className="kanban-board">
            {columns.map((col) => (
              <Droppable droppableId={col.id} key={col.id}>
                {(provided, snapshot) => (
                  <div className="kanban-column">
                    <div className="kanban-column-bg" />
                    <div className="kanban-column-header">
                      <h3>{col.name}</h3>
                      <span className="kanban-count">{col.cards.length}</span>
                    </div>
                    
                    <div 
                      className="kanban-cards"
                      ref={provided.innerRef}
                      {...provided.droppableProps}
                      style={{
                        background: snapshot.isDraggingOver ? 'rgba(255, 255, 255, 0.06)' : undefined,
                        minHeight: '150px',
                        flex: 1,
                        borderRadius: '8px',
                        padding: '4px',
                        transition: 'background 0.2s ease',
                      }}
                    >
                      {col.cards.map((card, cardIndex) => (
                        <Draggable key={card.id} draggableId={card.id} index={cardIndex}>
                          {(provided, snapshot) => (
                            <TaskCard 
                              card={card} 
                              color={col.color || '#c084fc'} 
                              provided={provided} 
                              isDragging={snapshot.isDragging}
                              onUpdateCard={handleUpdateCard}
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

function TaskCard({ card, color, provided, isDragging, onUpdateCard }: { card: Card; color: string; provided: any; isDragging: boolean; onUpdateCard: (id: string, updates: Partial<Card>) => void }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editPriority, setEditPriority] = useState(card.priority || 'NONE');
  const [editDueDate, setEditDueDate] = useState(card.dueDate ? new Date(card.dueDate).toISOString().slice(0, 16) : '');

  const handleSave = () => {
    onUpdateCard(card.id, { 
      priority: editPriority, 
      dueDate: editDueDate ? new Date(editDueDate) : undefined 
    });
    setIsEditing(false);
  };

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
          {card.priority && card.priority !== 'NONE' ? `Pri: ${card.priority}` : 'Task'}
        </span>
        <button className="kanban-card-more" onClick={() => setIsEditing(!isEditing)} aria-label="Opções do cartão" title="Opções do cartão"><FiMoreHorizontal /></button>
      </div>
      <h4 className="kanban-card-title">{card.title}</h4>

      {isEditing && (
        <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '8px', zIndex: 1000, position: 'relative' }}>
          <select value={editPriority} onChange={(e) => setEditPriority(e.target.value)} style={{ padding: '4px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '12px' }}>
            <option value="NONE">Sem Prioridade</option>
            <option value="LOW">Baixa</option>
            <option value="MEDIUM">Média</option>
            <option value="HIGH">Alta</option>
            <option value="URGENT">Urgente</option>
          </select>
          <input type="datetime-local" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} style={{ padding: '4px', background: '#333', color: 'white', border: '1px solid #555', borderRadius: '4px', fontSize: '12px' }} />
          <button onClick={handleSave} style={{ padding: '4px', background: color, color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>Salvar</button>
        </div>
      )}

      <div className="kanban-card-bottom">
        <div className="kanban-card-meta">
          <FiCalendar /> {card.dueDate ? new Date(card.dueDate).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : new Date(card.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}
        </div>
      </div>
    </div>
  );
}
