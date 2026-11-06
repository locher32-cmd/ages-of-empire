// ============================================================
//  UI controller: input, selection, HUD, unit panel, turn flow
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.UI = (function () {
  var D = G.D, E = G.Engine, U = G.Units, R = G.Rules, Hex = G.Hex, IDS = G.IDS;
  var UI = { game: null, rend: null, sel: null, mode: null, cityId: null, pending: null, settings: {}, busy: false };
  var $ = function (id) { return document.getElementById(id); };
  UI.$ = $;

  // ---------- DOM helpers ----------
  function el(tag, attrs, kids) {
    var e = document.createElement(tag);
    if (attrs) for (var k in attrs) {
      var v = attrs[k];
      if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v; else if (k === 'text') e.textContent = v;
      else if (k.indexOf('on') === 0 && typeof v === 'function') e.addEventListener(k.substr(2), v);
      else if (k === 'style' && typeof v === 'object') { for (var s in v) e.style[s] = v[s]; }
      else if (v != null && v !== false) e.setAttribute(k, v === true ? '' : v);
    }
    (kids || []).forEach(function (c) { if (c == null) return; e.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c); });
    return e;
  }
  UI.el = el;
  function btn(label, fn, cls, dis) { return el('button', { class: 'btn ' + (cls || ''), onclick: function (ev) { ev.stopPropagation(); if (!this.disabled) fn(ev); }, disabled: dis ? true : null }, [label]); }
  UI.btn = btn;
  function fmt(n) { n = Math.round(n * 10) / 10; return (n > 0 ? '+' : '') + n; }
  UI.fmt = fmt;
  function human() { return UI.game.players[UI.game.humanId]; }
  UI.human = human;

  var toastT = null;
  UI.toast = function (msg, ms) {
    var t = $('toast'); t.textContent = msg; t.classList.remove('hidden');
    clearTimeout(toastT); toastT = setTimeout(function () { t.classList.add('hidden'); }, ms || 2200);
  };

  // ---------- Modals ----------
  var modalStack = [];
  UI.modal = function (title, body, opts) {
    opts = opts || {};
    var root = $('modal-root');
    var close = function () {
      if (back.parentNode) root.removeChild(back);
      modalStack = modalStack.filter(function (m) { return m !== close; });
      if (opts.onClose) opts.onClose();
    };
    var head = el('div', { class: 'mhead' }, [el('div', { class: 'title' }, [title]), opts.noClose ? null : el('button', { class: 'xbtn', onclick: close }, ['✕'])]);
    var foot = null;
    if (opts.buttons && opts.buttons.length) foot = el('div', { class: 'mfoot' }, opts.buttons.map(function (b) { return btn(b[0], function () { var keep = b[1] && b[1](); if (keep !== true) close(); }, b[2], b[3]); }));
    var box = el('div', { class: 'modal frame ' + (opts.cls || '') }, [head, el('div', { class: 'mbody' }, [body]), foot]);
    var back = el('div', { class: 'modal-back', onclick: function (e) { if (e.target === back && !opts.noClose) close(); } }, [box]);
    root.appendChild(back);
    modalStack.push(close);
    close.box = box;
    return close;
  };
  UI.closeAllModals = function () { modalStack.slice().forEach(function (c) { c(); }); };
  UI.confirm = function (title, text, yes, yesLabel) {
    UI.modal(title, el('div', { html: text }), { buttons: [['Cancel', null], [yesLabel || 'Confirm', yes, 'primary']] });
  };

  // ---------- Setup ----------
  UI.start = function (game) {
    UI.game = game;
    G.Hex.setSize(game.map.W, game.map.H);
    var rend = UI.rend || new G.Render($('map'));
    UI.rend = rend;
    rend.setGame(game, game.humanId);
    rend.revealAll = false;
    rend.showYields = !!UI.settings.yields;
    rend.resize();
    ['topbar', 'sidemenu', 'bottomright', 'research-chip', 'notes'].forEach(function (id) { $(id).classList.remove('hidden'); });
    var h = human();
    var first = h.units.map(function (id) { return game.units[id]; }).filter(Boolean)[0];
    var cap = game.cities[h.capital];
    rend.s = window.innerWidth < 700 ? 30 : 38;
    rend.centerOn(cap ? cap.tile : first ? first.tile : 0);
    UI.deselect();
    UI.refresh();
    setTimeout(function () { UI.beginHumanTurn(true); }, 50);
  };

  // ---------- Input ----------
  UI.bindInput = function () {
    var cv = $('map'), pts = {}, drag = null, pinch = null, lp = null, moved = false;
    function rend() { return UI.rend; }
    cv.addEventListener('pointerdown', function (e) {
      if (!UI.game) return;
      cv.setPointerCapture(e.pointerId);
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 1) {
        drag = { x: e.clientX, y: e.clientY, cx: rend().cam.x, cy: rend().cam.y }; moved = false;
        clearTimeout(lp);
        lp = setTimeout(function () { if (!moved && drag) { drag = null; UI.longPress(e.clientX, e.clientY); } }, 520);
      } else if (ids.length === 2) {
        clearTimeout(lp); drag = null; moved = true;
        var a = pts[ids[0]], b = pts[ids[1]];
        pinch = { d: Math.hypot(a.x - b.x, a.y - b.y), mx: (a.x + b.x) / 2, my: (a.y + b.y) / 2, s: rend().s };
      }
    });
    cv.addEventListener('pointermove', function (e) {
      if (!pts[e.pointerId]) { if (UI.game && e.pointerType === 'mouse') UI.hover(e.clientX, e.clientY); return; }
      pts[e.pointerId] = { x: e.clientX, y: e.clientY };
      var ids = Object.keys(pts);
      if (ids.length === 2 && pinch) {
        var a = pts[ids[0]], b = pts[ids[1]];
        var d = Math.hypot(a.x - b.x, a.y - b.y), mx = (a.x + b.x) / 2, my = (a.y + b.y) / 2;
        var r = rend(); var target = pinch.s * d / pinch.d;
        r.zoomAt(target / r.s, mx, my);
        r.cam.x -= mx - pinch.mx; r.cam.y -= my - pinch.my; pinch.mx = mx; pinch.my = my;
        r.clampCam(); r.request();
      } else if (drag) {
        var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
        if (!moved && Math.hypot(dx, dy) > 8) { moved = true; clearTimeout(lp); }
        if (moved) { var r2 = rend(); r2.cam.x = drag.cx - dx; r2.cam.y = drag.cy - dy; r2.clampCam(); r2.request(); }
      }
    });
    function up(e) {
      if (!pts[e.pointerId]) return;
      delete pts[e.pointerId];
      clearTimeout(lp);
      if (Object.keys(pts).length < 2) pinch = null;
      if (drag && !moved && Object.keys(pts).length === 0) {
        if (e.button === 2) UI.rightClick(e.clientX, e.clientY); else UI.tap(e.clientX, e.clientY);
      }
      if (Object.keys(pts).length === 0) drag = null;
    }
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    cv.addEventListener('wheel', function (e) { e.preventDefault(); if (!UI.game) return; rend().zoomAt(e.deltaY < 0 ? 1.12 : 1 / 1.12, e.clientX, e.clientY); }, { passive: false });
    window.addEventListener('resize', function () { if (UI.rend) UI.rend.resize(); });
    $('zin').onclick = function () { rend().zoomAt(1.25); };
    $('zout').onclick = function () { rend().zoomAt(0.8); };
    $('zyield').onclick = function () { rend().showYields = !rend().showYields; UI.settings.yields = rend().showYields; UI.saveSettings(); rend().request(); };
    $('minimap').addEventListener('pointerdown', function (e) {
      var r = e.target.getBoundingClientRect(), m = UI.game.map;
      var fx = (e.clientX - r.left) / r.width, fy = (e.clientY - r.top) / r.height;
      var t = Hex.idx(Math.floor(fx * m.W), Math.floor(fy * m.H));
      if (t >= 0) rend().centerOn(t, true);
    });
    $('btn-endturn').onclick = function () { UI.endTurnButton(); };
    $('btn-skipall').onclick = function () { UI.endTurn(); };
    document.querySelectorAll('#sidemenu .sbtn').forEach(function (b) { b.onclick = function () { G.Screens.open(b.getAttribute('data-act')); }; });
    ['st-gold', 'st-sci', 'st-cul', 'st-faith', 'st-happy', 'st-tour'].forEach(function (id) {
      $(id).onclick = function () { G.Screens.statInfo(id); };
    });
    $('research-chip').onclick = function () { G.Screens.open('tech'); };
    window.addEventListener('keydown', UI.key);
  };

  UI.key = function (e) {
    if (!UI.game || UI.busy) return;
    if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT')) return;
    var r = UI.rend, step = 80, u = UI.sel != null ? UI.game.units[UI.sel] : null;
    var k = e.key;
    if (k === 'Escape') { if (modalStack.length) { modalStack[modalStack.length - 1](); return; } if (UI.mode === 'city') { UI.closeCity(); return; } UI.cancelMode(); UI.deselect(); return; }
    if (modalStack.length) return;
    if (k === 'ArrowLeft') r.cam.x -= step; else if (k === 'ArrowRight') r.cam.x += step; else if (k === 'ArrowUp') r.cam.y -= step; else if (k === 'ArrowDown') r.cam.y += step;
    else if (k === 'Enter') UI.endTurnButton();
    else if (k === '+' || k === '=') r.zoomAt(1.2); else if (k === '-') r.zoomAt(0.83);
    else if (k === 't' || k === 'T') G.Screens.open('tech');
    else if (k === 'p' || k === 'P') G.Screens.open('policies');
    else if (k === 'y' || k === 'Y') { r.showYields = !r.showYields; }
    else if (u) {
      if (k === ' ') UI.unitAct(u, 'skip'); else if (k === 'f' || k === 'F') UI.unitAct(u, 'fortify'); else if (k === 's' || k === 'S') UI.unitAct(u, 'sleep');
      else if (k === 'b' || k === 'B') { if (U.specialActions(UI.game, u).some(function (a) { return a.id === 'found'; })) UI.unitAct(u, 'found'); }
      else if (k === 'a' || k === 'A') UI.unitAct(u, 'automate'); else if (k === 'e' || k === 'E') UI.unitAct(u, 'explore');
      else if (k === 'Delete') UI.unitAct(u, 'disband');
      else if (k === 'n' || k === 'N' || k === 'Tab') { e.preventDefault(); UI.nextUnit(); }
      else return;
    } else return;
    r.clampCam(); r.request();
    e.preventDefault();
  };

  var hoverT = null;
  UI.hover = function (x, y) {
    var u = UI.sel != null ? UI.game.units[UI.sel] : null;
    if (!u || UI.mode) return;
    clearTimeout(hoverT);
    hoverT = setTimeout(function () {
      var t = UI.rend.screenToTile(x, y);
      if (t < 0 || t === u.tile) { UI.rend.path = null; UI.rend.request(); return; }
      UI.showPath(u, t, true);
    }, 40);
  };

  UI.longPress = function (x, y) {
    var t = UI.rend.screenToTile(x, y);
    if (t >= 0) G.Screens.tileInfo(t);
  };
  UI.rightClick = function (x, y) {
    var t = UI.rend.screenToTile(x, y), u = UI.sel != null ? UI.game.units[UI.sel] : null;
    if (t < 0) return;
    if (u && u.owner === UI.game.humanId) { UI.commandTo(u, t, true); return; }
    G.Screens.tileInfo(t);
  };

  // ---------- Tap logic ----------
  UI.tap = function (x, y) {
    if (UI.busy) return;
    var game = UI.game, t = UI.rend.screenToTile(x, y);
    if (t < 0) return;
    var vis = UI.rend.visibility(t);
    if (UI.mode === 'city') { G.Screens.cityTap(t); return; }
    if (UI.mode && UI.mode.type) { UI.modeTap(t); return; }
    var u = UI.sel != null ? game.units[UI.sel] : null;
    var mine = vis === 2 ? E.unitsAt(game, t).filter(function (o) { return o.owner === game.humanId; }) : [];
    var city = E.cityAt(game, t);
    if (u) {
      if (t === u.tile) {
        // cycle units on this tile, or open city
        var others = mine.filter(function (o) { return o !== u; });
        if (others.length) { UI.select(others[0]); return; }
        if (city && city.owner === game.humanId) { UI.openCity(city); return; }
        UI.deselect(); return;
      }
      var info = U.attackInfo(game, u, t);
      if (info && vis === 2) { G.Screens.combatPreview(u, t, info); return; }
      if (mine.length && !U.canStop(game, u, t) && !(UI.pending && UI.pending.t === t)) { UI.select(mine[0]); return; }
      if (city && city.owner === game.humanId && !mine.length && Hex.distance(u.tile, t) > 1 && !(UI.pending && UI.pending.t === t) && !(UI.rend.reach && UI.rend.reach[t])) { UI.openCity(city); return; }
      UI.commandTo(u, t, false);
      return;
    }
    if (mine.length) {
      var pick = mine.filter(function (o) { return U.needsOrders(game, o); })[0] || mine.filter(function (o) { return U.isMilitary(o); })[0] || mine[0];
      if (city && city.owner === game.humanId && !mine.some(function (o) { return U.needsOrders(game, o); })) { UI.openCity(city); return; }
      UI.select(pick); return;
    }
    if (city && city.owner === game.humanId) { UI.openCity(city); return; }
    if (city && vis) { G.Screens.foreignCity(city); return; }
    UI.rend.selTile = t; UI.rend.request();
    G.Screens.tileInfo(t, true);
  };

  UI.commandTo = function (u, t, immediate) {
    var game = UI.game;
    if (D.UNITS[u.type].domain === 'air') { UI.toast('Air units: use Strike or Rebase.'); return; }
    if (u.moves <= 1e-6) {
      var path0 = U.findPath(game, u, t);
      if (!path0) { UI.toast("Can't reach that tile."); return; }
      u.orders = { type: 'goto', target: t }; u.fortify = 0; u.sleep = false; u.automate = false; u.explore = false;
      UI.toast('Will move next turn.'); UI.afterUnitAction(u); return;
    }
    var reach = UI.rend.reach || {};
    if (!immediate && !reach[t] && !(UI.pending && UI.pending.t === t && UI.pending.u === u.id)) {
      var ok = UI.showPath(u, t, false);
      if (ok) { UI.pending = { u: u.id, t: t }; UI.toast('Tap again to move (' + ok + ' turns)'); }
      else UI.toast("Can't reach that tile.");
      return;
    }
    UI.pending = null;
    UI.moveUnit(u, t);
  };
  UI.showPath = function (u, t, quiet) {
    var game = UI.game;
    var path = U.findPath(game, u, t, { limit: 4000 });
    if (!path) { UI.rend.path = null; UI.rend.request(); return 0; }
    // compute turn markers
    var maxMv = U.maxMoves(game, u), left = u.moves, turn = 1, from = u.tile, out = [];
    for (var i = 0; i < path.length; i++) {
      var c = U.moveCost(game, u, from, path[i]);
      if (left <= 1e-6) { turn++; left = maxMv; }
      left = c >= 99 ? 0 : Math.max(0, left - c);
      out.push({ t: path[i], turn: (left <= 1e-6 || i === path.length - 1) && turn > 1 ? turn : (i === path.length - 1 ? 1 : 0) });
      from = path[i];
    }
    UI.rend.path = out; UI.rend.request();
    return turn;
  };
  UI.moveUnit = function (u, t) {
    var game = UI.game, from = u.tile;
    var steps = U.moveTo(game, u, t);
    if (steps.length) UI.rend.animateMove(u, from, u.tile);
    UI.rend.path = null;
    UI.afterUnitAction(u);
  };
  UI.afterUnitAction = function (u) {
    var game = UI.game;
    UI.rend._miniDirty = true;
    if (u && game.units[u.id]) {
      if (u.moves <= 1e-6 && UI.settings.autoNext !== false) { UI.refresh(); setTimeout(function () { if (UI.sel === u.id) UI.nextUnit(true); }, 260); }
      else UI.select(u, true);
    } else { UI.deselect(); if (UI.settings.autoNext !== false) setTimeout(function () { UI.nextUnit(true); }, 200); }
    UI.refresh();
  };

  UI.select = function (u, keepCam) {
    var game = UI.game;
    UI.sel = u.id; UI.pending = null;
    var r = UI.rend;
    r.selected = u.id; r.selTile = null; r.path = null;
    r.reach = u.owner === game.humanId ? U.reachable(game, u) : null;
    var at = {};
    if (u.owner === game.humanId) {
      var d = D.UNITS[u.type], range = d.rs ? (d.range || 1) + (u.promos.indexOf('range') >= 0 ? 1 : 0) : 1;
      Hex.within(u.tile, Math.min(range, 3)).forEach(function (t) { if (U.attackInfo(game, u, t) && r.visibility(t) === 2) at[t] = 1; });
      if (d.domain === 'air') Hex.within(u.tile, Math.min(d.range, 10)).forEach(function (t) { if (U.attackInfo(game, u, t) && r.visibility(t) === 2) at[t] = 1; });
    }
    r.attackTiles = at;
    if (!keepCam) { var sp = r.tileScreen(u.tile); if (sp.x < 60 || sp.x > r.cw - 60 || sp.y < 80 || sp.y > r.ch - 160) r.centerOn(u.tile, true); }
    r.request();
    UI.unitPanel();
  };
  UI.deselect = function () {
    UI.sel = null; UI.pending = null;
    if (UI.rend) { UI.rend.selected = null; UI.rend.reach = null; UI.rend.path = null; UI.rend.attackTiles = null; UI.rend.request(); }
    $('unitpanel').classList.add('hidden');
  };
  UI.nextUnit = function (auto) {
    var game = UI.game, h = human();
    var list = h.units.map(function (id) { return game.units[id]; }).filter(function (u) { return u && U.needsOrders(game, u); });
    if (!list.length) { UI.deselect(); UI.refresh(); if (!auto) UI.toast('All units have orders.'); return; }
    var cur = list.map(function (u) { return u.id; }).indexOf(UI.sel);
    var nu = list[(cur + 1) % list.length];
    UI.select(nu);
  };

  // ---------- Unit panel ----------
  UI.unitPanel = function () {
    var game = UI.game, u = UI.sel != null ? game.units[UI.sel] : null, panel = $('unitpanel');
    if (!u) { panel.classList.add('hidden'); return; }
    panel.classList.remove('hidden'); panel.className = 'hud frame';
    panel.innerHTML = '';
    var d = D.UNITS[u.type], p = game.players[u.owner];
    var cv = el('canvas', { width: 128, height: 128 });
    try { var spr = G.Render.P.unit(56, u.type, p.color, p.color2); var cx = cv.getContext('2d'); cx.drawImage(spr.c, 64 - spr.ax, 112 - spr.ay); } catch (e) { }
    var stats = [];
    if (d.str) stats.push('⚔ ' + d.str);
    if (d.rs) stats.push('🏹 ' + d.rs + ' (r' + ((d.range || 1) + (u.promos.indexOf('range') >= 0 ? 1 : 0)) + ')');
    stats.push('👣 ' + (Math.round(u.moves * 10) / 10) + '/' + U.maxMoves(game, u));
    if (U.isMilitary(u)) stats.push('XP ' + Math.round(u.xp) + '/' + (D.XP_LEVELS[u.level] || '—'));
    if (u.build) stats.push('⚒ ' + u.build.what.replace(/_/g, ' ') + ' (' + Math.ceil(u.build.left) + 't)');
    if (u.spreads && (u.type === 'missionary' || u.type === 'great_prophet')) stats.push('Spreads ' + u.spreads);
    var title = (u.name ? u.name + ' — ' : '') + d.name + (p.id !== game.humanId ? ' (' + p.adj + ')' : '');
    var promos = u.promos.map(function (k) { return D.PROMOTIONS[k] ? D.PROMOTIONS[k].name : k; }).join(', ');
    panel.appendChild(el('div', { class: 'uhead' }, [cv, el('div', { style: { flex: 1, minWidth: 0 } }, [
      el('div', { class: 'uname' }, [title]),
      el('div', { class: 'ustats' }, [el('span', {}, [el('span', { class: 'hpbar' }, [el('div', { style: { width: u.hp + '%' } })]), ' ' + Math.round(u.hp) + ' HP'])].concat(stats.map(function (s) { return el('span', {}, [s]); }))),
      promos ? el('div', { class: 'small' }, [promos]) : null,
      d.uniqueDesc ? el('div', { class: 'small' }, ['Unique: ' + d.uniqueDesc]) : null
    ]), el('button', { class: 'xbtn', onclick: function () { UI.deselect(); } }, ['✕'])]));
    if (u.owner !== game.humanId) return;
    var acts = el('div', { class: 'uacts' });
    function A(label, id, cls) { acts.appendChild(btn(label, function () { UI.unitAct(u, id); }, cls)); }
    U.specialActions(game, u).forEach(function (a) { acts.appendChild(btn(a.name, function () { UI.unitAct(u, a.id, a.imp); }, 'primary')); });
    if (u.pendingPromo) A('★ Promote', 'promote', 'primary');
    var builds = U.buildOptions(game, u);
    if (builds.length && !u.build) A('⚒ Build…', 'build');
    if (d.flags && d.flags.indexOf('build') >= 0) A(u.automate ? 'Stop Auto' : 'Automate', 'automate');
    if (d.domain === 'air') { if (d.cls === 'nuke') A('☢ Launch…', 'nuke', 'danger'); else { A('Strike…', 'strike'); } A('Rebase…', 'rebase'); }
    if (U.isMilitary(u) && d.domain !== 'air') {
      if (d.rs) A('🏹 Ranged…', 'ranged');
      if (d.cls !== 'mounted' && d.cls !== 'armor' && d.domain === 'land') A(u.fortify > 0 ? 'Fortified' : 'Fortify', 'fortify'); else A('Sleep', 'sleep');
      if (u.hp < 100) A('Heal', 'heal');
      var m = game.map;
      if (m.imp[u.tile] && !m.pillaged[u.tile] && m.owner[u.tile] >= 0 && m.owner[u.tile] !== u.owner && E.atWar(game, u.owner, m.owner[u.tile])) A('Pillage', 'pillage', 'danger');
      var up = U.canUpgrade(game, u);
      if (up) acts.appendChild(btn('⬆ ' + D.UNITS[up.to].name + ' (' + up.cost + 'g)', function () { UI.unitAct(u, 'upgrade'); }, '', !up.afford || u.moves <= 0));
    } else if (d.cls !== 'gp' || true) { if (!u.build) A('Sleep', 'sleep'); }
    if (d.cls === 'recon' || d.domain === 'sea') A(u.explore ? 'Stop Explore' : 'Explore', 'explore');
    if (u.orders || u.sleep || u.fortify > 0 || u.build) A('Wake', 'wake');
    A('Skip', 'skip');
    A('🗑', 'disband', 'danger');
    panel.appendChild(acts);
  };

  UI.unitAct = function (u, id, arg) {
    var game = UI.game, p = human();
    switch (id) {
      case 'skip': u.orders = { type: 'skip', turn: game.turn }; UI.nextUnit(true); break;
      case 'fortify': u.fortify = Math.max(1, u.fortify || 0); u.orders = { type: 'fortify' }; UI.nextUnit(true); break;
      case 'sleep': u.sleep = true; u.orders = null; UI.nextUnit(true); break;
      case 'heal': u.orders = { type: 'heal' }; u.fortify = Math.max(1, u.fortify || 0); UI.nextUnit(true); break;
      case 'wake': u.sleep = false; u.fortify = 0; u.orders = null; u.build = null; u.automate = false; u.explore = false; UI.select(u, true); break;
      case 'automate': u.automate = !u.automate; u.orders = null; if (u.automate) { G.AI.workerAuto(game, u); UI.afterUnitAction(u); } else UI.select(u, true); break;
      case 'explore': u.explore = !u.explore; if (u.explore) { var from = u.tile; G.AI.explore(game, u); UI.rend.animateMove(u, from, u.tile); UI.afterUnitAction(u); } else UI.select(u, true); break;
      case 'disband': UI.confirm('Disband unit?', 'Permanently remove this ' + D.UNITS[u.type].name + '?', function () { var c = E.cityAt(game, u.tile); if (c && c.owner === p.id && D.UNITS[u.type].cost) { var g = Math.round(R.productionCost(game, p, 'unit', u.type) * 0.1); p.gold += g; } E.removeUnit(game, u, 'disband'); UI.afterUnitAction(null); }, 'Disband'); break;
      case 'pillage': if (U.pillage(game, u)) { UI.rend.floatText(u.tile, '+20 gold', '#ffd34a'); } UI.afterUnitAction(u); break;
      case 'upgrade': if (U.upgrade(game, u)) UI.toast('Upgraded!'); UI.select(u, true); UI.refresh(); break;
      case 'promote': G.Screens.promotions(u); break;
      case 'build': G.Screens.buildMenu(u); break;
      case 'ranged': UI.setMode({ type: 'ranged', unit: u.id }); UI.toast('Tap a target in range'); break;
      case 'strike': UI.setMode({ type: 'strike', unit: u.id }); UI.toast('Tap a target to strike'); break;
      case 'nuke': UI.setMode({ type: 'nuke', unit: u.id }); UI.toast('Tap a target tile for the nuclear strike'); break;
      case 'rebase': G.Screens.rebase(u); break;
      case 'trade': G.Screens.tradeRoute(u); break;
      case 'found': {
        var t = u.tile, r = U.doAction(game, u, 'found');
        if (r && r.city) { UI.rend.flash(t, 'rgba(255,230,120,0.8)'); UI.afterUnitAction(null); UI.openCity(r.city); }
        break;
      }
      case 'found_religion': G.Screens.foundReligion(u, false); break;
      case 'enhance_religion': G.Screens.foundReligion(u, true); break;
      default: {
        var res = U.doAction(game, u, id, arg);
        if (res) { UI.rend.flash(u.tile); UI.afterUnitAction(game.units[u.id] ? u : null); }
        else UI.toast('Cannot do that here.');
      }
    }
    UI.refresh();
  };

  // ---------- Modes (targeting) ----------
  UI.setMode = function (m) { UI.mode = m; UI.rend.request(); };
  UI.cancelMode = function () { if (UI.mode && UI.mode !== 'city') UI.mode = null; };
  UI.modeTap = function (t) {
    var game = UI.game, m = UI.mode, u = game.units[m.unit];
    UI.mode = null;
    if (!u) return;
    if (m.type === 'ranged' || m.type === 'strike') {
      var info = U.attackInfo(game, u, t);
      if (info) G.Screens.combatPreview(u, t, info); else UI.toast('No valid target there.');
    } else if (m.type === 'nuke') {
      var d = D.UNITS[u.type];
      if (Hex.distance(u.tile, t) > d.range) { UI.toast('Out of range (' + d.range + ').'); return; }
      UI.confirm('Launch nuclear weapon?', 'This will devastate the target area and anger every civilization.', function () { var r = U.nuke(game, u, t); if (r) { UI.rend.flash(t, null, r.radius); } UI.afterUnitAction(null); }, '☢ Launch');
    }
  };

  // ---------- Combat ----------
  UI.doAttack = function (u, t) {
    var game = UI.game, from = u.tile;
    var res = U.attack(game, u, t);
    if (!res) return;
    var r = UI.rend;
    if (res.dmgDef) r.floatText(t, '-' + res.dmgDef, '#ff6a4a');
    if (res.dmgAtk) r.floatText(from, '-' + res.dmgAtk, '#ffb04a');
    r.flash(t, 'rgba(255,120,60,0.85)');
    if (res.defenderDied) r.floatText(t, '☠', '#ffffff');
    if (res.attackerDied) r.floatText(from, '☠', '#ffffff');
    if (game.units[u.id] && u.tile !== from) r.animateMove(u, from, u.tile);
    if (res.capturedCity && res.needChoice) G.Screens.captureChoice(res.capturedCity);
    UI.afterUnitAction(game.units[u.id] ? u : null);
    UI.checkGameOver();
  };

  // ---------- City ----------
  UI.openCity = function (c) {
    UI.deselect();
    UI.mode = 'city'; UI.cityId = c.id;
    UI.rend.cityFocus = c.id;
    document.body.classList.add('citymode');
    G.Screens.cityPanel(c);
    var pr = $('citypanel').getBoundingClientRect(), r = UI.rend;
    if (pr.width > r.cw * 0.8) r.centerOn(c.tile, true, 0, (r.ch - pr.top) / 2 + 10);
    else r.centerOn(c.tile, true, (r.cw - pr.left) / 2, 0);
  };
  UI.closeCity = function () {
    UI.mode = null; UI.cityId = null; UI.rend.cityFocus = null;
    document.body.classList.remove('citymode');
    $('citypanel').classList.add('hidden'); UI.rend.request(); UI.refresh();
  };

  // ---------- HUD ----------
  UI.refresh = function () {
    var game = UI.game; if (!game) return;
    var h = human();
    var hap = E.happiness(game, h);
    var ly = h.lastYields || {};
    var cost = R.policyCost(game, h);
    $('st-gold').innerHTML = '💰 <span class="v">' + Math.floor(h.gold) + '</span> <span class="d ' + ((ly.gpt || 0) >= 0 ? 'good' : 'bad') + '">' + fmt(ly.gpt || 0) + '</span>';
    $('st-sci').innerHTML = '⚗ <span class="d sci">' + fmt(ly.sci || 0) + '</span>';
    $('st-cul').innerHTML = '🎭 <span class="v">' + Math.floor(h.culture) + '/' + cost + '</span> <span class="d cul">' + fmt(ly.cul || 0) + '</span>';
    $('st-faith').innerHTML = '🕊 <span class="v">' + Math.floor(h.faith) + '</span> <span class="d">' + fmt(ly.faith || 0) + '</span>';
    $('st-happy').innerHTML = (hap.net >= 0 ? '☺' : '☹') + ' <span class="v ' + (hap.net >= 0 ? 'good' : 'bad') + '">' + hap.net + '</span>' + (h.gaTurns > 0 ? ' <span class="d gold">Golden Age ' + h.gaTurns + '</span>' : ' <span class="d">GA ' + Math.floor(h.gaProgress) + '/' + R.goldenAgeThreshold(game, h) + '</span>');
    $('st-tour').innerHTML = '✈ <span class="d">' + Math.round(h.tourism || 0) + '</span>';
    $('st-turn').textContent = 'Turn ' + game.turn + ' · ' + E.yearOf(game);
    // research chip
    var chip = $('research-chip'); chip.className = 'hud frame';
    if (h.researching) {
      var tc = R.techCost(game, h, h.researching), pr = h.techProgress[h.researching] || 0;
      var turns = ly.sci > 0 ? Math.max(1, Math.ceil((tc - pr) / ly.sci)) : '∞';
      chip.innerHTML = '⚗ <b>' + D.TECHS[h.researching].name + '</b> <span class="small">(' + turns + ' turns)</span><div class="bar"><div style="width:' + Math.min(100, pr / tc * 100) + '%"></div></div>';
    } else chip.innerHTML = '<span class="bad">⚗ Choose research!</span>';
    // side menu alerts
    var alerts = { tech: !h.researching || h.freeTechs > 0, policies: E.canAffordPolicy(game, h) && hasPolicyChoice(game, h), religion: !!h.pantheonReady && !h.pantheon };
    document.querySelectorAll('#sidemenu .sbtn').forEach(function (b) { b.classList.toggle('alert', !!alerts[b.getAttribute('data-act')]); });
    UI.updateEndTurn();
    UI.renderNotes();
    if (UI.sel != null) UI.unitPanel();
    if (UI.rend) { UI.rend.drawMinimap($('minimap')); UI.rend.request(); }
  };
  function hasPolicyChoice(game, h) {
    for (var t in D.POLICY_TREES) if (E.canAdoptTree(game, h, t)) return true;
    for (t in D.POLICY_TREES) for (var pk in D.POLICY_TREES[t].policies) if (E.canAdoptPolicy(game, h, pk)) return true;
    return false;
  }
  UI.blockers = function () {
    var game = UI.game, h = human(), out = [];
    var needs = h.units.map(function (id) { return game.units[id]; }).filter(function (u) { return u && U.needsOrders(game, u); });
    if (needs.length) out.push({ kind: 'unit', label: 'Unit Needs Orders', u: needs[0] });
    var idle = h.cities.map(function (id) { return game.cities[id]; }).filter(function (c) { return c && !c.build && !c.puppet; });
    if (idle.length) out.push({ kind: 'city', label: 'Choose Production', c: idle[0] });
    if (!h.researching && E.researchOptions(h).length) out.push({ kind: 'tech', label: 'Choose Research' });
    if (h.freeTechs > 0) out.push({ kind: 'tech', label: 'Free Technology' });
    if (E.canAffordPolicy(game, h) && hasPolicyChoice(game, h)) out.push({ kind: 'policy', label: 'Choose Policy' });
    if (h.pantheonReady && !h.pantheon) out.push({ kind: 'pantheon', label: 'Found Pantheon' });
    if (h.freeGPChoice > 0) out.push({ kind: 'gp', label: 'Choose Great Person' });
    var promo = h.units.map(function (id) { return game.units[id]; }).filter(function (u) { return u && u.pendingPromo > 0; });
    if (promo.length && UI.settings.promoBlock !== false) out.push({ kind: 'promo', label: 'Promotion Available', u: promo[0] });
    return out;
  };
  UI.updateEndTurn = function () {
    var b = $('btn-endturn'), bl = UI.blockers();
    if (UI.game.victory) { b.textContent = 'Game Over'; b.classList.add('attn'); return; }
    if (bl.length) { b.textContent = bl[0].label; b.classList.add('attn'); }
    else { b.textContent = 'End Turn'; b.classList.remove('attn'); }
  };
  UI.endTurnButton = function () {
    if (UI.busy) return;
    if (UI.game.victory) { G.Screens.victory(); return; }
    var bl = UI.blockers();
    if (!bl.length) { UI.endTurn(); return; }
    var b = bl[0];
    if (b.kind === 'unit') { UI.closeCityIfOpen(); UI.select(b.u); }
    else if (b.kind === 'city') UI.openCity(b.c);
    else if (b.kind === 'tech') G.Screens.open('tech');
    else if (b.kind === 'policy') G.Screens.open('policies');
    else if (b.kind === 'pantheon') G.Screens.open('religion');
    else if (b.kind === 'gp') G.Screens.chooseGP();
    else if (b.kind === 'promo') { UI.select(b.u); G.Screens.promotions(b.u); }
  };
  UI.closeCityIfOpen = function () { if (UI.mode === 'city') UI.closeCity(); };

  // ---------- Notifications ----------
  var ICONS = { info: 'ℹ', bad: '⚠', good: '✔', war: '⚔', diplo: '🤝', tech: '⚗', prod: '⚒', city: '🏛', wonder: '🏆', world: '🌍', faith: '🕊', gp: '★', era: '⌛' };
  UI.renderNotes = function () {
    var game = UI.game, h = human(), box = $('notes');
    box.innerHTML = '';
    var recent = h.notes.filter(function (n) { return n.turn >= game.turn - 1 && !n.dismissed && n.text; }).slice(-5);
    recent.forEach(function (n) {
      var d = el('div', { class: 'note ' + (n.kind || ''), 'data-icon': ICONS[n.kind] || 'ℹ', onclick: function () { n.dismissed = true; if (n.tile != null) UI.rend.centerOn(n.tile, true); UI.renderNotes(); } }, [n.text]);
      box.appendChild(d);
    });
  };

  // ---------- Turn flow ----------
  UI.beginHumanTurn = function (first) {
    var game = UI.game, h = human();
    // execute standing orders
    h.units.slice().forEach(function (id) {
      var u = game.units[id]; if (!u) return;
      if (u.orders && u.orders.type === 'skip') u.orders = null;
      if (u.automate && D.UNITS[u.type].flags && D.UNITS[u.type].flags.indexOf('build') >= 0 && !u.build) { try { G.AI.workerAuto(game, u); } catch (e) { console.error(e); } }
      else if (u.explore && u.moves > 0) { try { G.AI.explore(game, u); if (!u.explore) E.note(game, h, 'Exploration complete for a ' + D.UNITS[u.type].name + '.', u.tile, 'info'); } catch (e) { console.error(e); } }
      else if (u.orders && u.orders.type === 'goto' && u.moves > 0) {
        var tgt = u.orders.target; U.moveTo(game, u, tgt);
        if (u.tile !== tgt && !u.orders) E.note(game, h, 'A ' + D.UNITS[u.type].name + ' could not reach its destination.', u.tile, 'info');
      }
      // wake sleeping units when enemies approach
      if ((u.sleep || u.fortify > 0) && U.isMilitary(u)) {
        var danger = Hex.within(u.tile, 2).some(function (t) { var o = U.militaryOn(game, t); return o && E.atWar(game, h.id, o.owner); });
        if (danger && u.sleep) { u.sleep = false; E.note(game, h, 'Enemy sighted near your ' + D.UNITS[u.type].name + '!', u.tile, 'war'); }
      }
    });
    E.updateVisibility(game, h);
    UI.rend._miniDirty = true;
    UI.refresh();
    if (!first || game.turn === 0) {
      var bl = UI.blockers();
      var nu = bl.filter(function (b) { return b.kind === 'unit'; })[0];
      if (nu) UI.select(nu.u);
    }
    if (game.turn === 0 && first) G.Screens.welcome();
  };
  UI.endTurn = function () {
    if (UI.busy || !UI.game || (UI.game.victory && UI.game.victory.type === 'defeat')) return;
    UI.closeCityIfOpen(); UI.deselect(); UI.closeAllModals();
    var game = UI.game, i = 0, n = game.players.length;
    UI.busy = true;
    $('busy').classList.remove('hidden');
    var t0 = performance.now();
    function step() {
      var start = performance.now();
      while (i < n && performance.now() - start < 30) {
        var p = game.players[i];
        if (!p.isHuman && p.alive) { $('busy-text').textContent = p.isBarb ? 'Barbarians' : p.name; }
        try { E.runAI(game, i); } catch (e) { console.error('AI error', e); }
        i++;
      }
      $('busy-fill').style.width = Math.round(i / n * 100) + '%';
      if (i < n) { setTimeout(step, 0); return; }
      try { E.finishTurn(game); } catch (e) { console.error(e); }
      UI.busy = false;
      $('busy').classList.add('hidden');
      UI.beginHumanTurn(false);
      UI.autosave();
      UI.checkGameOver();
    }
    setTimeout(step, 20);
  };
  UI.autosave = function () {
    if (UI.settings.autosave === false) return;
    var game = UI.game;
    try { G.Save.saveGame(game, 'Autosave').then(function (ok) { if (!ok) UI.toast('Autosave failed (storage full?)'); }); } catch (e) { console.warn(e); }
    if (UI.settings.cloudAuto !== false && game.turn % 5 === 0 && !UI.cloudSaving) {
      UI.cloudSaving = true;
      G.Save.cloudSave('Cloud Autosave', game).then(function () { UI.cloudSaving = false; }, function () { UI.cloudSaving = false; });
    }
  };
  UI.checkGameOver = function () {
    var game = UI.game;
    if (game.victory && !game.victoryShown) { game.victoryShown = true; G.Screens.victory(); }
  };

  // ---------- Settings ----------
  UI.loadSettings = function () { try { UI.settings = JSON.parse(localStorage.getItem('aoe_settings') || '{}'); } catch (e) { UI.settings = {}; } };
  UI.saveSettings = function () { try { localStorage.setItem('aoe_settings', JSON.stringify(UI.settings)); } catch (e) { } };

  // engine events -> UI
  E.on(function (ev) {
    var game = UI.game; if (!game) return;
    if (ev.type === 'combat' && UI.busy) {
      var res = ev.result, h = human();
      var a = res.attacker, defTile = res.tile;
      var hc = E.cityAt(game, defTile);
      if (hc && hc.owner === h.id && res.kind !== 'cityRanged') E.note(game, h, hc.name + ' was attacked by ' + (res.atkName || 'an enemy') + ' (-' + res.dmgDef + ' HP).', defTile, 'war');
      else if (res.defOwner === h.id) E.note(game, h, 'Your ' + res.defName + ' was attacked by ' + (res.atkName || 'an enemy') + (res.defenderDied ? ' and destroyed!' : ' (-' + res.dmgDef + ' HP).'), defTile, res.defenderDied ? 'bad' : 'war');
      if (res.kind === 'cityRanged' && res.defOwner === h.id) { }
    }
    if (ev.type === 'unitMoved' && UI.rend && !UI.busy) UI.rend.request();
  });

  // v2: sound effects for notable events (synthesized, see js/sfx.js).
  // Only events involving the human (or world news like wonders/nukes)
  // make noise; SFX.play throttles repeats during busy AI turns.
  E.on(function (ev) {
    var game = UI.game; if (!game || !G.SFX) return;
    var hid = game.humanId, mine = false;
    if (ev.city) mine = ev.city.owner === hid;
    if (ev.player != null) mine = ev.player === hid;
    if (ev.a != null) mine = ev.a === hid || ev.b === hid;
    switch (ev.type) {
      case 'newTurn': G.SFX.play('turn'); break;
      case 'cityFounded': if (mine) G.SFX.play('founded'); break;
      case 'cityCaptured': if (ev.by === hid) G.SFX.play('captured'); else if (ev.from === hid) G.SFX.play('war'); break;
      case 'tech': if (mine) G.SFX.play('tech'); break;
      case 'wonder': G.SFX.play('wonder'); break;
      case 'war': if (mine) G.SFX.play('war'); break;
      case 'peace': if (mine) G.SFX.play('peace'); break;
      case 'nuke': G.SFX.play('nuke'); break;
      case 'combat': {
        var res = ev.result;
        if (res && ((res.attacker && res.attacker.owner === hid) || res.defOwner === hid)) G.SFX.play(res.kind === 'ranged' || res.kind === 'cityRanged' ? 'ranged' : 'combat');
        break;
      }
      case 'gameOver': G.SFX.play(ev.victory && ev.victory.winner === hid ? 'victory' : 'defeat'); break;
    }
  });

  return UI;
})();
