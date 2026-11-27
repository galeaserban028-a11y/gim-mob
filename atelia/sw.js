/* Atelia Build — funcționare offline.
   - Paginile aplicației: întâi rețeaua (ca să primești mereu ultima versiune), cache doar dacă nu ai internet.
   - Bibliotecile (3D, PDF, QR) de pe CDN: din cache, actualizate în fundal.
   - Cererile către AI și conturi NU se pun niciodată în cache. */
const V = 'atelia-v2';
const SHELL = ['./', './index.html', './config.js', './termeni.html', './confidentialitate.html', './cookies.html', './legal.css', './manifest.webmanifest', './icons/icon-192.png', './en/terms.html', './en/privacy.html', './en/cookies.html'];
const CDN = /^https:\/\/(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)\//;

self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== V).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (CDN.test(req.url)) {
    e.respondWith(caches.open(V).then(async c => {
      const hit = await c.match(req);
      const net = fetch(req).then(r => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => hit);
      return hit || net;
    }));
    return;
  }
  if (url.origin === self.location.origin && url.pathname.startsWith(new URL('./', self.registration.scope).pathname)) {
    e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(V).then(c => c.put(req, r.clone())); return r; })
      .catch(() => caches.match(req).then(h => h || caches.match('./index.html'))));
  }
});
