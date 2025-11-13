

import React from 'react';
import { Page, Selection, Viewport } from '../../../../types';

interface BlockInspectorProps {
    selection: Extract<Selection, { type: 'block' }>;
    pageData: Page;
    updatePageData: (updater: (draft: Page) => void) => void;
    viewport: Viewport;
}

// TODO: Implementar a UI do inspetor de Bloco.
const BlockInspector: React.FC<BlockInspectorProps> = ({ selection, pageData, updatePageData, viewport }) => {
    const { id, sectionId, context } = selection;
    
    // Encontrar o bloco para exibir suas propriedades
    const sectionListKey = context === 'footer' ? 'footerSections' : 'sections';
    const section = pageData.content?.[sectionListKey]?.find(s => s.id === sectionId);
    const block = section?.blocks.find(b => b.id === id);

    if (!block) {
        return <div className="p-4 text-slate-400">Bloco não encontrado.</div>;
    }

    return (
        <div className="p-4 space-y-4">
            <h3 className="text-lg font-bold text-white">Inspetor de Bloco</h3>
            <p className="text-sm text-slate-400">ID: {block.id}</p>
            <p className="text-sm text-slate-400">Tipo: {block.type}</p>
            {/* Adicionar campos de edição para as propriedades do bloco aqui */}
        </div>
    );
};

export default BlockInspector;