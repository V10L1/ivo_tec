import React from 'react';
import { AppModule } from '../types';

interface DashboardCardProps {
  module: AppModule;
  onClick: () => void;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ module, onClick }) => {
  const { name, description, Icon } = module;

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-6 flex flex-col items-start gap-4 cursor-pointer
                 border border-slate-700 hover:border-cyan-400 transition-all duration-300
                 hover:shadow-lg hover:shadow-cyan-500/10 transform hover:-translate-y-1"
    >
      <div className="p-3 bg-slate-700 rounded-md">
        <Icon className="w-6 h-6 text-cyan-400" />
      </div>
      <div className="flex flex-col">
        <h3 className="font-bold text-lg text-slate-100">{name}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
};