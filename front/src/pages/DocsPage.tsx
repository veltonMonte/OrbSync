import { useState, useRef, useEffect } from 'react';
import { 
  FiFileText, FiSearch, FiShare2, FiMoreVertical, 
  FiBold, FiItalic, FiList, FiDownload, FiUpload, FiZap, FiTrash2, 
  FiCheckSquare, FiAlignLeft, FiAlignCenter, FiAlignRight, 
  FiLink, FiPlus, FiCheck
} from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import { TextStyle } from '@tiptap/extension-text-style';
import FontFamily from '@tiptap/extension-font-family';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import * as mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import { aiService } from '../services/ai';
import { documentsApi, type BackendDocument } from '../services/documents';
import { Modal } from '../components/ui/Modal';
import { EmptyState } from '../components/ui/EmptyState';
import { useToast } from '../contexts/ToastContext';
import './Docs.css';

interface Document {
  id: string;
  name: string;
  date: string;
  type: 'doc' | 'folder';
  content: string;
}

export default function DocsPage() {
  const toast = useToast();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [activeDocId, setActiveDocId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeDocIdRef = useRef(activeDocId);
  const documentsRef = useRef(documents);

  useEffect(() => {
    activeDocIdRef.current = activeDocId;
  }, [activeDocId]);

  useEffect(() => {
    documentsRef.current = documents;
  }, [documents]);

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const [aiPromptOpen, setAiPromptOpen] = useState(false);
  const [aiPromptText, setAiPromptText] = useState('');

  useEffect(() => {
    const loadDocs = async () => {
      try {
        const data = await documentsApi.getAll();
        const formatted = data.map((d: BackendDocument) => ({
          id: d.id,
          name: d.title,
          date: new Date(d.updatedAt).toLocaleDateString('pt-BR'),
          type: (d.type === 'CUSTOM' ? 'doc' : 'folder') as 'doc' | 'folder',
          content: d.content,
        }));
        setDocuments(formatted);
        if (formatted.length > 0 && !activeDocId) {
          setActiveDocId(formatted[0].id);
        }
      } catch (err) {
        console.error('Error loading documents:', err);
      }
    };
    loadDocs();
  }, []);

  const activeDocument = documents.find(d => d.id === activeDocId) || null;

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: 'Comece a escrever ou pressione "/" para comandos...',
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      CodeBlock,
      TextStyle,
      FontFamily,
      Color,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Link.configure({ openOnClick: true })
    ],
    content: activeDocument?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      const currentDocId = activeDocIdRef.current;
      if (!currentDocId) return;

      setSaveStatus('saving');

      setDocuments(prev => {
        const next = prev.map(doc => 
          doc.id === currentDocId ? { ...doc, content: html, date: 'Atualizado agora' } : doc
        );
        return next;
      });

      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }

      // Debounce do autosave (800ms) para não sobrecarregar requisições PUT contínuas
      debounceTimerRef.current = setTimeout(async () => {
        try {
          const currentDoc = documentsRef.current.find(d => d.id === currentDocId);
          const title = currentDoc?.name || 'Sem Título';
          await documentsApi.update(currentDocId, title, html);
          setSaveStatus('saved');
        } catch (error) {
          console.error('Erro no autosave do documento:', error);
          setSaveStatus('error');
        }
      }, 800);
    },
  });

  // Sync editor content on active document change
  useEffect(() => {
    if (editor && activeDocument) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== activeDocument.content) {
        editor.commands.setContent(activeDocument.content);
      }
    }
  }, [activeDocId, editor]);

  // Update doc title from H1 tag
  useEffect(() => {
    if (activeDocument && editor) {
      const html = activeDocument.content;
      const match = html.match(/<h1[^>]*>(.*?)<\/h1>/);
      const newName = match && match[1].trim() ? match[1].trim().replace(/<[^>]+>/g, '') : 'Sem Título';
      
      if (newName !== activeDocument.name && newName.length < 40) {
        setDocuments(prev => {
          const next = prev.map(doc => doc.id === activeDocId ? { ...doc, name: newName } : doc);
          return next;
        });
        documentsApi.update(activeDocId, newName, html).catch(console.error);
      }
    }
  }, [activeDocument?.content]);

  const handleNewDoc = async () => {
    try {
      const newDocBackend = await documentsApi.create('Novo Documento', '<h1>Novo Documento</h1><p>Comece a escrever aqui...</p>', 'CUSTOM');
      const newDoc: Document = {
        id: newDocBackend.id,
        name: newDocBackend.title,
        date: new Date(newDocBackend.updatedAt).toLocaleDateString('pt-BR'),
        type: 'doc',
        content: newDocBackend.content
      };
      setDocuments(prev => [newDoc, ...prev]);
      setActiveDocId(newDoc.id);
      toast.success('Documento criado!');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteDoc = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Tem certeza que deseja excluir este documento?")) return;
    
    try {
      await documentsApi.delete(id);
      setDocuments(prev => {
        const next = prev.filter(d => d.id !== id);
        if (activeDocId === id && next.length > 0) {
          setActiveDocId(next.find(d => d.type === 'doc')?.id || next[0].id);
        }
        return next;
      });
      toast.info('Documento removido.');
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = () => {
    if (!editor) return;
    setAiPromptText('');
    setAiPromptOpen(true);
  };

  const submitAiPrompt = async () => {
    if (!editor || !aiPromptText.trim()) return;

    setAiPromptOpen(false);
    setIsGenerating(true);
    try {
      const { html } = await aiService.generateDoc(aiPromptText.trim());
      editor.commands.insertContent(html);
      toast.success('Conteúdo gerado com sucesso!');
    } catch (e) {
      toast.error('Erro ao gerar texto com IA.');
    } finally {
      setIsGenerating(false);
    }
  };

  const exportPDF = () => {
    if (!editor || !activeDocument) return;
    const element = document.createElement('div');
    element.innerHTML = editor.getHTML();
    element.style.padding = '40px';
    element.style.fontFamily = 'Inter, sans-serif';
    element.style.color = '#000';
    
    const opt = {
      margin: 0.5,
      filename: `${activeDocument.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' }
    };
    // @ts-ignore
    html2pdf().set(opt).from(element).save();
    toast.success('PDF baixado!');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !editor) return;

    if (file.name.endsWith('.docx')) {
      const reader = new FileReader();
      reader.onload = async (event) => {
        const arrayBuffer = event.target?.result as ArrayBuffer;
        try {
          const result = await mammoth.convertToHtml({ arrayBuffer });
          editor.commands.setContent(result.value);
          toast.success('DOCX importado com sucesso!');
        } catch (err) {
          toast.error('Erro ao importar arquivo DOCX.');
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      toast.error('Suporta apenas arquivos .docx');
    }
  };

  // Word and character stats
  const textContent = editor?.getText() || '';
  const wordCount = textContent.trim() ? textContent.trim().split(/\s+/).length : 0;
  const charCount = textContent.length;

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="docs-page">
      <div className="docs-container">
        
        {/* Left Sidebar: Document List */}
        <div className="docs-sidebar">
          <div className="docs-sidebar-top">
            <h2 className="sidebar-title">Documentos</h2>
            
            <button className="new-doc-primary-btn" onClick={handleNewDoc}>
              <FiPlus size={14} /> Novo Documento
            </button>
          </div>

          <div className="docs-search-wrapper">
            <FiSearch className="search-icon" size={13} />
            <input 
              type="text" 
              placeholder="Buscar documentos..." 
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="docs-list">
            {filteredDocs.length > 0 ? (
              filteredDocs.map((doc) => (
                <div 
                  key={doc.id} 
                  className={`docs-item ${activeDocId === doc.id ? 'active' : ''}`}
                  onClick={() => doc.type === 'doc' && setActiveDocId(doc.id)}
                >
                  <FiFileText className="doc-icon" size={14} />
                  <div className="docs-item-info">
                    <span className="docs-item-name" title={doc.name}>
                      {doc.name || 'Sem Título'}
                    </span>
                    <span className="docs-item-date">{doc.date}</span>
                  </div>
                  {doc.type === 'doc' && (
                    <button 
                      className="docs-item-delete" 
                      onClick={(e) => handleDeleteDoc(doc.id, e)} 
                      title="Excluir Documento"
                      aria-label={`Excluir documento ${doc.name}`}
                    >
                      <FiTrash2 size={13} />
                    </button>
                  )}
                </div>
              ))
            ) : (
              <EmptyState 
                icon={<FiFileText size={20} />}
                title="Nenhum documento"
                description={searchQuery ? "Nenhum resultado para a busca." : "Crie um novo documento para começar."}
                variant="compact"
                action={!searchQuery ? { label: "Criar Documento", onClick: handleNewDoc } : undefined}
              />
            )}
          </div>

          <button className="ai-assist-btn" onClick={handleGenerateAI} disabled={isGenerating} aria-label="Gerar documento com IA">
            <FiZap size={14} /> {isGenerating ? 'Gerando...' : 'Gerar com IA'}
          </button>
        </div>

        {/* Right Area: Notion Dark Mode Editor */}
        <div className="docs-editor-area">
          {/* Header Bar */}
          <header className="docs-editor-header">
            <div className="docs-header-left">
              <div className="docs-breadcrumb">
                <span>Workspace</span> / <span>Documentos</span> / <span className="highlight">{activeDocument?.name || 'Sem Título'}</span>
              </div>
              <span className="save-status-badge">
                {saveStatus === 'saving' && 'Salvando...'}
                {saveStatus === 'saved' && <><FiCheck size={12} color="#10B981" /> Salvo</>}
                {saveStatus === 'error' && <span style={{ color: '#ef4444' }}>Erro ao salvar</span>}
              </span>
            </div>

            <div className="docs-actions">
              <button className="docs-share-btn" aria-label="Compartilhar documento"><FiShare2 size={13} /> Compartilhar</button>
              <button className="docs-icon-btn" title="Mais opções" aria-label="Mais opções"><FiMoreVertical size={14} /></button>
            </div>
          </header>

          <div className="docs-editor-content">
            {/* Dark Sleek Toolbar */}
            <div className="docs-editor-toolbar">
              <select className="docs-toolbar-select" onChange={(e) => editor?.chain().focus().setFontFamily(e.target.value).run()} value={editor?.getAttributes('textStyle').fontFamily || ''} title="Fonte">
                <option value="">Inter (Padrão)</option>
                <option value="Arial">Arial</option>
                <option value="'Fira Code', monospace">Monospace</option>
                <option value="Georgia, serif">Georgia</option>
              </select>
              
              <select className="docs-toolbar-select" onChange={(e) => { const val = e.target.value; if (val === 'p') editor?.chain().focus().setParagraph().run(); else editor?.chain().focus().toggleHeading({ level: parseInt(val) as any }).run(); }} value={editor?.isActive('heading') ? editor?.getAttributes('heading').level.toString() : 'p'} title="Estilo de Texto">
                <option value="p">Texto Normal</option>
                <option value="1">Título 1</option>
                <option value="2">Título 2</option>
                <option value="3">Título 3</option>
              </select>

              <div className="docs-toolbar-divider"></div>

              <button className={`docs-toolbar-btn ${editor?.isActive('bold') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito"><FiBold size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive('italic') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico"><FiItalic size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive('underline') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhado"><span style={{textDecoration: 'underline'}}>U</span></button>
              <button className={`docs-toolbar-btn ${editor?.isActive('link') ? 'active' : ''}`} onClick={() => { const url = window.prompt('URL do Link:'); if (url) editor?.chain().focus().setLink({ href: url }).run(); }} title="Inserir Link"><FiLink size={13} /></button>

              <div className="docs-toolbar-divider"></div>

              <button className={`docs-toolbar-btn ${editor?.isActive({ textAlign: 'left' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('left').run()} title="Alinhar Esquerda"><FiAlignLeft size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive({ textAlign: 'center' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('center').run()} title="Centralizar"><FiAlignCenter size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive({ textAlign: 'right' }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().setTextAlign('right').run()} title="Alinhar Direita"><FiAlignRight size={13} /></button>

              <div className="docs-toolbar-divider"></div>

              <button className={`docs-toolbar-btn ${editor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista com Marcadores"><FiList size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive('taskList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleTaskList().run()} title="Lista de Tarefas"><FiCheckSquare size={13} /></button>
              <button className={`docs-toolbar-btn ${editor?.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Bloco de Código">{'</>'}</button>
              
              <div style={{ flex: 1 }}></div>
              
              <input type="file" accept=".docx" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
              <button className="docs-action-outline-btn" onClick={() => fileInputRef.current?.click()}><FiUpload size={12} /> Importar</button>
              <button className="docs-action-outline-btn" onClick={exportPDF}><FiDownload size={12} /> PDF</button>
            </div>

            {/* Notion-like Dark Editor Body */}
            <div className="docs-editor-body">
              {editor && (
                <BubbleMenu editor={editor} className="bubble-menu">
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
                    <FiBold size={13} />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
                    <FiItalic size={13} />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>
                    U
                  </button>
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </div>

            {/* Footer Word Counter */}
            <div className="docs-editor-footer-stats">
              <span>{wordCount} palavras</span>
              <span>•</span>
              <span>{charCount} caracteres</span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Prompt Modal */}
      <Modal
        open={aiPromptOpen}
        onClose={() => setAiPromptOpen(false)}
        title="Gerar com IA"
        description="Escreva o tema ou comando para a inteligência artificial redigir o documento."
        icon={<FiZap />}
        iconColor="var(--accent)"
        size="md"
      >
        <div className="stg-modal-form">
          <div className="form-group" style={{ gap: '8px' }}>
            <label style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', textTransform: 'none', letterSpacing: 'normal', fontWeight: 500 }}>
              Instruções para a IA:
            </label>
            <textarea
              placeholder="Ex: Escreva uma pauta de reunião executiva com objetivos, prazos e tarefas..."
              value={aiPromptText}
              onChange={e => setAiPromptText(e.target.value)}
              className="stg-input"
              rows={4}
              style={{ resize: 'vertical' }}
              autoFocus
            />
          </div>
        </div>
        <div className="stg-modal-footer">
          <button className="stg-btn stg-btn--ghost" onClick={() => setAiPromptOpen(false)}>Cancelar</button>
          <button 
            className="stg-btn stg-btn--primary" 
            onClick={submitAiPrompt} 
            disabled={!aiPromptText.trim()}
          >
            Gerar Documento
          </button>
        </div>
      </Modal>
    </div>
  );
}

