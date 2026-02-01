// public/service-worker.js

// Force Update: 2026-02-01T13:50:00 (Manual Cache Buster)
// Wir erhöhen die Version, um sicherzustellen, dass das iPad den neuen Wächter lädt.
const CACHE_NAME = 'linexio-core-v52';
const RUNTIME_CACHE_NAME = 'linexio-runtime-v1';

const urlsToCache = [
  './',
  'index.html',
  'manifest.json?v=20260201',
  'logo192.png?v=20260201',
  'logo512.png?v=20260201',
  'apple-touch-icon.png?v=20260201',
  'favicon.png?v=20260201',
  'index.css',
  'index.tsx', // In dieser Umgebung wird die .tsx direkt als Modul geladen und muss gecached werden
];

// 1. Installations-Event: Statische Assets (App-Shell) cachen
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('SW: Caching static assets...');
        return cache.addAll(urlsToCache);
      })
  );
});

// 2. Aktivierungs-Event: Alte Caches säubern
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME, RUNTIME_CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (!cacheWhitelist.includes(cacheName)) {
            console.log('SW: Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Übernimmt sofort die Kontrolle, ohne auf Neuladen zu warten
      return self.clients.claim();
    })
  );
});

// 3. Nachrichten-Handler
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// 4. Fetch-Event: Der Offline-Schutzmechanismus
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Strategie für Navigationsanfragen (App-Start)
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // KRITISCH: Erkenne CDN-Anfragen für Bibliotheken (React, Google AI, ESM.sh)
  // Ohne diese ist die App funktionsunfähig, wenn sie nicht im Cache sind.
  const isExternalLibrary = url.hostname.includes('aistudiocdn.com') || url.hostname.includes('esm.sh');

  if (isExternalLibrary) {
    event.respondWith(
      caches.open(RUNTIME_CACHE_NAME).then(cache => {
        return cache.match(event.request).then(cachedResponse => {
          // Falls im Cache: Sofort liefern
          if (cachedResponse) {
            return cachedResponse;
          }

          // Falls nicht im Cache: Laden und für die Zukunft speichern
          return fetch(event.request).then(networkResponse => {
            // Nur erfolgreiche Antworten cachen (200 OK)
            if (networkResponse.status === 200) {
              cache.put(event.request, networkResponse.clone());
            }
            return networkResponse;
          }).catch(() => {
            // Netzwerkfehler und nichts im Cache
            return new Response('Linexio Offline-Fehler: Bibliothek nicht im Cache.', {
              status: 503,
              statusText: 'Service Unavailable'
            });
          });
        });
      })
    );
    return;
  }

  // Cache-First Strategie für alle anderen lokalen Assets
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});