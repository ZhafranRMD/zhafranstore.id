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
import { initialProducts, initialStoreSettings } from "../data/initialProducts.js";

export const ADMIN_FEE = 500;

const LOCAL_STORAGE_KEYS = {
  PRODUCTS: "zhafranstore_products",
  SETTINGS: "zhafranstore_settings",
  ORDERS: "zhafranstore_orders",
  CHALLENGES: "zhafranstore_challenges",
  EVENTS: "zhafranstore_events",
  CHATS: "zhafranstore_order_chats"
};

// Helper: safe local storage read
function getLocalData(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (e) {
    console.error("Local storage read error:", e);
    return fallback;
  }
}

// Helper: safe local storage write
function setLocalData(key, data) {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Local storage write error:", e);
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

  // 1. PRODUCTS MANAGEMENT
  async getProducts() {
    let products = getLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, null);

    try {
      const colRef = getAppCollection("products");
      const q = query(colRef, limit(100));
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        products = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setLocalData(LOCAL_STORAGE_KEYS.PRODUCTS, products);
        return products;
      }
    } catch (err) {
      console.warn("Firestore getProducts fallback to local:", err.message);
    }

    // Jika belum ada di Firestore atau local, gunakan initialProducts
    if (!products || products.length === 0) {
      products = initialProducts;
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
        await setDoc(docRef, { ...prod, updatedAt: serverTimestamp() }, { merge: true });
      }
    } catch (e) {
      console.warn("Could not seed initial products to firestore:", e.message);
    }
  },

  async saveProduct(product) {
    const isNew = !product.id;
    const productId = product.id || `prod-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const productData = {
      ...product,
      id: productId,
      price: Number(product.price) || 0,
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

  async createOrder(orderPayload) {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, "");
    const randCode = Math.floor(1000 + Math.random() * 9000);
    const invoiceId = `INV-${dateStr}-${randCode}`;

    const newOrder = {
      ...orderPayload,
      id: invoiceId,
      status: "pending", // pending, diproses, selesai, cancelled
      createdAt: new Date().toISOString()
    };

    // Save to local cache
    let localOrders = getLocalData(LOCAL_STORAGE_KEYS.ORDERS, []);
    localOrders.unshift(newOrder);
    setLocalData(LOCAL_STORAGE_KEYS.ORDERS, localOrders);

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
  }
};
