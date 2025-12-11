// public/service-worker.js

// Force Update: 2025-12-06T18:00:00
// Jede neue Version der App benötigt einen neuen Cache-Namen.
// Das Ändern dieser Versionsnummer löst den Update-Prozess im Browser aus.
const CACHE_NAME = 'linexio-v43';
const urlsToCache = [
  './',
  'index.html',
  'manifest.json',
  'logo192.png',
  'logo512.png',
  'apple-touch-icon.png',
  'changelog.json', // Changelog wird für Offline-Ansicht gecached
  'favicon.png',
  'splash/ios-splash-1536x2048.png', // Standard iPad Portrait
  'splash/ios-splash-2048x2732.png', // iPad Pro / Air / High-Res Portrait
  'splash/ios-splash-2732x2048.png', // iPad Pro / Air / High-Res Landscape
];

// 1. Installations-Event: Der neue Service Worker wird installiert
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        return cache.addAll(urlsToCache);
      })
      // WICHTIG: Kein self.skipWaiting() hier. Der SW wartet auf eine Anweisung.
  );
});

// 2. Aktivierungs-Event: Der neue Service Worker übernimmt die Kontrolle
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Lösche alle alten Caches, die nicht mehr benötigt werden
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
        // Übernimmt die Kontrolle über alle offenen App-Tabs
        return self.clients.claim();
    })
  );
});

// 3. Nachrichten-Handler: Lauscht auf Befehle von der App
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});


// 4. Fetch-Event: Liefert Anfragen aus dem Cache oder vom Netzwerk
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  // Für Navigationsanfragen (App-Start), liefere die index.html aus (App-Shell-Modell).
  if (event.request.mode === 'navigate') {
    event.respondWith(
      caches.match('index.html').then(response => {
        return response || fetch(event.request);
      })
    );
    return;
  }

  // Für alle anderen Anfragen (JS, CSS, Bilder etc.) wird die "Cache-First"-Strategie verwendet.
  // WICHTIG: index.tsx wird im production build nicht existieren,
  // daher hier nicht cachen, um 404 Fehler zu vermeiden.
  if (url.pathname.endsWith('index.tsx')) {
      return;
  }

  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});