// ============================================================
//  Distinct natural-wonder models (overrides the generic ones).
// ============================================================
(function (GF) {
  var base = GF.tall;
  function glow(ctx, x, y, S, col) { var g = ctx.createRadialGradient(x, y, 0, x, y, S * 1.1); g.addColorStop(0, col || 'rgba(255,220,120,0.32)'); g.addColorStop(1, 'rgba(255,220,120,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(x, y, S * 1.1, S * 0.9, 0, 0, Math.PI * 2); ctx.fill(); }
  function shadow(ctx, cx, cy, S) { ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.1, cy + S * 0.18, S * 0.95, S * 0.3, 0, 0, Math.PI * 2); ctx.fill(); }
  function acacia(ctx, x, y, S) { ctx.strokeStyle = '#4a3420'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - S * 0.22); ctx.lineTo(x - S * 0.1, y - S * 0.32); ctx.moveTo(x, y - S * 0.22); ctx.lineTo(x + S * 0.1, y - S * 0.33); ctx.stroke(); GF.blob(ctx, x, y - S * 0.36, S * 0.22, S * 0.06, '#6a8a2a', 0.4); }
  function flags(ctx, x0, y0, x1, y1, S) {
    ctx.strokeStyle = 'rgba(60,40,30,0.6)'; ctx.lineWidth = Math.max(0.5, S * 0.01); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo((x0 + x1) / 2, Math.max(y0, y1) + S * 0.1, x1, y1); ctx.stroke();
    var cols = ['#2a6ad8', '#f2f2f2', '#d82a2a', '#2aa04a', '#f2c42a'];
    for (var k = 1; k < 10; k++) { var t = k / 10, x = x0 + (x1 - x0) * t, y = y0 + (y1 - y0) * t + Math.sin(t * Math.PI) * S * 0.1; ctx.fillStyle = cols[k % 5]; ctx.fillRect(x - S * 0.025, y, S * 0.05, S * 0.06); }
  }
  GF.tall = function (S, tk, fk, variant, hills, nw) {
    if (['lake_victoria', 'mt_kailash', 'sri_pada', 'mt_sinai', 'kilimanjaro', 'victoria_falls', 'fountain_youth'].indexOf(nw) < 0) return base(S, tk, fk, variant, hills, nw);
    var w = GF.SQ3 * S * 1.3, h = S * 3.4, c = GF.mk(w, h), ctx = c.getContext('2d'), cx = w / 2, cy = h * 0.72, r = GF.rng(GF.hash(nw));
    var k, g;
    switch (nw) {
      case 'lake_victoria':
        glow(ctx, cx, cy - S * 0.1, S, 'rgba(140,220,255,0.3)');
        ctx.fillStyle = '#c8b88a'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.1, S * 0.95, S * 0.5, 0, 0, Math.PI * 2); ctx.fill();
        g = ctx.createRadialGradient(cx - S * 0.2, cy - S * 0.25, 0, cx, cy - S * 0.1, S * 0.9); g.addColorStop(0, '#7ad0f0'); g.addColorStop(0.6, '#2a8ac0'); g.addColorStop(1, '#1a5a8a');
        ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.1, S * 0.85, S * 0.42, 0, 0, Math.PI * 2); ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = S * 0.02; for (k = 0; k < 6; k++) { var lx = cx + (r() - 0.5) * S, ly = cy - S * 0.1 + (r() - 0.5) * S * 0.5; ctx.beginPath(); ctx.moveTo(lx - S * 0.08, ly); ctx.lineTo(lx + S * 0.08, ly); ctx.stroke(); }
        [[0.35, -0.2], [-0.3, 0.02], [0.05, 0.12]].forEach(function (q) { GF.blob(ctx, cx + q[0] * S, cy - S * 0.1 + q[1] * S, S * 0.1, S * 0.05, '#4a8a3a', 0.4); GF.tree(ctx, cx + q[0] * S, cy - S * 0.1 + q[1] * S, S * 0.45, 'palm', r); });
        for (k = 0; k < 7; k++) { var a = k / 7 * Math.PI * 2 + 0.3; GF.tree(ctx, cx + Math.cos(a) * S * 0.92, cy - S * 0.1 + Math.sin(a) * S * 0.48, S * 0.5, k % 2 ? 'leaf' : 'palm', r); }
        break;
      case 'fountain_youth':
        glow(ctx, cx, cy - S * 0.2, S, 'rgba(160,255,240,0.45)'); shadow(ctx, cx, cy, S);
        GF.blob(ctx, cx, cy, S * 0.6, S * 0.26, '#d8d0c0', 0.4);
        g = ctx.createRadialGradient(cx, cy - S * 0.02, 0, cx, cy, S * 0.5); g.addColorStop(0, '#c8fff8'); g.addColorStop(1, '#2ab0c0'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.02, S * 0.5, S * 0.2, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = '#e8e0d0'; ctx.fillRect(cx - S * 0.05, cy - S * 0.5, S * 0.1, S * 0.48); GF.blob(ctx, cx, cy - S * 0.5, S * 0.18, S * 0.06, '#e8e0d0', 0.4);
        ctx.strokeStyle = 'rgba(200,255,255,0.85)'; ctx.lineWidth = S * 0.025; for (k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(cx, cy - S * 0.6); ctx.quadraticCurveTo(cx + k * S * 0.15, cy - S * 0.85, cx + k * S * 0.22, cy - S * 0.1); ctx.stroke(); }
        for (k = 0; k < 14; k++) { ctx.fillStyle = 'rgba(255,255,255,' + (0.5 + r() * 0.5) + ')'; ctx.beginPath(); ctx.arc(cx + (r() - 0.5) * S * 1.2, cy - S * r() * 1.0, S * 0.02, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'mt_kailash':
        glow(ctx, cx, cy - S * 0.6, S); shadow(ctx, cx, cy, S);
        // near-perfect pyramid with snow terraces
        GF.poly(ctx, [cx - S * 0.85, cy + S * 0.15, cx, cy - S * 1.5, cx + S * 0.1, cy + S * 0.15], '#8a7a6a');
        GF.poly(ctx, [cx, cy - S * 1.5, cx + S * 0.85, cy + S * 0.15, cx + S * 0.1, cy + S * 0.15], '#5a4e44');
        GF.poly(ctx, [cx - S * 0.32, cy - S * 0.95, cx, cy - S * 1.5, cx + S * 0.3, cy - S * 0.95, cx + S * 0.15, cy - S * 0.9, cx, cy - S * 1.0, cx - S * 0.12, cy - S * 0.88], '#f6f8fc');
        ctx.strokeStyle = 'rgba(246,248,252,0.85)'; ctx.lineWidth = S * 0.025; for (k = 0; k < 4; k++) { var yy = cy - S * (0.75 - k * 0.2), hw = S * (0.4 + k * 0.12); ctx.beginPath(); ctx.moveTo(cx - hw * 0.6, yy); ctx.lineTo(cx + hw * 0.5, yy + S * 0.02); ctx.stroke(); }
        ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = S * 0.03; ctx.beginPath(); ctx.moveTo(cx + S * 0.02, cy - S * 1.4); ctx.lineTo(cx + S * 0.04, cy - S * 0.5); ctx.stroke();
        flags(ctx, cx - S * 0.85, cy + S * 0.05, cx - S * 0.2, cy - S * 0.25, S); flags(ctx, cx + S * 0.2, cy - S * 0.15, cx + S * 0.85, cy + S * 0.05, S);
        break;
      case 'sri_pada':
        glow(ctx, cx, cy - S * 0.8, S, 'rgba(255,230,160,0.4)'); shadow(ctx, cx, cy, S);
        GF.peak(ctx, cx, cy + S * 0.15, S * 0.7, S * 1.55, S, r, { rock: '#4a6a3a', snow: 0 });
        for (k = 0; k < 6; k++) GF.tree(ctx, cx + (r() - 0.5) * S * 1.1, cy + S * (0.05 - r() * 0.35), S * 0.55, 'jungle', r);
        ctx.fillStyle = '#f2ece0'; ctx.fillRect(cx - S * 0.1, cy - S * 1.48, S * 0.2, S * 0.1); GF.poly(ctx, [cx - S * 0.14, cy - S * 1.48, cx, cy - S * 1.62, cx + S * 0.14, cy - S * 1.48], '#c84a2a');
        ctx.fillStyle = 'rgba(255,220,120,0.95)'; for (k = 0; k < 16; k++) { var t = k / 15, px = cx - S * 0.55 + t * S * 0.6 + Math.sin(t * 12) * S * 0.06, py = cy + S * 0.1 - t * S * 1.5; ctx.beginPath(); ctx.arc(px, py, S * 0.018, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'mt_sinai':
        glow(ctx, cx, cy - S * 0.5, S, 'rgba(255,200,140,0.35)'); shadow(ctx, cx, cy, S);
        [[-0.45, 0.15, 0.5, 0.9], [0.4, 0.18, 0.5, 0.8], [0, 0.05, 0.6, 1.3]].forEach(function (p2) { GF.peak(ctx, cx + p2[0] * S, cy + p2[1] * S, p2[2] * S, p2[3] * S, S, r, { rock: '#a8604a', snow: 0 }); });
        ctx.fillStyle = '#d8c8a8'; ctx.fillRect(cx - S * 0.45, cy + S * 0.02, S * 0.35, S * 0.15); GF.poly(ctx, [cx - S * 0.3, cy + S * 0.02, cx - S * 0.3, cy - S * 0.12, cx - S * 0.22, cy - S * 0.18, cx - S * 0.14, cy - S * 0.12, cx - S * 0.14, cy + S * 0.02], '#c8b898');
        ctx.fillStyle = '#f2ece0'; ctx.fillRect(cx - S * 0.04, cy - S * 1.22, S * 0.08, S * 0.06);
        break;
      case 'kilimanjaro':
        glow(ctx, cx, cy - S * 0.5, S); shadow(ctx, cx, cy, S);
        g = ctx.createLinearGradient(cx - S, 0, cx + S, 0); g.addColorStop(0, '#9a8a78'); g.addColorStop(1, '#4a4038');
        ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(cx - S * 1.0, cy + S * 0.15); ctx.quadraticCurveTo(cx - S * 0.5, cy - S * 0.6, cx - S * 0.3, cy - S * 1.05); ctx.lineTo(cx + S * 0.3, cy - S * 1.08); ctx.quadraticCurveTo(cx + S * 0.5, cy - S * 0.6, cx + S * 1.0, cy + S * 0.15); ctx.fill();
        ctx.fillStyle = '#f6f8fc'; ctx.beginPath(); ctx.moveTo(cx - S * 0.36, cy - S * 0.95); ctx.lineTo(cx - S * 0.3, cy - S * 1.05); ctx.lineTo(cx + S * 0.3, cy - S * 1.08); ctx.lineTo(cx + S * 0.38, cy - S * 0.96); ctx.lineTo(cx + S * 0.2, cy - S * 0.9); ctx.lineTo(cx + S * 0.05, cy - S * 0.98); ctx.lineTo(cx - S * 0.12, cy - S * 0.88); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.beginPath(); ctx.ellipse(cx + S * 0.4, cy - S * 0.55, S * 0.4, S * 0.08, 0, 0, Math.PI * 2); ctx.ellipse(cx - S * 0.35, cy - S * 0.45, S * 0.3, S * 0.06, 0, 0, Math.PI * 2); ctx.fill();
        for (k = 0; k < 4; k++) acacia(ctx, cx + (k - 1.5) * S * 0.5 + (r() - 0.5) * S * 0.1, cy + S * 0.25, S);
        break;
      case 'victoria_falls':
        glow(ctx, cx, cy - S * 0.3, S, 'rgba(200,240,255,0.35)'); shadow(ctx, cx, cy, S);
        GF.poly(ctx, [cx - S * 0.95, cy - S * 0.3, cx + S * 0.95, cy - S * 0.38, cx + S * 0.95, cy + S * 0.2, cx - S * 0.95, cy + S * 0.2], '#5a4a3a');
        ctx.fillStyle = '#3a8ac0'; ctx.beginPath(); ctx.ellipse(cx, cy - S * 0.42, S * 0.95, S * 0.12, -0.04, 0, Math.PI * 2); ctx.fill();
        g = ctx.createLinearGradient(0, cy - S * 0.36, 0, cy + S * 0.15); g.addColorStop(0, '#e8f6ff'); g.addColorStop(1, '#8ac8e8'); ctx.fillStyle = g; ctx.fillRect(cx - S * 0.8, cy - S * 0.36, S * 1.6, S * 0.5);
        ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = S * 0.015; for (k = 0; k < 22; k++) { var fx = cx - S * 0.78 + k * S * 0.074; ctx.beginPath(); ctx.moveTo(fx, cy - S * 0.36); ctx.lineTo(fx + (r() - 0.5) * S * 0.02, cy + S * 0.14); ctx.stroke(); }
        for (k = 0; k < 10; k++) { ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.beginPath(); ctx.arc(cx - S * 0.8 + k * S * 0.18, cy + S * 0.12, S * 0.14, 0, Math.PI * 2); ctx.fill(); }
        ['rgba(255,80,80,0.35)', 'rgba(255,220,80,0.35)', 'rgba(80,220,120,0.35)', 'rgba(80,140,255,0.35)'].forEach(function (rc, i) { ctx.strokeStyle = rc; ctx.lineWidth = S * 0.03; ctx.beginPath(); ctx.arc(cx, cy + S * 0.2, S * (0.6 - i * 0.03), Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); });
        for (k = 0; k < 4; k++) GF.tree(ctx, cx + (k < 2 ? -1 : 1) * S * (0.75 + (k % 2) * 0.15), cy - S * 0.38, S * 0.5, 'jungle', r);
        break;
    }
    // gold marker star (consistent with other natural wonders)
    ctx.fillStyle = '#ffd34a'; ctx.strokeStyle = '#6a4a10'; ctx.lineWidth = Math.max(0.6, S * 0.015); ctx.beginPath();
    for (k = 0; k < 10; k++) { var ra = k % 2 ? S * 0.045 : S * 0.1, an = -Math.PI / 2 + k * Math.PI / 5; ctx.lineTo(cx + S * 0.75 + Math.cos(an) * ra, cy - S * 0.95 + Math.sin(an) * ra); } ctx.closePath(); ctx.fill(); ctx.stroke();
    return { c: c, ax: cx, ay: cy };
  };
})(G.GFX);

// ---- richer barbarian encampments and ancient ruins ----
(function (GF) {
  var base = GF.improvement;
  function tent(ctx, x, y, S, col) {
    GF.poly(ctx, [x - S * 0.22, y, x, y - S * 0.38, x + S * 0.02, y], GF.shade(col, 0.15)); GF.poly(ctx, [x, y - S * 0.38, x + S * 0.24, y, x + S * 0.02, y], GF.shade(col, -0.3));
    GF.poly(ctx, [x - S * 0.05, y, x, y - S * 0.16, x + S * 0.05, y], '#1a120a');
    ctx.strokeStyle = '#3a2a1a'; ctx.lineWidth = Math.max(0.6, S * 0.02); ctx.beginPath(); ctx.moveTo(x - S * 0.03, y - S * 0.44); ctx.lineTo(x, y - S * 0.36); ctx.lineTo(x + S * 0.04, y - S * 0.45); ctx.stroke();
  }
  GF.improvement = function (S, ik, pillaged) {
    if (ik !== 'barb_camp' && ik !== 'ruins') return base(S, ik, pillaged);
    var w = S * 2, h = S * 2, c = GF.mk(w, h), ctx = c.getContext('2d'), cx = w / 2, cy = h * 0.62, r = GF.rng(GF.hash(ik));
    ctx.fillStyle = 'rgba(0,0,0,0.22)'; ctx.beginPath(); ctx.ellipse(cx, cy + S * 0.05, S * 0.75, S * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    if (ik === 'barb_camp') {
      GF.blob(ctx, cx, cy, S * 0.7, S * 0.26, '#7a6a48', 0.25);
      // palisade
      for (var k = 0; k < 15; k++) { var a = Math.PI * (0.95 + k / 14 * 1.1), px = cx + Math.cos(a) * S * 0.66, py = cy + Math.sin(a) * S * 0.24; ctx.fillStyle = k % 2 ? '#6a4a2a' : '#5a3c20'; ctx.fillRect(px - S * 0.025, py - S * 0.2, S * 0.05, S * 0.2); GF.poly(ctx, [px - S * 0.025, py - S * 0.2, px, py - S * 0.26, px + S * 0.025, py - S * 0.2], '#4a3018'); }
      tent(ctx, cx - S * 0.32, cy - S * 0.02, S, '#8a6a4a'); tent(ctx, cx + S * 0.3, cy + S * 0.0, S, '#7a5a3a'); tent(ctx, cx - S * 0.02, cy - S * 0.12, S * 1.15, '#9a2a1a');
      // campfire
      var fg = ctx.createRadialGradient(cx + S * 0.05, cy + S * 0.14, 0, cx + S * 0.05, cy + S * 0.14, S * 0.3); fg.addColorStop(0, 'rgba(255,200,80,0.8)'); fg.addColorStop(1, 'rgba(255,100,20,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(cx + S * 0.05, cy + S * 0.14, S * 0.3, 0, Math.PI * 2); ctx.fill();
      GF.poly(ctx, [cx - S * 0.03, cy + S * 0.17, cx + S * 0.05, cy + S * 0.02, cx + S * 0.13, cy + S * 0.17], '#ff9a2a'); GF.poly(ctx, [cx + S * 0.01, cy + S * 0.17, cx + S * 0.05, cy + S * 0.07, cx + S * 0.09, cy + S * 0.17], '#ffe07a');
      // skull totem with banner
      ctx.fillStyle = '#4a3018'; ctx.fillRect(cx + S * 0.52, cy - S * 0.55, S * 0.04, S * 0.62); ctx.fillStyle = '#e8e0cc'; ctx.beginPath(); ctx.arc(cx + S * 0.54, cy - S * 0.56, S * 0.06, 0, Math.PI * 2); ctx.fill(); ctx.fillStyle = '#1a1a1a'; ctx.fillRect(cx + S * 0.51, cy - S * 0.57, S * 0.02, S * 0.02); ctx.fillRect(cx + S * 0.55, cy - S * 0.57, S * 0.02, S * 0.02);
      GF.poly(ctx, [cx + S * 0.56, cy - S * 0.48, cx + S * 0.8, cy - S * 0.42, cx + S * 0.56, cy - S * 0.34], '#a81a1a');
    } else {
      GF.blob(ctx, cx, cy, S * 0.62, S * 0.24, '#a89a70', 0.25);
      // broken colonnade and a fallen pediment
      for (k = 0; k < 5; k++) { var hh = S * (0.2 + r() * 0.32), x = cx - S * 0.42 + k * S * 0.2, y = cy - S * 0.02 + (k % 2) * S * 0.04;
        var g = ctx.createLinearGradient(x - S * 0.04, 0, x + S * 0.04, 0); g.addColorStop(0, '#f2ead8'); g.addColorStop(1, '#a8a088'); ctx.fillStyle = g; ctx.fillRect(x - S * 0.04, y - hh, S * 0.08, hh); ctx.fillStyle = '#d8d0b8'; ctx.fillRect(x - S * 0.055, y - S * 0.02, S * 0.11, S * 0.03);
        GF.poly(ctx, [x - S * 0.04, y - hh, x - S * 0.01, y - hh - S * 0.04, x + S * 0.02, y - hh - S * 0.01, x + S * 0.04, y - hh - S * 0.03, x + S * 0.04, y - hh], '#e8e0c8'); }
      ctx.save(); ctx.translate(cx + S * 0.12, cy + S * 0.15); ctx.rotate(0.18); GF.poly(ctx, [-S * 0.28, 0, S * 0.28, 0, 0, -S * 0.12], '#d8d0b8'); ctx.restore();
      for (k = 0; k < 6; k++) GF.blob(ctx, cx + (r() - 0.5) * S * 1.1, cy + S * (0.05 + r() * 0.12), S * 0.05, S * 0.03, '#b8b098', 0.3);
      ctx.strokeStyle = '#4a7a2a'; ctx.lineWidth = Math.max(0.6, S * 0.02); for (k = 0; k < 3; k++) { var vx = cx - S * 0.42 + k * S * 0.4; ctx.beginPath(); ctx.moveTo(vx, cy); ctx.quadraticCurveTo(vx + S * 0.05, cy - S * 0.15, vx - S * 0.02, cy - S * 0.25); ctx.stroke(); }
      // treasure glint
      ctx.fillStyle = 'rgba(255,230,120,0.9)'; ctx.beginPath(); ctx.arc(cx - S * 0.12, cy + S * 0.1, S * 0.035, 0, Math.PI * 2); ctx.fill();
    }
    return { c: c, ax: cx, ay: cy };
  };
})(G.GFX);
