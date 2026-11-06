// ============================================================
//  Modern-look pass: soft biome blending across hex borders,
//  beaches and shallow-water glow, mountain cast shadows and a
//  global sun/sky colour grade.
// ============================================================
(function (GF) {
  var MEAN = { grassland: '82,143,52', plains: '168,156,80', desert: '214,184,120', tundra: '138,144,120', snow: '232,238,242', coast: '58,150,190', ocean: '24,74,126', lake: '58,144,192', mountain: '122,114,104', hills: '110,120,70' };
  var WATER = { coast: 1, ocean: 1, lake: 1 };
  function cls(m, LIST, t) { var k = LIST[m.terrain[t]]; return (m.hills[t] && !WATER[k] && k !== 'mountain') ? 'hills' : k; }
  var baseGround = GF.hooks.ground, baseOverlay = GF.hooks.overlay;

  GF.hooks.ground = function (ctx, list, now) {
    if (baseGround) baseGround.call(this, ctx, list, now);
    var m = this.game.map, LIST = G.IDS.terrain.list, s = this.s;
    if (s < 10) return;
    var self = this, ww = this.worldW();
    for (var i = 0; i < list.length; i += 4) {
      var t = list[i]; if (!this.visibility(t)) continue;
      var x = list[i + 1], y = list[i + 2], tk = LIST[m.terrain[t]], c0 = cls(m, LIST, t), water = WATER[tk];
      var nb = G.Hex.neighbors(t), clipped = false;
      for (var k = 0; k < nb.length; k++) {
        var n = nb[k]; if (!this.visibility(n)) continue;
        var nk = LIST[m.terrain[n]], c1 = cls(m, LIST, n);
        if (nk === 'mountain' || tk === 'mountain') continue;
        var col, a;
        if (water && WATER[nk]) { if (c0 === c1) continue; col = MEAN[c1]; a = 0.55; }
        else if (water && !WATER[nk]) { col = '120,226,214'; a = tk === 'ocean' ? 0.0 : 0.38; if (!a) continue; }
        else if (!water && WATER[nk]) { col = '226,208,150'; a = 0.5; }
        else { if (c0 === c1) continue; col = MEAN[c1]; a = 0.6; }
        var p = this.tileScreen(n), dx = p.x - x, dy = p.y - y;
        dx -= Math.round(dx / ww) * ww;
        if (!clipped) { ctx.save(); GF.hexPath(ctx, x, y, s + 0.5); ctx.clip(); clipped = true; }
        var g = ctx.createLinearGradient(x + dx * 0.5, y + dy * 0.5, x + dx * 0.05, y + dy * 0.05);
        g.addColorStop(0, 'rgba(' + col + ',' + a + ')'); g.addColorStop(1, 'rgba(' + col + ',0)');
        ctx.fillStyle = g; ctx.fillRect(x - s * 1.2, y - s * 1.2, s * 2.4, s * 2.4);
      }
      if (clipped) ctx.restore();
    }
    // mountain / hill cast shadows (sun from the upper-left)
    for (i = 0; i < list.length; i += 4) {
      t = list[i]; if (!this.visibility(t)) continue;
      var tk2 = LIST[m.terrain[t]], big = tk2 === 'mountain', hl = m.hills[t] && !WATER[tk2];
      if (!big && !hl) continue;
      var sx = list[i + 1] + s * (big ? 0.55 : 0.3), sy = list[i + 2] + s * (big ? 0.35 : 0.2), R = s * (big ? 1.15 : 0.7);
      var sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, R);
      sg.addColorStop(0, 'rgba(10,14,30,' + (big ? 0.34 : 0.16) + ')'); sg.addColorStop(1, 'rgba(10,14,30,0)');
      ctx.save(); ctx.translate(sx, sy); ctx.scale(1.25, 0.7); ctx.translate(-sx, -sy); ctx.fillStyle = sg; ctx.fillRect(sx - R, sy - R, R * 2, R * 2); ctx.restore();
    }
  };

  GF.hooks.overlay = function (ctx, list, now) {
    if (baseOverlay) baseOverlay.call(this, ctx, list, now);
    var W = this.cw, H = this.ch;
    ctx.save();
    ctx.globalCompositeOperation = 'soft-light';
    var g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, 'rgba(255,226,170,0.34)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,80,160,0.38)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    // tilt-shift style: far (top) hazier and cooler, near (bottom) warmer and crisper
    ctx.globalCompositeOperation = 'source-over';
    var h = ctx.createLinearGradient(0, 0, 0, H * 0.35); h.addColorStop(0, 'rgba(150,175,215,0.16)'); h.addColorStop(1, 'rgba(150,175,215,0)');
    ctx.fillStyle = h; ctx.fillRect(0, 0, W, H * 0.35);
    ctx.restore();
  };
})(G.GFX);
