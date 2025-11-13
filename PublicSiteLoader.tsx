
import React, { Suspense, lazy } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const LazyPublicSite = lazy(() => import('./modules/site/PublicSite'));
const LazySiteEditor = lazy(() => import('./modules/site/SiteEditor'));

const SiteComponentSelector: React.FC = () => {
    const { isAuthenticated, permissions, isLoading } = useAuth();

    const getSlugFromHash = () => {
        const hash = window.location.hash.substring(1);
        const slug = hash.split('?')[0];
        return slug === '/' || slug === '' ? 'home' : slug;
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
        return <LazySiteEditor slug={slug} />;
    }
    
    // For all other cases (not requesting edit, or can't edit), show public site.
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
