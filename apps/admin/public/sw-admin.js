// Service Worker — Admin Domain
// Keep document navigations under browser control so auth/Next.js redirects work normally.
const CACHE_VERSION = 'elevate-admin-v2';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) => name.startsWith('elevate-admin-') && !name.startsWith(CACHE_VERSION)).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch {
    return (await caches.match(request)) || new Response('Offline', { status: 503 });
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Never intercept top-level page navigations or auth/API traffic.
  if (request.mode === 'navigate') return;
  if (/\/api\//.test(url.pathname) || /\/(login|logout|unauthorized)(\/|$)/.test(url.pathname)) return;

  if (/\/_next\/static\//.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (/\.(woff2?|ttf|eot|png|jpg|jpeg|webp|svg|ico)$/.test(url.pathname)) {
    event.respondWith(networkFirst(request, STATIC_CACHE));
    return;
  }

  event.respondWith(networkFirst(request, DYNAMIC_CACHE));
});

self.addEventListener('message', (event) => {
  if (event.data?.type === 'SKIP_WAITING') self.skipWaiting();
});
