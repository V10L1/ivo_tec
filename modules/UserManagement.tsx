

import React from 'react';
import { UserRole } from '../types';

const users = [
  { id: 1, name: 'Alice', email: 'alice@example.com', role: UserRole.DEVELOPER },
  { id: 2, name: 'Bob', email: 'bob@example.com', role: UserRole.ADMIN },
  { id: 3, name: 'Charlie', email: 'charlie@example.com', role: UserRole.SUPPORT },
  { id: 4, name: 'Diana', email: 'diana@example.com', role: UserRole.OPERATOR },
];

const UserManagement: React.FC = () => {
  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Gerenciamento de Usuários e Permissões</h3>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            Convidar Novo Usuário
            </button>
      </div>
      <p className="mb-6 text-slate-400">
        Como Desenvolvedor, você pode gerenciar todos os usuários e suas funções na plataforma.
      </p>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-slate-900 rounded-lg">
          <thead>
            <tr className="border-b border-slate-700">
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Usuário</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Função</th>
              <th className="p-3 text-left text-sm font-semibold text-slate-400">Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-b border-slate-800 hover:bg-slate-800/50">
                <td className="p-3 text-sm text-slate-200">
                    <div className="font-medium">{user.name}</div>
                    <div className="text-slate-500">{user.email}</div>
                </td>
                <td className="p-3 text-sm text-slate-300">
                    <select
                        defaultValue={user.role}
                        className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg
                                   focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2"
                    >
                        {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                </td>
                <td className="p-3 text-sm space-x-4">
                  <a href="#" className="text-cyan-400 hover:text-cyan-300">Salvar</a>
                  <a href="#" className="text-red-400 hover:text-red-300">Remover</a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default UserManagement;