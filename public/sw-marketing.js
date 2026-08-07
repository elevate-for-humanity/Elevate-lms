// Service Worker — Marketing Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;

const PRECACHE_ASSETS = ['/', '/offline.html', '/manifest-marketing.json'];

const CACHE_STRATEGIES = {
  noCache: [
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/unauthorized/,
    /supabase/,
    /analytics/,
    /gtag/,
    /\.(mp4|webm|mov|m4v|mp3|m4a|wav|ogg|aac)$/i,
  ],
  nextChunks: [/\/_next\/static\//, /\/_next\/data\//],
  static: [/\.(woff2?|ttf|eot)$/i, /\/images\//, /\/icons\//],
  staleWhileRevalidate: [/\/api\/public\//],
};

function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

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
    console.warn('[SW-marketing] Cache put skipped:', error?.message || String(error));
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
          if (!isCacheableResponse(res)) {
            throw new Error(`Precache skipped: ${asset} HTTP ${res.status}`);
          }
          await safeCachePut(cache, req, res);
        }),
      );
      const failures = results.filter((r) => r.status === 'rejected');
      if (failures.length) {
        console.warn('[SW-marketing] Optional precache failures:', failures.length);
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
          .filter((name) => name.startsWith('elevate-marketing-') && !name.startsWith(CACHE_VERSION))
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchPromise = fetch(request)
    .then(async (response) => {
      await safeCachePut(cache, request, response);
      return response;
    })
    .catch(() => null);
  return cached || fetchPromise;
}

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (isCacheableResponse(response)) {
      const cache = await caches.open(cacheName);
      await safeCachePut(cache, request, response);
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

  // Let the browser handle page navigations and redirects directly.
  // This prevents redirected navigation requests such as /host-shop from
  // failing because of a service-worker Request redirect mode mismatch.
  if (request.mode === 'navigate') return;

  // Range requests return HTTP 206 and cannot be written to Cache Storage.
  // Let the browser/network handle them directly.
  if (request.headers.has('range')) return;

  if (matchesPattern(request.url, CACHE_STRATEGIES.noCache)) return;

  // Never cache or serve stale Next.js build assets.
  if (matchesPattern(request.url, CACHE_STRATEGIES.nextChunks)) {
    event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' }));
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

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'GET_CACHE_SIZE') {
    caches
      .open(STATIC_CACHE)
      .then((c) => c.keys())
      .then((keys) => {
        event.source?.postMessage({ type: 'CACHE_SIZE', payload: { static: keys.length } });
      });
  }
});
