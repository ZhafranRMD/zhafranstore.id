import React from 'react';
import { Layers, Gamepad2, Zap, ArrowUpDown, Tag } from 'lucide-react';

export default function CategoryFilter({
  categories = [],
  activeCategory,
  onSelectCategory,
  sortBy,
  onSortChange,
  counts = {}
}) {
  const dynamicCategories = [
    { id: "all", label: "Semua Produk", icon: Layers, count: counts.all || 0 },
    ...(Array.isArray(categories) ? categories : []).map(c => ({
      id: c.id,
      label: c.name,
      icon: c.id === 'gamepass' ? Zap : c.id === 'game' ? Gamepad2 : Tag,
      count: counts[c.id] || 0
    }))
  ];

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 my-4 pb-2">
      
      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
        {dynamicCategories.map((cat) => {
          const Icon = cat.icon;
          const isActive = activeCategory === cat.id;

          return (
            <button
              key={cat.id}
              onClick={() => onSelectCategory(cat.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-heading font-bold text-xs sm:text-sm whitespace-nowrap transition-all duration-200 border ${
                isActive
                  ? "bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 border-cyan-400 shadow-lg shadow-cyan-500/25 scale-[1.02]"
                  : "bg-slate-900/80 text-slate-300 hover:text-white border-white/10 hover:border-white/20 hover:bg-slate-800/80"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-slate-950" : "text-cyan-400"}`} />
              <span>{cat.label}</span>
              <span
                className={`text-[11px] px-2 py-0.5 rounded-full font-bold ${
                  isActive
                    ? "bg-slate-950/20 text-slate-950"
                    : "bg-white/10 text-slate-300"
                }`}
              >
                {cat.count || 0}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sorting Dropdown */}
      <div className="flex items-center gap-2 self-end sm:self-auto">
        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
          <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
          <span className="hidden xs:inline">Urutkan:</span>
        </div>
        <select
          value={sortBy}
          onChange={(e) => onSortChange(e.target.value)}
          aria-label="Urutkan produk"
          className="bg-slate-900/90 border border-white/10 text-slate-200 text-xs sm:text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-cyan-400"
        >
          <option value="popular">🔥 Paling Populer</option>
          <option value="price_low">💵 Harga Terendah</option>
          <option value="price_high">💎 Harga Tertinggi</option>
          <option value="name_asc">🔤 Nama (A - Z)</option>
        </select>
      </div>

    </div>
  );
}
