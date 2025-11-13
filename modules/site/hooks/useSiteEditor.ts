

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Page, PageBlock, Section, Selection, Viewport, SiteData, BlockLayout, FixedContainerPosition } from '../../../types';
import { defaultPageContent, createNewBlock, createNewSection } from '../utils/defaults';

const useSiteEditor = (slug: string, token: string | null) => {
    const [pageData, setPageData] = useState<Page | null>(null);
    const [savedPageData, setSavedPageData] = useState<Page | null>(null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error' | 'saving'>('loading');
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    // Editor State
    const [viewport, setViewport] = useState<Viewport>('desktop');
    const [selection, setSelection] = useState<Selection>({ type: 'page' });

    // Drag and Drop State
    const [interactionState, setInteractionState] = useState<{ type: 'new_block' | 'new_section' | 'moving_block' | 'resizing_block'; item?: PageBlock | Section; blockId?: string; sectionId?: string; context?: 'main' | 'footer' | FixedContainerPosition; startPos: { x: number; y: number }; startLayout?: BlockLayout; resizeDirection?: string; } | null>(null);
    const [ghostElement, setGhostElement] = useState<React.ReactNode | null>(null);
    const [ghostPosition, setGhostPosition] = useState({ x: 0, y: 0 });
    const [dropTarget, setDropTarget] = useState<{ sectionId: string; context: 'main' | 'footer' | FixedContainerPosition; insertIndex?: number } | null>(null);
    const [dragPreview, setDragPreview] = useState<{ layout: BlockLayout; sectionId: string; context: 'main' | 'footer' | FixedContainerPosition } | null>(null);

    const hasUnsavedChanges = useMemo(() => JSON.stringify(pageData) !== JSON.stringify(savedPageData), [pageData, savedPageData]);

    const pageDataRef = useRef(pageData);
    const interactionStateRef = useRef(interactionState);
    const dropTargetRef = useRef(dropTarget);
    const viewportRef = useRef(viewport);

    useEffect(() => { pageDataRef.current = pageData; interactionStateRef.current = interactionState; dropTargetRef.current = dropTarget; viewportRef.current = viewport; });

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
                const validatedContent: SiteData = deepMerge(defaultPageContent, data.content || {});
                data.content = validatedContent;
                
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
    
    const handleFeedback = (type: 'error' | 'success', message: string) => { setFeedback({ type, message }); setTimeout(() => setFeedback(null), 4000); };
    const updatePageData = (updater: (draft: Page) => void, skipUnsavedChangesCheck = false) => { setPageData(prev => { if (!prev) return null; const draft = JSON.parse(JSON.stringify(prev)); updater(draft); if (skipUnsavedChangesCheck) { setSavedPageData(JSON.parse(JSON.stringify(draft))); } return draft; }); };
    
    const handleSaveChanges = async () => { if (!pageData) return; setStatus('saving'); try { const response = await fetch(`/api/site/pages/${pageData.id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }, body: JSON.stringify({ title: pageData.title, slug: pageData.slug, is_published: pageData.is_published, content: pageData.content, metaTitle: pageData.metaTitle, metaDescription: pageData.metaDescription, socialImageUrl: pageData.socialImageUrl }) }); if (!response.ok) throw new Error((await response.json()).message || 'Falha ao salvar'); const updatedPage = await response.json(); setSavedPageData(JSON.parse(JSON.stringify(updatedPage))); setPageData(updatedPage); handleFeedback('success', 'Salvo com sucesso!'); } catch (error: any) { handleFeedback('error', error.message || 'Falha ao salvar!'); } finally { setStatus('success'); } };
    const handleSelect = useCallback((newSelection: Selection) => setSelection(newSelection), []);

    const handleComponentMouseDown = (e: React.MouseEvent, type: 'block' | 'section', itemData: PageBlock['type'] | (() => Section), label: string, Icon: React.FC<any>) => { e.preventDefault(); e.stopPropagation(); const item = type === 'block' ? createNewBlock(itemData as PageBlock['type']) : (itemData as () => Section)(); setInteractionState({ type: type === 'block' ? 'new_block' : 'new_section', item, startPos: { x: e.clientX, y: e.clientY } }); setGhostElement( React.createElement('div', { className: "p-2 bg-slate-700 rounded flex items-center gap-2 pointer-events-none text-white shadow-lg" }, React.createElement(Icon, { className: "w-5 h-5 text-cyan-400" }), React.createElement('span', null, label) ) ); setGhostPosition({ x: e.clientX, y: e.clientY }); };
    const handleBlockMouseDown = (e: React.MouseEvent, blockId: string, sectionId: string, context: 'main' | 'footer') => { e.preventDefault(); e.stopPropagation(); const currentVP = viewportRef.current; const page = pageDataRef.current; if (!page?.content) return; const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === sectionId); const block = section?.blocks.find(b => b.id === blockId); if (!block) return; handleSelect({ type: 'block', id: blockId, sectionId, context, blockType: block.type }); setInteractionState({ type: 'moving_block', blockId, sectionId, context, startPos: { x: e.clientX, y: e.clientY }, startLayout: JSON.parse(JSON.stringify(block.layout[currentVP])) }); };
    const handleResizeStart = (e: React.MouseEvent, blockId: string, sectionId: string, context: 'main' | 'footer', direction: string) => { e.preventDefault(); e.stopPropagation(); const currentVP = viewportRef.current; const page = pageDataRef.current; if (!page?.content) return; const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === sectionId); const block = section?.blocks.find(b => b.id === blockId); if (!block) return; handleSelect({ type: 'block', id: blockId, sectionId, context, blockType: block.type }); setInteractionState({ type: 'resizing_block', blockId, sectionId, context, startPos: { x: e.clientX, y: e.clientY }, startLayout: JSON.parse(JSON.stringify(block.layout[currentVP])), resizeDirection: direction }); };

    const handleMouseMove = useCallback((e: MouseEvent) => {
        const currentInteraction = interactionStateRef.current;
        if (!currentInteraction) return;
        
        if (currentInteraction.type.startsWith('new_')) {
            setGhostPosition({ x: e.clientX, y: e.clientY });
            const allSectionElements = Array.from(document.querySelectorAll<HTMLElement>('[data-section-id]'));
            let currentTarget = null;
            for (const el of allSectionElements) {
                const rect = el.getBoundingClientRect();
                if (e.clientX >= rect.left && e.clientX <= rect.right && e.clientY >= rect.top && e.clientY <= rect.bottom) {
                     const context = el.dataset.context as 'main' | 'footer';
                    if (currentInteraction.type === 'new_section') {
                        const midY = rect.top + rect.height / 2;
                        const insertIndex = parseInt(el.dataset.index || '0') + (e.clientY < midY ? 0 : 1);
                        currentTarget = { sectionId: el.dataset.sectionId!, context, insertIndex };
                    } else {
                        currentTarget = { sectionId: el.dataset.sectionId!, context };
                    }
                    break;
                }
            }
             if (!currentTarget && allSectionElements.length === 0 && currentInteraction.type === 'new_section') {
                 currentTarget = { sectionId: 'main-canvas', context: 'main', insertIndex: 0 };
             }
            setDropTarget(currentTarget);
        } else { // Moving or Resizing
            const page = pageDataRef.current;
            if (!page?.content) return;
            const section = [...page.content.sections, ...page.content.footerSections].find(s => s.id === currentInteraction.sectionId);
            if (!section || !currentInteraction.startLayout) return;

            const gridEl = document.getElementById(section.id);
            if (!gridEl) return;

            const gridRect = gridEl.getBoundingClientRect();
            const colWidth = gridRect.width / section.gridSettings.columns;
            const rowHeight = section.gridSettings.rowHeight + section.gridSettings.gap;
            
            const deltaX = e.clientX - currentInteraction.startPos.x;
            const deltaY = e.clientY - currentInteraction.startPos.y;
            const colDelta = Math.round(deltaX / colWidth);
            const rowDelta = Math.round(deltaY / rowHeight);

            let newLayout = { ...currentInteraction.startLayout };

            if (currentInteraction.type === 'moving_block') {
                const width = newLayout.colEnd - newLayout.colStart;
                const height = newLayout.rowEnd - newLayout.rowStart;
                newLayout.colStart = Math.max(1, currentInteraction.startLayout.colStart + colDelta);
                newLayout.colEnd = Math.min(section.gridSettings.columns + 1, newLayout.colStart + width);
                newLayout.rowStart = Math.max(1, currentInteraction.startLayout.rowStart + rowDelta);
                newLayout.rowEnd = newLayout.rowStart + height;
            } else { // Resizing
                const dir = currentInteraction.resizeDirection;
                if (dir?.includes('e')) newLayout.colEnd = Math.min(section.gridSettings.columns + 1, Math.max(newLayout.colStart + 1, currentInteraction.startLayout.colEnd + colDelta));
                if (dir?.includes('w')) newLayout.colStart = Math.max(1, Math.min(newLayout.colEnd - 1, currentInteraction.startLayout.colStart + colDelta));
                if (dir?.includes('s')) newLayout.rowEnd = Math.max(newLayout.rowStart + 1, currentInteraction.startLayout.rowEnd + rowDelta);
                if (dir?.includes('n')) newLayout.rowStart = Math.max(1, Math.min(newLayout.rowEnd - 1, currentInteraction.startLayout.rowStart + rowDelta));
            }

            setDragPreview({ layout: newLayout, sectionId: section.id, context: currentInteraction.context! });
        }
    }, []);

    const handleMouseUp = useCallback(() => {
        const currentInteraction = interactionStateRef.current;
        const currentDropTarget = dropTargetRef.current;
        const currentDragPreview = dragPreview;
        
        if (currentInteraction) {
            if (currentInteraction.type.startsWith('new_') && currentDropTarget) {
                updatePageData(draft => {
                    const sectionListKey = currentDropTarget.context === 'footer' ? 'footerSections' : 'sections';
                    const sections = draft.content![sectionListKey];
                    if (currentInteraction.type === 'new_block') {
                        const section = sections.find(s => s.id === currentDropTarget.sectionId);
                        if (section) { section.blocks.push(currentInteraction.item as PageBlock); }
                    } else if (currentInteraction.type === 'new_section') {
                        const insertIdx = currentDropTarget.insertIndex ?? sections.length;
                        sections.splice(insertIdx, 0, currentInteraction.item as Section);
                    }
                });
            } else if ((currentInteraction.type === 'moving_block' || currentInteraction.type === 'resizing_block') && currentDragPreview) {
                 updatePageData(draft => {
                    const sectionListKey = currentDragPreview.context === 'footer' ? 'footerSections' : 'sections';
                    const section = draft.content![sectionListKey].find(s => s.id === currentDragPreview.sectionId);
                    if (section) {
                        const block = section.blocks.find(b => b.id === currentInteraction.blockId);
                        if (block) { block.layout[viewportRef.current] = currentDragPreview.layout; }
                    }
                });
            }
        }

        setInteractionState(null);
        setGhostElement(null);
        setDropTarget(null);
        setDragPreview(null);
    }, [updatePageData, dragPreview]);

    useEffect(() => {
        if (interactionState) {
            document.addEventListener('mousemove', handleMouseMove);
            document.addEventListener('mouseup', handleMouseUp, { once: true });
        }
        return () => {
            document.removeEventListener('mousemove', handleMouseMove);
            document.removeEventListener('mouseup', handleMouseUp);
        };
    }, [interactionState, handleMouseMove, handleMouseUp]);

    return {
        pageData, setPageData, status, setStatus, feedback, handleFeedback,
        viewport, setViewport, selection, handleSelect, updatePageData,
        handleSaveChanges, hasUnsavedChanges,
        interactionState, ghostElement, ghostPosition, dropTarget, dragPreview,
        handleComponentMouseDown, handleBlockMouseDown, handleResizeStart
    };
};

export default useSiteEditor;

// --- UTILITIES ---
const deepMerge = (target: any, source: any): any => {
    if (typeof target !== 'object' || target === null || typeof source !== 'object' || source === null) {
        return source !== undefined ? source : target;
    }
    const output = { ...target };
    Object.keys(source).forEach(key => {
        if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
            output[key] = deepMerge(target[key], source[key]);
        } else {
            output[key] = source[key] !== undefined ? source[key] : target[key];
        }
    });
    Object.keys(target).forEach(key => {
        if (output[key] === undefined) {
            output[key] = target[key];
        }
    });
    return output;
};