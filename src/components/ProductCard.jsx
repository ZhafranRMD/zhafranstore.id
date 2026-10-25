import React from 'react';
import { Zap, Gamepad2, ShoppingCart, ExternalLink, Flame, ShieldCheck, Check, Sparkles } from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function ProductCard({ product, onCheckout, isFullView = false }) {
  const isGamepass = product.category === 'gamepass';
  const hasMarketplace = product.shopee_url || product.tiktok_url || product.tokopedia_url;

  return (
    <div className={`group relative flex flex-col rounded-2xl bg-slate-900/85 border border-white/10 hover:border-cyan-400/40 hover:bg-slate-850/90 transition-all duration-300 hover:shadow-2xl hover:shadow-cyan-500/15 overflow-hidden ${
      isFullView ? 'w-full shadow-lg' : ''
    }`}>
      
      {/* Top Image & Floating Badges */}
      <div className={`relative w-full bg-slate-950 overflow-hidden ${
        isFullView ? 'aspect-[16/9] max-h-72 sm:max-h-80' : 'aspect-[16/10]'
      }`}>
        <img
          src={product.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800";
          }}
        />
        
        {/* Dark Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/25 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5 z-10">
          <span
            className={`badge ${
              isGamepass ? 'badge-purple' : 'badge-cyan'
            } backdrop-blur-md text-[10px] sm:text-xs font-bold shadow-md`}
          >
            {isGamepass ? (
              <>
                <Zap className="w-3 h-3" />
                Gamepass
              </>
            ) : (
              <>
                <Gamepad2 className="w-3 h-3" />
                Game PC
              </>
            )}
          </span>

          {product.popular && (
            <span className="badge badge-amber backdrop-blur-md text-[10px] font-bold shadow-md">
              <Flame className="w-3 h-3 text-amber-400" />
              HOT
            </span>
          )}
        </div>

        {/* Instant Delivery Badge */}
        <div className="absolute top-2.5 right-2.5 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-950/90 border border-emerald-500/40 text-[10px] sm:text-xs font-bold text-emerald-300 backdrop-blur-md shadow-md">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Proses 1-5 Mnt
          </span>
        </div>

        {/* Game Title Tag on Image Bottom */}
        {product.game_title && (
          <div className="absolute bottom-2.5 left-3 text-xs sm:text-sm font-black text-cyan-300 bg-slate-950/90 border border-cyan-500/30 px-2.5 py-1 rounded-lg backdrop-blur-md z-10 shadow-md">
            {product.game_title}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className={`flex-1 flex flex-col justify-between ${
        isFullView ? 'p-4 sm:p-6' : 'p-4'
      }`}>
        
        <div>
          <h3 className={`font-heading font-black text-white group-hover:text-cyan-300 transition-colors leading-snug ${
            isFullView ? 'text-base sm:text-lg line-clamp-2' : 'text-sm sm:text-base line-clamp-2'
          }`}>
            {product.name}
          </h3>

          <p className={`mt-2 text-slate-400 leading-relaxed ${
            isFullView ? 'text-xs sm:text-sm line-clamp-3' : 'text-xs line-clamp-2'
          }`}>
            {product.description || "Top up instan otomatis tanpa antre langsung masuk ke akun kamu."}
          </p>

          {/* Marketplace Availability Indicators */}
          {hasMarketplace && (
            <div className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-slate-400">
              <span>Bisa di:</span>
              <div className="flex items-center gap-1.5">
                {product.shopee_url && (
                  <span className="px-2 py-0.5 rounded-md bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold text-[10px]">
                    Shopee
                  </span>
                )}
                {product.tokopedia_url && (
                  <span className="px-2 py-0.5 rounded-md bg-green-500/20 text-green-400 border border-green-500/30 font-bold text-[10px]">
                    Tokopedia
                  </span>
                )}
                {product.tiktok_url && (
                  <span className="px-2 py-0.5 rounded-md bg-pink-500/20 text-pink-400 border border-pink-500/30 font-bold text-[10px]">
                    TikTok
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price & Action Button (FR-02) */}
        <div className={`mt-4 pt-3.5 border-t border-white/10 flex items-center justify-between gap-3 ${
          isFullView ? 'sm:flex-row flex-col sm:items-center' : ''
        }`}>
          
          <div className={isFullView ? 'w-full sm:w-auto flex justify-between sm:block' : ''}>
            <div className="text-[10px] uppercase font-bold text-slate-400">Harga Resmi Instan</div>
            <div className={`font-heading font-black text-cyan-400 tracking-tight ${
              isFullView ? 'text-xl sm:text-2xl' : 'text-base sm:text-lg'
            }`}>
              {storeService.formatRupiah(product.price)}
            </div>
          </div>

          <button
            onClick={() => onCheckout(product)}
            disabled={product.is_active === false}
            className={`btn-primary rounded-xl font-heading font-black flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25 ${
              isFullView 
                ? 'w-full sm:w-auto text-xs sm:text-sm py-3 px-6' 
                : 'text-xs sm:text-sm py-2 px-3 sm:px-4'
            } ${product.is_active === false ? 'opacity-50 cursor-not-allowed filter-none' : ''}`}
          >
            <ShoppingCart className="w-4 h-4 text-slate-950" />
            <span>{product.is_active === false ? 'Stok Habis' : 'Bayar Sekarang'}</span>
          </button>

        </div>

      </div>

    </div>
  );
}
