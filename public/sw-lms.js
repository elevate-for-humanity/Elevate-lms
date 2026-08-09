// Service Worker — LMS Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';

const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const COURSE_CACHE = `${CACHE_VERSION}-courses`;
const OFFLINE_URL = '/offline.html';

const PRECACHE_ASSETS = [
  '/',
  OFFLINE_URL,
  '/manifest-lms.json',
  `${CDN}/icons/student-192.png`,
  `${CDN}/icons/student-512.png`,
];

const CACHE_STRATEGIES = {
  noCache: [
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/unauthorized/,
    /supabase/,
    /analytics/,
    /gtag/,
  ],
  nextChunks: [/\/_next\/static\//, /\/_next\/data\//],
  static: [/\.(woff2?|ttf|eot)$/, /\/images\//, /\/icons\//],
  staleWhileRevalidate: [/\/api\/public\//],
  networkFirst: [/\/courses\//, /\/programs\//, /\/lms\//],
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
        console.warn('[SW-lms] Optional precache failures:', failures.length);
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
          .filter((name) => name.startsWith('elevate-lms-') && !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok) {
      const cache = await caches.open(cacheName);
      cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cache = await caches.open(cacheName);
    const cached = await cache.match(request);
    if (cached) return cached;
    if (request.mode === 'navigate') {
      return (await caches.match(OFFLINE_URL)) || Response.error();
    }
    throw error;
  }
}

async function cacheFirst(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) return cached;
  const response = await fetch(request);
  if (response.ok) cache.put(request, response.clone());
  return response;
}

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const networkPromise = fetch(request)
    .then((response) => {
      if (response.ok) cache.put(request, response.clone());
      return response;
    })
    .catch(() => undefined);
  return cached || networkPromise || Response.error();
}

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  if (matchesPattern(url.pathname, CACHE_STRATEGIES.noCache)) return;

  if (matchesPattern(url.pathname, CACHE_STRATEGIES.nextChunks)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (matchesPattern(url.pathname, CACHE_STRATEGIES.static)) {
    event.respondWith(cacheFirst(event.request, STATIC_CACHE));
    return;
  }

  if (matchesPattern(url.pathname, CACHE_STRATEGIES.staleWhileRevalidate)) {
    event.respondWith(staleWhileRevalidate(event.request, DYNAMIC_CACHE));
    return;
  }

  if (matchesPattern(url.pathname, CACHE_STRATEGIES.networkFirst) || event.request.mode === 'navigate') {
    event.respondWith(networkFirst(event.request, COURSE_CACHE));
  }
});
