import React from 'react';
import ProductCard from './ProductCard.jsx';
import { PackageOpen, Sparkles } from 'lucide-react';

export default function ProductGrid({ products, onCheckout, onResetSearch }) {
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
    <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          onCheckout={onCheckout}
        />
      ))}
    </div>
  );
}
