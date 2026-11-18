/* ============================================================
   SONARE — Service Worker (v2 — com features do violão)
============================================================ */

const CACHE_VERSION = 'sonare-v51';
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
  './assets/logo-sonare.png',
  './assets/apple-touch-icon.png',
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

  if (request.method !== 'GET') return;

  // Páginas, scripts, estilos e dados: busca a versão NOVA primeiro (assim
  // atualização chega na hora); sem internet ou demorando >4s, usa a cópia salva.
  // Imagens, sons e fontes: cópia salva primeiro (mudam pouco).
  const codigo = request.mode === 'navigate' || /\.(html|js|css|json|webmanifest)$/.test(url.pathname) || url.pathname.endsWith('/');
  if (codigo) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE_VERSION);
      try {
        const net = await Promise.race([
          fetch(request),
          new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 4000)),
        ]);
        if (net && net.ok) cache.put(request, net.clone());
        return net;
      } catch (e) {
        const cached = await cache.match(request, { ignoreSearch: true }) || await caches.match(request, { ignoreSearch: true });
        if (cached) return cached;
        if (request.mode === 'navigate') {
          return (await caches.match(url.pathname.endsWith('admin.html') ? './admin.html' : './index.html')) || Response.error();
        }
        return Response.error();
      }
    })());
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((net) => {
        if (net.ok) {
          const clone = net.clone();
          caches.open(CACHE_VERSION).then((cache) => cache.put(request, clone));
        }
        return net;
      });
    })
  );
});
