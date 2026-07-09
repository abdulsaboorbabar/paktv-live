// service-worker.js
const CACHE_NAME = 'paktv-cache-v1';
const ASSETS = [
  '/',
  '/index.php',
  '/css/style.css',
  '/js/app.js',
  '/js/player.js',
  '/manifest.json',
  '/assets/offline.html',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    }).then(() => self.skipWaiting())
  );
});

// Activate Event
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch Event
self.addEventListener('fetch', (e) => {
  // Let API requests bypass the service worker cache directly to network,
  // or use Network First for dynamic endpoints
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => {
        return new Response(JSON.stringify({ success: false, error: 'Offline' }), {
          headers: { 'Content-Type': 'application/json' }
        });
      })
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Return cached, but fetch fresh in background
        fetch(e.request).then((networkResponse) => {
          if (networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {/* Ignore network errors during background sync */});
        return cachedResponse;
      }

      return fetch(e.request).catch(() => {
        // If request is for a document/page, show offline.html
        if (e.request.headers.get('accept').includes('text/html')) {
          return caches.match('/assets/offline.html');
        }
      });
    })
  );
});
