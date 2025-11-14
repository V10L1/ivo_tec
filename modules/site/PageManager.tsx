import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../contexts/RouterContext';
import { Wand2Icon, EditIcon, Trash2Icon, CopyIcon, StarIcon } from '../../components/icons/Icons';
import NewPageWizardModal from './wizards/NewPageWizardModal';

type PageSummary = Pick<Page, 'id' | 'title' | 'slug' | 'is_homepage' | 'is_published' | 'updated_at'>;

const PageManager: React.FC = () => {
    const [pages, setPages] = useState<PageSummary[]>([]);
    const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'submitting'>('loading');
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    
    const { token } = useAuth();
    const { navigate } = useRouter();

    const fetchPages = useCallback(async () => {
        setStatus('loading');
        try {
            const response = await fetch('/api/site/pages', { headers: { 'Authorization': `Bearer ${token}` } });
            if (!response.ok) throw new Error('Falha ao buscar páginas.');
            const data = await response.json();
            setPages(data);
            setStatus('idle');
        } catch (error) {
            console.error(error);
            setStatus('error');
        }
    }, [token]);

    useEffect(() => {
        fetchPages();
    }, [fetchPages]);
    
    const handleFeedback = (type: 'error' | 'success', message: string) => {
        setFeedback({ type, message });
        setTimeout(() => setFeedback(null), 4000);
    };

    const handlePageCreated = (page: Page) => {
        handleFeedback('success', 'Página criada! Redirecionando para o editor...');
        setIsCreateModalOpen(false);
        window.location.hash = `/${page.slug}?edit=true`;
    };
    
    const handleDeletePage = async (pageId: string, isHomepage: boolean) => {
        if (isHomepage) {
            handleFeedback('error', 'Não é possível excluir a página inicial.');
            return;
        }
        if (!window.confirm('Você tem certeza que deseja excluir esta página? Esta ação é irreversível.')) return;
        setStatus('submitting');
        try {
            const response = await fetch(`/api/site/pages/${pageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.message || 'Falha ao excluir a página.');
            }
            handleFeedback('success', 'Página excluída com sucesso!');
            await fetchPages();
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    const handleDuplicatePage = async (pageId: string) => {
        setStatus('submitting');
        try {
            const response = await fetch(`/api/site/pages/duplicate/${pageId}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
             const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao duplicar a página.');
            }
            handleFeedback('success', 'Página duplicada com sucesso!');
            await fetchPages();
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    const handleEditPage = (page: PageSummary) => {
        const path = page.is_homepage ? '/' : `/${page.slug}`;
        window.location.hash = `${path}?edit=true`;
    };

    const handleToggleStatus = async (page: PageSummary) => {
        if (page.is_homepage) {
            handleFeedback('error', 'A página inicial não pode ser despublicada.');
            return;
        }
        setStatus('submitting');
        try {
            const response = await fetch(`/api/site/pages/${page.id}/status`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ is_published: !page.is_published })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao alterar o status.');
            }
            handleFeedback('success', 'Status da página alterado com sucesso!');
            await fetchPages();
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    const handleSetHomepage = async (pageId: string) => {
        setStatus('submitting');
        try {
            const response = await fetch(`/api/site/pages/${pageId}/set-homepage`, {
                method: 'PATCH',
                headers: { 'Authorization': `Bearer ${token}` },
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao definir como página inicial.');
            }
            handleFeedback('success', 'Página inicial definida com sucesso!');
            await fetchPages();
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    return (
        <div>
            {feedback && (
                <div className={`p-3 rounded-lg mb-4 text-center ${feedback.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="text-xl font-semibold text-white">Gerenciador de Páginas</h3>
                    <p className="text-slate-400">Crie, edite e organize as páginas do seu site.</p>
                </div>
                <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:bg-slate-600"
                    disabled={status === 'submitting'}
                >
                    <Wand2Icon className="w-5 h-5" />
                    Criar Nova Página
                </button>
            </div>

            {status === 'loading' && <p>Carregando páginas...</p>}
            {status === 'error' && <p className="text-red-400">Não foi possível carregar as páginas.</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between">
                        <div className="p-4">
                            <div className="flex justify-between items-start">
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-bold text-lg text-slate-100 truncate">{page.title}</h4>
                                    <p className="text-sm text-slate-400 truncate">/{page.slug}</p>
                                </div>
                                <button
                                    onClick={() => handleSetHomepage(page.id)}
                                    disabled={page.is_homepage || status === 'submitting'}
                                    title={page.is_homepage ? "Esta é a página inicial" : "Definir como página inicial"}
                                    className="p-1 text-slate-400 disabled:text-yellow-400 disabled:cursor-default hover:text-yellow-400 transition-colors"
                                >
                                    <StarIcon className="w-5 h-5" filled={page.is_homepage} />
                                </button>
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                                <button 
                                    onClick={() => handleToggleStatus(page)}
                                    disabled={page.is_homepage || status === 'submitting'}
                                    title={page.is_homepage ? "A página inicial não pode ser despublicada" : "Alterar status"}
                                    className={`${page.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} px-2 py-1 rounded-full transition-colors ${page.is_homepage ? 'cursor-not-allowed opacity-70' : 'hover:bg-slate-700'}`}
                                >
                                    {page.is_published ? 'Publicada' : 'Rascunho'}
                                </button>
                            </div>
                        </div>
                        <div className="p-2 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-2">
                             <button onClick={() => handleDuplicatePage(page.id)} title="Duplicar" className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-md disabled:opacity-50" disabled={status === 'submitting'}><CopyIcon className="w-4 h-4" /></button>
                             <button onClick={() => handleDeletePage(page.id, page.is_homepage)} title={page.is_homepage ? "Não é possível excluir a página inicial" : "Excluir"} className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed" disabled={status === 'submitting' || page.is_homepage}><Trash2Icon className="w-4 h-4" /></button>
                             <button onClick={() => handleEditPage(page)} className="bg-slate-700 hover:bg-cyan-600 text-slate-200 hover:text-white font-semibold py-1 px-3 rounded-md flex items-center gap-2 disabled:opacity-50" disabled={status === 'submitting'}><EditIcon className="w-4 h-4" /> Refinar</button>
                        </div>
                    </div>
                ))}
            </div>

            {isCreateModalOpen && (
                <NewPageWizardModal
                    onClose={() => setIsCreateModalOpen(false)}
                    onPageCreated={handlePageCreated}
                />
            )}
        </div>
    );
};

export default PageManager;