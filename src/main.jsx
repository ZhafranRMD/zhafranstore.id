import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './styles/index.css';

// PWA Service Worker Registration with Auto-Update on New Deploy
if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      // Force check for updates every time page loads
      reg.update();

      reg.addEventListener('updatefound', () => {
        const installingWorker = reg.installing;
        if (installingWorker) {
          installingWorker.addEventListener('statechange', () => {
            if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Versi baru Zhafranstore terpasang. Memuat pembaruan...');
              window.location.reload();
            }
          });
        }
      });
    }).catch((err) => {
      console.warn('PWA Service Worker registration:', err);
    });
  });

  // Reload when the active service worker changes to ensure fresh assets
  let refreshing = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!refreshing) {
      refreshing = true;
      window.location.reload();
    }
  });
}

// Global Error Boundary to prevent any blank page
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Zhafranstore UI Error:", error, errorInfo);
  }

  handleForceReset = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const r of regs) await r.unregister();
      }
      localStorage.clear();
      sessionStorage.clear();
      window.location.href = window.location.origin + '?v=' + Date.now();
    } catch {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#07090E] text-slate-100 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-slate-900/90 border border-cyan-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-xl">
            <div className="w-16 h-16 bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-cyan-500/30 text-2xl font-bold">
              ⚡
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Pembaruan Sistem Zhafranstore.id</h2>
            <p className="text-slate-400 text-sm mb-6">
              Sistem telah diperbarui ke versi Cloudflare D1 & R2 Edge terbaru. Silakan klik tombol di bawah untuk menyinkronkan data toko.
            </p>
            <button
              onClick={this.handleForceReset}
              className="w-full py-3 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/25 transition-all active:scale-95"
            >
              🔄 Bersihkan Cache & Muat Ulang Sekarang
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
