/* ===== Brew Book — service worker =====
   Stale-while-revalidate: every request is served instantly from cache when
   available, but is always also re-fetched from the network in the
   background so the cache is fresh for next time. This is what keeps an
   installed copy from ever getting silently stuck on an old version — see
   the controllerchange listener in index.html, which reloads the page once
   a new worker takes over.

   Bump CACHE_NAME to force-invalidate every installed copy's cache in one
   shot (e.g. after a breaking change to cached assets). Routine content/CSS/
   JS updates do NOT need this — stale-while-revalidate already refreshes
   each file in place as it's requested, regardless of the ?v=N query string
   index.html happens to be using at the time. */
const CACHE_NAME = 'brewbook-v1';

/* Only the version-independent app shell is precached at install time —
   the page itself, the manifest, and the icons. The versioned CSS/JS files
   (css/components.css?v=52 etc.) are deliberately NOT hardcoded here: by
   the time a page can be "installed" at all, it's already been loaded once
   online, which means the fetch handler below has already cached whatever
   ?v=N those files were at. Hardcoding them would just create a second
   place to remember to update every time index.html's version bumps. */
const PRECACHE_URLS = [
  './',
  './manifest.json',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/maskable-512.png',
  './icons/apple-touch-icon.png',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(names => Promise.all(names.filter(n => n !== CACHE_NAME).map(n => caches.delete(n))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;

  const url = new URL(req.url);
  /* Cross-origin (Supabase API, Google Fonts, CDN scripts) is left to the
     network untouched — this is live data or third-party assets, not the
     app shell, and must never come from a stale local cache. */
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    caches.open(CACHE_NAME).then(async cache => {
      const cached = await cache.match(req);
      const network = fetch(req).then(res => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => cached);
      return cached || network;
    })
  );
});
