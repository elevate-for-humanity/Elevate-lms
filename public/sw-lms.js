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
  `${CDN}/icons/admin-192.png`,
  `${CDN}/icons/admin-512.png`,
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
  } catch {
    return caches.match(request);
  }
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
          const offline = await caches.match(OFFLINE_URL);
          if (offline) return offline;
          return new Response('LMS is temporarily unavailable.', {
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
  } else if (matchesPattern(request.url, CACHE_STRATEGIES.networkFirst)) {
    responsePromise = networkFirst(request, COURSE_CACHE);
  } else {
    responsePromise = networkFirst(request, DYNAMIC_CACHE);
  }

  event.respondWith(
    responsePromise.then(async (response) => {
      if (response) return response;
      const offline = await caches.match(OFFLINE_URL);
      if (offline && request.destination === 'document') return offline;
      return new Response('Offline', { status: 503, statusText: 'Service Unavailable' });
    }),
  );
});

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_COURSE':
      if (payload?.urls) {
        caches.open(COURSE_CACHE).then((cache) => {
          Promise.allSettled(
            payload.urls.map((url) => fetch(url, { cache: 'reload' }).then((r) => r.ok && cache.put(url, r))),
          );
        });
      }
      break;

    case 'CLEAR_COURSE_CACHE':
      caches.delete(COURSE_CACHE);
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;

    case 'GET_CACHE_SIZE':
      Promise.all([
        caches.open(STATIC_CACHE).then((c) => c.keys()),
        caches.open(DYNAMIC_CACHE).then((c) => c.keys()),
        caches.open(COURSE_CACHE).then((c) => c.keys()),
      ]).then(([staticKeys, dynamicKeys, courseKeys]) => {
        event.source.postMessage({
          type: 'CACHE_SIZE',
          payload: { static: staticKeys.length, dynamic: dynamicKeys.length, courses: courseKeys.length },
        });
      });
      break;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-enrollment') event.waitUntil(syncEnrollmentData());
  if (event.tag === 'sync-hours') event.waitUntil(syncHoursData());
});

async function syncEnrollmentData() {
  console.log('[SW-lms] Syncing enrollment data...');
}

async function syncHoursData() {
  const db = await openOfflineDB();
  const tx = db.transaction('pending-hours', 'readwrite');
  const store = tx.objectStore('pending-hours');
  const requests = await getAllFromStore(store);

  for (const req of requests) {
    try {
      await fetch(req.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req.data),
      });
      store.delete(req.id);
    } catch (error) {
      console.log('[SW-lms] Failed to sync hours:', error);
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
    icon: `${CDN}/icons/admin-192.png`,
    badge: `${CDN}/icons/admin-96.png`,
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
  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(url));
  }
});
