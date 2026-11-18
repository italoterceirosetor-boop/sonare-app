/* ============================================================
   SONARE — Service Worker (v2 — com features do violão)
============================================================ */

const CACHE_VERSION = 'sonare-v49';
const APP_SHELL = [
  './',
  './index.html',
  './admin.html',
  './manifest.webmanifest',
  './manifest-admin.webmanifest',
  './js/firebase-config.js',
  './js/firebase-sync.js',
  './js/ritmos.js',
  './js/progresso.js',
  './js/seguro.js',
  './assets/logo.svg',
  './assets/alarm.mp3',
  './css/styles.css',
  './css/sonare-features.css',
  './js/sonare-data.js',
  './js/db.js',
  './js/conteudo.js',
  './js/tuner.js',
  './js/metronome.js',
  './js/theory.js',
  './js/songs.js',
  './js/exercises.js',
  './js/lessons.js',
  './js/tasks.js',
  './js/qrcode.js',
  './js/alarm.js',
  './js/app.js',
  './js/sonare-app.js',
  './js/admin.js',
  './data/seed.json',
  './data/conteudo.json',
  './assets/icon-192.png',
  './assets/icon-512.png',
  './assets/icon-maskable-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_VERSION).then((cache) => cache.addAll(APP_SHELL))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_VERSION).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname.endsWith('/data/seed.json') || url.pathname.endsWith('seed.json')) {
    event.respondWith(
      caches.open(CACHE_VERSION).then(async (cache) => {
        const cached = await cache.match(request);
        const fetchPromise = fetch(request).then((net) => {
          if (net.ok) cache.put(request, net.clone());
          return net;
        }).catch(() => cached);
        return cached || fetchPromise;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((net) => {
        if (net.ok && request.method === 'GET') {
          const clone = net.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return net;
      }).catch(() => {
        if (request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
