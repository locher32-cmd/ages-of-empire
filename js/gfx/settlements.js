// ============================================================
//  Settlements: 3/4-view cities that evolve by era (houses with
//  lit walls and roofs, landmarks, walls and towers), improvements.
// ============================================================
(function (GF) {
  var ERA = [
    { wall: '#c8a476', side: '#9a7a52', roof: '#9a7a40', roof2: '#b08a48', style: 'flat' },
    { wall: '#ece4d4', side: '#b8ad98', roof: '#b4482a', roof2: '#c85c34', style: 'gable' },
    { wall: '#c9bea8', side: '#8f8470', roof: '#4c3f36', roof2: '#7a3a2a', style: 'gable' },
    { wall: '#e0d4bc', side: '#a89a80', roof: '#3a5a8a', roof2: '#a8442e', style: 'gable' },
    { wall: '#a8584a', side: '#723a30', roof: '#4a4a4e', roof2: '#5e5e64', style: 'gable' },
    { wall: '#cfcac2', side: '#8e8a84', roof: '#5a6068', roof2: '#6e7884', style: 'flat' },
    { wall: '#d6dce2', side: '#8a96a2', roof: '#4a6a8a', roof2: '#6a8aaa', style: 'flat' },
    { wall: '#e8f0f6', side: '#90a8bc', roof: '#2a7ab0', roof2: '#4a9ad0', style: 'flat' }
  ];
  GF.ERA_STYLE = ERA;
  // house: x,y = front-bottom-centre
  function house(ctx, x, y, w, dep, h, st, roofCol, opts) {
    opts = opts || {};
    var dx = dep * 0.75, dy = dep * 0.4;
    // side face
    var sg = ctx.createLinearGradient(x + w / 2, 0, x + w / 2 + dx, 0); sg.addColorStop(0, st.side); sg.addColorStop(1, GF.shade(st.side, -0.25));
    GF.poly(ctx, [x + w / 2, y, x + w / 2 + dx, y - dy, x + w / 2 + dx, y - dy - h, x + w / 2, y - h], sg);
    // front face
    var fg = ctx.createLinearGradient(0, y - h, 0, y); fg.addColorStop(0, GF.shade(st.wall, 0.12)); fg.addColorStop(1, GF.shade(st.wall, -0.12));
    ctx.fillStyle = fg; ctx.fillRect(x - w / 2, y - h, w, h);
    // windows
    if (opts.tower) {
      ctx.fillStyle = opts.lit ? 'rgba(255,230,140,0.85)' : 'rgba(120,180,230,0.7)';
      var rows = Math.floor(h / (w * 0.32));
      for (var r = 0; r < rows; r++) for (var c = 0; c < 3; c++) ctx.fillRect(x - w * 0.38 + c * w * 0.28, y - h + w * 0.12 + r * w * 0.32, w * 0.18, w * 0.16);
      ctx.fillStyle = 'rgba(120,180,230,0.35)'; for (r = 0; r < rows; r++) ctx.fillRect(x + w / 2 + dx * 0.25, y - h - dy * 0.4 + w * 0.12 + r * w * 0.32, dx * 0.5, w * 0.14);
    } else {
      ctx.fillStyle = 'rgba(30,20,10,0.65)';
      ctx.fillRect(x - w * 0.1, y - h * 0.5, w * 0.2, h * 0.5);
      if (w > 6) { ctx.fillStyle = 'rgba(40,30,20,0.55)'; ctx.fillRect(x - w * 0.38, y - h * 0.75, w * 0.14, h * 0.18); ctx.fillRect(x + w * 0.24, y - h * 0.75, w * 0.14, h * 0.18); }
    }
    // roof
    var style = opts.style || st.style;
    if (style === 'gable') {
      var rh = w * 0.45, ov = w * 0.08;
      GF.poly(ctx, [x - w / 2 - ov, y - h, x + w / 2 + ov, y - h, x + w / 2 + dx * 0.5, y - h - dy * 0.5 - rh, x - w / 2 + dx * 0.5, y - h - dy * 0.5 - rh], GF.shade(roofCol, 0.12));
      GF.poly(ctx, [x + w / 2 + ov, y - h, x + w / 2 + dx + ov * 0.5, y - h - dy, x + w / 2 + dx * 0.5, y - h - dy * 0.5 - rh], GF.shade(roofCol, -0.3));
      ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = Math.max(0.5, w * 0.03);
      for (var k = 1; k < 4; k++) { var t = k / 4; ctx.beginPath(); ctx.moveTo(x - w / 2 - ov + (dx * 0.5 + ov) * t, y - h - (dy * 0.5 + rh) * t); ctx.lineTo(x + w / 2 + ov + (dx * 0.5 - w - ov) * t, y - h - (dy * 0.5 + rh) * t); ctx.stroke(); }
    } else if (style === 'dome') {
      var dg = ctx.createRadialGradient(x - w * 0.15, y - h - w * 0.35, w * 0.05, x, y - h, w * 0.6); dg.addColorStop(0, GF.shade(roofCol, 0.4)); dg.addColorStop(1, GF.shade(roofCol, -0.3));
      ctx.fillStyle = dg; ctx.beginPath(); ctx.arc(x + dx * 0.3, y - h - dy * 0.3, w * 0.5, Math.PI, 0); ctx.fill();
    } else {
      GF.poly(ctx, [x - w / 2, y - h, x + w / 2, y - h, x + w / 2 + dx, y - h - dy, x - w / 2 + dx, y - h - dy], GF.shade(roofCol, -0.05));
      ctx.strokeStyle = GF.shade(roofCol, -0.4); ctx.lineWidth = Math.max(0.5, w * 0.04); ctx.strokeRect(x - w / 2, y - h - 0.5, w, 1);
    }
  }
  GF.house = house;
  function landmark(ctx, era, x, y, S, st, col, r) {
    if (era === 0) { // ziggurat
      for (var k = 0; k < 4; k++) house(ctx, x, y - k * S * 0.13, S * (0.7 - k * 0.15), S * (0.45 - k * 0.09), S * 0.13, { wall: '#c9a06a', side: '#8f6c42' }, '#b08a58', { style: 'flat' });
      ctx.fillStyle = col; ctx.fillRect(x - S * 0.04, y - S * 0.75, S * 0.08, S * 0.12);
    } else if (era === 1) { // classical temple
      house(ctx, x, y, S * 0.7, S * 0.4, S * 0.08, { wall: '#d8d0c0', side: '#a8a090' }, '#d8d0c0', { style: 'flat' });
      ctx.fillStyle = '#f2ece0'; for (k = 0; k < 6; k++) ctx.fillRect(x - S * 0.32 + k * S * 0.12, y - S * 0.42, S * 0.05, S * 0.34);
      GF.poly(ctx, [x - S * 0.4, y - S * 0.42, x + S * 0.4, y - S * 0.42, x, y - S * 0.62], '#e8dfcc');
      GF.poly(ctx, [x + S * 0.4, y - S * 0.42, x + S * 0.6, y - S * 0.52, x + S * 0.2, y - S * 0.72, x, y - S * 0.62], '#b4482a');
    } else if (era === 2) { // cathedral with spire
      house(ctx, x, y, S * 0.6, S * 0.5, S * 0.4, st, st.roof2, { style: 'gable' });
      house(ctx, x - S * 0.22, y + S * 0.02, S * 0.2, S * 0.2, S * 0.75, st, st.roof, { style: 'flat' });
      GF.poly(ctx, [x - S * 0.32, y - S * 0.77, x - S * 0.12, y - S * 0.77, x - S * 0.15, y - S * 1.2], GF.shade(st.roof, -0.2));
    } else if (era === 3) { // domed basilica
      house(ctx, x, y, S * 0.7, S * 0.5, S * 0.35, st, st.roof, { style: 'flat' });
      house(ctx, x, y - S * 0.35, S * 0.4, S * 0.3, S * 0.12, st, st.roof, { style: 'dome' });
      ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.arc(x + S * 0.08, y - S * 0.9, S * 0.04, 0, Math.PI * 2); ctx.fill();
    } else if (era === 4) { // factory
      house(ctx, x, y, S * 0.8, S * 0.45, S * 0.3, st, st.roof, { style: 'gable' });
      for (k = 0; k < 2; k++) { var sx = x - S * 0.2 + k * S * 0.3; var g = ctx.createLinearGradient(sx, 0, sx + S * 0.09, 0); g.addColorStop(0, '#7a4038'); g.addColorStop(1, '#3a1a14'); ctx.fillStyle = g; ctx.fillRect(sx, y - S * 1.15, S * 0.09, S * 0.85); ctx.fillStyle = '#222'; ctx.fillRect(sx - S * 0.01, y - S * 1.17, S * 0.11, S * 0.04); }
    } else { // modern towers
      var hs = era >= 6 ? [1.6, 2.1, 1.3] : [1.2, 1.5, 0.9];
      house(ctx, x - S * 0.3, y + S * 0.05, S * 0.26, S * 0.22, S * hs[0], st, st.roof, { tower: true, lit: era >= 7 });
      house(ctx, x + S * 0.05, y - S * 0.05, S * 0.3, S * 0.25, S * hs[1], st, st.roof2, { tower: true, lit: era >= 7 });
      house(ctx, x + S * 0.38, y + S * 0.08, S * 0.24, S * 0.2, S * hs[2], st, st.roof, { tower: true });
      if (era >= 6) { ctx.strokeStyle = '#ddd'; ctx.lineWidth = S * 0.02; ctx.beginPath(); ctx.moveTo(x + S * 0.2, y - S * 2.1); ctx.lineTo(x + S * 0.2, y - S * 2.45); ctx.stroke(); ctx.fillStyle = '#ff4a3a'; ctx.beginPath(); ctx.arc(x + S * 0.2, y - S * 2.46, S * 0.025, 0, Math.PI * 2); ctx.fill(); }
    }
  }
  GF.city = function (S, era, size, walls, capital, col, variant) {
    var w = S * 3.2, h = S * 3.8, c = GF.mk(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.72, r = GF.rng(variant * 37 + 11 + era * 5), st = ERA[Math.min(7, era)];
    var rad = S * (0.55 + Math.min(1, size / 13) * 0.55);
    // ground: plaza with cobbles and radiating streets
    var pg = ctx.createRadialGradient(cx, cy, rad * 0.1, cx, cy, rad * 1.15);
    pg.addColorStop(0, era >= 5 ? 'rgba(120,120,120,0.85)' : 'rgba(165,140,105,0.85)'); pg.addColorStop(0.8, era >= 5 ? 'rgba(100,100,100,0.6)' : 'rgba(140,115,80,0.55)'); pg.addColorStop(1, 'rgba(120,100,70,0)');
    ctx.fillStyle = pg; ctx.beginPath(); ctx.ellipse(cx, cy, rad * 1.15, rad * 0.72, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = era >= 5 ? 'rgba(60,60,60,0.6)' : 'rgba(110,85,55,0.6)'; ctx.lineWidth = Math.max(1, S * 0.05);
    for (var k = 0; k < 6; k++) { var a = k / 6 * Math.PI * 2 + 0.3; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * rad * 1.15, cy + Math.sin(a) * rad * 0.72); ctx.stroke(); }
    GF.shadow(ctx, S, 0.8);
    var n = Math.min(22, 4 + Math.floor(size * 1.3));
    var bl = [];
    for (k = 0; k < n; k++) {
      var aa = r() * Math.PI * 2, dd = Math.sqrt(r()) * rad;
      var bx = cx + Math.cos(aa) * dd, by = cy + Math.sin(aa) * dd * 0.62;
      if (Math.abs(bx - cx) < S * 0.42 && by < cy + S * 0.05 && by > cy - S * 0.35) continue; // keep landmark space
      bl.push([bx, by, r()]);
    }
    bl.push([cx, cy - S * 0.08, -1]);
    bl.sort(function (a, b) { return a[1] - b[1]; });
    bl.forEach(function (b) {
      if (b[2] === -1) { landmark(ctx, Math.min(7, era), b[0], b[1], S, st, col, r); if (capital) { ctx.fillStyle = '#ffd34a'; ctx.beginPath(); ctx.arc(b[0] - S * 0.36, b[1] - S * 0.55, S * 0.05, 0, Math.PI * 2); ctx.fill(); } return; }
      var tall = era >= 5 && b[2] > 0.55, bw = S * (0.16 + b[2] * 0.1), dep = S * (0.12 + b[2] * 0.06);
      var bh = tall ? S * (0.5 + b[2] * (0.5 + era * 0.12)) : S * (0.12 + b[2] * 0.1);
      house(ctx, b[0], b[1], bw, dep, bh, st, r() < 0.5 ? st.roof : st.roof2, { tower: tall, lit: era >= 7 && r() < 0.5 });
    });
    GF.noShadow(ctx);
    // banners
    [[-0.85, 0.05], [0.8, 0.0]].forEach(function (f) {
      var fx = cx + f[0] * rad, fy = cy + f[1] * S;
      ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(1, S * 0.03); ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - S * 0.9); ctx.stroke();
      ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(fx, fy - S * 0.9); ctx.quadraticCurveTo(fx + S * 0.18, fy - S * 0.95, fx + S * 0.34, fy - S * 0.8); ctx.quadraticCurveTo(fx + S * 0.18, fy - S * 0.7, fx, fy - S * 0.64); ctx.closePath(); ctx.fill();
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(fx, fy - S * 0.88, S * 0.28, S * 0.035);
    });
    // walls with towers
    if (walls) {
      var wc = era >= 2 ? '#a09888' : '#a88a5e', ws = era >= 2 ? '#6e665a' : '#7a6040';
      var wr = rad * 1.08;
      GF.shadow(ctx, S, 0.7);
      var segs = 18;
      for (k = 0; k <= segs; k++) {
        var t0 = Math.PI * (0.02 + k * 0.96 / segs);
        var x0 = cx + Math.cos(t0) * wr, y0 = cy + S * 0.05 + Math.sin(t0) * wr * 0.62;
        var hh = S * 0.16;
        ctx.fillStyle = k % 2 ? wc : GF.shade(wc, -0.08); ctx.fillRect(x0 - S * 0.09, y0 - hh, S * 0.18, hh);
        ctx.fillStyle = ws; ctx.fillRect(x0 - S * 0.09, y0 - hh - S * 0.04, S * 0.06, S * 0.04); ctx.fillRect(x0 + S * 0.02, y0 - hh - S * 0.04, S * 0.06, S * 0.04);
      }
      [0.1, 0.5, 0.9].forEach(function (tt) {
        var ta = Math.PI * tt, tx = cx + Math.cos(ta) * wr, ty = cy + S * 0.05 + Math.sin(ta) * wr * 0.62;
        house(ctx, tx, ty + S * 0.02, S * 0.2, S * 0.16, S * 0.36, { wall: wc, side: ws }, era >= 2 ? '#5a4a3a' : '#7a5a3a', { style: era >= 2 ? 'gable' : 'flat' });
      });
      GF.noShadow(ctx);
    }
    return { c: c, ax: cx, ay: cy };
  };

  // ---------- improvements ----------
  GF.improvement = function (S, ik, pillaged) {
    var w = S * 2, h = S * 2, c = GF.mk(w, h), ctx = c.getContext('2d');
    var cx = w / 2, cy = h * 0.62, r = GF.rng(GF.hash(ik));
    ctx.lineCap = 'round';
    var st = ERA[1];
    function field(x, y, fw, fh, colA, colB, rot) {
      ctx.save(); ctx.translate(x, y); ctx.transform(1, -0.12, 0.35, 1, 0, 0);
      ctx.fillStyle = colA; ctx.fillRect(-fw / 2, -fh / 2, fw, fh);
      ctx.strokeStyle = colB; ctx.lineWidth = Math.max(0.6, S * 0.03);
      for (var k = 0; k < 6; k++) { var yy = -fh / 2 + (k + 0.5) * fh / 6; ctx.beginPath(); ctx.moveTo(-fw / 2, yy); ctx.lineTo(fw / 2, yy); ctx.stroke(); }
      ctx.restore();
    }
    switch (ik) {
      case 'farm': case 'terrace_farm': case 'polder': case 'ziggurat_farm':
        field(cx - S * 0.28, cy - S * 0.28, S * 0.5, S * 0.32, '#c9b24a', '#9a8228');
        field(cx + S * 0.3, cy - S * 0.22, S * 0.45, S * 0.3, '#7fa63a', '#4f7a20');
        field(cx - S * 0.02, cy + S * 0.02, S * 0.55, S * 0.28, '#d8c060', '#a89030');
        ctx.strokeStyle = '#6a4a2a'; ctx.lineWidth = Math.max(0.6, S * 0.025);
        ctx.beginPath(); ctx.moveTo(cx - S * 0.6, cy + S * 0.12); ctx.lineTo(cx + S * 0.55, cy + S * 0.04); ctx.stroke();
        if (ik === 'polder') { ctx.strokeStyle = '#4aa8d0'; ctx.lineWidth = S * 0.05; ctx.beginPath(); ctx.moveTo(cx - S * 0.6, cy - S * 0.45); ctx.lineTo(cx + S * 0.6, cy - S * 0.5); ctx.stroke(); }
        GF.shadow(ctx, S * 0.6); house(ctx, cx + S * 0.42, cy + S * 0.15, S * 0.16, S * 0.12, S * 0.12, st, '#9a6a3a'); GF.noShadow(ctx);
        break;
      case 'mine':
        GF.blob(ctx, cx, cy - S * 0.15, S * 0.42, S * 0.3, '#7a6e60', 0.25);
        ctx.fillStyle = '#1a120a'; ctx.beginPath(); ctx.arc(cx, cy - S * 0.05, S * 0.16, Math.PI, 0); ctx.lineTo(cx + S * 0.16, cy + S * 0.02); ctx.lineTo(cx - S * 0.16, cy + S * 0.02); ctx.fill();
        ctx.strokeStyle = '#8a6a3a'; ctx.lineWidth = S * 0.05; ctx.beginPath(); ctx.moveTo(cx - S * 0.2, cy + S * 0.02); ctx.lineTo(cx - S * 0.18, cy - S * 0.24); ctx.lineTo(cx + S * 0.18, cy - S * 0.24); ctx.lineTo(cx + S * 0.2, cy + S * 0.02); ctx.stroke();
        ctx.strokeStyle = '#555'; ctx.lineWidth = S * 0.02; ctx.beginPath(); ctx.moveTo(cx, cy + S * 0.02); ctx.lineTo(cx + S * 0.5, cy + S * 0.2); ctx.moveTo(cx + S * 0.06, cy + S * 0.02); ctx.lineTo(cx + S * 0.56, cy + S * 0.2); ctx.stroke();
        GF.shadow(ctx, S * 0.5); ctx.fillStyle = '#6a4a2a'; ctx.fillRect(cx + S * 0.28, cy + S * 0.02, S * 0.16, S * 0.1); GF.blob(ctx, cx + S * 0.36, cy + S * 0.01, S * 0.08, S * 0.04, '#999', 0.3); GF.noShadow(ctx);
        break;
      case 'pasture':
        ctx.strokeStyle = '#7a5a3a'; ctx.lineWidth = Math.max(0.6, S * 0.03);
        ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.12, S * 0.55, S * 0.32, 0, 0, Math.PI * 2); ctx.stroke();
        for (var k = 0; k < 12; k++) { var a = k / 12 * Math.PI * 2; var fx = cx + Math.cos(a) * S * 0.55, fy = cy - S * 0.12 + Math.sin(a) * S * 0.32; ctx.beginPath(); ctx.moveTo(fx, fy); ctx.lineTo(fx, fy - S * 0.08); ctx.stroke(); }
        GF.shadow(ctx, S * 0.5);
        for (k = 0; k < 3; k++) { var ax2 = cx - S * 0.25 + k * S * 0.22, ay2 = cy - S * 0.1 + (k % 2) * S * 0.08; GF.blob(ctx, ax2, ay2, S * 0.09, S * 0.055, k === 1 ? '#5a3a22' : '#e8e2d4', 0.3); ctx.fillStyle = '#2a1a10'; ctx.beginPath(); ctx.arc(ax2 + S * 0.09, ay2 - S * 0.02, S * 0.03, 0, Math.PI * 2); ctx.fill(); }
        GF.noShadow(ctx);
        break;
      case 'plantation':
        GF.shadow(ctx, S * 0.4);
        for (k = 0; k < 9; k++) { var px = cx - S * 0.45 + (k % 3) * S * 0.4 + Math.floor(k / 3) * S * 0.08, py = cy - S * 0.35 + Math.floor(k / 3) * S * 0.2; GF.blob(ctx, px, py, S * 0.1, S * 0.08, '#2e6a28', 0.35); ctx.fillStyle = ['#e84a3a', '#f2c22e', '#c25ae8'][k % 3]; ctx.beginPath(); ctx.arc(px + S * 0.03, py - S * 0.02, S * 0.02, 0, Math.PI * 2); ctx.fill(); }
        GF.noShadow(ctx);
        break;
      case 'camp':
        GF.shadow(ctx, S * 0.5);
        ctx.fillStyle = '#b08a5a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.35, cy); ctx.lineTo(cx - S * 0.05, cy - S * 0.5); ctx.lineTo(cx + S * 0.25, cy); ctx.fill();
        ctx.fillStyle = '#7a5a3a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.05, cy - S * 0.5); ctx.lineTo(cx + S * 0.25, cy); ctx.lineTo(cx + S * 0.35, cy - S * 0.05); ctx.fill();
        GF.noShadow(ctx);
        ctx.strokeStyle = '#5a3a1a'; ctx.lineWidth = S * 0.025; ctx.beginPath(); ctx.moveTo(cx + S * 0.4, cy); ctx.lineTo(cx + S * 0.4, cy - S * 0.3); ctx.moveTo(cx + S * 0.6, cy); ctx.lineTo(cx + S * 0.6, cy - S * 0.3); ctx.moveTo(cx + S * 0.38, cy - S * 0.28); ctx.lineTo(cx + S * 0.62, cy - S * 0.28); ctx.stroke();
        ctx.fillStyle = '#a0522d'; ctx.fillRect(cx + S * 0.44, cy - S * 0.27, S * 0.12, S * 0.15);
        break;
      case 'quarry':
        for (k = 0; k < 3; k++) { var q = k * S * 0.12; GF.poly(ctx, [cx - S * 0.5 + q, cy - q, cx + S * 0.4 - q, cy - q, cx + S * 0.45 - q, cy - q - S * 0.12, cx - S * 0.45 + q, cy - q - S * 0.12], k % 2 ? '#c8c0b0' : '#a8a090'); }
        GF.shadow(ctx, S * 0.4); for (k = 0; k < 3; k++) house(ctx, cx + S * 0.3 + k * S * 0.1, cy + S * 0.12, S * 0.08, S * 0.06, S * 0.06, { wall: '#d0c8b8', side: '#9a9282' }, '#d0c8b8', { style: 'flat' }); GF.noShadow(ctx);
        break;
      case 'fishing_boats': case 'offshore_platform':
        if (ik === 'offshore_platform') {
          GF.shadow(ctx, S * 0.5);
          ctx.fillStyle = '#4a4a4a'; for (k = 0; k < 4; k++) ctx.fillRect(cx - S * 0.3 + k * S * 0.18, cy - S * 0.35, S * 0.04, S * 0.4);
          house(ctx, cx, cy - S * 0.33, S * 0.6, S * 0.3, S * 0.08, { wall: '#8a8a8a', side: '#5a5a5a' }, '#9a9a9a', { style: 'flat' });
          ctx.strokeStyle = '#c03020'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(cx + S * 0.2, cy - S * 0.45); ctx.lineTo(cx + S * 0.2, cy - S * 0.85); ctx.stroke();
          GF.noShadow(ctx); break;
        }
        ctx.strokeStyle = 'rgba(240,240,220,0.45)'; ctx.lineWidth = S * 0.012;
        for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(cx - S * 0.2, cy, S * (0.1 + k * 0.05), 0, Math.PI); ctx.stroke(); }
        GF.shadow(ctx, S * 0.5);
        ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(cx - S * 0.3, cy - S * 0.12); ctx.lineTo(cx + S * 0.35, cy - S * 0.12); ctx.lineTo(cx + S * 0.25, cy + S * 0.02); ctx.lineTo(cx - S * 0.22, cy + S * 0.02); ctx.fill();
        ctx.fillStyle = '#f2ecd8'; ctx.beginPath(); ctx.moveTo(cx + S * 0.02, cy - S * 0.62); ctx.quadraticCurveTo(cx + S * 0.25, cy - S * 0.4, cx + S * 0.3, cy - S * 0.15); ctx.lineTo(cx + S * 0.02, cy - S * 0.15); ctx.fill();
        GF.noShadow(ctx);
        break;
      case 'oil_well':
        GF.shadow(ctx, S * 0.5);
        ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(cx - S * 0.2, cy); ctx.lineTo(cx, cy - S * 0.65); ctx.lineTo(cx + S * 0.2, cy); ctx.moveTo(cx - S * 0.12, cy - S * 0.3); ctx.lineTo(cx + S * 0.12, cy - S * 0.3); ctx.stroke();
        ctx.fillStyle = '#3a3a3a'; ctx.save(); ctx.translate(cx + S * 0.3, cy - S * 0.3); ctx.rotate(-0.25); ctx.fillRect(-S * 0.3, -S * 0.03, S * 0.5, S * 0.06); ctx.restore();
        GF.noShadow(ctx); break;
      case 'lumber_mill':
        GF.shadow(ctx, S * 0.6); house(ctx, cx - S * 0.1, cy, S * 0.4, S * 0.25, S * 0.22, { wall: '#9a6a3a', side: '#6a4422' }, '#5a3a1e'); GF.noShadow(ctx);
        for (k = 0; k < 3; k++) { ctx.fillStyle = '#b08050'; ctx.beginPath(); ctx.ellipse(cx + S * 0.38, cy + S * 0.05 - k * S * 0.07, S * 0.18, S * 0.035, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#e0c090'; ctx.beginPath(); ctx.arc(cx + S * 0.56, cy + S * 0.05 - k * S * 0.07, S * 0.035, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'trading_post':
        GF.shadow(ctx, S * 0.6); house(ctx, cx, cy, S * 0.36, S * 0.22, S * 0.2, st, '#c45a34');
        ctx.fillStyle = '#e8c040'; GF.poly(ctx, [cx - S * 0.5, cy - S * 0.12, cx - S * 0.2, cy - S * 0.12, cx - S * 0.24, cy - S * 0.02, cx - S * 0.54, cy - S * 0.02], '#d8a030'); GF.noShadow(ctx);
        ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = S * 0.02; ctx.beginPath(); ctx.moveTo(cx + S * 0.3, cy); ctx.lineTo(cx + S * 0.3, cy - S * 0.6); ctx.stroke(); ctx.fillStyle = '#d8a030'; ctx.fillRect(cx + S * 0.3, cy - S * 0.6, S * 0.2, S * 0.12);
        break;
      case 'fort': case 'citadel': case 'kasbah': {
        var wc = ik === 'kasbah' ? '#c8955a' : ik === 'citadel' ? '#9a9488' : '#8a6a42';
        GF.shadow(ctx, S * 0.6);
        for (k = 0; k < 8; k++) { var aa = Math.PI * (k / 7); var fx2 = cx + Math.cos(aa) * S * 0.5, fy2 = cy - S * 0.1 + Math.sin(aa) * S * 0.25; ctx.fillStyle = k % 2 ? wc : GF.shade(wc, -0.1); ctx.fillRect(fx2 - S * 0.08, fy2 - S * 0.25, S * 0.16, S * 0.25); }
        if (ik !== 'fort') house(ctx, cx, cy - S * 0.2, S * 0.3, S * 0.2, S * 0.45, { wall: wc, side: GF.shade(wc, -0.3) }, '#5a4a3a', { style: ik === 'kasbah' ? 'flat' : 'gable' });
        GF.noShadow(ctx); break;
      }
      case 'academy': case 'manufactory': case 'customs_house': case 'holy_site': case 'chateau': case 'feitoria': case 'landmark': {
        var sty = { academy: [{ wall: '#ece6da', side: '#b0a898' }, '#3a5aa0', 'dome'], manufactory: [{ wall: '#a0584a', side: '#6a3a30' }, '#4a4a4e', 'gable'], customs_house: [{ wall: '#ead8a8', side: '#b09a68' }, '#8a2a2a', 'gable'], holy_site: [{ wall: '#f4f0e6', side: '#c0b8a8' }, '#d4a62a', 'dome'], chateau: [{ wall: '#efe6d0', side: '#b8ae98' }, '#3a4a8a', 'gable'], feitoria: [{ wall: '#f0e0c0', side: '#b8a888' }, '#a03a2a', 'gable'], landmark: [{ wall: '#e8e0d0', side: '#b0a898' }, '#d4a62a', 'dome'] }[ik];
        GF.shadow(ctx, S * 0.6); house(ctx, cx, cy, S * 0.55, S * 0.35, S * 0.32, sty[0], sty[1], { style: sty[2] }); GF.noShadow(ctx);
        if (ik === 'manufactory') { ctx.fillStyle = '#4a2a20'; ctx.fillRect(cx + S * 0.15, cy - S * 0.85, S * 0.08, S * 0.5); }
        break;
      }
      case 'moai': GF.shadow(ctx, S * 0.6); for (k = 0; k < 3; k++) { var mx = cx - S * 0.3 + k * S * 0.3; ctx.fillStyle = '#6a6460'; ctx.fillRect(mx - S * 0.07, cy - S * 0.55, S * 0.14, S * 0.55); ctx.fillStyle = '#4a4440'; ctx.fillRect(mx - S * 0.09, cy - S * 0.6, S * 0.18, S * 0.08); ctx.fillRect(mx - S * 0.03, cy - S * 0.42, S * 0.06, S * 0.12); } GF.noShadow(ctx); break;
      case 'kampung': GF.shadow(ctx, S * 0.5); house(ctx, cx - S * 0.22, cy, S * 0.26, S * 0.18, S * 0.16, { wall: '#b08a5a', side: '#7a5a3a' }, '#6a4a2a'); house(ctx, cx + S * 0.22, cy + S * 0.05, S * 0.26, S * 0.18, S * 0.16, { wall: '#b08a5a', side: '#7a5a3a' }, '#6a4a2a'); GF.noShadow(ctx); break;
      case 'barb_camp':
        GF.shadow(ctx, S * 0.6);
        for (k = 0; k < 3; k++) { var tx = cx + (k - 1) * S * 0.36, ty = cy - (k === 1 ? S * 0.1 : 0); ctx.fillStyle = '#7a4a2a'; ctx.beginPath(); ctx.moveTo(tx - S * 0.2, ty); ctx.lineTo(tx, ty - S * 0.42); ctx.lineTo(tx + S * 0.2, ty); ctx.fill(); ctx.fillStyle = '#4a2a14'; ctx.beginPath(); ctx.moveTo(tx, ty - S * 0.42); ctx.lineTo(tx + S * 0.2, ty); ctx.lineTo(tx + S * 0.08, ty); ctx.fill(); }
        GF.noShadow(ctx);
        ctx.strokeStyle = '#2a1a0a'; ctx.lineWidth = S * 0.035; ctx.beginPath(); ctx.moveTo(cx + S * 0.55, cy + S * 0.05); ctx.lineTo(cx + S * 0.55, cy - S * 0.8); ctx.stroke();
        ctx.fillStyle = '#b81818'; ctx.beginPath(); ctx.moveTo(cx + S * 0.55, cy - S * 0.8); ctx.lineTo(cx + S * 0.88, cy - S * 0.7); ctx.lineTo(cx + S * 0.55, cy - S * 0.58); ctx.fill();
        ctx.fillStyle = '#eee8d8'; ctx.beginPath(); ctx.arc(cx + S * 0.55, cy - S * 0.86, S * 0.06, 0, Math.PI * 2); ctx.fill();
        break;
      case 'city_ruins': case 'ruins':
        GF.shadow(ctx, S * 0.5);
        for (k = 0; k < 5; k++) { var rh = S * (0.18 + r() * 0.35), rx = cx - S * 0.5 + k * S * 0.24; ctx.fillStyle = '#c8c0ae'; ctx.fillRect(rx, cy - rh, S * 0.09, rh); ctx.fillStyle = '#a8a08e'; ctx.fillRect(rx - S * 0.02, cy - rh - S * 0.03, S * 0.13, S * 0.04); }
        GF.noShadow(ctx);
        ctx.fillStyle = '#4a7a2a'; for (k = 0; k < 6; k++) { ctx.beginPath(); ctx.arc(cx - S * 0.45 + r() * S * 0.9, cy - r() * S * 0.3, S * 0.035, 0, Math.PI * 2); ctx.fill(); }
        ctx.fillStyle = 'rgba(255,220,120,0.35)'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.1, S * 0.6, S * 0.3, 0, 0, Math.PI * 2); ctx.fill();
        break;
    }
    if (pillaged) {
      ctx.fillStyle = 'rgba(40,30,20,0.45)'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.15, S * 0.6, S * 0.35, 0, 0, Math.PI * 2); ctx.fill();
      for (k = 0; k < 4; k++) { ctx.fillStyle = 'rgba(70,60,55,0.6)'; ctx.beginPath(); ctx.arc(cx + (k - 1.5) * S * 0.15, cy - S * 0.5 - k * S * 0.08, S * 0.1, 0, Math.PI * 2); ctx.fill(); }
    }
    return { c: c, ax: cx, ay: cy };
  };
})(G.GFX);
