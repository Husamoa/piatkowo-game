/*
 * GRA MATYLDY — konfiguracja ("baza" gry).
 *
 * Wersja BEZ kodów QR: zagadki jak dojechać do domku Lifepackers i wejść do
 * środka. Kolejne etapy zalicza się wpisując odpowiedź albo klikając przycisk.
 *
 * To jedyne miejsce, które zwykle chcesz edytować (teksty, odpowiedzi, zdjęcia).
 *
 * Rodzaje etapów (pole `type`):
 *   - "answer"  : trzeba wpisać odpowiedź (porównanie bez wielkości liter/spacji)
 *   - "confirm" : trzeba kliknąć przycisk potwierdzenia
 *   - "code"    : 4 mini-zagadki (każda odpowiedź to 0) -> kod 0000 -> finał
 *
 * Zdjęcia: pliki w matylda/assets/photos/ (podpięte niżej w `images`).
 *
 * Odpowiedzi (dla Ciebie, NIE pokazywane w grze):
 *   1. tabliczka przy bramie: "DOMEK LIFEPACKERS"
 *   2. klucz w sztucznym kamyku -> otwiera bramę
 *   3. kod do skrzynki z kluczami: 0000
 */
window.GAME_CONFIG = {
  title: "GRA MATYLDY",
  subtitle: "Wyprawa do domku Lifepackers",
  hero: "MATYLDA",

  // localStorage key na postęp (osobny od gry Ani!)
  storageKey: "matylda_progress_v1",

  // ekran zwycięstwa
  victory: {
    title: "GRATULACJE",
    name: "MATYLDA!",
    msg: "Jesteś w domku Lifepackers!\nUdanych wakacji!",
  },

  stages: [
    {
      id: 1,
      label: "ZAGADKA 1",
      icon: "car",
      title: "DOJAZD DO BRAMY",
      images: ["assets/photos/01-mapa.jpg"],
      riddle:
        "Mama i tata prowadzą auto, ale GPS oszukuje!\n" +
        "Pokazuje miejsce na środku pola, gdzie nie ma drogi.\n\n" +
        "Jedźcie CZERWONĄ trasą: ulicą Karkonoską w górę, minąć\n" +
        "Piccola Verona i pętlę, a potem skręcić do DOMKU.\n\n" +
        "Przy kamiennej bramie jest drewniana tabliczka.\n" +
        "Przeczytaj, co jest na niej napisane.",
      type: "answer",
      prompt: "Co jest napisane na tabliczce przy bramie?",
      placeholder: "np. DOMEK ...",
      // akceptuje dowolny wpis zawierający "lifepackers" (bez wielkości liter)
      answer: "domek lifepackers",
      answerContains: "lifepackers",
      successImage: "assets/photos/02-tabliczka.jpg",
      successText: "To ta brama! Jesteście na miejscu.",
    },
    {
      id: 2,
      label: "ZAGADKA 2",
      icon: "door",
      title: "KLUCZ W KAMYKU",
      images: [
        "assets/photos/03-oslona.jpg",
        "assets/photos/04-pod-spodem.jpg",
        "assets/photos/05-kamyk.jpg",
      ],
      riddle:
        "Brama jest zamknięta na klucz!\n\n" +
        "Klucz jest schowany w SZTUCZNYM KAMYKU.\n" +
        "Znajdź drewnianą osłonę przy ogrodzeniu i zajrzyj pod\n" +
        "spód — między deskami leży ciemny kamyk.\n\n" +
        "Otwórz go — w środku jest klucz do bramy. Otwórz bramę!",
      type: "confirm",
      confirmLabel: "MAM KLUCZ — OTWORZYŁAM BRAMĘ ▶",
    },
    {
      id: 3,
      label: "ZAGADKA 3",
      icon: "board",
      title: "KOD DO SKRZYNKI",
      images: ["assets/photos/06-skrzynka.jpg"],
      riddle:
        "Jesteś już za bramą!\n\n" +
        "Klucze do domku są w małej czarnej skrzynce na\n" +
        "czerwonym płocie. Skrzynka ma kod z 4 cyfr.\n\n" +
        "Rozwiąż 4 zagadki — każda podpowie jedną cyfrę.",
      type: "code",
      subRiddles: [
        { q: "Cyfra, którą często myli się z literką O.", a: "0" },
        {
          q: "Odliczasz do startu: 3... 2... 1... START!\nKtórej cyfry brakuje?",
          a: "0",
        },
        { q: "Ile to jest:\n21 + 10 − 11 − 10 − 10 = ?", a: "0" },
        {
          q: "Klasa pomiędzy gumisiami a pierwszakami.\nWpisz cyfrę od której zaczyna się nazwa tej klasy.",
          a: "0",
        },
      ],
      codeReveal: "0 0 0 0",
      finalImage: "assets/photos/06-skrzynka.jpg",
      finalButton: "WESZŁAM DO DOMKU ▶",
      final: true,
    },
  ],
};
