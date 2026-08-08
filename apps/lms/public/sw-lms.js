// Service Worker — LMS Domain
// Keep navigations on the browser/network path so Next.js auth redirects work normally.
const CACHE_VERSION = 'elevate-lms-2026-08-08-navigation-redirect-fix';
const STATIC_CACHE = `${CACHE_VERSION}-static`;
const DYNAMIC_CACHE = `${CACHE_VERSION}-dynamic`;
const COURSE_CACHE = `${CACHE_VERSION}-courses`;

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
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

async function networkFirst(request, cacheName) {
  try {
    const response = await fetch(request);
    if (response.ok && !response.redirected) {
      const cache = await caches.open(cacheName);
      await cache.put(request, response.clone());
    }
    return response;
  } catch (error) {
    const cached = await caches.match(request);
    if (cached) return cached;
    throw error;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // CRITICAL: Never intercept top-level navigations. Next.js may legitimately
  // redirect /lms/courses/* to /login. Returning a followed redirect from
  // FetchEvent.respondWith() can fail when the original request redirect mode
  // is not "follow", producing ERR_FAILED in Chromium.
  if (request.mode === 'navigate' || request.destination === 'document') return;

  // Never cache auth/API traffic.
  if (
    url.pathname.startsWith('/api/') ||
    url.pathname.startsWith('/login') ||
    url.pathname.startsWith('/logout') ||
    url.pathname.startsWith('/unauthorized')
  ) {
    return;
  }

  if (url.pathname.startsWith('/_next/static/')) {
    event.respondWith(fetch(request, { cache: 'no-store' }));
    return;
  }

  const cacheName =
    url.pathname.startsWith('/lms/') || url.pathname.startsWith('/courses/')
      ? COURSE_CACHE
      : url.pathname.match(/\.(woff2?|ttf|eot|png|jpe?g|webp|svg|ico)$/i)
        ? STATIC_CACHE
        : DYNAMIC_CACHE;

  event.respondWith(networkFirst(request, cacheName));
});

self.addEventListener('message', (event) => {
  const type = event.data?.type;
  if (type === 'SKIP_WAITING') self.skipWaiting();
  if (type === 'CLEAR_COURSE_CACHE') event.waitUntil(caches.delete(COURSE_CACHE));
});
