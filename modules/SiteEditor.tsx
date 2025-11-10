import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';
import { PageBlock } from '../types.js';
import { useAuth } from '../contexts/AuthContext.js';
import { PlusCircleIcon, SettingsIcon, Trash2Icon, MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon } from '../components/icons/Icons.js';

// Um gerador de ID simples
const generateId = () => `block_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// --- Componentes para a Tela de Edição ---

const renderBlock = (block: PageBlock) => {
  switch (block.type) {
    case 'hero':
      return (
        <div className="text-center py-16 px-6 bg-slate-800/50 rounded-lg">
          <h1 className="text-4xl font-bold text-white mb-3">{block.content.title}</h1>
          <p className="text-md text-slate-400 max-w-2xl mx-auto mb-6">{block.content.subtitle}</p>
          <button className="bg-cyan-600 text-white font-bold py-2 px-6 rounded-full cursor-not-allowed">{block.content.ctaText}</button>
        </div>
      );
    case 'text':
       return (
        <div className="py-8 px-6 text-left">
          <h2 className="text-2xl font-bold text-white mb-2">{block.content.heading}</h2>
          <p className="text-slate-400 whitespace-pre-wrap">{block.content.body}</p>
        </div>
      );
    case 'image':
      return (
         <div className="py-4 px-6">
            <img src={block.content.imageUrl} alt={block.content.altText} className="rounded-lg max-w-full h-auto mx-auto" />
         </div>
      );
    case 'button':
        return (
            <div className="py-4 px-6 text-center">
                <a href={block.content.link} onClick={e => e.preventDefault()} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-6 rounded-lg inline-block cursor-pointer">
                    {block.content.text}
                </a>
            </div>
        );
    default:
      return null;
  }
};


// --- Componentes para o Inspetor ---

const Inspector: React.FC<{ block: PageBlock; onUpdate: (updatedBlock: PageBlock) => void; }> = ({ block, onUpdate }) => {
    const handleContentChange = (field: string, value: string) => {
        // FIX: Faz o cast do bloco atualizado para PageBlock para resolver o erro de tipo de união discriminada.
        onUpdate({ ...block, content: { ...block.content, [field]: value } } as PageBlock);
    };

    const blockTypeTranslations: Record<string, string> = {
        hero: 'Herói',
        text: 'Texto',
        image: 'Imagem',
        button: 'Botão'
    };

    const translatedBlockType = blockTypeTranslations[block.type] || block.type.charAt(0).toUpperCase() + block.type.slice(1);

    const renderInspectorFields = () => {
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
                const addonLinks = [
                    { name: 'Loja', path: '#/store' },
                    { name: 'Suporte', path: '#/support'}
                ];
                return (
                     <>
                        <label className="block text-sm font-medium text-slate-400 mb-1">Texto do Botão</label>
                        <input value={block.content.text} onChange={e => handleContentChange('text', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
                        <label className="block text-sm font-medium text-slate-400 mt-4 mb-1">URL do Link</label>
                        <input value={block.content.link} onChange={e => handleContentChange('link', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 mb-2" />
                        <select onChange={e => handleContentChange('link', e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2">
                            <option value="">Ou selecione uma página do site...</option>
                            {addonLinks.map(link => <option key={link.path} value={link.path}>{link.name}</option>)}
                        </select>
                    </>
                );
            default: return null;
        }
    };
    
    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-cyan-400 flex items-center gap-2"><SettingsIcon className="w-5 h-5"/> Editar {translatedBlockType}</h3>
            {renderInspectorFields()}
        </div>
    );
};

// --- Componente Principal do Editor de Site ---

const SiteEditor: React.FC = () => {
  const [currentPageBlocks, setCurrentPageBlocks] = useState<PageBlock[]>([]);
  const [savedPageBlocks, setSavedPageBlocks] = useState<PageBlock[]>([]);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'saving' | 'error' | 'success'>('loading');
  const { token } = useAuth();

  useEffect(() => {
    const fetchPageContent = async () => {
      setStatus('loading');
      try {
        const response = await fetch('/api/site/content');
        if (!response.ok) throw new Error('A resposta da rede não foi ok');
        const data = await response.json();
        const initialContent = data.content || [];
        setCurrentPageBlocks(initialContent);
        setSavedPageBlocks(initialContent);
        setStatus('idle');
      } catch (error) {
        console.error("Falha ao buscar o conteúdo da página:", error);
        setStatus('error');
      }
    };
    fetchPageContent();
  }, []);

  const handleAddBlock = (type: PageBlock['type']) => {
    let newBlock: PageBlock;
    const id = generateId();
    switch (type) {
        case 'hero':
            newBlock = { id, type, content: { title: 'Novo Título de Herói', subtitle: 'Um subtítulo atraente.', ctaText: 'Saiba Mais' } };
            break;
        case 'text':
            newBlock = { id, type, content: { heading: 'Nova Seção', body: 'Texto padrão.' } };
            break;
        case 'image':
            newBlock = { id, type, content: { imageUrl: 'https://via.placeholder.com/800x400.png/1e293b/94a3b8?text=Nova+Imagem', altText: 'Imagem de Exemplo' } };
            break;
        case 'button':
            newBlock = { id, type, content: { text: 'Clique Aqui', link: '#' } };
            break;
    }
    setCurrentPageBlocks([...currentPageBlocks, newBlock]);
    setSelectedBlockId(newBlock.id);
  };
  
  const handleUpdateBlock = (updatedBlock: PageBlock) => {
    setCurrentPageBlocks(currentPageBlocks.map(b => b.id === updatedBlock.id ? updatedBlock : b));
  };
  
  const handleDeleteBlock = (idToDelete: string) => {
      if (selectedBlockId === idToDelete) {
          setSelectedBlockId(null);
      }
      setCurrentPageBlocks(currentPageBlocks.filter(b => b.id !== idToDelete));
  };

  const onDragEnd: OnDragEndResponder = (result) => {
    if (!result.destination) return;
    const items = Array.from(currentPageBlocks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setCurrentPageBlocks(items);
  };

  const handlePreview = () => {
    localStorage.setItem('sitePreviewContent', JSON.stringify(currentPageBlocks));
    window.open('#/preview', '_blank');
  };
  
  const handleSaveChanges = async () => {
    setStatus('saving');
    try {
        const response = await fetch('/api/site/content', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ content: currentPageBlocks })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar o conteúdo');
        }
        
        setSavedPageBlocks(currentPageBlocks);
        setStatus('success');
        setTimeout(() => setStatus('idle'), 2000); // Volta para o estado idle após 2s
    } catch (error) {
        console.error(error);
        setStatus('error');
    }
  };

  const handleRevertChanges = () => {
    if (window.confirm('Você tem certeza que deseja reverter todas as alterações não salvas?')) {
        setCurrentPageBlocks(savedPageBlocks);
        setStatus('idle');
    }
  };

  const selectedBlock = currentPageBlocks.find(b => b.id === selectedBlockId);
  const hasUnsavedChanges = JSON.stringify(currentPageBlocks) !== JSON.stringify(savedPageBlocks);

  return (
    <div className="flex h-[calc(100vh-150px)] bg-slate-900 text-slate-300 rounded-lg border border-slate-700">
      {/* Barra Lateral */}
      <aside className="w-1/3 max-w-sm min-w-[300px] bg-slate-800/50 border-r border-slate-700 flex flex-col">
        {selectedBlock ? (
          <Inspector block={selectedBlock} onUpdate={handleUpdateBlock} />
        ) : (
          <div className="p-4">
            <h3 className="text-lg font-bold text-cyan-400 mb-4 flex items-center gap-2"><PlusCircleIcon className="w-5 h-5"/> Adicionar Componente</h3>
            <div className="space-y-2">
                <button onClick={() => handleAddBlock('hero')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md"><MotorcycleIcon className="w-5 h-5 text-cyan-400"/> Seção de Herói</button>
                <button onClick={() => handleAddBlock('text')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md"><TypeIcon className="w-5 h-5 text-cyan-400"/> Bloco de Texto</button>
                <button onClick={() => handleAddBlock('image')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md"><ImageIcon className="w-5 h-5 text-cyan-400"/> Imagem</button>
                <button onClick={() => handleAddBlock('button')} className="w-full flex items-center gap-3 p-3 bg-slate-700 hover:bg-slate-600 rounded-md"><CodeIcon className="w-5 h-5 text-cyan-400"/> Botão</button>
            </div>
          </div>
        )}
        <div className="mt-auto p-4 border-t border-slate-700 space-y-3">
            {hasUnsavedChanges && status !== 'error' && (
                <div className="text-center text-yellow-400 text-sm p-2 bg-yellow-500/10 rounded-md">
                    Você tem alterações não salvas (Prévia de edição).
                </div>
            )}
             {status === 'success' && (
                <div className="text-center text-green-400 text-sm p-2 bg-green-500/10 rounded-md">
                    Alterações salvas com sucesso!
                </div>
            )}
            {status === 'error' && (
                <div className="text-center text-red-400 text-sm p-3 bg-red-500/10 rounded-md space-y-2">
                    <p className="font-bold">Falha ao salvar!</p>
                    <p>Suas alterações foram preservadas. Verifique sua conexão e tente novamente ou reverta para a última versão salva.</p>
                    <div className="flex justify-center gap-3 pt-2">
                        <button onClick={handleSaveChanges} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">
                            Tentar Novamente
                        </button>
                        <button onClick={handleRevertChanges} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg">
                            Reverter Alterações
                        </button>
                    </div>
                </div>
            )}

            <div className="flex justify-end gap-3">
                <button onClick={handlePreview} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">Visualizar</button>
                <button 
                    onClick={handleSaveChanges} 
                    disabled={!hasUnsavedChanges || status === 'saving' || status === 'error'} 
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    {status === 'saving' ? 'Salvando...' : 'Salvar Alterações'}
                </button>
            </div>
        </div>
      </aside>

      {/* Tela de Edição */}
      <main className="flex-1 overflow-y-auto p-4 bg-slate-900">
        <div className="max-w-4xl mx-auto bg-slate-800/30 rounded-lg p-2">
           {status === 'loading' && <p>Carregando conteúdo...</p>}
           {status === 'error' && !hasUnsavedChanges && <p className="text-red-400">Erro ao carregar o conteúdo. Por favor, recarregue a página.</p>}
           <DragDropContext onDragEnd={onDragEnd}>
                <Droppable droppableId="canvas">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-2">
                            {currentPageBlocks.map((block, index) => (
                                <Draggable key={block.id} draggableId={block.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div 
                                            ref={provided.innerRef} 
                                            {...provided.draggableProps} 
                                            {...provided.dragHandleProps}
                                            onClick={() => setSelectedBlockId(block.id)}
                                            className={`border-2 rounded-lg relative transition-all
                                                ${selectedBlockId === block.id ? 'border-cyan-500' : 'border-transparent hover:border-slate-600'}
                                                ${snapshot.isDragging ? 'shadow-2xl shadow-cyan-900/50' : ''}`
                                            }
                                        >
                                            <div className="absolute top-2 right-2 z-10 flex gap-1">
                                                <button onClick={(e) => { e.stopPropagation(); handleDeleteBlock(block.id); }} className="p-1.5 bg-red-800/80 hover:bg-red-700 rounded-md text-white"><Trash2Icon className="w-4 h-4" /></button>
                                            </div>
                                            {renderBlock(block)}
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
           </DragDropContext>
        </div>
      </main>
    </div>
  );
};

export default SiteEditor;