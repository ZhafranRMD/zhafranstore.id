import React, { useState } from 'react';
import { X, Search, ShoppingBag, Clock, CheckCircle2, AlertCircle, RefreshCw, MessageCircle } from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function OrderTrackerModal({ isOpen, onClose, storeSettings }) {
  if (!isOpen) return null;

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [matchedOrders, setMatchedOrders] = useState(null);
  const adminWhatsApp = storeSettings?.admin_whatsapp || '6282199887766';

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    try {
      const allOrders = await storeService.getOrders(100);
      const query = searchQuery.trim().toLowerCase();
      
      const results = allOrders.filter(o => 
        (o.id && o.id.toLowerCase().includes(query)) ||
        (o.buyer_whatsapp && o.buyer_whatsapp.includes(query)) ||
        (o.game_username && o.game_username.toLowerCase().includes(query))
      );

      setMatchedOrders(results);
    } catch (err) {
      console.error("Order track error:", err);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'selesai':
        return <span className="badge badge-emerald text-[10px]">Selesai / Terkirim</span>;
      case 'diproses':
        return <span className="badge badge-cyan text-[10px]">Sedang Diproses</span>;
      case 'cancelled':
        return <span className="badge badge-rose text-[10px]">Dibatalkan</span>;
      default:
        return <span className="badge badge-amber text-[10px]">Menunggu Verifikasi</span>;
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                Lacak Status Pesanan
              </h3>
              <p className="text-[11px] text-slate-400">
                Cek proses pengiriman gamepass atau lisensi game kamu
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-4">
          
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Masukkan Kode Invoice (INV-...) atau No. WA"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input pl-9 text-xs"
                autoFocus
              />
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="btn-primary text-xs px-4"
            >
              {isSearching ? <RefreshCw className="w-4 h-4 animate-spin" /> : 'Lacak'}
            </button>
          </form>

          {/* Results */}
          {matchedOrders !== null && (
            <div className="space-y-3 pt-2">
              {matchedOrders.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-900/60 rounded-xl p-4 border border-white/5">
                  <AlertCircle className="w-6 h-6 text-slate-500 mx-auto mb-2" />
                  Pesanan tidak ditemukan dengan kata kunci tersebut. Pastikan format nomor WA atau invoice sudah benar.
                </div>
              ) : (
                <div className="space-y-3">
                  {matchedOrders.map(order => (
                    <div 
                      key={order.id}
                      className="p-4 rounded-xl bg-slate-900/90 border border-white/10 space-y-2.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono font-bold text-xs text-cyan-400">{order.id}</span>
                        {getStatusBadge(order.status)}
                      </div>

                      <div className="font-heading font-bold text-white text-sm">
                        {order.product_name}
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs text-slate-400 bg-slate-950/60 p-2.5 rounded-lg">
                        <div>Akun: <strong className="text-white">{order.game_username}</strong></div>
                        <div>Metode: <strong className="text-sky-300 uppercase">{order.payment_method}</strong></div>
                        <div>Total: <strong className="text-emerald-400">{storeService.formatRupiah(order.price)}</strong></div>
                        <div>Waktu: <strong className="text-slate-300">{order.createdAt ? new Date(order.createdAt).toLocaleDateString('id-ID') : '-'}</strong></div>
                      </div>

                      {order.status === 'pending' && (
                        <div className="text-[11px] text-amber-300/90 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Pesanan sedang diverifikasi admin. Harap tunggu 1-5 menit.</span>
                        </div>
                      )}

                      {order.status === 'selesai' && (
                        <div className="text-[11px] text-emerald-300/90 bg-emerald-500/10 p-2 rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                          <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                          <span>Pesanan telah sukses dikirim ke akun kamu! Terima kasih telah berbelanja di Zhafranstore.id.</span>
                        </div>
                      )}

                      <button
                        onClick={() => {
                          const msg = `Halo Admin, saya ingin menanyakan status pesanan invoice ${order.id}.`;
                          window.open(storeService.generateWhatsAppLink(adminWhatsApp, msg), '_blank');
                        }}
                        className="w-full btn-secondary text-xs py-2 flex items-center justify-center gap-1.5"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Tanyakan ke WhatsApp Admin</span>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
