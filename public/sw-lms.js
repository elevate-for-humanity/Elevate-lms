// Service Worker — LMS Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';
const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

const STATIC_CACHE = `${CACHE_VERSION}-static`;

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest-lms.json',
  '/manifest-student.json',
  '/manifest-apprentice.json',
  '/manifest-employer.json',
  '/manifest-program-holder.json',
  '/manifest-shop-owner.json',
  `${CDN}/icons/student-192.png`,
  `${CDN}/icons/student-512.png`,
  `${CDN}/icons/employer-192.png`,
  `${CDN}/icons/program-holder-192.png`,
  `${CDN}/icon-192.png`,
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
    console.warn('[SW-lms] Cache put skipped:', error?.message || String(error));
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
      if (failures.length) console.warn('[SW-lms] Optional precache failures:', failures.length);
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
          .filter(
            (name) =>
              (name.startsWith('elevate-lms-') && !name.startsWith(CACHE_VERSION)) ||
              name.endsWith('-courses'),
          )
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

  // Authentication and recovery navigations must bypass the service worker
  // completely so redirects and Set-Cookie headers reach the browser.
  if (
    request.mode === 'navigate' &&
    (
      url.pathname.startsWith('/api/auth/') ||
      url.pathname === '/reset-password' ||
      url.pathname === '/login' ||
      url.pathname.startsWith('/login/')
    )
  ) {
    return;
  }

  // Never cache authenticated HTML/RSC, application APIs, auth routes, range
  // requests, or protected dashboard/course navigations. Navigations are always
  // network-only with the public offline shell as the only fallback.
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
    /\/(?:login|logout|unauthorized)(?:\/|$)/.test(url.pathname) ||
    /\/(?:lms\/dashboard|lms\/courses|apprentice|employer|host-shop|workforce|parent-portal)(?:\/|$)/.test(
      url.pathname,
    )
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

self.addEventListener('message', (event) => {
  const { type } = event.data || {};

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_SIZE':
      event.waitUntil(
        caches
          .open(STATIC_CACHE)
          .then((cache) => cache.keys())
          .then((staticKeys) => {
            event.source?.postMessage({
              type: 'CACHE_SIZE',
              payload: { static: staticKeys.length, courses: 0 },
            });
          }),
      );
      break;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-hours') event.waitUntil(syncHoursData());
});

async function syncHoursData() {
  const db = await openOfflineDB();
  const tx = db.transaction('pending-hours', 'readwrite');
  const store = tx.objectStore('pending-hours');
  const requests = await getAllFromStore(store);

  for (const req of requests) {
    try {
      const response = await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(req.data),
      });
      if (response.ok) store.delete(req.id);
    } catch (error) {
      console.warn('[SW-lms] Hour sync deferred:', error?.message || String(error));
    }
  }
}

function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('elevate-offline-queue', 1);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('pending-hours')) {
        db.createObjectStore('pending-hours', { keyPath: 'id', autoIncrement: true });
      }
    };
  });
}

function getAllFromStore(store) {
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
  });
}

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Elevate LMS', body: event.data.text() };
  }

  const options = {
    body: data.body || 'You have a new notification',
    icon: `${CDN}/icons/student-192.png`,
    badge: `${CDN}/icons/student-192.png`,
    vibrate: [100, 50, 100],
    tag: data.tag || 'elevate-lms',
    renotify: true,
    data: { url: data.url || '/', type: data.type },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Elevate LMS', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';
  event.waitUntil(clients.openWindow(url));
});
