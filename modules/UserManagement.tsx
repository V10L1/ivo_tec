import React, { useState, useEffect, useCallback } from 'react';
import { UserRole } from '../types.js';
import { useAuth } from '../contexts/AuthContext.js';
import { User } from '../database/schema.js';

type DisplayUser = Omit<User, 'passwordHash' | 'createdAt'>;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error'>('loading');
  const [isAdding, setIsAdding] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.OPERATOR });
  const [addError, setAddError] = useState<string | null>(null);
  
  const { token } = useAuth();

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Falha ao buscar usuários.');
      const data = await response.json();
      setUsers(data);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, [token]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewUser(prev => ({ ...prev, [name]: value }));
  };

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddError(null);
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newUser)
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Falha ao criar usuário.');
      }
      // Reset form and state
      setIsAdding(false);
      setNewUser({ name: '', email: '', password: '', role: UserRole.OPERATOR });
      // Refresh user list
      fetchUsers();
    } catch (error: any) {
      setAddError(error.message);
    }
  };

  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">Gerenciamento de Usuários e Permissões</h3>
            <button onClick={() => setIsAdding(!isAdding)} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
              {isAdding ? 'Cancelar' : 'Convidar Novo Usuário'}
            </button>
      </div>

      {isAdding && (
        <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700 mb-6">
          <form onSubmit={handleAddUser} className="space-y-4">
            <h4 className="text-lg font-semibold text-white">Detalhes do Novo Usuário</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input type="text" name="name" placeholder="Nome Completo" value={newUser.name} onChange={handleInputChange} required className="bg-slate-900 border border-slate-700 rounded-md p-2" />
              <input type="email" name="email" placeholder="E-mail" value={newUser.email} onChange={handleInputChange} required className="bg-slate-900 border border-slate-700 rounded-md p-2" />
              <input type="password" name="password" placeholder="Senha" value={newUser.password} onChange={handleInputChange} required className="bg-slate-900 border border-slate-700 rounded-md p-2" />
              <select name="role" value={newUser.role} onChange={handleInputChange} required className="bg-slate-900 border border-slate-700 rounded-md p-2">
                {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
              </select>
            </div>
            {addError && <p className="text-red-400 text-sm">{addError}</p>}
            <div className="flex justify-end">
              <button type="submit" className="bg-green-600 hover:bg-green-500 text-white font-bold py-2 px-4 rounded-lg">Criar Usuário</button>
            </div>
          </form>
        </div>
      )}

      <p className="mb-6 text-slate-400">
        Como Desenvolvedor, você pode gerenciar todos os usuários e suas funções na plataforma.
      </p>

      {status === 'loading' && <p>Carregando usuários...</p>}
      {status === 'error' && <p className="text-red-400">Não foi possível carregar a lista de usuários.</p>}
      
      {status === 'idle' && (
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
      )}
    </div>
  );
};

export default UserManagement;