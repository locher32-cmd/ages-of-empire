// ============================================================
//  World wonders drawn beside their city on the map, each with
//  its own silhouette, plus distinct Great People.
// ============================================================
(function (GF) {
  function col(ctx, x, y, w, h, c) { var g = ctx.createLinearGradient(x, 0, x + w, 0); g.addColorStop(0, GF.shade(c, 0.25)); g.addColorStop(1, GF.shade(c, -0.3)); ctx.fillStyle = g; ctx.fillRect(x, y - h, w, h); }
  function dome(ctx, x, y, r, c) { var g = ctx.createRadialGradient(x - r * 0.35, y - r * 0.5, r * 0.1, x, y, r * 1.1); g.addColorStop(0, GF.shade(c, 0.45)); g.addColorStop(1, GF.shade(c, -0.35)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(x, y, r, Math.PI, 0); ctx.closePath(); ctx.fill(); }
  function tri(ctx, x, y, w, h, c1, c2) { GF.poly(ctx, [x - w / 2, y, x, y - h, x + w * 0.05, y], c1); GF.poly(ctx, [x, y - h, x + w / 2, y, x + w * 0.05, y], c2); }
  function minaret(ctx, x, y, h, c) { col(ctx, x - h * 0.04, y, h * 0.08, h, c); dome(ctx, x, y - h, h * 0.06, c); GF.poly(ctx, [x - h * 0.03, y - h * 1.05, x, y - h * 1.2, x + h * 0.03, y - h * 1.05], '#d4a62a'); }
  function statue(ctx, x, y, S, c, arms) {
    col(ctx, x - S * 0.12, y, S * 0.24, S * 0.22, '#9a9488');
    ctx.fillStyle = c; ctx.beginPath(); ctx.moveTo(x - S * 0.08, y - S * 0.22); ctx.lineTo(x - S * 0.06, y - S * 0.75); ctx.lineTo(x + S * 0.06, y - S * 0.75); ctx.lineTo(x + S * 0.08, y - S * 0.22); ctx.fill();
    GF.blob(ctx, x, y - S * 0.82, S * 0.06, S * 0.07, c, 0.3);
    ctx.strokeStyle = c; ctx.lineWidth = S * 0.05; ctx.lineCap = 'round'; ctx.beginPath();
    if (arms === 'cross') { ctx.moveTo(x - S * 0.3, y - S * 0.65); ctx.lineTo(x + S * 0.3, y - S * 0.65); }
    else { ctx.moveTo(x + S * 0.05, y - S * 0.6); ctx.lineTo(x + S * 0.12, y - S * 1.0); }
    ctx.stroke();
    if (arms === 'torch') { ctx.fillStyle = '#ffcc33'; ctx.beginPath(); ctx.arc(x + S * 0.12, y - S * 1.04, S * 0.05, 0, Math.PI * 2); ctx.fill(); }
  }
  function pagoda(ctx, x, y, S, tiers, wall, roof) {
    for (var k = 0; k < tiers; k++) { var w = S * (0.5 - k * 0.07), yy = y - k * S * 0.2; col(ctx, x - w * 0.35, yy, w * 0.7, S * 0.15, wall); GF.poly(ctx, [x - w * 0.6, yy - S * 0.13, x + w * 0.6, yy - S * 0.13, x + w * 0.4, yy - S * 0.21, x - w * 0.4, yy - S * 0.21], roof); }
  }
  GF.wonder = function (S, id) {
    var w = S * 1.6, h = S * 1.9, c = GF.mk(w, h), ctx = c.getContext('2d'), x = w / 2, y = h * 0.88;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x + S * 0.05, y, S * 0.5, S * 0.14, 0, 0, Math.PI * 2); ctx.fill();
    GF.shadow(ctx, S, 0.7);
    var stone = '#e6dcc4', gold = '#d8a830', bronze = '#a87838', white = '#f2eee6';
    switch (id) {
      case 'pyramids': tri(ctx, x - S * 0.15, y, S * 0.75, S * 0.55, '#e8cf8a', '#b89a58'); tri(ctx, x + S * 0.25, y + S * 0.04, S * 0.5, S * 0.36, '#e8cf8a', '#b89a58'); break;
      case 'chichen_itza': case 'great_zimbabwe': for (var k = 0; k < 5; k++) col(ctx, x - S * (0.4 - k * 0.07), y - k * S * 0.11, S * (0.8 - k * 0.14), S * 0.11, id === 'great_zimbabwe' ? '#8a7a68' : '#bfae8e'); col(ctx, x - S * 0.06, y - S * 0.55, S * 0.12, S * 0.1, '#8a6a4a'); break;
      case 'stonehenge': for (k = 0; k < 7; k++) { var a = k / 7 * Math.PI * 2; col(ctx, x + Math.cos(a) * S * 0.38 - S * 0.04, y - S * 0.1 + Math.sin(a) * S * 0.12, S * 0.08, S * 0.28, '#9a9a96'); } break;
      case 'colossus': statue(ctx, x, y, S, bronze, 'torch'); break;
      case 'statue_liberty': statue(ctx, x, y, S, '#6fae98', 'torch'); break;
      case 'cristo_redentor': statue(ctx, x, y, S, '#e8e4dc', 'cross'); break;
      case 'statue_zeus': col(ctx, x - S * 0.25, y, S * 0.5, S * 0.25, white); GF.blob(ctx, x, y - S * 0.45, S * 0.16, S * 0.22, gold, 0.4); GF.blob(ctx, x, y - S * 0.72, S * 0.07, S * 0.08, gold, 0.4); break;
      case 'great_lighthouse': case 'cn_tower': if (id === 'cn_tower') { col(ctx, x - S * 0.05, y, S * 0.1, S * 1.4, '#c8c8c8'); GF.blob(ctx, x, y - S * 1.0, S * 0.15, S * 0.07, '#9a9a9a', 0.4); ctx.fillStyle = '#c8c8c8'; ctx.fillRect(x - S * 0.01, y - S * 1.7, S * 0.02, S * 0.3); break; } col(ctx, x - S * 0.14, y, S * 0.28, S * 0.6, white); col(ctx, x - S * 0.1, y - S * 0.6, S * 0.2, S * 0.4, white); var fg = ctx.createRadialGradient(x, y - S * 1.08, 0, x, y - S * 1.08, S * 0.25); fg.addColorStop(0, 'rgba(255,230,120,1)'); fg.addColorStop(1, 'rgba(255,140,30,0)'); ctx.fillStyle = fg; ctx.beginPath(); ctx.arc(x, y - S * 1.08, S * 0.25, 0, Math.PI * 2); ctx.fill(); break;
      case 'great_wall': for (k = 0; k < 6; k++) { col(ctx, x - S * 0.6 + k * S * 0.2, y - k * S * 0.03, S * 0.2, S * 0.22, '#9a9080'); ctx.fillStyle = '#6a6458'; ctx.fillRect(x - S * 0.6 + k * S * 0.2, y - k * S * 0.03 - S * 0.27, S * 0.08, S * 0.05); } col(ctx, x - S * 0.1, y - S * 0.1, S * 0.2, S * 0.42, '#a89e8c'); GF.poly(ctx, [x - S * 0.14, y - S * 0.52, x + S * 0.14, y - S * 0.52, x, y - S * 0.66], '#7a3a2a'); break;
      case 'parthenon': case 'temple_of_artemis': case 'great_library': case 'oracle': case 'brandenburg_gate': case 'uffizi': case 'louvre': case 'globe_theatre': case 'mausoleum':
        col(ctx, x - S * 0.45, y, S * 0.9, S * 0.08, stone);
        for (k = 0; k < 6; k++) col(ctx, x - S * 0.4 + k * S * 0.15, y - S * 0.08, S * 0.07, S * 0.4, white);
        col(ctx, x - S * 0.45, y - S * 0.48, S * 0.9, S * 0.07, stone);
        if (id === 'brandenburg_gate') { col(ctx, x - S * 0.3, y - S * 0.55, S * 0.6, S * 0.1, stone); GF.blob(ctx, x, y - S * 0.7, S * 0.1, S * 0.07, '#5a8a6a', 0.3); }
        else if (id === 'louvre') { tri(ctx, x, y - S * 0.55, S * 0.5, S * 0.35, 'rgba(160,210,240,0.9)', 'rgba(100,150,190,0.9)'); }
        else if (id === 'mausoleum') { tri(ctx, x, y - S * 0.55, S * 0.7, S * 0.4, '#d8ccb0', '#a89a80'); }
        else GF.poly(ctx, [x - S * 0.5, y - S * 0.55, x + S * 0.5, y - S * 0.55, x, y - S * 0.8], stone);
        if (id === 'oracle') { ctx.fillStyle = 'rgba(200,200,220,0.5)'; ctx.beginPath(); ctx.arc(x, y - S * 1.0, S * 0.12, 0, Math.PI * 2); ctx.arc(x + S * 0.1, y - S * 1.15, S * 0.09, 0, Math.PI * 2); ctx.fill(); }
        break;
      case 'hanging_gardens': for (k = 0; k < 4; k++) { col(ctx, x - S * (0.45 - k * 0.09), y - k * S * 0.15, S * (0.9 - k * 0.18), S * 0.15, '#c8a878'); for (var j = 0; j < 4 - k; j++) GF.blob(ctx, x - S * (0.35 - k * 0.09) + j * S * 0.22, y - k * S * 0.15 - S * 0.16, S * 0.07, S * 0.05, '#3a8a2a', 0.4); } break;
      case 'colosseum_flavian': GF.blob(ctx, x, y - S * 0.2, S * 0.5, S * 0.25, '#d8c8a8', 0.3); ctx.fillStyle = 'rgba(80,60,40,0.6)'; for (k = 0; k < 7; k++) { ctx.fillRect(x - S * 0.42 + k * S * 0.12, y - S * 0.3, S * 0.06, S * 0.08); ctx.fillRect(x - S * 0.42 + k * S * 0.12, y - S * 0.16, S * 0.06, S * 0.08); } break;
      case 'petra': GF.poly(ctx, [x - S * 0.55, y, x - S * 0.5, y - S * 0.85, x + S * 0.5, y - S * 0.9, x + S * 0.55, y], '#c07a58'); for (k = 0; k < 4; k++) col(ctx, x - S * 0.25 + k * S * 0.15, y, S * 0.06, S * 0.45, '#e0a07a'); GF.poly(ctx, [x - S * 0.3, y - S * 0.45, x + S * 0.3, y - S * 0.45, x, y - S * 0.62], '#e0a07a'); break;
      case 'angkor_wat': case 'borobudur': for (k = -1; k <= 1; k++) { var hh = k === 0 ? S * 0.85 : S * 0.6; GF.poly(ctx, [x + k * S * 0.32 - S * 0.12, y, x + k * S * 0.32 - S * 0.06, y - hh, x + k * S * 0.32 + S * 0.06, y - hh, x + k * S * 0.32 + S * 0.12, y], id === 'borobudur' ? '#8a8a7a' : '#a89470'); GF.blob(ctx, x + k * S * 0.32, y - hh, S * 0.07, S * 0.1, id === 'borobudur' ? '#8a8a7a' : '#a89470', 0.3); } col(ctx, x - S * 0.5, y, S, S * 0.15, '#9a8a6a'); break;
      case 'hagia_sophia': case 'taj_mahal': case 'great_mosque': case 'alhambra': {
        var wc = id === 'taj_mahal' ? '#f6f2ea' : id === 'alhambra' ? '#c87850' : id === 'great_mosque' ? '#b88a5a' : '#d8c8b0';
        col(ctx, x - S * 0.35, y, S * 0.7, S * 0.35, wc); dome(ctx, x, y - S * 0.35, S * 0.25, id === 'hagia_sophia' ? '#8a9aaa' : wc);
        [-0.45, 0.45].forEach(function (k2) { minaret(ctx, x + k2 * S, y, S * 0.85, wc); });
        GF.poly(ctx, [x - S * 0.02, y - S * 0.6, x, y - S * 0.72, x + S * 0.02, y - S * 0.6], gold); break;
      }
      case 'notre_dame': case 'sistine_chapel': case 'neuschwanstein': case 'kremlin': case 'leaning_tower': case 'big_ben': {
        if (id === 'leaning_tower') { ctx.save(); ctx.translate(x, y); ctx.rotate(0.12); for (k = 0; k < 6; k++) { col(ctx, -S * 0.13, -k * S * 0.15, S * 0.26, S * 0.15, white); ctx.fillStyle = 'rgba(80,70,60,0.5)'; for (j = 0; j < 3; j++) ctx.fillRect(-S * 0.1 + j * S * 0.08, -k * S * 0.15 - S * 0.11, S * 0.03, S * 0.07); } ctx.restore(); break; }
        if (id === 'big_ben') { col(ctx, x - S * 0.12, y, S * 0.24, S * 1.1, '#b8a070'); ctx.fillStyle = '#f2ecd8'; ctx.beginPath(); ctx.arc(x, y - S * 0.85, S * 0.09, 0, Math.PI * 2); ctx.fill(); GF.poly(ctx, [x - S * 0.14, y - S * 1.1, x + S * 0.14, y - S * 1.1, x, y - S * 1.45], '#3a4a3a'); col(ctx, x - S * 0.5, y, S * 0.36, S * 0.3, '#b8a070'); break; }
        if (id === 'kremlin') { col(ctx, x - S * 0.5, y, S, S * 0.2, '#b83a2a'); [-0.3, 0, 0.3].forEach(function (k2, i) { col(ctx, x + k2 * S - S * 0.07, y - S * 0.2, S * 0.14, S * (0.3 + i % 2 * 0.15), '#f0e8d8'); GF.blob(ctx, x + k2 * S, y - S * (0.55 + i % 2 * 0.15), S * 0.1, S * 0.12, ['#3a7a3a', '#d8a830', '#3a5aa0'][i], 0.4); }); break; }
        var wc2 = id === 'neuschwanstein' ? '#f2eee6' : '#b8b0a0', rc = id === 'neuschwanstein' ? '#3a5a8a' : '#5a5a60';
        col(ctx, x - S * 0.3, y, S * 0.6, S * 0.4, wc2); GF.poly(ctx, [x - S * 0.34, y - S * 0.4, x + S * 0.34, y - S * 0.4, x, y - S * 0.62], rc);
        [-0.3, 0.3].forEach(function (k2) { col(ctx, x + k2 * S - S * 0.08, y, S * 0.16, S * 0.8, wc2); GF.poly(ctx, [x + k2 * S - S * 0.1, y - S * 0.8, x + k2 * S + S * 0.1, y - S * 0.8, x + k2 * S, y - S * 1.15], rc); });
        if (id === 'notre_dame') { ctx.fillStyle = '#6a5aa0'; ctx.beginPath(); ctx.arc(x, y - S * 0.25, S * 0.07, 0, Math.PI * 2); ctx.fill(); }
        break;
      }
      case 'forbidden_palace': case 'porcelain_tower': case 'himeji_castle': pagoda(ctx, x, y, S, id === 'porcelain_tower' ? 6 : 3, id === 'himeji_castle' ? '#f2eee6' : id === 'porcelain_tower' ? '#f2f2f6' : '#b83a2a', id === 'forbidden_palace' ? '#d8a830' : '#3a4a5a'); break;
      case 'eiffel_tower': ctx.strokeStyle = '#6a5a4a'; ctx.lineWidth = Math.max(1, S * 0.035); ctx.beginPath(); ctx.moveTo(x - S * 0.35, y); ctx.quadraticCurveTo(x - S * 0.08, y - S * 0.6, x, y - S * 1.5); ctx.quadraticCurveTo(x + S * 0.08, y - S * 0.6, x + S * 0.35, y); ctx.stroke(); ctx.lineWidth = Math.max(0.6, S * 0.015); for (k = 1; k < 8; k++) { var yy = y - k * S * 0.17, ww = S * 0.35 * Math.pow(1 - k / 9, 1.6); ctx.beginPath(); ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww, yy); ctx.moveTo(x - ww, yy); ctx.lineTo(x + ww * 0.6, yy - S * 0.17); ctx.stroke(); } ctx.beginPath(); ctx.arc(x, y - S * 0.15, S * 0.15, Math.PI, 0); ctx.stroke(); break;
      case 'sydney_opera': for (k = 0; k < 4; k++) { GF.poly(ctx, [x - S * 0.45 + k * S * 0.22, y - S * 0.1, x - S * 0.25 + k * S * 0.22, y - S * (0.55 - k * 0.06), x - S * 0.12 + k * S * 0.22, y - S * 0.1], k % 2 ? '#f6f6f2' : '#dcdcd6'); } col(ctx, x - S * 0.5, y, S, S * 0.1, '#c8b090'); break;
      case 'pentagon': GF.poly(ctx, [x - S * 0.45, y - S * 0.1, x - S * 0.25, y - S * 0.35, x + S * 0.25, y - S * 0.35, x + S * 0.45, y - S * 0.1, x, y + S * 0.02], '#c8c8c0'); GF.poly(ctx, [x - S * 0.2, y - S * 0.15, x - S * 0.1, y - S * 0.27, x + S * 0.1, y - S * 0.27, x + S * 0.2, y - S * 0.15, x, y - S * 0.1], '#7a8a6a'); break;
      case 'hubble': case 'internet_hub': case 'great_firewall': col(ctx, x - S * 0.3, y, S * 0.6, S * 0.3, '#c8ccd2'); GF.blob(ctx, x, y - S * 0.6, S * 0.28, S * 0.12, '#e8ecf2', 0.4); ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = S * 0.03; ctx.beginPath(); ctx.moveTo(x, y - S * 0.3); ctx.lineTo(x, y - S * 0.55); ctx.stroke(); if (id === 'great_firewall') { ctx.fillStyle = '#d82a2a'; ctx.fillRect(x - S * 0.3, y - S * 0.32, S * 0.6, S * 0.04); } break;
      case 'united_nations': col(ctx, x - S * 0.15, y, S * 0.3, S * 1.0, '#8ab0c8'); ctx.fillStyle = 'rgba(255,255,255,0.4)'; for (k = 0; k < 10; k++) ctx.fillRect(x - S * 0.13, y - S * 0.1 - k * S * 0.09, S * 0.26, S * 0.02); ctx.fillStyle = '#4a8ad0'; ctx.fillRect(x + S * 0.2, y - S * 0.6, S * 0.2, S * 0.12); break;
      case 'machu_picchu': for (k = 0; k < 4; k++) { col(ctx, x - S * 0.5 + k * S * 0.05, y - k * S * 0.12, S * (1 - k * 0.1), S * 0.12, '#8a8270'); GF.poly(ctx, [x - S * 0.5 + k * S * 0.05, y - k * S * 0.12 - S * 0.12, x + S * (0.5 - k * 0.05), y - k * S * 0.12 - S * 0.12, x + S * 0.4, y - k * S * 0.12 - S * 0.15, x - S * 0.4, y - k * S * 0.12 - S * 0.15], '#5a9a3a'); } GF.peak(ctx, x + S * 0.2, y - S * 0.4, S * 0.25, S * 0.5, S, GF.rng(5), { snow: 0, rock: '#5a6a4a' }); break;
      case 'broadway': case 'prora': col(ctx, x - S * 0.45, y, S * 0.9, S * 0.35, id === 'prora' ? '#e8e4dc' : '#7a2a4a'); if (id === 'broadway') { ctx.fillStyle = '#ffe680'; for (k = 0; k < 8; k++) { ctx.beginPath(); ctx.arc(x - S * 0.4 + k * S * 0.11, y - S * 0.3, S * 0.025, 0, Math.PI * 2); ctx.fill(); } } break;
      case 'red_fort': for (k = 0; k < 6; k++) col(ctx, x - S * 0.55 + k * S * 0.2, y, S * 0.16, S * (k % 2 ? 0.28 : 0.38), '#b84a30'); dome(ctx, x - S * 0.15, y - S * 0.38, S * 0.1, '#f2eee6'); dome(ctx, x + S * 0.25, y - S * 0.38, S * 0.1, '#f2eee6'); break;
      case 'panama_canal': ctx.fillStyle = '#3a8ac0'; ctx.fillRect(x - S * 0.5, y - S * 0.15, S, S * 0.12); col(ctx, x - S * 0.5, y - S * 0.15, S * 0.08, S * 0.2, '#8a8a8a'); col(ctx, x + S * 0.42, y - S * 0.15, S * 0.08, S * 0.2, '#8a8a8a'); break;
      case 'terracotta_army': for (k = 0; k < 3; k++) for (j = 0; j < 5; j++) { var tx = x - S * 0.4 + j * S * 0.2 + k * S * 0.04, ty = y - S * 0.05 - k * S * 0.12; col(ctx, tx - S * 0.03, ty, S * 0.06, S * 0.16, '#a87a58'); GF.blob(ctx, tx, ty - S * 0.19, S * 0.035, S * 0.04, '#b88a68', 0.3); } break;
      case 'apollo_program': col(ctx, x - S * 0.08, y, S * 0.16, S * 1.1, '#f2f2f2'); ctx.fillStyle = '#222'; ctx.fillRect(x - S * 0.08, y - S * 0.5, S * 0.16, S * 0.05); ctx.fillRect(x - S * 0.08, y - S * 0.85, S * 0.16, S * 0.04); GF.poly(ctx, [x - S * 0.08, y - S * 1.1, x + S * 0.08, y - S * 1.1, x, y - S * 1.35], '#e8e8e8'); GF.poly(ctx, [x - S * 0.08, y - S * 0.15, x - S * 0.2, y, x - S * 0.08, y], '#c8c8c8'); GF.poly(ctx, [x + S * 0.08, y - S * 0.15, x + S * 0.2, y, x + S * 0.08, y], '#c8c8c8'); break;
      case 'manhattan_project': col(ctx, x - S * 0.35, y, S * 0.7, S * 0.25, '#8a8a80'); dome(ctx, x - S * 0.1, y - S * 0.25, S * 0.2, '#b8b8b0'); col(ctx, x + S * 0.18, y, S * 0.12, S * 0.7, '#7a7a72'); ctx.fillStyle = 'rgba(220,220,220,0.6)'; ctx.beginPath(); ctx.arc(x + S * 0.24, y - S * 0.85, S * 0.1, 0, Math.PI * 2); ctx.arc(x + S * 0.32, y - S * 1.0, S * 0.13, 0, Math.PI * 2); ctx.fill(); break;
      case 'utopia_project': col(ctx, x - S * 0.3, y, S * 0.6, S * 0.12, '#e8ecf2'); var ug = ctx.createRadialGradient(x, y - S * 0.6, 0, x, y - S * 0.6, S * 0.45); ug.addColorStop(0, 'rgba(255,255,255,0.95)'); ug.addColorStop(0.4, 'rgba(140,220,255,0.7)'); ug.addColorStop(1, 'rgba(140,220,255,0)'); ctx.fillStyle = ug; ctx.beginPath(); ctx.arc(x, y - S * 0.6, S * 0.45, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#d8a830'; ctx.lineWidth = S * 0.04; ctx.beginPath(); ctx.ellipse(x, y - S * 0.6, S * 0.35, S * 0.12, 0, 0, Math.PI * 2); ctx.stroke(); col(ctx, x - S * 0.04, y - S * 0.12, S * 0.08, S * 0.4, '#e8ecf2'); break;
      default: col(ctx, x - S * 0.08, y, S * 0.16, S * 0.8, gold); GF.poly(ctx, [x - S * 0.08, y - S * 0.8, x + S * 0.08, y - S * 0.8, x, y - S * 0.98], gold); col(ctx, x - S * 0.22, y, S * 0.44, S * 0.08, stone);
    }
    GF.noShadow(ctx);
    return { c: c, ax: x, ay: y };
  };

  // ---- distinct Great People ----
  var baseUnit = GF.unit;
  var GP = { great_scientist: ['#2a4a8a', 'book', '#e8e8f0'], great_engineer: ['#7a5a3a', 'pick', '#d8b040'], great_merchant: ['#8a6a1a', 'bag', '#f2d050'], great_artist: ['#8a2a6a', 'palette', '#f2e6c0'],
    great_writer: ['#3a5a3a', 'quill', '#f2ecd8'], great_musician: ['#5a2a2a', 'lute', '#d8a050'], great_prophet: ['#e8e4da', 'staff', '#d8a830'] };
  GF.unit = function (S, id, col1, col2) {
    var g = GP[id];
    if (!g) return baseUnit(S, id, col1, col2);
    var w = S * 2.0, h = S * 2.1, c = GF.mk(w, h), ctx = c.getContext('2d'), x = w / 2, y = h * 0.86, H = S * 0.95, r = GF.rng(GF.hash(id));
    ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.55, S * 0.22, 0, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = col1; ctx.lineWidth = S * 0.08; ctx.beginPath(); ctx.ellipse(x, y, S * 0.48, S * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
    var f = GF.mk(w, h), fx = f.getContext('2d');
    GF.soldier(fx, x, y, H, g[0], col1, 2, g[1] === 'pick' ? 'pick' : g[1] === 'staff' ? 'staff' : g[1] === 'book' ? 'book' : null, r, { robe: true, halo: true });
    var hx = x + H * 0.2, hy = y - H * 0.5;
    if (g[1] === 'bag') GF.blob(fx, hx, hy, H * 0.09, H * 0.1, '#c8a040', 0.4);
    if (g[1] === 'palette') { GF.blob(fx, hx, hy, H * 0.13, H * 0.09, '#d8b888', 0.3); ['#d83a2a', '#2a6ad8', '#e8c02a', '#2a9a3a'].forEach(function (cc, i) { fx.fillStyle = cc; fx.beginPath(); fx.arc(hx - H * 0.06 + i * H * 0.04, hy - H * 0.02, H * 0.018, 0, Math.PI * 2); fx.fill(); }); }
    if (g[1] === 'quill') { fx.fillStyle = '#f2ecd8'; fx.fillRect(hx - H * 0.08, hy - H * 0.05, H * 0.16, H * 0.12); fx.strokeStyle = '#eee'; fx.lineWidth = H * 0.03; fx.beginPath(); fx.moveTo(hx + H * 0.05, hy); fx.lineTo(hx + H * 0.18, hy - H * 0.25); fx.stroke(); }
    if (g[1] === 'lute') { GF.blob(fx, hx, hy + H * 0.02, H * 0.1, H * 0.12, '#a0602a', 0.4); fx.strokeStyle = '#6a3a1a'; fx.lineWidth = H * 0.03; fx.beginPath(); fx.moveTo(hx, hy - H * 0.08); fx.lineTo(hx + H * 0.08, hy - H * 0.35); fx.stroke(); }
    if (id === 'great_scientist') { fx.fillStyle = 'rgba(120,220,160,0.85)'; fx.beginPath(); fx.arc(x - H * 0.25, y - H * 0.45, H * 0.06, 0, Math.PI * 2); fx.fill(); }
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = Math.max(1, S * 0.05); ctx.drawImage(f, 0, 0); ctx.restore(); ctx.drawImage(f, 0, 0);
    return { c: c, ax: x, ay: y };
  };
})(G.GFX);
