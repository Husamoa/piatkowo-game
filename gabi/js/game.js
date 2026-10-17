/*
 * GRA URODZINOWA GABI — logika i widoki.
 *
 * Mechanika (patrz też config.js):
 *   SKAN kodu  ->  ZADANIE  ->  wpis odpowiedzi  ->  (poprawnie)
 *   ->  MAPA z pinezką + podpowiedź + guzik "ZESKANUJ KOD"  ->  SKAN kolejnej koperty ...
 *
 * Postęp w localStorage: { stage: 0..N-1, phase: "solve" | "map" }.
 *   - phase "solve": pokazujemy ZADANIE i pole odpowiedzi.
 *   - phase "map":   zadanie rozwiązane; pokazujemy mapę + skaner do kolejnej koperty.
 * Po zeskanowaniu kodu koperty na ekranie mapy: przechodzimy do kolejnego ZADANIA
 * (a przy ostatnim etapie — do ekranu urodzinowego).
 *
 * Wejście do gry tylko przez kod START (jak w /ania).
 */
(function () {
  var CFG = window.GAME_CONFIG;
  var STAGES = CFG.stages;
  var N = STAGES.length;
  var screen;

  /* ---------- postęp ---------- */
  function loadState() {
    var raw = localStorage.getItem(CFG.storageKey);
    var st = { stage: 0, phase: "intro" };
    if (raw) {
      try {
        var p = JSON.parse(raw);
        if (p && typeof p.stage === "number") st.stage = p.stage;
        if (p && (p.phase === "intro" || p.phase === "solve" || p.phase === "map" || p.phase === "done"))
          st.phase = p.phase;
      } catch (_) {}
    }
    if (st.stage < 0) st.stage = 0;
    if (st.stage >= N) {
      st.stage = N;
      st.phase = "done";
    }
    return st;
  }
  function saveState(st) {
    localStorage.setItem(CFG.storageKey, JSON.stringify(st));
  }
  function isDone(st) {
    return st.phase === "done" || st.stage >= N;
  }

  /* ---------- statystyki (per gra; zerowane przy RESECIE) ---------- */
  var STATS_KEY = CFG.statsKey || "gabi_stats_v1";
  function defaultStats() {
    return { wrong: 0, hints: 0, maps: 0, scans: 0, startTime: null, endTime: null, wrongByStage: {}, answers: {}, rawAnswers: {} };
  }
  function loadStats() {
    try {
      var s = JSON.parse(localStorage.getItem(STATS_KEY));
      if (s && typeof s === "object") {
        var d = defaultStats();
        for (var k in d) if (s[k] == null) s[k] = d[k];
        if (typeof s.wrongByStage !== "object" || !s.wrongByStage) s.wrongByStage = {};
        if (typeof s.answers !== "object" || !s.answers) s.answers = {};
        if (typeof s.rawAnswers !== "object" || !s.rawAnswers) s.rawAnswers = {};
        return s;
      }
    } catch (_) {}
    return defaultStats();
  }
  function saveStats(s) {
    try {
      localStorage.setItem(STATS_KEY, JSON.stringify(s));
    } catch (_) {}
  }
  function resetStats() {
    saveStats(defaultStats());
  }
  function markStart() {
    var s = loadStats();
    if (!s.startTime) {
      s.startTime = Date.now();
      saveStats(s);
    }
  }
  function markEnd() {
    var s = loadStats();
    if (!s.endTime) {
      s.endTime = Date.now();
      saveStats(s);
    }
  }
  function bumpStat(key) {
    var s = loadStats();
    s[key] = (s[key] || 0) + 1;
    saveStats(s);
  }
  function bumpWrong(stageId) {
    var s = loadStats();
    s.wrong = (s.wrong || 0) + 1;
    s.wrongByStage[stageId] = (s.wrongByStage[stageId] || 0) + 1;
    saveStats(s);
  }
  // czytelny zapis odpowiedzi gracza (do panelu organizatora)
  function answerToString(stage, fields) {
    if (stage.check && stage.check.type === "houses") {
      return stage.check.houses
        .map(function (house, i) {
          return house.label + ": " + ((fields["house" + i] || "").trim() || "—");
        })
        .join("\n");
    }
    return (fields.main || "").trim();
  }
  function saveAnswer(stage, fields) {
    var s = loadStats();
    s.answers[stage.id] = answerToString(stage, fields);
    // surowe wartości pól — do przywrócenia w inpucie po powrocie do zadania
    var copy = {};
    for (var k in fields) copy[k] = fields[k];
    s.rawAnswers[stage.id] = copy;
    saveStats(s);
  }
  function savedFields(stageId) {
    return (loadStats().rawAnswers || {})[stageId] || {};
  }

  /* ---------- "frontowe drzwi" ---------- */
  function hasEntered() {
    return localStorage.getItem(CFG.enteredKey) === "1";
  }
  function markEntered() {
    localStorage.setItem(CFG.enteredKey, "1");
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
      else if (val != null) e.setAttribute(k, val);
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
    screen.innerHTML = "";
  }
  function app() {
    return document.getElementById("app");
  }

  /* ---------- iOS: zapasowy guzik Apple Maps ---------- */
  function isIOS() {
    var ua = navigator.userAgent || "";
    return (
      /iPad|iPhone|iPod/.test(ua) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1)
    );
  }
  // Na iOS dodatkowy guzik „Apple Maps" (gdyby link Google nie zadziałał).
  function appleMapsBtn(coords, label) {
    if (!coords || !isIOS()) return null;
    var url =
      "https://maps.apple.com/?ll=" +
      encodeURIComponent(coords) +
      "&q=" +
      encodeURIComponent(label || "Cel");
    return h("a", {
      class: "btn btn-sm map-link apple-link",
      href: url,
      target: "_blank",
      rel: "noopener noreferrer",
      text: "🧭 OTWÓRZ W APPLE MAPS",
      onclick: function () {
        Audio8.unlock();
        Audio8.blip();
        bumpStat("maps");
      },
    });
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

  /* ---------- panel organizatora (10x tap w tytuł) ---------- */
  var tapCount = 0,
    tapTimer = null;
  function onTitleTap() {
    tapCount++;
    clearTimeout(tapTimer);
    tapTimer = setTimeout(function () {
      tapCount = 0;
    }, 1200);
    if (tapCount >= 10) {
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

  function progressDots(current) {
    var wrap = h("div", { class: "dots" });
    for (var i = 0; i < N; i++) {
      var cls = "dot";
      if (i < current) cls += " done";
      else if (i === current) cls += " cur";
      wrap.appendChild(h("span", { class: cls }));
    }
    return wrap;
  }

  /* ================= NORMALIZACJA / WERYFIKACJA ================= */
  function norm(s) {
    s = (s || "").toLowerCase();
    return s.replace(/[ąćęłńóśźż]/g, function (c) {
      return { ą: "a", ć: "c", ę: "e", ł: "l", ń: "n", ó: "o", ś: "s", ź: "z", ż: "z" }[c];
    });
  }
  // kod: zostaw tylko litery i cyfry
  function normCode(s) {
    return norm(s).replace(/[^a-z0-9]/g, "");
  }
  // lista tokenów-słów
  function words(s) {
    var m = norm(s).match(/[a-z0-9]+/g);
    return m || [];
  }
  function anyVariantIn(text, variants) {
    for (var i = 0; i < variants.length; i++) {
      if (text.indexOf(variants[i]) >= 0) return true;
    }
    return false;
  }

  // Zwraca { ok: bool, msg: string } na podstawie stage.check i zebranych pól.
  function verify(stage, fields) {
    var c = stage.check;
    if (!c) return { ok: true };

    if (c.type === "code") {
      var got = normCode(fields.main || "");
      if (!got) return { ok: false, msg: "Wpiszcie kod." };
      for (var i = 0; i < c.accept.length; i++) {
        if (normCode(c.accept[i]) === got) return { ok: true };
      }
      return { ok: false, msg: "To nie ten kod. Sprawdźcie jeszcze raz!" };
    }

    if (c.type === "contains") {
      var t = norm(fields.main || "");
      if (!t.trim()) return { ok: false, msg: "Wpiszcie odpowiedź." };
      for (var w = 0; w < c.words.length; w++) {
        if (t.indexOf(norm(c.words[w])) >= 0) return { ok: true };
      }
      return { ok: false, msg: "Jeszcze nie to. Pomyślcie jeszcze raz!" };
    }

    if (c.type === "sequence") {
      var toks = words(fields.main || "");
      if (toks.length === 0) return { ok: false, msg: "Wpiszcie imiona po kolei." };
      if (toks.length !== c.names.length)
        return {
          ok: false,
          msg: "Potrzeba " + c.names.length + " imion w kolejności (wpisaliście " + toks.length + ").",
        };
      for (var p = 0; p < c.names.length; p++) {
        var variants = c.names[p].map(norm);
        if (variants.indexOf(toks[p]) < 0)
          return { ok: false, msg: "Kolejność jeszcze się nie zgadza. Sprawdźcie warunki!" };
      }
      return { ok: true };
    }

    if (c.type === "allWords") {
      var txt = norm(fields.main || "");
      if (txt.replace(/\s/g, "").length < 10)
        return { ok: false, msg: "Napiszcie dłuższy wierszyk z podanymi słowami." };
      var missing = 0;
      for (var s = 0; s < c.stems.length; s++) {
        if (txt.indexOf(norm(c.stems[s])) < 0) missing++;
      }
      if (missing === 0) return { ok: true };
      return {
        ok: false,
        msg: "Brakuje jeszcze " + missing + " z podanych słów. Użyjcie wszystkich 8!",
      };
    }

    if (c.type === "houses") {
      for (var hH = 0; hH < c.houses.length; hH++) {
        var house = c.houses[hH];
        var val = norm(fields["house" + hH] || "");
        for (var g = 0; g < house.need.length; g++) {
          var grp = house.need[g].map(norm);
          if (!anyVariantIn(val, grp))
            return { ok: false, msg: house.label + " jeszcze się nie zgadza. Sprawdźcie warunki!" };
        }
      }
      return { ok: true };
    }

    return { ok: true };
  }

  /* ================= WIDOKI ================= */
  function renderBlocked() {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-blocked" },
        h("div", { class: "stage-icon" }, Sprites.el("letter", 7)),
        h("h2", { class: "blocked-title", text: "STOP" }),
        h("p", {
          class: "blocked-msg",
          text: "Aby zagrać, zeskanuj kod START.",
        })
      )
    );
  }

  function renderTitle() {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-title" },
        topBar(),
        h("div", { class: "title-art float" }, Sprites.el("hero", 9)),
        h("h1", { class: "game-title", text: CFG.title }),
        h("p", { class: "game-sub", text: CFG.subtitle }),
        h("p", { class: "game-for", text: CFG.birthday + " · " + CFG.hero }),
        h("button", {
          class: "btn btn-big blink",
          text: "START ▶",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            renderCurrent();
          },
        })
      )
    );
  }

  // Wyciąga token z odczytanego kodu QR (kod to link .../#s=TOKEN).
  function decodeToken(text) {
    try {
      return decodeURIComponent(text);
    } catch (_) {
      return text;
    }
  }
  function tokenFromScanned(text) {
    text = (text || "").trim();
    var i = text.indexOf("#s=");
    if (i >= 0) return decodeToken(text.slice(i + 3));
    i = text.indexOf("s=");
    if (i >= 0 && /^https?:\/\//.test(text)) return decodeToken(text.slice(i + 2));
    return text.toUpperCase();
  }

  /* ---------- EKRAN ZADANIA ---------- */
  function renderSolve(st) {
    clearScreen();
    markStart(); // pierwsze wejście w zadanie = początek liczenia czasu
    var stage = STAGES[st.stage];
    var kids = [topBar(), progressDots(st.stage)];

    kids.push(
      h("div", { class: "stage-label", text: stage.label + " · ETAP " + stage.id + "/" + N }),
      h("div", { class: "stage-icon" }, Sprites.el(stage.icon, 6)),
      h("div", { class: "dialog" }, h("p", { class: "riddle-text", text: stage.task }))
    );

    // podpowiedź do ROZWIĄZANIA (opcjonalna)
    if (stage.hintSolve) {
      var hintBox = h("div", { class: "hint hidden" }, h("p", { class: "hint-text", text: stage.hintSolve }));
      var hintBtn = h("button", {
        class: "btn btn-sm",
        text: "PODPOWIEDŹ",
        onclick: function () {
          Audio8.unlock();
          Audio8.blip();
          hintBox.classList.toggle("hidden");
          if (!hintBox.classList.contains("hidden")) bumpStat("hints"); // policz odsłonięcie
          hintBtn.textContent = hintBox.classList.contains("hidden") ? "PODPOWIEDŹ" : "UKRYJ PODPOWIEDŹ";
        },
      });
      kids.push(hintBtn, hintBox);
    }

    // pola odpowiedzi (z przywróceniem ostatniej odpowiedzi po powrocie do zadania)
    var saved = savedFields(stage.id);
    var inputs = {};
    var form = h("div", { class: "answer-form" });
    if (stage.check && stage.check.type === "houses") {
      stage.check.houses.forEach(function (house, idx) {
        var inp = h("input", {
          class: "code-input house-input",
          type: "text",
          placeholder: house.placeholder || "",
          autocapitalize: "words",
          autocomplete: "off",
          autocorrect: "off",
          spellcheck: "false",
        });
        inp.value = saved["house" + idx] || "";
        inputs["house" + idx] = inp;
        form.appendChild(h("label", { class: "house-row" }, h("span", { class: "house-lbl", text: house.label }), inp));
      });
    } else if (stage.multiline) {
      var ta = h("textarea", {
        class: "code-input answer-textarea",
        rows: "6",
        placeholder: stage.inputPlaceholder || "",
        autocapitalize: "sentences",
        autocomplete: "off",
        spellcheck: "false",
      });
      ta.value = saved.main || "";
      inputs.main = ta;
      form.appendChild(ta);
    } else {
      var inp = h("input", {
        class: "code-input",
        type: stage.check && stage.check.type === "code" ? "text" : "text",
        inputmode: stage.check && stage.check.type === "code" ? "numeric" : "text",
        placeholder: stage.inputPlaceholder || "",
        autocapitalize: "off",
        autocomplete: "off",
        autocorrect: "off",
        spellcheck: "false",
      });
      inp.value = saved.main || "";
      inputs.main = inp;
      form.appendChild(inp);
    }
    kids.push(form);

    function submit() {
      Audio8.unlock();
      var fields = {};
      for (var key in inputs) fields[key] = inputs[key].value;
      saveAnswer(stage, fields); // zapisz odpowiedź gracza (ostatnia próba)
      var res = verify(stage, fields);
      if (res.ok) {
        if (stage.saveAnswerAs) {
          // zapisz odpowiedź (np. wierszyk z zad. 4), by pokazać ją na końcu gry
          var sv = loadStats();
          sv[stage.saveAnswerAs] = (fields.main || "").trim();
          saveStats(sv);
        }
        Audio8.success();
        st.phase = "map";
        saveState(st);
        renderSuccess(stage);
      } else {
        bumpWrong(stage.id);
        Audio8.error();
        overlay("error", "JESZCZE NIE!", res.msg || "Spróbujcie jeszcze raz.");
      }
    }

    kids.push(
      h("button", { class: "btn btn-big", text: "SPRAWDŹ ✓", onclick: submit })
    );

    // Enter w pojedynczym polu = sprawdź
    if (inputs.main && !stage.multiline) {
      inputs.main.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          submit();
        }
      });
    }

    screen.appendChild(h("div", { class: "view view-riddle" }, kids));
  }

  /* ---------- EKRAN POTWIERDZENIA (po poprawnej odpowiedzi) ---------- */
  function renderSuccess(stage) {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-success" },
        h("div", { class: "burst pop" }, Sprites.el("star", 9)),
        h("h2", { class: "big-ok", text: "DOBRZE!" }),
        h("p", { class: "ok-sub", text: "Zagadka rozwiązana. Czas ruszyć dalej!" }),
        h("button", {
          class: "btn btn-big",
          text: "POKAŻ MAPĘ ▶",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            renderMap(loadState());
          },
        })
      )
    );
  }

  /* ---------- EKRAN STARTOWY: mapa do pierwszej lokalizacji ---------- */
  function renderIntro() {
    clearScreen();
    markStart(); // start liczenia czasu gry
    var intro = CFG.intro || {};
    var kids = [topBar(), progressDots(0)];

    kids.push(
      h("div", { class: "stage-label", text: "START · GDZIE IDZIEMY?" }),
      h("img", {
        class: "map-img",
        src: intro.mapImage,
        alt: "Mapa z pinezką — " + (intro.scanPlace || ""),
      })
    );

    if (intro.mapLink) {
      kids.push(
        h("a", {
          class: "btn btn-sm map-link",
          href: intro.mapLink,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "📍 OTWÓRZ W GOOGLE MAPS",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            bumpStat("maps");
          },
        })
      );
    }
    var introApple = appleMapsBtn(intro.coords, intro.scanPlace);
    if (introApple) kids.push(introApple);

    kids.push(
      h(
        "div",
        { class: "map-hint" },
        h("div", { class: "map-hint-ico" }, Sprites.el("pin", 4)),
        h("p", { class: "map-hint-text", text: intro.mapHint })
      ),
      h(
        "div",
        { class: "scan-cta" },
        Sprites.el("letter", 5),
        h("p", { class: "scan-text", text: "Znajdźcie tam kopertę i zeskanujcie kod, by odsłonić pierwsze zadanie." })
      ),
      h("button", {
        class: "btn btn-big",
        text: "ZESKANUJ KOD",
        onclick: function () {
          Audio8.unlock();
          Audio8.blip();
          QRScanner.open(
            function (text) {
              processScan(tokenFromScanned(text));
            },
            function () {
              manualEntry();
            }
          );
        },
      }),
      h("button", {
        class: "link",
        text: "Aparat nie działa? Wpisz kod ręcznie",
        onclick: function () {
          Audio8.unlock();
          manualEntry();
        },
      })
    );

    screen.appendChild(h("div", { class: "view view-map" }, kids));
  }

  /* ---------- EKRAN MAPY + SKANER ---------- */
  function renderMap(st) {
    clearScreen();
    var stage = STAGES[st.stage];
    var kids = [topBar(), progressDots(st.stage + 1)];

    kids.push(
      h("div", { class: "stage-label", text: "GDZIE TERAZ? · ETAP " + stage.id + "/" + N }),
      h("img", {
        class: "map-img",
        src: stage.mapImage,
        alt: "Mapa z pinezką — " + (stage.scanPlace || ""),
      })
    );

    // guzik otwierający lokalizację w Google Maps (oryginalny link z docx)
    if (stage.mapLink) {
      kids.push(
        h("a", {
          class: "btn btn-sm map-link",
          href: stage.mapLink,
          target: "_blank",
          rel: "noopener noreferrer",
          text: "📍 OTWÓRZ W GOOGLE MAPS",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            bumpStat("maps");
          },
        })
      );
    }
    var stageApple = appleMapsBtn(stage.coords, stage.scanPlace);
    if (stageApple) kids.push(stageApple);

    // podpowiedź (rymowanka prowadząca do koperty)
    kids.push(
      h(
        "div",
        { class: "map-hint" },
        h("div", { class: "map-hint-ico" }, Sprites.el("pin", 4)),
        h("p", { class: "map-hint-text", text: stage.mapHint })
      )
    );

    kids.push(
      h(
        "div",
        { class: "scan-cta" },
        Sprites.el("letter", 5),
        h("p", {
          class: "scan-text",
          text: stage.final
            ? "Znajdźcie nagrodę i zeskanujcie kod!"
            : "Znajdźcie kopertę w tym miejscu i zeskanujcie kod.",
        })
      ),
      h("button", {
        class: "btn btn-big",
        text: "ZESKANUJ KOD",
        onclick: function () {
          Audio8.unlock();
          Audio8.blip();
          QRScanner.open(
            function (text) {
              processScan(tokenFromScanned(text));
            },
            function () {
              manualEntry();
            }
          );
        },
      }),
      h("button", {
        class: "link",
        text: "Aparat nie działa? Wpisz kod ręcznie",
        onclick: function () {
          Audio8.unlock();
          manualEntry();
        },
      })
    );

    screen.appendChild(h("div", { class: "view view-map" }, kids));
  }

  /* ---------- EKRAN URODZINOWY ---------- */
  function renderVictory() {
    clearScreen();
    markEnd(); // zatrzymaj licznik czasu
    var confetti = h("div", { class: "confetti" });
    var colors = ["#e43b44", "#ffd23f", "#4a7fe0", "#3fa34d", "#c25bd6", "#ff6fae", "#59d5e0"];
    for (var i = 0; i < 32; i++) {
      var p = h("span", { class: "conf" });
      p.style.left = ((i * 100) / 32).toFixed(2) + "%";
      p.style.animationDelay = ((i % 10) * 0.22).toFixed(2) + "s";
      p.style.background = colors[i % colors.length];
      confetti.appendChild(p);
    }
    screen.appendChild(
      h(
        "div",
        { class: "view view-victory" },
        confetti,
        h("h2", { class: "win-title", text: "WSZYSTKIEGO", onclick: onTitleTap }),
        h("h2", { class: "win-title", text: "NAJLEPSZEGO!" }),
        h("div", { class: "win-gift float" }, Sprites.el("cake", 9)),
        h("h1", { class: "win-name", text: CFG.hero + "!" }),
        h("p", {
          class: "win-msg",
          text: "NIESPODZIANKA! 🎉\nPo rozszyfrowaniu zakodowanych wiadomości\nbędziecie wiedziały, gdzie się dalej udać.\nSto lat w dniu 13. urodzin!",
        }),
        h(
          "div",
          { class: "win-hearts" },
          Sprites.el("heart", 5),
          Sprites.el("heart", 7),
          Sprites.el("heart", 5)
        ),
        h(
          "div",
          { class: "win-actions" },
          h("button", {
            class: "btn btn-sm",
            text: "📊 STATYSTYKI",
            onclick: function () {
              Audio8.unlock();
              Audio8.blip();
              showStats();
            },
          }),
          hasSavedPoem()
            ? h("button", {
                class: "btn btn-sm",
                text: "📜 POKAŻ WIERSZYK",
                onclick: function () {
                  Audio8.unlock();
                  Audio8.blip();
                  showPoem();
                },
              })
            : null
        )
      )
    );
    Audio8.victory();
  }

  function hasSavedPoem() {
    var p = loadStats().poem;
    return !!(p && p.trim());
  }
  function showPoem() {
    var poem = (loadStats().poem || "").trim();
    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box" },
        h("h3", { class: "overlay-title", text: "WASZ WIERSZYK" }),
        h("p", { class: "poem-text", text: poem || "Brak zapisanego wierszyka." }),
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

  /* ---------- ekran statystyk ---------- */
  function pluralProba(n) {
    if (n === 1) return "próba";
    var d = n % 10,
      dd = n % 100;
    if (d >= 2 && d <= 4 && (dd < 10 || dd >= 20)) return "próby";
    return "prób";
  }
  function fmtDuration(ms) {
    if (!ms || ms < 0) return "—";
    var sec = Math.floor(ms / 1000);
    var hh = Math.floor(sec / 3600);
    var mm = Math.floor((sec % 3600) / 60);
    var ss = sec % 60;
    if (hh > 0) return hh + " h " + mm + " min";
    if (mm > 0) return mm + " min " + ss + " s";
    return ss + " s";
  }
  function showStats() {
    var s = loadStats();
    var dur = s.startTime ? (s.endTime || Date.now()) - s.startTime : 0;

    // najtrudniejsze zadanie (najwięcej błędnych prób)
    var worstId = null,
      worstN = 0;
    for (var k in s.wrongByStage) {
      if (s.wrongByStage[k] > worstN) {
        worstN = s.wrongByStage[k];
        worstId = k;
      }
    }

    var rows = [
      ["⏱️ Czas gry", fmtDuration(dur)],
      ["✉️ Zeskanowane koperty", String(s.scans || 0)],
      ["❌ Błędne odpowiedzi", String(s.wrong || 0)],
      ["💡 Użyte podpowiedzi", String(s.hints || 0)],
      ["📍 Otwarcia Google Maps", String(s.maps || 0)],
    ];

    var list = h("div", { class: "stats-list" });
    rows.forEach(function (r) {
      list.appendChild(
        h(
          "div",
          { class: "stat-row" },
          h("span", { class: "stat-lbl", text: r[0] }),
          h("span", { class: "stat-val", text: r[1] })
        )
      );
    });

    var note = worstId
      ? h("p", {
          class: "stats-note",
          text: "🤔 Najtrudniejsze: Zadanie " + worstId + " (" + worstN + " " + pluralProba(worstN) + ")",
        })
      : null;

    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box" },
        h("h3", { class: "overlay-title", text: "STATYSTYKI" }),
        list,
        note,
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

  /* ---------- nakładki ---------- */
  function overlay(kind, title, msg) {
    var existing = app().querySelectorAll(".overlay");
    for (var i = 0; i < existing.length; i++) existing[i].remove();
    var ov = h(
      "div",
      { class: "overlay overlay-" + kind },
      h(
        "div",
        { class: "overlay-box shake-" + (kind === "error" ? "on" : "off") },
        h("h3", { class: "overlay-title", text: title }),
        msg ? h("p", { class: "overlay-msg", text: msg }) : null,
        h("button", {
          class: "btn",
          text: "OK",
          onclick: function () {
            Audio8.unlock();
            Audio8.blip();
            ov.remove();
          },
        })
      )
    );
    app().appendChild(ov);
    return ov;
  }

  function manualEntry() {
    var input = h("input", {
      class: "code-input",
      type: "text",
      placeholder: "np. GB-XXXX",
      autocapitalize: "characters",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
    });
    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box" },
        h("h3", { class: "overlay-title", text: "WPISZ KOD" }),
        h("p", { class: "overlay-msg", text: "Przepisz kod spod kodu QR na kopercie." }),
        input,
        h(
          "div",
          { class: "row" },
          h("button", {
            class: "btn",
            text: "ZATWIERDŹ",
            onclick: function () {
              var val = (input.value || "").trim().toUpperCase();
              ov.remove();
              if (val) processScan(val);
            },
          }),
          h("button", {
            class: "btn btn-ghost",
            text: "ANULUJ",
            onclick: function () {
              ov.remove();
            },
          })
        )
      )
    );
    app().appendChild(ov);
    setTimeout(function () {
      input.focus();
    }, 60);
  }

  function organizer() {
    var st = loadState();
    var jumps = h("div", { class: "org-jumps" });
    jumps.appendChild(
      h("button", {
        class: "btn btn-sm btn-ghost",
        text: "Start: mapa",
        onclick: function () {
          saveState({ stage: 0, phase: "intro" });
          ov.remove();
          renderCurrent();
        },
      })
    );
    for (var i = 0; i < N; i++) {
      (function (k) {
        jumps.appendChild(
          h("button", {
            class: "btn btn-sm",
            text: "Z" + (k + 1) + " zadanie",
            onclick: function () {
              saveState({ stage: k, phase: "solve" });
              ov.remove();
              renderCurrent();
            },
          })
        );
        jumps.appendChild(
          h("button", {
            class: "btn btn-sm btn-ghost",
            text: "Z" + (k + 1) + " mapa",
            onclick: function () {
              saveState({ stage: k, phase: "map" });
              ov.remove();
              renderCurrent();
            },
          })
        );
      })(i);
    }
    jumps.appendChild(
      h("button", {
        class: "btn btn-sm",
        text: "Wygrana",
        onclick: function () {
          saveState({ stage: N, phase: "done" });
          ov.remove();
          renderCurrent();
        },
      })
    );

    var tokens = h("details", { class: "org-tokens" }, h("summary", { text: "Pokaż kody (tokeny)" }));
    tokens.appendChild(h("div", { class: "tok", text: "START → " + CFG.startToken }));
    if (CFG.intro)
      tokens.appendChild(h("div", { class: "tok", text: "0. skan w: " + CFG.intro.scanPlace + " → " + CFG.intro.scanToken }));
    STAGES.forEach(function (s) {
      tokens.appendChild(
        h("div", { class: "tok", text: s.id + ". skan w: " + s.scanPlace + " → " + s.scanToken })
      );
    });

    // odpowiedzi graczy (ostatnia próba każdego zadania)
    var savedStats = loadStats();
    var answers = h("details", { class: "org-tokens" }, h("summary", { text: "Pokaż odpowiedzi graczy" }));
    STAGES.forEach(function (s) {
      var a = savedStats.answers[s.id];
      answers.appendChild(
        h(
          "div",
          { class: "tok answer-tok" },
          h("b", { text: "Z" + s.id + ": " }),
          a != null && a !== "" ? a : "—"
        )
      );
    });

    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box org" },
        h("h3", { class: "overlay-title", text: "PANEL ORGANIZATORA" }),
        h("p", { class: "overlay-msg", text: "Postęp: etap " + (st.stage + 1) + ", faza " + st.phase }),
        jumps,
        h("button", {
          class: "btn btn-ghost",
          text: "RESET GRY",
          onclick: function () {
            saveState({ stage: 0, phase: "intro" });
            resetStats();
            ov.remove();
            renderTitle();
          },
        }),
        answers,
        tokens,
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

  /* ---------- mechanika skanowania (ekran mapy) ---------- */
  function processScan(token) {
    var st = loadState();
    if (isDone(st)) {
      overlay("info", "GRA SKOŃCZONA", "Prezent już znaleziony!");
      return;
    }

    // Ekran startowy: koperta na placu zabaw odsłania ZADANIE 1.
    if (st.phase === "intro") {
      var introTok = (CFG.intro || {}).scanToken;
      if (token === introTok) {
        bumpStat("scans");
        saveState({ stage: 0, phase: "solve" });
        Audio8.success();
        renderSolve(loadState());
      } else {
        Audio8.error();
        overlay("error", "NIEPRAWIDŁOWY KOD QR!", "Zeskanujcie kod z koperty na placu zabaw.");
      }
      return;
    }

    // Skanować można tylko na ekranie mapy (po rozwiązaniu zadania).
    if (st.phase !== "map") {
      overlay("info", "NAJPIERW ZADANIE", "Najpierw rozwiążcie zadanie, a potem skanujcie kopertę.");
      return;
    }

    var expected = STAGES[st.stage].scanToken;

    // właściwy kod bieżącego etapu
    if (token === expected) {
      var stage = STAGES[st.stage];
      bumpStat("scans");
      if (stage.final) {
        saveState({ stage: N, phase: "done" });
        renderVictory();
      } else {
        saveState({ stage: st.stage + 1, phase: "solve" });
        Audio8.success();
        renderSolve(loadState());
      }
      return;
    }

    // kod z wcześniejszego etapu
    for (var i = 0; i < st.stage; i++) {
      if (STAGES[i].scanToken === token) {
        overlay("info", "JUŻ ZESKANOWANY", "Ten kod już był. Idźcie w miejsce z aktualnej mapy!");
        return;
      }
    }
    // kod z późniejszego etapu
    for (var j = st.stage + 1; j < N; j++) {
      if (STAGES[j].scanToken === token) {
        Audio8.error();
        overlay("error", "ZA WCZEŚNIE!", "To koperta z dalszej części. Idźcie zgodnie z mapą.");
        return;
      }
    }
    Audio8.error();
    overlay("error", "NIEPRAWIDŁOWY KOD QR!", "To nie jest kod z tej gry.");
  }

  function renderCurrent() {
    var st = loadState();
    if (isDone(st)) {
      renderVictory();
    } else if (st.phase === "intro") {
      renderIntro();
    } else if (st.phase === "map") {
      renderMap(st);
    } else {
      renderSolve(st);
    }
  }

  /* ---------- odczyt tokenu z URL (#s=... / #start=...) ---------- */
  function readTokenFromHash() {
    var hsh = location.hash || "";
    if (hsh.charAt(0) === "#") hsh = hsh.slice(1);
    if (hsh.indexOf("s=") === 0) return decodeToken(hsh.slice(2));
    var m = hsh.match(/^\/?s\/(.+)$/);
    if (m) return decodeToken(m[1]);
    return null;
  }
  function readStartTokenFromHash() {
    var hsh = location.hash || "";
    if (hsh.charAt(0) === "#") hsh = hsh.slice(1);
    if (hsh.indexOf("start=") === 0) return decodeToken(hsh.slice(6));
    return null;
  }
  function clearHash() {
    try {
      history.replaceState(null, "", location.pathname + location.search);
    } catch (e) {
      location.hash = "";
    }
  }

  function handleHash() {
    if ((location.hash || "").replace("#", "") === "org") {
      clearHash();
      markEntered();
      renderCurrent();
      organizer();
      return true;
    }

    var startToken = readStartTokenFromHash();
    if (startToken !== null) {
      clearHash();
      if (startToken === CFG.startToken) {
        markEntered();
        var st = loadState();
        if (st.stage === 0 && st.phase === "intro") renderTitle();
        else renderCurrent();
      } else {
        renderBlocked();
      }
      return true;
    }

    var token = readTokenFromHash();
    if (!token) return false;

    if (!hasEntered()) {
      renderBlocked();
      return true;
    }
    clearHash();
    renderCurrent();
    overlay(
      "info",
      "SKANUJ W GRZE",
      "Ten kod zaliczysz tylko w grze: na ekranie mapy kliknij ZESKANUJ KOD i zeskanuj go tam."
    );
    return true;
  }

  /* ---------- start ---------- */
  function boot() {
    screen = document.getElementById("screen");
    var unlockOnce = function () {
      Audio8.unlock();
      window.removeEventListener("pointerdown", unlockOnce);
    };
    window.addEventListener("pointerdown", unlockOnce);
    window.addEventListener("hashchange", handleHash);

    if (!handleHash()) {
      if (!hasEntered()) renderBlocked();
      else {
        var st = loadState();
        if (st.stage === 0 && st.phase === "intro") renderTitle();
        else renderCurrent();
      }
    }
    bootSW();
  }

  function bootSW() {
    if ("serviceWorker" in navigator) {
      window.addEventListener("load", function () {
        navigator.serviceWorker.register("sw.js").catch(function () {});
      });
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
