// ============================================================
//  v2 addition — Sound effects, synthesized with WebAudio.
//  No audio files: every sound is built from oscillators/noise,
//  so the game stays a single self-contained folder.
//  Respects the "Sound effects" setting (Menu -> Settings).
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.SFX = (function () {
  var S = {};
  var ctx = null, master = null, lastPlay = {};

  function enabled() {
    try {
      if (G.UI && G.UI.settings) return G.UI.settings.sound !== false;
      var st = JSON.parse(localStorage.getItem('aoe_settings') || '{}');
      return st.sound !== false;
    } catch (e) { return true; }
  }

  // Browsers only allow audio after a user gesture; main.js calls this
  // on the first pointer/key event.
  S.unlock = function () {
    if (ctx) { if (ctx.state === 'suspended') ctx.resume(); return; }
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = 0.5;
      master.connect(ctx.destination);
    } catch (e) { ctx = null; }
  };

  function tone(freq, dur, opts) {
    opts = opts || {};
    var t0 = ctx.currentTime + (opts.delay || 0);
    var o = ctx.createOscillator(), g = ctx.createGain();
    o.type = opts.type || 'sine';
    o.frequency.setValueAtTime(freq, t0);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, opts.slide), t0 + dur);
    var vol = opts.vol || 0.15;
    g.gain.setValueAtTime(0.0001, t0);
    g.gain.exponentialRampToValueAtTime(vol, t0 + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.05);
  }

  function noise(dur, opts) {
    opts = opts || {};
    var t0 = ctx.currentTime + (opts.delay || 0);
    var len = Math.max(1, (ctx.sampleRate * dur) | 0);
    var buf = ctx.createBuffer(1, len, ctx.sampleRate);
    var d = buf.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var src = ctx.createBufferSource(); src.buffer = buf;
    var f = ctx.createBiquadFilter(); f.type = opts.filter || 'lowpass'; f.frequency.value = opts.freq || 800;
    var g = ctx.createGain(); g.gain.value = opts.vol || 0.2;
    src.connect(f); f.connect(g); g.connect(master);
    src.start(t0);
  }

  var RECIPES = {
    click:   function () { tone(660, 0.05, { type: 'triangle', vol: 0.06 }); },
    select:  function () { tone(520, 0.06, { type: 'triangle', vol: 0.08 }); tone(780, 0.07, { delay: 0.05, type: 'triangle', vol: 0.07 }); },
    move:    function () { noise(0.08, { vol: 0.05, freq: 500 }); tone(220, 0.07, { type: 'sine', vol: 0.05 }); },
    combat:  function () { noise(0.16, { vol: 0.22, freq: 1400 }); tone(120, 0.18, { type: 'square', vol: 0.10, slide: 55 }); },
    ranged:  function () { noise(0.10, { vol: 0.14, freq: 2600, filter: 'bandpass' }); },
    founded: function () { tone(392, 0.12, { type: 'triangle', vol: 0.12 }); tone(523, 0.16, { delay: 0.1, type: 'triangle', vol: 0.12 }); tone(659, 0.22, { delay: 0.2, type: 'triangle', vol: 0.10 }); },
    captured:function () { tone(523, 0.12, { type: 'triangle', vol: 0.11 }); tone(392, 0.14, { delay: 0.1, type: 'triangle', vol: 0.11 }); tone(262, 0.24, { delay: 0.2, type: 'triangle', vol: 0.11 }); },
    tech:    function () { tone(587, 0.09, { type: 'sine', vol: 0.10 }); tone(880, 0.14, { delay: 0.08, type: 'sine', vol: 0.10 }); },
    wonder:  function () { [523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.30, { delay: i * 0.11, type: 'triangle', vol: 0.11 }); }); },
    war:     function () { tone(98, 0.35, { type: 'square', vol: 0.13, slide: 65 }); noise(0.3, { vol: 0.10, freq: 300 }); tone(98, 0.35, { delay: 0.38, type: 'square', vol: 0.12, slide: 60 }); },
    peace:   function () { tone(440, 0.14, { type: 'sine', vol: 0.09 }); tone(554, 0.20, { delay: 0.12, type: 'sine', vol: 0.09 }); },
    turn:    function () { tone(440, 0.08, { type: 'triangle', vol: 0.07 }); tone(587, 0.12, { delay: 0.07, type: 'triangle', vol: 0.07 }); },
    gold:    function () { tone(988, 0.06, { type: 'square', vol: 0.05 }); tone(1319, 0.10, { delay: 0.05, type: 'square', vol: 0.05 }); },
    error:   function () { tone(160, 0.14, { type: 'sawtooth', vol: 0.07 }); },
    victory: function () { [392, 523, 659, 784, 1047].forEach(function (f, i) { tone(f, 0.4, { delay: i * 0.13, type: 'triangle', vol: 0.12 }); }); },
    defeat:  function () { [392, 330, 262, 196].forEach(function (f, i) { tone(f, 0.4, { delay: i * 0.16, type: 'triangle', vol: 0.11 }); }); },
    nuke:    function () { noise(1.1, { vol: 0.30, freq: 220 }); tone(60, 1.0, { type: 'sine', vol: 0.22, slide: 30 }); }
  };

  // Throttled so AI-turn event storms can't turn into noise soup.
  S.play = function (name) {
    if (!ctx || !enabled()) return;
    var now = performance.now();
    var minGap = (name === 'combat' || name === 'ranged') ? 350 : 90;
    if (lastPlay[name] && now - lastPlay[name] < minGap) return;
    lastPlay[name] = now;
    try { if (RECIPES[name]) RECIPES[name](); } catch (e) { }
  };

  return S;
})();
