import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext.js';
import { Dashboard } from './components/Dashboard.js';
import { Header } from './components/Header.js';
import { ModuleWrapper } from './components/ModuleWrapper.js';
import { APP_MODULES } from './constants.js';
import { AppKey } from './types.js';
import SiteEditor from './modules/SiteEditor.js';
import StoreManager from './modules/StoreManager.js';
import StockControl from './modules/StockControl.js';
import MessagesChat from './modules/MessagesChat.js';
import SupportTickets from './modules/SupportTickets.js';
import UserManagement from './modules/UserManagement.js';
import PublicSite from './modules/PublicSite.js';
import Login from './modules/Login.js';
import PreviewSite from './modules/PreviewSite.js';

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
  
  // Hash-based routing logic
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
    content = isAuthenticated ? <AdminPanel /> : <Login />;
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