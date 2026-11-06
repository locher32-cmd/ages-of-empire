// ============================================================
//  AI: economy, expansion, research, policies, religion, military,
//  diplomacy, barbarians. Also used for automated human units.
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.AI = (function () {
  var D = G.D, IDS = G.IDS, Hex = G.Hex, R = G.Rules, MG = G.MapGen, E = G.Engine, U = G.Units, Dp = G.Diplo;
  var A = {};
  var EPS = 1e-6;

  function units(game, p) { return p.units.map(function (id) { return game.units[id]; }).filter(Boolean); }
  function cities(game, p) { return p.cities.map(function (id) { return game.cities[id]; }).filter(Boolean); }
  function isMil(u) { return U.isMilitary(u) && D.UNITS[u.type].cls !== 'nuke'; }
  function enemiesOf(game, p) { return game.players.filter(function (o) { return o !== p && o.alive && E.atWar(game, p.id, o.id) && !o.isBarb; }); }
  function nearestCity(game, list, t) { var best = null, bd = 1e9; list.forEach(function (c) { var d = Hex.distance(c.tile, t); if (d < bd) { bd = d; best = c; } }); return best; }

  // ===================== Turn =====================
  A.playTurn = function (game, p) {
    if (!p.alive) return;
    if (p.isBarb) { barbTurn(game, p); return; }
    p.ai = p.ai || {};
    if (!p.isCS) { diplomacy(game, p); spendGold(game, p); faithPurchases(game, p); }
    var us = units(game, p);
    // order: civilians, ranged, melee
    us.sort(function (a, b) { return unitOrder(a) - unitOrder(b); });
    p.ai.workerTargets = {};
    p.ai.settleTargets = {};
    for (var i = 0; i < us.length; i++) {
      var u = us[i];
      if (!game.units[u.id]) continue;
      try { A.unitTurn(game, p, u); } catch (e) { console.error('AI unit error', e); }
    }
    // city ranged attacks
    cities(game, p).forEach(function (c) {
      var targets = U.cityCanAttack(game, c);
      if (targets.length) {
        targets.sort(function (a, b) { var ua = U.militaryOn(game, a) || E.unitsAt(game, a)[0], ub = U.militaryOn(game, b) || E.unitsAt(game, b)[0]; return (ua ? ua.hp : 999) - (ub ? ub.hp : 999); });
        U.cityAttack(game, c, targets[0]);
      }
      // make sure every city builds something
      if (!c.build) A.chooseProduction(game, p, c);
    });
    if (p.pendingCapture) p.pendingCapture = null;
  };
  function unitOrder(u) {
    var d = D.UNITS[u.type];
    if (d.cls === 'civilian' || d.cls === 'gp') return 0;
    if (d.rs) return 1;
    return 2;
  }

  A.unitTurn = function (game, p, u) {
    p.ai = p.ai || {}; p.ai.settleTargets = p.ai.settleTargets || {}; p.ai.workerTargets = p.ai.workerTargets || {};
    var d = D.UNITS[u.type];
    if (u.pendingPromo) U.checkPromotion(game, u);
    if (u.build) return; // working
    if (u.type === 'settler') return settlerTurn(game, p, u);
    if (d.flags && (d.flags.indexOf('build') >= 0 || d.flags.indexOf('seabuild') >= 0)) return workerTurn(game, p, u);
    if (d.flags && d.flags.indexOf('trade') >= 0) return tradeTurn(game, p, u);
    if (d.cls === 'gp') return gpTurn(game, p, u);
    if (u.type === 'missionary' || u.type === 'inquisitor') return missionaryTurn(game, p, u);
    if (d.domain === 'air') return airTurn(game, p, u);
    if (d.cls === 'nuke') return;
    if (d.cls === 'recon') return exploreTurn(game, p, u);
    militaryTurn(game, p, u);
  };

  // ===================== Exploration =====================
  A.explore = function (game, u) { return exploreTurn(game, game.players[u.owner], u, true); };
  function exploreTurn(game, p, u, keepGoing) {
    var m = game.map, guard = 0;
    // huts first
    while (u.moves > EPS && guard++ < 4) {
      var target = findExploreTarget(game, p, u);
      if (target < 0) { if (!keepGoing) militaryTurn(game, p, u); else u.explore = false; return; }
      var before = u.tile;
      U.moveTo(game, u, target);
      if (u.tile === before) break;
    }
  }
  function findExploreTarget(game, p, u) {
    var m = game.map, exp = p.explored;
    var q = [u.tile], seen = {}; seen[u.tile] = 1;
    var best = -1, bestS = -1e9, n = 0;
    while (q.length && n++ < 1500) {
      var t = q.shift();
      var d = Hex.distance(u.tile, t);
      if (t !== u.tile && U.canStop(game, u, t)) {
        var unexplored = 0;
        Hex.within(t, 2).forEach(function (z) { if (!exp[z]) unexplored++; });
        var s = unexplored * 2 - d * 1.2 + (m.hut[t] ? 25 : 0) + (m.hills[t] ? 2 : 0);
        if (unexplored > 0 || m.hut[t]) if (s > bestS) { bestS = s; best = t; }
      }
      if (d > 14) continue;
      var nb = Hex.neighbors(t);
      for (var i = 0; i < nb.length; i++) {
        var z = nb[i];
        if (seen[z] || !exp[z]) continue;
        if (!U.canEnter(game, u, z)) continue;
        if (R.impKey(m, z) === 'barb_camp') continue;
        seen[z] = 1; q.push(z);
      }
    }
    return best;
  }

  // ===================== Settlers =====================
  function bestSite(game, p, u) {
    var m = game.map, best = -1, bestS = -1e9;
    var myCities = cities(game, p);
    var origin = myCities.length ? myCities : [{ tile: u.tile }];
    var cands = Hex.within(u.tile, 12);
    for (var i = 0; i < cands.length; i++) {
      var t = cands[i];
      if (!p.explored[t] && myCities.length) continue;
      if (!E.canFoundCity(game, p, t)) continue;
      if (p.ai.settleTargets[t]) continue;
      if (m.area[t] !== m.area[u.tile] && myCities.length) continue;
      var foreign = U.militaryOn(game, t); if (foreign && foreign.owner !== p.id) continue;
      var danger = false;
      Hex.within(t, 2).forEach(function (z) { var mu = U.militaryOn(game, z); if (mu && E.atWar(game, p.id, mu.owner)) danger = true; if (R.impKey(m, z) === 'barb_camp') danger = true; });
      if (danger) continue;
      var s = MG.siteScore(m, t, 2);
      var dn = nearestCity(game, origin, t);
      var dd = dn ? Hex.distance(dn.tile, t) : 0;
      if (myCities.length) { if (dd < 3) continue; s -= Math.max(0, dd - 5) * 3; s -= Math.max(0, 4 - dd) * 2; }
      s -= Hex.distance(u.tile, t) * 0.8;
      // avoid other civs
      for (var cid in game.cities) { var oc = game.cities[cid]; if (oc.owner !== p.id && Hex.distance(oc.tile, t) < 5) s -= 8; }
      if (s > bestS) { bestS = s; best = t; }
    }
    return { tile: best, score: bestS };
  }
  function settlerTurn(game, p, u) {
    var m = game.map;
    if (!cities(game, p).length) {
      // first city: found immediately unless a much better spot is adjacent
      if (E.canFoundCity(game, p, u.tile)) { U.doAction(game, u, 'found'); return; }
    }
    var tgt = u.aiTarget;
    if (tgt == null || !E.canFoundCity(game, p, tgt) || (u.aiTargetTurn && game.turn - u.aiTargetTurn > 25)) {
      var bs = bestSite(game, p, u); tgt = bs.tile; u.aiTarget = tgt; u.aiTargetTurn = game.turn;
    }
    if (tgt < 0 || tgt == null) {
      if (E.canFoundCity(game, p, u.tile) && cities(game, p).length < 3) { U.doAction(game, u, 'found'); }
      return;
    }
    p.ai.settleTargets[tgt] = 1;
    if (u.tile === tgt) { U.doAction(game, u, 'found'); return; }
    U.moveTo(game, u, tgt);
    if (u.tile === tgt && u.moves > EPS) U.doAction(game, u, 'found');
    else if (!u.orders && u.tile !== tgt) u.aiTarget = null;
  }

  // ===================== Workers =====================
  A.workerAuto = function (game, u) { var p = game.players[u.owner]; p.ai = p.ai || {}; p.ai.workerTargets = p.ai.workerTargets || {}; workerTurn(game, p, u); };
  function chooseImprovement(game, p, u, t) {
    var opts = U.buildOptions(game, u, t);
    if (!opts.length) return null;
    var m = game.map, ids = opts.map(function (o) { return o.id; });
    var rk = m.res[t] && R.resVisible(p, R.resKey(m, t)) ? R.resKey(m, t) : null;
    if (ids.indexOf('repair') >= 0) return 'repair';
    if (rk) { var ri = D.RESOURCES[rk].imp; if (ids.indexOf(ri) >= 0) return ri; if (ri === 'fishing_boats' && ids.indexOf('fishing_boats') >= 0) return 'fishing_boats'; if (ids.indexOf('offshore_platform') >= 0) return 'offshore_platform'; }
    var fk = R.featureKey(m, t);
    if (fk === 'fallout' && ids.indexOf('remove_fallout') >= 0) return 'remove_fallout';
    if (rk) return null;
    var uniq = ids.filter(function (k) { return D.IMPROVEMENTS[k] && D.IMPROVEMENTS[k].unique; });
    if (uniq.length && uniq[0] !== 'chateau') return uniq[0];
    if (fk === 'marsh' && ids.indexOf('remove_marsh') >= 0) return 'remove_marsh';
    if (fk === 'jungle' && ids.indexOf('remove_jungle') >= 0 && !m.hills[t]) return 'remove_jungle';
    if (fk === 'forest') { if (ids.indexOf('lumber_mill') >= 0) return 'lumber_mill'; return null; }
    if (m.hills[t]) { if (R.freshWater(m, t) && ids.indexOf('farm') >= 0 && game.rng.chance(0.3)) return 'farm'; if (ids.indexOf('mine') >= 0) return 'mine'; }
    if (ids.indexOf('farm') >= 0) { var tk = R.terrainKey(m, t); if (tk !== 'tundra' || game.rng.chance(0.5)) return (game.rng.chance(0.18) && ids.indexOf('trading_post') >= 0) ? 'trading_post' : 'farm'; }
    if (ids.indexOf('trading_post') >= 0) return 'trading_post';
    return null;
  }
  function workerTurn(game, p, u) {
    var m = game.map, d = D.UNITS[u.type];
    var sea = d.domain === 'sea';
    // flee danger
    if (!sea) {
      var threat = Hex.within(u.tile, 2).some(function (t) { var mu = U.militaryOn(game, t); return mu && E.atWar(game, p.id, mu.owner); });
      if (threat) { var home = nearestCity(game, cities(game, p), u.tile); if (home) U.moveTo(game, u, home.tile); return; }
    }
    // already on a good tile?
    var here = chooseImprovement(game, p, u, u.tile);
    if (here && m.owner[u.tile] === p.id && u.moves > EPS && !p.ai.workerTargets[u.tile]) { p.ai.workerTargets[u.tile] = 1; U.startBuild(game, u, here); return; }
    // find best target
    var best = -1, bestS = -1e9, bestImp = null;
    cities(game, p).forEach(function (c) {
      E.cityTiles(game, c).forEach(function (t) {
        if (p.ai.workerTargets[t] || t === c.tile) return;
        if (sea !== R.isWater(m, t)) return;
        if (Hex.distance(u.tile, t) > 15) return;
        var imp = chooseImprovement(game, p, u, t);
        if (!imp) return;
        var s = 10;
        var rk = m.res[t] ? R.resKey(m, t) : null;
        if (rk) s += D.RESOURCES[rk].type === 'luxury' ? 25 : D.RESOURCES[rk].type === 'strategic' ? 18 : 12;
        if (c.worked.indexOf(t) >= 0) s += 8;
        if (imp === 'repair') s += 15;
        s -= Hex.distance(u.tile, t) * 1.5;
        var occ = U.militaryOn(game, t); if (occ && occ.owner !== p.id) return;
        if (s > bestS) { bestS = s; best = t; bestImp = imp; }
      });
    });
    // roads between cities
    if (best < 0 && !sea && p.techs.the_wheel) {
      var cap = game.cities[p.capital];
      if (cap) cities(game, p).forEach(function (c) {
        if (best >= 0 || c === cap || c.connected || Hex.distance(c.tile, cap.tile) > 14) return;
        var path = roadPath(game, c.tile, cap.tile);
        if (!path) return;
        for (var i = 0; i < path.length; i++) {
          var t = path[i];
          if (!m.road[t] && !E.cityAt(game, t) && !p.ai.workerTargets[t] && (m.owner[t] === p.id || m.owner[t] < 0)) { best = t; bestImp = 'road'; break; }
        }
      });
    }
    if (best < 0) {
      if (!sea) { // railroads late game
        if (p.techs.railroad) { var cap2 = game.cities[p.capital]; cities(game, p).forEach(function (c) { if (best >= 0 || c === cap2 || !cap2) return; var path = roadPath(game, c.tile, cap2.tile); if (path) for (var i = 0; i < path.length; i++) { if (m.road[path[i]] === 1 && !p.ai.workerTargets[path[i]]) { best = path[i]; bestImp = 'railroad'; break; } } }); }
      }
      if (best < 0) { if (u.moves > EPS) { var c0 = nearestCity(game, cities(game, p), u.tile); if (c0 && c0.tile !== u.tile && !sea) U.moveTo(game, u, c0.tile); } return; }
    }
    p.ai.workerTargets[best] = 1;
    if (u.tile !== best) U.moveTo(game, u, best);
    if (u.tile === best && u.moves > EPS) U.startBuild(game, u, bestImp);
    else if (u.tile === best && sea) U.startBuild(game, u, bestImp);
  }
  // Simple land path for roads (ignores units)
  function roadPath(game, a, b) {
    var m = game.map, open = [{ t: a, g: 0 }], came = {}, cost = {}; cost[a] = 0;
    var n = 0;
    while (open.length && n++ < 1500) {
      open.sort(function (x, y) { return x.f - y.f; });
      var cur = open.shift();
      if (cur.t === b) break;
      Hex.neighbors(cur.t).forEach(function (z) {
        if (!MG.isLand(m, z) || m.terrain[z] === IDS.terrain.map.mountain) return;
        var c = (m.road[z] ? 0.3 : 1) + (m.hills[z] ? 0.5 : 0) + (m.feature[z] ? 0.5 : 0);
        var g = cur.g + c;
        if (cost[z] === undefined || g < cost[z]) { cost[z] = g; came[z] = cur.t; open.push({ t: z, g: g, f: g + Hex.distance(z, b) }); }
      });
    }
    if (cost[b] === undefined) return null;
    var path = [], t = b; while (t !== a) { path.push(t); t = came[t]; }
    return path.reverse();
  }

  // ===================== Trade =====================
  function tradeTurn(game, p, u) {
    var c = E.cityAt(game, u.tile);
    if (c && c.owner === p.id) {
      var targets = E.tradeTargets(game, u);
      if (targets.length) { E.establishTrade(game, u, targets[0].city, game.rng.chance(0.5) ? 'food' : 'prod'); return; }
    }
    // move to capital
    var cap = game.cities[p.capital];
    if (cap && u.tile !== cap.tile) U.moveTo(game, u, cap.tile);
    else if (cap) { var others = cities(game, p).filter(function (x) { return x !== cap; }); if (others.length) U.moveTo(game, u, game.rng.pick(others).tile); else E.removeUnit(game, u, 'disband'); }
  }

  // ===================== Great People =====================
  function gpTurn(game, p, u) {
    var d = D.UNITS[u.type], acts = U.specialActions(game, u), ids = acts.map(function (a) { return a.id; });
    var cap = game.cities[p.capital];
    var home = cap;
    if (d.gp === 'general' || d.gp === 'admiral') {
      // follow the army
      var army = units(game, p).filter(function (o) { return isMil(o) && D.UNITS[o.type].domain === d.domain; });
      if (army.length) {
        var front = army.sort(function (a, b) { return (enemyDist(game, p, a.tile)) - (enemyDist(game, p, b.tile)); })[0];
        var dest = Hex.neighbors(front.tile).filter(function (t) { return U.canEnter(game, u, t) && U.canStop(game, u, t); })[0];
        if (dest != null && Hex.distance(u.tile, front.tile) > 1) U.moveTo(game, u, dest);
      }
      if (d.gp === 'admiral' && units(game, p).some(function (o) { return D.UNITS[o.type].domain === 'sea' && o.hp < 50; })) U.doAction(game, u, 'repair_fleet');
      return;
    }
    if (d.gp === 'prophet') {
      if (ids.indexOf('found_religion') >= 0) { var ch = A.religionChoice(game, p); if (ch) { U.doAction(game, u, 'found_religion', ch); return; } }
      if (ids.indexOf('enhance_religion') >= 0) { var fb = Object.keys(D.BELIEFS.follower).filter(function (b) { return !game.beliefsTaken[b]; }); if (fb.length) { U.doAction(game, u, 'enhance_religion', { follower: game.rng.pick(fb) }); return; } }
      if (!p.religion && cap && u.tile !== cap.tile && Object.keys(game.religions).length < R.maxReligions(game)) { U.moveTo(game, u, cap.tile); return; }
      if (p.religion) { missionaryTurn(game, p, u); return; }
      if (ids.indexOf('gpimp') >= 0) { U.doAction(game, u, 'gpimp', 'holy_site'); return; }
      moveToImpSpot(game, p, u); return;
    }
    if (d.gp === 'scientist') { if (game.rng.chance(0.6) || !ids.length) { U.doAction(game, u, 'bulb'); return; } var gi = acts.filter(function (a) { return a.id === 'gpimp'; })[0]; if (gi) { U.doAction(game, u, 'gpimp', gi.imp); return; } U.doAction(game, u, 'bulb'); return; }
    if (d.gp === 'engineer') {
      var wc = cities(game, p).filter(function (c) { return c.build && c.build.kind === 'wonder'; })[0];
      if (wc) { if (u.tile === wc.tile) { U.doAction(game, u, 'hurry'); return; } U.moveTo(game, u, wc.tile); if (u.tile === wc.tile) U.doAction(game, u, 'hurry'); return; }
      var gi2 = acts.filter(function (a) { return a.id === 'gpimp'; })[0]; if (gi2) { U.doAction(game, u, 'gpimp', gi2.imp); return; }
      if (cap && u.tile === cap.tile) { U.doAction(game, u, 'hurry'); return; }
      moveToImpSpot(game, p, u); return;
    }
    if (d.gp === 'merchant') {
      if (ids.indexOf('trade_mission') >= 0) { U.doAction(game, u, 'trade_mission'); return; }
      var cs = game.players.filter(function (q) { return q.isCS && q.alive && p.met[q.id] && !E.atWar(game, p.id, q.id); }).map(function (q) { return game.cities[q.capital]; }).filter(Boolean).sort(function (a, b) { return Hex.distance(a.tile, u.tile) - Hex.distance(b.tile, u.tile); })[0];
      if (cs && Hex.distance(cs.tile, u.tile) < 14) { var adj = Hex.neighbors(cs.tile).filter(function (t) { return U.canEnter(game, u, t) && U.canStop(game, u, t); })[0]; if (adj != null) { U.moveTo(game, u, adj); if (U.specialActions(game, u).some(function (a) { return a.id === 'trade_mission'; })) U.doAction(game, u, 'trade_mission'); return; } }
      var gi3 = acts.filter(function (a) { return a.id === 'gpimp'; })[0]; if (gi3) { U.doAction(game, u, 'gpimp', gi3.imp); return; }
      moveToImpSpot(game, p, u); return;
    }
    // artists/writers/musicians
    if (ids.indexOf('great_work') >= 0) { U.doAction(game, u, 'great_work'); return; }
    var slotCity = cities(game, p).filter(function (c) { return U.freeWorkSlot(c, d.gp); })[0];
    if (slotCity) { U.moveTo(game, u, slotCity.tile); if (U.specialActions(game, u).some(function (a) { return a.id === 'great_work'; })) U.doAction(game, u, 'great_work'); return; }
    if (d.gp === 'artist') { U.doAction(game, u, 'golden_age'); return; }
    if (d.gp === 'writer') { U.doAction(game, u, 'treatise'); return; }
    U.doAction(game, u, 'concert');
  }
  function moveToImpSpot(game, p, u) {
    var cap = game.cities[p.capital]; if (!cap) return;
    var m = game.map;
    var spot = E.cityTiles(game, cap).filter(function (t) { return t !== cap.tile && !m.res[t] && MG.isLand(m, t) && m.terrain[t] !== IDS.terrain.map.mountain && !U.civilianOn(game, t); })[0];
    if (spot != null) { U.moveTo(game, u, spot); var a = U.specialActions(game, u).filter(function (x) { return x.id === 'gpimp'; })[0]; if (a && u.tile === spot) U.doAction(game, u, 'gpimp', a.imp); }
  }
  function enemyDist(game, p, t) {
    var best = 99;
    for (var id in game.cities) { var c = game.cities[id]; if (E.atWar(game, p.id, c.owner)) best = Math.min(best, Hex.distance(c.tile, t)); }
    return best;
  }
  A.religionChoice = function (game, p) {
    var rels = D.RELIGIONS.filter(function (r) { return !game.religions[r.id]; });
    if (!rels.length) return null;
    // civ-appropriate religion
    var pref = { india: 'hinduism', china: 'confucianism', japan: 'shinto', arabia: 'islam', byzantium: 'orthodoxy', persia: 'zoroastrianism', mongolia: 'tengrism', siam: 'buddhism', khmer: 'buddhism', korea: 'confucianism', ethiopia: 'christianity', russia: 'orthodoxy', athens: 'hellenism', macedon: 'hellenism', sparta: 'hellenism', mughal: 'islam', tibet: 'buddhism', ottomans: 'islam', morocco: 'islam', mali: 'islam', songhai: 'islam', georgia: 'orthodoxy', bulgaria: 'orthodoxy', spain: 'christianity', france: 'christianity', england: 'christianity', rome: 'christianity', poland: 'christianity' }[p.civ];
    var rel = rels.filter(function (r) { return r.id === pref; })[0] || game.rng.pick(rels);
    var fo = Object.keys(D.BELIEFS.founder).filter(function (b) { return !game.beliefsTaken[b]; });
    var fl = Object.keys(D.BELIEFS.follower).filter(function (b) { return !game.beliefsTaken[b]; });
    if (!fo.length || !fl.length) return null;
    return { rel: rel.id, founder: game.rng.pick(fo), follower: game.rng.pick(fl) };
  };
  function missionaryTurn(game, p, u) {
    var acts = U.specialActions(game, u);
    if (u.type === 'inquisitor') { var c0 = E.cityAt(game, u.tile); if (c0 && c0.owner === p.id && Object.keys(c0.followers).some(function (r) { return r !== p.religion; })) { U.doAction(game, u, 'inquisit'); return; } }
    if (acts.some(function (a) { return a.id === 'spread'; })) { U.doAction(game, u, 'spread'); return; }
    // find target city
    var best = null, bs = -1e9;
    for (var id in game.cities) {
      var c = game.cities[id];
      if (E.majorityReligion(c) === p.religion) continue;
      var o = game.players[c.owner];
      if (E.atWar(game, p.id, o.id)) continue;
      if (o.id !== p.id && !o.isCS && !(E.rel(o, p.id).openBorders > 0)) continue;
      var s = c.pop * 2 - Hex.distance(u.tile, c.tile) * 1.5 + (c.owner === p.id ? 10 : 0);
      if (s > bs) { bs = s; best = c; }
    }
    if (!best) { if (u.type === 'great_prophet') { moveToImpSpot(game, p, u); } return; }
    var adj = [best.tile].concat(Hex.neighbors(best.tile)).filter(function (t) { return U.canEnter(game, u, t) && U.canStop(game, u, t); })[0];
    if (adj == null) return;
    U.moveTo(game, u, adj);
    if (U.specialActions(game, u).some(function (a) { return a.id === 'spread'; }) && u.moves > EPS) U.doAction(game, u, 'spread');
  }

  // ===================== Military =====================
  function threatNear(game, p, t, r) {
    var n = 0;
    Hex.within(t, r).forEach(function (z) { E.unitsAt(game, z).forEach(function (o) { if (o.owner !== p.id && isMil(o) && E.atWar(game, p.id, o.owner)) n++; }); });
    return n;
  }
  function tryAttacks(game, p, u) {
    var d = D.UNITS[u.type];
    var range = d.rs ? (d.range || 1) + (u.promos.indexOf('range') >= 0 ? 1 : 0) : 1;
    var best = null, bs = -1e9;
    Hex.within(u.tile, range).forEach(function (t) {
      if (t === u.tile) return;
      var info = U.attackInfo(game, u, t);
      if (!info) return;
      var s;
      if (info.kind === 'capture') s = 30;
      else if (info.kind === 'ranged' || info.kind === 'air') {
        var hp = info.city ? info.city.hp : info.target.hp;
        s = info.dmg.toDef * 2 + (info.dmg.toDef >= hp ? 60 : 0) + (info.city ? 10 : 0);
      } else if (info.kind === 'meleeCity') {
        if (info.city.hp <= info.dmg.toDef + 5 && u.hp > info.dmg.toAtk + 10) s = 200;
        else if (u.hp - info.dmg.toAtk > 35 && info.dmg.toDef > info.dmg.toAtk * 0.8) s = info.dmg.toDef - info.dmg.toAtk;
        else return;
      } else {
        var kill = info.dmg.toDef >= info.target.hp;
        if (u.hp - info.dmg.toAtk <= 10 && !kill) return;
        s = info.dmg.toDef * 1.5 - info.dmg.toAtk + (kill ? 50 : 0);
        if (s < 0 && !kill) return;
      }
      if (s > bs) { bs = s; best = t; }
    });
    if (best != null) { U.attack(game, u, best); return true; }
    return false;
  }
  function militaryTurn(game, p, u) {
    var m = game.map, d = D.UNITS[u.type];
    var guard = 0;
    while (u.moves > EPS && guard++ < 3) { if (!tryAttacks(game, p, u)) break; if (!game.units[u.id]) return; }
    if (!game.units[u.id] || u.moves <= EPS) return;
    var myCities = cities(game, p);
    var city = E.cityAt(game, u.tile);
    // wounded: retreat & heal
    if (u.hp < 45) {
      if (city && city.owner === p.id) { u.fortify = 1; return; }
      var home = nearestCity(game, myCities, u.tile);
      if (home && Hex.distance(home.tile, u.tile) < 10) { U.moveTo(game, u, U.canStop(game, u, home.tile) ? home.tile : (Hex.neighbors(home.tile).filter(function (t) { return U.canEnter(game, u, t) && U.canStop(game, u, t); })[0] || home.tile)); }
      if (u.moves > EPS) u.fortify = 1;
      return;
    }
    // garrison duty: stay in undefended city (land units)
    if (d.domain === 'land' && city && city.owner === p.id) {
      var g = E.garrison(game, city);
      if (g === u) {
        var others = myCities.filter(function (c) { return !E.garrison(game, c); });
        var warNow = enemiesOf(game, p).length > 0;
        if (!warNow || threatNear(game, p, city.tile, 3) || p.isCS || game.rng.chance(0.7)) { u.fortify = Math.max(1, u.fortify); return; }
      }
    }
    // undefended own city nearby
    if (d.domain === 'land') {
      var empty = myCities.filter(function (c) { return !E.garrison(game, c) && Hex.distance(c.tile, u.tile) < 10; }).sort(function (a, b) { return Hex.distance(a.tile, u.tile) - Hex.distance(b.tile, u.tile); })[0];
      if (empty && (!p.ai.army || p.ai.army.indexOf(u.id) < 0 || threatNear(game, p, empty.tile, 3))) { U.moveTo(game, u, empty.tile); if (u.tile === empty.tile) u.fortify = 1; return; }
    }
    // defend threatened cities
    var threatened = myCities.filter(function (c) { return threatNear(game, p, c.tile, 3) > 0; }).sort(function (a, b) { return Hex.distance(a.tile, u.tile) - Hex.distance(b.tile, u.tile); })[0];
    if (threatened && Hex.distance(threatened.tile, u.tile) < 8) {
      var enemy = null, ed = 99;
      Hex.within(threatened.tile, 3).forEach(function (z) { var mu = U.militaryOn(game, z); if (mu && E.atWar(game, p.id, mu.owner) && Hex.distance(z, u.tile) < ed) { ed = Hex.distance(z, u.tile); enemy = z; } });
      if (enemy != null) { approach(game, p, u, enemy); tryAttacks(game, p, u); return; }
    }
    if (p.isCS) { if (city) u.fortify = 1; else { var cc = myCities[0]; if (cc) U.moveTo(game, u, cc.tile); } return; }
    // offensive war
    var target = warTargetCity(game, p, u);
    if (target) {
      if (d.domain === 'sea') { approach(game, p, u, target.tile); tryAttacks(game, p, u); return; }
      var dist = Hex.distance(u.tile, target.tile);
      var near = units(game, p).filter(function (o) { return isMil(o) && Hex.distance(o.tile, target.tile) <= 4; }).length;
      if (dist > 4 || near >= 3 || target.hp < 100) approach(game, p, u, target.tile);
      tryAttacks(game, p, u);
      return;
    }
    // enemy units near territory
    var hunt = null, hd = 8;
    Hex.within(u.tile, 6).forEach(function (z) { var mu = U.militaryOn(game, z); if (mu && E.atWar(game, p.id, mu.owner) && Hex.distance(z, u.tile) < hd) { hd = Hex.distance(z, u.tile); hunt = z; } });
    if (hunt != null) { approach(game, p, u, hunt); tryAttacks(game, p, u); return; }
    // barbarian camps near our cities
    if (d.domain === 'land' && game.turn % 3 === u.id % 3) {
      var camp = null, cd = 9;
      Hex.within(u.tile, 8).forEach(function (z) { if (R.impKey(m, z) === 'barb_camp' && p.explored[z] && Hex.distance(z, u.tile) < cd) { cd = Hex.distance(z, u.tile); camp = z; } });
      if (camp != null && u.hp > 70) { approach(game, p, u, camp); if (U.attackInfo(game, u, camp)) U.attack(game, u, camp); else if (!U.militaryOn(game, camp) && Hex.distance(u.tile, camp) === 1) U.moveTo(game, u, camp); return; }
    }
    // naval units explore early
    if (d.domain === 'sea' && game.rng.chance(0.5)) { exploreTurn(game, p, u, true); return; }
    // idle: fortify in place near border city
    if (!city && d.domain === 'land') {
      var c2 = nearestCity(game, myCities, u.tile);
      if (c2 && Hex.distance(c2.tile, u.tile) > 3) { U.moveTo(game, u, Hex.within(c2.tile, 1).filter(function (t) { return U.canEnter(game, u, t) && U.canStop(game, u, t); })[0] || c2.tile); return; }
    }
    u.fortify = Math.max(1, u.fortify);
  }
  function approach(game, p, u, t) {
    if (u.moves <= EPS) return;
    var d = D.UNITS[u.type];
    if (d.rs && !U.embarked(game, u)) {
      var range = (d.range || 1) + (u.promos.indexOf('range') >= 0 ? 1 : 0);
      if (Hex.distance(u.tile, t) <= range) return; // already in range
      // move to a tile within range
      var spots = Hex.within(t, range).filter(function (z) { return Hex.distance(z, t) === range && U.canEnter(game, u, z) && U.canStop(game, u, z); });
      spots.sort(function (a, b) { return Hex.distance(a, u.tile) - Hex.distance(b, u.tile); });
      if (spots.length) { U.moveTo(game, u, spots[0]); return; }
    }
    if (Hex.distance(u.tile, t) <= 1) return;
    // move adjacent
    var adj = Hex.neighbors(t).filter(function (z) { return U.canEnter(game, u, z) && U.canStop(game, u, z) && !U.militaryOn(game, z); });
    adj.sort(function (a, b) { return Hex.distance(a, u.tile) - Hex.distance(b, u.tile); });
    var dest = adj.length ? adj[0] : t;
    var path = U.findPath(game, u, dest, { limit: 1200 });
    if (path) U.moveTo(game, u, dest);
  }
  function warTargetCity(game, p, u) {
    var en = enemiesOf(game, p).filter(function (o) { return !o.isCS || (p.ai.warTarget === o.id); });
    if (!en.length) return null;
    var d = D.UNITS[u.type];
    var best = null, bd = 1e9;
    en.forEach(function (o) {
      cities(game, o).forEach(function (c) {
        var dd = Hex.distance(c.tile, u.tile);
        if (d.domain === 'land' && game.map.area[c.tile] !== game.map.area[u.tile]) dd += 30;
        if (d.domain === 'sea' && !E.isCoastal(game, c.tile)) return;
        dd -= (200 - c.hp) / 20;
        if (dd < bd) { bd = dd; best = c; }
      });
    });
    if (best && bd > 25) return null;
    return best;
  }
  function airTurn(game, p, u) {
    if (u.acted) return;
    var d = D.UNITS[u.type], best = null, bs = -1;
    Hex.within(u.tile, d.range).forEach(function (t) { var info = U.attackInfo(game, u, t); if (info && info.kind === 'air') { var s = info.dmg.toDef - info.dmg.toAtk; if (s > bs) { bs = s; best = t; } } });
    if (best != null && u.hp > 50) U.attack(game, u, best);
  }

  // ===================== Barbarians =====================
  function barbTurn(game, p) {
    units(game, p).forEach(function (u) {
      if (!game.units[u.id]) return;
      if (tryAttacks(game, p, u)) return;
      if (u.moves <= EPS) return;
      if (u.hp < 40) { u.fortify = 1; return; }
      // pillage
      var m = game.map;
      if (m.imp[u.tile] && m.owner[u.tile] >= 0 && !m.pillaged[u.tile] && game.rng.chance(0.5)) { U.pillage(game, u); return; }
      var target = null, td = 9;
      Hex.within(u.tile, 7).forEach(function (z) {
        var c = E.cityAt(game, z);
        var mu = U.militaryOn(game, z) || U.civilianOn(game, z);
        if ((c && c.owner !== p.id) || (mu && mu.owner !== p.id)) { var dd = Hex.distance(z, u.tile) + (c ? 2 : 0); if (dd < td) { td = dd; target = z; } }
      });
      if (target != null) { approach(game, p, u, target); tryAttacks(game, p, u); return; }
      // wander
      var nb = Hex.neighbors(u.tile).filter(function (z) { return U.canEnter(game, u, z) && U.canStop(game, u, z); });
      if (nb.length && game.rng.chance(0.6)) U.moveTo(game, u, game.rng.pick(nb));
    });
  }

  // ===================== Production =====================
  A.chooseProduction = function (game, p, c) {
    var opts = E.buildOptions(game, c);
    if (p.isCS && p.units.length >= 4 + E.eraOf(p)) opts = opts.filter(function (o) { return o.kind !== 'unit'; });
    if (!opts.length) return;
    var fl = p.flavor || { war: 5, expand: 4, science: 5, culture: 5, wonder: 3, gold: 5, religion: 3, naval: 3 };
    var myCities = cities(game, p), us = units(game, p);
    var mil = us.filter(isMil).length;
    var workers = us.filter(function (u) { return u.type === 'worker'; }).length;
    var settlers = us.filter(function (u) { return u.type === 'settler'; }).length + myCities.filter(function (x) { return x.build && x.build.id === 'settler' && x !== c; }).length;
    var atWar = enemiesOf(game, p).filter(function (o) { return !o.isCS; }).length > 0;
    var threat = threatNear(game, p, c.tile, 4);
    var era = p.era;
    var targetCities = p.isCS ? 1 : Math.round(4 + fl.expand * 0.8 + (game.map.W > 90 ? 2 : 0));
    var wantMil = Math.max(2, Math.ceil(myCities.length * (atWar ? 2.2 : 1.1) + (fl.war - 5) * 0.5));
    if ((p.lastYields.gpt || 0) < 0 && p.gold < 100) wantMil = Math.min(wantMil, mil);
    if (p.isCS) wantMil = 2 + era;
    var hasGarrison = !!E.garrison(game, c);
    if (p.isCS) wantMil = Math.min(wantMil, 3 + Math.floor(era / 2));
    var roles = {}, bestStr = { melee: 1, ranged: 1, siege: 1, mounted: 1, naval: 1, air: 1, other: 1 };
    us.forEach(function (u) { if (isMil(u)) { var r = roleOf(D.UNITS[u.type]); roles[r] = (roles[r] || 0) + 1; } });
    myCities.forEach(function (x) { if (x !== c && x.build && x.build.kind === 'unit') { var bd = D.UNITS[x.build.id]; if (isMilitaryDef(bd)) { var r = roleOf(bd); roles[r] = (roles[r] || 0) + 1; mil++; } if (x.build.id === 'worker') workers++; } });
    opts.forEach(function (o) { if (o.kind === 'unit') { var d = D.UNITS[o.id]; if (isMilitaryDef(d)) { var r = roleOf(d); bestStr[r] = Math.max(bestStr[r], (d.str || 0) + (d.rs || 0)); } } });
    var coastal = E.isCoastal(game, c.tile);
    var roleMix = { melee: 0.42, ranged: 0.28, siege: atWar ? 0.12 : 0.06, mounted: 0.14, naval: coastal ? 0.08 + (fl.naval - 5) * 0.02 : 0, air: era >= 5 ? 0.1 : 0 };
    if (p.isCS) roleMix = { melee: 0.6, ranged: 0.4 };
    var best = null, bs = -1e9;
    var y = c.lastYields || E.cityYields(game, c);
    opts.forEach(function (o) {
      var s = 0;
      if (o.kind === 'unit') {
        var d = D.UNITS[o.id];
        if (o.id === 'settler') {
          if (myCities.length + settlers < targetCities && p.happy >= 2 + settlers * 2 && c.pop >= 2 && settlers < 2) s = 60 + fl.expand * 5 - myCities.length * 3;
          else s = -100;
          if (c.pop < 3 && myCities.length > 1) s -= 20;
          if (atWar || threat) s -= 40;
        } else if (o.id === 'worker') {
          var wantW = Math.ceil(myCities.length * 1.0) + 1;
          s = workers < wantW ? 55 - workers * 3 : -10;
          if (workers === 0) s = 90;
        } else if (o.id === 'work_boat') {
          var seaRes = E.cityTiles(game, c).filter(function (t) { return game.map.res[t] && R.isWater(game.map, t) && !game.map.imp[t] && R.resVisible(p, R.resKey(game.map, t)); }).length;
          var boats = us.filter(function (u) { return u.type === 'work_boat'; }).length;
          s = seaRes > boats ? 35 : -50;
        } else if (o.id === 'caravan' || o.id === 'cargo_ship') {
          s = 30 + fl.gold * 2;
        } else if (o.id === 'scout') {
          s = (game.turn < 30 && us.filter(function (u) { return u.type === 'scout'; }).length < 2) ? 25 : -50;
        } else if (d.cls === 'civilian') s = -50;
        else if (isMilitaryDef(d)) {
          var role = roleOf(d);
          var have = roles[role] || 0, want = Math.max(role === 'melee' ? 1 : 0, Math.round(wantMil * (roleMix[role] || 0)));
          s = mil < wantMil && have < want ? 30 + (want - have) * 8 + (wantMil - mil) * 3 : -20;
          if (threat) s += 40;
          if (!hasGarrison && d.domain === 'land' && (role === 'melee' || role === 'ranged')) s += 30;
          if (atWar) s += 10 + fl.war;
          // prefer the strongest unit of the role
          s += ((d.str || 0) + (d.rs || 0)) / bestStr[role] * 10;
          if (d.domain === 'air') s -= atWar ? 0 : 15;
          if (d.cls === 'nuke') s = atWar && fl.war > 6 && game.rng.chance(0.3) ? 20 : -100;
          if (d.cls === 'recon') s -= 30;
          if (role === 'naval' && !atWar && have >= 2) s -= 30;
        }
      } else if (o.kind === 'building') {
        var b = D.BUILDINGS[o.id], base = R.baseBuilding(o.id);
        s = 20;
        if (b.y) s += (b.y.f || 0) * 4 + (b.y.p || 0) * 4 + (b.y.g || 0) * 2 + (b.y.s || 0) * (2 + fl.science * 0.3) + (b.y.c || 0) * (2 + fl.culture * 0.4) + (b.y.fa || 0) * (1 + fl.religion * 0.3);
        if (b.perPop) s += (b.perPop.s || 0) * c.pop * 3;
        if (b.pct) s += ((b.pct.s || 0) * y.s + (b.pct.g || 0) * y.g + (b.pct.p || 0) * y.p * 1.5 + (b.pct.c || 0) * y.c) / 20;
        if (b.happy) s += b.happy * (p.happy < 0 ? 18 : p.happy < 3 ? 10 : 3);
        if (b.def) s += b.def * ((threat || atWar) ? 4 : 0.6) + (c.capital ? 3 : 0);
        if (b.xp) s += fl.war - 2;
        var poor = (p.lastYields.gpt || 0) < 2 && p.gold < 150;
        if (b.maint) s -= b.maint * (poor ? 8 : 2);
        if (poor && b.y && b.y.g) s += 25;
        if (poor && b.pct && b.pct.g) s += 25;
        if (b.seaY) s += E.cityTiles(game, c).filter(function (t) { return R.isWater(game.map, t); }).length * 1.5;
        if (base === 'monument') s += 30;
        if (base === 'granary' && c.pop >= 3) s += 8;
        if (base === 'granary' || base === 'shrine') s += 5;
        if (base === 'library') s += 6 + fl.science;
        if (b.national) s += 15;
        if (b.foodKeep) s += c.pop > 6 ? 15 : -5;
        if (base === 'courthouse') s = c.occupied ? 80 : -100;
        s -= b.cost / Math.max(1, y.p) * 0.9; // turns to build
      } else if (o.kind === 'wonder') {
        var w = D.WONDERS[o.id];
        s = 10 + fl.wonder * 4 + (y.p > 8 ? 10 : 0) - w.era * 1.5 + (c.capital ? 10 : 0);
        if (y.p < 6) s -= 40;
        s -= R.productionCost(game, p, 'wonder', o.id) / Math.max(1, y.p) * 0.6;
        if (atWar) s -= 20;
        if (o.id === 'apollo_program') s = 70 + fl.science * 3;
        if (o.id === 'utopia_project') s = 200;
        if (o.id === 'manhattan_project') s = fl.war > 6 ? 40 : 0;
        if (myCities.filter(function (x) { return x.build && x.build.kind === 'wonder'; }).length >= 1 + (fl.wonder > 6 ? 1 : 0)) s -= 30;
        s += game.rng.next() * 15;
      } else if (o.kind === 'space') s = 120;
      else if (o.kind === 'process') s = (o.id === 'wealth' && (p.lastYields.gpt || 0) < 0) ? 20 : -30;
      s += game.rng.next() * 8;
      if (s > bs) { bs = s; best = o; }
    });
    if (best) E.setBuild(game, c, best);
  };
  function isMilitaryDef(d) { return d.cls !== 'civilian' && d.cls !== 'gp'; }
  function roleOf(d) {
    if (d.domain === 'sea') return 'naval';
    if (d.domain === 'air') return 'air';
    if (d.cls === 'siege') return 'siege';
    if (d.cls === 'mounted' || d.cls === 'armor') return 'mounted';
    if (d.cls === 'ranged') return 'ranged';
    if (d.cls === 'melee' || d.cls === 'gun') return 'melee';
    return 'other';
  }

  // ===================== Research =====================
  A.pickTech = function (game, p, opts) {
    var fl = p.flavor || {};
    var best = opts[0], bs = -1e9;
    opts.forEach(function (t) {
      var td = D.TECHS[t], un = D.TECH_UNLOCKS[t] || { units: [], buildings: [], wonders: [], imps: [] };
      var s = 100 / Math.pow(R.techCost(game, p, t), 0.55);
      s += un.buildings.length * 1.2 + un.wonders.length * (fl.wonder || 4) * 0.2 + un.units.length * (fl.war || 5) * 0.12 + un.imps.length * 1.5;
      if (['pottery', 'mining', 'bronze_working', 'writing', 'animal_husbandry', 'the_wheel', 'calendar'].indexOf(t) >= 0) s += 2;
      if (t === 'philosophy' || t === 'education' || t === 'scientific_theory' || t === 'computers') s += (fl.science || 5) * 0.3;
      if (t === 'theology' || t === 'philosophy') s += (fl.religion || 4) * 0.2;
      if (t === 'optics' || t === 'compass' || t === 'navigation') s += (fl.naval || 4) * 0.25;
      if (t === 'rocketry' || t === 'satellites' || t === 'advanced_ballistics' || t === 'particle_physics' || t === 'nanotechnology') s += 4;
      s += game.rng.next() * 2;
      if (s > bs) { bs = s; best = t; }
    });
    return best;
  };
  A.chooseResearch = function (game, p) {
    var opts = E.researchOptions(p);
    if (!opts.length) return;
    p.researching = A.pickTech(game, p, opts);
  };

  // ===================== Policies =====================
  A.choosePolicy = function (game, p) {
    var fl = p.flavor || {};
    // finish opened trees first
    var openTrees = Object.keys(p.trees).filter(function (t) { return p.trees[t] === 'open'; });
    for (var i = 0; i < openTrees.length; i++) {
      var pols = Object.keys(D.POLICY_TREES[openTrees[i]].policies).filter(function (k) { return E.canAdoptPolicy(game, p, k); });
      if (pols.length) return E.adopt(game, p, 'policy', game.rng.pick(pols));
    }
    var prefs = [];
    var era = E.eraOf(p);
    var trees = Object.keys(D.POLICY_TREES).filter(function (t) { return E.canAdoptTree(game, p, t); });
    if (!trees.length) return false;
    trees.forEach(function (t) {
      var s = game.rng.next() * 3;
      if (t === 'tradition') s += 6 + (fl.culture || 5) * 0.3 - (fl.expand || 5) * 0.3;
      if (t === 'liberty') s += 5 + (fl.expand || 5) * 0.4;
      if (t === 'honor') s += (fl.war || 5) * 0.7;
      if (t === 'piety') s += (fl.religion || 4) * 0.7;
      if (t === 'patronage') s += (fl.gold || 5) * 0.4;
      if (t === 'aesthetics') s += (fl.culture || 5) * 0.6;
      if (t === 'commerce') s += (fl.gold || 5) * 0.7;
      if (t === 'exploration') s += (fl.naval || 4) * 0.6;
      if (t === 'rationalism') s += 4 + (fl.science || 5) * 0.6;
      if (t === 'freedom') s += (fl.culture || 5) * 0.8;
      if (t === 'order') s += (fl.science || 5) * 0.5 + 2;
      if (t === 'autocracy') s += (fl.war || 5) * 0.8;
      prefs.push({ t: t, s: s });
    });
    prefs.sort(function (a, b) { return b.s - a.s; });
    return E.adopt(game, p, 'tree', prefs[0].t);
  };
  A.choosePantheon = function (game, p) {
    var opts = Object.keys(D.BELIEFS.pantheon).filter(function (b) { return !game.pantheonsTaken[b]; });
    if (opts.length) E.foundPantheon(game, p, game.rng.pick(opts));
  };
  A.pickPromotion = function (game, u, opts) {
    var pref = ['shock1', 'drill1', 'accuracy1', 'barrage1', 'bombardment1', 'targeting1', 'cover1', 'shock2', 'drill2', 'accuracy2', 'range', 'logistics', 'march', 'blitz', 'shock3', 'drill3', 'charge', 'siege', 'medic', 'mobility'];
    for (var i = 0; i < pref.length; i++) if (opts.indexOf(pref[i]) >= 0) return pref[i];
    return opts.filter(function (o) { return o !== 'heal'; })[0] || opts[0];
  };
  A.captureChoice = function (game, p, c) {
    var o = game.players[c.owner];
    if (o.isCS) return 'puppet';
    if (c.originalCapital) return 'annex';
    if (c.pop <= 3 && (p.flavor && p.flavor.war > 7) && game.rng.chance(0.4)) return 'raze';
    return p.happy < 0 ? 'puppet' : (c.pop >= 6 ? 'annex' : 'puppet');
  };
  A.unVote = function (game, p, majors) {
    var best = p.id, bo = 25;
    majors.forEach(function (o) { if (o === p) return; var op = Dp.opinion(game, p, o); if (op > bo && (o.score || 0) > (p.score || 0)) { bo = op; best = o.id; } });
    return best;
  };

  // ===================== Gold & faith =====================
  function spendGold(game, p) {
    var myCities = cities(game, p);
    // bankruptcy management: disband the weakest non-garrison unit
    if (p.gold < 30 && (p.lastYields.gpt || 0) < 0) {
      var mils = units(game, p).filter(function (u) { return isMil(u) && !E.cityAt(game, u.tile); });
      mils.sort(function (a, b) { return (D.UNITS[a.type].cost) - (D.UNITS[b.type].cost); });
      if (mils.length > myCities.length) E.removeUnit(game, mils[0], 'disband');
    }
    // emergency defense
    myCities.forEach(function (c) {
      if (threatNear(game, p, c.tile, 3) >= 2 && !E.garrison(game, c) && c.build && c.build.kind === 'unit' && isMilitaryDef(D.UNITS[c.build.id])) {
        var cost = R.purchaseCost(game, p, c, 'unit', c.build.id);
        if (cost > 0 && p.gold >= cost) { p.gold -= cost; c.prod = E.itemCost(game, c, c.build); }
      }
    });
    // city-state gifts
    if (p.gold > 400 && game.rng.chance(0.25 + (p.flavor.gold || 5) * 0.02)) {
      var css = game.players.filter(function (q) { return q.isCS && q.alive && p.met[q.id] && !E.atWar(game, p.id, q.id); });
      css.sort(function (a, b) { return (b.csInfluence[p.id] || 0) - (a.csInfluence[p.id] || 0); });
      var tgt = css.filter(function (q) { return (q.csInfluence[p.id] || 0) < 75; })[0];
      if (tgt) E.giftGold(game, p, tgt, 250);
    }
    // buy buildings (happiness first when unhappy)
    var reserve = 120 + p.era * 40;
    var buyList = myCities.filter(function (c) { return c.build && (c.build.kind === 'building' || (c.build.kind === 'unit' && (c.build.id === 'worker' || c.build.id === 'settler' || c.build.id === 'work_boat'))); });
    buyList.sort(function (a, b) { var ha = D.BUILDINGS[a.build.id] && D.BUILDINGS[a.build.id].happy ? 1 : 0, hb = D.BUILDINGS[b.build.id] && D.BUILDINGS[b.build.id].happy ? 1 : 0; return hb - ha; });
    for (var bi = 0; bi < buyList.length && bi < 2; bi++) {
      var c = buyList[bi];
      var cost2 = R.purchaseCost(game, p, c, c.build.kind, c.build.id);
      if (cost2 > 0 && p.gold - cost2 > reserve) { p.gold -= cost2; c.prod = E.itemCost(game, c, c.build); }
    }
    // buy settlers/workers when rich
    if (p.gold > 500) {
      var c3 = myCities.filter(function (x) { return x.build && (x.build.id === 'worker' || x.build.id === 'settler'); })[0];
      if (c3) { var cc = R.purchaseCost(game, p, c3, 'unit', c3.build.id); if (cc > 0 && p.gold - cc > 100) { p.gold -= cc; c3.prod = E.itemCost(game, c3, c3.build); } }
    }
    // upgrade units
    if (p.gold > 200) units(game, p).forEach(function (u) { var info = U.canUpgrade(game, u); if (info && info.afford && p.gold - info.cost > 120 && u.moves > EPS) U.upgrade(game, u); });
  }
  function faithPurchases(game, p) {
    if (!p.religion) return;
    var cap = game.cities[p.capital];
    if (!cap || E.majorityReligion(cap) !== p.religion) return;
    var miss = units(game, p).filter(function (u) { return u.type === 'missionary'; }).length;
    if (miss < 2 && p.faith >= U.faithCost(game, p, 'missionary') + 50 && game.rng.chance(0.5)) U.faithBuy(game, p, cap, 'missionary');
  }

  // ===================== Diplomacy =====================
  function diplomacy(game, p) {
    var majors = game.players.filter(function (o) { return o !== p && o.alive && !o.isCS && !o.isBarb && p.met[o.id]; });
    var myPow = Dp.power(game, p);
    var fl = p.flavor || {};
    var ai = p.ai;
    // peace
    majors.forEach(function (o) {
      if (!E.atWar(game, p.id, o.id)) return;
      var r = E.rel(p, o.id);
      var dur = game.turn - (r.warSince || 0);
      var theirPow = Dp.power(game, o);
      if (o.isHuman) {
        if (dur > 12 && (myPow < theirPow * 0.9 || dur > 40) && !r.peaceOffered) { r.peaceOffered = game.turn; E.note(game, o, p.leader + ' of ' + p.name + ' is open to discussing peace.', null, 'diplo'); }
        return;
      }
      if (dur > 10 && (myPow < theirPow * 0.85 || dur > 30 + fl.war * 3) && game.rng.chance(0.3)) {
        var otherWants = Dp.evaluate(game, o, p, [{ kind: 'peace' }], []);
        if (otherWants > -50) Dp.makePeace(game, p, o);
      }
    });
    // city-state wars: make peace eventually
    game.players.forEach(function (cs) { if (cs.isCS && cs.alive && E.atWar(game, p.id, cs.id) && ai.warTarget !== cs.id && game.rng.chance(0.1)) Dp.makePeace(game, p, cs); });
    // declare war
    var interval = Math.max(5, Math.round(5 * R.speedCost(game)));
    var minTurn = Math.round(40 * R.speedCost(game));
    var atWarMajor = majors.some(function (o) { return E.atWar(game, p.id, o.id); });
    if (game.turn > minTurn && game.turn % interval === (p.id % interval) && !atWarMajor) {
      var cands = majors.filter(function (o) {
        var r = E.rel(p, o.id);
        if (r.peaceUntil > game.turn) return false;
        var close = cities(game, p).some(function (c) { return cities(game, o).some(function (c2) { return Hex.distance(c.tile, c2.tile) < 16 && game.map.area[c.tile] === game.map.area[c2.tile]; }); });
        return close;
      });
      cands.forEach(function (o) {
        var theirPow = Dp.power(game, o), op = Dp.opinion(game, p, o);
        var chance = (fl.war - 3) * 0.04 + (myPow > theirPow * 1.5 ? 0.12 : 0) - op / 200;
        if (myPow > theirPow * 1.25 && op < 15 && game.rng.chance(Math.max(0, chance))) {
          Dp.declareWar(game, p, o); ai.warTarget = o.id;
          if (o.isHuman) E.note(game, o, p.leader + ': "' + Dp.leaderLine(game, p, o, 'war') + '"', null, 'war');
        }
      });
    }
    // aggressive civs bully weak city-states occasionally
    if (fl.war >= 8 && !atWarMajor && game.turn > minTurn * 2 && game.rng.chance(0.01)) {
      var cs = game.players.filter(function (q) { return q.isCS && q.alive && p.met[q.id] && cities(game, p).some(function (c) { return q.cities.some(function (cc) { return game.cities[cc] && Hex.distance(game.cities[cc].tile, c.tile) < 10; }); }); })[0];
      if (cs && cs.ally !== p.id) { Dp.declareWar(game, p, cs); ai.warTarget = cs.id; }
    }
    // open borders with friends
    if (game.turn % 10 === p.id % 10) majors.forEach(function (o) {
      if (o.isHuman || E.atWar(game, p.id, o.id)) return;
      if (Dp.opinion(game, p, o) > 15 && Dp.opinion(game, o, p) > 15 && !(E.rel(p, o.id).openBorders > 0)) { E.rel(p, o.id).openBorders = 30; E.rel(o, p.id).openBorders = 30; }
    });
    // AI-AI luxury swaps
    if (game.turn % 15 === p.id % 15) majors.forEach(function (o) {
      if (o.isHuman || E.atWar(game, p.id, o.id) || Dp.opinion(game, p, o) < 0) return;
      var mine = E.resourceCounts(game, p).lux, theirs = E.resourceCounts(game, o).lux;
      var give = Object.keys(mine).filter(function (k) { return mine[k] > 1 && !theirs[k]; })[0];
      var get = Object.keys(theirs).filter(function (k) { return theirs[k] > 1 && !mine[k]; })[0];
      if (give && get) Dp.execute(game, p, o, [{ kind: 'lux', res: give }], [{ kind: 'lux', res: get }]);
    });
    // opinion drift toward 0
    majors.forEach(function (o) { var r = E.rel(p, o.id); if (r.opinion > 0) r.opinion -= 0.2; else if (r.opinion < 0) r.opinion += 0.3; });
  }

  return A;
})();
