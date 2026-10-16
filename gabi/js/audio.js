/*
 * Chiptune SFX generowane w locie (Web Audio API) — bez plików dźwiękowych.
 * iOS wymaga gestu użytkownika do odblokowania dźwięku, dlatego wołamy
 * Audio.unlock() przy pierwszym tapnięciu (patrz game.js).
 */
window.Audio8 = (function () {
  var ctx = null;
  var muteKey = "piatkowo_muted_v1";

  function isMuted() {
    return localStorage.getItem(muteKey) === "1";
  }
  function setMuted(v) {
    localStorage.setItem(muteKey, v ? "1" : "0");
  }
  function toggleMuted() {
    setMuted(!isMuted());
    return isMuted();
  }

  function getCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    return ctx;
  }

  // Odblokowanie audio przy geście (iOS)
  function unlock() {
    var c = getCtx();
    if (c && c.state === "suspended") c.resume();
  }

  // Zagraj sekwencję nut: [{f: częstotliwość, d: czas s, t: typ}]
  function play(notes, type) {
    if (isMuted()) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    var t = c.currentTime;
    notes.forEach(function (n) {
      var osc = c.createOscillator();
      var g = c.createGain();
      osc.type = n.t || type || "square";
      osc.frequency.setValueAtTime(n.f, t);
      // krótka obwiednia, żeby brzmiało "8-bitowo"
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.18, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + n.d);
      osc.connect(g);
      g.connect(c.destination);
      osc.start(t);
      osc.stop(t + n.d + 0.02);
      t += n.d;
    });
  }

  var N = {
    C4: 261.63, D4: 293.66, E4: 329.63, F4: 349.23, G4: 392.0,
    A4: 440.0, B4: 493.88, C5: 523.25, D5: 587.33, E5: 659.25,
    F5: 698.46, G5: 783.99, A5: 880.0, C6: 1046.5,
  };

  return {
    unlock: unlock,
    isMuted: isMuted,
    toggleMuted: toggleMuted,
    blip: function () {
      play([{ f: N.A5, d: 0.06 }], "square");
    },
    success: function () {
      play(
        [
          { f: N.E5, d: 0.09 },
          { f: N.G5, d: 0.09 },
          { f: N.C6, d: 0.18 },
        ],
        "square"
      );
    },
    error: function () {
      play(
        [
          { f: N.A4, d: 0.12, t: "sawtooth" },
          { f: 155.56, d: 0.28, t: "sawtooth" }, // Eb3-ish, opadające "buzz"
        ],
        "sawtooth"
      );
    },
    victory: function () {
      play(
        [
          { f: N.C5, d: 0.12 },
          { f: N.E5, d: 0.12 },
          { f: N.G5, d: 0.12 },
          { f: N.C6, d: 0.18 },
          { f: N.G5, d: 0.1 },
          { f: N.C6, d: 0.34 },
        ],
        "square"
      );
    },
  };
})();
