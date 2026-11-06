// ============================================================
//  Core engine: game creation, players, cities, turn processing
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Engine = (function () {
  var D = G.D, IDS = G.IDS, Hex = G.Hex, R = G.Rules, MG = G.MapGen;
  var E = {};
  E.listeners = [];
  E.on = function (fn) { E.listeners.push(fn); };
  E.emit = function (ev) { for (var i = 0; i < E.listeners.length; i++) try { E.listeners[i](ev); } catch (e) { console.error(e); } };

  // ---------------- Game creation ----------------
  E.newGame = function (opts) {
    var seed = opts.seed || ((Math.random() * 1e9) | 0);
    var rng = new G.RNG(seed);
    var size = D.MAP_SIZES[opts.size || 'standard'];
    var game = {
      version: 1, seed: seed, turn: 0, speed: opts.speed || 'standard', size: opts.size || 'standard', mapType: opts.mapType || 'continents',
      difficulty: opts.difficulty || 'prince', players: [], cities: {}, units: {}, nextId: 1, wonders: {}, religions: {}, beliefsTaken: {},
      pantheonsTaken: {}, tradeRoutes: [], victory: null, un: null, manhattan: false, log: [], options: { barbarians: opts.barbarians !== false, ruins: opts.ruins !== false, victories: opts.victories || { domination: 1, science: 1, culture: 1, diplomatic: 1, time: 1 } },
      cityNamesUsed: {}, gpNamesUsed: {}, humanId: 0
    };
    game.rng = rng;
    game.map = MG.generate({ size: game.size, mapType: game.mapType }, rng);
    var numCivs = Math.max(2, Math.min(opts.numCivs || size.civs, 24));
    var numCS = Math.max(0, Math.min(opts.numCS != null ? opts.numCS : size.cs, D.CITY_STATES.length));
    var starts = MG.findStarts(game.map, rng, numCivs, Math.max(6, Math.floor(Math.sqrt(size.w * size.h / numCivs) * 0.75)));
    numCivs = starts.length;
    // choose civs
    var civIds = Object.keys(D.CIVS).filter(function (c) { return c !== opts.civ; });
    rng.shuffle(civIds);
    if (opts.aiCivs && opts.aiCivs.length) civIds = opts.aiCivs.concat(civIds.filter(function (c) { return opts.aiCivs.indexOf(c) < 0; }));
    var chosen = [opts.civ || civIds.pop()];
    while (chosen.length < numCivs) chosen.push(civIds.shift());
    for (var i = 0; i < numCivs; i++) {
      var p = makePlayer(game, { civ: chosen[i], isHuman: i === 0 && !opts.allAI });
      p.startTile = starts[i];
    }
    // City states
    var csStarts = MG.findStarts(game.map, rng, numCS, 7, starts);
    var usedNames = {};
    chosen.forEach(function (c) { D.CIVS[c].cities.forEach(function (n) { usedNames[n] = 1; }); });
    var csPool = rng.shuffle(D.CITY_STATES.filter(function (cs) { return !usedNames[cs[0]]; }));
    for (i = 0; i < csStarts.length && i < csPool.length; i++) {
      var cp = makePlayer(game, { isCS: true, csName: csPool[i][0], csType: csPool[i][1] });
      cp.startTile = csStarts[i];
    }
    makePlayer(game, { isBarb: true });
    balanceStarts(game, starts, rng);
    if (game.options.ruins) MG.placeRuins(game.map, rng, starts.concat(csStarts));
    // starting units
    game.players.forEach(function (p) {
      if (p.isBarb) return;
      R.computeMods(game, p);
      if (p.isCS) {
        foundCity(game, p, p.startTile, p.name);
        createUnit(game, p, 'warrior', p.startTile);
        return;
      }
      var t = p.startTile;
      createUnit(game, p, 'settler', t);
      var nb = Hex.neighbors(t).filter(function (z) { return MG.isLand(game.map, z) && game.map.terrain[z] !== IDS.terrain.map.mountain; });
      createUnit(game, p, R.civUnit(p, 'warrior'), nb[0] != null ? nb[0] : t);
      createUnit(game, p, 'scout', nb[1] != null ? nb[1] : t);
      var diff = D.DIFFICULTIES[game.difficulty];
      if (!p.isHuman && diff.aiBonus >= 15) createUnit(game, p, 'worker', nb[2] != null ? nb[2] : t);
      if (!p.isHuman && diff.aiBonus >= 40) createUnit(game, p, 'settler', nb[3] != null ? nb[3] : t);
      if (!p.isHuman && diff.aiBonus >= 25) createUnit(game, p, R.civUnit(p, 'warrior'), nb[4] != null ? nb[4] : t);
    });
    game.players.forEach(function (p) { updateVisibility(game, p); });
    game.turn = 0;
    startTurn(game, game.players[0]);
    return game;
  };

  // Civ V-style start balancing: guarantee luxuries, a strategic and some food near each start
  function balanceStarts(game, starts, rng) {
    var m = game.map, lux = [], strat = ['horses', 'iron'];
    for (var rk in D.RESOURCES) if (D.RESOURCES[rk].type === 'luxury') lux.push(rk);
    starts.forEach(function (st) {
      var near = Hex.within(st, 3).filter(function (t) { return t !== st; });
      function placeOne(cands, ring) {
        var tiles = rng.shuffle(near.filter(function (t) { return Hex.distance(st, t) <= ring && !m.res[t] && !m.nw[t]; }));
        for (var i = 0; i < tiles.length; i++) for (var k = 0; k < cands.length; k++) if (MG.resFits(m, tiles[i], cands[k])) { m.res[tiles[i]] = IDS.res.map[cands[k]]; var q = D.RESOURCES[cands[k]].qty; m.resQty[tiles[i]] = q ? q[0] + 2 : 1; return true; }
        return false;
      }
      var types = {};
      near.forEach(function (t) { if (m.res[t] && D.RESOURCES[R.resKey(m, t)].type === 'luxury') types[R.resKey(m, t)] = 1; });
      var guard = 0;
      while (Object.keys(types).length < 2 && guard++ < 6) {
        var cand = rng.shuffle(lux.filter(function (l) { return !types[l]; }));
        for (var c = 0; c < cand.length; c++) { if (placeOne([cand[c]], 3)) { types[cand[c]] = 1; placeOne([cand[c]], 3); break; } }
      }
      if (!near.some(function (t) { return m.res[t] && strat.indexOf(R.resKey(m, t)) >= 0; })) placeOne(rng.shuffle(strat.slice()), 3);
      var food = near.filter(function (t) { return m.res[t] && D.RESOURCES[R.resKey(m, t)].type === 'bonus'; }).length;
      for (var f = food; f < 2; f++) placeOne(['wheat', 'cattle', 'sheep', 'deer', 'bananas', 'fish'], 2);
    });
  }

  function makePlayer(game, o) {
    var id = game.players.length;
    var n = game.map.W * game.map.H;
    var p = {
      id: id, civ: o.civ || null, isHuman: !!o.isHuman, isCS: !!o.isCS, isBarb: !!o.isBarb, alive: true,
      gold: 0, culture: 0, totalCulture: 0, faith: 0, techs: {}, techProgress: {}, researching: null, freeScience: 0,
      policies: {}, trees: {}, numPolicies: 0, freePolicies: 0, gaProgress: 0, gaTurns: 0, gaCount: 0, gpProgress: {}, gpCount: {},
      pantheon: null, religion: null, prophets: 0, cities: [], units: [], capital: -1, met: {}, relations: {}, csInfluence: {},
      tourismTo: {}, notes: [], mods: {}, wonders: [], space: {}, futureTechs: 0, era: 0, tradeCap: 0, ai: {}, score: 0,
      explored: new Uint8Array(n), visible: new Uint8Array(n), stats: { kills: 0, losses: 0 }, cityNameIdx: 0, greatWorks: 0, lastYields: {}
    };
    if (p.isCS) {
      p.name = o.csName; p.csType = o.csType; p.leader = 'City-State'; p.adj = o.csName;
      var ct = D.CS_TYPES[o.csType]; p.color = ct.color; p.color2 = '#222';
      p.techs.agriculture = true;
    } else if (p.isBarb) {
      p.name = 'Barbarians'; p.leader = 'Barbarian Chief'; p.adj = 'Barbarian'; p.color = '#3a2a1a'; p.color2 = '#d03030';
    } else {
      var civ = D.CIVS[p.civ];
      p.name = civ.name; p.leader = civ.leader; p.adj = civ.adj; p.color = civ.col[0]; p.color2 = civ.col[1];
      p.techs.agriculture = true;
      // AI personality ("flavors") from trait
      var fx = civ.trait.fx || {}, fl = { war: 5, expand: 6, science: 5, culture: 5, wonder: 5, gold: 5, religion: 4, naval: 4 };
      if (fx.combatPct || fx.vsCityPct || fx.meleePct || fx.xpPct || fx.mountedPct || fx.unitMaintPct) fl.war += 3;
      if (fx.sciPct || fx.scientistGPPct || fx.specialistSci) fl.science += 3;
      if (fx.cultureCity || fx.cityCulture || fx.tourismPct || fx.culturePct) fl.culture += 3;
      if (fx.wonderPct) fl.wonder += 4;
      if (fx.goldPct || fx.tradeGold || fx.tradeRoutes) fl.gold += 3;
      if (fx.faithPct || fx.cityFaith) fl.religion += 3;
      if (fx.navalMoves || fx.embarkMoves || fx.seaProd || fx.coastalGold) fl.naval += 3;
      if (['Genghis Khan', 'Shaka', 'Attila', 'Alexander the Great', 'Napoleon I', 'Ashurbanipal', 'Hannibal Barca', 'Leonidas I', 'Otto von Bismarck', 'Harald Hardrada', 'Montezuma I', 'Moctezuma I'].indexOf(civ.leader) >= 0) fl.war += 3;
      if (['Ashoka', 'Pericles', 'Sejong the Great', 'Wilfrid Laurier', 'Hiawatha'].indexOf(civ.leader) >= 0) fl.war -= 2;
      p.flavor = fl;
    }
    game.players.push(p);
    return p;
  }
  E.makePlayer = makePlayer;

  // ---------------- Helpers ----------------
  E.player = function (game, id) { return game.players[id]; };
  E.human = function (game) { return game.players[game.humanId]; };
  E.note = function (game, p, text, tile, kind) {
    if (!p || !p.isHuman) return;
    p.notes.push({ turn: game.turn, text: text, tile: tile, kind: kind || 'info' });
    if (p.notes.length > 200) p.notes.shift();
    E.emit({ type: 'note', player: p.id, text: text, tile: tile, kind: kind });
  };
  E.noteAll = function (game, text, tile, kind) { game.players.forEach(function (p) { if (p.isHuman) E.note(game, p, text, tile, kind); }); };
  function nextId(game) { return game.nextId++; }
  // Spatial index: tile -> units. Unit.tile is an accessor that keeps the index in sync.
  function uidx(game) {
    if (!game._uidx) Object.defineProperty(game, '_uidx', { value: {}, writable: true, enumerable: false, configurable: true });
    return game._uidx;
  }
  function idxAdd(game, u, t) { var ix = uidx(game); (ix[t] || (ix[t] = [])).push(u); }
  function idxDel(game, u, t) { var ix = uidx(game), a = ix[t]; if (!a) return; var k = a.indexOf(u); if (k >= 0) a.splice(k, 1); if (!a.length) delete ix[t]; }
  E.attachUnit = function (game, u) {
    var t0 = u.tile;
    delete u.tile;
    Object.defineProperty(u, '_t', { value: t0, writable: true, enumerable: false, configurable: true });
    Object.defineProperty(u, 'tile', {
      get: function () { return this._t; },
      set: function (v) { if (v === this._t) return; if (game.units[this.id] === this) { idxDel(game, this, this._t); idxAdd(game, this, v); } this._t = v; },
      enumerable: true, configurable: true
    });
    if (game.units[u.id] === u) idxAdd(game, u, t0);
  };
  E.rebuildIndex = function (game) {
    game._uidx = null; uidx(game);
    for (var id in game.units) { var u = game.units[id]; if (Object.getOwnPropertyDescriptor(u, '_t')) idxAdd(game, u, u.tile); else E.attachUnit(game, u); }
  };
  E.unitsAt = function (game, tile) {
    var a = uidx(game)[tile];
    return a ? a.slice() : [];
  };
  E.cityAt = function (game, tile) {
    if (tile == null || tile < 0) return null;
    var id = game.map.city[tile];
    if (id < 0) return null;
    var c = game.cities[id];
    return c && c.tile === tile ? c : null;
  };
  E.atWar = function (game, a, b) {
    if (a === b) return false;
    var pa = game.players[a], pb = game.players[b];
    if (pa.isBarb || pb.isBarb) return true;
    var r = pa.relations[b];
    return !!(r && r.war);
  };
  E.rel = function (p, oid) {
    if (!p.relations[oid]) p.relations[oid] = { war: false, peaceUntil: 0, openBorders: 0, opinion: 0, warSince: 0, denounced: 0, trades: [] };
    return p.relations[oid];
  };
  E.eraOf = function (p) {
    var e = 0;
    for (var t in p.techs) if (D.TECHS[t] && D.TECHS[t].era > e) e = D.TECHS[t].era;
    return e;
  };

  // ---------------- Units (creation only; movement in units.js) ----------------
  function createUnit(game, p, type, tile, opts) {
    var def = D.UNITS[type];
    if (!def) { console.warn('no unit', type); return null; }
    var u = { id: nextId(game), type: type, owner: p.id, tile: tile, hp: 100, moves: 0, xp: 0, promos: [], level: 0, fortify: 0, sleep: false,
      orders: null, build: null, attacks: 0, acted: false, name: null, spreads: def.spreads || 0, pendingPromo: 0 };
    if (def.gp) u.name = gpName(game, def.gp);
    if (def.domain === 'air') u.base = tile;
    game.units[u.id] = u;
    E.attachUnit(game, u);
    p.units.push(u.id);
    if (opts && opts.xp) u.xp = opts.xp;
    u.moves = 0;
    E.emit({ type: 'unitCreated', unit: u });
    return u;
  }
  E.createUnit = createUnit;
  function gpName(game, type) {
    var list = D.GP_NAMES[type] || ['Great Person'];
    var used = game.gpNamesUsed[type] || 0;
    game.gpNamesUsed[type] = used + 1;
    return list[used % list.length] + (used >= list.length ? ' ' + (Math.floor(used / list.length) + 1) : '');
  }
  E.removeUnit = function (game, u, reason) {
    if (!game.units[u.id]) return;
    idxDel(game, u, u.tile);
    delete game.units[u.id];
    var p = game.players[u.owner];
    var ix = p.units.indexOf(u.id); if (ix >= 0) p.units.splice(ix, 1);
    E.emit({ type: 'unitRemoved', unit: u, reason: reason });
  };

  // ---------------- Cities ----------------
  E.canFoundCity = function (game, p, tile) {
    var m = game.map;
    if (tile == null || tile < 0) return false;
    if (!MG.isLand(m, tile) || m.terrain[tile] === IDS.terrain.map.mountain || m.nw[tile]) return false;
    if (m.feature[tile] === IDS.feature.map.ice) return false;
    if (m.owner[tile] >= 0 && m.owner[tile] !== p.id) return false;
    for (var id in game.cities) if (Hex.distance(game.cities[id].tile, tile) < 3) return false;
    return true;
  };
  function cityName(game, p) {
    if (p.isCS) return p.name;
    var civ = D.CIVS[p.civ], list = civ.cities;
    while (p.cityNameIdx < list.length) {
      var nm = list[p.cityNameIdx++];
      if (!game.cityNamesUsed[nm]) return nm;
    }
    var k = 2; while (game.cityNamesUsed['New ' + list[k % list.length] + (k > list.length ? ' ' + k : '')]) k++;
    return 'New ' + list[k % list.length] + (k > list.length ? ' ' + k : '');
  }
  function foundCity(game, p, tile, name) {
    var m = game.map;
    var nm = name || cityName(game, p);
    game.cityNamesUsed[nm] = 1;
    var c = { id: nextId(game), name: nm, owner: p.id, original: p.id, tile: tile, pop: 1, food: 0, prod: 0, build: null, queue: [],
      buildings: {}, wonders: [], worked: [], specialists: {}, focus: 'default', culture: 0, cultureLevel: 0, tilesBought: 0, hp: 200, attacked: 0,
      founded: game.turn, capital: false, puppet: false, occupied: false, razing: false, resist: 0, followers: {}, pressure: {}, greatWorks: [],
      locked: {}, manual: false, rangedUsed: false, overflow: 0, lastYields: null, isCS: p.isCS };
    game.cities[c.id] = c;
    p.cities.push(c.id);
    if (p.capital < 0 || !game.cities[p.capital]) {
      p.capital = c.id; c.capital = true; c.buildings.palace = 1; c.originalCapital = true; c.origCapOf = p.id;
    }
    // clear feature on city tile
    var fk = R.featureKey(m, tile);
    if (fk === 'forest' || fk === 'jungle' || fk === 'marsh') m.feature[tile] = 0;
    m.imp[tile] = 0; m.hut[tile] = 0;
    m.road[tile] = Math.max(m.road[tile], 1);
    claimTile(game, p, c, tile);
    Hex.within(tile, 1).forEach(function (t) { if (m.owner[t] < 0 || m.owner[t] === p.id && m.city[t] < 0) claimTile(game, p, c, t); });
    if (p.isCS) Hex.within(tile, 2).forEach(function (t) { if (m.owner[t] < 0) claimTile(game, p, c, t); });
    c.hp = cityMaxHp(game, c);
    assignCitizens(game, c);
    updateVisibility(game, p);
    E.emit({ type: 'cityFounded', city: c });
    if (!p.isCS) E.noteAll(game, p.isHuman ? 'You founded ' + nm + '.' : '', null);
    return c;
  }
  E.foundCity = foundCity;
  function claimTile(game, p, c, t) {
    var m = game.map;
    m.owner[t] = p.id; m.city[t] = c.id;
    if (p._ownedCache && p._ownedCache.indexOf(t) < 0) p._ownedCache.push(t); // v2: keep light-visibility cache current (e.g. tile purchases)
    if (m.hut[t]) { /* ruins inside borders remain until entered */ }
    // barbarian camp inside borders is removed
    if (R.impKey(m, t) === 'barb_camp') m.imp[t] = 0;
  }
  E.claimTile = claimTile;
  function cityMaxHp(game, c) {
    var hp = 200;
    for (var b in c.buildings) { var d = D.BUILDINGS[b]; if (d && d.hp) hp += d.hp; }
    return hp;
  }
  E.cityMaxHp = cityMaxHp;

  E.cityTiles = function (game, c) {
    // tiles this city may work: within 3, owned by this city
    var out = [];
    var tiles = Hex.within(c.tile, 3);
    for (var i = 0; i < tiles.length; i++) { var t = tiles[i]; if (game.map.city[t] === c.id) out.push(t); }
    return out;
  };

  function tileScore(y, focus, needFood) {
    var f = y.f || 0, pr = y.p || 0, g = y.g || 0, s = y.s || 0, cu = y.c || 0, fa = y.fa || 0;
    var w = { f: 1.35, p: 1.45, g: 0.8, s: 0.9, c: 0.8, fa: 0.6 };
    if (focus === 'food') w.f = 3;
    if (focus === 'production') w.p = 3;
    if (focus === 'gold') w.g = 3;
    if (focus === 'science') w.s = 3;
    if (focus === 'culture') w.c = 3;
    if (focus === 'faith') w.fa = 3;
    if (needFood) w.f += 1.5;
    return f * w.f + pr * w.p + g * w.g + s * w.s + cu * w.c + fa * w.fa;
  }
  function specialistSlots(c) {
    var slots = {};
    for (var b in c.buildings) { var d = D.BUILDINGS[b]; if (d && d.slots) for (var k in d.slots) slots[k] = (slots[k] || 0) + d.slots[k]; }
    return slots;
  }
  E.specialistSlots = specialistSlots;

  function assignCitizens(game, c) {
    var p = game.players[c.owner], m = game.map;
    var tiles = E.cityTiles(game, c).filter(function (t) {
      if (t === c.tile) return false;
      // not worked by another city
      for (var id in game.cities) { var oc = game.cities[id]; if (oc !== c && oc.worked.indexOf(t) >= 0) return false; }
      return !enemyOn(game, p, t);
    });
    var focus = c.focus || 'default';
    var keepLocked = (c.worked || []).filter(function (t) { return c.locked[t] && tiles.indexOf(t) >= 0; });
    var scored = tiles.map(function (t) { return { t: t, y: R.tileYield(game, t, p, c) }; });
    var worked = keepLocked.slice(), food = 0;
    var center = R.tileYield(game, c.tile, p, c);
    food += Math.max(2, center.f || 0);
    worked.forEach(function (t) { food += R.tileYield(game, t, p, c).f || 0; });
    var specs = {};
    var slots = specialistSlots(c);
    var manualSpecs = c.manualSpecs || {};
    var nSpec = 0;
    for (var k in manualSpecs) { var take = Math.min(manualSpecs[k], slots[k] || 0); if (take > 0) { specs[k] = take; nSpec += take; } }
    var remaining = c.pop - worked.length - nSpec;
    while (remaining > 0) {
      var needFood = food - 2 * (c.pop) < 1 && focus !== 'production';
      var best = null, bestS = -1;
      for (var i = 0; i < scored.length; i++) {
        if (worked.indexOf(scored[i].t) >= 0) continue;
        var s = tileScore(scored[i].y, focus, needFood);
        if (s > bestS) { bestS = s; best = scored[i]; }
      }
      // specialist alternative
      var specBest = null, specScore = -1;
      for (var sk in slots) {
        if ((specs[sk] || 0) >= slots[sk]) continue;
        var ss = tileScore(D.SPECIALISTS[sk].y, focus, needFood) + 1.5; // GPP value
        if (ss > specScore) { specScore = ss; specBest = sk; }
      }
      if (best && (bestS >= specScore || !specBest || needFood)) { worked.push(best.t); food += best.y.f || 0; }
      else if (specBest) { specs[specBest] = (specs[specBest] || 0) + 1; }
      else { specs.citizen = (specs.citizen || 0) + 1; }
      remaining--;
    }
    c.worked = worked;
    c.specialists = specs;
  }
  E.assignCitizens = assignCitizens;
  function enemyOn(game, p, t) {
    var a = uidx(game)[t]; if (!a) return false;
    for (var i = 0; i < a.length; i++) { var u = a[i]; if (u.owner !== p.id && E.atWar(game, p.id, u.owner) && D.UNITS[u.type].cls !== 'civilian') return true; }
    return false;
  }

  // Full city yield computation
  E.cityYields = function (game, c) {
    var p = game.players[c.owner], m = game.map, mods = p.mods;
    var y = { f: 0, p: 0, g: 0, s: 0, c: 0, fa: 0, t: 0 };
    var center = R.tileYield(game, c.tile, p, c);
    center.f = Math.max(2, center.f || 0); center.p = Math.max(1, center.p || 0);
    R.addY(y, center);
    c.worked.forEach(function (t) { R.addY(y, R.tileYield(game, t, p, c)); });
    // specialists
    var nSpec = 0;
    for (var sk in c.specialists) {
      var n = c.specialists[sk]; nSpec += n;
      if (sk === 'citizen') { y.p += n; continue; }
      var sy = D.SPECIALISTS[sk].y;
      R.addY(y, sy, n * (1 + (mods.specialistPct || 0) / 100));
      if (mods.specialistSci) y.s += mods.specialistSci * n;
      if (mods.specialistProd) y.p += mods.specialistProd * n;
    }
    // buildings
    var pct = { f: 0, p: 0, g: 0, s: 0, c: 0, fa: 0 };
    var happyLocal = 0;
    for (var b in c.buildings) {
      var d = D.BUILDINGS[b]; if (!d) continue;
      if (d.y) R.addY(y, d.y);
      if (d.perPop) R.addY(y, d.perPop, c.pop);
      if (d.pct) R.addY(pct, d.pct);
      if (d.needRes && d.resY) { /* resource yields per tile handled in tileYield */ }
    }
    c.wonders.forEach(function (w) { var wd = D.WONDERS[w]; if (wd.local && wd.local.y) R.addY(y, wd.local.y); });
    // great works
    y.c += 2 * c.greatWorks.length;
    // Civ V: each citizen produces 1 science
    y.s += c.pop;
    // player-wide flat per-city bonuses
    y.c += (mods.cityCulture || 0); y.p += (mods.cityProd || 0); y.fa += (mods.cityFaith || 0); y.s += (mods.citySci || 0);
    if (c.pop >= 3 && mods.cityProd3) y.p += mods.cityProd3;
    if (c.capital) { y.c += mods.capCulture || 0; y.f += mods.capFood || 0; if (mods.capGoldPer2) y.g += Math.floor(c.pop / 2); }
    if (isCoastal(game, c.tile) && mods.coastalGold) y.g += mods.coastalGold;
    if (mods.harborGold && R.hasBuilding(c, 'harbor')) y.g += mods.harborGold;
    if (mods.templeGold && R.hasBuilding(c, 'temple')) y.g += mods.templeGold;
    if (mods.shrineCulture && R.hasBuilding(c, 'shrine')) y.c += mods.shrineCulture;
    if (mods.castleGold && R.hasBuilding(c, 'castle')) y.g += mods.castleGold;
    var garrison = E.garrison(game, c);
    if (garrison) { y.c += mods.garrisonCulture || 0; y.s += mods.garrisonSci || 0; }
    // religion follower beliefs
    var maj = E.majorityReligion(c);
    if (maj && game.religions[maj]) {
      game.religions[maj].follower.forEach(function (bid) {
        var bf = D.BELIEFS.follower[bid].fx;
        if (bf.followerY) R.addY(y, bf.followerY);
        if (bf.followerProdPct) pct.p += Math.min(15, (c.followers[maj] || 0) * bf.followerProdPct);
        if (bf.followerFoodPct) pct.f += bf.followerFoodPct;
      });
    }
    // trade routes (domestic deliveries)
    game.tradeRoutes.forEach(function (tr) {
      if (tr.to === c.id && tr.domestic) { y.f += tr.food || 0; y.p += tr.prod || 0; }
      if (tr.from === c.id && !tr.domestic) { y.g += tr.goldFrom || 0; y.s += tr.sciFrom || 0; }
      if (tr.to === c.id && !tr.domestic) { y.g += tr.goldTo || 0; y.s += tr.sciTo || 0; }
    });
    // City connection gold (to capital): Civ V gives gold per connected city
    if (!c.capital && c.connected) y.g += Math.max(1, Math.floor(c.pop * 1.0)) * (1 + (mods.connectGoldPct || 0) / 100) * 0.5 + 1;
    // railroad production bonus
    if (c.railConnected) pct.p += 25;
    // percentages
    pct.f += mods.foodPct || 0; pct.p += mods.prodPct || 0; pct.g += mods.goldPct || 0; pct.s += mods.sciPct || 0; pct.c += mods.culturePct || 0; pct.fa += mods.faithPct || 0;
    if (c.capital) { pct.g += mods.capGoldPct || 0; pct.s += mods.capSciPct || 0; }
    if (p.happy >= 0 && mods.sciPctHappy) pct.s += mods.sciPctHappy;
    if (mods.riverFoodPct && m.river[c.tile]) pct.f += mods.riverFoodPct;
    if (mods.cultureDomestic && c.wonders.indexOf('alhambra') >= 0) pct.c += mods.cultureDomestic;
    if (p.gaTurns > 0) { pct.c += 20; }
    // city-state food bonus to ally
    var csb = p.csBonus || {};
    if (csb.food) { y.f += csb.food * (c.capital ? 1 : 0.25); }
    // AI handicap
    // unhappiness affects
    var foodBefore = y.f;
    var specFood = 2 * c.pop;
    if (mods.specialistFoodHalf) specFood -= nSpec;
    var surplus = foodBefore - specFood;
    if (surplus > 0) surplus = surplus * (1 + pct.f / 100);
    y.surplus = surplus;
    y.p = y.p * (1 + pct.p / 100);
    y.g = y.g * (1 + pct.g / 100);
    y.s = y.s * (1 + pct.s / 100);
    y.c = y.c * (1 + pct.c / 100);
    y.fa = y.fa * (1 + pct.fa / 100);
    if (c.puppet) { y.s *= 0.75; y.c *= 0.75; }
    if (c.resist > 0) { y.p = 0; y.g = 0; y.s = 0; y.c = 0; y.surplus = Math.min(0, y.surplus); }
    // tourism
    var tour = c.greatWorks.length * 2 + c.wonders.length * 1;
    var tpct = mods.tourismPct || 0;
    for (b in c.buildings) { var bd = D.BUILDINGS[b]; if (bd && bd.tourismPct) tpct += bd.tourismPct; }
    y.t = tour * (1 + tpct / 100);
    y.pct = pct;
    for (var k in y) if (typeof y[k] === 'number') y[k] = Math.round(y[k] * 10) / 10;
    return y;
  };
  function isCoastal(game, tile) {
    var nb = Hex.neighbors(tile);
    for (var i = 0; i < nb.length; i++) { var tk = R.terrainKey(game.map, nb[i]); if (tk === 'coast' || tk === 'ocean') return true; }
    return false;
  }
  E.isCoastal = isCoastal;
  E.garrison = function (game, c) {
    var a = uidx(game)[c.tile]; if (!a) return null;
    for (var i = 0; i < a.length; i++) { var u = a[i]; if (u.owner === c.owner) { var d = D.UNITS[u.type]; if (d.cls !== 'civilian' && d.cls !== 'gp' && d.domain === 'land') return u; } }
    return null;
  };

  // City combat strength (Civ V-like)
  E.cityStrength = function (game, c) {
    var p = game.players[c.owner];
    var s = 8 + c.pop * 0.5;
    for (var b in c.buildings) { var d = D.BUILDINGS[b]; if (d && d.def) s += d.def; }
    c.wonders.forEach(function (w) { var wd = D.WONDERS[w]; if (wd.local && wd.local.def) s += wd.local.def; });
    // best available melee unit strength (tech scaling)
    var best = 8;
    for (var u in D.UNITS) { var ud = D.UNITS[u]; if (ud.str && !ud.unique && (ud.cls === 'melee' || ud.cls === 'gun') && R.hasTech(p, ud.tech)) best = Math.max(best, ud.str); }
    s += best * 0.35;
    var g = E.garrison(game, c);
    if (g) s += (D.UNITS[g.type].str || 0) * 0.2;
    if (game.map.hills[c.tile]) s *= 1.25;
    s *= 1 + (p.mods.cityDefPct || 0) / 100;
    if (p.isCS) s *= 1.15;
    return Math.round(s * 10) / 10;
  };

  // ---------------- Production options ----------------
  E.canBuild = function (game, c, kind, id) {
    var p = game.players[c.owner], m = game.map;
    if (kind === 'unit') {
      var d = D.UNITS[id];
      if (!d || d.cls === 'gp' || d.faithCost) return false;
      if (d.unique && d.unique !== p.civ) return false;
      if (!d.unique && R.civUnit(p, id) !== id) return false;
      if (d.tech && !p.techs[d.tech]) return false;
      if (d.res && E.resourceAvail(game, p, d.res) < 1) return false;
      if (d.domain === 'sea' && !isCoastal(game, c.tile)) return false;
      if (d.nuke && !game.manhattan) return false;
      // obsolete: if upgrade target is buildable, hide old unit
      if (d.upg) { var up = R.civUnit(p, d.upg); var ud = D.UNITS[up]; if (ud && (!ud.tech || p.techs[ud.tech]) && (!ud.res || E.resourceAvail(game, p, ud.res) >= 1)) return false; }
      if (id === 'settler' && (p.isCS || c.pop < 2)) return false;
      if (id === 'settler' && p.happy <= -10) return false;
      if ((id === 'caravan' || id === 'cargo_ship') && E.tradeRoutesUsed(game, p) >= E.tradeCap(game, p)) return false;
      if (p.isCS && (d.cls === 'civilian' && id !== 'worker')) return false;
      return true;
    }
    if (kind === 'building') {
      var b = D.BUILDINGS[id];
      if (!b || b.hidden) return false;
      if (b.unique && b.unique !== p.civ) return false;
      if (!b.unique && R.civBuilding(p, id) !== id) return false;
      var base = b.replaces || id;
      if (R.hasBuilding(c, base)) return false;
      if (b.tech && !p.techs[b.tech]) return false;
      if (b.req && !R.hasBuilding(c, b.req)) return false;
      if (b.coastal && !isCoastal(game, c.tile)) return false;
      if (b.river && !m.river[c.tile] && !R.freshWater(m, c.tile)) return false;
      if (b.mountain && !Hex.neighbors(c.tile).some(function (t) { return m.terrain[t] === IDS.terrain.map.mountain; })) return false;
      if (b.desert && !Hex.within(c.tile, 3).some(function (t) { return m.city[t] === c.id && R.terrainKey(m, t) === 'desert'; })) return false;
      if (b.res && E.resourceAvail(game, p, b.res) < 1) return false;
      if (b.needRes && !Hex.within(c.tile, 3).some(function (t) { return m.city[t] === c.id && m.res[t] && b.needRes.indexOf(R.resKey(m, t)) >= 0; })) return false;
      if (b.national) {
        if (p.isCS) return false;
        for (var i = 0; i < p.cities.length; i++) { var oc = game.cities[p.cities[i]]; if (oc && oc.buildings[id]) return false; }
        if (b.needAll) { for (i = 0; i < p.cities.length; i++) { oc = game.cities[p.cities[i]]; if (oc && !oc.puppet && !R.hasBuilding(oc, b.needAll)) return false; } }
      }
      if (c.puppet && b.national) return false;
      return true;
    }
    if (kind === 'wonder') {
      var w = D.WONDERS[id];
      if (!w || p.isCS || c.puppet) return false;
      if (game.wonders[id] != null) return false;
      if (w.tech && !p.techs[w.tech]) return false;
      if (w.coastal && !isCoastal(game, c.tile)) return false;
      if (w.mountainNear && !Hex.within(c.tile, 2).some(function (t) { return m.terrain[t] === IDS.terrain.map.mountain; })) return false;
      if (w.needTrees) { var done = 0; for (var tr in p.trees) if (p.trees[tr] === 'done') done++; if (done < w.needTrees) return false; }
      if (w.project && id !== 'manhattan_project' && id !== 'apollo_program' && id !== 'utopia_project') return false;
      if (id === 'utopia_project' && !game.options.victories.culture) return false;
      // another city of ours already building it
      for (i = 0; i < p.cities.length; i++) { oc = game.cities[p.cities[i]]; if (oc && oc !== c && oc.build && oc.build.kind === 'wonder' && oc.build.id === id) return false; }
      return true;
    }
    if (kind === 'space') {
      var sp = D.SPACESHIP[id];
      if (!game.options.victories.science) return false;
      if (!c.capital || !p.apollo || !p.techs[sp.tech]) return false;
      if ((p.space[id] || 0) >= sp.need) return false;
      return true;
    }
    if (kind === 'process') return id === 'wealth' ? !!p.techs.currency : id === 'research' ? !!p.techs.education : false;
    return false;
  };
  E.buildOptions = function (game, c) {
    var out = [];
    for (var u in D.UNITS) if (E.canBuild(game, c, 'unit', u)) out.push({ kind: 'unit', id: u });
    for (var b in D.BUILDINGS) if (E.canBuild(game, c, 'building', b)) out.push({ kind: 'building', id: b });
    for (var w in D.WONDERS) if (E.canBuild(game, c, 'wonder', w)) out.push({ kind: 'wonder', id: w });
    for (var s in D.SPACESHIP) if (E.canBuild(game, c, 'space', s)) out.push({ kind: 'space', id: s });
    ['wealth', 'research'].forEach(function (pr) { if (E.canBuild(game, c, 'process', pr)) out.push({ kind: 'process', id: pr }); });
    return out;
  };
  function itemKey(it) { return it ? it.kind + ':' + it.id : ''; }
  E.setBuild = function (game, c, item) {
    if (c.build && item && c.build.kind === item.kind && c.build.id === item.id) return;
    // Civ V keeps partial progress per item; the first item chosen inherits unassigned production
    c.progress = c.progress || {};
    if (c.build && c.build.kind !== 'process') { if (c.prod > 0) c.progress[itemKey(c.build)] = c.prod; c.prod = 0; }
    if (item && item.kind !== 'process') { c.prod = (c.prod || 0) + (c.progress[itemKey(item)] || 0); delete c.progress[itemKey(item)]; }
    c.build = item;
    E.emit({ type: 'cityChanged', city: c });
  };
  E.itemName = function (item) {
    if (!item) return 'Nothing';
    if (item.kind === 'unit') return D.UNITS[item.id].name;
    if (item.kind === 'building') return D.BUILDINGS[item.id].name;
    if (item.kind === 'wonder') return D.WONDERS[item.id].name;
    if (item.kind === 'space') return D.SPACESHIP[item.id].name;
    if (item.kind === 'process') return item.id === 'wealth' ? 'Wealth' : 'Research';
    return '?';
  };
  E.itemCost = function (game, c, item) {
    if (!item || item.kind === 'process') return 0;
    var p = game.players[c.owner];
    var cost = R.productionCost(game, p, item.kind, item.id);
    return cost;
  };
  function prodModifier(game, p, c, item) {
    var mods = p.mods, pct = 0;
    if (item.kind === 'wonder') {
      pct += mods.wonderPct || 0;
      // marble
      if (Hex.within(c.tile, 3).some(function (t) { return game.map.city[t] === c.id && R.resKey(game.map, t) === 'marble' && game.map.imp[t]; })) pct += 15;
    }
    if (item.kind === 'building') {
      pct += mods.buildingPct || 0;
      var bid = R.baseBuilding(item.id);
      if (mods.shrineFast && (bid === 'shrine' || bid === 'temple')) pct += 100;
      if (mods.cultureBuildFast && (bid === 'amphitheater' || bid === 'opera_house' || bid === 'museum' || bid === 'broadcast_tower' || bid === 'monument')) pct += 100;
    }
    if (item.kind === 'unit') {
      var ud = D.UNITS[item.id];
      if (ud.cls !== 'civilian' && ud.cls !== 'gp') pct += mods.unitProdPct || 0;
      if (ud.cls === 'melee' || ud.cls === 'gun') pct += mods.meleeProdPct || 0;
      if (ud.cls === 'ranged') pct += mods.rangedProdPct || 0;
      if (item.id === 'settler' && c.capital) pct += mods.settlerPct || 0;
      for (var b in c.buildings) {
        var bd = D.BUILDINGS[b];
        if (bd && bd.unitPct) {
          if (bd.unitPct.mounted && ud.cls === 'mounted') pct += bd.unitPct.mounted;
          if (bd.unitPct.land && ud.domain === 'land' && ud.cls !== 'civilian') pct += bd.unitPct.land;
          if (bd.unitPct.sea && ud.domain === 'sea') pct += bd.unitPct.sea;
        }
      }
    }
    if (item.kind === 'space') { for (b in c.buildings) { bd = D.BUILDINGS[b]; if (bd && bd.spacePct) pct += bd.spacePct; } }
    return pct;
  }
  E.prodTowards = function (game, c, y) {
    var p = game.players[c.owner];
    if (!c.build) return y.p;
    var pt = y.p * (1 + prodModifier(game, p, c, c.build) / 100);
    if (c.build.kind === 'unit' && c.build.id === 'settler' && y.surplus > 0) pt += y.surplus;
    return pt;
  };

  // ---------------- Resources ----------------
  E.resourceCounts = function (game, p) {
    var m = game.map, counts = {}, lux = {};
    p.cities.forEach(function (cid) {
      var c = game.cities[cid]; if (!c) return;
      Hex.within(c.tile, 5).forEach(function (t) {
        if (m.city[t] !== c.id || !m.res[t]) return;
        var rk = R.resKey(m, t), rd = D.RESOURCES[rk];
        if (!R.resVisible(p, rk)) return;
        var improved = (R.impKey(m, t) === rd.imp && !m.pillaged[t]) || t === c.tile;
        if (!improved) return;
        if (rd.type === 'strategic') counts[rk] = (counts[rk] || 0) + m.resQty[t] * (p.mods.strategicDouble ? 2 : 1);
        if (rd.type === 'luxury') lux[rk] = (lux[rk] || 0) + 1;
      });
    });
    // city-state allies
    game.players.forEach(function (cs) {
      if (!cs.isCS || !cs.alive || cs.ally !== p.id) return;
      var rc = E.resourceCounts(game, cs);
      for (var k in rc.counts) counts[k] = (counts[k] || 0) + rc.counts[k];
      for (k in rc.lux) lux[k] = (lux[k] || 0) + rc.lux[k];
    });
    // trades
    (p.imports || []).forEach(function (im) { if (im.turns > 0) { if (D.RESOURCES[im.res].type === 'luxury') lux[im.res] = (lux[im.res] || 0) + 1; else counts[im.res] = (counts[im.res] || 0) + im.qty; } });
    (p.exports || []).forEach(function (ex) { if (ex.turns > 0) { if (D.RESOURCES[ex.res].type === 'luxury') lux[ex.res] = (lux[ex.res] || 0) - 1; else counts[ex.res] = (counts[ex.res] || 0) - ex.qty; } });
    for (var k in lux) if (lux[k] <= 0) delete lux[k];
    return { counts: counts, lux: lux };
  };
  E.resourceUsed = function (game, p, rk) {
    var used = 0;
    p.units.forEach(function (uid) { var u = game.units[uid]; if (u && D.UNITS[u.type].res === rk) used++; });
    p.cities.forEach(function (cid) { var c = game.cities[cid]; if (!c) return; for (var b in c.buildings) { var bd = D.BUILDINGS[b]; if (bd && bd.res === rk) used++; } });
    return used;
  };
  E.resourceAvail = function (game, p, rk) {
    if (!p._resCache || p._resCache.turn !== game.turn || p._resCache.dirty) p._resCache = { turn: game.turn, data: E.resourceCounts(game, p) };
    return (p._resCache.data.counts[rk] || 0) - E.resourceUsed(game, p, rk);
  };
  E.dirtyRes = function (p) { if (p._resCache) p._resCache.dirty = true; };

  // ---------------- Happiness ----------------
  E.happiness = function (game, p) {
    if (p.isCS || p.isBarb) return { net: 10, happy: 10, unhappy: 0, lines: [] };
    var mods = p.mods, lines = [], happy = 0, unhappy = 0;
    var diff = D.DIFFICULTIES[game.difficulty];
    var base = p.isHuman ? diff.playerHappy : 9 + Math.max(0, diff.aiBonus / 10);
    happy += base; lines.push(['Base (difficulty)', base]);
    var res = E.resourceCounts(game, p); p._resCache = { turn: game.turn, data: res };
    var nl = Object.keys(res.lux).length;
    var lh = nl * (4 + (mods.luxuryHappy || 0));
    happy += lh; if (lh) lines.push(['Luxuries (' + nl + ')', lh]);
    var bh = 0, cities = 0, unCity = 0, unPop = 0, garrisonH = 0, popTotal = 0;
    p.cities.forEach(function (cid) {
      var c = game.cities[cid]; if (!c) return;
      cities++; popTotal += c.pop;
      var local = 0;
      for (var b in c.buildings) {
        var d = D.BUILDINGS[b]; if (!d) continue;
        if (d.happy) local += d.happy;
        var bb = R.baseBuilding(b);
        if (mods.monumentHappy && bb === 'monument') local += mods.monumentHappy;
        if (mods.harborHappy && (bb === 'harbor' || bb === 'seaport')) local += mods.harborHappy;
        if (mods.universityHappy && (bb === 'university' || bb === 'observatory')) local += mods.universityHappy;
        if (mods.militaryBuildingHappy && (bb === 'barracks' || bb === 'armory' || bb === 'military_academy')) local += mods.militaryBuildingHappy;
      }
      if (mods.cityHappy) local += mods.cityHappy;
      if (E.garrison(game, c) && mods.garrisonHappy) garrisonH += mods.garrisonHappy;
      var maj = E.majorityReligion(c);
      if (maj && game.religions[maj]) game.religions[maj].follower.forEach(function (bid) { local += D.BELIEFS.follower[bid].fx.followerHappy || 0; });
      local = Math.min(local, c.pop); // Civ V BNW: local happiness can't exceed population
      bh += local;
      // unhappiness
      var cu = c.puppet ? 1 : (c.occupied && !R.hasBuilding(c, 'courthouse')) ? 5 : 3;
      var pu = c.pop * ((c.occupied && !R.hasBuilding(c, 'courthouse') && !c.puppet) ? 1.34 : 1);
      if (c.puppet) pu = c.pop * 0.5;
      if (c.capital && mods.capUnhappyHalf) pu -= Math.floor(c.pop / 2);
      unCity += cu; unPop += pu;
    });
    happy += bh; if (bh) lines.push(['Buildings', bh]);
    if (garrisonH) { happy += garrisonH; lines.push(['Garrisons', garrisonH]); }
    var wh = 0;
    p.wonders.forEach(function (w) { wh += D.WONDERS[w].happy || 0; });
    wh += mods.happyFlat || 0;
    if (mods.happyPerCity) wh += Math.floor(cities * mods.happyPerCity);
    if (mods.happyPer10Pop) wh += Math.floor(popTotal / 10) * mods.happyPer10Pop;
    if (mods.happyPerConnected) wh += Math.max(0, cities - 1) * mods.happyPerConnected;
    if (mods.followerCityHappy && p.religion) wh += E.religionCities(game, p.religion).length * mods.followerCityHappy;
    if (wh) { happy += wh; lines.push(['Wonders & policies', wh]); }
    var csh = (p.csBonus && p.csBonus.happy) || 0;
    if (csh) { happy += csh; lines.push(['City-States', csh]); }
    // natural wonders owned
    var nwh = 0;
    for (var t = 0; t < game.map.nw.length; t++) if (game.map.nw[t] && game.map.owner[t] === p.id) nwh += D.NATURAL_WONDERS[IDS.nw.list[game.map.nw[t]]].happy || 0;
    if (nwh) { happy += nwh; lines.push(['Natural wonders', nwh]); }
    unPop *= 1 + (mods.unhappyPerPopPct || 0) / 100;
    unhappy = unCity + unPop;
    lines.push(['Cities (' + cities + ')', -unCity]);
    lines.push(['Population', -Math.round(unPop)]);
    var net = Math.round(happy - unhappy);
    p.happy = net;
    return { net: net, happy: Math.round(happy), unhappy: Math.round(unhappy), lines: lines, lux: res.lux };
  };

  // ---------------- Religion helpers ----------------
  E.majorityReligion = function (c) {
    var best = null, bn = 0;
    for (var r in c.followers) if (c.followers[r] > bn) { bn = c.followers[r]; best = r; }
    if (best && bn * 2 >= c.pop) return best;
    if (best && bn > 0) {
      var tot = 0; for (r in c.followers) tot += c.followers[r];
      if (bn > c.pop - tot) return best;
    }
    return null;
  };
  E.religionCities = function (game, rel) {
    var out = [];
    for (var id in game.cities) if (E.majorityReligion(game.cities[id]) === rel) out.push(game.cities[id]);
    return out;
  };
  E.addFollowers = function (c, rel, n) {
    var total = 0; for (var r in c.followers) total += c.followers[r];
    var free = c.pop - total;
    var add = Math.min(n, free);
    if (add > 0) { c.followers[rel] = (c.followers[rel] || 0) + add; n -= add; }
    // convert from others
    while (n > 0) {
      var worst = null, wn = 0;
      for (r in c.followers) if (r !== rel && c.followers[r] > wn) { wn = c.followers[r]; worst = r; }
      if (!worst) break;
      c.followers[worst]--; if (!c.followers[worst]) delete c.followers[worst];
      c.followers[rel] = (c.followers[rel] || 0) + 1; n--;
    }
  };

  // ---------------- Trade routes ----------------
  E.tradeCap = function (game, p) {
    var n = 0; D.TRADE_TECHS.forEach(function (t) { if (p.techs[t]) n++; });
    return n + (p.mods.tradeRoutes || 0);
  };
  E.tradeRoutesUsed = function (game, p) {
    var n = game.tradeRoutes.filter(function (r) { return r.owner === p.id; }).length;
    p.units.forEach(function (uid) { var u = game.units[uid]; if (u && (u.type === 'caravan' || u.type === 'cargo_ship')) n++; });
    return n;
  };
  E.tradeTargets = function (game, u) {
    var p = game.players[u.owner], from = E.cityAt(game, u.tile);
    if (!from || from.owner !== p.id) return [];
    var range = D.UNITS[u.type].tradeRange * (R.hasBuilding(from, 'caravansary') ? 1.5 : 1);
    var sea = D.UNITS[u.type].domain === 'sea';
    var out = [];
    for (var id in game.cities) {
      var c = game.cities[id];
      if (c === from) continue;
      var o = game.players[c.owner];
      if (o.isBarb || E.atWar(game, p.id, o.id)) continue;
      if (o.id !== p.id && !p.met[o.id]) continue;
      if (Hex.distance(from.tile, c.tile) > range) continue;
      if (sea && (!isCoastal(game, c.tile) || !isCoastal(game, from.tile))) continue;
      if (!sea && game.map.area[c.tile] !== game.map.area[from.tile]) continue;
      if (game.tradeRoutes.some(function (r) { return r.from === from.id && r.to === c.id; })) continue;
      out.push({ city: c, value: E.tradeValue(game, p, from, c, sea) });
    }
    out.sort(function (a, b) { return (b.value.goldFrom + b.value.food + b.value.prod) - (a.value.goldFrom + a.value.food + a.value.prod); });
    return out;
  };
  E.tradeValue = function (game, p, from, to, sea) {
    var o = game.players[to.owner];
    var v = { goldFrom: 0, goldTo: 0, sciFrom: 0, sciTo: 0, food: 0, prod: 0, domestic: o.id === p.id };
    if (v.domestic) {
      v.food = 2 + Math.floor(from.pop / 4) + (sea ? 1 : 0);
      v.prod = 0;
    } else {
      v.goldFrom = 2 + Math.floor((to.pop + from.pop) / 4) + (p.mods.tradeGold || 0) + (sea ? 2 : 0);
      v.goldTo = 1 + Math.floor(to.pop / 5);
      var tp = Object.keys(p.techs).length, to_ = Object.keys(o.techs).length;
      if (to_ > tp) v.sciFrom = Math.min(8, Math.ceil((to_ - tp) / 3));
      if (tp > to_) v.sciTo = Math.min(8, Math.ceil((tp - to_) / 3));
    }
    return v;
  };
  E.establishTrade = function (game, u, toCity, domesticKind) {
    var p = game.players[u.owner], from = E.cityAt(game, u.tile);
    var sea = D.UNITS[u.type].domain === 'sea';
    var v = E.tradeValue(game, p, from, toCity, sea);
    if (v.domestic && domesticKind === 'prod') { v.prod = v.food; v.food = 0; }
    var route = { owner: p.id, from: from.id, to: toCity.id, unitType: u.type, turns: Math.round(30 * Math.min(2, R.speedCost(game))), domestic: v.domestic,
      goldFrom: v.goldFrom, goldTo: v.goldTo, sciFrom: v.sciFrom, sciTo: v.sciTo, food: v.food, prod: v.prod };
    game.tradeRoutes.push(route);
    E.removeUnit(game, u, 'trade');
    if (!v.domestic) {
      var o = game.players[toCity.owner];
      E.rel(o, p.id).opinion += 2;
      // spread religion via trade
      var rel = E.majorityReligion(from);
      if (rel) toCity.pressure[rel] = (toCity.pressure[rel] || 0) + 20;
    }
    return route;
  };

  // ---------------- Visibility ----------------
  function updateVisibility(game, p, light) {
    var m = game.map, vis = p.visible, exp = p.explored;
    vis.fill(0);
    if (p.isBarb) return;
    function see(center, r) {
      var ts = Hex.within(center, r);
      for (var i = 0; i < ts.length; i++) { vis[ts[i]] = 1; exp[ts[i]] = 1; }
    }
    p.units.forEach(function (uid) {
      var u = game.units[uid]; if (!u) return;
      var d = D.UNITS[u.type];
      var r = d.sight || 2;
      if (m.hills[u.tile] || m.terrain[u.tile] === IDS.terrain.map.mountain) r += 1;
      if (d.domain === 'land' && p.mods.landSight) r += p.mods.landSight;
      if (d.domain === 'sea' && p.mods.navalSight) r += p.mods.navalSight;
      if (u.promos.indexOf('sentry') >= 0) r += 1;
      see(u.tile, r);
    });
    p.cities.forEach(function (cid) { var c = game.cities[cid]; if (c) see(c.tile, 2); });
    // v2 perf: the old code scanned every tile of the map on every call —
    // including after every single unit move. Full calls (turn start, city
    // founded/captured, load) rebuild a per-player owned-tile cache; light
    // calls (after a move/attack) just replay the cache.
    if (light && p._ownedCache) {
      for (var oi = 0; oi < p._ownedCache.length; oi++) { var ot = p._ownedCache[oi]; vis[ot] = 1; exp[ot] = 1; }
    } else {
      var owned = [];
      for (var t = 0; t < vis.length; t++) if (m.owner[t] === p.id) { vis[t] = 1; exp[t] = 1; owned.push(t); }
      p._ownedCache = owned;
    }
    // meet other civs
    for (t = 0; t < vis.length; t++) {
      if (!vis[t]) continue;
      var o = m.owner[t];
      if (o >= 0 && o !== p.id && !p.met[o]) meet(game, p, game.players[o]);
    }
    for (var id in game.units) {
      var u2 = game.units[id];
      if (u2.owner !== p.id && vis[u2.tile] && !p.met[u2.owner] && !game.players[u2.owner].isBarb) meet(game, p, game.players[u2.owner]);
    }
  }
  E.updateVisibility = updateVisibility;
  function meet(game, p, o) {
    if (o.isBarb || p.isBarb || o === p) return;
    p.met[o.id] = true; o.met[p.id] = true;
    E.rel(p, o.id); E.rel(o, p.id);
    if (p.isHuman) E.note(game, p, 'You have met ' + (o.isCS ? 'the City-State of ' + o.name : o.leader + ' of ' + o.name) + '.', null, 'diplo');
    if (o.isHuman) E.note(game, o, 'You have met ' + (p.isCS ? 'the City-State of ' + p.name : p.leader + ' of ' + p.name) + '.', null, 'diplo');
    // first-meeting bonus from city-states
    if (o.isCS && !p.isCS) { p.gold += 15; o.csInfluence[p.id] = o.csInfluence[p.id] || 0; }
    if (p.isCS && !o.isCS) { o.gold += 15; p.csInfluence[o.id] = p.csInfluence[o.id] || 0; }
  }
  E.meet = meet;

  // ---------------- Turn processing ----------------
  function startTurn(game, p) {
    if (!p.alive) return;
    R.computeMods(game, p);
    E.dirtyRes(p);
    p.era = E.eraOf(p);
    // units: heal & reset
    p.units.slice().forEach(function (uid) {
      var u = game.units[uid]; if (!u) return;
      G.Units.startTurnUnit(game, u);
    });
    if (!p.isBarb) {
      processEconomy(game, p);
    }
    updateVisibility(game, p);
    E.emit({ type: 'turnStart', player: p.id });
  }
  E.startTurn = startTurn;

  function processEconomy(game, p) {
    var mods = p.mods, hap = E.happiness(game, p);
    var tot = { f: 0, p: 0, g: 0, s: 0, c: 0, fa: 0, t: 0 };
    var cityIds = p.cities.slice();
    var connected = computeConnections(game, p);
    cityIds.forEach(function (cid) {
      var c = game.cities[cid]; if (!c) return;
      c.connected = !!connected[cid];
      c.railConnected = connected[cid] === 2;
      processCity(game, p, c, hap, tot);
    });
    if (!p.alive) return;
    // unit & building maintenance
    var maint = 0;
    cityIds.forEach(function (cid) {
      var c = game.cities[cid]; if (!c || c.puppet) return;
      for (var b in c.buildings) { var d = D.BUILDINGS[b]; if (d && d.maint) maint += d.maint; }
    });
    var roads = 0;
    for (var t = 0; t < game.map.road.length; t++) if (game.map.road[t] && game.map.owner[t] === p.id && !E.cityAt(game, t)) roads += game.map.road[t];
    maint += roads * 0.5 * (1 + (mods.roadMaintPct || 0) / 100);
    var nUnits = p.units.filter(function (uid) { var u = game.units[uid]; return u && D.UNITS[u.type].cls !== 'gp' && u.type !== 'caravan' && u.type !== 'cargo_ship'; }).length;
    var free = 3 + Math.floor(p.cities.length / 2);
    var perUnit = 1 + p.era * 0.25;
    var unitMaint = Math.max(0, nUnits - free) * perUnit * (1 + (mods.unitMaintPct || 0) / 100);
    if (!p.isHuman) unitMaint *= 1 - D.DIFFICULTIES[game.difficulty].aiBonus / 200;
    if (p.isCS) { maint = 0; unitMaint = 0; }
    var csGold = (p.csBonus && p.csBonus.gold) || 0;
    var tradeG = 0;
    var gpt = tot.g - maint - unitMaint + csGold + tradeG;
    if (p.religion && game.religions[p.religion]) {
      var relCities = E.religionCities(game, p.religion);
      if (mods.followerCityGold) gpt += relCities.length * mods.followerCityGold;
      if (mods.titheGold) { var fol = 0; for (var id in game.cities) fol += game.cities[id].followers[p.religion] || 0; gpt += Math.floor(fol * mods.titheGold); }
      if (mods.foreignFollowerFaith) tot.fa += relCities.filter(function (c) { return c.owner !== p.id; }).length * mods.foreignFollowerFaith;
      if (mods.worldChurch) { fol = 0; for (id in game.cities) fol += game.cities[id].followers[p.religion] || 0; tot.c += Math.floor(fol * mods.worldChurch); }
    }
    p.lastYields = { gpt: Math.round(gpt * 10) / 10, sci: 0, cul: tot.c, faith: tot.fa, maint: Math.round(maint + unitMaint), income: Math.round(tot.g), tourism: tot.t };
    p.gold += gpt;
    var sci = tot.s + ((p.csBonus && p.csBonus.science) || 0);
    if (p.gold < 0) {
      sci += p.gold; // deficit eats science
      if (game.turn % 5 === 0) { // disband a unit
        var mil = p.units.map(function (uid) { return game.units[uid]; }).filter(function (u) { return u && D.UNITS[u.type].cls !== 'civilian' && D.UNITS[u.type].cls !== 'gp'; });
        if (mil.length) { var dead = mil[0]; E.note(game, p, 'Bankruptcy! ' + D.UNITS[dead.type].name + ' disbanded.', dead.tile, 'bad'); E.removeUnit(game, dead, 'disband'); }
      }
      p.gold = 0;
    }
    p.lastYields.sci = Math.round(Math.max(0, sci) * 10) / 10;
    // culture -> policies
    var cul = tot.c + ((p.csBonus && p.csBonus.culture) || 0);
    p.culture += cul; p.totalCulture += cul;
    p.lastYields.cul = Math.round(cul * 10) / 10;
    // faith
    var fa = tot.fa + ((p.csBonus && p.csBonus.faith) || 0);
    p.faith += fa; p.lastYields.faith = Math.round(fa * 10) / 10;
    // research
    if (!p.isCS) doResearch(game, p, Math.max(0, sci));
    else { // city-states get techs over time from the average
      if (game.turn % 4 === 0) giveCSTech(game, p);
    }
    if (!p.isCS) {
      checkPolicies(game, p);
      checkReligionMilestones(game, p);
      processGoldenAge(game, p, hap.net);
      processGreatPeople(game, p);
      processTourism(game, p, tot.t);
      // Maya long count
      if (mods.longCount && game.turn > 0 && game.turn % Math.round(mods.longCount * R.speedCost(game)) === 0 && p.techs.mathematics) {
        var types = ['scientist', 'engineer', 'merchant', 'artist', 'prophet'];
        spawnGP(game, p, types[(game.turn / mods.longCount | 0) % types.length]);
      }
      // trades expiry
      ['imports', 'exports'].forEach(function (k) { (p[k] || []).forEach(function (x) { x.turns--; }); p[k] = (p[k] || []).filter(function (x) { return x.turns > 0; }); });
      (p.gptDeals || []).forEach(function (d) { p.gold += d.amount; d.turns--; });
      p.gptDeals = (p.gptDeals || []).filter(function (d) { return d.turns > 0; });
      for (var oid in p.relations) { var r = p.relations[oid]; if (r.openBorders > 0) r.openBorders--; }
    } else {
      processCityState(game, p);
    }
  }

  function giveCSTech(game, p) {
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb && q.alive; });
    var counts = {};
    majors.forEach(function (q) { for (var t in q.techs) counts[t] = (counts[t] || 0) + 1; });
    for (var t in counts) if (!p.techs[t] && counts[t] >= Math.max(1, majors.length / 2)) { p.techs[t] = true; break; }
  }

  function computeConnections(game, p) {
    // BFS from capital over roads/railroads (and harbors) to find connected cities
    var cap = game.cities[p.capital];
    var res = {};
    if (!cap) return res;
    var m = game.map, seen = {}, rail = {};
    var q = [cap.tile]; seen[cap.tile] = 1; rail[cap.tile] = 1;
    var cityTiles = {}; p.cities.forEach(function (cid) { var c = game.cities[cid]; if (c) cityTiles[c.tile] = c; });
    while (q.length) {
      var t = q.shift();
      var nb = Hex.neighbors(t);
      for (var i = 0; i < nb.length; i++) {
        var z = nb[i]; if (seen[z]) continue;
        var ok = m.road[z] > 0 || cityTiles[z];
        if (!ok) continue;
        var ow = m.owner[z]; if (ow >= 0 && ow !== p.id && E.atWar(game, p.id, ow)) continue;
        seen[z] = 1; rail[z] = rail[t] && (m.road[z] === 2 || cityTiles[z]) ? 1 : 0; q.push(z);
      }
    }
    // harbor connections (coastal cities with harbor in same water body as capital with harbor)
    var capHarbor = R.hasBuilding(cap, 'harbor');
    p.cities.forEach(function (cid) {
      var c = game.cities[cid]; if (!c || c === cap) return;
      if (seen[c.tile]) res[cid] = rail[c.tile] ? 2 : 1;
      else if (capHarbor && R.hasBuilding(c, 'harbor')) res[cid] = 1;
    });
    res[cap.id] = 1;
    return res;
  }

  function processCity(game, p, c, hap, tot) {
    if (!c.manual) assignCitizens(game, c);
    var y = E.cityYields(game, c);
    c.lastYields = y;
    // --- razing
    if (c.razing) {
      c.pop -= p.mods.razeFast ? 2 : 1;
      if (c.pop <= 0) { destroyCity(game, c); return; }
    }
    if (c.resist > 0) c.resist--;
    // --- growth
    var surplus = y.surplus;
    var buildingSettler = c.build && c.build.kind === 'unit' && c.build.id === 'settler';
    if (surplus > 0) {
      if (hap.net < 0) surplus *= hap.net <= -10 ? 0 : 0.25;
      if (buildingSettler) surplus = 0;
    }
    c.food += surplus;
    var need = R.foodToGrow(game, c.pop);
    if (c.food >= need) {
      c.pop++;
      var keep = 0; for (var b in c.buildings) { var d = D.BUILDINGS[b]; if (d && d.foodKeep) keep += d.foodKeep; }
      c.food = Math.floor(need * Math.min(90, keep) / 100) + (c.food - need);
      if (c.food > R.foodToGrow(game, c.pop) * 0.9) c.food = 0;
      E.note(game, p, c.name + ' has grown to size ' + c.pop + '.', c.tile, 'city');
      E.emit({ type: 'cityGrew', city: c });
      if (!c.manual) assignCitizens(game, c);
    } else if (c.food < 0) {
      if (c.pop > 1) { c.pop--; c.food = Math.floor(R.foodToGrow(game, c.pop) * 0.5); E.note(game, p, c.name + ' is starving!', c.tile, 'bad'); }
      else c.food = 0;
    }
    // --- production
    if (!c.build) {
      if (!p.isHuman || c.puppet) { G.AI && G.AI.chooseProduction(game, p, c); }
    }
    if (c.build && c.build.kind === 'process') {
      if (c.build.id === 'wealth') y.g += y.p * 0.25;
      if (c.build.id === 'research') y.s += y.p * 0.25;
    } else if (c.build) {
      if (!E.canBuild(game, c, c.build.kind, c.build.id)) {
        if (c.build.kind === 'wonder' && game.wonders[c.build.id] != null) E.note(game, p, 'Another civilization completed ' + E.itemName(c.build) + '. Production in ' + c.name + ' kept.', c.tile, 'bad');
        c.build = null;
        if (!p.isHuman || c.puppet) G.AI && G.AI.chooseProduction(game, p, c);
      }
      if (c.build && c.build.kind !== 'process') {
        c.prod += E.prodTowards(game, c, y);
        var cost = E.itemCost(game, c, c.build);
        if (c.prod >= cost) {
          var done = c.build;
          c.prod -= cost;
          if (c.prod > cost * 0.5 && done.kind !== 'unit') c.prod = Math.min(c.prod, cost * 0.5);
          completeItem(game, p, c, done);
          c.build = null;
          if (c.queue.length) { c.build = c.queue.shift(); }
          if (!c.build && (!p.isHuman || c.puppet)) G.AI && G.AI.chooseProduction(game, p, c);
          if (!c.build && p.isHuman) E.note(game, p, c.name + ' needs something to build.', c.tile, 'prod');
        }
      }
    } else {
      // no build: keep production for later (capped)
      c.prod = Math.min(c.prod + y.p, 500);
    }
    // --- culture & borders
    c.culture += y.c;
    var bc = R.borderCost(game, c, p);
    var guard = 0;
    while (c.culture >= bc && guard++ < 3) {
      var t = pickBorderTile(game, c, p);
      if (t < 0) break;
      claimTile(game, p, c, t);
      c.culture -= bc; c.cultureLevel++;
      bc = R.borderCost(game, c, p);
      E.emit({ type: 'borders', city: c });
    }
    // --- HP regen
    var maxHp = cityMaxHp(game, c);
    if (c.attacked > 0) { c.attacked--; c.hp = Math.min(maxHp, c.hp + 8); }
    else c.hp = Math.min(maxHp, c.hp + 20);
    c.rangedUsed = false;
    tot.f += y.f; tot.p += y.p; tot.g += y.g; tot.s += y.s; tot.c += y.c; tot.fa += y.fa; tot.t += y.t;
    // GPP from specialists & buildings
    c.gpp = c.gpp || {};
    for (var sk in c.specialists) {
      if (sk === 'citizen') continue;
      var gpt = D.SPECIALISTS[sk].gp;
      c.gpp[gpt] = (c.gpp[gpt] || 0) + 3 * c.specialists[sk];
    }
    c.wonders.forEach(function (w) { var era = D.WONDERS[w].era; var tp = ['engineer', 'artist', 'scientist', 'merchant', 'writer', 'musician', 'scientist', 'engineer'][era]; c.gpp[tp] = (c.gpp[tp] || 0) + 1; });
  }

  function pickBorderTile(game, c, p) {
    var m = game.map, best = -1, bestS = -1e9;
    var cands = Hex.within(c.tile, 5);
    for (var i = 0; i < cands.length; i++) {
      var t = cands[i];
      if (m.owner[t] >= 0) continue;
      if (!Hex.neighbors(t).some(function (z) { return m.city[z] === c.id; })) continue;
      var d = Hex.distance(c.tile, t);
      var y = R.tileYield(game, t, p, null);
      var s = (y.f || 0) * 2 + (y.p || 0) * 1.5 + (y.g || 0) + (y.s || 0) + (y.c || 0) + (y.fa || 0) - d * 3;
      if (m.res[t] && R.resVisible(p, R.resKey(m, t))) s += D.RESOURCES[R.resKey(m, t)].type === 'luxury' ? 6 : 4;
      if (m.nw[t]) s += 6;
      if (d > 3) s -= 4;
      s += game.rng.next();
      if (s > bestS) { bestS = s; best = t; }
    }
    return best;
  }
  E.pickBorderTile = pickBorderTile;

  function completeItem(game, p, c, item) {
    var name = E.itemName(item);
    if (item.kind === 'unit') {
      var def = D.UNITS[item.id];
      var xp = 0;
      for (var b in c.buildings) { var bd = D.BUILDINGS[b]; if (bd && bd.xp && (def.domain !== 'air')) xp += bd.xp; }
      xp += p.mods.xpFlat || 0;
      var u = createUnit(game, p, item.id, c.tile, { xp: xp });
      if (u) {
        u.moves = 0;
        if (p.mods.combatAll && D.BUILDINGS.heroic_epic && false) { }
        if (c.wonders.indexOf('alhambra') >= 0 && def.domain === 'land' && def.cls !== 'civilian') u.promos.push('drill1');
        G.Units.checkPromotion(game, u);
        G.Units.placeNewUnit(game, u, c);
      }
      E.note(game, p, c.name + ' has trained a ' + name + '.', c.tile, 'prod');
      E.dirtyRes(p);
    } else if (item.kind === 'building') {
      c.buildings[item.id] = 1;
      var bdef = D.BUILDINGS[item.id];
      if (bdef.hp) c.hp += bdef.hp;
      if (bdef.freeTech) giveFreeTech(game, p, bdef.freeTech);
      E.note(game, p, c.name + ' has completed the ' + name + '.', c.tile, 'prod');
      E.dirtyRes(p);
    } else if (item.kind === 'wonder') {
      var w = D.WONDERS[item.id];
      game.wonders[item.id] = c.id;
      if (w.project) {
        if (item.id === 'manhattan_project') { game.manhattan = true; E.noteAll(game, p.name + ' has completed the Manhattan Project. The nuclear age has begun.', c.tile, 'world'); }
        if (item.id === 'apollo_program') { p.apollo = true; E.noteAll(game, p.name + ' has completed the Apollo Program and can build a spaceship!', c.tile, 'world'); }
        if (item.id === 'utopia_project') { declareVictory(game, p, 'culture'); }
        // projects can be built by multiple players except utopia
        if (item.id !== 'utopia_project') delete game.wonders[item.id];
        p.projects = p.projects || {}; p.projects[item.id] = 1;
      } else {
        c.wonders.push(item.id); p.wonders.push(item.id);
        applyOnce(game, p, c, w.once);
        if (item.id === 'united_nations') { game.un = { founder: p.id, nextVote: game.turn + Math.round(10 * R.speedCost(game)) }; }
        E.noteAll(game, (p.isHuman ? 'You have' : p.name + ' has') + ' completed ' + name + '!', c.tile, 'wonder');
        E.emit({ type: 'wonder', city: c, id: item.id });
      }
      R.computeMods(game, p);
    } else if (item.kind === 'space') {
      p.space[item.id] = (p.space[item.id] || 0) + 1;
      E.noteAll(game, p.name + ' has built a ' + name + '.', c.tile, 'world');
      var complete = true;
      for (var s in D.SPACESHIP) if ((p.space[s] || 0) < D.SPACESHIP[s].need) complete = false;
      if (complete) declareVictory(game, p, 'science');
    }
    E.emit({ type: 'cityChanged', city: c });
  }

  function applyOnce(game, p, c, once) {
    if (!once) return;
    if (once.freeTech) giveFreeTech(game, p, once.freeTech);
    if (once.freePolicy) p.freePolicies += once.freePolicy;
    if (once.freeUnits) once.freeUnits.forEach(function (ut) {
      var city = c || game.cities[p.capital];
      if (!city) return;
      var u = createUnit(game, p, R.civUnit(p, ut), city.tile); if (u) G.Units.placeNewUnit(game, u, city);
    });
    if (once.freeGP) { if (once.freeGP === 'choice') p.freeGPChoice = (p.freeGPChoice || 0) + 1; else spawnGP(game, p, once.freeGP, c); }
    if (once.freeGP2) spawnGP(game, p, once.freeGP2, c);
    if (once.goldenAge) startGoldenAge(game, p, false);
    if (once.copyUnits) {
      var types = {};
      p.units.forEach(function (uid) { var u = game.units[uid]; if (u && D.UNITS[u.type].domain === 'land' && D.UNITS[u.type].cls !== 'civilian' && D.UNITS[u.type].cls !== 'gp') types[u.type] = 1; });
      for (var t in types) { var nu = createUnit(game, p, t, c.tile); if (nu) G.Units.placeNewUnit(game, nu, c); }
    }
    if (once.freeBuilding) {
      var bid = once.freeBuilding[0], n = once.freeBuilding[1], k = 0;
      p.cities.forEach(function (cid) { var cc = game.cities[cid]; if (cc && k < n && !R.hasBuilding(cc, bid)) { cc.buildings[R.civBuilding(p, bid)] = 1; k++; } });
    }
  }
  E.applyOnce = applyOnce;

  function destroyCity(game, c) {
    var p = game.players[c.owner], m = game.map;
    E.noteAll(game, c.name + ' has been burned to the ground.', c.tile, 'bad');
    for (var t = 0; t < m.city.length; t++) if (m.city[t] === c.id) { m.city[t] = -1; m.owner[t] = -1; }
    m.imp[c.tile] = IDS.imp.map.city_ruins;
    delete game.cities[c.id];
    var ix = p.cities.indexOf(c.id); if (ix >= 0) p.cities.splice(ix, 1);
    game.tradeRoutes = game.tradeRoutes.filter(function (r) { return r.from !== c.id && r.to !== c.id; });
    for (var w in game.wonders) if (game.wonders[w] === c.id) game.wonders[w] = -1;
    if (p.capital === c.id) { p.capital = p.cities.length ? p.cities[0] : -1; if (p.capital >= 0) { game.cities[p.capital].capital = true; game.cities[p.capital].buildings.palace = 1; } }
    E.emit({ type: 'cityDestroyed', city: c });
    checkElimination(game, p);
  }
  E.destroyCity = destroyCity;

  // City captured by player np
  E.captureCity = function (game, c, np, choice) {
    var op = game.players[c.owner];
    var m = game.map;
    // gold plunder
    var plunder = Math.round(c.pop * 10 + game.rng.int(50));
    np.gold += plunder;
    if (op.isHuman) E.note(game, op, c.name + ' has been captured by ' + np.name + '!', c.tile, 'bad');
    if (np.isHuman) E.note(game, np, 'You captured ' + c.name + ' and plundered ' + plunder + ' gold.', c.tile, 'good');
    // move ownership
    var ix = op.cities.indexOf(c.id); if (ix >= 0) op.cities.splice(ix, 1);
    var wasCapital = c.capital;
    if (c.capital) {
      delete c.buildings.palace; c.capital = false;
      op.capital = op.cities.length ? op.cities[0] : -1;
      if (op.capital >= 0) { game.cities[op.capital].capital = true; game.cities[op.capital].buildings.palace = 1; }
    }
    // national wonders destroyed, some buildings destroyed
    for (var b in c.buildings) {
      var bd = D.BUILDINGS[b];
      if (!bd) continue;
      if (bd.national || game.rng.chance(0.3)) delete c.buildings[b];
    }
    c.wonders.forEach(function (w) { var k = op.wonders.indexOf(w); if (k >= 0) op.wonders.splice(k, 1); np.wonders.push(w); });
    c.owner = np.id;
    np.cities.push(c.id);
    c.pop = Math.max(1, Math.floor(c.pop * 0.75));
    c.build = null; c.queue = []; c.prod = 0; c.food = 0;
    c.occupied = true; c.resist = Math.min(10, c.pop); c.locked = {}; c.manual = false;
    c.hp = Math.round(cityMaxHp(game, c) * 0.25);
    for (var t = 0; t < m.city.length; t++) if (m.city[t] === c.id) m.owner[t] = np.id;
    if (np.isCS) { c.puppet = false; }
    game.tradeRoutes = game.tradeRoutes.filter(function (r) { return r.from !== c.id && r.to !== c.id; });
    if (np.mods.conquestTech) {
      var steal = Object.keys(op.techs).filter(function (tt) { return !np.techs[tt] && D.TECHS[tt] && D.TECHS[tt].req.every(function (rq) { return np.techs[rq]; }); });
      if (steal.length) { var st = game.rng.pick(steal); grantTech(game, np, st); if (np.isHuman) E.note(game, np, 'Treasures of Nineveh: learned ' + D.TECHS[st].name, null, 'good'); }
    }
    // capture city-state: diplomatic hit
    if (op.isCS) { game.players.forEach(function (q) { if (!q.isCS && !q.isBarb && q !== np) E.rel(q, np.id).opinion -= 15; }); }
    game.players.forEach(function (q) { if (!q.isCS && !q.isBarb && q !== np && q !== op && q.met[np.id]) E.rel(q, np.id).opinion -= 4; });
    if (choice === 'raze' && !c.originalCapital) c.razing = true;
    else if (choice === 'puppet') { c.puppet = true; c.occupied = false; }
    else if (choice === 'liberate' && c.original !== np.id && game.players[c.original].alive) { E.liberate(game, c, np); }
    E.dirtyRes(np); E.dirtyRes(op);
    updateVisibility(game, np); updateVisibility(game, op);
    E.emit({ type: 'cityCaptured', city: c, by: np.id, from: op.id });
    checkElimination(game, op);
    checkDomination(game);
  };
  E.liberate = function (game, c, np) {
    var orig = game.players[c.original];
    var ix = np.cities.indexOf(c.id); if (ix >= 0) np.cities.splice(ix, 1);
    c.owner = orig.id; orig.cities.push(c.id); c.occupied = false; c.puppet = false; c.resist = 0;
    for (var t = 0; t < game.map.city.length; t++) if (game.map.city[t] === c.id) game.map.owner[t] = orig.id;
    E.rel(orig, np.id).opinion += 50; E.rel(orig, np.id).war = false; E.rel(np, orig.id).war = false;
    if (orig.isCS) orig.csInfluence[np.id] = 90;
    if (orig.capital < 0) { orig.capital = c.id; c.capital = true; c.buildings.palace = 1; }
  };

  function checkElimination(game, p) {
    if (!p.alive || p.isBarb) return;
    if (p.cities.length === 0) {
      var hasSettler = p.units.some(function (uid) { var u = game.units[uid]; return u && u.type === 'settler'; });
      if (game.turn > 5 || !hasSettler) {
        p.alive = false;
        p.units.slice().forEach(function (uid) { var u = game.units[uid]; if (u) E.removeUnit(game, u, 'eliminated'); });
        E.noteAll(game, p.name + (p.isCS ? ' (City-State)' : '') + ' has been destroyed!', null, 'world');
        E.emit({ type: 'eliminated', player: p.id });
        if (p.isHuman) { game.victory = game.victory || { winner: -1, type: 'defeat', turn: game.turn }; E.emit({ type: 'gameOver', victory: game.victory }); }
      }
    }
  }
  E.checkElimination = checkElimination;

  // ---------------- Research ----------------
  E.canResearch = function (p, tid) {
    var t = D.TECHS[tid];
    if (!t) return false;
    if (p.techs[tid] && tid !== 'future_tech') return false;
    return t.req.every(function (r) { return p.techs[r]; });
  };
  E.researchOptions = function (p) { return Object.keys(D.TECHS).filter(function (t) { return E.canResearch(p, t); }); };
  E.pathTo = function (p, tid) {
    // list of techs needed in order to reach tid
    var out = [], seen = {};
    function visit(t) { if (seen[t] || (p.techs[t] && t !== 'future_tech')) return; seen[t] = 1; D.TECHS[t].req.forEach(visit); out.push(t); }
    visit(tid);
    return out;
  };
  function doResearch(game, p, sci) {
    if (!p.researching && p.researchQueue && p.researchQueue.length) p.researching = p.researchQueue.shift();
    if (!p.researching && !p.isHuman) G.AI && G.AI.chooseResearch(game, p);
    if (!p.researching) { p.freeScience += sci; return; }
    if (!E.canResearch(p, p.researching)) {
      // re-queue prerequisites
      var path = E.pathTo(p, p.researching);
      if (path.length && E.canResearch(p, path[0])) { p.researchQueue = path.slice(1).concat(p.researchQueue || []); p.researching = path[0]; }
      else { p.researching = null; return; }
    }
    var t = p.researching;
    p.techProgress[t] = (p.techProgress[t] || 0) + sci + p.freeScience;
    p.freeScience = 0;
    var cost = R.techCost(game, p, t);
    if (p.techProgress[t] >= cost) {
      var over = p.techProgress[t] - cost;
      p.techProgress[t] = 0;
      grantTech(game, p, t);
      p.researching = null;
      if (p.researchQueue && p.researchQueue.length) {
        while (p.researchQueue.length && !E.canResearch(p, p.researchQueue[0])) p.researchQueue.shift();
        if (p.researchQueue.length) p.researching = p.researchQueue.shift();
      }
      if (!p.researching && !p.isHuman) G.AI && G.AI.chooseResearch(game, p);
      if (p.researching) p.techProgress[p.researching] = (p.techProgress[p.researching] || 0) + over; else p.freeScience += over;
    }
  }
  function grantTech(game, p, t) {
    var prevEra = E.eraOf(p);
    if (t === 'future_tech') { p.futureTechs = (p.futureTechs || 0) + 1; p.techs.future_tech = true; }
    else p.techs[t] = true;
    E.note(game, p, 'Research complete: ' + D.TECHS[t].name + '.', null, 'tech');
    var civ = p.civ && D.CIVS[p.civ];
    if (civ && civ.trait.onTech && civ.trait.onTech[t]) applyOnce(game, p, game.cities[p.capital], civ.trait.onTech[t]);
    var era = E.eraOf(p);
    if (era > prevEra) {
      p.era = era;
      E.note(game, p, 'You have entered the ' + D.ERAS[era] + ' Era.', null, 'era');
      if (p.mods.eraPolicy) p.freePolicies++;
      if (!p.isHuman) game.players.forEach(function (q) { if (q.isHuman && q.met[p.id]) E.note(game, q, p.name + ' has entered the ' + D.ERAS[era] + ' Era.', null, 'world'); });
    }
    E.dirtyRes(p);
    E.emit({ type: 'tech', player: p.id, tech: t });
  }
  E.grantTech = grantTech;
  function giveFreeTech(game, p, n) {
    for (var i = 0; i < n; i++) {
      if (p.isHuman) { p.freeTechs = (p.freeTechs || 0) + 1; E.note(game, p, 'You may choose a free technology!', null, 'tech'); }
      else { var opts = E.researchOptions(p); if (opts.length) grantTech(game, p, G.AI ? G.AI.pickTech(game, p, opts) : opts[0]); }
    }
  }
  E.giveFreeTech = giveFreeTech;
  E.takeFreeTech = function (game, p, t) {
    if (!p.freeTechs || !E.canResearch(p, t)) return false;
    p.freeTechs--; grantTech(game, p, t);
    if (p.researching === t) p.researching = null;
    return true;
  };

  // ---------------- Policies ----------------
  E.canAdoptTree = function (game, p, tr) {
    var tree = D.POLICY_TREES[tr];
    if (p.trees[tr]) return false;
    if (tree.era > E.eraOf(p)) return false;
    if (tree.ideology) { for (var t in p.trees) if (D.POLICY_TREES[t].ideology) return false; }
    return true;
  };
  E.canAdoptPolicy = function (game, p, pol) {
    var tr = R.policyTreeOf(pol);
    if (!tr || !p.trees[tr] || p.policies[pol]) return false;
    var pd = D.POLICY_TREES[tr].policies[pol];
    return !pd.req || pd.req.every(function (r) { return p.policies[r]; });
  };
  E.canAffordPolicy = function (game, p) { return p.freePolicies > 0 || p.culture >= R.policyCost(game, p); };
  E.adopt = function (game, p, kind, id) {
    if (!E.canAffordPolicy(game, p)) return false;
    if (kind === 'tree' && !E.canAdoptTree(game, p, id)) return false;
    if (kind === 'policy' && !E.canAdoptPolicy(game, p, id)) return false;
    if (p.freePolicies > 0) p.freePolicies--; else { p.culture -= R.policyCost(game, p); p.numPolicies++; }
    if (kind === 'tree') {
      p.trees[id] = 'open';
      applyOnce(game, p, game.cities[p.capital], D.POLICY_TREES[id].opener.once);
    } else {
      p.policies[id] = 1;
      var tr = R.policyTreeOf(id), tree = D.POLICY_TREES[tr];
      applyOnce(game, p, game.cities[p.capital], tree.policies[id].once);
      var all = Object.keys(tree.policies).every(function (k) { return p.policies[k]; });
      if (all) { p.trees[tr] = 'done'; applyOnce(game, p, game.cities[p.capital], tree.finisher.once); E.note(game, p, 'You completed the ' + tree.name + ' tree!', null, 'good'); }
    }
    R.computeMods(game, p);
    E.emit({ type: 'policy', player: p.id });
    return true;
  };
  function checkPolicies(game, p) {
    if (!p.isHuman) { var guard = 0; while (E.canAffordPolicy(game, p) && guard++ < 5) { if (!G.AI || !G.AI.choosePolicy(game, p)) break; } }
  }

  // ---------------- Religion milestones ----------------
  function checkReligionMilestones(game, p) {
    // pantheon
    if (!p.pantheon && p.faith >= R.pantheonCost(game) && Object.keys(game.pantheonsTaken).length < Object.keys(D.BELIEFS.pantheon).length) {
      if (p.isHuman) { if (!p.pantheonReady) { p.pantheonReady = true; E.note(game, p, 'You have enough Faith to found a Pantheon!', null, 'faith'); } }
      else if (G.AI) G.AI.choosePantheon(game, p);
    }
    // great prophet
    var nRel = Object.keys(game.religions).length;
    var canGet = p.religion || nRel < R.maxReligions(game);
    if (p.pantheon && canGet && p.faith >= R.prophetCost(game, p) && game.cities[p.capital]) {
      p.faith -= R.prophetCost(game, p);
      spawnGP(game, p, 'prophet');
    }
  }
  E.foundPantheon = function (game, p, belief) {
    if (p.pantheon || game.pantheonsTaken[belief] || p.faith < R.pantheonCost(game)) return false;
    p.faith -= R.pantheonCost(game);
    p.pantheon = belief; game.pantheonsTaken[belief] = p.id; p.pantheonReady = false;
    // capital starts following a proto-religion (pantheon followers): represented as no religion until founded
    R.computeMods(game, p);
    E.noteAll(game, p.name + ' has founded a pantheon: ' + D.BELIEFS.pantheon[belief].name + '.', null, 'faith');
    return true;
  };
  E.foundReligion = function (game, p, u, relId, founderB, followerB, customName) {
    var c = E.cityAt(game, u.tile);
    if (!c || c.owner !== p.id || p.religion || game.religions[relId]) return false;
    if (Object.keys(game.religions).length >= R.maxReligions(game)) return false;
    game.religions[relId] = { id: relId, name: customName || D.RELIGIONS.filter(function (r) { return r.id === relId; })[0].name, founder: [founderB], follower: [followerB], owner: p.id, holyCity: c.id, enhanced: false };
    game.beliefsTaken[founderB] = relId; game.beliefsTaken[followerB] = relId;
    if (p.mods.extraBelief) {
      var extra = Object.keys(D.BELIEFS.follower).filter(function (b) { return !game.beliefsTaken[b]; });
      if (extra.length) { var eb = game.rng.pick(extra); game.religions[relId].follower.push(eb); game.beliefsTaken[eb] = relId; }
    }
    p.religion = relId;
    c.followers = {}; c.followers[relId] = c.pop;
    E.removeUnit(game, u, 'used');
    R.computeMods(game, p);
    E.noteAll(game, p.name + ' has founded ' + game.religions[relId].name + '!', c.tile, 'faith');
    return true;
  };
  E.enhanceReligion = function (game, p, u, followerB) {
    var rel = game.religions[p.religion];
    if (!rel || rel.enhanced || game.beliefsTaken[followerB]) return false;
    rel.follower.push(followerB); rel.enhanced = true; game.beliefsTaken[followerB] = rel.id;
    E.removeUnit(game, u, 'used');
    E.note(game, p, 'Your religion has been enhanced.', null, 'faith');
    return true;
  };
  function processReligionSpread(game) {
    var cities = Object.keys(game.cities).map(function (k) { return game.cities[k]; });
    var range = 10;
    cities.forEach(function (src) {
      var rel = E.majorityReligion(src); if (!rel || !game.religions[rel]) return;
      var power = 6 + (game.religions[rel].holyCity === src.id ? 24 : 0) + Math.floor(src.pop / 4);
      cities.forEach(function (dst) {
        if (dst === src) return;
        var d = Hex.distance(src.tile, dst.tile);
        if (d > range) return;
        dst.pressure[rel] = (dst.pressure[rel] || 0) + power;
      });
    });
    cities.forEach(function (c) {
      for (var r in c.pressure) {
        var threshold = 100 * R.speedCost(game) * (1 + c.pop / 10);
        while (c.pressure[r] >= threshold) { c.pressure[r] -= threshold; E.addFollowers(c, r, 1); }
      }
      // holy city stays loyal
      for (var rid in game.religions) if (game.religions[rid].holyCity === c.id && (c.followers[rid] || 0) < Math.ceil(c.pop / 2)) E.addFollowers(c, rid, 1);
      // followers can't exceed pop
      var tot = 0; for (r in c.followers) tot += c.followers[r];
      while (tot > c.pop) { var big = null, bn = 0; for (r in c.followers) if (c.followers[r] > bn) { bn = c.followers[r]; big = r; } c.followers[big]--; if (!c.followers[big]) delete c.followers[big]; tot--; }
    });
  }

  // ---------------- Golden ages ----------------
  function processGoldenAge(game, p, net) {
    if (p.gaTurns > 0) {
      p.gaTurns--;
      if (p.gaTurns === 0) E.note(game, p, 'Your Golden Age has ended.', null, 'info');
      return;
    }
    p.gaProgress += net;
    if (p.gaProgress < 0) p.gaProgress = 0;
    if (p.gaProgress >= R.goldenAgeThreshold(game, p)) {
      p.gaProgress = 0;
      startGoldenAge(game, p, true);
    }
  }
  function startGoldenAge(game, p, counts) {
    var len = R.goldenAgeLength(game, p);
    p.gaTurns = Math.max(p.gaTurns, 0) + len;
    if (counts) p.gaCount++;
    E.note(game, p, 'A Golden Age has begun! (' + len + ' turns)', null, 'good');
  }
  E.startGoldenAge = startGoldenAge;

  // ---------------- Great People ----------------
  function processGreatPeople(game, p) {
    var mods = p.mods;
    p.cities.forEach(function (cid) {
      var c = game.cities[cid]; if (!c || !c.gpp) return;
      var gpct = mods.gppPct || 0;
      for (var b in c.buildings) { var bd = D.BUILDINGS[b]; if (bd && bd.gppPct) gpct += bd.gppPct; }
      for (var t in c.gpp) {
        var extra = gpct;
        if (t === 'scientist') extra += mods.scientistGPPct || 0;
        if (t === 'merchant') extra += mods.merchantGPPct || 0;
        if (t === 'artist' || t === 'writer' || t === 'musician') extra += mods.artGPPct || 0;
        p.gpProgress[t] = (p.gpProgress[t] || 0) + c.gpp[t] * (1 + extra / 100);
        p.gpCity = p.gpCity || {}; p.gpCity[t] = cid;
      }
      c.gpp = {};
    });
    for (var t in p.gpProgress) {
      if (t === 'general' || t === 'admiral') continue;
      if (p.gpProgress[t] >= R.gpThreshold(game, p, t)) {
        p.gpProgress[t] -= R.gpThreshold(game, p, t);
        spawnGP(game, p, t, game.cities[p.gpCity && p.gpCity[t]]);
      }
    }
    ['general', 'admiral'].forEach(function (t) {
      if ((p.gpProgress[t] || 0) >= R.gpThreshold(game, p, t)) { p.gpProgress[t] -= R.gpThreshold(game, p, t); spawnGP(game, p, t); }
    });
  }
  function spawnGP(game, p, type, city) {
    var c = city || game.cities[p.capital];
    if (!c) return null;
    var def = D.GREAT_PEOPLE[type]; if (!def) return null;
    p.gpCount[type] = (p.gpCount[type] || 0) + 1;
    if (type === 'prophet') p.prophets++;
    var u = createUnit(game, p, def.unit, c.tile);
    if (u) { G.Units.placeNewUnit(game, u, c); u.moves = 0; }
    E.note(game, p, 'A Great Person has been born: ' + (u ? u.name : '') + ' (' + def.name + ').', c.tile, 'gp');
    return u;
  }
  E.spawnGP = spawnGP;

  // ---------------- Tourism ----------------
  function processTourism(game, p, tourism) {
    tourism += p.mods.tourismFlat || 0;
    if (p.mods.happyToTourism && p.happy > 0) tourism += p.happy * p.mods.happyToTourism / 100;
    p.tourism = tourism;
    if (tourism <= 0) return;
    game.players.forEach(function (o) {
      if (o === p || o.isCS || o.isBarb || !o.alive || !p.met[o.id]) return;
      var mult = 1;
      var r = E.rel(p, o.id);
      if (r.openBorders > 0) mult += 0.25;
      if (game.tradeRoutes.some(function (tr) { var a = game.cities[tr.from], b = game.cities[tr.to]; return a && b && ((a.owner === p.id && b.owner === o.id) || (a.owner === o.id && b.owner === p.id)); })) mult += 0.25;
      if (p.religion && o.cities.some(function (cid) { return game.cities[cid] && E.majorityReligion(game.cities[cid]) === p.religion; })) mult += 0.15;
      p.tourismTo[o.id] = (p.tourismTo[o.id] || 0) + tourism * mult;
    });
  }
  E.influence = function (game, p, o) {
    var t = p.tourismTo[o.id] || 0, c = Math.max(1, o.totalCulture);
    return t / c;
  };
  E.influenceLevel = function (r) {
    if (r >= 2) return 'Dominant'; if (r >= 1) return 'Influential'; if (r >= 0.6) return 'Popular'; if (r >= 0.3) return 'Familiar'; if (r >= 0.1) return 'Exotic'; return 'Unknown';
  };

  // ---------------- City-states ----------------
  function processCityState(game, cs) {
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb && q.alive; });
    var best = null, bestInf = 59;
    majors.forEach(function (q) {
      var inf = cs.csInfluence[q.id] || 0;
      var resting = (q.mods.csResting || 0);
      if (q.religion && cs.cities.some(function (cid) { return game.cities[cid] && E.majorityReligion(game.cities[cid]) === q.religion; })) resting += q.mods.csResting ? 0 : 0;
      if (E.atWar(game, cs.id, q.id)) { cs.csInfluence[q.id] = Math.min(inf, -60); return; }
      var decay = 1 * (1 + (q.mods.csDecayPct || 0) / 100);
      if (inf > resting) inf = Math.max(resting, inf - decay);
      else if (inf < resting) inf = Math.min(resting, inf + 1);
      cs.csInfluence[q.id] = inf;
      if (inf > bestInf) { bestInf = inf; best = q; }
    });
    var prevAlly = cs.ally;
    cs.ally = best ? best.id : null;
    if (prevAlly !== cs.ally) {
      if (best) E.note(game, best, cs.name + ' is now your ally!', game.cities[cs.capital] && game.cities[cs.capital].tile, 'diplo');
      if (prevAlly != null && game.players[prevAlly]) E.note(game, game.players[prevAlly], 'You are no longer allied with ' + cs.name + '.', null, 'bad');
    }
    // militaristic gifts
    var ct = D.CS_TYPES[cs.csType];
    majors.forEach(function (q) {
      var inf = cs.csInfluence[q.id] || 0;
      var lvl = inf >= 60 && cs.ally === q.id ? 'ally' : inf >= 30 ? 'friend' : null;
      if (cs.csType === 'militaristic' && lvl) {
        var every = ct[lvl].unitEvery;
        if (game.turn % every === 0 && game.cities[q.capital]) {
          var best2 = 'warrior';
          ['spearman', 'swordsman', 'pikeman', 'longswordsman', 'musketman', 'rifleman', 'great_war_infantry', 'infantry', 'mechanized_infantry'].forEach(function (ut) { if (q.techs[D.UNITS[ut].tech] && (!D.UNITS[ut].res)) best2 = ut; });
          var cap = game.cities[q.capital];
          var nu = createUnit(game, q, R.civUnit(q, best2), cap.tile); if (nu) G.Units.placeNewUnit(game, nu, cap);
          E.note(game, q, cs.name + ' has gifted you a ' + D.UNITS[nu.type].name + '.', cap.tile, 'diplo');
        }
      }
    });
  }
  function computeCSBonuses(game) {
    game.players.forEach(function (q) { if (!q.isCS && !q.isBarb) q.csBonus = { food: 0, culture: 0, happy: 0, faith: 0, gold: 0, science: 0 }; });
    game.players.forEach(function (cs) {
      if (!cs.isCS || !cs.alive) return;
      var ct = D.CS_TYPES[cs.csType];
      game.players.forEach(function (q) {
        if (q.isCS || q.isBarb || !q.alive) return;
        var inf = cs.csInfluence[q.id] || 0;
        var lvl = (inf >= 60 && cs.ally === q.id) ? 'ally' : inf >= 30 ? 'friend' : null;
        if (!lvl) return;
        var b = ct[lvl], mult = 1 + (q.mods.csBonusPct || 0) / 100, era = 1 + E.eraOf(q) * 0.5;
        if (b.capFood) q.csBonus.food += b.capFood * mult;
        if (b.culture) q.csBonus.culture += b.culture * mult * era;
        if (b.happy) q.csBonus.happy += b.happy * mult;
        if (b.faith) q.csBonus.faith += b.faith * mult * era;
        if (q.mods.csGold && lvl === 'ally') q.csBonus.gold += q.mods.csGold;
        if (q.mods.csScience && lvl === 'ally') {
          var s = 0; cs.cities.forEach(function (cid) { var c = game.cities[cid]; if (c && c.lastYields) s += c.lastYields.s; });
          q.csBonus.science += s * q.mods.csScience / 100;
        }
      });
    });
  }
  E.computeCSBonuses = computeCSBonuses;
  E.giftGold = function (game, p, cs, amount) {
    if (p.gold < amount) return 0;
    p.gold -= amount;
    var inf = Math.round(Math.pow(amount, 0.85) / (1 + E.eraOf(p) * 0.15) * (1 + (p.mods.csGiftPct || 0) / 100) * 0.5);
    cs.csInfluence[p.id] = (cs.csInfluence[p.id] || 0) + inf;
    return inf;
  };

  // ---------------- Barbarians ----------------
  function processBarbarians(game) {
    if (!game.options.barbarians) return;
    var barb = game.players.filter(function (p) { return p.isBarb; })[0];
    if (!barb) return;
    var m = game.map, n = m.W * m.H;
    var camps = [];
    for (var t = 0; t < n; t++) if (m.imp[t] === IDS.imp.map.barb_camp) camps.push(t);
    var maxCamps = Math.floor(n / 300);
    var interval = Math.max(2, Math.round(4 * R.speedCost(game)));
    if (game.turn >= Math.round(12 * R.speedCost(game)) && game.turn % interval === 0 && camps.length < maxCamps) {
      for (var tries = 0; tries < 40; tries++) {
        t = game.rng.int(n);
        if (!MG.isLand(m, t) || m.terrain[t] === IDS.terrain.map.mountain || m.owner[t] >= 0 || m.res[t] || m.nw[t] || m.hut[t]) continue;
        var seen = game.players.some(function (p) { return !p.isBarb && p.visible[t]; });
        if (seen) continue;
        var near = false; for (var id in game.cities) if (Hex.distance(game.cities[id].tile, t) < 8) { near = true; break; }
        if (!near) for (var pi = 0; pi < game.players.length; pi++) { var st = game.players[pi].startTile; if (st != null && Hex.distance(st, t) < 9) { near = true; break; } }
        if (near) continue;
        if (E.unitsAt(game, t).length) continue;
        m.imp[t] = IDS.imp.map.barb_camp; camps.push(t);
        spawnBarbUnit(game, barb, t);
        break;
      }
    }
    var spawnEvery = Math.max(4, Math.round(8 * R.speedCost(game)));
    camps.forEach(function (ct) {
      if ((game.turn + ct) % spawnEvery === 0) {
        var count = barb.units.filter(function (uid) { var u = game.units[uid]; return u && Hex.distance(u.tile, ct) < 6; }).length;
        if (count < 3) spawnBarbUnit(game, barb, ct);
      }
    });
  }
  function spawnBarbUnit(game, barb, t) {
    // best unit by average era of majors
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb && q.alive; });
    var avgEra = majors.reduce(function (s, q) { return s + E.eraOf(q); }, 0) / Math.max(1, majors.length);
    var pool = avgEra < 1 ? ['warrior', 'archer', 'spearman', 'horseman'] : avgEra < 2 ? ['spearman', 'swordsman', 'archer', 'horseman', 'composite_bowman'] : avgEra < 3 ? ['pikeman', 'longswordsman', 'crossbowman', 'knight'] : avgEra < 4 ? ['musketman', 'crossbowman', 'lancer'] : ['rifleman', 'gatling_gun', 'cavalry'];
    var spot = t;
    var occ = E.unitsAt(game, t).length > 0;
    if (occ) { var nb = Hex.neighbors(t).filter(function (z) { return MG.isLand(game.map, z) && game.map.terrain[z] !== IDS.terrain.map.mountain && !E.unitsAt(game, z).length && game.map.owner[z] < 0; }); if (!nb.length) return; spot = nb[0]; }
    // naval barbarians near coast
    var u = createUnit(game, barb, game.rng.pick(pool), spot);
    if (u) u.moves = 0;
  }

  // ---------------- Victory ----------------
  function declareVictory(game, p, type) {
    if (game.victory || game.continueAfterVictory) return;
    game.victory = { winner: p.id, type: type, turn: game.turn };
    E.noteAll(game, p.name + ' has won a ' + type.charAt(0).toUpperCase() + type.slice(1) + ' Victory!', null, 'world');
    E.emit({ type: 'gameOver', victory: game.victory });
  }
  E.declareVictory = declareVictory;
  function checkDomination(game) {
    if (game.victory || !game.options.victories.domination) return;
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb; });
    majors.forEach(function (p) {
      if (!p.alive) return;
      var ok = majors.every(function (o) {
        if (o === p) return true;
        // owns o's original capital or o eliminated without one
        for (var id in game.cities) { var c = game.cities[id]; if (c.originalCapital && c.origCapOf === o.id) return c.owner === p.id; }
        return !o.alive;
      });
      // also need to own own capital
      if (ok && majors.length > 1) declareVictory(game, p, 'domination');
    });
  }
  E.checkDomination = checkDomination;
  function checkVictories(game) {
    if (game.victory) return;
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb && q.alive; });
    // culture (tourism influence over all)
    if (game.options.victories.culture) majors.forEach(function (p) {
      if (game.victory) return;
      var others = majors.filter(function (o) { return o !== p; });
      if (others.length && others.every(function (o) { return E.influence(game, p, o) >= 1; })) declareVictory(game, p, 'culture');
    });
    // diplomatic
    if (game.un && game.options.victories.diplomatic && game.turn >= game.un.nextVote) {
      game.un.nextVote = game.turn + Math.round(10 * R.speedCost(game));
      var votes = {}, total = 0;
      majors.forEach(function (p) {
        var v = 1 + (p.id === game.un.founder ? 2 : 0);
        total += v;
        var choice = p.isHuman ? (p.unVote != null ? p.unVote : p.id) : (G.AI ? G.AI.unVote(game, p, majors) : p.id);
        votes[choice] = (votes[choice] || 0) + v;
      });
      game.players.forEach(function (cs) { if (cs.isCS && cs.alive) { total++; if (cs.ally != null) votes[cs.ally] = (votes[cs.ally] || 0) + 1; } });
      var need = Math.ceil(total * 0.55);
      var lines = [];
      for (var k in votes) lines.push(game.players[k].name + ': ' + votes[k]);
      E.noteAll(game, 'World Leader vote (' + need + ' needed): ' + lines.join(', '), null, 'world');
      for (k in votes) if (votes[k] >= need) { declareVictory(game, game.players[k], 'diplomatic'); break; }
    }
    // time
    if (!game.victory && game.turn >= D.SPEEDS[game.speed].turns && game.options.victories.time) {
      var best = null; majors.forEach(function (p) { E.score(game, p); if (!best || p.score > best.score) best = p; });
      if (best) declareVictory(game, best, 'time');
    }
    // last civ standing
    if (!game.victory && majors.length === 1 && game.players.filter(function (q) { return !q.isCS && !q.isBarb; }).length > 1) declareVictory(game, majors[0], 'domination');
  }
  E.score = function (game, p) {
    var s = 0, pop = 0, land = 0;
    p.cities.forEach(function (cid) { var c = game.cities[cid]; if (c) { pop += c.pop; } });
    for (var t = 0; t < game.map.owner.length; t++) if (game.map.owner[t] === p.id) land++;
    var nt = Object.keys(p.techs).length + (p.futureTechs || 0);
    s = p.cities.length * 8 + pop * 4 + Math.floor(land / 5) + nt * 4 + p.wonders.length * 25 + (p.numPolicies || 0) * 4 + (p.futureTechs || 0) * 10;
    p.score = s;
    return s;
  };

  // ---------------- End turn ----------------
  // Runs AI players and world processing, then starts the human's next turn.
  E.endTurn = function (game, onProgress) {
    if (game.victory && game.victory.type === 'defeat') return;
    for (var i = 0; i < game.players.length; i++) { E.runAI(game, i); if (onProgress) onProgress(i / game.players.length, game.players[i]); }
    E.finishTurn(game);
  };
  // Run one AI player's turn (no-op for humans/dead)
  E.runAI = function (game, i) {
    var p = game.players[i];
    if (!p || p.isHuman || !p.alive) return false;
    startTurn(game, p);
    if (G.AI) G.AI.playTurn(game, p);
    return true;
  };
  // World processing after all players have moved; starts the next human turn
  E.finishTurn = function (game) {
    var humans = game.players.filter(function (p) { return p.isHuman; });
    processReligionSpread(game);
    game.tradeRoutes.forEach(function (r) { r.turns--; });
    var expired = game.tradeRoutes.filter(function (r) { return r.turns <= 0; });
    game.tradeRoutes = game.tradeRoutes.filter(function (r) { return r.turns > 0; });
    expired.forEach(function (r) {
      var o = game.players[r.owner], c = game.cities[r.from];
      if (o && o.alive && c && c.owner === o.id) { var u = createUnit(game, o, r.unitType, c.tile); if (u) G.Units.placeNewUnit(game, u, c); E.note(game, o, 'A trade route from ' + c.name + ' has expired. The ' + D.UNITS[r.unitType].name + ' is available again.', c.tile, 'info'); }
    });
    computeCSBonuses(game);
    processBarbarians(game);
    game.players.forEach(function (p) { if (!p.isCS && !p.isBarb && p.alive) E.score(game, p); });
    game.turn++;
    checkVictories(game);
    humans.forEach(function (h) { startTurn(game, h); });
    E.emit({ type: 'newTurn', turn: game.turn });
  };

  // Year display (Civ V-style calendar scaled by speed)
  E.yearOf = function (game) {
    var sp = R.speedCost(game);
    var t = game.turn / sp;
    var bands = [[75, 40], [60, 25], [25, 20], [60, 10], [50, 5], [50, 2], [120, 1], [9999, 0.5]];
    var y = -4000;
    for (var i = 0; i < bands.length; i++) {
      var take = Math.min(t, bands[i][0]);
      y += take * bands[i][1];
      t -= take;
      if (t <= 0) break;
    }
    y = Math.round(y);
    return y < 0 ? (-y) + ' BC' : (y === 0 ? '1 AD' : y + ' AD');
  };

  return E;
})();
