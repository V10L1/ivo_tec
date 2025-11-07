import React, { createContext, useState, useContext, useMemo, useEffect } from 'react';
import { UserRole, AppKey } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import { User } from '../database/schema';

interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  token: string | null;
  setRole: (role: UserRole) => void; // Kept for role switching demo
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
    // This effect runs on initial load to verify the token
    const verifyToken = async () => {
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        // In a real app, you would have a '/api/auth/verify' endpoint.
        // For this demo, we decode the token to get user info.
        try {
            const payload = JSON.parse(atob(storedToken.split('.')[1]));
            setCurrentUser(payload.user);
            setToken(storedToken);
        } catch (error) {
            console.error("Invalid token:", error);
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
        const errorData = await response.json();
        throw new Error(errorData.message || 'Invalid credentials');
      }

      const { token: receivedToken, user } = await response.json();
      localStorage.setItem('authToken', receivedToken);
      setToken(receivedToken);
      setCurrentUser(user);
  };

  const logout = () => {
    setCurrentUser(null);
    setToken(null);
    localStorage.removeItem('authToken');
  };
  
  // For role switcher demo purposes
  const setRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };


  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Loading...</div>;
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, token, setRole, permissions, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};