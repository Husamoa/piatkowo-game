/*
 * Service worker — sprawia, że gra działa OFFLINE po pierwszym otwarciu.
 * Ważne: przy domku może nie być zasięgu. Dzięki cache strona i ZDJĘCIA
 * wczytają się bez sieci (o ile Matylda otworzy grę raz z internetem).
 *
 * Strategia: cache-first z fallbackiem do sieci. Dla nawigacji offline
 * awaryjnie podajemy index.html.
 *
 * WAŻNE: po każdej zmianie plików gry podbij numer wersji (v1 -> v2),
 * inaczej telefon będzie serwował starą wersję z cache.
 */
var CACHE_PREFIX = "matylda-";
var CACHE = CACHE_PREFIX + "v3";

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
  "./assets/fonts/PressStart2P-Regular.ttf",
];

// Zdjęcia zagadek — dobrze, żeby też trafiły do cache (offline), ale ich brak
// nie może wywalić instalacji SW, więc dodajemy je pojedynczo i "miękko".
var PHOTOS = [
  "./assets/photos/01-mapa.jpg",
  "./assets/photos/02-tabliczka.jpg",
  "./assets/photos/03-oslona.jpg",
  "./assets/photos/04-pod-spodem.jpg",
  "./assets/photos/05-kamyk.jpg",
  "./assets/photos/06-skrzynka.jpg",
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches
      .open(CACHE)
      .then(function (c) {
        // twarde: core; miękkie: zdjęcia (ignoruj brakujące)
        return c.addAll(CORE).then(function () {
          return Promise.all(
            PHOTOS.map(function (url) {
              return c.add(url).catch(function () {});
            })
          );
        });
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
