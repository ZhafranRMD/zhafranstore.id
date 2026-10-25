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
  ExternalLink,
  Shield,
  Smartphone
} from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function AdminModal({ 
  isOpen, 
  onClose, 
  products, 
  onProductsUpdated, 
  storeSettings, 
  onSettingsUpdated,
  showToast 
}) {
  if (!isOpen) return null;

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return sessionStorage.getItem('zhafran_admin_auth') === 'true';
  });
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  // Active Tab: 'products' | 'qris' | 'orders'
  const [activeTab, setActiveTab] = useState('orders');

  // Orders State
  const [orders, setOrders] = useState([]);
  const [orderFilter, setOrderFilter] = useState('all');
  const [viewingProof, setViewingProof] = useState(null);

  // Product Editing / Creation State
  const [editingProduct, setEditingProduct] = useState(null);
  const [isCreatingProduct, setIsCreatingProduct] = useState(false);
  const [productForm, setProductForm] = useState({
    name: '',
    category: 'gamepass',
    game_title: '',
    price: '',
    image_url: '',
    description: '',
    shopee_url: '',
    tiktok_url: '',
    tokopedia_url: '',
    other_marketplace_url: '',
    is_active: true,
    popular: false
  });

  // Settings State
  const [settingsForm, setSettingsForm] = useState({
    store_name: storeSettings?.store_name || 'Zhafranstore.id',
    store_tagline: storeSettings?.store_tagline || 'Pusat Game & Item Gamepass Instan Terpercaya #1',
    admin_whatsapp: storeSettings?.admin_whatsapp || '6282199887766',
    qris_image_url: storeSettings?.qris_image_url || '/qris-zhafranstore.jpg',
    payment_instructions: storeSettings?.payment_instructions || ''
  });
  const [qrisPreview, setQrisPreview] = useState(storeSettings?.qris_image_url || '/qris-zhafranstore.jpg');

  // Load orders on open
  useEffect(() => {
    if (isAuthenticated) {
      loadOrders();
    }
  }, [isAuthenticated]);

  const loadOrders = async () => {
    const list = await storeService.getOrders(100);
    setOrders(list);
  };

  // Handle PIN Login
  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === 'zhafran2026' || pinInput === 'admin123') {
      setIsAuthenticated(true);
      sessionStorage.setItem('zhafran_admin_auth', 'true');
      setPinError('');
      loadOrders();
    } else {
      setPinError('PIN salah! Silakan masukkan PIN admin yang benar (Default: zhafran2026).');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    sessionStorage.removeItem('zhafran_admin_auth');
  };

  // PRODUCT CRUD
  const handleOpenCreateProduct = () => {
    setEditingProduct(null);
    setProductForm({
      name: '',
      category: 'gamepass',
      game_title: '',
      price: '',
      image_url: '',
      description: '',
      shopee_url: '',
      tiktok_url: '',
      tokopedia_url: '',
      other_marketplace_url: '',
      is_active: true,
      popular: false
    });
    setIsCreatingProduct(true);
  };

  const handleOpenEditProduct = (prod) => {
    setEditingProduct(prod);
    setProductForm({
      name: prod.name || '',
      category: prod.category || 'gamepass',
      game_title: prod.game_title || '',
      price: prod.price || '',
      image_url: prod.image_url || '',
      description: prod.description || '',
      shopee_url: prod.shopee_url || '',
      tiktok_url: prod.tiktok_url || '',
      tokopedia_url: prod.tokopedia_url || '',
      other_marketplace_url: prod.other_marketplace_url || '',
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
    const defaultQris = "/qris-zhafranstore.jpg";
    setQrisPreview(defaultQris);
    setSettingsForm(prev => ({ ...prev, qris_image_url: defaultQris }));
  };

  // ORDER MANAGEMENT
  const handleUpdateStatus = async (orderId, newStatus) => {
    await storeService.updateOrderStatus(orderId, newStatus);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    if (showToast) showToast(`Status pesanan ${orderId} diubah ke ${newStatus.toUpperCase()}`);
  };

  const handleChatBuyer = (order) => {
    const wa = order.buyer_whatsapp;
    if (!wa) {
      alert("Nomor WhatsApp pembeli tidak tersedia.");
      return;
    }
    const msg = `Halo kak! Kami dari ${settingsForm.store_name}. Terkait pesanan ${order.id} (${order.product_name}) untuk akun ${order.game_username}:`;
    window.open(storeService.generateWhatsAppLink(wa, msg), '_blank');
  };

  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.status === orderFilter;
  });

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-lg max-h-[92vh]">
        
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-violet-600/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
              <Shield className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                Dashboard Pemilik Toko
              </h3>
              <p className="text-[11px] text-slate-400">
                Kelola Produk, Foto QRIS, dan Pesanan Masuk
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <button
                onClick={handleLogout}
                className="text-xs text-rose-400 hover:text-rose-300 px-2.5 py-1 rounded-lg bg-rose-500/10 border border-rose-500/20"
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
          <div className="modal-body max-w-sm mx-auto my-8 text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-violet-500/10 border border-violet-500/30 text-violet-400 flex items-center justify-center mx-auto">
              <Lock className="w-7 h-7" />
            </div>
            <div>
              <h4 className="font-heading font-bold text-lg text-white">Masukkan PIN Admin</h4>
              <p className="text-xs text-slate-400 mt-1">
                Akses khusus pemilik Zhafranstore.id
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-3">
              <input
                type="password"
                placeholder="Masukkan PIN (Default: zhafran2026)"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value)}
                className="form-input text-center text-base tracking-widest"
                autoFocus
              />
              {pinError && (
                <div className="text-xs text-rose-400">{pinError}</div>
              )}
              <button type="submit" className="w-full btn-primary text-sm py-2.5">
                Buka Dashboard
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED ADMIN DASHBOARD */
          <>
            {/* Navigation Tabs */}
            <div className="px-6 pt-3 border-b border-white/10 flex items-center gap-2 overflow-x-auto bg-slate-950/40">
              <button
                onClick={() => { setActiveTab('orders'); setIsCreatingProduct(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition ${
                  activeTab === 'orders'
                    ? 'border-cyan-400 text-cyan-400 bg-cyan-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <ListOrdered className="w-4 h-4" />
                <span>Pesanan Masuk</span>
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 text-[10px]">
                  {orders.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('products'); setIsCreatingProduct(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition ${
                  activeTab === 'products'
                    ? 'border-violet-400 text-violet-400 bg-violet-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Kelola Produk</span>
                <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 text-[10px]">
                  {products.length}
                </span>
              </button>

              <button
                onClick={() => { setActiveTab('qris'); setIsCreatingProduct(false); }}
                className={`flex items-center gap-2 px-4 py-2.5 border-b-2 text-xs sm:text-sm font-heading font-bold transition ${
                  activeTab === 'qris'
                    ? 'border-emerald-400 text-emerald-400 bg-emerald-500/10'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Settings className="w-4 h-4" />
                <span>Pengaturan QRIS & Toko</span>
              </button>
            </div>

            {/* Tab Body */}
            <div className="modal-body flex-1 overflow-y-auto">
              
              {/* TAB 1: ORDERS (FR-09) */}
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
                          className="p-4 rounded-xl bg-slate-900/90 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-white/20 transition"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="font-mono font-bold text-xs text-cyan-400">{order.id}</span>
                              <span className={`badge text-[9px] ${
                                order.status === 'selesai' ? 'badge-emerald' :
                                order.status === 'diproses' ? 'badge-cyan' :
                                order.status === 'cancelled' ? 'badge-rose' :
                                'badge-amber'
                              }`}>
                                {order.status}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                {order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID', {
                                  hour: '2-digit', minute: '2-digit'
                                }) : ''}
                              </span>
                            </div>

                            <div className="font-heading font-bold text-white text-sm">
                              {order.product_name}
                            </div>

                            <div className="text-xs text-slate-300 flex flex-wrap items-center gap-x-3 gap-y-1">
                              <span>Akun: <strong className="text-white">{order.game_username}</strong></span>
                              <span>WA: <strong className="text-white">{order.buyer_whatsapp}</strong></span>
                              <span>Nominal: <strong className="text-emerald-400">{storeService.formatRupiah(order.price)}</strong></span>
                              <span>Metode: <strong className="uppercase text-sky-400">{order.payment_method}</strong></span>
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
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

                            <button
                              onClick={() => handleChatBuyer(order)}
                              className="btn-whatsapp text-xs py-1.5 px-2.5 flex items-center gap-1 rounded-lg"
                              title="Chat Pembeli via WhatsApp"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              <span>Chat WA</span>
                            </button>

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
                        <img 
                          src={viewingProof} 
                          alt="Bukti Transfer" 
                          className="w-full max-h-[70vh] object-contain rounded-xl bg-black"
                        />
                      </div>
                    </div>
                  )}

                </div>
              )}

              {/* TAB 2: PRODUCTS CRUD (FR-07) */}
              {activeTab === 'products' && (
                <div className="space-y-4">
                  
                  {!isCreatingProduct ? (
                    <>
                      <div className="flex items-center justify-between">
                        <div className="text-xs text-slate-400">
                          Total {products.length} produk game & gamepass
                        </div>
                        <button
                          onClick={handleOpenCreateProduct}
                          className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Tambah Produk Baru</span>
                        </button>
                      </div>

                      <div className="space-y-2">
                        {products.map(prod => (
                          <div 
                            key={prod.id}
                            className="p-3.5 rounded-xl bg-slate-900/90 border border-white/10 flex items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-3">
                              <img 
                                src={prod.image_url} 
                                alt={prod.name} 
                                className="w-12 h-12 rounded-lg object-cover bg-slate-950 flex-shrink-0"
                              />
                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className={`badge text-[9px] ${prod.category === 'gamepass' ? 'badge-purple' : 'badge-cyan'}`}>
                                    {prod.category}
                                  </span>
                                  <span className="font-heading font-bold text-white text-sm">
                                    {prod.name}
                                  </span>
                                </div>
                                <div className="text-xs text-cyan-400 font-semibold mt-0.5">
                                  {storeService.formatRupiah(prod.price)}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenEditProduct(prod)}
                                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white"
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
                    /* PRODUCT FORM (ADD / EDIT) */
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
                          <label className="form-label">Kategori *</label>
                          <select
                            value={productForm.category}
                            onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                            className="form-select text-xs"
                          >
                            <option value="gamepass">⚡ Item Gamepass</option>
                            <option value="game">🎮 Game PC / Lisensi Original</option>
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

                      {/* Image Input */}
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

                      {/* Marketplace Links */}
                      <div className="p-3 rounded-xl bg-slate-950/60 border border-white/10 space-y-2">
                        <div className="text-xs font-bold text-slate-300">Link Eksternal Marketplace (Opsional):</div>
                        
                        <div className="form-group !mb-0">
                          <label className="text-[11px] text-orange-400 font-semibold">URL Produk Shopee</label>
                          <input
                            type="url"
                            placeholder="https://shopee.co.id/..."
                            value={productForm.shopee_url}
                            onChange={(e) => setProductForm({ ...productForm, shopee_url: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="text-[11px] text-green-400 font-semibold">URL Produk Tokopedia</label>
                          <input
                            type="url"
                            placeholder="https://tokopedia.com/..."
                            value={productForm.tokopedia_url}
                            onChange={(e) => setProductForm({ ...productForm, tokopedia_url: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>

                        <div className="form-group !mb-0">
                          <label className="text-[11px] text-pink-400 font-semibold">URL Produk TikTok Shop</label>
                          <input
                            type="url"
                            placeholder="https://tiktok.com/..."
                            value={productForm.tiktok_url}
                            onChange={(e) => setProductForm({ ...productForm, tiktok_url: e.target.value })}
                            className="form-input text-xs"
                          />
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-2 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsCreatingProduct(false)}
                          className="btn-secondary text-xs py-2 px-4"
                        >
                          Batal
                        </button>
                        <button
                          type="submit"
                          className="btn-primary text-xs py-2 px-5 flex items-center gap-1.5"
                        >
                          <Save className="w-4 h-4" />
                          <span>Simpan Produk</span>
                        </button>
                      </div>
                    </form>
                  )}

                </div>
              )}

              {/* TAB 3: QRIS & SETTINGS (FR-08) */}
              {activeTab === 'qris' && (
                <form onSubmit={handleSaveSettings} className="space-y-4 max-w-xl mx-auto">
                  
                  <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-4">
                    <h4 className="font-heading font-bold text-white text-sm">Foto QRIS Pembayaran</h4>
                    
                    {/* QRIS Image Preview */}
                    <div className="flex flex-col sm:flex-row items-center gap-4">
                      <div className="w-44 p-2 bg-white rounded-xl shadow-lg flex flex-col items-center flex-shrink-0">
                        <img 
                          src={qrisPreview} 
                          alt="QRIS Toko" 
                          className="w-full aspect-square object-contain rounded"
                        />
                        <div className="text-[9px] font-bold text-slate-800 mt-1">PREVIEW QRIS AKTIF</div>
                      </div>

                      <div className="space-y-2 flex-1 text-center sm:text-left">
                        <div className="text-xs text-slate-300">
                          Ganti gambar QRIS toko kamu kapan saja. Mendukung format JPEG, PNG, dan WebP.
                        </div>

                        <div className="flex flex-wrap items-center gap-2 justify-center sm:justify-start">
                          <label className="btn-primary text-xs py-2 px-3 flex items-center gap-1.5 cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Unggah Foto QRIS Baru</span>
                            <input
                              type="file"
                              accept="image/*"
                              onChange={handleQrisFileUpload}
                              className="hidden"
                            />
                          </label>

                          <button
                            type="button"
                            onClick={handleResetDefaultQRIS}
                            className="btn-secondary text-xs py-2 px-3 flex items-center gap-1"
                            title="Kembalikan ke foto QRIS asli Zhafranstore.id"
                          >
                            <RotateCcw className="w-3 h-3 text-cyan-400" />
                            <span>QRIS Bawaan</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Store Details Form */}
                  <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
                    <h4 className="font-heading font-bold text-white text-sm">Informasi Toko & WhatsApp</h4>

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
                      <label className="form-label">Nomor WhatsApp Admin (Format 628...)</label>
                      <input
                        type="text"
                        value={settingsForm.admin_whatsapp}
                        onChange={(e) => setSettingsForm({ ...settingsForm, admin_whatsapp: e.target.value })}
                        className="form-input text-xs"
                      />
                      <span className="text-[10px] text-slate-500">
                        Nomor ini akan menerima pesan konfirmasi pesanan dari pembeli.
                      </span>
                    </div>

                    <div className="form-group !mb-0">
                      <label className="form-label">Instruksi Pembayaran</label>
                      <textarea
                        rows={3}
                        value={settingsForm.payment_instructions}
                        onChange={(e) => setSettingsForm({ ...settingsForm, payment_instructions: e.target.value })}
                        className="form-textarea text-xs"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      className="btn-primary text-xs py-2.5 px-6 flex items-center gap-1.5"
                    >
                      <Save className="w-4 h-4" />
                      <span>Simpan Seluruh Pengaturan</span>
                    </button>
                  </div>

                </form>
              )}

            </div>
          </>
        )}

      </div>
    </div>
  );
}
