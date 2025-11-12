import React, { useState, useEffect } from 'react';
import { Page, PageBlock, SiteData, TextStyles, ContainerStyles, FixedContainer, GridSettings, FixedContainerPosition } from '../../types';

const defaultContainerStyles: ContainerStyles = {
    backgroundColor: '#1e293b', // slate-800
    backgroundOpacity: 1,
    textOpacity: 1,
    borderRadius: 'medium',
    zIndex: 0,
};

const getYouTubeEmbedUrl = (url: string, autoplay?: boolean, controls?: boolean) => {
    let videoId;
    try {
        if (url.includes('youtube.com/watch')) {
            videoId = new URL(url).searchParams.get('v');
        } else if (url.includes('youtu.be/')) {
            videoId = new URL(url).pathname.split('/').pop();
        }
        if (!videoId) return null;

        const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
        if (autoplay) {
            embedUrl.searchParams.set('autoplay', '1');
            embedUrl.searchParams.set('mute', '1'); // Autoplay requires mute
        }
        if (controls === false) {
            embedUrl.searchParams.set('controls', '0');
        }
        return embedUrl.toString();
    } catch (error) {
        console.error("Invalid video URL:", url, error);
        return null;
    }
};

const hexToRgba = (hex: string, alpha: number = 1): string => {
    if (!hex || !/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)) {
        return `rgba(30, 41, 59, ${alpha})`; // slate-800
    }
    let c = hex.substring(1).split('');
    if (c.length === 3) {
        c = [c[0], c[0], c[1], c[1], c[2], c[2]];
    }
    const i = parseInt(c.join(''), 16);
    const r = (i >> 16) & 255;
    const g = (i >> 8) & 255;
    const b = i & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const createTextStyle = (textStyles?: TextStyles, textOpacity: number = 1): React.CSSProperties => {
    if (!textStyles) return {};
    return {
        color: textStyles.textColor,
        textAlign: textStyles.textAlign,
        fontWeight: textStyles.fontWeight,
        fontStyle: textStyles.fontStyle,
        fontFamily: textStyles.fontFamily,
        fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined,
        opacity: textOpacity,
    };
};

const getBorderRadiusClass = (radius: ContainerStyles['borderRadius']) => {
    switch (radius) {
        case 'full': return 'rounded-full';
        case 'none': return 'rounded-none';
        case 'medium':
        default:
            return 'rounded-lg';
    }
}


// --- Renderizadores de Bloco Dinâmicos ---
const BlockRenderer: React.FC<{ block: PageBlock }> = ({ block }) => {
    const commonClasses = "w-full h-full flex flex-col p-4";
    const styles = { ...defaultContainerStyles, ...(block.styles || {}) };
    const borderRadiusClass = getBorderRadiusClass(styles.borderRadius);
    
    const inlineStyle: React.CSSProperties = {
        backgroundColor: styles.backgroundOpacity !== 1 ? hexToRgba(styles.backgroundColor || '#000000', styles.backgroundOpacity) : styles.backgroundColor,
    };

    switch (block.type) {
        case 'hero':
            return (
                <div style={inlineStyle} className={`${commonClasses} text-center items-center justify-center ${borderRadiusClass}`}>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={createTextStyle(block.content.title.styles, styles.textOpacity)}>{block.content.title.text}</h1>
                    <p className="text-md md:text-lg text-slate-300 max-w-2xl mx-auto mb-6" style={createTextStyle(block.content.subtitle.styles, styles.textOpacity)}>{block.content.subtitle.text}</p>
                    {block.content.ctaEnabled && (
                         <a href={block.content.ctaLink} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105" style={{ opacity: styles.textOpacity }}>
                            {block.content.ctaText}
                        </a>
                    )}
                </div>
            );
        case 'text':
            return (
                 <div style={inlineStyle} className={`${commonClasses} text-left ${borderRadiusClass}`}>
                    <h2 className="text-3xl font-bold mb-4" style={createTextStyle(block.content.heading.styles, styles.textOpacity)}>{block.content.heading.text}</h2>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed" style={createTextStyle(block.content.body.styles, styles.textOpacity)}>{block.content.body.text}</p>
                </div>
            );
        case 'image':
            return (
                <img src={block.content.imageUrl} alt={block.content.altText} className={`w-full h-full object-cover shadow-lg ${borderRadiusClass}`} style={{opacity: styles.backgroundOpacity}}/>
            );
        case 'button':
             const buttonCombinedStyles: React.CSSProperties = {
                ...inlineStyle,
                ...createTextStyle(block.content.text.styles, styles.textOpacity)
             };
            return (
                 <div className={`${commonClasses} items-center justify-center`}>
                    <a href={block.content.link} className={`text-white font-bold py-3 px-8 inline-block transition-colors ${borderRadiusClass}`} style={buttonCombinedStyles}>
                        {block.content.text.text}
                    </a>
                </div>
            );
        case 'menu':
            return (
                 <nav style={inlineStyle} className={`${commonClasses} flex-row items-center justify-center gap-6 ${borderRadiusClass}`}>
                    {block.content.items.map(item => (
                        <a key={item.id} href={item.link} className="text-slate-300 hover:text-cyan-400 font-medium transition-colors" style={{ opacity: styles.textOpacity }}>
                            {item.label}
                        </a>
                    ))}
                </nav>
            );
        case 'video':
            const embedUrl = getYouTubeEmbedUrl(block.content.videoUrl, block.content.autoplay, block.content.controls);
            return embedUrl ? (
                <div className={`w-full h-full overflow-hidden ${borderRadiusClass}`}>
                    <iframe
                        width="100%"
                        height="100%"
                        src={embedUrl}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    ></iframe>
                </div>
            ) : <div className="p-4 text-red-400">URL de vídeo inválida. Use um link do YouTube.</div>;
        case 'divider':
            return <div className="flex items-center justify-center w-full h-full"><hr className="w-full border-slate-700" style={{borderColor: styles.backgroundColor, opacity: styles.backgroundOpacity}}/></div>;
        case 'spacer':
            return <div style={inlineStyle} className={borderRadiusClass}></div>; // Spacer is just for layout
        default:
            return <div className="p-4 bg-red-900 rounded-lg">Bloco desconhecido</div>;
    }
};

interface GridCanvasProps {
    blocks: PageBlock[] | undefined;
    gridSettings: SiteData['gridSettings']['desktop'] | undefined;
    className?: string;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ blocks = [], gridSettings, className = "" }) => {
    if (!gridSettings) return null;

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
        gridAutoRows: `${gridSettings.rowHeight}px`,
        gap: `${gridSettings.gap}px`,
    };

    return (
        <div className={`w-full h-full p-4 ${className}`} style={gridStyle}>
            {blocks.map(block => {
                const { desktop: layout } = block.layout;
                const blockStyle = {
                    gridColumn: `${layout.colStart} / ${layout.colEnd}`,
                    gridRow: `${layout.rowStart} / ${layout.rowEnd}`,
                    alignSelf: layout.alignSelf,
                    justifySelf: layout.justifySelf,
                    zIndex: block.styles?.zIndex || 'auto',
                    position: 'relative' as const,
                };
                return (
                    <div key={block.id} style={blockStyle}>
                        <BlockRenderer block={block} />
                    </div>
                );
            })}
        </div>
    );
};

// --- Renderizador de Contêiner Fixo ---
interface FixedContainerRendererProps {
    position: FixedContainerPosition;
    config: FixedContainer;
    gridSettings: GridSettings;
    isCollapsed: boolean;
    onToggle: () => void;
}

const FixedContainerRenderer: React.FC<FixedContainerRendererProps> = ({ position, config, gridSettings, isCollapsed, onToggle }) => {
    const isHorizontal = position === 'top' || position === 'bottom';
    
    const containerStyle: React.CSSProperties = {
        position: 'fixed',
        zIndex: 1000,
        backgroundColor: '#1e293b', // bg-slate-800
        transition: 'all 0.3s ease-in-out',
        ...(isHorizontal ? {
            left: 0, right: 0, height: `${config.size}px`,
            transform: isCollapsed ? `translateY(${position === 'top' ? '-100%' : '100%'})` : 'translateY(0)'
        } : {
            top: 0, bottom: 0, width: `${config.size}px`,
            transform: isCollapsed ? `translateX(${position === 'left' ? '-100%' : '100%'})` : 'translateX(0)'
        }),
        ...(position === 'top' && { top: 0 }),
        ...(position === 'bottom' && { bottom: 0 }),
        ...(position === 'left' && { left: 0 }),
        ...(position === 'right' && { right: 0 }),
    };

    const toggleStyle: React.CSSProperties = {
        position: 'absolute',
        zIndex: 1010,
        backgroundColor: '#334155', // bg-slate-700
    };

    if (isHorizontal) {
        toggleStyle.left = '50%';
        toggleStyle.transform = 'translateX(-50%)';
        if (position === 'top') { toggleStyle.bottom = '-16px'; } else { toggleStyle.top = '-16px'; }
    } else {
        toggleStyle.top = '50%';
        toggleStyle.transform = 'translateY(-50%)';
        if (position === 'left') { toggleStyle.right = '-16px'; } else { toggleStyle.left = '-16px'; }
    }

    return (
        <div style={containerStyle} className="shadow-lg border-slate-700 border">
            <GridCanvas blocks={config.blocks} gridSettings={gridSettings} />
            <button onClick={onToggle} style={toggleStyle} className="w-8 h-8 rounded-full flex items-center justify-center text-white hover:bg-cyan-600">
                {isCollapsed ? '+' : '-'}
            </button>
        </div>
    );
};


interface PublicSiteProps {
  slug: string;
}

const PublicSite: React.FC<PublicSiteProps> = ({ slug }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error'>('loading');
  const [collapsedStates, setCollapsedStates] = useState({ top: false, left: false, right: false, bottom: false });

  useEffect(() => {
    const fetchContent = async () => {
        setStatus('loading');
        try {
            const endpoint = slug === 'home' ? '/api/site/pages/public/home' : `/api/site/pages/public/slug/${slug}`;
            const response = await fetch(endpoint);
            if (response.status === 404) {
                setStatus('not_found');
                return;
            }
            if (!response.ok) throw new Error('A resposta da rede não foi ok');
            const data: Page = await response.json();
            setPage(data);
            if (data.content?.fixedContainers) {
                setCollapsedStates({
                    top: data.content.fixedContainers.top.isCollapsed,
                    left: data.content.fixedContainers.left.isCollapsed,
                    right: data.content.fixedContainers.right.isCollapsed,
                    bottom: data.content.fixedContainers.bottom.isCollapsed,
                });
            }
            setStatus('success');
        } catch (error) {
            console.error("Falha ao buscar o conteúdo da página:", error);
            setStatus('error');
        }
    };
    fetchContent();
  }, [slug]);

  const handleToggleCollapse = (position: FixedContainerPosition) => {
    setCollapsedStates(prev => ({ ...prev, [position]: !prev[position] }));
  };

  useEffect(() => {
    if (page?.content?.settings.brandName) {
      document.title = page.content.settings.brandName;
    }
    return () => {
      document.title = 'Painel de Administração Modular';
    };
  }, [page]);

  const siteSettings = page?.content?.settings;
  const pageStyle = {
    backgroundColor: siteSettings?.backgroundColor || '#0f172a' // slate-900
  };

  if (status === 'loading') {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
  }
  if (status === 'not_found') {
    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white text-center">
            <div>
                <h1 className="text-4xl font-bold">404 - Página Não Encontrada</h1>
                <p className="text-slate-400 mt-2">A página que você está procurando não existe.</p>
            </div>
        </div>
    );
  }
  if (status === 'error' || !page?.content) {
     return (
        <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400 text-center">
            Ocorreu um erro ao carregar o conteúdo.
        </div>
     );
  }
  
  const mainBlocks = page.content.mainBlocks || [];
  const gridSettings = page.content.gridSettings.desktop;
  const containers = page.content.fixedContainers;

  const mainContentStyle: React.CSSProperties = {
      paddingTop: (containers?.top?.enabled && !collapsedStates.top) ? `${containers.top.size}px` : 0,
      paddingBottom: (containers?.bottom?.enabled && !collapsedStates.bottom) ? `${containers.bottom.size}px` : 0,
      paddingLeft: (containers?.left?.enabled && !collapsedStates.left) ? `${containers.left.size}px` : 0,
      paddingRight: (containers?.right?.enabled && !collapsedStates.right) ? `${containers.right.size}px` : 0,
      transition: 'padding 0.3s ease-in-out',
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans relative" style={pageStyle}>
      {containers?.top?.enabled && <FixedContainerRenderer position="top" config={containers.top} gridSettings={gridSettings} isCollapsed={collapsedStates.top} onToggle={() => handleToggleCollapse('top')} />}
      {containers?.left?.enabled && <FixedContainerRenderer position="left" config={containers.left} gridSettings={gridSettings} isCollapsed={collapsedStates.left} onToggle={() => handleToggleCollapse('left')} />}
      {containers?.right?.enabled && <FixedContainerRenderer position="right" config={containers.right} gridSettings={gridSettings} isCollapsed={collapsedStates.right} onToggle={() => handleToggleCollapse('right')} />}
      {containers?.bottom?.enabled && <FixedContainerRenderer position="bottom" config={containers.bottom} gridSettings={gridSettings} isCollapsed={collapsedStates.bottom} onToggle={() => handleToggleCollapse('bottom')} />}

      <div className="relative" style={mainContentStyle}>
        <main className="container mx-auto px-4 py-8">
            <GridCanvas blocks={mainBlocks} gridSettings={gridSettings} />
        </main>
        
        {page.content.footerBlocks.length > 0 && (
            <footer className="container mx-auto px-4 py-8 border-t border-slate-800">
                <GridCanvas blocks={page.content.footerBlocks} gridSettings={gridSettings} />
            </footer>
        )}
      </div>
    </div>
  );
};

export default PublicSite;