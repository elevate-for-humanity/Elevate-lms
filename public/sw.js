// Service Worker for Elevate for Humanity PWA
// CACHE_VERSION is replaced at build time by scripts/stamp-sw.mjs.
// Bump this manually when deploying fixes that must bypass stale cache.
const CACHE_VERSION =
  "elevate-v1776550800000";

const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

const STATIC_CACHE = `elevate-static-${CACHE_VERSION}`;
const DYNAMIC_CACHE = `elevate-dynamic-${CACHE_VERSION}`;
const COURSE_CACHE = `elevate-courses-${CACHE_VERSION}`;
const OFFLINE_URL = '/offline.html';

// Assets to cache on install (critical path)
const PRECACHE_ASSETS = [
  '/',
  '/offline.html',
  `${CDN}/icons/admin-192.png`,
  `${CDN}/icons/admin-512.png`,
  '/manifest.webmanifest',
];

// Patterns for different caching strategies
const CACHE_STRATEGIES = {
  // Never cache — always hit the network
  noCache: [
    /\/admin(\/|$)/,
    /\/api\//,
    /\/login/,
    /\/logout/,
    /\/unauthorized/,
    /supabase/,
    /analytics/,
    /gtag/,
  ],
  // Network-first for Next.js chunks — prevents stale chunks from breaking the app
  nextChunks: [/\/_next\/static\//, /\/_next\/data\//],
  // Cache-first for static assets (images, fonts, etc.)
  static: [/\.(js|css|woff2?|ttf|eot)$/, /\/images\//, /\/icons\//],
  // Network-first for dynamic content
  networkFirst: [/\/courses\//, /\/programs\//, /\/lms\//],
  // Stale-while-revalidate for API data
  staleWhileRevalidate: [/\/api\/public\//],
};

// Install event - cache essential assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames
            .filter((name) => {
              return name.startsWith('elevate-') && !name.includes(CACHE_VERSION);
            })
            .map((name) => caches.delete(name)),
        );
      })
      .then(() => self.clients.claim()),
  );
});

// Helper: Check if URL matches any pattern
function matchesPattern(url, patterns) {
  return patterns.some((pattern) => pattern.test(url));
}

// Helper: Network-first strategy
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

// Helper: Stale-while-revalidate strategy
async function staleWhileRevalidate(request, cacheName) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);

  const fetchPromise = fetch(request)
    .then((response) => {
      if (response.ok) {
        cache.put(request, response.clone());
      }
      return response;
    })
    .catch(() => null);

  return cached || fetchPromise;
}

// Fetch event - Smart caching based on request type
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') return;

  // Skip external URLs
  if (url.origin !== self.location.origin) return;

  // Skip no-cache patterns
  if (matchesPattern(request.url, CACHE_STRATEGIES.noCache)) return;

  // ================================================================
  // Never serve stale Next.js chunks before checking the network.
  // ================================================================
  if (matchesPattern(request.url, CACHE_STRATEGIES.nextChunks)) {
    event.respondWith(
      fetch(request).catch(async () => {
        const cached = await caches.match(request);
        if (cached) return cached;
        throw new Error('Next.js asset unavailable.');
      }),
    );
    return;
  }

  // ================================================================
  // Navigations must be network-first so an old HTML page does not
  // reference deleted chunk hashes.
  // ================================================================
  if (request.mode === 'navigate') {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request, { cache: 'no-store', redirect: 'follow' });
        } catch {
          const cached = await caches.match(request);
          if (cached) return cached;
          return new Response('The application is temporarily unavailable.', {
            status: 503,
            headers: { 'Content-Type': 'text/plain' },
          });
        }
      })(),
    );
    return;
  }

  // Determine caching strategy for non-navigation requests
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
    responsePromise.then((response) => {
      if (response) return response;
      return new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      });
    }),
  );
});

// Message event - Handle cache management from app
self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};

  switch (type) {
    case 'CACHE_COURSE':
      if (payload?.urls) {
        caches.open(COURSE_CACHE).then((cache) => {
          cache.addAll(payload.urls);
        });
      }
      break;

    case 'CLEAR_COURSE_CACHE':
      caches.delete(COURSE_CACHE);
      break;

    case 'GET_CACHE_SIZE':
      Promise.all([
        caches.open(STATIC_CACHE).then((c) => c.keys()),
        caches.open(DYNAMIC_CACHE).then((c) => c.keys()),
        caches.open(COURSE_CACHE).then((c) => c.keys()),
      ]).then(([staticKeys, dynamicKeys, courseKeys]) => {
        event.source.postMessage({
          type: 'CACHE_SIZE',
          payload: {
            static: staticKeys.length,
            dynamic: dynamicKeys.length,
            courses: courseKeys.length,
          },
        });
      });
      break;

    case 'SKIP_WAITING':
      self.skipWaiting();
      break;
  }
});

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-enrollment') {
    event.waitUntil(syncEnrollmentData());
  }
  if (event.tag === 'sync-hours') {
    event.waitUntil(syncHoursData());
  }
});

async function syncEnrollmentData() {
  console.log('[SW] Syncing enrollment data...');
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
      console.log('[SW] Synced hours log:', req.id);
    } catch (error) {
      console.log('[SW] Failed to sync hours:', error);
    }
  }
}

// IndexedDB helpers for offline queue
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

// Push notification handling
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
    icon: data.icon || `${CDN}/icons/admin-192.png`,
    badge: `${CDN}/icons/admin-96.png`,
    vibrate: [100, 50, 100],
    tag: data.tag || 'default',
    renotify: true,
    data: {
      url: data.url || '/',
      type: data.type,
    },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Elevate LMS', options));
});

// Notification click handling
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  const url = event.notification.data?.url || '/';

  if (event.action === 'view') {
    event.waitUntil(clients.openWindow(url));
    return;
  }

  if (event.action === 'dismiss') {
    return;
  }

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.navigate(url);
          return client.focus();
        }
      }
      return clients.openWindow(url);
    }),
  );
});

// Notification close handling
self.addEventListener('notificationclose', (event) => {
  console.log('[SW] Notification closed:', event.notification.tag);
});

console.log(`[SW] Service Worker loaded — cache: ${CACHE_VERSION}`);
