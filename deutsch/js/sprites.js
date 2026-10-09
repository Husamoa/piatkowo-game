/*
 * Mini-silnik pixel-artu. Każdy sprite to tablica napisów (1 znak = 1 piksel),
 * rysowana na <canvas> i skalowana bez wygładzania (image-rendering: pixelated).
 * Oryginalne grafiki — bez assetów z gier komercyjnych.
 *
 * Znak "Q" to kolor "do podmiany" (np. kolor pionka gracza) — patrz el(name,
 * scale, {Q: "#hex"}).
 */
window.Sprites = (function () {
  var PALETTE = {
    ".": null,
    K: "#0d0f16", // czarny kontur
    W: "#ffffff",
    R: "#e43b44", // czerwony
    D: "#8a1f27", // ciemnoczerwony
    Y: "#ffd23f", // żółty
    O: "#f79e2d", // pomarańczowy
    G: "#3fa34d", // zielony
    L: "#8fe36a", // jasnozielony
    B: "#4a7fe0", // niebieski
    C: "#59d5e0", // cyjan
    M: "#c25bd6", // magenta/fiolet
    P: "#ff9ec7", // różowy
    S: "#f6c99a", // skóra
    E: "#c98a4b", // drewno jasne
    T: "#7a5230", // brąz średni
    H: "#aab0bf", // szary jasny
    Q: "#ffffff", // kolor do podmiany
  };

  var DATA = {
    // pionek gracza (Q = kolor gracza)
    pawn: [
      "..KKK..",
      ".KQQQK.",
      ".KQWQK.",
      ".KQQQK.",
      "..KQK..",
      "..KQK..",
      ".KQQQK.",
      "KQQQQQK",
      "KKKKKKK",
    ],
    // flaga Niemiec
    flag: [
      "KKKKKKKKKKKKKK",
      "KKKKKKKKKKKKKK",
      "KKKKKKKKKKKKKK",
      "RRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRR",
      "RRRRRRRRRRRRRR",
      "YYYYYYYYYYYYYY",
      "YYYYYYYYYYYYYY",
      "YYYYYYYYYYYYYY",
    ],
    ladder: [
      "E...E",
      "EEEEE",
      "E...E",
      "E...E",
      "EEEEE",
      "E...E",
      "E...E",
      "EEEEE",
      "E...E",
    ],
    cup: [
      "YYYYYYYYY",
      "Y.YYYWY.Y",
      "Y.YYYWY.Y",
      ".YYYYYYY.",
      "..YYYYY..",
      "...YYY...",
      "....Y....",
      "...YYY...",
      "..OOOOO..",
    ],
    star: ["...Y...", "..YYY..", "YYYYYYY", "..YYY..", "...Y..."],
    heart: [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."],
    bulb: [
      "..YYY..",
      ".YYWYY.",
      ".YYYYY.",
      ".YYYYY.",
      "..YYY..",
      "..HHH..",
      "..HHH..",
      "...K...",
    ],
  };

  function draw(canvas, grid, scale, palette) {
    scale = scale || 6;
    palette = palette || PALETTE;
    var h = grid.length;
    var w = 0;
    for (var i = 0; i < h; i++) w = Math.max(w, grid[i].length);
    canvas.width = w * scale;
    canvas.height = h * scale;
    var cx = canvas.getContext("2d");
    cx.imageSmoothingEnabled = false;
    for (var y = 0; y < h; y++) {
      var row = grid[y];
      for (var x = 0; x < row.length; x++) {
        var col = palette[row[x]];
        if (!col) continue;
        cx.fillStyle = col;
        cx.fillRect(x * scale, y * scale, scale, scale);
      }
    }
  }

  // Zwraca element <canvas> z narysowanym sprite'em o danej nazwie.
  // `over` (opcjonalnie) nadpisuje kolory palety, np. {Q: "#e43b44"}.
  function el(name, scale, over) {
    var grid = DATA[name];
    if (!grid) return null;
    var pal = PALETTE;
    if (over) {
      pal = {};
      for (var k in PALETTE) pal[k] = PALETTE[k];
      for (var j in over) pal[j] = over[j];
    }
    var c = document.createElement("canvas");
    c.className = "sprite sprite-" + name;
    draw(c, grid, scale || 6, pal);
    return c;
  }

  return { draw: draw, el: el, DATA: DATA, PALETTE: PALETTE };
})();
