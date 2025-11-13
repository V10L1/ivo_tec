

import React from 'react';
import { Page, Selection } from '../../../../types';

interface SectionInspectorProps {
    selection: Extract<Selection, { type: 'section' }>;
    pageData: Page;
    updatePageData: (updater: (draft: Page) => void) => void;
}

// TODO: Implementar a UI do inspetor de Seção.
const SectionInspector: React.FC<SectionInspectorProps> = ({ selection, pageData, updatePageData }) => {
    const { id, context } = selection;
    
    const sectionListKey = context === 'footer' ? 'footerSections' : 'sections';
    const section = pageData.content?.[sectionListKey]?.find(s => s.id === id);

    if (!section) {
        return <div className="p-4 text-slate-400">Seção não encontrada.</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-white">Inspetor de Seção</h3>
            <p className="text-sm text-slate-400">ID: {section.id}</p>
            
             <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Colunas da Grade</label>
                <input
                    type="number"
                    value={section.gridSettings.columns}
                    onChange={(e) => updatePageData(draft => {
                        const sec = draft.content[sectionListKey].find(s => s.id === id);
                        if (sec) sec.gridSettings.columns = parseInt(e.target.value, 10) || 12;
                    })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-md p-2"
                />
            </div>
            {/* Adicionar mais campos de edição para as propriedades da seção aqui */}
        </div>
    );
};

export default SectionInspector;