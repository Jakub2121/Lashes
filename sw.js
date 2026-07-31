// 1. Zmieniaj ten numer (v1 -> v2 -> v3) za każdym razem, gdy robisz duże zmiany na stronie!
const CACHE_NAME = 'beauty-studio-v2';

const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  'https://cdn.tailwindcss.com',
  'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&display=swap'
];

// 2. INSTALACJA — natychmiastowe wymuszenie nowej wersji (skipWaiting)
self.addEventListener('install', (event) => {
  self.skipWaiting(); // Nie czeka na zamknięcie aplikacji przez użytkownika
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

// 3. AKTYWACJA — automatyczne kasowanie STARYCH wersji pamięci cache
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Usuwam stary cache:', cache);
            return caches.delete(cache); // Kasuje v1, gdy wejdzie v2
          }
        })
      );
    }).then(() => self.clients.claim()) // Przejmuje kontrolę nad otwartą aplikacją PWA
  );
});

// 4. POBIERANIE — Strategia "Network First" dla pliku HTML
self.addEventListener('fetch', (event) => {
  // Jeśli użytkownik otwiera stronę/HTML — NAJPIERW pobierz z sieci (Network-First)
  if (event.request.mode === 'navigate' || (event.request.headers.get('accept') && event.request.headers.get('accept').includes('text/html'))) {
    event.respondWith(
      fetch(event.request)
        .then((networkResponse) => {
          // Zapisz najnowszą wersję do cache na wypadek trybu offline
          return caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, networkResponse.clone());
            return networkResponse;
          });
        })
        .catch(() => {
          // Jeśli nie ma internetu (offline) — daj wersję zapisaną w cache
          return caches.match(event.request);
        })
    );
    return;
  }

  // Dla obrazków, fontów i styli — szukaj w cache, a jeśli brak, pobierz z sieci
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      return cachedResponse || fetch(event.request);
    })
  );
});
