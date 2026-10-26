// Zhafranstore.id — High-Resilience PWA Service Worker with Automatic Version Cache Invalidation
// Build Version: Updated on each deployment to purge stale caches automatically
const BUILD_VERSION = '2.3.0_' + Date.now();
const CACHE_NAME = `zhafranstore-cache-${BUILD_VERSION}`;

// Pre-cached shell assets
const CORE_ASSETS = [
  '/',
  '/manifest.json',
  '/icon.svg',
  '/qris-zhafranstore.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(CORE_ASSETS).catch((err) => {
        console.warn('PWA Pre-cache skipped:', err);
      });
    })
  );
  // Langsung aktifkan Service Worker baru tanpa menunggu tab lama ditutup
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          // Hapus semua cache versi lawas (termasuk zhafranstore-v1)
          if (key !== CACHE_NAME) {
            console.log(`[SW] Purging old cache: ${key}`);
            return caches.delete(key);
          }
        })
      );
    })
  );
  // Ambil kendali atas seluruh client yang terbuka secara instan
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya proses GET requests
  if (event.request.method !== 'GET') return;

  const url = new URL(event.request.url);

  // 1. Bypass Service Worker sepenuhnya untuk REST API dan media Cloudflare
  if (url.pathname.startsWith('/api/') || url.origin.includes('firestore') || url.origin.includes('googleapis')) {
    return;
  }

  // 2. NETWORK-FIRST untuk Navigasi & Halaman HTML
  // Menjamin pengguna selalu mendapatkan halaman terbaru, tidak pernah tertahan pada layar kosong lawas
  if (event.request.mode === 'navigate' || event.request.destination === 'document' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    event.respondWith(
      fetch(event.request, { cache: 'no-cache' })
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(event.request).then((cached) => cached || caches.match('/'));
        })
    );
    return;
  }

  // 3. STALE-WHILE-REVALIDATE untuk Asset Statis (Hashed JS/CSS, gambar, icon)
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      const fetchPromise = fetch(event.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const clone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        return networkResponse;
      }).catch(() => cachedResponse);

      return cachedResponse || fetchPromise;
    })
  );
});

// Listener untuk pesan force purge dari aplikasi klien
self.addEventListener('message', (event) => {
  if (event.data && event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }
  if (event.data && event.data.action === 'purgeAll') {
    caches.keys().then((keys) => Promise.all(keys.map((k) => caches.delete(k))));
  }
});
