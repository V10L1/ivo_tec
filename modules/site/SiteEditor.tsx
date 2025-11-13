

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, SiteData, PageBlock, Section, Selection, Viewport } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowLeftIcon, SaveIcon, EyeIcon, DesktopIcon, TabletIcon, SmartphoneIcon, SeoIcon, ChevronLeftIcon, ChevronRightIcon } from '../../components/icons/Icons';
import PublicSite from './PublicSite'; // O visualizador público
import EditorSidePanel from './components/EditorSidePanel';
import SEOModal from './components/SEOModal';
import useSiteEditor from './hooks/useSiteEditor';
import InteractiveBlock from './components/InteractiveBlock';

const SiteEditor: React.FC<{ slug: string }> = ({ slug }) => {
    const { token } = useAuth();
    const {
        pageData,
        setPageData,
        status,
        setStatus,
        feedback,
        handleFeedback,
        viewport,
        setViewport,
        selection,
        handleSelect,
        updatePageData,
        handleSaveChanges,
        hasUnsavedChanges,
        interactionState,
        ghostElement,
        ghostPosition,
        dropTarget,
        dragPreview,
        handleComponentMouseDown,
        handleBlockMouseDown,
        handleResizeStart,
    } = useSiteEditor(slug, token);

    const [isPanelOpen, setIsPanelOpen] = useState(true);
    const [isSeoModalOpen, setIsSeoModalOpen] = useState(false);

    if (status === 'loading') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando editor...</div>;
    if (status === 'not_found') return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white"><h1>404 - Página Não Encontrada</h1></div>;
    if (status === 'error' || !pageData || !pageData.content) return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400"><h1>Erro ao carregar o conteúdo para edição.</h1></div>;

    const { settings, theme } = pageData.content;
    const viewportWidth = viewport === 'tablet' ? 768 : viewport === 'mobile' ? 420 : undefined;
    
    const editorContainerStyle: React.CSSProperties = {
        paddingLeft: isPanelOpen ? '320px' : '0px',
        transition: 'padding-left 0.3s ease-in-out',
        paddingTop: '64px', // Space for the top toolbar
        width: '100%',
        backgroundColor: settings.backgroundColor
    };

    const canvasStyle: React.CSSProperties = {
        width: viewportWidth ? `${viewportWidth}px` : '100%',
        margin: '0 auto',
        transform: 'translateX(0)',
        transition: 'width 0.3s ease-in-out',
    };

    const renderSectionWithEditorGrid = (section: Section, context: 'main' | 'footer') => {
        const isSelected = selection?.type === 'section' && selection.id === section.id;
        return (
            <div
                key={section.id}
                id={section.id}
                data-section-id={section.id}
                data-context={context}
                data-index={(pageData.content?.[context === 'footer' ? 'footerSections' : 'sections'] || []).findIndex(s => s.id === section.id)}
                className={`relative group transition-all duration-200 p-4 border-2 border-dashed min-h-[100px] ${dropTarget?.sectionId === section.id && dropTarget?.context === context ? 'border-cyan-500 bg-cyan-900/20' : isSelected ? 'border-cyan-500' : 'border-slate-800 hover:border-cyan-500/50'}`}
                style={{ backgroundColor: section.styles.backgroundColor }}
                onClick={(e) => { e.stopPropagation(); handleSelect({ type: 'section', id: section.id, context }); }}
            >
                {/* Grid Overlay */}
                <div className="absolute inset-0 grid pointer-events-none" style={{ gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gap: `${section.gridSettings.gap}px`, padding: `${section.gridSettings.gap}px`}}>
                    {Array.from({ length: section.gridSettings.columns }).map((_, i) => <div key={i} className="bg-slate-700/10 rounded-sm"></div>)}
                </div>

                <div className="relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px`, height: '100%' }}>
                    {section.blocks.map(block => (
                        <InteractiveBlock
                            key={block.id}
                            block={block}
                            theme={theme}
                            viewport={viewport}
                            isSelected={selection?.type === 'block' && selection.id === block.id}
                            onBlockMouseDown={(e) => handleBlockMouseDown(e, block.id, section.id, context)}
                            onResizeStart={(e, dir) => handleResizeStart(e, block.id, section.id, context, dir)}
                        />
                    ))}
                    {dragPreview && dragPreview.sectionId === section.id && dragPreview.context === context && (
                        <div className="absolute bg-cyan-500/30 border-2 border-cyan-400 border-dashed rounded-lg pointer-events-none"
                             style={{
                                 gridColumn: `${dragPreview.layout.colStart} / ${dragPreview.layout.colEnd}`,
                                 gridRow: `${dragPreview.layout.rowStart} / ${dragPreview.layout.rowEnd}`,
                                 zIndex: 1000
                             }}
                        ></div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen" style={{ backgroundColor: settings.backgroundColor }}>
            {/* Top Toolbar */}
            <div className="fixed top-0 left-0 right-0 h-16 bg-slate-900/80 backdrop-blur-sm border-b border-slate-700 z-[1001] flex items-center justify-between px-4"
                 style={{ paddingLeft: isPanelOpen ? '336px' : '16px', transition: 'padding-left 0.3s ease-in-out' }}>
                <div className="flex items-center gap-4">
                    <button onClick={() => { window.location.hash = '/administrator/SITE' }} className="flex items-center gap-2 text-slate-300 hover:text-white"><ArrowLeftIcon className="w-5 h-5" /> Sair</button>
                    <span className="text-slate-500">|</span>
                    <h2 className="text-lg font-bold text-white truncate">{pageData.title}</h2>
                    <button onClick={() => setIsSeoModalOpen(true)} className="flex items-center gap-2 text-sm text-slate-300 hover:text-white"><SeoIcon className="w-4 h-4"/> SEO</button>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex rounded-md bg-slate-900 border border-slate-700 p-1">
                        {(['desktop', 'tablet', 'mobile'] as Viewport[]).map(vp => {
                            const Icon = { desktop: DesktopIcon, tablet: TabletIcon, mobile: SmartphoneIcon }[vp];
                            return <button key={vp} title={vp.charAt(0).toUpperCase() + vp.slice(1)} onClick={() => setViewport(vp)} className={`flex-1 p-1.5 rounded ${viewport === vp ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:bg-slate-700'}`}><Icon className="w-4 h-4 mx-auto"/></button>
                        })}
                    </div>
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

            {/* Side Panel */}
            <EditorSidePanel
                isOpen={isPanelOpen}
                setIsOpen={setIsPanelOpen}
                selection={selection}
                pageData={pageData}
                updatePageData={updatePageData}
                handleComponentMouseDown={handleComponentMouseDown}
                viewport={viewport}
            />

            {/* Main Editor Canvas */}
            <div style={editorContainerStyle}>
                 {ghostElement && <div className="fixed z-[10001] pointer-events-none opacity-80" style={{ left: ghostPosition.x, top: ghostPosition.y, transform: 'translate(10px, 10px)' }}>{ghostElement}</div>}
                 <div style={canvasStyle} onClick={() => handleSelect({ type: 'page' })}>
                    <PublicSite
                        pageData={pageData}
                        isEditing={true}
                        renderSectionWithEditorGrid={renderSectionWithEditorGrid}
                    />
                 </div>
            </div>
            
            {isSeoModalOpen && <SEOModal pageData={pageData} setPageData={setPageData} onClose={() => setIsSeoModalOpen(false)} />}
            {feedback && <div className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg text-white z-[10000] ${feedback.type === 'error' ? 'bg-red-600' : 'bg-green-600'}`}>{feedback.message}</div>}
        </div>
    );
};

export default SiteEditor;