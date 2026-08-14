const CACHE_NAME = 'pupumenu-v26';
const ASSETS = ['./manifest.json', './icon-192.png', './icon-512.png', './cat.png', './paw.png'];
const MQTT_CDN_HOSTS = ['cdnjs.cloudflare.com', 'cdn.bootcdn.net', 'unpkg.com'];

self.addEventListener('install', function(e) {
  self.skipWaiting();
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.map(function(k) { return caches.delete(k); }));
    }).then(function() {
      return caches.open(CACHE_NAME).then(function(cache) {
        return cache.addAll(ASSETS).catch(function() {});
      });
    })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(keys.filter(function(k) { return k !== CACHE_NAME; }).map(function(k) { return caches.delete(k); }));
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);
  if (url.protocol === 'wss:' || url.protocol === 'ws:') return;
  // MQTT library from any CDN: network-first, fallback to cache
  if (MQTT_CDN_HOSTS.indexOf(url.hostname) !== -1 && url.pathname.indexOf('mqtt') !== -1) {
    e.respondWith(
      fetch(e.request).then(function(resp) {
        var clone = resp.clone();
        caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
        return resp;
      }).catch(function() { return caches.match(e.request); })
    );
    return;
  }
  if (url.origin !== self.location.origin) return;
  if (e.request.mode === 'navigate' || url.pathname === '/' || url.pathname.endsWith('.html')) {
    e.respondWith(fetch(e.request).catch(function() { return caches.match(e.request); }));
    return;
  }
  if (url.pathname.endsWith('.png') || url.pathname.endsWith('.json') || url.pathname.endsWith('.js')) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        var fetchPromise = fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(cache) { cache.put(e.request, clone); });
          return resp;
        }).catch(function() { return cached; });
        return cached || fetchPromise;
      })
    );
  }
});