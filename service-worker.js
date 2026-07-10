const CACHE_NAME = 'paktv-cache-v5';
const ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/app.js?v=5',
  '/js/player.js?v=5',
  '/js/channels.js?v=5',
  '/manifest.json'
];

// Install Event
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // Use ignoreSearch to prevent query param cache misses if any
      return Promise.all(
        ASSETS.map(url => fetch(url).then(res => {
          if (!res.ok) throw new Error('Failed to fetch ' + url);
          return cache.put(url, res);
        }).catch(err => console.warn('Cache install skipping:', url, err)))
      );
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

// Fetch Event (Stale-While-Revalidate for static assets)
self.addEventListener('fetch', (e) => {
  // Ignore non-GET and cross-origin requests
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      const fetchPromise = fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200) {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseToCache));
        }
        return networkResponse;
      }).catch(() => null);

      return cachedResponse || fetchPromise.then(res => res || new Response('Offline', {status: 503}));
    })
  );
});
