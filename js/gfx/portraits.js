// ============================================================
//  Leader portraits: painted busts with period headwear, hair,
//  beards and dress for every leader, shown in diplomacy.
// ============================================================
(function (GF) {
  var SKIN = ['#f3d6be', '#ebc4a2', '#dcae86', '#c69266', '#a6724a', '#7a5236', '#583a24'];
  // sk skin, f female, hc hair colour, hs hair style, b beard, h hat, g garment, x extras
  var P = {
    america: { sk: 0, hc: '#eeeae4', hs: 'wig', g: 'cravat', gc: '#2a2a3a' },
    arabia: { sk: 3, hc: '#2a1e16', hs: 'short', b: 'full', h: 'turban', hcol: '#f2efe6', g: 'robe', gc: '#2a6a3a' },
    assyria: { sk: 3, hc: '#1a120c', hs: 'long', b: 'square', h: 'mitre', hcol: '#e8dcc0', g: 'robe', gc: '#7a2a2a' },
    austria: { sk: 0, f: 1, hc: '#b89a6a', hs: 'bun', h: 'crown', g: 'gown', gc: '#e8e0d0' },
    aztec: { sk: 4, hc: '#141010', hs: 'long', h: 'feathers', hcol: '#2aa06a', g: 'cloak', gc: '#2a8a8a', x: 'necklace' },
    babylon: { sk: 3, hc: '#1a120c', hs: 'long', b: 'square', h: 'mitre', hcol: '#3a4a9a', g: 'robe', gc: '#2a3a8a' },
    brazil: { sk: 0, hc: '#e8e4dc', hs: 'short', b: 'longwhite', g: 'mil', gc: '#1a3a2a' },
    byzantium: { sk: 1, hc: '#4a3020', hs: 'short', h: 'imperial', g: 'robe', gc: '#6a2a7a', x: 'jewels' },
    carthage: { sk: 3, hc: '#1a120c', hs: 'curly', b: 'full', g: 'armor', gc: '#a87a3a', x: 'scar' },
    celts: { sk: 0, f: 1, hc: '#b8481a', hs: 'braids', g: 'cloak', gc: '#2a6a3a', x: 'torc' },
    china: { sk: 1, hc: '#141010', hs: 'short', b: 'goatee', h: 'futou', g: 'robe', gc: '#d8a020' },
    denmark: { sk: 0, hc: '#c8a060', hs: 'long', b: 'full', h: 'viking', g: 'cloak', gc: '#a82a2a' },
    egypt: { sk: 3, hc: '#141010', hs: 'none', b: 'pharaoh', h: 'nemes', g: 'bare', gc: '#e8d8a0', x: 'collar' },
    england: { sk: 0, f: 1, hc: '#c0501a', hs: 'curly', h: 'crown', g: 'ruff', gc: '#1a1a2a', x: 'pearls' },
    ethiopia: { sk: 5, hc: '#141010', hs: 'short', b: 'full', h: 'ethcrown', g: 'robe', gc: '#2a7a3a' },
    france: { sk: 0, hc: '#3a2a1a', hs: 'short', h: 'bicorne', g: 'mil', gc: '#1a2a6a' },
    germany: { sk: 0, hc: '#9a9088', hs: 'bald', b: 'walrus', h: 'pickel', g: 'mil', gc: '#3a3a3a' },
    athens: { sk: 1, hc: '#3a2a1a', hs: 'curly', b: 'full', h: 'corinth_up', g: 'cloak', gc: '#e8e4dc' },
    macedon: { sk: 1, hc: '#c8a050', hs: 'curly', h: 'diadem', g: 'armor', gc: '#d8a040' },
    sparta: { sk: 2, hc: '#2a1e16', hs: 'long', b: 'full', h: 'corinth', g: 'armor', gc: '#a82a1a' },
    inca: { sk: 4, hc: '#141010', hs: 'short', h: 'mascaipacha', g: 'cloak', gc: '#c8401a', x: 'earspool' },
    india: { sk: 4, hc: '#141010', hs: 'long', b: 'mustache', h: 'mukuta', g: 'bare', gc: '#e8a020', x: 'necklace' },
    majapahit: { sk: 4, hc: '#141010', hs: 'long', h: 'mukuta', g: 'bare', gc: '#c8901a', x: 'necklace' },
    iroquois: { sk: 3, hc: '#141010', hs: 'none', h: 'roach', g: 'cloak', gc: '#7a4a2a', x: 'necklace' },
    japan: { sk: 1, hc: '#141010', hs: 'short', b: 'mustache', h: 'eboshi', g: 'robe', gc: '#2a2a3a' },
    korea: { sk: 1, hc: '#141010', hs: 'short', b: 'goatee', h: 'ikseon', g: 'robe', gc: '#c82a2a' },
    mongolia: { sk: 2, hc: '#141010', hs: 'braids', b: 'mustache', h: 'furcap', g: 'fur', gc: '#3a5a8a' },
    morocco: { sk: 3, hc: '#1a120c', hs: 'short', b: 'full', h: 'turban', hcol: '#f2efe6', g: 'robe', gc: '#c8401a' },
    netherlands: { sk: 0, hc: '#6a4a2a', hs: 'short', b: 'full', h: 'bonnet', g: 'ruff', gc: '#1a1a1a' },
    ottomans: { sk: 2, hc: '#2a1e16', hs: 'short', b: 'full', h: 'bigturban', hcol: '#f6f2ea', g: 'fur', gc: '#2a6a3a' },
    persia: { sk: 3, hc: '#141010', hs: 'curly', b: 'square', h: 'kidaris', g: 'robe', gc: '#6a2a8a' },
    poland: { sk: 0, hc: '#6a4a2a', hs: 'long', b: 'long', h: 'crown', g: 'fur', gc: '#a82a2a' },
    hawaii: { sk: 4, hc: '#141010', hs: 'short', h: 'mahiole', g: 'featcloak', gc: '#e8b020' },
    portugal: { sk: 1, hc: '#3a2a1a', hs: 'short', b: 'full', h: 'crown', g: 'fur', gc: '#1a3a8a' },
    rome: { sk: 1, hc: '#4a3020', hs: 'short', h: 'laurel', g: 'toga', gc: '#f0ece2' },
    russia: { sk: 0, f: 1, hc: '#d8d0c4', hs: 'bun', h: 'imperial', g: 'gown', gc: '#e8e0d0', x: 'sash' },
    siam: { sk: 3, hc: '#141010', hs: 'short', h: 'mukuta', g: 'bare', gc: '#d8a020', x: 'necklace' },
    songhai: { sk: 5, hc: '#141010', hs: 'short', b: 'full', h: 'turban', hcol: '#3a3aa0', g: 'robe', gc: '#3a3aa0' },
    spain: { sk: 0, f: 1, hc: '#a86a2a', hs: 'veil', h: 'crown', g: 'gown', gc: '#6a1a2a' },
    sweden: { sk: 0, hc: '#c8a060', hs: 'short', b: 'goatee', g: 'armor', gc: '#2a4a8a' },
    venice: { sk: 0, hc: '#e8e4dc', hs: 'none', b: 'longwhite', h: 'corno', g: 'robe', gc: '#c8a020' },
    zulu: { sk: 6, hc: '#141010', hs: 'short', h: 'zulu', g: 'bare', gc: '#e8e0d0', x: 'necklace' },
    maya: { sk: 4, hc: '#141010', hs: 'long', h: 'feathers', hcol: '#1a9a6a', g: 'bare', gc: '#2a9a6a', x: 'collar' },
    mali: { sk: 6, hc: '#141010', hs: 'short', b: 'full', h: 'crown', g: 'robe', gc: '#d8a020' },
    kongo: { sk: 6, hc: '#141010', hs: 'short', b: 'goatee', h: 'crown', g: 'robe', gc: '#a82a1a' },
    khmer: { sk: 4, hc: '#141010', hs: 'none', h: 'mukuta', g: 'bare', gc: '#c8901a', x: 'necklace' },
    vietnam: { sk: 2, hc: '#141010', hs: 'short', b: 'longthin', h: 'futou', g: 'robe', gc: '#e8c020' },
    scotland: { sk: 0, hc: '#7a4a2a', hs: 'long', b: 'full', h: 'crown', g: 'armor', gc: '#2a3a7a' },
    phoenicia: { sk: 3, hc: '#1a120c', hs: 'curly', b: 'square', h: 'crown', g: 'robe', gc: '#6a1a5a' },
    hittites: { sk: 2, hc: '#1a120c', hs: 'long', h: 'cone', g: 'robe', gc: '#8a5a2a' },
    sumer: { sk: 3, hc: '#1a120c', hs: 'long', b: 'square', h: 'mitre', hcol: '#d8b040', g: 'robe', gc: '#6a5a2a' },
    nubia: { sk: 6, hc: '#141010', hs: 'none', h: 'nubian', g: 'bare', gc: '#e8d8a0', x: 'collar' },
    georgia: { sk: 1, f: 1, hc: '#2a1e16', hs: 'veil', h: 'crown', g: 'gown', gc: '#8a1a2a', x: 'jewels' },
    hungary: { sk: 0, hc: '#6a4a2a', hs: 'long', h: 'laurel', g: 'armor', gc: '#2a5a2a' },
    mughal: { sk: 3, hc: '#141010', hs: 'short', b: 'mustache', h: 'turban', hcol: '#e8c040', g: 'robe', gc: '#e8e0d0', x: 'pearls' },
    canada: { sk: 0, hc: '#c8c4bc', hs: 'swept', g: 'suit', gc: '#1a1a22' },
    australia: { sk: 0, hc: '#8a8078', hs: 'bald', g: 'suit', gc: '#2a2a32', x: 'glasses' },
    norway: { sk: 0, hc: '#d8b070', hs: 'long', b: 'long', h: 'viking', g: 'armor', gc: '#2a3a7a' },
    gran_colombia: { sk: 1, hc: '#1a120c', hs: 'curly', b: 'sideburns', g: 'mil', gc: '#1a2a5a' },
    tibet: { sk: 3, hc: '#141010', hs: 'long', b: 'mustache', h: 'turban', hcol: '#c8301a', g: 'robe', gc: '#c8401a' },
    bulgaria: { sk: 1, hc: '#3a2a1a', hs: 'long', b: 'full', h: 'imperial', g: 'robe', gc: '#6a1a2a', x: 'jewels' },
    huns: { sk: 2, hc: '#141010', hs: 'none', b: 'mustache', h: 'furcap', g: 'fur', gc: '#5a3a1a' },
    ethiopia_aksum: { sk: 5, hc: '#141010', hs: 'short', b: 'goatee', h: 'crown', g: 'robe', gc: '#e8e0d0' }
  };
  var cache = {};
  function grad(ctx, x0, y0, x1, y1, a, b) { var g = ctx.createLinearGradient(x0, y0, x1, y1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function rad(ctx, x, y, r, a, b) { var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.05, x, y, r * 1.1); g.addColorStop(0, a); g.addColorStop(1, b); return g; }
  function ell(ctx, x, y, rx, ry, fill) { ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2); ctx.fill(); }
  function path(ctx, pts, fill, stroke, lw) { ctx.beginPath(); ctx.moveTo(pts[0], pts[1]); for (var i = 2; i < pts.length; i += 2) ctx.lineTo(pts[i], pts[i + 1]); ctx.closePath(); if (fill) { ctx.fillStyle = fill; ctx.fill(); } if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = lw || 1; ctx.stroke(); } }

  GF.portrait = function (civ, size) {
    var key = civ + '|' + size; if (cache[key]) return cache[key];
    var cd = G.D.CIVS[civ] || {}, p = P[civ] || { sk: 1, hc: '#3a2a1a', hs: 'short', g: 'robe' };
    var col = (cd.col || ['#555', '#ddd'])[0], col2 = (cd.col || ['#555', '#ddd'])[1];
    var W = size, H = Math.round(size * 1.2), c = GF.mk(W, H), ctx = c.getContext('2d'), u = W / 100;
    ctx.save(); ctx.scale(u, u);
    var HH = H / u, sk = SKIN[p.sk], skD = GF.shade(sk, -0.28), skL = GF.shade(sk, 0.18), gc = p.gc || col, gold = '#d8aa3a', hc = p.hc;
    // background: throne-room light with civ colour
    var bg = ctx.createRadialGradient(40, 35, 5, 50, 55, 85); bg.addColorStop(0, GF.shade(col, 0.25)); bg.addColorStop(0.6, GF.shade(col, -0.35)); bg.addColorStop(1, GF.shade(col, -0.7));
    ctx.fillStyle = bg; ctx.fillRect(0, 0, 100, HH);
    if (GF.emblem) { ctx.globalAlpha = 0.18; var em = GF.emblem(col, col2, civ, 64); ctx.drawImage(em, 58, 4, 40, 40 * em.height / em.width); ctx.globalAlpha = 1; }
    // hanging drape to the left
    ctx.fillStyle = grad(ctx, 0, 0, 18, 0, GF.shade(col, -0.5), GF.shade(col, -0.2)); ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(16, 0); ctx.quadraticCurveTo(10, 50, 14, HH); ctx.lineTo(0, HH); ctx.fill();
    ctx.strokeStyle = 'rgba(255,220,140,0.25)'; ctx.lineWidth = 0.6; for (var k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(3 + k * 3, 0); ctx.quadraticCurveTo(k * 2.2, 60, 3 + k * 3, HH); ctx.stroke(); }
    var hx = 50, hy = 50, hr = 15, hv = 19;
    // long hair / veil / nemes back layer
    if (p.hs === 'long' || p.hs === 'braids') { ctx.fillStyle = grad(ctx, 30, 30, 70, 90, GF.shade(hc, 0.15), GF.shade(hc, -0.35)); ctx.beginPath(); ctx.ellipse(hx, hy + 6, hr + 4, hv + 12, 0, 0, Math.PI * 2); ctx.fill(); }
    if (p.hs === 'veil') { ctx.fillStyle = grad(ctx, 30, 30, 70, 100, 'rgba(250,248,240,0.95)', 'rgba(200,196,186,0.95)'); ctx.beginPath(); ctx.moveTo(hx - 20, 40); ctx.quadraticCurveTo(hx - 26, 80, hx - 30, 100); ctx.lineTo(hx + 30, 100); ctx.quadraticCurveTo(hx + 26, 80, hx + 20, 40); ctx.fill(); }
    if (p.h === 'nemes') { ctx.fillStyle = '#1a3a8a'; path(ctx, [hx - 19, 42, hx - 22, 82, hx - 12, 82, hx - 10, 56], '#d8b040'); path(ctx, [hx + 19, 42, hx + 22, 82, hx + 12, 82, hx + 10, 56], '#d8b040'); ctx.strokeStyle = '#1a3a8a'; ctx.lineWidth = 1.6; for (k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(hx - 21, 50 + k * 4.5); ctx.lineTo(hx - 11, 50 + k * 4.5); ctx.moveTo(hx + 11, 50 + k * 4.5); ctx.lineTo(hx + 21, 50 + k * 4.5); ctx.stroke(); } }
    // ---- shoulders & garment ----
    var sh = [6, HH, 10, 92, 24, 80, 40, 76, 60, 76, 76, 80, 90, 92, 94, HH];
    ctx.beginPath(); ctx.moveTo(sh[0], sh[1]); ctx.bezierCurveTo(8, 88, 18, 80, 38, 77); ctx.lineTo(62, 77); ctx.bezierCurveTo(82, 80, 92, 88, 94, HH); ctx.closePath();
    var garment = p.g === 'bare' ? sk : gc;
    ctx.fillStyle = grad(ctx, 10, 75, 90, HH, GF.shade(garment, 0.2), GF.shade(garment, -0.4)); ctx.fill();
    // neck
    ctx.fillStyle = grad(ctx, 44, 0, 57, 0, skL, skD); ctx.beginPath(); ctx.moveTo(43, 62); ctx.lineTo(43, 80); ctx.quadraticCurveTo(50, 84, 57, 80); ctx.lineTo(57, 62); ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.18)'; ctx.beginPath(); ctx.ellipse(50, 66, 8, 4, 0, 0, Math.PI); ctx.fill();
    switch (p.g) {
      case 'robe': case 'toga':
        ctx.fillStyle = grad(ctx, 30, 78, 70, HH, GF.shade(gc, 0.35), GF.shade(gc, -0.2)); ctx.beginPath(); ctx.moveTo(40, 77); ctx.lineTo(50, 98); ctx.lineTo(60, 77); ctx.lineTo(56, 77); ctx.lineTo(50, 90); ctx.lineTo(44, 77); ctx.fill();
        ctx.strokeStyle = p.g === 'toga' ? 'rgba(120,110,90,0.5)' : gold; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(40, 77); ctx.lineTo(50, 96); ctx.lineTo(60, 77); ctx.stroke();
        if (p.g === 'toga') { ctx.strokeStyle = 'rgba(110,100,80,0.45)'; ctx.lineWidth = 0.8; for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(20 + k * 4, 85 + k); ctx.quadraticCurveTo(45, 92 + k * 3, 75 - k * 2, 78 + k * 4); ctx.stroke(); } ctx.strokeStyle = '#7a1a3a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(62, 78); ctx.quadraticCurveTo(70, 95, 66, HH); ctx.stroke(); }
        break;
      case 'gown': ctx.fillStyle = sk; ctx.beginPath(); ctx.moveTo(34, 79); ctx.quadraticCurveTo(50, 96, 66, 79); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(30, 81); ctx.quadraticCurveTo(50, 100, 70, 81); ctx.stroke(); ctx.fillStyle = 'rgba(255,255,255,0.18)'; for (k = 0; k < 6; k++) ell(ctx, 22 + k * 11, 100 + (k % 2) * 3, 3, 2, 'rgba(255,255,255,0.25)'); break;
      case 'ruff': for (k = 0; k < 14; k++) { var a = Math.PI * (0.05 + k / 13 * 0.9); ell(ctx, 50 - Math.cos(a) * 16, 79 + Math.sin(a) * 3, 4, 3.4, k % 2 ? '#f6f4ee' : '#e2ded4'); } ctx.strokeStyle = gold; ctx.lineWidth = 1; for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.arc(30 + k * 10, 95, 2, 0, Math.PI * 2); ctx.stroke(); } break;
      case 'cravat': ctx.fillStyle = '#f4f2ec'; ctx.beginPath(); ctx.moveTo(43, 78); ctx.quadraticCurveTo(50, 92, 57, 78); ctx.lineTo(55, 96); ctx.lineTo(45, 96); ctx.fill(); ctx.strokeStyle = GF.shade(gc, -0.5); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(38, 78); ctx.lineTo(44, 100); ctx.moveTo(62, 78); ctx.lineTo(56, 100); ctx.stroke(); break;
      case 'suit': ctx.fillStyle = '#f2f2f0'; path(ctx, [43, 78, 57, 78, 54, HH, 46, HH], '#f2f2f0'); path(ctx, [48.5, 82, 51.5, 82, 52.5, 104, 50, 107, 47.5, 104], '#6a1a2a'); ctx.fillStyle = GF.shade(gc, -0.2); path(ctx, [38, 78, 46, 80, 49, HH, 36, HH], GF.shade(gc, 0.1)); path(ctx, [62, 78, 54, 80, 51, HH, 64, HH], GF.shade(gc, 0.05)); break;
      case 'mil': ctx.fillStyle = gold; ctx.fillRect(43, 76, 14, 5); ell(ctx, 22, 84, 9, 4, gold); ell(ctx, 78, 84, 9, 4, gold); ctx.strokeStyle = '#a07a20'; ctx.lineWidth = 0.6; for (k = 0; k < 7; k++) { ctx.beginPath(); ctx.moveTo(14 + k * 2.4, 86); ctx.lineTo(14 + k * 2.4, 91); ctx.moveTo(72 + k * 2.4, 86); ctx.lineTo(72 + k * 2.4, 91); ctx.stroke(); } for (k = 0; k < 4; k++) ell(ctx, 50, 87 + k * 6, 1.4, 1.4, gold); ctx.strokeStyle = '#c83a2a'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(30, 80); ctx.lineTo(66, HH); ctx.stroke(); break;
      case 'armor': ctx.fillStyle = grad(ctx, 20, 78, 80, HH, '#d8d8dc', '#5a5a64'); ctx.beginPath(); ctx.moveTo(26, 82); ctx.quadraticCurveTo(50, 76, 74, 82); ctx.lineTo(76, HH); ctx.lineTo(24, HH); ctx.fill(); ell(ctx, 20, 86, 11, 6, '#b8b8c0'); ell(ctx, 80, 86, 11, 6, '#a0a0aa'); ctx.strokeStyle = gold; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(50, 80); ctx.lineTo(50, HH); ctx.stroke(); ctx.strokeStyle = gc; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(10, 92); ctx.quadraticCurveTo(14, 84, 22, 82); ctx.stroke(); break;
      case 'cloak': case 'featcloak': ctx.fillStyle = gold; ell(ctx, 28, 82, 3.4, 3.4, gold); ell(ctx, 72, 82, 3.4, 3.4, gold); ctx.fillStyle = 'rgba(0,0,0,0.2)'; ctx.beginPath(); ctx.moveTo(40, 78); ctx.quadraticCurveTo(50, 92, 60, 78); ctx.fill();
        if (p.g === 'featcloak') { for (k = 0; k < 40; k++) { var fx = 10 + (k % 10) * 8.5, fy = 84 + Math.floor(k / 10) * 7; ell(ctx, fx, fy, 3.5, 2.5, (k + Math.floor(k / 10)) % 3 ? '#e8b020' : '#c8201a'); } } break;
      case 'fur': ctx.fillStyle = grad(ctx, 0, 76, 0, 90, '#8a6a4a', '#4a3424'); ctx.beginPath(); ctx.moveTo(18, 88); ctx.quadraticCurveTo(50, 70, 82, 88); ctx.quadraticCurveTo(50, 84, 18, 88); ctx.fill(); for (k = 0; k < 22; k++) { ell(ctx, 20 + k * 2.8, 84 - Math.sin(k / 21 * Math.PI) * 6, 2.4, 2, k % 2 ? '#9a7a5a' : '#6a4e36'); } break;
      case 'bare': ctx.fillStyle = 'rgba(0,0,0,0.12)'; ctx.beginPath(); ctx.ellipse(36, 92, 10, 5, 0.3, 0, Math.PI * 2); ctx.ellipse(64, 92, 10, 5, -0.3, 0, Math.PI * 2); ctx.fill(); break;
    }
    if (p.x === 'collar' || p.g === 'bare') { for (k = 0; k < 3; k++) { ctx.strokeStyle = ['#d8aa3a', '#2a7ab0', '#c83a2a'][k]; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.ellipse(50, 77, 15 + k * 3.2, 7 + k * 3, 0, 0.05 * Math.PI, 0.95 * Math.PI); ctx.stroke(); } }
    if (p.x === 'necklace' || p.x === 'pearls') { for (k = 0; k < 13; k++) { var aa = Math.PI * (0.15 + k / 12 * 0.7); ell(ctx, 50 - Math.cos(aa) * 13, 76 + Math.sin(aa) * 10, 1.3, 1.3, p.x === 'pearls' ? '#f6f2ea' : k % 3 ? '#d8aa3a' : '#2a9a7a'); } }
    if (p.x === 'torc') { ctx.strokeStyle = gold; ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(50, 74, 9, 5, 0, 0.1 * Math.PI, 0.9 * Math.PI); ctx.stroke(); }
    if (p.x === 'sash') { ctx.strokeStyle = '#2a5aa8'; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(30, 84); ctx.lineTo(66, HH); ctx.stroke(); }
    // ---- head ----
    ell(ctx, hx - hr + 0.5, hy + 2, 2.6, 4.5, skD); ell(ctx, hx + hr - 0.5, hy + 2, 2.6, 4.5, skD);
    if (p.x === 'earspool') { ell(ctx, hx - hr, hy + 4, 3, 3, gold); ell(ctx, hx + hr, hy + 4, 3, 3, gold); }
    ctx.fillStyle = rad(ctx, hx - 3, hy - 3, hv, skL, skD); ctx.beginPath(); ctx.moveTo(hx - hr, hy - 4); ctx.bezierCurveTo(hx - hr, hy - hv - 2, hx + hr, hy - hv - 2, hx + hr, hy - 4);
    ctx.bezierCurveTo(hx + hr, hy + 8, hx + (p.f ? 6 : 8), hy + hv - 1, hx, hy + hv); ctx.bezierCurveTo(hx - (p.f ? 6 : 8), hy + hv - 1, hx - hr, hy + 8, hx - hr, hy - 4); ctx.fill();
    // cheek shading & jaw
    ctx.fillStyle = 'rgba(0,0,0,0.10)'; ctx.beginPath(); ctx.ellipse(hx + 9, hy + 6, 5, 8, -0.2, 0, Math.PI * 2); ctx.fill();
    if (p.f) { ctx.fillStyle = 'rgba(220,90,90,0.16)'; ell(ctx, hx - 8, hy + 6, 4, 2.5, 'rgba(220,90,90,0.16)'); ell(ctx, hx + 8, hy + 6, 4, 2.5, 'rgba(220,90,90,0.14)'); }
    // eyes
    [-6.2, 6.2].forEach(function (dx) {
      var ex = hx + dx, ey = hy;
      ctx.fillStyle = '#f4f0e8'; ctx.beginPath(); ctx.moveTo(ex - 3.6, ey); ctx.quadraticCurveTo(ex, ey - 2.6, ex + 3.6, ey); ctx.quadraticCurveTo(ex, ey + 2, ex - 3.6, ey); ctx.fill();
      ell(ctx, ex + 0.3, ey - 0.1, 1.7, 1.7, p.sk <= 0 && (civ === 'denmark' || civ === 'norway' || civ === 'sweden' || civ === 'macedon' || civ === 'russia') ? '#3a6a9a' : '#3a2616');
      ell(ctx, ex + 0.3, ey - 0.1, 0.8, 0.8, '#0a0806'); ell(ctx, ex - 0.3, ey - 0.7, 0.45, 0.45, '#fff');
      ctx.strokeStyle = 'rgba(30,18,10,0.85)'; ctx.lineWidth = p.f ? 0.9 : 0.7; ctx.beginPath(); ctx.moveTo(ex - 3.8, ey + 0.2); ctx.quadraticCurveTo(ex, ey - 2.9, ex + 3.8, ey); ctx.stroke();
      ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(ex - 3, ey + 2.4); ctx.quadraticCurveTo(ex, ey + 3.4, ex + 3, ey + 2.4); ctx.stroke();
      ctx.strokeStyle = GF.shade(hc === '#eeeae4' || hc === '#e8e4dc' ? '#8a8070' : hc, -0.1); ctx.lineWidth = p.f ? 1 : 1.6; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(ex - 4, ey - 4 + (dx < 0 ? 0.4 : 0)); ctx.quadraticCurveTo(ex, ey - 5.6, ex + 4, ey - 4 + (dx > 0 ? 0.4 : 0)); ctx.stroke();
    });
    if (p.x === 'glasses') { ctx.strokeStyle = '#2a2a2a'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.arc(hx - 6.2, hy, 4.4, 0, Math.PI * 2); ctx.moveTo(hx + 10.6, hy); ctx.arc(hx + 6.2, hy, 4.4, 0, Math.PI * 2); ctx.moveTo(hx - 1.8, hy); ctx.lineTo(hx + 1.8, hy); ctx.stroke(); }
    if (p.x === 'scar') { ctx.strokeStyle = 'rgba(120,40,30,0.6)'; ctx.lineWidth = 0.8; ctx.beginPath(); ctx.moveTo(hx + 4, hy - 6); ctx.lineTo(hx + 8, hy + 4); ctx.stroke(); }
    // nose
    ctx.strokeStyle = 'rgba(60,30,20,0.35)'; ctx.lineWidth = 0.9; ctx.beginPath(); ctx.moveTo(hx - 1, hy - 1); ctx.quadraticCurveTo(hx - 2.2, hy + 6, hx - 2.6, hy + 7.5); ctx.quadraticCurveTo(hx, hy + 9.2, hx + 2.6, hy + 7.5); ctx.stroke();
    ell(ctx, hx + 2.5, hy + 4, 1.8, 4, 'rgba(0,0,0,0.08)'); ell(ctx, hx - 0.8, hy + 3, 0.9, 3, 'rgba(255,255,255,0.18)');
    // mouth
    ctx.fillStyle = p.f ? '#b8504a' : GF.shade(sk, -0.4); ctx.beginPath(); ctx.moveTo(hx - 4.4, hy + 12.4); ctx.quadraticCurveTo(hx, hy + 11.2, hx + 4.4, hy + 12.4); ctx.quadraticCurveTo(hx, hy + 14.8, hx - 4.4, hy + 12.4); ctx.fill();
    ctx.strokeStyle = 'rgba(40,16,10,0.6)'; ctx.lineWidth = 0.6; ctx.beginPath(); ctx.moveTo(hx - 4.4, hy + 12.4); ctx.quadraticCurveTo(hx, hy + 13, hx + 4.4, hy + 12.4); ctx.stroke();
    // ---- hair on top ----
    var hg = grad(ctx, hx - 15, hy - 20, hx + 15, hy, GF.shade(hc, 0.25), GF.shade(hc, -0.3));
    function cap(depth) { ctx.fillStyle = hg; ctx.beginPath(); ctx.moveTo(hx - hr - 1, hy + depth); ctx.bezierCurveTo(hx - hr - 2, hy - hv - 5, hx + hr + 2, hy - hv - 5, hx + hr + 1, hy + depth); ctx.quadraticCurveTo(hx + 8, hy - 13, hx, hy - 12); ctx.quadraticCurveTo(hx - 8, hy - 13, hx - hr - 1, hy + depth); ctx.fill(); }
    switch (p.hs) {
      case 'short': case 'long': case 'braids': cap(-1); break;
      case 'swept': cap(-3); ctx.strokeStyle = GF.shade(hc, 0.3); ctx.lineWidth = 0.6; for (k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(hx - 12 + k * 4, hy - 13); ctx.quadraticCurveTo(hx - 6 + k * 4, hy - 22, hx + 6 + k * 3, hy - 18); ctx.stroke(); } break;
      case 'curly': cap(-1); for (k = 0; k < 16; k++) { var ca = Math.PI * (1.02 + k / 15 * 0.96); ell(ctx, hx + Math.cos(ca) * (hr + 0.5), hy - 4 + Math.sin(ca) * (hv - 1), 3.2, 3, k % 2 ? GF.shade(hc, 0.15) : GF.shade(hc, -0.15)); } break;
      case 'bun': case 'wig': cap(-2); if (p.hs === 'bun') ell(ctx, hx, hy - hv - 4, 7, 5, hg); else { ell(ctx, hx - hr - 1, hy - 3, 3.6, 3, '#f4f2ee'); ell(ctx, hx + hr + 1, hy - 3, 3.6, 3, '#e4e0d8'); ell(ctx, hx - hr - 1, hy + 2, 3.2, 2.6, '#ebe8e2'); ell(ctx, hx + hr + 1, hy + 2, 3.2, 2.6, '#dcd8d0'); } break;
      case 'bald': ctx.fillStyle = hg; ell(ctx, hx - hr + 1, hy - 5, 3, 5, hg); ell(ctx, hx + hr - 1, hy - 5, 3, 5, hg); break;
    }
    if (p.hs === 'braids') { [-1, 1].forEach(function (sd) { for (var q = 0; q < 6; q++) ell(ctx, hx + sd * (hr + 2), hy + 8 + q * 5, 2.6, 3, q % 2 ? GF.shade(hc, 0.15) : GF.shade(hc, -0.2)); }); }
    // ---- beard ----
    var bc = p.b === 'longwhite' ? '#ece8e0' : hc, bg2 = grad(ctx, hx - 12, hy + 6, hx + 12, hy + 30, GF.shade(bc, 0.2), GF.shade(bc, -0.3));
    function beard(len, wid) { ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(hx - hr + 0.5, hy + 1); ctx.quadraticCurveTo(hx - hr + 1, hy + 12 + len * 0.3, hx - wid, hy + 14 + len * 0.6); ctx.quadraticCurveTo(hx, hy + 20 + len, hx + wid, hy + 14 + len * 0.6); ctx.quadraticCurveTo(hx + hr - 1, hy + 12 + len * 0.3, hx + hr - 0.5, hy + 1);
      ctx.quadraticCurveTo(hx + 9, hy + 10, hx + 5, hy + 11); ctx.quadraticCurveTo(hx, hy + 16, hx - 5, hy + 11); ctx.quadraticCurveTo(hx - 9, hy + 10, hx - hr + 0.5, hy + 1); ctx.fill(); }
    function mustache(w, droop) { ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(hx, hy + 9.6); ctx.quadraticCurveTo(hx - w * 0.6, hy + 9, hx - w, hy + 11 + droop); ctx.quadraticCurveTo(hx - w * 0.5, hy + 11.8, hx, hy + 11); ctx.quadraticCurveTo(hx + w * 0.5, hy + 11.8, hx + w, hy + 11 + droop); ctx.quadraticCurveTo(hx + w * 0.6, hy + 9, hx, hy + 9.6); ctx.fill(); }
    switch (p.b) {
      case 'full': beard(4, 7); mustache(6, 1); break;
      case 'long': case 'longwhite': beard(16, 8); mustache(6.5, 2); break;
      case 'longthin': mustache(6, 4); ctx.fillStyle = bg2; ctx.beginPath(); ctx.moveTo(hx - 2.2, hy + 15); ctx.lineTo(hx + 2.2, hy + 15); ctx.lineTo(hx, hy + 30); ctx.fill(); break;
      case 'square': beard(14, 10); mustache(7, 1); ctx.strokeStyle = 'rgba(0,0,0,0.35)'; ctx.lineWidth = 0.7; for (k = 0; k < 6; k++) { ctx.beginPath(); ctx.moveTo(hx - 10, hy + 16 + k * 3); for (var q = 0; q < 7; q++) ctx.arc(hx - 8.6 + q * 2.9, hy + 16 + k * 3, 1.4, Math.PI, 0); ctx.stroke(); } break;
      case 'goatee': mustache(5, 1.5); ctx.fillStyle = bg2; ctx.beginPath(); ctx.ellipse(hx, hy + 17, 2.6, 3.6, 0, 0, Math.PI * 2); ctx.fill(); break;
      case 'mustache': mustache(6.5, 3); break;
      case 'walrus': mustache(9, 3.5); break;
      case 'sideburns': ell(ctx, hx - hr + 1.5, hy + 5, 2, 6, bg2); ell(ctx, hx + hr - 1.5, hy + 5, 2, 6, bg2); break;
      case 'pharaoh': ctx.fillStyle = '#1a3a8a'; ctx.beginPath(); ctx.moveTo(hx - 2, hy + 17); ctx.lineTo(hx + 2, hy + 17); ctx.lineTo(hx + 1.6, hy + 28); ctx.lineTo(hx - 1.6, hy + 28); ctx.fill(); ctx.strokeStyle = gold; ctx.lineWidth = 0.6; for (k = 0; k < 4; k++) { ctx.beginPath(); ctx.moveTo(hx - 2, hy + 19 + k * 2.5); ctx.lineTo(hx + 2, hy + 19 + k * 2.5); ctx.stroke(); } break;
    }
    // ---- headwear ----
    var top = hy - hv + 1, hcol = p.hcol;
    function band(y, h2, c1) { ctx.fillStyle = grad(ctx, hx - 16, 0, hx + 16, 0, GF.shade(c1, 0.35), GF.shade(c1, -0.3)); ctx.beginPath(); ctx.moveTo(hx - hr - 1.5, y + h2); ctx.quadraticCurveTo(hx, y + h2 + 2.5, hx + hr + 1.5, y + h2); ctx.lineTo(hx + hr + 1, y); ctx.quadraticCurveTo(hx, y + 2.5, hx - hr - 1, y); ctx.fill(); }
    function gems(y) { ell(ctx, hx, y, 1.6, 1.8, '#c8201a'); ell(ctx, hx - 7, y - 0.4, 1.2, 1.3, '#2a6ac8'); ell(ctx, hx + 7, y - 0.4, 1.2, 1.3, '#2a9a5a'); }
    switch (p.h) {
      case 'crown': band(top + 1, 5, gold); for (k = 0; k < 5; k++) { var px = hx - 12 + k * 6; path(ctx, [px - 2.4, top + 2, px, top - 6 - (k === 2 ? 2 : 0), px + 2.4, top + 2], gold); ell(ctx, px, top - 6 - (k === 2 ? 2 : 0), 1.1, 1.1, '#f2e6a0'); } gems(top + 3.6); break;
      case 'imperial': case 'ethcrown': ctx.fillStyle = civ === 'ethiopia' || p.h === 'ethcrown' ? rad(ctx, hx, top - 2, 14, '#f2d060', '#9a7018') : rad(ctx, hx, top - 2, 14, GF.shade(col, 0.2), GF.shade(col, -0.4)); ctx.beginPath(); ctx.ellipse(hx, top + 1, hr + 0.5, 11, 0, Math.PI, 0); ctx.fill(); band(top, 5, gold); ctx.strokeStyle = gold; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.ellipse(hx, top + 1, 2, 11, 0, Math.PI, 0); ctx.stroke(); ctx.beginPath(); ctx.moveTo(hx, top - 10); ctx.lineTo(hx, top - 16); ctx.moveTo(hx - 3, top - 13.5); ctx.lineTo(hx + 3, top - 13.5); ctx.stroke(); gems(top + 2.6);
        if (p.x === 'jewels') { for (k = 0; k < 4; k++) { ell(ctx, hx - hr - 0.5, top + 7 + k * 3.2, 1, 1.2, k % 2 ? '#f6f2ea' : '#c8201a'); ell(ctx, hx + hr + 0.5, top + 7 + k * 3.2, 1, 1.2, k % 2 ? '#f6f2ea' : '#c8201a'); } } break;
      case 'laurel': for (k = 0; k < 9; k++) { var la = Math.PI * (1.05 + k / 8 * 0.9); ctx.save(); ctx.translate(hx + Math.cos(la) * (hr + 0.5), hy - 6 + Math.sin(la) * (hv - 4)); ctx.rotate(la + Math.PI / 2 + (k < 4 ? -0.6 : 0.6)); ell(ctx, 0, 0, 1.6, 3.6, k % 2 ? '#5a8a2a' : '#3a6a1a'); ctx.restore(); } break;
      case 'diadem': band(top + 5, 2.4, '#f2eee6'); break;
      case 'turban': case 'bigturban': var tb = p.h === 'bigturban' ? 1.45 : 1; ctx.fillStyle = rad(ctx, hx, top - 2 * tb, 18 * tb, GF.shade(hcol, 0.2), GF.shade(hcol, -0.35)); ctx.beginPath(); ctx.ellipse(hx, top + 1 - 3 * (tb - 1), (hr + 3) * (tb > 1 ? 1.15 : 1), 11 * tb, 0, Math.PI * 0.95, Math.PI * 2.05); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.18)'; ctx.lineWidth = 0.9; for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(hx - hr - 2, top + 3 - k * 3 * tb); ctx.quadraticCurveTo(hx, top - 4 - k * 3.4 * tb, hx + hr + 2, top - 1 - k * 3 * tb); ctx.stroke(); }
        ell(ctx, hx, top - 2, 2.2, 2.6, civ === 'mughal' || p.h === 'bigturban' ? '#c8201a' : gold); if (p.h === 'bigturban' || civ === 'mughal') { ctx.strokeStyle = '#f6f2ea'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(hx, top - 3); ctx.quadraticCurveTo(hx + 4, top - 14, hx + 9, top - 18); ctx.stroke(); } break;
      case 'mitre': case 'kidaris': ctx.fillStyle = grad(ctx, hx - 14, 0, hx + 14, 0, GF.shade(hcol || gold, 0.3), GF.shade(hcol || gold, -0.3)); ctx.beginPath(); ctx.moveTo(hx - hr, top + 5); ctx.lineTo(hx - hr + 2, top - 14); ctx.lineTo(hx + hr - 2, top - 14); ctx.lineTo(hx + hr, top + 5); ctx.fill(); band(top + 1, 4, gold);
        if (p.h === 'kidaris') { for (k = 0; k < 5; k++) path(ctx, [hx - 12 + k * 6 - 2, top - 14, hx - 12 + k * 6 - 2, top - 18, hx - 12 + k * 6 + 2, top - 18, hx - 12 + k * 6 + 2, top - 14], gold); } else { path(ctx, [hx - 3, top - 14, hx, top - 20, hx + 3, top - 14], gold); } break;
      case 'cone': ctx.fillStyle = grad(ctx, hx - 14, 0, hx + 14, 0, '#d8d0c0', '#8a8070'); ctx.beginPath(); ctx.moveTo(hx - hr, top + 5); ctx.quadraticCurveTo(hx - 4, top - 18, hx, top - 26); ctx.quadraticCurveTo(hx + 4, top - 18, hx + hr, top + 5); ctx.fill(); band(top + 2, 3, gold); break;
      case 'nemes': ctx.fillStyle = '#d8b040'; ctx.beginPath(); ctx.moveTo(hx - hr - 4, hy + 2); ctx.quadraticCurveTo(hx - hr - 3, top - 6, hx, top - 6); ctx.quadraticCurveTo(hx + hr + 3, top - 6, hx + hr + 4, hy + 2); ctx.lineTo(hx + hr - 0.5, hy - 2); ctx.lineTo(hx + hr - 1, top + 6); ctx.lineTo(hx - hr + 1, top + 6); ctx.lineTo(hx - hr + 0.5, hy - 2); ctx.fill();
        ctx.strokeStyle = '#1a3a8a'; ctx.lineWidth = 1.4; for (k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(hx - hr - 1, top + 4 - k * 2.4); ctx.quadraticCurveTo(hx, top - 2 - k * 2.4, hx + hr + 1, top + 4 - k * 2.4); ctx.stroke(); } band(top + 5, 2.4, gold); ctx.fillStyle = '#d8aa3a'; ctx.beginPath(); ctx.ellipse(hx, top + 2, 1.6, 4, 0, 0, Math.PI * 2); ctx.fill(); ell(ctx, hx, top - 1, 1.2, 1.2, '#2a7ab0'); break;
      case 'nubian': ctx.fillStyle = rad(ctx, hx, top, 14, '#3a3030', '#0a0808'); ctx.beginPath(); ctx.ellipse(hx, top + 4, hr + 0.8, 10, 0, Math.PI, 0); ctx.fill(); band(top + 4, 2.4, gold); ell(ctx, hx - 2, top + 1, 1.3, 3, gold); ell(ctx, hx + 2, top + 1, 1.3, 3, gold); break;
      case 'bicorne': ctx.fillStyle = grad(ctx, 0, top - 14, 0, top + 6, '#2a2a2a', '#0a0a0a'); ctx.beginPath(); ctx.moveTo(hx - 30, top + 4); ctx.quadraticCurveTo(hx - 12, top - 4, hx, top - 14); ctx.quadraticCurveTo(hx + 12, top - 4, hx + 30, top + 4); ctx.quadraticCurveTo(hx, top + 8, hx - 30, top + 4); ctx.fill(); ell(ctx, hx + 6, top - 2, 3, 3, '#2a4aa8'); ell(ctx, hx + 6, top - 2, 1.8, 1.8, '#f2f2f2'); ell(ctx, hx + 6, top - 2, 0.9, 0.9, '#c82a2a'); break;
      case 'pickel': ctx.fillStyle = rad(ctx, hx, top - 2, 16, '#3a3a3a', '#0a0a0a'); ctx.beginPath(); ctx.ellipse(hx, top + 4, hr + 1, 12, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(hx - hr - 4, top + 3, (hr + 4) * 2, 2.4); path(ctx, [hx - 2, top - 7, hx, top - 18, hx + 2, top - 7], '#c8a040'); ell(ctx, hx, top - 1, 4, 3.4, '#c8a040'); break;
      case 'corinth': case 'corinth_up': var up = p.h === 'corinth_up' ? -12 : 0; ctx.fillStyle = rad(ctx, hx, top + up, 18, '#e0b060', '#7a5018'); ctx.beginPath(); ctx.ellipse(hx, top + 5 + up, hr + 2, 13, 0, Math.PI, 0); ctx.fill();
        if (!up) { ctx.beginPath(); ctx.moveTo(hx - hr - 2, top + 5); ctx.lineTo(hx - hr - 1, hy + 14); ctx.lineTo(hx - 5, hy + 15); ctx.lineTo(hx - 4, hy + 2); ctx.lineTo(hx - 2, hy - 3); ctx.lineTo(hx - 2, hy + 9); ctx.lineTo(hx + 2, hy + 9); ctx.lineTo(hx + 2, hy - 3); ctx.lineTo(hx + 4, hy + 2); ctx.lineTo(hx + 5, hy + 15); ctx.lineTo(hx + hr + 1, hy + 14); ctx.lineTo(hx + hr + 2, top + 5); ctx.fill(); }
        ctx.fillStyle = civ === 'sparta' ? '#b82a1a' : '#2a2a2a'; ctx.beginPath(); ctx.moveTo(hx - 16, top - 4 + up); ctx.quadraticCurveTo(hx, top - 22 + up, hx + 16, top - 4 + up); ctx.quadraticCurveTo(hx, top - 12 + up, hx - 16, top - 4 + up); ctx.fill(); break;
      case 'viking': ctx.fillStyle = rad(ctx, hx, top - 2, 16, '#c8c8cc', '#4a4a52'); ctx.beginPath(); ctx.moveTo(hx - hr - 1, top + 6); ctx.quadraticCurveTo(hx - hr, top - 10, hx, top - 13); ctx.quadraticCurveTo(hx + hr, top - 10, hx + hr + 1, top + 6); ctx.fill(); band(top + 4, 3, '#8a7a5a'); ctx.fillStyle = '#9a9aa2'; ctx.fillRect(hx - 1.4, top + 6, 2.8, 12); break;
      case 'furcap': ctx.fillStyle = grad(ctx, hx - 14, 0, hx + 14, 0, GF.shade(col, 0.2), GF.shade(col, -0.4)); ctx.beginPath(); ctx.moveTo(hx - hr + 1, top + 3); ctx.quadraticCurveTo(hx - 4, top - 18, hx + 2, top - 20); ctx.quadraticCurveTo(hx + 6, top - 10, hx + hr - 1, top + 3); ctx.fill(); for (k = 0; k < 14; k++) ell(ctx, hx - hr - 1 + k * 2.6, top + 4 + Math.sin(k) * 0.6, 2.6, 3, k % 2 ? '#8a6a48' : '#6a4e34'); break;
      case 'feathers': for (k = 0; k < 13; k++) { var fa = Math.PI * (1.05 + k / 12 * 0.9); ctx.save(); ctx.translate(hx + Math.cos(fa) * 10, top + 2 + Math.sin(fa) * 6); ctx.rotate(fa + Math.PI / 2); ell(ctx, 0, -14, 3, 15, k % 3 === 0 ? '#c8201a' : k % 3 === 1 ? hcol : GF.shade(hcol, -0.3)); ctx.restore(); } band(top + 2, 5, gold); ell(ctx, hx, top + 4, 2.4, 2.4, '#2aa08a'); break;
      case 'roach': for (k = 0; k < 5; k++) { ctx.save(); ctx.translate(hx - 2 + k, top - 2); ctx.rotate(-0.3 + k * 0.15); ell(ctx, 0, -8, 1.8, 9, k % 2 ? '#f2f0ea' : '#2a2a2a'); ctx.restore(); } ell(ctx, hx, top + 2, 6, 3, '#a82a1a'); break;
      case 'mascaipacha': band(top + 4, 3, '#c8401a'); for (k = 0; k < 9; k++) { ctx.fillStyle = '#c8201a'; ctx.fillRect(hx - 8 + k * 2, top + 7, 1.3, 6); } for (k = 0; k < 3; k++) { ctx.save(); ctx.translate(hx - 3 + k * 3, top + 2); ctx.rotate(-0.25 + k * 0.25); ell(ctx, 0, -8, 1.6, 8, k === 1 ? '#f2f0ea' : '#2a2a2a'); ctx.restore(); } break;
      case 'mukuta': ctx.fillStyle = grad(ctx, hx - 12, 0, hx + 12, 0, '#f6d870', '#9a6a18'); ctx.beginPath(); ctx.moveTo(hx - hr + 1, top + 5); ctx.quadraticCurveTo(hx - 9, top - 8, hx - 3, top - 14); ctx.lineTo(hx, top - 28); ctx.lineTo(hx + 3, top - 14); ctx.quadraticCurveTo(hx + 9, top - 8, hx + hr - 1, top + 5); ctx.fill(); for (k = 0; k < 4; k++) band(top + 4 - k * 5, 1.4, '#c89a2a'); gems(top + 4); break;
      case 'mahiole': ctx.fillStyle = rad(ctx, hx, top, 15, '#f2c030', '#a87010'); ctx.beginPath(); ctx.ellipse(hx, top + 5, hr + 1, 12, 0, Math.PI, 0); ctx.fill(); ctx.fillStyle = '#c8201a'; ctx.beginPath(); ctx.moveTo(hx - 3, top + 4); ctx.quadraticCurveTo(hx, top - 18, hx + 3, top + 4); ctx.fill(); break;
      case 'eboshi': ctx.fillStyle = grad(ctx, hx - 8, 0, hx + 8, 0, '#3a3a3a', '#0a0a0a'); ctx.beginPath(); ctx.moveTo(hx - 9, top + 4); ctx.lineTo(hx - 5, top - 18); ctx.quadraticCurveTo(hx + 4, top - 22, hx + 7, top - 14); ctx.lineTo(hx + 9, top + 4); ctx.fill(); break;
      case 'futou': case 'ikseon': ctx.fillStyle = rad(ctx, hx, top, 15, '#3a3a3a', '#080808'); ctx.beginPath(); ctx.ellipse(hx, top + 5, hr + 0.5, 11, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(hx - 6, top - 10, 12, 8);
        if (p.h === 'ikseon') { ell(ctx, hx - 9, top - 9, 3, 6, '#1a1a1a'); ell(ctx, hx + 9, top - 9, 3, 6, '#1a1a1a'); } else { ctx.strokeStyle = '#111'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(hx - 6, top - 4); ctx.quadraticCurveTo(hx - 16, top - 2, hx - 22, top + 6); ctx.moveTo(hx + 6, top - 4); ctx.quadraticCurveTo(hx + 16, top - 2, hx + 22, top + 6); ctx.stroke(); } break;
      case 'corno': ctx.fillStyle = grad(ctx, hx - 14, 0, hx + 14, 0, '#f2d060', '#9a6a18'); ctx.beginPath(); ctx.moveTo(hx - hr, top + 6); ctx.quadraticCurveTo(hx - 12, top - 10, hx + 2, top - 14); ctx.quadraticCurveTo(hx + 10, top - 16, hx + 8, top - 4); ctx.quadraticCurveTo(hx + hr, top, hx + hr, top + 6); ctx.fill(); band(top + 4, 2.4, '#f6f2ea'); break;
      case 'bonnet': ctx.fillStyle = rad(ctx, hx, top - 2, 16, '#3a3a3a', '#0a0a0a'); ctx.beginPath(); ctx.ellipse(hx - 1, top + 1, hr + 4, 7, -0.1, 0, Math.PI * 2); ctx.fill(); break;
      case 'zulu': band(top + 4, 4, '#c8a050'); for (k = 0; k < 12; k++) ell(ctx, hx - 13 + k * 2.4, top + 6, 1, 1, '#3a2a1a'); ctx.save(); ctx.translate(hx + 6, top + 2); ctx.rotate(0.4); ell(ctx, 0, -8, 2.2, 9, '#1a1a1a'); ctx.restore(); ctx.save(); ctx.translate(hx - 6, top + 2); ctx.rotate(-0.4); ell(ctx, 0, -8, 2.2, 9, '#f2f0ea'); ctx.restore(); break;
    }
    // painterly vignette & frame
    var vg = ctx.createRadialGradient(50, HH * 0.45, 30, 50, HH * 0.5, 80); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.55)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, 100, HH);
    ctx.restore();
    // canvas grain
    var id = ctx.getImageData(0, 0, W, H), d = id.data, r = GF.rng(GF.hash(civ));
    for (var i = 0; i < d.length; i += 4) { var n = (r() - 0.5) * 14; d[i] += n; d[i + 1] += n; d[i + 2] += n; }
    ctx.putImageData(id, 0, 0);
    ctx.strokeStyle = '#c8a050'; ctx.lineWidth = Math.max(1.5, W * 0.025); ctx.strokeRect(ctx.lineWidth / 2, ctx.lineWidth / 2, W - ctx.lineWidth, H - ctx.lineWidth);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)'; ctx.lineWidth = 1; ctx.strokeRect(W * 0.025 + 0.5, W * 0.025 + 0.5, W - W * 0.05 - 1, H - W * 0.05 - 1);
    cache[key] = c; return c;
  };
  GF.portraitEl = function (civ, w) {
    var dpr = Math.min(3, window.devicePixelRatio || 1), c = GF.portrait(civ, Math.round(w * dpr));
    var img = document.createElement('img'); img.src = c.toDataURL(); img.className = 'portrait'; img.style.width = w + 'px'; img.style.height = Math.round(w * 1.2) + 'px';
    return img;
  };
})(G.GFX);
