const CACHE_NAME = 'dish-menu-v17';
const ASSETS = ['./', './index.html', './manifest.json', './icon-192.png', './icon-512.png', './cat.png', './cat-v3.png', './paw.png', './favicon.png'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE_NAME).then(function(cache) { return cache.addAll(ASSETS); }));
});

self.addEventListener('activate', function(e) {
  e.waitUntil(caches.keys().then(function(keys) {
    return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
  }).then(function() { return self.clients.claim(); }));
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (url.hostname === 'ntfy.sh') return;
  if (url.origin === self.location.origin) {
    var cleanUrl = url.pathname;
    var cacheKey = url.origin + cleanUrl;
    if (e.request.mode === 'navigate' || url.pathname.endsWith('.html') || url.pathname === '/' || url.pathname.endsWith('.png')) {
      e.respondWith(
        fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          var keyWithoutQuery = new Request(cacheKey, { method: 'GET' });
          caches.open(CACHE_NAME).then(function(cache) { cache.put(keyWithoutQuery, clone); });
          return resp;
        }).catch(function() { return caches.match(cacheKey); })
      );
    }
  }
});
