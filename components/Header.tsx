import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../types';
import { CodeIcon, LogOutIcon } from './icons/Icons';
import { useRouter } from '../App';

export const Header: React.FC = () => {
  const { currentUser, setRole, logout } = useAuth();
  const { navigate } = useRouter();

  const handleRoleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setRole(event.target.value as UserRole);
  };

  const handleLogout = () => {
    logout();
    navigate('/administrator');
  };

  return (
    <header className="bg-slate-900/80 backdrop-blur-sm sticky top-0 z-10 border-b border-slate-800">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <div className="flex items-center gap-3">
            <CodeIcon className="w-8 h-8 text-cyan-400" />
            <span className="text-xl font-bold text-slate-200">Admin Platform</span>
        </div>
        <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
                <p className="font-medium text-slate-200 text-sm">{currentUser?.name}</p>
                <p className="text-xs text-slate-400">{currentUser?.email}</p>
            </div>
            <select
                id="role-select"
                value={currentUser?.role}
                onChange={handleRoleChange}
                className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg
                           focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"
            >
            {Object.values(UserRole).map(r => (
                <option key={r} value={r}>
                {r}
                </option>
            ))}
            </select>
            <button
                onClick={handleLogout}
                title="Logout"
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