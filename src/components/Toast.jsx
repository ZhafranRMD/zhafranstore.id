import React from 'react';
import { CheckCircle2, X } from 'lucide-react';

export default function Toast({ message, onClose }) {
  if (!message) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-slate-900/95 border border-cyan-500/40 text-white shadow-2xl shadow-cyan-500/20 backdrop-blur-md animate-slideUp">
      <CheckCircle2 className="w-5 h-5 text-cyan-400 flex-shrink-0" />
      <span className="text-xs sm:text-sm font-medium">{message}</span>
      <button 
        onClick={onClose}
        className="text-slate-400 hover:text-white p-1 ml-2"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
