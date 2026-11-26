// Mașina de Povești — service worker: aplicația pornește și fără net; versiunea nouă vine automat când ai net.
const CACHE='povesti-v4';
const FISIERE=['./','./index.html','./manifest.webmanifest','./icon-192.png','./icon-512.png','./apple-touch-icon.png'];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(CACHE).then(c=>c.addAll(FISIERE)).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(x=>x!==CACHE).map(x=>caches.delete(x)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch',e=>{
  const u=new URL(e.request.url);
  if(e.request.method!=='GET'||u.origin!==location.origin) return; // serviciile AI și pozele merg direct, fără cache
  e.respondWith(fetch(e.request).then(r=>{ if(r.ok){ const k=r.clone(); caches.open(CACHE).then(c=>c.put(e.request,k)); } return r; })
    .catch(()=>caches.match(e.request).then(r=>r||caches.match('./index.html'))));
});
