// Service Worker — Admin Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';
const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';
const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest-admin.json',
  `${CDN}/icons/admin-192.png`,
  `${CDN}/icons/admin-512.png`,
];

function isCacheableResponse(response) {
  return Boolean(
    response &&
      response.status === 200 &&
      response.ok &&
      !response.redirected &&
      response.type !== 'opaqueredirect',
  );
}

async function safeCachePut(cache, request, response) {
  if (!isCacheableResponse(response)) return;
  try {
    await cache.put(request, response.clone());
  } catch (error) {
    console.warn('[SW-admin] Cache put skipped:', error?.message || String(error));
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          const req = new Request(asset, { cache: 'reload', redirect: 'follow' });
          const res = await fetch(req);
          if (!isCacheableResponse(res)) return;
          await safeCachePut(cache, req, res);
        }),
      );
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length) console.warn('[SW-admin] Optional precache failures:', failures.length);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('elevate-admin-') && !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request)
    .then(async (response) => {
      await safeCachePut(cache, request, response);
      return response;
    })
    .catch(() => null);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Admin HTML remains network-only because it can contain sensitive records.
  // The only cached navigation response is the public offline shell, returned
  // after the network fails; authenticated pages themselves are never stored.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request, { cache: 'no-store', redirect: 'follow' }).catch(() =>
        caches.match('/offline.html'),
      ),
    );
    return;
  }

  if (
    request.headers.has('range') ||
    request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc') ||
    url.pathname.startsWith('/api/') ||
    /\/(?:login|logout|unauthorized)(?:\/|$)/.test(url.pathname)
  ) {
    return;
  }

  if (/^\/_next\/(?:static|data)\//.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' }));
    return;
  }

  const isStaticAsset =
    /\.(?:woff2?|ttf|eot|png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith('/images/') ||
    url.pathname.startsWith('/icons/');

  if (!isStaticAsset) return;
  event.respondWith(staleWhileRevalidate(request).then((response) => response || fetch(request)));
});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Elevate Admin', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: `${CDN}/icons/admin-192.png`,
    badge: `${CDN}/icons/admin-96.png`,
    vibrate: [100, 50, 100],
    tag: data.tag || 'elevate-admin',
    renotify: true,
    data: { url: data.url || '/', type: data.type },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Elevate Admin', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'GET_CACHE_SIZE') {
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.keys())
      .then((keys) => {
        event.source?.postMessage({ type: 'CACHE_SIZE', payload: { static: keys.length } });
      });
  }
});
