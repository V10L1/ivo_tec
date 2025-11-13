

import React from 'react';
import { PageBlock, ThemeSettings, Viewport } from '../../../types';
import BlockRenderer from './BlockRenderer';

const getBorderRadiusClass = (radius: any) => {
    switch (radius) {
        case 'full': return 'rounded-full';
        case 'none': return 'rounded-none';
        case 'medium': default: return 'rounded-lg';
    }
}

interface InteractiveBlockProps {
    block: PageBlock;
    theme: ThemeSettings;
    viewport: Viewport;
    isSelected: boolean;
    onBlockMouseDown: (e: React.MouseEvent) => void;
    onResizeStart: (e: React.MouseEvent, direction: string) => void;
}

const InteractiveBlock: React.FC<InteractiveBlockProps> = ({
    block,
    theme,
    viewport,
    isSelected,
    onBlockMouseDown,
    onResizeStart,
}) => {
    const layout = block.layout[viewport];
    const borderRadiusClass = getBorderRadiusClass(block.styles?.borderRadius);
    
    const blockStyle: React.CSSProperties = {
        gridColumn: `${layout.colStart} / ${layout.colEnd}`,
        gridRow: `${layout.rowStart} / ${layout.rowEnd}`,
        alignSelf: layout.alignSelf,
        justifySelf: layout.justifySelf,
        zIndex: block.styles?.zIndex || 'auto',
        position: 'relative' // Needed for resize handles
    };

    const resizeHandles = ['ne', 'se', 'sw', 'nw', 'n', 'e', 's', 'w'];

    return (
        <div
            id={block.id}
            style={blockStyle}
            className={`group transition-shadow duration-200 ${isSelected ? 'shadow-2xl shadow-cyan-500/30' : ''}`}
            onMouseDown={onBlockMouseDown}
            onClick={(e) => e.stopPropagation()}
        >
            <div className={`absolute inset-0 ring-2 pointer-events-none transition-all duration-200 ${borderRadiusClass} ${isSelected ? 'ring-cyan-500' : 'ring-transparent group-hover:ring-cyan-500/50'}`}></div>
            
            <div className={`w-full h-full overflow-hidden ${borderRadiusClass}`}>
                <BlockRenderer
                    block={block}
                    theme={theme}
                    viewport={viewport}
                    isEditing={true}
                />
            </div>

            {isSelected && resizeHandles.map(dir => (
                <div
                    key={dir}
                    className={`absolute w-3 h-3 bg-cyan-500 border-2 border-slate-900 rounded-full resize-handle-${dir} cursor-${dir}-resize z-50`}
                    onMouseDown={(e) => {
                        e.stopPropagation();
                        onResizeStart(e, dir);
                    }}
                ></div>
            ))}
        </div>
    );
};

export default InteractiveBlock;