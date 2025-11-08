
import React, { useState } from 'react';
import { AppModule, AppKey, WidgetConfig } from '../types';
import { SettingsIcon } from './icons/Icons';
import { useLocalization } from '../contexts/LocalizationContext';

interface DashboardCardProps {
  module: AppModule;
  onClick: () => void;
  onUpdate: (key: AppKey, newConfig: Partial<Omit<WidgetConfig, 'key'>>) => void;
  widgetKey: AppKey;
  currentColSpan: 1 | 2 | 3;
}

export const DashboardCard: React.FC<DashboardCardProps> = ({ module, onClick, onUpdate, widgetKey, currentColSpan }) => {
  const { name, description, Icon } = module;
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const { t } = useLocalization();

  const handleColSpanChange = (span: 1 | 2 | 3) => {
    onUpdate(widgetKey, { colSpan: span });
    setIsSettingsOpen(false);
  };
  
  const handleSettingsClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card's onClick from firing
    setIsSettingsOpen(prev => !prev);
  }

  return (
    <div
      onClick={onClick}
      className="bg-slate-800 rounded-lg p-6 flex flex-col items-start gap-4 cursor-pointer h-full
                 border border-slate-700 hover:border-cyan-400 transition-all duration-300
                 hover:shadow-lg hover:shadow-cyan-500/10 transform hover:-translate-y-1 relative group"
    >
      <div className="absolute top-2 right-2 z-20">
        <button
          onClick={handleSettingsClick}
          title={t('dashboardCard.settings')}
          className="p-1.5 bg-slate-700/50 hover:bg-slate-600 rounded-md text-slate-400 hover:text-white
                     opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity duration-200"
        >
          <SettingsIcon className="w-4 h-4" />
        </button>
        {isSettingsOpen && (
           <div className="absolute top-full right-0 mt-2 w-36 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-lg shadow-xl p-2"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside
           >
                <p className="text-xs font-semibold text-slate-400 px-2 pb-1">{t('dashboardCard.width')}</p>
                <div className="flex flex-col gap-1">
                    {[1, 2, 3].map(span => (
                        <button
                            key={span}
                            onClick={() => handleColSpanChange(span as 1 | 2 | 3)}
                            className={`w-full text-left text-sm px-2 py-1 rounded-md ${
                                currentColSpan === span 
                                ? 'bg-cyan-600 text-white' 
                                : 'text-slate-300 hover:bg-slate-700'
                            }`}
                        >
                           {t(span > 1 ? 'dashboardCard.columns' : 'dashboardCard.column', { count: span })}
                        </button>
                    ))}
                </div>
           </div>
        )}
      </div>

      <div className="p-3 bg-slate-700 rounded-md">
        {Icon && <Icon className="w-6 h-6 text-cyan-400" />}
      </div>
      <div className="flex flex-col">
        <h3 className="font-bold text-lg text-slate-100">{name}</h3>
        <p className="text-sm text-slate-400">{description}</p>
      </div>
    </div>
  );
};
