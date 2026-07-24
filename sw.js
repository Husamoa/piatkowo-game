/*
 * Service worker — sprawia, że gra działa OFFLINE po pierwszym otwarciu.
 * To jest kluczowe: aparat telefonu przy każdym skanie otwiera link na nowo,
 * a w piwnicy może nie być zasięgu. Dzięki cache strona wczyta się bez sieci.
 *
 * Strategia: cache-first z fallbackiem do sieci. Dla nawigacji offline
 * awaryjnie podajemy index.html (obsługa linków #s=... bez zasięgu).
 *
 * WAŻNE: po każdej zmianie plików gry podbij numer wersji (v1 -> v2),
 * inaczej telefon będzie serwował starą wersję z cache.
 */
var CACHE = "piatkowo-v4";
var ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/style.css",
  "./js/config.js",
  "./js/audio.js",
  "./js/sprites.js",
  "./js/scanner.js",
  "./js/game.js",
  "./assets/fonts/PressStart2P-Regular.ttf",
  "./assets/icon.svg",
  "./tools/print-codes.html",
  "./lib/qrcode.min.js",
  "./lib/jsQR.min.js",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        return c.addAll(ASSETS);
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
              return k !== CACHE;
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
          // Offline i brak w cache: dla nawigacji (np. link #s=...) podaj grę.
          if (req.mode === "navigate")
            return caches.match("./index.html", { ignoreSearch: true });
          return Promise.reject(new Error("offline"));
        });
    })
  );
});
