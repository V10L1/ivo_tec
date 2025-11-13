import React, { Suspense, lazy } from 'react';
import { AuthProvider } from './contexts/AuthContext';

// Carrega o componente PublicSite dinamicamente
// @google/genai-fix: Explicitly handle the module promise to ensure the 'default' export is correctly identified for React.lazy.
const PublicSite = lazy(() => import('./modules/site/PublicSite').then(module => ({ default: module.default })));

const PublicSiteLoader: React.FC = () => {
  // Extrai o slug do hash da URL.
  // Ex: #/sobre-nos -> sobre-nos
  // Ex: #/ -> home
  const getSlugFromHash = () => {
    const hash = window.location.hash.substring(1); // Remove o '#'
    const slug = hash.split('?')[0]; // Remove query params
    return slug === '/' || slug === '' ? 'home' : slug;
  };

  const slug = getSlugFromHash();

  return (
    // O AuthProvider é necessário para que o PublicSite possa verificar
    // se o usuário está logado e habilitar o modo de edição.
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando site...</div>}>
        <PublicSite slug={slug} />
      </Suspense>
    </AuthProvider>
  );
};

export default PublicSiteLoader;