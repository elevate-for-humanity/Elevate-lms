// Service Worker — Elevate Phone (dedicated communications PWA)
// Scope: /phone/ (registered by components/pwa/PhonePwaRegistration.tsx).
//
// This worker exists so the phone system no longer shares the Admin app's
// service-worker lifecycle: Admin deploys restamp and replace sw-admin.js,
// which used to churn the worker that owned the phone's push subscription.
// The cache name is deliberately NOT build-stamped — this file changes only
// when the phone shell itself changes, so an Admin release cannot reset the
// phone's registration, caches, or push subscription.
//
// Fetch policy: the worker never intercepts. Navigations, /api/ calls and
// RSC payloads go straight to the network (a pass-through listener is
// registered only so the app stays installable); the dialplan wake window
// and the SIP client do the real work.
const CACHE_NAME = 'elevate-phone-v1';
const PRECACHE_ASSETS = [
  '/manifest-phone.json',
  '/icon-phone-192.png',
  '/icon-phone-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await Promise.allSettled(
        PRECACHE_ASSETS.map(async (asset) => {
          const response = await fetch(asset, { cache: 'reload', redirect: 'follow' });
          if (response && response.ok && response.status === 200) {
            await cache.put(asset, response.clone());
          }
        }),
      );
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
          .filter((name) => name.startsWith('elevate-phone-') && name !== CACHE_NAME)
          .map((name) => caches.delete(name)),
      );
      await self.clients.claim();
    })(),
  );
});

// Pass-through only: never respondWith. The phone must behave exactly like
// the network for pages, APIs and media.
self.addEventListener('fetch', () => {});

self.addEventListener('push', (event) => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: 'Elevate Phone', body: event.data.text() };
  }

  // Call-wake pushes (lib/phone/call-wake.ts) carry data.type 'incoming_call'.
  // They are not ordinary notifications: the phone must buzz hard, the alert
  // must stay on screen until tapped, and the click must land on the phone
  // page in wake mode so the call can be answered.
  const payload = data && typeof data.data === 'object' && data.data ? data.data : {};
  const isCallWake = payload.type === 'incoming_call' || data.type === 'incoming_call';

  if (isCallWake) {
    const callId = typeof payload.callId === 'string' ? payload.callId : '';
    const options = {
      body: data.body || 'Tap to open your phone and answer.',
      icon: '/icon-phone-192.png',
      badge: '/icon-phone-192.png',
      vibrate: data.vibrate || [400, 200, 400, 200, 400, 200, 400],
      tag: data.tag || (callId ? `incoming-call-${callId}` : 'incoming-call'),
      renotify: true,
      requireInteraction: true,
      data: {
        url: data.url || '/phone/dial-pad?wake=1',
        type: 'incoming_call',
        callId,
        extension: typeof payload.extension === 'string' ? payload.extension : '',
        caller: typeof payload.caller === 'string' ? payload.caller : '',
      },
    };
    event.waitUntil(self.registration.showNotification(data.title || 'Incoming call', options));
    return;
  }

  const options = {
    body: data.body || 'You have a new notification',
    silent: data.silent === true,
    icon: '/icon-phone-192.png',
    badge: '/icon-phone-192.png',
    ...(data.silent === true ? {} : { vibrate: data.vibrate || [100, 50, 100] }),
    tag: data.tag || 'elevate-phone',
    renotify: true,
    requireInteraction: data.requireInteraction === true || data.important === true,
    data: { url: data.url || '/phone/dial-pad', type: data.type },
    actions: data.actions || [],
  };

  event.waitUntil(self.registration.showNotification(data.title || 'Elevate Phone', options));
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const target = event.notification.data?.url || '/phone/dial-pad';
  event.waitUntil(
    (async () => {
      // Fastest path to the call: focus an app window that is already open
      // and navigate it straight to the target (for a call wake, the phone
      // page in wake mode) instead of cold-opening a new window.
      const targetUrl = new URL(target, self.location.origin);
      const windowClients = await clients.matchAll({ type: 'window', includeUncontrolled: true });
      for (const client of windowClients) {
        if (new URL(client.url).origin !== targetUrl.origin) continue;
        try {
          await client.focus();
        } catch {
          continue;
        }
        if ('navigate' in client) {
          try {
            await client.navigate(targetUrl.href);
          } catch {
            // The focused window is already usable; navigation is a shortcut.
          }
        }
        return;
      }
      await clients.openWindow(targetUrl.href);
    })(),
  );
});

self.addEventListener('message', (event) => {
  const { type } = event.data || {};
  if (type === 'SKIP_WAITING') self.skipWaiting();
});
