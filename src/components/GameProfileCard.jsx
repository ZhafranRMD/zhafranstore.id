import React from 'react';
import { 
  CheckCircle2, 
  Globe2, 
  ShieldCheck, 
  Trophy, 
  Zap, 
  User, 
  Layers,
  Sparkles,
  Server
} from 'lucide-react';

export default function GameProfileCard({ profile, compact = false }) {
  if (!profile || !profile.isValid) return null;

  const getBorderColor = () => {
    switch (profile.gameKey) {
      case 'roblox': return 'border-amber-500/40 hover:border-amber-400 bg-gradient-to-br from-amber-950/30 via-slate-900/90 to-slate-950';
      case 'minecraft': return 'border-emerald-500/40 hover:border-emerald-400 bg-gradient-to-br from-emerald-950/30 via-slate-900/90 to-slate-950';
      case 'freefire': return 'border-orange-500/40 hover:border-orange-400 bg-gradient-to-br from-orange-950/30 via-slate-900/90 to-slate-950';
      case 'mobilelegends': return 'border-cyan-500/40 hover:border-cyan-400 bg-gradient-to-br from-cyan-950/30 via-slate-900/90 to-slate-950';
      default: return 'border-white/20 bg-slate-900/90';
    }
  };

  const getBadgeColor = () => {
    switch (profile.gameKey) {
      case 'roblox': return 'bg-amber-500/20 text-amber-300 border-amber-500/40';
      case 'minecraft': return 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
      case 'freefire': return 'bg-orange-500/20 text-orange-300 border-orange-500/40';
      case 'mobilelegends': return 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40';
      default: return 'bg-slate-800 text-slate-300 border-white/10';
    }
  };

  return (
    <div className={`p-3.5 rounded-2xl border shadow-lg transition-all animate-fadeIn ${getBorderColor()}`}>
      
      {/* Header bar: Game & Worldwide Status */}
      <div className="flex items-center justify-between pb-2 border-b border-white/10 gap-2">
        <div className="flex items-center gap-1.5">
          <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getBadgeColor()}`}>
            {profile.photoNumber || profile.game}
          </span>
          <span className="text-xs font-heading font-black text-white">
            {profile.game}
          </span>
        </div>

        <span className="badge badge-emerald text-[9px] flex items-center gap-1 font-bold">
          <Globe2 className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>Terdeteksi Seluruh Dunia</span>
        </span>
      </div>

      {/* Main Profile Info: Avatar + Nickname + IDs */}
      <div className="flex items-center gap-3 pt-2.5">
        
        {/* Avatar with Status Ring */}
        <div className="relative flex-shrink-0">
          <div className="w-12 h-12 rounded-xl bg-slate-950 p-1 border-2 border-cyan-400/50 shadow-md shadow-cyan-500/20 overflow-hidden flex items-center justify-center">
            <img 
              src={profile.avatarUrl} 
              alt={profile.displayName || profile.game} 
              className="w-full h-full object-contain rounded-lg"
              onError={(e) => {
                if (profile.fallbackAvatar && e.currentTarget.src !== profile.fallbackAvatar) {
                  e.currentTarget.src = profile.fallbackAvatar;
                }
              }}
            />
          </div>
          <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
          </span>
        </div>

        {/* Player Details */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h5 className="font-heading font-black text-sm text-white truncate">
              {profile.displayName || profile.nickname || profile.username || profile.identifier}
            </h5>
            <span className="inline-flex items-center px-1.5 py-0.2 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
              <CheckCircle2 className="w-2.5 h-2.5 mr-0.5" />
              Verified
            </span>
          </div>

          {/* Identifier and Zone / Server ID */}
          <div className="text-[11px] text-slate-300 font-mono mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span>ID: <strong className="text-cyan-300">{profile.userId || profile.identifier}</strong></span>
            {profile.zoneId && (
              <span>Zone: <strong className="text-amber-300">({profile.zoneId})</strong></span>
            )}
          </div>
        </div>
      </div>

      {/* Rank / Tier & Server Details */}
      <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5 text-xs">
        
        {/* Rank / Tier Badge */}
        {profile.rankTier && (
          <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-300 bg-amber-950/40 px-2 py-1 rounded-lg border border-amber-500/20">
            <Trophy className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
            <span className="truncate">{profile.rankTier}</span>
          </div>
        )}

        {/* Server & Global Cluster Route */}
        <div className="flex flex-wrap items-center justify-between text-[10px] text-slate-400 gap-1 pt-0.5">
          <div className="flex items-center gap-1 truncate">
            <Server className="w-3 h-3 text-cyan-400 flex-shrink-0" />
            <span className="text-slate-300">{profile.region || 'Server Global'}</span>
          </div>
          {profile.detectionTime && (
            <span className="text-slate-500">
              Cek: {profile.detectionTime}
            </span>
          )}
        </div>

        {/* Extra Specification if exists */}
        {profile.extraDetails && (
          <div className="text-[10px] text-slate-400 italic">
            ✓ {profile.extraDetails}
          </div>
        )}
      </div>

    </div>
  );
}
