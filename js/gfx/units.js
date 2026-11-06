// ============================================================
//  Units: squads of soldiers (Civ V style), era-specific armour,
//  helmets, shields in team colours, anatomical horses, war
//  machines, ships with sails and flags, aircraft. Team ring + pennant.
// ============================================================
(function (GF) {
  var D = G.D;
  function kindOf(id, d) {
    var name = d.name.toLowerCase();
    if (d.domain === 'air') return d.cls === 'nuke' ? 'missile' : (/bomber/.test(name) ? 'bomber' : 'plane');
    if (d.domain === 'sea') {
      if (/work boat/.test(name)) return 'boat'; if (/cargo/.test(name)) return 'freighter';
      if (/trireme|galley|galleass|bireme|longship/.test(name)) return 'galley';
      if (/caravel|frigate|privateer|ship of the line|nau|sea beggar/.test(name)) return 'sailship';
      if (/submarine/.test(name)) return 'sub'; if (/carrier/.test(name)) return 'carrier'; if (/ironclad/.test(name)) return 'ironclad';
      if (/admiral/.test(name)) return 'sailship';
      return 'warship';
    }
    if (d.cls === 'gp') return 'gp';
    if (id === 'settler') return 'settler'; if (id === 'worker') return 'worker'; if (id === 'caravan') return 'caravan';
    if (id === 'missionary' || id === 'inquisitor') return 'robed';
    if (/elephant|domrey|voi chi|naresuan/.test(name)) return 'elephant';
    if (/robot/.test(name)) return 'robot'; if (/helicopter/.test(name)) return 'heli';
    if (d.cls === 'armor') return 'tank';
    if (/chariot|war cart/.test(name)) return 'chariot';
    if (d.cls === 'mounted' || /camel|keshik|horse archer/.test(name)) return 'rider';
    if (d.cls === 'siege') { if (/rocket/.test(name)) return 'rocket'; if (/cannon|artillery/.test(name)) return 'cannon'; if (/tower/.test(name)) return 'tower'; return 'catapult'; }
    if (/gatling|machine gun|bazooka|anti-tank|anti-aircraft|sam/.test(name)) return 'gunteam';
    if (d.cls === 'ranged') return /crossbow|chu-ko|hwacha/.test(name) ? 'xbow' : 'archer';
    if (d.cls === 'gun') return 'rifle';
    if (d.cls === 'recon') return 'scout';
    if (/spear|pike|hoplite|immortal|impi|maori|landsknecht|aksumite|tercio/.test(name)) return 'spear';
    if (/warrior|jaguar|pictish/.test(name)) return 'club';
    return 'sword';
  }
  GF.unitKind = kindOf;
  function eraOf(d) { var t = d.tech ? D.TECHS[d.tech] : null; return t ? t.era : 0; }
  var SKIN = ['#e8c09a', '#c89870', '#9a6a44', '#704a2c', '#f0cfa8'];

  // ---------- soldier ----------
  function soldier(ctx, x, y, H, col, col2, era, weapon, r, opts) {
    opts = opts || {};
    if (GF.drawHuman) {
      var humanSkin = SKIN[Math.floor(r() * SKIN.length)];
      GF.drawHuman(ctx, x, y, H * 1.08, {
        era: Math.min(6, era), mainColor: col, accentColor: col2, skin: humanSkin, weapon: weapon === 'bow' ? 'bow' : weapon,
        shield: !!opts.shield, helmet: opts.helmet !== false, hat: opts.hat, civilian: !!opts.civilian, robe: !!opts.robe,
        pose: (weapon === 'pick') ? 'work' : 'stand', facing: 1, random: r
      });
      if (opts.halo) { ctx.strokeStyle = '#ffe070'; ctx.lineWidth = H * 0.03; ctx.beginPath(); ctx.ellipse(x, y - H * 1.0, H * 0.13, H * 0.035, 0, 0, Math.PI * 2); ctx.stroke(); }
      return;
    }
    var skin = SKIN[Math.floor(r() * SKIN.length)];
    var bw = H * 0.26;
    var modern = era >= 5, gunEra = era >= 3;
    var uni = modern ? GF.shade('#5a6640', (r() - 0.5) * 0.1) : era >= 4 ? GF.shade(col, -0.25) : col;
    // feet shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, bw * 0.9, bw * 0.28, 0, 0, Math.PI * 2); ctx.fill();
    // legs with stride
    var leg = era === 0 ? skin : modern ? '#4a5434' : era >= 3 ? '#e8e0d0' : '#5a4632';
    if (era === 4) leg = '#2a3048';
    ctx.strokeStyle = leg; ctx.lineWidth = bw * 0.36; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - bw * 0.2, y - H * 0.34); ctx.lineTo(x - bw * 0.38, y - H * 0.03); ctx.moveTo(x + bw * 0.2, y - H * 0.34); ctx.lineTo(x + bw * 0.3, y - H * 0.03); ctx.stroke();
    ctx.fillStyle = '#2a1c10'; ctx.fillRect(x - bw * 0.58, y - H * 0.05, bw * 0.4, H * 0.05); ctx.fillRect(x + bw * 0.12, y - H * 0.05, bw * 0.4, H * 0.05);
    // torso
    var tg = ctx.createLinearGradient(x - bw * 0.6, 0, x + bw * 0.6, 0);
    tg.addColorStop(0, GF.shade(uni, 0.28)); tg.addColorStop(0.55, GF.css(GF.rgb(uni))); tg.addColorStop(1, GF.shade(uni, -0.4));
    ctx.fillStyle = tg;
    if (opts.robe) { GF.poly(ctx, [x - bw * 0.75, y - H * 0.02, x - bw * 0.48, y - H * 0.7, x + bw * 0.48, y - H * 0.7, x + bw * 0.75, y - H * 0.02], tg); }
    else { ctx.beginPath(); ctx.moveTo(x - bw * 0.55, y - H * 0.7); ctx.lineTo(x + bw * 0.55, y - H * 0.7); ctx.lineTo(x + bw * 0.6, y - H * 0.32); ctx.lineTo(x - bw * 0.6, y - H * 0.32); ctx.closePath(); ctx.fill(); }
    // armour by era
    if (!opts.robe && !opts.civilian) {
      if (era === 1) { ctx.fillStyle = 'rgba(205,160,70,0.85)'; ctx.fillRect(x - bw * 0.45, y - H * 0.68, bw * 0.9, H * 0.22); }
      if (era === 2) { ctx.fillStyle = 'rgba(170,175,185,0.8)'; ctx.fillRect(x - bw * 0.5, y - H * 0.69, bw * 1.0, H * 0.3); ctx.fillStyle = col; ctx.fillRect(x - bw * 0.18, y - H * 0.69, bw * 0.36, H * 0.3); }
      if (era === 3) { ctx.fillStyle = 'rgba(200,205,215,0.75)'; ctx.beginPath(); ctx.ellipse(x, y - H * 0.55, bw * 0.45, H * 0.13, 0, 0, Math.PI * 2); ctx.fill(); }
      if (era >= 4) { ctx.strokeStyle = era >= 5 ? '#3a3020' : '#f0e8d8'; ctx.lineWidth = bw * 0.12; ctx.beginPath(); ctx.moveTo(x - bw * 0.5, y - H * 0.7); ctx.lineTo(x + bw * 0.5, y - H * 0.36); ctx.moveTo(x + bw * 0.5, y - H * 0.7); ctx.lineTo(x - bw * 0.5, y - H * 0.36); ctx.stroke(); }
      if (modern) { ctx.fillStyle = col; ctx.fillRect(x - bw * 0.6, y - H * 0.64, bw * 0.22, H * 0.06); }
      ctx.fillStyle = era >= 4 ? '#2a2a2a' : '#4a3020'; ctx.fillRect(x - bw * 0.6, y - H * 0.37, bw * 1.2, H * 0.05);
    }
    // head
    var hy = y - H * 0.81;
    GF.blob(ctx, x, hy, H * 0.105, H * 0.11, skin, 0.25);
    // headgear by era
    if (!opts.civilian && !opts.robe && opts.helmet !== false) {
      if (era === 0) { ctx.fillStyle = '#6a4a2a'; ctx.beginPath(); ctx.arc(x, hy - H * 0.02, H * 0.11, Math.PI, 0); ctx.fill(); ctx.fillStyle = col2; ctx.fillRect(x - H * 0.01, hy - H * 0.2, H * 0.03, H * 0.08); }
      else if (era === 1) { GF.blob(ctx, x, hy - H * 0.04, H * 0.12, H * 0.1, '#c9a24a', 0.4); ctx.fillStyle = col; ctx.beginPath(); ctx.ellipse(x, hy - H * 0.15, H * 0.12, H * 0.035, 0, Math.PI, 0); ctx.fill(); ctx.fillRect(x - H * 0.12, hy - H * 0.16, H * 0.24, H * 0.035); }
      else if (era === 2) { GF.blob(ctx, x, hy - H * 0.03, H * 0.125, H * 0.11, '#a8aab2', 0.45); ctx.fillStyle = '#5a5a60'; ctx.fillRect(x - H * 0.02, hy - H * 0.04, H * 0.04, H * 0.1); }
      else if (era === 3) { ctx.fillStyle = '#1e1e22'; GF.poly(ctx, [x - H * 0.18, hy - H * 0.06, x + H * 0.18, hy - H * 0.06, x + H * 0.08, hy - H * 0.17, x - H * 0.08, hy - H * 0.17], '#1e1e22'); ctx.fillStyle = col2; ctx.fillRect(x - H * 0.1, hy - H * 0.09, H * 0.2, H * 0.025); }
      else if (era === 4) { ctx.fillStyle = '#20263a'; ctx.fillRect(x - H * 0.1, hy - H * 0.2, H * 0.2, H * 0.13); ctx.fillStyle = '#111'; ctx.fillRect(x - H * 0.13, hy - H * 0.08, H * 0.26, H * 0.03); ctx.fillStyle = '#d8b040'; ctx.beginPath(); ctx.arc(x, hy - H * 0.14, H * 0.025, 0, Math.PI * 2); ctx.fill(); }
      else { GF.blob(ctx, x, hy - H * 0.04, H * 0.135, H * 0.1, '#4a5432', 0.3); ctx.fillStyle = '#3a4228'; ctx.fillRect(x - H * 0.15, hy - H * 0.02, H * 0.3, H * 0.025); }
    }
    if (opts.hat) { ctx.fillStyle = opts.hat; ctx.beginPath(); ctx.ellipse(x, hy - H * 0.06, H * 0.17, H * 0.04, 0, 0, Math.PI * 2); ctx.fill(); ctx.fillRect(x - H * 0.08, hy - H * 0.17, H * 0.16, H * 0.11); }
    if (opts.halo) { ctx.strokeStyle = '#ffe070'; ctx.lineWidth = H * 0.03; ctx.beginPath(); ctx.ellipse(x, hy - H * 0.18, H * 0.13, H * 0.035, 0, 0, Math.PI * 2); ctx.stroke(); }
    // arms & weapon
    var hx = x + bw * 0.62, hyy = y - H * 0.5;
    ctx.strokeStyle = GF.shade(uni, -0.15); ctx.lineWidth = bw * 0.28;
    ctx.beginPath(); ctx.moveTo(x + bw * 0.45, y - H * 0.66); ctx.lineTo(hx, hyy); ctx.stroke();
    var wood = '#7a5230', steel = '#cfd2d8';
    ctx.lineCap = 'round';
    switch (weapon) {
      case 'club': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.05; ctx.beginPath(); ctx.moveTo(hx, hyy + H * 0.05); ctx.lineTo(hx + H * 0.14, hyy - H * 0.32); ctx.stroke(); GF.blob(ctx, hx + H * 0.15, hyy - H * 0.35, H * 0.06, H * 0.06, wood, 0.3); break;
      case 'sword': ctx.strokeStyle = steel; ctx.lineWidth = H * 0.045; ctx.beginPath(); ctx.moveTo(hx, hyy); ctx.lineTo(hx + H * 0.1, hyy - H * 0.42); ctx.stroke(); ctx.strokeStyle = '#8a6a2a'; ctx.lineWidth = H * 0.03; ctx.beginPath(); ctx.moveTo(hx - H * 0.05, hyy - H * 0.03); ctx.lineTo(hx + H * 0.06, hyy - H * 0.01); ctx.stroke(); break;
      case 'spear': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.035; ctx.beginPath(); ctx.moveTo(hx - H * 0.02, y - H * 0.05); ctx.lineTo(hx + H * 0.06, y - H * (era >= 2 ? 1.45 : 1.2)); ctx.stroke(); GF.poly(ctx, [hx + H * 0.04, y - H * (era >= 2 ? 1.42 : 1.17), hx + H * 0.065, y - H * (era >= 2 ? 1.58 : 1.33), hx + H * 0.09, y - H * (era >= 2 ? 1.42 : 1.17)], steel); break;
      case 'bow': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.04; ctx.beginPath(); ctx.arc(hx - H * 0.02, hyy - H * 0.08, H * 0.3, -Math.PI * 0.42, Math.PI * 0.42); ctx.stroke(); ctx.strokeStyle = 'rgba(255,255,255,0.8)'; ctx.lineWidth = Math.max(0.5, H * 0.01); ctx.beginPath(); ctx.moveTo(hx + H * 0.05, hyy - H * 0.37); ctx.lineTo(hx + H * 0.05, hyy + H * 0.21); ctx.stroke(); break;
      case 'xbow': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.05; ctx.beginPath(); ctx.moveTo(hx - H * 0.15, hyy + H * 0.02); ctx.lineTo(hx + H * 0.2, hyy - H * 0.06); ctx.stroke(); ctx.strokeStyle = '#555'; ctx.lineWidth = H * 0.03; ctx.beginPath(); ctx.moveTo(hx + H * 0.12, hyy - H * 0.2); ctx.quadraticCurveTo(hx + H * 0.22, hyy - H * 0.05, hx + H * 0.12, hyy + H * 0.1); ctx.stroke(); break;
      case 'gun': ctx.strokeStyle = era >= 5 ? '#1a1a1a' : '#3a2a1a'; ctx.lineWidth = H * 0.045; ctx.beginPath(); ctx.moveTo(hx - H * 0.08, hyy + H * 0.08); ctx.lineTo(hx + H * 0.18, hyy - H * 0.5); ctx.stroke(); ctx.strokeStyle = '#888'; ctx.lineWidth = H * 0.02; ctx.beginPath(); ctx.moveTo(hx + H * 0.1, hyy - H * 0.32); ctx.lineTo(hx + H * 0.2, hyy - H * 0.56); ctx.stroke(); if (era === 3 || era === 4) { ctx.strokeStyle = steel; ctx.beginPath(); ctx.moveTo(hx + H * 0.19, hyy - H * 0.54); ctx.lineTo(hx + H * 0.23, hyy - H * 0.68); ctx.stroke(); } break;
      case 'staff': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.035; ctx.beginPath(); ctx.moveTo(hx, y - H * 0.02); ctx.lineTo(hx + H * 0.04, y - H * 1.0); ctx.stroke(); break;
      case 'pick': ctx.strokeStyle = wood; ctx.lineWidth = H * 0.04; ctx.beginPath(); ctx.moveTo(hx - H * 0.05, hyy + H * 0.12); ctx.lineTo(hx + H * 0.15, hyy - H * 0.3); ctx.stroke(); ctx.strokeStyle = '#9a9a9a'; ctx.lineWidth = H * 0.04; ctx.beginPath(); ctx.moveTo(hx + H * 0.02, hyy - H * 0.36); ctx.quadraticCurveTo(hx + H * 0.16, hyy - H * 0.36, hx + H * 0.3, hyy - H * 0.24); ctx.stroke(); break;
      case 'book': ctx.fillStyle = '#6a2a1a'; ctx.fillRect(hx - H * 0.04, hyy - H * 0.06, H * 0.14, H * 0.18); ctx.fillStyle = '#f2e6c0'; ctx.fillRect(hx - H * 0.02, hyy - H * 0.04, H * 0.1, H * 0.14); break;
    }
    // shield
    if (opts.shield) {
      var sx = x - bw * 0.7, sy = y - H * 0.5;
      ctx.save();
      if (era <= 0) { GF.blob(ctx, sx, sy, H * 0.15, H * 0.16, col, 0.35); }
      else if (era === 1) { var sg = ctx.createLinearGradient(sx - H * 0.12, 0, sx + H * 0.12, 0); sg.addColorStop(0, GF.shade(col, 0.3)); sg.addColorStop(1, GF.shade(col, -0.35)); ctx.fillStyle = sg; ctx.beginPath(); ctx.ellipse(sx, sy, H * 0.12, H * 0.22, 0, 0, Math.PI * 2); ctx.fill(); }
      else { var kg = ctx.createLinearGradient(sx - H * 0.12, 0, sx + H * 0.12, 0); kg.addColorStop(0, GF.shade(col, 0.3)); kg.addColorStop(1, GF.shade(col, -0.35)); GF.poly(ctx, [sx - H * 0.13, sy - H * 0.18, sx + H * 0.13, sy - H * 0.18, sx + H * 0.12, sy + H * 0.02, sx, sy + H * 0.2, sx - H * 0.12, sy + H * 0.02], kg); }
      ctx.fillStyle = col2; ctx.fillRect(sx - H * 0.02, sy - H * 0.15, H * 0.04, H * 0.3); ctx.fillRect(sx - H * 0.1, sy - H * 0.02, H * 0.2, H * 0.04);
      ctx.strokeStyle = 'rgba(0,0,0,0.5)'; ctx.lineWidth = Math.max(0.5, H * 0.015); ctx.stroke();
      ctx.restore();
    }
  }
  GF.soldier = soldier;

  function horse(ctx, x, y, H, coat, opts) {
    opts = opts || {};
    var L = H * 0.42;
    ctx.fillStyle = 'rgba(0,0,0,0.3)'; ctx.beginPath(); ctx.ellipse(x, y, H * 0.48, H * 0.11, 0, 0, Math.PI * 2); ctx.fill();
    var dark = GF.shade(coat, -0.35);
    // far legs
    ctx.strokeStyle = dark; ctx.lineWidth = H * 0.065; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - H * 0.22, y - L); ctx.lineTo(x - H * 0.3, y - L * 0.45); ctx.lineTo(x - H * 0.26, y - H * 0.02); ctx.moveTo(x + H * 0.2, y - L); ctx.lineTo(x + H * 0.3, y - L * 0.5); ctx.lineTo(x + H * 0.34, y - H * 0.02); ctx.stroke();
    // body
    GF.blob(ctx, x, y - L - H * 0.04, H * 0.36, H * 0.15, coat, 0.3);
    // neck & head
    var ng = ctx.createLinearGradient(x + H * 0.2, y - H * 0.9, x + H * 0.45, y - H * 0.5); ng.addColorStop(0, GF.shade(coat, 0.2)); ng.addColorStop(1, dark);
    GF.poly(ctx, [x + H * 0.18, y - L - H * 0.12, x + H * 0.36, y - H * 0.88, x + H * 0.46, y - H * 0.86, x + H * 0.34, y - L + H * 0.02], ng);
    GF.poly(ctx, [x + H * 0.36, y - H * 0.88, x + H * 0.6, y - H * 0.74, x + H * 0.58, y - H * 0.68, x + H * 0.42, y - H * 0.74], GF.css(GF.rgb(coat)));
    ctx.fillStyle = '#111'; ctx.beginPath(); ctx.arc(x + H * 0.44, y - H * 0.82, H * 0.012, 0, Math.PI * 2); ctx.fill();
    GF.poly(ctx, [x + H * 0.38, y - H * 0.9, x + H * 0.4, y - H * 0.98, x + H * 0.43, y - H * 0.89], dark);
    // mane & tail
    ctx.strokeStyle = '#1e1410'; ctx.lineWidth = H * 0.05; ctx.beginPath(); ctx.moveTo(x + H * 0.36, y - H * 0.88); ctx.quadraticCurveTo(x + H * 0.24, y - H * 0.72, x + H * 0.18, y - L - H * 0.1); ctx.stroke();
    ctx.lineWidth = H * 0.06; ctx.beginPath(); ctx.moveTo(x - H * 0.34, y - L - H * 0.08); ctx.quadraticCurveTo(x - H * 0.48, y - L * 0.8, x - H * 0.44, y - L * 0.35); ctx.stroke();
    // near legs
    ctx.strokeStyle = coat; ctx.lineWidth = H * 0.07;
    ctx.beginPath(); ctx.moveTo(x - H * 0.16, y - L); ctx.lineTo(x - H * 0.1, y - L * 0.48); ctx.lineTo(x - H * 0.16, y - H * 0.02); ctx.moveTo(x + H * 0.26, y - L); ctx.lineTo(x + H * 0.2, y - L * 0.5); ctx.lineTo(x + H * 0.24, y - H * 0.02); ctx.stroke();
    ctx.fillStyle = '#1a1a1a'; [-0.16, 0.24, -0.26, 0.34].forEach(function (k) { ctx.fillRect(x + H * k - H * 0.03, y - H * 0.04, H * 0.06, H * 0.04); });
    if (opts.barding) { ctx.fillStyle = opts.barding; GF.poly(ctx, [x - H * 0.3, y - L - H * 0.12, x + H * 0.3, y - L - H * 0.12, x + H * 0.32, y - L + H * 0.1, x - H * 0.32, y - L + H * 0.1], opts.barding); ctx.fillStyle = 'rgba(255,255,255,0.35)'; ctx.fillRect(x - H * 0.3, y - L + H * 0.06, H * 0.62, H * 0.03); }
  }
  GF.horse = horse;

  function hullPath(ctx, x, y, w, h, col) {
    var g = ctx.createLinearGradient(0, y - h, 0, y + h * 0.2); g.addColorStop(0, GF.shade(col, 0.2)); g.addColorStop(1, GF.shade(col, -0.45));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(x - w * 0.55, y - h); ctx.lineTo(x + w * 0.62, y - h * 1.05); ctx.quadraticCurveTo(x + w * 0.55, y - h * 0.2, x + w * 0.38, y); ctx.lineTo(x - w * 0.42, y); ctx.quadraticCurveTo(x - w * 0.55, y - h * 0.4, x - w * 0.55, y - h); ctx.closePath(); ctx.fill();
  }
  function sail(ctx, mx, top, bot, wd, colSail, curve) {
    var g = ctx.createLinearGradient(mx - wd, 0, mx + wd, 0); g.addColorStop(0, GF.shade(colSail, 0.15)); g.addColorStop(1, GF.shade(colSail, -0.3));
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(mx - wd, top); ctx.quadraticCurveTo(mx, top + curve * 0.3, mx + wd, top); ctx.quadraticCurveTo(mx + wd + curve, (top + bot) / 2, mx + wd * 0.9, bot); ctx.quadraticCurveTo(mx, bot - curve * 0.2, mx - wd * 0.9, bot); ctx.quadraticCurveTo(mx - wd + curve, (top + bot) / 2, mx - wd, top); ctx.fill();
  }
  function pennant(ctx, x, y, H, col, col2) {
    ctx.strokeStyle = '#2a1a10'; ctx.lineWidth = Math.max(1, H * 0.025); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y - H * 1.25); ctx.stroke();
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y - H * 1.25); ctx.quadraticCurveTo(x + H * 0.18, y - H * 1.28, x + H * 0.34, y - H * 1.16); ctx.lineTo(x + H * 0.2, y - H * 1.1); ctx.lineTo(x + H * 0.3, y - H * 1.03); ctx.quadraticCurveTo(x + H * 0.16, y - H * 1.02, x, y - H * 1.02); ctx.closePath(); ctx.fill();
    ctx.fillStyle = col2; ctx.fillRect(x, y - H * 1.16, H * 0.2, H * 0.035);
  }

  GF.unit = function (S, id, col, col2) {
    var d = D.UNITS[id], w = S * 2.0, h = S * 2.1, c = GF.mk(w, h), ctx = c.getContext('2d');
    var x = w / 2, y = h * 0.86, H = S * 0.95, kind = kindOf(id, d), era = eraOf(d);
    var r = GF.rng(GF.hash(id) + 7);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    var land = d.domain === 'land';
    // team ring (WC3 style)
    if (land) {
      ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.beginPath(); ctx.ellipse(x, y, S * 0.55, S * 0.22, 0, 0, Math.PI * 2); ctx.fill();
      var rg = ctx.createLinearGradient(x - S * 0.5, 0, x + S * 0.5, 0); rg.addColorStop(0, GF.shade(col, 0.35)); rg.addColorStop(1, GF.shade(col, -0.3));
      ctx.strokeStyle = rg; ctx.lineWidth = S * 0.08; ctx.beginPath(); ctx.ellipse(x, y, S * 0.48, S * 0.19, 0, 0, Math.PI * 2); ctx.stroke();
      ctx.strokeStyle = col2; ctx.lineWidth = Math.max(0.6, S * 0.02); ctx.beginPath(); ctx.ellipse(x, y, S * 0.55, S * 0.225, 0, 0, Math.PI * 2); ctx.stroke();
    }
    var fig = GF.mk(w, h), f = fig.getContext('2d'); f.lineCap = 'round'; f.lineJoin = 'round';
    var squad = { club: 'club', sword: 'sword', spear: 'spear', archer: 'bow', xbow: 'xbow', rifle: 'gun', scout: 'staff' }[kind];
    if (squad) {
      var shield = kind === 'sword' || kind === 'spear' || kind === 'club';
      if (era >= 3) shield = false;
      var forms = kind === 'scout' ? [[0, 0, 1]] : [[-0.34, -0.16, 0.78], [0.34, -0.18, 0.78], [0, 0.04, 0.95]];
      pennant(f, x - S * 0.42, y + S * 0.02, H * 0.95, col, col2);
      forms.forEach(function (fm) { soldier(f, x + fm[0] * S, y + fm[1] * S, H * fm[2], col, col2, era, squad, r, { shield: shield, helmet: kind !== 'scout' }); });
    } else switch (kind) {
      case 'settler': {
        GF.blob(f, x + S * 0.32, y - S * 0.32, S * 0.2, S * 0.12, '#8a6a4a', 0.3);
        f.fillStyle = '#7a5a3a'; f.fillRect(x - S * 0.05, y - S * 0.4, S * 0.5, S * 0.2);
        var cg = f.createLinearGradient(0, y - S * 0.75, 0, y - S * 0.38); cg.addColorStop(0, '#fbf3df'); cg.addColorStop(1, '#c8bca0');
        f.fillStyle = cg; f.beginPath(); f.moveTo(x - S * 0.05, y - S * 0.38); f.quadraticCurveTo(x + S * 0.2, y - S * 0.85, x + S * 0.45, y - S * 0.38); f.fill();
        f.fillStyle = '#3a2a1a'; [0.05, 0.38].forEach(function (k) { f.beginPath(); f.arc(x + S * k, y - S * 0.14, S * 0.11, 0, Math.PI * 2); f.fill(); f.fillStyle = '#8a6a4a'; f.beginPath(); f.arc(x + S * k, y - S * 0.14, S * 0.04, 0, Math.PI * 2); f.fill(); f.fillStyle = '#3a2a1a'; });
        soldier(f, x - S * 0.32, y, H * 0.85, col, col2, era, 'staff', r, { civilian: true, hat: '#6a4a2a' });
        break;
      }
      case 'worker': soldier(f, x, y, H, GF.shade(col, -0.1), col2, era, 'pick', r, { civilian: true, hat: '#c8a860' }); break;
      case 'robed': soldier(f, x, y, H, id === 'inquisitor' ? '#2a2a2a' : '#e8e0d0', col, era, 'book', r, { robe: true }); f.fillStyle = col; f.fillRect(x - S * 0.04, y - H * 0.68, S * 0.08, H * 0.4); break;
      case 'gp': soldier(f, x, y, H, col, '#ffd34a', era, 'staff', r, { robe: true, halo: true }); f.fillStyle = '#ffd34a'; f.fillRect(x - S * 0.15, y - H * 0.38, S * 0.3, H * 0.04); break;
      case 'caravan': horse(f, x + S * 0.12, y, H * 0.9, '#c9a066'); f.fillStyle = '#a0522d'; f.fillRect(x - S * 0.08, y - H * 0.68, S * 0.38, H * 0.2); f.fillStyle = col; f.fillRect(x - S * 0.06, y - H * 0.72, S * 0.34, H * 0.05); soldier(f, x - S * 0.45, y, H * 0.8, col, col2, era, 'staff', r, { civilian: true, hat: '#e8dcc0' }); break;
      case 'rider': case 'chariot': {
        var coats = ['#5a3a22', '#2a1e18', '#8a5a32', '#d8d0c4', '#6a4a30'];
        var heavy = /knight|cataphract|lancer|hussar|cuirass|sipahi|winged/i.test(d.name);
        var riders = [[-0.28, -0.12, 0.78], [0.18, 0.04, 0.92]];
        if (kind === 'chariot') riders = [[0, 0.02, 0.95]];
        riders.forEach(function (rd, i) {
          var rx = x + rd[0] * S, ry = y + rd[1] * S, RH = H * rd[2];
          if (kind === 'chariot') {
            horse(f, rx + RH * 0.25, ry, RH * 0.9, coats[i]);
            f.fillStyle = '#8a6a3a'; f.fillRect(rx - RH * 0.6, ry - RH * 0.48, RH * 0.38, RH * 0.24);
            f.strokeStyle = '#3a2a1a'; f.lineWidth = RH * 0.04; f.beginPath(); f.arc(rx - RH * 0.42, ry - RH * 0.17, RH * 0.15, 0, Math.PI * 2); f.stroke();
            soldier(f, rx - RH * 0.42, ry - RH * 0.36, RH * 0.62, col, col2, era, d.rs ? 'bow' : 'spear', r, {});
            return;
          }
          horse(f, rx, ry, RH, coats[(i + Math.floor(r() * 5)) % 5], { barding: heavy ? col : null });
          soldier(f, rx - RH * 0.02, ry - RH * 0.36, RH * 0.66, col, col2, era, d.rs ? 'bow' : era >= 4 ? 'sword' : heavy ? 'spear' : 'sword', r, { shield: heavy && era < 3 });
        });
        if (/camel/i.test(d.name)) { }
        pennant(f, x - S * 0.55, y, H, col, col2);
        break;
      }
      case 'elephant': {
        f.fillStyle = 'rgba(0,0,0,0.3)'; f.beginPath(); f.ellipse(x, y, S * 0.55, S * 0.14, 0, 0, Math.PI * 2); f.fill();
        var eg = '#8d8a86';
        f.strokeStyle = GF.shade(eg, -0.3); f.lineWidth = H * 0.14; [-0.3, 0.25].forEach(function (k) { f.beginPath(); f.moveTo(x + H * k, y - H * 0.4); f.lineTo(x + H * k, y - H * 0.03); f.stroke(); });
        GF.blob(f, x, y - H * 0.55, H * 0.48, H * 0.3, eg, 0.25);
        f.strokeStyle = eg; f.lineWidth = H * 0.15; [-0.18, 0.36].forEach(function (k) { f.beginPath(); f.moveTo(x + H * k, y - H * 0.4); f.lineTo(x + H * k, y - H * 0.03); f.stroke(); });
        GF.blob(f, x + H * 0.48, y - H * 0.68, H * 0.2, H * 0.2, eg, 0.25);
        f.strokeStyle = eg; f.lineWidth = H * 0.09; f.beginPath(); f.moveTo(x + H * 0.62, y - H * 0.62); f.quadraticCurveTo(x + H * 0.76, y - H * 0.35, x + H * 0.66, y - H * 0.15); f.stroke();
        f.strokeStyle = '#f2ecd8'; f.lineWidth = H * 0.04; f.beginPath(); f.moveTo(x + H * 0.56, y - H * 0.55); f.quadraticCurveTo(x + H * 0.72, y - H * 0.5, x + H * 0.76, y - H * 0.62); f.stroke();
        GF.blob(f, x + H * 0.36, y - H * 0.72, H * 0.12, H * 0.16, GF.shade(eg, -0.15), 0.1);
        f.fillStyle = col; f.fillRect(x - H * 0.32, y - H * 0.88, H * 0.55, H * 0.2); f.fillStyle = col2; f.fillRect(x - H * 0.32, y - H * 0.72, H * 0.55, H * 0.04);
        soldier(f, x - H * 0.05, y - H * 0.78, H * 0.55, col, col2, era, d.rs ? 'bow' : 'spear', r, {});
        break;
      }
      case 'catapult': case 'tower': case 'cannon': case 'rocket': case 'gunteam': {
        var woodC = '#8a6038';
        if (kind === 'tower') {
          var tg = f.createLinearGradient(x - H * 0.35, 0, x + H * 0.35, 0); tg.addColorStop(0, '#a07448'); tg.addColorStop(1, '#5a3a20');
          f.fillStyle = tg; f.fillRect(x - H * 0.35, y - H * 1.35, H * 0.7, H * 1.3);
          f.strokeStyle = '#3a2410'; f.lineWidth = H * 0.025; for (var q = 0; q < 6; q++) { f.beginPath(); f.moveTo(x - H * 0.35, y - H * 0.2 - q * H * 0.2); f.lineTo(x + H * 0.35, y - H * 0.2 - q * H * 0.2); f.stroke(); }
          f.fillStyle = col; f.fillRect(x - H * 0.36, y - H * 1.42, H * 0.72, H * 0.12);
          f.fillStyle = '#2a1a0a'; [-0.22, 0.22].forEach(function (k) { f.beginPath(); f.arc(x + H * k, y - H * 0.08, H * 0.1, 0, Math.PI * 2); f.fill(); });
          break;
        }
        soldier(f, x - S * 0.5, y - S * 0.06, H * 0.72, col, col2, era, null, r, {});
        f.fillStyle = '#2a1a0a'; [-0.26, 0.28].forEach(function (k) { f.beginPath(); f.arc(x + H * k, y - H * 0.16, H * 0.16, 0, Math.PI * 2); f.fill(); f.fillStyle = '#7a5a3a'; f.beginPath(); f.arc(x + H * k, y - H * 0.16, H * 0.06, 0, Math.PI * 2); f.fill(); f.fillStyle = '#2a1a0a'; });
        if (kind === 'catapult') {
          f.fillStyle = woodC; f.fillRect(x - H * 0.45, y - H * 0.36, H * 0.9, H * 0.12);
          GF.poly(f, [x - H * 0.1, y - H * 0.34, x, y - H * 0.75, x + H * 0.1, y - H * 0.34], GF.shade(woodC, -0.2));
          f.strokeStyle = woodC; f.lineWidth = H * 0.07; f.beginPath(); f.moveTo(x - H * 0.25, y - H * 0.34); f.lineTo(x + H * 0.42, y - H * 1.0); f.stroke();
          GF.blob(f, x + H * 0.45, y - H * 1.03, H * 0.09, H * 0.08, '#8a8278', 0.3);
        } else if (kind === 'cannon') {
          var bc = era >= 4 ? '#4c5440' : '#2c2c2c';
          f.fillStyle = woodC; f.fillRect(x - H * 0.4, y - H * 0.34, H * 0.6, H * 0.1);
          f.save(); f.translate(x - H * 0.05, y - H * 0.4); f.rotate(-0.32); var gg = f.createLinearGradient(0, -H * 0.1, 0, H * 0.1); gg.addColorStop(0, GF.shade(bc, 0.35)); gg.addColorStop(1, GF.shade(bc, -0.3)); f.fillStyle = gg; f.fillRect(-H * 0.2, -H * 0.09, H * (era >= 4 ? 0.95 : 0.75), H * 0.18); f.restore();
          if (era >= 4) { f.fillStyle = '#4c5440'; f.fillRect(x - H * 0.15, y - H * 0.55, H * 0.22, H * 0.2); }
        } else if (kind === 'rocket') {
          var trk = '#4c5a3a'; f.fillStyle = trk; f.fillRect(x - H * 0.55, y - H * 0.42, H * 1.05, H * 0.24); f.fillStyle = GF.shade(trk, 0.2); f.fillRect(x + H * 0.25, y - H * 0.62, H * 0.28, H * 0.22);
          f.fillStyle = '#dcdcdc'; for (q = 0; q < 4; q++) { f.save(); f.translate(x - H * 0.35 + q * H * 0.12, y - H * 0.46); f.rotate(-0.55); f.fillRect(0, -H * 0.035, H * 0.55, H * 0.07); f.fillStyle = '#c02020'; f.fillRect(H * 0.5, -H * 0.035, H * 0.08, H * 0.07); f.fillStyle = '#dcdcdc'; f.restore(); }
        } else {
          f.fillStyle = '#2a2a2a'; f.fillRect(x - H * 0.15, y - H * 0.48, H * 0.7, H * 0.11); f.fillRect(x - H * 0.02, y - H * 0.42, H * 0.05, H * 0.3);
          if (/anti-aircraft|sam/i.test(d.name)) { f.save(); f.translate(x, y - H * 0.45); f.rotate(-0.9); f.fillRect(0, -H * 0.04, H * 0.7, H * 0.08); f.restore(); }
        }
        f.fillStyle = col; f.fillRect(x - H * 0.1, y - H * 0.32, H * 0.2, H * 0.06);
        break;
      }
      case 'tank': case 'robot': case 'heli': {
        if (kind === 'heli') {
          f.fillStyle = 'rgba(0,0,0,0.3)'; f.beginPath(); f.ellipse(x, y, S * 0.45, S * 0.12, 0, 0, Math.PI * 2); f.fill();
          GF.blob(f, x, y - H * 0.8, H * 0.42, H * 0.2, '#4c5a3a', 0.3); f.fillStyle = '#3a4628'; f.fillRect(x + H * 0.3, y - H * 0.84, H * 0.55, H * 0.07); f.fillRect(x + H * 0.8, y - H * 0.96, H * 0.06, H * 0.2);
          f.fillStyle = 'rgba(150,200,230,0.8)'; f.beginPath(); f.ellipse(x - H * 0.22, y - H * 0.85, H * 0.12, H * 0.08, 0, 0, Math.PI * 2); f.fill();
          f.strokeStyle = 'rgba(30,30,30,0.8)'; f.lineWidth = H * 0.035; f.beginPath(); f.moveTo(x - H * 0.75, y - H * 1.08); f.lineTo(x + H * 0.75, y - H * 1.02); f.stroke(); f.fillStyle = col; f.fillRect(x - H * 0.1, y - H * 0.72, H * 0.25, H * 0.07);
          break;
        }
        if (kind === 'robot') {
          f.fillStyle = 'rgba(0,0,0,0.3)'; f.beginPath(); f.ellipse(x, y, S * 0.5, S * 0.16, 0, 0, Math.PI * 2); f.fill();
          ['#5a5f6a'].forEach(function () { });
          GF.blob(f, x - H * 0.22, y - H * 0.32, H * 0.1, H * 0.32, '#5a5f6a', 0.3); GF.blob(f, x + H * 0.22, y - H * 0.32, H * 0.1, H * 0.32, '#5a5f6a', 0.3);
          var bg2 = f.createLinearGradient(x - H * 0.45, 0, x + H * 0.45, 0); bg2.addColorStop(0, '#9aa0aa'); bg2.addColorStop(1, '#4a4f58');
          f.fillStyle = bg2; f.fillRect(x - H * 0.45, y - H * 1.35, H * 0.9, H * 0.72);
          f.fillStyle = '#ff3a2a'; f.fillRect(x - H * 0.3, y - H * 1.2, H * 0.6, H * 0.09); f.fillStyle = col; f.fillRect(x - H * 0.45, y - H * 0.85, H * 0.9, H * 0.1);
          f.fillStyle = '#3a3f48'; f.fillRect(x + H * 0.45, y - H * 1.25, H * 0.25, H * 0.12); f.fillRect(x - H * 0.7, y - H * 1.25, H * 0.25, H * 0.12);
          break;
        }
        var tc = era >= 6 ? '#7a7a5c' : era >= 5 ? '#55603e' : '#5c5040';
        f.fillStyle = 'rgba(0,0,0,0.35)'; f.beginPath(); f.ellipse(x, y, S * 0.6, S * 0.16, 0, 0, Math.PI * 2); f.fill();
        f.fillStyle = '#222'; f.beginPath(); f.moveTo(x - H * 0.62, y - H * 0.3); f.lineTo(x + H * 0.62, y - H * 0.3); f.quadraticCurveTo(x + H * 0.72, y - H * 0.12, x + H * 0.55, y - H * 0.02); f.lineTo(x - H * 0.55, y - H * 0.02); f.quadraticCurveTo(x - H * 0.72, y - H * 0.12, x - H * 0.62, y - H * 0.3); f.fill();
        f.fillStyle = '#4a4a4a'; for (var wq = 0; wq < 6; wq++) { f.beginPath(); f.arc(x - H * 0.48 + wq * H * 0.19, y - H * 0.14, H * 0.065, 0, Math.PI * 2); f.fill(); }
        var hg = f.createLinearGradient(0, y - H * 0.55, 0, y - H * 0.28); hg.addColorStop(0, GF.shade(tc, 0.3)); hg.addColorStop(1, GF.shade(tc, -0.3));
        GF.poly(f, [x - H * 0.62, y - H * 0.3, x - H * 0.5, y - H * 0.52, x + H * 0.48, y - H * 0.52, x + H * 0.66, y - H * 0.3], hg);
        GF.blob(f, x - H * 0.05, y - H * 0.62, H * 0.3, H * 0.13, tc, 0.35);
        f.fillStyle = '#2a2a2a'; f.fillRect(x + H * 0.15, y - H * 0.67, H * (era >= 6 ? 0.75 : 0.6), H * 0.06);
        f.fillStyle = col; f.fillRect(x - H * 0.28, y - H * 0.45, H * 0.3, H * 0.07); f.fillStyle = col2; f.fillRect(x - H * 0.28, y - H * 0.38, H * 0.3, H * 0.025);
        break;
      }
      case 'galley': case 'sailship': case 'warship': case 'ironclad': case 'sub': case 'carrier': case 'boat': case 'freighter': {
        // wake
        f.strokeStyle = 'rgba(255,255,255,0.55)'; f.lineWidth = S * 0.03; f.beginPath(); f.moveTo(x - S * 0.8, y - S * 0.02); f.quadraticCurveTo(x - S * 0.4, y + S * 0.08, x + S * 0.1, y + S * 0.02); f.stroke();
        f.strokeStyle = col; f.lineWidth = S * 0.07; f.beginPath(); f.ellipse(x, y - S * 0.02, S * 0.62, S * 0.18, 0, 0, Math.PI * 2); f.stroke();
        var hw = kind === 'boat' ? H * 0.65 : kind === 'sub' ? H * 1.2 : kind === 'freighter' || kind === 'carrier' ? H * 1.4 : H * 1.25;
        var hc = (kind === 'galley' || kind === 'sailship' || kind === 'boat') ? '#7a4a28' : kind === 'sub' ? '#2a2f35' : kind === 'ironclad' ? '#3a3a3a' : kind === 'freighter' ? '#8a3a2a' : '#7a838c';
        if (kind === 'sub') { GF.blob(f, x, y - H * 0.16, hw * 0.5, H * 0.11, hc, 0.25); f.fillStyle = hc; f.fillRect(x - H * 0.08, y - H * 0.46, H * 0.2, H * 0.26); f.fillStyle = col; f.fillRect(x - H * 0.08, y - H * 0.46, H * 0.2, H * 0.05); break; }
        hullPath(f, x, y - H * 0.04, hw, H * 0.3, hc);
        if (kind === 'galley' || kind === 'sailship' || kind === 'boat') { f.strokeStyle = 'rgba(40,20,10,0.5)'; f.lineWidth = Math.max(0.5, S * 0.015); for (q = 1; q < 3; q++) { f.beginPath(); f.moveTo(x - hw * 0.5, y - H * 0.34 + q * H * 0.09); f.lineTo(x + hw * 0.55, y - H * 0.36 + q * H * 0.09); f.stroke(); } f.fillStyle = col; f.fillRect(x - hw * 0.5, y - H * 0.34, hw * 1.05, H * 0.04); }
        if (kind === 'galley') { f.strokeStyle = '#3a2010'; f.lineWidth = S * 0.025; for (q = 0; q < 6; q++) { f.beginPath(); f.moveTo(x - hw * 0.35 + q * hw * 0.15, y - H * 0.16); f.lineTo(x - hw * 0.44 + q * hw * 0.15, y + H * 0.08); f.stroke(); } }
        if (kind === 'galley' || kind === 'sailship' || kind === 'boat') {
          var masts = kind === 'sailship' ? (/frigate|line/i.test(d.name) ? 3 : 2) : 1;
          for (q = 0; q < masts; q++) {
            var mx = x + (q - (masts - 1) / 2) * hw * 0.32, mh = H * (q === Math.floor(masts / 2) ? 1.4 : 1.2);
            f.strokeStyle = '#3a2010'; f.lineWidth = S * 0.04; f.beginPath(); f.moveTo(mx, y - H * 0.32); f.lineTo(mx, y - mh); f.stroke();
            sail(f, mx, y - mh + H * 0.08, y - H * 0.75, H * 0.27, kind === 'galley' ? col : '#f4eedc', H * 0.06);
            if (kind === 'sailship') sail(f, mx, y - H * 0.72, y - H * 0.42, H * 0.3, '#f4eedc', H * 0.05);
            f.fillStyle = col; f.beginPath(); f.moveTo(mx, y - mh); f.lineTo(mx + H * 0.22, y - mh + H * 0.04); f.lineTo(mx, y - mh + H * 0.09); f.fill();
          }
          if (kind === 'sailship') { f.fillStyle = '#1a1a1a'; for (q = 0; q < 5; q++) f.fillRect(x - hw * 0.4 + q * hw * 0.18, y - H * 0.2, H * 0.06, H * 0.05); }
        } else if (kind === 'carrier') { f.fillStyle = '#5a6068'; f.fillRect(x - hw * 0.55, y - H * 0.42, hw * 1.15, H * 0.12); f.strokeStyle = '#ddd'; f.lineWidth = S * 0.01; f.setLineDash([S * 0.05, S * 0.04]); f.beginPath(); f.moveTo(x - hw * 0.5, y - H * 0.36); f.lineTo(x + hw * 0.5, y - H * 0.37); f.stroke(); f.setLineDash([]); house(f, x + hw * 0.3, y - H * 0.42, H * 0.16, H * 0.1, H * 0.3); }
        else {
          GF.house(f, x - hw * 0.05, y - H * 0.3, hw * 0.32, H * 0.2, H * 0.24, { wall: GF.shade(hc, 0.15), side: GF.shade(hc, -0.2) }, hc, { style: 'flat' });
          if (kind === 'ironclad' || kind === 'freighter') { f.fillStyle = '#2a2a2a'; f.fillRect(x + H * 0.05, y - H * 0.92, H * 0.12, H * 0.4); }
          else { f.fillStyle = '#4a4a4a'; GF.blob(f, x + hw * 0.32, y - H * 0.38, H * 0.12, H * 0.06, '#5a5a5a', 0.3); f.fillRect(x + hw * 0.32, y - H * 0.4, hw * 0.22, H * 0.04); GF.blob(f, x - hw * 0.35, y - H * 0.38, H * 0.12, H * 0.06, '#5a5a5a', 0.3); f.fillRect(x - hw * 0.6, y - H * 0.4, hw * 0.22, H * 0.04); f.fillRect(x - H * 0.03, y - H * 0.95, H * 0.06, H * 0.42); }
          f.fillStyle = col; f.fillRect(x - hw * 0.5, y - H * 0.3, hw * 1.05, H * 0.035);
        }
        break;
      }
      case 'plane': case 'bomber': case 'missile': {
        f.fillStyle = 'rgba(0,0,0,0.25)'; f.beginPath(); f.ellipse(x + S * 0.1, y, S * 0.45, S * 0.12, 0, 0, Math.PI * 2); f.fill();
        var pc = kind === 'missile' ? '#e6e6e6' : era >= 6 ? '#8a929a' : '#6a7a5a';
        var py = y - H * 0.95, pl = kind === 'bomber' ? H * 1.25 : H * 0.95;
        if (kind !== 'missile') {
          var wg2 = f.createLinearGradient(0, py - H * 0.4, 0, py + H * 0.4); wg2.addColorStop(0, GF.shade(pc, 0.25)); wg2.addColorStop(1, GF.shade(pc, -0.3));
          GF.poly(f, [x - H * 0.05, py, x - H * 0.3, py + H * 0.42, x + H * 0.08, py + H * 0.42, x + H * 0.18, py, x + H * 0.08, py - H * 0.42, x - H * 0.3, py - H * 0.42], wg2);
          GF.poly(f, [x - pl * 0.42, py, x - pl * 0.55, py + H * 0.16, x - pl * 0.4, py + H * 0.16, x - pl * 0.35, py, x - pl * 0.4, py - H * 0.16, x - pl * 0.55, py - H * 0.16], GF.shade(pc, -0.1));
        }
        GF.blob(f, x, py, pl * 0.5, H * 0.09, pc, 0.4);
        if (kind === 'missile') { GF.poly(f, [x + pl * 0.5, py - H * 0.08, x + pl * 0.68, py, x + pl * 0.5, py + H * 0.08], '#c82020'); f.fillStyle = '#f2d020'; f.beginPath(); f.arc(x, py, H * 0.07, 0, Math.PI * 2); f.fill(); f.fillStyle = '#111'; f.beginPath(); f.arc(x, py, H * 0.03, 0, Math.PI * 2); f.fill(); }
        else { f.fillStyle = 'rgba(160,210,240,0.85)'; f.beginPath(); f.ellipse(x + pl * 0.25, py - H * 0.03, H * 0.1, H * 0.05, 0, 0, Math.PI * 2); f.fill(); f.fillStyle = col; f.beginPath(); f.arc(x - H * 0.1, py + H * 0.28, H * 0.07, 0, Math.PI * 2); f.fill(); f.fillStyle = col2; f.beginPath(); f.arc(x - H * 0.1, py + H * 0.28, H * 0.03, 0, Math.PI * 2); f.fill(); }
        break;
      }
    }
    // outline pass + composite
    ctx.save(); ctx.shadowColor = 'rgba(0,0,0,0.8)'; ctx.shadowBlur = Math.max(1, S * 0.05); ctx.drawImage(fig, 0, 0); ctx.restore();
    ctx.drawImage(fig, 0, 0);
    return { c: c, ax: x, ay: y };
  };
  function house(f, x, y, w, d, h) { GF.house(f, x, y, w, d, h, { wall: '#7a828a', side: '#545a62' }, '#6a7078', { style: 'flat' }); }
})(G.GFX);
