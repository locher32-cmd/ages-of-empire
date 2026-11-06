// ============================================================
//  Atmosphere: painted cloud sea over unexplored lands, soft
//  cloud fringes at the edge of the known world, and an
//  animated movement path.
// ============================================================
(function (GF) {
  var BG = null;
  function smooth(a, b, x) { x = (x - a) / (b - a); x = x < 0 ? 0 : x > 1 ? 1 : x; return x * x * (3 - 2 * x); }
  function build() {
    var F = GF.fields(), N = 512;
    var base = GF.mk(N, N), bx = base.getContext('2d'), bd = bx.createImageData(N, N), B = bd.data;
    var cl = GF.mk(N, N), cx = cl.getContext('2d'), cd = cx.createImageData(N, N), C = cd.data;
    for (var y = 0; y < N; y++) for (var x = 0; x < N; x++) {
      var u = x / N, v = y / N;
      var wx = GF.sample(F.low, u + 0.31, v + 0.17) - 0.5, wy = GF.sample(F.low, u + 0.73, v + 0.59) - 0.5;
      var n = GF.sample(F.low, u + wx * 0.35, v + wy * 0.35) * 0.65 + GF.sample(F.mid, u * 2 + wx * 0.2, v * 2 + wy * 0.2) * 0.35;
      var g = GF.sample(F.hi, u * 2, v * 2);
      // parchment-dark cloud base: deep umber with lighter swirls
      var t = smooth(0.35, 0.7, n), lit = t * 0.9 + (g - 0.5) * 0.12;
      var i = (y * N + x) * 4;
      B[i] = 16 + lit * 46; B[i + 1] = 13 + lit * 38; B[i + 2] = 10 + lit * 30; B[i + 3] = 255;
      // separate wispy cloud layer
      var m = GF.sample(F.low, u * 2 + 0.5 + wy * 0.5, v * 2 + 0.2 + wx * 0.5) * 0.6 + GF.sample(F.mid, u * 3 + wx, v * 3) * 0.4;
      var a = smooth(0.55, 0.78, m), sh = smooth(0.5, 0.9, m + (GF.sample(F.mid, u * 3 + 0.02, v * 3 + 0.02) - 0.5) * 0.3);
      C[i] = 120 + sh * 70; C[i + 1] = 108 + sh * 62; C[i + 2] = 92 + sh * 52; C[i + 3] = a * 70;
    }
    bx.putImageData(bd, 0, 0); cx.putImageData(cd, 0, 0);
    return { base: base, cloud: cl };
  }
  GF.drawUnexplored = function (r, ctx, now) {
    if (!BG) BG = build();
    if (!r._bgPat) { r._bgPat = ctx.createPattern(BG.base, 'repeat'); r._clPat = ctx.createPattern(BG.cloud, 'repeat'); }
    var cw = r.cw, ch = r.ch;
    ctx.save(); ctx.translate(-(((r.cam.x * 0.3) % 512) + 512) % 512 - 512, -(((r.cam.y * 0.3) % 512) + 512) % 512 - 512);
    ctx.fillStyle = r._bgPat; ctx.fillRect(0, 0, cw + 1100, ch + 1100); ctx.restore();
    var drift = GF.settings.anim ? (now || 0) * 0.006 : 0;
    ctx.save(); ctx.translate(-((((r.cam.x * 0.55 + drift) % 512) + 512) % 512) - 512, -((((r.cam.y * 0.55 + drift * 0.3) % 512) + 512) % 512) - 512);
    ctx.fillStyle = r._clPat; ctx.fillRect(0, 0, cw + 1100, ch + 1100); ctx.restore();
  };

  // soft cloud fringe sprite
  function puff(S, seed) {
    var w = S * 3.4, h = S * 3.0, c = GF.mk(w, h), ctx = c.getContext('2d'), r = GF.rng(seed);
    for (var k = 0; k < 14; k++) {
      var a = r() * Math.PI * 2, d = r() * S * 0.7, x = w / 2 + Math.cos(a) * d, y = h / 2 + Math.sin(a) * d * 0.8, rr = S * (0.55 + r() * 0.45);
      var g = ctx.createRadialGradient(x, y, 0, x, y, rr);
      var l = r() < 0.4 ? '58,48,36' : '26,21,16';
      g.addColorStop(0, 'rgba(' + l + ',0.75)'); g.addColorStop(0.6, 'rgba(' + l + ',0.4)'); g.addColorStop(1, 'rgba(' + l + ',0)');
      ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    // a little sunlit rim on the upper-left
    for (k = 0; k < 4; k++) {
      x = w / 2 - S * 0.3 + r() * S * 0.3; y = h / 2 - S * 0.35 + r() * S * 0.2; rr = S * (0.3 + r() * 0.2);
      g = ctx.createRadialGradient(x, y, 0, x, y, rr); g.addColorStop(0, 'rgba(150,130,105,0.09)'); g.addColorStop(1, 'rgba(150,130,105,0)');
      ctx.fillStyle = g; ctx.fillRect(x - rr, y - rr, rr * 2, rr * 2);
    }
    return { c: c, ax: w / 2, ay: h / 2 };
  }
  var baseObjects = GF.hooks.objects;
  GF.hooks.objects = function (ctx, list, now) {
    if (baseObjects) baseObjects.call(this, ctx, list, now);
    if (this.revealAll) return;
    var s = this.s, self = this;
    for (var i = 0; i < list.length; i += 4) {
      var t = list[i]; if (this.visibility(t)) continue;
      var nb = G.Hex.neighbors(t), edge = false;
      for (var k = 0; k < nb.length; k++) if (this.visibility(nb[k])) { edge = true; break; }
      if (!edge) continue;
      var vr = t % 5;
      var sp = this.sprite('fogpuff' + vr, function (S) { return puff(S, 91 + vr * 17); }), kk = s / sp.S;
      ctx.drawImage(sp.c, list[i + 1] - sp.ax * kk, list[i + 2] - sp.ay * kk, sp.c.width * kk, sp.c.height * kk);
    }
  };

  // animated movement path: glowing dashed trail with turn markers and arrowhead
  GF.drawPath = function (r, ctx, path, now) {
    var s = r.s, pts = [];
    if (r.selected != null && r.game.units[r.selected]) { var p0 = r.tileScreen(r.game.units[r.selected].tile); pts.push([p0.x, p0.y + s * 0.2, 0]); }
    for (var i = 0; i < path.length; i++) { var pp = r.tileScreen(path[i].t); pts.push([pp.x, pp.y + s * 0.2, path[i].turn]); }
    if (pts.length < 2) return;
    ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    function trace() { ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]); for (var k = 1; k < pts.length; k++) { var mx = (pts[k - 1][0] + pts[k][0]) / 2, my = (pts[k - 1][1] + pts[k][1]) / 2; ctx.quadraticCurveTo(pts[k - 1][0], pts[k - 1][1], mx, my); } ctx.lineTo(pts[pts.length - 1][0], pts[pts.length - 1][1]); }
    trace(); ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(3, s * 0.14); ctx.stroke();
    trace(); ctx.strokeStyle = 'rgba(255,225,120,0.95)'; ctx.lineWidth = Math.max(2, s * 0.07);
    ctx.setLineDash([s * 0.22, s * 0.16]); ctx.lineDashOffset = GF.settings.anim ? -(now * 0.02) % (s * 0.38) : 0; ctx.stroke(); ctx.setLineDash([]);
    var a = pts[pts.length - 1], b = pts[pts.length - 2], ang = Math.atan2(a[1] - b[1], a[0] - b[0]), L = s * 0.3;
    ctx.fillStyle = 'rgba(255,225,120,1)'; ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(a[0] + Math.cos(ang) * L * 0.4, a[1] + Math.sin(ang) * L * 0.4); ctx.lineTo(a[0] + Math.cos(ang + 2.5) * L, a[1] + Math.sin(ang + 2.5) * L); ctx.lineTo(a[0] + Math.cos(ang - 2.5) * L, a[1] + Math.sin(ang - 2.5) * L); ctx.closePath(); ctx.fill(); ctx.stroke();
    for (i = 1; i < pts.length; i++) if (pts[i][2]) {
      var x = pts[i][0], y = pts[i][1], R = s * 0.2;
      var g = ctx.createRadialGradient(x - R * 0.3, y - R * 0.3, 0, x, y, R); g.addColorStop(0, '#5a4a30'); g.addColorStop(1, '#1a140c');
      ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, R, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#e8c060'; ctx.lineWidth = Math.max(1.5, s * 0.03); ctx.stroke();
      ctx.fillStyle = '#fff3c8'; ctx.font = 'bold ' + Math.round(s * 0.24) + 'px Georgia, serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(pts[i][2], x, y + 1);
    }
    ctx.restore();
  };
})(G.GFX);
