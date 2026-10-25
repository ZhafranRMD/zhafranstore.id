import React, { useState } from 'react';
import ProductCard from './ProductCard.jsx';
import { PackageOpen, Sparkles, LayoutGrid, Square, Smartphone } from 'lucide-react';

export default function ProductGrid({ products, onCheckout, onResetSearch }) {
  // View mode: 'grid' vs 'full' (Tampilan Lebih Besar & Full Melihat di Layar HP)
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'full'

  if (!products || products.length === 0) {
    return (
      <div className="my-12 py-16 text-center rounded-2xl border border-white/5 bg-slate-900/40 p-8 flex flex-col items-center justify-center">
        <div className="w-16 h-16 rounded-2xl bg-slate-800/80 border border-white/10 flex items-center justify-center text-slate-400 mb-4">
          <PackageOpen className="w-8 h-8" />
        </div>
        <h3 className="font-heading font-bold text-lg text-white">Produk Tidak Ditemukan</h3>
        <p className="mt-1 text-sm text-slate-400 max-w-md">
          Tidak ada produk yang cocok dengan pencarian atau filter yang dipilih. Coba cari dengan kata kunci lain.
        </p>
        <button
          onClick={onResetSearch}
          className="mt-4 btn-secondary text-xs"
        >
          Reset Pencarian & Filter
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* View Switcher Bar */}
      <div className="flex items-center justify-between pb-1 text-xs">
        <span className="text-slate-400 font-medium hidden sm:inline">
          Menampilkan <strong>{products.length}</strong> produk game & gamepass
        </span>

        {/* View Layout Toggle */}
        <div className="flex items-center gap-1.5 ml-auto bg-slate-900/90 border border-white/10 p-1 rounded-xl">
          <button
            onClick={() => setViewMode('grid')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
              viewMode === 'grid'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Grid Standar"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            <span>Grid</span>
          </button>

          <button
            onClick={() => setViewMode('full')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
              viewMode === 'full'
                ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'text-slate-400 hover:text-white'
            }`}
            title="Tampilan Layar Penuh & Besar (Optimal untuk HP)"
          >
            <Square className="w-3.5 h-3.5" />
            <span>Layar Besar Penuh</span>
          </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className={
        viewMode === 'full'
          ? "grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6"
          : "grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6"
      }>
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onCheckout={onCheckout}
            isFullView={viewMode === 'full'}
          />
        ))}
      </div>
    </div>
  );
}
