// ============================================================
//  Units: movement, pathfinding, zone of control, embarking,
//  combat (Civ V damage curve), promotions, worker builds, actions
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Units = (function () {
  var D = G.D, IDS = G.IDS, Hex = G.Hex, R = G.Rules, MG = G.MapGen, E = G.Engine;
  var U = {};
  var EPS = 1e-6;

  function def(u) { return D.UNITS[u.type]; }
  U.def = def;
  function owner(game, u) { return game.players[u.owner]; }
  function isMilitary(d) { return d.cls !== 'civilian' && d.cls !== 'gp'; }
  U.isMilitary = function (u) { return isMilitary(def(u)); };
  function isWaterT(game, t) { return R.isWater(game.map, t); }
  U.embarked = function (game, u) { return def(u).domain === 'land' && isWaterT(game, u.tile) && !E.cityAt(game, u.tile); };

  U.maxMoves = function (game, u) {
    var d = def(u), p = owner(game, u), mods = p.mods || {};
    var mv = d.mv;
    u.promos.forEach(function (pr) { var pd = D.PROMOTIONS[pr]; if (pd && pd.moves) mv += pd.moves; });
    if (d.domain === 'sea') mv += mods.navalMoves || 0;
    if (d.domain === 'land' && isMilitary(d)) mv += mods.landMoves || 0;
    if (d.cls === 'mounted') mv += mods.mountedMoves || 0;
    if (U.embarked(game, u)) { mv = 2 + (p.techs.astronomy ? 1 : 0) + (p.techs.steam_power ? 1 : 0) + (p.techs.combustion ? 1 : 0) + (mods.embarkMoves || 0); }
    if (d.cls === 'gp' && d.domain === 'land') mv = Math.max(mv, 2);
    return mv;
  };

  // ---------------- Tile access ----------------
  U.canEnter = function (game, u, t, opts) {
    var m = game.map, d = def(u), p = owner(game, u);
    opts = opts || {};
    if (t < 0) return false;
    var tk = R.terrainKey(m, t), fk = R.featureKey(m, t);
    var city = E.cityAt(game, t);
    if (d.domain === 'air') return false;
    if (fk === 'ice') return false;
    if (d.domain === 'sea') {
      if (city) return city.owner === u.owner || (opts.attack && E.atWar(game, u.owner, city.owner));
      if (!D.TERRAIN[tk].water) return false;
      if (d.flags && d.flags.indexOf('coastOnly') >= 0 && tk === 'ocean') return false;
    } else {
      if (tk === 'mountain' || m.nw[t] && D.NATURAL_WONDERS[IDS.nw.list[m.nw[t]]].terrainLike === 'mountain') {
        if (!(d.flags && d.flags.indexOf('hover') >= 0)) return false;
      }
      if (D.TERRAIN[tk].water && !city) {
        if (p.isBarb) return false;
        if (!p.techs.optics && !p.mods.earlyOcean) return false;
        if (tk === 'ocean' && !p.techs.astronomy && !p.mods.earlyOcean) return false;
      }
      if (city && city.owner !== u.owner && !opts.attack) return false;
    }
    // borders: can't enter foreign major-civ territory without open borders or war
    var ow = m.owner[t];
    if (ow >= 0 && ow !== u.owner && !p.isBarb) {
      var o = game.players[ow];
      if (!o.isCS && !o.isBarb && !E.atWar(game, u.owner, ow)) {
        var r = o.relations[u.owner];
        if (!(r && r.openBorders > 0) && isMilitary(d)) return false;
        if (!(r && r.openBorders > 0) && !isMilitary(d) && d.cls !== 'gp' && u.type !== 'caravan' && u.type !== 'missionary' && u.type !== 'cargo_ship' && u.type !== 'work_boat') return false;
      }
    }
    return true;
  };
  // Units on tile helpers
  U.unitsOn = function (game, t) { return E.unitsAt(game, t); };
  U.militaryOn = function (game, t) {
    var us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) if (isMilitary(def(us[i])) && def(us[i]).domain !== 'air') return us[i];
    return null;
  };
  U.civilianOn = function (game, t) {
    var us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) if (!isMilitary(def(us[i]))) return us[i];
    return null;
  };
  function enemyMilitaryOn(game, u, t) {
    var us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) { var o = us[i]; if (o.owner !== u.owner && isMilitary(def(o)) && def(o).domain !== 'air' && E.atWar(game, u.owner, o.owner)) return o; }
    return null;
  }
  function enemyAny(game, u, t) {
    var us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) { var o = us[i]; if (o.owner !== u.owner && def(o).domain !== 'air' && E.atWar(game, u.owner, o.owner)) return o; }
    return null;
  }
  function foreignUnitOn(game, u, t) {
    var us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) if (us[i].owner !== u.owner && def(us[i]).domain !== 'air') return us[i];
    return null;
  }
  // Can u end its move on t (stacking limits)
  U.canStop = function (game, u, t) {
    var d = def(u), us = E.unitsAt(game, t);
    for (var i = 0; i < us.length; i++) {
      var o = us[i]; if (o === u) continue;
      if (o.owner !== u.owner) return false;
      var od = def(o);
      if (od.domain === 'air' || d.domain === 'air') continue;
      if (isMilitary(od) === isMilitary(d)) {
        // naval and land military can share a city
        if (E.cityAt(game, t) && od.domain !== d.domain) continue;
        return false;
      }
    }
    return true;
  };

  function inEnemyZOC(game, u, t) {
    var nb = Hex.neighbors(t);
    for (var i = 0; i < nb.length; i++) {
      if (enemyMilitaryOn(game, u, nb[i])) return true;
      var c = E.cityAt(game, nb[i]);
      if (c && E.atWar(game, u.owner, c.owner)) return true;
    }
    return false;
  }

  U.moveCost = function (game, u, from, to) {
    var m = game.map, d = def(u), p = owner(game, u), mods = p.mods || {};
    if (d.domain === 'sea') return 1;
    var toWater = isWaterT(game, to) && !E.cityAt(game, to), fromWater = isWaterT(game, from) && !E.cityAt(game, from);
    if (toWater !== fromWater) return 99; // embark / disembark uses all moves
    if (toWater) return 1;
    var fromCity = E.cityAt(game, from), toCity = E.cityAt(game, to);
    var rFrom = m.road[from] || (fromCity ? 1 : 0), rTo = m.road[to] || (toCity ? 1 : 0);
    if (mods.forestRoads) {
      var ff = R.featureKey(m, from), ft = R.featureKey(m, to);
      if ((ff === 'forest' || ff === 'jungle') && m.owner[from] === p.id) rFrom = rFrom || 1;
      if ((ft === 'forest' || ft === 'jungle') && m.owner[to] === p.id) rTo = rTo || 1;
    }
    var roadOk = !(m.river[from] && m.river[to] && false);
    if (rFrom && rTo && roadOk) {
      if (rFrom === 2 && rTo === 2 && !E.atWar(game, u.owner, m.owner[to] >= 0 ? m.owner[to] : u.owner)) return D.ROADS.railroad.moveCost;
      return D.ROADS.road.moveCost;
    }
    if (d.flags && d.flags.indexOf('ignoreTerrain') >= 0) return 1;
    var cost = 1;
    if (m.hills[to] && !mods.hillsMove) cost = Math.max(cost, 2);
    var fk = R.featureKey(m, to);
    if (fk && D.FEATURES[fk].move > cost) cost = D.FEATURES[fk].move;
    // Great Wall: enemy units in owner's territory
    var ow = m.owner[to];
    if (ow >= 0 && ow !== u.owner && E.atWar(game, u.owner, ow) && game.players[ow].mods.enemyBorderSlow && p.era < 4) cost = 99;
    return cost;
  };

  // ---------------- Pathfinding (A*) ----------------
  function Heap() { this.a = []; }
  Heap.prototype.push = function (n) { var a = this.a; a.push(n); var i = a.length - 1; while (i > 0) { var p = (i - 1) >> 1; if (a[p].f <= a[i].f) break; var t = a[p]; a[p] = a[i]; a[i] = t; i = p; } };
  Heap.prototype.pop = function () { var a = this.a, top = a[0], last = a.pop(); if (a.length) { a[0] = last; var i = 0; for (;;) { var l = 2 * i + 1, r = l + 1, s = i; if (l < a.length && a[l].f < a[s].f) s = l; if (r < a.length && a[r].f < a[s].f) s = r; if (s === i) break; var t = a[s]; a[s] = a[i]; a[i] = t; i = s; } } return top; };
  Heap.prototype.size = function () { return this.a.length; };

  // Returns array of tiles from (excluding) start to target, or null.
  // Accounts for turns: costs over the remaining moves end the turn.
  U.findPath = function (game, u, target, opts) {
    opts = opts || {};
    var start = u.tile;
    if (start === target) return [];
    var maxMv = U.maxMoves(game, u);
    var limit = opts.limit || 3000;
    var p = owner(game, u);
    var open = new Heap(), best = {}, came = {};
    // node cost measured in "move points", turn-aware: g = turns*maxMv + used
    var startUsed = maxMv - u.moves;
    open.push({ t: start, g: startUsed, f: 0 });
    best[start] = startUsed;
    var expanded = 0;
    var vis = p.explored;
    // v2 perf: zone-of-control status is fixed during one search — memoize it
    // (was recomputed for every neighbour expansion; the #1 CPU hotspot).
    var zocCache = {};
    function zoc(t) { var z = zocCache[t]; if (z === undefined) { z = inEnemyZOC(game, u, t); zocCache[t] = z; } return z; }
    while (open.size()) {
      var cur = open.pop();
      if (cur.g > best[cur.t] + EPS) continue;
      if (cur.t === target) break;
      if (++expanded > limit) return null;
      for (var i = 0; i < 6; i++) {
        var nt = Hex.neighbor(cur.t, i);
        if (nt < 0) continue;
        if (!p.isHuman ? false : !vis[nt] && nt !== target) { /* unexplored tiles allowed but costly */ }
        var isTarget = nt === target;
        if (!U.canEnter(game, u, nt, { attack: isTarget && opts.attack })) continue;
        var foreign = foreignUnitOn(game, u, nt);
        if (foreign && !(isTarget && opts.attack)) {
          // can't path through foreign units
          if (!(isTarget && !E.atWar(game, u.owner, foreign.owner) && false)) continue;
        }
        var c = U.moveCost(game, u, cur.t, nt);
        if (p.isHuman && !vis[nt]) c = Math.max(c, 1.5);
        // turn-aware
        var turns = Math.floor((cur.g + EPS) / maxMv), used = cur.g - turns * maxMv;
        if (used < 0) used = 0;
        var g;
        // Civ V: a unit with any moves left may always enter; costs beyond the remaining moves end the turn
        if (c >= 99 || used + c > maxMv + EPS) g = (turns + 1) * maxMv;
        else g = cur.g + c;
        // ZOC
        if (c < 99 && isMilitary(def(u)) && !p.isBarb && zoc(cur.t) && zoc(nt)) g = Math.ceil(g / maxMv - EPS) * maxMv;
        // can't stop on occupied tile at turn end (approximation: penalty)
        if (!isTarget && !U.canStop(game, u, nt)) g += 0.01;
        if (best[nt] === undefined || g < best[nt] - EPS) {
          best[nt] = g; came[nt] = cur.t;
          var h = Hex.distanceFast(nt, target) * 0.3;
          open.push({ t: nt, g: g, f: g + h });
        }
      }
    }
    if (best[target] === undefined) return null;
    var path = [], t = target;
    while (t !== start) { path.push(t); t = came[t]; if (t === undefined) return null; }
    path.reverse();
    return path;
  };
  // Tiles reachable this turn (for highlighting)
  U.reachable = function (game, u) {
    var res = {}, maxMv = U.maxMoves(game, u);
    if (u.moves <= EPS) return res;
    var open = new Heap(); open.push({ t: u.tile, g: 0, f: 0 });
    var best = {}; best[u.tile] = 0;
    var mil = isMilitary(def(u)), p = owner(game, u);
    var zocCache = {};
    function zoc(t) { var z = zocCache[t]; if (z === undefined) { z = inEnemyZOC(game, u, t); zocCache[t] = z; } return z; }
    while (open.size()) {
      var cur = open.pop();
      if (cur.g > best[cur.t] + EPS) continue;
      if (cur.g >= u.moves - EPS) continue;
      for (var i = 0; i < 6; i++) {
        var nt = Hex.neighbor(cur.t, i);
        if (nt < 0) continue;
        if (!U.canEnter(game, u, nt)) continue;
        if (foreignUnitOn(game, u, nt)) continue;
        var c = U.moveCost(game, u, cur.t, nt);
        var g = cur.g + c;
        if (c >= 99 || g > u.moves) g = u.moves; // last step
        if (mil && !p.isBarb && zoc(cur.t) && zoc(nt)) g = u.moves;
        if (best[nt] === undefined || g < best[nt] - EPS) { best[nt] = g; open.push({ t: nt, g: g, f: g }); if (U.canStop(game, u, nt)) res[nt] = true; }
      }
    }
    return res;
  };

  // ---------------- Movement execution ----------------
  // Moves unit along a path as far as it can this turn. Returns list of tiles stepped.
  U.moveTo = function (game, u, target, opts) {
    opts = opts || {};
    var steps = [];
    if (u.moves <= EPS) { u.orders = { type: 'goto', target: target }; return steps; }
    var path = U.findPath(game, u, target, { attack: false });
    if (!path) { u.orders = null; return steps; }
    u.orders = { type: 'goto', target: target };
    for (var i = 0; i < path.length; i++) {
      var nt = path[i];
      if (u.moves <= EPS) break;
      var last = i === path.length - 1;
      // don't end turn on an occupied tile: look ahead
      var cost = U.moveCost(game, u, u.tile, nt);
      if (!U.canStop(game, u, nt)) {
        // only step if we can continue beyond it this turn
        var nxt = path[i + 1];
        if (nxt == null) break;
        var c2 = U.moveCost(game, u, nt, nxt);
        if (u.moves - Math.min(cost, u.moves) < EPS || c2 >= 99) break;
      }
      if (foreignUnitOn(game, u, nt)) break;
      if (!U.canEnter(game, u, nt)) break;
      var zoc = isMilitary(def(u)) && !owner(game, u).isBarb && inEnemyZOC(game, u, u.tile) && inEnemyZOC(game, u, nt);
      stepInto(game, u, nt);
      steps.push(nt);
      if (cost >= 99 || zoc) u.moves = 0;
      else u.moves = Math.max(0, u.moves - cost);
      if (u.orders == null) break; // interrupted (hut etc.)
      if (u.moves <= EPS && !U.canStop(game, u, u.tile)) { /* stuck: allowed temporarily */ }
    }
    if (u.tile === target) u.orders = null;
    u.fortify = 0; u.sleep = false;
    E.updateVisibility(game, owner(game, u), true); // v2 perf: light refresh (full pass runs at turn start)
    return steps;
  };
  function stepInto(game, u, t) {
    var from = u.tile;
    u.tile = t;
    var p = owner(game, u), m = game.map;
    // capture enemy civilians
    var civ = E.unitsAt(game, t).filter(function (o) { return o !== u && o.owner !== u.owner && !isMilitary(def(o)); });
    civ.forEach(function (o) {
      if (!E.atWar(game, u.owner, o.owner) || !isMilitary(def(u))) return;
      var od = def(o), op = game.players[o.owner];
      if ((o.type === 'worker' || o.type === 'settler') && !p.isBarb) {
        E.removeUnit(game, o, 'captured');
        var nu = E.createUnit(game, p, 'worker', t); nu.moves = 0;
        E.note(game, p, 'Captured an enemy ' + od.name + '!', t, 'good');
        E.note(game, op, 'Your ' + od.name + ' was captured!', t, 'bad');
      } else {
        if (o.type === 'caravan' || o.type === 'cargo_ship') p.gold += 100;
        E.removeUnit(game, o, 'killed');
        E.note(game, op, 'Your ' + od.name + ' was destroyed!', t, 'bad');
      }
    });
    // barbarian camp
    if (R.impKey(m, t) === 'barb_camp' && !p.isBarb) {
      m.imp[t] = 0;
      var g = 25 * (p.mods.campGold || 1);
      p.gold += g;
      E.note(game, p, 'Destroyed a barbarian encampment! +' + g + ' gold.', t, 'good');
      game.players.forEach(function (cs) { if (cs.isCS && cs.alive && cs.cities.some(function (cid) { var c = game.cities[cid]; return c && Hex.distance(c.tile, t) < 8; })) cs.csInfluence[p.id] = (cs.csInfluence[p.id] || 0) + 15; });
    }
    // ruins
    if (m.hut[t] && !p.isBarb && !p.isCS) { m.hut[t] = 0; enterRuins(game, u, p); }
    E.emit({ type: 'unitMoved', unit: u, from: from, to: t });
  }
  U.stepInto = stepInto;

  function enterRuins(game, u, p) {
    var rng = game.rng, opts = ['gold', 'culture', 'faith', 'map', 'pop', 'tech', 'upgrade', 'scout'];
    if (!p.pantheon) opts.push('faith', 'faith');
    var pick = rng.pick(opts), msg = '';
    if (pick === 'gold') { var g = rng.range(50, 100); p.gold += g; msg = 'found ' + g + ' gold'; }
    else if (pick === 'culture') { var c = Math.round(20 * R.speedCost(game)); p.culture += c; p.totalCulture += c; msg = 'gained ' + c + ' culture'; }
    else if (pick === 'faith') { var f = Math.round(20 * R.speedCost(game)); p.faith += f; msg = 'gained ' + f + ' faith'; }
    else if (pick === 'map') { Hex.within(u.tile, 6).forEach(function (t) { p.explored[t] = 1; }); msg = 'found a map of the surroundings'; }
    else if (pick === 'pop') {
      var near = p.cities.map(function (cid) { return game.cities[cid]; }).filter(Boolean).sort(function (a, b) { return Hex.distance(a.tile, u.tile) - Hex.distance(b.tile, u.tile); })[0];
      if (near) { near.pop++; msg = near.name + ' gained a citizen'; } else { p.gold += 60; msg = 'found 60 gold'; }
    }
    else if (pick === 'tech') { var o = E.researchOptions(p).filter(function (t) { return D.TECHS[t].era === 0; }); if (o.length) { var t = rng.pick(o); E.grantTech(game, p, t); msg = 'learned ' + D.TECHS[t].name; } else { p.gold += 80; msg = 'found 80 gold'; } }
    else if (pick === 'upgrade' && def(u).upg && isMilitary(def(u))) { var nt = R.civUnit(p, def(u).upg); u.type = nt; msg = 'unit upgraded to ' + D.UNITS[nt].name; }
    else { var nu = E.createUnit(game, p, 'scout', u.tile); placeNear(game, nu, u.tile); msg = 'a Scout joined you'; }
    E.note(game, p, 'Ancient Ruins: ' + msg + '!', u.tile, 'good');
  }

  function placeNear(game, u, t) {
    if (U.canStop(game, u, t) && (U.canEnter(game, u, t) || E.cityAt(game, t))) { u.tile = t; return true; }
    var ring = Hex.within(t, 2);
    for (var i = 1; i < ring.length; i++) { if (U.canEnter(game, u, ring[i]) && U.canStop(game, u, ring[i]) && !foreignUnitOn(game, u, ring[i])) { u.tile = ring[i]; return true; } }
    u.tile = t; return false;
  }
  U.placeNewUnit = function (game, u, city) {
    u.tile = city.tile;
    if (!U.canStop(game, u, city.tile)) placeNear(game, u, city.tile);
  };

  // ---------------- Turn start ----------------
  U.startTurnUnit = function (game, u) {
    var p = owner(game, u), d = def(u), m = game.map;
    // healing
    if (!u.acted || u.promos.indexOf('march') >= 0) {
      if (u.hp < 100) {
        var heal = 10;
        var city = E.cityAt(game, u.tile);
        var ow = m.owner[u.tile];
        if (city && city.owner === u.owner) heal = 25;
        else if (ow === u.owner) heal = 20;
        else if (ow >= 0 && E.atWar(game, u.owner, ow)) heal = 5;
        if (d.domain === 'sea' && !city && u.promos.indexOf('supply') < 0) heal = ow === u.owner ? 0 : 0;
        if (d.domain === 'sea' && u.promos.indexOf('supply') >= 0) heal = 15;
        // medic adjacent
        Hex.neighbors(u.tile).concat([u.tile]).forEach(function (t) { E.unitsAt(game, t).forEach(function (o) { if (o.owner === u.owner && o !== u && o.promos.indexOf('medic') >= 0) heal += 10; }); });
        if (p.isBarb) heal = 10;
        u.hp = Math.min(100, u.hp + heal);
      }
    }
    u.acted = false;
    u.attacks = 0;
    u.moves = U.maxMoves(game, u);
    if (u.fortify > 0 || (u.orders && u.orders.type === 'fortify')) u.fortify = Math.min(2, (u.fortify || 0) + 1);
    if (u.orders && u.orders.type === 'heal' && u.hp >= 100) u.orders = null;
    // worker build progress
    if (u.build) {
      var speed = 1 + (p.mods.workerSpeed || 0) / 100;
      u.build.left -= speed;
      if (u.build.left <= 0) finishBuild(game, u);
    }
    // air units stay put
  };

  // ---------------- Combat ----------------
  function roughTile(game, t) {
    var m = game.map, fk = R.featureKey(m, t);
    return m.hills[t] || fk === 'forest' || fk === 'jungle' || fk === 'marsh';
  }
  function generalNear(game, u) {
    var d = def(u), best = 0;
    var tiles = Hex.within(u.tile, 2);
    for (var i = 0; i < tiles.length; i++) {
      var us = E.unitsAt(game, tiles[i]);
      for (var k = 0; k < us.length; k++) {
        var o = us[k];
        if (o.owner !== u.owner) continue;
        if ((o.type === 'great_general' && d.domain === 'land') || (o.type === 'great_admiral' && d.domain === 'sea')) best = 15 + (owner(game, u).mods.generalAuraPct || 0);
      }
    }
    return best;
  }
  // role: 'melee' (attacking), 'defend', 'ranged' (attacking with rs), 'rdefend' (defending vs ranged)
  U.strength = function (game, u, role, oppUnit, oppCity, tile) {
    var d = def(u), p = owner(game, u), mods = p.mods || {}, m = game.map;
    var t = tile != null ? tile : u.tile;
    var base = (role === 'ranged') ? (d.rs || 0) : (d.str || 0);
    var lines = [];
    if (U.embarked(game, u) && (role === 'defend' || role === 'rdefend')) {
      var es = 5 + p.era * 4;
      return { str: es, lines: [['Embarked', 0]] };
    }
    var pct = 0;
    function add(label, v) { if (v) { pct += v; lines.push([label, v]); } }
    var defending = role === 'defend' || role === 'rdefend';
    if (defending && !(d.flags && d.flags.indexOf('noDefTerrain') >= 0) && d.domain === 'land') {
      var tdef = 0;
      if (m.hills[t]) tdef += 25;
      var fk = R.featureKey(m, t); if (fk) tdef += D.FEATURES[fk].def || 0;
      if (fk === 'marsh' || fk === 'floodplains') tdef = Math.min(tdef, D.FEATURES[fk].def);
      var ik = R.impKey(m, t);
      if (ik && D.IMPROVEMENTS[ik] && D.IMPROVEMENTS[ik].def && m.owner[t] === u.owner) tdef += D.IMPROVEMENTS[ik].def;
      add('Terrain', tdef);
      if (u.fortify > 0 && d.cls !== 'mounted' && d.cls !== 'armor') add('Fortified', 25);
      if (role === 'rdefend') { var cv = 0; u.promos.forEach(function (pr) { cv += (D.PROMOTIONS[pr] && D.PROMOTIONS[pr].vsRanged) || 0; }); add('Cover', cv); }
    }
    // promotions: terrain
    var rough = roughTile(game, defending ? t : (oppUnit ? oppUnit.tile : (oppCity ? oppCity.tile : t)));
    var pr = { open: 0, rough: 0, ropen: 0, rrough: 0, vsLand: 0, vsNaval: 0, vsCityP: 0, vsWounded: 0 };
    u.promos.forEach(function (k) { var pd = D.PROMOTIONS[k]; if (pd) for (var kk in pr) if (pd[kk]) pr[kk] += pd[kk]; });
    if (role === 'ranged') add('Promotions', rough ? pr.rrough : pr.ropen);
    else if (!oppCity) add('Promotions', rough ? pr.rough : pr.open);
    if (oppUnit && def(oppUnit).domain === 'land' && pr.vsLand) add('Bombardment', pr.vsLand);
    if (oppUnit && def(oppUnit).domain === 'sea' && pr.vsNaval) add('Targeting', pr.vsNaval);
    if (oppCity && !defending) add('Siege', pr.vsCityP);
    if (oppUnit && oppUnit.hp < 100 && pr.vsWounded && !defending) add('Charge', pr.vsWounded);
    // unit class bonuses
    if (oppUnit && d.vs) {
      var oc = def(oppUnit).cls;
      if (d.vs.mounted && (oc === 'mounted' || (def(oppUnit).flags || []).indexOf('mounted') >= 0)) add('vs Mounted', d.vs.mounted);
      if (d.vs.armor && oc === 'armor') add('vs Armor', d.vs.armor);
      if (d.vs.air && def(oppUnit).domain === 'air') add('vs Air', d.vs.air);
    }
    if (oppCity && !defending && d.vsCity) add('vs Cities', d.vsCity);
    if (oppCity && !defending) add('Empire vs cities', mods.vsCityPct || 0);
    if (d.flags && d.flags.indexOf('jungleBonus') >= 0) { var fk2 = R.featureKey(m, t); if (fk2 === 'forest' || fk2 === 'jungle') add('Forest fighter', 33); }
    if (d.flags && d.flags.indexOf('roughPenalty') >= 0 && roughTile(game, u.tile)) add('Rough terrain', -50);
    // flanking (melee attacks)
    if (role === 'melee' && oppUnit) {
      var fl = 0;
      Hex.neighbors(oppUnit.tile).forEach(function (nt) { if (nt === u.tile) return; var mu = U.militaryOn(game, nt); if (mu && mu.owner === u.owner) fl += 10; });
      add('Flanking', fl);
    }
    if (mods.adjacentPct) { var adj = Hex.neighbors(t).some(function (nt) { var mu = U.militaryOn(game, nt); return mu && mu.owner === u.owner && mu !== u; }); if (adj) add('Discipline', mods.adjacentPct); }
    add('Great General', generalNear(game, u));
    // empire modifiers
    add('Empire', mods.combatPct || 0);
    if (d.cls === 'melee' || d.cls === 'gun') add('Melee', mods.meleePct || 0);
    if (d.cls === 'mounted') add('Mounted', mods.mountedPct || 0);
    if (d.cls === 'ranged' || d.cls === 'siege') add('Ranged', mods.rangedPct || 0);
    if (d.domain === 'sea') add('Naval', mods.navalPct || 0);
    if (d.cls === 'armor') add('Armor', mods.armorPct || 0);
    var opp = oppUnit ? owner(game, oppUnit) : oppCity ? game.players[oppCity.owner] : null;
    if (opp && opp.isBarb) add('vs Barbarians', mods.vsBarbPct || 0);
    if (m.owner[t] === u.owner) add('Home territory', mods.homeCombatPct || 0);
    if (opp && mods.underdogPct && opp.cities.length > p.cities.length) add('Underdog', mods.underdogPct);
    if (mods.featureCombat) { var fk3 = R.featureKey(m, t); if (fk3 === 'forest' || fk3 === 'jungle' || fk3 === 'marsh') add('Delta warfare', mods.featureCombat); }
    if (p.happy < 0 && !p.isCS && !p.isBarb) add('Unhappiness', Math.max(-33, Math.round(p.happy * 1.5)));
    if (p.isBarb) { var bs = D.DIFFICULTIES[game.difficulty].barbStr; if (bs !== 1) add('Barbarian', Math.round((bs - 1) * 100)); }
    if (!p.isHuman && !p.isBarb && !p.isCS && game.difficulty === 'deity') add('Deity AI', 10);
    var str = base * (1 + pct / 100);
    // wounded penalty
    if (!mods.noDamagePenalty && u.hp < 100) { var wp = -Math.round((100 - u.hp) / 2); lines.push(['Wounded', wp]); str *= 1 + wp / 100; }
    return { str: Math.max(0.5, str), lines: lines };
  };
  function damageMult(r) { return (Math.pow((r + 3) / 4, 4) + 1) / 2; }
  // Expected/rolled damages. atk/def strengths.
  U.damage = function (atk, dfn, rng, ranged) {
    var b1 = rng ? 24 + rng.int(13) : 30, b2 = rng ? 24 + rng.int(13) : 30;
    var toDef, toAtk;
    if (atk >= dfn) { var M = damageMult(atk / dfn); toDef = b1 * M; toAtk = b2 / M; }
    else { M = damageMult(dfn / atk); toDef = b1 / M; toAtk = b2 * M; }
    if (ranged) toAtk = 0;
    return { toDef: Math.max(1, Math.round(toDef)), toAtk: Math.round(toAtk) };
  };

  // Combat preview / validity: returns {type, ...} or null
  U.attackInfo = function (game, u, t) {
    var d = def(u);
    if (!isMilitary(d) || d.cls === 'nuke' || (d.flags && d.flags.indexOf('noAttack') >= 0)) return null;
    var maxAtt = (u.promos.indexOf('blitz') >= 0 || u.promos.indexOf('logistics') >= 0 || (d.flags && d.flags.indexOf('twice') >= 0)) ? 2 : 1;
    if (u.attacks >= maxAtt) return null;
    if (u.moves <= EPS) return null;
    var city = E.cityAt(game, t);
    var target = city && E.atWar(game, u.owner, city.owner) ? null : enemyMilitaryOn(game, u, t) || enemyAny(game, u, t);
    var enemyCity = city && E.atWar(game, u.owner, city.owner) ? city : null;
    if (!target && !enemyCity) return null;
    var dist = Hex.distance(u.tile, t);
    var p = owner(game, u);
    if (d.rs) {
      var range = (d.range || 1) + (u.promos.indexOf('range') >= 0 ? 1 : 0);
      if (dist > range) return null;
      if (d.domain === 'air' && dist > range) return null;
      if (U.embarked(game, u)) return null;
      var tu = enemyCity ? null : target;
      var att = U.strength(game, u, 'ranged', tu, enemyCity);
      var dfs = enemyCity ? { str: E.cityStrength(game, enemyCity), lines: [] } : U.strength(game, target, 'rdefend', u, null);
      var dm = U.damage(att.str, dfs.str, null, true);
      var res = { kind: 'ranged', target: tu, city: enemyCity, atk: att, def: dfs, dmg: dm };
      if (d.domain === 'air') { res.kind = 'air'; res.dmg.toAtk = enemyCity ? 15 : (def(target).vs && def(target).vs.air ? 25 : 8); }
      if (d.domain === 'sea' && tu && def(tu).domain === 'land' && !enemyCity) { }
      return res;
    }
    if (dist !== 1) return null;
    if (U.embarked(game, u) && !p.mods.amphibious && u.promos.indexOf('amphibious') < 0) return null;
    if (!U.canEnter(game, u, t, { attack: true })) return null;
    if (d.domain === 'sea' && !isWaterT(game, t) && !enemyCity) return null;
    if (d.domain === 'land' && isWaterT(game, t) && !enemyCity && !(target && U.embarked(game, target))) return null;
    if (enemyCity) {
      var a = U.strength(game, u, 'melee', null, enemyCity);
      var cs = E.cityStrength(game, enemyCity);
      var dm2 = U.damage(a.str, cs, null, false);
      return { kind: 'meleeCity', city: enemyCity, atk: a, def: { str: cs, lines: [] }, dmg: dm2, defender: enemyCity };
    }
    if (!isMilitary(def(target))) return { kind: 'capture', target: target };
    var a2 = U.strength(game, u, 'melee', target, null);
    var df = U.strength(game, target, 'defend', u, null);
    var dm3 = U.damage(a2.str, df.str, null, false);
    return { kind: 'melee', target: target, atk: a2, def: df, dmg: dm3 };
  };

  function gainXP(game, u, amount, vsBarb) {
    if (vsBarb && u.xp >= 30) return;
    var p = owner(game, u);
    var x = amount * (1 + (p.mods.xpPct || 0) / 100);
    u.xp += x;
    if (def(u).domain === 'land') p.gpProgress.general = (p.gpProgress.general || 0) + x * (1 + (p.mods.generalGPPct || 0) / 100);
    if (def(u).domain === 'sea') p.gpProgress.admiral = (p.gpProgress.admiral || 0) + x;
    U.checkPromotion(game, u);
  }
  U.checkPromotion = function (game, u) {
    while (u.level < D.XP_LEVELS.length && u.xp >= D.XP_LEVELS[u.level]) { u.level++; u.pendingPromo = (u.pendingPromo || 0) + 1; }
    if (u.pendingPromo && !owner(game, u).isHuman) {
      while (u.pendingPromo > 0) { var opts = U.promoOptions(u); if (!opts.length) { u.pendingPromo = 0; break; } U.promote(game, u, G.AI ? G.AI.pickPromotion(game, u, opts) : opts[0]); }
    }
  };
  U.promoOptions = function (u) {
    var d = def(u), out = [];
    for (var k in D.PROMOTIONS) {
      var pd = D.PROMOTIONS[k];
      if (u.promos.indexOf(k) >= 0) continue;
      if (k === 'heal') { out.push(k); continue; }
      if (pd.cls && pd.cls.indexOf(d.cls) < 0) continue;
      if (pd.req) {
        var reqs = Array.isArray(pd.req) ? pd.req : [pd.req];
        if (!reqs.some(function (r) { return u.promos.indexOf(r) >= 0; })) continue;
        if (!pd.cls) { /* inherit class check from req chain */ var root = D.PROMOTIONS[reqs[0]]; while (root && root.req && !root.cls) root = D.PROMOTIONS[Array.isArray(root.req) ? root.req[0] : root.req]; if (root && root.cls && root.cls.indexOf(d.cls) < 0) continue; }
      } else if (!pd.cls && k !== 'medic' && k !== 'sentry') continue;
      if ((k === 'medic' || k === 'sentry') && !(d.cls === 'melee' || d.cls === 'gun' || d.cls === 'recon' || d.cls === 'ranged')) continue;
      out.push(k);
    }
    return out;
  };
  U.promote = function (game, u, k) {
    if (!u.pendingPromo) return false;
    u.pendingPromo--;
    if (k === 'heal') { u.hp = Math.min(100, u.hp + 50); u.moves = 0; return true; }
    u.promos.push(k);
    return true;
  };

  function killUnit(game, victim, killer) {
    var kp = killer ? owner(game, killer) : null, vp = owner(game, victim);
    var vd = def(victim);
    if (kp) {
      kp.stats.kills++;
      if (kp.mods.goldFromKills) kp.gold += Math.round((vd.str || 5));
      if (kp.mods.cultureFromKills) { kp.culture += Math.round(vd.str || 5); kp.totalCulture += Math.round(vd.str || 5); }
      if (kp.mods.faithFromKills) kp.faith += Math.round((vd.str || 5) / 2);
      if (kp.mods.barbConvert && vp.isBarb && game.rng.chance(kp.mods.barbConvert / 100) && def(killer).domain === 'land') {
        var conv = E.createUnit(game, kp, victim.type, victim.tile); E.removeUnit(game, victim, 'converted'); conv.moves = 0; conv.hp = 50;
        E.note(game, kp, 'A barbarian unit has joined your army!', conv.tile, 'good'); return;
      }
    }
    vp.stats.losses++;
    // civilians stacked with killed military unit get captured/killed if the killer advances
    E.removeUnit(game, victim, 'killed');
    E.emit({ type: 'unitKilled', unit: victim, by: killer });
  }
  U.killUnit = killUnit;

  // Perform an attack. Returns result object for UI.
  U.attack = function (game, u, t) {
    var info = U.attackInfo(game, u, t);
    if (!info) return null;
    var p = owner(game, u), d = def(u), rng = game.rng;
    var res = { attacker: u, tile: t, kind: info.kind, from: u.tile };
    var defOwner = info.city ? info.city.owner : info.target ? info.target.owner : -1;
    res.defOwner = defOwner; res.atkOwner = u.owner;
    res.defName = info.city ? info.city.name : info.target ? D.UNITS[info.target.type].name : '';
    res.atkName = p.adj + ' ' + d.name;
    if (defOwner >= 0) { var dp = game.players[defOwner]; E.rel(dp, p.id).opinion -= 1; }
    u.attacks++; u.acted = true; u.fortify = 0;
    if (info.kind === 'capture') {
      stepInto(game, u, t); u.moves = Math.max(0, u.moves - 1);
      res.captured = true; return res;
    }
    var dm = U.damage(info.atk.str, info.def.str, rng, info.kind === 'ranged' || info.kind === 'air');
    if (info.kind === 'air') dm.toAtk = info.dmg.toAtk + rng.int(10);
    res.dmgDef = dm.toDef; res.dmgAtk = dm.toAtk;
    if (info.city) {
      var c = info.city;
      var cityDmg = dm.toDef;
      c.hp = Math.max(info.kind === 'meleeCity' ? 0 : 1, c.hp - cityDmg);
      c.attacked = 2;
      if (info.kind === 'meleeCity') {
        u.hp -= dm.toAtk;
        if (u.hp <= 0) { res.attackerDied = true; killUnit(game, u, null); return res; }
        gainXP(game, u, 5, game.players[c.owner].isBarb);
        if (c.hp <= 0 && (d.domain === 'land' || d.domain === 'sea')) {
          // capture
          var captor = p;
          // kill/capture units in city
          E.unitsAt(game, c.tile).slice().forEach(function (o) { if (o.owner !== u.owner) { if (isMilitary(def(o))) killUnit(game, o, u); else E.removeUnit(game, o, 'captured'); } });
          u.tile = c.tile; u.moves = 0;
          res.capturedCity = c;
          if (captor.isBarb) {
            if (game.players[c.owner].isCS || c.pop <= 2 || c.capital) { c.hp = 50; /* barbarians plunder */ var vp = game.players[c.owner]; vp.gold = Math.max(0, vp.gold - 50); E.note(game, vp, 'Barbarians sacked ' + c.name + '!', c.tile, 'bad'); u.tile = res.from; }
            else { E.captureCity(game, c, captor, 'raze'); }
          } else if (captor.isHuman) {
            res.needChoice = true;
            E.captureCity(game, c, captor, 'annex');
          } else {
            var choice = G.AI ? G.AI.captureChoice(game, captor, c) : 'annex';
            E.captureCity(game, c, captor, choice);
          }
        } else u.moves = 0;
      } else {
        gainXP(game, u, 2, game.players[c.owner].isBarb);
        if (info.kind === 'air') { u.hp -= dm.toAtk; if (u.hp <= 0) { res.attackerDied = true; killUnit(game, u, null); return res; } }
        if (!(u.promos.indexOf('logistics') >= 0 || (d.flags && d.flags.indexOf('twice') >= 0)) || u.attacks >= 2) u.moves = 0;
      }
      E.emit({ type: 'combat', result: res });
      return res;
    }
    var tgt = info.target;
    tgt.hp -= dm.toDef;
    tgt.fortify = 0;
    if (info.kind === 'melee') u.hp -= dm.toAtk;
    if (info.kind === 'air') { u.hp -= dm.toAtk; }
    var tgtVsBarb = p.isBarb, atkVsBarb = owner(game, tgt).isBarb;
    if (u.hp <= 0) {
      res.attackerDied = true;
      gainXP(game, tgt, 4, tgtVsBarb);
      killUnit(game, u, tgt);
      if (tgt.hp <= 0) tgt.hp = 1;
      E.emit({ type: 'combat', result: res });
      return res;
    }
    if (tgt.hp <= 0) {
      res.defenderDied = true;
      killUnit(game, tgt, u);
      if (info.kind === 'melee' && d.domain === 'land' || info.kind === 'melee' && d.domain === 'sea' && isWaterT(game, t)) {
        // advance
        if (U.canStop(game, u, t) && !foreignUnitOn(game, u, t) && U.canEnter(game, u, t)) { stepInto(game, u, t); }
        else if (!U.militaryOn(game, t)) { stepInto(game, u, t); }
      }
    } else {
      gainXP(game, tgt, info.kind === 'melee' ? 4 : 2, tgtVsBarb);
    }
    gainXP(game, u, info.kind === 'melee' ? 5 : 2, atkVsBarb);
    // Moves after attack
    var blitz = u.promos.indexOf('blitz') >= 0 || u.promos.indexOf('logistics') >= 0 || (d.flags && d.flags.indexOf('twice') >= 0);
    if (!blitz || u.attacks >= 2) u.moves = 0;
    else u.moves = Math.max(0, u.moves - 1);
    if (d.cls === 'mounted' || d.cls === 'armor') { if (info.kind === 'melee' && !blitz && u.hp > 0) u.moves = Math.max(0, U.maxMoves(game, u) - 1 - (Hex.distance(res.from, u.tile))) > 0 && false ? 0 : 0; }
    E.updateVisibility(game, p, true); // v2 perf: light refresh
    E.emit({ type: 'combat', result: res });
    return res;
  };

  // City ranged attack
  U.cityCanAttack = function (game, c) {
    if (c.rangedUsed || c.hp <= 0) return [];
    var out = [];
    Hex.within(c.tile, 2).forEach(function (t) {
      var us = E.unitsAt(game, t);
      for (var i = 0; i < us.length; i++) if (us[i].owner !== c.owner && E.atWar(game, c.owner, us[i].owner) && def(us[i]).domain !== 'air') { out.push(t); break; }
    });
    return out;
  };
  U.cityAttack = function (game, c, t) {
    var tgt = null;
    E.unitsAt(game, t).forEach(function (o) { if (!tgt && o.owner !== c.owner && E.atWar(game, c.owner, o.owner) && def(o).domain !== 'air') tgt = o; });
    if (!tgt || c.rangedUsed || Hex.distance(c.tile, t) > 2) return null;
    var p = game.players[c.owner];
    var s = E.cityStrength(game, c) * (1 + (p.mods.cityRangedPct || 0) / 100);
    var dfs = U.strength(game, tgt, 'rdefend', null, c);
    var dm = U.damage(s, dfs.str, game.rng, true);
    c.rangedUsed = true;
    var res = { kind: 'cityRanged', city: c, tile: t, dmgDef: dm.toDef, from: c.tile, defOwner: tgt.owner, defName: D.UNITS[tgt.type].name, atkName: 'the city of ' + c.name, atkOwner: c.owner };
    if (!isMilitary(def(tgt))) { killUnit(game, tgt, null); res.defenderDied = true; }
    else {
      tgt.hp -= dm.toDef;
      if (tgt.hp <= 0) { res.defenderDied = true; killUnit(game, tgt, null); }
    }
    E.emit({ type: 'combat', result: res });
    return res;
  };

  // Nuclear strike
  U.nuke = function (game, u, t) {
    var d = def(u), p = owner(game, u), m = game.map;
    if (Hex.distance(u.tile, t) > d.range) return null;
    var radius = d.nuke === 3 ? 2 : 1;
    var hit = Hex.within(t, radius);
    var victims = {};
    hit.forEach(function (tt) {
      E.unitsAt(game, tt).slice().forEach(function (o) { if (o !== u) { victims[o.owner] = 1; killUnit(game, o, null); } });
      var c = E.cityAt(game, tt);
      if (c) {
        victims[c.owner] = 1;
        if (R.hasBuilding(c, 'bomb_shelter')) c.pop = Math.max(1, Math.floor(c.pop * 0.85));
        else c.pop = Math.max(1, Math.floor(c.pop * 0.5));
        c.hp = d.nuke === 3 ? 0 : Math.floor(c.hp * 0.3);
        for (var b in c.buildings) if (game.rng.chance(0.25) && !D.BUILDINGS[b].national && b !== 'palace') delete c.buildings[b];
      }
      if (!c && MG.isLand(m, tt) && game.rng.chance(0.5)) { m.feature[tt] = IDS.feature.map.fallout; m.imp[tt] = 0; }
    });
    E.removeUnit(game, u, 'used');
    for (var vo in victims) {
      if (+vo === p.id) continue;
      var vp = game.players[vo];
      if (!E.atWar(game, p.id, +vo)) G.Diplo && G.Diplo.declareWar(game, p, vp);
      E.rel(vp, p.id).opinion -= 60;
    }
    game.players.forEach(function (q) { if (q !== p && !q.isBarb) E.rel(q, p.id).opinion -= 20; });
    E.noteAll(game, p.name + ' has used a nuclear weapon!', t, 'world');
    E.emit({ type: 'nuke', tile: t, radius: radius });
    return { tile: t, radius: radius };
  };

  // Air rebase
  U.rebaseTargets = function (game, u) {
    var d = def(u), p = owner(game, u);
    return p.cities.map(function (cid) { return game.cities[cid]; }).filter(function (c) { return c && c.tile !== u.tile && Hex.distance(c.tile, u.tile) <= d.range * 2; });
  };
  U.rebase = function (game, u, c) { u.tile = c.tile; u.moves = 0; u.acted = true; E.emit({ type: 'unitMoved', unit: u }); };

  // ---------------- Workers ----------------
  U.buildOptions = function (game, u, t) {
    t = t == null ? u.tile : t;
    var d = def(u), p = owner(game, u), m = game.map, out = [];
    var isWorker = d.flags && d.flags.indexOf('build') >= 0;
    var isBoat = d.flags && d.flags.indexOf('seabuild') >= 0;
    var legion = d.flags && d.flags.indexOf('buildRoads') >= 0;
    if (!isWorker && !isBoat && !legion) return out;
    var tk = R.terrainKey(m, t), fk = R.featureKey(m, t), rk = m.res[t] ? R.resKey(m, t) : null, ik = R.impKey(m, t);
    var ow = m.owner[t];
    if (E.cityAt(game, t)) return out;
    if (isBoat) {
      if (rk && R.resVisible(p, rk) && ow === p.id && R.isWater(m, t)) {
        var ri = D.RESOURCES[rk].imp;
        if ((ri === 'fishing_boats' || (rk === 'oil' && p.techs.refrigeration)) && !ik) out.push({ id: rk === 'oil' ? 'offshore_platform' : 'fishing_boats', turns: 0 });
      }
      return out;
    }
    if (R.isWater(m, t) || tk === 'mountain' || m.nw[t]) return out;
    if (m.pillaged[t] && ik) out.push({ id: 'repair', turns: 3 });
    // roads
    if (p.techs.the_wheel && !m.road[t]) out.push({ id: 'road', turns: D.ROADS.road.turns });
    if (p.techs.railroad && m.road[t] === 1) out.push({ id: 'railroad', turns: D.ROADS.railroad.turns });
    if (legion) return out;
    if (ow >= 0 && ow !== p.id) return out;
    // remove features
    if (fk === 'forest' && p.techs.mining) out.push({ id: 'remove_forest', turns: 4 });
    if (fk === 'jungle' && p.techs.bronze_working) out.push({ id: 'remove_jungle', turns: 7 });
    if (fk === 'marsh' && p.techs.masonry) out.push({ id: 'remove_marsh', turns: 6 });
    if (fk === 'fallout') out.push({ id: 'remove_fallout', turns: 8 });
    // improvements
    for (var k in D.IMPROVEMENTS) {
      var imp = D.IMPROVEMENTS[k];
      if (imp.gp || imp.sea) continue;
      if (imp.unique && imp.unique !== p.civ) continue;
      if (imp.tech && !p.techs[imp.tech]) continue;
      if (ik === k) continue;
      if (ow !== p.id && k !== 'fort') continue;
      var ok = false;
      if (imp.resOnly) ok = rk && R.resVisible(p, rk) && D.RESOURCES[rk].imp === k;
      else if (imp.valid === 'farmable') ok = !fk || fk === 'floodplains' ? ((tk === 'grassland' || tk === 'plains' || tk === 'tundra' || (tk === 'desert' && (fk === 'floodplains' || R.freshWater(m, t)))) && !(rk && D.RESOURCES[rk].imp !== 'farm' && R.resVisible(p, rk) && D.RESOURCES[rk].type !== 'bonus')) : false;
      else if (imp.valid === 'mineable') ok = (m.hills[t] && !fk) || (rk && R.resVisible(p, rk) && D.RESOURCES[rk].imp === 'mine');
      else if (imp.valid === 'forest') ok = fk === 'forest' && !rk;
      else if (imp.valid === 'flatland') ok = !m.hills[t] && fk !== 'forest' && fk !== 'marsh' && !(rk && R.resVisible(p, rk));
      else if (imp.valid === 'land') ok = true;
      else if (imp.valid === 'hills') ok = m.hills[t] && !fk;
      else if (imp.valid === 'marsh') ok = fk === 'marsh';
      else if (imp.valid === 'desert') ok = tk === 'desert' && !m.hills[t];
      else if (imp.valid === 'coastland') ok = E.isCoastal(game, t) && !fk;
      if (k === 'mine' && fk === 'forest' && !(rk && D.RESOURCES[rk].imp === 'mine')) ok = false;
      if (k === 'farm' && (fk === 'forest' || fk === 'jungle' || fk === 'marsh')) ok = false;
      if (ok) out.push({ id: k, turns: imp.turns || 6 });
    }
    return out;
  };
  U.startBuild = function (game, u, what) {
    var opt = U.buildOptions(game, u).filter(function (o) { return o.id === what; })[0];
    if (!opt) return false;
    if (opt.turns === 0) { // work boats: instant, consumed
      game.map.imp[u.tile] = IDS.imp.map[what];
      E.removeUnit(game, u, 'used');
      E.dirtyRes(owner(game, u));
      return true;
    }
    var t = Math.round(opt.turns * Math.sqrt(R.speedCost(game)));
    u.build = { what: what, left: t, tile: u.tile };
    u.moves = 0; u.orders = null;
    return true;
  };
  function finishBuild(game, u) {
    var m = game.map, t = u.build.tile, w = u.build.what, p = owner(game, u);
    u.build = null;
    if (t !== u.tile) return;
    if (w === 'road') m.road[t] = 1;
    else if (w === 'railroad') m.road[t] = 2;
    else if (w === 'repair') m.pillaged[t] = 0;
    else if (w.indexOf('remove_') === 0) {
      var f = R.featureKey(m, t);
      m.feature[t] = 0;
      if (f === 'forest' || f === 'jungle') {
        // chopping yields production to nearest owned city
        var c = m.city[t] >= 0 ? game.cities[m.city[t]] : null;
        if (c && c.owner === p.id) { var pr = f === 'forest' ? 20 : 10; c.prod += pr * R.speedCost(game); E.note(game, p, 'Clearing land gave ' + Math.round(pr * R.speedCost(game)) + ' production to ' + c.name + '.', t, 'info'); }
      }
    } else {
      m.imp[t] = IDS.imp.map[w]; m.pillaged[t] = 0;
      var fk = R.featureKey(m, t);
      if ((w === 'farm' || w === 'trading_post' || w === 'mine' && !m.res[t]) && (fk === 'forest' || fk === 'jungle' || fk === 'marsh')) m.feature[t] = 0;
      if (w === 'mine' && fk === 'jungle' && m.res[t]) { /* keep jungle on resource */ }
    }
    E.dirtyRes(p);
    E.emit({ type: 'improved', tile: t });
  }

  U.pillage = function (game, u) {
    var m = game.map, t = u.tile, p = owner(game, u);
    if (!isMilitary(def(u)) || u.moves <= EPS) return false;
    var ow = m.owner[t];
    if (!m.imp[t] || m.pillaged[t] || E.cityAt(game, t)) return false;
    if (ow >= 0 && ow !== p.id && !E.atWar(game, p.id, ow)) return false;
    if (R.impKey(m, t) === 'barb_camp' || R.impKey(m, t) === 'city_ruins') return false;
    m.pillaged[t] = 1;
    u.hp = Math.min(100, u.hp + 25);
    p.gold += 20;
    u.moves = Math.max(0, u.moves - 1);
    if (ow >= 0) E.dirtyRes(game.players[ow]);
    return true;
  };

  // ---------------- Upgrades ----------------
  U.upgradeTarget = function (game, u) {
    var d = def(u), p = owner(game, u);
    if (!d.upg) return null;
    var tid = R.civUnit(p, d.upg);
    // skip ahead if further upgrades available
    var guard = 0;
    while (guard++ < 5) {
      var td = D.UNITS[tid];
      if (!td || (td.tech && !p.techs[td.tech])) return guard === 1 ? null : prev;
      var prev = tid;
      if (!td.upg) break;
      var nxt = R.civUnit(p, td.upg);
      if (!D.UNITS[nxt] || (D.UNITS[nxt].tech && !p.techs[D.UNITS[nxt].tech])) break;
      tid = nxt;
    }
    return tid;
  };
  U.canUpgrade = function (game, u) {
    var tid = U.upgradeTarget(game, u); if (!tid) return null;
    var p = owner(game, u), m = game.map;
    if (m.owner[u.tile] !== p.id) return null;
    var td = D.UNITS[tid];
    if (td.res && E.resourceAvail(game, p, td.res) < (def(u).res === td.res ? 0 : 1)) return null;
    var cost = R.upgradeCost(game, p, u.type, tid);
    return { to: tid, cost: cost, afford: p.gold >= cost };
  };
  U.upgrade = function (game, u) {
    var info = U.canUpgrade(game, u);
    if (!info || !info.afford || u.moves <= EPS) return false;
    var p = owner(game, u);
    p.gold -= info.cost;
    u.type = info.to; u.moves = 0; u.hp = Math.max(u.hp, Math.min(100, u.hp));
    E.dirtyRes(p);
    E.emit({ type: 'unitChanged', unit: u });
    return true;
  };

  // ---------------- Great people & special actions ----------------
  U.specialActions = function (game, u) {
    var d = def(u), p = owner(game, u), m = game.map, t = u.tile, acts = [];
    var city = E.cityAt(game, t);
    var flags = d.flags || [];
    if (flags.indexOf('found') >= 0 && E.canFoundCity(game, p, t) && u.moves > EPS) acts.push({ id: 'found', name: 'Found City' });
    if (flags.indexOf('trade') >= 0 && city && city.owner === p.id) acts.push({ id: 'trade', name: 'Establish Trade Route' });
    if (d.gp) {
      var ownTile = m.owner[t] === p.id && !city && MG.isLand(m, t) && m.terrain[t] !== IDS.terrain.map.mountain;
      if (d.gp === 'scientist') { acts.push({ id: 'bulb', name: 'Discover Technology' }); if (ownTile) acts.push({ id: 'gpimp', imp: 'academy', name: 'Build Academy' }); }
      if (d.gp === 'engineer') { if (city && city.owner === p.id) acts.push({ id: 'hurry', name: 'Hurry Production' }); if (ownTile) acts.push({ id: 'gpimp', imp: 'manufactory', name: 'Build Manufactory' }); }
      if (d.gp === 'merchant') { var o = m.owner[t] >= 0 ? game.players[m.owner[t]] : null; if (o && o.isCS) acts.push({ id: 'trade_mission', name: 'Trade Mission' }); if (ownTile) acts.push({ id: 'gpimp', imp: 'customs_house', name: 'Build Customs House' }); }
      if (d.gp === 'artist' || d.gp === 'writer' || d.gp === 'musician') {
        if (d.gp === 'artist') acts.push({ id: 'golden_age', name: 'Start Golden Age' });
        if (d.gp === 'writer') acts.push({ id: 'treatise', name: 'Write Political Treatise' });
        if (d.gp === 'musician') acts.push({ id: 'concert', name: 'Concert Tour' });
        if (city && city.owner === p.id && U.freeWorkSlot(city, d.gp)) acts.push({ id: 'great_work', name: 'Create Great Work' });
        if (ownTile) acts.push({ id: 'gpimp', imp: 'landmark', name: 'Build Landmark' });
      }
      if (d.gp === 'general' && ownTile) acts.push({ id: 'gpimp', imp: 'citadel', name: 'Build Citadel' });
      if (d.gp === 'admiral') acts.push({ id: 'repair_fleet', name: 'Repair Fleet' });
      if (d.gp === 'prophet') {
        if (city && city.owner === p.id && !p.religion && Object.keys(game.religions).length < R.maxReligions(game) && p.pantheon) acts.push({ id: 'found_religion', name: 'Found Religion' });
        else if (city && city.owner === p.id && p.religion && game.religions[p.religion] && !game.religions[p.religion].enhanced) acts.push({ id: 'enhance_religion', name: 'Enhance Religion' });
        if (p.religion && spreadTarget(game, u)) acts.push({ id: 'spread', name: 'Spread Religion' });
        if (ownTile) acts.push({ id: 'gpimp', imp: 'holy_site', name: 'Build Holy Site' });
      }
    }
    if (u.type === 'missionary' && p.religion && spreadTarget(game, u)) acts.push({ id: 'spread', name: 'Spread Religion (' + u.spreads + ')' });
    if (u.type === 'inquisitor' && city && city.owner === p.id) acts.push({ id: 'inquisit', name: 'Remove Heresy' });
    return acts;
  };
  U.freeWorkSlot = function (city, gp) {
    var kind = gp === 'artist' ? 'art' : gp === 'writer' ? 'writing' : 'music';
    var slots = 0;
    for (var b in city.buildings) { var bd = D.BUILDINGS[b]; if (bd && bd.works && bd.works[kind]) slots += bd.works[kind]; }
    city.wonders.forEach(function (w) { if (w === 'parthenon' || w === 'louvre' || w === 'uffizi') slots += kind === 'art' ? 1 : 0; if (w === 'globe_theatre') slots += kind === 'writing' ? 1 : 0; if (w === 'broadway') slots += kind === 'music' ? 1 : 0; });
    var used = city.greatWorks.filter(function (g) { return g.kind === kind; }).length;
    return slots > used;
  };
  function spreadTarget(game, u) {
    var t = u.tile, p = owner(game, u);
    var cands = [E.cityAt(game, t)].concat(Hex.neighbors(t).map(function (z) { return E.cityAt(game, z); })).filter(Boolean);
    return cands.filter(function (c) { return E.majorityReligion(c) !== p.religion || (c.followers[p.religion] || 0) < c.pop; })[0] || null;
  }
  U.doAction = function (game, u, act, arg) {
    var d = def(u), p = owner(game, u), m = game.map, t = u.tile, city = E.cityAt(game, t);
    var gpUsed = function () { if (p.mods.gpGold) p.gold += p.mods.gpGold; E.removeUnit(game, u, 'used'); };
    switch (act) {
      case 'found':
        if (!E.canFoundCity(game, p, t)) return false;
        E.removeUnit(game, u, 'used');
        var c = E.foundCity(game, p, t);
        return { city: c };
      case 'bulb':
        var amt = Math.max(Math.round(50 * R.speedCost(game) * (1 + p.era)), Math.round((p.lastYields.sci || 0) * 8));
        p.freeScience += amt;
        if (p.researching) { p.techProgress[p.researching] = (p.techProgress[p.researching] || 0) + p.freeScience; p.freeScience = 0; }
        E.note(game, p, u.name + ' contributed ' + amt + ' science.', t, 'tech');
        gpUsed(); return true;
      case 'hurry':
        if (!city) return false;
        var hp = Math.round((300 + 30 * city.pop) * R.speedCost(game));
        city.prod += hp;
        E.note(game, p, u.name + ' hurried production in ' + city.name + ' (+' + hp + ').', t, 'prod');
        gpUsed(); return true;
      case 'trade_mission':
        var cs = game.players[m.owner[t]];
        var gold = Math.round((200 + 100 * p.era) * R.speedCost(game));
        p.gold += gold; cs.csInfluence[p.id] = (cs.csInfluence[p.id] || 0) + 30;
        E.note(game, p, u.name + ' earned ' + gold + ' gold and +30 influence with ' + cs.name + '.', t, 'good');
        gpUsed(); return true;
      case 'gpimp':
        m.imp[t] = IDS.imp.map[arg]; m.feature[t] = R.featureKey(m, t) === 'forest' || R.featureKey(m, t) === 'jungle' || R.featureKey(m, t) === 'marsh' ? 0 : m.feature[t];
        if (arg === 'citadel') Hex.neighbors(t).forEach(function (z) { if (m.owner[z] < 0 || m.owner[z] === p.id) { if (m.owner[z] < 0 && m.city[t] >= 0) E.claimTile(game, p, game.cities[m.city[t]], z); } });
        gpUsed(); return true;
      case 'golden_age':
        E.startGoldenAge(game, p, false); gpUsed(); return true;
      case 'treatise':
        var cb = Math.round(Math.max(40 * R.speedCost(game), (p.lastYields.cul || 0) * 6));
        p.culture += cb; p.totalCulture += cb; E.note(game, p, u.name + ' wrote a treatise: +' + cb + ' culture.', t, 'good');
        gpUsed(); return true;
      case 'concert':
        var best = null, bi = 0;
        game.players.forEach(function (o) { if (o !== p && !o.isCS && !o.isBarb && o.alive && p.met[o.id]) { var inf = E.influence(game, p, o); if (!best || inf > bi) { best = o; bi = inf; } } });
        if (best) { var boost = Math.max(100, (p.tourism || 1) * 10) * R.speedCost(game); p.tourismTo[best.id] = (p.tourismTo[best.id] || 0) + boost; E.note(game, p, u.name + ' toured ' + best.name + ': +' + Math.round(boost) + ' tourism there.', t, 'good'); }
        gpUsed(); return true;
      case 'great_work':
        if (!city || !U.freeWorkSlot(city, d.gp)) return false;
        city.greatWorks.push({ kind: d.gp === 'artist' ? 'art' : d.gp === 'writer' ? 'writing' : 'music', by: u.name });
        p.greatWorks++;
        E.note(game, p, u.name + ' created a Great Work in ' + city.name + '.', t, 'good');
        gpUsed(); return true;
      case 'repair_fleet':
        p.units.forEach(function (uid) { var o = game.units[uid]; if (o && D.UNITS[o.type].domain === 'sea') o.hp = 100; });
        gpUsed(); return true;
      case 'found_religion':
        if (!arg) return 'choose';
        return E.foundReligion(game, p, u, arg.rel, arg.founder, arg.follower, arg.name);
      case 'enhance_religion':
        if (!arg) return 'choose';
        return E.enhanceReligion(game, p, u, arg.follower);
      case 'spread':
        var target = spreadTarget(game, u);
        if (!target) return false;
        var n = d.gp === 'prophet' ? Math.max(4, Math.ceil(target.pop * 0.8)) : Math.max(2, Math.ceil(target.pop * 0.5));
        E.addFollowers(target, p.religion, n);
        if (target.owner !== p.id) { E.rel(game.players[target.owner], p.id).opinion -= 2; }
        u.spreads = (u.spreads || (d.gp === 'prophet' ? 4 : 2)) - 1;
        u.moves = 0;
        E.note(game, p, 'Spread ' + game.religions[p.religion].name + ' to ' + target.name + '.', target.tile, 'faith');
        if (u.spreads <= 0) E.removeUnit(game, u, 'used');
        return true;
      case 'inquisit':
        if (!city) return false;
        for (var r in city.followers) if (r !== p.religion) delete city.followers[r];
        city.pressure = {};
        E.removeUnit(game, u, 'used'); return true;
    }
    return false;
  };

  // Faith purchases
  U.faithCost = function (game, p, type) {
    var d = D.UNITS[type];
    var base = d.faithCost || 0;
    if (d.cls === 'gp') base = 1000 + 500 * ((p.gpCount[d.gp] || 0));
    return Math.round(base * R.speedCost(game) * (1 + (p.mods.faithCostPct || 0) / 100));
  };
  U.faithOptions = function (game, p, c) {
    var out = [];
    if (p.religion && E.majorityReligion(c) === p.religion) { out.push('missionary', 'inquisitor'); }
    if (p.era >= 4 && p.trees.piety === 'done') ['great_scientist', 'great_engineer', 'great_merchant', 'great_artist', 'great_writer', 'great_musician'].forEach(function (k) { out.push(k); });
    else if (p.era >= 4) ['great_engineer', 'great_merchant', 'great_scientist'].forEach(function (k) { if (p.trees.rationalism || p.trees.commerce) out.push(k); });
    return out;
  };
  U.faithBuy = function (game, p, c, type) {
    var cost = U.faithCost(game, p, type);
    if (p.faith < cost) return false;
    p.faith -= cost;
    var u = E.createUnit(game, p, type, c.tile);
    if (D.UNITS[type].cls === 'gp') { p.gpCount[D.UNITS[type].gp] = (p.gpCount[D.UNITS[type].gp] || 0) + 1; }
    U.placeNewUnit(game, u, c);
    return u;
  };

  // Units that still need orders this turn (for "next unit")
  U.needsOrders = function (game, u) {
    if (u.moves <= EPS || u.sleep || u.fortify > 0 || u.build || u.automate || u.explore) return false;
    if (u.orders && (u.orders.type === 'goto' || u.orders.type === 'fortify' || u.orders.type === 'heal' || u.orders.type === 'skip')) return false;
    if (def(u).domain === 'air' && u.acted) return false;
    return true;
  };

  return U;
})();
