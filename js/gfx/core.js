// ============================================================
//  GFX core: seeded RNG, periodic noise fields, color math, lighting
//  Everything in js/gfx draws procedurally (no image files).
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};
G.GFX = G.GFX || {};
(function (GF) {
  var SQ3 = Math.sqrt(3);
  GF.SQ3 = SQ3;
  GF.TILT = 0.80;
  GF.mk = function (w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; };
  GF.rng = function (seed) { var s = (seed >>> 0) || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 1000003) / 1000003; }; };
  GF.hash = function (str) { var h = 2166136261; str = String(str); for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; };

  // ---- color ----
  GF.rgb = function (hex) {
    if (Array.isArray(hex)) return hex;
    var c = hex.replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    return [parseInt(c.substr(0, 2), 16), parseInt(c.substr(2, 2), 16), parseInt(c.substr(4, 2), 16)];
  };
  GF.css = function (a, alpha) { return alpha == null ? 'rgb(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ')' : 'rgba(' + (a[0] | 0) + ',' + (a[1] | 0) + ',' + (a[2] | 0) + ',' + alpha + ')'; };
  GF.mix = function (a, b, t) { a = GF.rgb(a); b = GF.rgb(b); return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; };
  GF.shade = function (hex, amt) { var a = GF.rgb(hex); return amt > 0 ? GF.css(GF.mix(a, [255, 255, 255], amt)) : GF.css([a[0] * (1 + amt), a[1] * (1 + amt), a[2] * (1 + amt)]); };
  GF.ramp = function (stops) {
    var cs = stops.map(GF.rgb), n = cs.length - 1;
    return function (t) { t = Math.max(0, Math.min(0.9999, t)) * n; var i = Math.floor(t), f = t - i; var a = cs[i], b = cs[i + 1]; return [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f, a[2] + (b[2] - a[2]) * f]; };
  };
  // light from upper-left, slightly toward the viewer
  GF.L = (function () { var x = -0.55, y = -0.62, z = 0.56, l = Math.sqrt(x * x + y * y + z * z); return [x / l, y / l, z / l]; })();

  // ---- periodic noise fields (tile seamlessly over a 1x1 domain) ----
  function makeField(size, cells, octaves, seed) {
    var r = GF.rng(seed), out = new Float32Array(size * size);
    var amp = 1, norm = 0;
    for (var o = 0; o < octaves; o++) {
      var n = cells << o, grid = new Float32Array(n * n);
      for (var i = 0; i < n * n; i++) grid[i] = r();
      for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
        var fx = x / size * n, fy = y / size * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
        tx = tx * tx * (3 - 2 * tx); ty = ty * ty * (3 - 2 * ty);
        var x1 = (ix + 1) % n, y1 = (iy + 1) % n;
        var a = grid[iy * n + ix], b = grid[iy * n + x1], c = grid[y1 * n + ix], d = grid[y1 * n + x1];
        out[y * size + x] += amp * (a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty);
      }
      norm += amp; amp *= 0.5;
    }
    for (i = 0; i < out.length; i++) out[i] /= norm;
    return out;
  }
  var FS = 256;
  var fields = null;
  GF.fields = function () {
    if (!fields) fields = { low: makeField(FS, 4, 4, 1234), mid: makeField(FS, 12, 3, 777), hi: makeField(FS, 48, 2, 4321) };
    return fields;
  };
  // sample a field at domain coords (wraps)
  GF.sample = function (f, u, v) {
    u = u - Math.floor(u); v = v - Math.floor(v);
    var x = u * FS, y = v * FS, ix = x | 0, iy = y | 0, tx = x - ix, ty = y - iy, x1 = (ix + 1) % FS, y1 = (iy + 1) % FS;
    var a = f[iy * FS + ix], b = f[iy * FS + x1], c = f[y1 * FS + ix], d = f[y1 * FS + x1];
    return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
  };
  // hex signed distance (pointy-top, circumradius R) in un-tilted local coords
  GF.hexDist = function (x, y, R) { var ax = Math.abs(x), ay = Math.abs(y); return Math.max(ax, ax * 0.5 + ay * SQ3 / 2) - R * SQ3 / 2; };
  GF.hexPath = function (ctx, cx, cy, s) {
    ctx.beginPath();
    for (var k = 0; k < 6; k++) { var a = Math.PI / 180 * (60 * k - 30); var x = cx + s * Math.cos(a), y = cy + s * Math.sin(a) * GF.TILT; if (k) ctx.lineTo(x, y); else ctx.moveTo(x, y); }
    ctx.closePath();
  };
  GF.edgePts = function (cx, cy, s, k) {
    var a1 = (330 - 60 * k) * Math.PI / 180, a2 = (30 - 60 * k) * Math.PI / 180;
    return [cx + s * Math.cos(a1), cy + s * Math.sin(a1) * GF.TILT, cx + s * Math.cos(a2), cy + s * Math.sin(a2) * GF.TILT];
  };
  GF.shadow = function (ctx, S, k) { k = k || 1; ctx.shadowColor = 'rgba(0,0,0,' + (0.5 * k) + ')'; ctx.shadowBlur = Math.max(1, S * 0.07); ctx.shadowOffsetX = S * 0.03; ctx.shadowOffsetY = S * 0.04; };
  GF.noShadow = function (ctx) { ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetX = 0; ctx.shadowOffsetY = 0; };
  // shaded polygon helper
  GF.poly = function (ctx, pts, fill) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } };
  // lit ellipse blob (for canopies, rocks, bodies)
  GF.blob = function (ctx, x, y, rx, ry, col, light) {
    var g = ctx.createRadialGradient(x - rx * 0.35, y - ry * 0.4, Math.min(rx, ry) * 0.1, x, y, Math.max(rx, ry) * 1.05);
    g.addColorStop(0, GF.shade(col, light == null ? 0.3 : light)); g.addColorStop(0.6, GF.css(GF.rgb(col))); g.addColorStop(1, GF.shade(col, -0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill();
  };
  GF.settings = { anim: true, rich: true };
  try { var st = JSON.parse(localStorage.getItem('aoe_settings') || '{}'); if (st.anim === false) GF.settings.anim = false; if (st.richgfx === false) GF.settings.rich = false; } catch (e) { }
})(G.GFX);
