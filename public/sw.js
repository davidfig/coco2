// The installed game plays offline: the page comes from the network when there is one (so a new build arrives), else
// from the cache; everything else (hashed scripts, fonts, workers, icons) from the cache once fetched. Registered by
// src/game/touch/install.ts in production builds only.
const CACHE = 'coco2-v1';

self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== self.location.origin) return;
  const keep = (res) => {
    if (res.ok) {
      const copy = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copy));
    }
    return res;
  };
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(keep).catch(() => caches.match(req, { ignoreSearch: true })));
    return;
  }
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then(keep)));
});
