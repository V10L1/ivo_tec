import React from 'react';
import { APP_MODULES } from '../../constants';

const AppsManager: React.FC = () => {
  return (
    <div>
      <h3 className="text-xl font-semibold text-white mb-4">Gerenciador de Módulos</h3>
      <p className="mb-6 text-slate-400">
        Abaixo estão todos os módulos atualmente instalados e ativos na plataforma.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Módulo</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Descrição</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Status</th>
            </tr>
          </thead>
          <tbody>
            {APP_MODULES.map((module) => (
              <tr key={module.key} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-200 font-medium">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-slate-700 rounded-md">
                        <module.Icon className="w-5 h-5 text-cyan-400" />
                    </div>
                    <span>{module.name}</span>
                  </div>
                </td>
                <td className="p-3 text-sm text-slate-400">{module.description}</td>
                <td className="p-3 text-sm">
                  <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                    Ativo
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AppsManager;