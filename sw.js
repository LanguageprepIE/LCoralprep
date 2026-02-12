self.addEventListener('install', (e) => {
  console.log('LCorals Service Worker Instalado');
});

self.addEventListener('fetch', (e) => {
  e.respondWith(fetch(e.request));
});
