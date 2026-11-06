// ============================================================
//  Screens: city, tech tree, policies, religion, diplomacy,
//  overview, civilopedia, menus, setup, popups
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Screens = (function () {
  var D = G.D, E = G.Engine, U = G.Units, R = G.Rules, Hex = G.Hex, IDS = G.IDS, Dp = G.Diplo, UI = G.UI;
  var el = UI.el, btn = UI.btn, fmt = UI.fmt, $ = UI.$;
  var S = {};
  function game() { return UI.game; }
  function human() { return UI.human(); }
  function yicons(y) {
    var o = [];
    if (y.f) o.push('🌾' + round1(y.f)); if (y.p) o.push('⚒' + round1(y.p)); if (y.g) o.push('💰' + round1(y.g));
    if (y.s) o.push('⚗' + round1(y.s)); if (y.c) o.push('🎭' + round1(y.c)); if (y.fa) o.push('🕊' + round1(y.fa));
    return o.join(' ');
  }
  function round1(n) { return Math.round(n * 10) / 10; }
  S.yicons = yicons;

  S.open = function (name) {
    if (UI.busy) return;
    if (name !== 'menu') UI.closeCityIfOpen();
    ({ tech: S.tech, policies: S.policies, religion: S.religion, diplo: S.diplo, overview: S.overview, pedia: S.pedia, menu: S.menu })[name]();
  };

  // =====================================================================
  //  CITY PANEL
  // =====================================================================
  var cityTab = 'prod';
  S.cityPanel = function (c) {
    var g = game(), p = g.players[c.owner], panel = $('citypanel');
    panel.className = 'frame'; panel.innerHTML = '';
    if (!g.cities[c.id] || c.owner !== g.humanId) { UI.closeCity(); return; }
    if (!c.manual) E.assignCitizens(g, c);
    var y = E.cityYields(g, c); c.lastYields = y;
    var mine = p.cities.map(function (id) { return g.cities[id]; }).filter(Boolean);
    var idx = mine.indexOf(c);
    var head = el('div', { class: 'chead' }, [
      btn('◀', function () { var n = mine[(idx - 1 + mine.length) % mine.length]; UI.openCity(n); }, 'sm'),
      el('div', { class: 'cname' }, [(c.capital ? '★ ' : '') + c.name]),
      btn('▶', function () { var n = mine[(idx + 1) % mine.length]; UI.openCity(n); }, 'sm'),
      el('button', { class: 'xbtn', onclick: function () { UI.closeCity(); } }, ['✕'])
    ]);
    panel.appendChild(head);
    var body = el('div', { class: 'cbody' });
    panel.appendChild(body);
    var need = R.foodToGrow(g, c.pop);
    var growT = y.surplus > 0 ? Math.ceil((need - c.food) / Math.max(0.1, y.surplus * (p.happy < 0 ? (p.happy <= -10 ? 0 : 0.25) : 1))) : null;
    var bc = R.borderCost(g, c, p);
    var info = el('div', {}, [
      el('div', { class: 'small' }, ['Population ' + c.pop + ' · Defense ' + Math.round(E.cityStrength(g, c)) + ' · HP ' + Math.round(c.hp) + '/' + E.cityMaxHp(g, c) + (c.puppet ? ' · Puppet' : '') + (c.occupied ? ' · Occupied' : '') + (c.resist ? ' · Resistance ' + c.resist : '') + (c.razing ? ' · RAZING' : '')]),
      el('div', { class: 'yrow' }, [
        el('span', { class: 'ychip' }, ['🌾 ' + fmt(y.surplus)]), el('span', { class: 'ychip' }, ['⚒ ' + round1(E.prodTowards(g, c, y))]),
        el('span', { class: 'ychip' }, ['💰 ' + round1(y.g)]), el('span', { class: 'ychip' }, ['⚗ ' + round1(y.s)]),
        el('span', { class: 'ychip' }, ['🎭 ' + round1(y.c)]), el('span', { class: 'ychip' }, ['🕊 ' + round1(y.fa)]), y.t ? el('span', { class: 'ychip' }, ['✈ ' + round1(y.t)]) : null
      ]),
      el('div', { class: 'small' }, ['Growth: ' + Math.floor(c.food) + '/' + need + (growT ? ' (' + growT + ' turns)' : y.surplus < 0 ? ' — starving!' : ' — stagnant')]),
      el('div', { class: 'prog food' }, [el('div', { style: { width: Math.min(100, c.food / need * 100) + '%' } })]),
      el('div', { class: 'small' }, ['Borders: ' + Math.floor(c.culture) + '/' + bc + (y.c > 0 ? ' (' + Math.ceil((bc - c.culture) / y.c) + ' turns)' : '')])
    ]);
    body.appendChild(info);
    if (c.puppet) body.appendChild(btn('Annex City', function () { c.puppet = false; c.occupied = !R.hasBuilding(c, 'courthouse'); S.cityPanel(c); UI.refresh(); }, 'primary'));
    if (c.razing) body.appendChild(btn('Stop Razing', function () { c.razing = false; S.cityPanel(c); }));
    else if (c.occupied && !c.originalCapital && !c.capital) body.appendChild(btn('Raze City', function () { UI.confirm('Raze ' + c.name + '?', 'The city will lose 1 population per turn until it is destroyed.', function () { c.razing = true; S.cityPanel(c); }); }, 'danger'));
    var tabs = el('div', { class: 'tabs' }, [['prod', 'Production'], ['build', 'Buildings'], ['cit', 'Citizens'], ['more', 'More']].map(function (tb) {
      return el('button', { class: 'tab' + (cityTab === tb[0] ? ' on' : ''), onclick: function () { cityTab = tb[0]; S.cityPanel(c); } }, [tb[1]]);
    }));
    body.appendChild(tabs);
    if (cityTab === 'prod') cityProd(body, c, y);
    else if (cityTab === 'build') cityBuildings(body, c);
    else if (cityTab === 'cit') cityCitizens(body, c, y);
    else cityMore(body, c, y);
    UI.rend.request();
  };
  function itemTurns(g, c, item, y) {
    if (item.kind === 'process') return '';
    var cost = E.itemCost(g, c, item), have = (c.build && c.build.kind === item.kind && c.build.id === item.id) ? c.prod : (c.build ? ((c.progress && c.progress[item.kind + ':' + item.id]) || 0) : c.prod + ((c.progress && c.progress[item.kind + ':' + item.id]) || 0));
    var pt = E.prodTowards(g, c, y);
    return Math.max(1, Math.ceil((cost - have) / Math.max(0.1, pt))) + ' t';
  }
  function itemDesc(item) {
    if (item.kind === 'unit') { var d = D.UNITS[item.id]; return (d.str ? '⚔' + d.str + ' ' : '') + (d.rs ? '🏹' + d.rs + ' ' : '') + '👣' + d.mv + (d.res ? ' · needs ' + D.RESOURCES[d.res].name : '') + (d.uniqueDesc ? ' · ' + d.uniqueDesc : '') + (d.desc ? ' · ' + d.desc : ''); }
    if (item.kind === 'building') { var b = D.BUILDINGS[item.id]; return bldDesc(b); }
    if (item.kind === 'wonder') return D.WONDERS[item.id].desc || '';
    if (item.kind === 'space') return 'Spaceship part for Science Victory';
    if (item.kind === 'process') return item.id === 'wealth' ? 'Convert 25% production to gold' : 'Convert 25% production to science';
    return '';
  }
  function bldDesc(b) {
    var o = [];
    if (b.y) o.push(yicons(b.y));
    if (b.perPop) o.push('+' + yicons(b.perPop) + '/pop');
    if (b.pct) { for (var k in b.pct) o.push('+' + b.pct[k] + '% ' + D.YIELD_NAMES[k]); }
    if (b.happy) o.push('+' + b.happy + ' ☺');
    if (b.def) o.push('+' + b.def + ' defense');
    if (b.hp) o.push('+' + b.hp + ' HP');
    if (b.xp) o.push('+' + b.xp + ' XP');
    if (b.foodKeep) o.push('keeps ' + b.foodKeep + '% food');
    if (b.seaY) o.push(yicons(b.seaY) + ' on water');
    if (b.slots) for (var s in b.slots) o.push(b.slots[s] + ' ' + s + ' slot');
    if (b.works) for (var w in b.works) o.push(b.works[w] + ' great work (' + w + ')');
    if (b.tourismPct) o.push('+' + b.tourismPct + '% tourism');
    if (b.gppPct) o.push('+' + b.gppPct + '% Great People');
    if (b.unitPct) for (var u in b.unitPct) o.push('+' + b.unitPct[u] + '% ' + u + ' units');
    if (b.maint) o.push('-' + b.maint + ' gpt');
    if (b.national) o.push('National Wonder');
    if (b.freeTech) o.push('Free tech');
    return o.join(' · ');
  }
  S.bldDesc = bldDesc;
  function cityProd(body, c, y) {
    var g = game(), p = human();
    // current
    if (c.build) {
      var cost = E.itemCost(g, c, c.build);
      var pc = R.purchaseCost(g, p, c, c.build.kind, c.build.id);
      body.appendChild(el('div', { class: 'sect' }, ['Producing']));
      body.appendChild(el('div', { class: 'item sel' }, [el('div', { class: 'nm' }, [E.itemName(c.build), el('span', { class: 'small' }, [c.build.kind === 'process' ? '' : Math.floor(c.prod) + '/' + cost + ' · ' + itemTurns(g, c, c.build, y)])]),
        pc > 0 ? btn('Buy ' + pc + 'g', function () { if (p.gold >= pc) { p.gold -= pc; c.prod = cost; UI.toast('Purchased! Completes next turn.'); S.cityPanel(c); UI.refresh(); } }, 'sm', p.gold < pc || c.resist > 0 || c.puppet) : null]));
      if (c.build.kind !== 'process') body.appendChild(el('div', { class: 'prog' }, [el('div', { style: { width: Math.min(100, c.prod / cost * 100) + '%' } })]));
    } else body.appendChild(el('div', { class: 'bad' }, ['Choose something to build. Stored production: ' + Math.floor(c.prod)]));
    if (c.queue.length) {
      body.appendChild(el('div', { class: 'sect' }, ['Queue']));
      c.queue.forEach(function (q, i) { body.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [(i + 1) + '. ' + E.itemName(q)]), btn('✕', function () { c.queue.splice(i, 1); S.cityPanel(c); }, 'sm')])); });
    }
    var opts = E.buildOptions(g, c);
    var groups = [['Units', 'unit'], ['Buildings', 'building'], ['Wonders & Projects', 'wonder'], ['Spaceship', 'space'], ['Other', 'process']];
    groups.forEach(function (gr) {
      var list = opts.filter(function (o) { return o.kind === gr[1]; });
      if (!list.length) return;
      body.appendChild(el('div', { class: 'sect' }, [gr[0]]));
      var L = el('div', { class: 'list' });
      list.forEach(function (o) {
        var cost = o.kind === 'process' ? 0 : E.itemCost(g, c, o);
        var pc = R.purchaseCost(g, p, c, o.kind, o.id);
        var isCur = c.build && c.build.kind === o.kind && c.build.id === o.id;
        var row = el('div', { class: 'item' + (isCur ? ' sel' : ''), onclick: function () { E.setBuild(g, c, o); S.cityPanel(c); UI.refresh(); } }, [
          el('div', { class: 'nm' }, [E.itemName(o), el('span', { class: 'small' }, [itemDesc(o)])]),
          el('div', { class: 'right' }, [cost ? cost + ' ⚒' : '', el('br'), itemTurns(g, c, o, y)]),
          btn('+Q', function () { if (!c.build) E.setBuild(g, c, o); else c.queue.push(o); S.cityPanel(c); UI.refresh(); }, 'sm'),
          pc > 0 ? btn(pc + 'g', function () { if (p.gold >= pc) { p.gold -= pc; E.setBuild(g, c, o); c.prod = Math.max(c.prod, cost); UI.toast('Purchased ' + E.itemName(o) + '! Completes next turn.'); S.cityPanel(c); UI.refresh(); } }, 'sm', p.gold < pc || c.resist > 0 || c.puppet) : null
        ]);
        L.appendChild(row);
      });
      body.appendChild(L);
    });
    // faith purchases
    var fo = U.faithOptions(g, p, c);
    if (fo.length) {
      body.appendChild(el('div', { class: 'sect' }, ['Purchase with Faith']));
      fo.forEach(function (ut) { var fc = U.faithCost(g, p, ut); body.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [D.UNITS[ut].name]), btn(fc + ' 🕊', function () { if (U.faithBuy(g, p, c, ut)) { UI.toast('Purchased ' + D.UNITS[ut].name); S.cityPanel(c); UI.refresh(); } }, 'sm', p.faith < fc)])); });
    }
  }
  function cityBuildings(body, c) {
    var g = game();
    body.appendChild(el('div', { class: 'sect' }, ['Buildings']));
    var L = el('div', { class: 'list' });
    Object.keys(c.buildings).forEach(function (b) { var bd = D.BUILDINGS[b]; if (!bd) return; L.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [bd.name, el('span', { class: 'small' }, [bldDesc(bd)])])])); });
    if (!Object.keys(c.buildings).length) L.appendChild(el('div', { class: 'small' }, ['None yet.']));
    body.appendChild(L);
    if (c.wonders.length) {
      body.appendChild(el('div', { class: 'sect' }, ['Wonders']));
      c.wonders.forEach(function (w) { body.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, ['🏆 ' + D.WONDERS[w].name, el('span', { class: 'small' }, [D.WONDERS[w].desc])])])); });
    }
    if (c.greatWorks.length) {
      body.appendChild(el('div', { class: 'sect' }, ['Great Works']));
      c.greatWorks.forEach(function (w) { body.appendChild(el('div', { class: 'item' }, ['🎨 ' + w.kind + ' by ' + w.by])); });
    }
  }
  function cityCitizens(body, c, y) {
    var g = game();
    body.appendChild(el('div', { class: 'sect' }, ['City Focus']));
    var foci = [['default', 'Balanced'], ['food', '🌾 Food'], ['production', '⚒ Production'], ['gold', '💰 Gold'], ['science', '⚗ Science'], ['culture', '🎭 Culture'], ['faith', '🕊 Faith']];
    body.appendChild(el('div', { class: 'tabs' }, foci.map(function (f) { return el('button', { class: 'tab' + (c.focus === f[0] ? ' on' : ''), onclick: function () { c.focus = f[0]; c.manual = false; c.locked = {}; E.assignCitizens(g, c); S.cityPanel(c); UI.refresh(); } }, [f[1]]); })));
    body.appendChild(el('div', { class: 'small' }, ['Tap tiles on the map to work or lock them; tap unowned tiles next to your border to buy them. ' + (c.manual ? '(Manual assignment)' : '')]));
    if (c.manual) body.appendChild(btn('Reset to automatic', function () { c.manual = false; c.locked = {}; c.manualSpecs = {}; E.assignCitizens(g, c); S.cityPanel(c); }, 'sm'));
    var slots = E.specialistSlots(c);
    body.appendChild(el('div', { class: 'sect' }, ['Specialists']));
    var any = false;
    for (var k in slots) {
      any = true;
      (function (k) {
        var n = c.specialists[k] || 0;
        body.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [D.SPECIALISTS[k].name + ' ' + n + '/' + slots[k], el('span', { class: 'small' }, [yicons(D.SPECIALISTS[k].y) + ' · +3 Great ' + D.SPECIALISTS[k].gp + ' points'])]),
          btn('−', function () { c.manual = true; c.manualSpecs = c.manualSpecs || {}; c.manualSpecs[k] = Math.max(0, (c.manualSpecs[k] != null ? c.manualSpecs[k] : n) - 1); E.assignCitizens(g, c); S.cityPanel(c); }, 'sm', n <= 0),
          btn('+', function () { c.manual = true; c.manualSpecs = c.manualSpecs || {}; c.manualSpecs[k] = Math.min(slots[k], (c.manualSpecs[k] != null ? c.manualSpecs[k] : n) + 1); E.assignCitizens(g, c); S.cityPanel(c); }, 'sm', n >= slots[k])]));
      })(k);
    }
    if (!any) body.appendChild(el('div', { class: 'small' }, ['Build a Library, Market, Workshop or Amphitheater to unlock specialist slots.']));
    if (c.specialists.citizen) body.appendChild(el('div', { class: 'small' }, ['Unemployed citizens: ' + c.specialists.citizen + ' (+1 ⚒ each)']));
    body.appendChild(el('div', { class: 'sect' }, ['Worked tiles: ' + c.worked.length]));
    var h = human();
    body.appendChild(el('div', { class: 'small' }, ['Great People progress: ' + Object.keys(D.GREAT_PEOPLE).filter(function (t) { return h.gpProgress[t]; }).map(function (t) { return D.GREAT_PEOPLE[t].name + ' ' + Math.floor(h.gpProgress[t]) + '/' + R.gpThreshold(g, h, t); }).join(' · ')]));
  }
  function cityMore(body, c, y) {
    var g = game(), p = human();
    body.appendChild(el('div', { class: 'sect' }, ['Religion']));
    var fol = Object.keys(c.followers).map(function (r) { return (g.religions[r] ? g.religions[r].name : r) + ': ' + c.followers[r]; }).join(', ');
    body.appendChild(el('div', { class: 'small' }, [fol || 'No religious followers yet.']));
    body.appendChild(el('div', { class: 'sect' }, ['Yield breakdown']));
    var pct = y.pct || {};
    body.appendChild(el('div', { class: 'small' }, ['Modifiers: ' + Object.keys(pct).filter(function (k) { return pct[k]; }).map(function (k) { return D.YIELD_NAMES[k] + ' ' + (pct[k] > 0 ? '+' : '') + pct[k] + '%'; }).join(', ')]));
    body.appendChild(el('div', { class: 'small' }, ['Connected to capital: ' + (c.capital ? 'is capital' : c.connected ? 'yes' : 'no (build roads or harbors)')]));
    var routes = g.tradeRoutes.filter(function (r) { return r.from === c.id || r.to === c.id; });
    body.appendChild(el('div', { class: 'sect' }, ['Trade routes']));
    if (!routes.length) body.appendChild(el('div', { class: 'small' }, ['None. Build a Caravan or Cargo Ship.']));
    routes.forEach(function (r) { var a = g.cities[r.from], b = g.cities[r.to]; body.appendChild(el('div', { class: 'small' }, [(a ? a.name : '?') + ' → ' + (b ? b.name : '?') + ' (' + r.turns + ' turns left) ' + (r.domestic ? '🌾' + r.food + ' ⚒' + r.prod : '💰' + r.goldFrom + ' ⚗' + r.sciFrom)])); });
    body.appendChild(el('div', { class: 'sect' }, ['Rename']));
    var inp = el('input', { type: 'text', value: c.name });
    body.appendChild(el('div', { style: { display: 'flex', gap: '6px' } }, [inp, btn('Rename', function () { if (inp.value.trim()) { c.name = inp.value.trim(); S.cityPanel(c); } }, 'sm')]));
  }
  S.cityTap = function (t) {
    var g = game(), c = g.cities[UI.cityId], p = human(), m = g.map;
    if (!c) { UI.closeCity(); return; }
    if (t === c.tile) { UI.closeCity(); return; }
    if (Hex.distance(t, c.tile) > 3) {
      var oc = E.cityAt(g, t);
      if (oc && oc.owner === p.id) { UI.openCity(oc); return; }
      UI.closeCity(); return;
    }
    if (m.city[t] === c.id) {
      // toggle worked/locked
      c.manual = true;
      var i = c.worked.indexOf(t);
      if (i >= 0) { if (c.locked[t]) { delete c.locked[t]; c.worked.splice(i, 1); c.specialists.citizen = (c.specialists.citizen || 0) + 1; } else c.locked[t] = 1; }
      else {
        var free = c.pop - c.worked.length - Object.keys(c.specialists).reduce(function (s, k) { return s + (k === 'citizen' ? 0 : c.specialists[k]); }, 0);
        if (free <= 0 && c.worked.length) { var un = c.worked.filter(function (w) { return !c.locked[w]; })[0]; if (un != null) c.worked.splice(c.worked.indexOf(un), 1); else if (c.manualSpecs) { for (var k in c.manualSpecs) if (c.manualSpecs[k] > 0) { c.manualSpecs[k]--; break; } } }
        c.locked[t] = 1; c.worked.push(t);
        E.assignCitizens(g, c);
      }
      S.cityPanel(c); UI.refresh(); return;
    }
    if (m.owner[t] < 0 && Hex.neighbors(t).some(function (z) { return m.city[z] === c.id; })) {
      var cost = R.tileBuyCost(g, c, p);
      UI.confirm('Buy tile?', 'Purchase this tile for <b>' + cost + ' gold</b>?', function () { if (p.gold >= cost) { p.gold -= cost; E.claimTile(g, p, c, t); c.tilesBought = (c.tilesBought || 0) + 1; S.cityPanel(c); UI.refresh(); } else UI.toast('Not enough gold.'); }, 'Buy');
    }
  };

  // =====================================================================
  //  TECH TREE
  // =====================================================================
  S.tech = function () {
    var g = game(), p = human(), ly = p.lastYields || {};
    var colW = 182, rowH = 66;
    var maxCol = 0, maxRow = 0;
    for (var t in D.TECHS) { maxCol = Math.max(maxCol, D.TECHS[t].col); maxRow = Math.max(maxRow, D.TECHS[t].row); }
    var tree = el('div', { class: 'techtree', style: { width: (maxCol + 1) * colW + 20 + 'px', height: (maxRow + 1) * rowH + 40 + 'px' } });
    var svg = '<svg width="' + ((maxCol + 1) * colW + 20) + '" height="' + ((maxRow + 1) * rowH + 40) + '" style="position:absolute;left:0;top:0;pointer-events:none">';
    var queue = p.researchQueue || [];
    for (t in D.TECHS) {
      var td = D.TECHS[t];
      td.req.forEach(function (r) {
        var a = D.TECHS[r], x1 = a.col * colW + 160 + 10, y1 = a.row * rowH + 29 + 26, x2 = td.col * colW + 10, y2 = td.row * rowH + 29 + 26;
        svg += '<path d="M' + x1 + ' ' + y1 + ' C' + (x1 + 12) + ' ' + y1 + ',' + (x2 - 12) + ' ' + y2 + ',' + x2 + ' ' + y2 + '" stroke="' + (p.techs[r] ? '#c9a24a' : '#5a5040') + '" stroke-width="2" fill="none"/>';
      });
    }
    svg += '</svg>';
    tree.innerHTML = svg;
    D.ERAS.forEach(function (eName, ei) {
      var cols = Object.keys(D.TECHS).filter(function (k) { return D.TECHS[k].era === ei; }).map(function (k) { return D.TECHS[k].col; });
      if (cols.length) tree.appendChild(el('div', { class: 'eracol', style: { left: Math.min.apply(null, cols) * colW + 10 + 'px' } }, [eName]));
    });
    var close;
    for (t in D.TECHS) (function (t) {
      var td = D.TECHS[t], un = D.TECH_UNLOCKS[t];
      var done = p.techs[t] && t !== 'future_tech', avail = E.canResearch(p, t);
      var cls = 'tech ' + (done ? 'done' : avail ? 'avail' : 'locked') + (p.researching === t ? ' cur' : '');
      var cost = R.techCost(g, p, t), prog = p.techProgress[t] || 0;
      var turns = done ? '✔' : ly.sci > 0 ? Math.max(1, Math.ceil((cost - prog) / ly.sci)) + ' t' : '';
      var unl = [];
      var civ = D.CIVS[p.civ];
      un.units.forEach(function (u) { unl.push(D.UNITS[R.civUnit(p, u)].name); });
      un.buildings.forEach(function (b) { unl.push(D.BUILDINGS[R.civBuilding(p, b)].name); });
      un.wonders.forEach(function (w) { unl.push('🏆' + D.WONDERS[w].name); });
      un.imps.forEach(function (i) { unl.push(D.IMPROVEMENTS[i].name); });
      var qi = queue.indexOf(t);
      var box = el('div', { class: cls, style: { left: td.col * colW + 10 + 'px', top: td.row * rowH + 29 + 'px' }, title: td.desc + (unl.length ? '\nUnlocks: ' + unl.join(', ') : ''),
        onclick: function () {
          if (p.freeTechs > 0 && avail) { E.takeFreeTech(g, p, t); UI.toast('Learned ' + td.name + '!'); close(); S.tech(); UI.refresh(); return; }
          if (done) return;
          var path = E.pathTo(p, t);
          p.researching = path[0]; p.researchQueue = path.slice(1);
          close(); UI.refresh();
        } }, [el('span', { class: 'tn' }, [td.name]), el('span', { class: 'tu' }, [turns + ' · ' + cost + ' ⚗']), el('span', { class: 'tu' }, [unl.join(', ') || td.desc]),
        qi >= 0 ? el('span', { class: 'q' }, [String(qi + 2)]) : null, prog > 0 && !done ? el('div', { class: 'tb', style: { width: Math.min(100, prog / cost * 100) + '%' } }) : null]);
      tree.appendChild(box);
    })(t);
    var wrap = el('div', {}, [p.freeTechs > 0 ? el('div', { class: 'good' }, ['You may choose ' + p.freeTechs + ' free technolog' + (p.freeTechs > 1 ? 'ies' : 'y') + ' — tap an available (blue) tech.']) : null,
      el('div', { class: 'small' }, ['Science: ' + fmt(ly.sci || 0) + '/turn · Techs known: ' + Object.keys(p.techs).length + ' · Tap a tech to research it (prerequisites are queued automatically).']), tree]);
    close = UI.modal('Technology', wrap, { cls: 'wide' });
    // scroll to current
    setTimeout(function () {
      var body = close.box.querySelector('.mbody'); var cur = p.researching ? D.TECHS[p.researching] : null;
      var col = cur ? cur.col : Math.max.apply(null, Object.keys(p.techs).map(function (k) { return D.TECHS[k] ? D.TECHS[k].col : 0; }));
      body.scrollLeft = Math.max(0, col * colW - body.clientWidth / 3);
    }, 30);
  };

  // =====================================================================
  //  POLICIES
  // =====================================================================
  S.policies = function () {
    var g = game(), p = human(), cost = R.policyCost(g, p), close;
    var afford = E.canAffordPolicy(g, p);
    var grid = el('div', { class: 'ptrees' });
    Object.keys(D.POLICY_TREES).forEach(function (tr) {
      var tree = D.POLICY_TREES[tr], st = p.trees[tr];
      var card = el('div', { class: 'ptree ' + (st || '') });
      card.appendChild(el('h3', {}, [tree.name + (tree.era ? ' (' + D.ERAS[tree.era] + ')' : '')]));
      if (!st) card.appendChild(el('button', { class: 'pol' + (E.canAdoptTree(g, p, tr) && afford ? ' can' : ''), onclick: function () { if (E.adopt(g, p, 'tree', tr)) { close(); S.policies(); UI.refresh(); } else UI.toast(E.canAdoptTree(g, p, tr) ? 'Not enough culture.' : 'Not available yet.'); } }, [el('b', {}, ['Adopt: ']), tree.opener.desc]));
      else card.appendChild(el('div', { class: 'pol have' }, [el('b', {}, ['Opener: ']), tree.opener.desc]));
      Object.keys(tree.policies).forEach(function (pk) {
        var pd = tree.policies[pk], have = p.policies[pk], can = E.canAdoptPolicy(g, p, pk);
        card.appendChild(el('button', { class: 'pol' + (have ? ' have' : can && afford ? ' can' : ''), onclick: function () { if (have) return; if (E.adopt(g, p, 'policy', pk)) { close(); S.policies(); UI.refresh(); } else UI.toast(can ? 'Not enough culture.' : 'Requires: ' + (pd.req ? pd.req.map(function (r) { return R.findPolicy(r).name; }).join(', ') : 'adopting the tree')); } },
          [el('b', {}, [pd.name + ': ']), pd.desc, pd.req ? el('span', { class: 'small' }, [' (needs ' + pd.req.map(function (r) { return R.findPolicy(r).name; }).join(', ') + ')']) : null]));
      });
      card.appendChild(el('div', { class: 'small' }, ['Finisher: ' + tree.finisher.desc]));
      grid.appendChild(card);
    });
    var head = el('div', { class: 'small' }, ['Culture ' + Math.floor(p.culture) + '/' + cost + ' (' + fmt(p.lastYields.cul || 0) + '/turn) · Policies adopted: ' + p.numPolicies + (p.freePolicies ? ' · Free policies: ' + p.freePolicies : '') + '. Costs follow Civ V: 25 + (3n)^2.01, +' + Math.round(D.MAP_SIZES[g.size].policyMod * 100) + '% per extra city.']);
    close = UI.modal('Social Policies', el('div', {}, [head, grid]), { cls: 'wide' });
  };

  // =====================================================================
  //  RELIGION
  // =====================================================================
  S.religion = function () {
    var g = game(), p = human(), close;
    var w = el('div');
    w.appendChild(el('div', { class: 'small' }, ['Faith: ' + Math.floor(p.faith) + ' (' + fmt(p.lastYields.faith || 0) + '/turn) · Pantheon cost: ' + R.pantheonCost(g) + ' · Next Great Prophet: ' + R.prophetCost(g, p) + ' · Religions founded: ' + Object.keys(g.religions).length + '/' + R.maxReligions(g)]));
    w.appendChild(el('div', { class: 'sect' }, ['Pantheon']));
    if (p.pantheon) w.appendChild(el('div', {}, [D.BELIEFS.pantheon[p.pantheon].name + ' — ' + D.BELIEFS.pantheon[p.pantheon].desc]));
    else {
      var can = p.faith >= R.pantheonCost(g);
      w.appendChild(el('div', { class: 'small' }, [can ? 'Choose a pantheon belief:' : 'Accumulate ' + R.pantheonCost(g) + ' Faith to found a pantheon (build Shrines).']));
      var L = el('div', { class: 'list' });
      Object.keys(D.BELIEFS.pantheon).forEach(function (b) {
        var bd = D.BELIEFS.pantheon[b], taken = g.pantheonsTaken[b] != null;
        L.appendChild(el('div', { class: 'item' + (taken || !can ? ' disabled' : ''), onclick: function () { if (!taken && can && E.foundPantheon(g, p, b)) { close(); S.religion(); UI.refresh(); } } }, [el('div', { class: 'nm' }, [bd.name, el('span', { class: 'small' }, [bd.desc + (taken ? ' (taken by ' + g.players[g.pantheonsTaken[b]].name + ')' : '')])])]));
      });
      w.appendChild(L);
    }
    w.appendChild(el('div', { class: 'sect' }, ['World Religions']));
    var rels = Object.keys(g.religions);
    if (!rels.length) w.appendChild(el('div', { class: 'small' }, ['No religions founded yet. Earn a Great Prophet (through Faith) after founding a pantheon, then use it in one of your cities.']));
    rels.forEach(function (rid) {
      var r = g.religions[rid], rd = D.RELIGIONS.filter(function (x) { return x.id === rid; })[0] || {};
      var fol = 0, cities = 0; for (var id in g.cities) { fol += g.cities[id].followers[rid] || 0; if (E.majorityReligion(g.cities[id]) === rid) cities++; }
      var hc = g.cities[r.holyCity];
      w.appendChild(el('div', { class: 'civrow' }, [el('div', { class: 'swatch', style: { background: rd.color, borderColor: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' } }, [rd.icon || '']),
        el('div', { class: 'info' }, [el('b', {}, [r.name]), ' — founded by ' + g.players[r.owner].name + (hc ? ', holy city ' + hc.name : ''), el('div', { class: 'small' }, [fol + ' followers, majority in ' + cities + ' cities']),
          el('div', { class: 'small' }, ['Founder: ' + r.founder.map(function (b) { return D.BELIEFS.founder[b].name + ' (' + D.BELIEFS.founder[b].desc + ')'; }).join('; ')]),
          el('div', { class: 'small' }, ['Follower: ' + r.follower.map(function (b) { return D.BELIEFS.follower[b].name + ' (' + D.BELIEFS.follower[b].desc + ')'; }).join('; ')])])]));
    });
    close = UI.modal('Religion', w, { cls: 'mid' });
  };
  S.foundReligion = function (u, enhance) {
    var g = game(), p = human(), close;
    var w = el('div');
    var choice = { rel: null, founder: null, follower: null, name: '' };
    function list(title, items, key) {
      w.appendChild(el('div', { class: 'sect' }, [title]));
      var L = el('div', { class: 'list' });
      items.forEach(function (it) {
        var row = el('div', { class: 'item', onclick: function () { choice[key] = it.id; L.querySelectorAll('.item').forEach(function (r) { r.classList.remove('sel'); }); row.classList.add('sel'); } }, [el('div', { class: 'nm' }, [it.name, el('span', { class: 'small' }, [it.desc || ''])])]);
        L.appendChild(row);
      });
      w.appendChild(L);
    }
    if (!enhance) {
      list('Religion', D.RELIGIONS.filter(function (r) { return !g.religions[r.id]; }).map(function (r) { return { id: r.id, name: r.icon + ' ' + r.name }; }), 'rel');
      var nm = el('input', { type: 'text', placeholder: 'Custom name (optional)' }); w.appendChild(nm);
      list('Founder belief', Object.keys(D.BELIEFS.founder).filter(function (b) { return !g.beliefsTaken[b]; }).map(function (b) { return { id: b, name: D.BELIEFS.founder[b].name, desc: D.BELIEFS.founder[b].desc }; }), 'founder');
      choice.nameInput = nm;
    }
    list('Follower belief', Object.keys(D.BELIEFS.follower).filter(function (b) { return !g.beliefsTaken[b]; }).map(function (b) { return { id: b, name: D.BELIEFS.follower[b].name, desc: D.BELIEFS.follower[b].desc }; }), 'follower');
    close = UI.modal(enhance ? 'Enhance Religion' : 'Found a Religion', w, { cls: 'mid', buttons: [['Cancel', null], [enhance ? 'Enhance' : 'Found', function () {
      if (enhance) { if (!choice.follower) { UI.toast('Choose a belief.'); return true; } U.doAction(g, u, 'enhance_religion', { follower: choice.follower }); }
      else { if (!choice.rel || !choice.founder || !choice.follower) { UI.toast('Choose a religion and both beliefs.'); return true; } U.doAction(g, u, 'found_religion', { rel: choice.rel, founder: choice.founder, follower: choice.follower, name: choice.nameInput.value.trim() || null }); }
      UI.afterUnitAction(null); UI.refresh();
    }, 'primary']] });
  };

  // =====================================================================
  //  DIPLOMACY
  // =====================================================================
  S.diplo = function () {
    var g = game(), p = human(), close;
    var w = el('div');
    var majors = g.players.filter(function (o) { return o !== p && !o.isCS && !o.isBarb; });
    w.appendChild(el('div', { class: 'sect' }, ['Civilizations']));
    var myPow = Dp.power(g, p);
    majors.forEach(function (o) {
      if (!p.met[o.id]) { w.appendChild(el('div', { class: 'civrow' }, [el('div', { class: 'swatch', style: { background: '#222', borderColor: '#555' } }), el('div', { class: 'info' }, ['Unmet civilization'])])); return; }
      var war = E.atWar(g, p.id, o.id), r = E.rel(o, p.id);
      var op = Dp.opinion(g, o, p);
      var inf = E.influence(g, p, o);
      var acts = el('div', { class: 'acts' });
      if (o.alive) {
        acts.appendChild(btn('Trade…', function () { close(); S.trade(o); }, 'sm'));
        if (war) acts.appendChild(btn('Propose Peace', function () {
          var v = Dp.evaluate(g, o, p, [{ kind: 'peace' }], []);
          if (v > 0) { Dp.makePeace(g, p, o); UI.toast(o.leader + ': "' + Dp.leaderLine(g, o, p, 'peace') + '"', 3500); close(); S.diplo(); }
          else UI.toast(o.leader + ': "' + Dp.leaderLine(g, o, p, 'reject') + '" (try offering gold in a trade with peace)', 3500);
          UI.refresh();
        }, 'sm'));
        else acts.appendChild(btn('Declare War', function () { UI.confirm('Declare war on ' + o.name + '?', (E.rel(p, o.id).peaceUntil > g.turn ? '<span class="bad">You have a peace treaty — breaking it will anger everyone.</span><br>' : '') + 'Their city-state allies will join the war.', function () { Dp.declareWar(g, p, o); UI.toast(o.leader + ': "' + Dp.leaderLine(g, o, p, 'war') + '"', 3500); close(); S.diplo(); UI.refresh(); }, 'Declare War'); }, 'sm danger'));
      }
      w.appendChild(el('div', { class: 'civrow' }, [
        G.GFX && G.GFX.portraitEl ? G.GFX.portraitEl(o.civ, 46) : G.GFX && G.GFX.emblemEl ? G.GFX.emblemEl(o.color, o.color2, o.civ, 38) : el('div', { class: 'swatch', style: { background: o.color, borderColor: o.color2 } }),
        el('div', { class: 'info' }, [el('b', {}, [o.leader]), ' of ' + o.name + (o.alive ? '' : ' (destroyed)'),
          el('div', { class: 'small' }, [D.CIVS[o.civ].title + ', ' + D.CIVS[o.civ].reign + ' · ' + D.CIVS[o.civ].trait.name]),
          el('div', { class: 'small' }, [(war ? '⚔ AT WAR' : 'Peace') + ' · Attitude: ' + Dp.attitude(op) + ' (' + op + ') · Military: ' + Dp.power(g, o) + ' vs yours ' + myPow + ' · Score ' + (o.score || 0) + (r.openBorders > 0 ? ' · Open Borders' : '')]),
          el('div', { class: 'small' }, ['Your cultural influence: ' + E.influenceLevel(inf) + ' (' + Math.round(inf * 100) + '%) · Cities ' + o.cities.length + ' · Techs ' + Object.keys(o.techs).length + (o.religion && g.religions[o.religion] ? ' · ' + g.religions[o.religion].name : '')])]),
        acts]));
    });
    w.appendChild(el('div', { class: 'sect' }, ['City-States']));
    g.players.filter(function (o) { return o.isCS; }).forEach(function (cs) {
      if (!p.met[cs.id]) return;
      var inf = Math.round(cs.csInfluence[p.id] || 0), war = E.atWar(g, p.id, cs.id);
      var status = war ? 'War' : cs.ally === p.id ? 'Ally' : inf >= 30 ? 'Friend' : inf < 0 ? 'Angry' : 'Neutral';
      var ct = D.CS_TYPES[cs.csType];
      var acts = el('div', { class: 'acts' });
      if (cs.alive && !war) [250, 500, 1000].forEach(function (amt) { acts.appendChild(btn('Gift ' + amt + 'g', function () { var got = E.giftGold(g, p, cs, amt); if (got) { UI.toast('+' + got + ' influence with ' + cs.name); close(); S.diplo(); UI.refresh(); } }, 'sm', p.gold < amt)); });
      if (cs.alive) acts.appendChild(war ? btn('Make Peace', function () { Dp.makePeace(g, p, cs); close(); S.diplo(); }, 'sm') : btn('War', function () { UI.confirm('Declare war on ' + cs.name + '?', 'Other civilizations will see you as a warmonger.', function () { Dp.declareWar(g, p, cs); close(); S.diplo(); UI.refresh(); }, 'Declare War'); }, 'sm danger'));
      var w2 = Math.max(0, Math.min(100, (inf + 60) / 180 * 100));
      w.appendChild(el('div', { class: 'civrow' }, [el('div', { class: 'swatch', style: { background: ct.color, borderColor: '#222' } }),
        el('div', { class: 'info' }, [el('b', {}, [cs.name]), ' — ' + ct.name + (cs.alive ? '' : ' (destroyed)'), el('div', { class: 'small' }, ['Influence ' + inf + ' · ' + status + ' · Ally: ' + (cs.ally != null ? g.players[cs.ally].name : 'none') + ' · Friend (30+): ' + JSON.stringify(ct.friend).replace(/[{}"]/g, '') + ' · Ally (60+): ' + JSON.stringify(ct.ally).replace(/[{}"]/g, '')]),
          el('div', { class: 'bar' }, [el('div', { style: { width: w2 + '%', background: status === 'Ally' ? '#7ed957' : status === 'Friend' ? '#5ab7f2' : '#c88a2a' } })])]), acts]));
    });
    if (g.un) {
      w.appendChild(el('div', { class: 'sect' }, ['United Nations']));
      var sel = el('select', { onchange: function () { p.unVote = +sel.value; } }, g.players.filter(function (o) { return !o.isCS && !o.isBarb && o.alive && (o === p || p.met[o.id]); }).map(function (o) { return el('option', { value: o.id, selected: (p.unVote != null ? p.unVote : p.id) === o.id ? true : null }, [o.name]); }));
      w.appendChild(el('div', {}, ['Next World Leader vote on turn ' + g.un.nextVote + '. Your vote: ', sel]));
    }
    close = UI.modal('Diplomacy', w, { cls: 'mid' });
  };
  S.trade = function (o) {
    var g = game(), p = human(), close;
    var mineItems = Dp.tradableItems(g, p, o), theirItems = Dp.tradableItems(g, o, p);
    var give = [], get = [];
    var w = el('div');
    w.appendChild(el('div', { class: 'speaker' }, [G.GFX && G.GFX.portraitEl ? G.GFX.portraitEl(o.civ, 84) : '', el('div', { class: 'quote' }, [el('b', { class: 'gold' }, [o.leader]), el('div', {}, ['"' + Dp.leaderLine(g, o, p, 'greet') + '"']), el('div', { class: 'small' }, ['Attitude: ' + Dp.attitude(Dp.opinion(g, o, p))])])]));
    function col(title, items, arr, isMine) {
      var box = el('div', { style: { flex: 1, minWidth: '220px' } }, [el('div', { class: 'sect' }, [title])]);
      items.forEach(function (it) {
        var amtInput = null;
        var row = el('div', { class: 'item' }, [el('div', { class: 'nm' }, [Dp.itemName(it)])]);
        if (it.kind === 'gold' || it.kind === 'gpt') { amtInput = el('input', { type: 'number', min: 0, max: it.amt, value: 0, style: { width: '80px' }, onclick: function (e) { e.stopPropagation(); }, oninput: function () { var v = Math.max(0, Math.min(it.amt, +amtInput.value || 0)); var k = arr.indexOf(it.copy); if (k >= 0) arr.splice(k, 1); if (v > 0) { it.copy = { kind: it.kind, amt: v }; arr.push(it.copy); } } }); row.appendChild(amtInput); }
        else row.onclick = function () { var k = arr.indexOf(it); if (k >= 0) { arr.splice(k, 1); row.classList.remove('sel'); } else { arr.push(it); row.classList.add('sel'); } };
        box.appendChild(row);
      });
      return box;
    }
    w.appendChild(el('div', { style: { display: 'flex', gap: '10px', flexWrap: 'wrap' } }, [col('You give', mineItems, give, true), col(o.name + ' gives', theirItems, get, false)]));
    close = UI.modal('Trade with ' + o.name, w, { cls: 'mid', buttons: [['Close', null], ['Propose', function () {
      if (!give.length && !get.length) { UI.toast('Select items to trade.'); return true; }
      var v = Dp.evaluate(g, o, p, give, get);
      if (v >= 0) { Dp.execute(g, p, o, give, get); UI.toast(o.leader + ': "' + Dp.leaderLine(g, o, p, 'accept') + '"', 3000); UI.refresh(); }
      else { UI.toast(o.leader + ': "' + Dp.leaderLine(g, o, p, 'reject') + '"', 3000); return true; }
    }, 'primary']] });
  };

  // =====================================================================
  //  OVERVIEW
  // =====================================================================
  var ovTab = 'cities';
  S.overview = function () {
    var g = game(), p = human(), close;
    var w = el('div');
    var tabs = el('div', { class: 'tabs' }, [['cities', 'Cities'], ['units', 'Units'], ['victory', 'Victory'], ['demo', 'Rankings'], ['log', 'Messages']].map(function (t) { return el('button', { class: 'tab' + (ovTab === t[0] ? ' on' : ''), onclick: function () { ovTab = t[0]; close(); S.overview(); } }, [t[1]]); }));
    w.appendChild(tabs);
    if (ovTab === 'cities') {
      var tb = el('table', { class: 't' }); tb.innerHTML = '<tr><th>City</th><th>Pop</th><th>🌾</th><th>⚒</th><th>💰</th><th>⚗</th><th>🎭</th><th>Producing</th></tr>';
      p.cities.forEach(function (cid) { var c = g.cities[cid]; if (!c) return; var y = c.lastYields || E.cityYields(g, c); var tr = el('tr', { class: 'click', onclick: function () { close(); UI.openCity(c); } }); tr.innerHTML = '<td>' + (c.capital ? '★ ' : '') + c.name + '</td><td>' + c.pop + '</td><td>' + fmt(y.surplus) + '</td><td>' + round1(y.p) + '</td><td>' + round1(y.g) + '</td><td>' + round1(y.s) + '</td><td>' + round1(y.c) + '</td><td>' + E.itemName(c.build) + '</td>'; tb.appendChild(tr); });
      w.appendChild(tb);
      var hap = E.happiness(g, p);
      w.appendChild(el('div', { class: 'sect' }, ['Happiness ' + hap.net]));
      w.appendChild(el('div', { class: 'small' }, [hap.lines.map(function (l) { return l[0] + ': ' + (l[1] > 0 ? '+' : '') + Math.round(l[1]); }).join(' · ')]));
      w.appendChild(el('div', { class: 'small' }, ['Luxuries: ' + (Object.keys(hap.lux).map(function (k) { return D.RESOURCES[k].icon + D.RESOURCES[k].name; }).join(', ') || 'none')]));
      var rc = E.resourceCounts(g, p).counts;
      w.appendChild(el('div', { class: 'small' }, ['Strategic: ' + (Object.keys(rc).map(function (k) { return D.RESOURCES[k].name + ' ' + E.resourceAvail(g, p, k) + '/' + rc[k]; }).join(', ') || 'none')]));
      w.appendChild(el('div', { class: 'small' }, ['Trade routes: ' + E.tradeRoutesUsed(g, p) + '/' + E.tradeCap(g, p) + ' · Gold income ' + (p.lastYields.income || 0) + ', expenses ' + (p.lastYields.maint || 0)]));
    } else if (ovTab === 'units') {
      var tb2 = el('table', { class: 't' }); tb2.innerHTML = '<tr><th>Unit</th><th>HP</th><th>Status</th></tr>';
      p.units.map(function (id) { return g.units[id]; }).filter(Boolean).forEach(function (u) { var tr = el('tr', { class: 'click', onclick: function () { close(); UI.select(u); UI.rend.centerOn(u.tile, true); } }); tr.innerHTML = '<td>' + (u.name ? u.name + ' — ' : '') + D.UNITS[u.type].name + '</td><td>' + Math.round(u.hp) + '</td><td>' + (u.build ? 'Building' : u.automate ? 'Automated' : u.fortify ? 'Fortified' : u.sleep ? 'Sleeping' : u.orders ? 'Moving' : u.explore ? 'Exploring' : '') + '</td>'; tb2.appendChild(tr); });
      w.appendChild(tb2);
    } else if (ovTab === 'victory') {
      var majors = g.players.filter(function (o) { return !o.isCS && !o.isBarb; });
      w.appendChild(el('div', { class: 'small' }, ['Victory conditions (Civ V rules): ' + Object.keys(g.options.victories).filter(function (k) { return g.options.victories[k]; }).join(', ')]));
      w.appendChild(el('div', { class: 'sect' }, ['Domination — hold every original capital']));
      var caps = []; for (var id in g.cities) { var c = g.cities[id]; if (c.originalCapital) caps.push(c); }
      w.appendChild(el('div', { class: 'small' }, [caps.map(function (c) { var orig = g.players[c.origCapOf]; return c.name + ' (' + orig.name + ') — held by ' + (p.met[c.owner] || c.owner === p.id ? g.players[c.owner].name : 'unknown'); }).join(' · ')]));
      w.appendChild(el('div', { class: 'sect' }, ['Science — Apollo Program + all spaceship parts in your capital']));
      majors.forEach(function (o) { if (o !== p && !p.met[o.id]) return; var parts = Object.keys(D.SPACESHIP).map(function (k) { return D.SPACESHIP[k].name + ' ' + (o.space[k] || 0) + '/' + D.SPACESHIP[k].need; }).join(', '); w.appendChild(el('div', { class: 'small' }, [o.name + ': ' + (o.apollo ? 'Apollo ✔ · ' + parts : 'no Apollo Program')])); });
      w.appendChild(el('div', { class: 'sect' }, ['Culture — become Influential (tourism ≥ their lifetime culture) over every civilization, or build the Utopia Project']));
      majors.forEach(function (o) { if (o === p || !p.met[o.id] || !o.alive) return; var inf = E.influence(g, p, o); w.appendChild(el('div', { class: 'small' }, [o.name + ': ' + E.influenceLevel(inf) + ' ' + Math.round(inf * 100) + '% (your tourism ' + Math.round(p.tourismTo[o.id] || 0) + ' vs their culture ' + Math.round(o.totalCulture) + ')'])); });
      w.appendChild(el('div', { class: 'sect' }, ['Diplomatic — win a World Leader vote in the United Nations']));
      w.appendChild(el('div', { class: 'small' }, [g.un ? 'UN founded by ' + g.players[g.un.founder].name + '. Next vote turn ' + g.un.nextVote + '. City-state allies vote with their ally.' : 'The United Nations wonder (Globalization) has not been built.']));
      w.appendChild(el('div', { class: 'sect' }, ['Time — highest score on turn ' + D.SPEEDS[g.speed].turns]));
    } else if (ovTab === 'demo') {
      var tb3 = el('table', { class: 't' }); tb3.innerHTML = '<tr><th>Civilization</th><th>Score</th><th>Cities</th><th>Pop</th><th>Techs</th><th>Military</th><th>Wonders</th></tr>';
      g.players.filter(function (o) { return !o.isCS && !o.isBarb; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); }).forEach(function (o) {
        var known = o === p || p.met[o.id];
        var pop = o.cities.reduce(function (s, cid) { return s + (g.cities[cid] ? g.cities[cid].pop : 0); }, 0);
        var tr = el('tr'); tr.innerHTML = '<td>' + (known ? o.name : 'Unmet') + (o.alive ? '' : ' †') + '</td><td>' + (o.score || 0) + '</td><td>' + o.cities.length + '</td><td>' + pop + '</td><td>' + Object.keys(o.techs).length + '</td><td>' + Dp.power(g, o) + '</td><td>' + o.wonders.length + '</td>'; tb3.appendChild(tr);
      });
      w.appendChild(tb3);
      w.appendChild(el('div', { class: 'sect' }, ['World Wonders']));
      w.appendChild(el('div', { class: 'small' }, [Object.keys(g.wonders).filter(function (k) { return g.wonders[k] >= 0 && g.cities[g.wonders[k]]; }).map(function (k) { var c = g.cities[g.wonders[k]]; return D.WONDERS[k].name + ' (' + (p.met[c.owner] || c.owner === p.id ? c.name : 'unknown') + ')'; }).join(' · ') || 'None yet']));
    } else {
      var L = el('div', { class: 'list' });
      p.notes.slice().reverse().slice(0, 120).forEach(function (n) { if (!n.text) return; L.appendChild(el('div', { class: 'item', onclick: function () { if (n.tile != null) { close(); UI.rend.centerOn(n.tile, true); } } }, [el('div', { class: 'nm' }, [el('span', { class: 'small' }, ['Turn ' + n.turn]), n.text])])); });
      w.appendChild(L);
    }
    close = UI.modal('Empire Overview', w, { cls: 'mid' });
  };

  // =====================================================================
  //  CIVILOPEDIA
  // =====================================================================
  S.pedia = function (cat) {
    cat = cat || 'civs';
    var close, w = el('div');
    var cats = [['civs', 'Civilizations'], ['units', 'Units'], ['buildings', 'Buildings'], ['wonders', 'Wonders'], ['techs', 'Techs'], ['res', 'Resources'], ['terrain', 'Terrain'], ['rules', 'Rules']];
    w.appendChild(el('div', { class: 'tabs' }, cats.map(function (c) { return el('button', { class: 'tab' + (c[0] === cat ? ' on' : ''), onclick: function () { close(); S.pedia(c[0]); } }, [c[1]]); })));
    var L = el('div', { class: 'list' });
    function row(title, desc) { L.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [title, el('span', { class: 'small' }, [desc])])])); }
    if (cat === 'civs') Object.keys(D.CIVS).forEach(function (k) { var c = D.CIVS[k]; row(c.name + ' — ' + c.leader + ' (' + c.title + ', ' + c.reign + ')', c.trait.name + ': ' + c.trait.desc + '. Unique: ' + (c.uu ? c.uu.name + ' (replaces ' + D.UNITS[c.uu.base].name + ')' : '') + (c.uu2 ? ', ' + c.uu2.name : '') + (c.ub ? ', ' + c.ub.name + ' (replaces ' + D.BUILDINGS[c.ub.base].name + ')' : '') + (c.ui ? ', ' + D.IMPROVEMENTS[c.ui].name : '') + '. Cities: ' + c.cities.slice(0, 6).join(', ') + '…'); });
    if (cat === 'units') Object.keys(D.UNITS).forEach(function (k) { var u = D.UNITS[k]; row(u.name + (u.unique ? ' (' + D.CIVS[u.unique].name + ')' : ''), (u.str ? 'Strength ' + u.str + ' · ' : '') + (u.rs ? 'Ranged ' + u.rs + ' range ' + u.range + ' · ' : '') + 'Moves ' + u.mv + ' · Cost ' + u.cost + (u.tech ? ' · ' + D.TECHS[u.tech].name : '') + (u.res ? ' · needs ' + D.RESOURCES[u.res].name : '') + (u.upg ? ' · upgrades to ' + D.UNITS[u.upg].name : '')); });
    if (cat === 'buildings') Object.keys(D.BUILDINGS).forEach(function (k) { var b = D.BUILDINGS[k]; if (b.hidden) return; row(b.name + (b.unique ? ' (' + D.CIVS[b.unique].name + ')' : ''), 'Cost ' + b.cost + (b.tech ? ' · ' + D.TECHS[b.tech].name : '') + ' · ' + bldDesc(b)); });
    if (cat === 'wonders') Object.keys(D.WONDERS).forEach(function (k) { var w2 = D.WONDERS[k]; row(w2.name, D.ERAS[w2.era] + ' · Cost ' + w2.cost + ' · ' + D.TECHS[w2.tech].name + ' · ' + (w2.desc || '')); });
    if (cat === 'techs') Object.keys(D.TECHS).forEach(function (k) { var t = D.TECHS[k], un = D.TECH_UNLOCKS[k]; row(t.name + ' (' + D.ERAS[t.era] + ', ' + t.cost + ')', 'Requires ' + (t.req.map(function (r) { return D.TECHS[r].name; }).join(', ') || 'nothing') + '. Unlocks: ' + un.units.map(function (u) { return D.UNITS[u].name; }).concat(un.buildings.map(function (b) { return D.BUILDINGS[b].name; }), un.wonders.map(function (w3) { return D.WONDERS[w3].name; }), un.imps.map(function (i) { return D.IMPROVEMENTS[i].name; })).join(', ') + '. ' + t.desc); });
    if (cat === 'res') Object.keys(D.RESOURCES).forEach(function (k) { var r = D.RESOURCES[k]; row(r.icon + ' ' + r.name + ' (' + r.type + ')', yicons(r.y) + ' · improved by ' + D.IMPROVEMENTS[r.imp].name + (r.tech ? ' · revealed by ' + D.TECHS[r.tech].name : '') + (r.type === 'luxury' ? ' · +4 Happiness' : '')); });
    if (cat === 'terrain') { Object.keys(D.TERRAIN).forEach(function (k) { var t = D.TERRAIN[k]; row(t.name, yicons(t.y) + ' · move ' + (t.impassable ? 'impassable' : t.move) + ' · defense ' + t.def + '%'); }); row('Hills', yicons(D.HILLS.y) + ' · move 2 · defense +25%'); Object.keys(D.FEATURES).forEach(function (k) { var f = D.FEATURES[k]; row(f.name, yicons(f.y) + ' · move ' + f.move + ' · defense ' + f.def + '%'); }); Object.keys(D.NATURAL_WONDERS).forEach(function (k) { row('★ ' + D.NATURAL_WONDERS[k].name, yicons(D.NATURAL_WONDERS[k].y)); }); }
    if (cat === 'rules') {
      [['Growth', 'Food to grow from size n: 15 + 6(n−1) + (n−1)^1.8 (scaled by game speed). Each citizen eats 2 food. Unhappy empires grow 75% slower; at −10 they stop growing.'],
        ['Happiness', 'Each city causes 3 unhappiness and each citizen 1 (occupied cities more). Each unique luxury gives +4. Building happiness in a city is capped by its population. Surplus builds Golden Ages (500 + 250 per previous, +2% per city).'],
        ['Culture', 'Policy cost: 25 + (3n)^2.01, increased per extra city (10% on Standard maps). Border tiles cost 20 + (10t)^1.1.'],
        ['Combat', 'Units have 100 HP. Damage is 24–36 scaled by the strength ratio r: ×((((r+3)/4)^4)+1)/2 for the stronger side, ÷ for the weaker. Modifiers: terrain (hills/forest/jungle +25%), fortify +25%, flanking +10% per adjacent ally, Great General +15%, promotions, wounds (up to −50%).'],
        ['Movement', 'One military and one civilian unit per tile. Roads cost 1/3, railroads 1/10. Entering hills, forests and jungles costs 2. Moving between tiles adjacent to enemies (zone of control) ends movement. Embarking/disembarking uses all movement.'],
        ['Science', 'Each citizen produces 1 science; libraries, universities and specialists add more. Techs known by civilizations you have met are cheaper.'],
        ['Religion', 'Faith founds a Pantheon, then Great Prophets found and enhance religions. Religions spread by pressure from nearby cities, trade routes, missionaries and prophets.'],
        ['Victory', 'Domination (all original capitals), Science (spaceship), Culture (influential over all civs, or Utopia Project), Diplomatic (UN vote), Time (highest score at the turn limit).']].forEach(function (r) { row(r[0], r[1]); });
    }
    w.appendChild(L);
    close = UI.modal('Civilopedia', w, { cls: 'mid' });
  };

  // =====================================================================
  //  MENU, SAVE/LOAD
  // =====================================================================
  S.menu = function () {
    var g = game(), close, w = el('div');
    w.appendChild(el('div', { class: 'small' }, [g ? human().leader + ' of ' + human().name + ' · Turn ' + g.turn + ' · ' + D.MAP_SIZES[g.size].name + ' ' + D.MAP_TYPES[g.mapType].name + ' · ' + D.SPEEDS[g.speed].name + ' · ' + D.DIFFICULTIES[g.difficulty].name : '']));
    w.appendChild(el('div', { class: 'sect' }, ['Save game']));
    var nm = el('input', { type: 'text', value: g ? (human().name + ' T' + g.turn) : '' });
    w.appendChild(el('div', { style: { display: 'flex', gap: '6px' } }, [nm, btn('Save', function () { G.Save.saveGame(g, nm.value || 'Save').then(function (ok) { UI.toast(ok ? 'Game saved.' : 'Save failed — try Export.'); close(); }); }, 'primary')]));
    w.appendChild(el('div', { class: 'sect' }, ['Load game']));
    var L = el('div', { class: 'list' }, [el('div', { class: 'small' }, ['Loading…'])]);
    w.appendChild(L);
    G.Save.list().then(function (list) {
      L.innerHTML = '';
      if (!list.length) L.appendChild(el('div', { class: 'small' }, ['No saved games.']));
      list.sort(function (a, b) { return b.date - a.date; }).forEach(function (s) {
        L.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [s.name, el('span', { class: 'small' }, [(s.meta ? s.meta.leader + ' · ' + s.meta.civ + ' · Turn ' + s.meta.turn + ' (' + s.meta.year + ')' : '') + ' · ' + new Date(s.date).toLocaleString()])]),
          btn('Load', function () { G.Save.loadGame(s.name).then(function (gm) { if (gm) { close(); UI.closeAllModals(); UI.start(gm); UI.toast('Loaded ' + s.name); } }); }, 'sm primary'),
          btn('🗑', function () { G.Save.del(s.name).then(function () { close(); S.menu(); }); }, 'sm danger')]));
      });
    });
    var cloudBox = el('div');
    w.appendChild(cloudBox);
    G.Save.cloudReady.then(function (c) {
      if (!c) return;
      cloudBox.appendChild(el('div', { class: 'sect' }, ['☁ Cloud saves — private to you, on every device where you open this page']));
      cloudBox.appendChild(el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, [btn('Save to cloud', function () { UI.toast('Saving to cloud…'); G.Save.cloudSave(nm.value || 'Save', g).then(function (ok) { UI.toast(ok ? 'Saved to cloud.' : 'Cloud save failed.'); if (ok) { close(); S.menu(); } }); }, 'primary', !g)]));
      var CL = el('div', { class: 'list' }, [el('div', { class: 'small' }, ['Loading…'])]);
      cloudBox.appendChild(CL);
      G.Save.cloudList().then(function (list) {
        CL.innerHTML = '';
        if (!list || !list.length) { CL.appendChild(el('div', { class: 'small' }, ['No cloud saves yet.'])); return; }
        list.sort(function (a, b) { return b.date - a.date; }).forEach(function (s) {
          CL.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, ['☁ ' + s.name, el('span', { class: 'small' }, [(s.meta ? s.meta.leader + ' · ' + s.meta.civ + ' · Turn ' + s.meta.turn : '') + ' · ' + new Date(s.date).toLocaleString()])]),
            btn('Load', function () { UI.toast('Loading from cloud…'); G.Save.cloudLoad(s.id).then(function (gm) { if (gm) { close(); UI.closeAllModals(); UI.start(gm); UI.toast('Loaded ' + s.name); } else UI.toast('Could not load.'); }); }, 'sm primary'),
            btn('🗑', function () { G.Save.cloudDelete(s.id).then(function () { close(); S.menu(); }); }, 'sm danger')]));
        });
      });
    });
    w.appendChild(el('div', { class: 'sect' }, ['Export / Import (copy a save between devices)']));
    var ta = el('textarea', { placeholder: 'Paste a save here to import, or press Export to get one.' });
    var file = el('input', { type: 'file', accept: '.txt,.aoe,.json', onchange: function () { var f = file.files[0]; if (!f) return; var rd = new FileReader(); rd.onload = function () { ta.value = rd.result; }; rd.readAsText(f); } });
    w.appendChild(ta);
    w.appendChild(el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap', marginTop: '6px' } }, [
      btn('Export', function () { ta.value = G.Save.serialize(g); ta.select(); }, 'sm', !g),
      btn('Copy', function () { try { navigator.clipboard.writeText(ta.value).then(function () { UI.toast('Copied to clipboard.'); }, function () { ta.select(); UI.toast('Select all and copy manually.'); }); } catch (e) { ta.select(); } }, 'sm'),
      btn('Download file', function () { G.Save.download('ages-of-empire-T' + g.turn + '.aoe', ta.value || G.Save.serialize(g)).catch(function () { UI.toast('Download blocked — use Copy instead.'); }); }, 'sm', !g),
      file,
      btn('Import', function () { try { var gm = G.Save.deserialize(ta.value.trim()); close(); UI.closeAllModals(); UI.start(gm); UI.toast('Game imported.'); } catch (e) { UI.toast('Invalid save data.'); } }, 'sm primary')]));
    w.appendChild(el('div', { class: 'sect' }, ['Settings']));
    var st = UI.settings;
    [['autosave', 'Autosave every turn', true], ['cloudAuto', 'Cloud autosave every 5 turns (if available)', true], ['autoNext', 'Auto-select next unit', true], ['promoBlock', 'Remind me about promotions', true], ['yields', 'Show tile yields', false], ['grid', 'Show hex grid', false], ['anim', 'Animated water, smoke & effects', true], ['sound', 'Sound effects', true], ['richgfx', 'Rich graphics — living sky & golden light', true]].forEach(function (s) {
      var cb = el('input', { type: 'checkbox', checked: (st[s[0]] != null ? st[s[0]] : s[2]) ? true : null, onchange: function () { st[s[0]] = cb.checked; UI.saveSettings(); if (G.GFX) { G.GFX.settings.anim = st.anim !== false; G.GFX.settings.rich = st.richgfx !== false; } if (UI.rend) { UI.rend.showYields = !!st.yields; UI.rend.showGrid = !!st.grid; UI.rend.request(); } } });
      w.appendChild(el('label', { class: 'check' }, [cb, s[1]]));
    });
    w.appendChild(el('div', { class: 'sect' }, ['Game']));
    w.appendChild(el('div', { style: { display: 'flex', gap: '6px', flexWrap: 'wrap' } }, [btn('New Game', function () { UI.confirm('Start a new game?', 'Unsaved progress since the last autosave will be lost.', function () { close(); S.setup(); }); }, 'danger'), btn('How to Play', function () { S.help(); })]));
    close = UI.modal('Menu', w, { cls: 'mid' });
  };
  S.help = function () {
    var w = el('div', { html: '<p><b>Controls.</b> Drag to pan, pinch or scroll to zoom. Tap a unit to select it; tap a tile to move (tap again to confirm long moves). Tap enemies in range to see a combat preview. Long-press (or right-click) any tile for details. Tap your city to manage it. Keyboard: arrows pan, Enter = next/end turn, Space = skip, F = fortify, B = found city, A = automate, E = explore, T = tech, P = policies, Y = yields.</p>' +
      '<p><b>Getting started.</b> Found your capital with the Settler right away. Build a Scout or Warrior, a Worker, then Settlers. Improve luxury resources (+4 happiness each) — expansion is limited by happiness exactly like Civilization V.</p>' +
      '<p><b>Long games.</b> Choose Marathon or Eternal speed on a Huge or Colossal map with many civilizations for a game that lasts days. The game autosaves every turn; use Menu → Export to move a save to another device.</p>' +
      '<p><b>Victory.</b> Domination, Science, Culture, Diplomatic or Time — see Empire → Victory for progress.</p>' });
    UI.modal('How to Play', w, { cls: 'mid' });
  };

  // =====================================================================
  //  SETUP
  // =====================================================================
  S.setup = function () {
    UI.closeAllModals();
    var opts = { civ: 'rome', size: 'standard', mapType: 'continents', speed: 'standard', difficulty: 'prince', numCivs: null, numCS: null, barbarians: true, ruins: true, seed: '', victories: { domination: 1, science: 1, culture: 1, diplomatic: 1, time: 1 } };
    try { var prev = JSON.parse(localStorage.getItem('aoe_lastsetup') || 'null'); if (prev) for (var k in prev) opts[k] = prev[k]; } catch (e) { }
    if (!D.CIVS[opts.civ]) opts.civ = 'rome';
    var w = el('div');
    w.appendChild(el('div', { class: 'setup-hero' }, [el('h1', {}, ['Ages of Empire']), el('div', { class: 'sub' }, ['Build an empire to stand the test of time']), el('div', { class: 'sub', style: { opacity: '0.75', fontSize: '0.85em' } }, ['Enhanced edition — living-sky graphics · faster AI turns · sound effects · same worlds, same saves'])]));
    var cont = el('div', { style: { display: 'flex', gap: '6px', justifyContent: 'center', flexWrap: 'wrap', margin: '6px 0' } });
    w.appendChild(cont);
    G.Save.get('Autosave').then(function (r) { if (r) cont.appendChild(btn('Continue: ' + (r.meta ? r.meta.leader + ' · Turn ' + r.meta.turn : 'Autosave'), function () { var gm = G.Save.deserialize(r.data); close(); UI.start(gm); }, 'primary')); });
    G.Save.cloudList().then(function (list) {
      if (!list) return;
      var auto = list.filter(function (x) { return x.name === 'Cloud Autosave'; })[0];
      if (auto) cont.insertBefore(btn('☁ Continue: ' + (auto.meta ? auto.meta.leader + ' · Turn ' + auto.meta.turn : 'Cloud'), function () { UI.toast('Loading from cloud…'); G.Save.cloudLoad(auto.id).then(function (gm) { if (gm) { close(); UI.start(gm); } }); }, 'primary'), cont.firstChild);
    });
    cont.appendChild(btn('Load Game…', function () { S.menu(); }));
    w.appendChild(el('div', { class: 'sect' }, ['Choose your civilization (' + Object.keys(D.CIVS).length + ')']));
    var detail = el('div', { class: 'small', style: { minHeight: '3.6em', margin: '4px 0' } });
    var grid = el('div', { class: 'civgrid' });
    var civKeys = Object.keys(D.CIVS).sort(function (a, b) { return D.CIVS[a].name.localeCompare(D.CIVS[b].name); });
    function showDetail() { var c = D.CIVS[opts.civ]; detail.innerHTML = ''; if (G.GFX && G.GFX.portrait) { var pc = G.GFX.portrait(opts.civ, 120); pc.className = 'portrait'; pc.style.cssText = 'float:left;width:56px;height:67px;margin:0 8px 2px 0'; detail.appendChild(pc); } detail.insertAdjacentHTML('beforeend', '<b class="gold">' + c.leader + '</b>, ' + c.title + ' of ' + c.name + ' (' + c.reign + ')<br><b>' + c.trait.name + ':</b> ' + c.trait.desc + '<br>Unique: ' + (c.uu ? c.uu.name + ' (' + D.UNITS[c.uu.base].name + ')' : '') + (c.uu2 ? ', ' + c.uu2.name : '') + (c.ub ? ', ' + c.ub.name : '') + (c.ui ? ', ' + D.IMPROVEMENTS[c.ui].name : '') + ' · Capital: ' + c.cities[0]); }
    civKeys.concat(['random']).forEach(function (k) {
      var c = D.CIVS[k];
      var card = el('div', { class: 'civcard' + (opts.civ === k ? ' sel' : ''), onclick: function () { opts.civ = k; grid.querySelectorAll('.civcard').forEach(function (x) { x.classList.remove('sel'); }); card.classList.add('sel'); if (k !== 'random') showDetail(); else detail.textContent = 'A random civilization will be chosen.'; } },
        [c && G.GFX && G.GFX.emblemEl ? G.GFX.emblemEl(c.col[0], c.col[1], k, 26) : el('div', { class: 'cs', style: { background: c ? c.col[0] : '#888', borderColor: c ? c.col[1] : '#ccc' } }), el('div', {}, [el('div', { class: 'ct' }, [c ? c.name : '🎲 Random']), el('div', { class: 'cl' }, [c ? c.leader : ''])])]);
      grid.appendChild(card);
    });
    w.appendChild(grid); w.appendChild(detail); if (opts.civ !== 'random') showDetail();
    function sel(label, key, obj, fmtFn) {
      var s = el('select', { onchange: function () { opts[key] = s.value; if (key === 'size') { numC.value = D.MAP_SIZES[s.value].civs; numS.value = D.MAP_SIZES[s.value].cs; opts.numCivs = null; opts.numCS = null; } } }, Object.keys(obj).map(function (k) { return el('option', { value: k, selected: opts[key] === k ? true : null }, [fmtFn ? fmtFn(k) : obj[k].name]); }));
      return el('label', {}, [label, s]);
    }
    var numC = el('input', { type: 'number', min: 2, max: 24, value: opts.numCivs || D.MAP_SIZES[opts.size].civs, onchange: function () { opts.numCivs = Math.max(2, Math.min(24, +numC.value)); } });
    var numS = el('input', { type: 'number', min: 0, max: 40, value: opts.numCS != null ? opts.numCS : D.MAP_SIZES[opts.size].cs, onchange: function () { opts.numCS = Math.max(0, Math.min(40, +numS.value)); } });
    var seed = el('input', { type: 'text', placeholder: 'random', value: opts.seed || '', onchange: function () { opts.seed = seed.value; } });
    var form = el('div', { class: 'formgrid' }, [
      sel('Map size', 'size', D.MAP_SIZES, function (k) { var m = D.MAP_SIZES[k]; return m.name + ' (' + m.w + '×' + m.h + ')'; }),
      sel('Map type', 'mapType', D.MAP_TYPES),
      sel('Game speed', 'speed', D.SPEEDS, function (k) { return D.SPEEDS[k].name + ' — ' + D.SPEEDS[k].turns + ' turns'; }),
      sel('Difficulty', 'difficulty', D.DIFFICULTIES),
      el('label', {}, ['Civilizations', numC]), el('label', {}, ['City-States', numS]), el('label', {}, ['Map seed', seed])
    ]);
    w.appendChild(form);
    var checks = el('div', { class: 'formgrid' });
    [['barbarians', 'Barbarians'], ['ruins', 'Ancient Ruins']].forEach(function (c) { var cb = el('input', { type: 'checkbox', checked: opts[c[0]] ? true : null, onchange: function () { opts[c[0]] = cb.checked; } }); checks.appendChild(el('label', { class: 'check' }, [cb, c[1]])); });
    ['domination', 'science', 'culture', 'diplomatic', 'time'].forEach(function (v) { var cb = el('input', { type: 'checkbox', checked: opts.victories[v] ? true : null, onchange: function () { opts.victories[v] = cb.checked ? 1 : 0; } }); checks.appendChild(el('label', { class: 'check' }, [cb, v.charAt(0).toUpperCase() + v.slice(1) + ' victory'])); });
    w.appendChild(checks);
    var close = UI.modal('New Game', w, { cls: 'mid', noClose: !UI.game, buttons: [UI.game ? ['Cancel', null] : null, ['Start Game', function () {
      var civ = opts.civ === 'random' ? Object.keys(D.CIVS)[Math.floor(Math.random() * Object.keys(D.CIVS).length)] : opts.civ;
      try { localStorage.setItem('aoe_lastsetup', JSON.stringify(opts)); } catch (e) { }
      $('busy').classList.remove('hidden'); $('busy-text').textContent = 'Generating world…'; $('busy-fill').style.width = '30%';
      setTimeout(function () {
        var seedN = opts.seed ? (isNaN(+opts.seed) ? hashStr(opts.seed) : +opts.seed) : null;
        var gm = E.newGame({ civ: civ, size: opts.size, mapType: opts.mapType, speed: opts.speed, difficulty: opts.difficulty, numCivs: opts.numCivs || D.MAP_SIZES[opts.size].civs, numCS: opts.numCS != null ? opts.numCS : D.MAP_SIZES[opts.size].cs, barbarians: opts.barbarians, ruins: opts.ruins, seed: seedN, victories: opts.victories });
        $('busy').classList.add('hidden');
        UI.start(gm);
      }, 30);
    }, 'primary']].filter(Boolean) });
  };
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  S.welcome = function () {
    var g = game(), p = human(), c = D.CIVS[p.civ];
    var wb = el('div', { html: '<p><b class="gold">' + c.leader + '</b>, ' + c.title + ' of ' + c.name + ' (' + c.reign + ').</p><p><b>' + c.trait.name + ':</b> ' + c.trait.desc + '</p><p>Your people await. Found your capital with the Settler, explore with your Scout, and guide ' + c.name + ' through ' + D.SPEEDS[g.speed].turns + ' turns of history.</p><p class="small">Tip: long-press any tile for details; tap the stats at the top for breakdowns.</p>' });
    if (G.GFX && G.GFX.portraitEl) { var pe = G.GFX.portraitEl(p.civ, 96); pe.style.float = 'left'; pe.style.margin = '0 12px 6px 0'; wb.insertBefore(pe, wb.firstChild); }
    UI.modal(c.name, wb, { buttons: [['Begin', null, 'primary']] });
  };

  // =====================================================================
  //  POPUPS
  // =====================================================================
  S.statInfo = function (id) {
    var g = game(), p = human(), ly = p.lastYields || {};
    var html = '';
    if (id === 'st-gold') html = 'Treasury ' + Math.floor(p.gold) + '<br>Income ' + (ly.income || 0) + ' · Expenses ' + (ly.maint || 0) + ' (buildings, units, roads)<br>Net ' + fmt(ly.gpt || 0) + ' per turn';
    if (id === 'st-sci') html = 'Science ' + fmt(ly.sci || 0) + ' per turn.<br>Researching: ' + (p.researching ? D.TECHS[p.researching].name : 'nothing');
    if (id === 'st-cul') html = 'Culture ' + Math.floor(p.culture) + ' / ' + R.policyCost(g, p) + ' for the next policy.<br>Lifetime culture ' + Math.floor(p.totalCulture);
    if (id === 'st-faith') html = 'Faith ' + Math.floor(p.faith) + ' (' + fmt(ly.faith || 0) + '/turn)<br>' + (p.pantheon ? 'Pantheon: ' + D.BELIEFS.pantheon[p.pantheon].name : 'Pantheon at ' + R.pantheonCost(g) + ' faith') + '<br>Next Great Prophet at ' + R.prophetCost(g, p);
    if (id === 'st-happy') { var h = E.happiness(g, p); html = '<b>Happiness ' + h.net + '</b><br>' + h.lines.map(function (l) { return l[0] + ': ' + (l[1] > 0 ? '+' : '') + Math.round(l[1]); }).join('<br>') + '<br>Golden Age: ' + (p.gaTurns > 0 ? p.gaTurns + ' turns left' : Math.floor(p.gaProgress) + '/' + R.goldenAgeThreshold(g, p)) + (h.net < 0 ? '<br><span class="bad">Unhappy: growth −75%' + (h.net <= -10 ? ', no growth, no settlers, combat penalty' : '') + '</span>' : ''); }
    if (id === 'st-tour') html = 'Tourism ' + Math.round(p.tourism || 0) + ' per turn. Great Works, wonders, hotels and airports generate tourism. Become Influential over every civilization for a Cultural Victory.';
    if (id === 'st-turn') html = 'Turn ' + g.turn + ' of ' + D.SPEEDS[g.speed].turns;
    UI.modal('Details', el('div', { html: html }), {});
  };
  S.tileInfo = function (t, quick) {
    var g = game(), m = g.map, p = human(), vis = UI.rend.visibility(t);
    if (!vis) { if (!quick) UI.toast('Unexplored'); return; }
    var tk = R.terrainKey(m, t), fk = R.featureKey(m, t);
    var parts = [(m.hills[t] ? 'Hills ' : '') + D.TERRAIN[tk].name + (fk ? ', ' + D.FEATURES[fk].name : '') + (m.river[t] ? ', River' : '')];
    if (m.nw[t]) parts.push('★ ' + D.NATURAL_WONDERS[IDS.nw.list[m.nw[t]]].name);
    if (m.res[t] && R.resVisible(p, R.resKey(m, t))) { var rd = D.RESOURCES[R.resKey(m, t)]; parts.push(rd.icon + ' ' + rd.name + (rd.type === 'strategic' ? ' ×' + m.resQty[t] : '') + ' (' + rd.type + ', needs ' + D.IMPROVEMENTS[rd.imp].name + ')'); }
    if (m.imp[t]) parts.push('Improvement: ' + (IDS.imp.list[m.imp[t]] === 'barb_camp' ? 'Barbarian Encampment' : (D.IMPROVEMENTS[IDS.imp.list[m.imp[t]]] || { name: 'Ruins' }).name) + (m.pillaged[t] ? ' (pillaged)' : ''));
    if (m.road[t]) parts.push(m.road[t] === 2 ? 'Railroad' : 'Road');
    if (m.hut[t]) parts.push('Ancient Ruins');
    if (m.owner[t] >= 0) parts.push('Owner: ' + g.players[m.owner[t]].name);
    parts.push('Yield: ' + (yicons(R.tileYield(g, t, p, null)) || 'nothing'));
    if (vis === 2) E.unitsAt(g, t).forEach(function (u) { parts.push((u.owner === p.id ? '' : g.players[u.owner].adj + ' ') + D.UNITS[u.type].name + ' (' + Math.round(u.hp) + ' HP)'); });
    if (quick) { UI.toast(parts.slice(0, 3).join(' · '), 2600); return; }
    UI.modal('Tile', el('div', { html: parts.join('<br>') }), {});
  };
  S.foreignCity = function (c) {
    var g = game(), o = g.players[c.owner], p = human();
    var html = '<b>' + c.name + '</b> — ' + o.name + (o.isCS ? ' (' + D.CS_TYPES[o.csType].name + ' City-State)' : '') + '<br>Population ' + c.pop + ' · Defense ' + Math.round(E.cityStrength(g, c)) + ' · HP ' + Math.round(c.hp) + '/' + E.cityMaxHp(g, c);
    if (c.wonders.length) html += '<br>Wonders: ' + c.wonders.map(function (w) { return D.WONDERS[w].name; }).join(', ');
    var rel = E.majorityReligion(c); if (rel && g.religions[rel]) html += '<br>Religion: ' + g.religions[rel].name;
    if (o.isCS) html += '<br>Your influence: ' + Math.round(o.csInfluence[p.id] || 0) + (o.ally != null ? ' · Ally: ' + g.players[o.ally].name : '');
    UI.modal(c.name, el('div', { html: html }), { buttons: [['Close', null], ['Diplomacy', function () { S.diplo(); }]] });
  };
  S.combatPreview = function (u, t, info) {
    var g = game(), p = human();
    if (info.kind === 'capture') { UI.doAttack(u, t); return; }
    var defName = info.city ? info.city.name + ' (city)' : D.UNITS[info.target.type].name;
    var defOwner = info.city ? g.players[info.city.owner] : g.players[info.target.owner];
    var defHp = info.city ? info.city.hp : info.target.hp;
    function mods(lines) { return el('div', { class: 'mods' }, lines.filter(function (l) { return l[1]; }).map(function (l) { return el('div', {}, [l[0] + ' ' + (l[1] > 0 ? '+' : '') + l[1] + '%']); })); }
    var verdict, dd = info.dmg.toDef, da = info.dmg.toAtk;
    if (dd >= defHp) verdict = info.city && info.kind !== 'meleeCity' ? 'City reduced to 1 HP' : (info.kind === 'meleeCity' ? 'City captured!' : 'Decisive Victory');
    else if (da >= u.hp) verdict = 'Your unit will likely die!';
    else if (dd > da * 1.5) verdict = 'Major Victory'; else if (dd > da) verdict = 'Minor Victory'; else if (dd * 1.5 < da) verdict = 'Major Defeat'; else verdict = 'Stalemate';
    var w = el('div', {}, [el('div', { class: 'combat' }, [
      el('div', { class: 'side' }, [el('b', {}, [D.UNITS[u.type].name]), el('div', { class: 'big' }, [String(Math.round(info.atk.str * 10) / 10)]), el('div', { class: 'small' }, ['HP ' + Math.round(u.hp) + ' → ' + Math.max(0, Math.round(u.hp - da))]), mods(info.atk.lines)]),
      el('div', { class: 'vs' }, ['vs']),
      el('div', { class: 'side' }, [el('b', {}, [defOwner.adj + ' ' + defName]), el('div', { class: 'big' }, [String(Math.round(info.def.str * 10) / 10)]), el('div', { class: 'small' }, ['HP ' + Math.round(defHp) + ' → ' + Math.max(info.city && info.kind !== 'meleeCity' ? 1 : 0, Math.round(defHp - dd))]), mods(info.def.lines)])
    ]), el('h3', { style: { textAlign: 'center' } }, [verdict]), el('div', { class: 'small', style: { textAlign: 'center' } }, ['Expected damage (actual varies ±20%). ' + (E.atWar(g, p.id, defOwner.id) ? '' : '')])]);
    UI.modal('Combat', w, { buttons: [['Cancel', null], ['⚔ Attack', function () { UI.doAttack(u, t); }, 'primary']] });
  };
  S.captureChoice = function (c) {
    var g = game(), p = human();
    var orig = g.players[c.original];
    var buttons = [['Annex', function () { c.puppet = false; c.occupied = true; UI.refresh(); }, 'primary'], ['Puppet', function () { c.puppet = true; c.occupied = false; c.build = null; UI.refresh(); }]];
    if (!c.originalCapital) buttons.push(['Raze', function () { c.razing = true; UI.refresh(); }, 'danger']);
    if (c.original !== p.id && orig && orig.alive && orig.id !== g.players.indexOf(p) && orig.cities.length >= 0 && c.original !== c.owner) buttons.push(['Liberate', function () { E.liberate(g, c, p); UI.refresh(); }]);
    UI.modal('City Captured: ' + c.name, el('div', { html: '<p>You have captured <b>' + c.name + '</b> (population ' + c.pop + ').</p><p><b>Annex</b>: full control, but extra unhappiness until a Courthouse is built.<br><b>Puppet</b>: governed automatically, less unhappiness, less science/culture.<br>' + (c.originalCapital ? '' : '<b>Raze</b>: burn it down over several turns.<br>') + '<b>Liberate</b>: return it to its original owner for their gratitude.</p>' }), { noClose: true, buttons: buttons });
  };
  S.promotions = function (u) {
    var g = game(), opts = U.promoOptions(u), close;
    var L = el('div', { class: 'list' });
    opts.forEach(function (k) { var pd = D.PROMOTIONS[k] || { name: 'Instant Heal', desc: 'Heal 50 HP' }; L.appendChild(el('div', { class: 'item', onclick: function () { U.promote(g, u, k); close(); UI.select(u, true); UI.refresh(); if (u.pendingPromo) S.promotions(u); } }, [el('div', { class: 'nm' }, ['★ ' + pd.name, el('span', { class: 'small' }, [pd.desc])])])); });
    close = UI.modal('Promote ' + D.UNITS[u.type].name, L, {});
  };
  S.buildMenu = function (u) {
    var g = game(), opts = U.buildOptions(g, u), close;
    var L = el('div', { class: 'list' });
    opts.forEach(function (o) {
      var name = o.id === 'road' ? 'Road' : o.id === 'railroad' ? 'Railroad' : o.id === 'repair' ? 'Repair' : o.id.indexOf('remove_') === 0 ? 'Remove ' + o.id.substr(7) : D.IMPROVEMENTS[o.id].name;
      var desc = D.IMPROVEMENTS[o.id] ? yicons(D.IMPROVEMENTS[o.id].y || {}) : '';
      L.appendChild(el('div', { class: 'item', onclick: function () { U.startBuild(g, u, o.id); close(); UI.afterUnitAction(g.units[u.id] ? u : null); } }, [el('div', { class: 'nm' }, [name, el('span', { class: 'small' }, [desc])]), el('div', { class: 'right' }, [o.turns ? Math.round(o.turns * Math.sqrt(R.speedCost(g))) + ' turns' : 'instant'])]));
    });
    close = UI.modal('Build', L, {});
  };
  S.rebase = function (u) {
    var g = game(), list = U.rebaseTargets(g, u), close;
    var L = el('div', { class: 'list' });
    if (!list.length) L.appendChild(el('div', { class: 'small' }, ['No cities in range.']));
    list.forEach(function (c) { L.appendChild(el('div', { class: 'item', onclick: function () { U.rebase(g, u, c); close(); UI.afterUnitAction(u); } }, [el('div', { class: 'nm' }, [c.name + ' (' + Hex.distance(u.tile, c.tile) + ' tiles)'])])); });
    close = UI.modal('Rebase', L, {});
  };
  S.tradeRoute = function (u) {
    var g = game(), list = E.tradeTargets(g, u), close;
    var L = el('div', { class: 'list' });
    if (!list.length) L.appendChild(el('div', { class: 'small' }, ['No valid destinations in range. Meet more civilizations or move to another city.']));
    list.forEach(function (o) {
      var v = o.value, c = o.city, own = g.players[c.owner];
      var desc = v.domestic ? 'Domestic: sends 🌾' + v.food + ' (or ⚒) to ' + c.name : '💰' + v.goldFrom + (v.sciFrom ? ' ⚗' + v.sciFrom : '') + ' for you · they get 💰' + v.goldTo;
      L.appendChild(el('div', { class: 'item' }, [el('div', { class: 'nm' }, [c.name + ' (' + own.name + ')', el('span', { class: 'small' }, [desc])]),
        v.domestic ? btn('Food', function () { E.establishTrade(g, u, c, 'food'); close(); UI.afterUnitAction(null); }, 'sm') : null,
        btn(v.domestic ? 'Production' : 'Establish', function () { E.establishTrade(g, u, c, 'prod'); close(); UI.afterUnitAction(null); }, 'sm primary')]));
    });
    close = UI.modal('Trade Route', L, {});
  };
  S.chooseGP = function () {
    var g = game(), p = human(), close;
    var L = el('div', { class: 'list' });
    ['scientist', 'engineer', 'merchant', 'artist', 'writer', 'musician', 'prophet', 'general', 'admiral'].forEach(function (t) {
      L.appendChild(el('div', { class: 'item', onclick: function () { p.freeGPChoice--; E.spawnGP(g, p, t); close(); UI.refresh(); } }, [el('div', { class: 'nm' }, [D.GREAT_PEOPLE[t].name])]));
    });
    close = UI.modal('Choose a Great Person', L, {});
  };
  S.victory = function () {
    var g = game(), v = g.victory, p = human();
    if (!v) return;
    var won = v.winner === p.id;
    var wn = v.winner >= 0 ? g.players[v.winner] : null;
    var html = v.type === 'defeat' ? '<h2 class="bad">Your civilization has fallen.</h2>' : won ? '<h2 class="good">' + v.type.toUpperCase() + ' VICTORY!</h2><p>' + p.leader + ', your name will echo through the ages.</p>' : '<h2 class="bad">Defeat</h2><p>' + wn.name + ' has achieved a ' + v.type + ' victory.</p>';
    html += '<p class="small">Turn ' + v.turn + ' · ' + E.yearOf(g) + '</p>';
    var rows = g.players.filter(function (o) { return !o.isCS && !o.isBarb; }).sort(function (a, b) { return (b.score || 0) - (a.score || 0); }).map(function (o) { return o.name + ': ' + (o.score || 0); }).join('<br>');
    UI.modal('Game Over', el('div', { html: html + '<p>' + rows + '</p>' }), { buttons: [['Keep Playing', function () { if (g.victory.type !== 'defeat') { g.victory = null; g.victoryShown = false; g.continueAfterVictory = true; } }], ['New Game', function () { S.setup(); }, 'primary']] });
  };

  return S;
})();
