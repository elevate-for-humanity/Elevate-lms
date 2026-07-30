const BUILD_ID = "elevate-admin-v1";
const STATIC_CACHE = `${BUILD_ID}-static`;

const STATIC_ASSETS = [
  "/admin/install",
  "/icons/admin-192.png",
  "/icons/admin-512.png",
  "/icons/admin-maskable-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key !== STATIC_CACHE)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET") {
    return;
  }

  if (url.origin !== self.location.origin) {
    return;
  }

  if (
    url.pathname.startsWith("/api/") ||
    url.pathname.startsWith("/admin/") ||
    request.headers.get("RSC") === "1" ||
    request.headers.has("Next-Action")
  ) {
    event.respondWith(fetch(request));
    return;
  }

  if (
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/")
  ) {
    event.respondWith(
      caches.match(request).then((cached) => {
        if (cached) {
          return cached;
        }

        return fetch(request).then((response) => {
          if (!response.ok) {
            return response;
          }

          const copy = response.clone();

          caches
            .open(STATIC_CACHE)
            .then((cache) => cache.put(request, copy));

          return response;
        });
      }),
    );
  }
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});
