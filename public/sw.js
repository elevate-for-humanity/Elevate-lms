// LEGACY_WORKER_RETIREMENT
// `/sw.js` previously competed with each application's canonical worker for
// root scope and cached HTML at `/`. Keep this migration worker at the old URL
// long enough for installed browsers to update, clear legacy caches, and
// unregister it. It intentionally has no fetch handler.
self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const names = await caches.keys();
      await Promise.all(
        names.filter((name) => name.startsWith('elevate-')).map((name) => caches.delete(name)),
      );
      await self.registration.unregister();
    })(),
  );
});
