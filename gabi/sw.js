/*
 * Service worker — sprawia, że gra działa OFFLINE po pierwszym otwarciu.
 * Kluczowe: aparat telefonu przy każdym skanie otwiera link na nowo,
 * a w terenie może nie być zasięgu. Mapy są w cache, więc wczytają się bez sieci.
 *
 * Strategia: cache-first z fallbackiem do sieci. Dla nawigacji offline
 * awaryjnie podajemy index.html.
 *
 * WAŻNE: po każdej zmianie plików gry podbij numer wersji (v1 -> v2),
 * inaczej telefon będzie serwował starą wersję z cache.
 */
var CACHE_PREFIX = "gabi-";
var CACHE = CACHE_PREFIX + "v16";
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
  "./assets/maps/map-zjezdzalnia.png",
  "./assets/maps/map-silownia.png",
  "./assets/maps/map-basniowy-zamek.png",
  "./assets/maps/map-lo15.png",
  "./assets/maps/map-plac-rowerowy.png",
  "./assets/maps/map-tyrolka.png",
  "./assets/maps/map-wiadukt-pst.png",
  "./assets/maps/map-pajak.png",
  "./assets/maps/map-krol-chrobry.png",
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
