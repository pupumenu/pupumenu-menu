const CACHE_NAME = 'dish-menu-v22';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './cat.png', './paw.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.map(function(k) { return caches.delete(k); }));
  }).then(function() {
    return caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(ASSETS); });
  }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (url.hostname === 'ntfy.sh') return;
  if (url.origin !== self.location.origin) return;

  // HTML/导航：永远走网络，不缓存，确保每次拿到最新版
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request));
    return;
  }

  // 静态资源：缓存优先
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.json') || url.pathname.endsWith('.js')) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
  }
});
