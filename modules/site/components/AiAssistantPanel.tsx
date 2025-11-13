

import React, { useState } from 'react';
import { Page, Selection } from '../../../types';
import { BotIcon, Wand2Icon, SparklesIcon, TypeIcon, ImageIcon } from '../../../components/icons/Icons';
import { useAuth } from '../../../contexts/AuthContext';

interface AiAssistantPanelProps {
    selection: Selection;
    updatePageData: (updater: (draft: Page) => void) => void;
}

const AiAssistantPanel: React.FC<AiAssistantPanelProps> = ({ selection, updatePageData }) => {
    const { token } = useAuth();
    const [prompt, setPrompt] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const canUseTextAI = selection?.type === 'block' && ['hero', 'text'].includes(selection.blockType);
    const canUseImageAI = selection?.type === 'block' && selection.blockType === 'image';

    const handleGenerate = async (type: 'text' | 'image') => {
        if (!prompt || isLoading || !selection || selection.type !== 'block') return;
        
        setIsLoading(true);
        setError(null);
        
        const endpoint = type === 'text' ? '/api/ai/generate/text' : '/api/ai/generate/image';
        
        try {
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ prompt })
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.message || `Falha ao gerar ${type}`);
            }

            const data = await response.json();

            updatePageData(draft => {
                const sectionListKey = selection.context === 'footer' ? 'footerSections' : 'sections';
                const section = draft.content?.[sectionListKey]?.find(s => s.id === selection.sectionId);
                if (section) {
                    const block = section.blocks.find(b => b.id === selection.id);
                    if (block) {
                        if (type === 'text') {
                            if (block.type === 'hero') {
                                block.content.subtitle.text = data.text;
                            } else if (block.type === 'text') {
                                block.content.body.text = data.text;
                            }
                        } else if (type === 'image' && block.type === 'image') {
                            block.content.imageUrl = data.imageUrl;
                        }
                    }
                }
            });

        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="p-4">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <BotIcon className="w-5 h-5 text-cyan-400" />
                Assistente de IA
            </h3>

            {!selection || selection.type !== 'block' ? (
                <p className="text-sm text-slate-400">Selecione um bloco de texto ou imagem na página para ativar o assistente de IA.</p>
            ) : (
                <div className="space-y-4">
                    <div>
                        <label htmlFor="ai-prompt" className="block text-sm font-medium text-slate-300 mb-1">Seu Comando</label>
                        <textarea
                            id="ai-prompt"
                            rows={4}
                            value={prompt}
                            onChange={(e) => setPrompt(e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2 text-sm text-slate-200"
                            placeholder={canUseTextAI ? "Ex: Escreva um parágrafo sobre a importância da velocidade..." : canUseImageAI ? "Ex: Uma motocicleta futurista em uma estrada de néon..." : "Selecione um bloco compatível"}
                        />
                    </div>
                    {error && <p className="text-sm text-red-400">{error}</p>}
                    <div className="flex flex-col gap-2">
                        <button
                            onClick={() => handleGenerate('text')}
                            disabled={!canUseTextAI || isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-white bg-cyan-600 hover:bg-cyan-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            <TypeIcon className="w-4 h-4" />
                            {isLoading ? 'Gerando...' : 'Gerar Texto'}
                        </button>
                         <button
                            onClick={() => handleGenerate('image')}
                            disabled={!canUseImageAI || isLoading}
                            className="w-full flex items-center justify-center gap-2 py-2 px-4 rounded-md text-white bg-purple-600 hover:bg-purple-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
                        >
                            <ImageIcon className="w-4 h-4" />
                            {isLoading ? 'Gerando...' : 'Gerar Imagem'}
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AiAssistantPanel;