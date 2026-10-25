import React, { useState, useEffect } from 'react';
import { 
  Gamepad2, 
  Search, 
  ShoppingBag, 
  Lock, 
  MessageCircle, 
  HelpCircle,
  Maximize2,
  Minimize2,
  Download,
  Smartphone,
  Sparkles,
  Mail
} from 'lucide-react';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  onOpenAdmin, 
  onOpenTracker, 
  onOpenChallenge,
  onOpenHelp,
  storeSettings 
}) {
  const adminWhatsApp = storeSettings?.admin_whatsapp || "082542778554";
  const adminEmail = storeSettings?.admin_email || "zhafran.gibran09@gmail.com";
  const storeName = storeSettings?.store_name || "Zhafranstore.id";

  // Fullscreen State for HP / Desktop
  const [isFullscreen, setIsFullscreen] = useState(false);

  // PWA Install Prompt State
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);

  // Check Fullscreen status & PWA install event
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };
    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  // Toggle Fullscreen (Bermain HP lebih besar dan full melihat)
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => {
        console.warn("Fullscreen request error:", err);
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  // Trigger PWA Installation
  const handleInstallPWA = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setIsInstallable(false);
      }
      setDeferredPrompt(null);
    } else {
      alert("Aplikasi PWA Zhafranstore.id siap dipasang! Buka menu browser kamu lalu pilih 'Add to Home screen' / 'Tambahkan ke Layar Utama' untuk pengalaman layar penuh 100%.");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090E]/90 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 sm:gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5 sm:gap-3 cursor-pointer select-none">
          <div className="relative flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#090C15] rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6 text-cyan-400 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-2.5 w-2.5 sm:h-3 sm:w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-full w-full bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-1.5 sm:gap-2">
              <h1 className="text-base sm:text-2xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                {storeName}
              </h1>
              <span className="text-[9px] sm:text-[10px] font-bold uppercase tracking-wider px-1.5 sm:px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                PWA
              </span>
            </div>
            <p className="text-[10px] sm:text-xs text-slate-400 hidden xs:block">
              Toko Game & Gamepass Instan Terlengkap
            </p>
          </div>
        </div>

        {/* Search Bar (Desktop & Tablet) */}
        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder="Cari Game, Gamepass, Diamond, Roblox..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400 focus:ring-1 focus:ring-cyan-400 transition"
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2.5">
          
          {/* Tombol Pasang PWA */}
          <button
            onClick={handleInstallPWA}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-400/40 text-[11px] sm:text-xs font-bold text-cyan-300 hover:text-cyan-200 transition shadow-sm"
            title="Pasang Progressive Web App (PWA) di Layar Utama HP / PC"
          >
            <Smartphone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400 animate-bounce" />
            <span className="hidden sm:inline">Pasang PWA</span>
            <span className="sm:hidden">App</span>
          </button>

          {/* Tombol Fullscreen HP / Layar Penuh */}
          <button
            onClick={toggleFullscreen}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
            title={isFullscreen ? "Keluar Layar Penuh" : "Mode Layar Penuh (Tampilan HP Lebih Besar & Full)"}
          >
            {isFullscreen ? (
              <>
                <Minimize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Normal</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="hidden md:inline">Layar Penuh</span>
              </>
            )}
          </button>

          {/* Event Hadiah & Verifikasi Video */}
          <button
            onClick={onOpenChallenge}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-amber-500/10 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/40 text-[11px] sm:text-xs font-bold text-amber-300 hover:text-amber-200 transition shadow-sm animate-pulse-glow"
            title="Event Hadiah & Verifikasi Video Pengalaman Membeli"
          >
            <span>🎁</span>
            <span className="hidden xs:inline">Event & Verifikasi</span>
          </button>

          {/* Lacak Pesanan */}
          <button
            onClick={onOpenTracker}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-[11px] sm:text-xs font-semibold text-slate-200 hover:text-white transition shadow-sm"
            title="Lacak status pesanan kamu"
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-cyan-400" />
            <span className="hidden sm:inline">Lacak</span>
          </button>

          {/* Tanya Admin & Bantuan (WA: 082542778554 & Email: zhafran.gibran09@gmail.com) */}
          <button
            onClick={onOpenHelp}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-emerald-950/50 hover:bg-emerald-900/60 border border-emerald-500/40 text-[11px] sm:text-xs font-bold text-emerald-400 hover:text-emerald-300 transition"
            title="Tanya Admin Permasalahan & Konsultasi"
          >
            <HelpCircle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
            <span className="hidden sm:inline">Tanya Admin</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1 sm:gap-1.5 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 text-[11px] sm:text-xs font-semibold text-violet-300 hover:text-white transition"
            title="Akses Dashboard Pemilik Toko"
          >
            <Lock className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-violet-400" />
            <span className="hidden xs:inline">Admin</span>
          </button>
        </div>

      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-3 sm:px-4 pb-2.5">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari Game, Gamepass, Diamond..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-8 py-1.5 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-white"
            >
              ✕
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
