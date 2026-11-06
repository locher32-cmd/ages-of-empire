// ============================================================
//  Rules: yields, costs, modifiers. Pure functions over game state.
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

// Register unique units/buildings from civ data
(function finalizeData() {
  var D = G.D;
  for (var cid in D.CIVS) {
    var civ = D.CIVS[cid];
    ['uu', 'uu2'].forEach(function (key) {
      var u = civ[key]; if (!u) return;
      var base = D.UNITS[u.base]; if (!base) return;
      var id = cid + '_' + key;
      var o = JSON.parse(JSON.stringify(base));
      for (var k in u) if (k !== 'base' && k !== 'desc') o[k] = u[k];
      if (u.flags) o.flags = (base.flags || []).concat(u.flags);
      if (u.res === null) delete o.res;
      if (u.cls === 'gun' || u.cls === 'melee' || u.cls === 'mounted') { if (!u.rs) { delete o.rs; delete o.range; } }
      o.id = id; o.replaces = u.base; o.unique = cid; o.uniqueDesc = u.desc || '';
      D.UNITS[id] = o; civ[key + 'Id'] = id;
    });
    if (civ.ub) {
      var b = D.BUILDINGS[civ.ub.base];
      if (b) {
        var ob = JSON.parse(JSON.stringify(b));
        var add = civ.ub.add || {};
        ob.name = civ.ub.name; ob.id = cid + '_ub'; ob.replaces = civ.ub.base; ob.unique = cid;
        if (add.y) { ob.y = ob.y || {}; for (var yk in add.y) ob.y[yk] = (ob.y[yk] || 0) + add.y[yk]; }
        if (add.pct) { ob.pct = ob.pct || {}; for (yk in add.pct) ob.pct[yk] = (ob.pct[yk] || 0) + add.pct[yk]; }
        ['happy', 'def', 'hp', 'xp'].forEach(function (k) { if (add[k]) ob[k] = (ob[k] || 0) + add[k]; });
        D.BUILDINGS[ob.id] = ob; civ.ubId = ob.id;
      }
    }
  }
  // tech -> what it unlocks (for UI and AI)
  D.TECH_UNLOCKS = {};
  for (var t in D.TECHS) D.TECH_UNLOCKS[t] = { units: [], buildings: [], wonders: [], imps: [] };
  for (var u in D.UNITS) if (D.UNITS[u].tech && !D.UNITS[u].unique) D.TECH_UNLOCKS[D.UNITS[u].tech].units.push(u);
  for (var bb in D.BUILDINGS) if (D.BUILDINGS[bb].tech && !D.BUILDINGS[bb].unique) D.TECH_UNLOCKS[D.BUILDINGS[bb].tech].buildings.push(bb);
  for (var w in D.WONDERS) if (D.WONDERS[w].tech) D.TECH_UNLOCKS[D.WONDERS[w].tech].wonders.push(w);
  for (var im in D.IMPROVEMENTS) if (D.IMPROVEMENTS[im].tech && !D.IMPROVEMENTS[im].unique) D.TECH_UNLOCKS[D.IMPROVEMENTS[im].tech].imps.push(im);
  // Tech -> trade route capacity
  D.TRADE_TECHS = ['pottery', 'sailing', 'engineering', 'compass', 'banking', 'biology', 'penicillin'];
})();

G.Rules = (function () {
  var D = G.D, IDS = G.IDS, Hex = G.Hex;

  function addY(a, b, mult) { mult = mult || 1; for (var k in b) a[k] = (a[k] || 0) + b[k] * mult; return a; }
  function terrainKey(m, i) { return IDS.terrain.list[m.terrain[i]]; }
  function featureKey(m, i) { return IDS.feature.list[m.feature[i]]; }
  function resKey(m, i) { return IDS.res.list[m.res[i]]; }
  function impKey(m, i) { return IDS.imp.list[m.imp[i]]; }
  function isWater(m, i) { return !!D.TERRAIN[terrainKey(m, i)].water; }

  // Base yield of tile from nature only (no improvements, no tech); used for site scoring
  function tileBaseYield(m, i) {
    var tk = terrainKey(m, i), fk = featureKey(m, i);
    var y = {};
    if (m.nw[i]) { addY(y, D.NATURAL_WONDERS[IDS.nw.list[m.nw[i]]].y); delete y.h; return y; }
    if (tk === 'mountain') return y;
    if (m.hills[i]) addY(y, D.HILLS.y); else addY(y, D.TERRAIN[tk].y);
    if (fk) {
      var f = D.FEATURES[fk];
      if (f.replaceYield) { y = {}; addY(y, f.y); }
      else addY(y, f.y);
    }
    if (m.res[i]) addY(y, D.RESOURCES[resKey(m, i)].y);
    for (var k in y) if (y[k] < 0) y[k] = 0;
    return y;
  }

  function hasTech(p, t) { return !t || !!p.techs[t]; }
  function resVisible(p, rk) { var r = D.RESOURCES[rk]; return !r.tech || hasTech(p, r.tech); }

  function freshWater(m, i) {
    if (m.river[i]) return true;
    var nb = Hex.neighbors(i);
    for (var q = 0; q < nb.length; q++) { var t = nb[q]; if (terrainKey(m, t) === 'lake' || featureKey(m, t) === 'oasis' || m.nw[t] === IDS.nw.map.lake_victoria) return true; }
    return false;
  }

  // Full yield of a tile for a player (city may be null)
  function tileYield(game, i, p, city) {
    var m = game.map, tk = terrainKey(m, i), fk = featureKey(m, i), y = {};
    var mods = p ? p.mods : {};
    if (m.nw[i]) {
      var nw = D.NATURAL_WONDERS[IDS.nw.list[m.nw[i]]];
      addY(y, nw.y); delete y.h;
      if (mods.nwFaith) y.fa = (y.fa || 0) + mods.nwFaith;
      return y;
    }
    if (tk === 'mountain') return y;
    if (m.hills[i]) addY(y, D.HILLS.y); else addY(y, D.TERRAIN[tk].y);
    if (fk) { var f = D.FEATURES[fk]; if (f.replaceYield) { y = {}; addY(y, f.y); } else addY(y, f.y); }
    var rk = m.res[i] ? resKey(m, i) : null;
    var ik = m.imp[i] ? impKey(m, i) : null;
    var pill = m.pillaged[i];
    if (rk && (!p || resVisible(p, rk))) {
      addY(y, D.RESOURCES[rk].y);
      var rimp = D.RESOURCES[rk].imp;
      if (ik === rimp && !pill) {
        // improved resource bonus (Civ V: improving a resource adds the improvement's yields)
        var bonus = { farm: { f: 1 }, mine: { p: 1 }, pasture: { p: 1 }, plantation: { g: 1 }, camp: { g: 1 }, quarry: { p: 1 }, fishing_boats: { f: 1 }, oil_well: { p: 3 }, offshore_platform: { p: 3 } }[rimp];
        if (bonus) addY(y, bonus);
        if (rk === 'wheat' || rk === 'bananas' || rk === 'deer') { /* granary handled in city */ }
      }
    }
    if (ik && !pill && D.IMPROVEMENTS[ik]) {
      var imp = D.IMPROVEMENTS[ik];
      if (!imp.resOnly) addY(y, imp.y);
      if (imp.techY && p) imp.techY.forEach(function (ty) {
        if (hasTech(p, ty[0]) && (ty[2] !== 'fresh' || freshWater(m, i))) addY(y, ty[1]);
      });
      if (ik === 'farm' && freshWater(m, i) && p && !hasTech(p, 'civil_service')) { /* +1 after Civil Service */ }
      if (imp.gp && mods.gpImprovementBonus) { for (var yk in imp.y) y[yk] += mods.gpImprovementBonus; }
      if (imp.gp && mods.gpImprovementGold) y.g = (y.g || 0) + mods.gpImprovementGold;
      if (ik === 'mine' && mods.mineProd) y.p = (y.p || 0) + mods.mineProd;
      if (ik === 'quarry' && mods.quarryFaith) y.fa = (y.fa || 0) + mods.quarryFaith;
      if (ik === 'plantation' && mods.plantationCulture) y.c = (y.c || 0) + mods.plantationCulture;
      if (ik === 'pasture' && mods.pastureCulture) y.c = (y.c || 0) + mods.pastureCulture;
      if (ik === 'farm' && city && city.buildings.supermarket) y.f = (y.f || 0) + 1;
      if (ik === 'trading_post' && mods.sciPctHappy && p.techs.scientific_theory) y.s = (y.s || 0) + 1;
    }
    if (p) {
      if (isWater(m, i) && tk !== 'lake') {
        if (mods.seaProd) y.p = (y.p || 0) + mods.seaProd;
        if (mods.coastFood && tk === 'coast') y.f = (y.f || 0) + mods.coastFood;
      }
      if (tk === 'desert' && !m.hills[i] && fk !== 'floodplains') { if (mods.desertFaith) y.fa = (y.fa || 0) + mods.desertFaith; }
      if (tk === 'desert' && ik === 'mine' && mods.desertGold) y.g = (y.g || 0) + mods.desertGold;
      if (tk === 'tundra' && mods.tundraFood) y.f = (y.f || 0) + mods.tundraFood;
      if (fk === 'jungle' && mods.jungleCulture) y.c = (y.c || 0) + mods.jungleCulture;
      if (fk === 'forest' && mods.forestFaith) y.fa = (y.fa || 0) + (rkIs(rk, null) ? 0 : 0) + mods.forestFaith * 0.5;
      if (m.hills[i] && mods.hillsFaith) y.fa = (y.fa || 0) + mods.hillsFaith;
      if (rk && mods.idols && (rk === 'gold_ore' || rk === 'silver')) { y.c = (y.c || 0) + 1; y.fa = (y.fa || 0) + 1; }
      if (rk && mods.luxFaith && (rk === 'wine' || rk === 'incense')) { y.c = (y.c || 0) + 1; y.fa = (y.fa || 0) + 1; }
    }
    if (city) {
      var cb = cityBuildingDefs(city);
      for (var b = 0; b < cb.length; b++) {
        var bd = cb[b];
        if (bd.seaY && isWater(m, i) && tk !== 'lake' && !m.nw[i]) addY(y, bd.seaY);
        if (bd.desertY && tk === 'desert' && !m.hills[i]) addY(y, bd.desertY);
        if (bd.resY && rk && bd.resY[rk] && ik === D.RESOURCES[rk].imp) addY(y, bd.resY[rk]);
        if (bd.jungleS && fk === 'jungle') y.s = (y.s || 0) + bd.jungleS;
      }
      // wonders' local effects (Colossus etc.)
      for (var wi = 0; wi < city.wonders.length; wi++) {
        var wd = D.WONDERS[city.wonders[wi]];
        if (wd.local && wd.local.seaY && isWater(m, i) && tk !== 'lake') addY(y, wd.local.seaY);
        if (wd.local && wd.local.desertY && tk === 'desert' && !m.hills[i]) addY(y, wd.local.desertY);
      }
      // Golden age: +1 prod on tiles with prod, +1 gold on tiles with gold
      if (p && p.gaTurns > 0) { if (y.p >= 1) y.p += 1; if (y.g >= 1) y.g += 1; }
    }
    if (m.road[i] === 2 && y.p) { /* railroad gives city bonus elsewhere */ }
    if (fk === 'fallout') { y = { f: 0, p: 0, g: 0 }; }
    for (var k in y) if (y[k] < 0) y[k] = 0;
    return y;
  }
  function rkIs() { return false; }

  function cityBuildingDefs(city) {
    var out = [];
    for (var b in city.buildings) { var d = D.BUILDINGS[b]; if (d) out.push(d); }
    return out;
  }

  // ---- Growth / costs (Civ V formulas, scaled by speed) ----
  function foodToGrow(game, pop) {
    var base = 15 + 6 * (pop - 1) + Math.pow(pop - 1, 1.8);
    return Math.floor(base * D.SPEEDS[game.speed].growth / 100);
  }
  function speedCost(game) { return D.SPEEDS[game.speed].cost / 100; }
  function techCost(game, p, tid) {
    var t = D.TECHS[tid];
    var c = t.cost * speedCost(game) * 0.9;
    // map size: larger maps cost a bit more (Civ V uses ~+0-30%)
    if (tid === 'future_tech') c *= 1 + 0.1 * (p.futureTechs || 0);
    // AI difficulty discount
    if (!p.isHuman && !p.isCS) c *= 1 - D.DIFFICULTIES[game.difficulty].aiBonus / 200;
    // known by other civs discount (Civ V: research discount per civ that knows it, up to ~30%)
    var known = 0, total = 0;
    for (var j = 0; j < game.players.length; j++) { var o = game.players[j]; if (o.isCS || o.isBarb || !o.alive || o === p) continue; total++; if (o.techs[tid] && p.met && p.met[o.id]) known++; }
    if (total) c *= 1 - 0.3 * known / (total + 1);
    return Math.max(1, Math.round(c));
  }
  function policyCost(game, p) {
    var k = p.numPolicies || 0;
    var base = Math.floor(25 + Math.pow(3 * k, 2.01));
    var nc = p.cities.filter(function (cid) { var c = game.cities[cid]; return c && !c.puppet; }).length;
    var cityMod = D.MAP_SIZES[game.size].policyMod * (1 + (p.mods.policyCityPct || 0) / 100);
    var cost = base * (1 + cityMod * Math.max(0, nc - 1));
    cost *= speedCost(game);
    cost *= 1 + (p.mods.policyCostPct || 0) / 100;
    if (!p.isHuman && !p.isCS) cost *= 1 - D.DIFFICULTIES[game.difficulty].aiBonus / 300;
    return Math.max(5, Math.floor(cost / 5) * 5);
  }
  function borderCost(game, city, p) {
    var t = city.cultureLevel || 0;
    var cost = 20 + Math.pow(10 * t, 1.1);
    cost *= speedCost(game);
    var pct = (p.mods.borderCostPct || 0) + (city.capital ? (p.mods.capBorderPct || 0) : 0);
    cost *= 1 + pct / 100;
    return Math.max(5, Math.floor(cost));
  }
  function productionCost(game, p, kind, id) {
    var base;
    if (kind === 'unit') base = D.UNITS[id].cost;
    else if (kind === 'building') base = D.BUILDINGS[id].cost;
    else if (kind === 'wonder') base = D.WONDERS[id].cost;
    else if (kind === 'space') base = D.SPACESHIP[id].cost;
    else return 0;
    var c = base * speedCost(game);
    if (kind === 'building' && D.BUILDINGS[id].national) {
      // National wonders cost more per city (Civ V)
      c *= 1 + 0.25 * Math.max(0, p.cities.length - 1);
    }
    if (!p.isHuman && !p.isCS && !p.isBarb) c *= 1 - D.DIFFICULTIES[game.difficulty].aiBonus / 200;
    return Math.max(1, Math.round(c));
  }
  function purchaseCost(game, p, city, kind, id) {
    if (kind === 'wonder' || kind === 'process') return -1;
    var prod = productionCost(game, p, kind, id);
    var have = 0;
    if (city.build && city.build.kind === kind && city.build.id === id) have = city.prod;
    var remaining = Math.max(1, prod - have);
    var g = Math.pow(remaining * 30 / speedCost(game), 0.75) * speedCost(game);
    if (kind === 'building') g *= 1.0;
    if (kind === 'unit') g *= 1 + (p.mods.unitPurchasePct || 0) / 100;
    g *= 1 + (p.mods.purchasePct || 0) / 100;
    return Math.round(g / 5) * 5;
  }
  function tileBuyCost(game, city, p) {
    var owned = city.tilesBought || 0;
    var c = (50 + 5 * (city.cultureLevel || 0) + 10 * owned) * speedCost(game);
    c *= 1 + (p.mods.tileBuyPct || 0) / 100;
    return Math.round(c);
  }
  function gpThreshold(game, p, type) {
    var n = (p.gpCount && p.gpCount[type]) || 0;
    var base = (type === 'general' || type === 'admiral') ? 200 : 100;
    var c = base * (1 + n * (type === 'general' || type === 'admiral' ? 0.5 : 1));
    return Math.round(c * speedCost(game));
  }
  function goldenAgeThreshold(game, p) {
    var c = (500 + 250 * (p.gaCount || 0)) * (1 + 0.02 * Math.max(0, p.cities.length - 1));
    return Math.round(c * speedCost(game));
  }
  function goldenAgeLength(game, p) {
    var len = 10 * (1 + (p.mods.goldenAgeLenPct || 0) / 100);
    return Math.max(4, Math.round(len * Math.min(2.5, speedCost(game))));
  }
  function pantheonCost(game) { return Math.round((10 + 5 * Object.keys(game.pantheonsTaken).length) * speedCost(game)); }
  function prophetCost(game, p) { return Math.round((200 + 100 * (p.prophets || 0)) * speedCost(game)); }
  function maxReligions(game) {
    var majors = game.players.filter(function (q) { return !q.isCS && !q.isBarb; }).length;
    return Math.min(D.RELIGIONS.length, Math.floor(majors / 2) + 1);
  }
  function upgradeCost(game, p, fromId, toId) {
    var diff = Math.max(0, D.UNITS[toId].cost - D.UNITS[fromId].cost);
    var c = (10 + diff * 2) * speedCost(game);
    c *= 1 + (p.mods.upgradePct || 0) / 100;
    return Math.round(c);
  }

  // ---- Modifiers aggregation ----
  function mergeFx(mods, fx) {
    if (!fx) return;
    for (var k in fx) {
      var v = fx[k];
      if (typeof v === 'number') mods[k] = (mods[k] || 0) + v;
      else if (typeof v === 'boolean') mods[k] = mods[k] || v;
      else if (typeof v === 'object') { mods[k] = mods[k] || {}; for (var kk in v) mods[k][kk] = (mods[k][kk] || 0) + v[kk]; }
      else mods[k] = v;
    }
  }
  function computeMods(game, p) {
    var mods = {};
    if (p.civ && D.CIVS[p.civ]) mergeFx(mods, D.CIVS[p.civ].trait.fx);
    for (var tr in p.trees) {
      var tree = D.POLICY_TREES[tr];
      if (!tree) continue;
      mergeFx(mods, tree.opener.fx);
      if (p.trees[tr] === 'done') mergeFx(mods, tree.finisher.fx);
    }
    for (var pol in p.policies) { var pd = findPolicy(pol); if (pd) mergeFx(mods, pd.fx); }
    (p.wonders || []).forEach(function (w) { var wd = D.WONDERS[w]; if (wd && wd.fx) mergeFx(mods, wd.fx); });
    if (p.pantheon) mergeFx(mods, D.BELIEFS.pantheon[p.pantheon].fx);
    if (p.religion && game.religions[p.religion]) {
      game.religions[p.religion].founder.forEach(function (b) { mergeFx(mods, D.BELIEFS.founder[b].fx); });
    }
    p.mods = mods;
    return mods;
  }
  function findPolicy(id) {
    for (var tr in D.POLICY_TREES) { var t = D.POLICY_TREES[tr]; if (t.policies[id]) return t.policies[id]; }
    return null;
  }
  function policyTreeOf(id) { for (var tr in D.POLICY_TREES) if (D.POLICY_TREES[tr].policies[id]) return tr; return null; }

  // Unit definition for a player's unit type id
  function unitDef(id) { return D.UNITS[id]; }
  // The unit a civ builds in place of base id (unique units)
  function civUnit(p, baseId) {
    if (!p || !p.civ) return baseId;
    var civ = D.CIVS[p.civ];
    if (!civ) return baseId;
    if (civ.uuId && D.UNITS[civ.uuId].replaces === baseId) return civ.uuId;
    if (civ.uu2Id && D.UNITS[civ.uu2Id].replaces === baseId) return civ.uu2Id;
    return baseId;
  }
  function civBuilding(p, baseId) {
    if (!p || !p.civ) return baseId;
    var civ = D.CIVS[p.civ];
    if (civ && civ.ubId && D.BUILDINGS[civ.ubId].replaces === baseId) return civ.ubId;
    return baseId;
  }
  function baseBuilding(id) { var b = D.BUILDINGS[id]; return (b && b.replaces) || id; }
  function hasBuilding(city, baseId) {
    if (city.buildings[baseId]) return true;
    for (var b in city.buildings) if (D.BUILDINGS[b] && D.BUILDINGS[b].replaces === baseId) return true;
    return false;
  }

  return {
    addY: addY, tileBaseYield: tileBaseYield, tileYield: tileYield, freshWater: freshWater, hasTech: hasTech, resVisible: resVisible,
    foodToGrow: foodToGrow, techCost: techCost, policyCost: policyCost, borderCost: borderCost, productionCost: productionCost,
    purchaseCost: purchaseCost, tileBuyCost: tileBuyCost, gpThreshold: gpThreshold, goldenAgeThreshold: goldenAgeThreshold,
    goldenAgeLength: goldenAgeLength, pantheonCost: pantheonCost, prophetCost: prophetCost, maxReligions: maxReligions, upgradeCost: upgradeCost,
    computeMods: computeMods, mergeFx: mergeFx, findPolicy: findPolicy, policyTreeOf: policyTreeOf, unitDef: unitDef, civUnit: civUnit, civBuilding: civBuilding,
    baseBuilding: baseBuilding, hasBuilding: hasBuilding, terrainKey: terrainKey, featureKey: featureKey, resKey: resKey, impKey: impKey, isWater: isWater,
    cityBuildingDefs: cityBuildingDefs, speedCost: speedCost
  };
})();
