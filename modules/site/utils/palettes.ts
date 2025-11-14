import { ThemeSettings } from '../../../types';

export interface Palette {
    name: string;
    colors: Omit<ThemeSettings, 'headingFont' | 'bodyFont'>;
}

export const palettes: Palette[] = [
    {
        name: "Cyan Tempest",
        colors: {
            primaryColor: '#22d3ee', // cyan-400
            secondaryColor: '#818cf8', // indigo-400
            backgroundColor: '#0f172a', // slate-900
            surfaceColor: '#1e293b', // slate-800
            textColor: '#e2e8f0', // slate-200
            textSecondaryColor: '#94a3b8', // slate-400
        }
    },
    {
        name: "Emerald Night",
        colors: {
            primaryColor: '#34d399', // emerald-400
            secondaryColor: '#a78bfa', // violet-400
            backgroundColor: '#111827', // gray-900
            surfaceColor: '#1f2937', // gray-800
            textColor: '#f3f4f6', // gray-100
            textSecondaryColor: '#9ca3af', // gray-400
        }
    },
    {
        name: "Amber Glow",
        colors: {
            primaryColor: '#f59e0b', // amber-500
            secondaryColor: '#60a5fa', // blue-400
            backgroundColor: '#262626', // neutral-800
            surfaceColor: '#404040', // neutral-700
            textColor: '#f5f5f5', // neutral-100
            textSecondaryColor: '#a3a3a3', // neutral-400
        }
    },
    {
        name: "Crimson Code",
        colors: {
            primaryColor: '#ef4444', // red-500
            secondaryColor: '#a8a29e', // stone-400
            backgroundColor: '#1c1917', // stone-900
            surfaceColor: '#292524', // stone-800
            textColor: '#f5f5f4', // stone-100
            textSecondaryColor: '#a8a29e', // stone-400
        }
    },
    {
        name: "Fuchsia Flare",
        colors: {
            primaryColor: '#d946ef', // fuchsia-500
            secondaryColor: '#2dd4bf', // teal-400
            backgroundColor: '#18182f', // custom dark blue
            surfaceColor: '#2d2d55', // custom dark blue
            textColor: '#f0f0ff', // custom off-white
            textSecondaryColor: '#a0a0c0', // custom gray-blue
        }
    },
    {
        name: "Lime Rush",
        colors: {
            primaryColor: '#a3e635', // lime-400
            secondaryColor: '#f472b6', // pink-400
            backgroundColor: '#0c2a21', // custom dark green
            surfaceColor: '#103f2e', // custom dark green
            textColor: '#f0fdf4', // green-50
            textSecondaryColor: '#86efac', // green-300
        }
    },
    {
        name: "Oceanic Deep",
        colors: {
            primaryColor: '#38bdf8', // light-blue-400
            secondaryColor: '#fb923c', // orange-400
            backgroundColor: '#082f49', // cyan-950
            surfaceColor: '#155e75', // cyan-800
            textColor: '#ecfeff', // cyan-50
            textSecondaryColor: '#a5f3fc', // cyan-200
        }
    },
    {
        name: "Golden Hour",
        colors: {
            primaryColor: '#facc15', // yellow-400
            secondaryColor: '#78716c', // stone-500
            backgroundColor: '#2a1a10', // custom brown
            surfaceColor: '#4d3a2d', // custom brown
            textColor: '#fffbeb', // yellow-50
            textSecondaryColor: '#fde68a', // yellow-200
        }
    },
     {
        name: "Graphite & Gold",
        colors: {
            primaryColor: '#ca8a04', // yellow-600
            secondaryColor: '#737373', // neutral-500
            backgroundColor: '#171717', // neutral-900
            surfaceColor: '#262626', // neutral-800
            textColor: '#fafafa', // neutral-50
            textSecondaryColor: '#a3a3a3', // neutral-400
        }
    },
    {
        name: "Pastel Dream",
        colors: {
            primaryColor: '#c4b5fd', // violet-300
            secondaryColor: '#f9a8d4', // pink-300
            backgroundColor: '#3730a3', // indigo-800
            surfaceColor: '#4f46e5', // indigo-700
            textColor: '#e0e7ff', // indigo-100
            textSecondaryColor: '#c7d2fe', // indigo-200
        }
    },
];
