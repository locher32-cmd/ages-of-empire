// ============================================================
//  Heraldry: a procedural coat of arms for every civilization
//  (shield shape, division and charge chosen from its colours/id).
// ============================================================
(function (GF) {
  var cache = {};
  GF.emblem = function (col, col2, seed, size) {
    size = Math.round(size || 40);
    var key = col + col2 + seed + size;
    if (cache[key]) return cache[key];
    var dpr = Math.min(2, window.devicePixelRatio || 1), S = size * dpr;
    var c = GF.mk(S, S * 1.15), ctx = c.getContext('2d'), h = GF.hash(seed || col);
    var w = S, hh = S * 1.15;
    function shield() { ctx.beginPath(); ctx.moveTo(w * 0.08, hh * 0.06); ctx.lineTo(w * 0.92, hh * 0.06); ctx.lineTo(w * 0.92, hh * 0.5); ctx.quadraticCurveTo(w * 0.9, hh * 0.82, w * 0.5, hh * 0.96); ctx.quadraticCurveTo(w * 0.1, hh * 0.82, w * 0.08, hh * 0.5); ctx.closePath(); }
    shield(); ctx.fillStyle = col; ctx.fill();
    ctx.save(); shield(); ctx.clip();
    var div = h % 6, fg = col2;
    ctx.fillStyle = fg;
    if (div === 1) ctx.fillRect(w * 0.5, 0, w, hh);
    else if (div === 2) ctx.fillRect(0, hh * 0.5, w, hh);
    else if (div === 3) { ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(w, hh); ctx.lineTo(w, 0); ctx.fill(); }
    else if (div === 4) { ctx.fillRect(0, hh * 0.38, w, hh * 0.18); }
    else if (div === 5) { ctx.fillRect(w * 0.42, 0, w * 0.16, hh); ctx.fillRect(0, hh * 0.36, w, hh * 0.15); }
    // charge
    var ch = (h >> 4) % 6, cx = w * 0.5, cy = hh * 0.46, r = w * 0.2;
    ctx.fillStyle = div === 0 ? fg : (div === 1 || div === 3 ? '#ffd34a' : col);
    if (div === 2 || div === 4) ctx.fillStyle = '#ffd34a';
    ctx.strokeStyle = 'rgba(0,0,0,0.45)'; ctx.lineWidth = Math.max(1, S * 0.02);
    ctx.beginPath();
    if (ch === 0) { for (var k = 0; k < 10; k++) { var a = k * Math.PI / 5 - Math.PI / 2, rr = k % 2 ? r * 0.45 : r; ctx.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); } ctx.closePath(); }
    else if (ch === 1) { ctx.arc(cx, cy, r * 0.8, 0, Math.PI * 2); for (k = 0; k < 12; k++) { var a2 = k * Math.PI / 6; ctx.moveTo(cx + Math.cos(a2) * r * 0.9, cy + Math.sin(a2) * r * 0.9); ctx.lineTo(cx + Math.cos(a2) * r * 1.25, cy + Math.sin(a2) * r * 1.25); } }
    else if (ch === 2) { ctx.arc(cx, cy, r, 0.3, Math.PI * 2 - 0.3); ctx.arc(cx + r * 0.45, cy, r * 0.8, Math.PI * 2 - 0.5, 0.5, true); ctx.closePath(); }
    else if (ch === 3) { ctx.rect(cx - r * 0.7, cy - r * 0.3, r * 1.4, r * 1.1); ctx.rect(cx - r * 0.7, cy - r * 0.6, r * 0.3, r * 0.35); ctx.rect(cx - r * 0.15, cy - r * 0.6, r * 0.3, r * 0.35); ctx.rect(cx + r * 0.4, cy - r * 0.6, r * 0.3, r * 0.35); }
    else if (ch === 4) { ctx.moveTo(cx - r, cy + r * 0.6); ctx.lineTo(cx - r, cy - r * 0.2); ctx.lineTo(cx - r * 0.5, cy + r * 0.2); ctx.lineTo(cx, cy - r * 0.6); ctx.lineTo(cx + r * 0.5, cy + r * 0.2); ctx.lineTo(cx + r, cy - r * 0.2); ctx.lineTo(cx + r, cy + r * 0.6); ctx.closePath(); }
    else { ctx.moveTo(cx, cy - r * 1.1); ctx.quadraticCurveTo(cx + r * 1.2, cy - r * 0.3, cx + r * 1.0, cy + r * 0.3); ctx.lineTo(cx + r * 0.3, cy); ctx.lineTo(cx, cy + r * 1.1); ctx.lineTo(cx - r * 0.3, cy); ctx.lineTo(cx - r * 1.0, cy + r * 0.3); ctx.quadraticCurveTo(cx - r * 1.2, cy - r * 0.3, cx, cy - r * 1.1); }
    ctx.fill(); ctx.stroke();
    // sheen
    var g = ctx.createLinearGradient(0, 0, w, hh); g.addColorStop(0, 'rgba(255,255,255,0.35)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(0,0,0,0.3)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, hh);
    ctx.restore();
    shield(); ctx.strokeStyle = '#d8b65a'; ctx.lineWidth = Math.max(1.5, S * 0.06); ctx.stroke();
    shield(); ctx.strokeStyle = '#3a2a10'; ctx.lineWidth = Math.max(0.5, S * 0.015); ctx.stroke();
    c.style.width = size + 'px'; c.style.height = Math.round(size * 1.15) + 'px';
    cache[key] = c;
    return c;
  };
  GF.emblemEl = function (col, col2, seed, size) { var c = GF.emblem(col, col2, seed, size); var copy = GF.mk(c.width, c.height); copy.getContext('2d').drawImage(c, 0, 0); copy.style.width = c.style.width; copy.style.height = c.style.height; copy.style.flex = 'none'; return copy; };
})(G.GFX);
