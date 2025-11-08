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

const AppContent: React.FC = () => {
  const { isAuthenticated } = useAuth();
  
  const getPathFromHash = () => window.location.hash.substring(1) || '/';
  const [path, setPath] = useState(getPathFromHash());

  const navigate = (newPath: string) => {
    window.location.hash = newPath;
    setPath(newPath); // Eagerly update state for instant UI response
  };

  useEffect(() => {
    const onHashChange = () => setPath(getPathFromHash());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  let content;
  if (path.startsWith('/administrator')) {
    if (!isAuthenticated) {
      content = <Login />;
    } else {
      const pathParts = path.split('/').filter(Boolean); // e.g., ['administrator', 'site']
      const activeModuleKeyStr = pathParts.length > 1 ? pathParts[1].toUpperCase() : null;
      
      const isValidKey = activeModuleKeyStr && Object.keys(ModuleViews).includes(activeModuleKeyStr);
      const activeModule = isValidKey ? activeModuleKeyStr as AppKey : null;

      const handleSelectModule = (key: AppKey) => {
        navigate(`/administrator/${key.toLowerCase()}`);
      };
    
      const handleGoToDashboard = () => {
        navigate('/administrator');
      };
      
      let adminContent;
      if (activeModule) {
        const ActiveModuleComponent = ModuleViews[activeModule];
        const moduleInfo = APP_MODULES.find(m => m.key === activeModule);

        if (ActiveModuleComponent && moduleInfo) {
          adminContent = (
            <ModuleWrapper title={moduleInfo.name} onBack={handleGoToDashboard}>
              <ActiveModuleComponent />
            </ModuleWrapper>
          );
        } else {
          // Fallback to dashboard if module in URL is invalid
          adminContent = <Dashboard onSelectModule={handleSelectModule} />;
        }
      } else {
        adminContent = <Dashboard onSelectModule={handleSelectModule} />;
      }
      
      content = (
        <div className="min-h-screen bg-slate-900 text-slate-100 font-sans">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            {adminContent}
          </main>
        </div>
      );
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