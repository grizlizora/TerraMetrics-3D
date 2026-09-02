import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './app/App';
import './styles/index.css';
import 'maplibre-gl/dist/maplibre-gl.css';

// Suppress benign ResizeObserver loop errors and browser extension injected script errors
window.addEventListener(
  'error',
  (e) => {
    const msg = e.message || '';
    const src = e.filename || '';
    if (msg.includes('ResizeObserver loop')) {
      e.stopImmediatePropagation?.();
      e.preventDefault();
      return;
    }
    if (
      src.includes('injected.js') ||
      src.includes('injectedScript') ||
      src.includes('chrome-extension://') ||
      src.includes('moz-extension://') ||
      msg.includes('isMetaMask') ||
      msg.includes('redefine property: solana') ||
      msg.includes('redefine property: cardano') ||
      msg.includes('redefine property: ethereum')
    ) {
      e.stopImmediatePropagation?.();
      e.preventDefault();
    }
  },
  true
);

window.addEventListener(
  'unhandledrejection',
  (e) => {
    const reason = e.reason?.stack || e.reason?.message || String(e.reason || '');
    if (
      reason.includes('injected.js') ||
      reason.includes('injectedScript') ||
      reason.includes('chrome-extension://') ||
      reason.includes('moz-extension://') ||
      reason.includes('ethereum') ||
      reason.includes('solana') ||
      reason.includes('cardano') ||
      reason.includes('isMetaMask') ||
      reason.includes('not found method')
    ) {
      e.stopImmediatePropagation?.();
      e.preventDefault();
    }
  },
  true
);

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}
