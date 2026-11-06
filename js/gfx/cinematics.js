// ============================================================
//  Cinematics: attack lunges, projectiles (arrows, stones,
//  shells, tracers), drifting cloud shadows, polar snowfall.
// ============================================================
(function (GF) {
  var lunges = {};
  GF.offset = function (u, now, s, rend) {
    var ox = 0, oy = GF.settings.anim ? GF.bob(u, now, s) : 0;
    var L = lunges[u.id];
    if (L) {
      var k = (now - L.t0) / L.dur;
      if (k >= 1 || k < 0) { if (k >= 1) delete lunges[u.id]; }
      else { var f = Math.sin(Math.PI * k) * 0.42; var a = rend.tileScreen(L.from), b = rend.tileScreen(L.to); ox += (b.x - a.x) * f; oy += (b.y - a.y) * f; }
    }
    return [ox, oy];
  };
  var projs = [];
  GF.projs = projs;
  function projStyle(d) {
    if (!d) return 'shell';
    if (d.domain === 'air') return 'bomb';
    if (d.cls === 'siege') return (D().TECHS[d.tech] || { era: 0 }).era >= 3 ? 'shell' : 'stone';
    if (d.cls === 'ranged') return (D().TECHS[d.tech] || { era: 0 }).era >= 4 ? 'tracer' : 'arrow';
    if (d.domain === 'sea') return (D().TECHS[d.tech] || { era: 0 }).era >= 3 ? 'shell' : 'arrow';
    return 'arrow';
  }
  function D() { return G.D; }
  G.Engine.on(function (ev) {
    if (ev.type !== 'combat' || !ev.result) return;
    var r = ev.result, now = performance.now(), delay = projs.length * 60 % 600;
    if (r.kind === 'melee' || r.kind === 'meleeCity') {
      if (r.attacker && !r.attackerDied && r.from != null) lunges[r.attacker.id] = { from: r.from, to: r.tile, t0: now, dur: 380 };
    } else if (r.from != null) {
      var d = r.attacker ? D().UNITS[r.attacker.type] : null;
      var st = r.kind === 'cityRanged' ? 'arrow' : projStyle(d);
      var n = st === 'arrow' ? 3 : st === 'tracer' ? 5 : 1;
      for (var i = 0; i < n; i++) projs.push({ from: r.from, to: r.tile, t0: now + delay + i * 70, dur: st === 'tracer' ? 260 : 520, style: st, j: (Math.random() - 0.5) * 0.3 });
    }
  });
  var baseOverlay = GF.hooks.overlay;
  GF.hooks.overlay = function (ctx, list, now) {
    var s = this.s, self = this;
    // cloud shadows drifting over the land
    if (GF.settings.anim && this.game) {
      var cw = this.cw, ch = this.ch, span = cw + 900;
      for (var c = 0; c < 4; c++) {
        var cx = ((c * 523 + now * 0.012 - this.cam.x * 0.9) % span + span) % span - 450;
        var cy = ((c * 311 - this.cam.y * 0.9) % (ch + 600) + ch + 600) % (ch + 600) - 300;
        var r = 180 + c * 60;
        var g = ctx.createRadialGradient(cx, cy, r * 0.1, cx, cy, r);
        g.addColorStop(0, 'rgba(10,15,30,0.13)'); g.addColorStop(1, 'rgba(10,15,30,0)');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy, r * 1.4, r * 0.8, 0, 0, Math.PI * 2); ctx.fill();
      }
      // snowfall over visible polar land
      if (s >= 16) {
        var m = this.game.map, LIST = G.IDS.terrain.list;
        ctx.fillStyle = 'rgba(255,255,255,0.75)';
        for (var i = 0; i < list.length; i += 4) {
          var t = list[i]; if (this.visibility(t) !== 2) continue;
          var tk = LIST[m.terrain[t]]; if (tk !== 'snow' && !(tk === 'tundra' && (t % 3 === 0))) continue;
          for (var k = 0; k < 4; k++) {
            var ph = ((now * 0.00025 + k * 0.25 + t * 0.37) % 1);
            var x = list[i + 1] + Math.sin(ph * 6 + k * 2 + t) * s * 0.4 + (k - 1.5) * s * 0.25, y = list[i + 2] - s * 0.9 + ph * s * 1.3;
            ctx.beginPath(); ctx.arc(x, y, Math.max(0.8, s * 0.025), 0, Math.PI * 2); ctx.fill();
          }
        }
      }
    }
    // projectiles
    for (var p = projs.length - 1; p >= 0; p--) {
      var q = projs[p], k2 = (now - q.t0) / q.dur;
      if (k2 > 1) { projs.splice(p, 1); GF.spawn(q.to, 'spark', q.style === 'shell' || q.style === 'bomb' ? 10 : 3); continue; }
      if (k2 < 0) continue;
      var a = self.tileScreen(q.from), b = self.tileScreen(q.to);
      var arc = q.style === 'tracer' ? 0.05 : q.style === 'bomb' ? -0.2 : 0.5;
      var px = a.x + (b.x - a.x) * k2 + q.j * s, py = a.y - s * 0.5 + (b.y - a.y) * k2 - Math.sin(Math.PI * k2) * Math.hypot(b.x - a.x, b.y - a.y) * arc;
      var k3 = Math.max(0, k2 - 0.06);
      var px2 = a.x + (b.x - a.x) * k3 + q.j * s, py2 = a.y - s * 0.5 + (b.y - a.y) * k3 - Math.sin(Math.PI * k3) * Math.hypot(b.x - a.x, b.y - a.y) * arc;
      ctx.lineCap = 'round';
      if (q.style === 'arrow') { ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1, s * 0.03); ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(px, py); ctx.stroke(); ctx.fillStyle = '#ddd'; ctx.beginPath(); ctx.arc(px, py, Math.max(1, s * 0.025), 0, Math.PI * 2); ctx.fill(); }
      else if (q.style === 'stone') { GF.blob(ctx, px, py, s * 0.07, s * 0.07, '#8a8278', 0.3); }
      else if (q.style === 'tracer') { ctx.strokeStyle = 'rgba(255,230,120,0.95)'; ctx.lineWidth = Math.max(1, s * 0.025); ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(px, py); ctx.stroke(); }
      else { ctx.strokeStyle = 'rgba(120,110,100,0.6)'; ctx.lineWidth = Math.max(1, s * 0.06); ctx.beginPath(); ctx.moveTo(px2, py2); ctx.lineTo(px, py); ctx.stroke(); ctx.fillStyle = '#222'; ctx.beginPath(); ctx.arc(px, py, Math.max(1.2, s * 0.05), 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = 'rgba(255,180,60,0.8)'; ctx.beginPath(); ctx.arc(px, py, Math.max(0.6, s * 0.02), 0, Math.PI * 2); ctx.fill(); }
    }
    baseOverlay.call(this, ctx, list, now);
  };
  // keep frames coming while projectiles / lunges play
  var oldFrame = G.Render.prototype.frame;
  G.Render.prototype.frame = function (ts) {
    oldFrame.call(this, ts);
    if (projs.length || Object.keys(lunges).length) this.request();
  };
})(G.GFX);
