// Service Worker — LMS Domain
// __CACHE_VERSION__ replaced at build time by scripts/stamp-sw.mjs.
const CACHE_VERSION = '__CACHE_VERSION__';
const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';

const STATIC_CACHE = `${CACHE_VERSION}-static`;
const COURSE_CACHE = `${CACHE_VERSION}-courses`;
const OFFLINE_DB_NAME = 'efh-offline-db';
const OFFLINE_DB_VERSION = 1;

const PRECACHE_ASSETS = [
  '/offline.html',
  '/manifest-lms.json',
  `${CDN}/icons/student-192.png`,
  `${CDN}/icons/student-512.png`,
];

function isCacheableResponse(response) {
  return Boolean(response && response.status === 200 && response.ok && !response.redirected && response.type !== 'opaqueredirect');
}

async function safeCachePut(cache, request, response) {
  if (!isCacheableResponse(response)) return false;
  try {
    await cache.put(request, response.clone());
    return true;
  } catch (error) {
    console.warn('[SW-lms] Cache put skipped:', error?.message || String(error));
    return false;
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(STATIC_CACHE);
    const results = await Promise.allSettled(PRECACHE_ASSETS.map(async (asset) => {
      const req = new Request(asset, { cache: 'reload', redirect: 'follow' });
      const res = await fetch(req);
      if (isCacheableResponse(res)) await safeCachePut(cache, req, res);
    }));
    const failures = results.filter((result) => result.status === 'rejected');
    if (failures.length) console.warn('[SW-lms] Optional precache failures:', failures.length);
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names
      .filter((name) => name.startsWith('elevate-lms-') && !name.startsWith(CACHE_VERSION))
      .map((name) => caches.delete(name)));
    await self.clients.claim();
    await syncTimeclockActions();
  })());
});

async function staleWhileRevalidate(request) {
  const cache = await caches.open(STATIC_CACHE);
  const cached = await cache.match(request);
  const network = fetch(request).then(async (response) => {
    await safeCachePut(cache, request, response);
    return response;
  }).catch(() => null);
  return cached || network;
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== self.location.origin) return;

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' }).catch(() => caches.match('/offline.html')));
    return;
  }

  if (
    request.headers.has('range') || request.headers.get('RSC') === '1' || url.searchParams.has('_rsc') ||
    url.pathname.startsWith('/api/') || /\/(?:login|logout|unauthorized)(?:\/|$)/.test(url.pathname) ||
    /\/(?:lms\/dashboard|apprentice|employer|host-shop|workforce|parent-portal)(?:\/|$)/.test(url.pathname)
  ) return;

  if (/^\/_next\/(?:static|data)\//.test(url.pathname)) {
    event.respondWith(fetch(request, { cache: 'no-store', redirect: 'follow' }));
    return;
  }

  const isStaticAsset = /\.(?:woff2?|ttf|eot|png|jpe?g|webp|avif|gif|svg|ico)$/i.test(url.pathname) ||
    url.pathname.startsWith('/images/') || url.pathname.startsWith('/icons/');
  if (!isStaticAsset) return;
  event.respondWith(staleWhileRevalidate(request).then((response) => response || fetch(request)));
});

async function cacheCourseResources(urls) {
  const cache = await caches.open(COURSE_CACHE);
  let cachedCount = 0;
  const uniqueUrls = Array.from(new Set(Array.isArray(urls) ? urls : []));
  await Promise.allSettled(uniqueUrls.map(async (rawUrl) => {
    const url = new URL(rawUrl, self.location.origin);
    if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;
    if (!/\.(?:pdf|png|jpe?g|webp|avif|gif|svg|mp3|m4a|ogg|wav|mp4|webm|vtt)$/i.test(url.pathname)) return;
    const request = new Request(url.toString(), { cache: 'reload', redirect: 'follow', credentials: 'same-origin' });
    const response = await fetch(request);
    if (await safeCachePut(cache, request, response)) cachedCount += 1;
  }));
  return { cachedCount, requestedCount: uniqueUrls.length };
}

self.addEventListener('message', (event) => {
  const { type, payload } = event.data || {};
  const reply = (message) => event.ports?.[0]?.postMessage(message);

  switch (type) {
    case 'CACHE_COURSE':
      event.waitUntil(cacheCourseResources(payload?.urls)
        .then((result) => reply({ ok: true, ...result }))
        .catch((error) => reply({ ok: false, error: error?.message || 'Offline resource download failed' })));
      break;
    case 'CLEAR_COURSE_CACHE':
      event.waitUntil(caches.delete(COURSE_CACHE)
        .then(() => reply({ ok: true }))
        .catch((error) => reply({ ok: false, error: error?.message || 'Offline resource cleanup failed' })));
      break;
    case 'SYNC_TIMECLOCK': event.waitUntil(syncTimeclockActions()); break;
    case 'SKIP_WAITING': self.skipWaiting(); break;
    case 'GET_CACHE_SIZE':
      event.waitUntil(Promise.all([
        caches.open(STATIC_CACHE).then((cache) => cache.keys()),
        caches.open(COURSE_CACHE).then((cache) => cache.keys()),
      ]).then(([staticKeys, courseKeys]) => event.source?.postMessage({
        type: 'CACHE_SIZE', payload: { static: staticKeys.length, courses: courseKeys.length },
      })));
      break;
  }
});

self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-timeclock' || event.tag === 'sync-offline-actions') event.waitUntil(syncTimeclockActions());
});

function openOfflineActionDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(OFFLINE_DB_NAME, OFFLINE_DB_VERSION);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains('offline-actions')) {
        const store = db.createObjectStore('offline-actions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('cached-data')) {
        const store = db.createObjectStore('cached-data', { keyPath: 'id', autoIncrement: true });
        store.createIndex('key', 'key', { unique: true });
        store.createIndex('timestamp', 'timestamp', { unique: false });
      }
      if (!db.objectStoreNames.contains('course-progress')) {
        const store = db.createObjectStore('course-progress', { keyPath: 'id', autoIncrement: true });
        store.createIndex('courseId', 'courseId', { unique: false });
        store.createIndex('lessonId', 'lessonId', { unique: false });
      }
    };
  });
}

function getAllOfflineActions(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-actions', 'readonly');
    const request = tx.objectStore('offline-actions').getAll();
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result || []);
  });
}

function deleteOfflineAction(db, id) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-actions', 'readwrite');
    const request = tx.objectStore('offline-actions').delete(id);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

function putOfflineAction(db, entry) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline-actions', 'readwrite');
    const request = tx.objectStore('offline-actions').put(entry);
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve();
  });
}

async function updateQueuedShiftReferences(db, clientShiftId, serverProgressEntryId) {
  if (!clientShiftId || !serverProgressEntryId) return;
  const queuedActions = await getAllOfflineActions(db);
  for (const queued of queuedActions) {
    if (queued?.type !== 'timeclock') continue;
    try {
      const payload = JSON.parse(queued.body || '{}');
      if (payload.client_shift_id !== clientShiftId || payload.action === 'clock_in') continue;
      if (!payload.progress_entry_id || String(payload.progress_entry_id).startsWith('offline:')) {
        payload.progress_entry_id = serverProgressEntryId;
        await putOfflineAction(db, { ...queued, body: JSON.stringify(payload) });
      }
    } catch {
      // Malformed records are handled by the main replay loop.
    }
  }
}

async function deleteShiftActions(db, clientShiftId) {
  if (!clientShiftId) return;
  const queuedActions = await getAllOfflineActions(db);
  for (const queued of queuedActions) {
    if (queued?.type !== 'timeclock') continue;
    try {
      const payload = JSON.parse(queued.body || '{}');
      if (payload.client_shift_id === clientShiftId) await deleteOfflineAction(db, queued.id);
    } catch {
      // Leave unrelated malformed records to the main replay loop.
    }
  }
}

async function notifyClients(message) {
  const clientList = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
  for (const client of clientList) client.postMessage(message);
}

async function syncTimeclockActions() {
  let db;
  try { db = await openOfflineActionDB(); }
  catch (error) {
    console.warn('[SW-lms] Offline queue unavailable:', error?.message || String(error));
    return;
  }

  const actions = (await getAllOfflineActions(db))
    .filter((entry) => entry?.type === 'timeclock')
    .sort((a, b) => Number(a.timestamp || 0) - Number(b.timestamp || 0));
  if (!actions.length) return;

  const serverShiftIds = new Map();
  let syncedCount = 0;
  let rejectedCount = 0;

  for (const queued of actions) {
    let payload;
    try { payload = JSON.parse(queued.body || '{}'); }
    catch {
      await deleteOfflineAction(db, queued.id);
      rejectedCount += 1;
      continue;
    }

    const clientShiftId = payload.client_shift_id;
    if (payload.action !== 'clock_in') {
      const resolved = serverShiftIds.get(clientShiftId);
      if (resolved) payload.progress_entry_id = resolved;
      if (!payload.progress_entry_id || String(payload.progress_entry_id).startsWith('offline:')) continue;
    }

    try {
      const response = await fetch(queued.url, {
        method: queued.method || 'POST',
        headers: queued.headers || { 'Content-Type': 'application/json' },
        credentials: 'same-origin',
        body: JSON.stringify(payload),
      });
      const data = await response.clone().json().catch(() => ({}));

      if (response.ok) {
        if (data.progress_entry_id && clientShiftId) {
          serverShiftIds.set(clientShiftId, data.progress_entry_id);
          if (payload.action === 'clock_in') await updateQueuedShiftReferences(db, clientShiftId, data.progress_entry_id);
        }
        await deleteOfflineAction(db, queued.id);
        syncedCount += 1;
        continue;
      }

      if (response.status === 401 || response.status >= 500) break;

      if (payload.action === 'clock_in' && clientShiftId) await deleteShiftActions(db, clientShiftId);
      else await deleteOfflineAction(db, queued.id);
      rejectedCount += 1;
      await notifyClients({
        type: 'TIMECLOCK_SYNC_REJECTED',
        data: { client_shift_id: clientShiftId, action: payload.action, error: data.error || `Rejected with status ${response.status}` },
      });
    } catch {
      break;
    }
  }

  if (syncedCount || rejectedCount) {
    await notifyClients({ type: 'TIMECLOCK_SYNC_COMPLETE', data: { syncedCount, rejectedCount } });
  }
}

self.addEventListener('push', (event) => {
  if (!event.data) return;
  let data;
  try { data = event.data.json(); }
  catch { data = { title: 'Elevate LMS', body: event.data.text() }; }
  const options = {
    body: data.body || 'You have a new notification',
    icon: `${CDN}/icons/student-192.png`, badge: `${CDN}/icons/student-192.png`,
    vibrate: [100, 50, 100], tag: data.tag || 'elevate-lms', renotify: true,
    data: { url: data.url || '/', type: data.type }, actions: data.actions || [],
  };
  event.waitUntil(self.registration.showNotification(data.title || 'Elevate LMS', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data?.url || '/'));
});
