
import React from 'react';
import { Page } from '../../../../types';

interface PageInspectorProps {
    pageData: Page;
    updatePageData: (updater: (draft: Page) => void) => void;
}

// TODO: Implementar a UI do inspetor de Página.
const PageInspector: React.FC<PageInspectorProps> = ({ pageData, updatePageData }) => {

    if (!pageData.content) {
        return <div className="p-4 text-slate-400">Conteúdo da página não encontrado.</div>;
    }
    
    const { settings, theme } = pageData.content;

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-white">Inspetor da Página</h3>
            <p className="text-sm text-slate-400">Configurações globais para "{pageData.title}"</p>
            
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome da Marca</label>
                <input
                    type="text"
                    value={settings.brandName}
                    onChange={(e) => updatePageData(draft => { draft.content.settings.brandName = e.target.value; })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                />
            </div>
            
            {/* Adicionar mais campos para theme, etc. */}
        </div>
    );
};

export default PageInspector;
