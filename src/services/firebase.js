import { initializeApp, getApps, getApp } from "firebase/app";
import { 
  initializeFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager,
  collection,
  doc
} from "firebase/firestore";

export const firebaseConfig = {
  apiKey: "AIzaSyCJp4hqii2wB7iKSyHUsBF05WtVKprZEEg",
  authDomain: "zhafran-firebase.firebaseapp.com",
  projectId: "zhafran-firebase",
  storageBucket: "zhafran-firebase.firebasestorage.app",
  messagingSenderId: "47163102320",
  appId: "1:47163102320:web:dd8e6228507bf26d3fd0b5"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

export const APP_NAMESPACE = "zhafranstore";

// Inisialisasi Firestore dengan Persistent Local Cache & Multi-Tab Support sesuai aturan baku
let firestoreDb;
try {
  firestoreDb = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch (e) {
  console.warn("Firestore persistent cache fallback:", e);
  // Fallback to existing or default initialization if already initialized
  firestoreDb = initializeFirestore(app, {});
}

export const db = firestoreDb;

/**
 * Helper untuk mendapatkan referensi koleksi aplikasi yang terisolasi
 * Path: apps/zhafranstore/{collectionName}
 */
export function getAppCollection(collectionName) {
  return collection(db, "apps", APP_NAMESPACE, collectionName);
}

/**
 * Helper untuk mendapatkan referensi dokumen aplikasi yang terisolasi
 * Path: apps/zhafranstore/{collectionName}/{docId}
 */
export function getAppDoc(collectionName, docId) {
  return doc(db, "apps", APP_NAMESPACE, collectionName, docId);
}
