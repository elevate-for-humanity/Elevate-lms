const BUILD_ID = "elevate-admin-v3";
const CDN = 'https://cuxzzpsyufcewtmicszk.supabase.co/storage/v1/object/public/images';
const STATIC_CACHE = `${BUILD_ID}-static`;

const STATIC_ASSETS = [
  `${CDN}/icons/admin-192.png`,
  `${CDN}/icons/admin-512.png`,
  `${CDN}/icons/admin-512-maskable.png`,
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => 
        Promise.all(
          STATIC_ASSETS.map((url) =>
            fetch(url).then((res) => {
              if (res.ok) return cache.put(url, res);
            }).catch(() => {})
          )
        )
      )
      .then(() => self.skipWaiting())
      .catch(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith("elevate-admin-"))
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
