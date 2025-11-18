
import React, { useState, useEffect, useCallback } from 'react';
import { Page } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { useRouter } from '../../App';
import { PlusCircleIcon, EditIcon, Trash2Icon, CopyIcon, GlobeIcon, SparklesIcon, XCircleIcon } from '../../components/icons/Icons';

type PageSummary = Pick<Page, 'id' | 'title' | 'slug' | 'is_homepage' | 'is_published' | 'updated_at'>;

const PageManager: React.FC = () => {
    const [pages, setPages] = useState<PageSummary[]>([]);
    const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'submitting'>('loading');
    const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
    
    // Modals
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isAIModalOpen, setIsAIModalOpen] = useState(false);
    
    const [newPage, setNewPage] = useState({ title: '', slug: '' });
    
    // AI State
    const [aiPrompt, setAiPrompt] = useState('');
    const [aiBrandName, setAiBrandName] = useState('');
    const [aiStatus, setAiStatus] = useState<'idle' | 'generating' | 'success'>('idle');

    const { token } = useAuth();
    const { navigate } = useRouter();

    const fetchPages = useCallback(async () => {
        setStatus('loading');
        try {
            const response = await fetch('/api/site/pages', { headers: { 'Authorization': `Bearer ${token}` } });
            
            const contentType = response.headers.get("content-type");
            if (!response.ok) {
                if (contentType && contentType.indexOf("application/json") !== -1) {
                     const err = await response.json();
                     throw new Error(err.message || 'Falha ao buscar páginas.');
                } else {
                    throw new Error(`Erro do servidor: ${response.status} ${response.statusText}`);
                }
            }

            if (contentType && contentType.indexOf("application/json") !== -1) {
                const data = await response.json();
                setPages(data);
                setStatus('idle');
            } else {
                throw new Error("Resposta inválida do servidor (não é JSON).");
            }

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
    
    const handleCreatePage = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const response = await fetch('/api/site/pages', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newPage)
            });
            
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                 data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data?.message || 'Falha ao criar a página.');
            }
            handleFeedback('success', 'Página criada com sucesso!');
            await fetchPages();
            setIsCreateModalOpen(false);
            setNewPage({ title: '', slug: '' });
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    const handleGenerateAI = async (e: React.FormEvent) => {
        e.preventDefault();
        setAiStatus('generating');
        try {
            const response = await fetch('/api/site/pages/ai-generate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt: aiPrompt, brandName: aiBrandName })
            });
            
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                 data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data?.message || 'Falha na geração de IA.');
            }
            
            handleFeedback('success', 'Site gerado com sucesso pela IA! Redirecionando...');
            setAiStatus('success');
            
            // Pequeno delay para ler a mensagem
            setTimeout(() => {
                setIsAIModalOpen(false);
                setAiPrompt('');
                setAiBrandName('');
                setAiStatus('idle');
                fetchPages();
                // Opcional: Abrir editor diretamente
                // handleEditPage(data); 
            }, 1500);

        } catch (error: any) {
            handleFeedback('error', error.message);
            setAiStatus('idle');
        }
    };

    const handleDeletePage = async (pageId: string) => {
        if (!window.confirm('Você tem certeza que deseja excluir esta página? Esta ação é irreversível.')) return;
        setStatus('submitting');
        try {
            const response = await fetch(`/api/site/pages/${pageId}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            if (!response.ok) {
                let errorMessage = 'Falha ao excluir a página.';
                const contentType = response.headers.get("content-type");
                if (contentType && contentType.includes("application/json")) {
                     const data = await response.json();
                     errorMessage = data.message || errorMessage;
                }
                throw new Error(errorMessage);
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
            
            const contentType = response.headers.get("content-type");
            let data;
            if (contentType && contentType.includes("application/json")) {
                 data = await response.json();
            }

            if (!response.ok) {
                throw new Error(data?.message || 'Falha ao duplicar a página.');
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
        navigate(path);
    };
    
    const generateSlug = (title: string) => {
        return title
            .toLowerCase()
            .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Remove accents
            .replace(/[^a-z0-9\s-]/g, '') // Remove non-alphanumeric characters except spaces and hyphens
            .trim()
            .replace(/\s+/g, '-') // Replace spaces with hyphens
            .replace(/-+/g, '-'); // Replace multiple hyphens with a single one
    };

    return (
        <div>
            {feedback && (
                <div className={`p-3 rounded-lg mb-4 text-center ${feedback.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                    {feedback.message}
                </div>
            )}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
                <div>
                    <h3 className="text-xl font-semibold text-white">Gerenciador de Páginas</h3>
                    <p className="text-slate-400">Crie, edite e organize as páginas do seu site.</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => setIsAIModalOpen(true)}
                        className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-all shadow-lg shadow-purple-500/20 border border-purple-500/30"
                        disabled={status === 'submitting'}
                    >
                        <SparklesIcon className="w-5 h-5 text-yellow-200" />
                        Criar com IA
                    </button>
                    <button
                        onClick={() => setIsCreateModalOpen(true)}
                        className="bg-slate-700 hover:bg-slate-600 text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2 transition-colors disabled:bg-slate-600"
                        disabled={status === 'submitting'}
                    >
                        <PlusCircleIcon className="w-5 h-5" />
                        Manual
                    </button>
                </div>
            </div>

            {status === 'loading' && <p>Carregando páginas...</p>}
            {status === 'error' && <p className="text-red-400">Não foi possível carregar as páginas. Verifique se o servidor está rodando corretamente.</p>}
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {pages.map(page => (
                    <div key={page.id} className="bg-slate-800 rounded-lg border border-slate-700 flex flex-col justify-between transition-all hover:border-cyan-500/50 hover:shadow-lg hover:shadow-cyan-500/10">
                        <div className="p-4">
                            <h4 className="font-bold text-lg text-slate-100 truncate">{page.title}</h4>
                            <p className="text-sm text-slate-400 truncate">/{page.slug}</p>
                            <div className="flex items-center gap-4 mt-2 text-xs">
                                {page.is_homepage && <span className="bg-cyan-500/20 text-cyan-400 px-2 py-1 rounded-full">Página Inicial</span>}
                                <span className={`${page.is_published ? 'bg-green-500/20 text-green-400' : 'bg-yellow-500/20 text-yellow-400'} px-2 py-1 rounded-full`}>
                                    {page.is_published ? 'Publicada' : 'Rascunho'}
                                </span>
                            </div>
                        </div>
                        <div className="p-2 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-2">
                             <button onClick={() => handleDuplicatePage(page.id)} title="Duplicar" className="p-2 text-slate-400 hover:text-cyan-400 hover:bg-slate-700 rounded-md disabled:opacity-50" disabled={status === 'submitting'}><CopyIcon className="w-4 h-4" /></button>
                             <button onClick={() => handleDeletePage(page.id)} title="Excluir" className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-700 rounded-md disabled:opacity-50" disabled={status === 'submitting'}><Trash2Icon className="w-4 h-4" /></button>
                             <button onClick={() => handleEditPage(page)} className="bg-slate-700 hover:bg-cyan-600 text-slate-200 hover:text-white font-semibold py-1 px-3 rounded-md flex items-center gap-2 disabled:opacity-50" disabled={status === 'submitting'}><EditIcon className="w-4 h-4" /> Editar</button>
                        </div>
                    </div>
                ))}
            </div>

            {/* MODAL MANUAL */}
            {isCreateModalOpen && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-800 rounded-lg shadow-2xl w-full max-w-md border border-slate-700 animate-fade-in">
                        <form onSubmit={handleCreatePage}>
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-bold text-white">Criar Nova Página</h3>
                                    <button type="button" onClick={() => setIsCreateModalOpen(false)} className="text-slate-400 hover:text-white"><XCircleIcon className="w-6 h-6"/></button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Título da Página</label>
                                        <input 
                                            type="text" 
                                            value={newPage.title} 
                                            onChange={e => setNewPage({ title: e.target.value, slug: generateSlug(e.target.value) })}
                                            required 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                                            placeholder="Ex: Sobre Nós"
                                        />
                                    </div>
                                     <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-1">Slug da URL</label>
                                        <input 
                                            type="text" 
                                            value={newPage.slug} 
                                            onChange={e => setNewPage({ ...newPage, slug: e.target.value })}
                                            required 
                                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 focus:ring-2 focus:ring-cyan-500 focus:border-transparent outline-none"
                                            placeholder="Ex: sobre-nos"
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="px-6 py-4 bg-slate-900/50 border-t border-slate-700 flex justify-end gap-3 rounded-b-lg">
                                <button type="button" onClick={() => setIsCreateModalOpen(false)} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                                <button type="submit" className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg" disabled={status === 'submitting'}>
                                    {status === 'submitting' ? 'Criando...' : 'Criar Página'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL IA */}
            {isAIModalOpen && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4">
                    <div className="bg-slate-900 rounded-xl shadow-2xl w-full max-w-lg border border-purple-500/50 animate-fade-in overflow-hidden">
                        <div className="bg-gradient-to-r from-purple-900 to-indigo-900 p-6 border-b border-purple-500/30">
                            <div className="flex justify-between items-start">
                                <div>
                                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                        <SparklesIcon className="w-6 h-6 text-yellow-300" /> 
                                        Criar Site com IA
                                    </h3>
                                    <p className="text-purple-200 text-sm mt-1">Descreva sua ideia e deixe a mágica acontecer.</p>
                                </div>
                                <button type="button" onClick={() => !aiStatus.includes('generating') && setIsAIModalOpen(false)} className="text-purple-300 hover:text-white disabled:opacity-50"><XCircleIcon className="w-6 h-6"/></button>
                            </div>
                        </div>
                        
                        <form onSubmit={handleGenerateAI}>
                            <div className="p-6 space-y-5">
                                {aiStatus === 'generating' ? (
                                    <div className="flex flex-col items-center justify-center py-8 space-y-4">
                                        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                                        <p className="text-purple-300 font-medium animate-pulse">Criando layouts, escrevendo textos e buscando imagens...</p>
                                    </div>
                                ) : (
                                    <>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Marca / Empresa</label>
                                            <input 
                                                type="text" 
                                                value={aiBrandName} 
                                                onChange={e => setAiBrandName(e.target.value)}
                                                required 
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                                                placeholder="Ex: Pizzaria do Luigi"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-400 mb-1">Sobre o que é o site?</label>
                                            <textarea 
                                                value={aiPrompt} 
                                                onChange={e => setAiPrompt(e.target.value)}
                                                required 
                                                rows={4}
                                                className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none resize-none"
                                                placeholder="Ex: Uma cafeteria moderna no centro da cidade, especializada em grãos artesanais e ambiente aconchegante para leitura. Quero um site com tons de marrom e creme."
                                            />
                                        </div>
                                    </>
                                )}
                            </div>

                            <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-800 flex justify-end gap-3">
                                <button 
                                    type="button" 
                                    onClick={() => setIsAIModalOpen(false)} 
                                    disabled={aiStatus === 'generating'}
                                    className="bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold py-2 px-4 rounded-lg disabled:opacity-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    type="submit" 
                                    disabled={aiStatus === 'generating'}
                                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold py-2 px-6 rounded-lg shadow-lg shadow-purple-500/20 disabled:opacity-70 flex items-center gap-2"
                                >
                                    {aiStatus === 'generating' ? 'Gerando...' : <><SparklesIcon className="w-4 h-4" /> Gerar Site</>}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default PageManager;
