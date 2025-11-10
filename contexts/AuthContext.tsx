import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { UserRole, AppKey } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
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
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Este efeito é executado no carregamento inicial para verificar o token
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // Para esta demonstração, decodificamos o token para obter informações do usuário.
        try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            const userFromToken = payload.user;
            if (userFromToken && userFromToken.id && userFromToken.role) {
                setCurrentUser({
                    ...userFromToken,
                    passwordHash: '', // Não disponível/necessário no cliente
                    createdAt: new Date().toISOString(), // Valor fictício
                });
                setToken(storedToken);
            } else {
                throw new Error("Dados de usuário inválidos no token");
            }
        } catch (error) {
            console.error("Token inválido:", error);
            localStorage.removeItem('authToken');
            setToken(null);
            setCurrentUser(null);
        }
      }
      setIsLoading(false);
    };
    verifyToken();
  }, []);


  const isAuthenticated = !!token && !!currentUser;

  const permissions = useMemo(() => {
    if (!currentUser) return [];
    return ROLE_PERMISSIONS[currentUser.role];
  }, [currentUser]);

  const login = async (email: string, pass: string) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password: pass }),
      });

      if (!response.ok) {
        throw new Error('Falha no login');
      }

      const { token: receivedToken, user } = await response.json();
      localStorage.setItem('authToken', receivedToken);
      setToken(receivedToken);
      setCurrentUser({
          ...user,
          passwordHash: '', // Não é necessário no cliente
          createdAt: new Date().toISOString(), // valor fictício
      });
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
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