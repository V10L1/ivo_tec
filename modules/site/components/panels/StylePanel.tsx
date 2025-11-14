import React from 'react';
import { PageBlock, ThemeSettings, ContainerStyles } from '../../../../types';
import ColorInput from '../inputs/ColorInput';

interface StylePanelProps {
    block: PageBlock;
    sectionId: string;
    theme: ThemeSettings;
    onUpdateBlock: (updatedBlock: PageBlock, sectionId: string) => void;
}

const StylePanel: React.FC<StylePanelProps> = ({ block, sectionId, theme, onUpdateBlock }) => {

    const handleStyleChange = (field: keyof ContainerStyles, value: any) => {
        const updatedBlock = {
            ...block,
            styles: { ...(block.styles || {}), [field]: value }
        };
        onUpdateBlock(updatedBlock, sectionId);
    };

    return (
        <div className="p-4 space-y-4">
            <ColorInput
                label="Cor de Fundo"
                colorValue={block.styles?.backgroundColor}
                theme={theme}
                onChange={(newColor) => handleStyleChange('backgroundColor', newColor)}
                defaultColor={{ type: 'global', value: 'surface' }}
            />
        </div>
    );
};

export default StylePanel;
