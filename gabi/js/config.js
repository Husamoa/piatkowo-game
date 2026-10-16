/*
 * GRA URODZINOWA GABI — konfiguracja ("baza" gry).
 *
 * Mechanika (INNA niż w /ania):
 *  1. Gracz SKANUJE kod (START na początku, potem koperty w terenie)
 *     -> pojawia się ZADANIE.
 *  2. Rozwiązuje zadanie i WPISUJE odpowiedź w aplikacji.
 *  3. Po poprawnej odpowiedzi: ZDJĘCIE MAPY z pinezką + PODPOWIEDŹ (rymowanka)
 *     + guzik "ZESKANUJ KOD".
 *  4. Idą pod pinezkę, znajdują kopertę, skanują -> pojawia się kolejne zadanie.
 *  ...aż do nagrody (Król Chrobry, duże drzewo) -> ekran urodzinowy.
 *
 * Każdy etap ma `scanToken` — to kod zaszyty w kodzie QR naklejonym w miejscu,
 * do którego prowadzi MAPA tego etapu (czyli przy kopercie z NASTĘPNYM zadaniem,
 * a przy ostatnim etapie — przy nagrodzie). Kolejność jest wymuszona.
 *
 * Weryfikacja odpowiedzi — pole `check`:
 *  - { type:"code",     accept:[...] }           dokładny kod (po usunięciu spacji/znaków)
 *  - { type:"contains", words:[...] }            odpowiedź zawiera dane słowo (odporne na odmianę/ogonki)
 *  - { type:"sequence", names:[[...],[...]] }     kolejność imion (każda pozycja = dozwolone warianty)
 *  - { type:"allWords", stems:[...] }            tekst zawiera WSZYSTKIE podane rdzenie słów
 *  - { type:"houses",   houses:[{label,need}] }   kilka pól; w każdym muszą wystąpić wymagane słowa
 *
 * Odpowiedzi (dla organizatora, NIE pokazywane w grze):
 *   1. Marek, Ewa, Tomek, Ala, Piotrek, Kasia, Zosia, Ola
 *   2. 1078
 *   3. Jego syn
 *   4. (wierszyk — muszą wystąpić wszystkie 8 słów)
 *   5. Dom1: Ania+papuga, Dom2: Piotr+kot, Dom3: Ola+żółw, Dom4: Marek+pies
 *   6. 63
 *   7. 20
 *   8. 82278
 */
window.GAME_CONFIG = {
  title: "URODZINY GABI",
  subtitle: "Urodzinowa niespodzianka",
  hero: "GABI",
  birthday: "13 URODZINY",
  startToken: "GABI-START-G13R",

  storageKey: "gabi_progress_v1",
  enteredKey: "gabi_entered_v1",

  stages: [
    {
      id: 1,
      label: "ZADANIE 1",
      icon: "queue",
      place: "Start (plac zabaw / zjeżdżalnia)",
      task:
        "W kolejce stoi 8 osób: Marek, Tomek, Ala, Kasia, Ola, Ewa, Piotrek i Zosia.\n\n" +
        "• Marek stoi pierwszy, a Ola ostatnia.\n" +
        "• Zosia stoi tuż przed Olą.\n" +
        "• Ala stoi za Tomkiem, ale przed Piotrkiem.\n" +
        "• Ewa stoi przed Tomkiem.\n" +
        "• Piotrek stoi przed Kasią.\n\n" +
        "W jakiej kolejności stoją? Wpiszcie imiona od pierwszej osoby do ostatniej.",
      hintSolve: "Zacznijcie od pewnych: Marek 1., Ola 8. Potem dokładajcie kolejne warunki.",
      check: {
        type: "sequence",
        names: [
          ["marek"],
          ["ewa"],
          ["tomek"],
          ["ala"],
          ["piotrek", "piotr"],
          ["kasia"],
          ["zosia"],
          ["ola"],
        ],
      },
      inputPlaceholder: "wpiszcie imiona po przecinku, po kolei",
      mapImage: "assets/maps/map-silownia.png",
      mapLink: "https://maps.app.goo.gl/spXB7iTEME5631f1A",
      mapHint:
        "Gdy już na miejscu biegacza odnajdziecie,\ngdzieś obok kopertę znajdziecie!",
      scanPlace: "Siłownia zewnętrzna w parku (przy biegaczu)",
      scanToken: "GB-S2A4",
    },
    {
      id: 2,
      label: "ZADANIE 2",
      icon: "dumbbell",
      place: "Siłownia zewnętrzna",
      task:
        "Przeczytajcie instrukcje na PRASIE NOŻNEJ, ORBITREKU oraz BIEGACZU, a potem odpowiedzcie:\n\n" +
        "1. Które urządzenie ma średni poziom trudności?\n" +
        "2. Które z pozostałych dwóch w opisie efektu treningu wspomina o zmyśle równowagi?\n" +
        "3. Które urządzenie angażuje zarówno nogi, jak i ręce?\n\n" +
        "Policzcie liczbę liter w nazwach urządzeń będących odpowiedziami na pytania 1, 2 i 3. " +
        "Zapiszcie te trzy liczby jedna po drugiej (bez spacji, bez dodawania). To Wasz kod.",
      hintSolve: "Kod to trzy liczby zapisane obok siebie — nie sumujcie ich.",
      check: { type: "code", accept: ["1078"] },
      inputPlaceholder: "wpiszcie kod",
      mapImage: "assets/maps/map-basniowy-zamek.png",
      mapLink: "https://maps.app.goo.gl/4PngX43xJh8dBxWN9",
      mapHint:
        "Kolejne zadanie znajdziecie tam, gdzie mali książęta i księżniczki\nparkują pod przedszkolem swoje rowery i bryczki.",
      scanPlace: "Pod Baśniowym Zamkiem (przedszkole, stojak na rowery)",
      scanToken: "GB-Z3C7",
    },
    {
      id: 3,
      label: "ZADANIE 3",
      icon: "castle",
      place: "Pod Baśniowym Zamkiem",
      task:
        "Mężczyzna, wskazując na portret, mówi:\n\n" +
        "„Nie mam braci ani sióstr, ale ojciec tego człowieka to syn mojego ojca”.\n\n" +
        "Kto jest na portrecie?",
      hintSolve: "„Syn mojego ojca” to on sam. Czyj więc ojciec jest na portrecie... odwrotnie.",
      check: { type: "contains", words: ["syn"] },
      inputPlaceholder: "wpiszcie, kto jest na portrecie",
      mapImage: "assets/maps/map-lo15.png",
      mapLink: "https://maps.app.goo.gl/enu31goCEdpPn8cA7",
      mapHint:
        "Przy wejściu do szkoły donice czekają,\na gdzieś w ich pobliżu instrukcję chowają!",
      scanPlace: "LO XV — przy wejściu do szkoły, przy donicach",
      scanToken: "GB-L4D2",
    },
    {
      id: 4,
      label: "ZADANIE 4",
      icon: "pen",
      place: "LO XV (przy donicach)",
      task:
        "Napiszcie wspólnie wierszyk z 8 wersów. Użyjcie w nim WSZYSTKICH słów " +
        "(w jednym wersie może być więcej niż jedno):\n\n" +
        "kalafior · pantofel · łaskotki · szczypiorek · galareta · żyrafa · kalosz · bąbelek\n\n" +
        "Wpiszcie wierszyk poniżej.",
      hintSolve: "Słowa mogą być w dowolnej odmianie (np. „żyrafy”, „kalosze”, „bąbelki”).",
      check: {
        type: "allWords",
        // rdzenie słów (bez ogonków) — pasują do różnych odmian
        stems: ["kalafior", "pantof", "laskot", "szczypior", "galaret", "zyraf", "kalosz", "babel"],
      },
      multiline: true,
      inputPlaceholder: "wpiszcie tu swój wierszyk...",
      mapImage: "assets/maps/map-plac-rowerowy.png",
      mapLink: "https://maps.app.goo.gl/VxBkwQgEBFMMtFAF6",
      mapHint:
        "Teraz plan jest oczywisty:\nszukajcie koperty w okolicy Poradnika Młodego Rowerzysty!",
      scanPlace: "Plac rowerowy (os. B. Chrobrego) — przy Poradniku Młodego Rowerzysty",
      scanToken: "GB-R5E9",
    },
    {
      id: 5,
      label: "ZADANIE 5",
      icon: "bike",
      place: "Plac rowerowy",
      task:
        "W czterech domach przy jednej ulicy mieszkają: Marek, Piotr, Ola, Ania. " +
        "Każde ma jedno zwierzę: psa, kota, żółwia, papugę.\n\n" +
        "• Piotr i żółw mieszkają w sąsiadujących domach.\n" +
        "• Marek mieszka w domu nr 4.\n" +
        "• Ola mieszka w domu po prawej stronie od domu z kotem.\n" +
        "• Papuga mieszka w domu nr 1.\n\n" +
        "Wpiszcie w każdym domu: KTO i JAKIE ZWIERZĘ.",
      hintSolve: "Zacznijcie od pewników: papuga w domu 1, Marek w domu 4.",
      check: {
        type: "houses",
        houses: [
          { label: "Dom 1", need: [["ania"], ["papug"]], placeholder: "np. Kuba, chomik" },
          { label: "Dom 2", need: [["piotr"], ["kot"]], placeholder: "np. Zuzia, rybka" },
          { label: "Dom 3", need: [["ola"], ["zolw"]], placeholder: "np. Franek, królik" },
          { label: "Dom 4", need: [["marek"], ["pies", "psa", "psem"]], placeholder: "np. Lena, kanarek" },
        ],
      },
      mapImage: "assets/maps/map-tyrolka.png",
      mapLink: "https://maps.app.goo.gl/C5ZrTF5CAiMkD5dD7",
      mapHint:
        "Teraz do miejsca zjazdów na linie zmierzajcie\ni tam kolejnej koperty szukajcie!",
      scanPlace: "Tyrolka (zjazd na linie)",
      scanToken: "GB-T6F1",
    },
    {
      id: 6,
      label: "ZADANIE 6",
      icon: "rope",
      place: "Tyrolka",
      task:
        "Rozwiązaniem każdej zagadki jest słowo na literę „S”. Rozwiążcie wszystkie dziewięć, " +
        "policzcie RAZEM wszystkie litery ze wszystkich słów i wpiszcie wynik.\n\n" +
        "1. Mają króla, hetmana i gońców, ale ani jednego żołnierza z karabinem.\n" +
        "2. Dwie takie noszą Twoje stopy, a w pralce jedna zawsze znika.\n" +
        "3. Ma ogon ryby i śpiewa w bajkach, a w mieście wyje, gdy jest alarm.\n" +
        "4. Zamykasz w nim ogórki na zimę, a babcia dżem.\n" +
        "5. Pracuje po cichu, ma kryptonim i zbiera tajne informacje.\n" +
        "6. Ma kod, a bez niego nikt nie powinien go otworzyć. W środku skarby.\n" +
        "7. Jest na schodach i na termometrze, a w szkole to też ocena.\n" +
        "8. Otwiera się w powietrzu i ratuje skoczka.\n" +
        "9. Żółty kwiat, który zawsze patrzy w stronę słońca. Ma pestki, które uwielbiają ptaki.",
      hintSolve: "Każde słowo zaczyna się na „S”. Policzcie litery w każdym i dodajcie wszystko.",
      check: { type: "code", accept: ["63"] },
      inputPlaceholder: "wpiszcie wynik",
      mapImage: "assets/maps/map-wiadukt-pst.png",
      mapLink: "https://maps.app.goo.gl/vqAhpgyviHMyRUTt6",
      mapHint:
        "Kolejna koperta czeka na Was tam,\ngdzie kilka tramwajów może jechać na raz.",
      scanPlace: "Wiadukt PST (nad torami tramwajowymi)",
      scanToken: "GB-W7H8",
    },
    {
      id: 7,
      label: "ZADANIE 7",
      icon: "grid",
      place: "Wiadukt PST",
      task:
        "Macie dziewięć karteczek z cyframi 1–9. Ułóżcie je w kwadracie 3×3 tak, aby suma " +
        "w każdym rzędzie, każdej kolumnie i na obu przekątnych wynosiła 15.\n\n" +
        "Gdy ułożycie, wpiszcie SUMĘ liczb w czterech rogach.",
      hintSolve: "W środku kwadratu zawsze jest 5. Rogi to liczby parzyste.",
      check: { type: "code", accept: ["20"] },
      inputPlaceholder: "wpiszcie sumę rogów",
      mapImage: "assets/maps/map-pajak.png",
      mapLink: "https://maps.app.goo.gl/nTuF1mHcnRW9HT9a9",
      mapHint:
        "Gdy już Plac Spektakularny odnajdziecie, chwilę odpocząć pewnie zechcecie.\n" +
        "Lecz zanim na ławce wygodnie siądziecie, sprawdźcie je wszystkie, a kopertę znajdziecie!",
      scanPlace: "Spektakularny plac zabaw — ławki / okolica dużego pająka",
      scanToken: "GB-P8K3",
    },
    {
      id: 8,
      label: "ZADANIE 8",
      icon: "spider",
      place: "Duży pająk (plac zabaw)",
      task:
        "Regulamin skrywa kod. Odszukajcie odpowiedzi i zapiszcie je BEZ SPACJI, dokładnie w tej kolejności:\n\n" +
        "1. Od której godziny plac zabaw jest otwarty?\n" +
        "2. Do której godziny jest otwarty?\n" +
        "3. Do ilu lat dzieci mogą korzystać z urządzeń tylko pod opieką osoby pełnoletniej?\n" +
        "4. Ile głównych, ponumerowanych punktów ma regulamin?\n\n" +
        "Połączcie odpowiedzi w jeden kod.",
      hintSolve: "Wszystkie odpowiedzi są na tablicy z regulaminem. Łączcie je po kolei, bez spacji.",
      check: { type: "code", accept: ["82278"] },
      inputPlaceholder: "wpiszcie kod",
      mapImage: "assets/maps/map-krol-chrobry.png",
      mapLink: "https://maps.app.goo.gl/4kBqp7zc8UJsdy9w8",
      mapHint:
        "Do Króla Chrobrego swe kroki skierujcie, dziarsko przez osiedle maszerujcie.\n" +
        "Znajdźcie tam duże drzewo, rozejrzyjcie się śmiało,\nbo coś się przy nim sprytnie schowało!",
      scanPlace: "NAGRODA — Pomnik Bolesława Chrobrego, duże drzewo obok",
      scanToken: "GB-K9M6",
      final: true,
    },
  ],
};
