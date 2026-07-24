/*
 * Wbudowany skaner kodów QR (kamera + jsQR).
 * Dzięki niemu skanowanie odbywa się w grze, bez przeładowania strony
 * (ważne w piwnicy bez zasięgu i na Chrome na iPhonie).
 *
 * QRScanner.open(onResult, onManual)
 *   onResult(text)  -> wywołane z odczytaną treścią kodu (np. link z #s=TOKEN)
 *   onManual()      -> gdy użytkownik wybierze "wpisz kod ręcznie"
 */
window.QRScanner = (function () {
  var stream = null,
    raf = null,
    video = null,
    canvas = null,
    ctx = null,
    overlay = null,
    onOk = null,
    onManual = null,
    scanning = false;

  function h(tag, attrs) {
    var e = document.createElement(tag);
    attrs = attrs || {};
    for (var k in attrs) {
      if (!attrs.hasOwnProperty(k)) continue;
      var v = attrs[k];
      if (k === "class") e.className = v;
      else if (k === "text") e.textContent = v;
      else if (k.slice(0, 2) === "on" && typeof v === "function")
        e.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v != null) e.setAttribute(k, v);
    }
    for (var i = 2; i < arguments.length; i++)
      if (arguments[i] != null)
        e.appendChild(
          typeof arguments[i] === "string"
            ? document.createTextNode(arguments[i])
            : arguments[i]
        );
    return e;
  }

  function stop() {
    scanning = false;
    if (raf) {
      cancelAnimationFrame(raf);
      raf = null;
    }
    if (stream) {
      stream.getTracks().forEach(function (t) {
        t.stop();
      });
      stream = null;
    }
    if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
    overlay = null;
    video = null;
  }

  function showError(msg) {
    if (!overlay) return;
    var body = overlay.querySelector(".scanner-body");
    body.innerHTML = "";
    body.appendChild(h("p", { class: "scanner-err", text: msg }));
    body.appendChild(
      h(
        "div",
        { class: "row" },
        h("button", {
          class: "btn",
          text: "WPISZ KOD",
          onclick: function () {
            var cb = onManual;
            stop();
            if (cb) cb();
          },
        }),
        h("button", { class: "btn btn-ghost", text: "ZAMKNIJ", onclick: stop })
      )
    );
  }

  function tick() {
    if (!scanning) return;
    if (video && video.readyState === video.HAVE_ENOUGH_DATA && typeof jsQR !== "undefined") {
      var w = video.videoWidth,
        vh = video.videoHeight;
      if (w && vh) {
        // skala do ~ 480px dłuższego boku dla wydajności
        var scale = Math.min(1, 480 / Math.max(w, vh));
        var cw = Math.round(w * scale),
          ch = Math.round(vh * scale);
        canvas.width = cw;
        canvas.height = ch;
        ctx.drawImage(video, 0, 0, cw, ch);
        var img = ctx.getImageData(0, 0, cw, ch);
        var code = jsQR(img.data, cw, ch, { inversionAttempts: "dontInvert" });
        if (code && code.data) {
          found(code.data);
          return;
        }
      }
    }
    raf = requestAnimationFrame(tick);
  }

  function found(text) {
    try {
      if (navigator.vibrate) navigator.vibrate(60);
    } catch (e) {}
    var cb = onOk;
    stop();
    if (cb) cb(text);
  }

  function open(onResult, onManualCb) {
    onOk = onResult;
    onManual = onManualCb || null;
    canvas = document.createElement("canvas");
    ctx = canvas.getContext("2d", { willReadFrequently: true });

    video = h("video", { class: "scanner-video", playsinline: "", muted: "", autoplay: "" });
    video.muted = true;

    overlay = h(
      "div",
      { class: "scanner" },
      h(
        "div",
        { class: "scanner-stage" },
        video,
        h("div", { class: "scanner-frame" }, h("div", { class: "scanner-bar" }))
      ),
      h(
        "div",
        { class: "scanner-body" },
        h("p", { class: "scanner-hint", text: "Skieruj aparat na kod QR" }),
        h(
          "div",
          { class: "row" },
          h("button", {
            class: "btn btn-ghost",
            text: "WPISZ KOD",
            onclick: function () {
              var cb = onManual;
              stop();
              if (cb) cb();
            },
          }),
          h("button", { class: "btn", text: "ZAMKNIJ", onclick: stop })
        )
      )
    );
    document.getElementById("app").appendChild(overlay);

    if (
      !navigator.mediaDevices ||
      !navigator.mediaDevices.getUserMedia ||
      typeof jsQR === "undefined"
    ) {
      showError(
        "Nie mogę uruchomić aparatu w tej przeglądarce. Zeskanuj kod aparatem telefonu albo wpisz kod ręcznie."
      );
      return;
    }

    navigator.mediaDevices
      .getUserMedia({ video: { facingMode: { ideal: "environment" } }, audio: false })
      .then(function (s) {
        stream = s;
        video.srcObject = s;
        video.setAttribute("playsinline", "");
        var p = video.play();
        if (p && p.catch) p.catch(function () {});
        scanning = true;
        raf = requestAnimationFrame(tick);
      })
      .catch(function (err) {
        var name = err && err.name ? err.name : "";
        if (name === "NotAllowedError" || name === "SecurityError")
          showError(
            "Brak zgody na aparat. Zezwól na kamerę w ustawieniach przeglądarki, albo wpisz kod ręcznie."
          );
        else if (name === "NotFoundError")
          showError("Nie znaleziono aparatu. Wpisz kod ręcznie.");
        else
          showError(
            "Nie udało się uruchomić aparatu (potrzebne HTTPS). Użyj wersji z linku albo wpisz kod ręcznie."
          );
      });
  }

  return { open: open, stop: stop };
})();
