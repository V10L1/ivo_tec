import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { CodeIcon, LogOutIcon } from './icons/Icons';
import { useRouter } from '../contexts/RouterContext';

export const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { navigate } = useRouter();

  const handleLogout = () => {
    logout();
    navigate('/administrator');
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
            <CodeIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-slate-200">Plataforma de Administração</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="font-medium text-slate-200 text-sm">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <div className="flex items-center justify-center px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg" title={`Sua função é ${currentUser?.role}`}>
                <span className="text-sm font-medium text-cyan-400">{currentUser?.role}</span>
            </div>
            <button
                onClick={handleLogout}
                title="Sair"
                className="bg-slate-800 hover:bg-red-500/20 text-slate-300 hover:text-red-400
                     p-2 rounded-lg inline-flex items-center
                     transition-colors duration-200 border border-slate-700 hover:border-red-500/30"
            >
                <LogOutIcon className="w-5 h-5" />
            </button>
        </div>
      </div>
    </header>
  );
};
