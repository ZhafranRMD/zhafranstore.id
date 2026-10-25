import React, { useState, useEffect } from 'react';
import { 
  X, 
  Lock, 
  Unlock, 
  Package, 
  Settings, 
  ListOrdered, 
  Plus, 
  Edit2, 
  Trash2, 
  Upload, 
  Save, 
  Eye, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  RotateCcw,
  MessageCircle,
  Shield,
  Smartphone,
  Trophy,
  ShoppingCart,
  Send,
  Check,
  CheckCheck,
  Tag,
  Gift,
  MessageSquare,
  Layers,
  Copy,
  User,
  Crown
} from 'lucide-react';
import { storeService } from '../services/storeService.js';
import { validAdminCodes, promoCodes, getAuthRole } from '../data/promoCodes.js';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  products, 
  onProductsUpdated, 
  categories = [],
  onCategoriesUpdated,
  storeSettings, 
  onSettingsUpdated,
  onOpenOrderChat,
  showToast 
}) {
  if (!isOpen) return null;

  // Authentication & Role state ('admin_kepemilikan' | 'owner_thebest')
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('zhafran_admin_auth') === 'true';
  });
  const [userRole, setUserRole] = useState(() => {
    return sessionStorage.getItem('zhafran_admin_role') || 'admin_kepemilikan';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Tab
  // For owner_thebest: 'orders' | 'owner_account'
  // For admin_kepemilikan: 'orders' | 'categories' | 'products' | 'promos' | 'admin_buy' | 'qris' | 'events'
  const [activeTab, setActiveTab] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [viewingProof, setViewingProof] = useState(null);

  // Category Management State (Buat Kategori Sendiri & Bisa Dihapus)
  const [newCatName, setNewCatName] = useState('');
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  // Owner Account & Orders State
  const [ownerAccount, setOwnerAccount] = useState(() => storeService.getOwnerAccount());
  const [ownerBuyProduct, setOwnerBuyProduct] = useState(products[0]?.id || '');
  const [isOwnerSubmitting, setIsOwnerSubmitting] = useState(false);
  const [copiedPromo, setCopiedPromo] = useState('');

  // Events & Challenges State
  const [events, setEvents] = useState([]);
  const [challenges, setChallenges] = useState([]);
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    platform: 'Semua Platform (TikTok / YouTube / Instagram)',
    min_views: 1000,
    reward_type: 'discount',
    reward_value: 'Diskon 10% - 25%',
    free_product_id: '',
    description: '',
    is_active: true
  });

  // Admin Quick Buy State
  const [manualOrder, setManualOrder] = useState({
    product_id: products[0]?.id || '',
    game_username: '',
    buyer_whatsapp: storeSettings?.admin_whatsapp || '',
    buyer_email: '',
    notes: 'Pesanan dibuat oleh Admin',
    status: 'selesai',
    is_free_product: false
  });

  // Product Editing / Creation State (Marketplace Links Removed)
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: categories[0]?.id || 'gamepass',
    game_title: '',
    price: '',
    image_url: '',
    description: '',
    is_active: true,
    popular: false
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    store_name: storeSettings?.store_name || 'Zhafranstore.id',
    store_tagline: storeSettings?.store_tagline || 'Pusat Game & Item Gamepass Instan Terpercaya #1',
    admin_whatsapp: storeSettings?.admin_whatsapp || '082542778554',
    qris_image_url: storeSettings?.qris_image_url || './qris-zhafranstore.jpg',
    payment_instructions: storeSettings?.payment_instructions || ''
  });
  const [qrisPreview, setQrisPreview] = useState(storeSettings?.qris_image_url || './qris-zhafranstore.jpg');

  // Load data on open / auth change
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
      loadEvents();
      loadChallenges();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    const list = await storeService.getOrders(100);
    setOrders(list);
  };

  const loadEvents = async () => {
    const list = await storeService.getEvents();
    setEvents(list);
  };

  const loadChallenges = async () => {
    const list = await storeService.getChallenges(100);
    setChallenges(list);
  };

  // Handle Login & Role Detection
  const handleLogin = (e) => {
    e.preventDefault();
    const role = getAuthRole(pinInput);

    if (role) {
      setIsAuthenticated(true);
      setUserRole(role);
      sessionStorage.setItem('zhafran_admin_auth', 'true');
      sessionStorage.setItem('zhafran_admin_role', role);
      setPinError('');
      loadOrders();
      loadEvents();
      loadChallenges();
      setActiveTab('orders');
    } else {
      setPinError('Kode akses tidak valid. Gunakan kode Kepemilikan atau kode Owner (ownerthebest).');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setUserRole('');
    sessionStorage.removeItem('zhafran_admin_auth');
    sessionStorage.removeItem('zhafran_admin_role');
  };

  // ORDER MANAGEMENT & CHECKLIST
  const handleUpdateStatus = async (orderId, newStatus) => {
    await storeService.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (showToast) showToast(`Status pesanan ${orderId} diubah ke ${newStatus.toUpperCase()}`);
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm(`Yakin ingin menghapus pesanan ${orderId}? Data yang dihapus tidak dapat dipulihkan.`)) {
      await storeService.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      if (showToast) showToast(`Pesanan ${orderId} berhasil dihapus!`);
    }
  };

  const handleChatBuyer = (order) => {
    const cleanPhone = (order.buyer_whatsapp || '').replace(/[^0-9]/g, '');
    const msg = `Halo kak ${order.game_username}, admin Zhafranstore.id ingin konfirmasi pesanan ${order.id} (${order.product_name}). Apakah ada yang bisa kami bantu?`;
    window.open(`https://wa.me/${cleanPhone.startsWith('0') ? '62' + cleanPhone.slice(1) : cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  // CATEGORY MANAGEMENT (Bisa buat kategori sendiri & bisa dihapus)
  const handleAddCategory = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    setIsCreatingCategory(true);
    try {
      const added = await storeService.saveCategory(newCatName);
      if (added) {
        const updated = await storeService.getCategories();
        if (onCategoriesUpdated) onCategoriesUpdated(updated);
        setNewCatName('');
        if (showToast) showToast(`Kategori "${added.name}" berhasil dibuat!`);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const handleDeleteCategory = async (catId, catName) => {
    if (window.confirm(`Yakin ingin menghapus kategori "${catName}"?`)) {
      await storeService.deleteCategory(catId);
      const updated = await storeService.getCategories();
      if (onCategoriesUpdated) onCategoriesUpdated(updated);
      if (showToast) showToast(`Kategori "${catName}" berhasil dihapus!`);
    }
  };

  // OWNER ACCOUNT & QUICK BUY
  const handleSaveOwnerAccount = (e) => {
    e.preventDefault();
    storeService.saveOwnerAccount(ownerAccount);
    if (showToast) showToast("Profil Akun Owner berhasil disimpan!");
  };

  const handleOwnerPurchase = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === ownerBuyProduct);
    if (!prod) return;
    if (!ownerAccount.username) {
      alert("Harap masukkan Username Akun Game Anda terlebih dahulu!");
      return;
    }

    setIsOwnerSubmitting(true);
    try {
      const orderPayload = {
        product_id: prod.id,
        product_name: prod.name,
        category: prod.category,
        raw_price: prod.price,
        admin_fee: 0,
        discount_amount: 0,
        price: prod.price,
        game_username: ownerAccount.server_id ? `${ownerAccount.username} (${ownerAccount.server_id})` : ownerAccount.username,
        buyer_whatsapp: ownerAccount.whatsapp || "082542778554",
        buyer_email: ownerAccount.email || null,
        notes: "Pesanan Pembelian oleh Owner (ownerthebest)",
        order_mode: "owner_purchase",
        payment_method: "qris",
        payment_proof_url: null,
        created_at: new Date().toISOString()
      };

      const newOrder = await storeService.createOrder(orderPayload);
      await loadOrders();
      if (showToast) showToast(`Pesanan ${newOrder.id} (${prod.name}) berhasil dibuat untuk Akun Owner!`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsOwnerSubmitting(false);
    }
  };

  // PRODUCT MANAGEMENT
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: categories[0]?.id || 'gamepass',
      game_title: '',
      price: '',
      image_url: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800',
      description: '',
      is_active: true,
      popular: false
    });
    setIsCreatingProduct(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      category: prod.category || categories[0]?.id || 'gamepass',
      game_title: prod.game_title || '',
      price: prod.price || '',
      image_url: prod.image_url || '',
      description: prod.description || '',
      is_active: prod.is_active !== undefined ? prod.is_active : true,
      popular: prod.popular || false
    });
    setIsCreatingProduct(true);
  };

  const handleProductImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProductForm(prev => ({ ...prev, image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveProduct = async (e) => {
    e.preventDefault();
    if (!productForm.name || !productForm.price) {
      alert("Nama produk dan harga wajib diisi!");
      return;
    }

    const payload = {
      ...productForm,
      id: editingProduct ? editingProduct.id : undefined,
      price: Number(productForm.price)
    };

    const saved = await storeService.saveProduct(payload);
    await onProductsUpdated();
    setIsCreatingProduct(false);
    setEditingProduct(null);
    if (showToast) showToast(`Produk "${saved.name}" berhasil disimpan!`);
  };

  const handleDeleteProduct = async (prodId, prodName) => {
    if (window.confirm(`Yakin ingin menghapus produk "${prodName}"?`)) {
      await storeService.deleteProduct(prodId);
      await onProductsUpdated();
      if (showToast) showToast(`Produk "${prodName}" berhasil dihapus.`);
    }
  };

  // QRIS & SETTINGS
  const handleQrisFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setQrisPreview(reader.result);
        setSettingsForm(prev => ({ ...prev, qris_image_url: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    const updated = await storeService.saveStoreSettings(settingsForm);
    await onSettingsUpdated(updated);
    if (showToast) showToast("Pengaturan QRIS & Toko berhasil diperbarui!");
  };

  const handleResetDefaultQRIS = () => {
    const defaultQris = "./qris-zhafranstore.jpg";
    setQrisPreview(defaultQris);
    setSettingsForm(prev => ({ ...prev, qris_image_url: defaultQris }));
  };

  // ADMIN QUICK BUY
  const handleAdminManualOrder = async (e) => {
    e.preventDefault();
    const prod = products.find(p => p.id === manualOrder.product_id);
    if (!prod) return;

    const orderPayload = {
      product_id: prod.id,
      product_name: prod.name,
      category: prod.category,
      raw_price: manualOrder.is_free_product ? 0 : prod.price,
      admin_fee: 0,
      discount_amount: manualOrder.is_free_product ? prod.price : 0,
      price: manualOrder.is_free_product ? 0 : prod.price,
      game_username: manualOrder.game_username || "Admin Quick Buy",
      buyer_whatsapp: manualOrder.buyer_whatsapp || storeSettings?.admin_whatsapp,
      buyer_email: manualOrder.buyer_email || null,
      notes: manualOrder.notes,
      order_mode: "admin_manual",
      payment_method: "admin_qris",
      status: manualOrder.status || "selesai",
      is_free_product: manualOrder.is_free_product,
      created_at: new Date().toISOString()
    };

    const newOrd = await storeService.createOrder(orderPayload);
    await loadOrders();
    if (showToast) showToast(`Pesanan manual ${newOrd.id} (${prod.name}) berhasil dibuat!`);
    setManualOrder(prev => ({ ...prev, game_username: '', notes: 'Pesanan dibuat oleh Admin' }));
  };

  // Filtered orders
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  // Owner orders
  const ownerOrders = orders.filter(o => {
    if (!ownerAccount.username && !ownerAccount.whatsapp) return o.order_mode === 'owner_purchase';
    return (
      o.order_mode === 'owner_purchase' ||
      (ownerAccount.username && o.game_username?.toLowerCase().includes(ownerAccount.username.toLowerCase())) ||
      (ownerAccount.whatsapp && o.buyer_whatsapp === ownerAccount.whatsapp)
    );
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-lg !max-w-4xl h-[92vh] flex flex-col">
        
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${
              userRole === 'owner_thebest'
                ? 'bg-purple-950/60 border-purple-500/50 text-purple-400'
                : 'bg-cyan-950/60 border-cyan-500/50 text-cyan-400'
            }`}>
              {userRole === 'owner_thebest' ? <Crown className="w-5 h-5 text-amber-400" /> : <Shield className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-white text-base">
                  {userRole === 'owner_thebest' ? 'Panel Khusus Owner' : 'Dashboard Pemilik Toko'}
                </h3>
                {isAuthenticated && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                    userRole === 'owner_thebest'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                      : 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  }`}>
                    {userRole === 'owner_thebest' ? '👑 OWNER (ownerthebest)' : '⚡ KEPEMILIKAN'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-400">
                {userRole === 'owner_thebest' 
                  ? 'Akses Khusus Owner: Pantau Barang Masuk, Checklist Selesai, dan Pembelian Akun Anda'
                  : 'Kelola Pesanan Masuk, Kategori Kustom, Katalog Produk, dan Pengaturan Toko'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20 font-bold"
              >
                Logout
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Content */}
        {!isAuthenticated ? (
          /* LOGIN FORM */
          <div className="modal-body max-w-sm mx-auto my-auto text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto shadow-lg shadow-cyan-500/10">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-heading font-black text-lg text-white">Verifikasi Akses Toko</h4>
              <p className="text-xs text-slate-400 mt-1">
                Masukkan Kode Kepemilikan Toko atau Kode Owner (<code className="text-cyan-400 font-mono">ownerthebest</code>)
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Masukkan Kode Akses..."
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="form-input text-center text-sm tracking-wider font-mono"
                autoFocus
              />
              {pinError && (
                <div className="text-xs text-rose-400 font-medium">{pinError}</div>
              )}
              <button type="submit" className="w-full btn-primary text-sm py-2.5 font-bold shadow-lg shadow-cyan-500/25">
                Buka Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <>
            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-950/40 scrollbar-none">
              
              {/* Tab 1: Pesanan / Barang Masuk (Akses: Owner & Admin) */}
              <button
                onClick={() => { setActiveTab('orders'); setIsCreatingProduct(false); }}
                className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                  activeTab === 'orders'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>{userRole === 'owner_thebest' ? 'Barang Masuk (Pesanan)' : 'Pesanan Masuk'}</span>
                <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                  {orders.length}
                </span>
              </button>

              {/* Tab Khusus Owner: Akun Saya & Beli Produk (Hanya Muncul untuk owner_thebest) */}
              {userRole === 'owner_thebest' && (
                <button
                  onClick={() => setActiveTab('owner_account')}
                  className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                    activeTab === 'owner_account'
                      ? 'border-purple-400 text-purple-400 bg-purple-500/10'
                      : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <User className="w-4 h-4 text-purple-400" />
                  <span>Akun Saya & Beli Produk</span>
                  <span className="px-1.5 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-[10px]">
                    {ownerOrders.length}
                  </span>
                </button>
              )}

              {/* Tab-Tab Khusus Admin Kepemilikan (Owner Tidak Bisa Melihat) */}
              {userRole === 'admin_kepemilikan' && (
                <>
                  {/* Tab Kelola Kategori (Bisa buat kategori sendiri & bisa dihapus) */}
                  <button
                    onClick={() => { setActiveTab('categories'); setIsCreatingProduct(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                      activeTab === 'categories'
                        ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-4 h-4 text-emerald-400" />
                    <span>Kelola Kategori</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px]">
                      {categories.length}
                    </span>
                  </button>

                  {/* Tab Kelola Produk */}
                  <button
                    onClick={() => { setActiveTab('products'); setIsCreatingProduct(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                      activeTab === 'products'
                        ? 'border-violet-400 text-violet-400 bg-violet-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Kelola Produk</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px]">
                      {products.length}
                    </span>
                  </button>

                  {/* Tab Kode Promo (Hanya Admin Kepemilikan, Owner Tidak Bisa Lihat) */}
                  <button
                    onClick={() => { setActiveTab('promos'); setIsCreatingProduct(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                      activeTab === 'promos'
                        ? 'border-amber-400 text-amber-400 bg-amber-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Tag className="w-4 h-4 text-amber-400" />
                    <span>Kode Promo Diskon</span>
                    <span className="px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px]">
                      {Object.keys(promoCodes).length}
                    </span>
                  </button>

                  {/* Tab Beli / Pesanan Manual */}
                  <button
                    onClick={() => { setActiveTab('admin_buy'); setIsCreatingProduct(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                      activeTab === 'admin_buy'
                        ? 'border-sky-400 text-sky-400 bg-sky-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <ShoppingCart className="w-4 h-4 text-sky-400" />
                    <span>Beli / Pesanan Manual</span>
                  </button>

                  {/* Tab Pengaturan QRIS */}
                  <button
                    onClick={() => { setActiveTab('qris'); setIsCreatingProduct(false); }}
                    className={`flex items-center gap-2 px-3.5 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition whitespace-nowrap ${
                      activeTab === 'qris'
                        ? 'border-teal-400 text-teal-400 bg-teal-500/10'
                        : 'border-transparent text-slate-400 hover:text-white'
                    }`}
                  >
                    <Settings className="w-4 h-4" />
                    <span>Pengaturan QRIS & Toko</span>
                  </button>
                </>
              )}
            </div>

            {/* Tab Body */}
            <div className="modal-body flex-1 overflow-y-auto">
              
              {/* TAB 1: PESANAN MASUK / BARANG MASUK (DENGAN TOMBOL CHECKLIST RESMI) */}
              {activeTab === 'orders' && (
                <div className="space-y-4">
                  
                  {/* Order Filter Bar */}
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                      {['all', 'pending', 'diproses', 'selesai', 'cancelled'].map(status => (
                        <button
                          key={status}
                          onClick={() => setOrderFilter(status)}
                          className={`px-3 py-1.5 rounded-lg font-semibold uppercase tracking-wider text-[10px] ${
                            orderFilter === status
                              ? 'bg-cyan-500 text-slate-950 font-bold'
                              : 'bg-slate-900 text-slate-400 hover:text-white'
                          }`}
                        >
                          {status}
                        </button>
                      ))}
                    </div>

                    <button
                      onClick={loadOrders}
                      className="btn-secondary text-[11px] py-1.5 px-3 flex items-center gap-1"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Refresh</span>
                    </button>
                  </div>

                  {/* Orders Table */}
                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-12 text-slate-500 text-xs">
                      Belum ada pesanan dengan status "{orderFilter}".
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map(order => (
                        <div 
                          key={order.id}
                          className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 transition ${
                            order.status === 'selesai'
                              ? 'bg-slate-900/60 border-emerald-500/30'
                              : 'bg-slate-900/90 border-white/10 hover:border-cyan-400/30'
                          }`}
                        >
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="font-mono font-bold text-xs text-cyan-400">{order.id}</span>
                              <span className={`badge text-[9px] ${
                                order.status === 'selesai' ? 'badge-emerald' :
                                order.status === 'diproses' ? 'badge-cyan' :
                                order.status === 'cancelled' ? 'badge-rose' :
                                'badge-amber'
                              }`}>
                                {order.status}
                              </span>
                              {order.order_mode === 'owner_purchase' && (
                                <span className="badge badge-purple text-[8px] font-bold">AKUN OWNER</span>
                              )}
                              <span className="text-[10px] text-slate-500">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  hour: '2-digit', minute: '2-digit'
                                }) : ''}
                              </span>
                            </div>

                            <div className="font-heading font-black text-white text-sm">
                              {order.product_name}
                            </div>

                            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Akun: <strong className="text-white">{order.game_username}</strong></span>
                              <span>WA: <strong className="text-white">{order.buyer_whatsapp}</strong></span>
                              {order.buyer_email && <span>Email: <strong className="text-cyan-300">{order.buyer_email}</strong></span>}
                              <span>Total: <strong className="text-emerald-400">{storeService.formatRupiah(order.price)}</strong></span>
                            </div>
                            {order.notes && (
                              <div className="text-[11px] text-slate-400 italic">
                                Catatan: "{order.notes}"
                              </div>
                            )}
                          </div>

                          {/* ACTION BUTTONS */}
                          <div className="flex items-center gap-2 flex-wrap self-end sm:self-center">
                            
                            {/* TOMBOL CHECKLIST (BISA DIAKSES OLEH OWNER & ADMIN) */}
                            <button
                              type="button"
                              onClick={() => handleUpdateStatus(order.id, order.status === 'selesai' ? 'diproses' : 'selesai')}
                              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 text-xs font-bold transition shadow-md ${
                                order.status === 'selesai'
                                  ? 'bg-emerald-500 text-slate-950 ring-2 ring-emerald-400'
                                  : 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 hover:bg-emerald-500 hover:text-slate-950'
                              }`}
                              title={order.status === 'selesai' ? 'Pesanan sudah dichecklist (Selesai). Klik untuk ubah ke proses' : 'Klik untuk Checklist (Tandai Selesai)'}
                            >
                              <CheckCircle className="w-4 h-4" />
                              <span>{order.status === 'selesai' ? 'Selesai ✓' : 'Checklist'}</span>
                            </button>

                            {/* Bukti Bayar */}
                            {order.payment_proof_url && (
                              <button
                                onClick={() => setViewingProof(order.payment_proof_url)}
                                className="btn-secondary text-xs py-1.5 px-2.5 flex items-center gap-1"
                                title="Lihat Bukti Transfer"
                              >
                                <Eye className="w-3.5 h-3.5 text-cyan-400" />
                                <span>Bukti</span>
                              </button>
                            )}

                            {/* Chat WA */}
                            <button
                              onClick={() => handleChatBuyer(order)}
                              className="btn-whatsapp text-xs py-1.5 px-2.5 flex items-center gap-1 rounded-lg"
                              title="Chat Pembeli via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span className="hidden sm:inline">WA</span>
                            </button>

                            {/* Kontrol Khusus Admin Kepemilikan (Ubah Status Dropdown & Hapus) */}
                            {userRole === 'admin_kepemilikan' && (
                              <>
                                <select
                                  value={order.status}
                                  onChange={(e) => handleUpdateStatus(order.id, e.target.value)}
                                  aria-label={`Ubah status pesanan ${order.id}`}
                                  className="bg-slate-950 border border-white/20 text-xs text-slate-200 rounded-lg px-2 py-1.5"
                                >
                                  <option value="pending">Pending</option>
                                  <option value="diproses">Diproses</option>
                                  <option value="selesai">Selesai</option>
                                  <option value="cancelled">Dibatalkan</option>
                                </select>

                                <button
                                  onClick={() => handleDeleteOrder(order.id)}
                                  className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                                  title="Hapus Pesanan ini"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Proof Modal Viewer */}
                  {viewingProof && (
                    <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4">
                      <div className="relative max-w-lg w-full bg-slate-900 rounded-2xl overflow-hidden p-4 border border-white/20">
                        <div className="flex justify-between items-center mb-3">
                          <h4 className="font-heading font-bold text-white text-sm">Bukti Pembayaran QRIS</h4>
                          <button 
                            onClick={() => setViewingProof(null)}
                            className="text-slate-400 hover:text-white"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </div>
                        <img src={viewingProof} alt="Bukti Transfer" className="w-full max-h-[70vh] object-contain rounded-lg" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB KHUSUS OWNER: AKUN SAYA & BELI PRODUK */}
              {userRole === 'owner_thebest' && activeTab === 'owner_account' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Form Profil Akun Owner */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-purple-500/30 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <Crown className="w-5 h-5 text-amber-400" />
                      <h4 className="font-heading font-bold text-white text-sm sm:text-base">
                        Profil Akun Game Owner (Tersimpan Otomatis)
                      </h4>
                    </div>
                    
                    <form onSubmit={handleSaveOwnerAccount} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Username Akun Game (ID) *</label>
                          <input
                            type="text"
                            placeholder="Contoh: OwnerTheBest_Pro / 12345678"
                            value={ownerAccount.username}
                            onChange={(e) => setOwnerAccount({ ...ownerAccount, username: e.target.value })}
                            className="form-input text-xs"
                            required
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Zone ID / Server Game (Opsional)</label>
                          <input
                            type="text"
                            placeholder="Contoh: 2026 / Asia Server"
                            value={ownerAccount.server_id}
                            onChange={(e) => setOwnerAccount({ ...ownerAccount, server_id: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Nomor WhatsApp Owner</label>
                          <input
                            type="tel"
                            placeholder="081234567890"
                            value={ownerAccount.whatsapp}
                            onChange={(e) => setOwnerAccount({ ...ownerAccount, whatsapp: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Email Owner (Opsional)</label>
                          <input
                            type="email"
                            placeholder="owner@gmail.com"
                            value={ownerAccount.email}
                            onChange={(e) => setOwnerAccount({ ...ownerAccount, email: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-secondary text-xs py-2 px-4 flex items-center gap-1.5">
                        <Save className="w-3.5 h-3.5 text-purple-400" />
                        <span>Simpan Profil Akun Owner</span>
                      </button>
                    </form>
                  </div>

                  {/* Form Beli Produk untuk Akun Owner */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-cyan-500/30 space-y-4">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <ShoppingCart className="w-5 h-5 text-cyan-400" />
                      <h4 className="font-heading font-bold text-white text-sm sm:text-base">
                        Beli Produk Langsung ke Akun Owner
                      </h4>
                    </div>

                    <form onSubmit={handleOwnerPurchase} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Pilih Produk Yang Ingin Dibeli *</label>
                          <select
                            value={ownerBuyProduct}
                            onChange={(e) => setOwnerBuyProduct(e.target.value)}
                            className="form-select text-xs"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} — {storeService.formatRupiah(p.price)}
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Akun Penerima (Sesuai Profil)</label>
                          <input
                            type="text"
                            readOnly
                            value={ownerAccount.username ? `${ownerAccount.username} ${ownerAccount.server_id ? '(' + ownerAccount.server_id + ')' : ''}` : '(Isi profil akun di atas terlebih dahulu)'}
                            className="form-input text-xs bg-slate-950/80 text-cyan-300 font-bold"
                          />
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isOwnerSubmitting}
                        className="btn-primary text-xs py-2.5 px-5 flex items-center gap-1.5 font-bold shadow-lg shadow-cyan-500/20"
                      >
                        <ShoppingCart className="w-4 h-4 text-slate-950" />
                        <span>Beli Sekarang Untuk Akun Owner</span>
                      </button>
                    </form>
                  </div>

                  {/* Riwayat Pesanan Akun Owner */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-bold text-white text-sm flex items-center gap-2">
                      <span>Daftar Pesanan Akun Owner</span>
                      <span className="px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 text-xs">
                        {ownerOrders.length}
                      </span>
                    </h4>

                    {ownerOrders.length === 0 ? (
                      <div className="p-8 rounded-xl bg-slate-900/40 border border-white/5 text-center text-slate-500 text-xs">
                        Belum ada riwayat pesanan yang dibuat untuk akun Owner ini.
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {ownerOrders.map(order => (
                          <div key={order.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between text-xs">
                            <div>
                              <div className="font-bold text-white">{order.product_name}</div>
                              <div className="text-[11px] text-slate-400 mt-0.5">
                                Invoice: <span className="font-mono text-cyan-400">{order.id}</span> | Akun: <span className="text-white">{order.game_username}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`badge text-[9px] ${order.status === 'selesai' ? 'badge-emerald' : 'badge-amber'}`}>
                                {order.status}
                              </span>
                              <div className="font-bold text-emerald-400 mt-1">
                                {storeService.formatRupiah(order.price)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              )}

              {/* TAB KELOLA KATEGORI (BISA BUAT SENDIRI & BISA DIHAPUS) */}
              {userRole === 'admin_kepemilikan' && activeTab === 'categories' && (
                <div className="space-y-6 animate-fadeIn">
                  
                  {/* Form Buat Kategori Baru */}
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-emerald-500/30 space-y-3">
                    <div className="flex items-center gap-2 pb-2 border-b border-white/10">
                      <Layers className="w-5 h-5 text-emerald-400" />
                      <h4 className="font-heading font-bold text-white text-sm sm:text-base">
                        Buat Kategori Kustom Baru
                      </h4>
                    </div>

                    <form onSubmit={handleAddCategory} className="flex flex-col sm:flex-row gap-2.5">
                      <input
                        type="text"
                        placeholder="Contoh: Diamond Mobile Legends, Robux Roblox, Akun Game..."
                        value={newCatName}
                        onChange={(e) => setNewCatName(e.target.value)}
                        className="form-input text-xs flex-1"
                        required
                      />
                      <button
                        type="submit"
                        disabled={isCreatingCategory}
                        className="btn-primary text-xs py-2.5 px-5 font-bold flex items-center justify-center gap-1.5 whitespace-nowrap"
                      >
                        <Plus className="w-4 h-4 text-slate-950" />
                        <span>+ Buat Kategori</span>
                      </button>
                    </form>
                    <p className="text-[11px] text-slate-400">
                      Kategori yang dibuat akan langsung muncul di bar filter etalase toko dan opsi kategori saat menambah produk.
                    </p>
                  </div>

                  {/* Daftar Kategori Aktif (Bisa Dihapus) */}
                  <div className="space-y-3">
                    <h4 className="font-heading font-bold text-white text-sm flex items-center justify-between">
                      <span>Daftar Kategori Aktif</span>
                      <span className="text-xs text-slate-400 font-normal">Total: {categories.length} Kategori</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {categories.map((cat) => {
                        const productCount = products.filter(p => p.category === cat.id).length;
                        const isProtected = false; // Semua bisa dihapus sesuai instruksi

                        return (
                          <div 
                            key={cat.id}
                            className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 hover:border-emerald-500/30 transition"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-9 h-9 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold">
                                <Tag className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-heading font-bold text-white text-sm">
                                  {cat.name}
                                </div>
                                <div className="text-[11px] text-slate-400">
                                  ID: <code className="text-cyan-400 font-mono">{cat.id}</code> | {productCount} Produk
                                </div>
                              </div>
                            </div>

                            <button
                              type="button"
                              onClick={() => handleDeleteCategory(cat.id, cat.name)}
                              className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 transition"
                              title={`Hapus Kategori ${cat.name}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                </div>
              )}

              {/* TAB KELOLA PRODUK (MARKETPLACE LINKS TELAH DIHAPUS) */}
              {userRole === 'admin_kepemilikan' && activeTab === 'products' && (
                <div className="space-y-4 animate-fadeIn">
                  {!isCreatingProduct ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          Total <strong>{products.length}</strong> produk di etalase toko
                        </div>
                        <button
                          onClick={handleOpenCreateProduct}
                          className="btn-primary text-xs py-2 px-3.5 flex items-center gap-1.5 font-bold"
                        >
                          <Plus className="w-4 h-4 text-slate-950" />
                          <span>Tambah Produk Baru</span>
                        </button>
                      </div>

                      <div className="space-y-2.5">
                        {products.map(prod => (
                          <div
                            key={prod.id}
                            className="p-3.5 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 hover:border-white/20 transition"
                          >
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.image_url || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800"}
                                alt={prod.name}
                                className="w-12 h-12 object-cover rounded-lg bg-slate-950 border border-white/10"
                              />
                              <div>
                                <div className="font-heading font-bold text-white text-sm line-clamp-1">
                                  {prod.name}
                                </div>
                                <div className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
                                  <span className="text-cyan-400 font-bold">{storeService.formatRupiah(prod.price)}</span>
                                  <span>•</span>
                                  <span className="capitalize text-slate-400">{prod.category}</span>
                                  {prod.popular && <span className="badge badge-amber text-[8px]">HOT</span>}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-2 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400"
                                title="Edit Produk"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400"
                                title="Hapus Produk"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    /* PRODUCT FORM TANPA MARKETPLACE LINKS */
                    <form onSubmit={handleSaveProduct} className="space-y-4">
                      <div className="flex items-center justify-between pb-2 border-b border-white/10">
                        <h4 className="font-heading font-bold text-white text-base">
                          {editingProduct ? 'Edit Produk' : 'Tambah Produk Baru'}
                        </h4>
                        <button
                          type="button"
                          onClick={() => setIsCreatingProduct(false)}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Batal
                        </button>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Nama Produk *</label>
                          <input
                            type="text"
                            placeholder="Contoh: Roblox 2x Mastery / MLBB 1000 DM"
                            value={productForm.name}
                            onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                            className="form-input text-xs"
                            required
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Pilih Kategori *</label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className="form-select text-xs"
                          >
                            {categories.map(cat => (
                              <option key={cat.id} value={cat.id}>
                                🏷️ {cat.name}
                              </option>
                            ))}
                          </select>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Harga (Rupiah) *</label>
                          <input
                            type="number"
                            placeholder="Contoh: 45000"
                            value={productForm.price}
                            onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                            className="form-input text-xs"
                            required
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Nama Judul Game</label>
                          <input
                            type="text"
                            placeholder="Contoh: Roblox / Mobile Legends / Steam"
                            value={productForm.game_title}
                            onChange={(e) => setProductForm({ ...productForm, game_title: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="form-group !mb-0">
                        <label className="form-label">Gambar Produk (URL atau Upload Langsung)</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            placeholder="https://..."
                            value={productForm.image_url}
                            onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                            className="form-input text-xs flex-1"
                          />
                          <label className="btn-secondary text-xs flex items-center gap-1 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Upload</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleProductImageUpload}
                              className="hidden"
                            />
                          </label>
                        </div>
                        {productForm.image_url && (
                          <div className="mt-2">
                            <img src={productForm.image_url} alt="Preview" className="w-20 h-20 object-cover rounded-lg border border-white/10" />
                          </div>
                        )}
                      </div>

                      <div className="form-group !mb-0">
                        <label className="form-label">Deskripsi / Format Pengiriman</label>
                        <textarea
                          rows={2}
                          placeholder="Instruksi pengiriman akun atau detail gamepass..."
                          value={productForm.description}
                          onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                          className="form-textarea text-xs"
                        />
                      </div>

                      <div className="flex items-center gap-4 pt-1">
                        <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                          <input
                            type="checkbox"
                            checked={productForm.popular}
                            onChange={(e) => setProductForm({ ...productForm, popular: e.target.checked })}
                            className="w-4 h-4 rounded text-cyan-400"
                          />
                          <span>Tandai Produk Populer (HOT)</span>
                        </label>

                        <label className="flex items-center gap-2 cursor-pointer text-xs text-white">
                          <input
                            type="checkbox"
                            checked={productForm.is_active}
                            onChange={(e) => setProductForm({ ...productForm, is_active: e.target.checked })}
                            className="w-4 h-4 rounded text-cyan-400"
                          />
                          <span>Produk Aktif Dijual</span>
                        </label>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
                        <button
                          type="button"
                          onClick={() => setIsCreatingProduct(false)}
                          className="btn-secondary text-xs py-2 px-4"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5 font-bold"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Produk</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {/* TAB KODE PROMO (HANYA UNTUK ADMIN KEPEMILIKAN, OWNER TIDAK BISA MELIHAT) */}
              {userRole === 'admin_kepemilikan' && activeTab === 'promos' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs text-amber-300">
                    💡 <strong>Hak Akses Khusus Admin Kepemilikan:</strong> Daftar kode promo diskon aktif berikut dapat dibagikan kepada pelanggan untuk mendapatkan potongan harga saat checkout QRIS.
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {Object.values(promoCodes).map((promo) => (
                      <div
                        key={promo.code}
                        className="p-4 rounded-xl bg-slate-900/80 border border-white/10 flex items-center justify-between gap-3 hover:border-amber-400/40 transition"
                      >
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-black text-sm text-cyan-400 uppercase tracking-wider">{promo.code}</span>
                            <span className="badge badge-amber text-[10px] font-bold">Diskon {promo.discountPercent}%</span>
                          </div>
                          <div className="text-xs text-slate-300 mt-1">
                            {promo.description}
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(promo.code);
                            setCopiedPromo(promo.code);
                            setTimeout(() => setCopiedPromo(''), 2000);
                            if (showToast) showToast(`Kode "${promo.code}" disalin!`);
                          }}
                          className="btn-secondary text-xs py-1.5 px-3 flex items-center gap-1 whitespace-nowrap"
                        >
                          {copiedPromo === promo.code ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          <span>{copiedPromo === promo.code ? 'Tersalin' : 'Salin'}</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB BELI / PESANAN MANUAL (ADMIN KEPEMILIKAN) */}
              {userRole === 'admin_kepemilikan' && activeTab === 'admin_buy' && (
                <div className="space-y-4 animate-fadeIn">
                  <div className="p-5 rounded-2xl bg-slate-900/90 border border-sky-500/30 space-y-3">
                    <h4 className="font-heading font-bold text-white text-base">
                      Beli / Buat Pesanan Manual Instan
                    </h4>
                    
                    <form onSubmit={handleAdminManualOrder} className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">Pilih Produk</label>
                          <select
                            value={manualOrder.product_id}
                            onChange={(e) => setManualOrder({ ...manualOrder, product_id: e.target.value })}
                            className="form-select text-xs"
                          >
                            {products.map(p => (
                              <option key={p.id} value={p.id}>
                                {p.name} ({storeService.formatRupiah(p.price)})
                              </option>
                            ))}
                          </select>
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Username / Akun Tujuan</label>
                          <input
                            type="text"
                            placeholder="Contoh: Appank (Server 12)"
                            value={manualOrder.game_username}
                            onChange={(e) => setManualOrder({ ...manualOrder, game_username: e.target.value })}
                            className="form-input text-xs"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="form-group !mb-0">
                          <label className="form-label">No. WhatsApp</label>
                          <input
                            type="tel"
                            value={manualOrder.buyer_whatsapp}
                            onChange={(e) => setManualOrder({ ...manualOrder, buyer_whatsapp: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="form-label">Catatan Pesanan</label>
                          <input
                            type="text"
                            value={manualOrder.notes}
                            onChange={(e) => setManualOrder({ ...manualOrder, notes: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-primary text-xs py-2.5 px-5 font-bold shadow-lg shadow-cyan-500/20">
                        + Buat Pesanan Sekarang
                      </button>
                    </form>
                  </div>
                </div>
              )}

              {/* TAB PENGATURAN QRIS & TOKO */}
              {userRole === 'admin_kepemilikan' && activeTab === 'qris' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 animate-fadeIn">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="form-group !mb-0">
                      <label className="form-label">Nama Toko</label>
                      <input
                        type="text"
                        value={settingsForm.store_name}
                        onChange={(e) => setSettingsForm({ ...settingsForm, store_name: e.target.value })}
                        className="form-input text-xs"
                      />
                    </div>

                    <div className="form-group !mb-0">
                      <label className="form-label">No. WhatsApp Admin</label>
                      <input
                        type="tel"
                        value={settingsForm.admin_whatsapp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp: e.target.value })}
                        className="form-input text-xs"
                      />
                    </div>
                  </div>

                  <div className="form-group !mb-0">
                    <label className="form-label">Tagline Toko</label>
                    <input
                      type="text"
                      value={settingsForm.store_tagline}
                      onChange={(e) => setSettingsForm({ ...settingsForm, store_tagline: e.target.value })}
                      className="form-input text-xs"
                    />
                  </div>

                  <div className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-3">
                    <label className="form-label">Foto QRIS Resmi Toko</label>
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <img
                        src={qrisPreview}
                        alt="Preview QRIS"
                        className="w-32 h-32 object-contain bg-white p-2 rounded-xl border border-white/20 shadow-md"
                      />
                      <div className="space-y-2">
                        <label className="btn-secondary text-xs inline-flex items-center gap-1.5 cursor-pointer">
                          <Upload className="w-4 h-4 text-cyan-400" />
                          <span>Unggah Foto QRIS Baru</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleQrisFileUpload}
                            className="hidden"
                          />
                        </label>
                        <div>
                          <button
                            type="button"
                            onClick={handleResetDefaultQRIS}
                            className="text-xs text-slate-400 hover:text-white"
                          >
                            Reset ke QRIS Baku
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary text-xs py-2.5 px-5 font-bold flex items-center gap-1.5">
                    <Save className="w-4 h-4" />
                    <span>Simpan Pengaturan Toko</span>
                  </button>
                </form>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
