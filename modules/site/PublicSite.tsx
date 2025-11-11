import React, { useState, useEffect } from 'react';
import { Page, PageBlock, SiteData } from '../../types';

// --- Renderizadores de Bloco Dinâmicos ---
const BlockRenderer: React.FC<{ block: PageBlock }> = ({ block }) => {
    const commonClasses = "w-full h-full flex flex-col p-4";
    switch (block.type) {
        case 'hero':
            return (
                <div className={`${commonClasses} text-center items-center justify-center bg-slate-800/50 rounded-lg`}>
                    <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-md md:text-lg text-slate-300 max-w-2xl mx-auto mb-6">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                        {block.content.ctaText}
                    </button>
                </div>
            );
        case 'text':
            return (
                 <div className={`${commonClasses} text-left`}>
                    <h2 className="text-3xl font-bold mb-4 text-white">{block.content.heading}</h2>
                    <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{block.content.body}</p>
                </div>
            );
        case 'image':
            return (
                <img src={block.content.imageUrl} alt={block.content.altText} className="w-full h-full object-cover rounded-lg shadow-lg" />
            );
        case 'button':
            return (
                 <div className={`${commonClasses} items-center justify-center`}>
                    <a href={block.content.link} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg inline-block transition-colors">
                        {block.content.text}
                    </a>
                </div>
            );
        case 'menu':
            return (
                 <nav className={`${commonClasses} flex-row items-center justify-center gap-6`}>
                    {block.content.items.map(item => (
                        <a key={item.id} href={item.link} className="text-slate-300 hover:text-cyan-400 font-medium transition-colors">
                            {item.label}
                        </a>
                    ))}
                </nav>
            );
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