import React from 'react';
import { ThemeSettings, ThemeColorKey } from '../../../../types';

interface ThemePanelProps {
    theme: ThemeSettings;
    onUpdateTheme: (updatedTheme: ThemeSettings) => void;
}

const ThemeColorEditor: React.FC<{
    label: string;
    color: string;
    onChange: (color: string) => void;
}> = ({ label, color, onChange }) => (
    <div className="flex items-center justify-between">
        <label className="text-slate-300">{label}</label>
        <div className="flex items-center gap-2 border border-slate-700 rounded-md p-1">
            <input
                type="color"
                value={color}
                onChange={(e) => onChange(e.target.value)}
                className="w-6 h-6 bg-transparent border-none cursor-pointer"
            />
            <span className="text-sm text-slate-400 font-mono">{color.toUpperCase()}</span>
        </div>
    </div>
);


const ThemePanel: React.FC<ThemePanelProps> = ({ theme, onUpdateTheme }) => {

    const handleColorChange = (key: keyof ThemeSettings, value: string) => {
        onUpdateTheme({ ...theme, [key]: value });
    };

    return (
        <div className="p-4 space-y-4">
            <div>
                <h4 className="font-bold text-lg text-cyan-400 border-b border-slate-700 pb-2 mb-4">Cores Globais</h4>
                <div className="space-y-3">
                    <ThemeColorEditor label="Primária" color={theme.primaryColor} onChange={(c) => handleColorChange('primaryColor', c)} />
                    <ThemeColorEditor label="Secundária" color={theme.secondaryColor} onChange={(c) => handleColorChange('secondaryColor', c)} />
                    <ThemeColorEditor label="Fundo" color={theme.backgroundColor} onChange={(c) => handleColorChange('backgroundColor', c)} />
                    <ThemeColorEditor label="Superfície" color={theme.surfaceColor} onChange={(c) => handleColorChange('surfaceColor', c)} />
                    <ThemeColorEditor label="Texto Principal" color={theme.textColor} onChange={(c) => handleColorChange('textColor', c)} />
                    <ThemeColorEditor label="Texto Secundário" color={theme.textSecondaryColor} onChange={(c) => handleColorChange('textSecondaryColor', c)} />
                </div>
            </div>
             {/* TODO: Adicionar editor de fontes */}
        </div>
    );
};

export default ThemePanel;
