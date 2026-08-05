// Service Worker — Marketing Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';

// Cache names — prefixed with domain so each app gets unique caches.
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const OFFLINE_URL = '/offline.html';

// Critical path assets precached on install.
// Uses Promise.allSettled so a missing icon does not block SW activation.
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  '/manifest-marketing.json',
];

// Patterns for caching strategies.
const CACHE_STRATEGIES = {
  // Always hit the network — never cache.
  noCache: [
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/unauthorized/,
    /supabase/,
    /analytics/,
    /gtag/,
  ],
  // Next.js chunks — always network so stale chunks never break the app.
  nextChunks: [/\/_next\/static\//, /\/_next\/data\//],
  // Cache-first for fonts and images only.
  static: [/\.(woff2?|ttf|eot)$/, /\/images\//, /\/icons\//],
  // Stale-while-revalidate for public API data.
  staleWhileRevalidate: [/\/api\/public\//],
};

// Install — precache critical assets.
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
        console.warn('[SW-marketing] Optional precache failures:', failures.length);
      }
      await self.skipWaiting();
    })(),
  );
});

// Activate — evict all old elevate-marketing caches from previous deployments.
self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names
          .filter((name) => name.startsWith('elevate-marketing-') && !name.startsWith(CACHE_VERSION))
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

// Fetch — smart caching based on request type.
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET') return;
  if (url.origin !== self.location.origin) return;
  if (matchesPattern(request.url, CACHE_STRATEGIES.noCache)) return;

  // Never serve stale Next.js chunks.
  if (matchesPattern(request.url, CACHE_STRATEGIES.nextChunks)) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  // Navigations — always network-first.
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store', redirect: 'follow' });
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response('Elevate for Humanity is temporarily unavailable.', {
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

// Message — cache management commands.
self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'GET_CACHE_SIZE') {
    caches.open(STATIC_CACHE).then((c) => c.keys()).then((keys) => {
      event.source.postMessage({ type: 'CACHE_SIZE', payload: { static: keys.length } });
    });
  }
});
