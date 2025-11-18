import React, { useState, useEffect } from 'react';
import { MotorcycleIcon } from '../../components/icons/Icons';
import { PageBlock, Page } from '../../types';

// --- Renderizadores de Bloco Dinâmicos para Visualização ---

const renderPreviewBlock = (block: PageBlock) => {
    switch (block.type) {
        case 'hero':
            return (
                <main key={block.id} className="container mx-auto px-6 py-16 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 text-white font-bold py-3 px-8 rounded-full text-lg cursor-not-allowed opacity-50" disabled>
                        {block.content.ctaText}
                    </button>
                </main>
            );
        case 'text':
            return (
                 <section key={block.id} className="py-12">
                    <div className="container mx-auto px-6 max-w-3xl text-left">
                        <h2 className="text-3xl font-bold text-center mb-6 text-white">{block.content.heading}</h2>
                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{block.content.body}</p>
                    </div>
                </section>
            );
        case 'image':
            return (
                <section key={block.id} className="py-12">
                    <div className="container mx-auto px-6">
                        <img src={block.content.imageUrl} alt={block.content.altText} className="rounded-lg max-w-4xl h-auto mx-auto shadow-lg" />
                    </div>
                </section>
            );
        case 'button':
            return (
                 <section key={block.id} className="py-8 text-center">
                    <a href={block.content.link} onClick={e => e.preventDefault()} className="bg-slate-700 text-white font-bold py-3 px-8 rounded-lg inline-block cursor-not-allowed opacity-50">
                        {block.content.text}
                    </a>
                </section>
            );
        default:
            return null;
    }
};

interface PreviewSiteProps {
  pageId: string;
}

const PreviewSite: React.FC<PreviewSiteProps> = ({ pageId }) => {
  const [pageData, setPageData] = useState<Page | null>(null);

  useEffect(() => {
    try {
      const storedContent = localStorage.getItem(`sitePreviewContent_${pageId}`);
      if (storedContent) {
        setPageData(JSON.parse(storedContent));
      }
    } catch (error) {
      console.error("Falha ao carregar conteúdo de visualização do localStorage:", error);
    }
  }, [pageId]);

  const siteSettings = pageData?.content?.settings;
  const siteBlocks = pageData?.content?.blocks || [];

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MotorcycleIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">{siteSettings?.brandName || 'Marca'}</span>
          </div>
          <div className="bg-yellow-500/20 text-yellow-300 text-sm font-bold px-4 py-2 rounded-lg">
            MODO DE VISUALIZAÇÃO
          </div>
        </nav>
      </header>

      {siteBlocks.length > 0 ? (
        siteBlocks.map(block => renderPreviewBlock(block))
      ) : (
        <div className="text-center py-20 text-slate-500">Nenhum conteúdo para visualizar.</div>
      )}
      
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} {siteSettings?.brandName || 'Marca'}. Todos os Direitos Reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PreviewSite;