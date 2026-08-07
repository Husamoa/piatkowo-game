/*
 * Mini-silnik pixel-artu. Każdy sprite to tablica napisów (1 znak = 1 piksel),
 * rysowana na <canvas> i skalowana bez wygładzania (image-rendering: pixelated).
 * Oryginalne grafiki — bez assetów z gier komercyjnych.
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
    N: "#f0cb5e", // włosy (blond)
    E: "#c98a4b", // drewno jasne
    T: "#7a5230", // brąz średni
    X: "#41465a", // szary ciemny (kamień)
    H: "#aab0bf", // szary jasny
  };

  var DATA = {
    hero: [
      "...NNNNN...",
      "..NNNNNNN..",
      ".NNNNNNNNN.",
      ".NNSSSSSNN.",
      ".NSSSSSSSN.",
      ".NSKSSSKSN.",
      ".NSSSSSSSN.",
      ".NSSSPSSSN.",
      "..SSSSSSS..",
      "..MMMMMMM..",
      ".MMMMMMMMM.",
      "SMMMMMMMMMS",
      ".MMMMMMMMM.",
      ".MMMMMMMMM.",
      "..KK...KK..",
    ],
    gift: [
      "....YYYY....",
      "...YKYYKY...",
      "KKKKKKKKKKKK",
      "KRRRRYYRRRRK",
      "KRRRRYYRRRRK",
      "KKKKKYYKKKKK",
      "KRRRRYYRRRRK",
      "KRRRRYYRRRRK",
      "KRRRRYYRRRRK",
      "KKKKKKKKKKKK",
    ],
    cake: [
      ".....O......",
      ".....C......",
      ".....C......",
      ".PPPPPPPPPP.",
      "PPPPPPPPPPPP",
      "KTTTTTTTTTTK",
      "KTTWTTTTWTTK",
      "KTTTTTTTTTTK",
      "KKKKKKKKKKKK",
      ".HHHHHHHHHH.",
      "HHHHHHHHHHHH",
    ],
    star: ["...Y...", "..YYY..", "YYYYYYY", "..YYY..", "...Y..."],
    heart: [".RR.RR.", "RRRRRRR", "RRRRRRR", ".RRRRR.", "..RRR..", "...R..."],
    crown: [
      "Y.Y.Y.Y.Y",
      "YYYYYYYYY",
      "YRYYYYYRY",
      "YYYYYYYYY",
      "KKKKKKKKK",
    ],
    car: [
      "....GGGGGGG....",
      "...GCCCCCCCG...",
      "GGGGGGGGGGGGGGG",
      "GGGGGGGYGGGGGGG",
      "GGGGGGGGGGGGGGG",
      "..KKK.....KKK..",
      "..KKK.....KKK..",
    ],
    door: [
      "KKKKKKKKKKK",
      "KEEEEEEEEEK",
      "KEEEEEEEEEK",
      "KETTTTTTTEK",
      "KETEEEEETEK",
      "KETEEEEETEK",
      "KETEEEYETEK",
      "KETEEEEETEK",
      "KETTTTTTTEK",
      "KEEEEEEEEEK",
      "KKKKKKKKKKK",
    ],
    board: [
      "TTTTTTTTTTTTT",
      "TEEEEEEEEEEET",
      "TWRWEWRWEWRWT",
      "TWWWEWWWEWWWT",
      "TWWWEWWWEWWWT",
      "TEEEEEEEEEEET",
      "TTTTTTTTTTTTT",
    ],
    qr: [
      "KKKKK.KKK",
      "K...K...K",
      "K.K.K.KKK",
      "K...K...K",
      "KKKKK.K.K",
      ".........",
      "KKK.K.KKK",
      "K.K...K.K",
      "KKK.KKKKK",
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
  function el(name, scale) {
    var grid = DATA[name];
    if (!grid) return null;
    var c = document.createElement("canvas");
    c.className = "sprite sprite-" + name;
    draw(c, grid, scale || 6);
    return c;
  }

  return { draw: draw, el: el, DATA: DATA, PALETTE: PALETTE };
})();
