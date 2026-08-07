/*
 * GRA MATYLDY — logika i widoki.
 *
 * Wersja BEZ kodów QR. Etapy zalicza się:
 *   - wpisując odpowiedź (type "answer"),
 *   - klikając przycisk (type "confirm"),
 *   - rozwiązując 4 mini-zagadki na kod 0000 (type "code").
 *
 * Postęp trzymany w localStorage (osobny klucz od gry Ani).
 * Wejście bez blokady — otwarcie linku od razu pokazuje grę.
 */
(function () {
  var CFG = window.GAME_CONFIG;
  var STAGES = CFG.stages;
  var N = STAGES.length;
  var screen; // #screen

  /* ---------- postęp ---------- */
  function loadProgress() {
    var v = parseInt(localStorage.getItem(CFG.storageKey) || "0", 10);
    if (isNaN(v) || v < 0) v = 0;
    if (v > N) v = N;
    return v;
  }
  function saveProgress(p) {
    localStorage.setItem(CFG.storageKey, String(p));
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

  /* ---------- porównywanie odpowiedzi ---------- */
  function norm(s) {
    return (s || "").trim().toLowerCase().replace(/\s+/g, " ");
  }
  function checkAnswer(stage, val) {
    var v = norm(val);
    if (!v) return false;
    if (stage.answerContains && v.indexOf(norm(stage.answerContains)) >= 0)
      return true;
    if (stage.answer && v === norm(stage.answer)) return true;
    return false;
  }
  function checkCode(sub, val) {
    var v = norm(val);
    return v === String(sub.a) || v === "zero";
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

  /* ---------- zdjęcia ---------- */
  function imagesEl(paths) {
    if (!paths || !paths.length) return null;
    var wrap = h("div", { class: "photos" });
    paths.forEach(function (src) {
      wrap.appendChild(
        h("img", { class: "game-photo", src: src, alt: "", loading: "lazy" })
      );
    });
    return wrap;
  }

  /* ---------- widoki ---------- */
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
        h("p", { class: "game-for", text: "DLA: " + CFG.hero }),
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

  // Nagłówek etapu: pasek, kropki, nawigacja, tytuł, ikona.
  function stageHead(idx, progress) {
    var stage = STAGES[idx];
    var isCurrent = idx === progress;
    var head = [topBar(), progressDots(progress)];

    var nav = h("div", { class: "nav-row" });
    nav.appendChild(
      idx > 0
        ? h("button", {
            class: "btn btn-sm btn-ghost",
            text: "◀ POPRZEDNIA",
            onclick: function () {
              Audio8.unlock();
              Audio8.blip();
              renderStageAt(idx - 1);
            },
          })
        : h("span")
    );
    nav.appendChild(
      !isCurrent
        ? h("button", {
            class: "btn btn-sm",
            text: "AKTUALNA ▶",
            onclick: function () {
              Audio8.unlock();
              Audio8.blip();
              renderStageAt(progress);
            },
          })
        : h("span")
    );
    head.push(nav);

    head.push(
      h("div", {
        class: "stage-label",
        text: stage.label + " · ETAP " + stage.id + "/" + N,
      }),
      stage.title ? h("div", { class: "stage-title", text: stage.title }) : null,
      h("div", { class: "stage-icon" }, Sprites.el(stage.icon, 7))
    );
    return head;
  }

  // Router: rozwiązany etap (podgląd) vs aktualny (interakcja).
  function renderStageAt(idx) {
    clearScreen();
    var progress = loadProgress();
    if (idx == null) idx = progress;
    if (idx > progress) idx = progress;
    if (idx < 0) idx = 0;
    var stage = STAGES[idx];
    var isCurrent = idx === progress;

    var kids = stageHead(idx, progress);

    kids.push(imagesEl(stage.images));
    kids.push(
      h(
        "div",
        { class: "dialog" },
        h("p", { class: "riddle-text", text: stage.riddle })
      )
    );

    if (!isCurrent) {
      kids.push(h("div", { class: "solved-badge", text: "✓ ZAGADKA ROZWIĄZANA" }));
      screen.appendChild(h("div", { class: "view view-riddle" }, kids));
      return;
    }

    // aktualny etap — interakcja zależna od typu
    if (stage.type === "answer") kids.push(answerForm(stage, idx));
    else if (stage.type === "confirm") kids.push(confirmBtn(stage, idx));
    else if (stage.type === "code") kids.push(codeIntroBtn(stage));

    screen.appendChild(h("div", { class: "view view-riddle" }, kids));
  }

  /* ---------- typ: answer (wpisanie odpowiedzi) ---------- */
  function answerForm(stage, idx) {
    var input = h("input", {
      class: "code-input",
      type: "text",
      placeholder: stage.placeholder || "wpisz odpowiedź",
      autocapitalize: "characters",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
    });
    function submit() {
      Audio8.unlock();
      if (checkAnswer(stage, input.value)) {
        saveProgress(idx + 1);
        renderSuccess(stage, idx + 1 >= N);
      } else {
        Audio8.error();
        overlay("error", "JESZCZE NIE TO", "Spróbuj jeszcze raz.");
      }
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });
    return h(
      "div",
      { class: "answer-box" },
      stage.prompt ? h("p", { class: "answer-prompt", text: stage.prompt }) : null,
      input,
      h("button", { class: "btn btn-big", text: "SPRAWDŹ", onclick: submit })
    );
  }

  /* ---------- typ: confirm (przycisk) ---------- */
  function confirmBtn(stage, idx) {
    return h("button", {
      class: "btn btn-big",
      text: stage.confirmLabel || "DALEJ ▶",
      onclick: function () {
        Audio8.unlock();
        Audio8.blip();
        saveProgress(idx + 1);
        renderSuccess(stage, idx + 1 >= N);
      },
    });
  }

  /* ---------- typ: code (4 zagadki -> 0000) ---------- */
  function codeIntroBtn(stage) {
    return h("button", {
      class: "btn btn-big",
      text: "ROZWIĄŻ KOD ▶",
      onclick: function () {
        Audio8.unlock();
        Audio8.blip();
        renderCodeStep(stage, 0);
      },
    });
  }

  function renderCodeStep(stage, sub) {
    clearScreen();
    var subs = stage.subRiddles;
    var item = subs[sub];
    var input = h("input", {
      class: "code-input code-digit",
      type: "text",
      inputmode: "numeric",
      maxlength: "2",
      placeholder: "?",
      autocomplete: "off",
      autocorrect: "off",
      spellcheck: "false",
    });
    function submit() {
      Audio8.unlock();
      if (checkCode(item, input.value)) {
        if (sub + 1 < subs.length) {
          Audio8.success();
          renderCodeStep(stage, sub + 1);
        } else {
          Audio8.success();
          renderCodeFinal(stage);
        }
      } else {
        Audio8.error();
        overlay("error", "TO NIE TA CYFRA", "Rozwiąż zagadkę i spróbuj znów.");
      }
    }
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter") submit();
    });

    // podgląd budowanego kodu
    var built = h("div", { class: "code-built" });
    for (var i = 0; i < subs.length; i++) {
      built.appendChild(
        h("span", {
          class: "code-slot" + (i < sub ? " filled" : ""),
          text: i < sub ? "0" : "•",
        })
      );
    }

    screen.appendChild(
      h(
        "div",
        { class: "view view-riddle" },
        topBar(),
        h("div", { class: "stage-label", text: "KOD DO SKRZYNKI" }),
        h("div", {
          class: "stage-title",
          text: "CYFRA " + (sub + 1) + " Z " + subs.length,
        }),
        built,
        h(
          "div",
          { class: "dialog" },
          h("p", { class: "riddle-text", text: item.q })
        ),
        h(
          "div",
          { class: "answer-box" },
          input,
          h("button", { class: "btn btn-big", text: "SPRAWDŹ", onclick: submit })
        )
      )
    );
    setTimeout(function () {
      input.focus();
    }, 60);
  }

  function renderCodeFinal(stage) {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-riddle" },
        topBar(),
        h("div", { class: "stage-title", text: "KOD DO SKRZYNKI" }),
        imagesEl(stage.finalImage ? [stage.finalImage] : null),
        h("p", { class: "ok-sub", text: "Masz wszystkie cyfry! Kod to:" }),
        h("div", { class: "code-reveal", text: stage.codeReveal || "0 0 0 0" }),
        h("p", {
          class: "scan-text",
          text: "Wpisz kod w skrzynce, wyjmij klucze i otwórz domek!",
        }),
        h("button", {
          class: "btn btn-big blink",
          text: stage.finalButton || "GOTOWE ▶",
          onclick: function () {
            Audio8.unlock();
            saveProgress(N);
            Audio8.victory();
            renderVictory();
          },
        })
      )
    );
  }

  /* ---------- sukces etapu ---------- */
  function renderSuccess(stage, isFinal) {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-success" },
        h("div", { class: "burst pop" }, Sprites.el("star", 9)),
        h("h2", { class: "big-ok", text: "DOBRZE!" }),
        h("p", {
          class: "ok-sub",
          text: (stage && stage.successText) || "Świetnie! Ruszaj dalej!",
        }),
        stage && stage.successImage ? imagesEl([stage.successImage]) : null,
        h("button", {
          class: "btn btn-big",
          text: isFinal ? "ZOBACZ DOMEK ▶" : "DALEJ ▶",
          onclick: function () {
            Audio8.unlock();
            if (isFinal) {
              Audio8.victory();
              renderVictory();
            } else {
              Audio8.success();
              renderCurrent();
            }
          },
        })
      )
    );
    if (!isFinal) Audio8.success();
  }

  function renderVictory() {
    clearScreen();
    var V = CFG.victory || {};
    var confetti = h("div", { class: "confetti" });
    var colors = ["#e43b44", "#ffd23f", "#4a7fe0", "#3fa34d", "#c25bd6", "#59d5e0"];
    for (var i = 0; i < 28; i++) {
      var p = h("span", { class: "conf" });
      p.style.left = ((i * 100) / 28).toFixed(2) + "%";
      p.style.animationDelay = ((i % 10) * 0.22).toFixed(2) + "s";
      p.style.background = colors[i % colors.length];
      confetti.appendChild(p);
    }
    screen.appendChild(
      h(
        "div",
        { class: "view view-victory" },
        confetti,
        h("h2", {
          class: "win-title",
          text: V.title || "GRATULACJE",
          onclick: onTitleTap,
        }),
        h("h1", { class: "win-name", text: V.name || CFG.hero + "!" }),
        h("div", { class: "win-gift float" }, Sprites.el("gift", 10)),
        h("p", { class: "win-msg", text: V.msg || "Udało się!" }),
        h(
          "div",
          { class: "win-hearts" },
          Sprites.el("heart", 5),
          Sprites.el("heart", 7),
          Sprites.el("heart", 5)
        )
      )
    );
    Audio8.victory();
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
        { class: "overlay-box" },
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

  /* ---------- panel organizatora ---------- */
  function organizer() {
    var progress = loadProgress();
    var jumps = h("div", { class: "org-jumps" });
    for (var i = 0; i < N; i++) {
      (function (k) {
        jumps.appendChild(
          h("button", {
            class: "btn btn-sm",
            text: "Etap " + (k + 1),
            onclick: function () {
              saveProgress(k);
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
          saveProgress(N);
          ov.remove();
          renderCurrent();
        },
      })
    );

    var tokens = h(
      "details",
      { class: "org-tokens" },
      h("summary", { text: "Pokaż odpowiedzi" })
    );
    STAGES.forEach(function (s) {
      var ans =
        s.type === "answer"
          ? s.answer
          : s.type === "confirm"
          ? "(przycisk) " + (s.confirmLabel || "")
          : "kod " + (s.codeReveal || "0 0 0 0").replace(/\s+/g, "");
      tokens.appendChild(
        h("div", {
          class: "tok",
          text: s.id + ". " + (s.title || s.label) + " → " + ans,
        })
      );
    });

    var ov = h(
      "div",
      { class: "overlay overlay-info" },
      h(
        "div",
        { class: "overlay-box org" },
        h("h3", { class: "overlay-title", text: "PANEL ORGANIZATORA" }),
        h("p", { class: "overlay-msg", text: "Postęp: " + progress + "/" + N }),
        jumps,
        h("button", {
          class: "btn btn-ghost",
          text: "RESET GRY",
          onclick: function () {
            saveProgress(0);
            ov.remove();
            renderTitle();
          },
        }),
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

  function renderCurrent() {
    var p = loadProgress();
    if (p >= N) renderVictory();
    else renderStageAt(p);
  }

  /* ---------- #org w adresie ---------- */
  function handleHash() {
    if ((location.hash || "").replace("#", "") === "org") {
      try {
        history.replaceState(null, "", location.pathname + location.search);
      } catch (e) {
        location.hash = "";
      }
      renderCurrent();
      organizer();
      return true;
    }
    return false;
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
      if (loadProgress() === 0) renderTitle();
      else renderCurrent();
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

  if (document.readyState === "loading")
    document.addEventListener("DOMContentLoaded", boot);
  else boot();
})();
