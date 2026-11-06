// ============================================================
//  Diplomacy: war, peace, open borders, trades, opinions
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Diplo = (function () {
  var D = G.D, E = G.Engine, R = G.Rules, Hex = G.Hex;
  var Dp = {};

  Dp.declareWar = function (game, p, o) {
    if (p === o || E.atWar(game, p.id, o.id)) return false;
    var r1 = E.rel(p, o.id), r2 = E.rel(o, p.id);
    r1.war = true; r2.war = true; r1.warSince = r2.warSince = game.turn;
    r1.openBorders = 0; r2.openBorders = 0;
    r2.opinion -= 40;
    // backstab penalty if recent peace treaty
    if (r1.peaceUntil > game.turn) { game.players.forEach(function (q) { if (!q.isCS && !q.isBarb && q !== p) E.rel(q, p.id).opinion -= 20; }); }
    // others dislike warmongers a bit
    game.players.forEach(function (q) { if (!q.isCS && !q.isBarb && q !== p && q !== o && q.met[p.id]) E.rel(q, p.id).opinion -= 5; });
    // trades cancelled
    cancelDeals(game, p, o);
    // city-state allies join
    if (o.isCS) { o.csInfluence[p.id] = -60; }
    else game.players.forEach(function (cs) { if (cs.isCS && cs.alive && cs.ally === o.id && !E.atWar(game, cs.id, p.id)) { var a = E.rel(cs, p.id), b = E.rel(p, cs.id); a.war = b.war = true; } });
    E.noteAll(game, p.name + ' has declared war on ' + o.name + '!', null, 'war');
    E.emit({ type: 'war', a: p.id, b: o.id });
    return true;
  };
  function cancelDeals(game, p, o) {
    [p, o].forEach(function (x) {
      x.imports = (x.imports || []).filter(function (d) { return d.from !== p.id && d.from !== o.id; });
      x.exports = (x.exports || []).filter(function (d) { return d.to !== p.id && d.to !== o.id; });
      x.gptDeals = (x.gptDeals || []).filter(function (d) { return d.with !== p.id && d.with !== o.id; });
    });
    game.tradeRoutes = game.tradeRoutes.filter(function (tr) {
      var a = game.cities[tr.from], b = game.cities[tr.to];
      return !(a && b && ((a.owner === p.id && b.owner === o.id) || (a.owner === o.id && b.owner === p.id)));
    });
  }
  Dp.makePeace = function (game, p, o) {
    if (!E.atWar(game, p.id, o.id)) return false;
    var r1 = E.rel(p, o.id), r2 = E.rel(o, p.id);
    r1.war = r2.war = false;
    r1.peaceUntil = r2.peaceUntil = game.turn + Math.round(10 * Math.min(2, R.speedCost(game)));
    // expel units from each other's territory
    [p, o].forEach(function (a) {
      var b = a === p ? o : p;
      a.units.slice().forEach(function (uid) {
        var u = game.units[uid]; if (!u) return;
        if (game.map.owner[u.tile] === b.id) {
          var home = a.cities.map(function (cid) { return game.cities[cid]; }).filter(Boolean).sort(function (x, y) { return Hex.distance(x.tile, u.tile) - Hex.distance(y.tile, u.tile); })[0];
          if (home) { u.tile = home.tile; if (!G.Units.canStop(game, u, home.tile)) { var near = Hex.within(home.tile, 3).filter(function (t) { return G.Units.canEnter(game, u, t) && G.Units.canStop(game, u, t) && game.map.owner[t] !== b.id; }); if (near.length) u.tile = near[0]; } }
        }
      });
    });
    if (o.isCS) o.csInfluence[p.id] = 0;
    if (p.isCS) p.csInfluence[o.id] = 0;
    E.noteAll(game, p.name + ' and ' + o.name + ' have made peace.', null, 'diplo');
    E.emit({ type: 'peace', a: p.id, b: o.id });
    return true;
  };

  // Military power estimate
  Dp.power = function (game, p) {
    var s = 0;
    p.units.forEach(function (uid) { var u = game.units[uid]; if (!u) return; var d = D.UNITS[u.type]; if (d.cls !== 'civilian' && d.cls !== 'gp') s += Math.max(d.str || 0, d.rs || 0) * u.hp / 100; });
    p.cities.forEach(function (cid) { var c = game.cities[cid]; if (c) s += E.cityStrength(game, c) * 0.5; });
    return Math.round(s);
  };

  // AI attitude toward another player (-100..100)
  Dp.opinion = function (game, ai, o) {
    var r = E.rel(ai, o.id);
    var op = r.opinion || 0;
    if (r.war) op -= 30;
    // border friction
    var close = 0;
    ai.cities.forEach(function (cid) { var c = game.cities[cid]; if (!c) return; o.cities.forEach(function (oc) { var c2 = game.cities[oc]; if (c2 && Hex.distance(c.tile, c2.tile) < 7) close++; }); });
    op -= Math.min(20, close * 3);
    if (ai.religion && o.religion === ai.religion) op += 10;
    if (r.openBorders > 0) op += 5;
    // score envy
    if ((o.score || 0) > (ai.score || 0) * 1.5) op -= 8;
    if (o.wonders.length > ai.wonders.length + 3) op -= 5;
    return Math.max(-100, Math.min(100, Math.round(op)));
  };
  Dp.attitude = function (v) {
    if (v >= 30) return 'Friendly'; if (v >= 10) return 'Favorable'; if (v > -10) return 'Neutral'; if (v > -30) return 'Guarded'; return 'Hostile';
  };

  // ---- Trades ----
  // item: {kind:'gold', amt} {kind:'gpt', amt} {kind:'lux', res} {kind:'strat', res, qty} {kind:'ob'} {kind:'peace'} {kind:'war', target}
  Dp.tradableItems = function (game, p, o) {
    var items = [];
    items.push({ kind: 'gold', amt: Math.floor(p.gold) });
    var gpt = Math.max(0, Math.floor(p.lastYields.gpt || 0));
    if (gpt > 0) items.push({ kind: 'gpt', amt: gpt });
    var rc = E.resourceCounts(game, p);
    for (var lx in rc.lux) if (rc.lux[lx] >= 1 && !(p.exports || []).some(function (e) { return e.res === lx && e.to === o.id; })) items.push({ kind: 'lux', res: lx });
    for (var sr in rc.counts) { var av = E.resourceAvail(game, p, sr); if (av > 0) items.push({ kind: 'strat', res: sr, qty: Math.min(av, 3) }); }
    if (!E.atWar(game, p.id, o.id) && !(E.rel(o, p.id).openBorders > 0)) items.push({ kind: 'ob' });
    if (E.atWar(game, p.id, o.id)) items.push({ kind: 'peace' });
    return items;
  };
  Dp.itemName = function (it) {
    if (it.kind === 'gold') return it.amt + ' Gold';
    if (it.kind === 'gpt') return it.amt + ' Gold/turn (30 turns)';
    if (it.kind === 'lux') return D.RESOURCES[it.res].name + ' (30 turns)';
    if (it.kind === 'strat') return it.qty + ' ' + D.RESOURCES[it.res].name + ' (30 turns)';
    if (it.kind === 'ob') return 'Open Borders (30 turns)';
    if (it.kind === 'peace') return 'Peace Treaty';
    return '?';
  };
  // value of item to the AI (positive = AI likes receiving it)
  function itemValue(game, ai, it, receiving, other) {
    var v = 0;
    if (it.kind === 'gold') v = it.amt;
    if (it.kind === 'gpt') v = it.amt * 30 * 0.8;
    if (it.kind === 'lux') {
      var rc = E.resourceCounts(game, ai);
      var have = rc.lux[it.res] || 0;
      if (receiving) v = have ? 30 : 160 + (ai.happy < 3 ? 80 : 0);
      else v = have > 1 ? 70 : 220;
    }
    if (it.kind === 'strat') v = (receiving ? 40 : 60) * it.qty;
    if (it.kind === 'ob') v = receiving ? 40 : 60;
    if (it.kind === 'peace') {
      var mine = Dp.power(game, ai), theirs = Dp.power(game, other);
      var ratio = mine / Math.max(1, theirs);
      var dur = game.turn - (E.rel(ai, other.id).warSince || 0);
      v = (ratio < 0.8 ? 400 : ratio > 1.5 ? -400 : 0) + Math.min(200, dur * 8) - 100;
      if (ai.ai && ai.ai.warTarget === other.id && ratio > 1.2) v -= 300;
    }
    return v;
  }
  Dp.evaluate = function (game, ai, human, give, get) {
    // give = items human gives AI, get = items AI gives human
    var val = 0;
    give.forEach(function (it) { val += itemValue(game, ai, it, true, human); });
    get.forEach(function (it) { if (it.kind === 'peace') val += itemValue(game, ai, it, true, human); else val -= itemValue(game, ai, it, false, human); });
    var op = Dp.opinion(game, ai, human);
    val += op * 2;
    if (E.atWar(game, ai.id, human.id) && !give.concat(get).some(function (i) { return i.kind === 'peace'; })) val = -9999;
    return val;
  };
  Dp.execute = function (game, a, b, aGives, bGives) {
    function transfer(from, to, it) {
      if (it.kind === 'gold') { var g = Math.min(from.gold, it.amt); from.gold -= g; to.gold += g; }
      if (it.kind === 'gpt') { from.gptDeals = from.gptDeals || []; to.gptDeals = to.gptDeals || []; from.gptDeals.push({ amount: -it.amt, turns: 30, with: to.id }); to.gptDeals.push({ amount: it.amt, turns: 30, with: from.id }); }
      if (it.kind === 'lux' || it.kind === 'strat') {
        from.exports = from.exports || []; to.imports = to.imports || [];
        from.exports.push({ res: it.res, qty: it.qty || 1, turns: 30, to: to.id }); to.imports.push({ res: it.res, qty: it.qty || 1, turns: 30, from: from.id });
        E.dirtyRes(from); E.dirtyRes(to);
      }
      if (it.kind === 'ob') { E.rel(from, to.id).openBorders = 30; }
      if (it.kind === 'peace') Dp.makePeace(game, from, to);
    }
    aGives.forEach(function (it) { transfer(a, b, it); });
    bGives.forEach(function (it) { transfer(b, a, it); });
    E.rel(a, b.id).opinion += 5; E.rel(b, a.id).opinion += 5;
  };
  Dp.leaderLine = function (game, ai, human, mood) {
    var lines = {
      greet: ['Greetings. What brings you before us?', 'Speak, and be brief.', 'Welcome, friend. How may we be of service?', 'Our peoples should talk more often.'],
      accept: ['A fair arrangement. It is agreed.', 'Very well. We accept.', 'This pleases us.'],
      reject: ['That is unacceptable.', 'You must think us fools.', 'We decline.', 'No. Bring us a better offer.'],
      war: ['So be it. You will regret this!', 'Our armies will crush yours!', 'We are ready for you.'],
      peace: ['Enough blood has been spilled. Peace it is.', 'Let us end this war.']
    };
    var arr = lines[mood] || lines.greet;
    return arr[(game.turn + ai.id) % arr.length];
  };

  return Dp;
})();
