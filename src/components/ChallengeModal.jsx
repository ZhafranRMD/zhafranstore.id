import React, { useState, useEffect } from 'react';
import { 
  X, 
  Trophy, 
  Sparkles, 
  Copy, 
  Check, 
  Video, 
  Eye, 
  Share2, 
  CheckCircle2, 
  Send,
  AlertCircle,
  Percent,
  Flame,
  HelpCircle,
  Gift,
  Clock
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService } from '../services/storeService.js';

export default function ChallengeModal({ isOpen, onClose, storeSettings, showToast }) {
  if (!isOpen) return null;

  // Events created by Admin
  const [events, setEvents] = useState([]);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [loadingEvents, setLoadingEvents] = useState(true);

  // Participant Bio Random Code
  const [participantCode, setParticipantCode] = useState(() => {
    let saved = localStorage.getItem('zhafran_challenge_code');
    if (!saved) {
      const rand = Math.floor(1000 + Math.random() * 9000);
      saved = `ZHAFRAN-${rand}-CREATOR`;
      localStorage.setItem('zhafran_challenge_code', saved);
    }
    return saved;
  });

  const [copiedCode, setCopiedCode] = useState(false);

  // Form claim states
  const [platform, setPlatform] = useState('tiktok'); // tiktok, youtube, instagram
  const [accountHandle, setAccountHandle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [viewsCount, setViewsCount] = useState('1000');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Fetch admin events on modal open
  useEffect(() => {
    if (isOpen) {
      fetchEvents();
      setSubmittedClaim(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  const fetchEvents = async () => {
    setLoadingEvents(true);
    const list = await storeService.getEvents();
    const activeList = list.filter(e => e.is_active);
    setEvents(activeList);
    if (activeList.length > 0) {
      setSelectedEventId(activeList[0].id);
    }
    setLoadingEvents(false);
  };

  const currentEvent = events.find(e => e.id === selectedEventId) || events[0];

  const generateNewCode = () => {
    const rand = Math.floor(1000 + Math.random() * 9000);
    const newCode = `ZHAFRAN-${rand}-CREATOR`;
    setParticipantCode(newCode);
    localStorage.setItem('zhafran_challenge_code', newCode);
    if (showToast) showToast("Kode unik baru berhasil dibuat!");
  };

  const copyCode = () => {
    navigator.clipboard.writeText(participantCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
    if (showToast) showToast("Kode unik disalin! Tempelkan di Bio akun kamu.");
  };

  const handleSubmitClaim = async (e) => {
    e.preventDefault();
    if (!accountHandle.trim()) {
      setErrorMsg("Harap masukkan username / nomor akun platform kamu.");
      return;
    }
    if (!videoUrl.trim()) {
      setErrorMsg("Harap masukkan tautan / link video konten kamu.");
      return;
    }
    if (!whatsappNumber.trim()) {
      setErrorMsg("Harap masukkan nomor WhatsApp aktif untuk pengiriman voucher/hadiah.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        event_id: currentEvent?.id || 'general',
        event_title: currentEvent?.title || 'Challenge Hadiah Zhafranstore',
        reward_type: currentEvent?.reward_type || 'discount',
        reward_value: currentEvent?.reward_value || 'Diskon / Hadiah Spesial',
        platform,
        accountHandle,
        videoUrl,
        viewsCount: Number(viewsCount) || (currentEvent?.min_views || 1000),
        whatsappNumber,
        participantCode,
        created_at: new Date().toISOString()
      };

      const result = await storeService.submitChallenge(payload);
      setSubmittedClaim(result);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 }
      });

      if (showToast) showToast("Klaim Challenge berhasil dikirim!");
    } catch (err) {
      console.error("Challenge submit error:", err);
      setErrorMsg("Gagal mengirim klaim. Silakan coba lagi.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-lg max-h-[92vh]">
        
        {/* Header */}
        <div className="modal-header bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-cyan-500/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-amber-600 text-slate-950 flex items-center justify-center font-bold shadow-lg shadow-amber-500/25">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-white text-base sm:text-lg">
                  Event & Challenge Hadiah
                </h3>
                <span className="badge badge-amber text-[10px] animate-pulse">
                  Event Resmi Toko
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Ikuti event dan tantangan resmi dari Admin untuk memenangkan diskon & produk game gratis!
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
        <div className="modal-body space-y-5 overflow-y-auto">
          
          {loadingEvents ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Memeriksa event aktif dari Admin...
            </div>
          ) : events.length === 0 ? (
            /* JIKA BELUM ADA EVENT YANG DIBUAT ADMIN */
            <div className="py-12 px-6 text-center space-y-4 max-w-md mx-auto">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
                <Clock className="w-7 h-7" />
              </div>
              <div>
                <h4 className="font-heading font-bold text-lg text-white">Belum Ada Event Aktif</h4>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                  Saat ini belum ada event atau challenge hadiah yang dibuka oleh Admin Zhafranstore.id.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-slate-900 border border-white/10 text-xs text-slate-400 text-left space-y-1">
                <div className="font-bold text-cyan-300">💡 Belanja Tetap Hemat!</div>
                <div>Kamu tetap bisa mendapatkan diskon saat checkout dengan kode promo toko seperti: <code className="text-emerald-400 font-bold bg-slate-950 px-1 py-0.5 rounded">indonesiastore</code> atau <code className="text-emerald-400 font-bold bg-slate-950 px-1 py-0.5 rounded">4storezhafran</code>!</div>
              </div>

              <button
                onClick={onClose}
                className="btn-primary text-xs py-2.5 px-6 rounded-xl"
              >
                Kembali ke Toko
              </button>
            </div>
          ) : submittedClaim ? (
            /* SUCCESS CLAIM SCREEN */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <h4 className="font-heading font-extrabold text-xl text-white">
                  Klaim Challenge Berhasil Dikirim!
                </h4>
                <p className="text-xs text-slate-300 mt-1 max-w-md mx-auto leading-relaxed">
                  Tim Admin Zhafranstore.id sedang memverifikasi video kamu. Hadiah akan dikirimkan langsung ke nomor WhatsApp kamu:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Klaim:</span>
                  <span className="font-mono font-bold text-cyan-400">{submittedClaim.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Event:</span>
                  <span className="font-bold text-white">{submittedClaim.event_title}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Akun:</span>
                  <span className="font-semibold text-white">{submittedClaim.accountHandle}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Kode Bio:</span>
                  <span className="font-mono font-bold text-amber-400">{submittedClaim.participantCode}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Status Verifikasi:</span>
                  <span className="badge badge-amber text-[10px]">Menunggu Verifikasi Admin</span>
                </div>
              </div>

              <button
                onClick={onClose}
                className="btn-primary text-xs py-2.5 px-6 rounded-xl mx-auto"
              >
                Kembali ke Toko
              </button>
            </div>
          ) : (
            /* EVENT TERSEDIA DARI ADMIN */
            <>
              {/* Event Selector if multiple */}
              {events.length > 1 && (
                <div className="form-group !mb-0">
                  <label className="form-label">Pilih Event yang Diikuti:</label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="form-select text-xs"
                  >
                    {events.map(evt => (
                      <option key={evt.id} value={evt.id}>
                        {evt.title} ({evt.reward_value})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* DETAIL EVENT DARI ADMIN */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-slate-900 to-slate-900/90 border border-amber-500/30 space-y-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="font-heading font-black text-white text-base">
                    {currentEvent?.title}
                  </h4>
                  <span className="badge badge-emerald text-[10px]">
                    🎁 Hadiah: {currentEvent?.reward_value}
                  </span>
                </div>

                <div className="text-xs text-slate-300 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Platform: <strong className="text-white">{currentEvent?.platform}</strong></span>
                  <span>Minimal Penonton: <strong className="text-cyan-300">{currentEvent?.min_views || 1000}+ views</strong></span>
                </div>

                {currentEvent?.description && (
                  <p className="text-xs text-slate-300 bg-slate-950/60 p-3 rounded-lg border border-white/5 leading-relaxed">
                    {currentEvent.description}
                  </p>
                )}
              </div>

              {/* SYARAT VERIFIKASI: VIDEO PENGALAMAN MEMBELI */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-violet-950/60 via-slate-900 to-cyan-950/60 border border-violet-500/40 space-y-2.5">
                <div className="flex items-center gap-2 text-violet-300 font-heading font-black text-xs sm:text-sm">
                  <Video className="w-4 h-4 text-violet-400" />
                  <span>Syarat Mutlak Terverifikasi: Video Pengalaman Membeli di Zhafranstore.id</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Agar klaim kamu <strong>bisa terverifikasi</strong> oleh Admin, kamu wajib membuat video tentang <strong>pengalaman membeli di Zhafranstore.id</strong> (ulasan kecepatan proses 1-5 menit, unboxing lisensi/item, atau gameplay dengan item game yang kamu beli).
                </p>
                <div className="text-[11px] text-cyan-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Sertakan tagar <strong>#zhafranstore #zhafranstoreid</strong> dan cantumkan kode unik bio di bawah.</span>
                </div>
              </div>

              {/* STEP 1: KODE UNIK BIO */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-cyan-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="badge badge-cyan text-[10px] mb-1">Langkah 1: Pasang Kode di Bio Akun</span>
                    <h5 className="font-heading font-bold text-white text-xs sm:text-sm">
                      Kode Unik Verifikasi Kamu:
                    </h5>
                  </div>
                  <button
                    onClick={generateNewCode}
                    className="text-[11px] text-cyan-400 hover:underline self-start sm:self-auto"
                  >
                    Acak Kode Baru
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2 bg-slate-950 border border-white/10 rounded-xl">
                  <span className="font-mono font-black text-amber-300 text-sm sm:text-base tracking-wider flex-1 px-2 select-all">
                    {participantCode}
                  </span>
                  <button
                    onClick={copyCode}
                    className="btn-primary text-xs py-2 px-3 rounded-lg flex items-center gap-1.5"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Tersalin' : 'Salin Kode'}</span>
                  </button>
                </div>

                <div className="text-[11px] text-slate-300 leading-relaxed">
                  Pasang kode di atas pada <strong>Bio akun {currentEvent?.platform}</strong> kamu agar admin dapat mengonfirmasi kepemilikan video saat verifikasi.
                </div>
              </div>

              {/* FORMULIR KLAIM HADIAH */}
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Langkah 2: Isi Formulir Klaim Hadiah</span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="form-group !mb-0">
                  <label className="form-label">Platform Video Konten *</label>
                  <div className="grid grid-cols-3 gap-2">
                    {['tiktok', 'youtube', 'instagram'].map(plat => (
                      <button
                        key={plat}
                        type="button"
                        onClick={() => setPlatform(plat)}
                        className={`p-2.5 rounded-xl border text-xs font-bold transition uppercase ${
                          platform === plat
                            ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                            : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                        }`}
                      >
                        {plat}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Username / Nomor Akun {platform.toUpperCase()} *</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: @akun_${platform}`}
                      value={accountHandle}
                      onChange={(e) => setAccountHandle(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Jumlah Penonton / Views Saat Ini *</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 1250"
                      value={viewsCount}
                      onChange={(e) => setViewsCount(e.target.value)}
                      className="form-input text-xs"
                      min={currentEvent?.min_views || 1000}
                      required
                    />
                  </div>
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">
                    <span>Tautan / Link Video Konten *</span>
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">
                    <span>Nomor WhatsApp Aktif Kamu *</span>
                    <span className="text-[10px] text-slate-400">Untuk menerima voucher/hadiah</span>
                  </label>
                  <input
                    type="tel"
                    placeholder="Contoh: 081234567890"
                    value={whatsappNumber}
                    onChange={(e) => setWhatsappNumber(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full btn-primary py-3 rounded-xl font-heading font-extrabold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-cyan-500/25"
                >
                  <Trophy className="w-4 h-4 text-slate-950" />
                  <span>{isSubmitting ? 'Mengirimkan Klaim...' : 'Klaim Hadiah Event Sekarang'}</span>
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
