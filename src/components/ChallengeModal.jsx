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
  HelpCircle
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { storeService } from '../services/storeService.js';

export default function ChallengeModal({ isOpen, onClose, storeSettings, showToast }) {
  if (!isOpen) return null;

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
  const [platform, setPlatform] = useState('tiktok'); // tiktok, youtube, instagram, other
  const [accountHandle, setAccountHandle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [viewsCount, setViewsCount] = useState('1000');
  const [whatsappNumber, setWhatsappNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedClaim, setSubmittedClaim] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

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
      setErrorMsg("Harap masukkan nomor WhatsApp aktif untuk pengiriman voucher hadiah.");
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');

    try {
      const payload = {
        platform,
        accountHandle,
        videoUrl,
        viewsCount: Number(viewsCount) || 1000,
        whatsappNumber,
        participantCode,
        rewardRequested: "Diskon Promo 10% - 25% Zhafranstore",
        created_at: new Date().toISOString()
      };

      const result = await storeService.submitChallenge(payload);
      setSubmittedClaim(result);

      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 }
      });

      if (showToast) showToast("Klaim Challenge 1K Views berhasil dikirim!");
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
                  Event Challenge Video & Hadiah Diskon
                </h3>
                <span className="badge badge-amber text-[10px] animate-pulse">
                  🔥 1K Views
                </span>
              </div>
              <p className="text-[11px] text-slate-300">
                Buat video tentang Zhafranstore.id, dapatkan 1.000 penonton & menangkan voucher diskon s/d 25%!
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
          
          {submittedClaim ? (
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
                  Tim Admin Zhafranstore.id sedang memverifikasi video kamu (minimal 1K views & kode unik di Bio). Kode voucher diskon akan dikirimkan langsung ke nomor WhatsApp kamu:
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 border border-white/10 max-w-md mx-auto text-left text-xs space-y-2">
                <div className="flex justify-between">
                  <span className="text-slate-400">ID Klaim:</span>
                  <span className="font-mono font-bold text-cyan-400">{submittedClaim.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Platform:</span>
                  <span className="font-bold uppercase text-white">{submittedClaim.platform}</span>
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
                  <span className="badge badge-amber text-[10px]">Sedang Ditinjau Admin</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/20 max-w-md mx-auto text-xs text-cyan-300">
                💡 <strong>Tips Tambahan:</strong> Sambil menunggu verifikasi, kamu juga bisa langsung memakai kode diskon promo yang aktif di toko kami saat checkout: <code className="font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded">indonesiastore</code> atau <code className="font-bold text-white bg-slate-950 px-1.5 py-0.5 rounded">4storezhafran</code>!
              </div>

              <button
                onClick={onClose}
                className="btn-primary text-xs py-2.5 px-6 rounded-xl mx-auto"
              >
                Kembali ke Toko
              </button>
            </div>
          ) : (
            <>
              {/* STEP 1: KODE UNIK BIO */}
              <div className="p-4 rounded-xl bg-slate-900/90 border border-amber-500/30 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <span className="badge badge-amber text-[10px] mb-1">Langkah 1 (Wajib)</span>
                    <h4 className="font-heading font-bold text-white text-sm">
                      Kode Unik Verifikasi Bio Kamu:
                    </h4>
                  </div>
                  <button
                    onClick={generateNewCode}
                    className="text-[11px] text-cyan-400 hover:underline self-start sm:self-auto"
                  >
                    Acak Kode Baru
                  </button>
                </div>

                <div className="flex items-center gap-2 p-2.5 bg-slate-950 border border-white/10 rounded-xl">
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
                  ⚠️ <strong>Penting:</strong> Salin kode di atas dan tempelkan ke <strong>Bio profil TikTok, YouTube, atau Instagram</strong> kamu sebelum mengirimkan klaim hadiah agar terbukti sebagai pemilik sah video.
                </div>
              </div>

              {/* STEP 2: PANDUAN CARA IKUT */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/10 space-y-3">
                <h4 className="font-heading font-bold text-white text-sm flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                  <span>Panduan Cara Ikut & Syarat Challenge</span>
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="font-bold text-cyan-400">1. Pasang Kode di Bio</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Tempelkan kode unik kamu di bio TikTok, YouTube, atau Instagram.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="font-bold text-violet-400">2. Buat & Upload Video</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Review gamepass/game, gameplay, atau promo belanja hemat di Zhafranstore.id.
                    </p>
                  </div>

                  <div className="p-3 rounded-lg bg-slate-950/60 border border-white/5 space-y-1">
                    <div className="font-bold text-emerald-400">3. Raih 1K Views & Klaim</div>
                    <p className="text-slate-400 text-[11px] leading-relaxed">
                      Capai 1.000 penonton, masukkan link video kamu di bawah, dan raih diskon promo!
                    </p>
                  </div>
                </div>
              </div>

              {/* STEP 3: FORMULIR KLAIM HADIAH */}
              <form onSubmit={handleSubmitClaim} className="space-y-4">
                <div className="font-heading font-bold text-white text-sm flex items-center gap-2">
                  <Send className="w-4 h-4 text-emerald-400" />
                  <span>Formulir Pengajuan Klaim Hadiah</span>
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                {/* Pilih Platform */}
                <div className="form-group !mb-0">
                  <label className="form-label">Pilih Platform Media Sosial *</label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPlatform('tiktok')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        platform === 'tiktok'
                          ? 'bg-pink-500/20 border-pink-500 text-pink-300'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>TikTok</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlatform('youtube')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        platform === 'youtube'
                          ? 'bg-rose-500/20 border-rose-500 text-rose-300'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>YouTube</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPlatform('instagram')}
                      className={`p-2.5 rounded-xl border text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                        platform === 'instagram'
                          ? 'bg-purple-500/20 border-purple-500 text-purple-300'
                          : 'bg-slate-900 border-white/10 text-slate-400 hover:text-white'
                      }`}
                    >
                      <span>Instagram</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Username / Nomor Akun {platform.toUpperCase()} *</span>
                    </label>
                    <input
                      type="text"
                      placeholder={`Contoh: @zhafran_gamer / ${platform}_id`}
                      value={accountHandle}
                      onChange={(e) => setAccountHandle(e.target.value)}
                      className="form-input text-xs"
                      required
                    />
                  </div>

                  <div className="form-group !mb-0">
                    <label className="form-label">
                      <span>Estimasi Jumlah Views Saat Ini *</span>
                    </label>
                    <input
                      type="number"
                      placeholder="Contoh: 1200"
                      value={viewsCount}
                      onChange={(e) => setViewsCount(e.target.value)}
                      className="form-input text-xs"
                      min="1000"
                      required
                    />
                  </div>
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">
                    <span>Tautan / URL Video Konten (Min. 1K Views) *</span>
                  </label>
                  <input
                    type="url"
                    placeholder={`https://${platform === 'tiktok' ? 'tiktok.com/@user/video/...' : platform === 'youtube' ? 'youtube.com/shorts/...' : 'instagram.com/reel/...'}`}
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="form-input text-xs"
                    required
                  />
                </div>

                <div className="form-group !mb-0">
                  <label className="form-label">
                    <span>Nomor WhatsApp Aktif Kamu *</span>
                    <span className="text-[10px] text-slate-400">Untuk menerima voucher diskon</span>
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
                  <span>{isSubmitting ? 'Mengirimkan Klaim...' : 'Kirim Klaim Challenge 1K Views'}</span>
                </button>
              </form>
            </>
          )}

        </div>

      </div>
    </div>
  );
}
