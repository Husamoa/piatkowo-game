/*
 * GRA PIĄTKOWSKA — logika i widoki.
 *
 * Postęp trzymany w localStorage. Kod QR to link postaci:
 *   https://.../piatkowo-game/#s=PTK-XXXX
 * Aparat telefonu otwiera ten link, gra odczytuje token z # i sprawdza,
 * czy to właściwy kod na tym etapie.
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
    for (var i = 2; i < arguments.length; i++) {
      var c = arguments[i];
      appendChild(e, c);
    }
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
    if (i >= 0 && /^https?:\/\//.test(text))
      return decodeToken(text.slice(i + 2));
    return text.toUpperCase();
  }

  function renderRiddleAt(idx) {
    clearScreen();
    var progress = loadProgress();
    if (idx == null) idx = progress;
    if (idx > progress) idx = progress;
    if (idx < 0) idx = 0;
    var stage = STAGES[idx];
    var isCurrent = idx === progress;

    var kids = [topBar(), progressDots(progress)];

    // pasek nawigacji: wstecz do rozwiązanych / powrót do aktualnej
    var nav = h("div", { class: "nav-row" });
    nav.appendChild(
      idx > 0
        ? h("button", {
            class: "btn btn-sm btn-ghost",
            text: "◀ POPRZEDNIA",
            onclick: function () {
              Audio8.unlock();
              Audio8.blip();
              renderRiddleAt(idx - 1);
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
              renderRiddleAt(progress);
            },
          })
        : h("span")
    );
    kids.push(nav);

    kids.push(
      h("div", {
        class: "stage-label",
        text: stage.label + " · ETAP " + stage.id + "/" + N,
      }),
      h("div", { class: "stage-icon" }, Sprites.el(stage.icon, 7)),
      h(
        "div",
        { class: "dialog" },
        h("p", { class: "riddle-text" + (stage.cipher ? " mono" : ""), text: stage.riddle })
      )
    );

    if (stage.cipher) {
      var hintBox = h(
        "div",
        { class: "hint hidden" },
        h("p", { class: "hint-text", text: stage.hint })
      );
      var hintBtn = h("button", {
        class: "btn btn-sm",
        text: "PODPOWIEDŹ",
        onclick: function () {
          Audio8.unlock();
          Audio8.blip();
          hintBox.classList.toggle("hidden");
          hintBtn.textContent = hintBox.classList.contains("hidden")
            ? "PODPOWIEDŹ"
            : "UKRYJ PODPOWIEDŹ";
        },
      });
      kids.push(hintBtn, hintBox);
    }

    if (isCurrent) {
      kids.push(
        h(
          "div",
          { class: "scan-cta" },
          Sprites.el("qr", 6),
          h("p", {
            class: "scan-text",
            text: "Znajdź to miejsce i zeskanuj kod QR.",
          })
        ),
        h("button", {
          class: "btn btn-big",
          text: "OTWÓRZ APARAT",
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
    } else {
      kids.push(h("div", { class: "solved-badge", text: "✓ ZAGADKA ROZWIĄZANA" }));
    }

    screen.appendChild(h("div", { class: "view view-riddle" }, kids));
  }

  function renderSuccess(isFinal) {
    clearScreen();
    screen.appendChild(
      h(
        "div",
        { class: "view view-success" },
        h("div", { class: "burst pop" }, Sprites.el("star", 9)),
        h("h2", { class: "big-ok", text: "DOBRZE!" }),
        h("p", {
          class: "ok-sub",
          text: isFinal ? "To był ostatni kod!" : "Kod poprawny. Ruszaj dalej!",
        }),
        h("button", {
          class: "btn btn-big",
          text: isFinal ? "ZOBACZ NAGRODĘ ▶" : "DALEJ ▶",
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
    if (!isFinal) Audio8.success(); // spróbuj od razu (może być zablokowane bez gestu)
  }

  function renderVictory() {
    clearScreen();
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
        h("h2", { class: "win-title", text: "GRATULACJE", onclick: onTitleTap }),
        h("h1", { class: "win-name", text: CFG.hero + "!" }),
        h("div", { class: "win-gift float" }, Sprites.el("gift", 10)),
        h("p", {
          class: "win-msg",
          text: "Znalazłaś prezent!\nWszystkiego najlepszego\nw dniu imienin!",
        }),
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
      placeholder: "np. PTK-XXXX",
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
        h("p", { class: "overlay-msg", text: "Przepisz kod spod kodu QR." }),
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
      h("summary", { text: "Pokaż kody (tokeny)" })
    );
    STAGES.forEach(function (s) {
      tokens.appendChild(
        h("div", { class: "tok", text: s.id + ". " + s.place + " → " + s.token })
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

  /* ---------- mechanika skanowania ---------- */
  function processScan(token) {
    var progress = loadProgress();
    var j = -1;
    for (var i = 0; i < N; i++) {
      if (STAGES[i].token === token) {
        j = i;
        break;
      }
    }
    if (j === -1) {
      Audio8.error();
      overlay("error", "NIEPRAWIDŁOWY KOD QR!", "To nie jest kod z tej gry.");
      return;
    }
    if (j === progress) {
      var newP = progress + 1;
      saveProgress(newP);
      renderSuccess(newP >= N);
      return;
    }
    if (j < progress) {
      overlay("info", "JUŻ ZESKANOWANY", "Ten kod już masz. Idź do kolejnej zagadki!");
      return;
    }
    Audio8.error();
    overlay("error", "NIEPRAWIDŁOWY KOD QR!", "Najpierw rozwiąż wcześniejsze zagadki.");
  }

  function renderCurrent() {
    var p = loadProgress();
    if (p >= N) renderVictory();
    else renderRiddleAt(p);
  }

  /* ---------- odczyt tokenu z URL (#s=...) ---------- */
  function readTokenFromHash() {
    var hsh = location.hash || "";
    if (hsh.charAt(0) === "#") hsh = hsh.slice(1);
    if (hsh.indexOf("s=") === 0) return decodeToken(hsh.slice(2));
    var m = hsh.match(/^\/?s\/(.+)$/);
    if (m) return decodeToken(m[1]);
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
      renderCurrent();
      organizer();
      return true;
    }

    var token = readTokenFromHash();
    if (!token) return false;

    clearHash();
    renderCurrent(); // widok pod spodem (dla nakładki błędu)
    processScan(token); // sukces podmieni ekran, błąd pokaże nakładkę
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
