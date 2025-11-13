
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import PublicSiteLoader from './PublicSiteLoader';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);

// Função para renderizar com base na rota atual.
const renderApp = () => {
  const hash = window.location.hash;

  // Se a rota começa com #/administrator, #/register, #/forgot-password, etc., carregamos o App de admin.
  // Qualquer outra rota é considerada uma página pública.
  if (hash.startsWith('#/administrator') || hash.startsWith('#/register') || hash.startsWith('#/forgot-password') || hash === '#/initial-setup') {
    root.render(
      <App />
    );
  } else {
    // Para todas as outras rotas, carregamos o site público.
    root.render(
      <PublicSiteLoader />
    );
  }
};

// Renderiza a aplicação na carga inicial
renderApp();

// Adiciona um listener para renderizar novamente quando o hash da URL mudar.
window.addEventListener('hashchange', renderApp);