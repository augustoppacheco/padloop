// Pad Loop - funciona offline. Mude VERSION a cada atualização.
const VERSION = 'padloop-2026-11-19a';
const CORE = ['./', './index.html', './ipad.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];
const TONS = ['C','Db','D','Eb','E','F','Gb','G','Ab','A','Bb','B'].map(t => './amb/' + t + '.mp3');
self.addEventListener('install', e => {
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(CORE)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (k !== VERSION && k !== 'padloop-tons') await caches.delete(k);
    await self.clients.claim();
    // baixa os 12 tons em segundo plano para tocar sem internet
    const c = await caches.open('padloop-tons');
    for (const u of TONS) { try { if (!(await c.match(u))) { const r = await fetch(u); if (r.ok) await c.put(u, r); } } catch (_) {} }
  })());
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const url = new URL(req.url);
  if (url.pathname.includes('/amb/')) {
    // tons: do cache primeiro
    e.respondWith(caches.open('padloop-tons').then(async c => {
      const hit = await c.match(req, {ignoreSearch: true});
      if (hit) return hit;
      const r = await fetch(req); if (r.ok) c.put(req, r.clone()); return r;
    }));
    return;
  }
  // páginas e ícones: tenta a internet (pega atualizações), senão usa o salvo
  e.respondWith(fetch(req).then(r => {
    if (r.ok) { const cp = r.clone(); caches.open(VERSION).then(c => c.put(req, cp)); }
    return r;
  }).catch(() => caches.match(req, {ignoreSearch: true}).then(r => r || caches.match('./index.html'))));
});
