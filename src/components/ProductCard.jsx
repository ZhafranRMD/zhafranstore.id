import React from 'react';
import { Zap, Gamepad2, ShoppingCart, ExternalLink, Flame, ShieldCheck, Check } from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function ProductCard({ product, onCheckout }) {
  const isGamepass = product.category === 'gamepass';
  const hasMarketplace = product.shopee_url || product.tiktok_url || product.tokopedia_url;

  return (
    <div className="group relative flex flex-col rounded-2xl bg-slate-900/80 border border-white/10 hover:border-cyan-400/40 hover:bg-slate-850/90 transition-all duration-300 hover:shadow-xl hover:shadow-cyan-500/10 overflow-hidden">
      
      {/* Top Image & Floating Badges */}
      <div className="relative w-full aspect-[16/10] bg-slate-950 overflow-hidden">
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
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent"></div>

        {/* Category Badge */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span
            className={`badge ${
              isGamepass ? 'badge-purple' : 'badge-cyan'
            } backdrop-blur-md text-[10px] sm:text-xs font-bold`}
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
            <span className="badge badge-amber backdrop-blur-md text-[10px] font-bold">
              <Flame className="w-3 h-3 text-amber-400" />
              HOT
            </span>
          )}
        </div>

        {/* Instant Delivery Badge */}
        <div className="absolute top-2.5 right-2.5">
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-950/80 border border-emerald-500/30 text-[10px] font-semibold text-emerald-300 backdrop-blur-sm">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            1-5 Mnt
          </span>
        </div>

        {/* Game Title Tag on Image Bottom */}
        {product.game_title && (
          <div className="absolute bottom-2 left-2.5 text-[11px] font-bold text-slate-300 bg-slate-900/90 border border-white/10 px-2 py-0.5 rounded-md backdrop-blur-sm">
            {product.game_title}
          </div>
        )}
      </div>

      {/* Body Content */}
      <div className="flex-1 p-4 flex flex-col justify-between">
        
        <div>
          <h3 className="font-heading font-bold text-sm sm:text-base text-white group-hover:text-cyan-300 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>

          <p className="mt-1.5 text-xs text-slate-400 line-clamp-2 leading-relaxed">
            {product.description || "Top up instan otomatis tanpa antre."}
          </p>

          {/* Marketplace Availability Indicators */}
          {hasMarketplace && (
            <div className="mt-2.5 flex items-center gap-1.5 text-[10px] font-semibold text-slate-400">
              <span>Juga di:</span>
              <div className="flex items-center gap-1">
                {product.shopee_url && (
                  <span className="px-1.5 py-0.5 rounded bg-orange-500/20 text-orange-400 border border-orange-500/30">
                    Shopee
                  </span>
                )}
                {product.tokopedia_url && (
                  <span className="px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                    Tokopedia
                  </span>
                )}
                {product.tiktok_url && (
                  <span className="px-1.5 py-0.5 rounded bg-pink-500/20 text-pink-400 border border-pink-500/30">
                    TikTok
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Price & Action Button (FR-02) */}
        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between gap-2">
          
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Harga Kilat</div>
            <div className="font-heading font-extrabold text-base sm:text-lg text-cyan-400 tracking-tight">
              {storeService.formatRupiah(product.price)}
            </div>
          </div>

          <button
            onClick={() => onCheckout(product)}
            disabled={product.is_active === false}
            className={`btn-primary text-xs sm:text-sm py-2 px-3 sm:px-4 rounded-xl font-heading font-bold flex items-center gap-1.5 ${
              product.is_active === false ? 'opacity-50 cursor-not-allowed filter-none' : ''
            }`}
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>{product.is_active === false ? 'Stok Habis' : 'Bayar Sekarang'}</span>
          </button>

        </div>

      </div>

    </div>
  );
}
