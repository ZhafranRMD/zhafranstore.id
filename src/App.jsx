import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header.jsx';
import HeroBanner from './components/HeroBanner.jsx';
import CategoryFilter from './components/CategoryFilter.jsx';
import ProductGrid from './components/ProductGrid.jsx';
import CheckoutModal from './components/CheckoutModal.jsx';
import AdminModal from './components/AdminModal.jsx';
import OrderTrackerModal from './components/OrderTrackerModal.jsx';
import ChallengeModal from './components/ChallengeModal.jsx';
import Toast from './components/Toast.jsx';
import { storeService } from './services/storeService.js';
import { initialProducts, initialStoreSettings } from './data/initialProducts.js';
import { 
  Gamepad2, 
  ShieldCheck, 
  Zap, 
  MessageCircle, 
  Sparkles, 
  Heart, 
  Layers,
  ArrowUp
} from 'lucide-react';

export default function App() {
  // Instant Initial State (Zero Loading Delay)
  const [products, setProducts] = useState(() => {
    try {
      const cached = localStorage.getItem('zhafranstore_products');
      return cached ? JSON.parse(cached) : initialProducts;
    } catch {
      return initialProducts;
    }
  });

  const [storeSettings, setStoreSettings] = useState(() => {
    try {
      const cached = localStorage.getItem('zhafranstore_settings');
      return cached ? JSON.parse(cached) : initialStoreSettings;
    } catch {
      return initialStoreSettings;
    }
  });

  const [loading, setLoading] = useState(false);

  // Filter & Search States
  const [activeCategory, setActiveCategory] = useState('all'); // 'all' | 'game' | 'gamepass'
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('popular'); // 'popular' | 'price_low' | 'price_high' | 'name_asc'

  // Modals
  const [checkoutProduct, setCheckoutProduct] = useState(null);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isTrackerOpen, setIsTrackerOpen] = useState(false);
  const [isChallengeOpen, setIsChallengeOpen] = useState(false);

  // Toast
  const [toastMessage, setToastMessage] = useState('');

  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Sync Data with Firestore in background
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [prods, settings] = await Promise.all([
        storeService.getProducts(),
        storeService.getStoreSettings()
      ]);
      if (prods && prods.length > 0) setProducts(prods);
      if (settings) setStoreSettings(settings);
    } catch (e) {
      console.warn("Background sync note:", e);
    }
  };

  // Filtered & Sorted Products
  const filteredProducts = useMemo(() => {
    let result = [...products];

    // Category filter
    if (activeCategory !== 'all') {
      result = result.filter(p => p.category === activeCategory);
    }

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(p => 
        (p.name && p.name.toLowerCase().includes(q)) ||
        (p.game_title && p.game_title.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q))
      );
    }

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'popular') {
        if (a.popular && !b.popular) return -1;
        if (!a.popular && b.popular) return 1;
        return 0;
      }
      if (sortBy === 'price_low') return a.price - b.price;
      if (sortBy === 'price_high') return b.price - a.price;
      if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
      return 0;
    });

    return result;
  }, [products, activeCategory, searchQuery, sortBy]);

  // Product Counts
  const counts = useMemo(() => {
    return {
      all: products.length,
      gamepass: products.filter(p => p.category === 'gamepass').length,
      game: products.filter(p => p.category === 'game').length
    };
  }, [products]);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#07090E] text-slate-100 flex flex-col font-sans">
      
      {/* Header */}
      <Header
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onOpenAdmin={() => setIsAdminOpen(true)}
        onOpenTracker={() => setIsTrackerOpen(true)}
        onOpenChallenge={() => setIsChallengeOpen(true)}
        storeSettings={storeSettings}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full pb-16">
        
        {/* Hero Section */}
        <HeroBanner onSelectCategory={(cat) => setActiveCategory(cat)} />

        {/* Section Heading & Category Filter */}
        <div className="mt-8">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xl sm:text-2xl font-black font-heading text-white tracking-tight flex items-center gap-2">
                <span>Katalog Produk Game & Gamepass</span>
                <span className="w-2 h-2 rounded-full bg-cyan-400"></span>
              </h3>
              <p className="text-xs text-slate-400">
                Pilih game favoritmu dan selesaikan pembayaran dalam hitungan detik.
              </p>
            </div>
          </div>

          <CategoryFilter
            activeCategory={activeCategory}
            onSelectCategory={setActiveCategory}
            sortBy={sortBy}
            onSortChange={setSortBy}
            counts={counts}
          />
        </div>

        {/* Product Grid */}
        {loading ? (
          <div className="my-16 flex flex-col items-center justify-center gap-3">
            <div className="w-10 h-10 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <div className="text-xs text-slate-400 font-medium">Memuat etalase game...</div>
          </div>
        ) : (
          <ProductGrid
            products={filteredProducts}
            onCheckout={(product) => setCheckoutProduct(product)}
            onResetSearch={() => {
              setSearchQuery('');
              setActiveCategory('all');
            }}
          />
        )}

      </main>

      {/* Floating Action: Quick WhatsApp Admin Help */}
      <div className="fixed bottom-6 left-6 z-40 hidden sm:block">
        <a
          href={storeService.generateWhatsAppLink(
            storeSettings?.admin_whatsapp,
            "Halo Admin Zhafranstore.id, saya ingin bertanya seputar produk game/gamepass."
          )}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-2 px-3.5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs shadow-xl shadow-emerald-500/30 transition hover:scale-105"
        >
          <MessageCircle className="w-4 h-4" />
          <span>Chat Admin WA</span>
        </a>
      </div>

      {/* Floating Scroll to Top */}
      <button
        onClick={scrollToTop}
        className="fixed bottom-6 right-6 z-30 p-3 rounded-full bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 text-cyan-400 shadow-xl backdrop-blur-md transition hover:scale-110"
        title="Kembali ke atas"
      >
        <ArrowUp className="w-4 h-4" />
      </button>

      {/* Footer */}
      <footer className="mt-auto border-t border-white/10 bg-[#05070B] text-slate-400 text-xs py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
                <Gamepad2 className="w-4 h-4" />
              </div>
              <span className="font-heading font-black text-white text-base">
                {storeSettings?.store_name || "Zhafranstore.id"}
              </span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed max-w-sm">
              Platform toko digital mandiri penyedia produk lisensi game dan item gamepass terlengkap, tercepat, dan bergaransi resmi.
            </p>
            <div className="text-[11px] text-slate-500">
              © {new Date().getFullYear()} Zhafranstore.id. All rights reserved.
            </div>
          </div>

          <div>
            <div className="font-heading font-bold text-white text-sm mb-3">Metode Pembayaran</div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• QRIS Instan (BCA, Mandiri, BRI, BNI)</li>
              <li>• E-Wallet (GoPay, OVO, DANA, ShopeePay)</li>
              <li>• Shopee (Toko Resmi Zhafranstore)</li>
              <li>• Tokopedia & TikTok Shop</li>
            </ul>
          </div>

          <div>
            <div className="font-heading font-bold text-white text-sm mb-3">Keamanan & Bantuan</div>
            <ul className="space-y-1.5 text-xs text-slate-400">
              <li>• 100% Legal & Anti Rollback</li>
              <li>• Pengiriman Otomatis 1-5 Menit</li>
              <li>• WhatsApp: {storeSettings?.admin_whatsapp || "6282199887766"}</li>
              <li>
                <button 
                  onClick={() => setIsAdminOpen(true)} 
                  className="text-violet-400 hover:underline inline-flex items-center gap-1"
                >
                  Panel Pemilik Toko
                </button>
              </li>
            </ul>
          </div>

        </div>
      </footer>

      {/* Checkout Modal */}
      <CheckoutModal
        product={checkoutProduct}
        isOpen={!!checkoutProduct}
        onClose={() => setCheckoutProduct(null)}
        storeSettings={storeSettings}
        onOrderSuccess={(order) => {
          showToast(`Pesanan ${order.id} berhasil dibuat!`);
        }}
      />

      {/* Admin Panel Modal */}
      <AdminModal
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        products={products}
        onProductsUpdated={loadData}
        storeSettings={storeSettings}
        onSettingsUpdated={(newSettings) => setStoreSettings(newSettings)}
        showToast={showToast}
      />

      {/* Order Tracker Modal */}
      <OrderTrackerModal
        isOpen={isTrackerOpen}
        onClose={() => setIsTrackerOpen(false)}
        storeSettings={storeSettings}
      />

      {/* Challenge 1K Views & Hadiah Modal */}
      <ChallengeModal
        isOpen={isChallengeOpen}
        onClose={() => setIsChallengeOpen(false)}
        storeSettings={storeSettings}
        showToast={showToast}
      />

      {/* Toast Notification */}
      <Toast
        message={toastMessage}
        onClose={() => setToastMessage('')}
      />

    </div>
  );
}
