/* Service worker: makes the trainer installable and keeps the big engine files
   (Stockfish WASM, chess.js) in a cache, so they are downloaded only once. */
const APP = 'trainer-app-v1';
const LIBS = 'trainer-libs-v1';
const SHELL = ['./', 'index.html', 'pieces.js', 'masters.js', 'manifest.json', 'icon.svg'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(APP).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== APP && k !== LIBS).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const u = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  /* versioned libraries never change: cache first */
  if (u.hostname === 'unpkg.com' || u.hostname === 'cdnjs.cloudflare.com') {
    e.respondWith(caches.open(LIBS).then(async c => {
      const hit = await c.match(e.request);
      if (hit) return hit;
      const r = await fetch(e.request);
      if (r.ok) c.put(e.request, r.clone());
      return r;
    }));
    return;
  }
  /* own files: network first (always fresh), cache as offline fallback */
  if (u.origin === location.origin && !u.pathname.startsWith('/engine')) {
    e.respondWith(fetch(e.request).then(r => {
      if (r.ok) caches.open(APP).then(c => c.put(e.request, r.clone()));
      return r;
    }).catch(() => caches.match(e.request).then(h => h || caches.match('index.html'))));
  }
});
