import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder, DroppableProps } from 'react-beautiful-dnd';
import { PageBlock, Page, SiteData, SiteSettings, HeroBlockContent, TextBlockContent, ImageBlockContent, ButtonBlockContent } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, SaveIcon, ArrowLeftIcon, FilePlusIcon, EditIcon } from '../../components/icons/Icons';

// FIX: Wrapper para react-beautiful-dnd para garantir compatibilidade com React 18 StrictMode.
const StrictModeDroppable: React.FC<DroppableProps> = ({ children, ...props }) => {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);
  if (!enabled) {
    return null;
  }
  return <Droppable {...props}>{children}</Droppable>;
};

const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// FIX: Implemented the stubbed renderPreviewBlock function to fix return type errors.
const renderPreviewBlock = (block: PageBlock) => {
    switch (block.type) {
        case 'hero':
            return (
                <main key={block.id} className="container mx-auto px-6 py-16 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg cursor-not-allowed opacity-50" disabled>
                        {block.content.ctaText}
                    </button>
                </main>
            );
        case 'text':
            return (
                 <section key={block.id} className="py-12">
                    <div className="container mx-auto px-6 max-w-3xl text-left">
                        <h2 className="text-3xl font-bold text-center mb-6 text-white">{block.content.heading}</h2>
                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{block.content.body}</p>
                    </div>
                </section>
            );
        case 'image':
            return (
                <section key={block.id} className="py-12">
                    <div className="container mx-auto px-6">
                        <img src={block.content.imageUrl} alt={block.content.altText} className="rounded-lg max-w-4xl h-auto mx-auto shadow-lg" />
                    </div>
                </section>
            );
        case 'button':
            return (
                 <section key={block.id} className="py-8 text-center">
                    <a href={block.content.link} onClick={e => e.preventDefault()} className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg inline-block cursor-not-allowed opacity-50">
                        {block.content.text}
                    </a>
                </section>
            );
        default:
            return null;
    }
};

// --- Inspetor de Bloco ---
// FIX: Implemented the stubbed Inspector component to fix return type errors.
const Inspector: React.FC<{ block: PageBlock; onUpdate: (updatedBlock: PageBlock) => void; onBack: () => void; }> = ({ block, onUpdate, onBack }) => {
    const handleContentChange = (field: string, value: string) => {
        onUpdate({ ...block, content: { ...block.content, [field as keyof typeof block.content]: value } });
    };

    const renderField = (label: string, field: string, value: string, isTextArea = false) => (
        <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            {isTextArea ? (
                 <textarea value={value} onChange={e => handleContentChange(field, e.target.value)} rows={5} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
            ) : (
                <input value={value} onChange={e => handleContentChange(field, e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
            )}
        </div>
    );
    
    const renderFields = () => {
        switch (block.type) {
            case 'hero':
                return <>
                    {renderField('Title', 'title', (block.content as HeroBlockContent).title)}
                    {renderField('Subtitle', 'subtitle', (block.content as HeroBlockContent).subtitle)}
                    {renderField('Button Text', 'ctaText', (block.content as HeroBlockContent).ctaText)}
                </>;
            case 'text':
                return <>
                    {renderField('Heading', 'heading', (block.content as TextBlockContent).heading)}
                    {renderField('Body Text', 'body', (block.content as TextBlockContent).body, true)}
                </>;
            case 'image':
                return <>
                    {renderField('Image URL', 'imageUrl', (block.content as ImageBlockContent).imageUrl)}
                    {renderField('Alt Text', 'altText', (block.content as ImageBlockContent).altText)}
                </>;
            case 'button':
                return <>
                    {renderField('Button Text', 'text', (block.content as ButtonBlockContent).text)}
                    {renderField('Link URL', 'link', (block.content as ButtonBlockContent).link)}
                </>;
            default:
                return <p>Unknown block type</p>;
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <div className="flex items-center gap-2">
                <button onClick={onBack} className="text-slate-400 hover:text-white"><ArrowLeftIcon className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold text-cyan-400 capitalize">Editing: {block.type}</h3>
            </div>
            <div className="space-y-4">
                {renderFields()}
            </div>
        </div>
    );
};


const defaultPageContent: SiteData = {
  settings: { brandName: 'Nova Marca', loginButtonText: 'Login' },
  blocks: [],
};


// --- Componente Principal ---
const SiteEditor: React.FC<{ onBack: () => void }> = ({ onBack: onBackToDashboard }) => {
  type View = 'list' | 'editor' | 'create';
  const [view, setView] = useState<View>('list');
  const [pages, setPages] = useState<Page[]>([]);
  const [editingPage, setEditingPage] = useState<Page | null>(null);
  const [savedPage, setSavedPage] = useState<Page | null>(null);
  
  const [newPageData, setNewPageData] = useState({ title: '', slug: '' });

  // FIX: Added 'success' to the status type.
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'deleting' | 'success'>('loading');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const { token } = useAuth();
  
  const fetchPages = useCallback(async () => {
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

  useEffect(() => {
    if (view === 'list') {
      fetchPages();
    }
  }, [view, fetchPages]);
  
  const handleEditPage = (page: Page) => {
    setEditingPage(page);
    setSavedPage(page);
    setView('editor');
  };
  
  const handleSaveChanges = async () => {
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
      setSavedPage(updatedPage);
      setEditingPage(updatedPage);
      setStatus('success');
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  };

  const handleCreatePage = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus('saving');
    try {
        const response = await fetch('/api/site/pages', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ title: newPageData.title, slug: newPageData.slug, content: defaultPageContent })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao criar página');
        const newPage = await response.json();
        setNewPageData({ title: '', slug: '' });
        handleEditPage(newPage); // Automatically switch to editing the new page
    } catch (error) {
        console.error(error);
        setStatus('error');
    }
  };

  const handleDeletePage = async (pageId: string) => {
    if (!window.confirm("Você tem certeza que quer excluir esta página? Esta ação é irreversível.")) return;
    setStatus('deleting');
    try {
        const response = await fetch(`/api/site/pages/${pageId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao excluir');
        fetchPages(); // Refreshes the list
    } catch (error) {
        console.error(error);
        setStatus('error');
    }
  };

  // ----- Funções de Edição de Página (dentro da view do editor) -----
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const handleUpdateEditingPage = (field: keyof Page, value: any) => {
    setEditingPage(prev => prev ? { ...prev, [field]: value } : null);
  };
  
  const handleSettingsChange = (field: keyof SiteSettings, value: string) => {
    if (!editingPage) return;
    const newContent = { ...editingPage.content, settings: { ...editingPage.content.settings, [field]: value }};
    handleUpdateEditingPage('content', newContent);
  };
  
  const handleAddBlock = (type: PageBlock['type']) => {
    if (!editingPage) return;
    let newBlock: PageBlock;
    const id = generateId();
    switch (type) {
      case 'hero': newBlock = { id, type, content: { title: 'Novo Título de Herói', subtitle: 'Um subtítulo atraente.', ctaText: 'Saiba Mais' } }; break;
      case 'text': newBlock = { id, type, content: { heading: 'Nova Seção', body: 'Texto padrão.' } }; break;
      case 'image': newBlock = { id, type, content: { imageUrl: 'https://via.placeholder.com/1200x600.png/1e293b/94a3b8?text=Imagem+Espa%C3%A7o+Reservado', altText: 'Imagem de Exemplo' } }; break;
      case 'button': newBlock = { id, type, content: { text: 'Clique Aqui', link: '#' } }; break;
    }
    const newBlocks = [...editingPage.content.blocks, newBlock];
    handleUpdateEditingPage('content', { ...editingPage.content, blocks: newBlocks });
    setSelectedBlockId(id);
  };

  const handleUpdateBlock = (updatedBlock: PageBlock) => {
    if (!editingPage) return;
    const newBlocks = editingPage.content.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b);
    handleUpdateEditingPage('content', { ...editingPage.content, blocks: newBlocks });
  };
  
  const handleDeleteBlock = (idToDelete: string) => { 
    if (!editingPage) return;
    if (selectedBlockId === idToDelete) setSelectedBlockId(null); 
    const newBlocks = editingPage.content.blocks.filter(b => b.id !== idToDelete);
    handleUpdateEditingPage('content', { ...editingPage.content, blocks: newBlocks });
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination || !editingPage) return;
    const items = Array.from(editingPage.content.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    handleUpdateEditingPage('content', { ...editingPage.content, blocks: items });
  };
  
  const selectedBlock = editingPage?.content.blocks.find(b => b.id === selectedBlockId);
  const hasUnsavedChanges = JSON.stringify(editingPage) !== JSON.stringify(savedPage);

  // ----- RENDERIZADORES DE VIEW -----

  const renderListView = () => (
    <div className="p-6">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-slate-100">Gerenciador de Páginas</h2>
            <button onClick={() => setView('create')} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"><FilePlusIcon className="w-5 h-5"/> Criar Nova Página</button>
        </div>
        <div className="overflow-x-auto bg-slate-800/50 rounded-lg border border-slate-800">
            <table className="min-w-full">
                <thead>
                    <tr className="border-b border-slate-700">
                        <th className="p-3 text-left text-sm font-semibold text-slate-400">Título da Página</th>
                        <th className="p-3 text-left text-sm font-semibold text-slate-400">URL (Slug)</th>
                        <th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th>
                        <th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th>
                    </tr>
                </thead>
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
    </div>
  );
  
  const renderCreateView = () => (
    <div className="p-6">
        <button onClick={() => setView('list')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para a Lista</button>
        <h2 className="text-2xl font-bold text-slate-100 mb-6">Criar Nova Página</h2>
        <form onSubmit={handleCreatePage} className="max-w-md space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Título da Página</label>
                <input type="text" value={newPageData.title} onChange={e => setNewPageData({...newPageData, title: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" placeholder="Ex: Sobre Nós"/>
            </div>
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">URL (Slug)</label>
                <input type="text" value={newPageData.slug} onChange={e => setNewPageData({...newPageData, slug: e.target.value.toLowerCase().replace(/\s+/g, '-')})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" placeholder="ex: sobre-nos"/>
                <p className="text-xs text-slate-500 mt-1">Isso definirá a URL da sua página. Use apenas letras, números e hifens.</p>
            </div>
            <div className="pt-2">
                <button type="submit" disabled={status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">
                    {status === 'saving' ? 'Criando...' : 'Criar e Editar Página'}
                </button>
            </div>
        </form>
    </div>
  );

  const renderEditorView = () => {
    if (!editingPage) return null;
    return (
        <div className="flex-1 relative overflow-hidden">
        <aside className={`absolute top-0 left-0 h-full bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 z-20 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'} w-full max-w-sm`}>
          <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto">
                  {selectedBlock ? (
                      <Inspector block={selectedBlock} onUpdate={handleUpdateBlock} onBack={() => setSelectedBlockId(null)} />
                  ) : (
                      <div className="p-4">
                          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Configurações da Página</h3>
                           <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Título da Página</label>
                                    <input value={editingPage.title} onChange={e => handleUpdateEditingPage('title', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                                </div>
                               <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">URL (Slug)</label>
                                    <input value={editingPage.slug} onChange={e => handleUpdateEditingPage('slug', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                                </div>
                            </div>

                          <div className="border-t border-slate-700 my-6"></div>

                          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2"><PlusCircleIcon className="w-5 h-5"/> Adicionar Componente</h3>
                          <div className="space-y-2">
                              <button onClick={() => handleAddBlock('hero')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md text-left"><MotorcycleIcon className="w-5 h-5 text-cyan-400"/> Seção de Herói</button>
                              <button onClick={() => handleAddBlock('text')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md text-left"><TypeIcon className="w-5 h-5 text-cyan-400"/> Bloco de Texto</button>
                              <button onClick={() => handleAddBlock('image')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md text-left"><ImageIcon className="w-5 h-5 text-cyan-400"/> Imagem</button>
                              <button onClick={() => handleAddBlock('button')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md text-left"><CodeIcon className="w-5 h-5 text-cyan-400"/> Botão</button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
        </aside>
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-cyan-600 text-white p-2 rounded-r-lg z-20 transition-transform duration-300 ease-in-out" style={{ left: isPanelOpen ? '24rem' : '0' }}>
              {isPanelOpen ? <ChevronLeftIcon className="w-5 h-5"/> : <ChevronRightIcon className="w-5 h-5"/>}
        </button>


        <main className="flex-1 overflow-y-auto bg-slate-900 transition-all duration-300 ease-in-out" style={{ paddingLeft: isPanelOpen ? '25rem' : '3rem', paddingRight: '1rem' }}>
            <DragDropContext onDragEnd={onDragEnd}>
              <StrictModeDroppable droppableId="canvas">
                  {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="py-8 space-y-4">
                          {editingPage.content.blocks.map((block, index) => (
                              <Draggable key={block.id} draggableId={block.id} index={index}>
                                  {(provided, snapshot) => (
                                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => { setSelectedBlockId(block.id); setIsPanelOpen(true); }} className={`relative rounded-lg ring-2 transition-all cursor-pointer ${selectedBlockId === block.id ? 'ring-cyan-500' : 'ring-transparent hover:ring-slate-600'} ${snapshot.isDragging ? 'shadow-2xl shadow-cyan-900/50 opacity-80' : ''}`}>
                                          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 hover:opacity-100 transition-opacity"><button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="p-1.5 bg-red-800/80 hover:bg-red-700 rounded-md text-white"><Trash2Icon className="w-4 h-4" /></button></div>
                                          <div className="pointer-events-none">{renderPreviewBlock(block)}</div>
                                      </div>
                                  )}
                              </Draggable>
                          ))}
                          {provided.placeholder}
                      </div>
                  )}
              </StrictModeDroppable>
            </DragDropContext>
            {editingPage.content.blocks.length === 0 && <div className="text-center py-20 text-slate-500"><p>Sua página está vazia.</p><p>Use o painel lateral para adicionar seu primeiro componente.</p></div>}
        </main>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 z-30 flex justify-between items-center">
             <div>
                  {hasUnsavedChanges && status !== 'error' && <div className="text-yellow-400 text-sm font-semibold">Alterações não salvas</div>}
                  {status === 'success' && <div className="text-green-400 text-sm font-semibold">Salvo com sucesso!</div>}
              </div>
              {status === 'error' ? (
                  <div className="flex items-center gap-4 text-red-400 text-sm font-semibold">
                      <p>Falha ao salvar!</p>
                      <button onClick={handleSaveChanges} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">Tentar Novamente</button>
                  </div>
              ) : (
                  <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                      <SaveIcon className="w-5 h-5"/>
                      {status === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                  </button>
              )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
      <header className="bg-slate-900/80 backdrop-blur-sm z-40 border-b border-slate-800 flex items-center justify-between h-16 px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
              <button
                onClick={view === 'editor' || view === 'create' ? () => setView('list') : onBackToDashboard}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold py-2 px-4 rounded-lg inline-flex items-center transition-colors duration-200 border border-slate-700"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span>{view === 'editor' || view === 'create' ? 'Lista de Páginas' : 'Painel'}</span>
              </button>
              <h2 className="text-xl font-bold text-slate-100">{view === 'editor' && editingPage ? `Editando: ${editingPage.title}` : 'Gerenciador de Site'}</h2>
          </div>
      </header>

      <div className="flex-1 relative overflow-hidden">
        {view === 'list' && renderListView()}
        {view === 'create' && renderCreateView()}
        {view === 'editor' && renderEditorView()}
      </div>
    </div>
  );
};

// --- Subcomponentes estáticos para evitar re-renderizações desnecessárias ---
Inspector.displayName = "Inspector";
const MemoizedInspector = React.memo(Inspector);
const MemoizedPreviewBlock = React.memo(renderPreviewBlock);

export default SiteEditor;