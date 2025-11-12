import React, { useState, useEffect } from 'react';
import { Page, PageBlock, SiteData, TextStyles } from '../../types';

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

const createTextStyle = (textStyles?: TextStyles): React.CSSProperties => {
    if (!textStyles) return {};
    return {
        color: textStyles.textColor,
        textAlign: textStyles.textAlign,
        fontWeight: textStyles.fontWeight,
        fontStyle: textStyles.fontStyle,
        fontFamily: textStyles.fontFamily,
        fontSize: textStyles.fontSize ? `${textStyles.fontSize}px` : undefined,
    };
};


// --- Renderizadores de Bloco Dinâmicos ---
const BlockRenderer: React.FC<{ block: PageBlock }> = ({ block }) => {
    const commonClasses = "w-full h-full flex flex-col p-4";
    const styles = block.styles || {};
    const inlineStyle: React.CSSProperties = {
        backgroundColor: styles.backgroundColor,
        opacity: styles.opacity,
    };

    switch (block.type) {
        case 'hero':
            return (
                <div style={inlineStyle} className={`${commonClasses} text-center items-center justify-center rounded-lg`}>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4" style={createTextStyle(block.content.title.styles)}>{block.content.title.text}</h1>
                    <p className="text-md md:text-lg text-slate-300 max-w-2xl mx-auto mb-6" style={createTextStyle(block.content.subtitle.styles)}>{block.content.subtitle.text}</p>
                    {block.content.ctaEnabled && (
                         <a href={block.content.ctaLink} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                            {block.content.ctaText}
                        </a>
                    )}
                </div>
            );
        case 'text':
            return (
                 <div style={inlineStyle} className={`${commonClasses} text-left`}>
                    <h2 className="text-3xl font-bold mb-4" style={createTextStyle(block.content.heading.styles)}>{block.content.heading.text}</h2>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed" style={createTextStyle(block.content.body.styles)}>{block.content.body.text}</p>
                </div>
            );
        case 'image':
            return (
                <img src={block.content.imageUrl} alt={block.content.altText} className="w-full h-full object-cover rounded-lg shadow-lg" style={{opacity: styles.opacity}}/>
            );
        case 'button':
             const buttonCombinedStyles: React.CSSProperties = {
                ...inlineStyle,
                ...createTextStyle(block.content.text.styles)
             };
            return (
                 <div className={`${commonClasses} items-center justify-center`}>
                    <a href={block.content.link} className="text-white font-bold py-3 px-8 rounded-lg inline-block transition-colors" style={buttonCombinedStyles}>
                        {block.content.text.text}
                    </a>
                </div>
            );
        case 'menu':
            // Menu items don't have individual styles in this setup, they can be styled globally or via container
            return (
                 <nav style={inlineStyle} className={`${commonClasses} flex-row items-center justify-center gap-6`}>
                    {block.content.items.map(item => (
                        <a key={item.id} href={item.link} className="text-slate-300 hover:text-cyan-400 font-medium transition-colors">
                            {item.label}
                        </a>
                    ))}
                </nav>
            );
        case 'video':
            const embedUrl = getYouTubeEmbedUrl(block.content.videoUrl, block.content.autoplay, block.content.controls);
            return embedUrl ? (
                <div className="w-full h-full rounded-lg overflow-hidden">
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
            return <div className="flex items-center justify-center w-full h-full"><hr className="w-full border-slate-700" style={{borderColor: styles.backgroundColor}}/></div>;
        case 'spacer':
            return <div style={inlineStyle}></div>; // Spacer is just for layout
        default:
            return <div className="p-4 bg-red-900 rounded-lg">Bloco desconhecido</div>;
    }
};

interface GridCanvasProps {
    blocks: PageBlock[] | undefined;
    gridSettings: SiteData['gridSettings']['desktop'] | undefined;
}

const GridCanvas: React.FC<GridCanvasProps> = ({ blocks = [], gridSettings }) => {
    if (!gridSettings) return null;

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: `repeat(${gridSettings.columns}, 1fr)`,
        gridAutoRows: `${gridSettings.rowHeight}px`,
        gap: `${gridSettings.gap}px`,
    };

    return (
        <div className="container mx-auto px-4 py-8" style={gridStyle}>
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

  return (
    <div className="min-h-screen text-slate-100 font-sans" style={pageStyle}>
        <header>
            <GridCanvas blocks={page.content.headerBlocks} gridSettings={page.content.gridSettings.desktop} />
        </header>
        <main>
            <GridCanvas blocks={page.content.contentBlocks} gridSettings={page.content.gridSettings.desktop} />
        </main>
        <footer>
            <GridCanvas blocks={page.content.footerBlocks} gridSettings={page.content.gridSettings.desktop} />
        </footer>
    </div>
  );
};

export default PublicSite;