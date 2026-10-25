// Zhafranstore.id — PWA Service Worker
const CACHE_NAME = 'zhafranstore-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/manifest.json',
  '/icon.svg',
  '/qris-zhafranstore.jpg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  // Hanya intercept GET requests
  if (event.request.method !== 'GET') return;

  // Abaikan request firebase / google apis agar realtime tidak terganggu
  const url = new URL(event.request.url);
  if (url.origin.includes('firestore') || url.origin.includes('firebase') || url.origin.includes('googleapis')) {
    return;
  }

  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        return cachedResponse;
      }
      return fetch(event.request).then((networkResponse) => {
        return networkResponse;
      }).catch(() => {
        // Fallback offline untuk navigasi utama
        if (event.request.mode === 'navigate') {
          return caches.match('/');
        }
      });
    })
  );
});
