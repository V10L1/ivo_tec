
import React, { useState, useEffect } from 'react';
import { Page } from '../../../types';
import { XCircleIcon } from '../../../components/icons/Icons';

interface SEOModalProps {
    pageData: Page;
    setPageData: React.Dispatch<React.SetStateAction<Page | null>>;
    onClose: () => void;
}

const InputField: React.FC<{ label: string; value: string; onChange: (value: string) => void; type?: string; placeholder?: string; maxLength?: number; }> = ({ label, value, onChange, type = "text", maxLength, ...props }) => (
    <div>
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            {maxLength && <span className="text-xs text-slate-500">{value.length}/{maxLength}</span>}
        </div>
        <input value={value} onChange={e => onChange(e.target.value)} type={type} {...props} maxLength={maxLength} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200" />
    </div>
);

const TextareaField: React.FC<{ label: string; value: string; onChange: (value: string) => void; placeholder?: string; maxLength?: number; rows?: number; }> = ({ label, value, onChange, maxLength, ...props }) => (
    <div>
        <div className="flex justify-between items-center">
            <label className="block text-sm font-medium text-slate-400 mb-1">{label}</label>
            {maxLength && <span className="text-xs text-slate-500">{value.length}/{maxLength}</span>}
        </div>
        <textarea value={value} onChange={e => onChange(e.target.value)} {...props} maxLength={maxLength} className="w-full bg-slate-900 border border-slate-700 rounded-md p-2 text-sm text-slate-200" />
    </div>
);


const SEOModal: React.FC<SEOModalProps> = ({ pageData, setPageData, onClose }) => {
    const [title, setTitle] = useState(pageData.title || '');
    const [slug, setSlug] = useState(pageData.slug || '');
    const [metaTitle, setMetaTitle] = useState(pageData.metaTitle || '');
    const [metaDescription, setMetaDescription] = useState(pageData.metaDescription || '');
    const [socialImage, setSocialImage] = useState(pageData.socialImageUrl || '');

    useEffect(() => {
        // Atualiza o estado do componente pai em tempo real
        setPageData(prev => prev ? ({
            ...prev,
            title,
            slug,
            metaTitle,
            metaDescription,
            socialImageUrl: socialImage,
        }) : null);
    }, [title, slug, metaTitle, metaDescription, socialImage, setPageData]);

    return (
        <div className="fixed inset-0 bg-black/60 z-[2000] flex items-center justify-center p-4">
            <div className="bg-slate-800 rounded-lg shadow-xl w-full max-w-2xl border border-slate-700 relative flex flex-col max-h-[90vh]">
                <div className="p-6 border-b border-slate-700 flex-shrink-0">
                    <h3 className="text-lg font-bold text-white">Configurações Gerais e SEO</h3>
                    <p className="text-sm text-slate-400">Otimize como sua página aparece nos mecanismos de busca e redes sociais.</p>
                </div>
                <div className="p-6 space-y-6 overflow-y-auto">
                    {/* Campos de SEO */}
                    <InputField label="Título da Página (Interno)" value={title} onChange={setTitle} placeholder="Ex: Página de Contato" />
                    <InputField label="Slug da URL" value={slug} onChange={setSlug} placeholder="Ex: contato" />
                    <InputField label="Título para SEO (Meta Title)" value={metaTitle} onChange={setMetaTitle} placeholder="Título que aparece no Google" maxLength={60} />
                    <TextareaField label="Descrição para SEO (Meta Description)" value={metaDescription} onChange={setMetaDescription} placeholder="Descrição que aparece no Google" maxLength={160} rows={3}/>
                    <InputField label="URL da Imagem para Redes Sociais" value={socialImage} onChange={setSocialImage} placeholder="https://exemplo.com/imagem.png" />

                    {/* Pré-visualização do Google */}
                    <div className="mt-6">
                        <h4 className="font-semibold mb-2 text-slate-300">Pré-visualização do Google</h4>
                        <div className="p-4 bg-slate-900 rounded-lg border border-slate-700">
                            <p className="text-blue-500 text-lg truncate">{metaTitle || title}</p>
                            <p className="text-green-500 text-sm truncate">https://seusite.com/{slug}</p>
                            <p className="text-slate-400 text-sm mt-1">{metaDescription || "A descrição da sua página aparecerá aqui."}</p>
                        </div>
                    </div>
                </div>
                 <div className="px-6 py-4 bg-slate-800/50 border-t border-slate-700 flex justify-end gap-3 flex-shrink-0">
                    <button onClick={onClose} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg">Fechar</button>
                </div>
            </div>
        </div>
    );
};

export default SEOModal;
