/// <reference lib="webworker" />

// TerraMetrics 3D PWA Service Worker (TypeScript Source)
declare const self: ServiceWorkerGlobalScope;

const CACHE_NAME = 'terrametrics-cache-v2.1';
const STATIC_ASSETS: string[] = [
  '/',
  '/index.html',
  '/manifest.json',
  '/version.json',
  '/countries.geojson',
  '/religions.json',
  '/indexes.json',
  '/demographics.json'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => {
        return cache.addAll(STATIC_ASSETS).catch((err: unknown) => {
          console.warn('[ServiceWorker] Precache warning:', err);
        });
      })
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event: ExtendableEvent) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys: string[]) => {
        return Promise.all(
          keys.map((key) => {
            if (key !== CACHE_NAME) {
              return caches.delete(key);
            }
          })
        );
      })
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  const request = event.request;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Strategy 1: Data and Map Tiles - Cache-First with Background Revalidation
  if (url.pathname.includes('/data/') || url.pathname.includes('/tiles/')) {
    event.respondWith(
      caches.match(request).then((cachedResponse): Promise<Response> | Response => {
        if (cachedResponse) {
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => cache.put(request, networkResponse));
              }
            })
            .catch(() => {});
          return cachedResponse;
        }
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const clone = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, clone));
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // Strategy 2: App Shell & Scripts - Stale-While-Revalidate with Safe Fallback
  event.respondWith(
    caches.match(request).then((cachedResponse): Promise<Response> | Response => {
      const fetchPromise = fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          if (cachedResponse) return cachedResponse;
          return new Response('Network offline and asset not in cache', {
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'Content-Type': 'text/plain' },
          });
        });

      return cachedResponse || fetchPromise;
    })
  );
});

export {};
