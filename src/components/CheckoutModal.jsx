import React, { useState } from 'react';
import { 
  X, 
  QrCode, 
  ShoppingBag, 
  ExternalLink, 
  Download, 
  Upload, 
  CheckCircle2, 
  AlertCircle, 
  Copy, 
  Check, 
  MessageCircle, 
  Smartphone, 
  ShieldCheck,
  ArrowRight,
  Info
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService } from '../services/storeService.js';

export default function CheckoutModal({ 
  product, 
  isOpen, 
  onClose, 
  storeSettings,
  onOrderSuccess 
}) {
  if (!isOpen || !product) return null;

  // Form states
  const [gameUsername, setGameUsername] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  
  // Payment selection state: 'qris' or 'marketplace'
  const [paymentGroup, setPaymentGroup] = useState('qris'); // 'qris' | 'marketplace'
  const [selectedMarketplace, setSelectedMarketplace] = useState('shopee');
  
  // QRIS proof & processing
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const adminWhatsApp = storeSettings?.admin_whatsapp || "6282199887766";
  const qrisImage = storeSettings?.qris_image_url || "/qris-zhafranstore.jpg";

  // Validate form
  const validateForm = () => {
    if (!gameUsername.trim()) {
      setErrorMsg("Harap masukkan Username / User ID Game akun tujuan.");
      return false;
    }
    if (!buyerWhatsapp.trim()) {
      setErrorMsg("Harap masukkan Nomor WhatsApp aktif untuk konfirmasi & pengiriman.");
      return false;
    }
    setErrorMsg('');
    return true;
  };

  // Handle File Proof Upload
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setErrorMsg("Ukuran file bukti pembayaran maksimal 5MB.");
        return;
      }
      setProofImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofPreview(reader.result);
      };
      reader.readAsDataURL(file);
      setErrorMsg('');
    }
  };

  // Trigger download of the QRIS image
  const handleDownloadQRIS = () => {
    const link = document.createElement('a');
    link.href = qrisImage;
    link.download = `QRIS-Zhafranstore-${product.name.replace(/\s+/g, '-').slice(0, 20)}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Submit QRIS Order & Launch WhatsApp Confirmation
  const handleConfirmQRIS = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        price: product.price,
        game_username: zoneId ? `${gameUsername} (${zoneId})` : gameUsername,
        buyer_whatsapp: buyerWhatsapp,
        notes: buyerNotes,
        payment_method: 'qris',
        payment_proof_url: proofPreview || null,
        created_at: new Date().toISOString()
      };

      const newOrder = await storeService.createOrder(orderPayload);
      setCreatedOrder(newOrder);

      // Trigger Confetti Celebration
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.6 }
      });

      if (onOrderSuccess) onOrderSuccess(newOrder);

      // Buat template pesan WhatsApp terformat otomatis
      const waMessage = 
`Halo Admin Zhafranstore.id, saya ingin konfirmasi pembayaran QRIS:
━━━━━━━━━━━━━━━━━━━━
🧾 *KODE INVOICE:* ${newOrder.id}
🎮 *PRODUK:* ${product.name}
💰 *TOTAL BAYAR:* ${storeService.formatRupiah(product.price)}
👤 *AKUN TUJUAN:* ${orderPayload.game_username}
📱 *NO. WA SAYA:* ${buyerWhatsapp}
${buyerNotes ? `📝 *CATATAN:* ${buyerNotes}\n` : ''}━━━━━━━━━━━━━━━━━━━━
Bukti bayar sudah ${proofPreview ? 'saya lampirkan di website & di chat ini' : 'siap dikirimkan'}. Mohon segera diproses kilat ya min. Terima kasih!`;

      const waUrl = storeService.generateWhatsAppLink(adminWhatsApp, waMessage);
      window.open(waUrl, '_blank');

    } catch (err) {
      console.error("Order error:", err);
      setErrorMsg("Terjadi kendala saat membuat pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Marketplace Checkout
  const handleMarketplaceCheckout = async (marketplaceName, targetUrl) => {
    if (!validateForm()) return;

    // Log the order as marketplace order
    const orderPayload = {
      product_id: product.id,
      product_name: product.name,
      category: product.category,
      price: product.price,
      game_username: zoneId ? `${gameUsername} (${zoneId})` : gameUsername,
      buyer_whatsapp: buyerWhatsapp,
      notes: `Checkout via ${marketplaceName}. ` + (buyerNotes || ''),
      payment_method: marketplaceName.toLowerCase().replace(/\s+/g, '_'),
      payment_proof_url: null,
      created_at: new Date().toISOString()
    };

    const newOrder = await storeService.createOrder(orderPayload);
    setCreatedOrder(newOrder);

    if (onOrderSuccess) onOrderSuccess(newOrder);

    // Open target marketplace link or store link
    const url = targetUrl || (
      marketplaceName === 'Shopee' ? 'https://shopee.co.id' :
      marketplaceName === 'Tokopedia' ? 'https://tokopedia.com' :
      'https://tiktok.com'
    );
    window.open(url, '_blank');
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedInvoice(true);
    setTimeout(() => setCopiedInvoice(false), 2000);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        
        {/* Modal Header */}
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-800 border border-white/10 overflow-hidden flex-shrink-0">
              <img 
                src={product.image_url} 
                alt={product.name} 
                className="w-full h-full object-cover" 
              />
            </div>
            <div>
              <div className="text-xs text-slate-400 font-semibold uppercase tracking-wider">
                Instant Checkout
              </div>
              <h3 className="font-heading font-bold text-white text-sm sm:text-base line-clamp-1">
                {product.name}
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="modal-body space-y-4">

          {/* Success Screen if order is already created */}
          {createdOrder ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-9 h-9" />
              </div>

              <div>
                <h4 className="font-heading font-bold text-xl text-white">Pesanan Berhasil Dibuat!</h4>
                <p className="text-xs text-slate-400 mt-1">
                  Pesanan kamu telah tercatat di sistem Zhafranstore.id dan diteruskan ke Admin.
                </p>
              </div>

              {/* Invoice Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 text-left space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-400">Kode Invoice:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400 text-sm">{createdOrder.id}</span>
                    <button
                      onClick={() => copyToClipboard(createdOrder.id)}
                      className="text-xs text-slate-400 hover:text-white p-1"
                      title="Salin Invoice"
                    >
                      {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Target Akun:</span>
                  <span className="font-semibold text-white">{createdOrder.game_username}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Total Tagihan:</span>
                  <span className="font-bold text-emerald-400">{storeService.formatRupiah(createdOrder.price)}</span>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400">Status:</span>
                  <span className="badge badge-amber text-[10px]">Menunggu Verifikasi</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <button
                  onClick={() => {
                    const waMessage = `Halo Admin Zhafranstore.id, saya ingin konfirmasi pesanan invoice ${createdOrder.id} (${product.name}).`;
                    window.open(storeService.generateWhatsAppLink(adminWhatsApp, waMessage), '_blank');
                  }}
                  className="w-full btn-whatsapp py-3 rounded-xl flex items-center justify-center gap-2 text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat / Konfirmasi Ulang ke WhatsApp Admin
                </button>

                <button
                  onClick={onClose}
                  className="w-full btn-secondary py-2.5 rounded-xl text-xs text-slate-300"
                >
                  Tutup & Kembali Belanja
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Product Price Summary Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Total Pembayaran:</div>
                  <div className="font-heading font-extrabold text-xl text-cyan-400">
                    {storeService.formatRupiah(product.price)}
                  </div>
                </div>
                <div className="text-right">
                  <span className="badge badge-emerald text-[10px]">
                    <ShieldCheck className="w-3 h-3" /> Garansi 100%
                  </span>
                </div>
              </div>

              {/* Error Message if any */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Data Target Akun (FR-03) */}
              <div className="space-y-3">
                <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400">
                  1. Masukkan Data Akun Game
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Username / ID Game <span className="text-rose-400">*</span></span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: ZhafranGamer / 12345678"
                      value={gameUsername}
                      onChange={(e) => setGameUsername(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Server / Zone ID <span className="text-slate-500 font-normal">(Opsional)</span></span>
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: 2024 / Asia"
                      value={zoneId}
                      onChange={(e) => setZoneId(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">
                    <span>Nomor WhatsApp Kamu <span className="text-rose-400">*</span></span>
                    <span className="text-[10px] text-slate-400">Untuk bukti & info item</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={buyerWhatsapp}
                    onChange={(e) => setBuyerWhatsapp(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>
              </div>

              {/* Payment Method Selector (FR-04) */}
              <div className="space-y-3 pt-2">
                <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400">
                  2. Pilih Metode Pembayaran
                </div>

                {/* 2 Main Group Tabs */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentGroup('qris')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-heading font-bold ${
                      paymentGroup === 'qris'
                        ? 'bg-cyan-500/15 border-cyan-400 text-cyan-300 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <QrCode className="w-5 h-5 text-cyan-400" />
                    <span>QRIS Instan (Semua Bank/E-Wallet)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentGroup('marketplace')}
                    className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 transition text-xs font-heading font-bold ${
                      paymentGroup === 'marketplace'
                        ? 'bg-violet-500/15 border-violet-400 text-violet-300 shadow-md shadow-violet-500/20'
                        : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                    }`}
                  >
                    <ShoppingBag className="w-5 h-5 text-violet-400" />
                    <span>Checkout via E-Commerce</span>
                  </button>
                </div>

                {/* Group 1: QRIS Display (FR-05) */}
                {paymentGroup === 'qris' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-4 animate-fadeIn">
                    
                    <div className="text-center space-y-1">
                      <div className="text-xs text-slate-300 font-medium">
                        Scan QRIS di bawah ini dengan GoPay, OVO, DANA, BCA, ShopeePay, atau Mobile Banking:
                      </div>
                      <div className="text-xs font-mono font-bold text-cyan-400">
                        Merchant: {storeSettings?.store_name || "Zhafranstore.id"}
                      </div>
                    </div>

                    {/* QRIS Image Container with Official Look */}
                    <div className="relative mx-auto w-56 sm:w-64 p-3 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                      <div className="text-[11px] font-black tracking-widest text-slate-900 mb-1">
                        QRIS PEMBAYARAN RESMI
                      </div>
                      <img 
                        src={qrisImage} 
                        alt="QRIS Pembayaran Zhafranstore.id"
                        className="w-full aspect-square object-contain rounded-lg"
                      />
                      <div className="mt-2 text-center">
                        <div className="text-[10px] text-slate-600 font-bold">TOTAL BAYAR:</div>
                        <div className="font-mono font-black text-slate-950 text-base">
                          {storeService.formatRupiah(product.price)}
                        </div>
                      </div>
                    </div>

                    {/* Download QRIS Button */}
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={handleDownloadQRIS}
                        className="btn-secondary text-xs py-2 px-4 rounded-lg flex items-center gap-1.5"
                      >
                        <Download className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Unduh Gambar QRIS</span>
                      </button>
                    </div>

                    {/* Upload Bukti Transfer */}
                    <div className="space-y-2 pt-2 border-t border-white/10">
                      <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                        <span>Unggah Bukti Transfer <span className="text-slate-500 font-normal">(Opsional / Bisa kirim di WA)</span>:</span>
                      </label>

                      <div className="relative flex items-center justify-center p-3 border-2 border-dashed border-white/20 hover:border-cyan-400/50 rounded-xl bg-slate-950/60 transition cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleFileChange}
                          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        />
                        {proofPreview ? (
                          <div className="flex items-center gap-3">
                            <img 
                              src={proofPreview} 
                              alt="Bukti Preview" 
                              className="w-12 h-12 object-cover rounded-lg border border-cyan-400/40" 
                            />
                            <div className="text-left text-xs">
                              <div className="text-cyan-300 font-medium">Bukti terpasang ✓</div>
                              <div className="text-slate-400 text-[10px]">Klik untuk mengganti foto</div>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2 text-xs text-slate-400">
                            <Upload className="w-4 h-4 text-cyan-400" />
                            <span>Pilih foto bukti bayar dari galeri/PC</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Glowing Submit QRIS Button */}
                    <button
                      type="button"
                      disabled={isSubmitting}
                      onClick={handleConfirmQRIS}
                      className="w-full btn-primary py-3 rounded-xl font-heading font-extrabold text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                    >
                      <MessageCircle className="w-4 h-4 text-slate-950" />
                      <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi Bayar ke WhatsApp Admin'}</span>
                    </button>

                  </div>
                )}

                {/* Group 2: E-Commerce / Marketplace (FR-06) */}
                {paymentGroup === 'marketplace' && (
                  <div className="p-4 rounded-xl bg-slate-900/90 border border-violet-500/30 space-y-3 animate-fadeIn">
                    <div className="text-xs text-slate-300 leading-relaxed">
                      Pilih aplikasi *e-commerce* favorit kamu untuk checkout langsung menggunakan saldo ShopeePay, SPayLater, Tokopedia, atau TikTok Shop:
                    </div>

                    <div className="space-y-2 pt-1">
                      
                      {/* Shopee Button */}
                      <button
                        type="button"
                        onClick={() => handleMarketplaceCheckout('Shopee', product.shopee_url)}
                        className="w-full btn-shopee py-3 px-4 rounded-xl flex items-center justify-between transition text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-orange-600 font-black text-xs">
                            S
                          </div>
                          <span>Beli di <strong>Shopee</strong> (Zhafranstore)</span>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* Tokopedia Button */}
                      <button
                        type="button"
                        onClick={() => handleMarketplaceCheckout('Tokopedia', product.tokopedia_url)}
                        className="w-full btn-tokopedia py-3 px-4 rounded-xl flex items-center justify-between transition text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-green-600 font-black text-xs">
                            T
                          </div>
                          <span>Beli di <strong>Tokopedia</strong></span>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                      {/* TikTok Shop Button */}
                      <button
                        type="button"
                        onClick={() => handleMarketplaceCheckout('TikTok Shop', product.tiktok_url)}
                        className="w-full btn-tiktok py-3 px-4 rounded-xl flex items-center justify-between transition text-xs sm:text-sm"
                      >
                        <div className="flex items-center gap-2.5">
                          <div className="w-6 h-6 rounded-md bg-white flex items-center justify-center text-black font-black text-xs">
                            TT
                          </div>
                          <span>Beli di <strong>TikTok Shop</strong></span>
                        </div>
                        <ExternalLink className="w-4 h-4" />
                      </button>

                    </div>

                    <div className="p-3 rounded-lg bg-white/5 text-[11px] text-slate-400 flex items-start gap-2">
                      <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>
                        Saat halaman toko terbuka di aplikasi marketplace, silakan lakukan pembelian seperti biasa dan cantumkan ID Akun kamu pada catatan pesanan.
                      </span>
                    </div>

                  </div>
                )}

              </div>
            </>
          )}

        </div>

        {/* Modal Footer */}
        {!createdOrder && (
          <div className="modal-footer">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary text-xs py-2 px-4 rounded-lg"
            >
              Batal
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
