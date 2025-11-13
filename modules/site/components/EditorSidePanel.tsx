

import React, { useState } from 'react';
import { Page, Selection, Viewport } from '../../../types';
import { ChevronLeftIcon, ChevronRightIcon } from '../../../components/icons/Icons';
import InspectorPanel from './InspectorPanel';
import ComponentsPanel from './ComponentsPanel';
import AiAssistantPanel from './AiAssistantPanel';

interface EditorSidePanelProps {
    isOpen: boolean;
    setIsOpen: (isOpen: boolean) => void;
    selection: Selection;
    pageData: Page;
    updatePageData: (updater: (draft: Page) => void) => void;
    handleComponentMouseDown: (e: React.MouseEvent, type: 'block' | 'section', itemData: any, label: string, Icon: React.FC<any>) => void;
    viewport: Viewport;
}

const EditorSidePanel: React.FC<EditorSidePanelProps> = ({
    isOpen,
    setIsOpen,
    selection,
    pageData,
    updatePageData,
    handleComponentMouseDown,
    viewport
}) => {
    const [activeTab, setActiveTab] = useState<'components' | 'inspector' | 'ai'>('inspector');

    return (
        <>
            <div className={`fixed top-0 left-0 h-full bg-slate-900 border-r border-slate-700 z-[1000] w-80 transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                <div className="flex flex-col h-full pt-16">
                    <div className="flex-shrink-0 p-4 border-b border-slate-700">
                        <h3 className="text-xl font-bold">Editor</h3>
                        <div className="flex mt-4 bg-slate-800 p-1 rounded-md">
                            <button onClick={() => setActiveTab('components')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'components' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Componentes</button>
                            <button onClick={() => setActiveTab('inspector')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'inspector' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>Inspector</button>
                            <button onClick={() => setActiveTab('ai')} className={`flex-1 py-1 text-sm rounded ${activeTab === 'ai' ? 'bg-cyan-600 text-white' : 'text-slate-300'}`}>AI</button>
                        </div>
                    </div>
                    <div className="flex-grow overflow-y-auto">
                        {activeTab === 'components' && (
                            <ComponentsPanel onComponentMouseDown={handleComponentMouseDown} />
                        )}
                        {activeTab === 'inspector' && (
                            <InspectorPanel
                                selection={selection}
                                pageData={pageData}
                                updatePageData={updatePageData}
                                viewport={viewport}
                            />
                        )}
                        {activeTab === 'ai' && (
                            <AiAssistantPanel 
                                selection={selection}
                                updatePageData={updatePageData}
                            />
                        )}
                    </div>
                </div>
                <button onClick={() => setIsOpen(false)} className="absolute top-1/2 -right-4 bg-slate-800 p-1 rounded-r-lg z-50 hover:bg-cyan-600"><ChevronLeftIcon className="w-5 h-5"/></button>
            </div>
            {!isOpen && <button onClick={() => setIsOpen(true)} className="fixed top-1/2 left-0 -translate-y-1/2 bg-slate-800/80 p-2 rounded-r-lg z-50 hover:bg-cyan-600"><ChevronRightIcon className="w-5 h-5"/></button>}
        </>
    );
};

export default EditorSidePanel;