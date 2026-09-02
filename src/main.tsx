import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// Suppress benign ResizeObserver loop errors and browser extension injected script errors
window.addEventListener('error', (e) => {
  if (e.message && e.message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation?.();
    e.preventDefault();
    return;
  }
  if (
    e.filename?.includes('injected.js') ||
    e.filename?.includes('injectedScript') ||
    e.filename?.includes('chrome-extension://') ||
    e.filename?.includes('moz-extension://')
  ) {
    e.stopImmediatePropagation?.();
    e.preventDefault();
  }
});

window.addEventListener('unhandledrejection', (e) => {
  const reason = e.reason?.stack || e.reason?.message || String(e.reason || '');
  if (
    reason.includes('injected.js') ||
    reason.includes('injectedScript') ||
    reason.includes('chrome-extension://') ||
    reason.includes('ethereum') ||
    reason.includes('solana') ||
    reason.includes('cardano') ||
    reason.includes('isMetaMask')
  ) {
    e.stopImmediatePropagation?.();
    e.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
