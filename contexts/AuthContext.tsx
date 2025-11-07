import React, { createContext, useState, useContext, useMemo } from 'react';
import { UserRole, AppKey } from '../types';
import { ROLE_PERMISSIONS } from '../constants';
import { User } from '../database/schema';

// Mock user database for demonstration
const MOCK_USERS: User[] = [
    {
        id: 'a1b2c3d4',
        name: 'Admin User',
        email: 'admin@example.com',
        role: UserRole.DEVELOPER,
        passwordHash: 'admin', // In a real app, this would be a hash
        createdAt: new Date().toISOString(),
    },
    {
        id: 'e5f6g7h8',
        name: 'Gamecard User',
        email: 'gamecardiv@gmail.com',
        role: UserRole.DEVELOPER,
        passwordHash: 'senha12345', // In a real app, this would be a hash
        createdAt: new Date().toISOString(),
    }
];


interface AuthContextType {
  isAuthenticated: boolean;
  currentUser: User | null;
  setRole: (role: UserRole) => void; // Kept for role switching demo
  permissions: AppKey[];
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  const isAuthenticated = !!currentUser;

  const permissions = useMemo(() => {
    if (!currentUser) return [];
    return ROLE_PERMISSIONS[currentUser.role];
  }, [currentUser]);

  const login = async (email: string, pass: string) => {
    // Simulate API call
    return new Promise<void>((resolve, reject) => {
        setTimeout(() => {
            const user = MOCK_USERS.find(u => u.email.toLowerCase() === email.toLowerCase());
            
            // In a real app, you would compare a hashed password.
            // For this mock, we compare the plain text password.
            if (user && user.passwordHash === pass) {
                console.log('Login successful for:', email);
                setCurrentUser(user);
                resolve();
            } else {
                reject(new Error('Invalid credentials'));
            }
        }, 500);
    });
  };

  const logout = () => {
    setCurrentUser(null);
  };
  
  // For role switcher demo purposes
  const setRole = (role: UserRole) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, role });
    }
  };


  return (
    <AuthContext.Provider value={{ isAuthenticated, currentUser, setRole, permissions, login, logout }}>
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