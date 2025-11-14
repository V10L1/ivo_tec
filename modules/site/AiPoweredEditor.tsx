import React, { useState, useEffect, useCallback } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';
import { Page, PageBlock, Section, Selection } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, SaveIcon, EyeIcon, SeoIcon, XCircleIcon, TypeIcon, PaletteIcon } from '../../components/icons/Icons';
import PublicSite from './PublicSite';
import SEOModal from './components/SEOModal';
import { createNewBlock } from './utils/defaults';
import BlockRenderer from './components/BlockRenderer';
import ContentPanel from './components/panels/ContentPanel';
import StylePanel from './components/panels/StylePanel';
import ThemePanel from './components/panels/ThemePanel';


// --- Painel Lateral Principal ---
const EditorSidePanel: React.FC<{
    selection: Selection;
    pageData: Page;
    onClose: () => void;
    onUpdateBlock: (updatedBlock: PageBlock, sectionId: string) => void;
    onUpdateTheme: (updatedTheme: Page['content']['theme']) => void;

}> = ({ selection, pageData, onClose, onUpdateBlock, onUpdateTheme }) => {
    const [activeTab, setActiveTab] = useState('content');
    
    useEffect(() => {
        if (selection?.type === 'block') {
            setActiveTab('content');
        }
    }, [selection]);

    const renderContent = () => {
        if (!selection) {
            return <ThemePanel theme={pageData.content.theme} onUpdateTheme={onUpdateTheme} />;
        }

        if (selection.type === 'block') {
            const section = pageData.content.sections.find(s => s.id === selection.sectionId);
            const block = section?.blocks.find(b => b.id === selection.id);
            if (!block) return null;

            return (
                <>
                    <div className="p-4 border-b border-slate-700 flex-shrink-0">
                        <h4 className="font-bold text-lg text-cyan-400 capitalize">{block.type} Block</h4>
                         <div className="flex items-center gap-2 mt-2">
                            <button onClick={() => setActiveTab('content')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'content' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Conteúdo</button>
                            <button onClick={() => setActiveTab('style')} className={`px-3 py-1 text-sm rounded-md ${activeTab === 'style' ? 'bg-cyan-600 text-white' : 'bg-slate-700 text-slate-300'}`}>Estilo</button>
                         </div>
                    </div>
                    {activeTab === 'content' && <ContentPanel block={block} sectionId={selection.sectionId} onUpdateBlock={onUpdateBlock} />}
                    {activeTab === 'style' && <StylePanel block={block} sectionId={selection.sectionId} onUpdateBlock={onUpdateBlock} theme={pageData.content.theme} />}
                </>
            );
        }
        // TODO: Adicionar painel de edição de seção aqui
        return <div className="p-4 text-slate-400">Edição de seção ainda não implementada.</div>;
    };

    return (
        <div className="fixed top-16 right-0 h-[calc(100vh-64px)] w-80 bg-slate-900 border-l border-slate-700 z-[1000] flex flex-col text-sm shadow-2xl">
            <div className="flex justify-between items-center p-4 border-b border-slate-700 flex-shrink-0">
                <h3 className="font-bold text-lg text-white">{selection ? 'Inspetor' : 'Tema Global'}</h3>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white" title="Fechar painel">
                    <XCircleIcon className="w-6 h-6"/>
                </button>
            </div>
            <div className="flex-grow overflow-y-auto">
                {renderContent()}
            </div>
        </div>
    );
};


// --- Componente Editor Principal ---
const AiPoweredEditor: React.FC<{ slug: string }> = ({ slug }) => {
    const { token } = useAuth();
    const [pageData, setPageData] = useState<Page | null>(null);
    const [savedPageData, setSavedPageData] = useState<Page | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error' | 'saving'>('loading');
    const [selection, setSelection] = useState<Selection>(null);
    const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);
    const [isSidePanelOpen, setIsSidePanelOpen] = useState(true);

    const hasUnsavedChanges = JSON.stringify(pageData) !== JSON.stringify(savedPageData);

    const fetchContent = useCallback(async () => {
        setStatus('loading');
        try {
            const finalSlug = slug === '/' || slug === 'home' ? 'home' : slug;
            const endpoint = finalSlug === 'home' ? '/api/site/pages/admin/home' : `/api/site/pages/admin/slug/${finalSlug}`;
            const response = await fetch(endpoint, { headers: { 'Authorization': `Bearer ${token}` } });
            if (response.status === 404) { setStatus('not_found'); return; }
            if (!response.ok) throw new Error('A resposta da rede não foi ok');
            const data: Page = await response.json();
            setPageData(data);
            setSavedPageData(JSON.parse(JSON.stringify(data)));
            setStatus('success');
        } catch (error) {
            console.error("Falha ao buscar o conteúdo da página:", error);
            setStatus('error');
        }
    }, [slug, token]);

    useEffect(() => {
        if (token) { fetchContent(); }
    }, [slug, token, fetchContent]);
    
    const handleSaveChanges = async () => {
        if (!pageData) return;
        setStatus('saving');
        try {
            const response = await fetch(`/api/site/pages/${pageData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify(pageData) });
            if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar');
            const updatedPage = await response.json();
            setSavedPageData(JSON.parse(JSON.stringify(updatedPage)));
            setPageData(updatedPage);
        } catch (error) {
            console.error(error);
        } finally {
            setStatus('success');
        }
    };

    const updatePageData = (updater: (draft: Page) => void) => {
        setPageData(prev => {
            if (!prev) return null;
            const draft = JSON.parse(JSON.stringify(prev));
            updater(draft);
            return draft;
        });
    };

    const handleBlockUpdate = (updatedBlock: PageBlock, sectionId: string) => {
        updatePageData(draft => {
            const section = draft.content.sections.find(s => s.id === sectionId);
            if (section) {
                const blockIndex = section.blocks.findIndex(b => b.id === updatedBlock.id);
                if (blockIndex > -1) {
                    section.blocks[blockIndex] = updatedBlock;
                }
            }
        });
    };

    const handleThemeUpdate = (updatedTheme: Page['content']['theme']) => {
        updatePageData(draft => {
            draft.content.theme = updatedTheme;
        });
    };

    const onDragEnd: OnDragEndResponder = (result) => {
        const { source, destination } = result;
        if (!destination) return;

        // Movendo uma Seção
        if (source.droppableId === 'sections-droppable' && destination.droppableId === 'sections-droppable') {
            updatePageData(draft => {
                const [reorderedItem] = draft.content!.sections.splice(source.index, 1);
                draft.content!.sections.splice(destination.index, 0, reorderedItem);
            });
            return;
        }

        // Movendo um Bloco
        const sourceSectionId = source.droppableId.replace('blocks-droppable-', '');
        const destSectionId = destination.droppableId.replace('blocks-droppable-', '');
        
        updatePageData(draft => {
            const sourceSection = draft.content!.sections.find(s => s.id === sourceSectionId);
            const destSection = draft.content!.sections.find(s => s.id === destSectionId);
            if (!sourceSection || !destSection) return;

            // Movendo dentro da mesma seção
            if (sourceSectionId === destSectionId) {
                const [reorderedItem] = sourceSection.blocks.splice(source.index, 1);
                destSection.blocks.splice(destination.index, 0, reorderedItem);
            } else { // Movendo entre seções
                const [movedItem] = sourceSection.blocks.splice(source.index, 1);
                destSection.blocks.splice(destination.index, 0, movedItem);
            }
        });
    };
    
    const handleSelection = (newSelection: Selection) => {
        setSelection(newSelection);
        setIsSidePanelOpen(true);
    };

    const renderSectionWithEditorGrid = (section: Section, context: 'main' | 'footer') => (
        <Droppable droppableId={`blocks-droppable-${section.id}`} key={section.id}>
            {(provided, snapshot) => (
                <div 
                    {...provided.droppableProps} 
                    ref={provided.innerRef}
                    className={`relative border-2 border-dashed rounded-lg p-2 min-h-[100px] transition-colors ${snapshot.isDraggingOver ? 'border-cyan-500 bg-cyan-900/20' : 'border-slate-700'}`}
                >
                    <div className="absolute -top-3 -left-3 bg-slate-700 text-white text-xs px-2 py-1 rounded">Seção</div>
                    <PublicSite
                        pageData={pageData}
                        isEditing={true}
                        renderSectionWithEditorGrid={(s, c) => {
                             if (s.id !== section.id) return null; // Apenas renderiza a seção atual
                             return (
                                 <div 
                                     style={{ display: 'grid', gridTemplateColumns: `repeat(${s.gridSettings.columns}, 1fr)`, gridAutoRows: `${s.gridSettings.rowHeight}px`, gap: `${s.gridSettings.gap}px` }}
                                     className="relative"
                                     onClick={() => handleSelection(null)}
                                 >
                                     {s.blocks.map((block, index) => (
                                         <Draggable key={block.id} draggableId={block.id} index={index}>
                                             {(provided, snapshot) => (
                                                 <div
                                                     ref={provided.innerRef}
                                                     {...provided.draggableProps}
                                                     {...provided.dragHandleProps}
                                                     onClick={(e) => { e.stopPropagation(); handleSelection({ type: 'block', id: block.id, blockType: block.type, sectionId: s.id, context: 'main' }); }}
                                                     className={`relative group cursor-pointer border-2 ${selection?.type === 'block' && selection.id === block.id ? 'border-cyan-400' : 'border-transparent'} ${snapshot.isDragging ? 'shadow-2xl' : ''}`}
                                                     style={{
                                                         gridColumn: `${block.layout.desktop.colStart} / ${block.layout.desktop.colEnd}`,
                                                         gridRow: `${block.layout.desktop.rowStart} / ${block.layout.desktop.rowEnd}`,
                                                         ...provided.draggableProps.style
                                                     }}
                                                 >
                                                     <div className="absolute -top-3 left-0 bg-cyan-600 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity z-10">{block.type}</div>
                                                     <div className="w-full h-full pointer-events-none">
                                                        <BlockRenderer block={block} theme={pageData!.content!.theme} viewport="desktop" isEditing={true} />
                                                     </div>
                                                 </div>
                                             )}
                                         </Draggable>
                                     ))}
                                     {provided.placeholder}
                                 </div>
                             );
                        }}
                    />
                </div>
            )}
        </Droppable>
    );

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando editor...</div>;
    if (status === 'not_found' || status === 'error' || !pageData) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400"><h1>Erro ao carregar a página.</h1></div>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="min-h-screen" style={{ backgroundColor: pageData.content?.settings.backgroundColor, paddingTop: '64px', paddingRight: isSidePanelOpen ? '320px' : '0', transition: 'padding-right 0.3s ease' }}>
                {/* Top Toolbar */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 z-[1001] flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { window.location.hash = '/administrator' }} className="flex items-center gap-2 text-slate-300 hover:text-white"><ArrowLeftIcon className="w-5 h-5" /> Sair</button>
                        <span className="text-slate-500">|</span>
                        <h2 className="text-lg font-bold text-white truncate">{pageData.title}</h2>
                        <button onClick={() => setIsSeoModalOpen(true)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><SeoIcon className="w-4 h-4"/> SEO</button>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`text-sm transition-opacity duration-300 ${hasUnsavedChanges ? 'text-yellow-400 opacity-100' : 'text-slate-500 opacity-0'}`}>Alterações não salvas</span>
                        <a href={`#${pageData.is_homepage ? '/' : `/${pageData.slug}`}`} target="_blank" rel="noopener noreferrer" className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2"><EyeIcon className="w-5 h-5" /> Visualizar</a>
                        <button onClick={handleSaveChanges} disabled={!hasUnsavedChanges || status === 'saving'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 disabled:bg-slate-600 disabled:cursor-not-allowed">
                            <SaveIcon className="w-5 h-5" />
                            {status === 'saving' ? 'Salvando...' : 'Salvar'}
                        </button>
                    </div>
                </div>

                {/* Canvas */}
                <div className="p-4" onClick={() => handleSelection(null)}>
                    <Droppable droppableId="sections-droppable">
                        {(provided) => (
                            <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-4">
                                {pageData.content?.sections.map((section, index) => (
                                    <Draggable key={section.id} draggableId={section.id} index={index}>
                                        {(provided) => (
                                            <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}>
                                                {renderSectionWithEditorGrid(section, 'main')}
                                            </div>
                                        )}
                                    </Draggable>
                                ))}
                                {provided.placeholder}
                            </div>
                        )}
                    </Droppable>
                </div>
                
                {/* Painel Lateral */}
                {isSidePanelOpen && <EditorSidePanel selection={selection} pageData={pageData} onClose={() => setIsSidePanelOpen(false)} onUpdateBlock={handleBlockUpdate} onUpdateTheme={handleThemeUpdate}/>}
                
                {/* Modal de SEO */}
                {isSeoModalOpen && <SEOModal pageData={pageData} setPageData={setPageData} onClose={() => setIsSeoModalOpen(false)} />}
            </div>
        </DragDropContext>
    );
};

export default AiPoweredEditor;