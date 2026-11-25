/* Service worker: makes the trainer installable and keeps the big engine files
   (Stockfish WASM, chess.js) in a cache, so they are downloaded only once. */
const APP = 'trainer-app-v4';
const LIBS = 'trainer-libs-v1';
const SHELL = ['./', 'index.html', 'pieces.js', 'masters.js', 'storm.js', 'manifest.json', 'icon.svg'];

async function isolate(r) {
  r = await r;
  if (!r || r.status === 0 || r.type === 'opaqueredirect') return r;
  const h = new Headers(r.headers);
  h.set('Cross-Origin-Opener-Policy', 'same-origin');
  h.set('Cross-Origin-Embedder-Policy', 'credentialless');
  return new Response(r.body, { status: r.status, statusText: r.statusText, headers: h });
}
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
  /* own files: network first (always fresh), cache as offline fallback.
     Headers make the page cross-origin isolated, so the multi-core Stockfish can use all CPU cores. */
  if (u.origin === location.origin && !u.pathname.startsWith('/engine') && !u.pathname.startsWith('/update')) {
    /* 'no-cache' = always ask the server if the file changed (GitHub Pages lets browsers keep files 10 min otherwise) */
    const req = e.request.mode === 'navigate' ? e.request : new Request(e.request, { cache: 'no-cache' });
    e.respondWith(fetch(req).then(r => {
      if (r.ok) caches.open(APP).then(c => c.put(e.request, r.clone()));
      return isolate(r);
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(h => isolate(h || caches.match('index.html')))));
  }
});
