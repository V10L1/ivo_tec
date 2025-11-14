import React from 'react';
import { PageBlock, StyledText } from '../../../../types';

interface ContentPanelProps {
    block: PageBlock;
    sectionId: string;
    onUpdateBlock: (updatedBlock: PageBlock, sectionId: string) => void;
}

const ContentPanel: React.FC<ContentPanelProps> = ({ block, sectionId, onUpdateBlock }) => {

    const handleContentChange = (field: string, value: any) => {
        const updatedBlock = {
            ...block,
            content: { ...(block.content as any), [field]: value }
        };
        // FIX: Assert type to resolve discriminated union update issue.
        onUpdateBlock(updatedBlock as PageBlock, sectionId);
    };

    const handleStyledTextChange = (field: keyof StyledText, subField: string, value: any) => {
        const styledText = (block.content as any)[field] as StyledText;
        const updatedStyledText = {
            ...styledText,
            [subField]: value
        };
        handleContentChange(field as string, updatedStyledText);
    };

    const renderContentFields = () => {
        const content = block.content as any;
        return Object.keys(content).map(key => {
            const value = content[key];
            if (typeof value === 'string') {
                return (
                    <div key={key}>
                        <label className="capitalize block text-slate-400 mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <input
                            type="text"
                            value={value}
                            onChange={e => handleContentChange(key, e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                        />
                    </div>
                );
            }
            if (typeof value === 'object' && value && 'text' in value) {
                 return (
                    <div key={key}>
                        <label className="capitalize block text-slate-400 mb-1">{key.replace(/([A-Z])/g, ' $1')}</label>
                        <textarea
                            value={value.text}
                            onChange={e => handleStyledTextChange(key as keyof StyledText, 'text', e.target.value)}
                            className="w-full bg-slate-800 border border-slate-700 rounded-md p-2"
                            rows={4}
                        />
                    </div>
                );
            }
             if (typeof value === 'boolean') {
                 return (
                     <div key={key} className="flex items-center justify-between p-2 bg-slate-800/50 rounded-md">
                         <label className="capitalize block text-slate-300">{key.replace(/([A-Z])/g, ' $1')}</label>
                         <input
                            type="checkbox"
                            checked={value}
                            onChange={e => handleContentChange(key, e.target.checked)}
                            className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-600"
                        />
                     </div>
                 )
             }
            return null;
        });
    };

    return (
        <div className="p-4 space-y-4">
            {renderContentFields()}
        </div>
    );
};

export default ContentPanel;