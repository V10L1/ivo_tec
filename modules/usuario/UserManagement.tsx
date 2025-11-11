import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { UserRole, AppKey } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../database/schema';
import { ROLE_PERMISSIONS, APP_MODULES } from '../../constants';
import { ArrowLeftIcon, UsersIcon, ShieldIcon, Trash2Icon } from '../../components/icons/Icons';

type DisplayUser = Omit<User, 'passwordHash' | 'createdAt'>;
type View = 'main' | 'users' | 'groups' | 'userDetails';

const UserManagement: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'submitting'>('loading');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [editedRole, setEditedRole] = useState<UserRole | null>(null);

  const { token, currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/users', { headers: { 'Authorization': `Bearer ${token}` } });
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

  const handleFeedback = (type: 'error' | 'success', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectUser = (user: DisplayUser) => {
    setSelectedUser(user);
    setEditedRole(user.role);
    setView('userDetails');
  };

  const handleRoleChange = (newRole: UserRole) => {
    if (selectedUser) {
        setEditedRole(newRole);
    }
  };
  
  const handleSaveChanges = async () => {
      if (!selectedUser || !editedRole || selectedUser.role === editedRole) return;
      
      setStatus('submitting');
      try {
          const response = await fetch(`/api/users/${selectedUser.id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
              body: JSON.stringify({ role: editedRole })
          });
          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Falha ao atualizar a função.');
          }
          handleFeedback('success', 'Função do usuário atualizada com sucesso!');
          await fetchUsers();
          setView('users');
      } catch (error: any) {
          handleFeedback('error', error.message);
      } finally {
          setStatus('idle');
      }
  };
  
  const handleDeleteUser = async (userId: string) => {
    if (!window.confirm('Você tem certeza que deseja remover este usuário? Esta ação é irreversível.')) return;

    setStatus('submitting');
    try {
        const response = await fetch(`/api/users/${userId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao remover o usuário.');
        }
        handleFeedback('success', 'Usuário removido com sucesso!');
        await fetchUsers();
        setView('users');
    } catch (error: any) {
        handleFeedback('error', error.message);
    } finally {
        setStatus('idle');
    }
  };


  const permissionsForSelectedRole = useMemo(() => {
    return editedRole ? ROLE_PERMISSIONS[editedRole] : [];
  }, [editedRole]);

  const renderMain = () => (
    <>
      <h3 className="text-xl font-semibold text-white mb-4">Gerenciamento de Usuários e Grupos</h3>
      <p className="mb-6 text-slate-400">Selecione uma categoria para gerenciar.</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div onClick={() => setView('users')} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-4 cursor-pointer border border-slate-700 hover:border-cyan-400 transition-all duration-300">
          <UsersIcon className="w-16 h-16 text-cyan-400 mx-auto transition-transform duration-300 group-hover:scale-110" />
          <h4 className="font-bold text-2xl text-slate-100 mt-3">Usuários</h4>
        </div>
        <div onClick={() => setView('groups')} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-4 cursor-pointer border border-slate-700 hover:border-cyan-400 transition-all duration-300">
          <ShieldIcon className="w-16 h-16 text-cyan-400 mx-auto transition-transform duration-300 group-hover:scale-110" />
          <h4 className="font-bold text-2xl text-slate-100 mt-3">Grupos</h4>
        </div>
      </div>
    </>
  );

  const renderUsers = () => (
    <>
      <button onClick={() => setView('main')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar</button>
      <h3 className="text-xl font-semibold text-white mb-4">Todos os Usuários</h3>
      {status === 'loading' && <p>Carregando...</p>}
      {status === 'error' && <p className="text-red-400">Não foi possível carregar os usuários.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {users.map(user => (
          <div key={user.id} onClick={() => handleSelectUser(user)} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border border-slate-700 hover:border-cyan-400 transition-all duration-300 text-center">
            <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center mb-2">
                <UsersIcon className="w-10 h-10 text-slate-500"/>
            </div>
            <h4 className="font-bold text-md text-slate-100">{user.name}</h4>
            <p className="text-xs text-slate-400">{user.role}</p>
          </div>
        ))}
      </div>
    </>
  );
  
  const renderGroups = () => (
    <>
      <button onClick={() => setView('main')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar</button>
      <h3 className="text-xl font-semibold text-white mb-4">Grupos de Permissão</h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        {Object.values(UserRole).map(role => (
          <div key={role} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-default border border-slate-700">
             <ShieldIcon className="w-12 h-12 text-cyan-400 mx-auto"/>
             <h4 className="font-bold text-lg text-slate-100 mt-3">{role}</h4>
          </div>
        ))}
      </div>
    </>
  );

  const renderUserDetails = () => {
    if (!selectedUser || !editedRole) return null;
    const isCurrentUser = selectedUser.id === currentUser?.id;
    return (
      <>
        <button onClick={() => setView('users')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para Usuários</button>
        <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1">
                <h3 className="text-2xl font-bold text-white mb-1">{selectedUser.name}</h3>
                <p className="text-slate-400 mb-6">{selectedUser.email}</p>
                
                <label className="block text-sm font-medium text-slate-400 mb-2">Função do Usuário</label>
                <select value={editedRole} onChange={(e) => handleRoleChange(e.target.value as UserRole)} disabled={isCurrentUser} className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 disabled:opacity-50">
                    {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {isCurrentUser && <p className="text-xs text-slate-500 mt-1">Você não pode alterar sua própria função.</p>}
            </div>
            <div className="flex-1 bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <h4 className="text-lg font-semibold text-white mb-4">Permissões de Módulo</h4>
                <div className="grid grid-cols-2 gap-4">
                    {APP_MODULES.map(module => (
                        <div key={module.key} className="flex items-center">
                            <input type="checkbox" id={`perm-${module.key}`} checked={permissionsForSelectedRole.includes(module.key)} readOnly className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-600 ring-offset-gray-800 focus:ring-2" />
                            <label htmlFor={`perm-${module.key}`} className="ml-2 text-sm font-medium text-slate-300">{module.name}</label>
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
            <button onClick={() => handleDeleteUser(selectedUser.id)} disabled={isCurrentUser} className="text-red-500 hover:text-red-400 font-semibold disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                <Trash2Icon className="w-4 h-4" /> Remover Usuário
            </button>
            <button onClick={handleSaveChanges} disabled={selectedUser.role === editedRole || isCurrentUser} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                Salvar Alterações
            </button>
        </div>
      </>
    )
  };

  const renderContent = () => {
    switch(view) {
      case 'main': return renderMain();
      case 'users': return renderUsers();
      case 'groups': return renderGroups();
      case 'userDetails': return renderUserDetails();
      default: return renderMain();
    }
  };

  return (
    <div>
        {feedback && (
            <div className={`p-3 rounded-lg mb-4 text-center ${feedback.type === 'error' ? 'bg-red-500/20 text-red-400' : 'bg-green-500/20 text-green-400'}`}>
                {feedback.message}
            </div>
        )}
        {renderContent()}
    </div>
  );
};

export default UserManagement;