import React from 'react';
import { Zap, ShieldCheck, QrCode, Sparkles, Clock, CheckCircle2 } from 'lucide-react';

export default function HeroBanner({ onSelectCategory }) {
  return (
    <section className="relative my-6 rounded-2xl overflow-hidden border border-white/10 bg-gradient-to-br from-[#10162A] via-[#0B0F1C] to-[#080B14] p-6 sm:p-8 shadow-2xl">
      {/* Background Decorative Glow */}
      <div className="absolute -top-24 -right-24 w-72 h-72 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-24 -left-24 w-72 h-72 bg-violet-600/15 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
        
        {/* Left Column: Headline & Value Prop */}
        <div className="max-w-2xl text-center lg:text-left">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-400 text-xs font-bold tracking-wide uppercase mb-4 animate-bounce">
            <Sparkles className="w-3.5 h-3.5" />
            Promo Spesial & Pengiriman Otomatis 24 Jam
          </div>

          <h2 className="text-2xl sm:text-4xl lg:text-5xl font-black font-heading text-white tracking-tight leading-tight">
            Beli Game & Gamepass <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-cyan-400 via-sky-300 to-violet-400 bg-clip-text text-transparent">
              Bayar Instan Tanpa Ribet
            </span>
          </h2>

          <p className="mt-3 text-sm sm:text-base text-slate-300 leading-relaxed">
            Pusat produk digital Roblox Blox Fruits, Mobile Legends, Free Fire, Valorant, hingga lisensi Game PC Original. Bayar langsung pakai <strong>QRIS Semua Bank / E-Wallet</strong> atau lewat <strong>Shopee, Tokopedia, dan TikTok Shop</strong>.
          </p>

          {/* Quick CTA buttons */}
          <div className="mt-6 flex flex-wrap items-center justify-center lg:justify-start gap-3">
            <button
              onClick={() => onSelectCategory("gamepass")}
              className="btn-primary text-xs sm:text-sm"
            >
              <Zap className="w-4 h-4" />
              Lihat Item Gamepass
            </button>
            <button
              onClick={() => onSelectCategory("game")}
              className="btn-secondary text-xs sm:text-sm"
            >
              🎮 Jelajahi Game PC
            </button>
          </div>
        </div>

        {/* Right Column: Feature Badges & Trust Stats */}
        <div className="w-full lg:w-auto grid grid-cols-2 sm:grid-cols-2 gap-3 max-w-md">
          
          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div className="font-heading font-bold text-white text-sm sm:text-base">1 - 5 Menit</div>
            <div className="text-xs text-slate-400">Proses instan langsung dikirim ke akun kamu</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div className="font-heading font-bold text-white text-sm sm:text-base">100% Legal</div>
            <div className="text-xs text-slate-400">Garansi resmi aman anti-banned</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <QrCode className="w-5 h-5" />
            </div>
            <div className="font-heading font-bold text-white text-sm sm:text-base">QRIS Praktis</div>
            <div className="text-xs text-slate-400">Scan via DANA, GoPay, OVO, BCA, Mandiri</div>
          </div>

          <div className="p-4 rounded-xl bg-slate-900/70 border border-white/5 backdrop-blur-md flex flex-col gap-2">
            <div className="w-9 h-9 rounded-lg bg-violet-500/20 text-violet-400 flex items-center justify-center">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div className="font-heading font-bold text-white text-sm sm:text-base">Marketplace</div>
            <div className="text-xs text-slate-400">Bisa checkout di Shopee, Tokopedia, TikTok</div>
          </div>

        </div>

      </div>
    </section>
  );
}
