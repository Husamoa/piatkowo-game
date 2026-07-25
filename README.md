# 🎮 Gra Piątkowska

Terenowa gra-podchody z kodami QR w klimacie 8-bit. Ania rozwiązuje kolejne
zagadki, dochodzi do miejsca, skanuje aparatem telefonu naklejony tam kod QR i
odblokowuje następną zagadkę — aż do prezentu.

Czysty HTML/CSS/JS, bez build-stepu. Działa **offline** (service worker) i
uruchamia się na **GitHub Pages** oraz lokalnie przez **Docker**.

---

## 🚀 Uruchomienie lokalne (Docker)

```bash
docker compose up
```

Otwórz **http://localhost:8080**. To ten sam zestaw plików, który trafia na
GitHub Pages.

> Na komputerze (localhost) wszystko działa. Kamerę telefonu (skanowanie
> natywnym aparatem) testuj na wersji z **GitHub Pages** — patrz niżej. Wejście
> na komputer z telefonu po adresie LAN (http) nie zadziała tak samo jak https.

---

## 🌍 Wystawienie na GitHub Pages

**Sposób 1 — GitHub Actions (zalecany, auto-deploy):**

1. Wrzuć repo na GitHuba (`git push`).
2. W repo: **Settings → Pages → Source: „GitHub Actions"**.
3. Gotowe — workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)
   deployuje przy każdym pushu na `main`.

**Sposób 2 — z gałęzi (bez workflow):**

1. **Settings → Pages → Source: „Deploy from a branch"**, gałąź `main`, katalog `/ (root)`.
2. Poczekaj chwilę — strona pojawi się pod adresem
   `https://TWOJ-LOGIN.github.io/NAZWA-REPO/`.

Adres gry to np. `https://TWOJ-LOGIN.github.io/piatkowo-game/`.
Ten adres wklejasz Ani (najlepiej też jako kod QR startowy) oraz w generatorze kodów.

---

## 🖨️ Wygenerowanie i wydruk kodów QR

1. Otwórz [`tools/print-codes.html`](tools/print-codes.html) (lokalnie w
   przeglądarce lub pod `http://localhost:8080/tools/print-codes.html`).
2. Wklej **adres gry** (ten z GitHub Pages, z ukośnikiem na końcu).
3. Kliknij **Generuj kody** → **Ctrl/Cmd+P** → wydrukuj.
4. Wytnij i rozmieść kody:

| Kod | Gdzie | Do czego |
|-----|-------|----------|
| **START** | dajesz Ani na początek | otwiera grę (zamiast wysyłania linku) |
| 1 | Piwnica | Zagadka 2 |
| 2 | Tablica ogłoszeń | Zagadka 3 |
| 3 | Skoda Elroq | Zagadka 4 |
| 4 | Pomnik Bolesława Chrobrego | Zagadka 5 |
| 5 | Na prezencie (w cukierni) | 🏆 Ekran zwycięstwa |

Pod każdym kodem QR jest też **kod awaryjny** (np. `PTK-7QF2`) — Ania może go
wpisać ręcznie w grze, gdyby aparat nie zadziałał.

---

## 🕹️ Jak to działa

- Gra pokazuje kolejno zagadki. Postęp jest zapisywany w przeglądarce telefonu
  (`localStorage`).
- **Wejście tylko „frontowymi drzwiami":** przez **kod START** albo wpisany adres
  gry. Kto NIE wszedł wcześniej, a zeskanuje kod z trasy zwykłym aparatem, widzi
  tylko ekran **STOP** — nie wchodzi do gry (obcy nie „wejdzie" przypadkiem).
- **Kody zagadek zaliczasz wyłącznie skanerem w grze** — przycisk
  **„OTWÓRZ APARAT"** (bez przeładowania strony, działa offline i na Chrome na
  iPhonie) — albo wpisując kod ręcznie. Zeskanowanie kodu trasy zwykłym aparatem
  NIE zalicza (pokazuje „SKANUJ W GRZE").
- Gra sprawdza, czy to **właściwy kod na tym etapie**:
  - dobry kod → „DOBRZE!" i następna zagadka,
  - nie ten / obcy → **„Nieprawidłowy kod QR!"**,
  - już zeskanowany → miły komunikat „już masz ten kod".
- Kodów nie da się przeskoczyć — działają tylko po kolei.
- **Powrót do poprzedniej zagadki:** przyciski **◀ POPRZEDNIA / AKTUALNA ▶**
  (przeglądanie rozwiązanych zagadek nie zmienia postępu).
- Odpowiedzi nigdy nie pojawiają się na ekranie.

**Zagadka 2** (szyfr GA-DE-RY-PO-LU-KI) ma przycisk **PODPOWIEDŹ**, który
ujawnia klucz szyfru.

---

## ⚠️ Ważne przed imprezą

- **Piwnica bez zasięgu:** poproś Anię, żeby otworzyła grę **raz z zasięgiem**
  (na starcie) — wtedy service worker zapisze grę i będzie działać offline,
  także po zeskanowaniu kodu w piwnicy.
- **Graj w Safari**, nie trzeba dodawać do ekranu głównego (gra jest tak
  ustawiona, że nawet dodana do ekranu współdzieli zapis postępu).
- **Ania musi zacząć od kodu START** (albo wpisać adres) — to „frontowe drzwi".
  Po tym kody trasy skanuje przyciskiem **OTWÓRZ APARAT** w grze. Gdyby otworzyła
  kod trasy zwykłym aparatem, zobaczy tylko STOP (to celowe zabezpieczenie).
- **Przetestuj całość** na swoim iPhonie 13 na wersji z GitHub Pages, zanim
  wręczysz telefon Ani.

---

## 🛠️ Panel organizatora (do testów i ratunku)

Dwa sposoby wejścia:

- **Dotknij 5× tytuł „GRA PIĄTKOWSKA"** u góry ekranu, lub
- otwórz adres **`adres-gry/#org`** (pewniejsze, np. z zakładki).

W panelu możesz przeskoczyć do dowolnego etapu, zresetować grę i podejrzeć tokeny.
Przydatne, gdyby coś poszło nie tak na miejscu.

---

## ✏️ Edycja treści

Wszystko jest w [`js/config.js`](js/config.js): teksty zagadek, tokeny, miejsca.

> Po **każdej** zmianie plików gry podbij numer wersji w
> [`sw.js`](sw.js) (`piatkowo-v1` → `v2` → …), inaczej telefon może serwować
> starą wersję z cache.

---

## 🔐 Odpowiedzi (spoiler — dla organizatora)

1. Piwnica
2. Tablica ogłoszeń (szyfr: `tgbukcg paupszdn` → „tablica ogłoszeń")
3. Skoda Elroq
4. Bolesław Chrobry (posąg na ławeczce)
5. Cukiernia — hasło: **„Małe fusy"**

---

## 📁 Struktura

```
index.html              gra
css/style.css           styl 8-bit + CRT
js/config.js            zagadki + tokeny (tu edytujesz)
js/game.js              logika i widoki
js/scanner.js           skaner QR w grze (kamera)
js/sprites.js           pixel-art
js/audio.js             chiptune SFX
sw.js                   offline
tools/print-codes.html  generator kodów QR do druku
lib/qrcode.min.js       generator QR (MIT, davidshimjs)
lib/jsQR.min.js         dekoder QR z kamery (Apache-2.0)
assets/fonts/           Press Start 2P (OFL)
docker-compose.yml      lokalny serwer
.github/workflows/      auto-deploy na Pages
```
