

import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LazyPublicSite = lazy(() => import('./modules/site/PublicSite'));
const LazyAiPoweredEditor = lazy(() => import('./modules/site/AiPoweredEditor'));

const SiteComponentSelector: React.FC = () => {
    const { isAuthenticated, permissions, isLoading } = useAuth();

    const getSlugFromHash = () => {
        const hash = window.location.hash.substring(1);
        const slug = hash.split('?')[0];
        // Garante que a raiz do site seja mapeada para "home"
        return slug === '/' || slug === '' ? 'home' : slug.startsWith('/') ? slug.substring(1) : slug;
    };

    const getIsEditMode = () => {
        const hash = window.location.hash;
        return new URLSearchParams(hash.split('?')[1]).get('edit') === 'true';
    };

    const slug = getSlugFromHash();
    const isEditRequested = getIsEditMode();
    const canEdit = isAuthenticated && (permissions || []).includes('SITE');

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Verificando autenticação...</div>;
    }

    if (isEditRequested && canEdit) {
        return <LazyAiPoweredEditor slug={slug} />;
    }
    
    // Para todos os outros casos (não solicitando edição, ou não pode editar), mostra o site público.
    return <LazyPublicSite slug={slug} />;
};


const PublicSiteLoader: React.FC = () => {
  return (
    <AuthProvider>
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">Carregando...</div>}>
        <SiteComponentSelector />
      </Suspense>
    </AuthProvider>
  );
};

export default PublicSiteLoader;
