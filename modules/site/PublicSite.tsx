import React, { useState, useEffect, useMemo } from 'react';
import { Page, PageBlock, SiteData, TextStyles, ContainerStyles, FixedContainer } from '../../types';

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
        // Return a default color if hex is invalid to avoid breaking the UI
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
            // Menu items don't have individual styles in this setup, they can be styled globally or via container
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

    const gridStyle: React.CSSProperties = {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
        gridAutoRows: `${gridSettings.rowHeight}px`,
        gap: `${gridSettings.gap}px`,
    };

    return (
        <div className={className} style={gridStyle}>
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

// --- Novo: Renderizador de Contêiner Fixo ---
const FixedContainerRenderer: React.FC<{ container: FixedContainer }> = ({ container }) => {
    const [isCollapsed, setIsCollapsed] = useState(container.isCollapsed);

    const positionStyles: React.CSSProperties = {};
    const sizeStyles: React.CSSProperties = {};
    let isVertical = false;

    switch (container.id) {
        case 'top':
            positionStyles.top = 0;
            positionStyles.left = 0;
            positionStyles.right = 0;
            sizeStyles.height = isCollapsed ? 0 : container.size;
            break;
        case 'bottom':
            positionStyles.bottom = 0;
            positionStyles.left = 0;
            positionStyles.right = 0;
            sizeStyles.height = isCollapsed ? 0 : container.size;
            break;
        case 'left':
            positionStyles.left = 0;
            positionStyles.top = 0;
            positionStyles.bottom = 0;
            sizeStyles.width = isCollapsed ? 0 : container.size;
            isVertical = true;
            break;
        case 'right':
            positionStyles.right = 0;
            positionStyles.top = 0;
            positionStyles.bottom = 0;
            sizeStyles.width = isCollapsed ? 0 : container.size;
            isVertical = true;
            break;
    }

    const toggleIcon = (
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {isVertical ? (isCollapsed ? <polyline points="9 18 15 12 9 6"></polyline> : <polyline points="15 18 9 12 15 6"></polyline>) : (isCollapsed ? <polyline points="18 15 12 9 6 15"></polyline> : <polyline points="6 9 12 15 18 9"></polyline>)}
        </svg>
    );

    return (
        <div style={{
            position: 'fixed',
            zIndex: 1000,
            transition: 'all 0.3s ease-in-out',
            ...positionStyles,
            ...sizeStyles
        }}
        className="bg-slate-800/80 backdrop-blur-sm border-slate-700 overflow-hidden"
        >
             <button
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="absolute bg-cyan-600/80 hover:bg-cyan-500 text-white rounded-full w-8 h-8 flex items-center justify-center z-10"
                style={ container.id === 'top' ? { bottom: '-16px', left: '50%', transform: 'translateX(-50%)' } :
                        container.id === 'bottom' ? { top: '-16px', left: '50%', transform: 'translateX(-50%)' } :
                        container.id === 'left' ? { right: '-16px', top: '50%', transform: 'translateY(-50%)' } :
                        { left: '-16px', top: '50%', transform: 'translateY(-50%)' }
                }
                aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
             >
                {toggleIcon}
             </button>
            <GridCanvas
                blocks={container.blocks}
                gridSettings={container.gridSettings}
                className="w-full h-full p-2"
            />
        </div>
    );
};


interface PublicSiteProps {
  slug: string;
}

const PublicSite: React.FC<PublicSiteProps> = ({ slug }) => {
  const [page, setPage] = useState<Page | null>(null);
  const [status, setStatus] = useState<'loading' | 'success' | 'not_found' | 'error'>('loading');

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
            setStatus('success');
        } catch (error) {
            console.error("Falha ao buscar o conteúdo da página:", error);
            setStatus('error');
        }
    };
    fetchContent();
  }, [slug]);

  useEffect(() => {
    if (page?.content?.settings.brandName) {
      document.title = page.content.settings.brandName;
    }
    // Cleanup function to reset title when component unmounts
    return () => {
      document.title = 'Painel de Administração Modular';
    };
  }, [page]);


  const siteSettings = page?.content?.settings;
  const pageStyle = {
    backgroundColor: siteSettings?.backgroundColor || '#0f172a' // slate-900
  };

  const mainContentStyle = useMemo(() => {
    const style: React.CSSProperties = { transition: 'padding 0.3s ease-in-out' };
    const fixedContainers = page?.content?.fixedContainers;
    if (fixedContainers?.top.enabled && !fixedContainers.top.isCollapsed) {
        style.paddingTop = `${fixedContainers.top.size}px`;
    }
     if (fixedContainers?.bottom.enabled && !fixedContainers.bottom.isCollapsed) {
        style.paddingBottom = `${fixedContainers.bottom.size}px`;
    }
     if (fixedContainers?.left.enabled && !fixedContainers.left.isCollapsed) {
        style.paddingLeft = `${fixedContainers.left.size}px`;
    }
     if (fixedContainers?.right.enabled && !fixedContainers.right.isCollapsed) {
        style.paddingRight = `${fixedContainers.right.size}px`;
    }
    return style;
  }, [page?.content?.fixedContainers]);

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
  
  return (
    <div className="min-h-screen text-slate-100 font-sans" style={pageStyle}>
      {/* Renderizar Contêineres Fixos */}
       {Object.values(page.content.fixedContainers || {}).map(container =>
         container.enabled ? <FixedContainerRenderer key={container.id} container={container} /> : null
       )}

      {/* Conteúdo Principal Rolável */}
      <div className="relative" style={mainContentStyle}>
        <main>
            <GridCanvas blocks={mainBlocks} gridSettings={gridSettings} className="container mx-auto px-4 py-8" />
        </main>
        
        {page.content.footerBlocks.length > 0 && (
            <>
                <div className="container mx-auto px-4"><hr className="border-slate-800 my-8" /></div>
                <footer>
                    <GridCanvas blocks={page.content.footerBlocks} gridSettings={gridSettings} className="container mx-auto px-4 py-8" />
                </footer>
            </>
        )}
      </div>
    </div>
  );
};

export default PublicSite;