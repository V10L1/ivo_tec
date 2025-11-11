import React from 'react';
import { APP_MODULES } from '../../constants';

const AppsManager: React.FC = () => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Gerenciador de Módulos</h3>
      <p className="mb-6 text-slate-400">
        Abaixo estão todos os módulos atualmente instalados e ativos na plataforma.
      </p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {APP_MODULES.map((module) => (
              <div
                key={module.key}
                className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-4 cursor-default border border-slate-700 transition-all duration-300 overflow-hidden"
              >
                {/* Ícone e Nome (visível por padrão) */}
                <div className="text-center transition-opacity duration-300 group-hover:opacity-20">
                    <module.Icon className="w-12 h-12 text-cyan-400 mx-auto transition-transform duration-300 group-hover:scale-110" />
                    <h4 className="font-bold text-lg text-slate-100 mt-3">{module.name}</h4>
                </div>

                {/* Descrição (visível no hover) */}
                <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-sm p-4 flex items-center justify-center text-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-sm text-slate-300">{module.description}</p>
                </div>
              </div>
            ))}
        </div>
    </div>
  );
};

export default AppsManager;