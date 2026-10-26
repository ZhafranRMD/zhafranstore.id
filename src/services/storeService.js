import { 
  getDocs, 
  getDoc, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy, 
  limit, 
  serverTimestamp 
} from "firebase/firestore";
import { getAppCollection, getAppDoc, db } from "./firebase.js";
import { initialProducts, initialStoreSettings, initialCategories } from "../data/initialProducts.js";
import { getGameAutoImage, detectGameFromText, detectWorldwideAccount, GAME_ASSETS } from "../data/gameAssets.js";

export const ADMIN_FEE = 500;

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: "zhafranstore_products",
  CATEGORIES: "zhafranstore_categories",
  SETTINGS: "zhafranstore_settings",
  ORDERS: "zhafranstore_orders",
  CHALLENGES: "zhafranstore_challenges",
  EVENTS: "zhafranstore_events",
  CHATS: "zhafranstore_order_chats",
  OWNER_ACCOUNT: "zhafranstore_owner_account",
  USER_PROFILE: "zhafranstore_user_profile",
  ALL_USER_PROFILES: "zhafranstore_all_user_profiles",
  LATEST_NOTIFICATION: "zhafranstore_latest_notification"
};

// Helper: play notification chime using Web Audio API
export function playNotificationChime() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const now = ctx.currentTime;
    
    // First note (D5)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    // Second note (A5)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880.00, now + 0.12);
    gain2.gain.setValueAtTime(0.3, now + 0.12);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.65);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.65);
  } catch (e) {
    // Audio context may be restricted by autoplay policy before user gesture
  }
}

// In-memory fallback if localStorage is not defined (e.g. Node.js environment)
const memoryStorage = {};

// Helper: safe local storage read
function getLocalData(key, fallback) {
  try {
    if (typeof localStorage === 'undefined') {
      return memoryStorage[key] ? JSON.parse(memoryStorage[key]) : fallback;
    }
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    return fallback;
  }
}

// Helper: safe local storage write
function setLocalData(key, data) {
  try {
    const val = JSON.stringify(data);
    if (typeof localStorage === 'undefined') {
      memoryStorage[key] = val;
      return;
    }
    localStorage.setItem(key, val);
  } catch (e) {}
}

// Cloudflare D1 Edge API Helper
const API_BASE = typeof window !== 'undefined' && window.location.origin ? window.location.origin : 'https://store.zhafranstudio.my.id';

export async function fetchD1(endpoint, options = {}) {
  try {
    const res = await fetch(`${API_BASE}/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-key': 'zhafranstoreid',
        ...options.headers
      }
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    return null;
  }
}

export const storeService = {
  // Format mata uang Rupiah
  formatRupiah(number) {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(number || 0);
  },

  // Generate WhatsApp Direct Link
  generateWhatsAppLink(phone, message) {
    let cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    if (cleanPhone.startsWith("0")) {
      cleanPhone = "62" + cleanPhone.slice(1);
    } else if (!cleanPhone.startsWith("62")) {
      cleanPhone = "62" + cleanPhone;
    }
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  },

  // Generate Email Direct Link
  generateEmailLink(email, subject, body) {
    const targetEmail = email || "zhafran.gibran09@gmail.com";
    return `mailto:${targetEmail}?subject=${encodeURIComponent(subject || 'Tanya Admin Zhafranstore.id')}&body=${encodeURIComponent(body || '')}`;
  },

  // 1. PRODUCTS MANAGEMENT WITH CLOUDFLARE D1
  async getProducts() {
    // 1. Coba ambil dari Cloudflare D1 Database Edge
    const d1Products = await fetchD1('/products');
    if (d1Products && Array.isArray(d1Products) && d1Products.length > 0) {
      const formatted = d1Products.map(p => ({
        ...p,
        stock: p.stock !== undefined ? Number(p.stock) : 999,
        popular: Boolean(p.popular),
        is_active: p.is_active !== undefined ? Boolean(p.is_active) : true
      }));
      setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, formatted);
      return formatted;
    }

    // 2. Fallback: Local Cache
    let products = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, null);
    if (!products || products.length === 0) {
      products = initialProducts.map(p => ({
        ...p,
        stock: p.stock !== undefined ? Number(p.stock) : 999
      }));
      setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, products);
    }

    return products;
  },

  async seedInitialProducts(products) {
    try {
      for (const prod of products) {
        await fetchD1('/products', { method: 'POST', body: JSON.stringify(prod) });
      }
    } catch (e) {}
  },

  async saveProduct(product) {
    const productId = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const autoImg = getGameAutoImage(product.name, product.game_title);
    const resolvedImage = product.image_url || autoImg || "https://images.unsplash.com/photo-1542751371-adc38448a05e?w=800";

    const productData = {
      ...product,
      id: productId,
      image_url: resolvedImage,
      price: Number(product.price) || 0,
      stock: product.stock !== undefined ? Math.max(0, Number(product.stock)) : 999,
      is_active: product.is_active !== undefined ? product.is_active : true,
      updatedAt: new Date().toISOString()
    };

    // 1. Simpan ke Cloudflare D1 Database Edge
    await fetchD1('/products', {
      method: 'POST',
      body: JSON.stringify(productData)
    });

    // 2. Simpan ke local cache
    let localProducts = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, [...initialProducts]);
    const existingIndex = localProducts.findIndex(p => p.id === productId);
    if (existingIndex >= 0) {
      localProducts[existingIndex] = productData;
    } else {
      localProducts.unshift(productData);
    }
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, localProducts);

    return productData;
  },

  async deleteProduct(productId) {
    // 1. Hapus di Cloudflare D1 Database
    await fetchD1(`/products/${encodeURIComponent(productId)}`, {
      method: 'DELETE'
    });

    // 2. Update local cache
    let localProducts = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, []);
    localProducts = localProducts.filter(p => p.id !== productId);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, localProducts);
    return true;
  },

  // 1.5. CATEGORIES MANAGEMENT WITH CLOUDFLARE D1
  async getCategories() {
    // 1. Coba ambil dari Cloudflare D1
    const d1Categories = await fetchD1('/categories');
    if (d1Categories && Array.isArray(d1Categories) && d1Categories.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, d1Categories);
      return d1Categories;
    }

    // 2. Fallback: Local Cache
    let categories = getLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, null);
    if (!categories || categories.length === 0) {
      categories = [...initialCategories];
      setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
    }
    return categories;
  },

  async saveCategory(name) {
    if (!name || !name.trim()) return null;
    const cleanName = name.trim();
    const id = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || `cat-${Date.now()}`;
    const catObj = { id, name: cleanName, createdAt: new Date().toISOString() };

    // 1. Simpan ke Cloudflare D1
    await fetchD1('/categories', {
      method: 'POST',
      body: JSON.stringify(catObj)
    });

    // 2. Simpan ke local cache
    let categories = await this.getCategories();
    const existingIndex = categories.findIndex(c => c.id === id);
    if (existingIndex >= 0) {
      categories[existingIndex] = catObj;
    } else {
      categories.push(catObj);
    }
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);

    return catObj;
  },

  async deleteCategory(categoryId) {
    // 1. Hapus dari Cloudflare D1
    await fetchD1(`/categories/${encodeURIComponent(categoryId)}`, {
      method: 'DELETE'
    });

    // 2. Hapus dari local cache
    let categories = getLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, []);
    categories = categories.filter(c => c.id !== categoryId);
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
    return true;
  },

  // OWNER ACCOUNT HELPER (Bisa memasukkan akunnya & melihat pesanannya sendiri)
  getOwnerAccount() {
    return getLocalData(LOCAL_STORAGE_KEYS.OWNER_ACCOUNT, {
      username: '',
      server_id: '',
      whatsapp: '',
      email: ''
    });
  },

  saveOwnerAccount(accountData) {
    setLocalData(LOCAL_STORAGE_KEYS.OWNER_ACCOUNT, accountData);
    return accountData;
  },

  // 2. STORE SETTINGS MANAGEMENT (CLOUDFLARE D1)
  async getStoreSettings() {
    // 1. Coba ambil dari Cloudflare D1
    const d1Settings = await fetchD1('/settings');
    if (d1Settings && (d1Settings.id || d1Settings.store_name)) {
      setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, d1Settings);
      return d1Settings;
    }

    let settings = getLocalData(LOCAL_STORAGE_KEYS.SETTINGS, null);

    try {
      const docRef = getAppDoc("settings", "general");
      const snapshot = await getDoc(docRef);
      if (snapshot.exists()) {
        settings = { ...snapshot.data(), id: "general" };
        setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, settings);
        return settings;
      }
    } catch (err) {
      console.warn("Firestore getStoreSettings fallback:", err.message);
    }

    if (!settings) {
      settings = initialStoreSettings;
      setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, settings);
    }

    return settings;
  },

  async saveStoreSettings(settings) {
    const updated = {
      ...settings,
      id: "general",
      updatedAt: new Date().toISOString()
    };
    setLocalData(LOCAL_STORAGE_KEYS.SETTINGS, updated);

    // 1. Simpan ke Cloudflare D1
    await fetchD1('/settings', {
      method: 'PUT',
      body: JSON.stringify(updated)
    });

    try {
      const docRef = getAppDoc("settings", "general");
      await setDoc(docRef, {
        ...updated,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveStoreSettings error:", err.message);
    }

    return updated;
  },

  // 3. ORDERS MANAGEMENT
  async getOrders(maxOrders = 100) {
    // 1. Coba ambil dari Cloudflare D1
    const d1Orders = await fetchD1('/orders');
    if (d1Orders && Array.isArray(d1Orders) && d1Orders.length > 0) {
      setLocalData(LOCAL_STORAGE_KEYS.ORDERS, d1Orders);
      return d1Orders;
    }

    // 2. Fallback: Local Cache
    return getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
  },

  // Generate Game Account Profile Link or Fast Format
  generateGameAccountLink(gameKey, identifier, zoneId = '') {
    if (!identifier) return '';
    const cleanId = identifier.trim();
    const cleanZone = zoneId ? zoneId.trim() : '';
    const key = (gameKey || '').toLowerCase();

    if (key.includes('roblox')) {
      return `https://www.roblox.com/search/users?keyword=${encodeURIComponent(cleanId)}`;
    }
    if (key.includes('minecraft')) {
      return `https://namemc.com/profile/${encodeURIComponent(cleanId)}`;
    }
    if (key.includes('mobile') || key.includes('mlbb')) {
      return cleanZone ? `${cleanId} (${cleanZone})` : cleanId;
    }
    return cleanId;
  },

  async createOrder(orderPayload) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const invoiceId = orderPayload.id || `INV-${dateStr}-${randCode}`;
    const qty = Number(orderPayload.quantity) || 1;

    const gameAccLink = this.generateGameAccountLink(
      orderPayload.game_key || orderPayload.category,
      orderPayload.game_username,
      orderPayload.zone_id
    );

    const newOrder = {
      ...orderPayload,
      id: invoiceId,
      quantity: qty,
      total_items: orderPayload.total_items || `${qty}x ${orderPayload.product_name}`,
      account_link: gameAccLink,
      status: "pending",
      createdAt: new Date().toISOString()
    };

    // 1. Simpan ke Cloudflare D1 Database (Otomatis potong stok di D1)
    const d1Created = await fetchD1('/orders', {
      method: 'POST',
      body: JSON.stringify(newOrder)
    });

    // 2. Simpan ke local cache
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    localOrders.unshift(d1Created || newOrder);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);

    // Otomatis kurangi stok produk di local
    if (orderPayload.product_id) {
      try {
        let prods = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, []);
        const pIdx = prods.findIndex(p => p.id === orderPayload.product_id);
        if (pIdx >= 0) {
          const curStock = prods[pIdx].stock !== undefined ? Number(prods[pIdx].stock) : 999;
          prods[pIdx].stock = Math.max(0, curStock - qty);
          setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, prods);
        }
      } catch (e) {}
    }

    // Bunyikan Audio Chime Notifikasi
    playNotificationChime();

    // Notifikasi Pembelian Baru untuk Pemilik Admin & Owner
    try {
      const notifData = {
        id: invoiceId,
        buyer_whatsapp: orderPayload.buyer_whatsapp,
        buyer_email: orderPayload.buyer_email,
        game_username: orderPayload.game_username,
        account_link: gameAccLink,
        product_name: orderPayload.product_name,
        quantity: qty,
        price: orderPayload.price,
        time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        timestamp: Date.now()
      };
      setLocalData(LOCAL_STORAGE_KEYS.LATEST_NOTIFICATION, notifData);
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('zhafran_new_order_notify', { detail: notifData }));
      }
    } catch (e) {}

    return d1Created || newOrder;
  },

  // Pengiriman Otomatis (Auto Delivery) ke Akun Game Pembeli Setelah Bayar
  async autoDeliverOrder(orderId) {
    // 1. Eksekusi pengiriman otomatis di Cloudflare D1
    await fetchD1(`/orders/${encodeURIComponent(orderId)}/auto-deliver`, {
      method: 'POST'
    });

    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      const ord = localOrders[idx];
      ord.status = 'selesai';
      ord.auto_delivered = true;
      ord.delivered_at = new Date().toISOString();
      localOrders[idx] = ord;
      setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);

      // Kirim pesan otomatis ke chat serah terima pesanan
      try {
        const deliveryMsg = `⚡ [PENGIRIMAN OTOMATIS SUKSES]\nPembayaran telah terverifikasi! Pesanan ${ord.product_name} sebanyak ${ord.quantity || 1} stok telah BERHASIL DIKIRIM OTOMATIS ke akun: ${ord.game_username}.\nSilakan cek item/saldo di akun game kamu sekarang. Terima kasih telah berbelanja di Zhafranstore.id! ⭐`;
        await this.sendOrderMessage(orderId, {
          sender: 'system',
          sender_name: 'Sistem Pengiriman Otomatis Zhafranstore',
          text: deliveryMsg,
          createdAt: new Date().toISOString()
        });
      } catch (e) {}

      return ord;
    }
    return { id: orderId, status: 'selesai', auto_delivered: true };
  },

  async updateOrderStatus(orderId, newStatus) {
    // 1. Update ke Cloudflare D1
    await fetchD1(`/orders/${encodeURIComponent(orderId)}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus })
    });

    // 2. Update local cache
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      localOrders[idx].status = newStatus;
      localOrders[idx].updatedAt = new Date().toISOString();
      setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);
    }
    return true;
  },

  async deleteOrder(orderId) {
    // 1. Hapus dari Cloudflare D1
    await fetchD1(`/orders/${encodeURIComponent(orderId)}`, {
      method: 'DELETE'
    });

    // 2. Hapus dari local cache
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    localOrders = localOrders.filter(o => o.id !== orderId);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);
    return true;
  },

  // 4. EVENT & CHALLENGE REWARDS MANAGEMENT
  async submitChallenge(challengePayload) {
    const claimId = `CHL-${Date.now().toString(36).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
    const newChallenge = {
      ...challengePayload,
      id: claimId,
      status: "pending", // pending, approved, rejected
      createdAt: new Date().toISOString()
    };

    // Save locally
    let localChallenges = getLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, []);
    localChallenges.unshift(newChallenge);
    setLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, localChallenges);

    // Save to Firestore
    try {
      const docRef = getAppDoc("challenges", claimId);
      await setDoc(docRef, {
        ...newChallenge,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore submitChallenge error (persisted locally):", err.message);
    }

    return newChallenge;
  },

  async getChallenges(maxItems = 50) {
    let challenges = getLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, []);

    try {
      const colRef = getAppCollection("challenges");
      const q = query(colRef, orderBy("createdAt", "desc"), limit(maxItems));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        challenges = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, challenges);
        return challenges;
      }
    } catch (err) {
      console.warn("Firestore getChallenges fallback to local:", err.message);
    }

    return challenges;
  },

  async updateChallengeStatus(challengeId, newStatus, rewardPromoCode = "") {
    let localChallenges = getLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, []);
    const idx = localChallenges.findIndex(c => c.id === challengeId);
    if (idx >= 0) {
      localChallenges[idx].status = newStatus;
      if (rewardPromoCode) localChallenges[idx].rewardPromoCode = rewardPromoCode;
      localChallenges[idx].updatedAt = new Date().toISOString();
      setLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, localChallenges);
    }

    try {
      const docRef = getAppDoc("challenges", challengeId);
      await updateDoc(docRef, {
        status: newStatus,
        rewardPromoCode: rewardPromoCode || null,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore updateChallengeStatus error:", err.message);
    }

    return true;
  },

  async deleteChallenge(challengeId) {
    let localChallenges = getLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, []);
    localChallenges = localChallenges.filter(c => c.id !== challengeId);
    setLocalData(LOCAL_STORAGE_KEYS.CHALLENGES, localChallenges);

    try {
      const docRef = getAppDoc("challenges", challengeId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteChallenge error:", err.message);
    }
    return true;
  },

  // 5. ADMIN CREATED EVENTS & HADIAH
  async getEvents() {
    let events = getLocalData(LOCAL_STORAGE_KEYS.EVENTS, null);
    try {
      const colRef = getAppCollection("events");
      const q = query(colRef, limit(50));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocalData(LOCAL_STORAGE_KEYS.EVENTS, events);
        return events;
      }
    } catch (err) {
      console.warn("Firestore getEvents fallback:", err.message);
    }

    if (!events) {
      events = [];
      setLocalData(LOCAL_STORAGE_KEYS.EVENTS, events);
    }
    return events;
  },

  async saveEvent(eventData) {
    const eventId = eventData.id || `evt-${Date.now()}`;
    const payload = {
      ...eventData,
      id: eventId,
      is_active: eventData.is_active !== undefined ? eventData.is_active : true,
      updatedAt: new Date().toISOString()
    };

    let localEvents = getLocalData(LOCAL_STORAGE_KEYS.EVENTS, []);
    const idx = localEvents.findIndex(e => e.id === eventId);
    if (idx >= 0) {
      localEvents[idx] = payload;
    } else {
      localEvents.unshift(payload);
    }
    setLocalData(LOCAL_STORAGE_KEYS.EVENTS, localEvents);

    try {
      const docRef = getAppDoc("events", eventId);
      await setDoc(docRef, { ...payload, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveEvent error:", err.message);
    }
    return payload;
  },

  async deleteEvent(eventId) {
    let localEvents = getLocalData(LOCAL_STORAGE_KEYS.EVENTS, []);
    localEvents = localEvents.filter(e => e.id !== eventId);
    setLocalData(LOCAL_STORAGE_KEYS.EVENTS, localEvents);

    try {
      const docRef = getAppDoc("events", eventId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteEvent error:", err.message);
    }
    return true;
  },

  // 6. ORDER CHAT & APPLICATION DELIVERY (TEMPAT CHAT SETELAH BAYAR - D1)
  async getOrderMessages(orderId) {
    // 1. Coba ambil dari Cloudflare D1
    const d1Chats = await fetchD1(`/chats/${encodeURIComponent(orderId)}`);
    if (d1Chats && Array.isArray(d1Chats) && d1Chats.length > 0) {
      const allChats = getLocalData(LOCAL_STORAGE_KEYS.CHATS, {});
      allChats[orderId] = d1Chats;
      setLocalData(LOCAL_STORAGE_KEYS.CHATS, allChats);
      return d1Chats;
    }

    const allChats = getLocalData(LOCAL_STORAGE_KEYS.CHATS, {});
    let messages = allChats[orderId] || [];

    try {
      const colRef = getAppCollection(`order_chats_${orderId}`);
      const q = query(colRef, orderBy("createdAt", "asc"), limit(100));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        allChats[orderId] = messages;
        setLocalData(LOCAL_STORAGE_KEYS.CHATS, allChats);
      }
    } catch (err) {
      console.warn("Firestore getOrderMessages fallback:", err.message);
    }

    return messages;
  },

  async sendOrderMessage(orderId, messagePayload) {
    const msgId = `msg-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    const newMsg = {
      ...messagePayload,
      id: msgId,
      createdAt: new Date().toISOString()
    };

    // 1. Simpan ke Cloudflare D1
    await fetchD1(`/chats/${encodeURIComponent(orderId)}`, {
      method: 'POST',
      body: JSON.stringify(newMsg)
    });

    const allChats = getLocalData(LOCAL_STORAGE_KEYS.CHATS, {});
    if (!allChats[orderId]) allChats[orderId] = [];
    allChats[orderId].push(newMsg);
    setLocalData(LOCAL_STORAGE_KEYS.CHATS, allChats);

    try {
      const docRef = getAppDoc(`order_chats_${orderId}`, msgId);
      await setDoc(docRef, { ...newMsg, createdAt: serverTimestamp() });
    } catch (err) {
      console.warn("Firestore sendOrderMessage error:", err.message);
    }

    return newMsg;
  },

  async deliverApplication(orderId, deliveryDetails) {
    // Admin delivers the application / credentials to the buyer
    const deliveryMessage = {
      sender: "admin",
      sender_name: "Admin Zhafranstore",
      text: deliveryDetails.message || "Halo kak, berikut ini aplikasi / akun game yang telah kamu beli:",
      app_link: deliveryDetails.app_link || "",
      app_name: deliveryDetails.app_name || "",
      credentials: deliveryDetails.credentials || "",
      is_delivery: true,
      createdAt: new Date().toISOString()
    };

    await this.sendOrderMessage(orderId, deliveryMessage);
    await this.updateOrderStatus(orderId, "selesai");
    return deliveryMessage;
  },

  // 6. USER PROFILE & WORLDWIDE GAME ACCOUNTS (Tamu & Akun Email - D1)
  getUserProfile() {
    let profile = getLocalData(LOCAL_STORAGE_KEYS.USER_PROFILE, null);
    if (!profile) {
      profile = {
        email: "",
        isGuest: true,
        whatsapp: "",
        gameAccounts: {
          roblox: "",
          minecraft: "",
          freefire: "",
          mobilelegends: { userId: "", zoneId: "" }
        },
        verifiedAccounts: {},
        updatedAt: new Date().toISOString()
      };
      setLocalData(LOCAL_STORAGE_KEYS.USER_PROFILE, profile);
    }
    return profile;
  },

  async saveUserProfile(profileData) {
    const updated = {
      ...profileData,
      updatedAt: new Date().toISOString()
    };
    setLocalData(LOCAL_STORAGE_KEYS.USER_PROFILE, updated);

    // 1. Simpan ke Cloudflare D1
    await fetchD1('/users/profiles', {
      method: 'POST',
      body: JSON.stringify(updated)
    });

    // Simpan juga ke Daftar Seluruh Pengguna (ALL_USER_PROFILES) agar bisa dilihat oleh Pemilik Store & Owner
    try {
      const allProfiles = getLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, []);
      const userEmail = (updated.email || '').trim().toLowerCase();
      const userPhone = (updated.whatsapp || '').trim();
      
      const existingIdx = allProfiles.findIndex(p => 
        (userEmail && p.email && p.email.toLowerCase() === userEmail) ||
        (userPhone && p.whatsapp && p.whatsapp === userPhone)
      );

      if (existingIdx >= 0) {
        allProfiles[existingIdx] = {
          ...allProfiles[existingIdx],
          ...updated
        };
      } else {
        allProfiles.unshift(updated);
      }
      setLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, allProfiles);
    } catch (e) {
      console.warn("Save to all user profiles error:", e);
    }

    // Jika memiliki email, simpan juga ke Firestore apps/zhafranstore/user_profiles/{email}
    if (updated.email && updated.email.trim()) {
      try {
        const cleanDocId = updated.email.trim().toLowerCase().replace(/[^a-z0-9]/g, '_');
        const docRef = getAppDoc("user_profiles", cleanDocId);
        await setDoc(docRef, { ...updated, updatedAt: serverTimestamp() }, { merge: true });
      } catch (err) {
        console.warn("Firestore saveUserProfile fallback to local:", err.message);
      }
    }
    return updated;
  },

  // Ambil semua akun pengguna dan akun game (Untuk dilihat Pemilik Store & Owner - D1)
  async getAllUserProfiles() {
    // 1. Coba ambil dari Cloudflare D1
    const d1Profiles = await fetchD1('/users/profiles');
    if (d1Profiles && Array.isArray(d1Profiles) && d1Profiles.length > 0) {
      const parsed = d1Profiles.map(p => ({
        ...p,
        isGuest: Boolean(p.is_guest),
        gameAccounts: p.game_accounts_json ? (typeof p.game_accounts_json === 'string' ? JSON.parse(p.game_accounts_json) : p.game_accounts_json) : {},
        verifiedAccounts: p.verified_accounts_json ? (typeof p.verified_accounts_json === 'string' ? JSON.parse(p.verified_accounts_json) : p.verified_accounts_json) : {}
      }));
      setLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, parsed);
      return parsed;
    }

    let list = getLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, []);

    try {
      const colRef = getAppCollection("user_profiles");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        const firestoreList = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        // Merge without duplicates by email
        const emailMap = new Map();
        for (const item of list) {
          if (item.email) emailMap.set(item.email.toLowerCase(), item);
          else if (item.whatsapp) emailMap.set(item.whatsapp, item);
        }
        for (const item of firestoreList) {
          if (item.email) emailMap.set(item.email.toLowerCase(), item);
        }
        list = Array.from(emailMap.values());
        setLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, list);
      }
    } catch (err) {
      console.warn("Firestore getAllUserProfiles fallback to local:", err.message);
    }

    return list;
  },

  async deleteUserProfile(emailOrKey) {
    if (!emailOrKey) return false;
    const cleanKey = emailOrKey.toLowerCase();
    let list = getLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, []);
    list = list.filter(p => (p.email || '').toLowerCase() !== cleanKey && (p.whatsapp || '') !== emailOrKey);
    setLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, list);

    try {
      const cleanDocId = cleanKey.replace(/[^a-z0-9]/g, '_');
      const docRef = getAppDoc("user_profiles", cleanDocId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteUserProfile error:", err.message);
    }
    return true;
  },

  setGuestMode() {
    const guestProfile = {
      email: "",
      isGuest: true,
      whatsapp: "",
      gameAccounts: {
        roblox: "",
        minecraft: "",
        freefire: "",
        mobilelegends: { userId: "", zoneId: "" }
      },
      verifiedAccounts: {},
      updatedAt: new Date().toISOString()
    };
    setLocalData(LOCAL_STORAGE_KEYS.USER_PROFILE, guestProfile);
    return guestProfile;
  },

  // Helper Auto-image & Account Verification re-export
  getAutoGameImage(name, gameTitle = '') {
    return getGameAutoImage(name, gameTitle);
  },

  detectGame(text) {
    return detectGameFromText(text);
  },

  verifyGameAccount(gameKey, identifier, zoneId = '') {
    return detectWorldwideAccount(gameKey, identifier, zoneId);
  },

  getLatestNotification() {
    return getLocalData(LOCAL_STORAGE_KEYS.LATEST_NOTIFICATION, null);
  },

  clearLatestNotification() {
    setLocalData(LOCAL_STORAGE_KEYS.LATEST_NOTIFICATION, null);
  },

  // 7. CLOUDFLARE R2 STORAGE INTEGRATION
  async uploadToR2(file, folder = 'uploads') {
    if (!file) return null;
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('folder', folder);

      const API_BASE = (typeof window !== 'undefined' && window.location.origin) ? window.location.origin : 'https://store.zhafranstudio.my.id';
      const res = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        headers: {
          'x-admin-key': 'zhafranstoreid'
        },
        body: formData
      });

      if (!res.ok) {
        throw new Error(`Upload gagal (${res.status})`);
      }
      const data = await res.json();
      return data.url; // /api/media/...
    } catch (err) {
      console.warn("R2 Upload fallback to data URL:", err.message);
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });
    }
  },

  // 8. VERSION CACHE PURGE & FORCE REFRESH
  async purgeAppCache() {
    try {
      if (typeof window !== 'undefined') {
        if ('caches' in window) {
          const keys = await caches.keys();
          await Promise.all(keys.map(k => caches.delete(k)));
        }
        if ('serviceWorker' in navigator) {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.unregister();
          }
        }
        localStorage.clear();
        sessionStorage.clear();
        window.location.reload();
      }
    } catch (e) {
      if (typeof window !== 'undefined') window.location.reload();
    }
  }
};
