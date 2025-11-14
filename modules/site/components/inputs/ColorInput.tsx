import React, { useState } from 'react';
import { ColorStyleValue, ThemeSettings, ThemeColorKey } from '../../../../types';

interface ColorInputProps {
    label: string;
    colorValue: ColorStyleValue | undefined;
    theme: ThemeSettings;
    onChange: (color: ColorStyleValue) => void;
    defaultColor: ColorStyleValue;
}

const themeColorKeys: { key: ThemeColorKey; name: string }[] = [
    { key: 'primary', name: 'Primária' },
    { key: 'secondary', name: 'Secundária' },
    { key: 'background', name: 'Fundo' },
    { key: 'surface', name: 'Superfície' },
    { key: 'text', name: 'Texto' },
    { key: 'textSecondary', name: 'Texto Sec.' },
];


const ColorInput: React.FC<ColorInputProps> = ({ label, colorValue, theme, onChange, defaultColor }) => {
    const activeValue = colorValue || defaultColor;

    return (
        <div>
            <label className="block text-slate-300 mb-2 font-semibold">{label}</label>
            <div className="space-y-3">
                <div>
                    <p className="text-xs text-slate-400 mb-1">Cores do Tema</p>
                    <div className="grid grid-cols-3 gap-2">
                        {themeColorKeys.map(({key, name}) => (
                            <button
                                key={key}
                                onClick={() => onChange({ type: 'global', value: key })}
                                className={`p-1 rounded text-xs text-center border-2 ${activeValue.type === 'global' && activeValue.value === key ? 'border-cyan-400' : 'border-transparent'}`}
                            >
                                <div style={{ backgroundColor: theme[key] }} className="w-full h-6 rounded mb-1 border border-slate-600"></div>
                                <span className="text-slate-300">{name}</span>
                            </button>
                        ))}
                    </div>
                </div>
                 <div>
                    <p className="text-xs text-slate-400 mb-1">Cor Customizada</p>
                    <div className={`flex items-center gap-2 border rounded-md p-1 ${activeValue.type === 'custom' ? 'border-cyan-400' : 'border-slate-700'}`}>
                         <input
                            type="color"
                            value={activeValue.type === 'custom' ? activeValue.value : '#ffffff'}
                            onChange={(e) => onChange({ type: 'custom', value: e.target.value })}
                            className="w-6 h-6 bg-transparent border-none cursor-pointer"
                        />
                        <input
                            type="text"
                            value={activeValue.type === 'custom' ? activeValue.value : ''}
                            onChange={(e) => onChange({ type: 'custom', value: e.target.value })}
                            onFocus={() => { if(activeValue.type !== 'custom') onChange({ type: 'custom', value: '#FFFFFF' }) }}
                            className="bg-transparent text-sm text-slate-300 w-full focus:outline-none"
                            placeholder="ex: #123456"
                         />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ColorInput;
