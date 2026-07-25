/*
 * GRA PIĄTKOWSKA — konfiguracja ("baza" gry).
 *
 * To jedyne miejsce, które zwykle chcesz edytować:
 *  - teksty zagadek,
 *  - tokeny kodów QR (to, co jest zaszyte w każdym kodzie),
 *  - kolejność etapów.
 *
 * Jak działa mechanika:
 *  - Każdy etap ma swój `token`. Ten token jest zaszyty w kodzie QR, który
 *    naklejasz w miejscu, do którego prowadzi zagadka z tego etapu.
 *  - Gra przechowuje postęp lokalnie (localStorage). Kolejny kod odblokowuje
 *    następną zagadkę TYLKO gdy zeskanujesz właściwy kod we właściwej kolejności.
 *  - Zły / nie ten kod => "Nieprawidłowy kod QR!".
 *
 * Odpowiedzi (dla Ciebie, NIE pokazywane w grze):
 *   1. piwnica
 *   2. tablica ogłoszeń  (szyfr GA-DE-RY-PO-LU-KI: "tgbukcg paupszdn")
 *   3. Skoda Elroq
 *   4. Bolesław Chrobry (posąg na ławeczce)
 *   5. cukiernia + hasło: "Małe fusy"
 */
window.GAME_CONFIG = {
  title: "GRA PIĄTKOWSKA",
  subtitle: "Imieninowa wyprawa po prezent",
  hero: "ANIA",
  startToken: "PTK-START-A7N3",

  // localStorage key na postęp
  storageKey: "piatkowo_progress_v1",

  stages: [
    {
      id: 1,
      label: "ZAGADKA 1",
      icon: "door",
      riddle: "Tam gdzie światło nie dochodzi\ni po żwirek się do niej schodzi.",
      // -> piwnica; kod QR nakleisz w piwnicy
      token: "PTK-7QF2",
      place: "Piwnica",
    },
    {
      id: 2,
      label: "ZAGADKA 2",
      icon: "board",
      riddle: "tgbukcg paupszdn",
      cipher: true,
      hint: "Szyfr: GA-DE-RY-PO-LU-KI\nLitery, które są w parze, zamieniają się w słowie miejscami (a↔g, e↔d, y↔r, o↔p, u↔l, i↔k).",
      // -> tablica ogłoszeń; kod QR nakleisz na tablicy
      token: "PTK-K3M9",
      place: "Tablica ogłoszeń",
    },
    {
      id: 3,
      label: "ZAGADKA 3",
      icon: "car",
      riddle: "Elektryka prąd nie tyka.",
      hint: "zielonego",
      // -> Skoda Elroq; kod QR przy aucie
      token: "PTK-W8V4",
      place: "Skoda Elroq",
    },
    {
      id: 4,
      label: "ZAGADKA 4",
      icon: "crown",
      riddle: "Tam gdzie dziecko mieszka.",
      hint: "ławeczka",
      // -> Bolesław Chrobry (posąg na ławce); kod QR przy pomniku
      token: "PTK-B5R1",
      place: "Pomnik Bolesława Chrobrego",
    },
    {
      id: 5,
      label: "ZAGADKA 5",
      icon: "cake",
      riddle:
        "Prezent czeka gdzieś,\ngdzie możesz ciasto zjeść.\n\nDostać go możesz, jeśli\nwejdziesz i powiesz\nhasło reklamowe firmy od cukierków,\nktórą rozlewał na przystankach\npewien pawlaczek przystojniaczek.",
      // -> cukiernia; kod QR w cukierni odpala ekran zwycięstwa
      token: "PTK-C1F6",
      place: "Cukiernia",
      final: true,
    },
  ],
};
