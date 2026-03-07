const CACHE = 'mizaan-v1';
const ASSETS = [
  './gold-calculator_9.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png'
];

// Install: cache the app shell
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(
      ASSETS.filter(a => !a.endsWith('.png')) // skip icons if missing
    ))
  );
  self.skipWaiting();
});

// Activate: clean up old caches
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// Fetch: network first, fall back to cache
// This means the app always tries to get fresh gold prices,
// but loads instantly from cache if offline
self.addEventListener('fetch', e => {
  // Don't intercept the GoldAPI call — let it fail naturally
  // so the app can handle it with the manual entry panel
  if (e.request.url.includes('goldapi.io')) return;

  e.respondWith(
    fetch(e.request)
      .then(res => {
        // Cache successful responses for app shell files
        if (res.ok && e.request.method === 'GET') {
          const clone = res.clone();
          caches.open(CACHE).then(cache => cache.put(e.request, clone));
        }
        return res;
      })
      .catch(() => caches.match(e.request))
  );
});
