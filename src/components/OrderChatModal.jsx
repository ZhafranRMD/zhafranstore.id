import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  MessageSquare, 
  Send, 
  Download, 
  ExternalLink, 
  Copy, 
  Check, 
  MessageCircle, 
  Mail, 
  Package, 
  ShieldCheck, 
  Clock, 
  CheckCircle2,
  Sparkles,
  Smartphone
} from 'lucide-react';
import { storeService } from '../services/storeService.js';

export default function OrderChatModal({ 
  order, 
  isOpen, 
  onClose, 
  isAdmin = false,
  storeSettings,
  showToast 
}) {
  if (!isOpen || !order) return null;

  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);
  const messagesEndRef = useRef(null);

  // Admin App Delivery Form Toggle
  const [showDeliveryForm, setShowDeliveryForm] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    app_name: order.product_name || '',
    app_link: '',
    credentials: '',
    message: 'Halo kak! Berikut adalah aplikasi / item game resmi yang telah kamu beli:'
  });

  const adminPhone = storeSettings?.admin_whatsapp || "082542778554";
  const adminEmail = storeSettings?.admin_email || "zhafran.gibran09@gmail.com";

  // Load chat messages
  useEffect(() => {
    if (order?.id) {
      loadMessages();
    }
  }, [order?.id]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const loadMessages = async () => {
    const list = await storeService.getOrderMessages(order.id);
    if (list.length === 0) {
      // Auto initial greeting
      const initialGreeting = {
        sender: 'system',
        sender_name: 'Sistem Zhafranstore',
        text: `Pesanan ${order.id} berhasil terdaftar. Pembeli dan Admin dapat saling berkirim pesan di sini mengenai status pesanan, pertanyaan, atau serah terima aplikasi.`,
        createdAt: order.createdAt || new Date().toISOString()
      };
      setMessages([initialGreeting]);
    } else {
      setMessages(list);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const payload = {
      sender: isAdmin ? 'admin' : 'buyer',
      sender_name: isAdmin ? 'Admin Zhafranstore' : (order.game_username || 'Pembeli'),
      text: inputText.trim()
    };

    setInputText('');
    const newMsg = await storeService.sendOrderMessage(order.id, payload);
    setMessages(prev => [...prev, newMsg]);
  };

  const handleDeliverApp = async (e) => {
    e.preventDefault();
    if (!deliveryData.app_link.trim() && !deliveryData.credentials.trim()) {
      alert("Masukkan minimal Link Download Aplikasi atau Kredensial Akun!");
      return;
    }

    const deliveryMsg = await storeService.deliverApplication(order.id, deliveryData);
    setMessages(prev => [...prev, deliveryMsg]);
    setShowDeliveryForm(false);
    if (showToast) showToast("Aplikasi berhasil dikirimkan ke pembeli di ruang chat!");
  };

  const copyText = (text) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
    if (showToast) showToast("Berhasil disalin ke clipboard!");
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content modal-content-lg h-[92vh] max-sm:h-full max-sm:max-h-full max-sm:w-full max-sm:rounded-none flex flex-col">
        
        {/* Header */}
        <div className="modal-header bg-slate-900/90 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-sky-600 flex items-center justify-center text-slate-950 font-bold shadow-md shadow-cyan-500/20">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-cyan-400 font-bold text-xs sm:text-sm">{order.id}</span>
                <span className={`badge text-[9px] ${
                  order.status === 'selesai' ? 'badge-emerald' :
                  order.status === 'diproses' ? 'badge-cyan' : 'badge-amber'
                }`}>
                  {order.status}
                </span>
              </div>
              <h4 className="font-heading font-bold text-white text-xs sm:text-sm line-clamp-1">
                {order.product_name} • Akun: {order.game_username}
              </h4>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Contact Bar */}
        <div className="px-4 py-2 bg-slate-950 border-b border-white/5 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
          <div className="flex items-center gap-3">
            <span>Bantuan Langsung Admin:</span>
            <a 
              href={storeService.generateWhatsAppLink(adminPhone, `Halo Admin Zhafranstore, terkait pesanan ${order.id}:`)}
              target="_blank"
              rel="noreferrer"
              className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>{adminPhone}</span>
            </a>
            <a 
              href={storeService.generateEmailLink(adminEmail, `Tanya Masalah Pesanan ${order.id}`, `Halo Admin, saya ingin menanyakan kendala pesanan ${order.id}:`)}
              className="text-cyan-400 hover:underline flex items-center gap-1 font-semibold"
            >
              <Mail className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">{adminEmail}</span>
            </a>
          </div>

          {isAdmin && (
            <button
              onClick={() => setShowDeliveryForm(!showDeliveryForm)}
              className="btn-primary text-[11px] py-1 px-3 flex items-center gap-1"
            >
              <Package className="w-3.5 h-3.5 text-slate-950" />
              <span>{showDeliveryForm ? 'Tutup Form Kirim' : 'Kirim Aplikasi ke Chat'}</span>
            </button>
          )}
        </div>

        {/* Admin Delivery Panel (If Open) */}
        {isAdmin && showDeliveryForm && (
          <form onSubmit={handleDeliverApp} className="p-4 bg-emerald-950/40 border-b border-emerald-500/30 space-y-2.5 text-xs animate-fadeIn">
            <div className="font-bold text-emerald-400 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" />
              <span>Kirim Aplikasi / Lisensi / Akun ke Pembeli</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <input
                type="text"
                placeholder="Nama Aplikasi / Produk"
                value={deliveryData.app_name}
                onChange={(e) => setDeliveryData({ ...deliveryData, app_name: e.target.value })}
                className="form-input text-xs"
              />
              <input
                type="url"
                placeholder="Link Download Aplikasi (Google Drive, MediaFire, dll)"
                value={deliveryData.app_link}
                onChange={(e) => setDeliveryData({ ...deliveryData, app_link: e.target.value })}
                className="form-input text-xs"
              />
            </div>

            <textarea
              rows={2}
              placeholder="Serial Key / Akun Login / Instruksi Lengkap..."
              value={deliveryData.credentials}
              onChange={(e) => setDeliveryData({ ...deliveryData, credentials: e.target.value })}
              className="form-textarea text-xs"
            />

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowDeliveryForm(false)}
                className="btn-secondary text-[11px] py-1 px-3"
              >
                Batal
              </button>
              <button
                type="submit"
                className="btn-primary text-[11px] py-1 px-4"
              >
                Kirimkan ke Chat Sekarang
              </button>
            </div>
          </form>
        )}

        {/* Chat Messages Body */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[#080B14]">
          {messages.map((msg, index) => {
            const isMe = isAdmin ? msg.sender === 'admin' : msg.sender === 'buyer';
            const isSystem = msg.sender === 'system';

            if (isSystem) {
              return (
                <div key={index} className="text-center my-3">
                  <span className="inline-block px-3 py-1.5 rounded-full bg-slate-900 border border-white/10 text-[11px] text-slate-400 max-w-md">
                    {msg.text}
                  </span>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="text-[10px] text-slate-500 mb-1 px-1">
                  {msg.sender_name} • {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) : ''}
                </div>

                <div
                  className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isMe
                      ? 'bg-gradient-to-r from-cyan-600 to-sky-600 text-slate-950 font-medium rounded-tr-none shadow-md shadow-cyan-500/10'
                      : 'bg-slate-900 border border-white/10 text-slate-200 rounded-tl-none'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>

                  {/* SPECIAL APP DELIVERY CARD */}
                  {msg.is_delivery && (
                    <div className="mt-3 p-3 rounded-xl bg-slate-950/90 border border-emerald-500/40 text-slate-200 space-y-2 text-xs">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-400">
                        <Package className="w-4 h-4" />
                        <span>{msg.app_name || 'Aplikasi yang Dibeli'}</span>
                      </div>

                      {msg.app_link && (
                        <div>
                          <a
                            href={msg.app_link}
                            target="_blank"
                            rel="noreferrer"
                            className="btn-primary text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1.5 w-full"
                          >
                            <Download className="w-3.5 h-3.5 text-slate-950" />
                            <span>Unduh / Buka Aplikasi</span>
                          </a>
                        </div>
                      )}

                      {msg.credentials && (
                        <div className="p-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-[11px] space-y-1">
                          <div className="flex justify-between items-center text-slate-400 text-[10px]">
                            <span>Data Akses / Serial Key:</span>
                            <button
                              type="button"
                              onClick={() => copyText(msg.credentials)}
                              className="text-cyan-400 hover:text-white flex items-center gap-1"
                            >
                              {copiedKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                              <span>{copiedKey ? 'Tersalin' : 'Salin'}</span>
                            </button>
                          </div>
                          <div className="text-white select-all break-all whitespace-pre-wrap">
                            {msg.credentials}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input Footer */}
        <form onSubmit={handleSendMessage} className="p-3 bg-slate-900 border-t border-white/10 flex items-center gap-2 flex-shrink-0">
          <input
            type="text"
            placeholder={isAdmin ? "Tulis balasan Admin..." : "Tulis pertanyaan ke Admin..."}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            className="form-input flex-1 text-xs sm:text-sm py-2.5"
          />
          <button
            type="submit"
            className="btn-primary py-2.5 px-4 rounded-xl flex items-center gap-1.5 text-xs sm:text-sm font-bold"
          >
            <Send className="w-4 h-4 text-slate-950" />
            <span className="hidden sm:inline">Kirim</span>
          </button>
        </form>

      </div>
    </div>
  );
}
