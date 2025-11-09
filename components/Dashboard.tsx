


import React from 'react';
import { useAuth } from '../contexts/AuthContext.js';
import { DashboardCard } from './DashboardCard.js';
import { APP_MODULES } from '../constants.js';
import { AppKey } from '../types.js';

interface DashboardProps {
  onSelectModule: (key: AppKey) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onSelectModule }) => {
  const { permissions } = useAuth();

  const accessibleModules = APP_MODULES.filter(module => permissions.includes(module.key));

  return (
    <div className="flex flex-col gap-6">
       <h1 className="text-3xl font-bold text-slate-100">Painel de Aplicações</h1>
        <p className="text-slate-400 -mt-4">Selecione um módulo para começar.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {accessibleModules.map(module => (
                <DashboardCard key={module.key} module={module} onClick={() => onSelectModule(module.key)} />
            ))}
        </div>
    </div>
  );
};