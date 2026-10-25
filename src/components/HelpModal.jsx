import React, { useState } from 'react';
import { 
  X, 
  MessageCircle, 
  Mail, 
  HelpCircle, 
  Phone, 
  Clock, 
  ShieldCheck, 
  Send, 
  Sparkles,
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function HelpModal({ 
  isOpen, 
  onClose, 
  storeSettings,
  onOpenLatestChat 
}) {
  if (!isOpen) return null;

  const adminPhone = storeSettings?.admin_whatsapp || "082542778554";
  const adminEmail = storeSettings?.admin_email || "zhafran.gibran09@gmail.com";
  const storeName = storeSettings?.store_name || "Zhafranstore.id";

  const [issueCategory, setIssueCategory] = useState('tanya_pesanan');
  const [userQuestion, setUserQuestion] = useState('');
  const [invoiceRef, setInvoiceRef] = useState('');

  const handleSendWA = () => {
    let msg = `Halo Admin ${storeName}, saya butuh bantuan:\n`;
    if (invoiceRef.trim()) {
      msg += `🧾 *Kode Invoice:* ${invoiceRef.trim()}\n`;
    }
    msg += `📌 *Kategori Kendala:* ${
      issueCategory === 'tanya_pesanan' ? 'Status & Pengiriman Pesanan' :
      issueCategory === 'pembayaran' ? 'Pembayaran QRIS / E-Commerce' :
      issueCategory === 'aplikasi' ? 'Aplikasi / Lisensi / Key Game' :
      'Pertanyaan Umum & Event'
    }\n`;
    if (userQuestion.trim()) {
      msg += `💬 *Pertanyaan:* ${userQuestion.trim()}\n`;
    } else {
      msg += `Saya ingin konsultasi langsung dengan admin mengenai transaksi saya.`;
    }

    const url = storeService.generateWhatsAppLink(adminPhone, msg);
    window.open(url, '_blank');
  };

  const handleSendEmail = () => {
    const subject = `Bantuan Kendala ${storeName} ${invoiceRef ? `- Invoice ${invoiceRef}` : ''}`;
    let body = `Halo Admin ${storeName},\n\n`;
    if (invoiceRef.trim()) body += `Kode Invoice: ${invoiceRef}\n`;
    body += `Kategori Kendala: ${issueCategory}\n\n`;
    body += `Pertanyaan / Masalah:\n${userQuestion || 'Mohon bantuan mengenai transaksi saya.'}\n\n`;
    body += `Terima kasih.`;

    const url = storeService.generateEmailLink(adminEmail, subject, body);
    window.location.href = url;
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-lg">
        
        {/* Modal Header */}
        <div className="modal-header bg-gradient-to-r from-emerald-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-400 to-teal-500 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-emerald-500/20">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-heading font-bold text-white text-base">
                Pusat Bantuan & Tanya Admin
              </h3>
              <p className="text-[11px] text-slate-400">
                Punya kendala atau pertanyaan? Admin siap membantu 24/7
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

        {/* Modal Body */}
        <div className="modal-body space-y-4">
          
          {/* Official Admin Contacts Card */}
          <div className="p-4 rounded-xl bg-slate-900 border border-white/10 space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4 text-cyan-400" />
              <span>Kontak Resmi Admin Zhafranstore.id</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
              
              {/* WhatsApp Admin */}
              <a
                href={storeService.generateWhatsAppLink(adminPhone, "Halo Admin Zhafranstore, saya ingin konsultasi permasalahan saya.")}
                target="_blank"
                rel="noreferrer"
                className="p-3 rounded-lg bg-emerald-950/40 hover:bg-emerald-900/60 border border-emerald-500/30 flex items-center gap-2.5 transition text-emerald-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-md bg-emerald-500 text-slate-950 flex items-center justify-center font-bold">
                  <MessageCircle className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[10px] text-slate-400 font-semibold">Nomor WhatsApp Admin</div>
                  <div className="font-mono font-bold text-xs">{adminPhone}</div>
                </div>
              </a>

              {/* Email Admin */}
              <a
                href={storeService.generateEmailLink(adminEmail, "Konsultasi Kendala Zhafranstore.id", "Halo Admin Zhafranstore,")}
                className="p-3 rounded-lg bg-cyan-950/40 hover:bg-cyan-900/60 border border-cyan-500/30 flex items-center gap-2.5 transition text-cyan-300 hover:text-white"
              >
                <div className="w-7 h-7 rounded-md bg-cyan-500 text-slate-950 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="truncate">
                  <div className="text-[10px] text-slate-400 font-semibold">Email Resmi Admin</div>
                  <div className="font-mono font-bold text-xs truncate">{adminEmail}</div>
                </div>
              </a>

            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
              <span>Waktu respon rata-rata: <strong>1 - 5 Menit</strong> (Jam Operasional Aktif).</span>
            </div>
          </div>

          {/* Form Tanya Admin Apa Permasalahannya */}
          <div className="space-y-3 pt-1">
            <div className="font-heading font-bold text-white text-xs sm:text-sm">
              Tulis Pertanyaan / Masalah Kamu:
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Jenis Permasalahan</label>
              <select
                value={issueCategory}
                onChange={(e) => setIssueCategory(e.target.value)}
                className="form-select text-xs"
              >
                <option value="tanya_pesanan">📦 Pesanan Belum Masuk / Cek Status</option>
                <option value="pembayaran">💳 Kendala Pembayaran QRIS / Salah Nominal</option>
                <option value="aplikasi">🎮 Download Aplikasi / Serial Key Game</option>
                <option value="lainnya">❓ Pertanyaan Lainnya / Request Game</option>
              </select>
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">
                <span>Kode Invoice Pesanan</span>
                <span className="text-[10px] text-slate-500">(Opsional jika ada)</span>
              </label>
              <input
                type="text"
                placeholder="Contoh: INV-1729837492-491"
                value={invoiceRef}
                onChange={(e) => setInvoiceRef(e.target.value)}
                className="form-input text-xs"
              />
            </div>

            <div className="form-group !mb-0">
              <label className="form-label">Jelaskan Permasalahan Kamu</label>
              <textarea
                rows={3}
                placeholder="Tuliskan kendala yang kamu alami secara singkat agar admin dapat langsung memproses solusinya..."
                value={userQuestion}
                onChange={(e) => setUserQuestion(e.target.value)}
                className="form-textarea text-xs"
              />
            </div>

            {/* Quick Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleSendWA}
                className="btn-whatsapp py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-heading font-bold"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Kirim ke WhatsApp Admin</span>
              </button>

              <button
                type="button"
                onClick={handleSendEmail}
                className="btn-secondary py-2.5 px-4 rounded-xl flex items-center justify-center gap-2 text-xs font-heading font-bold text-cyan-300 hover:text-white"
              >
                <Mail className="w-4 h-4 text-cyan-400" />
                <span>Kirim via Email</span>
              </button>
            </div>

            {onOpenLatestChat && (
              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenLatestChat();
                  }}
                  className="text-xs text-violet-400 hover:underline inline-flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Atau buka Ruang Chat Pesanan yang sedang aktif</span>
                </button>
              </div>
            )}

          </div>

        </div>

      </div>
    </div>
  );
}
