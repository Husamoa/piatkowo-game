/*
 * ZAHLEN-RENNEN — konfiguracja ("baza" gry).
 *
 * Gra planszowa do nauki pisania liczb 0–20 po niemiecku (2 klasa SP).
 * Losuje się liczba (cyfra), dziecko wpisuje ją słowem po niemiecku:
 *   - dobrze za 1. razem  -> do przodu o steps.first pól
 *   - dobrze za 2. razem  -> do przodu o steps.second pól
 *   - dobrze z podpowiedzią (żarówka) -> steps.hint pól
 *   - każdy błąd          -> steps.wrong (cofnięcie)
 * Po dwóch błędach gra pokazuje poprawne słowo i trzeba je przepisać.
 *
 * To jedyne miejsce, które zwykle chcesz edytować (punktacja, plansza,
 * słowa, podpowiedzi do typowych błędów).
 *
 * Porównanie odpowiedzi: bez wielkości liter; "ue"/"oe" = "ü"/"ö";
 * "funf" (bez kropek) = BŁĄD z podpowiedzią o kropkach.
 */
window.GAME_CONFIG = {
  title: "ZAHLEN-RENNEN",
  subtitle: "Liczby po niemiecku 0–20",

  // localStorage (osobne klucze od gier Ani i Matyldy)
  storageKey: "deutsch_game_v1", // aktualna rozgrywka
  statsKey: "deutsch_stats_v1", // historia błędów per imię (mądre losowanie)
  settingsKey: "deutsch_settings_v1", // tryb pisania (klawiatura / rysik)
  recordKey: "deutsch_record_v1", // rekord rund w grze solo

  // plansza: pole 0 = START, pole boardSize = META
  boardSize: 30,
  columns: 8, // ile pól w rzędzie (plansza wężykiem), tablet w poziomie
  columnsPortrait: 6, // ... i w pionie

  // drabiny: stanięcie na dole (po ruchu do przodu) = wspinaczka do góry
  ladders: { 6: 11, 14: 19, 22: 26 },

  steps: {
    first: 3, // dobrze za pierwszym razem
    second: 1, // dobrze za drugim razem
    hint: 1, // dobrze, ale z żarówką
    wrong: -1, // każdy błąd
  },

  // gracze (kolor pionka + domyślna nazwa)
  players: [
    { color: "#e43b44", name: "CZERWONY" },
    { color: "#4a7fe0", name: "NIEBIESKI" },
    { color: "#3fa34d", name: "ZIELONY" },
    { color: "#c25bd6", name: "FIOLETOWY" },
  ],

  // Liczby. `traps`: konkretne błędne zapisy -> podpowiedź.
  // `tip`: ogólna wskazówka pokazywana po 2. błędzie (i w ściądze).
  numbers: [
    {
      n: 0,
      word: "null",
      tip: "NULL — na końcu dwa L.",
      traps: {
        nul: "NULL ma na końcu DWA L.",
        zero: "ZERO to po polsku. Po niemiecku zaczyna się na N.",
      },
    },
    {
      n: 1,
      word: "eins",
      tip: "Gdy liczymy: EINS (z S na końcu).",
      traps: {
        ein: "Gdy liczymy, mówimy EINS — z S na końcu!",
        eine: "Gdy liczymy, mówimy EINS — z S na końcu!",
      },
    },
    { n: 2, word: "zwei", tip: "[cwaj] piszemy Z-W-E-I." },
    { n: 3, word: "drei", tip: "[draj] piszemy D-R-E-I." },
    { n: 4, word: "vier", tip: "Na początku V (choć słyszymy [f]), długie [i] to IE." },
    { n: 5, word: "fünf", tip: "Ü z kropkami: f-ü-n-f." },
    {
      n: 6,
      word: "sechs",
      tip: "[zeks] piszemy S-E-C-H-S.",
      traps: {
        sex: "Słyszymy [ks], ale piszemy CHS: se-chs.",
        seks: "Słyszymy [ks], ale piszemy CHS: se-chs.",
        zeks: "Na początku S, a [ks] to CHS: se-chs.",
      },
    },
    { n: 7, word: "sieben", tip: "S na początku, długie [i] to IE: sie-ben." },
    { n: 8, word: "acht", tip: "[aht] piszemy A-C-H-T." },
    {
      n: 9,
      word: "neun",
      tip: "[nojn] piszemy N-E-U-N.",
      traps: { nein: "NEIN znaczy „nie” :) A 9 to N-E-U-N." },
    },
    {
      n: 10,
      word: "zehn",
      tip: "Z na początku i ciche H: z-e-h-n.",
    },
    { n: 11, word: "elf", tip: "Jak elf z bajki: e-l-f." },
    { n: 12, word: "zwölf", tip: "Ö z kropkami: zw-ö-lf." },
    { n: 13, word: "dreizehn", tip: "13 = drei + zehn → dreizehn." },
    { n: 14, word: "vierzehn", tip: "14 = vier + zehn → vierzehn." },
    { n: 15, word: "fünfzehn", tip: "15 = fünf + zehn → fünfzehn." },
    {
      n: 16,
      word: "sechzehn",
      tip: "16 = sechs + zehn, ale S ucieka: sech-zehn!",
      traps: {
        sechszehn: "Uwaga, pułapka! W 16 znika S: SECH-ZEHN.",
        sexzehn: "Uwaga, pułapka! W 16 znika S: SECH-ZEHN.",
      },
    },
    {
      n: 17,
      word: "siebzehn",
      tip: "17 = sieben + zehn, ale EN ucieka: sieb-zehn!",
      traps: {
        siebenzehn: "Uwaga, pułapka! W 17 znika EN: SIEB-ZEHN.",
        sibenzehn: "W 17 znika EN, a [i] to IE: SIEB-ZEHN.",
      },
    },
    { n: 18, word: "achtzehn", tip: "18 = acht + zehn → achtzehn." },
    { n: 19, word: "neunzehn", tip: "19 = neun + zehn → neunzehn." },
    {
      n: 20,
      word: "zwanzig",
      tip: "Na końcu IG (choć słyszymy [ich]): zwan-zig.",
      traps: {
        zwei: "To jest 2. A 20 to inne słowo — zaczyna się na ZWAN…",
        zweizehn: "Takiego słowa nie ma :) 20 to ZWAN-ZIG.",
      },
    },
  ],

  // Ogólne reguły (typowe błędy polskich dzieci). Sprawdzane, gdy poprawne
  // słowo pasuje do `when`, a wpis pasuje do `test` (i NIE pasuje do `unless`).
  rules: [
    { when: /ei/, test: /a[ij]|ej/, msg: "Dźwięk [aj] po niemiecku piszemy EI." },
    { when: /eu/, test: /o[ij]|oy/, msg: "Dźwięk [oj] po niemiecku piszemy EU." },
    { when: /eu/, unless: /eu/, test: /n.*n/, msg: "Dźwięk [oj] po niemiecku piszemy EU." },
    { when: /z/, test: /c(?!h)|ts/, msg: "Dźwięk [c] po niemiecku piszemy Z." },
    {
      when: /zehn$/,
      unless: /zehn$/,
      test: /(c|ts|z)e+h?n$|ce?hn$/,
      msg: "Końcówka ZEHN: Z (słyszymy [c]) i ciche H.",
    },
    { when: /^vier/, test: /^f/, msg: "VIER zaczyna się na V, choć słyszymy [f]." },
    { when: /ie/, unless: /ie/, test: /i/, msg: "Długie [i] po niemiecku piszemy IE." },
    { when: /^s/, test: /^z/, msg: "Na początku słyszymy [z], ale piszemy S." },
    { when: /acht/, unless: /cht/, test: /a.*t/, msg: "[ah] piszemy ACH: a-ch-t." },
    { when: /ig$/, test: /(ich|ih|ik|isch)$/, msg: "Na końcu piszemy IG, choć słyszymy [ich]." },
  ],
};
