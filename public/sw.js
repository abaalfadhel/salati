// Service Worker for صلاتي | قضاء ما في الذمة
// All URLs are resolved relative to this worker's registration scope, so the app
// works both in a GitHub Pages subdirectory and on a future custom domain.
const CACHE_PREFIX = 'salati-';
const CACHE_NAME = `${CACHE_PREFIX}v2`;
const scopeUrl = new URL('./', self.registration.scope);
const appShell = new URL('index.html', scopeUrl).href;
const manifestUrl = new URL('manifest.json', scopeUrl).href;
const iconUrl = new URL('icons/icon-192.png', scopeUrl).href;

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    // A failure to cache one optional asset must not prevent installation.
    await cache.add(new Request(appShell, { cache: 'reload' }));
    await Promise.all([manifestUrl, iconUrl].map(async (url) => {
      try { await cache.add(url); } catch (error) { console.warn('Optional precache failed:', url, error); }
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME).map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const request = event.request;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(appShell, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(appShell)) || new Response('التطبيق غير متاح دون اتصال بعد. افتحه مرة واحدة مع الاتصال بالإنترنت.', {
          status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      }
    })());
    return;
  }

  // Cache-first for same-origin build assets; cache successful responses for offline use.
  event.respondWith((async () => {
    const cache = await caches.open(CACHE_NAME);
    const cached = await cache.match(request);
    if (cached) return cached;
    try {
      const response = await fetch(request);
      if (response.ok && response.type === 'basic') await cache.put(request, response.clone());
      return response;
    } catch {
      if (request.destination === 'image') {
        const fallback = await cache.match(iconUrl);
        if (fallback) return fallback;
      }
      return new Response('', { status: 503, statusText: 'Offline' });
    }
  })());
});
