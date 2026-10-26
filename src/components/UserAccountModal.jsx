import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Mail, 
  ShieldCheck, 
  Globe2, 
  CheckCircle2, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Gamepad2, 
  RefreshCw,
  AlertCircle,
  HelpCircle,
  Save
} from 'lucide-react';
import { GAME_ASSETS, detectWorldwideAccount } from '../data/gameAssets.js';
import { storeService } from '../services/storeService.js';
import GameProfileCard from './GameProfileCard.jsx';

export default function UserAccountModal({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  showToast
}) {
  if (!isOpen) return null;

  const [activeMode, setActiveMode] = useState(userProfile?.email ? 'email' : 'guest');
  const [emailInput, setEmailInput] = useState(userProfile?.email || '');
  const [whatsappInput, setWhatsappInput] = useState(userProfile?.whatsapp || '');

  // Game accounts state
  const [robloxId, setRobloxId] = useState(userProfile?.gameAccounts?.roblox || '');
  const [minecraftId, setMinecraftId] = useState(userProfile?.gameAccounts?.minecraft || '');
  const [freefireId, setFreefireId] = useState(userProfile?.gameAccounts?.freefire || '');
  const [mlbbUserId, setMlbbUserId] = useState(userProfile?.gameAccounts?.mobilelegends?.userId || '');
  const [mlbbZoneId, setMlbbZoneId] = useState(userProfile?.gameAccounts?.mobilelegends?.zoneId || '');

  // Live detection result states
  const [detectionResults, setDetectionResults] = useState(userProfile?.verifiedAccounts || {});
  const [detectingGame, setDetectingGame] = useState(null);

  useEffect(() => {
    if (userProfile) {
      setActiveMode(userProfile.email ? 'email' : 'guest');
      setEmailInput(userProfile.email || '');
      setWhatsappInput(userProfile.whatsapp || '');
      setRobloxId(typeof userProfile.gameAccounts?.roblox === 'string' ? userProfile.gameAccounts.roblox : userProfile.gameAccounts?.roblox?.identifier || '');
      setMinecraftId(typeof userProfile.gameAccounts?.minecraft === 'string' ? userProfile.gameAccounts.minecraft : userProfile.gameAccounts?.minecraft?.identifier || '');
      setFreefireId(typeof userProfile.gameAccounts?.freefire === 'string' ? userProfile.gameAccounts.freefire : userProfile.gameAccounts?.freefire?.identifier || '');
      const ml = userProfile.gameAccounts?.mobilelegends;
      setMlbbUserId(typeof ml === 'string' ? ml : ml?.userId || ml?.identifier || '');
      setMlbbZoneId(typeof ml === 'object' ? ml?.zoneId || '' : '');
      
      const initialDet = { ...(userProfile.verifiedAccounts || {}) };
      const rId = typeof userProfile.gameAccounts?.roblox === 'string' ? userProfile.gameAccounts.roblox : userProfile.gameAccounts?.roblox?.identifier;
      const mId = typeof userProfile.gameAccounts?.minecraft === 'string' ? userProfile.gameAccounts.minecraft : userProfile.gameAccounts?.minecraft?.identifier;
      const fId = typeof userProfile.gameAccounts?.freefire === 'string' ? userProfile.gameAccounts.freefire : userProfile.gameAccounts?.freefire?.identifier;
      const mlId = typeof ml === 'string' ? ml : ml?.userId || ml?.identifier;
      const mlZone = typeof ml === 'object' ? ml?.zoneId || '' : '';

      if (rId && !initialDet.roblox) initialDet.roblox = detectWorldwideAccount('roblox', rId);
      if (mId && !initialDet.minecraft) initialDet.minecraft = detectWorldwideAccount('minecraft', mId);
      if (fId && !initialDet.freefire) initialDet.freefire = detectWorldwideAccount('freefire', fId);
      if (mlId && !initialDet.mobilelegends) initialDet.mobilelegends = detectWorldwideAccount('mobilelegends', mlId, mlZone);

      setDetectionResults(initialDet);
    }
  }, [userProfile, isOpen]);

  // Helper auto-sync profile to Owner & Store Manager
  const autoSyncToOwner = (customEmail, customRoblox, customMinecraft, customFf, customMlId, customMlZone, customDets) => {
    const curEmail = customEmail !== undefined ? customEmail : emailInput;
    if (!curEmail || !curEmail.trim()) return;

    const payload = {
      email: curEmail.trim(),
      isGuest: false,
      whatsapp: whatsappInput.trim(),
      gameAccounts: {
        roblox: { identifier: (customRoblox !== undefined ? customRoblox : robloxId).trim(), username: (customRoblox !== undefined ? customRoblox : robloxId).trim(), zoneId: '' },
        minecraft: { identifier: (customMinecraft !== undefined ? customMinecraft : minecraftId).trim(), username: (customMinecraft !== undefined ? customMinecraft : minecraftId).trim(), zoneId: '' },
        freefire: { identifier: (customFf !== undefined ? customFf : freefireId).trim(), userId: (customFf !== undefined ? customFf : freefireId).trim(), zoneId: '' },
        mobilelegends: {
          identifier: (customMlId !== undefined ? customMlId : mlbbUserId).trim(),
          userId: (customMlId !== undefined ? customMlId : mlbbUserId).trim(),
          zoneId: (customMlZone !== undefined ? customMlZone : mlbbZoneId).trim()
        }
      },
      verifiedAccounts: customDets || detectionResults,
      updatedAt: new Date().toISOString()
    };
    storeService.saveUserProfile(payload);
  };

  // 1. Live Roblox change & auto-detect
  const handleRobloxChange = (val) => {
    setRobloxId(val);
    if (!val || !val.trim()) {
      setDetectionResults(prev => ({ ...prev, roblox: null }));
      return;
    }
    if (val.trim().length >= 3) {
      const res = detectWorldwideAccount('roblox', val.trim());
      setDetectionResults(prev => {
        const next = { ...prev, roblox: res };
        autoSyncToOwner(undefined, val.trim(), undefined, undefined, undefined, undefined, next);
        return next;
      });
    }
  };

  // 2. Live Minecraft change & auto-detect
  const handleMinecraftChange = (val) => {
    setMinecraftId(val);
    if (!val || !val.trim()) {
      setDetectionResults(prev => ({ ...prev, minecraft: null }));
      return;
    }
    if (val.trim().length >= 3) {
      const res = detectWorldwideAccount('minecraft', val.trim());
      setDetectionResults(prev => {
        const next = { ...prev, minecraft: res };
        autoSyncToOwner(undefined, undefined, val.trim(), undefined, undefined, undefined, next);
        return next;
      });
    }
  };

  // 3. Live Free Fire change & auto-detect
  const handleFreefireChange = (val) => {
    setFreefireId(val);
    if (!val || !val.trim()) {
      setDetectionResults(prev => ({ ...prev, freefire: null }));
      return;
    }
    const digits = val.replace(/[^0-9]/g, '');
    if (digits.length >= 7) {
      const res = detectWorldwideAccount('freefire', digits);
      setDetectionResults(prev => {
        const next = { ...prev, freefire: res };
        autoSyncToOwner(undefined, undefined, undefined, digits, undefined, undefined, next);
        return next;
      });
    }
  };

  // 4. Live Mobile Legends change & auto-detect
  const handleMlbbChange = (uid, zid) => {
    setMlbbUserId(uid);
    setMlbbZoneId(zid);
    if (!uid || !uid.trim()) {
      setDetectionResults(prev => ({ ...prev, mobilelegends: null }));
      return;
    }
    const digits = uid.replace(/[^0-9]/g, '');
    if (digits.length >= 5) {
      const res = detectWorldwideAccount('mobilelegends', digits, zid);
      setDetectionResults(prev => {
        const next = { ...prev, mobilelegends: res };
        autoSyncToOwner(undefined, undefined, undefined, undefined, digits, zid, next);
        return next;
      });
    }
  };

  // Run Manual Worldwide Detection with animation feedback
  const handleDetectAccount = (gameKey) => {
    setDetectingGame(gameKey);
    setTimeout(() => {
      let result;
      if (gameKey === 'roblox') {
        result = detectWorldwideAccount('roblox', robloxId);
      } else if (gameKey === 'minecraft') {
        result = detectWorldwideAccount('minecraft', minecraftId);
      } else if (gameKey === 'freefire') {
        result = detectWorldwideAccount('freefire', freefireId);
      } else if (gameKey === 'mobilelegends') {
        result = detectWorldwideAccount('mobilelegends', mlbbUserId, mlbbZoneId);
      }

      setDetectionResults(prev => {
        const next = {
          ...prev,
          [gameKey]: result
        };
        autoSyncToOwner(undefined, undefined, undefined, undefined, undefined, undefined, next);
        return next;
      });
      setDetectingGame(null);

      if (result?.isValid && showToast) {
        showToast(`Profil ${result.game} Berhasil Muncul & Terdeteksi Seluruh Dunia 🌐`);
      }
    }, 350);
  };

  // Save Complete Profile
  const handleSaveProfile = async (e) => {
    if (e) e.preventDefault();

    if (activeMode === 'email' && !emailInput.trim()) {
      if (showToast) showToast('Harap masukkan alamat email kamu.');
      return;
    }

    const updatedProfile = {
      email: activeMode === 'email' ? emailInput.trim() : '',
      isGuest: activeMode === 'guest',
      whatsapp: whatsappInput.trim(),
      gameAccounts: {
        roblox: { identifier: robloxId.trim(), username: robloxId.trim(), zoneId: '' },
        minecraft: { identifier: minecraftId.trim(), username: minecraftId.trim(), zoneId: '' },
        freefire: { identifier: freefireId.trim(), userId: freefireId.trim(), zoneId: '' },
        mobilelegends: {
          identifier: mlbbUserId.trim(),
          userId: mlbbUserId.trim(),
          zoneId: mlbbZoneId.trim()
        }
      },
      verifiedAccounts: detectionResults,
      updatedAt: new Date().toISOString()
    };

    const saved = await storeService.saveUserProfile(updatedProfile);
    if (onProfileUpdated) onProfileUpdated(saved);
    if (showToast) {
      showToast(activeMode === 'email' 
        ? `Akun Email & 4 Game Global Berhasil Disimpan & Terkoneksi ke Owner!` 
        : 'Mode Tamu & Akun Game Berhasil Disimpan!');
    }
    onClose();
  };

  // Switch to Guest Mode
  const handleSwitchToGuest = async () => {
    const guest = storeService.setGuestMode();
    setEmailInput('');
    setActiveMode('guest');
    if (onProfileUpdated) onProfileUpdated(guest);
    if (showToast) showToast('Kamu kini berada dalam Mode Tamu (Guest).');
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content max-w-2xl">
        
        {/* Header */}
        <div className="modal-header bg-gradient-to-r from-cyan-500/10 via-purple-500/10 to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-400 to-blue-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <Globe2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-heading font-black text-white text-base">
                  Akun Pelanggan & Deteksi Game Global
                </h3>
                <span className="badge badge-cyan text-[10px]">Worldwide</span>
              </div>
              <p className="text-[11px] text-slate-400">
                Pilih masuk dengan email atau mode tamu, serta hubungkan akun game seluruh dunia
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body space-y-5">

          {/* Mode Switcher: Email vs Tamu */}
          <div className="p-3.5 rounded-2xl bg-slate-900 border border-white/10 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                <User className="w-4 h-4 text-cyan-400" />
                <span>Pilih Tipe Pengguna:</span>
              </span>
              <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold border ${
                activeMode === 'email' 
                  ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                  : 'bg-amber-500/15 text-amber-300 border-amber-500/30'
              }`}>
                {activeMode === 'email' ? '● Akun Email Terhubung' : '● Mode Tamu (Guest)'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setActiveMode('email')}
                className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition border ${
                  activeMode === 'email'
                    ? 'bg-gradient-to-r from-cyan-500 to-sky-600 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Masuk dengan Email</span>
              </button>

              <button
                type="button"
                onClick={() => { setActiveMode('guest'); handleSwitchToGuest(); }}
                className={`py-2.5 px-3 rounded-xl font-heading font-bold text-xs flex items-center justify-center gap-2 transition border ${
                  activeMode === 'guest'
                    ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-slate-950 border-amber-400 shadow-md shadow-amber-500/20'
                    : 'bg-slate-950/60 text-slate-400 border-white/10 hover:text-white hover:border-white/20'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                <span>Lanjut Sebagai Tamu</span>
              </button>
            </div>

            {/* Email Input Field if Email Mode */}
            {activeMode === 'email' ? (
              <div className="space-y-2 pt-2 border-t border-white/10 animate-fadeIn">
                <label className="text-xs font-semibold text-slate-300 flex items-center justify-between">
                  <span>Alamat Email Kamu:</span>
                  <span className="text-[10px] text-cyan-400">Sinkron ke Cloud & Otomatis Checkout</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="email"
                    placeholder="namaanda@gmail.com"
                    value={emailInput}
                    onChange={(e) => {
                      setEmailInput(e.target.value);
                      if (e.target.value.includes('@') && e.target.value.includes('.')) {
                        autoSyncToOwner(e.target.value);
                      }
                    }}
                    className="form-input text-xs flex-1"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="No. WA (Opsional)"
                    value={whatsappInput}
                    onChange={(e) => {
                      setWhatsappInput(e.target.value);
                    }}
                    className="form-input text-xs w-36 sm:w-44"
                  />
                </div>
              </div>
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-950/40 border border-white/5 text-[11px] text-slate-400 flex items-center gap-2 animate-fadeIn">
                <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0" />
                <span>
                  Dalam <strong>Mode Tamu</strong>, kamu tetap bisa belanja langsung dan akun game kamu tetap bisa dideteksi seluruh dunia saat checkout.
                </span>
              </div>
            )}
          </div>

          {/* Section: 4 Worldwide Game Accounts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                <h4 className="font-heading font-black text-white text-sm sm:text-base">
                  Tautkan Akun Game & Deteksi Seluruh Dunia
                </h4>
              </div>
              <span className="text-[10px] text-slate-400">4 Game Terhubung</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              
              {/* 1. ROBLOX CARD (Foto 1) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-amber-400/40 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={GAME_ASSETS.roblox.path} 
                      alt="Roblox" 
                      className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-amber-400/30"
                      onError={(e) => { e.target.src = GAME_ASSETS.roblox.dataUrl; }}
                    />
                    <div>
                      <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Roblox</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">FOTO 1</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Blox Fruits & Robux</div>
                    </div>
                  </div>
                  {detectionResults.roblox?.isValid && (
                    <span className="badge badge-emerald text-[9px]">Global ✓</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Username Roblox Global..."
                      value={robloxId}
                      onChange={(e) => handleRobloxChange(e.target.value)}
                      className="form-input text-xs py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      disabled={detectingGame === 'roblox'}
                      onClick={() => handleDetectAccount('roblox')}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1 whitespace-nowrap"
                      title="Deteksi Akun Roblox di Server Global"
                    >
                      <Globe2 className="w-3 h-3 text-cyan-400" />
                      <span>{detectingGame === 'roblox' ? '...' : 'Deteksi'}</span>
                    </button>
                  </div>

                  {detectionResults.roblox && (
                    detectionResults.roblox.isValid ? (
                      <GameProfileCard profile={detectionResults.roblox} />
                    ) : (
                      <div className="p-2 rounded-lg text-[10px] space-y-0.5 border bg-rose-950/40 border-rose-500/30 text-rose-300">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>{detectionResults.roblox.message}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 2. MINECRAFT CARD (Foto 2) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-emerald-500/40 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={GAME_ASSETS.minecraft.path} 
                      alt="Minecraft" 
                      className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-emerald-500/30"
                      onError={(e) => { e.target.src = GAME_ASSETS.minecraft.dataUrl; }}
                    />
                    <div>
                      <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Minecraft</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 font-mono">FOTO 2</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Java & Bedrock Edition</div>
                    </div>
                  </div>
                  {detectionResults.minecraft?.isValid && (
                    <span className="badge badge-emerald text-[9px]">Global ✓</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Gamertag / Microsoft IGN..."
                      value={minecraftId}
                      onChange={(e) => handleMinecraftChange(e.target.value)}
                      className="form-input text-xs py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      disabled={detectingGame === 'minecraft'}
                      onClick={() => handleDetectAccount('minecraft')}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1 whitespace-nowrap"
                      title="Deteksi Akun Minecraft Global"
                    >
                      <Globe2 className="w-3 h-3 text-cyan-400" />
                      <span>{detectingGame === 'minecraft' ? '...' : 'Deteksi'}</span>
                    </button>
                  </div>

                  {detectionResults.minecraft && (
                    detectionResults.minecraft.isValid ? (
                      <GameProfileCard profile={detectionResults.minecraft} />
                    ) : (
                      <div className="p-2 rounded-lg text-[10px] space-y-0.5 border bg-rose-950/40 border-rose-500/30 text-rose-300">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>{detectionResults.minecraft.message}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 3. FREE FIRE CARD (Foto 3) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-orange-500/40 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={GAME_ASSETS.freefire.path} 
                      alt="Free Fire" 
                      className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-orange-500/30"
                      onError={(e) => { e.target.src = GAME_ASSETS.freefire.dataUrl; }}
                    />
                    <div>
                      <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Free Fire</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-orange-500/20 text-orange-300 font-mono">FOTO 3</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Garena FF & Max</div>
                    </div>
                  </div>
                  {detectionResults.freefire?.isValid && (
                    <span className="badge badge-emerald text-[9px]">Global ✓</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="flex gap-1.5">
                    <input
                      type="text"
                      placeholder="Player ID (Angka)..."
                      value={freefireId}
                      onChange={(e) => handleFreefireChange(e.target.value)}
                      className="form-input text-xs py-1.5 flex-1"
                    />
                    <button
                      type="button"
                      disabled={detectingGame === 'freefire'}
                      onClick={() => handleDetectAccount('freefire')}
                      className="btn-secondary text-[11px] py-1.5 px-2.5 flex items-center gap-1 whitespace-nowrap"
                      title="Deteksi Akun Free Fire di Seluruh Dunia"
                    >
                      <Globe2 className="w-3 h-3 text-cyan-400" />
                      <span>{detectingGame === 'freefire' ? '...' : 'Deteksi'}</span>
                    </button>
                  </div>

                  {detectionResults.freefire && (
                    detectionResults.freefire.isValid ? (
                      <GameProfileCard profile={detectionResults.freefire} />
                    ) : (
                      <div className="p-2 rounded-lg text-[10px] space-y-0.5 border bg-rose-950/40 border-rose-500/30 text-rose-300">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>{detectionResults.freefire.message}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

              {/* 4. MOBILE LEGENDS CARD (Foto 4) */}
              <div className="p-3.5 rounded-2xl bg-slate-900/90 border border-white/10 hover:border-cyan-400/40 transition space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img 
                      src={GAME_ASSETS.mobilelegends.path} 
                      alt="Mobile Legends" 
                      className="w-8 h-8 rounded-lg object-contain bg-slate-950 p-0.5 border border-cyan-400/30"
                      onError={(e) => { e.target.src = GAME_ASSETS.mobilelegends.dataUrl; }}
                    />
                    <div>
                      <div className="font-heading font-bold text-white text-xs sm:text-sm flex items-center gap-1.5">
                        <span>Mobile Legends</span>
                        <span className="text-[9px] px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 font-mono">FOTO 4</span>
                      </div>
                      <div className="text-[10px] text-slate-400">Moonton MLBB</div>
                    </div>
                  </div>
                  {detectionResults.mobilelegends?.isValid && (
                    <span className="badge badge-emerald text-[9px]">Global ✓</span>
                  )}
                </div>

                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      placeholder="User ID..."
                      value={mlbbUserId}
                      onChange={(e) => handleMlbbChange(e.target.value, mlbbZoneId)}
                      className="form-input text-xs py-1.5"
                    />
                    <div className="flex gap-1">
                      <input
                        type="text"
                        placeholder="Zone ID (Server)..."
                        value={mlbbZoneId}
                        onChange={(e) => handleMlbbChange(mlbbUserId, e.target.value)}
                        className="form-input text-xs py-1.5 flex-1"
                      />
                      <button
                        type="button"
                        disabled={detectingGame === 'mobilelegends'}
                        onClick={() => handleDetectAccount('mobilelegends')}
                        className="btn-secondary text-[11px] py-1.5 px-2 flex items-center gap-1 whitespace-nowrap"
                        title="Deteksi Akun MLBB di Seluruh Dunia"
                      >
                        <Globe2 className="w-3 h-3 text-cyan-400" />
                        <span>{detectingGame === 'mobilelegends' ? '...' : 'Deteksi'}</span>
                      </button>
                    </div>
                  </div>

                  {detectionResults.mobilelegends && (
                    detectionResults.mobilelegends.isValid ? (
                      <GameProfileCard profile={detectionResults.mobilelegends} />
                    ) : (
                      <div className="p-2 rounded-lg text-[10px] space-y-0.5 border bg-rose-950/40 border-rose-500/30 text-rose-300">
                        <div className="font-bold flex items-center gap-1">
                          <AlertCircle className="w-3 h-3 text-rose-400" />
                          <span>{detectionResults.mobilelegends.message}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="modal-footer flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary text-xs py-2 px-4"
          >
            Tutup
          </button>

          <button
            type="button"
            onClick={handleSaveProfile}
            className="btn-primary text-xs py-2.5 px-5 flex items-center gap-2 font-bold shadow-md shadow-cyan-500/20"
          >
            <Save className="w-4 h-4 text-slate-950" />
            <span>Simpan Profil & Akun Game</span>
          </button>
        </div>

      </div>
    </div>
  );
}
