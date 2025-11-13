
import React from 'react';
import { PageBlock } from '../../../types';
import { createNewSection } from '../utils/defaults';
import { MotorcycleIcon, TypeIcon, ImageIcon, CodeIcon, MenuIcon, VideoIcon, DividerIcon, SparklesIcon, SectionIcon } from '../../../components/icons/Icons';

const blockComponentList: { type: PageBlock['type']; label: string; Icon: React.FC<any> }[] = [
    { type: 'hero', label: 'Herói', Icon: MotorcycleIcon },
    { type: 'text', label: 'Texto', Icon: TypeIcon },
    { type: 'image', label: 'Imagem', Icon: ImageIcon },
    { type: 'button', label: 'Botão', Icon: CodeIcon },
    { type: 'menu', label: 'Menu', Icon: MenuIcon },
    { type: 'video', label: 'Vídeo', Icon: VideoIcon },
    { type: 'divider', label: 'Divisor', Icon: DividerIcon },
    { type: 'spacer', label: 'Espaçador', Icon: SparklesIcon },
];

const sectionComponentList = [
    { type: 'section', label: 'Seção Vazia', Icon: SectionIcon, data: createNewSection }
];

interface ComponentsPanelProps {
    onComponentMouseDown: (e: React.MouseEvent, type: 'block' | 'section', itemData: any, label: string, Icon: React.FC<any>) => void;
}

const ComponentsPanel: React.FC<ComponentsPanelProps> = ({ onComponentMouseDown }) => {
    return (
        <div className="space-y-4 p-4">
            <div>
                <h4 className="font-bold mb-2 text-slate-300">Seções</h4>
                {sectionComponentList.map(comp => (
                    <div
                        key={comp.type}
                        onMouseDown={(e) => onComponentMouseDown(e, 'section', comp.data, comp.label, comp.Icon)}
                        className="p-2 bg-slate-800 rounded flex items-center gap-2 cursor-grab hover:bg-slate-700"
                    >
                        <comp.Icon className="w-5 h-5 text-cyan-400"/>
                        <span>{comp.label}</span>
                    </div>
                ))}
            </div>
            <div>
                <h4 className="font-bold mb-2 text-slate-300">Blocos</h4>
                <div className="grid grid-cols-2 gap-2">
                    {blockComponentList.map(comp => (
                        <div
                            key={comp.type}
                            onMouseDown={(e) => onComponentMouseDown(e, 'block', comp.type, comp.label, comp.Icon)}
                            className="p-2 bg-slate-800 rounded flex flex-col items-center justify-center text-center h-24 cursor-grab hover:bg-slate-700"
                        >
                            <comp.Icon className="w-6 h-6 text-cyan-400 mb-2"/>
                            <span>{comp.label}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default ComponentsPanel;
