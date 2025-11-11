import React, { useState, useEffect, createContext, useContext } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';
import { ModuleWrapper } from './components/ModuleWrapper';
import { APP_MODULES } from './constants';
import { AppKey } from './types';
import SiteEditor from './modules/site/SiteEditor';
import StoreManager from './modules/loja/StoreManager';
import StockControl from './modules/estoque/StockControl';
import MessagesChat from './modules/mensagens/MessagesChat';
import SupportTickets from './modules/suporte/SupportTickets';
import UserManagement from './modules/usuario/UserManagement';
import PublicSite from './modules/site/PublicSite';
import Login from './modules/usuario/Login';
import PreviewSite from './modules/site/PreviewSite';
import InitialSetup from './modules/usuario/InitialSetup';
import ForgotPassword from './modules/usuario/ForgotPassword';
import Register from './modules/usuario/Register';
import AppsManager from './modules/apps/AppsManager';

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
  APPS: AppsManager,
};

const AdminPanel = () => {
  const [activeModule, setActiveModule] = useState<AppKey | null>(null);

  const handleSelectModule = (key: AppKey) => {
    setActiveModule(key);
  };

  const handleGoToDashboard = () => {
    setActiveModule(null);
  };

  // Tratamento especial para o SiteEditor em tela cheia
  if (activeModule === 'SITE') {
    return <SiteEditor onBack={handleGoToDashboard} />;
  }

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
  const [setupError, setSetupError] = useState<string | null>(null);

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
      setSetupError(null);
      try {
        const response = await fetch('/api/iam/setup/status');
        if (!response.ok) {
            throw new Error(`O servidor respondeu com o status ${response.status}`);
        }
        const data = await response.json();
        setNeedsSetup(data.needsSetup);
      } catch (error) {
        console.error("Não foi possível verificar o status da configuração:", error);
        setSetupError("Não foi possível conectar ao servidor. Verifique se o backend está rodando e se o banco de dados está acessível.");
        setNeedsSetup(null);
      }
    };
    if (path.startsWith('/administrator') || path.startsWith('/register')) {
        checkSetupStatus();
    }
  }, [path]);


  if (needsSetup === null && (path.startsWith('/administrator') || path.startsWith('/register'))) {
      if (setupError) {
          return (
              <div className="min-h-screen flex items-center justify-center bg-slate-900 text-red-400 text-center p-4">
                  <div>
                      <h2 className="text-xl font-bold mb-2">Erro de Configuração</h2>
                      <p>{setupError}</p>
                  </div>
              </div>
          );
      }
    return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Verificando configuração...</div>;
  }

  let content;
  if (path === '/register') {
    content = needsSetup ? <InitialSetup /> : <Register />;
  } else if (path === '/forgot-password') {
    content = <ForgotPassword />;
  } else if (path.startsWith('/administrator')) {
    if (needsSetup) {
      content = <InitialSetup />;
    } else {
      content = isAuthenticated ? <AdminPanel /> : <Login />;
    }
  } else if (path.startsWith('/preview')) {
    const pageId = path.split('/')[1]; // Assumindo /preview/:pageId
    content = <PreviewSite pageId={pageId} />;
  }
  else {
    // Roteamento dinâmico para páginas públicas
    const slug = path === '/' ? 'home' : path.substring(1);
    content = <PublicSite slug={slug} />;
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