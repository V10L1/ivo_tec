import React, { useState, useEffect } from 'react';
import { Page, PageBlock, Section, Viewport, FixedContainerPosition, SiteData, ThemeSettings, ColorStyleValue, ThemeColorKey } from '../../types';
import BlockRenderer from './components/BlockRenderer';
import { defaultPageContent } from './utils/defaults';

// Função utilitária para resolver a cor com base no tema
export const resolveColor = (color: ColorStyleValue | undefined, theme: ThemeSettings): string => {
    if (!color) return 'transparent';
    if (color.type === 'global') {
        const themeKey = color.value as ThemeColorKey;
        return theme[themeKey] || 'transparent';
    }
    return color.value;
};

interface PublicSiteProps {
    slug?: string;
    pageData?: Page | null;
    isEditing?: boolean;
    // Esta prop será usada pelo editor para injetar os controles de arrastar e soltar
    renderSectionWithEditorGrid?: (section: Section, context: 'main' | 'footer') => React.ReactNode;
}

const PublicSite: React.FC<PublicSiteProps> = ({ slug, pageData: initialPageData, isEditing = false, renderSectionWithEditorGrid }) => {
    const [pageData, setPageData] = useState<Page | null>(initialPageData || null);
    const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error'>(initialPageData ? 'success' : 'loading');

    // Sincroniza o estado interno se a prop pageData mudar (importante para o editor)
    useEffect(() => {
        if (initialPageData) {
            setPageData(initialPageData);
            setStatus('success');
        }
    }, [initialPageData]);
    
    // Busca os dados da página se estiver em modo público e não tiver dados iniciais
    useEffect(() => {
        if (slug && !initialPageData && !isEditing) {
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
        }
    }, [slug, initialPageData, isEditing]);


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
    
    if (status === 'loading' && !isEditing) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
    }
    
    if ((status === 'not_found' || status === 'error' || !pageData) && !isEditing) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Página não encontrada.</div>;
    }
    
    if (!pageData) {
        return null;
    }

    // FIX: Garante que o conteúdo e o tema tenham valores padrão para evitar travamentos.
    const { 
        settings = defaultPageContent.settings, 
        fixedContainers = defaultPageContent.fixedContainers, 
        sections = [], 
        footerSections = [], 
        theme = defaultPageContent.theme 
    } = pageData.content || {};


    const renderSectionForPublic = (section: Section) => {
        return (
            <div
                key={section.id}
                style={{ backgroundColor: resolveColor(section.styles.backgroundColor, theme), position: 'relative' }}
            >
                <div style={{ display: 'grid', gridTemplateColumns: `repeat(${section.gridSettings.columns}, 1fr)`, gridAutoRows: `${section.gridSettings.rowHeight}px`, gap: `${section.gridSettings.gap}px`, position: 'relative' }}>
                    {section.blocks.map(block => (
                        <div
                            key={block.id}
                            data-animation={!isEditing ? block.animation.type : 'none'}
                            data-animation-delay={block.animation.delay}
                            data-animation-duration={block.animation.duration}
                            style={{ gridColumn: `${block.layout.desktop.colStart} / ${block.layout.desktop.colEnd}`, gridRow: `${block.layout.desktop.rowStart} / ${block.layout.desktop.rowEnd}`, zIndex: block.styles?.zIndex || 'auto', position: 'relative' }}
                            className={`${!isEditing && block.animation.type !== 'none' ? 'opacity-0' : ''}`}
                        >
                            <BlockRenderer
                                block={block}
                                theme={theme}
                                viewport={'desktop'}
                                isEditing={isEditing}
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
             <style>{`:root { --primary-color: ${theme.primaryColor}; --secondary-color: ${theme.secondaryColor}; --heading-font: ${theme.headingFont}; --body-font: ${theme.bodyFont}; --background-color: ${theme.backgroundColor}; --surface-color: ${theme.surfaceColor}; --text-color: ${theme.textColor}; --text-secondary-color: ${theme.textSecondaryColor}; }`}</style>
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