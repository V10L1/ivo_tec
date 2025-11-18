import React, { createContext, useState, useContext, useEffect } from 'react';
import { UserRole, AppKey } from '../types';
import { User } from '../database/schema';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  permissions: AppKey[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('authToken'));
  const [permissions, setPermissions] = useState<AppKey[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const verifyTokenAndFetchUser = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        try {
          const response = await fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${storedToken}` }
          });
          if (!response.ok) {
            throw new Error("Token inválido ou sessão expirada");
          }
          const { user, permissions: userPermissions = [] } = await response.json();
          setCurrentUser(user);
          setPermissions(Array.isArray(userPermissions) ? userPermissions : []);
          setToken(storedToken);
        } catch (error) {
          console.error("Falha ao verificar token:", error);
          localStorage.removeItem('authToken');
          setToken(null);
          setCurrentUser(null);
          setPermissions([]);
        }
      }
      setIsLoading(false);
    };
    verifyTokenAndFetchUser();
  }, []);


  const isAuthenticated = !!token && !!currentUser;

  const login = async (email: string, pass: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!response.ok) {
        throw new Error('Falha no login');
      }

      // FIX: Garante que 'permissions' seja sempre um array, mesmo que a API não o retorne.
      const { token: receivedToken, user, permissions: receivedPermissions = [] } = await response.json();
      localStorage.setItem('authToken', receivedToken);
      setToken(receivedToken);
      setCurrentUser(user);
      // FIX: Adiciona validação extra para garantir que apenas um array seja definido no estado.
      setPermissions(Array.isArray(receivedPermissions) ? receivedPermissions : []);
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    setPermissions([]);
    localStorage.removeItem('authToken');
  };
  

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, token, permissions, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};