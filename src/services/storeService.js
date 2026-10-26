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

  // 1. PRODUCTS MANAGEMENT
  async getProducts() {
    let products = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, null);

    try {
      const colRef = getAppCollection("products");
      const q = query(colRef, limit(100));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        products = snapshot.docs.map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            stock: data.stock !== undefined ? Number(data.stock) : 999
          };
        });
        setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, products);
        return products;
      }
    } catch (err) {
      console.warn("Firestore getProducts fallback to local:", err.message);
    }

    // Jika belum ada di Firestore atau local, gunakan initialProducts
    if (!products || products.length === 0) {
      products = initialProducts.map(p => ({
        ...p,
        stock: p.stock !== undefined ? Number(p.stock) : 999
      }));
      setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, products);
      // Inisialisasi awal ke Firestore secara background
      this.seedInitialProducts(products).catch(() => {});
    }

    return products;
  },

  async seedInitialProducts(products) {
    try {
      for (const prod of products) {
        const docRef = getAppDoc("products", prod.id);
        await setDoc(docRef, { ...prod, stock: prod.stock || 999, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not seed initial products to firestore:", e.message);
    }
  },

  async saveProduct(product) {
    const isNew = !product.id;
    const productId = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    
    // Auto-detect game image jika ada kata roblox, minecraft, free fire, mobile legends
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

    // Update local cache first
    let localProducts = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, [...initialProducts]);
    const existingIndex = localProducts.findIndex(p => p.id === productId);
    if (existingIndex >= 0) {
      localProducts[existingIndex] = productData;
    } else {
      localProducts.unshift(productData);
    }
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, localProducts);

    // Save to Firestore
    try {
      const docRef = getAppDoc("products", productId);
      await setDoc(docRef, {
        ...productData,
        updatedAt: serverTimestamp()
      }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveProduct error (persisted locally):", err.message);
    }

    return productData;
  },

  async deleteProduct(productId) {
    // Update local cache
    let localProducts = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, []);
    localProducts = localProducts.filter(p => p.id !== productId);
    setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, localProducts);

    // Delete from Firestore
    try {
      const docRef = getAppDoc("products", productId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteProduct error:", err.message);
    }
    return true;
  },

  // 1.5. CATEGORIES MANAGEMENT (Bisa buat kategori sendiri & bisa dihapus)
  async getCategories() {
    let categories = getLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, null);

    try {
      const colRef = getAppCollection("categories");
      const snapshot = await getDocs(colRef);
      if (!snapshot.empty) {
        categories = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);
        return categories;
      }
    } catch (err) {
      console.warn("Firestore getCategories fallback to local:", err.message);
    }

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
    
    let categories = await this.getCategories();
    const existingIndex = categories.findIndex(c => c.id === id);
    const catObj = { id, name: cleanName, createdAt: new Date().toISOString() };
    
    if (existingIndex >= 0) {
      categories[existingIndex] = catObj;
    } else {
      categories.push(catObj);
    }
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);

    try {
      const docRef = getAppDoc("categories", id);
      await setDoc(docRef, { ...catObj, updatedAt: serverTimestamp() }, { merge: true });
    } catch (err) {
      console.warn("Firestore saveCategory error:", err.message);
    }
    return catObj;
  },

  async deleteCategory(categoryId) {
    let categories = await this.getCategories();
    categories = categories.filter(c => c.id !== categoryId);
    setLocalData(LOCAL_STORAGE_KEYS.CATEGORIES, categories);

    try {
      const docRef = getAppDoc("categories", categoryId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteCategory error:", err.message);
    }
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

  // 2. STORE SETTINGS MANAGEMENT
  async getStoreSettings() {
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
  async getOrders(maxOrders = 50) {
    let orders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);

    try {
      const colRef = getAppCollection("orders");
      const q = query(colRef, orderBy("createdAt", "desc"), limit(maxOrders));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        orders = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocalData(LOCAL_STORAGE_KEYS.ORDERS, orders);
        return orders;
      }
    } catch (err) {
      console.warn("Firestore getOrders fallback to local:", err.message);
    }

    return orders;
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
    const invoiceId = `INV-${dateStr}-${randCode}`;
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
      status: "pending", // pending, diproses, selesai, cancelled
      createdAt: new Date().toISOString()
    };

    // Save to local cache
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    localOrders.unshift(newOrder);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);

    // Otomatis kurangi stok produk jika produk_id ada
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

    // Otomatis catat / perbarui Akun Pengguna & Game ke Daftar Member untuk Pemilik Store / Owner
    if (orderPayload.buyer_email || orderPayload.buyer_whatsapp) {
      try {
        const allUsers = getLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, []);
        const uEmail = (orderPayload.buyer_email || '').trim().toLowerCase();
        const uPhone = (orderPayload.buyer_whatsapp || '').trim();
        const existingIdx = allUsers.findIndex(u => 
          (uEmail && u.email && u.email.toLowerCase() === uEmail) ||
          (uPhone && u.whatsapp && u.whatsapp === uPhone)
        );

        const userRecord = existingIdx >= 0 ? allUsers[existingIdx] : {
          email: uEmail,
          whatsapp: uPhone,
          isGuest: !uEmail,
          gameAccounts: {},
          verifiedAccounts: {},
          ordersCount: 0,
          totalSpent: 0,
          createdAt: new Date().toISOString()
        };

        userRecord.lastOrderProduct = orderPayload.product_name;
        userRecord.lastGameAccount = orderPayload.game_username;
        userRecord.ordersCount = (userRecord.ordersCount || 0) + 1;
        userRecord.totalSpent = (userRecord.totalSpent || 0) + (Number(orderPayload.price) || 0);
        userRecord.updatedAt = new Date().toISOString();

        if (existingIdx >= 0) {
          allUsers[existingIdx] = userRecord;
        } else {
          allUsers.unshift(userRecord);
        }
        setLocalData(LOCAL_STORAGE_KEYS.ALL_USER_PROFILES, allUsers);
      } catch (err) {
        console.warn("Auto-register order user error:", err);
      }
    }

    // Save to Firestore
    try {
      const docRef = getAppDoc("orders", invoiceId);
      await setDoc(docRef, {
        ...newOrder,
        createdAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore createOrder error (saved locally):", err.message);
    }

    return newOrder;
  },

  // Pengiriman Otomatis (Auto Delivery) ke Akun Game Pembeli Setelah Bayar
  async autoDeliverOrder(orderId) {
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

      try {
        const docRef = getAppDoc("orders", orderId);
        await updateDoc(docRef, {
          status: 'selesai',
          auto_delivered: true,
          delivered_at: serverTimestamp()
        });
      } catch (e) {
        console.warn("Firestore autoDeliverOrder update error:", e);
      }
      return ord;
    }
    return null;
  },

  async updateOrderStatus(orderId, newStatus) {
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    const idx = localOrders.findIndex(o => o.id === orderId);
    if (idx >= 0) {
      localOrders[idx].status = newStatus;
      localOrders[idx].updatedAt = new Date().toISOString();
      setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);
    }

    try {
      const docRef = getAppDoc("orders", orderId);
      await updateDoc(docRef, {
        status: newStatus,
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.warn("Firestore updateOrderStatus error:", err.message);
    }

    return true;
  },

  async deleteOrder(orderId) {
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    localOrders = localOrders.filter(o => o.id !== orderId);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);

    try {
      const docRef = getAppDoc("orders", orderId);
      await deleteDoc(docRef);
    } catch (err) {
      console.warn("Firestore deleteOrder error:", err.message);
    }
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

  // 6. ORDER CHAT & APPLICATION DELIVERY (TEMPAT CHAT SETELAH BAYAR)
  async getOrderMessages(orderId) {
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

  // 6. USER PROFILE & WORLDWIDE GAME ACCOUNTS (Tamu & Akun Email)
  async getUserProfile() {
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

  // Ambil semua akun pengguna dan akun game (Untuk dilihat Pemilik Store & Owner)
  async getAllUserProfiles() {
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
  }
};
