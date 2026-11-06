// ============================================================
//  Nature: forests (oak, pine, jungle, palm), faceted mountains
//  with snow, and individually designed natural wonders.
// ============================================================
(function (GF) {
  var TILT = GF.TILT;
  function shadowEll(ctx, x, y, rx, ry, a) { ctx.fillStyle = 'rgba(10,15,5,' + (a || 0.32) + ')'; ctx.beginPath(); ctx.ellipse(x + rx * 0.35, y + ry * 0.2, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function trunk(ctx, x, y, w, h) { var g = ctx.createLinearGradient(x - w, 0, x + w, 0); g.addColorStop(0, '#7a5434'); g.addColorStop(1, '#3a2614'); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w, y); ctx.lineTo(x - w * 0.6, y - h); ctx.lineTo(x + w * 0.6, y - h); ctx.lineTo(x + w, y); ctx.closePath(); ctx.fill(); }
  GF.tree = function (ctx, x, y, S, kind, r) {
    var h = S * (0.34 + r() * 0.14);
    if (kind === 'pine') {
      shadowEll(ctx, x, y, h * 0.32, h * 0.1);
      trunk(ctx, x, y, h * 0.06, h * 0.25);
      var layers = 4;
      for (var k = 0; k < layers; k++) {
        var ty = y - h * 0.18 - k * h * 0.22, tw = h * (0.38 - k * 0.075), th = h * 0.42;
        var g = ctx.createLinearGradient(x - tw, 0, x + tw, 0);
        g.addColorStop(0, '#4f8e4a'); g.addColorStop(0.45, '#2d6430'); g.addColorStop(1, '#123718');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - tw, ty);
        for (var j = 0; j <= 4; j++) { var jx = x - tw + j * tw / 2; ctx.lineTo(jx, ty + (j % 2 ? h * 0.035 : 0)); }
        ctx.lineTo(x + tw, ty); ctx.lineTo(x, ty - th); ctx.closePath(); ctx.fill();
        if (k === layers - 1 && r() < 0.5) { ctx.fillStyle = 'rgba(240,248,255,0.8)'; ctx.beginPath(); ctx.moveTo(x - tw * 0.4, ty - th * 0.6); ctx.lineTo(x, ty - th); ctx.lineTo(x + tw * 0.3, ty - th * 0.62); ctx.fill(); }
      }
      return;
    }
    if (kind === 'palm') {
      shadowEll(ctx, x, y, h * 0.3, h * 0.09);
      var lean = (r() - 0.5) * h * 0.3;
      ctx.strokeStyle = '#7a5838'; ctx.lineWidth = Math.max(1, h * 0.08);
      ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(x + lean * 0.3, y - h * 0.55, x + lean, y - h * 1.05); ctx.stroke();
      ctx.strokeStyle = 'rgba(40,25,10,0.5)'; ctx.lineWidth = Math.max(0.5, h * 0.02);
      for (k = 1; k < 6; k++) { var yy = y - h * 0.18 * k; ctx.beginPath(); ctx.moveTo(x + lean * k / 6 - h * 0.04, yy); ctx.lineTo(x + lean * k / 6 + h * 0.04, yy); ctx.stroke(); }
      var tx = x + lean, tyy = y - h * 1.05;
      for (k = 0; k < 7; k++) {
        var a = -Math.PI + k * Math.PI / 6 + (r() - 0.5) * 0.3, len = h * (0.45 + r() * 0.15);
        ctx.strokeStyle = k % 2 ? '#2f7a2a' : '#4a9a3a'; ctx.lineWidth = Math.max(1, h * 0.09);
        ctx.beginPath(); ctx.moveTo(tx, tyy); ctx.quadraticCurveTo(tx + Math.cos(a) * len * 0.6, tyy + Math.sin(a) * len * 0.5 - h * 0.12, tx + Math.cos(a) * len, tyy + Math.sin(a) * len * 0.4 + h * 0.08); ctx.stroke();
      }
      ctx.fillStyle = '#6a4a20'; ctx.beginPath(); ctx.arc(tx, tyy + h * 0.04, h * 0.05, 0, Math.PI * 2); ctx.fill();
      return;
    }
    // broadleaf (oak) or jungle
    var jungle = kind === 'jungle';
    shadowEll(ctx, x, y, h * 0.42, h * 0.13);
    trunk(ctx, x, y, h * 0.07, h * 0.42);
    var base = jungle ? (r() < 0.5 ? '#235f22' : '#2e6e2a') : ['#3f7d2c', '#4c8a32', '#5a8f2e', '#6a9a34'][Math.floor(r() * 4)];
    if (!jungle && r() < 0.12) base = ['#b5752a', '#c0952a'][Math.floor(r() * 2)];
    var cy = y - h * 0.62, n = jungle ? 6 : 5;
    var puffs = [];
    for (k = 0; k < n; k++) { var aa = k / n * Math.PI * 2; puffs.push([x + Math.cos(aa) * h * 0.2, cy + Math.sin(aa) * h * 0.12 - (k === 0 ? h * 0.05 : 0), h * (0.2 + r() * 0.08)]); }
    puffs.push([x, cy - h * 0.15, h * 0.24]);
    puffs.sort(function (a, b) { return a[1] - b[1]; });
    ctx.fillStyle = GF.shade(base, -0.5); ctx.beginPath(); ctx.ellipse(x + h * 0.04, cy + h * 0.08, h * 0.38, h * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    puffs.forEach(function (p) { GF.blob(ctx, p[0], p[1], p[2], p[2] * 0.85, base, 0.32); });
    // rim light & leaf speckles
    ctx.fillStyle = 'rgba(220,255,160,0.35)';
    for (k = 0; k < 4; k++) { ctx.beginPath(); ctx.arc(x - h * 0.15 + r() * h * 0.15, cy - h * 0.2 + r() * h * 0.15, h * 0.03, 0, Math.PI * 2); ctx.fill(); }
    if (jungle) { ctx.strokeStyle = 'rgba(30,70,20,0.7)'; ctx.lineWidth = Math.max(0.6, h * 0.025); ctx.beginPath(); ctx.moveTo(x - h * 0.25, cy); ctx.quadraticCurveTo(x - h * 0.3, y - h * 0.2, x - h * 0.2, y - h * 0.05); ctx.stroke(); }
  };

  // ---------- mountains ----------
  function jag(ctx, pts, r, amp) { // midpoint displaced polyline
    var out = [pts[0], pts[1]];
    for (var i = 2; i < pts.length; i += 2) {
      var x0 = pts[i - 2], y0 = pts[i - 1], x1 = pts[i], y1 = pts[i + 1];
      for (var k = 1; k <= 3; k++) { var t = k / 4; out.push(x0 + (x1 - x0) * t + (r() - 0.5) * amp, y0 + (y1 - y0) * t + (r() - 0.5) * amp); }
      out.push(x1, y1);
    }
    return out;
  }
  GF.peak = function (ctx, px, py, pw, ph, S, r, opts) {
    opts = opts || {};
    var rock = opts.rock || '#8a8075', snowLine = opts.snow == null ? 0.42 : opts.snow;
    var ax = px + (r() - 0.5) * pw * 0.25, ay = py - ph;
    var mlx = px - pw * 0.45, mly = py - ph * 0.45, mrx = px + pw * 0.5, mry = py - ph * 0.5;
    // left lit face
    var lp = jag(ctx, [px - pw, py, mlx, mly, ax, ay], r, S * 0.06);
    lp.push(px + pw * 0.05, py);
    var g = ctx.createLinearGradient(px - pw, py - ph, px, py);
    g.addColorStop(0, GF.shade(rock, 0.32)); g.addColorStop(1, GF.shade(rock, 0.02));
    GF.poly(ctx, lp, g);
    // right shadow face
    var rp = jag(ctx, [ax, ay, mrx, mry, px + pw, py], r, S * 0.06);
    rp.push(px + pw * 0.05, py);
    var g2 = ctx.createLinearGradient(px, py - ph, px + pw, py);
    g2.addColorStop(0, GF.shade(rock, -0.25)); g2.addColorStop(1, GF.shade(rock, -0.55));
    GF.poly(ctx, rp, g2);
    // central ridge & gullies
    ctx.strokeStyle = 'rgba(30,22,15,0.45)'; ctx.lineWidth = Math.max(0.6, S * 0.02);
    ctx.beginPath(); ctx.moveTo(ax, ay); var gx = ax, gy = ay;
    for (var k = 0; k < 5; k++) { gx += (r() - 0.4) * pw * 0.12; gy += ph * 0.18; ctx.lineTo(gx, gy); } ctx.stroke();
    for (k = 0; k < 4; k++) { var sx = px - pw * 0.7 + r() * pw * 1.3, sy = py - r() * ph * 0.5; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + (r() - 0.5) * pw * 0.2, sy + ph * 0.15); ctx.stroke(); }
    // snow cap
    if (snowLine > 0) {
      var sl = ph * snowLine;
      var cap = [ax, ay];
      var lx = ax + (mlx - ax) * (sl / (ay - mly < 0 ? (mly - ay) : 1)) * 0, ly = ay + sl;
      cap.push(ax - pw * 0.38 * snowLine * 1.6, ay + sl * 0.95);
      for (k = 0; k < 6; k++) { var t = k / 5; cap.push(ax - pw * 0.6 * snowLine * 1.6 * (1 - t) + pw * 0.55 * snowLine * 1.6 * t, ay + sl * (0.6 + r() * 0.5)); }
      cap.push(ax + pw * 0.4 * snowLine * 1.6, ay + sl * 0.9);
      var sg = ctx.createLinearGradient(ax - pw * 0.3, ay, ax + pw * 0.3, ay);
      sg.addColorStop(0, '#ffffff'); sg.addColorStop(0.55, '#eef4fa'); sg.addColorStop(1, '#a9bdd2');
      GF.poly(ctx, cap, sg);
    }
  };
  function wonderGlow(ctx, x, y, S, col) { var g = ctx.createRadialGradient(x, y, 0, x, y, S * 1.1); g.addColorStop(0, col || 'rgba(255,220,120,0.35)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, S * 1.1, S * 0.9, 0, 0, Math.PI * 2); ctx.fill(); }

  GF.tall = function (S, tk, fk, variant, hills, nw) {
    var w = GF.SQ3 * S * 1.3, h = S * 3.4, c = GF.mk(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.72, r = GF.rng(variant * 104729 + (fk || '').length * 7 + (nw || '').length * 131 + 3);
    if (nw) { drawWonder(ctx, nw, cx, cy, S, r); return { c: c, ax: cx, ay: cy }; }
    if (tk === 'mountain') {
      ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.1, cy + S * 0.18, S * 1.0, S * 0.34, 0, 0, Math.PI * 2); ctx.fill();
      var peaks = r() < 0.4 ? [[-0.42, 0.16, 0.48, 0.8], [0.12, 0.02, 0.6, 1.15]] : [[-0.5, 0.18, 0.42, 0.72], [0.5, 0.2, 0.42, 0.7], [0, 0.0, 0.56, 1.1]];
      peaks.forEach(function (p) { GF.peak(ctx, cx + p[0] * S, cy + p[1] * S, p[2] * S, p[3] * S * (0.9 + r() * 0.25), S, r, {}); });
      // scree and rocks at the base
      for (var k = 0; k < 6; k++) GF.blob(ctx, cx + (r() - 0.5) * S * 1.4, cy + S * (0.12 + r() * 0.12), S * 0.07, S * 0.045, '#7a7268', 0.3);
      if (r() < 0.6) for (k = 0; k < 3; k++) GF.tree(ctx, cx + (r() - 0.5) * S * 1.3, cy + S * 0.25, S * 0.7, 'pine', r);
      return { c: c, ax: cx, ay: cy };
    }
    if (fk === 'forest' || fk === 'jungle') {
      var kind = fk === 'jungle' ? 'jungle' : (tk === 'tundra' || tk === 'snow' || hills) ? 'pine' : (r() < 0.25 ? 'pine' : 'leaf');
      var mixed = fk === 'forest' && kind === 'leaf';
      var pts = [], nT = S < 18 ? 5 : S < 40 ? 8 : 11;
      for (k = 0; k < nT; k++) {
        var a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.72;
        pts.push([cx + Math.cos(a) * d * S, cy - S * 0.12 + Math.sin(a) * d * S * TILT * 0.9]);
      }
      pts.sort(function (a, b) { return a[1] - b[1]; });
      pts.forEach(function (q) {
        var kk = kind;
        if (kind === 'jungle' && r() < 0.3) kk = 'palm';
        if (mixed && r() < 0.2) kk = 'pine';
        GF.tree(ctx, q[0], q[1], S, kk, r);
      });
    }
    if (fk === 'oasis') { GF.tree(ctx, cx - S * 0.42, cy - S * 0.02, S, 'palm', r); GF.tree(ctx, cx + S * 0.38, cy + S * 0.06, S, 'palm', r); GF.tree(ctx, cx + S * 0.05, cy - S * 0.25, S * 0.8, 'palm', r); }
    if (fk === 'atoll') { GF.tree(ctx, cx + S * 0.3, cy - S * 0.05, S * 0.8, 'palm', r); GF.tree(ctx, cx - S * 0.35, cy + S * 0.05, S * 0.7, 'palm', r); }
    return { c: c, ax: cx, ay: cy };
  };

  function drawWonder(ctx, nw, cx, cy, S, r) {
    ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.1, cy + S * 0.18, S * 0.95, S * 0.3, 0, 0, Math.PI * 2); ctx.fill();
    switch (nw) {
      case 'mt_fuji': case 'kilimanjaro': case 'mt_kailash':
        wonderGlow(ctx, cx, cy - S * 0.6, S);
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.95, S * 1.65, S, r, { rock: nw === 'mt_fuji' ? '#6c6a78' : '#7a6e60', snow: nw === 'kilimanjaro' ? 0.22 : 0.4 });
        break;
      case 'krakatoa': {
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.9, S * 1.2, S, r, { rock: '#4a3a34', snow: 0 });
        var lg = ctx.createRadialGradient(cx, cy - S * 1.0, 0, cx, cy - S * 1.0, S * 0.4); lg.addColorStop(0, 'rgba(255,200,60,0.95)'); lg.addColorStop(1, 'rgba(255,60,0,0)');
        ctx.fillStyle = lg; ctx.beginPath(); ctx.arc(cx, cy - S * 1.0, S * 0.4, 0, Math.PI * 2); ctx.fill();
        for (var k = 0; k < 5; k++) { ctx.fillStyle = 'rgba(80,70,70,' + (0.5 - k * 0.08) + ')'; ctx.beginPath(); ctx.arc(cx + k * S * 0.12, cy - S * (1.2 + k * 0.25), S * (0.18 + k * 0.06), 0, Math.PI * 2); ctx.fill(); }
        ctx.strokeStyle = '#ff6a1a'; ctx.lineWidth = S * 0.05; ctx.beginPath(); ctx.moveTo(cx, cy - S * 1.0); ctx.quadraticCurveTo(cx - S * 0.15, cy - S * 0.5, cx - S * 0.3, cy); ctx.stroke();
        break;
      }
      case 'uluru': case 'grand_mesa': case 'rock_gibraltar': {
        var col = nw === 'uluru' ? '#c2522a' : nw === 'grand_mesa' ? '#b86a3c' : '#a8a090';
        wonderGlow(ctx, cx, cy - S * 0.3, S);
        if (nw === 'rock_gibraltar') { GF.peak(ctx, cx, cy + S * 0.1, S * 0.9, S * 1.3, S, r, { rock: col, snow: 0 }); break; }
        var top = nw === 'uluru' ? S * 0.55 : S * 0.75;
        var g = ctx.createLinearGradient(0, cy - top, 0, cy + S * 0.1); g.addColorStop(0, GF.shade(col, 0.25)); g.addColorStop(1, GF.shade(col, -0.35));
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - S * 0.95, cy + S * 0.1);
        if (nw === 'uluru') { ctx.bezierCurveTo(cx - S * 0.9, cy - top, cx + S * 0.9, cy - top, cx + S * 0.95, cy + S * 0.1); }
        else { ctx.lineTo(cx - S * 0.7, cy - top); ctx.lineTo(cx + S * 0.65, cy - top); ctx.lineTo(cx + S * 0.95, cy + S * 0.1); }
        ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(60,20,10,0.35)'; ctx.lineWidth = S * 0.025;
        for (k = 0; k < 6; k++) { var lx = cx - S * 0.7 + k * S * 0.26; ctx.beginPath(); ctx.moveTo(lx, cy - top * 0.9); ctx.lineTo(lx + S * 0.05, cy); ctx.stroke(); }
        break;
      }
      case 'great_barrier': case 'lake_victoria':
        wonderGlow(ctx, cx, cy - S * 0.1, S, 'rgba(120,255,220,0.3)');
        for (k = 0; k < 16; k++) { GF.blob(ctx, cx + (r() - 0.5) * S * 1.4, cy - S * 0.15 + (r() - 0.5) * S * 0.7, S * 0.09, S * 0.06, ['#ff7a8a', '#ffd25a', '#7ae0c0', '#c38bff', '#ff9a4a'][k % 5], 0.4); }
        break;
      case 'old_faithful': case 'victoria_falls': {
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.85, S * 0.8, S, r, { rock: '#7a7468', snow: 0 });
        var wg = ctx.createLinearGradient(0, cy - S * 1.6, 0, cy); wg.addColorStop(0, 'rgba(255,255,255,0)'); wg.addColorStop(0.3, 'rgba(235,248,255,0.9)'); wg.addColorStop(1, 'rgba(180,220,255,0.6)');
        ctx.fillStyle = wg;
        if (nw === 'old_faithful') { ctx.beginPath(); ctx.moveTo(cx - S * 0.08, cy - S * 0.5); ctx.quadraticCurveTo(cx - S * 0.25, cy - S * 1.3, cx, cy - S * 1.7); ctx.quadraticCurveTo(cx + S * 0.25, cy - S * 1.3, cx + S * 0.08, cy - S * 0.5); ctx.fill(); }
        else { ctx.fillRect(cx - S * 0.3, cy - S * 0.65, S * 0.6, S * 0.7); ctx.fillStyle = 'rgba(255,255,255,0.5)'; for (k = 0; k < 6; k++) ctx.fillRect(cx - S * 0.28 + k * S * 0.1, cy - S * 0.65, S * 0.02, S * 0.7); }
        break;
      }
      case 'el_dorado': case 'fountain_youth':
        wonderGlow(ctx, cx, cy - S * 0.2, S, nw === 'el_dorado' ? 'rgba(255,210,60,0.55)' : 'rgba(140,240,255,0.5)');
        GF.blob(ctx, cx, cy - S * 0.05, S * 0.5, S * 0.25, nw === 'el_dorado' ? '#e8b830' : '#3ab8e0', 0.5);
        for (k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(255,255,220,0.9)'; ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * S, cy - S * 0.2 - r() * S * 0.6, S * 0.025, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'cerro_potosi': case 'king_solomon':
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.9, S * 1.3, S, r, { rock: '#7a5e48', snow: 0 });
        ctx.strokeStyle = '#ffd34a'; ctx.lineWidth = S * 0.03;
        for (k = 0; k < 5; k++) { ctx.beginPath(); var vx = cx + (r() - 0.5) * S * 0.8, vy = cy - r() * S * 0.8; ctx.moveTo(vx, vy); ctx.lineTo(vx + S * 0.15, vy + S * 0.1); ctx.stroke(); }
        break;
      default:
        wonderGlow(ctx, cx, cy - S * 0.5, S, 'rgba(255,255,200,0.4)');
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.85, S * 1.4, S, r, { rock: '#8a7f70', snow: 0.3 });
    }
    // golden star marker
    ctx.fillStyle = '#ffd84a'; ctx.strokeStyle = '#5a3a00'; ctx.lineWidth = Math.max(1, S * 0.02);
    ctx.beginPath(); for (k = 0; k < 10; k++) { var a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? S * 0.05 : S * 0.12; ctx.lineTo(cx + S * 0.75 + Math.cos(a) * rr, cy - S * 0.9 + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.stroke();
  }
})(G.GFX);
