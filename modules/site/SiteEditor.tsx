import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder, DroppableProps } from 'react-beautiful-dnd';
import { Page, SiteData, PageBlock, SectionBlock, Column, SiteSettings, HeroBlockContent, TextBlockContent, ImageBlockContent, ButtonBlockContent, MenuBlockContent, MenuItem } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, ChevronRightIcon, SaveIcon, ArrowLeftIcon, FilePlusIcon, EditIcon, LayoutIcon, MenuIcon } from '../../components/icons/Icons';

// --- UTILITIES & HELPERS ---
const generateId = (prefix = 'id') => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const StrictModeDroppable: React.FC<DroppableProps> = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => { cancelAnimationFrame(animation); setEnabled(false); };
  }, []);
  if (!enabled) return null;
  return <Droppable {...props}>{children}</Droppable>;
};

const defaultPageContent: SiteData = {
  settings: { brandName: 'Nova Marca', loginButtonText: 'Login', backgroundColor: '#0f172a' },
  headerSections: [],
  sections: [],
  footerSections: [],
};

const createNewBlock = (type: PageBlock['type']): PageBlock => {
    const id = generateId('block');
    switch (type) {
      case 'hero': return { id, type, content: { title: 'Novo Título de Herói', subtitle: 'Um subtítulo atraente.', ctaText: 'Saiba Mais' } };
      case 'text': return { id, type, content: { heading: 'Nova Seção', body: 'Texto padrão.' } };
      case 'image': return { id, type, content: { imageUrl: 'https://via.placeholder.com/1200x600.png/1e293b/94a3b8?text=Imagem', altText: 'Imagem de Exemplo' } };
      case 'button': return { id, type, content: { text: 'Clique Aqui', link: '#' } };
      case 'menu': return { id, type, content: { items: [{ id: generateId('menuitem'), label: 'Home', link: '#/'}, { id: generateId('menuitem'), label: 'Sobre', link: '#/sobre'}] } };
      default:
        throw new Error(`Unsupported block type: ${type}`);
    }
};

const componentList: { type: PageBlock['type']; label: string; Icon: React.FC<any> }[] = [
    { type: 'hero', label: 'Seção de Herói', Icon: MotorcycleIcon },
    { type: 'text', label: 'Bloco de Texto', Icon: TypeIcon },
    { type: 'image', label: 'Imagem', Icon: ImageIcon },
    { type: 'button', label: 'Botão', Icon: CodeIcon },
    { type: 'menu', label: 'Menu', Icon: MenuIcon },
];

// --- RENDERER COMPONENTS ---
const BlockRenderer: React.FC<{ block: PageBlock }> = React.memo(({ block }) => {
    switch (block.type) {
        case 'hero': return <div className="p-4 bg-slate-700 rounded text-center"><h3 className="font-bold">{block.content.title}</h3><p className="text-sm text-slate-400">{block.content.subtitle}</p></div>;
        case 'text': return <div className="p-4 bg-slate-700 rounded"><h3 className="font-bold">{block.content.heading}</h3><p className="text-sm text-slate-400 truncate">{block.content.body}</p></div>;
        case 'image': return <img src={block.content.imageUrl} alt={block.content.altText} className="w-full h-auto rounded"/>;
        case 'button': return <div className="text-center p-2"><button className="bg-cyan-600 text-white font-bold py-2 px-4 rounded">{block.content.text}</button></div>;
        case 'menu': return <div className="p-2 bg-slate-700 rounded flex gap-4 justify-center">{block.content.items.map(i => <span key={i.id} className="text-sm">{i.label}</span>)}</div>
        default: return <div className="p-4 bg-red-800 rounded">Bloco desconhecido</div>;
    }
});
BlockRenderer.displayName = "BlockRenderer";

// --- EDITOR SUB-COMPONENTS ---
const InspectorPanel: React.FC<{
    selectedElement: any;
    pageSettings: SiteSettings;
    onUpdateBlock: (updatedBlock: PageBlock) => void;
    onUpdateSection: (updatedSection: SectionBlock) => void;
    onUpdatePageSettings: (field: keyof SiteSettings, value: string) => void;
}> = ({ selectedElement, pageSettings, onUpdateBlock, onUpdateSection, onUpdatePageSettings }) => {
    const renderBlockInspector = () => { /* ... (implementation is same as before) ... */
        const block = selectedElement.element as PageBlock;
        switch (block.type) {
            case 'hero': {
                const handleContentChange = (field: keyof HeroBlockContent, value: string) => { onUpdateBlock({ ...block, content: { ...block.content, [field]: value } }); };
                return <> <InputField label="Título" value={block.content.title} onChange={v => handleContentChange('title', v)} /> <InputField label="Subtítulo" value={block.content.subtitle} onChange={v => handleContentChange('subtitle', v)} /> <InputField label="Texto do Botão" value={block.content.ctaText} onChange={v => handleContentChange('ctaText', v)} /> </>;
            }
            case 'text': {
                const handleContentChange = (field: keyof TextBlockContent, value: string) => { onUpdateBlock({ ...block, content: { ...block.content, [field]: value } }); };
                return <> <InputField label="Cabeçalho" value={block.content.heading} onChange={v => handleContentChange('heading', v)} /> <TextareaField label="Corpo do Texto" value={block.content.body} onChange={v => handleContentChange('body', v)} /> </>;
            }
            case 'image': {
                const handleContentChange = (field: keyof ImageBlockContent, value: string) => { onUpdateBlock({ ...block, content: { ...block.content, [field]: value } }); };
                return <> <InputField label="URL da Imagem" value={block.content.imageUrl} onChange={v => handleContentChange('imageUrl', v)} /> <InputField label="Texto Alternativo" value={block.content.altText} onChange={v => handleContentChange('altText', v)} /> </>;
            }
            case 'button': {
                const handleContentChange = (field: keyof ButtonBlockContent, value: string) => { onUpdateBlock({ ...block, content: { ...block.content, [field]: value } }); };
                return <> <InputField label="Texto do Botão" value={block.content.text} onChange={v => handleContentChange('text', v)} /> <InputField label="Link" value={block.content.link} onChange={v => handleContentChange('link', v)} /> </>;
            }
            case 'menu': {
                const menuContent = block.content;
                const handleItemChange = (itemId: string, field: 'label' | 'link', value: string) => { const newItems = menuContent.items.map(item => item.id === itemId ? { ...item, [field]: value } : item); onUpdateBlock({ ...block, content: { ...menuContent, items: newItems }}); };
                return <> <h4 className="text-md font-semibold text-slate-300 mb-2">Itens do Menu</h4> {menuContent.items.map(item => ( <div key={item.id} className="p-2 border border-slate-700 rounded mb-2 space-y-2"> <InputField label="Rótulo" value={item.label} onChange={v => handleItemChange(item.id, 'label', v)} /> <InputField label="Link" value={item.link} onChange={v => handleItemChange(item.id, 'link', v)} /> </div> ))} </>;
            }
            default: return <p>Inspetor não disponível para este bloco.</p>;
        }
    };
    const renderSectionInspector = () => { /* ... (implementation is same as before) ... */
        const section = selectedElement.element as SectionBlock;
        const handleStyleChange = (field: keyof SectionBlock['style'], value: string) => { onUpdateSection({ ...section, style: { ...section.style, [field]: value } }); };
        return <> <ColorField label="Cor de Fundo" value={section.style.backgroundColor} onChange={v => handleStyleChange('backgroundColor', v)} /> <InputField label="Imagem de Fundo (URL)" value={section.style.backgroundImage} onChange={v => handleStyleChange('backgroundImage', v)} /> <InputField label="Espaçamento Superior" value={section.style.paddingTop} onChange={v => handleStyleChange('paddingTop', v)} placeholder="ex: 4rem"/> <InputField label="Espaçamento Inferior" value={section.style.paddingBottom} onChange={v => handleStyleChange('paddingBottom', v)} placeholder="ex: 4rem"/> </>;
    };
    const renderPageInspector = () => ( /* ... (implementation is same as before) ... */
        <> <InputField label="Nome da Marca (Cabeçalho/Rodapé)" value={pageSettings.brandName} onChange={v => onUpdatePageSettings('brandName', v)} /> <InputField label="Texto do Botão de Login" value={pageSettings.loginButtonText} onChange={v => onUpdatePageSettings('loginButtonText', v)} /> <ColorField label="Cor de Fundo da Página" value={pageSettings.backgroundColor} onChange={v => onUpdatePageSettings('backgroundColor', v)} /> </>
    );
    const getTitle = () => { /* ... (implementation is same as before) ... */
        if (!selectedElement) return "Configurações da Página";
        switch (selectedElement.type) {
            case 'block': return `Editando Bloco: ${(selectedElement.element as PageBlock).type}`;
            case 'section': return "Editando Seção";
            case 'column': return "Editando Coluna";
            default: return "Configurações da Página";
        }
    };
    return ( <div className="p-4 space-y-4"> <h3 className="text-lg font-bold text-cyan-400 capitalize flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> {getTitle()}</h3> <div className="space-y-4"> {!selectedElement && renderPageInspector()} {selectedElement?.type === 'block' && renderBlockInspector()} {selectedElement?.type === 'section' && renderSectionInspector()} </div> </div> );
};
const InputField: React.FC<{ label: string, value: string, onChange: (value: string) => void, placeholder?: string }> = ({ label, value, onChange, placeholder }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <input value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /> </div> );
const TextareaField: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <textarea value={value} onChange={e => onChange(e.target.value)} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /> </div> );
const ColorField: React.FC<{ label: string, value: string, onChange: (value: string) => void }> = ({ label, value, onChange }) => ( <div> <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label> <div className="flex items-center gap-2"> <input type="color" value={value} onChange={e => onChange(e.target.value)} className="w-8 h-8 p-0 border-none rounded bg-slate-900" /> <input value={value} onChange={e => onChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /> </div> </div> );


// --- PAGE BUILDER ---
const SiteEditor: React.FC<{ onBack: () => void }> = ({ onBack: onBackToDashboard }) => {
  const [view, setView] = useState<'list' | 'editor' | 'create'>('list');
  const [pages, setPages] = useState<Page[]>([]);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'deleting'>('loading');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const { token } = useAuth();
  
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [savedPage, setSavedPage] = useState<Page | null>(null);
  const [newPageData, setNewPageData] = useState({ title: '', slug: '' });
  
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [activeTab, setActiveTab] = useState<'structure' | 'components' | 'inspector'>('inspector');
  const [selectedElement, setSelectedElement] = useState<{ type: 'section' | 'column' | 'block', element: any} | null>(null);
  const [editContext, setEditContext] = useState<'header' | 'content' | 'footer'>('content');

  const handleFeedback = (type: 'error' | 'success', message: string) => { /* ... (implementation is same as before) ... */
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };
  const fetchPages = useCallback(async () => { /* ... (implementation is same as before) ... */
    setStatus('loading');
    try {
      const response = await fetch('/api/site/pages', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar páginas');
      const data = await response.json();
      setPages(data);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
   }, [token]);

  useEffect(() => { if (view === 'list') fetchPages(); }, [view, fetchPages]);

  // --- API Functions ---
  const handleEditPage = async (page: Page) => { /* ... (implementation is same as before) ... */
    setStatus('loading');
    try {
        const response = await fetch(`/api/site/pages/${page.id}`, { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao carregar os dados completos da página.');
        const fullPageData: Page = await response.json();
        
        // FIX: Ensure content structure exists, handling cases where page content might be null from the DB.
        const content = fullPageData.content;
        const validatedContent: SiteData = {
          settings: content?.settings || defaultPageContent.settings,
          headerSections: content?.headerSections || [],
          sections: content?.sections || [],
          footerSections: content?.footerSections || [],
        };
        fullPageData.content = validatedContent;
        
        setEditingPage(fullPageData);
        setSavedPage(JSON.parse(JSON.stringify(fullPageData)));
        setView('editor');
        setEditContext('content');
        setActiveTab('inspector');
        setSelectedElement(null);
    } catch (error: any) {
        handleFeedback('error', error.message || 'Não foi possível carregar a página para edição.');
    } finally {
        setStatus('idle');
    }
  };
  const handleSaveChanges = async () => { /* ... (implementation is same as before) ... */
    if (!editingPage) return;
    setStatus('saving');
    try {
      const response = await fetch(`/api/site/pages/${editingPage.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          title: editingPage.title,
          slug: editingPage.slug,
          is_published: editingPage.is_published,
          content: editingPage.content
        })
      });
      if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar');
      const updatedPage = await response.json();
      setSavedPage(JSON.parse(JSON.stringify(updatedPage)));
      setEditingPage(updatedPage);
      handleFeedback('success', 'Salvo com sucesso!');
    } catch (error: any) {
      handleFeedback('error', error.message || 'Falha ao salvar!');
    } finally {
      setStatus('idle');
    }
  };
  const handleCreatePage = async (e: React.FormEvent) => { /* ... (implementation is same as before) ... */
    e.preventDefault();
    setStatus('saving');
    try {
        const response = await fetch('/api/site/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: newPageData.title, slug: newPageData.slug })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao criar página');
        const newPage = await response.json();
        setNewPageData({ title: '', slug: '' });
        await handleEditPage(newPage);
    } catch (error: any) {
        handleFeedback('error', error.message || 'Erro ao criar página');
    } finally {
        setStatus('idle');
    }
  };
  const handleDeletePage = async (pageId: string) => { /* ... (implementation is same as before) ... */
    if (!window.confirm("Você tem certeza que quer excluir esta página? Esta ação é irreversível.")) return;
    setStatus('deleting');
    try {
        const response = await fetch(`/api/site/pages/${pageId}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao excluir');
        fetchPages();
    } catch (error: any) {
        console.error(error);
        handleFeedback('error', error.message || 'Falha ao excluir');
    } finally {
        setStatus('idle');
    }
  };

  // --- Editor Content Handlers ---
  const updateEditingPage = (updater: (draft: Page) => void) => {
    setEditingPage(prev => {
        if (!prev) return null;
        const draft = JSON.parse(JSON.stringify(prev)); // Deep copy
        updater(draft);
        return draft;
    });
  };

  const getCurrentSections = () => {
    if (!editingPage || !editingPage.content) return [];
    if (editContext === 'header') return editingPage.content.headerSections || [];
    if (editContext === 'footer') return editingPage.content.footerSections || [];
    return editingPage.content.sections || [];
  };

  const updateCurrentSections = (newSections: SectionBlock[]) => {
    updateEditingPage(draft => {
        if (!draft.content) draft.content = defaultPageContent;
        if (editContext === 'header') draft.content.headerSections = newSections;
        else if (editContext === 'footer') draft.content.footerSections = newSections;
        else draft.content.sections = newSections;
    });
  };
  
  const handleAddSection = (columnsLayout: string[]) => {
    const newSection: SectionBlock = { id: generateId('section'), columns: columnsLayout.map(width => ({ id: generateId('col'), blocks: [], style: { width } })), style: { backgroundColor: 'transparent', paddingTop: '4rem', paddingBottom: '4rem', backgroundImage: '' } };
    updateCurrentSections([...getCurrentSections(), newSection]);
  };
  
  const handleDeleteElement = () => {
    if (!selectedElement) return;
    let newSections = [...getCurrentSections()];
    if (selectedElement.type === 'section') {
        newSections = newSections.filter(s => s.id !== selectedElement.element.id);
    } else if (selectedElement.type === 'block') {
        newSections = newSections.map(section => ({ ...section, columns: section.columns.map(col => ({ ...col, blocks: col.blocks.filter(b => b.id !== selectedElement.element.id) })) }));
    }
    updateCurrentSections(newSections);
    setSelectedElement(null);
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    const { source, destination, draggableId, type } = result;
    if (!destination) return;
    
    const currentSections = getCurrentSections();
    
    // --- DRAGGING A NEW COMPONENT FROM THE TOOLBOX ---
    if (source.droppableId === 'COMPONENTS') {
        const destColId = destination.droppableId;
        const blockType = draggableId.split('-')[1] as PageBlock['type'];
        const newBlock = createNewBlock(blockType);
        
        const newSections = currentSections.map(section => ({ ...section, columns: section.columns.map(col => {
            if (col.id === destColId) {
                const newBlocks = Array.from(col.blocks);
                newBlocks.splice(destination.index, 0, newBlock);
                return { ...col, blocks: newBlocks };
            }
            return col;
        })}));
        updateCurrentSections(newSections);
        return;
    }

    // --- REORDERING SECTIONS ---
    if (type === 'SECTION') {
        const items = Array.from(currentSections);
        const [reorderedItem] = items.splice(source.index, 1);
        items.splice(destination.index, 0, reorderedItem);
        updateCurrentSections(items);
    }

    // --- REORDERING BLOCKS ---
    if (type === 'BLOCK') {
        let sourceCol: Column | null = null, destCol: Column | null = null;
        for (const section of currentSections) {
            for (const col of section.columns) {
                if (col.id === source.droppableId) sourceCol = col;
                if (col.id === destination.droppableId) destCol = col;
            }
        }
        
        if (!sourceCol || !destCol) return;

        if (source.droppableId === destination.droppableId) { // Reorder in same column
            const newBlocks = Array.from(sourceCol.blocks);
            const [movedBlock] = newBlocks.splice(source.index, 1);
            newBlocks.splice(destination.index, 0, movedBlock);
            const newSections = currentSections.map(s => ({ ...s, columns: s.columns.map(c => c.id === sourceCol!.id ? { ...c, blocks: newBlocks } : c)}));
            updateCurrentSections(newSections);
        } else { // Move between columns
            const sourceBlocks = Array.from(sourceCol.blocks);
            const destBlocks = Array.from(destCol.blocks);
            const [movedBlock] = sourceBlocks.splice(source.index, 1);
            destBlocks.splice(destination.index, 0, movedBlock);
            const newSections = currentSections.map(s => ({ ...s, columns: s.columns.map(c => {
                if (c.id === sourceCol!.id) return { ...c, blocks: sourceBlocks };
                if (c.id === destCol!.id) return { ...c, blocks: destBlocks };
                return c;
            })}));
            updateCurrentSections(newSections);
        }
    }
  };
  
  const hasUnsavedChanges = useMemo(() => JSON.stringify(editingPage) !== JSON.stringify(savedPage), [editingPage, savedPage]);

  // ----- RENDERERS -----
  const renderListView = () => ( /* ... (same as before) ... */ 
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Gerenciador de Páginas</h2>
            <button onClick={() => setView('create')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><FilePlusIcon className="w-5 h-5"/> Criar Nova Página</button>
        </div>
        {status === 'loading' && <div className="text-center">Carregando páginas...</div>}
        {status === 'error' && <div className="text-center text-red-400">Falha ao carregar páginas.</div>}
        {status !== 'loading' && (
            <div className="overflow-x-auto bg-slate-800/50 rounded-lg border border-slate-800">
                <table className="min-w-full">
                    <thead><tr className="border-b border-slate-700"><th className="p-3 text-left text-sm font-semibold text-slate-400">Título</th><th className="p-3 text-left text-sm font-semibold text-slate-400">URL</th><th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th><th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th></tr></thead>
                    <tbody>
                        {pages.map(page => (
                            <tr key={page.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                                <td className="p-3 text-sm font-medium">{page.title} {page.is_homepage && <span className="text-xs bg-cyan-500/20 text-cyan-300 px-2 py-1 rounded-full ml-2">Página Inicial</span>}</td>
                                <td className="p-3 text-sm text-slate-400 font-mono">/{page.slug}</td>
                                <td className="p-3 text-sm">{page.is_published ? <span className="text-green-400">Publicada</span> : <span className="text-yellow-400">Rascunho</span>}</td>
                                <td className="p-3 text-sm flex items-center gap-4">
                                    <button onClick={() => handleEditPage(page)} className="text-cyan-400 hover:text-cyan-300 flex items-center gap-1"><EditIcon className="w-4 h-4"/> Editar</button>
                                    <button onClick={() => handleDeletePage(page.id)} className="text-red-500 hover:text-red-400 flex items-center gap-1"><Trash2Icon className="w-4 h-4"/> Excluir</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        )}
    </div>
  );
  const renderCreateView = () => ( /* ... (same as before) ... */ 
     <div className="p-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para a Lista</button>
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Criar Nova Página</h2>
        <form onSubmit={handleCreatePage} className="max-w-md space-y-4">
            <div><label className="block text-sm font-medium text-slate-400 mb-1">Título</label><input type="text" value={newPageData.title} onChange={e => setNewPageData({...newPageData, title: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /></div>
            <div><label className="block text-sm font-medium text-slate-400 mb-1">URL (Slug)</label><input type="text" value={newPageData.slug} onChange={e => setNewPageData({...newPageData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" /><p className="text-xs text-slate-500 mt-1">Use apenas letras, números e hifens.</p></div>
            <div className="pt-2"><button type="submit" disabled={status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">{status === 'saving' ? 'Criando...' : 'Criar e Editar'}</button></div>
        </form>
    </div>
  );

  const renderEditorView = () => {
    if (status === 'loading' || !editingPage || !editingPage.content) return <div className="text-center p-8">Carregando editor...</div>;
    const pageStyle = { backgroundColor: editingPage.content.settings.backgroundColor || '#0f172a' };
    const sectionsToRender = getCurrentSections();
    
    return (
     <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex flex-row h-full w-full overflow-hidden bg-slate-900">
        <aside className={`flex-shrink-0 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 transition-all duration-300 ease-in-out overflow-hidden ${isPanelOpen ? 'w-full max-w-sm' : 'w-0'}`}>
          <div className="h-full flex flex-col">
              <div className="flex-shrink-0 border-b border-slate-700 flex">
                {(['inspector', 'structure', 'components'] as const).map(tab => ( <button key={tab} onClick={() => setActiveTab(tab)} className={`flex-1 p-3 text-sm font-semibold capitalize ${activeTab === tab ? 'bg-slate-900 text-cyan-400' : 'text-slate-400 hover:bg-slate-700'}`}>{tab}</button> ))}
              </div>
              <div className="flex-grow overflow-y-auto">
                 {activeTab === 'inspector' && <InspectorPanel selectedElement={selectedElement} pageSettings={editingPage.content.settings} onUpdateBlock={(b) => updateEditingPage(d => d.content?.sections.forEach(s => s.columns.forEach(c => c.blocks = c.blocks.map(bl => bl.id === b.id ? b : bl))))} onUpdateSection={(s) => updateCurrentSections(getCurrentSections().map(sec => sec.id === s.id ? s : sec))} onUpdatePageSettings={(f, v) => updateEditingPage(d => d.content && (d.content.settings[f] = v))}/>}
                 {activeTab === 'structure' && <div className="p-4 space-y-2"> <h3 className="text-lg font-bold text-cyan-400 mb-2">Estrutura</h3> <button onClick={() => handleAddSection(['100%'])} className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded">1 Coluna</button> <button onClick={() => handleAddSection(['50%', '50%'])} className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded">2 Colunas (50/50)</button> <button onClick={() => handleAddSection(['33.33%', '66.67%'])} className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded">2 Colunas (33/67)</button> <button onClick={() => handleAddSection(['33.33%', '33.33%', '33.33%'])} className="w-full p-2 bg-slate-700 hover:bg-slate-600 rounded">3 Colunas</button> </div>}
                 {activeTab === 'components' && (
                    <StrictModeDroppable droppableId="COMPONENTS" isDropDisabled={true}>
                      {(provided) => (
                          <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-2">
                            <h3 className="text-lg font-bold text-cyan-400 mb-2">Componentes</h3>
                            <p className="text-xs text-slate-500 mb-4">Arraste um componente para uma coluna na página.</p>
                              {componentList.map(({ type, label, Icon }, index) => (
                                <Draggable key={type} draggableId={`comp-${type}`} index={index}>
                                  {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="w-full flex items-center gap-3 p-3 bg-slate-700 rounded-md text-left cursor-grab">
                                        <Icon className="w-5 h-5 text-cyan-400"/> {label}
                                    </div>
                                  )}
                                </Draggable>
                              ))}
                              {provided.placeholder}
                          </div>
                      )}
                    </StrictModeDroppable>
                 )}
              </div>
              <div className="flex-shrink-0 p-4 border-t border-slate-700 bg-slate-800 space-y-3">
                 <div className="h-5 text-sm font-semibold">{hasUnsavedChanges ? <span className="text-yellow-400">Alterações não salvas</span> : <span className="text-green-400/80">Sincronizado</span>}</div>
                  <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || status === 'saving'} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center justify-center gap-2"><SaveIcon className="w-5 h-5"/>{status === 'saving' ? 'Salvando...' : 'Salvar Alterações'}</button>
                  {selectedElement && <button onClick={handleDeleteElement} className="w-full bg-red-800 hover:bg-red-700 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2"><Trash2Icon className="w-5 h-5"/> Excluir {selectedElement.type}</button>}
              </div>
          </div>
        </aside>

        <div className="flex-1 relative flex flex-col">
           <button onClick={() => setIsPanelOpen(!isPanelOpen)} className={`absolute top-4 bg-slate-800 hover:bg-cyan-600 text-white p-2 rounded-r-lg z-30 transition-transform ${isPanelOpen ? '-left-0.5' : 'left-0'}`}><ChevronRightIcon className="w-5 h-5"/></button>
            <div className="flex-shrink-0 p-2 bg-slate-900/50 border-b border-slate-800 flex items-center justify-center gap-2">
                {(['header', 'content', 'footer'] as const).map(ctx => (
                    <button key={ctx} onClick={() => setEditContext(ctx)} className={`px-4 py-2 text-sm font-semibold rounded-md ${editContext === ctx ? 'bg-cyan-600 text-white' : 'bg-slate-800 hover:bg-slate-700'}`}>Editar {ctx === 'header' ? 'Cabeçalho' : ctx === 'footer' ? 'Rodapé' : 'Conteúdo'}</button>
                ))}
            </div>
            <main className="flex-1 overflow-y-auto p-4" style={pageStyle}>
              <StrictModeDroppable droppableId="canvas" type="SECTION">
                  {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="max-w-7xl mx-auto space-y-2">
                          {sectionsToRender.map((section, index) => (
                              <Draggable key={section.id} draggableId={section.id} index={index}>
                                {(provided) => (
                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedElement({type: 'section', element: section})} style={{...provided.draggableProps.style, backgroundColor: section.style.backgroundColor}} className={`p-4 rounded-lg ring-2 ${selectedElement?.element.id === section.id ? 'ring-cyan-500' : 'ring-transparent hover:ring-slate-600'} cursor-pointer`}>
                                        <div className="flex flex-wrap -m-1">
                                            {section.columns.map(col => (
                                                <StrictModeDroppable key={col.id} droppableId={col.id} type="BLOCK">
                                                    {(provided, snapshot) => (
                                                        <div ref={provided.innerRef} {...provided.droppableProps} style={{width: col.style.width}} className={`p-1 min-h-[80px] rounded transition-colors ${snapshot.isDraggingOver ? 'bg-cyan-900/50' : 'bg-slate-800/20'}`}>
                                                            {col.blocks.map((block, index) => (
                                                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                                                    {(provided) => (
                                                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={(e) => { e.stopPropagation(); setSelectedElement({type: 'block', element: block}); }} style={provided.draggableProps.style} className={`p-1 rounded ring-2 mb-2 ${selectedElement?.element.id === block.id ? 'ring-cyan-400' : 'ring-transparent'}`}>
                                                                            <BlockRenderer block={block} />
                                                                        </div>
                                                                    )}
                                                                </Draggable>
                                                            ))}
                                                            {provided.placeholder}
                                                             {col.blocks.length === 0 && <div className="text-center text-xs text-slate-500 p-4 border-2 border-dashed border-slate-700 rounded-lg">Arraste um componente aqui</div>}
                                                        </div>
                                                    )}
                                                </StrictModeDroppable>
                                            ))}
                                        </div>
                                    </div>
                                )}
                              </Draggable>
                          ))}
                          {provided.placeholder}
                      </div>
                  )}
              </StrictModeDroppable>
              {sectionsToRender.length === 0 && <div className="text-center py-20 text-slate-500"><p>Use a aba 'Estrutura' no painel para adicionar sua primeira seção.</p></div>}
            </main>
        </div>
      </div>
     </DragDropContext>
    );
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
      <header className="bg-slate-900/80 backdrop-blur-sm z-40 border-b border-slate-800 flex items-center justify-between h-16 px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
              <button onClick={view === 'editor' || view === 'create' ? () => setView('list') : onBackToDashboard} className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-4 rounded-lg inline-flex items-center"><ArrowLeftIcon className="w-5 h-5 mr-2" /><span>{view === 'editor' || view === 'create' ? 'Páginas' : 'Painel'}</span></button>
              <h2 className="text-xl font-bold text-slate-100">{view === 'editor' && editingPage ? `Editando: ${editingPage.title}` : 'Gerenciador de Site'}</h2>
          </div>
           {feedback && <div className={`text-sm font-semibold ${feedback.type === 'error' ? 'text-red-400' : 'text-green-400'}`}>{feedback.message}</div>}
      </header>
      <div className="flex-1 relative overflow-hidden">
        {view === 'list' && renderListView()}
        {view === 'create' && renderCreateView()}
        {view === 'editor' && renderEditorView()}
      </div>
    </div>
  );
};

export default SiteEditor;