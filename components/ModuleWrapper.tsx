


import React from 'react';
import { ArrowLeftIcon } from './icons/Icons.js';

interface ModuleWrapperProps {
  title: string;
  onBack: () => void;
  children: React.ReactNode;
}

export const ModuleWrapper: React.FC<ModuleWrapperProps> = ({ title, onBack, children }) => {
  return (
    <div className="animate-fade-in">
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white
                     font-bold py-2 px-4 rounded-lg inline-flex items-center
                     transition-colors duration-200 border border-slate-700"
        >
          <ArrowLeftIcon className="w-5 h-5 mr-2" />
          <span>Painel</span>
        </button>
        <h2 className="text-2xl font-bold text-slate-100">{title}</h2>
      </div>
      <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-800">
        {children}
      </div>
    </div>
  );
};

// Adiciona a animação de fade-in ao tailwind config ou estilo global se necessário.
// Por simplicidade, usando estilo inline aqui.
const style = document.createElement('style');
style.innerHTML = `
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  .animate-fade-in {
    animation: fadeIn 0.5s ease-out forwards;
  }
`;
document.head.appendChild(style);