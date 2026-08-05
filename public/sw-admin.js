// Service Worker — Admin Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';

const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest-admin.json',
  `${CDN}/icons/admin-192.png`,
  `${CDN}/icons/admin-512.png`,
];

const CACHE_STRATEGIES = {
  // Never cache admin/auth routes or external services.
  noCache: [
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/unauthorized/,
    /supabase/,
    /analytics/,
    /gtag/,
  ],
  // Admin API data — stale-while-revalidate.
  staleWhileRevalidate: [/\/api\/public\//],
  // Next.js chunks — always network.
  nextChunks: [/\/_next\/static\//, /\/_next\/data\//],
  // Static assets.
  static: [/\.(woff2?|ttf|eot)$/, /\/images\//, /\/icons\//],
};

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      const results = await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          const req = new Request(asset, { cache: 'reload' });
          const res = await fetch(req);
          if (!res.ok) throw new Error(`Precache failed: ${asset} HTTP ${res.status}`);
          await cache.put(req, res);
        }),
      );
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length > 0) {
        console.warn('[SW-admin] Optional precache failures:', failures.length);
      }
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

function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch {
    return caches.match(request);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (matchesPattern(request.url, CACHE_STRATEGIES.noCache)) return;

  if (matchesPattern(request.url, CACHE_STRATEGIES.nextChunks)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store', redirect: 'follow' });
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response('Admin is temporarily unavailable.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })(),
    );
    return;
  }

  let responsePromise;
  if (matchesPattern(request.url, CACHE_STRATEGIES.static)) {
    responsePromise = staleWhileRevalidate(request, STATIC_CACHE);
  } else if (matchesPattern(request.url, CACHE_STRATEGIES.staleWhileRevalidate)) {
    responsePromise = staleWhileRevalidate(request, DYNAMIC_CACHE);
  } else {
    responsePromise = networkFirst(request, DYNAMIC_CACHE);
  }

  event.respondWith(
    responsePromise.then((response) => {
      if (response) return response;
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }),
  );
});

// Push notifications — admin users receive platform notifications.
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
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(url));
  }
});

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'GET_CACHE_SIZE') {
    Promise.all([
      caches.open(STATIC_CACHE).then((c) => c.keys()),
      caches.open(DYNAMIC_CACHE).then((c) => c.keys()),
    ]).then(([staticKeys, dynamicKeys]) => {
      event.source.postMessage({
        type: 'CACHE_SIZE',
        payload: { static: staticKeys.length, dynamic: dynamicKeys.length },
      });
    });
  }
});
