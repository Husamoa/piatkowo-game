# 🎮 Gry terenowe (8-bit)

Repozytorium zawiera **trzy osobne gry-podchody** i **grę planszową do nauki
niemieckiego** w klimacie 8-bit oraz wspólny **ekran wyboru**. Czysty HTML/CSS/JS, bez build-stepu. Działa **offline**
(service worker), na **GitHub Pages** i lokalnie przez **Docker**.

| Ścieżka | Gra | Dla kogo | Mechanika |
|---------|-----|----------|-----------|
| `/` | Ekran wyboru | — | Przyciski: ANIA / MATYLDA / GABI / NIEMIECKI 0–20 |
| `/ania/` | Gra Piątkowska | Ania | Podchody z **kodami QR** (skaner w grze) |
| `/matylda/` | Gra Matyldy | Matylda | Zagadki **bez QR** (wpisywanie odpowiedzi) |
| `/gabi/` | Urodziny Gabi | Gabi (13 lat) | **Skan → zadanie → odpowiedź → mapa → skan** |
| `/deutsch/` | Zahlen-Rennen | 2 klasa SP | Plansza: **liczby 0–20 po niemiecku** |

### 🔗 Linki (GitHub Pages)

- **Ekran wyboru:** https://husamoa.github.io/piatkowo-game/
- **Zahlen-Rennen (niemiecki 0–20):** https://husamoa.github.io/piatkowo-game/deutsch/
- **Gra Matyldy:** https://husamoa.github.io/piatkowo-game/matylda/
- **Gra Ani:** wejście przyciskiem **ANIA** na ekranie wyboru albo kodem START
  (sam adres `…/ania/` bez kodu pokazuje ekran STOP).
- **Urodziny Gabi:** wejście przyciskiem **GABI** na ekranie wyboru albo kodem START
  (sam adres `…/gabi/` bez kodu pokazuje ekran STOP).

---

## 🚀 Uruchomienie lokalne (Docker)

```bash
docker compose up
```

Potem otwórz:

- **http://localhost:8080/** — ekran wyboru
- **http://localhost:8080/ania/** — gra Ani
- **http://localhost:8080/matylda/** — gra Matyldy
- **http://localhost:8080/gabi/** — Urodziny Gabi
- **http://localhost:8080/deutsch/** — Zahlen-Rennen (niemiecki)

> To ten sam zestaw plików, który trafia na GitHub Pages. Kamerę telefonu
> (skaner QR w grze Ani) testuj na wersji z **GitHub Pages** (https) — po adresie
> LAN (http) aparat nie ruszy.

---

## 🧭 Ekran wyboru (root)

Na `/` są trzy przyciski:

- **ANIA** → otwiera `/ania/` od razu z **kodem START** wbitym w link
  (`/ania/#start=…`), więc nie trzeba skanować kodu START.
- **MATYLDA** → otwiera `/matylda/` (gra Matyldy nie ma żadnej blokady).
- **GABI** → otwiera `/gabi/` od razu z **kodem START** wbitym w link
  (`/gabi/#start=…`), więc nie trzeba skanować kodu START.
- **NIEMIECKI 0–20** → otwiera `/deutsch/` (bez blokady).

> ⚠️ Tokeny startowe Ani i Gabi są wpisane na sztywno w [`index.html`](index.html).
> Po zmianie `startToken` w [`ania/js/config.js`](ania/js/config.js) lub
> [`gabi/js/config.js`](gabi/js/config.js) popraw też link w `index.html`.

---

## 🅰️ Gra Ani — `/ania/` (z kodami QR)

Ania rozwiązuje zagadki, dochodzi do miejsca, **skanuje aparatem w grze** kod QR
i odblokowuje kolejną zagadkę — aż do prezentu.

### Wejście „frontowymi drzwiami"

Do gry Ani wchodzi się **tylko** przez **kod START** (albo przycisk ANIA na
ekranie wyboru — on ma ten kod w linku). Kto NIE wszedł wcześniej, a zeskanuje
kod z trasy zwykłym aparatem, widzi tylko ekran **STOP** — obcy nie „wejdzie"
przypadkiem. **Ta blokada nadal działa.**

- Kody zagadek zaliczasz **wyłącznie skanerem w grze** (przycisk **OTWÓRZ
  APARAT**) albo wpisując kod ręcznie.
- Zeskanowanie kodu trasy zwykłym aparatem nie zalicza (pokazuje „SKANUJ W GRZE").
- Kodów nie da się przeskoczyć — działają tylko po kolei.

### Wygenerowanie i wydruk kodów QR

1. Otwórz [`ania/tools/print-codes.html`](ania/tools/print-codes.html)
   (lokalnie lub `http://localhost:8080/ania/tools/print-codes.html`).
2. Adres gry jest domyślnie ustawiony na `…/piatkowo-game/ania/` — sprawdź, czy
   się zgadza z Twoim adresem Pages.
3. Kliknij **Generuj kody** → **Ctrl/Cmd+P** → wydrukuj.

> Po przeniesieniu gry do `/ania/` **linki w kodach QR zawierają teraz `/ania/`** —
> jeśli masz stare wydruki (bez `/ania/`), **wygeneruj i wydrukuj je ponownie**.

| Kod | Gdzie | Do czego |
|-----|-------|----------|
| **START** | dajesz Ani na początek | otwiera grę |
| 1 | Piwnica | Zagadka 2 |
| 2 | Tablica ogłoszeń | Zagadka 3 |
| 3 | Skoda Elroq | Zagadka 4 |
| 4 | Pomnik Bolesława Chrobrego | Zagadka 5 |
| 5 | Na prezencie (w cukierni) | 🏆 Ekran zwycięstwa |

### Odpowiedzi Ani (spoiler)

1. Piwnica
2. Tablica ogłoszeń (szyfr GA-DE-RY-PO-LU-KI: `tgbukcg paupszdn`)
3. Skoda Elroq
4. Bolesław Chrobry (posąg na ławeczce)
5. Cukiernia — hasło: **„Małe fusy"**

Treści i tokeny: [`ania/js/config.js`](ania/js/config.js).

---

## 🎂 Urodziny Gabi — `/gabi/` (z kodami QR, zadania w aplikacji)

Gra urodzinowa (13. urodziny Gabi). Mechanika jest **odwrotna niż u Ani**:

1. **Skan kodu** (START na początek, potem koperty w terenie) → pojawia się **ZADANIE**.
2. Gracze rozwiązują zadanie i **wpisują odpowiedź w aplikacji**.
3. Po poprawnej odpowiedzi: **zdjęcie mapy z pinezką** (wbudowane, nie link)
   + **podpowiedź** (rymowanka) + guzik **ZESKANUJ KOD**.
4. Idą pod pinezkę, znajdują kopertę, skanują → kolejne zadanie… aż do **nagrody**
   (Król Chrobry, duże drzewo) → ekran urodzinowy.

### Wejście „frontowymi drzwiami"

Jak u Ani: do gry wchodzi się **tylko** przez **kod START** (albo przycisk GABI na
ekranie wyboru). Zeskanowanie koperty zwykłym aparatem bez wcześniejszego wejścia
pokazuje ekran **STOP**. Kody zalicza wyłącznie skaner w grze (na ekranie mapy)
lub ręczne wpisanie — i tylko we właściwej kolejności.

### Wygenerowanie i wydruk kodów QR

1. Otwórz [`gabi/tools/print-codes.html`](gabi/tools/print-codes.html)
   (lokalnie lub `http://localhost:8080/gabi/tools/print-codes.html`).
2. Sprawdź adres gry (domyślnie `…/piatkowo-game/gabi/`).
3. Kliknij **Generuj kody** → **Ctrl/Cmd+P** → wydrukuj.

| Kod | Gdzie nakleić | Odsłania |
|-----|---------------|----------|
| **START** | dajesz Gabi na początek | Zadanie 1 |
| 1 | Siłownia zewnętrzna (przy biegaczu) | Zadanie 2 |
| 2 | Pod Baśniowym Zamkiem (przedszkole) | Zadanie 3 |
| 3 | LO XV (przy donicach) | Zadanie 4 |
| 4 | Plac rowerowy (Poradnik Młodego Rowerzysty) | Zadanie 5 |
| 5 | Tyrolka (zjazd na linie) | Zadanie 6 |
| 6 | Wiadukt PST | Zadanie 7 |
| 7 | Spektakularny plac zabaw (duży pająk) | Zadanie 8 |
| 8 | 🏆 Przy nagrodzie (Pomnik B. Chrobrego, duże drzewo) | Ekran urodzinowy |

> Mapy to gotowe zdjęcia z pinezką w [`gabi/assets/maps/`](gabi/assets/maps/)
> (wygenerowane z OpenStreetMap). Zcache'owane w [`gabi/sw.js`](gabi/sw.js),
> więc działają offline.

### Odpowiedzi Gabi (spoiler)

1. Marek, Ewa, Tomek, Ala, Piotrek, Kasia, Zosia, Ola
2. **1078** (liczby liter urządzeń z odpowiedzi 1/2/3)
3. **Jego syn** (akceptowane też samo „syn")
4. Wierszyk — musi zawierać wszystkie 8 słów (w dowolnej odmianie)
5. Dom 1: Ania + papuga · Dom 2: Piotr + kot · Dom 3: Ola + żółw · Dom 4: Marek + pies
6. **63** · 7. **20** · 8. **82278**

Treści, tokeny i reguły sprawdzania odpowiedzi: [`gabi/js/config.js`](gabi/js/config.js).

---

## Ⓜ️ Gra Matyldy — `/matylda/` (bez QR)

Zagadki jak dojechać do **domku Lifepackers** i wejść do środka. **Bez blokady i
bez kodów QR** — otwarcie linku od razu pokazuje grę, a etapy zalicza się
wpisując odpowiedź albo klikając przycisk.

### Etapy

1. **Dojazd do bramy** — mapka (GPS oszukuje!). Matylda wpisuje, co jest na
   tabliczce przy bramie → **DOMEK LIFEPACKERS**.
2. **Klucz w kamyku** — 3 zdjęcia. Klucz jest w sztucznym kamyku pod drewnianą
   osłoną; po otwarciu bramy klika **„Otworzyłam bramę"**.
3. **Kod do skrzynki** — 4 mini-zagadki, każda na cyfrę **0** → kod **0000** do
   skrzynki z kluczami → przycisk **„Weszłam do domku"** → ekran gratulacji.

Odpowiedzi do kodu (wszystkie = `0`):
1. cyfra mylona z literką O,
2. brak przy odliczaniu „3, 2, 1, START!",
3. `21 + 10 − 11 − 10 − 10 = 0`,
4. **zer**ówka (klasa przed pierwszą).

### Zdjęcia

Pliki w [`matylda/assets/photos/`](matylda/assets/photos/):
`01-mapa`, `02-tabliczka`, `03-oslona`, `04-pod-spodem`, `05-kamyk`,
`06-skrzynka` (`.jpg`). Podpięte w [`matylda/js/config.js`](matylda/js/config.js)
i cache'owane offline. Po podmianie zdjęć podbij wersję cache w
[`matylda/sw.js`](matylda/sw.js).

Treści i odpowiedzi: [`matylda/js/config.js`](matylda/js/config.js).

---

## 🇩🇪 Zahlen-Rennen — `/deutsch/` (liczby 0–20 po niemiecku)

*Zahlen-Rennen* = po niemiecku „wyścig liczb” (*die Zahlen* — liczby,
*das Rennen* — wyścig). Gra: https://husamoa.github.io/piatkowo-game/deutsch/

Gra planszowa dla 2 klasy SP, pisana pod **iPada w przeglądarce** (Safari).
Losuje się liczba (cyfra, np. **17**), dziecko pisze ją **słowem po niemiecku**
(`siebzehn`) i idzie pionkiem po planszy 30 pól do mety.

| Sytuacja | Ruch |
|---|---|
| Dobrze za 1. razem | **+3 pola** |
| Dobrze za 2. razem | **+1 pole** |
| Dobrze z podpowiedzią (żarówka) | **+1 pole** |
| Każdy błąd | **−1 pole** (nie mniej niż START) |
| Wejście na dół drabiny krokiem do przodu | skok w górę (6→11, 14→19, 22→26) |

Po 2 błędach gra pokazuje poprawne słowo i trzeba je **przepisać** (bez kary) —
dopiero wtedy tura się kończy.

**Jak gra uczy:**
- po błędzie literki są pokolorowane (zielone = dobrze, czerwone = źle,
  `_` = brakuje litery) + podpowiedzi do typowych pułapek polskich dzieci:
  *sechzehn* (bez S), *siebzehn* (bez EN), [aj] = EI, [oj] = EU, [c] = Z,
  długie [i] = IE, ciche H w *zehn*, kropki w *fünf*/*zwölf*;
- 🔊 **POSŁUCHAJ** — wymowa niemieckim głosem iPada (Web Speech API, offline);
  po każdej odpowiedzi gra sama czyta poprawne słowo (chyba że dźwięk OFF);
- **mądre losowanie** — liczby, w których dziecko się myli, wypadają częściej
  (historia zapamiętywana per imię);
- **ściąga 0–20** z wymową (z ekranu tytułowego i z planszy, nie w trakcie
  pytania).

**Umlauty:** przyciski **ä ö ü** pod polem odpowiedzi. `fuenf` / `zwoelf` są
zaliczane (z uwagą „ładniej z kropkami”), `funf` bez kropek to **błąd** z
podpowiedzią. Wielkość liter i spacje (`fünf zehn`) nie mają znaczenia.

**Tryby:** 1 gracz (licznik rund + rekord) albo 2–4 graczy na zmianę na jednym
tablecie (każdy wpisuje swoje imię, ma swój kolor pionka).

**Pisanie — przełącznik `PISZĘ: KLAWIATURA / RYSIK`:**
- *KLAWIATURA* — po wylosowaniu pole od razu dostaje fokus (fizyczna klawiatura
  albo ekranowa wyskakuje sama). Enter = SPRAWDŹ / DALEJ / LOSUJ.
- *RYSIK* — duże pole do pisania; iPad sam zamienia pismo na tekst (**Scribble**),
  klawiatura ekranowa nie wyskakuje.

> 💡 **Na iPadzie dodaj klawiaturę Deutsch** (Ustawienia → Ogólne → Klawiatura →
> Klawiatury → Dodaj nową). Scribble rozpoznaje pismo w językach dodanych
> klawiatur — wtedy lepiej łapie niemieckie słowa i ü/ö. Na klawiaturze
> ekranowej ü/ö są też pod przytrzymaniem u/o.

Stan gry jest w `localStorage` — odświeżenie strony nie gubi rozgrywki
(przycisk **GRAJ DALEJ**). Treści, słowa, podpowiedzi, punktacja i drabiny:
[`deutsch/js/config.js`](deutsch/js/config.js).

---

## 🛠️ Panel organizatora (wszystkie gry)

Wejście: **5× dotknij tytuł** u góry ekranu, albo otwórz `adres-gry/#org`.
Możesz przeskoczyć do dowolnego etapu, zresetować grę i podejrzeć odpowiedzi.
W Zahlen-Rennen panel pokazuje trudne liczby każdego dziecka i pozwala
zresetować grę / wyczyścić statystyki.

---

## 🌍 Wystawienie na GitHub Pages

Workflow [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml) wystawia
całe repo przy każdym pushu na `main` (Settings → Pages → Source:
„GitHub Actions"). Wszystkie gry i ekran wyboru deployują się razem.

---

## ⚠️ Ważne przed imprezą

- **Słaby zasięg:** poproś, żeby gra została otwarta **raz z internetem** — wtedy
  service worker zapisze ją (i zdjęcia Matyldy) do trybu offline.
- **Ania i Gabi muszą zacząć od kodu START** (albo przycisku na ekranie wyboru).
- Po **każdej** zmianie plików gry podbij numer wersji cache w odpowiednim
  `sw.js` (`ania/sw.js` → prefix `ania-`, `matylda/sw.js` → prefix `matylda-`,
  `gabi/sw.js` → prefix `gabi-`, `deutsch/sw.js` → prefix `deutsch-`), inaczej
  telefon/tablet może serwować starą wersję z cache.
- Wszystkie gry są na tym samym adresie (origin), więc mają **rozdzielone** klucze
  postępu i cache — postępy się nie mieszają.

---

## 📁 Struktura

```
index.html                 ekran wyboru (ANIA / MATYLDA / GABI / NIEMIECKI)
docker-compose.yml         lokalny serwer (nginx)
nginx.conf                 konfiguracja serwera
.github/workflows/         auto-deploy na Pages

ania/                      GRA ANI (z kodami QR)
  index.html, css/, js/, lib/, assets/
  tools/print-codes.html   generator kodów QR do druku
  sw.js                    offline (cache: ania-)

matylda/                   GRA MATYLDY (bez QR)
  index.html, css/, js/, assets/
  assets/photos/           zdjęcia zagadek
  sw.js                    offline (cache: matylda-)

gabi/                      URODZINY GABI (skan → zadanie → mapa → skan)
  index.html, css/, js/, lib/, assets/
  assets/maps/             zdjęcia map z pinezką (OpenStreetMap)
  js/config.js             zadania, odpowiedzi, tokeny, mapy
  tools/print-codes.html   generator kodów QR do druku
  sw.js                    offline (cache: gabi-)

deutsch/                   ZAHLEN-RENNEN (niemiecki 0–20)
  index.html, css/, js/, assets/
  js/config.js             słowa, podpowiedzi, punktacja, drabiny
  sw.js                    offline (cache: deutsch-)
```
