import React, { useState, useEffect } from 'react';
import { MotorcycleIcon } from '../../components/icons/Icons';
import { useRouter } from '../../App';
import { PageBlock, Page } from '../../types';

// --- Renderizadores de Bloco Dinâmicos ---
const renderBlock = (block: PageBlock) => {
    switch (block.type) {
        case 'hero':
            return (
                <main key={block.id} className="container mx-auto px-6 py-16 text-center">
                    <h1 className="text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
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
                    <a href={block.content.link} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg inline-block transition-colors">
                        {block.content.text}
                    </a>
                </section>
            );
        default:
            return null;
    }
};

interface PublicSiteProps {
  slug: string;
}

const PublicSite: React.FC<PublicSiteProps> = ({ slug }) => {
  const { navigate } = useRouter();
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

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/administrator');
  };

  const renderContent = () => {
    if (status === 'loading') {
      return <div className="text-center py-20">Carregando...</div>;
    }
    if (status === 'not_found') {
      return <div className="text-center py-20">
          <h1 className="text-4xl font-bold">404 - Página Não Encontrada</h1>
          <p className="text-slate-400 mt-2">A página que você está procurando não existe.</p>
      </div>;
    }
    if (status === 'error' || !page) {
       return <div className="text-center py-20 text-red-400">Ocorreu um erro ao carregar o conteúdo.</div>;
    }
    return page.content.blocks?.map(block => renderBlock(block));
  };
  
  const siteSettings = page?.content?.settings;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MotorcycleIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">{siteSettings?.brandName || (status === 'loading' ? '' : 'Marca')}</span>
          </div>
          <a href="#/administrator" onClick={handleNavigate} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            {siteSettings?.loginButtonText || (status === 'loading' ? '' : 'Login')}
          </a>
        </nav>
      </header>

      {renderContent()}
      
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} {siteSettings?.brandName || (status === 'loading' ? '' : 'Marca')}. Todos os Direitos Reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicSite;