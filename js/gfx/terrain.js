// ============================================================
//  Terrain ground painter: seamless per-pixel textures sampled from
//  periodic noise in world space, per-pixel lit hills, water depth,
//  and ground-level features (marsh, flood plains, ice, oasis...).
// ============================================================
(function (GF) {
  var SQ3 = GF.SQ3, TILT = GF.TILT;
  var RAMPS = {
    grassland: GF.ramp(['#2f6a1e', '#4a8a2a', '#64a238', '#83b84c', '#a3c962']),
    plains: GF.ramp(['#706c2a', '#8f8a38', '#aaa34a', '#c3b862', '#d8cb80']),
    desert: GF.ramp(['#b88f4e', '#cdab6a', '#ddc283', '#ead49c', '#f4e3b8']),
    tundra: GF.ramp(['#5b5f52', '#737766', '#8d8e78', '#a6a48c', '#bfbca3']),
    snow: GF.ramp(['#a9bccd', '#c8d6e3', '#e1eaf2', '#f2f6fa', '#ffffff']),
    coast: GF.ramp(['#1f6d96', '#2e83ab', '#3f98bd', '#56adcd', '#74c3dc']),
    ocean: GF.ramp(['#0b2f57', '#133f6c', '#1b4f7e', '#245f8f', '#2f6f9e']),
    lake: GF.ramp(['#2477a0', '#3a8fb8', '#4ea4c8', '#66b8d6', '#86cce2']),
    mountain: GF.ramp(['#4c463f', '#655d54', '#7d746a', '#978d82', '#b0a69a'])
  };
  var OFF = { grassland: 0.11, plains: 0.37, desert: 0.53, tundra: 0.71, snow: 0.29, coast: 0.83, ocean: 0.17, lake: 0.61, mountain: 0.47 };

  // world-domain period: 3 columns x 2 rows of hexes (so 6 tile variants tile seamlessly)
  var PX = 3 * SQ3, PY = 2 * 1.5 * TILT;

  GF.ground = function (S, tk, fk, variant, hills, vc, vr) {
    vc = vc || 0; vr = vr || 0;
    var w = Math.ceil(SQ3 * S + 4), h = Math.ceil(2 * S * TILT + 4);
    var c = GF.mk(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h / 2;
    var F = GF.fields(), ramp = RAMPS[tk] || RAMPS.grassland, off = OFF[tk] || 0;
    var water = tk === 'coast' || tk === 'ocean' || tk === 'lake';
    var img = ctx.createImageData(w, h), d = img.data;
    // tile centre in world units (hex radius = 1)
    var wx0 = SQ3 * (vc + 0.5 * (vr & 1)), wy0 = 1.5 * TILT * vr;
    var L = GF.L;
    // hill bumps in local coordinates (deterministic per variant)
    var bumps = [];
    if (hills) {
      var r = GF.rng(vc * 7 + vr * 13 + 101);
      var nb = 3;
      for (var b = 0; b < nb; b++) bumps.push([(r() - 0.5) * 0.9, (r() - 0.5) * 0.6 - 0.05, 0.32 + r() * 0.16, 0.55 + r() * 0.35]);
    }
    var fp = fk === 'floodplains', marsh = fk === 'marsh', ice = fk === 'ice', fall = fk === 'fallout';
    for (var py = 0; py < h; py++) {
      var ly = (py - cy) / S;
      for (var px = 0; px < w; px++) {
        var lx = (px - cx) / S;
        var dist = GF.hexDist(lx, ly / TILT, 1);
        var edge = (-dist) * S; // >0 inside, in pixels
        if (edge < -3) continue;
        var u = (wx0 + lx) / PX, v = (wy0 + ly) / PY;
        var n1 = GF.sample(F.low, u + off, v + off * 0.7);
        var n2 = GF.sample(F.mid, u * 2 + off, v * 2);
        var n3 = GF.sample(F.hi, u * 3 - off, v * 3 + off);
        var t = (n1 * 0.6 + n2 * 0.3 + n3 * 0.25 - 0.58) * 2.1 + 0.5;
        if (tk === 'desert') t = t * 0.7 + 0.25 * (0.5 + 0.5 * Math.sin((u * 18 + v * 9 + n1 * 6) * Math.PI));
        if (fp) t = t * 0.7 + 0.12;
        var col = ramp(t);
        var R = col[0], Gc = col[1], B = col[2];
        if (fp) { var s2 = 0.5 + 0.5 * Math.sin((v * 22 + n2 * 3) * Math.PI); R = R * 0.7 + 60 * s2 * 0.3 + 40; Gc = Gc * 0.75 + 90 * s2 * 0.25 + 30; B = B * 0.8; }
        if (tk === 'grassland' || tk === 'plains') { if (n3 > 0.78) { R += 18; Gc += 22; B += 8; } }
        if (tk === 'tundra' && n2 > 0.66) { R += 25; Gc += 30; B += 18; }
        if (water) {
          // depth & ripples
          var rip = Math.sin((u * 40 + n2 * 9) * Math.PI) * Math.sin((v * 30 - n1 * 7) * Math.PI);
          if (rip > 0.75) { R += 30; Gc += 35; B += 35; }
          if (tk === 'coast' && n1 > 0.62) { R += 14; Gc += 22; B += 10; }
        }
        if (marsh) {
          var mw = GF.sample(F.mid, u * 3 + 0.5, v * 3 + 0.2);
          if (mw > 0.6) { var k = Math.min(1, (mw - 0.6) * 6); R = R * (1 - k) + 60 * k; Gc = Gc * (1 - k) + 105 * k; B = B * (1 - k) + 115 * k; }
          else { R *= 0.85; Gc *= 0.92; B *= 0.7; }
        }
        if (ice) { var ic = 0.85 + n2 * 0.15; R = 225 * ic; Gc = 236 * ic; B = 246 * ic; if (n3 > 0.72) { R -= 50; Gc -= 30; B -= 10; } }
        if (fall) { R = R * 0.6 + 60; Gc = Gc * 0.7 + 80; B *= 0.5; }
        // lighting: hills height field
        var shadeK = 1;
        if (hills && !water) {
          var hgt = 0, gx = 0, gy = 0;
          for (b = 0; b < bumps.length; b++) {
            var bx = lx - bumps[b][0], by = ly / TILT - bumps[b][1], rr = bumps[b][2], a = bumps[b][3];
            var e = Math.exp(-(bx * bx + by * by) / (rr * rr));
            hgt += a * e; gx += -2 * bx / (rr * rr) * a * e; gy += -2 * by / (rr * rr) * a * e;
          }
          var fade = Math.max(0, Math.min(1, -dist * 4));
          gx *= fade * 0.55; gy *= fade * 0.55;
          var nx = -gx, ny = -gy, nz = 1, nl = Math.sqrt(nx * nx + ny * ny + 1);
          var dot = (nx * L[0] + ny * L[1] + nz * L[2]) / nl;
          shadeK = 0.55 + 0.62 * Math.max(0, dot) + hgt * fade * 0.08;
        }
        // gentle per-pixel micro shading and soft hex vignette
        shadeK *= 0.94 + n3 * 0.12;

        var i = (py * w + px) * 4;
        d[i] = Math.min(255, R * shadeK); d[i + 1] = Math.min(255, Gc * shadeK); d[i + 2] = Math.min(255, B * shadeK);
        d[i + 3] = edge >= -1.6 ? 255 : Math.max(0, Math.min(255, (edge + 3) / 1.4 * 255));
      }
    }
    ctx.putImageData(img, 0, 0);
    // ---- vector details on top ----
    var rr2 = GF.rng((vc + 1) * 31 + (vr + 1) * 17 + tk.length * 5);
    ctx.save(); GF.hexPath(ctx, cx, cy, S); ctx.clip();
    if (tk === 'grassland' || tk === 'plains') {
      var nbl = Math.round(S * 0.9);
      for (i = 0; i < nbl; i++) {
        var x = rr2() * w, y = rr2() * h, l = S * (0.05 + rr2() * 0.07);
        ctx.strokeStyle = rr2() < 0.5 ? 'rgba(20,50,10,0.35)' : 'rgba(210,235,140,0.35)'; ctx.lineWidth = Math.max(0.6, S * 0.018);
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + l * 0.25, y - l); ctx.stroke();
      }
      for (i = 0; i < 6; i++) { ctx.fillStyle = ['#f6e46a', '#ffffff', '#e8a0d0', '#ffb05a', '#b8e0ff', '#f6e46a'][i]; ctx.globalAlpha = 0.7; ctx.beginPath(); ctx.arc(rr2() * w, rr2() * h, Math.max(0.6, S * 0.022), 0, Math.PI * 2); ctx.fill(); }
      ctx.globalAlpha = 1;
    }
    if (tk === 'desert' && !hills) for (i = 0; i < 3; i++) { ctx.fillStyle = 'rgba(120,90,50,0.35)'; ctx.beginPath(); ctx.ellipse(rr2() * w, rr2() * h, S * 0.05, S * 0.03, 0, 0, Math.PI * 2); ctx.fill(); }
    if (tk === 'tundra') for (i = 0; i < 5; i++) { GF.blob(ctx, rr2() * w, rr2() * h, S * 0.05, S * 0.035, '#8a8a80', 0.3); }
    if (tk === 'snow') for (i = 0; i < 4; i++) { ctx.strokeStyle = 'rgba(140,170,200,0.35)'; ctx.lineWidth = S * 0.02; var sx = rr2() * w, sy = rr2() * h; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.quadraticCurveTo(sx + S * 0.2, sy - S * 0.06, sx + S * 0.4, sy); ctx.stroke(); }
    if (fk === 'marsh') {
      for (i = 0; i < 14; i++) { var mx = cx + (rr2() - 0.5) * S * 1.4, my = cy + (rr2() - 0.5) * S * 1.0; ctx.strokeStyle = rr2() < 0.5 ? '#4f6b2a' : '#7a8a3a'; ctx.lineWidth = Math.max(0.7, S * 0.025); ctx.beginPath(); ctx.moveTo(mx, my); ctx.quadraticCurveTo(mx + S * 0.02, my - S * 0.12, mx + (rr2() - 0.5) * S * 0.08, my - S * 0.22); ctx.stroke(); if (rr2() < 0.3) { ctx.fillStyle = '#5a3a1a'; ctx.fillRect(mx - S * 0.015, my - S * 0.26, S * 0.03, S * 0.07); } }
    }
    if (fk === 'oasis') {
      var og = ctx.createRadialGradient(cx, cy + S * 0.08, S * 0.05, cx, cy + S * 0.08, S * 0.45);
      og.addColorStop(0, '#2a9ad0'); og.addColorStop(0.75, '#1f7aa8'); og.addColorStop(1, 'rgba(60,120,60,0)');
      ctx.fillStyle = og; ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.08, S * 0.45, S * 0.26, 0, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(200,240,255,0.6)'; ctx.lineWidth = S * 0.02; ctx.beginPath(); ctx.ellipse(cx - S * 0.05, cy + S * 0.03, S * 0.18, S * 0.06, 0, 0, Math.PI); ctx.stroke();
    }
    if (fk === 'atoll') {
      ctx.strokeStyle = '#efe2b0'; ctx.lineWidth = S * 0.13; ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.48, S * 0.3, 0.2, 0, Math.PI * 1.7); ctx.stroke();
      ctx.strokeStyle = 'rgba(120,230,210,0.6)'; ctx.lineWidth = S * 0.06; ctx.beginPath(); ctx.ellipse(cx, cy, S * 0.36, S * 0.2, 0.2, 0, Math.PI * 2); ctx.stroke();
    }
    if (fk === 'ice') for (i = 0; i < 7; i++) { ctx.strokeStyle = 'rgba(110,150,200,0.55)'; ctx.lineWidth = Math.max(0.7, S * 0.02); ctx.beginPath(); var ix = rr2() * w, iy = rr2() * h; ctx.moveTo(ix, iy); ctx.lineTo(ix + (rr2() - 0.5) * S * 0.5, iy + rr2() * S * 0.3); ctx.lineTo(ix + (rr2() - 0.5) * S * 0.6, iy + rr2() * S * 0.45); ctx.stroke(); }
    if (fk === 'fallout') for (i = 0; i < 6; i++) { ctx.fillStyle = 'rgba(160,255,60,0.25)'; ctx.beginPath(); ctx.arc(rr2() * w, rr2() * h, S * 0.12, 0, Math.PI * 2); ctx.fill(); }
    ctx.restore();
    return { c: c, ax: cx, ay: cy };
  };
  GF.hillsInGround = true;
})(G.GFX);
