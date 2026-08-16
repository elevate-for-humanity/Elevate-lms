// Service Worker — Marketing Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';

const STATIC_CACHE = `${CACHE_VERSION}-static`;
// Never precache HTML routes. Navigations must always come from the network so
// an installed PWA cannot present an older homepage after a deployment.
const PRECACHE_ASSETS = ['/offline.html', '/manifest-marketing.json'];

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
          if (!isCacheableResponse(res)) return;
          await safeCachePut(cache, req, res);
        }),
      );
      const failures = results.filter((result) => result.status === 'rejected');
      if (failures.length) console.warn('[SW-marketing] Optional precache failures:', failures.length);
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
          .filter((name) => name.startsWith('elevate-') && name !== STATIC_CACHE)
          .map((name) => caches.delete(name)),
      );
      // A previous worker used the same deploy cache namespace and stored `/`.
      // Purge document entries that survived under the current cache name.
      const currentCache = await caches.open(STATIC_CACHE);
      const currentRequests = await currentCache.keys();
      await Promise.all(
        currentRequests
          .filter((request) => {
            const url = new URL(request.url);
            return request.mode === 'navigate' || request.destination === 'document' || url.pathname === '/';
          })
          .map((request) => currentCache.delete(request)),
      );
      await self.clients.claim();
    })(),
  );
});

async function networkFirst(request) {
  const cache = await caches.open(STATIC_CACHE);
  try {
    const response = await fetch(request, { cache: 'no-store', redirect: 'follow' });
    await safeCachePut(cache, request, response);
    return response;
  } catch {
    return (await cache.match(request)) || null;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  // Page navigation, auth, APIs, RSC payloads, media/range requests and unknown
  // dynamic resources always go directly to the browser/network. The service
  // worker must never hide a server error or create its own 503 response.
  if (request.mode === 'navigate') {
    // Do not call respondWith: browser navigations must use the deployed server
    // response and must never be written into CacheStorage.
    return;
  }

  if (
    request.headers.has('range') ||
    request.headers.get('RSC') === '1' ||
    url.searchParams.has('_rsc') ||
    url.pathname.startsWith('/api/') ||
    /\/(?:login|logout|unauthorized)(?:\/|$)/.test(url.pathname) ||
    /\.(?:mp4|webm|mov|m4v|mp3|m4a|wav|ogg|aac)$/i.test(url.pathname)
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

  // Always ask the network for Marketing imagery first. This prevents old
  // cached images from appearing after a deploy when a path is reused for a
  // different asset. Cached content is strictly an offline fallback.
  event.respondWith(
    networkFirst(request).then((response) => response || fetch(request, { cache: 'no-store' })),
  );
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
