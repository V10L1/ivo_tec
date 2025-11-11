import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder, DroppableProps } from 'react-beautiful-dnd';
import { PageBlock, SiteData, SiteSettings } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, ChevronLeftIcon, ChevronRightIcon, XIcon, SaveIcon, ArrowLeftIcon } from '../../components/icons/Icons';

// FIX: Wrapper para react-beautiful-dnd para garantir compatibilidade com React 18 StrictMode.
// Isso impede que o componente quebre devido ao comportamento de renderização dupla do StrictMode em desenvolvimento.
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


// --- Gerador de ID ---
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Renderizador de Bloco para o Canvas de Edição ---
const renderPreviewBlock = (block: PageBlock) => {
    switch (block.type) {
        case 'hero':
            return (
                <main className="container mx-auto px-6 py-16 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg cursor-not-allowed opacity-70">
                        {block.content.ctaText}
                    </button>
                </main>
            );
        case 'text':
            return (
                 <section className="py-12">
                    <div className="container mx-auto px-6 max-w-3xl text-left">
                        <h2 className="text-3xl font-bold text-center mb-6 text-white">{block.content.heading}</h2>
                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{block.content.body}</p>
                    </div>
                </section>
            );
        case 'image':
            return (
                <section className="py-12">
                    <div className="container mx-auto px-6">
                        <img src={block.content.imageUrl} alt={block.content.altText} className="rounded-lg max-w-4xl h-auto mx-auto shadow-lg" />
                    </div>
                </section>
            );
        case 'button':
            return (
                 <section className="py-8 text-center">
                    <a href={block.content.link} onClick={e => e.preventDefault()} className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg inline-block cursor-not-allowed opacity-70">
                        {block.content.text}
                    </a>
                </section>
            );
        default:
            return null;
    }
};


// --- Componente do Inspetor (Dentro do Painel Lateral) ---
const Inspector: React.FC<{ block: PageBlock; onUpdate: (updatedBlock: PageBlock) => void; onBack: () => void; }> = ({ block, onUpdate, onBack }) => {
    const handleContentChange = (field: string, value: string) => {
        onUpdate({ ...block, content: { ...block.content, [field]: value } } as PageBlock);
    };

    const blockTypeTranslations: Record<string, string> = { hero: 'Herói', text: 'Texto', image: 'Imagem', button: 'Botão' };
    const translatedBlockType = blockTypeTranslations[block.type] || block.type;

    const renderFields = () => {
        switch (block.type) {
            case 'hero':
                return (
                    <>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Título</label>
                        <input value={block.content.title} onChange={e => handleContentChange('title', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">Subtítulo</label>
                        <textarea value={block.content.subtitle} onChange={e => handleContentChange('subtitle', e.target.value)} rows={4} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">Texto do Botão</label>
                        <input value={block.content.ctaText} onChange={e => handleContentChange('ctaText', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                    </>
                );
            case 'text':
                return (
                     <>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Cabeçalho</label>
                        <input value={block.content.heading} onChange={e => handleContentChange('heading', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">Corpo do Texto</label>
                        <textarea value={block.content.body} onChange={e => handleContentChange('body', e.target.value)} rows={6} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                    </>
                );
            case 'image':
                 return (
                     <>
                        <label className="block text-sm font-medium text-slate-400 mb-1">URL da Imagem</label>
                        <input value={block.content.imageUrl} onChange={e => handleContentChange('imageUrl', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">Texto Alternativo</label>
                        <input value={block.content.altText} onChange={e => handleContentChange('altText', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                    </>
                );
            case 'button':
                return (
                     <>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Texto do Botão</label>
                        <input value={block.content.text} onChange={e => handleContentChange('text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">URL do Link</label>
                        <input value={block.content.link} onChange={e => handleContentChange('link', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mb-2" />
                    </>
                );
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Editar {translatedBlockType}</h3>
                <button onClick={onBack} className="p-1.5 bg-slate-700 hover:bg-slate-600 rounded-md text-white"><XIcon className="w-4 h-4"/></button>
            </div>
            {renderFields()}
        </div>
    );
};

const defaultSiteData: SiteData = {
  settings: { brandName: '', loginButtonText: '' },
  blocks: []
};

// --- Componente Principal ---
const SiteEditor: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const [siteData, setSiteData] = useState<SiteData>(defaultSiteData);
  const [savedSiteData, setSavedSiteData] = useState<SiteData>(defaultSiteData);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'success'>('loading');
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const { token } = useAuth();

  const fetchContent = useCallback(async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/site/content');
        if (!response.ok) throw new Error('Falha na resposta da rede');
        const data = await response.json();
        const initialContent = data.content || defaultSiteData;
        setSiteData(initialContent);
        setSavedSiteData(initialContent);
        setStatus('idle');
      } catch (error) {
        console.error("Falha ao buscar conteúdo:", error);
        setStatus('error');
      }
  }, []);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  const handleAddBlock = (type: PageBlock['type']) => {
    let newBlock: PageBlock;
    const id = generateId();
    switch (type) {
        case 'hero': newBlock = { id, type, content: { title: 'Novo Título de Herói', subtitle: 'Um subtítulo atraente.', ctaText: 'Saiba Mais' } }; break;
        case 'text': newBlock = { id, type, content: { heading: 'Nova Seção', body: 'Texto padrão.' } }; break;
        case 'image': newBlock = { id, type, content: { imageUrl: 'https://via.placeholder.com/1200x600.png/1e293b/94a3b8?text=Imagem+Espa%C3%A7o+Reservado', altText: 'Imagem de Exemplo' } }; break;
        case 'button': newBlock = { id, type, content: { text: 'Clique Aqui', link: '#' } }; break;
    }
    setSiteData(prev => ({ ...prev, blocks: [...prev.blocks, newBlock] }));
    setSelectedId(newBlock.id);
  };
  
  const handleUpdateBlock = (updatedBlock: PageBlock) => {
    setSiteData(prev => ({
        ...prev,
        blocks: prev.blocks.map(b => b.id === updatedBlock.id ? updatedBlock : b)
    }));
  };

  const handleDeleteBlock = (idToDelete: string) => { 
    if (selectedId === idToDelete) setSelectedId(null); 
    setSiteData(prev => ({ ...prev, blocks: prev.blocks.filter(b => b.id !== idToDelete) }));
  };

  const handleSettingsChange = (field: keyof SiteSettings, value: string) => {
    setSiteData(prev => ({ ...prev, settings: { ...prev.settings, [field]: value } }));
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    const items = Array.from(siteData.blocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setSiteData(prev => ({ ...prev, blocks: items }));
  };
  
  const handleSaveChanges = async () => {
    setStatus('saving');
    try {
        const response = await fetch('/api/site/content', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({ content: siteData })
        });
        if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar');
        setSavedSiteData(siteData);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
        console.error(error);
        setStatus('error');
    }
  };

  const selectedBlock = siteData.blocks.find(b => b.id === selectedId);
  const hasUnsavedChanges = JSON.stringify(siteData) !== JSON.stringify(savedSiteData);

  return (
    <div className="flex flex-col h-screen bg-slate-900 text-slate-300 font-sans">
      {/* HEADER DEDICADO */}
      <header className="bg-slate-900/80 backdrop-blur-sm z-40 border-b border-slate-800 flex items-center justify-between h-16 px-6 flex-shrink-0">
          <div className="flex items-center gap-4">
              <button
                onClick={onBack}
                className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white
                           font-bold py-2 px-4 rounded-lg inline-flex items-center
                           transition-colors duration-200 border border-slate-700"
              >
                <ArrowLeftIcon className="w-5 h-5 mr-2" />
                <span>Painel</span>
              </button>
              <h2 className="text-xl font-bold text-slate-100">Editor de Site</h2>
          </div>
      </header>

      {/* CORPO DO EDITOR */}
      <div className="flex-1 relative overflow-hidden">
        {/* PAINEL LATERAL DE EDIÇÃO */}
        <aside className={`absolute top-0 left-0 h-full bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 z-20 transition-transform duration-300 ease-in-out ${isPanelOpen ? 'translate-x-0' : '-translate-x-full'} w-full max-w-sm`}>
          <div className="h-full flex flex-col">
              <div className="flex-grow overflow-y-auto">
                  {selectedBlock ? (
                      <Inspector block={selectedBlock} onUpdate={handleUpdateBlock} onBack={() => setSelectedId(null)} />
                  ) : (
                      <div className="p-4">
                          <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Configurações Gerais</h3>
                           <div className="space-y-4 mb-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Marca</label>
                                    <input value={siteData.settings.brandName} onChange={e => handleSettingsChange('brandName', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-1">Texto do Botão de Login</label>
                                    <input value={siteData.settings.loginButtonText} onChange={e => handleSettingsChange('loginButtonText', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
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
        {/* BOTÃO PARA MINIMIZAR/EXPANDIR O PAINEL */}
        <button onClick={() => setIsPanelOpen(!isPanelOpen)} className="absolute top-1/2 -translate-y-1/2 bg-slate-800 hover:bg-cyan-600 text-white p-2 rounded-r-lg z-20 transition-transform duration-300 ease-in-out" style={{ left: isPanelOpen ? '24rem' : '0' }}>
              {isPanelOpen ? <ChevronLeftIcon className="w-5 h-5"/> : <ChevronRightIcon className="w-5 h-5"/>}
        </button>


        {/* CANVAS PRINCIPAL (VISUALIZAÇÃO) */}
        <main className="flex-1 overflow-y-auto bg-slate-900 transition-all duration-300 ease-in-out" style={{ paddingLeft: isPanelOpen ? '25rem' : '3rem', paddingRight: '1rem' }}>
          {status === 'loading' && <p className="text-center py-20">Carregando conteúdo...</p>}
          {status === 'error' && !hasUnsavedChanges && <p className="text-red-400 text-center py-20">Erro ao carregar. Por favor, recarregue.</p>}
          
          <DragDropContext onDragEnd={onDragEnd}>
              <StrictModeDroppable droppableId="canvas">
                  {(provided) => (
                      <div {...provided.droppableProps} ref={provided.innerRef} className="py-8 space-y-4">
                          {siteData.blocks.map((block, index) => (
                              <Draggable key={block.id} draggableId={block.id} index={index}>
                                  {(provided, snapshot) => (
                                      <div 
                                          ref={provided.innerRef} 
                                          {...provided.draggableProps} 
                                          {...provided.dragHandleProps}
                                          onClick={() => { setSelectedId(block.id); setIsPanelOpen(true); }}
                                          className={`relative rounded-lg ring-2 transition-all cursor-pointer ${selectedId === block.id ? 'ring-cyan-500' : 'ring-transparent hover:ring-slate-600'} ${snapshot.isDragging ? 'shadow-2xl shadow-cyan-900/50 opacity-80' : ''}`}
                                      >
                                          <div className="absolute top-2 right-2 z-10 flex gap-1 opacity-0 hover:opacity-100 transition-opacity">
                                              <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="p-1.5 bg-red-800/80 hover:bg-red-700 rounded-md text-white"><Trash2Icon className="w-4 h-4" /></button>
                                          </div>
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
          {siteData.blocks.length === 0 && status === 'idle' && (
              <div className="text-center py-20 text-slate-500">
                  <p>Sua página está vazia.</p>
                  <p>Use o painel lateral para adicionar seu primeiro componente.</p>
              </div>
          )}
        </main>

        {/* BARRA DE AÇÕES INFERIOR */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-slate-900/80 backdrop-blur-sm border-t border-slate-700 z-30 flex justify-between items-center">
              <div>
                  {hasUnsavedChanges && status !== 'error' && (
                      <div className="text-yellow-400 text-sm font-semibold">Alterações não salvas</div>
                  )}
                  {status === 'success' && (
                      <div className="text-green-400 text-sm font-semibold">Salvo com sucesso!</div>
                  )}
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
    </div>
  );
};

export default SiteEditor;