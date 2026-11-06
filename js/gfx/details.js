// ============================================================
//  Map details: tapered rivers with animated current, dirt and
//  cobbled roads, railways with ties, animated coastal surf,
//  idle unit motion, heraldic city banners.
// ============================================================
(function (GF) {
  GF.river = function (ctx, x, y, dxn, dyn, s, now) {
    var cx = x + dxn * 0.5 + dyn * 0.15, cy = y + dyn * 0.5 - dxn * 0.08;
    ctx.lineCap = 'round';
    ctx.strokeStyle = 'rgba(60,70,30,0.55)'; ctx.lineWidth = s * 0.32; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(cx, cy, x + dxn, y + dyn); ctx.stroke();
    ctx.strokeStyle = '#2a6aa8'; ctx.lineWidth = s * 0.22; ctx.stroke();
    ctx.strokeStyle = '#3f8ccc'; ctx.lineWidth = s * 0.14; ctx.stroke();
    ctx.strokeStyle = 'rgba(190,230,255,0.55)'; ctx.lineWidth = s * 0.04;
    ctx.setLineDash([s * 0.12, s * 0.3]); ctx.lineDashOffset = GF.settings.anim ? -(now || 0) * 0.02 * Math.max(1, s / 30) : 0;
    ctx.stroke(); ctx.setLineDash([]); ctx.lineDashOffset = 0;
  };
  GF.road = function (ctx, x, y, dxn, dyn, s, rail, cobble) {
    var ex = x + dxn / 2, ey = y + dyn / 2;
    ctx.lineCap = 'round';
    if (rail) {
      var len = Math.hypot(dxn, dyn), nx = -dyn / len, ny = dxn / len, g = s * 0.07;
      ctx.strokeStyle = '#5a4030'; ctx.lineWidth = s * 0.05;
      for (var q = 0; q <= 5; q++) { var t = q / 5, qx = x + (ex - x) * t, qy = y + (ey - y) * t; ctx.beginPath(); ctx.moveTo(qx - nx * g * 1.6, qy - ny * g * 1.6); ctx.lineTo(qx + nx * g * 1.6, qy + ny * g * 1.6); ctx.stroke(); }
      ctx.strokeStyle = '#b8bcc4'; ctx.lineWidth = Math.max(1, s * 0.03);
      [-1, 1].forEach(function (sg) { ctx.beginPath(); ctx.moveTo(x + nx * g * sg, y + ny * g * sg); ctx.lineTo(ex + nx * g * sg, ey + ny * g * sg); ctx.stroke(); });
      return;
    }
    ctx.strokeStyle = cobble ? 'rgba(70,64,58,0.8)' : 'rgba(80,58,30,0.75)'; ctx.lineWidth = s * 0.17; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(ex, ey); ctx.stroke();
    ctx.strokeStyle = cobble ? '#a8a296' : '#a8834e'; ctx.lineWidth = s * 0.11; ctx.stroke();
    if (cobble) { ctx.strokeStyle = 'rgba(60,55,50,0.5)'; ctx.lineWidth = s * 0.02; ctx.setLineDash([s * 0.04, s * 0.05]); ctx.stroke(); ctx.setLineDash([]); }
    else { ctx.strokeStyle = 'rgba(70,50,25,0.35)'; ctx.lineWidth = s * 0.02; ctx.setLineDash([s * 0.08, s * 0.12]); ctx.stroke(); ctx.setLineDash([]); }
  };
  GF.bob = function (u, now, s) {
    var d = G.D.UNITS[u.type];
    if (d.domain === 'sea') return Math.sin(now * 0.002 + u.id) * s * 0.025;
    if (d.domain === 'air') return Math.sin(now * 0.003 + u.id) * s * 0.05;
    if (u.fortify > 0 || u.sleep) return 0;
    return -Math.abs(Math.sin(now * 0.0025 + u.id * 1.3)) * s * 0.02;
  };
  // surf along shores (added to ground hook)
  var baseGround = GF.hooks.ground;
  GF.hooks.ground = function (ctx, list, now) {
    baseGround.call(this, ctx, list, now);
    if (!GF.settings.anim || this.s < 14) return;
    var m = this.game.map, LIST = G.IDS.terrain.list, D = G.D, s = this.s, t = now * 0.00045;
    for (var i = 0; i < list.length; i += 4) {
      var tile = list[i]; if (!this.visibility(tile)) continue;
      if (!D.TERRAIN[LIST[m.terrain[tile]]].water) continue;
      var x = list[i + 1], y = list[i + 2];
      for (var k = 0; k < 6; k++) {
        var nb = G.Hex.neighbor(tile, k); if (nb < 0 || D.TERRAIN[LIST[m.terrain[nb]]].water) continue;
        var e = GF.edgePts(x, y, s, k);
        for (var w = 0; w < 2; w++) {
          var p = (t + tile * 0.173 + k * 0.31 + w * 0.5) % 1, ins = 0.06 + p * 0.3;
          ctx.strokeStyle = 'rgba(255,255,255,' + (0.45 * (1 - p)) + ')'; ctx.lineWidth = Math.max(1, s * 0.035);
          var ax = e[0] + (x - e[0]) * ins, ay = e[1] + (y - e[1]) * ins, bx = e[2] + (x - e[2]) * ins, by = e[3] + (y - e[3]) * ins;
          ctx.beginPath(); ctx.moveTo(ax, ay); ctx.quadraticCurveTo((ax + bx) / 2 + (x - (ax + bx) / 2) * 0.08, (ay + by) / 2 + (y - (ay + by) / 2) * 0.08, bx, by); ctx.stroke();
        }
      }
    }
  };
})(G.GFX);
