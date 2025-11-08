import React, { useState, useEffect } from 'react';
import { UserRole } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLocalization } from '../contexts/LocalizationContext';
import { User } from '../database/schema';

type UserData = Omit<User, 'passwordHash' | 'createdAt'>;

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<UserData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { token } = useAuth();
  const { t } = useLocalization();

  useEffect(() => {
    const fetchUsers = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await fetch('/api/users', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to fetch users.');
        }
        const data = await response.json();
        setUsers(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An unknown error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    fetchUsers();
  }, [token]);


  return (
    <div>
        <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-semibold text-white">{t('userManagement.title')}</h3>
            <button className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded-lg transition-colors">
            {t('userManagement.invite')}
            </button>
      </div>
      <p className="mb-6 text-slate-400">
        {t('userManagement.description')}
      </p>

      {isLoading && <p className="text-center text-slate-400">{t('userManagement.loading')}</p>}
      {error && <p className="text-center text-red-400">{t('userManagement.error', { error })}</p>}

      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-slate-900 rounded-lg">
            <thead>
              <tr className="border-b border-slate-700">
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('userManagement.table.user')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('userManagement.table.role')}</th>
                <th className="p-3 text-left text-sm font-semibold text-slate-400">{t('userManagement.table.actions')}</th>
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
                          {Object.values(UserRole).map(r => <option key={r} value={r}>{t(`role.${r}`)}</option>)}
                      </select>
                  </td>
                  <td className="p-3 text-sm space-x-4">
                    <a href="#" className="text-cyan-400 hover:text-cyan-300">{t('userManagement.table.save')}</a>
                    <a href="#" className="text-red-400 hover:text-red-300">{t('userManagement.table.remove')}</a>
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
