import React from 'react';
import { Gamepad2, Search, ShieldCheck, ShoppingBag, Lock, MessageCircle, HelpCircle } from 'lucide-react';

export default function Header({ 
  searchQuery, 
  setSearchQuery, 
  onOpenAdmin, 
  onOpenTracker, 
  storeSettings 
}) {
  const adminWhatsApp = storeSettings?.admin_whatsapp || "6282199887766";
  const storeName = storeSettings?.store_name || "Zhafranstore.id";

  const handleHelpClick = () => {
    const waUrl = `https://wa.me/${adminWhatsApp}?text=${encodeURIComponent(
      `Halo Admin ${storeName}, saya butuh bantuan mengenai pemesanan game/gamepass.`
    )}`;
    window.open(waUrl, "_blank");
  };

  return (
    <header className="sticky top-0 z-40 w-full backdrop-blur-xl bg-[#07090E]/85 border-b border-white/10 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-3 cursor-pointer select-none">
          <div className="relative flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-tr from-cyan-500 to-violet-600 p-0.5 shadow-lg shadow-cyan-500/20">
            <div className="w-full h-full bg-[#090C15] rounded-[10px] flex items-center justify-center">
              <Gamepad2 className="w-6 h-6 text-cyan-400 animate-pulse" />
            </div>
            <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black font-heading tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                {storeName}
              </h1>
              <span className="hidden sm:inline-flex text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
                Resmi
              </span>
            </div>
            <p className="text-[11px] sm:text-xs text-slate-400 hidden xs:block">
              Game & Gamepass Instant Storefront
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
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Lacak Pesanan */}
          <button
            onClick={onOpenTracker}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-xs sm:text-sm font-semibold text-slate-200 hover:text-white transition shadow-sm"
            title="Lacak status pesanan kamu"
          >
            <ShoppingBag className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">Lacak Pesanan</span>
          </button>

          {/* Bantuan WA */}
          <button
            onClick={handleHelpClick}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-950/40 hover:bg-emerald-900/50 border border-emerald-500/30 text-xs sm:text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition"
            title="Hubungi Admin via WhatsApp"
          >
            <MessageCircle className="w-4 h-4 text-emerald-400" />
            <span className="hidden sm:inline">Bantuan WA</span>
          </button>

          {/* Admin Panel Button */}
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-gradient-to-r from-violet-600/30 to-purple-600/30 hover:from-violet-600/50 hover:to-purple-600/50 border border-violet-500/40 text-xs sm:text-sm font-semibold text-violet-300 hover:text-white transition"
            title="Akses Dashboard Pemilik Toko"
          >
            <Lock className="w-3.5 h-3.5 text-violet-400" />
            <span className="hidden xs:inline">Admin</span>
          </button>
        </div>

      </div>

      {/* Mobile Search Bar */}
      <div className="md:hidden px-4 pb-3">
        <div className="relative w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
          <input
            type="text"
            placeholder="Cari Game, Gamepass, Diamond..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-8 py-2 bg-slate-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
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
