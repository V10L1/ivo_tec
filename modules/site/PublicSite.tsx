

import React, { useState, useEffect } from 'react';
import { Page, PageBlock, Section, Viewport, FixedContainerPosition, SiteData } from '../../types';
import BlockRenderer from './components/BlockRenderer';

interface PublicSiteProps {
    slug?: string;
    pageData?: Page | null;
    isEditing?: boolean;
    renderSectionWithEditorGrid?: (section: Section, context: 'main' | 'footer') => React.ReactNode;
}

const PublicSite: React.FC<PublicSiteProps> = ({ slug, pageData: initialPageData, isEditing = false, renderSectionWithEditorGrid }) => {
    const [pageData, setPageData] = useState<Page | null>(initialPageData || null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error'>(initialPageData ? 'success' : 'loading');

    useEffect(() => {
        if (slug && !initialPageData) {
            const fetchPageData = async () => {
                setStatus('loading');
                try {
                    const endpoint = slug === 'home' ? '/api/site/pages/public/home' : `/api/site/pages/public/slug/${slug}`;
                    const response = await fetch(endpoint);
                    if (response.status === 404) {
                        setStatus('not_found');
                        return;
                    }
                    if (!response.ok) throw new Error('Failed to fetch page data');
                    const data = await response.json();
                    setPageData(data);
                    setStatus('success');
                } catch (e) {
                    console.error("Failed to fetch page data for public site", e);
                    setStatus('error');
                }
            };
            fetchPageData();
        } else if (initialPageData) {
            setPageData(initialPageData);
            setStatus('success');
        }
    }, [slug, initialPageData]);


    const [collapsedStates, setCollapsedStates] = useState({ top: false, left: false, right: false, bottom: false });

    useEffect(() => {
        if (pageData?.content?.fixedContainers) {
            const { top, left, right, bottom } = pageData.content.fixedContainers;
            setCollapsedStates({
                top: top.isCollapsed,
                left: left.isCollapsed,
                right: right.isCollapsed,
                bottom: bottom.isCollapsed
            });
        }
    }, [pageData]);

    useEffect(() => {
        if (isEditing || !pageData) return;
        document.title = pageData.metaTitle || 'Site';
        return () => { document.title = 'Painel de Administração Modular'; };
    }, [pageData, isEditing]);

    useEffect(() => {
        if (isEditing) return;
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const target = entry.target as HTMLElement;
                    const animationType = target.dataset.animation;
                    if (animationType && animationType !== 'none') {
                        target.style.animationDelay = target.dataset.animationDelay + 'ms';
                        target.style.animationDuration = target.dataset.animationDuration + 'ms';
                        target.classList.add(`animate-${animationType}`);
                        target.classList.remove('opacity-0');
                        observer.unobserve(target);
                    }
                }
            });
        }, { threshold: 0.1 });

        const targets = document.querySelectorAll('[data-animation]');
        targets.forEach(t => observer.observe(t));
        return () => observer.disconnect();
    }, [isEditing, pageData]);

    const handleToggleContainer = (target: FixedContainerPosition) => {
        setCollapsedStates(prev => ({ ...prev, [target]: !prev[target] }));
    };
    
    if (status === 'loading') {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
    }
    
    if (status === 'not_found' || status === 'error' || !pageData || !pageData.content) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Página não encontrada.</div>;
    }


    const { settings, fixedContainers, sections, footerSections, theme } = pageData.content;
    const viewport: Viewport = 'desktop'; // Public view is always responsive via CSS

    const renderSectionForPublic = (section: Section) => {
        return (
            <div
                key={section.id}
                style={{ backgroundColor: section.styles.backgroundColor }}
                className="relative"
            >
                <div className="relative" style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px` }}>
                    {section.blocks.map(block => (
                        <div
                            key={block.id}
                            data-animation={block.animation.type}
                            data-animation-delay={block.animation.delay}
                            data-animation-duration={block.animation.duration}
                            style={{ gridColumn: `${block.layout[viewport].colStart} / ${block.layout[viewport].colEnd}`, gridRow: `${block.layout[viewport].rowStart} / ${block.layout[viewport].rowEnd}`, zIndex: block.styles?.zIndex || 'auto' }}
                            className={`${block.animation.type !== 'none' ? 'opacity-0' : ''}`}
                        >
                            <BlockRenderer
                                block={block}
                                theme={theme}
                                viewport={viewport}
                                isEditing={false}
                                onToggleContainer={handleToggleContainer}
                            />
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    const mainPadding: React.CSSProperties = {
        paddingTop: fixedContainers.top.enabled && !collapsedStates.top ? `${fixedContainers.top.size}px` : '0px',
        paddingBottom: fixedContainers.bottom.enabled && !collapsedStates.bottom ? `${fixedContainers.bottom.size}px` : '0px',
        paddingLeft: fixedContainers.left.enabled && !collapsedStates.left ? `${fixedContainers.left.size}px` : '0px',
        paddingRight: fixedContainers.right.enabled && !collapsedStates.right ? `${fixedContainers.right.size}px` : '0px',
        transition: 'padding 0.3s ease-in-out',
        width: '100%',
    };

    return (
        <div style={{ backgroundColor: settings.backgroundColor }}>
             <style>{`:root { --primary-color: ${theme.primaryColor}; --secondary-color: ${theme.secondaryColor}; --heading-font: ${theme.headingFont}; --body-font: ${theme.bodyFont}; }`}</style>
             <div style={isEditing ? {} : mainPadding}>
                <main className="relative mx-auto">
                    {sections.map(section =>
                        renderSectionWithEditorGrid ? renderSectionWithEditorGrid(section, 'main') : renderSectionForPublic(section)
                    )}
                </main>
                <footer className="relative mx-auto max-w-screen-2xl mt-8 pt-8 border-t border-slate-800">
                    {footerSections.map(section =>
                        renderSectionWithEditorGrid ? renderSectionWithEditorGrid(section, 'footer') : renderSectionForPublic(section)
                    )}
                </footer>
             </div>
        </div>
    );
};

export default PublicSite;