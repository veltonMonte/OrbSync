import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FiFileText, FiFolder, FiSearch, FiEdit3, FiShare2, FiMoreVertical, FiBold, FiItalic, FiList, FiDownload, FiUpload, FiCpu, FiTrash2, FiCheckSquare } from 'react-icons/fi';
import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import TaskList from '@tiptap/extension-task-list';
import TaskItem from '@tiptap/extension-task-item';
import Underline from '@tiptap/extension-underline';
import CodeBlock from '@tiptap/extension-code-block';
import * as mammoth from 'mammoth';
import html2pdf from 'html2pdf.js';
import { aiService } from '../services/ai';
import { documentsApi, type BackendDocument } from '../services/documents';
import './Docs.css';

interface Document {
  id: string;
  name: string;
  date: string;
  type: 'doc' | 'folder';
  content: string;
}



export default function DocsPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  
  const [activeDocId, setActiveDocId] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

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
        placeholder: 'Pressione "/" para comandos ou comece a digitar...',
      }),
      Highlight,
      TaskList,
      TaskItem.configure({ nested: true }),
      Underline,
      CodeBlock
    ],
    content: activeDocument?.content || '',
    onUpdate: ({ editor }) => {
      const html = editor.getHTML();
      if (!activeDocId) return;

      setDocuments(prev => {
        const next = prev.map(doc => 
          doc.id === activeDocId ? { ...doc, content: html, date: 'Atualizado agora' } : doc
        );
        return next;
      });

      // Fire and forget update
      documentsApi.update(activeDocId, activeDocument?.name || 'Sem Título', html).catch(console.error);
    },
  });

  // Atualiza o editor quando troca de documento
  useEffect(() => {
    if (editor && activeDocument) {
      const currentHtml = editor.getHTML();
      if (currentHtml !== activeDocument.content) {
        editor.commands.setContent(activeDocument.content);
      }
    }
  }, [activeDocId, editor]);

  // Atualiza o título do documento baseado no H1
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
      const newDocBackend = await documentsApi.create('Novo Documento', '<h1>Novo Documento</h1><p>Comece a escrever...</p>', 'CUSTOM');
      const newDoc: Document = {
        id: newDocBackend.id,
        name: newDocBackend.title,
        date: new Date(newDocBackend.updatedAt).toLocaleDateString('pt-BR'),
        type: 'doc',
        content: newDocBackend.content
      };
      setDocuments(prev => {
        const next = [newDoc, ...prev];
        return next;
      });
      setActiveDocId(newDoc.id);
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
    } catch (err) {
      console.error(err);
    }
  };

  const handleGenerateAI = async () => {
    if (!editor) return;
    const prompt = window.prompt("O que você deseja que a IA escreva neste documento?");
    if (!prompt) return;

    setIsGenerating(true);
    try {
      const { html } = await aiService.generateDoc(prompt);
      editor.commands.insertContent(html);
    } catch (e) {
      alert("Erro ao gerar documento com IA.");
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
        } catch (err) {
          alert("Erro ao ler DOCX");
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      alert("No momento, a importação suporta apenas arquivos .docx para conversão rica.");
    }
  };

  const filteredDocs = documents.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="docs-page">
      <motion.div 
        className="docs-container"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        {/* Sidebar */}
        <div className="docs-sidebar">
          <div className="docs-sidebar-header">
            <h2>Documentos</h2>
            <div className="docs-search">
              <FiSearch />
              <input 
                type="text" 
                placeholder="Buscar..." 
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          
          <div className="docs-list">
            {filteredDocs.map((doc, i) => (
              <motion.div 
                key={doc.id} 
                className={`docs-item ${activeDocId === doc.id ? 'active' : ''}`}
                onClick={() => doc.type === 'doc' && setActiveDocId(doc.id)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: i * 0.05 }}
              >
                <div className="docs-item-icon">
                  {doc.type === 'folder' ? <FiFolder style={{color: '#60a5fa'}} /> : <FiFileText style={{color: '#c084fc'}}/>}
                </div>
                <div className="docs-item-info">
                  <span className="docs-item-name" title={doc.name}>
                    {doc.name.length > 20 ? doc.name.substring(0, 20) + '...' : doc.name}
                  </span>
                  <span className="docs-item-date">{doc.date}</span>
                </div>
                {doc.type === 'doc' && (
                  <button className="docs-item-delete" onClick={(e) => handleDeleteDoc(doc.id, e)} title="Excluir Documento">
                    <FiTrash2 />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
          
          <button className="docs-new-btn highlight-btn" onClick={handleGenerateAI} disabled={isGenerating} style={{ marginBottom: '1rem' }}>
            <FiCpu /> {isGenerating ? 'Gerando...' : 'IA Gerar Texto'}
          </button>
          
          <button className="docs-new-btn" onClick={handleNewDoc}>
            <FiEdit3 /> Novo Documento
          </button>
        </div>

        {/* Editor Area */}
        <div className="docs-editor-area">
          <motion.div 
            className="docs-editor-header"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
          >
            <div className="docs-breadcrumb">
              Workspace / Projetos / <span className="highlight">{activeDocument?.name}</span>
            </div>
            <div className="docs-actions">
              <button className="docs-action-btn"><FiShare2 /> Compartilhar</button>
              <button className="docs-icon-btn"><FiMoreVertical /></button>
            </div>
          </motion.div>

          <motion.div 
            className="docs-editor-content"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="docs-editor-toolbar" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', background: 'rgba(255,255,255,0.02)', padding: '0.5rem', borderRadius: '12px', flexWrap: 'wrap' }}>
              <button className={`docs-icon-btn ${editor?.isActive('bold') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBold().run()} title="Negrito"><FiBold /></button>
              <button className={`docs-icon-btn ${editor?.isActive('italic') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleItalic().run()} title="Itálico"><FiItalic /></button>
              <button className={`docs-icon-btn ${editor?.isActive('underline') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleUnderline().run()} title="Sublinhado" style={{textDecoration: 'underline'}}>U</button>
              <button className={`docs-icon-btn ${editor?.isActive('highlight') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleHighlight().run()} title="Destacar"><mark style={{background: 'transparent', color: 'inherit'}}>H</mark></button>
              
              <div style={{ width: '1px', background: 'rgba(255,255,255,0.1)', margin: '0 0.5rem' }}></div>
              
              <button className={`docs-icon-btn ${editor?.isActive('heading', { level: 2 }) ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()} title="Título 2">H2</button>
              <button className={`docs-icon-btn ${editor?.isActive('bulletList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleBulletList().run()} title="Lista"><FiList /></button>
              <button className={`docs-icon-btn ${editor?.isActive('taskList') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleTaskList().run()} title="Checklist"><FiCheckSquare /></button>
              <button className={`docs-icon-btn ${editor?.isActive('codeBlock') ? 'active' : ''}`} onClick={() => editor?.chain().focus().toggleCodeBlock().run()} title="Bloco de Código">{'</>'}</button>
              
              <div style={{ flex: 1 }}></div>
              
              <input type="file" accept=".docx" ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
              <button className="docs-action-btn" onClick={() => fileInputRef.current?.click()}><FiUpload /> Importar DOCX</button>
              <button className="docs-action-btn" onClick={exportPDF}><FiDownload /> Exportar PDF</button>
            </div>

            <div className="docs-editor-body">
              {editor && (
                <BubbleMenu editor={editor} className="bubble-menu">
                  <button onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive('bold') ? 'is-active' : ''}>
                    <FiBold />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive('italic') ? 'is-active' : ''}>
                    <FiItalic />
                  </button>
                  <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive('underline') ? 'is-active' : ''}>
                    U
                  </button>
                  <button onClick={() => editor.chain().focus().toggleHighlight().run()} className={editor.isActive('highlight') ? 'is-active' : ''}>
                    <mark>H</mark>
                  </button>
                  <button onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive('heading', { level: 2 }) ? 'is-active' : ''}>
                    H2
                  </button>
                </BubbleMenu>
              )}
              <EditorContent editor={editor} />
            </div>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
