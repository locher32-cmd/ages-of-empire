// ============================================================
//  Effects: animated water glints, chimney smoke, campfires,
//  selection glow, combat sparks, death smoke, wonder fireworks,
//  glowing borders and desaturated fog of war.
// ============================================================
(function (GF) {
  var particles = [];
  GF.particles = particles;
  GF.spawn = function (tile, kind, n, color) {
    var now = performance.now();
    for (var i = 0; i < (n || 1); i++) particles.push({ tile: tile, kind: kind, t0: now + (kind === 'firework' ? i * 140 : 0), dur: kind === 'smoke' ? 1600 : kind === 'firework' ? 1300 : 700, a: Math.random() * Math.PI * 2, v: 0.5 + Math.random(), color: color });
    if (particles.length > 600) particles.splice(0, particles.length - 600);
  };
  GF.border = function (ctx, x, y, s, k, op) {
    var e = GF.edgePts(x, y, s * 0.97, k), mx = (e[0] + e[2]) / 2, my = (e[1] + e[3]) / 2;
    var g = ctx.createLinearGradient(mx, my, mx + (x - mx) * 0.42, my + (y - my) * 0.42);
    var c = GF.rgb(op.color);
    g.addColorStop(0, GF.css(c, 0.55)); g.addColorStop(1, GF.css(c, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.lineTo(x + (e[2] - x) * 0.55, y + (e[3] - y) * 0.55); ctx.lineTo(x + (e[0] - x) * 0.55, y + (e[1] - y) * 0.55); ctx.closePath(); ctx.fill();
    ctx.lineCap = 'round';
    ctx.strokeStyle = GF.css(c, 0.95); ctx.lineWidth = Math.max(1.5, s * 0.07); ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
    ctx.strokeStyle = GF.css(GF.mix(GF.rgb(op.color2), [255, 255, 255], 0.3), 0.7); ctx.lineWidth = Math.max(0.7, s * 0.02); ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
  };
  GF.fog = function (ctx, x, y, s) {
    ctx.save();
    GF.hexPath(ctx, x, y, s + 0.6);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,0.5)'; ctx.fill();
    ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = 'rgba(38,40,52,0.26)'; ctx.fill(); ctx.fillStyle = 'rgba(190,190,205,0.06)'; ctx.fill();
    ctx.restore();
  };
  GF.hooks = {
    ground: function (ctx, list, now) {
      if (!GF.settings.anim || this.s < 14) return;
      var m = this.game.map, LIST = G.IDS.terrain.list, s = this.s, t = now * 0.001;
      ctx.lineCap = 'round';
      for (var i = 0; i < list.length; i += 4) {
        var tile = list[i]; if (!this.visibility(tile)) continue;
        var tk = LIST[m.terrain[tile]]; if (tk !== 'coast' && tk !== 'ocean' && tk !== 'lake') continue;
        var x = list[i + 1], y = list[i + 2];
        for (var k = 0; k < 2; k++) {
          var ph = t * (0.6 + k * 0.25) + tile * 1.37 + k * 2.1;
          var a = 0.5 + 0.5 * Math.sin(ph * 1.7);
          var gx = x + Math.sin(ph * 0.5 + k) * s * 0.42, gy = y + Math.cos(ph * 0.37 + k * 1.3) * s * 0.26;
          ctx.strokeStyle = 'rgba(220,245,255,' + (0.28 * a) + ')'; ctx.lineWidth = Math.max(1, s * 0.03);
          ctx.beginPath(); ctx.moveTo(gx - s * 0.14, gy); ctx.quadraticCurveTo(gx, gy - s * 0.05, gx + s * 0.14, gy); ctx.stroke();
        }
      }
    },
    objects: function (ctx, list, now) {
      if (!GF.settings.anim) return;
      var game = this.game, m = game.map, s = this.s, E = G.Engine;
      for (var i = 0; i < list.length; i += 4) {
        var tile = list[i]; if (this.visibility(tile) !== 2) continue;
        var x = list[i + 1], y = list[i + 2];
        var c = E.cityAt(game, tile);
        if (c) {
          var era = game.players[c.owner].era || 0, n = era >= 4 ? 4 : 2;
          for (var k = 0; k < n; k++) {
            var ph = ((now * 0.00035 + k / n + c.id * 0.137) % 1);
            var sx = x + (era >= 4 ? s * 0.12 : -s * 0.25) + Math.sin(ph * 6 + k) * s * 0.06 + ph * s * 0.25, sy = y - s * (era >= 4 ? 1.0 : 0.45) - ph * s * 1.1;
            var col = era >= 4 ? '70,66,62' : '200,200,205';
            ctx.fillStyle = 'rgba(' + col + ',' + (0.38 * (1 - ph)) + ')'; ctx.beginPath(); ctx.arc(sx, sy, s * (0.07 + ph * 0.18), 0, Math.PI * 2); ctx.fill();
          }
        }
        var ik = m.imp[tile] ? G.IDS.imp.list[m.imp[tile]] : null;
        if (ik === 'barb_camp' || ik === 'camp') {
          var fl = 0.7 + 0.3 * Math.sin(now * 0.02 + tile) * Math.sin(now * 0.013);
          var fx = x + (ik === 'camp' ? s * 0.35 : 0), fy = y + s * 0.42;
          var g = ctx.createRadialGradient(fx, fy, 0, fx, fy, s * 0.35 * fl); g.addColorStop(0, 'rgba(255,220,120,0.9)'); g.addColorStop(0.4, 'rgba(255,120,30,0.5)'); g.addColorStop(1, 'rgba(255,60,0,0)');
          ctx.fillStyle = g; ctx.beginPath(); ctx.arc(fx, fy, s * 0.35 * fl, 0, Math.PI * 2); ctx.fill();
        }
      }
    },
    overlay: function (ctx, list, now) {
      var s = this.s, self = this;
      // selected unit glow
      if (this.selected != null && this.game.units[this.selected]) {
        var u = this.game.units[this.selected], p = this.tileScreen(u.tile), pulse = 0.5 + 0.5 * Math.sin(now * 0.006);
        ctx.save(); ctx.strokeStyle = 'rgba(255,230,120,' + (0.35 + 0.4 * pulse) + ')'; ctx.lineWidth = Math.max(2, s * 0.06); ctx.shadowColor = 'rgba(255,210,80,0.9)'; ctx.shadowBlur = s * 0.3;
        ctx.beginPath(); ctx.ellipse(p.x, p.y + s * 0.35, s * (0.6 + 0.05 * pulse), s * (0.24 + 0.02 * pulse), 0, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
      }
      for (var i = particles.length - 1; i >= 0; i--) {
        var q = particles[i], k = (now - q.t0) / q.dur;
        if (k > 1) { particles.splice(i, 1); continue; }
        if (k < 0) continue;
        var sp = self.tileScreen(q.tile), x = sp.x, y = sp.y - s * 0.4;
        if (q.kind === 'spark') {
          var d = s * (0.2 + k * 0.9) * q.v; ctx.strokeStyle = 'rgba(255,' + (200 - k * 150 | 0) + ',60,' + (1 - k) + ')'; ctx.lineWidth = Math.max(1, s * 0.03);
          ctx.beginPath(); ctx.moveTo(x + Math.cos(q.a) * d * 0.6, y + Math.sin(q.a) * d * 0.6); ctx.lineTo(x + Math.cos(q.a) * d, y + Math.sin(q.a) * d + k * k * s * 0.4); ctx.stroke();
        } else if (q.kind === 'smoke') {
          ctx.fillStyle = 'rgba(60,55,50,' + (0.5 * (1 - k)) + ')'; ctx.beginPath(); ctx.arc(x + Math.cos(q.a) * s * 0.3 * k, y - k * s * 0.8, s * (0.15 + k * 0.35), 0, Math.PI * 2); ctx.fill();
        } else if (q.kind === 'sparkle') {
          var r2 = s * (0.3 + k * 0.8) * q.v; ctx.fillStyle = 'rgba(255,240,170,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(x + Math.cos(q.a) * r2, y + Math.sin(q.a) * r2 * 0.6 - k * s * 0.4, Math.max(1, s * 0.04), 0, Math.PI * 2); ctx.fill();
        } else if (q.kind === 'firework') {
          var cx2 = x + Math.cos(q.a) * s * 0.9, cy2 = y - s * (1.0 + q.v * 0.5);
          for (var j = 0; j < 12; j++) { var aa = j / 12 * Math.PI * 2, rr = s * 0.6 * Math.sqrt(k); ctx.fillStyle = 'hsla(' + ((q.a * 57) % 360) + ',95%,65%,' + (1 - k) + ')'; ctx.beginPath(); ctx.arc(cx2 + Math.cos(aa) * rr, cy2 + Math.sin(aa) * rr + k * k * s * 0.3, Math.max(1, s * 0.035), 0, Math.PI * 2); ctx.fill(); }
        }
      }
    }
  };
  // react to engine events
  if (G.Engine) G.Engine.on(function (ev) {
    if (ev.type === 'combat' && ev.result) { GF.spawn(ev.result.tile, 'spark', 14); if (ev.result.defenderDied) GF.spawn(ev.result.tile, 'smoke', 6); if (ev.result.attackerDied && ev.result.from != null) GF.spawn(ev.result.from, 'smoke', 6); }
    if (ev.type === 'cityFounded' && ev.city) GF.spawn(ev.city.tile, 'sparkle', 24);
    if (ev.type === 'wonder' && ev.city) GF.spawn(ev.city.tile, 'firework', 10);
    if (ev.type === 'cityCaptured' && ev.city) GF.spawn(ev.city.tile, 'smoke', 12);
    if (ev.type === 'improved' && ev.tile != null) GF.spawn(ev.tile, 'sparkle', 8);
  });
})(G.GFX);
