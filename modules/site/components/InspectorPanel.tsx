

import React from 'react';
import { Page, Selection, Viewport } from '../../../types';
// Import sub-inspectors
import PageInspector from './inspectors/PageInspector';
import SectionInspector from './inspectors/SectionInspector';
import BlockInspector from './inspectors/BlockInspector';


interface InspectorPanelProps {
    selection: Selection;
    pageData: Page;
    updatePageData: (updater: (draft: Page) => void) => void;
    viewport: Viewport;
}

const InspectorPanel: React.FC<InspectorPanelProps> = ({ selection, pageData, updatePageData, viewport }) => {
    const renderInspectorContent = () => {
        if (!selection) {
            return <div className="p-4 text-slate-400">Selecione um elemento para inspecionar.</div>;
        }

        switch (selection.type) {
            case 'page':
                return <PageInspector pageData={pageData} updatePageData={updatePageData} />;
            case 'section':
                return <SectionInspector selection={selection} pageData={pageData} updatePageData={updatePageData} />;
            case 'block':
                return <BlockInspector selection={selection} pageData={pageData} updatePageData={updatePageData} viewport={viewport} />;
            default:
                return <div className="p-4 text-slate-400">Seleção inválida.</div>;
        }
    };

    return (
        <div className="text-sm">
            {renderInspectorContent()}
        </div>
    );
};

export default InspectorPanel;