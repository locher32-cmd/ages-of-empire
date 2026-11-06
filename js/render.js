// ============================================================
//  Renderer: 3/4-view hex map, procedural "Warcraft III"-style
//  terrain, forests, mountains, cities by era, unit figures.
//  Sprites are drawn once per zoom bucket and cached.
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Render = (function () {
  var D = G.D, IDS = G.IDS, Hex = G.Hex, R = G.Rules, E = G.Engine;
  var SQ3 = Math.sqrt(3), TILT = 0.80;
  var BUCKETS = [9, 12, 15, 19, 24, 30, 37, 45, 55, 67, 80];

  function mkCanvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, Math.ceil(w)); c.height = Math.max(1, Math.ceil(h)); return c; }
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s ^= s << 13; s >>>= 0; s ^= s >> 17; s ^= s << 5; s >>>= 0; return (s % 100000) / 100000; }; }
  function shade(hex, amt) {
    var c = hex.replace('#', ''); if (c.length === 3) c = c[0] + c[0] + c[1] + c[1] + c[2] + c[2];
    var r = parseInt(c.substr(0, 2), 16), g = parseInt(c.substr(2, 2), 16), b = parseInt(c.substr(4, 2), 16);
    if (amt > 0) { r += (255 - r) * amt; g += (255 - g) * amt; b += (255 - b) * amt; } else { r *= 1 + amt; g *= 1 + amt; b *= 1 + amt; }
    return 'rgb(' + (r | 0) + ',' + (g | 0) + ',' + (b | 0) + ')';
  }
  function shadeHex(hex, amt) { var r = shade(hex, amt).match(/\d+/g); return '#' + r.map(function (v) { v = Math.max(0, Math.min(255, +v)); return (v < 16 ? '0' : '') + v.toString(16); }).join(''); }
  function softShadow(ctx, S) { ctx.shadowColor = 'rgba(0,0,0,0.55)'; ctx.shadowBlur = Math.max(1, S * 0.08); ctx.shadowOffsetX = S * 0.03; ctx.shadowOffsetY = S * 0.04; }
  function hexPath(ctx, cx, cy, s, inset) {
    var r = s - (inset || 0);
    ctx.beginPath();
    for (var k = 0; k < 6; k++) {
      var a = (Math.PI / 180) * (60 * k - 30);
      var x = cx + r * Math.cos(a), y = cy + r * Math.sin(a) * TILT;
      if (k === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
  }
  // corner angle (deg) for edge k: [330-60k, 30-60k]
  function edgePts(cx, cy, s, k) {
    var a1 = (330 - 60 * k) * Math.PI / 180, a2 = (30 - 60 * k) * Math.PI / 180;
    return [cx + s * Math.cos(a1), cy + s * Math.sin(a1) * TILT, cx + s * Math.cos(a2), cy + s * Math.sin(a2) * TILT];
  }

  // ------------------------------------------------------------
  //  Sprite painters
  // ------------------------------------------------------------
  var P = {};
  P.ground = function (S, tk, fk, variant, hills) {
    var w = SQ3 * S + 2, h = 2 * S * TILT + 2, c = mkCanvas(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h / 2, T = D.TERRAIN[tk];
    var r = rng(variant * 7919 + tk.length * 131 + 17);
    hexPath(ctx, cx, cy, S + Math.max(1, S * 0.03));
    ctx.save(); ctx.clip();
    var base = shadeHex(T.color, (variant - 1.5) * 0.035), base2 = shadeHex(T.color2, (variant - 1.5) * 0.035);
    if (fk === 'floodplains') { base = '#b7b05a'; base2 = '#9c9a48'; }
    var gr = ctx.createLinearGradient(0, 0, w * 0.3, h);
    gr.addColorStop(0, shade(base, 0.12)); gr.addColorStop(1, shade(base2, -0.08));
    ctx.fillStyle = gr; ctx.fillRect(0, 0, w, h);
    // texture
    var n = Math.round(S * S / 18);
    for (var i = 0; i < n; i++) {
      var x = r() * w, y = r() * h, l = S * (0.05 + r() * 0.12);
      if (tk === 'grassland' || tk === 'plains') {
        ctx.strokeStyle = r() < 0.5 ? shade(base, -0.18) : shade(base, 0.18); ctx.lineWidth = Math.max(0.6, S / 30);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l * 0.3, y - l); ctx.stroke();
      } else if (tk === 'desert') {
        if (i % 6 === 0) { ctx.strokeStyle = shade(base, -0.12); ctx.lineWidth = Math.max(0.6, S / 22); ctx.beginPath(); ctx.arc(x, y + S * 0.3, S * 0.35, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); }
        ctx.fillStyle = shade(base, r() < 0.5 ? 0.1 : -0.06); ctx.fillRect(x, y, 1, 1);
      } else if (tk === 'tundra') {
        ctx.fillStyle = r() < 0.5 ? shade(base, -0.2) : shade(base, 0.25); ctx.fillRect(x, y, S / 18 + 0.5, S / 18 + 0.5);
      } else if (tk === 'snow') {
        ctx.strokeStyle = 'rgba(150,175,205,0.35)'; ctx.lineWidth = Math.max(0.6, S / 25);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l, y - l * 0.3, x + l * 2, y); ctx.stroke();
      } else if (T.water) {
        if (i % 3 === 0) {
          ctx.strokeStyle = tk === 'ocean' ? 'rgba(120,170,220,0.35)' : 'rgba(200,235,255,0.35)'; ctx.lineWidth = Math.max(0.6, S / 28);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + l, y - l * 0.6, x + l * 2, y); ctx.stroke();
        }
      } else if (tk === 'mountain') {
        ctx.fillStyle = shade(base, r() < 0.5 ? -0.2 : 0.1); ctx.fillRect(x, y, S / 14, S / 14);
      }
    }
    if (T.water) {
      for (i = 0; i < 5; i++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.15 + r() * 0.25) + ')'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, S * 0.05, S * 0.015, 0, 0, Math.PI * 2); ctx.fill(); }
      if (tk === 'ocean') for (i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(0,20,50,0.18)'; ctx.beginPath(); ctx.ellipse(r() * w, r() * h, S * 0.5, S * 0.25, r() * 3, 0, Math.PI * 2); ctx.fill(); }
    } else if (tk === 'grassland' || tk === 'plains') {
      for (i = 0; i < 4; i++) { ctx.fillStyle = ['#f5e663', '#ffffff', '#e9a3d0', '#d6f08a'][i]; ctx.globalAlpha = 0.55; ctx.beginPath(); ctx.arc(r() * w, r() * h, Math.max(0.6, S * 0.025), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (fk === 'floodplains') {
      ctx.strokeStyle = 'rgba(90,130,40,0.5)'; ctx.lineWidth = S / 12;
      for (i = 0; i < 3; i++) { var yy = cy - S * 0.4 + i * S * 0.35; ctx.beginPath(); ctx.moveTo(cx - S, yy); ctx.quadraticCurveTo(cx, yy + S * 0.15, cx + S, yy); ctx.stroke(); }
    }
    if (fk === 'marsh') {
      for (i = 0; i < 4; i++) {
        var mx = cx + (r() - 0.5) * S * 1.2, my = cy + (r() - 0.5) * S * 0.9;
        ctx.fillStyle = 'rgba(60,110,120,0.7)'; ctx.beginPath(); ctx.ellipse(mx, my, S * 0.22, S * 0.1, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = '#4a6a2a'; ctx.lineWidth = Math.max(0.7, S / 26);
        for (var j = 0; j < 4; j++) { var rx = mx + (r() - 0.5) * S * 0.4; ctx.beginPath(); ctx.moveTo(rx, my); ctx.lineTo(rx + (r() - 0.5) * S * 0.08, my - S * 0.2); ctx.stroke(); }
      }
    }
    if (fk === 'oasis') { ctx.fillStyle = '#3a9ac4'; ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.1, S * 0.4, S * 0.22, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#7fd0f0'; ctx.lineWidth = S / 20; ctx.stroke(); }
    if (fk === 'ice') {
      ctx.fillStyle = 'rgba(235,245,255,0.92)'; ctx.fillRect(0, 0, w, h);
      for (i = 0; i < 6; i++) { ctx.strokeStyle = 'rgba(140,180,220,0.6)'; ctx.lineWidth = S / 25; ctx.beginPath(); var ix = r() * w, iy = r() * h; ctx.moveTo(ix, iy); ctx.lineTo(ix + S * 0.4 * (r() - 0.5), iy + S * 0.3); ctx.stroke(); }
    }
    if (fk === 'atoll') { ctx.strokeStyle = '#e8d9a0'; ctx.lineWidth = S / 7; ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.45, S * 0.28, 0, 0, Math.PI * 1.7); ctx.stroke(); }
    if (fk === 'fallout') { ctx.fillStyle = 'rgba(120,200,40,0.35)'; ctx.fillRect(0, 0, w, h); }
    // lighting vignette
    var rg = ctx.createRadialGradient(cx - S * 0.3, cy - S * 0.4, S * 0.2, cx, cy, S * 1.2);
    rg.addColorStop(0, 'rgba(255,255,230,0.10)'); rg.addColorStop(1, 'rgba(0,0,0,0.18)');
    ctx.fillStyle = rg; ctx.fillRect(0, 0, w, h);
    ctx.restore();
    // edge
    hexPath(ctx, cx, cy, S); ctx.strokeStyle = T.water ? 'rgba(0,30,60,0.07)' : 'rgba(0,0,0,0.07)'; ctx.lineWidth = Math.max(0.5, S / 50); ctx.stroke();
    return { c: c, ax: cx, ay: cy };
  };

  function tree(ctx, x, y, S, kind, r) {
    var h = S * (0.32 + r() * 0.12);
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x + h * 0.15, y, h * 0.35, h * 0.12, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#4a3020'; ctx.fillRect(x - h * 0.05, y - h * 0.3, h * 0.1, h * 0.3);
    if (kind === 'conifer') {
      for (var k = 0; k < 3; k++) {
        var ty = y - h * 0.25 - k * h * 0.28, tw = h * (0.42 - k * 0.1);
        var g = ctx.createLinearGradient(x - tw, 0, x + tw, 0); g.addColorStop(0, '#3d7a3a'); g.addColorStop(1, '#173f1d');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - tw, ty); ctx.lineTo(x, ty - h * 0.45); ctx.lineTo(x + tw, ty); ctx.closePath(); ctx.fill();
      }
    } else if (kind === 'palm') {
      ctx.strokeStyle = '#6b4a2a'; ctx.lineWidth = h * 0.09; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + h * 0.15, y - h * 0.5, x + h * 0.05, y - h); ctx.stroke();
      ctx.fillStyle = '#2f7d32';
      for (k = 0; k < 5; k++) { var a = k * 1.25; ctx.beginPath(); ctx.ellipse(x + h * 0.05 + Math.cos(a) * h * 0.25, y - h + Math.sin(a) * h * 0.1, h * 0.28, h * 0.08, a, 0, Math.PI * 2); ctx.fill(); }
    } else {
      var g2 = ctx.createRadialGradient(x - h * 0.15, y - h * 0.75, h * 0.05, x, y - h * 0.6, h * 0.5);
      var dark = kind === 'jungle';
      g2.addColorStop(0, dark ? '#4f9a3a' : '#79b84a'); g2.addColorStop(1, dark ? '#164a1a' : '#2c6324');
      ctx.fillStyle = g2;
      ctx.beginPath(); ctx.arc(x, y - h * 0.6, h * 0.38, 0, Math.PI * 2); ctx.arc(x - h * 0.22, y - h * 0.45, h * 0.26, 0, Math.PI * 2); ctx.arc(x + h * 0.22, y - h * 0.45, h * 0.26, 0, Math.PI * 2); ctx.fill();
    }
  }
  P.tall = function (S, tk, fk, variant, hills, nw) {
    var w = SQ3 * S * 1.2, h = S * 3.2, c = mkCanvas(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.7, r = rng(variant * 104729 + (fk || '').length * 7 + 3);
    if (tk === 'mountain' || nw) { ctx.fillStyle = 'rgba(0,0,0,0.28)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.1, cy + S * 0.22, S * 0.95, S * 0.32, 0, 0, Math.PI * 2); ctx.fill(); }
    softShadow(ctx, S);
    if (hills) {
      for (var k = 0; k < 3; k++) {
        var hx = cx + (k - 1) * S * 0.5 + (r() - 0.5) * S * 0.2, hy = cy + (k === 1 ? -S * 0.15 : S * 0.12), hw = S * (0.45 + r() * 0.15), hh = S * (0.35 + r() * 0.15);
        var base = D.TERRAIN[tk].color;
        var g = ctx.createLinearGradient(hx - hw, hy - hh, hx + hw, hy);
        g.addColorStop(0, shade(base, 0.22)); g.addColorStop(0.55, shade(base, -0.05)); g.addColorStop(1, shade(base, -0.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(hx - hw, hy); ctx.quadraticCurveTo(hx - hw * 0.3, hy - hh * 1.6, hx, hy - hh); ctx.quadraticCurveTo(hx + hw * 0.5, hy - hh * 1.1, hx + hw, hy); ctx.closePath(); ctx.fill();
      }
    }
    if (tk === 'mountain' || (nw && D.NATURAL_WONDERS[nw].terrainLike === 'mountain')) {
      var peaks = nw ? 1 : 3;
      for (k = 0; k < peaks; k++) {
        var px = cx + (peaks === 1 ? 0 : (k - 1) * S * 0.55) + (r() - 0.5) * S * 0.15, py = cy + (k === 1 ? -S * 0.05 : S * 0.2);
        var pw = S * (peaks === 1 ? 0.85 : 0.55 + r() * 0.15), ph = S * (peaks === 1 ? 1.6 : 1.0 + r() * 0.5) * (k === 1 ? 1.15 : 1);
        var rock = nw === 'uluru' ? '#c0542a' : nw === 'grand_mesa' ? '#b8693a' : '#8d857a';
        ctx.fillStyle = shade(rock, 0.15); ctx.beginPath(); ctx.moveTo(px - pw, py); ctx.lineTo(px - pw * 0.08, py - ph); ctx.lineTo(px + pw * 0.1, py); ctx.closePath(); ctx.fill();
        ctx.fillStyle = shade(rock, -0.32); ctx.beginPath(); ctx.moveTo(px - pw * 0.08, py - ph); ctx.lineTo(px + pw, py); ctx.lineTo(px + pw * 0.1, py); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(40,30,20,0.35)'; ctx.lineWidth = S / 30;
        ctx.beginPath(); ctx.moveTo(px - pw * 0.08, py - ph); ctx.lineTo(px + pw * 0.15, py - ph * 0.45); ctx.lineTo(px - pw * 0.1, py - ph * 0.2); ctx.stroke();
        if (nw !== 'uluru' && nw !== 'grand_mesa') {
          ctx.fillStyle = '#f4f7fa'; ctx.beginPath(); ctx.moveTo(px - pw * 0.08, py - ph); ctx.lineTo(px - pw * 0.33, py - ph * 0.68); ctx.lineTo(px - pw * 0.15, py - ph * 0.74); ctx.lineTo(px - pw * 0.02, py - ph * 0.62); ctx.lineTo(px + pw * 0.25, py - ph * 0.72); ctx.closePath(); ctx.fill();
        }
      }
      if (nw) { ctx.fillStyle = 'rgba(255,215,90,0.25)'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.5, S * 1.0, S * 1.1, 0, 0, Math.PI * 2); ctx.fill(); }
    } else if (nw) {
      // water or flat natural wonder: coral / falls / spring
      for (k = 0; k < 9; k++) { ctx.fillStyle = ['#ff7a8a', '#ffd25a', '#7ae0c0', '#c38bff'][k % 4]; ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * S * 1.2, cy - S * 0.2 + (r() - 0.5) * S * 0.6, S * 0.12, 0, Math.PI * 2); ctx.fill(); }
      ctx.fillStyle = 'rgba(255,215,90,0.3)'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.2, S * 0.9, S * 0.6, 0, 0, Math.PI * 2); ctx.fill();
    }
    if (fk === 'forest' || fk === 'jungle') {
      var kind = fk === 'jungle' ? 'jungle' : (tk === 'tundra' || tk === 'snow' || hills) ? 'conifer' : 'leaf';
      var pts = [];
      var nT = S < 14 ? 4 : 7;
      for (k = 0; k < nT; k++) pts.push([cx + (r() - 0.5) * S * 1.3, cy - S * 0.15 + (r() - 0.4) * S * 0.9 * TILT]);
      pts.sort(function (a, b) { return a[1] - b[1]; });
      pts.forEach(function (q) { tree(ctx, q[0], q[1], S, kind === 'jungle' && r() < 0.3 ? 'palm' : kind, r); });
    }
    if (fk === 'oasis') { tree(ctx, cx - S * 0.35, cy - S * 0.05, S, 'palm', r); tree(ctx, cx + S * 0.3, cy + S * 0.05, S, 'palm', r); }
    if (fk === 'atoll') tree(ctx, cx + S * 0.2, cy, S, 'palm', r);
    return { c: c, ax: cx, ay: cy };
  };

  P.improvement = function (S, ik, pillaged) {
    var w = S * 2, h = S * 2, c = mkCanvas(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.6, r = rng(ik.length * 31 + 7);
    ctx.lineCap = 'round'; softShadow(ctx, S * 0.7);
    function hut(x, y, sz, wall, roof) {
      ctx.fillStyle = wall; ctx.fillRect(x - sz * 0.5, y - sz * 0.6, sz, sz * 0.6);
      ctx.fillStyle = roof; ctx.beginPath(); ctx.moveTo(x - sz * 0.65, y - sz * 0.55); ctx.lineTo(x, y - sz * 1.1); ctx.lineTo(x + sz * 0.65, y - sz * 0.55); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.fillRect(x - sz * 0.1, y - sz * 0.3, sz * 0.2, sz * 0.3);
    }
    switch (ik) {
      case 'farm': case 'terrace_farm': case 'polder': case 'ziggurat_farm':
        for (var k = 0; k < 5; k++) { ctx.strokeStyle = k % 2 ? '#d8c25a' : '#9a8a2a'; ctx.lineWidth = S * 0.09; ctx.beginPath(); ctx.moveTo(cx - S * 0.55, cy - S * 0.35 + k * S * 0.13); ctx.lineTo(cx + S * 0.55, cy - S * 0.42 + k * S * 0.13); ctx.stroke(); }
        if (ik === 'polder') { ctx.strokeStyle = '#5ab0d0'; ctx.lineWidth = S * 0.06; ctx.strokeRect(cx - S * 0.6, cy - S * 0.45, S * 1.2, S * 0.7); }
        break;
      case 'mine':
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(cx, cy - S * 0.1, S * 0.25, Math.PI, 0); ctx.lineTo(cx + S * 0.25, cy); ctx.lineTo(cx - S * 0.25, cy); ctx.fill();
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = S * 0.07; ctx.beginPath(); ctx.moveTo(cx - S * 0.3, cy); ctx.lineTo(cx - S * 0.28, cy - S * 0.38); ctx.lineTo(cx + S * 0.28, cy - S * 0.38); ctx.lineTo(cx + S * 0.3, cy); ctx.stroke();
        ctx.fillStyle = '#777'; ctx.fillRect(cx + S * 0.35, cy - S * 0.12, S * 0.25, S * 0.12);
        break;
      case 'pasture':
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = S * 0.05;
        ctx.strokeRect(cx - S * 0.5, cy - S * 0.4, S, S * 0.45);
        for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx - S * 0.5 + k * S * 0.25, cy - S * 0.47); ctx.lineTo(cx - S * 0.5 + k * S * 0.25, cy + S * 0.05); ctx.stroke(); }
        break;
      case 'plantation':
        for (k = 0; k < 6; k++) { ctx.fillStyle = '#2e6a28'; ctx.beginPath(); ctx.arc(cx - S * 0.45 + (k % 3) * S * 0.45, cy - S * 0.3 + Math.floor(k / 3) * S * 0.3, S * 0.13, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'camp':
        ctx.fillStyle = '#a07a4a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.35, cy); ctx.lineTo(cx, cy - S * 0.55); ctx.lineTo(cx + S * 0.35, cy); ctx.fill();
        ctx.fillStyle = '#5a3a1a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.08, cy); ctx.lineTo(cx, cy - S * 0.3); ctx.lineTo(cx + S * 0.08, cy); ctx.fill();
        break;
      case 'quarry':
        for (k = 0; k < 4; k++) { ctx.fillStyle = k % 2 ? '#bdb5a5' : '#9a9282'; ctx.fillRect(cx - S * 0.45 + k * S * 0.22, cy - S * 0.25 - (k % 2) * S * 0.15, S * 0.2, S * 0.2); }
        break;
      case 'fishing_boats': case 'offshore_platform':
        if (ik === 'offshore_platform') { ctx.fillStyle = '#666'; ctx.fillRect(cx - S * 0.3, cy - S * 0.4, S * 0.6, S * 0.12); ctx.fillRect(cx - S * 0.25, cy - S * 0.3, S * 0.06, S * 0.35); ctx.fillRect(cx + S * 0.2, cy - S * 0.3, S * 0.06, S * 0.35); break; }
        ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.35, cy - S * 0.15); ctx.lineTo(cx + S * 0.35, cy - S * 0.15); ctx.lineTo(cx + S * 0.25, cy); ctx.lineTo(cx - S * 0.25, cy); ctx.fill();
        ctx.fillStyle = '#f0f0e0'; ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.65); ctx.lineTo(cx, cy - S * 0.18); ctx.lineTo(cx + S * 0.3, cy - S * 0.2); ctx.fill();
        break;
      case 'oil_well':
        ctx.strokeStyle = '#222'; ctx.lineWidth = S * 0.06; ctx.beginPath(); ctx.moveTo(cx - S * 0.25, cy); ctx.lineTo(cx, cy - S * 0.7); ctx.lineTo(cx + S * 0.25, cy); ctx.moveTo(cx - S * 0.15, cy - S * 0.3); ctx.lineTo(cx + S * 0.15, cy - S * 0.3); ctx.stroke();
        break;
      case 'lumber_mill': hut(cx, cy, S * 0.55, '#8a5a2a', '#5a3a1a'); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(cx + S * 0.3, cy - S * 0.12, S * 0.4, S * 0.1); ctx.fillRect(cx + S * 0.3, cy - S * 0.24, S * 0.4, S * 0.1); break;
      case 'trading_post': hut(cx, cy, S * 0.5, '#b08a5a', '#7a3a2a'); ctx.strokeStyle = '#333'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(cx + S * 0.35, cy); ctx.lineTo(cx + S * 0.35, cy - S * 0.7); ctx.stroke(); ctx.fillStyle = '#d4a62a'; ctx.fillRect(cx + S * 0.35, cy - S * 0.7, S * 0.25, S * 0.15); break;
      case 'fort': case 'citadel': case 'kasbah':
        ctx.fillStyle = ik === 'citadel' ? '#8a8a8a' : ik === 'kasbah' ? '#c8955a' : '#7a5a3a';
        for (k = 0; k < 7; k++) ctx.fillRect(cx - S * 0.55 + k * S * 0.16, cy - S * 0.4 - (k % 2) * S * 0.08, S * 0.13, S * 0.4 + (k % 2) * S * 0.08);
        if (ik === 'citadel') { ctx.fillStyle = '#b22'; ctx.fillRect(cx - S * 0.02, cy - S * 0.85, S * 0.25, S * 0.15); ctx.fillStyle = '#555'; ctx.fillRect(cx - S * 0.04, cy - S * 0.85, S * 0.04, S * 0.45); }
        break;
      case 'academy': hut(cx, cy, S * 0.7, '#e8e0d0', '#3a5aa0'); break;
      case 'manufactory': hut(cx, cy, S * 0.7, '#9a5a3a', '#4a4a4a'); ctx.fillStyle = '#555'; ctx.fillRect(cx + S * 0.25, cy - S * 0.85, S * 0.12, S * 0.45); break;
      case 'customs_house': hut(cx, cy, S * 0.7, '#e0c070', '#8a2a2a'); break;
      case 'holy_site': hut(cx, cy, S * 0.65, '#f0f0f0', '#d4a62a'); ctx.fillStyle = '#d4a62a'; ctx.beginPath(); ctx.arc(cx, cy - S * 0.85, S * 0.08, 0, Math.PI * 2); ctx.fill(); break;
      case 'landmark': ctx.fillStyle = '#d8d0c0'; ctx.fillRect(cx - S * 0.1, cy - S * 0.8, S * 0.2, S * 0.8); ctx.fillStyle = '#d4a62a'; ctx.beginPath(); ctx.arc(cx, cy - S * 0.85, S * 0.12, 0, Math.PI * 2); ctx.fill(); break;
      case 'moai': ctx.fillStyle = '#6a6a6a'; ctx.fillRect(cx - S * 0.15, cy - S * 0.7, S * 0.3, S * 0.7); ctx.fillStyle = '#4a4a4a'; ctx.fillRect(cx - S * 0.2, cy - S * 0.75, S * 0.4, S * 0.12); break;
      case 'chateau': hut(cx, cy, S * 0.8, '#efe6d0', '#3a4a8a'); break;
      case 'feitoria': hut(cx, cy, S * 0.6, '#f0e0c0', '#a03a2a'); break;
      case 'kampung': hut(cx - S * 0.25, cy, S * 0.4, '#a07a4a', '#6a4a2a'); hut(cx + S * 0.25, cy, S * 0.4, '#a07a4a', '#6a4a2a'); break;
      case 'barb_camp':
        for (k = 0; k < 3; k++) { var tx = cx + (k - 1) * S * 0.38; ctx.fillStyle = k === 1 ? '#7a4a2a' : '#5a3a1a'; ctx.beginPath(); ctx.moveTo(tx - S * 0.22, cy); ctx.lineTo(tx, cy - S * 0.45); ctx.lineTo(tx + S * 0.22, cy); ctx.fill(); }
        ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.4); ctx.lineTo(cx, cy - S * 0.95); ctx.stroke();
        ctx.fillStyle = '#c02020'; ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.95); ctx.lineTo(cx + S * 0.35, cy - S * 0.85); ctx.lineTo(cx, cy - S * 0.72); ctx.fill();
        ctx.fillStyle = '#ff9a2a'; ctx.beginPath(); ctx.arc(cx, cy + S * 0.12, S * 0.08, 0, Math.PI * 2); ctx.fill();
        break;
      case 'city_ruins': case 'ruins':
        for (k = 0; k < 4; k++) { ctx.fillStyle = '#b8b0a0'; var rh = S * (0.25 + r() * 0.35); ctx.fillRect(cx - S * 0.45 + k * S * 0.28, cy - rh, S * 0.12, rh); }
        ctx.fillStyle = '#a09888'; ctx.fillRect(cx - S * 0.5, cy - S * 0.05, S, S * 0.08);
        break;
    }
    if (pillaged) { ctx.strokeStyle = '#c02020'; ctx.lineWidth = S * 0.08; ctx.beginPath(); ctx.moveTo(cx - S * 0.3, cy - S * 0.5); ctx.lineTo(cx + S * 0.3, cy); ctx.moveTo(cx + S * 0.3, cy - S * 0.5); ctx.lineTo(cx - S * 0.3, cy); ctx.stroke(); }
    return { c: c, ax: cx, ay: cy };
  };

  // ---------------- Cities ----------------
  var ERA_STYLE = [
    { wall: '#c9a777', roof: '#8a6a3a', roof2: '#a0783a' },
    { wall: '#e8e0d0', roof: '#b0482a', roof2: '#c45a32' },
    { wall: '#bfb4a2', roof: '#5a4a3a', roof2: '#7a3a2a' },
    { wall: '#d8cdb8', roof: '#3a5a8a', roof2: '#4a6aa0' },
    { wall: '#9a5040', roof: '#4a4a4a', roof2: '#5a5a5a' },
    { wall: '#c8c8c8', roof: '#606a74', roof2: '#7a848e' },
    { wall: '#d8dde2', roof: '#5a7a9a', roof2: '#7a9aba' },
    { wall: '#e4ecf2', roof: '#3a8ab8', roof2: '#5aa8d8' }
  ];
  P.city = function (S, era, size, walls, capital, col, variant) {
    var w = S * 3, h = S * 3.2, c = mkCanvas(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.68, r = rng(variant * 37 + 11), st = ERA_STYLE[Math.min(7, era)];
    // ground plaza
    var pg = ctx.createRadialGradient(cx, cy, S * 0.2, cx, cy, S * 1.05); pg.addColorStop(0, 'rgba(150,125,90,0.75)'); pg.addColorStop(1, 'rgba(120,100,70,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(cx, cy, S * 1.05, S * 0.7, 0, 0, Math.PI * 2); ctx.fill();
    softShadow(ctx, S);
    var n = Math.min(14, 3 + Math.floor(size * 0.9));
    var bl = [];
    for (var k = 0; k < n; k++) { var a = r() * Math.PI * 2, d = Math.sqrt(r()) * S * 0.75; bl.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * 0.55, r()]); }
    if (era >= 4) bl.push([cx + S * 0.2, cy - S * 0.1, 2]);
    bl.sort(function (a, b) { return a[1] - b[1]; });
    bl.forEach(function (b, i) {
      var x = b[0], y = b[1], tall = era >= 5 && b[2] > 0.55;
      var bw = S * (0.22 + b[2] * 0.12), bh = S * (0.2 + b[2] * 0.15) * (tall ? 2.6 + era * 0.25 : 1);
      if (b[2] === 2) { // smokestack
        ctx.fillStyle = '#5a3a30'; ctx.fillRect(x - S * 0.05, y - S * 1.1, S * 0.1, S * 1.1);
        ctx.fillStyle = 'rgba(80,80,80,0.5)'; ctx.beginPath(); ctx.arc(x + S * 0.1, y - S * 1.25, S * 0.12, 0, Math.PI * 2); ctx.arc(x + S * 0.25, y - S * 1.38, S * 0.09, 0, Math.PI * 2); ctx.fill();
        return;
      }
      // side wall shading
      ctx.fillStyle = shade(st.wall, -0.25); ctx.fillRect(x, y - bh, bw * 0.5, bh);
      ctx.fillStyle = st.wall; ctx.fillRect(x - bw * 0.5, y - bh, bw * 0.5, bh);
      if (tall) {
        ctx.fillStyle = 'rgba(120,180,220,0.6)';
        for (var f = 0; f < bh / (S * 0.12) - 1; f++) { ctx.fillRect(x - bw * 0.4, y - bh + S * 0.06 + f * S * 0.12, bw * 0.3, S * 0.05); ctx.fillRect(x + bw * 0.08, y - bh + S * 0.06 + f * S * 0.12, bw * 0.3, S * 0.05); }
        ctx.fillStyle = st.roof; ctx.fillRect(x - bw * 0.55, y - bh - S * 0.04, bw * 1.1, S * 0.05);
      } else {
        ctx.fillStyle = i % 3 ? st.roof : st.roof2;
        ctx.beginPath(); ctx.moveTo(x - bw * 0.65, y - bh); ctx.lineTo(x, y - bh - bw * 0.55); ctx.lineTo(x + bw * 0.65, y - bh); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(30,20,10,0.55)'; ctx.fillRect(x - bw * 0.12, y - bh * 0.45, bw * 0.18, bh * 0.45);
      }
    });
    // temple/palace landmark
    if (capital) {
      var px = cx - S * 0.1, py = cy - S * 0.05;
      ctx.fillStyle = shade(st.wall, 0.1); ctx.fillRect(px - S * 0.3, py - S * 0.45, S * 0.6, S * 0.45);
      ctx.fillStyle = shade(st.wall, -0.2); for (k = 0; k < 4; k++) ctx.fillRect(px - S * 0.26 + k * S * 0.16, py - S * 0.42, S * 0.05, S * 0.4);
      if (era >= 3) { ctx.fillStyle = st.roof2; ctx.beginPath(); ctx.arc(px, py - S * 0.45, S * 0.22, Math.PI, 0); ctx.fill(); }
      else { ctx.fillStyle = st.roof; ctx.beginPath(); ctx.moveTo(px - S * 0.38, py - S * 0.45); ctx.lineTo(px, py - S * 0.72); ctx.lineTo(px + S * 0.38, py - S * 0.45); ctx.fill(); }
      ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.arc(px, py - (era >= 3 ? S * 0.7 : S * 0.78), S * 0.06, 0, Math.PI * 2); ctx.fill();
    }
    ctx.shadowColor = 'transparent';
    [[-0.62, -0.05], [0.58, 0.02]].forEach(function (f, i) {
      var fx = cx + f[0] * S, fy = cy + f[1] * S;
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1, S * 0.035); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - S * 0.85); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx, fy - S * 0.85); ctx.quadraticCurveTo(fx + S * 0.2, fy - S * 0.9, fx + S * 0.34, fy - S * 0.76); ctx.quadraticCurveTo(fx + S * 0.18, fy - S * 0.68, fx, fy - S * 0.62); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.25)'; ctx.fillRect(fx, fy - S * 0.84, S * 0.3, S * 0.04);
    });
    softShadow(ctx, S);
    if (walls) {
      ctx.strokeStyle = era >= 2 ? '#8a8478' : '#9a7a52'; ctx.lineWidth = S * 0.11;
      ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.05, S * 1.05, S * 0.68, 0, Math.PI * 0.05, Math.PI * 0.95); ctx.stroke();
      for (k = 0; k < 5; k++) { var ta = Math.PI * (0.1 + k * 0.2); ctx.fillStyle = era >= 2 ? '#7a7468' : '#8a6a42'; ctx.fillRect(cx + Math.cos(ta) * S * 1.05 - S * 0.08, cy + S * 0.05 + Math.sin(ta) * S * 0.68 - S * 0.25, S * 0.16, S * 0.28); }
    }
    return { c: c, ax: cx, ay: cy };
  };

  // ---------------- Units ----------------
  function unitKind(id, d) {
    var name = d.name.toLowerCase();
    if (d.domain === 'air') return d.cls === 'nuke' ? 'missile' : (/bomber/.test(name) ? 'bomber' : 'plane');
    if (d.domain === 'sea') {
      if (/work boat|cargo/.test(name)) return /cargo/.test(name) ? 'freighter' : 'boat';
      if (/trireme|galley|galleass|bireme|longship/.test(name)) return 'galley';
      if (/caravel|frigate|privateer|ship of the line|nau|sea beggar/.test(name)) return 'sailship';
      if (/submarine/.test(name)) return 'sub';
      if (/carrier/.test(name)) return 'carrier';
      if (/ironclad/.test(name)) return 'ironclad';
      return 'warship';
    }
    if (d.cls === 'gp') return 'gp';
    if (id === 'settler') return 'settler';
    if (id === 'worker') return 'worker';
    if (id === 'caravan') return 'caravan';
    if (id === 'missionary' || id === 'inquisitor') return 'robed';
    if (/elephant|domrey|voi chi|naresuan/.test(name)) return 'elephant';
    if (/robot/.test(name)) return 'robot';
    if (/helicopter/.test(name)) return 'heli';
    if (d.cls === 'armor') return 'tank';
    if (/chariot|war cart/.test(name)) return 'chariot';
    if (d.cls === 'mounted' || /camel|keshik|horse archer/.test(name)) return 'rider';
    if (d.cls === 'siege') { if (/rocket/.test(name)) return 'rocket'; if (/cannon|artillery/.test(name)) return 'cannon'; if (/tower/.test(name)) return 'tower'; return 'catapult'; }
    if (/gatling|machine gun|bazooka|anti-tank|anti-aircraft|sam/.test(name)) return 'gunteam';
    if (d.cls === 'ranged') return 'archer';
    if (d.cls === 'gun') return 'rifle';
    if (d.cls === 'recon') return 'scout';
    if (/spear|pike|hoplite|immortal|impi|maori|landsknecht|aksumite|tercio/.test(name)) return 'spear';
    if (/warrior|jaguar|pictish/.test(name) && !/mohawk/.test(name)) return 'club';
    return 'sword';
  }
  function era(d) { var t = d.tech ? D.TECHS[d.tech] : null; return t ? t.era : 0; }
  function person(ctx, x, y, h, col, col2, eraI, opts) {
    opts = opts || {};
    var bw = h * 0.28;
    // legs
    ctx.fillStyle = eraI >= 4 ? '#3a4a3a' : '#4a3a2a';
    ctx.fillRect(x - bw * 0.42, y - h * 0.32, bw * 0.32, h * 0.32); ctx.fillRect(x + bw * 0.1, y - h * 0.32, bw * 0.32, h * 0.32);
    // torso
    var g = ctx.createLinearGradient(x - bw, 0, x + bw, 0); g.addColorStop(0, shade(col, 0.25)); g.addColorStop(1, shade(col, -0.35));
    ctx.fillStyle = opts.robe ? g : g;
    if (opts.robe) { ctx.beginPath(); ctx.moveTo(x - bw * 0.7, y); ctx.lineTo(x - bw * 0.45, y - h * 0.68); ctx.lineTo(x + bw * 0.45, y - h * 0.68); ctx.lineTo(x + bw * 0.7, y); ctx.closePath(); ctx.fill(); }
    else { ctx.fillRect(x - bw * 0.55, y - h * 0.7, bw * 1.1, h * 0.42); ctx.fillStyle = col2; ctx.fillRect(x - bw * 0.55, y - h * 0.36, bw * 1.1, h * 0.05); }
    // head
    ctx.fillStyle = '#e0b48a'; ctx.beginPath(); ctx.arc(x, y - h * 0.8, h * 0.11, 0, Math.PI * 2); ctx.fill();
    // headgear
    if (opts.helmet !== false) {
      ctx.fillStyle = eraI >= 5 ? '#4a5a3a' : eraI >= 3 ? '#2a2a2a' : eraI >= 1 ? '#a8a8b0' : '#7a5a3a';
      ctx.beginPath(); ctx.arc(x, y - h * 0.83, h * 0.12, Math.PI, 0); ctx.fill();
      if (eraI === 3) { ctx.beginPath(); ctx.moveTo(x - h * 0.18, y - h * 0.84); ctx.lineTo(x, y - h * 0.98); ctx.lineTo(x + h * 0.18, y - h * 0.84); ctx.fill(); }
      if (eraI >= 1 && eraI <= 2) { ctx.fillStyle = col2; ctx.fillRect(x - h * 0.02, y - h * 1.0, h * 0.04, h * 0.08); }
    }
    if (opts.halo) { ctx.strokeStyle = '#ffd84a'; ctx.lineWidth = h * 0.04; ctx.beginPath(); ctx.ellipse(x, y - h * 0.95, h * 0.13, h * 0.04, 0, 0, Math.PI * 2); ctx.stroke(); }
  }
  function horse(ctx, x, y, h, col) {
    ctx.fillStyle = col;
    ctx.beginPath(); ctx.ellipse(x, y - h * 0.42, h * 0.38, h * 0.16, 0, 0, Math.PI * 2); ctx.fill();
    ctx.fillRect(x - h * 0.32, y - h * 0.42, h * 0.07, h * 0.42); ctx.fillRect(x - h * 0.15, y - h * 0.42, h * 0.07, h * 0.42); ctx.fillRect(x + h * 0.12, y - h * 0.42, h * 0.07, h * 0.42); ctx.fillRect(x + h * 0.27, y - h * 0.42, h * 0.07, h * 0.42);
    ctx.beginPath(); ctx.moveTo(x + h * 0.28, y - h * 0.5); ctx.lineTo(x + h * 0.45, y - h * 0.8); ctx.lineTo(x + h * 0.56, y - h * 0.74); ctx.lineTo(x + h * 0.4, y - h * 0.46); ctx.fill();
    ctx.fillStyle = shade(col, -0.4); ctx.fillRect(x - h * 0.42, y - h * 0.5, h * 0.06, h * 0.25);
  }
  function hull(ctx, x, y, w, h, col) {
    var g = ctx.createLinearGradient(0, y - h, 0, y); g.addColorStop(0, shade(col, 0.15)); g.addColorStop(1, shade(col, -0.4));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h); ctx.lineTo(x + w * 0.6, y - h); ctx.lineTo(x + w * 0.42, y); ctx.lineTo(x - w * 0.45, y); ctx.closePath(); ctx.fill();
  }
  P.unit = function (S, id, col, col2) {
    var d = D.UNITS[id], w = S * 1.8, h = S * 1.9, c = mkCanvas(w, h), ctx = c.getContext('2d');
    var x = w / 2, y = h * 0.86, H = S * 0.95, kind = unitKind(id, d), eI = era(d);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var fig = null, real = ctx;
    // team base
    if (d.domain !== 'sea' && d.domain !== 'air') {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.5, S * 0.2, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = col; ctx.lineWidth = S * 0.09; ctx.beginPath(); ctx.ellipse(x, y, S * 0.44, S * 0.17, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col2; ctx.lineWidth = S * 0.025; ctx.beginPath(); ctx.ellipse(x, y, S * 0.5, S * 0.21, 0, 0, Math.PI * 2); ctx.stroke();
    }
    fig = mkCanvas(w, h); ctx = fig.getContext('2d'); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var metal = eI >= 4 ? '#3a3a3a' : '#c8c8d0', wood = '#7a5230';
    switch (kind) {
      case 'club': case 'sword': case 'spear': case 'scout': case 'archer': case 'rifle': case 'robed': case 'worker': case 'settler': case 'gp': {
        var fx = x - S * 0.05;
        if (kind === 'settler') { // wagon
          ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x + S * 0.05, y - H * 0.45, S * 0.5, H * 0.25);
          ctx.fillStyle = '#efe6cf'; ctx.beginPath(); ctx.arc(x + S * 0.3, y - H * 0.45, S * 0.25, Math.PI, 0); ctx.fill();
          ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x + S * 0.15, y - H * 0.18, S * 0.08, 0, Math.PI * 2); ctx.arc(x + S * 0.45, y - H * 0.18, S * 0.08, 0, Math.PI * 2); ctx.fill();
          fx = x - S * 0.25;
        }
        person(ctx, fx, y, H, col, col2, eI, { robe: kind === 'robed' || kind === 'gp', helmet: kind !== 'worker' && kind !== 'settler' && kind !== 'robed' && kind !== 'gp' && kind !== 'scout', halo: kind === 'gp' });
        var hx = fx + H * 0.16, hy = y - H * 0.55;
        ctx.lineWidth = Math.max(1, S * 0.06);
        if (kind === 'club') { ctx.strokeStyle = wood; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + H * 0.15, hy - H * 0.35); ctx.stroke(); ctx.fillStyle = wood; ctx.beginPath(); ctx.arc(hx + H * 0.16, hy - H * 0.37, H * 0.06, 0, Math.PI * 2); ctx.fill(); }
        if (kind === 'sword') { ctx.strokeStyle = metal; ctx.beginPath(); ctx.moveTo(hx, hy); ctx.lineTo(hx + H * 0.12, hy - H * 0.42); ctx.stroke(); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(fx - H * 0.18, y - H * 0.5, H * 0.1, H * 0.16, 0, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col2; ctx.lineWidth = S * 0.03; ctx.stroke(); }
        if (kind === 'spear') { ctx.strokeStyle = wood; ctx.beginPath(); ctx.moveTo(hx, y - H * 0.1); ctx.lineTo(hx + H * 0.05, y - H * 1.15); ctx.stroke(); ctx.fillStyle = metal; ctx.beginPath(); ctx.moveTo(hx + H * 0.02, y - H * 1.12); ctx.lineTo(hx + H * 0.05, y - H * 1.3); ctx.lineTo(hx + H * 0.09, y - H * 1.12); ctx.fill(); ctx.fillStyle = col; ctx.beginPath(); ctx.arc(fx - H * 0.18, y - H * 0.5, H * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = col2; ctx.lineWidth = S * 0.03; ctx.stroke(); }
        if (kind === 'archer') { ctx.strokeStyle = wood; ctx.lineWidth = Math.max(1, S * 0.05); ctx.beginPath(); ctx.arc(hx + H * 0.02, hy - H * 0.05, H * 0.28, -Math.PI * 0.45, Math.PI * 0.45); ctx.stroke(); ctx.strokeStyle = '#eee'; ctx.lineWidth = Math.max(0.5, S * 0.015); ctx.beginPath(); ctx.moveTo(hx + H * 0.06, hy - H * 0.31); ctx.lineTo(hx + H * 0.06, hy + H * 0.21); ctx.stroke(); }
        if (kind === 'rifle') { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = Math.max(1, S * 0.05); ctx.beginPath(); ctx.moveTo(hx - H * 0.05, hy + H * 0.05); ctx.lineTo(hx + H * 0.2, hy - H * 0.5); ctx.stroke(); }
        if (kind === 'scout') { ctx.strokeStyle = wood; ctx.beginPath(); ctx.moveTo(hx, y); ctx.lineTo(hx + H * 0.04, y - H * 0.95); ctx.stroke(); }
        if (kind === 'worker') { ctx.strokeStyle = wood; ctx.beginPath(); ctx.moveTo(hx, hy + H * 0.1); ctx.lineTo(hx + H * 0.2, hy - H * 0.3); ctx.stroke(); ctx.strokeStyle = '#888'; ctx.beginPath(); ctx.moveTo(hx + H * 0.08, hy - H * 0.36); ctx.lineTo(hx + H * 0.3, hy - H * 0.22); ctx.stroke(); }
        if (kind === 'gp') { ctx.fillStyle = '#ffd84a'; ctx.beginPath(); for (var k = 0; k < 10; k++) { var a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? H * 0.06 : H * 0.14; ctx.lineTo(hx + H * 0.15 + Math.cos(a) * rr, hy - H * 0.3 + Math.sin(a) * rr); } ctx.fill(); }
        if (kind === 'robed') { ctx.fillStyle = '#f0e0b0'; ctx.fillRect(hx, hy - H * 0.05, H * 0.14, H * 0.18); }
        break;
      }
      case 'rider': case 'chariot': case 'elephant': {
        if (kind === 'elephant') {
          ctx.fillStyle = '#8a8a8a'; ctx.beginPath(); ctx.ellipse(x, y - H * 0.5, H * 0.45, H * 0.28, 0, 0, Math.PI * 2); ctx.fill();
          ctx.fillRect(x - H * 0.35, y - H * 0.4, H * 0.14, H * 0.4); ctx.fillRect(x + H * 0.2, y - H * 0.4, H * 0.14, H * 0.4);
          ctx.beginPath(); ctx.arc(x + H * 0.45, y - H * 0.62, H * 0.17, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = H * 0.08; ctx.beginPath(); ctx.moveTo(x + H * 0.58, y - H * 0.6); ctx.quadraticCurveTo(x + H * 0.7, y - H * 0.3, x + H * 0.6, y - H * 0.15); ctx.stroke();
          ctx.fillStyle = col; ctx.fillRect(x - H * 0.25, y - H * 0.85, H * 0.45, H * 0.15);
          person(ctx, x - H * 0.05, y - H * 0.6, H * 0.6, col, col2, eI);
          break;
        }
        horse(ctx, x, y, H, kind === 'chariot' ? '#6a4a2a' : '#5a3a22');
        if (kind === 'chariot') { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - H * 0.75, y - H * 0.5, H * 0.35, H * 0.25); ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = S * 0.05; ctx.beginPath(); ctx.arc(x - H * 0.58, y - H * 0.18, H * 0.16, 0, Math.PI * 2); ctx.stroke(); person(ctx, x - H * 0.58, y - H * 0.42, H * 0.65, col, col2, eI); }
        else person(ctx, x - H * 0.02, y - H * 0.38, H * 0.72, col, col2, eI);
        ctx.strokeStyle = /lancer|knight|keshik|cataphract|hussar|companion/i.test(d.name) ? wood : metal; ctx.lineWidth = Math.max(1, S * 0.05);
        ctx.beginPath(); ctx.moveTo(x + H * 0.05, y - H * 0.7); ctx.lineTo(x + H * 0.6, y - H * 1.05); ctx.stroke();
        break;
      }
      case 'catapult': case 'tower': case 'cannon': case 'rocket': case 'gunteam': {
        if (kind === 'tower') { ctx.fillStyle = '#8a6a3a'; ctx.fillRect(x - H * 0.3, y - H * 1.2, H * 0.6, H * 1.15); ctx.fillStyle = col; ctx.fillRect(x - H * 0.3, y - H * 1.25, H * 0.6, H * 0.12); ctx.strokeStyle = '#4a3220'; ctx.lineWidth = S * 0.03; for (var q = 0; q < 4; q++) { ctx.beginPath(); ctx.moveTo(x - H * 0.3, y - H * 0.25 * q - H * 0.1); ctx.lineTo(x + H * 0.3, y - H * 0.25 * q - H * 0.1); ctx.stroke(); } break; }
        ctx.fillStyle = '#3a2a1a'; ctx.beginPath(); ctx.arc(x - H * 0.25, y - H * 0.15, H * 0.15, 0, Math.PI * 2); ctx.arc(x + H * 0.25, y - H * 0.15, H * 0.15, 0, Math.PI * 2); ctx.fill();
        if (kind === 'catapult') { ctx.fillStyle = wood; ctx.fillRect(x - H * 0.42, y - H * 0.35, H * 0.84, H * 0.12); ctx.strokeStyle = wood; ctx.lineWidth = S * 0.07; ctx.beginPath(); ctx.moveTo(x - H * 0.1, y - H * 0.3); ctx.lineTo(x + H * 0.35, y - H * 0.95); ctx.stroke(); ctx.fillStyle = '#777'; ctx.beginPath(); ctx.arc(x + H * 0.38, y - H * 0.98, H * 0.08, 0, Math.PI * 2); ctx.fill(); }
        if (kind === 'cannon') { ctx.fillStyle = eI >= 4 ? '#4a5040' : '#2a2a2a'; ctx.save(); ctx.translate(x, y - H * 0.35); ctx.rotate(-0.35); ctx.fillRect(-H * 0.15, -H * 0.08, H * 0.75, H * 0.16); ctx.restore(); }
        if (kind === 'rocket') { ctx.fillStyle = '#4a5a3a'; ctx.fillRect(x - H * 0.5, y - H * 0.45, H, H * 0.3); ctx.fillStyle = '#ddd'; for (q = 0; q < 3; q++) { ctx.save(); ctx.translate(x - H * 0.2 + q * H * 0.15, y - H * 0.5); ctx.rotate(-0.6); ctx.fillRect(0, -H * 0.04, H * 0.5, H * 0.08); ctx.restore(); } }
        if (kind === 'gunteam') { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - H * 0.1, y - H * 0.45, H * 0.6, H * 0.1); person(ctx, x - H * 0.35, y, H * 0.7, col, col2, eI); }
        ctx.fillStyle = col; ctx.fillRect(x - H * 0.08, y - H * 0.32, H * 0.16, H * 0.08);
        break;
      }
      case 'tank': case 'robot': case 'heli': {
        if (kind === 'heli') { ctx.fillStyle = '#4a5a3a'; ctx.beginPath(); ctx.ellipse(x, y - H * 0.75, H * 0.38, H * 0.2, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x + H * 0.2, y - H * 0.8, H * 0.5, H * 0.08); ctx.strokeStyle = '#222'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(x - H * 0.6, y - H * 1.0); ctx.lineTo(x + H * 0.6, y - H * 1.0); ctx.stroke(); ctx.fillStyle = col; ctx.fillRect(x - H * 0.1, y - H * 0.8, H * 0.2, H * 0.1); break; }
        if (kind === 'robot') { ctx.fillStyle = '#5a5f6a'; ctx.fillRect(x - H * 0.3, y - H * 0.6, H * 0.15, H * 0.6); ctx.fillRect(x + H * 0.15, y - H * 0.6, H * 0.15, H * 0.6); ctx.fillStyle = '#7a808a'; ctx.fillRect(x - H * 0.42, y - H * 1.25, H * 0.84, H * 0.65); ctx.fillStyle = '#ff3a2a'; ctx.fillRect(x - H * 0.25, y - H * 1.1, H * 0.5, H * 0.1); ctx.fillStyle = col; ctx.fillRect(x - H * 0.42, y - H * 0.8, H * 0.84, H * 0.1); break; }
        var tc = eI >= 6 ? '#6a6a52' : '#4a5a3a';
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - H * 0.55, y - H * 0.25, H * 1.1, H * 0.22);
        var gt = ctx.createLinearGradient(0, y - H * 0.55, 0, y - H * 0.2); gt.addColorStop(0, shade(tc, 0.25)); gt.addColorStop(1, shade(tc, -0.3));
        ctx.fillStyle = gt; ctx.fillRect(x - H * 0.5, y - H * 0.45, H, H * 0.22);
        ctx.fillRect(x - H * 0.25, y - H * 0.65, H * 0.5, H * 0.22);
        ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x + H * 0.2, y - H * 0.58, H * 0.55, H * 0.07);
        ctx.fillStyle = col; ctx.fillRect(x - H * 0.2, y - H * 0.6, H * 0.15, H * 0.1);
        break;
      }
      case 'caravan': {
        horse(ctx, x + H * 0.1, y, H * 0.85, '#c8a060');
        ctx.fillStyle = '#a0522d'; ctx.fillRect(x - H * 0.15, y - H * 0.75, H * 0.45, H * 0.22);
        ctx.fillStyle = col; ctx.fillRect(x - H * 0.12, y - H * 0.8, H * 0.39, H * 0.06);
        person(ctx, x - H * 0.55, y, H * 0.75, col, col2, eI, { helmet: false });
        break;
      }
      case 'galley': case 'sailship': case 'warship': case 'ironclad': case 'sub': case 'carrier': case 'boat': case 'freighter': {
        // water ripple base
        ctx.strokeStyle = col; ctx.lineWidth = S * 0.07; ctx.beginPath(); ctx.ellipse(x, y - S * 0.05, S * 0.6, S * 0.18, 0, 0, Math.PI * 2); ctx.stroke();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = S * 0.03; ctx.beginPath(); ctx.ellipse(x, y - S * 0.05, S * 0.68, S * 0.22, 0, Math.PI * 0.1, Math.PI * 0.9); ctx.stroke();
        var hw = kind === 'boat' ? H * 0.6 : kind === 'sub' ? H * 1.1 : H * 1.2;
        var hc = kind === 'galley' || kind === 'sailship' || kind === 'boat' ? '#7a4a2a' : kind === 'sub' ? '#2a2f35' : kind === 'ironclad' ? '#3a3a3a' : '#7a8088';
        if (kind === 'sub') { ctx.fillStyle = hc; ctx.beginPath(); ctx.ellipse(x, y - H * 0.18, hw * 0.5, H * 0.12, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - H * 0.08, y - H * 0.45, H * 0.18, H * 0.25); ctx.fillStyle = col; ctx.fillRect(x - H * 0.08, y - H * 0.45, H * 0.18, H * 0.06); break; }
        hull(ctx, x, y - H * 0.05, hw, H * 0.28, hc);
        if (kind === 'galley') { ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = S * 0.03; for (q = 0; q < 5; q++) { ctx.beginPath(); ctx.moveTo(x - hw * 0.35 + q * hw * 0.17, y - H * 0.15); ctx.lineTo(x - hw * 0.42 + q * hw * 0.17, y + H * 0.05); ctx.stroke(); } }
        if (kind === 'galley' || kind === 'sailship' || kind === 'boat') {
          var masts = kind === 'sailship' ? (/frigate|line/i.test(d.name) ? 3 : 2) : 1;
          for (q = 0; q < masts; q++) {
            var mx = x + (q - (masts - 1) / 2) * hw * 0.3;
            ctx.strokeStyle = '#4a2a1a'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(mx, y - H * 0.3); ctx.lineTo(mx, y - H * 1.25); ctx.stroke();
            ctx.fillStyle = q === Math.floor(masts / 2) ? col : '#f2ecd8';
            ctx.beginPath(); ctx.moveTo(mx - H * 0.25, y - H * 1.15); ctx.quadraticCurveTo(mx, y - H * 1.05, mx + H * 0.25, y - H * 1.15); ctx.lineTo(mx + H * 0.22, y - H * 0.5); ctx.quadraticCurveTo(mx, y - H * 0.45, mx - H * 0.22, y - H * 0.5); ctx.closePath(); ctx.fill();
          }
        } else if (kind === 'carrier') { ctx.fillStyle = '#5a6068'; ctx.fillRect(x - hw * 0.55, y - H * 0.4, hw * 1.1, H * 0.1); ctx.fillRect(x + hw * 0.2, y - H * 0.65, H * 0.18, H * 0.25); }
        else {
          ctx.fillStyle = shade(hc, 0.15); ctx.fillRect(x - hw * 0.25, y - H * 0.5, hw * 0.45, H * 0.22);
          if (kind === 'ironclad' || kind === 'freighter') { ctx.fillStyle = '#2a2a2a'; ctx.fillRect(x - H * 0.05, y - H * 0.85, H * 0.12, H * 0.38); }
          else { ctx.fillStyle = '#4a4a4a'; ctx.fillRect(x + hw * 0.22, y - H * 0.46, hw * 0.25, H * 0.06); ctx.fillRect(x - hw * 0.45, y - H * 0.46, hw * 0.22, H * 0.06); ctx.fillRect(x - H * 0.04, y - H * 0.85, H * 0.08, H * 0.35); }
          ctx.fillStyle = col; ctx.fillRect(x - hw * 0.25, y - H * 0.55, hw * 0.45, H * 0.06);
        }
        break;
      }
      case 'plane': case 'bomber': case 'missile': {
        ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.45, S * 0.12, 0, 0, Math.PI * 2); ctx.fill();
        var pc = kind === 'missile' ? '#ddd' : '#6a7a6a';
        ctx.fillStyle = pc;
        var py2 = y - H * 0.9, pl = kind === 'bomber' ? H * 1.1 : H * 0.85;
        ctx.beginPath(); ctx.ellipse(x, py2, pl * 0.5, H * 0.09, 0, 0, Math.PI * 2); ctx.fill();
        if (kind !== 'missile') { ctx.beginPath(); ctx.moveTo(x - H * 0.1, py2); ctx.lineTo(x - H * 0.25, py2 + H * 0.38); ctx.lineTo(x + H * 0.05, py2 + H * 0.38); ctx.lineTo(x + H * 0.12, py2); ctx.lineTo(x + H * 0.05, py2 - H * 0.38); ctx.lineTo(x - H * 0.25, py2 - H * 0.38); ctx.closePath(); ctx.fill(); }
        else { ctx.fillStyle = '#d02020'; ctx.beginPath(); ctx.moveTo(x + pl * 0.5, py2 - H * 0.09); ctx.lineTo(x + pl * 0.65, py2); ctx.lineTo(x + pl * 0.5, py2 + H * 0.09); ctx.fill(); ctx.fillStyle = '#f2d020'; ctx.beginPath(); ctx.arc(x, py2, H * 0.06, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x - pl * 0.1, py2 + H * 0.25, H * 0.06, 0, Math.PI * 2); ctx.fill();
        break;
      }
    }
    // composite: dark outline + soft shadow make figures pop off the terrain
    real.save(); real.shadowColor = 'rgba(0,0,0,0.85)'; real.shadowBlur = Math.max(1, S * 0.06);
    for (var o = 0; o < 4; o++) { var ox = [1, -1, 0, 0][o] * Math.max(0.6, S * 0.018), oy = [0, 0, 1, -1][o] * Math.max(0.6, S * 0.018); real.globalCompositeOperation = 'source-over'; real.globalAlpha = 0.9; real.filter = 'brightness(0)'; real.drawImage(fig, ox, oy); }
    real.filter = 'none'; real.globalAlpha = 1; real.shadowColor = 'transparent'; real.drawImage(fig, 0, 0); real.restore();
    return { c: c, ax: x, ay: y };
  };

  // ------------------------------------------------------------
  //  Renderer object
  // ------------------------------------------------------------
  function Renderer(canvas) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d');
    this.s = 30; this.cam = { x: 0, y: 0 };
    this.cache = {}; this.cacheN = 0; this.dirty = true; this.anims = []; this.floats = []; this.effects = [];
    this.selected = null; this.reach = null; this.path = null; this.attackTiles = null; this.cityFocus = null; this.showYields = false; this.showGrid = false;
    this.dpr = Math.min(2, window.devicePixelRatio || 1);
    var self = this;
    this._loop = function (ts) { self._raf = null; self.frame(ts); };
  }
  Renderer.prototype.setGame = function (game, viewer) { this.game = game; this.viewer = viewer; this.cache = {}; this.dirty = true; };
  Renderer.prototype.resize = function () {
    var r = this.canvas.getBoundingClientRect();
    this.cw = r.width; this.ch = r.height;
    this.canvas.width = Math.round(r.width * this.dpr); this.canvas.height = Math.round(r.height * this.dpr);
    this.request();
  };
  Renderer.prototype.request = function () { this.dirty = true; if (!this._raf) this._raf = requestAnimationFrame(this._loop); };
  Renderer.prototype.bucket = function () { var s = this.s; for (var i = 0; i < BUCKETS.length; i++) if (BUCKETS[i] >= s * 0.92) return BUCKETS[i]; return BUCKETS[BUCKETS.length - 1]; };
  Renderer.prototype.sprite = function (key, fn) {
    var S = Math.round(this.bucket() * this.dpr), k = key + '|' + S; var c = this.cache[k];
    if (!c) { if (++this.cacheN > 2500) { this.cache = {}; this.cacheN = 0; } c = fn(S); this.cache[k] = c; }
    c.S = S; return c;
  };
  Renderer.prototype.worldW = function () { return SQ3 * this.s * this.game.map.W; };
  Renderer.prototype.tileXY = function (i) { var W = this.game.map.W, x = i % W, y = (i / W) | 0; return { x: SQ3 * this.s * (x + 0.5 * (y & 1)), y: 1.5 * this.s * y * TILT }; };
  // screen position of tile nearest to camera (handles wrap)
  Renderer.prototype.tileScreen = function (i) {
    var p = this.tileXY(i), ww = this.worldW();
    var dx = p.x - this.cam.x; dx = ((dx % ww) + ww * 1.5) % ww - ww / 2;
    return { x: this.cw / 2 + dx, y: this.ch / 2 + (p.y - this.cam.y) };
  };
  Renderer.prototype.screenToTile = function (sx, sy) {
    var m = this.game.map, s = this.s, ww = this.worldW();
    var wx = sx - this.cw / 2 + this.cam.x, wy = sy - this.ch / 2 + this.cam.y;
    var row = Math.round(wy / (1.5 * s * TILT));
    var best = -1, bd = 1e18;
    for (var r = row - 1; r <= row + 1; r++) {
      if (r < 0 || r >= m.H) continue;
      var col = Math.round(wx / (SQ3 * s) - 0.5 * (r & 1));
      for (var c = col - 1; c <= col + 1; c++) {
        var cx = SQ3 * s * (c + 0.5 * (r & 1)), cy = 1.5 * s * r * TILT;
        var dx = wx - cx, dy = (wy - cy) / TILT, d = dx * dx + dy * dy;
        if (d < bd) { bd = d; best = Hex.idx(c, r); }
      }
    }
    return best;
  };
  Renderer.prototype.centerOn = function (i, smooth, offX, offY) {
    var p = this.tileXY(i);
    p = { x: p.x + (offX || 0), y: p.y + (offY || 0) };
    if (smooth) { this.camAnim = { fx: this.cam.x, fy: this.cam.y, tx: p.x, ty: p.y, t0: performance.now(), dur: 280 }; var ww = this.worldW(); var dx = this.camAnim.tx - this.camAnim.fx; if (dx > ww / 2) this.camAnim.tx -= ww; if (dx < -ww / 2) this.camAnim.tx += ww; }
    else { this.cam.x = p.x; this.cam.y = p.y; }
    this.request();
  };
  Renderer.prototype.clampCam = function () {
    var ww = this.worldW(); this.cam.x = ((this.cam.x % ww) + ww) % ww;
    var maxY = 1.5 * this.s * (this.game.map.H - 1) * TILT;
    this.cam.y = Math.max(-this.ch * 0.25, Math.min(maxY + this.ch * 0.25, this.cam.y));
  };
  Renderer.prototype.zoomAt = function (factor, sx, sy) {
    var old = this.s, ns = Math.max(9, Math.min(80, old * factor));
    if (ns === old) return;
    if (sx == null) { sx = this.cw / 2; sy = this.ch / 2; }
    var wx = sx - this.cw / 2 + this.cam.x, wy = sy - this.ch / 2 + this.cam.y;
    var k = ns / old;
    this.cam.x = wx * k - (sx - this.cw / 2); this.cam.y = wy * k - (sy - this.ch / 2);
    this.s = ns; this.clampCam(); this.request();
  };
  Renderer.prototype.animateMove = function (u, from, to) {
    if (from === to || from == null) return;
    var a = this.tileXY(from), b = this.tileXY(to), ww = this.worldW();
    var dx = b.x - a.x; if (dx > ww / 2) dx -= ww; if (dx < -ww / 2) dx += ww;
    this.anims = this.anims.filter(function (x) { return x.id !== u.id; });
    this.anims.push({ id: u.id, dx: -dx, dy: -(b.y - a.y), t0: performance.now(), dur: 160 });
    this.request();
  };
  Renderer.prototype.floatText = function (tile, text, color) { this.floats.push({ tile: tile, text: text, color: color || '#ff5040', t0: performance.now(), dur: 1300 }); this.request(); };
  Renderer.prototype.flash = function (tile, color, radius) { this.effects.push({ tile: tile, color: color || 'rgba(255,200,80,0.8)', t0: performance.now(), dur: radius ? 1400 : 450, radius: radius || 0 }); this.request(); };

  Renderer.prototype.visibility = function (t) {
    var p = this.game.players[this.viewer];
    if (this.revealAll) return 2;
    if (!p) return 2;
    return p.visible[t] ? 2 : p.explored[t] ? 1 : 0;
  };

  Renderer.prototype.frame = function (ts) {
    var now = performance.now();
    var busy = false;
    if (this.camAnim) {
      var a = this.camAnim, k = Math.min(1, (now - a.t0) / a.dur), e = 1 - Math.pow(1 - k, 3);
      this.cam.x = a.fx + (a.tx - a.fx) * e; this.cam.y = a.fy + (a.ty - a.fy) * e;
      if (k >= 1) { this.camAnim = null; this.clampCam(); } else busy = true;
    }
    this.anims = this.anims.filter(function (x) { return now - x.t0 < x.dur; });
    this.floats = this.floats.filter(function (x) { return now - x.t0 < x.dur; });
    this.effects = this.effects.filter(function (x) { return now - x.t0 < x.dur; });
    if (this.anims.length || this.floats.length || this.effects.length) busy = true;
    if (this.game) this.draw(now);
    if (G.GFX && G.GFX.particles && G.GFX.particles.length) busy = true;
    if (busy) this.request();
    else if (G.GFX && G.GFX.settings.anim && this.game && !this._animT) { var self = this; this._animT = setTimeout(function () { self._animT = null; self.request(); }, 70); }
    if (this.onFrame) this.onFrame();
  };

  Renderer.prototype.draw = function (now) {
    var ctx = this.ctx, game = this.game, m = game.map, s = this.s, dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // background (unexplored)
    if (G.GFX && G.GFX.drawUnexplored) G.GFX.drawUnexplored(this, ctx, now);
    else {
    if (!this._cloud) {
      var cc = mkCanvas(512, 512), cx2 = cc.getContext('2d'), cr = rng(77);
      cx2.fillStyle = '#100c08'; cx2.fillRect(0, 0, 512, 512);
      for (var ci = 0; ci < 90; ci++) {
        var px0 = cr() * 512, py0 = cr() * 512, rr0 = 30 + cr() * 90;
        for (var dx0 = -512; dx0 <= 512; dx0 += 512) for (var dy0 = -512; dy0 <= 512; dy0 += 512) {
          var cg = cx2.createRadialGradient(px0 + dx0, py0 + dy0, 0, px0 + dx0, py0 + dy0, rr0);
          var lum = cr() < 0.5 ? '60,50,38' : '30,24,18'; cg.addColorStop(0, 'rgba(' + lum + ',0.35)'); cg.addColorStop(1, 'rgba(' + lum + ',0)');
          cx2.fillStyle = cg; cx2.fillRect(px0 + dx0 - rr0, py0 + dy0 - rr0, rr0 * 2, rr0 * 2);
        }
      }
      this._cloud = ctx.createPattern(cc, 'repeat');
    }
    var drift = (now || 0) * 0.004;
    ctx.save(); ctx.translate(-((this.cam.x * 0.35 + drift) % 512) - 512, -((this.cam.y * 0.35) % 512) - 512);
    ctx.fillStyle = this._cloud; ctx.fillRect(0, 0, this.cw + 1100, this.ch + 1100); ctx.restore();
    }
    var W = m.W, H = m.H, colW = SQ3 * s, rowH = 1.5 * s * TILT;
    var top = this.cam.y - this.ch / 2, left = this.cam.x - this.cw / 2;
    var r0 = Math.max(0, Math.floor(top / rowH) - 2), r1 = Math.min(H - 1, Math.ceil((top + this.ch) / rowH) + 3);
    var c0 = Math.floor(left / colW) - 2, c1 = Math.ceil((left + this.cw) / colW) + 2;
    var list = [];
    for (var r = r0; r <= r1; r++) for (var c = c0; c <= c1; c++) {
      var t = r * W + (((c % W) + W) % W);
      var px = colW * (c + 0.5 * (r & 1)) - left, py = rowH * r - top;
      list.push(t, px, py, r);
    }
    this.vis = list;
    var self = this, viewer = game.players[this.viewer];
    var LIST = IDS.terrain.list, FL = IDS.feature.list;
    // ---- pass 1: ground
    for (var i = 0; i < list.length; i += 4) {
      t = list[i]; var vv = this.visibility(t); if (!vv) continue;
      var tk = LIST[m.terrain[t]], fk = FL[m.feature[t]];
      var groundF = (fk === 'marsh' || fk === 'floodplains' || fk === 'oasis' || fk === 'ice' || fk === 'atoll' || fk === 'fallout') ? fk : '';
      var variant = (t * 2654435761 >>> 0) % 4;
      var gvc = (t % W) % 3, gvr = ((t / W) | 0) % 2, ghl = m.hills[t] ? 1 : 0;
      var sp = this.sprite('g' + tk + groundF + gvc + gvr + ghl, function (S) { return P.ground(S, tk, groundF, variant, ghl, gvc, gvr); });
      var kk = s / sp.S;
      ctx.drawImage(sp.c.c || sp.c, list[i + 1] - sp.ax * kk, list[i + 2] - sp.ay * kk, (sp.c.width || sp.c.c.width) * kk, (sp.c.height || sp.c.c.height) * kk);
    }
    if (this.hooks && this.hooks.ground) this.hooks.ground.call(this, ctx, list, now || performance.now());
    // ---- pass 2: coast foam, rivers, roads, borders
    var riverSegs = [], roadSegs = [], useNewPaths = !!(G.GFX && G.GFX.drawRivers && G.GFX.drawRoads);
    ctx.lineCap = 'round';
    for (i = 0; i < list.length; i += 4) {
      t = list[i]; if (!this.visibility(t)) continue;
      var x = list[i + 1], y = list[i + 2];
      var water = D.TERRAIN[LIST[m.terrain[t]]].water;
      if (s >= 14) {
        var tkH = LIST[m.terrain[t]];
        for (var kb = 0; kb < 6; kb++) {
          var nbb = Hex.neighbor(t, kb); if (nbb < 0 || !this.visibility(nbb)) continue;
          var ntk = LIST[m.terrain[nbb]], nW = D.TERRAIN[ntk].water, col = null, al = 0;
          if (water && !nW) { col = '120,225,225'; al = 0.5; }
          else if (water && nW && tkH === 'ocean' && ntk !== 'ocean') { col = '70,150,190'; al = 0.45; }
          else if (!water && !nW && ntk !== tkH && ntk !== 'mountain') { var nc = D.TERRAIN[ntk].color; col = parseInt(nc.substr(1, 2), 16) + ',' + parseInt(nc.substr(3, 2), 16) + ',' + parseInt(nc.substr(5, 2), 16); al = 0.42; }
          if (!col) continue;
          var eb = edgePts(x, y, s, kb), mxb = (eb[0] + eb[2]) / 2, myb = (eb[1] + eb[3]) / 2;
          var gb = ctx.createLinearGradient(mxb, myb, mxb + (x - mxb) * 0.6, myb + (y - myb) * 0.6);
          gb.addColorStop(0, 'rgba(' + col + ',' + al + ')'); gb.addColorStop(1, 'rgba(' + col + ',0)');
          ctx.fillStyle = gb; ctx.beginPath(); ctx.moveTo(eb[0], eb[1]); ctx.lineTo(eb[2], eb[3]); ctx.lineTo(x + (eb[2] - x) * 0.35, y + (eb[3] - y) * 0.35); ctx.lineTo(x + (eb[0] - x) * 0.35, y + (eb[1] - y) * 0.35); ctx.closePath(); ctx.fill();
        }
      }
      if (!water) {
        for (var k2 = 0; k2 < 6; k2++) {
          var nb = Hex.neighbor(t, k2); if (nb < 0) continue;
          if (D.TERRAIN[LIST[m.terrain[nb]]].water && this.visibility(nb)) {
            var e = edgePts(x, y, s, k2);
            ctx.strokeStyle = 'rgba(230,215,160,0.85)'; ctx.lineWidth = s * 0.14; ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
            ctx.strokeStyle = 'rgba(255,255,255,0.35)'; ctx.lineWidth = s * 0.05; ctx.beginPath(); ctx.moveTo(e[0] + (e[0] - x) * 0.08, e[1] + (e[1] - y) * 0.08); ctx.lineTo(e[2] + (e[2] - x) * 0.08, e[3] + (e[3] - y) * 0.08); ctx.stroke();
          }
        }
      }
      if (m.riverMask[t]) {
        for (k2 = 0; k2 < 6; k2++) if (m.riverMask[t] & (1 << k2)) {
          var n2 = Hex.neighbor(t, k2); if (n2 < 0) continue;
          var dxn = [SQ3 * s, SQ3 * s / 2, -SQ3 * s / 2, -SQ3 * s, -SQ3 * s / 2, SQ3 * s / 2][k2], dyn = [0, -rowH, -rowH, 0, rowH, rowH][k2];
          if (useNewPaths) {
            if (t < n2 || !(m.riverMask[n2] & (1 << ((k2 + 3) % 6)))) {
              var bits = 0, mk = m.riverMask[t]; while (mk) { bits += mk & 1; mk >>= 1; }
              var seaEnd = D.TERRAIN[LIST[m.terrain[n2]]].water ? 1 : 0;
              riverSegs.push(x, y, x + dxn, y + dyn, Math.min(1, 0.2 + 0.18 * bits), seaEnd);
            }
            continue;
          }
          if (G.GFX && G.GFX.river) { G.GFX.river(ctx, x, y, dxn, dyn, s, now || performance.now()); continue; }
          ctx.strokeStyle = '#2f78b8'; ctx.lineWidth = s * 0.2; ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + dxn * 0.5 + dyn * 0.15, y + dyn * 0.5 - dxn * 0.08, x + dxn, y + dyn); ctx.stroke();
          ctx.strokeStyle = 'rgba(160,215,255,0.6)'; ctx.lineWidth = s * 0.07; ctx.stroke();
        }
      }
      if (m.road[t] && this.visibility(t)) {
        var isCity = E.cityAt(game, t);
        var any = false;
        for (k2 = 0; k2 < 6; k2++) {
          n2 = Hex.neighbor(t, k2); if (n2 < 0 || k2 > 2 && false) continue;
          if (!(m.road[n2] || E.cityAt(game, n2))) continue;
          if (isCity && E.cityAt(game, n2)) continue;
          any = true;
          dxn = [SQ3 * s, SQ3 * s / 2, -SQ3 * s / 2, -SQ3 * s, -SQ3 * s / 2, SQ3 * s / 2][k2]; dyn = [0, -rowH, -rowH, 0, rowH, rowH][k2];
          var rail = m.road[t] === 2 && m.road[n2] === 2;
          if (useNewPaths) { var rown2 = m.owner[t] >= 0 ? game.players[m.owner[t]] : null; roadSegs.push(x, y, x + dxn / 2, y + dyn / 2, rail ? 2 : (rown2 && rown2.era >= 3 ? 1 : 0), 0.25); continue; }
          if (G.GFX && G.GFX.road) { var rown = m.owner[t] >= 0 ? game.players[m.owner[t]] : null; G.GFX.road(ctx, x, y, dxn, dyn, s, rail, rown && rown.era >= 3); continue; }
          ctx.strokeStyle = rail ? '#3a3a3a' : 'rgba(120,90,55,0.9)'; ctx.lineWidth = s * (rail ? 0.1 : 0.12);
          ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + dxn / 2, y + dyn / 2); ctx.stroke();
          if (rail) { ctx.strokeStyle = '#6a5040'; ctx.lineWidth = s * 0.04; for (var q = 1; q < 4; q++) { var qx = x + dxn * q / 8, qy = y + dyn * q / 8; ctx.beginPath(); ctx.moveTo(qx - dyn * 0.1, qy + dxn * 0.1 * 0.3); ctx.lineTo(qx + dyn * 0.1, qy - dxn * 0.1 * 0.3); ctx.stroke(); } }
        }
        if (!any && !isCity) { ctx.fillStyle = 'rgba(120,90,55,0.9)'; ctx.beginPath(); ctx.arc(x, y, s * 0.1, 0, Math.PI * 2); ctx.fill(); }
      }
    }
    if (useNewPaths) {
      var nowT = now || performance.now();
      if (riverSegs.length) G.GFX.drawRivers(ctx, riverSegs, nowT, s);
      if (roadSegs.length) G.GFX.drawRoads(ctx, roadSegs, nowT, s);
    }
    // borders
    for (i = 0; i < list.length; i += 4) {
      t = list[i]; var ow = m.owner[t]; if (ow < 0 || !this.visibility(t)) continue;
      x = list[i + 1]; y = list[i + 2];
      var op = game.players[ow];
      for (k2 = 0; k2 < 6; k2++) {
        n2 = Hex.neighbor(t, k2);
        if (n2 >= 0 && m.owner[n2] === ow) continue;
        if (G.GFX && G.GFX.border) { G.GFX.border(ctx, x, y, s, k2, op); continue; }
        e = edgePts(x, y, s * 0.93, k2);
        ctx.strokeStyle = op.color; ctx.globalAlpha = 0.9; ctx.lineWidth = Math.max(1.5, s * 0.1); ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
        ctx.strokeStyle = op.color2; ctx.globalAlpha = 0.6; ctx.lineWidth = Math.max(0.8, s * 0.03); ctx.beginPath(); ctx.moveTo(e[0], e[1]); ctx.lineTo(e[2], e[3]); ctx.stroke();
        ctx.globalAlpha = 1;
      }
      // faint territory tint
      ctx.fillStyle = op.color; ctx.globalAlpha = 0.07; hexPath(ctx, x, y, s); ctx.fill(); ctx.globalAlpha = 1;
    }
    // city focus: workable area & worked tiles
    if (this.cityFocus != null && game.cities[this.cityFocus]) {
      var fc = game.cities[this.cityFocus];
      for (i = 0; i < list.length; i += 4) {
        t = list[i]; if (Hex.distance(t, fc.tile) > 3) continue;
        x = list[i + 1]; y = list[i + 2];
        if (m.city[t] === fc.id) { ctx.strokeStyle = 'rgba(255,240,180,0.6)'; ctx.lineWidth = 1.5; hexPath(ctx, x, y, s, 2); ctx.stroke(); }
        else { ctx.fillStyle = 'rgba(0,0,0,0.25)'; hexPath(ctx, x, y, s); ctx.fill(); }
      }
    }
    // reachable highlight
    if (this.reach) {
      ctx.fillStyle = 'rgba(140,210,255,0.11)'; ctx.strokeStyle = 'rgba(180,230,255,0.22)'; ctx.lineWidth = 1;
      for (i = 0; i < list.length; i += 4) if (this.reach[list[i]]) { hexPath(ctx, list[i + 1], list[i + 2], s, 1.5); ctx.fill(); ctx.stroke(); }
    }
    if (this.attackTiles) {
      for (i = 0; i < list.length; i += 4) if (this.attackTiles[list[i]]) { ctx.strokeStyle = '#ff3b30'; ctx.lineWidth = Math.max(2, s * 0.08); hexPath(ctx, list[i + 1], list[i + 2], s, 2); ctx.stroke(); }
    }
    if (this.showGrid) { ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1; for (i = 0; i < list.length; i += 4) if (this.visibility(list[i])) { hexPath(ctx, list[i + 1], list[i + 2], s); ctx.stroke(); } }
    // ---- pass 3: tall objects, improvements, resources, cities, units (row order)
    var anim = {}; var now2 = now || performance.now();
    this.anims.forEach(function (a) { var kq = Math.min(1, (now2 - a.t0) / a.dur); anim[a.id] = [a.dx * (1 - kq), a.dy * (1 - kq)]; });
    var unitsByTile = {};
    if (game._uidx) for (var tk2 in game._uidx) unitsByTile[tk2] = game._uidx[tk2];
    for (i = 0; i < list.length; i += 4) {
      t = list[i]; vv = this.visibility(t); if (!vv) continue;
      x = list[i + 1]; y = list[i + 2];
      tk = LIST[m.terrain[t]]; fk = FL[m.feature[t]];
      var nwk = m.nw[t] ? IDS.nw.list[m.nw[t]] : null;
      var city = E.cityAt(game, t);
      var tallF = (fk === 'forest' || fk === 'jungle' || fk === 'oasis' || fk === 'atoll') ? fk : '';
      var hillTall = m.hills[t] && !(G.GFX && G.GFX.hillsInGround);
      if ((hillTall || tk === 'mountain' || tallF || nwk) && !(city && (tallF || m.hills[t]) && false)) {
        variant = (t * 2246822519 >>> 0) % 5;
        var hl = m.hills[t] ? 1 : 0;
        if (city) { tallF = ''; }
        if (hillTall || tk === 'mountain' || tallF || nwk) {
          sp = this.sprite('t' + tk + tallF + hl + variant + (nwk || ''), function (S) { return P.tall(S, tk, tallF, variant, hl, nwk); });
          kk = s / sp.S; ctx.drawImage(sp.c, x - sp.ax * kk, y - sp.ay * kk + s * 0.25, sp.c.width * kk, sp.c.height * kk);
        }
      }
      var ik = m.imp[t] ? IDS.imp.list[m.imp[t]] : null;
      if (ik && !city) {
        var pil = m.pillaged[t];
        sp = this.sprite('i' + ik + pil, function (S) { return P.improvement(S, ik, pil); });
        kk = s / sp.S * 1.4; ctx.drawImage(sp.c, x - sp.ax * kk, y - sp.ay * kk + s * 0.3, sp.c.width * kk, sp.c.height * kk);
      }
      if (m.hut[t]) { sp = this.sprite('iruins0', function (S) { return P.improvement(S, 'ruins', 0); }); kk = s / sp.S; ctx.drawImage(sp.c, x - sp.ax * kk, y - sp.ay * kk + s * 0.25, sp.c.width * kk, sp.c.height * kk); }
      if (m.res[t] && s >= 14 && !city) {
        var rk = IDS.res.list[m.res[t]];
        if (!viewer || R.resVisible(viewer, rk) || this.revealAll) {
          var rd = D.RESOURCES[rk];
          var rx = x - s * 0.48, ry = y + s * 0.32;
          ctx.fillStyle = rd.type === 'luxury' ? 'rgba(80,40,90,0.85)' : rd.type === 'strategic' ? 'rgba(90,40,30,0.85)' : 'rgba(40,70,30,0.85)';
          ctx.beginPath(); ctx.arc(rx, ry, s * 0.24, 0, Math.PI * 2); ctx.fill();
          ctx.strokeStyle = '#e8c870'; ctx.lineWidth = Math.max(1, s * 0.04); ctx.stroke();
          ctx.font = Math.round(s * 0.3) + 'px "Segoe UI Emoji","Apple Color Emoji","Noto Color Emoji",sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          ctx.fillStyle = '#fff'; ctx.fillText(rd.icon, rx, ry + 1);
        }
      }
      if (nwk && s >= 18 && vv) { ctx.font = 'bold ' + Math.round(s * 0.24) + 'px Cinzel, Georgia, serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#ffe9a0'; ctx.strokeStyle = 'rgba(0,0,0,0.8)'; ctx.lineWidth = 3; ctx.strokeText(D.NATURAL_WONDERS[nwk].name, x, y + s * 0.65); ctx.fillText(D.NATURAL_WONDERS[nwk].name, x, y + s * 0.65); }
      if (city) this.drawCity(ctx, city, x, y, vv);
      // fog overlay for explored-not-visible
      if (vv === 1) { if (G.GFX && G.GFX.fog) G.GFX.fog(ctx, x, y, s); else { ctx.fillStyle = 'rgba(8,6,4,0.48)'; hexPath(ctx, x, y, s + 0.5); ctx.fill(); } }
      // units
      if (vv === 2 && unitsByTile[t]) {
        var us = unitsByTile[t];
        var civ = null, mil = null, air = 0;
        for (var q2 = 0; q2 < us.length; q2++) { var ud = D.UNITS[us[q2].type]; if (ud.domain === 'air') { air++; if (!city) mil = mil || us[q2]; } else if (ud.cls === 'civilian' || ud.cls === 'gp') civ = us[q2]; else mil = us[q2]; }
        if (city) {
          // garrisons and civilians stand at the edge of the city so its buildings stay visible
          if (civ) this.drawUnit(ctx, civ, x - s * 0.5, y + s * 0.18, anim[civ.id], 0.72);
          if (mil) this.drawUnit(ctx, mil, x + s * 0.5, y + s * 0.18, anim[mil.id], 0.78);
        } else {
          if (civ) this.drawUnit(ctx, civ, x + (mil ? -s * 0.38 : 0), y + (mil ? -s * 0.05 : 0), anim[civ.id], mil ? 0.8 : 1);
          if (mil) this.drawUnit(ctx, mil, x + (civ ? s * 0.18 : 0), y, anim[mil.id], 1);
        }
        if (air && city) { ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.fillRect(x + s * 0.4, y - s * 0.95, s * 0.5, s * 0.3); ctx.fillStyle = '#fff'; ctx.font = Math.round(s * 0.22) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillText('✈' + air, x + s * 0.65, y - s * 0.8); }
      }
    }
    if (this.hooks && this.hooks.objects) this.hooks.objects.call(this, ctx, list, now || performance.now());
    // city banners on top
    for (i = 0; i < list.length; i += 4) { t = list[i]; city = E.cityAt(game, t); if (city && this.visibility(t)) this.drawCityBanner(ctx, city, list[i + 1], list[i + 2]); }
    // yields overlay
    if (this.showYields || this.cityFocus != null) this.drawYields(ctx, list);
    // selection & path
    if (this.selected != null) {
      var su = game.units[this.selected];
      if (su) { var sp2 = this.tileScreen(su.tile); ctx.strokeStyle = '#ffe14a'; ctx.lineWidth = Math.max(2, s * 0.07); hexPath(ctx, sp2.x, sp2.y, s, 2); ctx.stroke(); }
    }
    if (this.selTile != null) { var st2 = this.tileScreen(this.selTile); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = 2; hexPath(ctx, st2.x, st2.y, s, 2); ctx.stroke(); }
    if (this.path && this.path.length && G.GFX && G.GFX.drawPath) G.GFX.drawPath(this, ctx, this.path, now || performance.now());
    else if (this.path && this.path.length) {
      ctx.fillStyle = 'rgba(255,240,150,0.95)';
      for (i = 0; i < this.path.length; i++) { var pp = this.tileScreen(this.path[i].t); ctx.beginPath(); ctx.arc(pp.x, pp.y, Math.max(2.5, s * 0.09), 0, Math.PI * 2); ctx.fill(); if (this.path[i].turn) { ctx.fillStyle = 'rgba(0,0,0,0.7)'; ctx.beginPath(); ctx.arc(pp.x, pp.y, s * 0.22, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#fff'; ctx.font = 'bold ' + Math.round(s * 0.26) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(this.path[i].turn, pp.x, pp.y); ctx.fillStyle = 'rgba(255,240,150,0.95)'; } }
    }
    if (this.hooks && this.hooks.overlay) this.hooks.overlay.call(this, ctx, list, now || performance.now());
    // atmosphere: warm key light and vignette
    if (!this._vig || this._vig.w !== this.cw || this._vig.h !== this.ch) {
      var vg = ctx.createRadialGradient(this.cw / 2, this.ch / 2, Math.min(this.cw, this.ch) * 0.35, this.cw / 2, this.ch / 2, Math.max(this.cw, this.ch) * 0.75);
      vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(10,6,2,0.42)');
      var lg = ctx.createLinearGradient(0, 0, this.cw, this.ch); lg.addColorStop(0, 'rgba(255,225,160,0.07)'); lg.addColorStop(0.5, 'rgba(255,225,160,0)'); lg.addColorStop(1, 'rgba(40,60,120,0.06)');
      this._vig = { w: this.cw, h: this.ch, v: vg, l: lg };
    }
    ctx.fillStyle = this._vig.l; ctx.fillRect(0, 0, this.cw, this.ch);
    ctx.fillStyle = this._vig.v; ctx.fillRect(0, 0, this.cw, this.ch);
    // effects
    var nowE = performance.now();
    this.effects.forEach(function (ef) {
      var p2 = self.tileScreen(ef.tile), kq = (nowE - ef.t0) / ef.dur;
      if (ef.radius) { var rr = s * (1 + ef.radius * 2.5) * kq; var g = ctx.createRadialGradient(p2.x, p2.y, 0, p2.x, p2.y, rr); g.addColorStop(0, 'rgba(255,255,220,' + (1 - kq) + ')'); g.addColorStop(0.5, 'rgba(255,140,30,' + (0.8 * (1 - kq)) + ')'); g.addColorStop(1, 'rgba(120,30,0,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(p2.x, p2.y, rr, 0, Math.PI * 2); ctx.fill(); }
      else { ctx.fillStyle = ef.color; ctx.globalAlpha = 1 - kq; ctx.beginPath(); ctx.arc(p2.x, p2.y - s * 0.4, s * (0.3 + kq * 0.6), 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
    });
    this.floats.forEach(function (f) {
      var p2 = self.tileScreen(f.tile), kq = (nowE - f.t0) / f.dur;
      ctx.font = 'bold ' + Math.round(Math.max(12, s * 0.42)) + 'px Cinzel, Georgia, serif'; ctx.textAlign = 'center';
      ctx.globalAlpha = Math.min(1, 2 * (1 - kq)); ctx.lineWidth = 3; ctx.strokeStyle = '#000'; ctx.strokeText(f.text, p2.x, p2.y - s * 0.9 - kq * s); ctx.fillStyle = f.color; ctx.fillText(f.text, p2.x, p2.y - s * 0.9 - kq * s); ctx.globalAlpha = 1;
    });
  };

  Renderer.prototype.drawCity = function (ctx, c, x, y, vv) {
    var game = this.game, s = this.s, p = game.players[c.owner];
    var era = Math.min(7, p.era || 0), walls = R.hasBuilding(c, 'walls') ? 1 : 0, cap = c.capital ? 1 : 0;
    var sz = c.pop < 3 ? 1 : c.pop < 6 ? 4 : c.pop < 10 ? 7 : c.pop < 15 ? 10 : 13;
    var variant = c.id % 7;
    var sp = this.sprite('c' + era + '_' + sz + walls + cap + variant, function (S) { return P.city(S, era, sz, walls, cap, p.color, variant); });
    var kk = s / sp.S;
    var wdraw = null;
    if (G.GFX && G.GFX.wonder && c.wonders.length && s >= 14) {
      var spots = [[-1.45, 0.15], [1.45, 0.18], [-0.85, -0.45], [0.85, -0.42], [-1.1, 0.8], [1.12, 0.8]];
      var self = this;
      wdraw = function (front) {
        c.wonders.slice(0, 6).forEach(function (wid, i) {
          if ((spots[i][1] > 0.3) !== front) return;
          var ws = self.sprite('w' + wid, function (S) { return G.GFX.wonder(S, wid); }), wk = s / ws.S * 1.0;
          ctx.drawImage(ws.c, x + spots[i][0] * s - ws.ax * wk, y + spots[i][1] * s - ws.ay * wk, ws.c.width * wk, ws.c.height * wk);
        });
      };
      wdraw(false);
    }
    ctx.drawImage(sp.c, x - sp.ax * kk, y - sp.ay * kk + s * 0.2, sp.c.width * kk, sp.c.height * kk);
    if (wdraw) wdraw(true);
    if (c.razing) { ctx.fillStyle = 'rgba(255,90,20,0.5)'; ctx.beginPath(); ctx.arc(x, y - s * 0.4, s * 0.5, 0, Math.PI * 2); ctx.fill(); }
  };
  Renderer.prototype.drawCityBanner = function (ctx, c, x, y) {
    var game = this.game, s = this.s, p = game.players[c.owner];
    var fs = Math.max(10, Math.round(s * 0.34));
    ctx.font = 'bold ' + fs + 'px Cinzel, Georgia, serif';
    var name = (c.capital ? '★ ' : '') + c.name;
    var tw = ctx.measureText(name).width;
    var bw = tw + fs * 3.2, bh = fs * 1.55, bx = x - bw / 2, by = y - s * 1.55 - bh;
    // banner
    var g = ctx.createLinearGradient(0, by, 0, by + bh); g.addColorStop(0, shade(p.color, 0.15)); g.addColorStop(1, shade(p.color, -0.35));
    ctx.fillStyle = g; roundRect(ctx, bx, by, bw, bh, bh * 0.3); ctx.fill();
    ctx.strokeStyle = '#d8b65a'; ctx.lineWidth = Math.max(1, fs * 0.1); ctx.stroke();
    if (G.GFX && G.GFX.emblem && !p.isCS) { var em = G.GFX.emblem(p.color, p.color2, p.civ, Math.round(fs * 1.5)); ctx.drawImage(em, bx - fs * 1.75, by - fs * 0.35, fs * 1.5, fs * 1.72); }
    // pop circle
    ctx.fillStyle = '#1c140c'; ctx.beginPath(); ctx.arc(bx + bh * 0.55, by + bh / 2, bh * 0.42, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8b65a'; ctx.stroke();
    ctx.fillStyle = '#fff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold ' + Math.round(fs * 0.85) + 'px Georgia, serif'; ctx.fillText(c.pop, bx + bh * 0.55, by + bh / 2 + 1);
    ctx.font = 'bold ' + fs + 'px Cinzel, Georgia, serif'; ctx.fillStyle = p.color2 === '#f0f0f0' || p.color2 === '#ffffff' ? '#fff' : '#fff';
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 2.5; ctx.strokeText(name, x + fs * 0.35, by + bh / 2 + 1); ctx.fillText(name, x + fs * 0.35, by + bh / 2 + 1);
    // strength shield
    var str = Math.round(E.cityStrength(game, c));
    ctx.fillStyle = '#2a2a2a'; ctx.fillRect(bx + bw - fs * 1.1, by + bh * 0.15, fs * 0.95, bh * 0.7);
    ctx.fillStyle = '#ffd34a'; ctx.font = 'bold ' + Math.round(fs * 0.62) + 'px sans-serif'; ctx.fillText(str, bx + bw - fs * 0.62, by + bh / 2 + 1);
    // HP bar
    var maxHp = E.cityMaxHp(game, c);
    if (c.hp < maxHp) { var f = Math.max(0, c.hp / maxHp); ctx.fillStyle = '#300'; ctx.fillRect(bx + 4, by + bh + 2, bw - 8, Math.max(3, fs * 0.25)); ctx.fillStyle = f > 0.5 ? '#3c3' : f > 0.25 ? '#ec3' : '#e33'; ctx.fillRect(bx + 4, by + bh + 2, (bw - 8) * f, Math.max(3, fs * 0.25)); }
    // production line for owner
    if (c.owner === this.viewer && s >= 16) {
      var item = c.build ? E.itemName(c.build) : 'Choose production!';
      var y2 = by - fs * 0.75;
      ctx.font = Math.round(fs * 0.72) + 'px Georgia, serif'; ctx.fillStyle = c.build ? '#f2e6c0' : '#ff8a6a'; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 3;
      var turns = '';
      if (c.build && c.lastYields && c.build.kind !== 'process') { var cost = E.itemCost(game, c, c.build), pt = E.prodTowards(game, c, c.lastYields); turns = ' (' + Math.max(1, Math.ceil((cost - c.prod) / Math.max(0.1, pt))) + ')'; }
      ctx.strokeText(item + turns, x, y2); ctx.fillText(item + turns, x, y2);
    }
    // religion icon
    var rel = E.majorityReligion(c);
    if (rel && s >= 16) { var rd = D.RELIGIONS.filter(function (q) { return q.id === rel; })[0]; if (rd) { ctx.fillStyle = rd.color; ctx.beginPath(); ctx.arc(bx + bw + fs * 0.55, by + bh / 2, fs * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#000'; ctx.font = Math.round(fs * 0.6) + 'px sans-serif'; ctx.fillText(rd.icon, bx + bw + fs * 0.55, by + bh / 2 + 1); } }
    if (p.isCS && s >= 16) { var ct = D.CS_TYPES[p.csType]; ctx.font = Math.round(fs * 0.62) + 'px Georgia, serif'; ctx.fillStyle = '#ddd'; ctx.strokeStyle = 'rgba(0,0,0,0.85)'; ctx.lineWidth = 3; var lbl = ct.name + ' City-State' + (p.ally != null ? ' — ally: ' + game.players[p.ally].name : ''); ctx.strokeText(lbl, x, by + bh + fs * 0.9); ctx.fillText(lbl, x, by + bh + fs * 0.9); }
  };
  function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }

  Renderer.prototype.drawUnit = function (ctx, u, x, y, off, scale) {
    var game = this.game, s = this.s, p = game.players[u.owner];
    if (off) { x += off[0]; y += off[1]; }
    var type = u.type, emb = G.Units.embarked(game, u);
    var key = 'u' + (emb ? 'emb_' : '') + type + p.color + p.color2;
    var sp = this.sprite(key, function (S) {
      if (emb) {
        var c = P.unit(S, 'trireme', p.color, p.color2); // boat
        var c2 = P.unit(S * 0.7, type, p.color, p.color2);
        var ctx2 = c.c.getContext('2d'); ctx2.drawImage(c2.c, c.ax - c2.ax, c.ay - c2.ay - S * 0.15);
        return c;
      }
      return P.unit(S, type, p.color, p.color2);
    });
    var kk = s / sp.S * (scale || 1) * 1.32;
    if (G.GFX && G.GFX.offset) { var gofs = G.GFX.offset(u, performance.now(), s, this); x += gofs[0]; y += gofs[1]; }
    ctx.drawImage(sp.c, x - sp.ax * kk, y - sp.ay * kk + s * 0.35, sp.c.width * kk, sp.c.height * kk);
    // flag with HP
    var fy = y - s * 1.15, fw = s * 0.7;
    if (u.hp < 100 || s >= 22) {
      ctx.fillStyle = 'rgba(0,0,0,0.65)'; ctx.fillRect(x - fw / 2, fy, fw, Math.max(3, s * 0.08));
      var f = u.hp / 100; ctx.fillStyle = f > 0.66 ? '#4cd137' : f > 0.33 ? '#fbc531' : '#e84118'; ctx.fillRect(x - fw / 2, fy, fw * f, Math.max(3, s * 0.08));
    }
    if (s >= 20) {
      var icons = '';
      if (u.fortify > 0) icons += '🛡'; if (u.sleep) icons += 'z'; if (u.build) icons += '⚒'; if (u.pendingPromo && u.owner === this.viewer) icons += '★';
      if (u.automate) icons += 'A'; if (u.explore) icons += '?';
      if (icons) { ctx.font = Math.round(s * 0.26) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.fillStyle = '#fff'; ctx.strokeStyle = '#000'; ctx.lineWidth = 2; ctx.strokeText(icons, x, fy - s * 0.12); ctx.fillText(icons, x, fy - s * 0.12); }
    }
    if (u.owner === this.viewer && G.Units.needsOrders(game, u) && this.blink) { ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.ellipse(x, y + s * 0.35, s * 0.55, s * 0.22, 0, 0, Math.PI * 2); ctx.stroke(); }
  };

  Renderer.prototype.drawYields = function (ctx, list) {
    var game = this.game, s = this.s, viewer = game.players[this.viewer];
    if (s < 18) return;
    var fc = this.cityFocus != null ? game.cities[this.cityFocus] : null;
    for (var i = 0; i < list.length; i += 4) {
      var t = list[i]; if (!this.visibility(t)) continue;
      if (fc && Hex.distance(t, fc.tile) > 3) continue;
      var y = R.tileYield(game, t, viewer, fc && game.map.city[t] === fc.id ? fc : null);
      var items = [];
      if (y.f) items.push(['#7ed957', y.f]); if (y.p) items.push(['#e8913a', y.p]); if (y.g) items.push(['#f2d03b', y.g]);
      if (y.s) items.push(['#5ab7f2', y.s]); if (y.c) items.push(['#d070e8', y.c]); if (y.fa) items.push(['#f2f2f2', y.fa]);
      var x0 = list[i + 1] - (items.length - 1) * s * 0.17, y0 = list[i + 2] + s * 0.12;
      for (var k = 0; k < items.length; k++) {
        ctx.fillStyle = 'rgba(0,0,0,0.6)'; ctx.beginPath(); ctx.arc(x0 + k * s * 0.34, y0, s * 0.16, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = items[k][0]; ctx.beginPath(); ctx.arc(x0 + k * s * 0.34, y0, s * 0.13, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#111'; ctx.font = 'bold ' + Math.round(s * 0.2) + 'px sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.fillText(Math.round(items[k][1]), x0 + k * s * 0.34, y0 + 1);
      }
      if (fc && fc.worked.indexOf(t) >= 0) { ctx.fillStyle = '#ffe14a'; ctx.beginPath(); ctx.arc(list[i + 1], list[i + 2] - s * 0.35, s * 0.14, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#000'; ctx.lineWidth = 1; ctx.stroke(); if (fc.locked[t]) { ctx.fillStyle = '#000'; ctx.font = Math.round(s * 0.18) + 'px sans-serif'; ctx.fillText('🔒', list[i + 1], list[i + 2] - s * 0.35); } }
    }
  };

  // ---------------- Minimap ----------------
  Renderer.prototype.drawMinimap = function (canvas) {
    var game = this.game; if (!game) return;
    var m = game.map, W = m.W, H = m.H, ctx = canvas.getContext('2d');
    var cw = canvas.width, ch = canvas.height;
    if (!this._mini || this._miniTurn !== game.turn || this._miniDirty) {
      var img = ctx.createImageData(W, H), d = img.data, LIST = IDS.terrain.list;
      var viewer = game.players[this.viewer];
      for (var t = 0; t < W * H; t++) {
        var v = this.visibility(t), o = t * 4;
        if (!v) { d[o] = 12; d[o + 1] = 10; d[o + 2] = 8; d[o + 3] = 255; continue; }
        var col = D.TERRAIN[LIST[m.terrain[t]]].color;
        var n = parseInt(col.substr(1), 16), cr = (n >> 16) & 255, cg = (n >> 8) & 255, cb = n & 255;
        if (m.hills[t]) { cr *= 0.82; cg *= 0.82; cb *= 0.82; }
        if (m.feature[t] === IDS.feature.map.forest || m.feature[t] === IDS.feature.map.jungle) { cr *= 0.7; cg *= 0.85; cb *= 0.7; }
        var ty = (t / W) | 0, tx = t % W;
        var lit = 1 + ((m.elev[t] - (m.elev[ty * W + ((tx + 1) % W)] || 0)) / 255) * 0.6;
        cr *= lit; cg *= lit; cb *= lit;
        if (m.owner[t] >= 0) { var on = parseInt(game.players[m.owner[t]].color.substr(1), 16); cr = cr * 0.45 + ((on >> 16) & 255) * 0.55; cg = cg * 0.45 + ((on >> 8) & 255) * 0.55; cb = cb * 0.45 + (on & 255) * 0.55; }
        if (E.cityAt(game, t)) { cr = cg = cb = 255; }
        var f = v === 1 ? 0.6 : 1;
        d[o] = Math.min(255, cr * f); d[o + 1] = Math.min(255, cg * f); d[o + 2] = Math.min(255, cb * f); d[o + 3] = 255;
      }
      var off = mkCanvas(W, H); off.getContext('2d').putImageData(img, 0, 0);
      this._mini = off; this._miniTurn = game.turn; this._miniDirty = false;
    }
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#000'; ctx.fillRect(0, 0, cw, ch);
    ctx.drawImage(this._mini, 0, 0, cw, ch);
    // viewport
    var ww = this.worldW(), wh = 1.5 * this.s * H * TILT;
    var vx = (this.cam.x - this.cw / 2) / ww * cw, vy = (this.cam.y - this.ch / 2) / wh * ch, vw = this.cw / ww * cw, vh = this.ch / wh * ch;
    ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5;
    vx = ((vx % cw) + cw) % cw;
    ctx.strokeRect(vx, vy, vw, vh); if (vx + vw > cw) ctx.strokeRect(vx - cw, vy, vw, vh);
  };

  Renderer.TILT = TILT; Renderer.SQ3 = SQ3; Renderer.P = P; Renderer.shade = shade;
  return Renderer;
})();
