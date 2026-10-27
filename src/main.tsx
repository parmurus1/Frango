import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { HashRouter, MemoryRouter } from 'react-router-dom';
import { App } from './App';
import { StoreProvider } from './lib/store';
import './styles.css';

// VITE_ROUTER=memory: para hospedar onde a página não controla o endereço (ex.: dentro de um iframe)
const embedded = import.meta.env.VITE_ROUTER === 'memory';
const Router = embedded ? MemoryRouter : HashRouter;

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Router>
      <StoreProvider>
        <App />
      </StoreProvider>
    </Router>
  </StrictMode>,
);

// offline: registra o service worker só no build de produção
if (import.meta.env.PROD && !embedded && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {});
  });
}
