// This worker handles public launchers and their static assets only.
const launchPath = new URL(self.registration.scope).pathname;
const cacheName = 'elevate-workspace-v1:' + launchPath;
const assets = new Map([
  [launchPath, 'text/html'],
  ['/install/workspace.js', 'javascript'],
  ['/install/workspace.css', 'text/css'],
]);

async function refresh(path, cache) {
  const response = await fetch(path, { credentials: 'omit', redirect: 'error', cache: 'no-store' });
  if (response.status !== 200 || !response.headers.get('content-type')?.includes(assets.get(path))) {
    throw new Error('Workspace asset unavailable');
  }
  await cache.put(path, response.clone());
  return response;
}

self.addEventListener('install', (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(cacheName);
    await Promise.all([...assets.keys()].map((path) => refresh(path, cache)));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const names = await caches.keys();
    await Promise.all(names.filter((name) =>
      name.startsWith('elevate-workspace-') && name.endsWith(':' + launchPath) && name !== cacheName,
    ).map((name) => caches.delete(name)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin ||
      url.search || !assets.has(url.pathname)) return;

  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      return await refresh(url.pathname, cache);
    } catch {
      return await cache.match(url.pathname) || Response.error();
    }
  })());
});
