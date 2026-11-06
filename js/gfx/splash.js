// ============================================================
//  Cinematic splashes: painted wonder-completion scenes and
//  leader declarations (war / peace / defeat).
// ============================================================
(function (GF) {
  var queue = [], showing = false;
  GF.wonderScene = function (id, W, H) {
    var c = GF.mk(W, H), ctx = c.getContext('2d'), r = GF.rng(GF.hash(id));
    var sky = ctx.createLinearGradient(0, 0, 0, H * 0.7); sky.addColorStop(0, '#2a3a6a'); sky.addColorStop(0.45, '#c87a5a'); sky.addColorStop(0.8, '#f2c070'); sky.addColorStop(1, '#f6e0a0');
    ctx.fillStyle = sky; ctx.fillRect(0, 0, W, H);
    // sun and god rays
    var sx = W * 0.68, sy = H * 0.5, sg = ctx.createRadialGradient(sx, sy, 0, sx, sy, H * 0.6); sg.addColorStop(0, 'rgba(255,250,220,1)'); sg.addColorStop(0.08, 'rgba(255,230,160,0.9)'); sg.addColorStop(1, 'rgba(255,200,120,0)');
    ctx.fillStyle = sg; ctx.fillRect(0, 0, W, H);
    ctx.save(); ctx.globalCompositeOperation = 'lighter';
    for (var k = 0; k < 14; k++) { var a = -Math.PI + k / 13 * Math.PI + (r() - 0.5) * 0.1, w = 0.03 + r() * 0.05; ctx.fillStyle = 'rgba(255,220,150,' + (0.04 + r() * 0.05) + ')'; ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx + Math.cos(a - w) * W * 1.5, sy + Math.sin(a - w) * W * 1.5); ctx.lineTo(sx + Math.cos(a + w) * W * 1.5, sy + Math.sin(a + w) * W * 1.5); ctx.fill(); }
    ctx.restore();
    // clouds
    for (k = 0; k < 7; k++) { var cx = r() * W, cy = H * (0.1 + r() * 0.3), cw = W * (0.12 + r() * 0.15); for (var j = 0; j < 5; j++) { var g = ctx.createRadialGradient(cx + j * cw * 0.2, cy, 0, cx + j * cw * 0.2, cy, cw * 0.3); g.addColorStop(0, 'rgba(255,225,205,0.3)'); g.addColorStop(1, 'rgba(255,220,200,0)'); ctx.fillStyle = g; ctx.beginPath(); ctx.ellipse(cx + j * cw * 0.2, cy, cw * 0.3, cw * 0.12, 0, 0, Math.PI * 2); ctx.fill(); } }
    // distant hills (3 layers)
    [['#8a6a6a', 0.62, 0.05], ['#6a5a4a', 0.7, 0.07], ['#4a5a2a', 0.78, 0.05]].forEach(function (L, li) {
      ctx.fillStyle = L[0]; ctx.beginPath(); ctx.moveTo(0, H); var y0 = H * L[1];
      for (var x = 0; x <= W; x += W / 40) ctx.lineTo(x, y0 - (Math.sin(x / W * (5 + li * 3) + li * 2) * 0.5 + Math.sin(x / W * 17 + li) * 0.2 + 0.5) * H * L[2]);
      ctx.lineTo(W, H); ctx.fill();
    });
    var gg = ctx.createLinearGradient(0, H * 0.78, 0, H); gg.addColorStop(0, '#5a6a2a'); gg.addColorStop(1, '#2a3214'); ctx.fillStyle = gg; ctx.fillRect(0, H * 0.82, W, H * 0.18);
    // the wonder itself
    var S = Math.round(H * 0.52), sp = GF.wonder(S, id);
    ctx.drawImage(sp.c, W * 0.42 - sp.ax, H * 0.9 - sp.ay);
    // foreground silhouettes: trees and tiny people
    for (k = 0; k < 6; k++) { var tx = (k < 3 ? r() * W * 0.18 : W * 0.82 + r() * W * 0.18), ty = H * (0.92 + r() * 0.06); if (GF.tree) GF.tree(ctx, tx, ty, H * 0.12, k % 2 ? 'leaf' : 'pine', r, '#2a3a1a'); }
    ctx.fillStyle = 'rgba(20,16,10,0.85)'; for (k = 0; k < 9; k++) { var px = W * (0.18 + r() * 0.6), py = H * (0.93 + r() * 0.04), ph = H * 0.035; ctx.fillRect(px, py - ph, ph * 0.28, ph); ctx.beginPath(); ctx.arc(px + ph * 0.14, py - ph - ph * 0.15, ph * 0.16, 0, Math.PI * 2); ctx.fill(); }
    // warm grade + vignette
    ctx.fillStyle = 'rgba(255,160,60,0.08)'; ctx.fillRect(0, 0, W, H);
    var vg = ctx.createRadialGradient(W / 2, H / 2, H * 0.3, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,0,0,0.6)'); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
    return c;
  };
  function show(item) {
    showing = true;
    var ov = document.createElement('div'); ov.className = 'splash';
    var card = document.createElement('div'); card.className = 'splash-card frame'; ov.appendChild(card);
    var dpr = Math.min(2, window.devicePixelRatio || 1), Wc = Math.min(560, window.innerWidth - 40);
    if (item.kind === 'wonder') {
      var cv = GF.wonderScene(item.id, Math.round(Wc * dpr), Math.round(Wc * 0.56 * dpr)); cv.style.width = Wc + 'px'; cv.style.height = Math.round(Wc * 0.56) + 'px'; cv.className = 'splash-art'; card.appendChild(cv);
      card.insertAdjacentHTML('beforeend', '<div class="splash-kicker">Wonder Completed</div><div class="splash-title">' + item.name + '</div><div class="splash-text">' + item.text + '</div>');
    } else {
      var row = document.createElement('div'); row.className = 'splash-row';
      if (GF.portraitEl) row.appendChild(GF.portraitEl(item.civ, Math.min(140, Wc * 0.36)));
      var tx = document.createElement('div'); tx.innerHTML = '<div class="splash-kicker ' + (item.kind === 'war' ? 'bad' : 'good') + '">' + item.kicker + '</div><div class="splash-title">' + item.name + '</div><div class="splash-quote">“' + item.text + '”</div>';
      row.appendChild(tx); card.appendChild(row);
    }
    var b = document.createElement('button'); b.className = 'btn primary'; b.textContent = 'Continue'; card.appendChild(b);
    function close() { ov.classList.add('out'); setTimeout(function () { ov.remove(); showing = false; next(); }, 250); }
    b.onclick = close; ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    document.body.appendChild(ov); requestAnimationFrame(function () { ov.classList.add('in'); });
  }
  function next() { if (!showing && queue.length) show(queue.shift()); }
  GF.splash = function (item) { queue.push(item); next(); };
  var WAR = ['The time for words has passed. Our armies march at dawn!', 'You stand in the way of our destiny. Prepare yourself!', 'Your insolence will be answered with steel.', 'We have tolerated you long enough. This means war!'];
  var PEACE = ['Enough blood has been spilled. Let there be peace between us.', 'We are weary of this war. Let us make peace.'];
  if (G.Engine) G.Engine.on(function (ev) {
    var UI = G.UI, game = UI && UI.game; if (!game || !UI.rend) return;
    var h = game.players[game.humanId];
    try {
      if (ev.type === 'wonder' && ev.city && ev.city.owner === h.id) {
        var wd = G.D.WONDERS[ev.id]; if (!wd) return;
        GF.splash({ kind: 'wonder', id: ev.id, name: wd.name, text: 'Completed in ' + ev.city.name + '. ' + (wd.desc || '') });
      } else if ((ev.type === 'war' || ev.type === 'peace') && ev.b === h.id && ev.a !== h.id) {
        var o = game.players[ev.a]; if (!o || o.isCS || o.barb || !G.D.CIVS[o.civ]) return;
        var lines = ev.type === 'war' ? WAR : PEACE;
        GF.splash({ kind: ev.type, civ: o.civ, kicker: ev.type === 'war' ? o.name + ' declares war!' : o.name + ' makes peace', name: o.leader, text: lines[(game.turn + o.id) % lines.length] });
      }
    } catch (e) { console.error(e); }
  });
})(G.GFX);
