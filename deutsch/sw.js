/*
 * Service worker — sprawia, że gra działa OFFLINE po pierwszym otwarciu.
 *
 * Strategia: cache-first z fallbackiem do sieci. Dla nawigacji offline
 * awaryjnie podajemy index.html.
 *
 * WAŻNE: po każdej zmianie plików gry podbij numer wersji (v1 -> v2),
 * inaczej tablet będzie serwował starą wersję z cache.
 */
var CACHE_PREFIX = "deutsch-";
var CACHE = CACHE_PREFIX + "v1";

// Pliki, które MUSZĄ się zapisać (bez nich gra nie działa).
var CORE = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/config.js",
  "./js/audio.js",
  "./js/sprites.js",
  "./js/game.js",
  "./assets/icon.svg",
  "./assets/fonts/PressStart2P-Regular.ttf",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        return c.addAll(CORE);
      })
      .then(function () {
        return self.skipWaiting();
      })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches
      .keys()
      .then(function (keys) {
        return Promise.all(
          keys
            .filter(function (k) {
              return k.indexOf(CACHE_PREFIX) === 0 && k !== CACHE;
            })
            .map(function (k) {
              return caches.delete(k);
            })
        );
      })
      .then(function () {
        return self.clients.claim();
      })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;

  e.respondWith(
    caches.match(req, { ignoreSearch: true }).then(function (cached) {
      if (cached) return cached;
      return fetch(req)
        .then(function (res) {
          try {
            if (res && res.ok && req.url.indexOf(self.location.origin) === 0) {
              var clone = res.clone();
              caches.open(CACHE).then(function (c) {
                c.put(req, clone);
              });
            }
          } catch (_) {}
          return res;
        })
        .catch(function () {
          if (req.mode === "navigate")
            return caches.match("./index.html", { ignoreSearch: true });
          return Promise.reject(new Error("offline"));
        });
    })
  );
});
