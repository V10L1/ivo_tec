import React, { useState, useEffect } from 'react';
import { MotorcycleIcon } from '../../components/icons/Icons';
import { useRouter } from '../../App';
import { Page, PageBlock, SectionBlock, MenuBlockContent } from '../../types';

// --- Renderizadores de Bloco Dinâmicos ---
const renderBlock = (block: PageBlock) => {
    switch (block.type) {
        case 'hero':
            return (
                <div key={block.id} className="text-center py-10">
                    <h1 className="text-5xl font-extrabold text-white mb-4">{block.content.title}</h1>
                    <p className="text-lg text-slate-400 max-w-2xl mx-auto mb-8">{block.content.subtitle}</p>
                    <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-8 rounded-full text-lg transition-transform transform hover:scale-105">
                        {block.content.ctaText}
                    </button>
                </div>
            );
        case 'text':
            return (
                 <div key={block.id} className="py-6">
                    <div className="max-w-3xl mx-auto text-left">
                        <h2 className="text-3xl font-bold text-center mb-6 text-white">{block.content.heading}</h2>
                        <p className="text-slate-400 whitespace-pre-wrap leading-relaxed">{block.content.body}</p>
                    </div>
                </div>
            );
        case 'image':
            return (
                <div key={block.id} className="py-6">
                    <img src={block.content.imageUrl} alt={block.content.altText} className="rounded-lg max-w-full h-auto mx-auto shadow-lg" />
                </div>
            );
        case 'button':
            return (
                 <div key={block.id} className="py-8 text-center">
                    <a href={block.content.link} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 px-8 rounded-lg inline-block transition-colors">
                        {block.content.text}
                    </a>
                </div>
            );
        case 'menu':
            const content = block.content as MenuBlockContent;
            return (
                 <nav key={block.id} className="flex items-center justify-center gap-6 py-4">
                    {content.items.map(item => (
                        <a key={item.id} href={item.link} className="text-slate-300 hover:text-cyan-400 font-medium transition-colors">
                            {item.label}
                        </a>
                    ))}
                </nav>
            );
        default:
            return null;
    }
};

const renderSection = (section: SectionBlock) => {
    const sectionStyle = {
        backgroundColor: section.style.backgroundColor || 'transparent',
        paddingTop: section.style.paddingTop,
        paddingBottom: section.style.paddingBottom,
        backgroundImage: section.style.backgroundImage ? `url(${section.style.backgroundImage})` : 'none',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
    };
    return (
        <section key={section.id} style={sectionStyle}>
            <div className="container mx-auto px-6">
                <div className="flex flex-wrap -mx-4">
                    {section.columns.map(column => (
                        <div key={column.id} className="px-4" style={{ width: column.style.width }}>
                            {column.blocks.map(block => renderBlock(block))}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
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
    return page.content.sections?.map(section => renderSection(section));
  };
  
  const siteSettings = page?.content?.settings;
  const pageStyle = {
    backgroundColor: siteSettings?.backgroundColor || '#0f172a' // slate-900
  };

  return (
    <div className="min-h-screen text-slate-100 font-sans" style={pageStyle}>
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
