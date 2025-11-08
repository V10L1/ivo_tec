import React, { useState, useEffect } from 'react';
import { MotorcycleIcon } from '../components/icons/Icons';
import { useRouter } from '../App';
import { PageBlock } from '../types';
import { mockApi } from '../database/mock';

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


const PublicSite: React.FC = () => {
  const { navigate } = useRouter();
  const [pageBlocks, setPageBlocks] = useState<PageBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchContent = async () => {
        try {
            const data = await mockApi.getSiteContent();
            setPageBlocks(data.content || []);
        } catch (error) {
            console.error("Falha ao buscar o conteúdo da página:", error);
        } finally {
            setIsLoading(false);
        }
    };
    fetchContent();
  }, []);

  const handleNavigate = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    navigate('/administrator');
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      {/* Cabeçalho */}
      <header className="bg-slate-800/50 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <MotorcycleIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold">Mundo Moto</span>
          </div>
          <a href="#/administrator" onClick={handleNavigate} className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Login do Admin
          </a>
        </nav>
      </header>

      {/* Área de Conteúdo Dinâmico */}
      {isLoading ? (
        <div className="text-center py-20">Carregando...</div>
      ) : (
        pageBlocks.map(block => renderBlock(block))
      )}
      
      {/* Rodapé */}
      <footer className="border-t border-slate-800 mt-20 py-8">
        <div className="container mx-auto px-6 text-center text-slate-500">
          <p>&copy; {new Date().getFullYear()} Mundo Moto. Todos os Direitos Reservados.</p>
        </div>
      </footer>
    </div>
  );
};

export default PublicSite;