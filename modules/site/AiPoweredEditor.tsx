

import React, { useState, useEffect } from 'react';
import { DragDropContext, Droppable, Draggable, OnDragEndResponder } from 'react-beautiful-dnd';
import { Page, SiteData, PageBlock, Section } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, SaveIcon, EyeIcon, SeoIcon } from '../../components/icons/Icons';
import PublicSite from './PublicSite';
import SEOModal from './components/SEOModal';

const EditPanel: React.FC<{
    block: PageBlock;
    onUpdate: (field: string, value: any) => void;
    onClose: () => void;
}> = ({ block, onUpdate, onClose }) => {
    
    const renderContentFields = () => {
        switch (block.type) {
            case 'hero': return ( <> <label>Título</label> <input type="text" value={block.content.title.text} onChange={e => onUpdate('title', { ...block.content.title, text: e.target.value })}/> <label>Subtítulo</label> <textarea value={block.content.subtitle.text} onChange={e => onUpdate('subtitle', { ...block.content.subtitle, text: e.target.value })}/> </> );
            case 'text': return ( <> <label>Cabeçalho</label> <input type="text" value={block.content.heading.text} onChange={e => onUpdate('heading', { ...block.content.heading, text: e.target.value })}/> <label>Corpo</label> <textarea value={block.content.body.text} onChange={e => onUpdate('body', { ...block.content.body, text: e.target.value })}/> </> );
            case 'image': return ( <> <label>URL da Imagem</label> <input type="text" value={block.content.imageUrl} onChange={e => onUpdate('imageUrl', e.target.value)}/> <label>Texto Alternativo</label> <input type="text" value={block.content.altText} onChange={e => onUpdate('altText', e.target.value)}/> </> );
            default: return <p className="text-sm text-slate-400">Este tipo de bloco não possui conteúdo editável.</p>;
        }
    };

    return (
        <div className="fixed top-16 right-0 h-[calc(100vh-64px)] w-80 bg-slate-900 border-l border-slate-700 z-[1000] p-4 flex flex-col text-sm">
            <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold text-lg">Editar Bloco</h3>
                <button onClick={onClose} className="p-1 text-slate-400 hover:text-white">&times;</button>
            </div>
            <div className="space-y-3 overflow-y-auto">
                {Object.entries(block.content).map(([key, value]) => {
                    if (typeof value === 'string') {
                         return (
                            <div key={key}>
                                <label className="capitalize block text-slate-400 mb-1">{key}</label>
                                <input 
                                    type="text" 
                                    value={value} 
                                    onChange={e => onUpdate(key, e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                                />
                            </div>
                        );
                    }
                    if (typeof value === 'object' && value && 'text' in value) {
                         return (
                            <div key={key}>
                                <label className="capitalize block text-slate-400 mb-1">{key}</label>
                                <textarea
                                    value={(value as any).text}
                                    onChange={e => onUpdate(key, { ...(value as any), text: e.target.value })}
                                    className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                                    rows={3}
                                />
                            </div>
                        );
                    }
                    return null;
                })}
            </div>
        </div>
    );
};

const AiPoweredEditor: React.FC<{ slug: string }> = ({ slug }) => {
    const { token } = useAuth();
    const [pageData, setPageData] = useState<Page | null>(null);
    const [savedPageData, setSavedPageData] = useState<Page | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error' | 'saving'>('loading');
    const [selectedBlock, setSelectedBlock] = useState<PageBlock | null>(null);
    const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);

    const hasUnsavedChanges = JSON.stringify(pageData) !== JSON.stringify(savedPageData);

    useEffect(() => {
        const fetchContent = async () => {
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
        };

        if (token) { fetchContent(); }
    }, [slug, token]);
    
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

    const onDragEnd: OnDragEndResponder = (result) => {
        const { source, destination, type } = result;
        if (!destination || !pageData || !pageData.content) return;

        let newContent = JSON.parse(JSON.stringify(pageData.content));

        if (type === 'SECTIONS') {
            const [reorderedItem] = newContent.sections.splice(source.index, 1);
            newContent.sections.splice(destination.index, 0, reorderedItem);
        } else if (type.startsWith('BLOCKS_')) {
            const sectionId = type.split('_')[1];
            const section = newContent.sections.find((s: Section) => s.id === sectionId);
            if (section) {
                const [reorderedItem] = section.blocks.splice(source.index, 1);
                section.blocks.splice(destination.index, 0, reorderedItem);
            }
        }
        setPageData({ ...pageData, content: newContent });
    };

    // FIX: Refactor handleBlockUpdate to be type-safe by cloning the entire page data,
    // applying the update, and then setting both pageData and selectedBlock from the
    // new consistent data structure, resolving the discriminated union type error.
    const handleBlockUpdate = (field: string, value: any) => {
        if (!selectedBlock || !pageData || !pageData.content) return;
        
        // Deep clone the entire pageData to avoid mutation
        const newPageData = JSON.parse(JSON.stringify(pageData)) as Page;
        let updatedBlockFromClone: PageBlock | null = null;
        
        const findAndApplyUpdate = (sections: Section[]) => {
            for (const section of sections) {
                const block = section.blocks.find(b => b.id === selectedBlock.id);
                if (block) {
                    (block.content as any)[field] = value;
                    updatedBlockFromClone = block;
                    return true;
                }
            }
            return false;
        }

        // Apply update to the cloned data
        if(newPageData.content && (findAndApplyUpdate(newPageData.content.sections) || findAndApplyUpdate(newPageData.content.footerSections))){
            // Set the state with the new, fully-formed objects
            setPageData(newPageData);
            if (updatedBlockFromClone) {
                setSelectedBlock(updatedBlockFromClone);
            }
        }
    };

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando editor...</div>;
    if (status === 'not_found' || status === 'error' || !pageData) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400"><h1>Erro ao carregar a página.</h1></div>;

    return (
        <DragDropContext onDragEnd={onDragEnd}>
            <div className="min-h-screen" style={{ backgroundColor: pageData.content?.settings.backgroundColor, paddingTop: '64px', paddingRight: selectedBlock ? '320px' : '0' }}>
                {/* Top Toolbar */}
                <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 z-[1001] flex items-center justify-between px-4">
                    <div className="flex items-center gap-4">
                        <button onClick={() => { window.location.hash = '/administrator/SITE' }} className="flex items-center gap-2 text-slate-300 hover:text-white"><ArrowLeftIcon className="w-5 h-5" /> Sair</button>
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
                <Droppable droppableId="sections" type="SECTIONS">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="p-4 space-y-4">
                            {pageData.content?.sections.map((section, index) => (
                                <Draggable key={section.id} draggableId={section.id} index={index}>
                                    {(provided) => (
                                        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} className="p-2 border-2 border-dashed border-slate-700 rounded-lg hover:border-cyan-500">
                                            <Droppable droppableId={section.id} type={`BLOCKS_${section.id}`}>
                                                {(provided) => (
                                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                                        {section.blocks.map((block, index) => (
                                                            <Draggable key={block.id} draggableId={block.id} index={index}>
                                                                {(provided) => (
                                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} onClick={() => setSelectedBlock(block)} className="p-2 my-2 border border-slate-800 bg-slate-800/50 rounded cursor-pointer hover:border-cyan-600">
                                                                        <strong className="text-cyan-400">{block.type}</strong>: {(block.content as any).title?.text || (block.content as any).heading?.text || "Bloco sem título"}
                                                                    </div>
                                                                )}
                                                            </Draggable>
                                                        ))}
                                                        {provided.placeholder}
                                                    </div>
                                                )}
                                            </Droppable>
                                        </div>
                                    )}
                                </Draggable>
                            ))}
                            {provided.placeholder}
                        </div>
                    )}
                </Droppable>
                
                {/* Editor Panel */}
                {selectedBlock && <EditPanel block={selectedBlock} onUpdate={handleBlockUpdate} onClose={() => setSelectedBlock(null)} />}
                {isSeoModalOpen && <SEOModal pageData={pageData} setPageData={setPageData} onClose={() => setIsSeoModalOpen(false)} />}
            </div>
        </DragDropContext>
    );
};

export default AiPoweredEditor;