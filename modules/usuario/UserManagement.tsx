import React, { useState, useEffect, useCallback } from 'react';
import { UserRole, AppKey } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { User } from '../../database/schema';
import { APP_MODULES } from '../../constants';
import { ArrowLeftIcon, UsersIcon, ShieldIcon, Trash2Icon, SaveIcon, PlusCircleIcon } from '../../components/icons/Icons';

type DisplayUser = Omit<User, 'passwordHash' | 'createdAt'>;
type View = 'main' | 'users' | 'groups' | 'userDetails' | 'groupDetails' | 'createUser' | 'createGroup';

const UserManagement: React.FC = () => {
  const [view, setView] = useState<View>('main');
  const [selectedUser, setSelectedUser] = useState<DisplayUser | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [users, setUsers] = useState<DisplayUser[]>([]);
  const [status, setStatus] = useState<'loading' | 'idle' | 'error' | 'submitting'>('loading');
  const [feedback, setFeedback] = useState<{ type: 'error' | 'success', message: string } | null>(null);
  const [editedRole, setEditedRole] = useState<UserRole | null>(null);
  
  // State for new user
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: UserRole.OPERATOR });
  
  // State for new group
  const [newGroupName, setNewGroupName] = useState('');

  // State for group permissions editing
  const [allPermissions, setAllPermissions] = useState<Record<string, AppKey[]>>({} as Record<UserRole, AppKey[]>);
  const [tempPermissions, setTempPermissions] = useState<AppKey[]>([]);

  const { token, currentUser } = useAuth();

  const fetchUsers = useCallback(async () => {
    setStatus('loading');
    try {
      const response = await fetch('/api/iam/users', { headers: { 'Authorization': `Bearer ${token}` } });
      if (!response.ok) throw new Error('Falha ao buscar usuários.');
      const data = await response.json();
      setUsers(data);
      setStatus('idle');
    } catch (error) {
      console.error(error);
      setStatus('error');
    }
  }, [token]);

  const fetchPermissions = useCallback(async () => {
    setStatus('loading');
    try {
        const response = await fetch('/api/iam/permissions', { headers: { 'Authorization': `Bearer ${token}` } });
        if (!response.ok) throw new Error('Falha ao buscar permissões.');
        const data = await response.json();
        setAllPermissions(data);
        setStatus('idle');
    } catch (error) {
        console.error(error);
        setStatus('error');
    }
  }, [token]);


  useEffect(() => {
    if (view === 'users' || view === 'main') {
        fetchUsers();
    }
    if (view === 'groups' || view === 'main' || view === 'groupDetails') {
        fetchPermissions();
    }
  }, [view, fetchUsers, fetchPermissions]);

  const handleFeedback = (type: 'error' | 'success', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const handleSelectUser = (user: DisplayUser) => {
    setSelectedUser(user);
    setEditedRole(user.role);
    setView('userDetails');
  };

  const handleSelectGroup = (role: string) => {
    setSelectedGroup(role);
    // Initialize tempPermissions from the fetched permissions for the selected group
    setTempPermissions(allPermissions[role] ? [...allPermissions[role]] : []);
    setView('groupDetails');
  };

  const handleSaveChanges = async () => {
      if (!selectedUser || !editedRole || selectedUser.role === editedRole) return;
      
      setStatus('submitting');
      try {
          const response = await fetch(`/api/iam/users/${selectedUser.id}`, {
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
        const response = await fetch(`/api/iam/users/${userId}`, {
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

  const handlePermissionChange = (moduleKey: AppKey, isChecked: boolean) => {
    setTempPermissions(prev => 
        isChecked ? [...prev, moduleKey] : prev.filter(p => p !== moduleKey)
    );
  };

  const handleSaveGroupPermissions = async () => {
    if (!selectedGroup) return;
    setStatus('submitting');
    try {
        const response = await fetch(`/api/iam/permissions/${selectedGroup}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}`},
            body: JSON.stringify({ permissions: tempPermissions })
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Falha ao salvar permissões.');
        }
        handleFeedback('success', `Permissões para '${selectedGroup}' foram salvas permanentemente.`);
        await fetchPermissions();
        setView('groups');
    } catch (error: any) {
        handleFeedback('error', error.message);
    } finally {
        setStatus('idle');
    }
  };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('submitting');
        try {
            const response = await fetch('/api/iam/users', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify(newUser)
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar o usuário.');
            }
            handleFeedback('success', 'Usuário criado com sucesso!');
            await fetchUsers();
            setView('users');
            setNewUser({ name: '', email: '', password: '', role: UserRole.OPERATOR });
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newGroupName.trim()) {
            handleFeedback('error', 'O nome do grupo não pode estar vazio.');
            return;
        }
        setStatus('submitting');
        try {
            const response = await fetch('/api/iam/permissions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                body: JSON.stringify({ role: newGroupName, permissions: [] })
            });
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar o grupo.');
            }
            handleFeedback('success', `Grupo '${newGroupName}' criado com sucesso.`);
            await fetchPermissions();
            setView('groups');
            setNewGroupName('');
        } catch (error: any) {
            handleFeedback('error', error.message);
        } finally {
            setStatus('idle');
        }
    };

  const renderMain = () => (
    <>
      <h3 className="text-xl font-semibold text-white mb-4">Gerenciamento de Usuários e Grupos</h3>
      <p className="mb-6 text-slate-400 max-w-xl">Selecione uma categoria para gerenciar.</p>
      <div className="max-w-xl">
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
        <div onClick={() => setView('createUser')} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-400 transition-all duration-300 text-center">
            <PlusCircleIcon className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <h4 className="font-bold text-md text-slate-400 group-hover:text-white">Criar Novo Usuário</h4>
        </div>
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
      <p className="mb-6 text-slate-400 max-w-xl">Selecione um grupo para editar suas permissões de módulo.</p>
       {status === 'loading' && <p>Carregando...</p>}
       {status === 'error' && <p className="text-red-400">Não foi possível carregar os grupos.</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
        <div onClick={() => setView('createGroup')} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border-2 border-dashed border-slate-700 hover:border-cyan-400 transition-all duration-300 text-center">
            <PlusCircleIcon className="w-12 h-12 text-slate-500 group-hover:text-cyan-400 transition-colors" />
            <h4 className="font-bold text-md text-slate-400 group-hover:text-white">Criar Novo Grupo</h4>
        </div>
        {Object.keys(allPermissions).sort().map(role => (
          <div key={role} onClick={() => handleSelectGroup(role)} className="group relative aspect-square bg-slate-800 rounded-lg p-4 flex flex-col items-center justify-center gap-2 cursor-pointer border border-slate-700 hover:border-cyan-400 transition-all duration-300">
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
        <div>
            <h3 className="text-2xl font-bold text-white mb-1">{selectedUser.name}</h3>
            <p className="text-slate-400 mb-6">{selectedUser.email}</p>
            
            <div className="max-w-sm">
                <label htmlFor="userRole" className="block text-sm font-medium text-slate-400 mb-2">Função do Usuário</label>
                <select id="userRole" value={editedRole} onChange={(e) => setEditedRole(e.target.value as UserRole)} disabled={isCurrentUser} className="bg-slate-800 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5 disabled:opacity-50">
                    {Object.keys(allPermissions).sort().map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                {isCurrentUser && <p className="text-xs text-slate-500 mt-1">Você não pode alterar sua própria função.</p>}
            </div>
        </div>
        <div className="mt-8 pt-6 border-t border-slate-700 flex justify-between items-center">
            <button onClick={() => handleDeleteUser(selectedUser.id)} disabled={isCurrentUser} className="text-red-500 hover:text-red-400 font-semibold disabled:text-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                <Trash2Icon className="w-4 h-4" /> Remover Usuário
            </button>
            <button onClick={handleSaveChanges} disabled={selectedUser.role === editedRole || isCurrentUser || status === 'submitting'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                <SaveIcon className="w-4 h-4" />
                {status === 'submitting' ? 'Salvando...' : 'Salvar Alterações'}
            </button>
        </div>
      </>
    )
  };

  const renderGroupDetails = () => {
    if (!selectedGroup) return null;
    const isDeveloperRole = selectedGroup === UserRole.DEVELOPER;
    return (
        <>
            <button onClick={() => setView('groups')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para Grupos</button>
            <h3 className="text-2xl font-bold text-white mb-2">Editando Permissões: <span className="text-cyan-400">{selectedGroup}</span></h3>
            <p className="text-slate-400 mb-6">Selecione os módulos que este grupo pode acessar.</p>

            <div className="bg-slate-800/50 p-6 rounded-lg border border-slate-700">
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    {APP_MODULES.map(module => (
                        <div key={module.key} className="flex items-center">
                            <input 
                                type="checkbox" 
                                id={`perm-${module.key}`} 
                                checked={tempPermissions.includes(module.key)} 
                                onChange={(e) => handlePermissionChange(module.key, e.target.checked)}
                                disabled={isDeveloperRole}
                                className="w-4 h-4 text-cyan-600 bg-gray-700 border-gray-600 rounded focus:ring-cyan-600 ring-offset-gray-800 focus:ring-2 disabled:opacity-50" 
                            />
                            <label htmlFor={`perm-${module.key}`} className={`ml-2 text-sm font-medium ${isDeveloperRole ? 'text-slate-500' : 'text-slate-300'}`}>{module.name}</label>
                        </div>
                    ))}
                </div>
                {isDeveloperRole && <p className="text-xs text-yellow-400 mt-4">As permissões do grupo Desenvolvedor não podem ser alteradas para garantir a estabilidade da plataforma.</p>}
            </div>

            <div className="mt-8 pt-6 border-t border-slate-700 flex justify-end">
                <button onClick={handleSaveGroupPermissions} disabled={isDeveloperRole || status === 'submitting'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed flex items-center gap-2">
                    <SaveIcon className="w-4 h-4" />
                    {status === 'submitting' ? 'Salvando...' : 'Salvar Permissões'}
                </button>
            </div>
        </>
    );
  };

  const renderCreateUserForm = () => (
    <>
      <button onClick={() => setView('users')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para Usuários</button>
      <h3 className="text-2xl font-bold text-white mb-6">Criar Novo Usuário</h3>
      <form onSubmit={handleCreateUser} className="max-w-md space-y-4">
         <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Nome Completo</label>
            <input type="text" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">E-mail</label>
            <input type="email" value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Senha</label>
            <input type="password" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" />
         </div>
         <div>
            <label className="block text-sm font-medium text-slate-400 mb-1">Função</label>
             <select value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})} className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-lg focus:ring-cyan-500 focus:border-cyan-500 block w-full p-2.5">
                {Object.keys(allPermissions).sort().map(r => <option key={r} value={r}>{r}</option>)}
            </select>
         </div>
         <div className="pt-2">
            <button type="submit" disabled={status === 'submitting'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                {status === 'submitting' ? 'Criando...' : 'Criar Usuário'}
            </button>
         </div>
      </form>
    </>
  );

  const renderCreateGroupForm = () => (
    <>
        <button onClick={() => setView('groups')} className="flex items-center gap-2 mb-4 text-slate-400 hover:text-white"><ArrowLeftIcon className="w-4 h-4" /> Voltar para Grupos</button>
        <h3 className="text-2xl font-bold text-white mb-6">Criar Novo Grupo de Permissão</h3>
         <form onSubmit={handleCreateGroup} className="max-w-md space-y-4">
            <div>
                <label className="block text-sm font-medium text-slate-400 mb-1">Nome do Grupo</label>
                <input type="text" value={newGroupName} onChange={e => setNewGroupName(e.target.value)} required className="w-full bg-slate-900 border border-slate-700 rounded-md p-2" placeholder="Ex: Moderador" />
                <p className="text-xs text-slate-500 mt-1">O nome deve ser único e não pode ser alterado depois.</p>
            </div>
             <div className="pt-2">
                <button type="submit" disabled={status === 'submitting'} className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg disabled:bg-slate-600 disabled:cursor-not-allowed">
                    {status === 'submitting' ? 'Criando...' : 'Criar Grupo'}
                </button>
            </div>
         </form>
    </>
  );


  const renderContent = () => {
    switch(view) {
      case 'main': return renderMain();
      case 'users': return renderUsers();
      case 'groups': return renderGroups();
      case 'userDetails': return renderUserDetails();
      case 'groupDetails': return renderGroupDetails();
      case 'createUser': return renderCreateUserForm();
      case 'createGroup': return renderCreateGroupForm();
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