import React, { useState } from 'react';
import { Page, ThemeSettings } from '../../../types';
import { useAuth } from '../../../contexts/AuthContext';
import { palettes, Palette } from '../utils/palettes';
import { templates, Template } from '../utils/templates';
import { Wand2Icon, ArrowLeftIcon } from '../../../components/icons/Icons';

interface NewPageWizardModalProps {
    onClose: () => void;
    onPageCreated: (page: Page) => void;
}

const NewPageWizardModal: React.FC<NewPageWizardModalProps> = ({ onClose, onPageCreated }) => {
    const [step, setStep] = useState<'title' | 'palette' | 'template'>('title');
    const [title, setTitle] = useState('');
    const [selectedPalette, setSelectedPalette] = useState<Palette | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
    const [status, setStatus] = useState<'idle' | 'submitting'>('idle');
    const [error, setError] = useState<string | null>(null);
    const { token } = useAuth();

    const handleCreatePage = async () => {
        if (!title || !selectedTemplate || !selectedPalette) {
            setError("Por favor, complete todos os passos.");
            return;
        }

        setStatus('submitting');
        setError(null);

        try {
            const theme: ThemeSettings = {
                ...selectedPalette.colors,
                headingFont: 'sans-serif',
                bodyFont: 'sans-serif'
            };

            const response = await fetch('/api/site/pages/from-template', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ title, templateId: selectedTemplate.id, theme })
            });

            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Falha ao criar a página.');
            }
            onPageCreated(data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setStatus('idle');
        }
    };
    
    const renderStep = () => {
        switch (step) {
            case 'title':
                return (
                    <div>
                         <h3 className="text-lg font-bold text-white mb-2">Qual é o nome da nova página?</h3>
                         <p className="text-sm text-slate-400 mb-4">Este nome será usado como título e para gerar a URL inicial.</p>
                         <input
                            type="text"
                            value={title}
                            onChange={e => setTitle(e.target.value)}
                            required
                            className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                            placeholder="Ex: Sobre Nós"
                         />
                    </div>
                );
            case 'palette':
                return (
                     <div>
                         <h3 className="text-lg font-bold text-white mb-2">Escolha uma paleta de cores</h3>
                         <p className="text-sm text-slate-400 mb-4">Isso definirá a aparência inicial do seu site. Você poderá customizar depois.</p>
                         <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                            {palettes.map(p => (
                                <div key={p.name} onClick={() => setSelectedPalette(p)} className={`cursor-pointer border-2 rounded-lg p-2 ${selectedPalette?.name === p.name ? 'border-cyan-400' : 'border-slate-700 hover:border-slate-500'}`}>
                                    <div className="flex h-16">
                                        <div style={{ backgroundColor: p.colors.primaryColor }} className="w-1/2"></div>
                                        <div className="w-1/2 flex flex-col">
                                            <div style={{ backgroundColor: p.colors.secondaryColor }} className="h-1/2"></div>
                                            <div style={{ backgroundColor: p.colors.surfaceColor }} className="h-1/2"></div>
                                        </div>
                                    </div>
                                    <p className="text-sm text-center mt-2 font-semibold text-slate-300">{p.name}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                );
            case 'template':
                 return (
                     <div>
                         <h3 className="text-lg font-bold text-white mb-2">Selecione um modelo inicial</h3>
                         <p className="text-sm text-slate-400 mb-4">Escolha um layout como ponto de partida para sua página.</p>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {templates.map(t => (
                                <div key={t.id} onClick={() => setSelectedTemplate(t)} className={`cursor-pointer border-2 rounded-lg p-2 text-center ${selectedTemplate?.id === t.id ? 'border-cyan-400' : 'border-slate-700 hover:border-slate-500'}`}>
                                    <div className="h-24 bg-slate-700 rounded mb-2 flex items-center justify-center">
                                       <t.Icon className="w-10 h-10 text-slate-500" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-300">{t.name}</p>
                                </div>
                            ))}
                         </div>
                    </div>
                );
        }
    }

    const handleNext = () => {
        if (step === 'title') setStep('palette');
        if (step === 'palette') setStep('template');
    };

    const handleBack = () => {
        if (step === 'template') setStep('palette');
        if (step === 'palette') setStep('title');
    };
    
    const canProceed = (step === 'title' && title) || (step === 'palette' && selectedPalette) || (step === 'template' && selectedTemplate);

    return (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-4xl border border-slate-700 flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex-shrink-0">
                     <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                        <Wand2Icon className="w-6 h-6 text-cyan-400" />
                        Assistente de Criação de Página
                    </h3>
                </div>
                <div className="p-6 overflow-y-auto">
                    {error && <p className="text-sm text-red-400 mb-4">{error}</p>}
                    {renderStep()}
                </div>
                <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div>
                        {step !== 'title' && (
                            <button onClick={handleBack} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg flex items-center gap-2">
                                <ArrowLeftIcon className="w-4 h-4"/>
                                Voltar
                            </button>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        <button type="button" onClick={onClose} className="bg-slate-700 hover:bg-slate-600 text-slate-200 font-bold py-2 px-4 rounded-lg">Cancelar</button>
                        {step !== 'template' ? (
                             <button onClick={handleNext} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg" disabled={!canProceed}>
                                Próximo
                            </button>
                        ) : (
                             <button onClick={handleCreatePage} className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg" disabled={!canProceed || status === 'submitting'}>
                                {status === 'submitting' ? 'Criando Página...' : 'Finalizar e Criar Página'}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default NewPageWizardModal;
