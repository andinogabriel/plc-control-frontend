/* Minimal service worker: makes the app installable and gives a basic offline shell.
   Network-first for navigations (so deploys are picked up), stale-while-revalidate for
   same-origin static assets. API calls are never cached. */
const CACHE = 'plc-shell-v1';

self.addEventListener('install', (event) => {
  // Do NOT skipWaiting automatically: a new version waits until the user accepts the update
  // prompt (which posts SKIP_WAITING), so we never reload the app from under them.
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/'])));
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;        // don't touch the backend/CDN
  if (url.pathname.startsWith('/api')) return;

  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/')),
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((res) => {
          if (res.ok) caches.open(CACHE).then((c) => c.put(request, res.clone()));
          return res;
        })
        .catch(() => cached);
      return cached || network;
    }),
  );
});
