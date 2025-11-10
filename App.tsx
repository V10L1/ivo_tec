import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { ModuleWrapper } from './components/ModuleWrapper';
import { APP_MODULES } from './constants';
import { AppKey } from './types';
import SiteEditor from './modules/SiteEditor';
import StoreManager from './modules/StoreManager';
import StockControl from './modules/StockControl';
import MessagesChat from './modules/MessagesChat';
import SupportTickets from './modules/SupportTickets';
import UserManagement from './modules/UserManagement';
import PublicSite from './modules/PublicSite';
import Login from './modules/Login';
import PreviewSite from './modules/PreviewSite';
import InitialSetup from './modules/InitialSetup';

// --- Router Context ---
interface RouterContextType {
  navigate: (path: string) => void;
}
const RouterContext = createContext<RouterContextType | undefined>(undefined);

export const useRouter = () => {
  const context = useContext(RouterContext);
  if (!context) {
    throw new Error('useRouter must be used within the main App component');
  }
  return context;
};

// --- Module Views ---
const ModuleViews: Record<AppKey, React.ComponentType> = {
  SITE: SiteEditor,
  STORE: StoreManager,
  STOCK: StockControl,
  MESSAGES: MessagesChat,
  SUPPORT: SupportTickets,
  USERS: UserManagement,
};

const AdminPanel = () => {
  const [activeModule, setActiveModule] = useState<AppKey | null>(null);

  const handleSelectModule = (key: AppKey) => {
    setActiveModule(key);
  };

  const handleGoToDashboard = () => {
    setActiveModule(null);
  };

  const ActiveModuleComponent = activeModule ? ModuleViews[activeModule] : null;
  const moduleInfo = activeModule ? APP_MODULES.find(m => m.key === activeModule) : null;

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
      <Header />
      <main className="p-4 sm:p-6 lg:p-8">
        {activeModule && ActiveModuleComponent && moduleInfo ? (
          <ModuleWrapper title={moduleInfo.name} onBack={handleGoToDashboard}>
            <ActiveModuleComponent />
          </ModuleWrapper>
        ) : (
          <Dashboard onSelectModule={handleSelectModule} />
        )}
      </main>
    </div>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const getPathFromHash = () => window.location.hash.substring(1) || '/';
  const [path, setPath] = useState(getPathFromHash());
  const [needsSetup, setNeedsSetup] = useState<boolean | null>(null);

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath);
  };

  useEffect(() => {
    const onHashChange = () => setPath(getPathFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    const checkSetupStatus = async () => {
      try {
        const response = await fetch('/api/setup/status');
        const data = await response.json();
        setNeedsSetup(data.needsSetup);
      } catch (error) {
        console.error("Não foi possível verificar o status da configuração:", error);
        setNeedsSetup(false); // Assume que a configuração não é necessária se a verificação falhar
      }
    };
    if (path.startsWith('/administrator')) {
        checkSetupStatus();
    } else {
        setNeedsSetup(false);
    }
  }, [path]);


  if (needsSetup === null && path.startsWith('/administrator')) {
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Verificando configuração...</div>;
  }

  let content;
  if (path.startsWith('/administrator')) {
    if (needsSetup) {
      content = <InitialSetup />;
    } else {
      content = isAuthenticated ? <AdminPanel /> : <Login />;
    }
  } else if (path.startsWith('/preview')) {
    content = <PreviewSite />;
  }
  else {
    content = <PublicSite />;
  }

  return (
    <RouterContext.Provider value={{ navigate }}>
      {content}
    </RouterContext.Provider>
  );
};


export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}