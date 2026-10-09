/*
 * ZAHLEN-RENNEN — logika i widoki.
 *
 * Gra planszowa: losuje się liczba 0–20, gracz pisze ją słowem po niemiecku
 * i idzie pionkiem do przodu (dobrze) albo się cofa (błąd). Po dwóch błędach
 * gra pokazuje poprawne słowo i trzeba je przepisać.
 *
 * Tryby: 1 gracz albo 2–4 graczy na zmianę na jednym urządzeniu.
 * Pisanie: klawiatura (fizyczna/ekranowa) albo rysik — na iPadzie pismo
 * rysikiem w polu tekstowym zamienia na tekst system (Scribble).
 *
 * Stan gry w localStorage (osobne klucze od gier Ani i Matyldy), więc
 * odświeżenie strony nie gubi rozgrywki. Historia błędów per imię steruje
 * "mądrym losowaniem" — trudne liczby wypadają częściej.
 */
(function () {
  var CFG = window.GAME_CONFIG;
  var NUMS = CFG.numbers;
  var SIZE = CFG.boardSize;
  var STEPS = CFG.steps;
  var LADDERS = CFG.ladders || {};
  var BY_N = {};
  NUMS.forEach(function (x) {
    BY_N[x.n] = x;
  });

  var screen; // #screen
  var game = null; // aktualna rozgrywka
  var settings = {}; // { pencil: bool, lastNames: [], lastCount: n }
  var viewToken = 0; // rośnie przy każdej zmianie widoku (unieważnia timery)
  var primaryAction = null; // co robi Enter na fizycznej klawiaturze
  var onResize = null; // przerysowanie widoku po obrocie tabletu

  /* ---------- localStorage ---------- */
  function loadJSON(key, def) {
    try {
      var raw = localStorage.getItem(key);
      if (!raw) return def;
      var v = JSON.parse(raw);
      return v == null ? def : v;
    } catch (e) {
      return def;
    }
  }
  function saveJSON(key, v) {
    try {
      localStorage.setItem(key, JSON.stringify(v));
    } catch (e) {}
  }
  function removeKey(key) {
    try {
      localStorage.removeItem(key);
    } catch (e) {}
  }

  function saveGame() {
    if (game) saveJSON(CFG.storageKey, game);
  }
  function loadGame() {
    var g = loadJSON(CFG.storageKey, null);
    if (!g || typeof g !== "object" || !Array.isArray(g.players)) return null;
    if (g.players.length < 1 || g.players.length > CFG.players.length) return null;
    for (var i = 0; i < g.players.length; i++) {
      var p = g.players[i];
      if (!p || typeof p.pos !== "number" || isNaN(p.pos)) return null;
      p.pos = clamp(Math.round(p.pos), 0, SIZE);
      p.name = String(p.name || CFG.players[i].name);
      p.color = p.color || CFG.players[i].color;
      p.errs = p.errs && typeof p.errs === "object" ? p.errs : {};
      p.turns = p.turns || 0;
    }
    if (typeof g.turn !== "number" || g.turn < 0 || g.turn >= g.players.length)
      g.turn = 0;
    if (g.winner != null && !g.players[g.winner]) g.winner = null;
    if (g.q && (typeof g.q !== "object" || !BY_N[g.q.n])) g.q = null;
    return g;
  }

  function clamp(v, a, b) {
    return Math.max(a, Math.min(b, v));
  }

  /* ---------- statystyki (mądre losowanie) ---------- */
  function nameKey(name) {
    return String(name || "").trim().toUpperCase() || "GRACZ";
  }
  function allStats() {
    var s = loadJSON(CFG.statsKey, {});
    return s && typeof s === "object" ? s : {};
  }
  function bump(name, n, field) {
    var s = allStats();
    var k = nameKey(name);
    s[k] = s[k] || {};
    var e = s[k][n] || { ok: 0, err: 0 };
    e[field] = (e[field] || 0) + 1;
    s[k][n] = e;
    saveJSON(CFG.statsKey, s);
  }

  // Waga liczby: nowe = 2, po błędach rośnie, po trafieniach maleje.
  // Ta sama liczba nie wypada dwa razy z rzędu temu samemu graczowi.
  function pickNumber(p) {
    var hist = allStats()[nameKey(p.name)] || {};
    var ws = [];
    var total = 0;
    NUMS.forEach(function (x) {
      var w;
      if (x.n === p.lastN) w = 0;
      else {
        var s = hist[x.n];
        var ok = (s && s.ok) || 0;
        var err = (s && s.err) || 0;
        if (ok + err === 0) w = 2;
        else w = clamp(1 + 1.5 * err - 0.3 * ok, 0.4, 6);
      }
      ws.push(w);
      total += w;
    });
    var r = Math.random() * total;
    for (var i = 0; i < NUMS.length; i++) {
      r -= ws[i];
      if (r < 0 && ws[i] > 0) return NUMS[i].n;
    }
    for (var j = NUMS.length - 1; j >= 0; j--) if (ws[j] > 0) return NUMS[j].n;
    return NUMS[0].n;
  }

  /* ---------- mini helper DOM ---------- */
  function h(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!attrs.hasOwnProperty(k)) continue;
      var val = attrs[k];
      if (k === "class") e.className = val;
      else if (k === "text") e.textContent = val;
      else if (k.slice(0, 2) === "on" && typeof val === "function")
        e.addEventListener(k.slice(2).toLowerCase(), val);
      else if (val === true) e.setAttribute(k, "");
      else if (val != null && val !== false) e.setAttribute(k, val);
    }
    for (var i = 2; i < arguments.length; i++) appendChild(e, arguments[i]);
    return e;
  }
  function appendChild(e, c) {
    if (c == null) return;
    if (Array.isArray(c)) {
      c.forEach(function (x) {
        appendChild(e, x);
      });
      return;
    }
    e.appendChild(typeof c === "string" ? document.createTextNode(c) : c);
  }
  function clearScreen() {
    viewToken++;
    primaryAction = null;
    onResize = null;
    screen.innerHTML = "";
    try {
      window.scrollTo(0, 0);
    } catch (e) {}
  }
  function app() {
    return document.getElementById("app");
  }
  // setTimeout, który nie odpali, jeśli w międzyczasie zmienił się widok
  function later(fn, ms) {
    var tok = viewToken;
    setTimeout(function () {
      if (tok === viewToken) fn();
    }, ms);
  }
  function prevent(e) {
    // przycisk nie zabiera fokusu polu tekstowemu (klawiatura iPada zostaje)
    e.preventDefault();
  }
  function restartAnim(el, cls) {
    el.classList.remove(cls);
    void el.offsetWidth;
    el.classList.add(cls);
  }

  /* ---------- polska odmiana ---------- */
  function plural(n, one, few, many) {
    n = Math.abs(n);
    if (n === 1) return one;
    var d = n % 10;
    var dd = n % 100;
    if (d >= 2 && d <= 4 && (dd < 12 || dd > 14)) return few;
    return many;
  }
  function pola(n) {
    return n + " " + plural(n, "pole", "pola", "pól");
  }
  function signed(n) {
    return (n > 0 ? "+" : n < 0 ? "−" : "") + Math.abs(n);
  }

  /* ---------- porównywanie odpowiedzi ---------- */
  var UML = { "ü": "u", "ö": "o", "ä": "a" };
  function clean(s) {
    s = String(s || "");
    if (s.normalize) s = s.normalize("NFC"); // Scribble może dać "u + ¨"
    return s.toLowerCase().replace(/[‐-―]/g, "-").trim();
  }
  // Postać do porównania: bez spacji/myślników, "ue"/"oe" -> "ü"/"ö"
  // (tylko gdy poprawne słowo ma umlaut — żeby nie przekręcać innych błędów).
  function canon(s, word) {
    var c = clean(s).replace(/[\s\-]+/g, "");
    if (word.indexOf("ü") >= 0) c = c.replace(/ue/g, "ü");
    if (word.indexOf("ö") >= 0) c = c.replace(/oe/g, "ö");
    if (word.indexOf("ä") >= 0) c = c.replace(/ae/g, "ä");
    return c;
  }
  function stripUml(s) {
    return s.replace(/[üöä]/g, function (ch) {
      return UML[ch];
    });
  }

  // Podpowiedzi do błędnej odpowiedzi (max 2).
  function hintsFor(item, c) {
    var word = item.word;
    var out = [];
    function add(m) {
      if (m && out.indexOf(m) < 0) out.push(m);
    }
    if (item.traps && item.traps.hasOwnProperty(c)) add(item.traps[c]);
    var plain = stripUml(word);
    if (plain !== word && !/[äöü]/.test(c)) {
      var u = word.indexOf("ü") >= 0 ? "ü" : word.indexOf("ö") >= 0 ? "ö" : "ä";
      if (c === plain) add("Prawie! Brakuje kropek — tu jest " + u + ".");
      else if (c.indexOf(UML[u]) >= 0) add("Pamiętaj o kropkach: " + u + ".");
    }
    (CFG.rules || []).forEach(function (r) {
      if (r.when.test(word) && (!r.unless || !r.unless.test(c)) && r.test.test(c))
        add(r.msg);
    });
    return out.slice(0, 2);
  }

  // Wyrównanie odpowiedzi do wzoru (odległość edycyjna z backtrace).
  // ok = litera dobra, sub = zła litera, extra = litera za dużo, miss = brak.
  function align(a, b) {
    a = a.split("");
    b = b.split("");
    var n = a.length;
    var m = b.length;
    var d = [];
    var i, j;
    for (i = 0; i <= n; i++) {
      d[i] = [i];
    }
    for (j = 0; j <= m; j++) d[0][j] = j;
    for (i = 1; i <= n; i++)
      for (j = 1; j <= m; j++)
        d[i][j] = Math.min(
          d[i - 1][j] + 1,
          d[i][j - 1] + 1,
          d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)
        );
    var ops = [];
    i = n;
    j = m;
    while (i > 0 || j > 0) {
      if (i > 0 && j > 0 && a[i - 1] === b[j - 1] && d[i][j] === d[i - 1][j - 1]) {
        ops.push({ t: "ok", u: a[i - 1], c: b[j - 1] });
        i--;
        j--;
      } else if (i > 0 && j > 0 && d[i][j] === d[i - 1][j - 1] + 1) {
        ops.push({ t: "sub", u: a[i - 1], c: b[j - 1] });
        i--;
        j--;
      } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
        ops.push({ t: "extra", u: a[i - 1] });
        i--;
      } else {
        ops.push({ t: "miss", c: b[j - 1] });
        j--;
      }
    }
    return ops.reverse();
  }

  // Rząd literek: "user" = odpowiedź dziecka, "correct" = wzór z poprawkami.
  function lettersRow(ops, mode, big) {
    var row = h("div", { class: "letters word-font" + (big ? " big" : "") });
    ops.forEach(function (o) {
      if (mode === "user") {
        if (o.t === "ok") row.appendChild(h("span", { class: "lt ok", text: o.u }));
        else if (o.t === "sub")
          row.appendChild(h("span", { class: "lt bad", text: o.u }));
        else if (o.t === "extra")
          row.appendChild(h("span", { class: "lt bad extra", text: o.u }));
        else row.appendChild(h("span", { class: "lt miss", text: "_" }));
      } else {
        if (o.t === "extra") return;
        row.appendChild(
          h("span", { class: "lt " + (o.t === "ok" ? "ok" : "fix"), text: o.c })
        );
      }
    });
    return row;
  }
  function wordTiles(word, big) {
    return lettersRow(align(word, word), "correct", big);
  }

  function shuffled(word) {
    var best = word.split("");
    for (var tries = 0; tries < 12; tries++) {
      var a = word.split("");
      for (var i = a.length - 1; i > 0; i--) {
        var j = Math.floor(Math.random() * (i + 1));
        var t = a[i];
        a[i] = a[j];
        a[j] = t;
      }
      best = a;
      if (a.join("") !== word) break;
    }
    return best;
  }

  /* ---------- dźwięk ---------- */
  function muteBtn() {
    var b = h("button", {
      class: "iconbtn",
      "aria-label": "Dźwięk",
      onclick: function () {
        Audio8.unlock();
        Audio8.toggleMuted();
        updateMute(b);
        Audio8.blip();
      },
    });
    updateMute(b);
    return b;
  }
  function updateMute(b) {
    b.textContent = Audio8.isMuted() ? "♪ OFF" : "♪ ON";
  }
  // automatyczna wymowa (po odpowiedzi) — szanuje wyciszenie
  function autoSay(word) {
    if (!Audio8.isMuted()) Audio8.say(word);
  }

  /* ---------- panel organizatora (5x tap w tytuł) ---------- */
  var tapCount = 0,
    tapTimer = null;
  function onTitleTap() {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function () {
      tapCount = 0;
    }, 1200);
    if (tapCount >= 5) {
      tapCount = 0;
      organizer();
    }
  }

  function topBar() {
    return h(
      "div",
      { class: "topbar" },
      h("div", { class: "top-title", text: CFG.title, onclick: onTitleTap }),
      muteBtn()
    );
  }

  function pencilMode() {
    return !!settings.pencil;
  }

  // Przełącznik: piszę klawiaturą / rysikiem
  function inputModeToggle() {
    var b1 = h("button", { class: "seg", text: "⌨ KLAWIATURA" });
    var b2 = h("button", { class: "seg", text: "✏ RYSIK" });
    function paint() {
      b1.classList.toggle("on", !pencilMode());
      b2.classList.toggle("on", pencilMode());
    }
    function set(v) {
      Audio8.unlock();
      Audio8.blip();
      settings.pencil = v;
      saveJSON(CFG.settingsKey, settings);
      paint();
    }
    b1.addEventListener("click", function () {
      set(false);
    });
    b2.addEventListener("click", function () {
      set(true);
    });
    paint();
    return h(
      "div",
      { class: "seg-wrap" },
      h("span", { class: "seg-label", text: "PISZĘ:" }),
      h("div", { class: "seg-group" }, b1, b2)
    );
  }

  function pawnEl(p, scale) {
    var c = Sprites.el("pawn", scale || 3, { Q: p.color });
    c.classList.add("pawn");
    return c;
  }

  /* ================= WIDOKI ================= */

  /* ---------- ekran tytułowy ---------- */
  function renderTitle() {
    clearScreen();
    var inProgress = !!(game && game.winner == null);
    var pawns = h("div", { class: "title-pawns" });
    CFG.players.forEach(function (pc) {
      pawns.appendChild(Sprites.el("pawn", 5, { Q: pc.color }));
    });

    var howto = h(
      "div",
      { class: "howto" },
      h("p", { text: "🎲 Losujesz liczbę od 0 do 20." }),
      h("p", { text: "✍ Piszesz ją SŁOWEM po niemiecku." }),
      h("p", { class: "good", text: "✔ Dobrze za 1. razem: " + signed(STEPS.first) }),
      h("p", { class: "good", text: "✔ Za 2. razem: " + signed(STEPS.second) }),
      h("p", { class: "bad", text: "✖ Każdy błąd: " + signed(STEPS.wrong) }),
      h("p", { text: "🪜 Drabina = skok w górę!" })
    );

    var kids = [
      topBar(),
      h("div", { class: "title-art float" }, Sprites.el("flag", 8)),
      h("h1", { class: "game-title", text: CFG.title }),
      h("p", { class: "game-sub", text: CFG.subtitle }),
      pawns,
    ];
    if (inProgress)
      kids.push(
        h("button", {
          class: "btn btn-big blink",
          text: "GRAJ DALEJ ▶",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            resume(true);
          },
        })
      );
    kids.push(
      h(
        "div",
        { class: "menu-btns" },
        h("button", {
          class: "btn btn-big" + (inProgress ? " btn-alt" : ""),
          text: "1 GRACZ",
          onclick: function () {
            newGameFlow(false);
          },
        }),
        h("button", {
          class: "btn btn-big btn-alt",
          text: "2–4 GRACZY",
          onclick: function () {
            newGameFlow(true);
          },
        }),
        h("button", {
          class: "btn btn-ghost",
          text: "📖 ŚCIĄGA 0–20",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            renderCheat(renderTitle);
          },
        })
      ),
      inputModeToggle(),
      howto
    );
    screen.appendChild(h("div", { class: "view view-title narrow" }, kids));
    if (inProgress)
      primaryAction = function () {
        resume(true);
      };
  }

  function newGameFlow(multi) {
    Audio8.unlock();
    Audio8.blip();
    if (game && game.winner == null) {
      confirmBox(
        "NOWA GRA?",
        "Obecna gra przepadnie.",
        "TAK, NOWA",
        function () {
          renderSetup(multi);
        }
      );
    } else renderSetup(multi);
  }

  /* ---------- wybór graczy ---------- */
  function renderSetup(multi) {
    clearScreen();
    var count = multi ? clamp(settings.lastCount || 2, 2, CFG.players.length) : 1;
    var last = multi ? settings.lastNames || [] : settings.soloName ? [settings.soloName] : [];
    var list = h("div", { class: "name-list" });
    var inputs = [];

    function build() {
      var old = inputs.map(function (i) {
        return i.value;
      });
      list.innerHTML = "";
      inputs = [];
      for (var i = 0; i < count; i++) {
        var pc = CFG.players[i];
        var inp = h("input", {
          class: "name-input",
          type: "text",
          maxlength: "10",
          placeholder: multi ? pc.name : "TWOJE IMIĘ",
          autocomplete: "off",
          autocorrect: "off",
          autocapitalize: "characters",
          spellcheck: "false",
          enterkeyhint: "go",
          "aria-label": "Imię gracza " + (i + 1),
        });
        inp.value = old[i] != null ? old[i] : last[i] || "";
        inp.addEventListener("keydown", function (e) {
          if (e.key === "Enter") {
            e.preventDefault();
            start();
          }
        });
        inputs.push(inp);
        list.appendChild(
          h("label", { class: "name-row" }, Sprites.el("pawn", 4, { Q: pc.color }), inp)
        );
      }
    }

    var countBtns = [];
    var countRow = null;
    if (multi) {
      countRow = h("div", { class: "seg-group count-row" });
      [2, 3, 4].forEach(function (n) {
        if (n > CFG.players.length) return;
        var b = h("button", {
          class: "seg" + (n === count ? " on" : ""),
          text: n + " GRACZY",
          onclick: function () {
            Audio8.blip();
            count = n;
            countBtns.forEach(function (x) {
              x.classList.toggle("on", x === b);
            });
            build();
          },
        });
        countBtns.push(b);
        countRow.appendChild(b);
      });
    }

    function start() {
      Audio8.unlock();
      Audio8.blip();
      var names = inputs.map(function (inp, i) {
        var v = inp.value.trim().toUpperCase().slice(0, 10);
        return v || (multi ? CFG.players[i].name : "GRACZ");
      });
      if (multi) {
        settings.lastNames = inputs.map(function (i) {
          return i.value.trim().toUpperCase();
        });
        settings.lastCount = count;
      } else settings.soloName = inputs[0].value.trim().toUpperCase();
      saveJSON(CFG.settingsKey, settings);
      newGame(names);
    }

    build();
    screen.appendChild(
      h(
        "div",
        { class: "view view-setup narrow" },
        topBar(),
        h("h2", { class: "stage-title", text: multi ? "KTO GRA?" : "JAK MASZ NA IMIĘ?" }),
        countRow,
        list,
        h("p", {
          class: "small-dim",
          text: multi
            ? "Gracze piszą na zmianę na jednym tablecie."
            : "Imię pomaga grze zapamiętać, które liczby są dla Ciebie trudne.",
        }),
        h("button", { class: "btn btn-big blink", text: "START ▶", onclick: start }),
        h("button", {
          class: "btn btn-sm btn-ghost",
          text: "◀ WRÓĆ",
          onclick: function () {
            Audio8.blip();
            renderTitle();
          },
        })
      )
    );
    primaryAction = start;
  }

  function newGame(names) {
    game = {
      v: 1,
      players: names.map(function (nm, i) {
        return {
          name: nm,
          color: CFG.players[i].color,
          pos: 0,
          errs: {},
          turns: 0,
          lastN: null,
        };
      }),
      turn: 0,
      q: null,
      winner: null,
      last: null,
    };
    saveGame();
    renderBoard();
  }

  function resume(fromGesture) {
    if (!game) return renderTitle();
    if (game.winner != null) return renderVictory();
    if (game.q) return renderQuestion(false, fromGesture);
    renderBoard();
  }

  /* ---------- plansza ---------- */
  // tablet w pionie: węższa i wyższa plansza (lepiej wypełnia ekran)
  function boardCols() {
    var portrait = window.innerHeight > window.innerWidth * 1.1;
    return portrait ? CFG.columnsPortrait || 6 : CFG.columns || 8;
  }
  function cellRC(i, cols) {
    var r = Math.floor(i / cols);
    var k = i % cols;
    return { r: r, c: r % 2 === 0 ? k : cols - 1 - k };
  }

  function renderBoard(opts) {
    clearScreen();
    var anim = opts && opts.anim;
    var disp = game.players.map(function (p) {
      return p.pos;
    });
    if (anim) disp[anim.idx] = anim.from;
    var active = anim ? anim.idx : game.winner != null ? game.winner : game.turn;
    var multi = game.players.length > 1;

    var ladderTops = {};
    for (var lk in LADDERS) if (LADDERS.hasOwnProperty(lk)) ladderTops[LADDERS[lk]] = +lk;

    var cols = boardCols();
    var board = h("div", {
      class: "board",
      style: "grid-template-columns:repeat(" + cols + ",minmax(0,1fr))",
    });
    var boxes = [];
    var cells = [];
    for (var i = 0; i <= SIZE; i++) {
      var rc = cellRC(i, cols);
      var cls = "cell row" + (rc.r % 2);
      var label = String(i);
      var deco = null;
      if (i === 0) {
        cls += " start";
        label = "START";
      } else if (i === SIZE) {
        cls += " meta";
        label = "META";
        deco = h("span", { class: "cell-deco" }, Sprites.el("cup", 3));
      } else if (LADDERS[i] != null) {
        cls += " ladder";
        deco = h(
          "span",
          { class: "cell-deco" },
          Sprites.el("ladder", 3),
          h("span", { class: "cell-to", text: "↗" + LADDERS[i] })
        );
      } else if (ladderTops[i] != null) cls += " ladder-top";
      var pawns = h("div", { class: "pawns" });
      boxes.push(pawns);
      var cell = h(
        "div",
        {
          class: cls,
          style: "grid-row:" + (rc.r + 1) + ";grid-column:" + (rc.c + 1),
        },
        h("span", { class: "cell-num", text: label }),
        deco,
        pawns
      );
      cells.push(cell);
      board.appendChild(cell);
    }
    // puste miejsca w ostatnim rzędzie: ozdobny pasek wskazujący metę
    var lastRow = Math.floor(SIZE / cols);
    var empty = cols - (SIZE % cols) - 1;
    if (empty > 0) {
      var rtl = lastRow % 2 === 1; // ostatni rząd idzie od prawej do lewej?
      board.appendChild(
        h(
          "div",
          {
            class: "cell-filler",
            style:
              "grid-row:" +
              (lastRow + 1) +
              ";grid-column:" +
              (rtl ? 1 : cols - empty + 1) +
              " / span " +
              empty,
          },
          rtl ? null : h("span", { text: "◀" }),
          Sprites.el("flag", 3),
          empty > 1 ? h("span", { class: "word-font", text: "ZIEL" }) : null,
          rtl ? h("span", { text: "▶" }) : null
        )
      );
    }

    function place() {
      boxes.forEach(function (b) {
        b.innerHTML = "";
      });
      game.players.forEach(function (p, idx) {
        var c = pawnEl(p, 3);
        if (idx === active) c.classList.add("active");
        boxes[clamp(disp[idx], 0, SIZE)].appendChild(c);
      });
    }

    var banner = h("div", { class: "turn-banner" });
    var animating = !!anim;
    function paintBanner() {
      banner.innerHTML = "";
      if (animating) {
        // w trakcie animacji: gracz, który właśnie się rusza
        var mp = game.players[anim.idx];
        banner.appendChild(pawnEl(mp, 3));
        banner.appendChild(h("span", { text: multi ? mp.name + " IDZIE…" : "RUCH PIONKA…" }));
        return;
      }
      if (game.winner != null) {
        banner.appendChild(pawnEl(game.players[game.winner], 3));
        banner.appendChild(h("span", { text: game.players[game.winner].name + " NA MECIE!" }));
        return;
      }
      var p = game.players[game.turn];
      banner.appendChild(pawnEl(p, 3));
      banner.appendChild(
        h("span", {
          text: multi
            ? "RUCH: " + p.name
            : "RUNDA " + (p.turns + 1) + " · POLE " + p.pos + "/" + SIZE,
        })
      );
    }

    var msg = h("div", { class: "board-msg" });
    function paintMsg(info) {
      msg.innerHTML = "";
      if (!info) return;
      var p = game.players[info.idx];
      var item = BY_N[info.n];
      var end = info.ladderTo != null ? info.ladderTo : info.to;
      var net = end - info.from;
      msg.appendChild(
        h(
          "p",
          {},
          multi ? p.name + ": " : "",
          h("b", { class: "word-font", text: info.n + " = " + (item ? item.word : "?") })
        )
      );
      msg.appendChild(
        h("p", {
          class: net > 0 ? "good" : net < 0 ? "bad" : "",
          text:
            (net === 0 ? "Bez zmian" : signed(net) + " → pole " + end) +
            (info.ladderTo != null ? "  🪜 DRABINA!" : ""),
        })
      );
    }

    var rollBtn = h("button", {
      class: "btn btn-big blink btn-roll",
      text: "🎲 LOSUJ LICZBĘ",
      onclick: function () {
        if (rollBtn.disabled) return;
        startTurn();
      },
    });

    screen.appendChild(
      h(
        "div",
        { class: "view view-board" },
        topBar(),
        banner,
        board,
        msg,
        rollBtn,
        h(
          "div",
          { class: "board-tools" },
          h("button", {
            class: "btn btn-sm btn-ghost",
            text: "📖 ŚCIĄGA",
            onclick: function () {
              Audio8.unlock();
              Audio8.blip();
              renderCheat(function () {
                renderBoard();
              });
            },
          }),
          inputModeToggle(),
          h("button", {
            class: "btn btn-sm btn-ghost",
            text: "☰ MENU",
            onclick: function () {
              Audio8.blip();
              renderTitle();
            },
          })
        )
      )
    );
    paintBanner();
    place();

    function ready() {
      animating = false;
      active = game.winner != null ? game.winner : game.turn;
      place();
      paintBanner();
      if (game.winner != null) {
        rollBtn.style.display = "none";
        later(renderVictory, 1100);
        return;
      }
      rollBtn.disabled = false;
      primaryAction = startTurn;
      onResize = function () {
        if (boardCols() !== cols) renderBoard();
      };
    }

    if (!anim) {
      if (game.last) paintMsg(game.last);
      ready();
      return;
    }

    // animacja ruchu pionka: krok po kroku, potem ewentualnie drabina
    rollBtn.disabled = true;
    var seq = [];
    var a = anim.from;
    while (a !== anim.to) {
      a += a < anim.to ? 1 : -1;
      seq.push(a);
    }
    var k = 0;
    var ladderPending = anim.ladderTo != null;
    function stepAnim() {
      if (k < seq.length) {
        var fwd = seq[k] > disp[anim.idx];
        disp[anim.idx] = seq[k++];
        place();
        if (fwd) Audio8.step();
        else Audio8.back();
        later(stepAnim, 300);
        return;
      }
      if (ladderPending) {
        ladderPending = false;
        later(function () {
          restartAnim(cells[anim.to], "flash");
          disp[anim.idx] = anim.ladderTo;
          place();
          restartAnim(cells[anim.ladderTo], "flash");
          Audio8.ladder();
          later(stepAnim, 600);
        }, 250);
        return;
      }
      paintMsg(anim);
      ready();
    }
    later(stepAnim, 400);
  }

  /* ---------- tura: losowanie ---------- */
  function startTurn() {
    if (!game || game.winner != null || game.q) return;
    Audio8.unlock();
    var p = game.players[game.turn];
    game.q = {
      n: pickNumber(p),
      tries: 0, // ile błędnych prób
      hinted: 0, // poziom podpowiedzi (0, 1, 2)
      phase: "answer", // answer | copy | done
      startPos: p.pos,
      lastWrong: null,
      result: null,
    };
    saveGame();
    // render + focus SYNCHRONICZNIE w geście — tylko wtedy iPad pokaże klawiaturę
    renderQuestion(true, true);
  }

  /* ---------- tura: pytanie ---------- */
  function renderQuestion(roll, fromGesture) {
    clearScreen();
    var tok = viewToken;
    var p = game.players[game.turn];
    var q = game.q;
    var item = BY_N[q.n];
    var word = item.word;
    var pencil = pencilMode();
    var multi = game.players.length > 1;
    var rolling = !!roll;

    /* nagłówek: kto gra + pasek pozycji */
    var miniFill = h("div", { class: "mini-fill" });
    var miniTxt = h("span", { class: "mini-txt" });
    var deltaBox = h("span", { class: "delta-box" });
    function updateMini() {
      miniFill.style.width = (p.pos / SIZE) * 100 + "%";
      miniTxt.textContent = "POLE " + p.pos + "/" + SIZE;
    }
    function flyDelta(d) {
      var el = h("span", {
        class: "delta " + (d > 0 ? "up" : "down"),
        text: signed(d),
      });
      deltaBox.appendChild(el);
      setTimeout(function () {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 1600);
    }
    var head = h(
      "div",
      { class: "q-head" },
      pawnEl(p, 3),
      h("span", { class: "q-who", text: multi ? p.name : "RUNDA " + (p.turns + 1) }),
      h(
        "div",
        { class: "mini" },
        h("div", { class: "mini-track" }, miniFill),
        miniTxt,
        deltaBox
      ),
      muteBtn()
    );

    /* liczba + wymowa */
    var num = h("div", { class: "num", text: rolling ? "?" : String(q.n) });
    var sayBtn = Audio8.canSpeak()
      ? h("button", {
          class: "btn btn-ghost btn-say",
          text: "🔊 POSŁUCHAJ",
          onmousedown: prevent,
          onclick: function () {
            if (rolling) return;
            Audio8.unlock();
            Audio8.say(word);
            refocus();
          },
        })
      : null;

    var promptEl = h("p", { class: "q-prompt", text: "Napisz tę liczbę po niemiecku:" });
    var input = h("input", {
      class: "word-input word-font" + (pencil ? " pencil" : ""),
      type: "text",
      lang: "de",
      autocomplete: "off",
      autocorrect: "off",
      autocapitalize: "none",
      spellcheck: "false",
      enterkeyhint: "go",
      maxlength: "24",
      placeholder: pencil ? "pisz tu rysikiem ✏" : "wpisz słowo",
      "aria-label": "Liczba po niemiecku",
    });

    function refocus() {
      if (!pencil && !input.disabled) {
        try {
          input.focus();
        } catch (e) {}
      }
    }
    function insertText(s) {
      if (input.disabled) return;
      var v = input.value;
      var a = v.length;
      var b = v.length;
      if (document.activeElement === input && input.selectionStart != null) {
        a = input.selectionStart;
        b = input.selectionEnd;
      }
      input.value = v.slice(0, a) + s + v.slice(b);
      var pos = a + s.length;
      refocus();
      try {
        if (document.activeElement === input) input.setSelectionRange(pos, pos);
      } catch (e) {}
      saveDraft();
    }
    function backspace() {
      if (input.disabled) return;
      var v = input.value;
      var a = v.length;
      var b = v.length;
      if (document.activeElement === input && input.selectionStart != null) {
        a = input.selectionStart;
        b = input.selectionEnd;
      }
      if (a === b && a > 0) a--;
      input.value = v.slice(0, a) + v.slice(b);
      refocus();
      try {
        if (document.activeElement === input) input.setSelectionRange(a, a);
      } catch (e) {}
      saveDraft();
    }

    var keyRow = h(
      "div",
      { class: "key-row" },
      ["ä", "ö", "ü"].map(function (ch) {
        return h("button", {
          class: "key word-font",
          text: ch,
          onmousedown: prevent,
          onclick: function () {
            Audio8.unlock();
            insertText(ch);
          },
        });
      }),
      h("button", {
        class: "key key-del",
        text: "⌫",
        "aria-label": "Usuń literę",
        onmousedown: prevent,
        onclick: backspace,
      })
    );

    var hintBtn = h("button", {
      class: "btn btn-ghost btn-hint",
      text: "💡 PODPOWIEDŹ",
      onmousedown: prevent,
      onclick: useHint,
    });
    var checkBtn = h("button", {
      class: "btn btn-big btn-check",
      text: "SPRAWDŹ ▶",
      onmousedown: prevent,
      onclick: submit,
    });
    var hintBox = h("div", { class: "hint-box hidden" });
    var note = h("p", { class: "q-note" });
    var fb = h("div", { class: "feedback" });
    var legend = h("p", {
      class: "q-legend",
      text:
        "Dobrze: " +
        signed(STEPS.first) +
        " · za 2. razem: " +
        signed(STEPS.second) +
        " · z podpowiedzią: " +
        signed(STEPS.hint) +
        " · błąd: " +
        signed(STEPS.wrong),
    });

    var left = h(
      "div",
      { class: "q-left" },
      h("div", { class: "num-row" }, num, sayBtn),
      promptEl,
      input,
      keyRow,
      note,
      h("div", { class: "q-actions" }, hintBtn, checkBtn),
      hintBox,
      legend
    );
    var right = h("div", { class: "q-right" }, fb);
    var qMain = h("div", { class: "q-main" }, left, right);
    screen.appendChild(h("div", { class: "view view-q" }, head, qMain));
    updateMini();
    // dwie kolumny (w poziomie) tylko, gdy jest co pokazać po prawej
    function syncFb() {
      qMain.classList.toggle("has-fb", fb.childNodes.length > 0);
    }

    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") {
        e.preventDefault();
        submit();
      }
    });
    input.addEventListener("input", saveDraft);
    // niewysłany wpis przeżywa odświeżenie strony
    if (q.draft && q.phase !== "done") input.value = q.draft;
    function saveDraft() {
      showNote("");
      updateTiles();
      if (q.phase === "done") return;
      q.draft = input.value;
      saveGame();
    }

    function showNote(t, bad) {
      note.textContent = t || "";
      note.className = "q-note" + (bad ? " bad" : "");
    }

    /* --- podpowiedź (żarówka) --- */
    var tiles = [];
    function updateTiles() {
      if (!tiles.length) return;
      var counts = {};
      canon(input.value, word)
        .split("")
        .forEach(function (ch) {
          counts[ch] = (counts[ch] || 0) + 1;
        });
      tiles.forEach(function (t) {
        if (counts[t.ch] > 0) {
          counts[t.ch]--;
          t.el.classList.add("used");
        } else t.el.classList.remove("used");
      });
    }
    function renderHint() {
      hintBox.innerHTML = "";
      tiles = [];
      var show = q.phase === "answer" && q.hinted > 0;
      hintBox.classList.toggle("hidden", !show);
      hintBtn.style.display = q.phase === "answer" && q.hinted < 2 ? "" : "none";
      hintBtn.textContent = q.hinted ? "💡 WIĘCEJ" : "💡 PODPOWIEDŹ";
      if (!show) return;
      var pattern = word.charAt(0) + word.slice(1).replace(/./g, " _");
      hintBox.appendChild(
        h(
          "p",
          { class: "hint-line" },
          h("span", { class: "word-font hint-pattern", text: pattern }),
          h("span", {
            class: "hint-len",
            text: "  (" + word.length + " " + plural(word.length, "litera", "litery", "liter") + ")",
          })
        )
      );
      if (q.hinted >= 2) {
        hintBox.appendChild(h("p", { class: "hint-sub", text: "Ułóż z literek (dotknij):" }));
        var row = h("div", { class: "tiles" });
        shuffled(word).forEach(function (ch) {
          var t = h("button", {
            class: "tile word-font",
            text: ch,
            onmousedown: prevent,
            onclick: function () {
              Audio8.unlock();
              if (t.classList.contains("used")) return;
              Audio8.blip();
              insertText(ch);
            },
          });
          tiles.push({ ch: ch, el: t });
          row.appendChild(t);
        });
        hintBox.appendChild(row);
        updateTiles();
      }
      hintBox.appendChild(
        h("p", { class: "hint-cost", text: "Z podpowiedzią: " + signed(STEPS.hint) })
      );
    }
    function useHint() {
      if (rolling || q.phase !== "answer") return;
      Audio8.unlock();
      Audio8.blip();
      q.hinted = Math.min(2, (q.hinted || 0) + 1);
      saveGame();
      renderHint();
      refocus();
    }

    /* --- informacja zwrotna --- */
    function fbRetry() {
      var ops = align(q.lastWrong || "", word);
      var msgs = hintsFor(item, q.lastWrong || "");
      fb.innerHTML = "";
      appendChild(fb, [
        h("div", { class: "fb-title bad", text: "NIE TAK!  " + signed(STEPS.wrong) }),
        h("p", { class: "fb-label", text: "Twoja odpowiedź:" }),
        lettersRow(ops, "user"),
        h("p", {
          class: "fb-legend",
          text: "zielone = dobrze · czerwone = źle · _ = brakuje litery",
        }),
        msgs.length
          ? h(
              "ul",
              { class: "fb-hints" },
              msgs.map(function (m) {
                return h("li", { text: "💡 " + m });
              })
            )
          : null,
        h("p", {
          class: "fb-try",
          text: "Spróbuj jeszcze raz! Dobrze = " + signed(STEPS.second),
        }),
      ]);
      syncFb();
    }
    function fbCopy() {
      var ops = align(q.lastWrong || "", word);
      fb.innerHTML = "";
      appendChild(fb, [
        h("div", { class: "fb-title bad", text: "NIE TAK!  " + signed(STEPS.wrong) }),
        h("p", { class: "fb-label", text: "Twoja odpowiedź:" }),
        lettersRow(ops, "user"),
        h("p", { class: "fb-label", text: "Poprawnie:" }),
        lettersRow(ops, "correct", true),
        item.tip ? h("p", { class: "fb-tip", text: "💡 " + item.tip }) : null,
        h("p", { class: "fb-try", text: "Przepisz poprawne słowo, żeby je zapamiętać ✍" }),
      ]);
      promptEl.textContent = "Przepisz poprawnie:";
      checkBtn.textContent = "GOTOWE ▶";
      renderHint();
      syncFb();
    }
    function fbDone() {
      input.disabled = true;
      try {
        input.blur();
      } catch (e) {}
      keyRow.style.display = "none";
      checkBtn.style.display = "none";
      promptEl.style.display = "none";
      showNote("");
      renderHint();
      var r = q.result || {};
      var net = p.pos - q.startPos;
      var next = h("button", {
        class: "btn btn-big blink",
        text: "DALEJ ▶",
        onclick: function () {
          Audio8.unlock();
          Audio8.blip();
          finishTurn();
        },
      });
      fb.innerHTML = "";
      appendChild(fb, [
        r.kind === "ok"
          ? h("div", {
              class: "fb-title good pop",
              text: (r.gain >= STEPS.first ? "SUPER!  " : "DOBRZE!  ") + signed(r.gain),
            })
          : h("div", { class: "fb-title good", text: "BRAWO! ZAPAMIĘTAJ:" }),
        h("p", { class: "fb-label", text: q.n + " =" }),
        wordTiles(word, true),
        r.viaE
          ? h("p", { class: "fb-tip", text: "Tak też można! Ale z kropkami: " + word })
          : null,
        r.apart
          ? h("p", { class: "fb-tip", text: "Piszemy RAZEM, bez spacji: " + word })
          : null,
        h("p", {
          class: "fb-net " + (net > 0 ? "good" : net < 0 ? "bad" : ""),
          text: "W tej turze: " + (net === 0 ? "bez zmian" : signed(net) + " " + plural(net, "pole", "pola", "pól")),
        }),
        next,
      ]);
      syncFb();
      primaryAction = finishTurn;
      later(function () {
        try {
          next.scrollIntoView({ block: "nearest", behavior: "smooth" });
        } catch (e) {}
      }, 80);
    }

    function move(d) {
      var before = p.pos;
      p.pos = clamp(p.pos + d, 0, SIZE);
      if (p.pos !== before) {
        flyDelta(p.pos - before);
        q.lastMove = p.pos - before; // drabina liczy się po ruchu DO PRZODU
      }
      updateMini();
    }

    /* --- sprawdzenie --- */
    function submit() {
      Audio8.unlock();
      if (rolling || q.phase === "done") return;
      var raw = input.value;
      var c = canon(raw, word);
      q.draft = ""; // każda gałąź niżej czyści pole albo kończy pytanie
      if (!c) {
        restartAnim(input, "shake");
        showNote("Najpierw napisz słowo :)");
        refocus();
        return;
      }
      if (!/[a-zäöüß]/.test(c)) {
        restartAnim(input, "shake");
        showNote("Napisz liczbę SŁOWEM po niemiecku, nie cyfrą :)", true);
        input.value = "";
        saveGame();
        refocus();
        return;
      }

      // przepisywanie po 2 błędach (bez kar)
      if (q.phase === "copy") {
        if (c === word) {
          q.phase = "done";
          q.result = { kind: "copied" };
          saveGame();
          Audio8.success();
          autoSay(word);
          fbDone();
        } else {
          Audio8.error();
          restartAnim(input, "shake");
          showNote("Spójrz na słowo i przepisz je litera po literze.", true);
          input.value = "";
          saveGame();
          refocus();
        }
        return;
      }

      // odpowiedź
      if (c === word) {
        var gain =
          q.tries === 0 && !q.hinted ? STEPS.first : q.tries === 0 ? STEPS.hint : STEPS.second;
        if (q.tries === 0 && !q.hinted) bump(p.name, q.n, "ok");
        move(gain);
        var flat = clean(raw);
        q.phase = "done";
        q.result = {
          kind: "ok",
          gain: gain,
          apart: /[\s\-]/.test(flat),
          viaE: /[üöä]/.test(word) && !/[üöä]/.test(flat),
        };
        saveGame();
        Audio8.success();
        autoSay(word);
        fbDone();
        return;
      }

      // błąd
      q.tries++;
      q.lastWrong = c;
      bump(p.name, q.n, "err");
      p.errs[q.n] = (p.errs[q.n] || 0) + 1;
      move(STEPS.wrong);
      Audio8.error();
      restartAnim(input, "shake");
      input.value = "";
      if (q.tries >= 2) {
        q.phase = "copy";
        saveGame();
        autoSay(word);
        fbCopy();
      } else {
        saveGame();
        fbRetry();
      }
      updateTiles();
      refocus();
    }

    /* --- stan początkowy (też po odświeżeniu strony) --- */
    if (q.phase === "answer") {
      if (q.tries > 0 && q.lastWrong != null) fbRetry();
      renderHint();
    } else if (q.phase === "copy") fbCopy();
    else fbDone();

    // focus synchronicznie (w geście) => iPad pokaże klawiaturę
    if (fromGesture && q.phase !== "done") refocus();

    /* --- animacja losowania --- */
    if (rolling) {
      num.classList.add("rolling");
      var t0 = Date.now();
      var dur = 900;
      (function spin() {
        if (tok !== viewToken) return;
        var el = Date.now() - t0;
        if (el >= dur) {
          rolling = false;
          num.classList.remove("rolling");
          num.textContent = String(q.n);
          restartAnim(num, "pop");
          Audio8.blip();
          return;
        }
        var r;
        do {
          r = NUMS[Math.floor(Math.random() * NUMS.length)].n;
        } while (r === q.n);
        num.textContent = String(r);
        Audio8.tick();
        setTimeout(spin, 50 + el / 12);
      })();
    }
  }

  /* ---------- koniec tury ---------- */
  function finishTurn() {
    if (!game || !game.q || game.q.phase !== "done") return;
    var idx = game.turn;
    var p = game.players[idx];
    var q = game.q;
    var from = q.startPos;
    var to = p.pos;
    var ladderTo = null;
    // drabina: tura kończy się krokiem do przodu na dół drabiny
    // (np. 6 -> błąd 5 -> dobrze 6 = wspinaczka; cofnięcie na 6 = nie)
    if (q.lastMove > 0 && to < SIZE && LADDERS[to] != null) {
      ladderTo = clamp(LADDERS[to], 0, SIZE);
      p.pos = ladderTo;
    }
    p.lastN = q.n;
    p.turns = (p.turns || 0) + 1;
    var anim = { idx: idx, from: from, to: to, ladderTo: ladderTo, n: q.n };
    game.q = null;
    game.last = anim;
    if (p.pos >= SIZE) {
      p.pos = SIZE;
      game.winner = idx;
      saveRecord();
    } else game.turn = (idx + 1) % game.players.length;
    saveGame();
    renderBoard({ anim: anim });
  }

  // Rekord gry solo (najmniej rund) — zapis od razu przy wygranej, żeby nie
  // zginął, gdy ktoś wyjdzie z planszy w trakcie animacji.
  function saveRecord() {
    if (!game || game.winner == null || game.players.length !== 1 || game.recorded) return;
    var w = game.players[game.winner];
    var rec = loadJSON(CFG.recordKey, null);
    game.newRecord = !rec || !rec.turns || w.turns < rec.turns;
    if (game.newRecord) saveJSON(CFG.recordKey, { turns: w.turns, name: w.name });
    game.recorded = true;
  }

  /* ---------- ściąga 0–20 ---------- */
  function renderCheat(back) {
    clearScreen();
    var grid = h("div", { class: "cheat-grid" });
    NUMS.forEach(function (x) {
      var card = h(
        "button",
        {
          class: "cheat-card",
          onclick: function () {
            Audio8.unlock();
            Audio8.say(x.word);
            restartAnim(card, "pop");
          },
        },
        h("span", { class: "cheat-num", text: String(x.n) }),
        h("span", { class: "cheat-word word-font", text: x.word })
      );
      grid.appendChild(card);
    });
    function goBack() {
      Audio8.blip();
      back();
    }
    screen.appendChild(
      h(
        "div",
        { class: "view view-cheat" },
        topBar(),
        h("h2", { class: "stage-title", text: "ŚCIĄGA 0–20" }),
        Audio8.canSpeak()
          ? h("p", { class: "small-dim", text: "Dotknij liczbę, żeby usłyszeć 🔊" })
          : null,
        grid,
        h(
          "div",
          { class: "dialog rules" },
          h("p", {}, "13–19 = liczba + ", h("b", { class: "word-font", text: "zehn" }), "  (drei + zehn = dreizehn)"),
          h("p", {}, "⚠ 16 = ", h("b", { class: "word-font", text: "sechzehn" }), " — bez S!"),
          h("p", {}, "⚠ 17 = ", h("b", { class: "word-font", text: "siebzehn" }), " — bez EN!"),
          h("p", { text: "[aj] = EI · [oj] = EU · [c] = Z · długie [i] = IE" }),
          h("p", {}, "Kropki: ", h("b", { class: "word-font", text: "fünf, zwölf, fünfzehn" }))
        ),
        h("button", { class: "btn btn-big", text: "◀ WRÓĆ", onclick: goBack })
      )
    );
    primaryAction = goBack;
  }

  /* ---------- meta ---------- */
  function hardChips(errs) {
    var list = Object.keys(errs || {})
      .filter(function (n) {
        return errs[n] > 0 && BY_N[n];
      })
      .sort(function (a, b) {
        return errs[b] - errs[a] || a - b;
      })
      .slice(0, 6);
    if (!list.length) return h("p", { class: "good small", text: "Bez ani jednego błędu! ★" });
    return h(
      "div",
      { class: "chips" },
      list.map(function (n) {
        return h(
          "span",
          { class: "chip" },
          h("b", { text: n + " " }),
          h("span", { class: "word-font", text: BY_N[n].word }),
          errs[n] > 1 ? " ×" + errs[n] : ""
        );
      })
    );
  }

  function renderVictory() {
    clearScreen();
    var w = game.players[game.winner];
    var solo = game.players.length === 1;

    var confetti = h("div", { class: "confetti" });
    var colors = ["#e43b44", "#ffd23f", "#4a7fe0", "#3fa34d", "#c25bd6", "#59d5e0"];
    for (var i = 0; i < 28; i++) {
      var pc = h("span", { class: "conf" });
      pc.style.left = ((i * 100) / 28).toFixed(2) + "%";
      pc.style.animationDelay = ((i % 10) * 0.22).toFixed(2) + "s";
      pc.style.background = colors[i % colors.length];
      confetti.appendChild(pc);
    }

    var kids = [
      confetti,
      h("h2", { class: "win-title", text: solo ? "META!" : "WYGRYWA", onclick: onTitleTap }),
      h("h1", { class: "win-name", text: w.name + "!" }),
      h("div", { class: "win-gift float" }, Sprites.el("cup", 9)),
    ];

    if (solo) {
      if (!game.recorded) {
        saveRecord();
        saveGame();
      }
      var best = loadJSON(CFG.recordKey, null);
      kids.push(
        h("p", {
          class: "win-msg",
          text: "Udało się w " + w.turns + " " + plural(w.turns, "rundzie", "rundach", "rundach") + "!",
        })
      );
      kids.push(
        h("p", {
          class: game.newRecord ? "win-rec blink" : "win-rec",
          text: game.newRecord
            ? "★ NOWY REKORD! ★"
            : best
            ? "Rekord: " + best.turns + " rund (" + best.name + ")"
            : "",
        })
      );
      kids.push(h("p", { class: "fb-label", text: "Do powtórki:" }), hardChips(w.errs));
    } else {
      var rank = game.players
        .map(function (p, idx) {
          return { p: p, idx: idx };
        })
        .sort(function (a, b) {
          if (a.idx === game.winner) return -1;
          if (b.idx === game.winner) return 1;
          return b.p.pos - a.p.pos;
        });
      var list = h("div", { class: "rank" });
      rank.forEach(function (r, place) {
        list.appendChild(
          h(
            "div",
            { class: "rank-row" },
            h("span", { class: "rank-place", text: place + 1 + "." }),
            pawnEl(r.p, 3),
            h("span", { class: "rank-name", text: r.p.name }),
            h("span", { class: "rank-pos", text: "pole " + r.p.pos })
          )
        );
        if (r.p.turns > 0)
          list.appendChild(
            h(
              "div",
              { class: "rank-hard" },
              h("span", { class: "fb-label", text: "Do powtórki:" }),
              hardChips(r.p.errs)
            )
          );
      });
      kids.push(list);
    }

    kids.push(
      h(
        "div",
        { class: "menu-btns" },
        h("button", {
          class: "btn btn-big",
          text: "ZAGRAJ JESZCZE RAZ ▶",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            newGame(
              game.players.map(function (p) {
                return p.name;
              })
            );
          },
        }),
        h("button", {
          class: "btn btn-ghost",
          text: "☰ MENU",
          onclick: function () {
            Audio8.blip();
            renderTitle();
          },
        })
      )
    );
    screen.appendChild(h("div", { class: "view view-victory narrow" }, kids));
    Audio8.victory();
  }

  /* ---------- nakładki ---------- */
  function overlay(kind, title, msg, buttons) {
    var existing = app().querySelectorAll(".overlay");
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    var ov = h(
      "div",
      { class: "overlay overlay-" + kind },
      h(
        "div",
        { class: "overlay-box" },
        h("h3", { class: "overlay-title", text: title }),
        msg ? h("p", { class: "overlay-msg", text: msg }) : null,
        h("div", { class: "row" }, buttons)
      )
    );
    app().appendChild(ov);
    return ov;
  }
  function confirmBox(title, msg, yesText, onYes) {
    var ov = overlay("info", title, msg, [
      h("button", {
        class: "btn",
        text: yesText,
        onclick: function () {
          ov.remove();
          onYes();
        },
      }),
      h("button", {
        class: "btn btn-ghost",
        text: "NIE",
        onclick: function () {
          ov.remove();
        },
      }),
    ]);
  }

  /* ---------- panel organizatora ---------- */
  function organizer() {
    var stats = allStats();
    var names = Object.keys(stats);
    var box = h("div", { class: "org-tokens" });
    if (!names.length) box.appendChild(h("div", { class: "tok", text: "Brak statystyk." }));
    names.forEach(function (nm) {
      var s = stats[nm] || {};
      var hard = Object.keys(s)
        .filter(function (n) {
          return s[n] && s[n].err > 0 && BY_N[n];
        })
        .sort(function (a, b) {
          return s[b].err - s[a].err;
        })
        .map(function (n) {
          return n + " " + BY_N[n].word + " (✖" + s[n].err + " ✔" + (s[n].ok || 0) + ")";
        });
      box.appendChild(
        h("div", { class: "tok", text: nm + ": " + (hard.length ? hard.join(", ") : "bez błędów") })
      );
    });

    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box org" },
        h("h3", { class: "overlay-title", text: "PANEL ORGANIZATORA" }),
        h("p", { class: "overlay-msg", text: "Trudne liczby (błędy / dobrze za 1. razem):" }),
        box,
        h("button", {
          class: "btn btn-ghost",
          text: "RESET GRY",
          onclick: function () {
            game = null;
            removeKey(CFG.storageKey);
            ov.remove();
            renderTitle();
          },
        }),
        h("button", {
          class: "btn btn-ghost",
          text: "WYCZYŚĆ STATYSTYKI",
          onclick: function () {
            removeKey(CFG.statsKey);
            removeKey(CFG.recordKey);
            ov.remove();
            organizer();
          },
        }),
        h("button", {
          class: "btn",
          text: "ZAMKNIJ",
          onclick: function () {
            ov.remove();
          },
        })
      )
    );
    app().appendChild(ov);
  }

  /* ---------- #org w adresie ---------- */
  function handleHash() {
    if ((location.hash || "").replace("#", "") === "org") {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (e) {
        location.hash = "";
      }
      renderTitle();
      organizer();
      return true;
    }
    return false;
  }

  /* ---------- start ---------- */
  function boot() {
    screen = document.getElementById("screen");
    var s = loadJSON(CFG.settingsKey, {});
    settings = s && typeof s === "object" ? s : {};
    game = loadGame();

    var unlockOnce = function () {
      Audio8.unlock();
      window.removeEventListener("pointerdown", unlockOnce);
    };
    window.addEventListener("pointerdown", unlockOnce);
    window.addEventListener("hashchange", handleHash);
    var rT = null;
    window.addEventListener("resize", function () {
      clearTimeout(rT);
      rT = setTimeout(function () {
        if (onResize) onResize();
      }, 200);
    });

    // Enter na fizycznej klawiaturze = główny przycisk widoku
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Enter" || !primaryAction) return;
      if (app().querySelector(".overlay")) return;
      var t = e.target;
      var tag = t && t.tagName;
      if (tag === "INPUT" || tag === "BUTTON" || tag === "TEXTAREA" || tag === "SUMMARY")
        return;
      e.preventDefault();
      primaryAction();
    });

    if (!handleHash()) renderTitle();
    bootSW();
  }

  function bootSW() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  }

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
