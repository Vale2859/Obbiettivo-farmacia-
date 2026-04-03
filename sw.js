
const CACHE_NAME = 'ldf-obiettivi-v1';
const APP_FILES = [
  './',
  'login.html',
  'index.html',
  'classifica.html',
  'storico.html',
  'premi.html',
  'gruppo.html',
  'profilo.html',
  'impostazioni.html',
  'style.css',
  'mobile.css',
  'app.js',
  'dati.json',
  'manifest.json',
  'offline.html',
  'icon-192.svg',
  'icon-512.svg'
];

self.addEventListener('install', event => {
  event.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(APP_FILES)));
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(cached => {
      return cached || fetch(event.request).catch(() => caches.match('offline.html'));
    })
  );
});
