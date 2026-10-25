import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  Info,
  Mail,
  Tag,
  Percent,
  CheckCheck,
  Sparkles,
  MessageSquare
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService, ADMIN_FEE } from '../services/storeService.js';
import { validatePromo } from '../data/promoCodes.js';

export default function CheckoutModal({ 
  product, 
  isOpen, 
  onClose, 
  storeSettings,
  onOrderSuccess,
  onOpenChat
}) {
  if (!isOpen || !product) return null;

  // Form states
  const [gameUsername, setGameUsername] = useState('');
  const [zoneId, setZoneId] = useState('');
  const [buyerWhatsapp, setBuyerWhatsapp] = useState('');
  const [buyerEmail, setBuyerEmail] = useState('');
  const [buyerNotes, setBuyerNotes] = useState('');
  
  // Promo code discount state (Completely Optional)
  const [promoCodeInput, setPromoCodeInput] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);
  const [promoError, setPromoError] = useState('');

  // QRIS reveal state (Don't show QRIS immediately; reveal only when user clicks Bayar Sekarang)
  const [showQrisPayment, setShowQrisPayment] = useState(false);

  // QRIS proof & processing
  const [proofImage, setProofImage] = useState(null);
  const [proofPreview, setProofPreview] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const adminWhatsApp = storeSettings?.admin_whatsapp || "082542778554";
  const qrisImage = storeSettings?.qris_image_url || "./qris-zhafranstore.jpg";

  // Reset internal states on open
  useEffect(() => {
    setShowQrisPayment(false);
    setCreatedOrder(null);
    setProofPreview('');
    setProofImage(null);
    setErrorMsg('');
  }, [product, isOpen]);

  // Calculate pricing breakdown
  const rawPrice = Number(product.price) || 0;
  const adminFee = ADMIN_FEE; // Biaya Admin Rp 500
  let discountAmount = 0;
  if (appliedPromo) {
    discountAmount = Math.round((rawPrice * appliedPromo.discountPercent) / 100);
  }
  const finalPrice = Math.max(0, rawPrice + adminFee - discountAmount);

  // Apply Promo Code (Optional)
  const handleApplyPromo = () => {
    setPromoError('');
    if (!promoCodeInput.trim()) {
      setAppliedPromo(null);
      return;
    }

    const promo = validatePromo(promoCodeInput);
    if (promo) {
      setAppliedPromo(promo);
      setPromoError('');
    } else {
      setAppliedPromo(null);
      setPromoError('Kode promo tidak valid atau telah berakhir.');
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoCodeInput('');
    setPromoError('');
  };

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

  // Trigger reveal of QRIS on "Bayar Sekarang"
  const handleProceedToQRIS = () => {
    if (!validateForm()) return;
    setShowQrisPayment(true);
    setErrorMsg('');
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

  // Submit Order - Dual Option: Tanpa Chat vs Bisa di Chat (WhatsApp)
  const handleConfirmQRIS = async (openWhatsApp = false) => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const orderPayload = {
        product_id: product.id,
        product_name: product.name,
        category: product.category,
        raw_price: rawPrice,
        admin_fee: adminFee,
        discount_amount: discountAmount,
        promo_code: appliedPromo ? appliedPromo.code : null,
        price: finalPrice,
        game_username: zoneId ? `${gameUsername} (${zoneId})` : gameUsername,
        buyer_whatsapp: buyerWhatsapp,
        buyer_email: buyerEmail || null,
        notes: buyerNotes,
        order_mode: openWhatsApp ? 'whatsapp_chat' : 'tanpa_chat_web',
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

      // Jika user memilih "Bisa di Chat" (WhatsApp), otomatis buka WhatsApp
      if (openWhatsApp) {
        const waMessage = 
`Halo Admin Zhafranstore.id, saya ingin konfirmasi pembayaran QRIS:
━━━━━━━━━━━━━━━━━━━━
🧾 *KODE INVOICE:* ${newOrder.id}
🎮 *PRODUK:* ${product.name}
💵 *HARGA PRODUK:* ${storeService.formatRupiah(rawPrice)}
⚙️ *BIAYA ADMIN:* ${storeService.formatRupiah(adminFee)}
${discountAmount > 0 ? `🏷️ *DISKON (${appliedPromo.code}):* -${storeService.formatRupiah(discountAmount)}\n` : ''}💰 *TOTAL BAYAR:* ${storeService.formatRupiah(finalPrice)}
👤 *AKUN TUJUAN:* ${orderPayload.game_username}
📱 *NO. WA:* ${buyerWhatsapp}
${buyerEmail ? `📧 *EMAIL:* ${buyerEmail}\n` : ''}${buyerNotes ? `📝 *CATATAN:* ${buyerNotes}\n` : ''}━━━━━━━━━━━━━━━━━━━━
Bukti bayar sudah ${proofPreview ? 'saya unggah di website & saya lampirkan di chat ini' : 'siap dikirimkan'}. Mohon segera diproses ya min. Terima kasih!`;

        const waUrl = storeService.generateWhatsAppLink(adminWhatsApp, waMessage);
        window.open(waUrl, '_blank');
      }

    } catch (err) {
      console.error("Order error:", err);
      setErrorMsg("Terjadi kendala saat membuat pesanan. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
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
                  Pesanan kamu telah tercatat di sistem Zhafranstore.id {createdOrder.order_mode === 'tanpa_chat_web' ? 'dan diproses otomatis tanpa chat.' : 'dan diteruskan ke Admin.'}
                </p>
              </div>

              {/* Invoice Box */}
              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 text-left space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Kode Invoice:</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-cyan-400 text-sm">{createdOrder.id}</span>
                    <button
                      onClick={() => copyToClipboard(createdOrder.id)}
                      className="text-slate-400 hover:text-white p-1"
                      title="Salin Invoice"
                    >
                      {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Target Akun:</span>
                  <span className="font-semibold text-white">{createdOrder.game_username}</span>
                </div>

                {createdOrder.buyer_email && (
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400">Email:</span>
                    <span className="font-semibold text-white">{createdOrder.buyer_email}</span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Harga Produk:</span>
                  <span className="text-slate-300">{storeService.formatRupiah(createdOrder.raw_price || createdOrder.price)}</span>
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Biaya Admin:</span>
                  <span className="text-slate-300">{storeService.formatRupiah(createdOrder.admin_fee || 500)}</span>
                </div>

                {createdOrder.discount_amount > 0 && (
                  <div className="flex items-center justify-between text-emerald-400">
                    <span>Diskon ({createdOrder.promo_code}):</span>
                    <span>-{storeService.formatRupiah(createdOrder.discount_amount)}</span>
                  </div>
                )}

                <div className="flex items-center justify-between border-t border-white/10 pt-1.5 text-sm">
                  <span className="text-slate-300 font-bold">Total Pembayaran:</span>
                  <span className="font-bold text-emerald-400">{storeService.formatRupiah(createdOrder.price)}</span>
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-400">Status:</span>
                  <span className="badge badge-amber text-[10px]">Menunggu Verifikasi (1-5 Mnt)</span>
                </div>
              </div>

              <div className="space-y-2 pt-2">
                {/* TOMBOL UTAMA: MASUK KE RUANG CHAT & SERAH TERIMA APLIKASI */}
                {onOpenChat && (
                  <button
                    onClick={() => {
                      onOpenChat(createdOrder);
                      onClose();
                    }}
                    className="w-full btn-primary py-3.5 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm font-heading font-black shadow-lg shadow-cyan-500/30"
                  >
                    <MessageSquare className="w-4 h-4 text-slate-950" />
                    <span>Masuk ke Ruang Chat & Serah Terima Aplikasi</span>
                    <Sparkles className="w-4 h-4 text-slate-950" />
                  </button>
                )}

                <button
                  onClick={() => {
                    const waMessage = `Halo Admin Zhafranstore.id, saya ingin konfirmasi pesanan invoice ${createdOrder.id} (${product.name}).`;
                    window.open(storeService.generateWhatsAppLink(adminWhatsApp, waMessage), '_blank');
                  }}
                  className="w-full btn-whatsapp py-3 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Chat Admin WhatsApp (082542778554)
                </button>

                <button
                  onClick={onClose}
                  className="w-full btn-secondary py-2.5 rounded-xl text-xs text-slate-300"
                >
                  Tutup & Kembali Belanja
                </button>
              </div>
            </div>
          ) : showQrisPayment ? (
            /* STEP 2: TAMPILAN QRIS HANYA SAAT TOMBOL BAYAR SEKARANG DITEKAN */
            <div className="space-y-4 animate-fadeIn">
              
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <button
                  type="button"
                  onClick={() => setShowQrisPayment(false)}
                  className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-semibold"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  <span>Ubah Data / Kembali</span>
                </button>

                <span className="badge badge-cyan text-[10px]">
                  Langkah 2: Selesaikan Bayar
                </span>
              </div>

              {/* Rincian Tagihan */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between">
                <div>
                  <div className="text-[11px] text-slate-400">Total Yang Harus Dibayar:</div>
                  <div className="font-heading font-extrabold text-2xl text-cyan-400">
                    {storeService.formatRupiah(finalPrice)}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    (Harga: {storeService.formatRupiah(rawPrice)} + Admin: Rp 500 {discountAmount > 0 ? `- Diskon: ${storeService.formatRupiah(discountAmount)}` : ''})
                  </div>
                </div>

                <div className="text-right text-xs">
                  <div className="text-slate-400">Akun Tujuan:</div>
                  <div className="font-bold text-white">{gameUsername}</div>
                </div>
              </div>

              {/* Box Foto QRIS Resmi */}
              <div className="relative mx-auto w-56 sm:w-64 p-3.5 bg-white rounded-2xl shadow-xl flex flex-col items-center">
                <div className="text-[11px] font-black tracking-widest text-slate-900 mb-1">
                  QRIS PEMBAYARAN RESMI
                </div>
                <img 
                  src={qrisImage} 
                  alt="QRIS Pembayaran Zhafranstore.id"
                  className="w-full aspect-square object-contain rounded-lg"
                />
                <div className="mt-2 text-center">
                  <div className="text-[10px] text-slate-600 font-bold">TOTAL NOMINAL:</div>
                  <div className="font-mono font-black text-slate-950 text-base">
                    {storeService.formatRupiah(finalPrice)}
                  </div>
                </div>
              </div>

              {/* Tombol Unduh QRIS */}
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

              {/* Upload Bukti Bayar */}
              <div className="space-y-2 pt-2 border-t border-white/10">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Unggah Bukti Transfer:</span>
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

              {/* DUAL ACTION BUTTONS: BISA DI CHAT ATAU TANPA CHAT */}
              <div className="pt-2 space-y-2">
                <div className="text-center text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  Pilih Cara Konfirmasi Pesanan:
                </div>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmQRIS(true)}
                  className="w-full btn-whatsapp py-3 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{isSubmitting ? 'Memproses...' : 'Konfirmasi via Chat WhatsApp (Rekomendasi)'}</span>
                </button>

                <button
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleConfirmQRIS(false)}
                  className="w-full btn-primary py-3 rounded-xl font-heading font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  <CheckCircle2 className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? 'Memproses...' : 'Selesaikan Otomatis (Tanpa di Chat)'}</span>
                </button>
              </div>

            </div>
          ) : (
            /* STEP 1: FORM INPUT DATA AKUN & PROMO (QRIS BELUM MUNCUL) */
            <>
              {/* Product Price Summary Banner */}
              <div className="p-3.5 rounded-xl bg-slate-900/90 border border-cyan-500/20 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[11px] text-slate-400">Estimasi Total Bayar:</div>
                    <div className="font-heading font-extrabold text-2xl text-cyan-400">
                      {storeService.formatRupiah(finalPrice)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="badge badge-emerald text-[10px]">
                      <ShieldCheck className="w-3 h-3" /> Garansi 100%
                    </span>
                  </div>
                </div>

                {/* Price Breakdown */}
                <div className="text-[11px] text-slate-400 pt-1.5 border-t border-white/10 flex flex-wrap items-center justify-between gap-1">
                  <span>Harga Produk: {storeService.formatRupiah(rawPrice)}</span>
                  <span>+ Biaya Admin: <strong className="text-slate-200">Rp 500</strong></span>
                  {appliedPromo && (
                    <span className="text-emerald-400 font-semibold">
                      - Diskon Promo: {storeService.formatRupiah(discountAmount)} ({appliedPromo.discountPercent}%)
                    </span>
                  )}
                </div>
              </div>

              {/* Error Message if any */}
              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Form Input Data Target Akun */}
              <div className="space-y-3">
                <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400">
                  1. Masukkan Data Akun & Kontak
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

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Nomor WhatsApp <span className="text-rose-400">*</span></span>
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

                  {/* Input Email Pembeli */}
                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Alamat Email <span className="text-slate-500 font-normal">(Opsional)</span></span>
                    </label>
                    <input
                      type="email"
                      placeholder="Contoh: nama@gmail.com"
                      value={buyerEmail}
                      onChange={(e) => setBuyerEmail(e.target.value)}
                      className="form-input text-xs"
                    />
                  </div>
                </div>

                {/* Input Kode Promo / Diskon (Opsional - Bisa dikosongkan) */}
                <div className="form-group !mb-0 pt-1">
                  <label className="form-label">
                    <span className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Tag className="w-3.5 h-3.5 text-cyan-400" />
                      Kode Promo / Diskon <span className="text-[10px] text-slate-500 font-normal">(Opsional - Kosongkan jika tidak ada)</span>
                    </span>
                  </label>
                  
                  {!appliedPromo ? (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Contoh: indonesiastore / 4storezhafran (Opsional)"
                        value={promoCodeInput}
                        onChange={(e) => setPromoCodeInput(e.target.value)}
                        className="form-input text-xs uppercase font-mono"
                      />
                      <button
                        type="button"
                        onClick={handleApplyPromo}
                        className="btn-secondary text-xs px-3.5 whitespace-nowrap"
                      >
                        Terapkan
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-400">
                      <div className="flex items-center gap-1.5 font-bold">
                        <CheckCheck className="w-4 h-4" />
                        <span>Kupon '{appliedPromo.code}' Aktif ({appliedPromo.description})</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleRemovePromo}
                        className="text-xs text-rose-400 hover:text-rose-300 font-bold ml-2"
                      >
                        Hapus
                      </button>
                    </div>
                  )}

                  {promoError && (
                    <div className="text-[11px] text-rose-400 mt-1">{promoError}</div>
                  )}
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-3 pt-2">
                <div className="font-heading font-bold text-xs uppercase tracking-wider text-slate-400">
                  2. Metode Pembayaran
                </div>

                <div className="p-3.5 rounded-xl border border-cyan-500/40 bg-cyan-950/20 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400/30 flex items-center justify-center text-cyan-400">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-heading font-bold text-xs sm:text-sm text-white flex items-center gap-2">
                        <span>QRIS Instan Otomatis</span>
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Aktif</span>
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Scan via BCA, Mandiri, BRI, BNI, DANA, GoPay, OVO, ShopeePay
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={handleProceedToQRIS}
                    className="w-full btn-primary py-3.5 rounded-xl font-heading font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/30"
                  >
                    <QrCode className="w-4 h-4 text-slate-950" />
                    <span>Bayar Sekarang (Tampilkan QRIS)</span>
                    <ArrowRight className="w-4 h-4 text-slate-950" />
                  </button>
                  <div className="text-center text-[10px] text-slate-400 mt-1.5">
                    Klik tombol di atas untuk memunculkan foto QRIS resmi dan menyelesaikan pembayaran.
                  </div>
                </div>
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
