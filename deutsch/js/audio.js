/*
 * Chiptune SFX generowane w locie (Web Audio API) — bez plików dźwiękowych
 * + wymowa po niemiecku (Web Speech API, głos wbudowany w iPada).
 * iOS wymaga gestu użytkownika do odblokowania dźwięku, dlatego wołamy
 * Audio8.unlock() przy pierwszym tapnięciu (patrz game.js).
 */
window.Audio8 = (function () {
  var ctx = null;
  var muteKey = "piatkowo_muted_v1";

  function isMuted() {
    try {
      return localStorage.getItem(muteKey) === "1";
    } catch (e) {
      return false;
    }
  }
  function setMuted(v) {
    try {
      localStorage.setItem(muteKey, v ? "1" : "0");
    } catch (e) {}
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
  function play(notes, type, vol) {
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
      g.gain.exponentialRampToValueAtTime(vol || 0.18, t + 0.01);
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

  /* ---------- wymowa po niemiecku ---------- */
  var synth = window.speechSynthesis;
  var hasSpeech = !!(synth && window.SpeechSynthesisUtterance);
  var deVoice = null;

  function pickVoice() {
    if (!hasSpeech) return;
    var voices = synth.getVoices() || [];
    var best = null;
    for (var i = 0; i < voices.length; i++) {
      var lang = (voices[i].lang || "").toLowerCase().replace("_", "-");
      if (lang === "de-de") {
        best = voices[i];
        break;
      }
      if (!best && lang.indexOf("de") === 0) best = voices[i];
    }
    deVoice = best;
  }
  if (hasSpeech) {
    pickVoice();
    if (synth.addEventListener)
      synth.addEventListener("voiceschanged", pickVoice);
    else synth.onvoiceschanged = pickVoice;
  }

  // Wymów słowo po niemiecku. Wołać z gestu użytkownika (iOS).
  function say(text) {
    if (!hasSpeech || !text) return false;
    try {
      if (!deVoice) pickVoice();
      synth.cancel();
      var u = new SpeechSynthesisUtterance(text);
      u.lang = "de-DE";
      if (deVoice) u.voice = deVoice;
      u.rate = 0.8; // wolniej, dla dzieci
      u.pitch = 1;
      synth.speak(u);
      return true;
    } catch (e) {
      return false;
    }
  }

  return {
    unlock: unlock,
    isMuted: isMuted,
    toggleMuted: toggleMuted,
    canSpeak: function () {
      return hasSpeech;
    },
    say: say,
    blip: function () {
      play([{ f: N.A5, d: 0.06 }], "square");
    },
    tick: function () {
      play([{ f: N.E5, d: 0.03 }], "square", 0.08);
    },
    step: function () {
      play([{ f: N.C5, d: 0.05 }], "square", 0.12);
    },
    back: function () {
      play([{ f: N.D4, d: 0.07 }], "triangle", 0.2);
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
    ladder: function () {
      play(
        [
          { f: N.C5, d: 0.07 },
          { f: N.D5, d: 0.07 },
          { f: N.E5, d: 0.07 },
          { f: N.G5, d: 0.07 },
          { f: N.A5, d: 0.07 },
          { f: N.C6, d: 0.16 },
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
