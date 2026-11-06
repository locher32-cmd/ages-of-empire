// ============================================================
//  Map generation: landmasses, climate, rivers, features,
//  resources, natural wonders, ruins, start positions
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.IDS = (function () {
  var D = G.D;
  function mk(obj, withNone) { var a = withNone ? [null] : []; for (var k in obj) a.push(k); var m = {}; a.forEach(function (k, i) { if (k) m[k] = i; }); return { list: a, map: m }; }
  return {
    terrain: mk(D.TERRAIN, false),
    feature: mk(D.FEATURES, true),
    res: mk(D.RESOURCES, true),
    imp: (function () { var o = {}; for (var k in D.IMPROVEMENTS) o[k] = 1; o.barb_camp = 1; o.city_ruins = 1; return mk(o, true); })(),
    nw: mk(D.NATURAL_WONDERS, true)
  };
})();

G.MapGen = (function () {
  var D = G.D, Hex = G.Hex, IDS = G.IDS;
  var T = IDS.terrain.map, F = IDS.feature.map, R = IDS.res.map;

  function createMap(W, H) {
    var n = W * H;
    return {
      W: W, H: H,
      terrain: new Uint8Array(n), hills: new Uint8Array(n), feature: new Uint8Array(n),
      res: new Uint8Array(n), resQty: new Uint8Array(n), imp: new Uint8Array(n), road: new Uint8Array(n),
      river: new Uint8Array(n), riverMask: new Uint8Array(n), owner: new Int16Array(n).fill(-1), city: new Int32Array(n).fill(-1),
      nw: new Uint8Array(n), hut: new Uint8Array(n), elev: new Uint8Array(n), pillaged: new Uint8Array(n), area: new Int32Array(n)
    };
  }

  function generate(opts, rng) {
    var size = D.MAP_SIZES[opts.size];
    var W = size.w, H = size.h;
    Hex.setSize(W, H);
    var m = createMap(W, H);
    var noise = new G.Noise(rng.int(1e9)), noise2 = new G.Noise(rng.int(1e9)), noise3 = new G.Noise(rng.int(1e9));
    var n = W * H, elev = new Float32Array(n);
    var type = opts.mapType || 'continents';
    // --- land shape -----------------------------------------------------
    var blobs = [];
    function addBlob(cx, cy, rx, ry, w) { blobs.push({ cx: cx, cy: cy, rx: rx, ry: ry, w: w }); }
    var landFrac = 0.33;
    if (type === 'pangaea') { addBlob(W * 0.5, H * 0.5, W * 0.33, H * 0.36, 1.2); landFrac = 0.36; }
    else if (type === 'continents') {
      var nC = 2 + (W > 90 ? 1 : 0);
      var off = rng.next() * W;
      for (var c = 0; c < nC; c++) addBlob((off + W * (c + 0.5) / nC) % W, H * (0.4 + rng.next() * 0.2), W * 0.16 / (nC / 2), H * 0.34, 1);
      landFrac = 0.34;
    } else if (type === 'small_continents') {
      var nS = 5 + (W / 30 | 0);
      for (c = 0; c < nS; c++) addBlob(rng.next() * W, H * (0.2 + rng.next() * 0.6), W * 0.07, H * 0.13, 1);
      landFrac = 0.3;
    } else if (type === 'archipelago') { landFrac = 0.22; }
    else if (type === 'fractal') { landFrac = 0.34; }
    else if (type === 'inland_sea') { landFrac = 0.58; }
    function blobVal(x, y) {
      var best = 0;
      for (var b = 0; b < blobs.length; b++) {
        var B = blobs[b];
        var dx = Math.abs(x - B.cx); dx = Math.min(dx, W - dx);
        var dy = y - B.cy;
        var d = Math.sqrt((dx / B.rx) * (dx / B.rx) + (dy / B.ry) * (dy / B.ry));
        var v = Math.max(0, 1 - d) * B.w;
        if (v > best) best = v;
      }
      return best;
    }
    var freq = type === 'archipelago' ? 14 : (type === 'fractal' ? 5 : 6);
    for (var i = 0; i < n; i++) {
      var x = i % W, y = (i / W) | 0;
      var e = noise.fbm(x, y, W, H, freq, 5);
      if (blobs.length) e = e * 0.55 + blobVal(x, y) * 0.9;
      if (type === 'inland_sea') {
        var dxs = (x - W / 2) / (W * 0.28), dys = (y - H / 2) / (H * 0.3);
        e = e * 0.6 + Math.min(1, Math.sqrt(dxs * dxs + dys * dys)) * 0.7;
      }
      // poles become water
      var lat = Math.abs(y - (H - 1) / 2) / ((H - 1) / 2);
      if (lat > 0.88) e -= (lat - 0.88) * 6;
      elev[i] = e;
    }
    // threshold for desired land fraction
    var sorted = Array.prototype.slice.call(elev).sort(function (a, b) { return b - a; });
    var seaLevel = sorted[Math.floor(n * landFrac)];
    var landTiles = [];
    for (i = 0; i < n; i++) { if (elev[i] > seaLevel) landTiles.push(i); }
    // mountains & hills from land elevation + ridge noise
    var landElev = landTiles.map(function (t) {
      var x = t % W, y = (t / W) | 0;
      var ridge = 1 - Math.abs(noise2.fbm(x, y, W, H, 9, 3));
      return elev[t] * 0.6 + ridge * 0.6;
    });
    var le = landElev.slice().sort(function (a, b) { return b - a; });
    var mtnT = le[Math.floor(le.length * 0.07)], hillT = le[Math.floor(le.length * 0.26)];
    // --- climate ----------------------------------------------------------
    for (var k = 0; k < landTiles.length; k++) {
      i = landTiles[k]; x = i % W; y = (i / W) | 0;
      var latN = Math.abs(y - (H - 1) / 2) / ((H - 1) / 2);
      var temp = 1 - latN + noise3.fbm(x, y, W, H, 6, 3) * 0.25;
      var moist = noise2.fbm(x + 100, y, W, H, 5, 4) * 0.5 + 0.5;
      var ter;
      if (temp < 0.13) ter = 'snow';
      else if (temp < 0.3) ter = 'tundra';
      else if (temp > 0.62 && moist < 0.42 && latN > 0.1) ter = 'desert';
      else if (moist > 0.5 || temp > 0.75) ter = 'grassland';
      else ter = 'plains';
      m.terrain[i] = T[ter];
      m.elev[i] = Math.max(1, Math.min(255, Math.floor((landElev[k] - le[le.length - 1]) / (le[0] - le[le.length - 1] + 1e-6) * 254)));
      if (landElev[k] >= mtnT) m.terrain[i] = T.mountain;
      else if (landElev[k] >= hillT) m.hills[i] = 1;
      // features
      if (m.terrain[i] !== T.mountain) {
        var fr = rng.next();
        if (ter === 'grassland' && temp > 0.72 && moist > 0.52) { if (fr < 0.6) m.feature[i] = F.jungle; }
        else if (ter === 'plains' && temp > 0.75 && moist > 0.5) { if (fr < 0.5) m.feature[i] = F.jungle; }
        else if ((ter === 'grassland' || ter === 'plains') && moist > 0.48) { if (fr < 0.42) m.feature[i] = F.forest; }
        else if (ter === 'tundra') { if (fr < 0.38) m.feature[i] = F.forest; }
        else if (ter === 'grassland' && !m.hills[i] && moist > 0.62 && fr < 0.12) m.feature[i] = F.marsh;
        if (m.feature[i] === F.marsh && m.hills[i]) m.feature[i] = 0;
        if (ter === 'desert' && !m.hills[i] && rng.chance(0.025)) m.feature[i] = F.oasis;
      }
    }
    // water: coast / ocean / lakes
    for (i = 0; i < n; i++) if (elev[i] <= seaLevel) m.terrain[i] = T.ocean;
    for (i = 0; i < n; i++) {
      if (m.terrain[i] !== T.ocean) continue;
      var nb = Hex.neighbors(i);
      for (var q = 0; q < nb.length; q++) if (!D.TERRAIN[IDS.terrain.list[m.terrain[nb[q]]]].water) { m.terrain[i] = T.coast; break; }
    }
    // second coast ring on some tiles for shallow seas
    var coastAdd = [];
    for (i = 0; i < n; i++) if (m.terrain[i] === T.ocean) {
      var nbs = Hex.neighbors(i), cc = 0;
      for (q = 0; q < nbs.length; q++) if (m.terrain[nbs[q]] === T.coast) cc++;
      if (cc >= 3 && rng.chance(0.4)) coastAdd.push(i);
    }
    coastAdd.forEach(function (t) { m.terrain[t] = T.coast; });
    // lakes: small enclosed water bodies
    var seen = new Uint8Array(n);
    for (i = 0; i < n; i++) {
      if (seen[i] || !isWater(m, i)) continue;
      var comp = [], st = [i]; seen[i] = 1;
      while (st.length) { var t = st.pop(); comp.push(t); var nn = Hex.neighbors(t); for (q = 0; q < nn.length; q++) if (!seen[nn[q]] && isWater(m, nn[q])) { seen[nn[q]] = 1; st.push(nn[q]); } }
      if (comp.length <= 9) comp.forEach(function (t) { m.terrain[t] = T.lake; });
    }
    // ice at poles
    for (i = 0; i < n; i++) {
      y = (i / W) | 0;
      if (isWater(m, i) && (y === 0 || y === H - 1 || ((y === 1 || y === H - 2) && rng.chance(0.55)))) m.feature[i] = F.ice;
    }
    // also add a few random inland lakes
    for (k = 0; k < landTiles.length / 120; k++) {
      t = rng.pick(landTiles);
      if (m.terrain[t] !== T.mountain && !m.hills[t] && Hex.neighbors(t).every(function (z) { return !isWater(m, z) || m.terrain[z] === T.lake; })) {
        m.terrain[t] = T.lake; m.feature[t] = 0;
      }
    }
    makeRivers(m, rng, landTiles);
    // floodplains on desert rivers
    for (i = 0; i < n; i++) if (m.river[i] && m.terrain[i] === T.desert && !m.hills[i] && !m.feature[i]) m.feature[i] = F.floodplains;
    // atolls
    for (i = 0; i < n; i++) if (m.terrain[i] === T.coast && !m.feature[i] && rng.chance(0.012)) {
      y = (i / W) | 0; var lt = Math.abs(y - H / 2) / (H / 2);
      if (lt < 0.5) m.feature[i] = F.atoll;
    }
    computeAreas(m);
    placeNaturalWonders(m, rng, opts);
    placeResources(m, rng);
    return m;
  }

  function isWater(m, i) { return D.TERRAIN[IDS.terrain.list[m.terrain[i]]].water; }
  function isLand(m, i) { return !isWater(m, i); }

  function makeRivers(m, rng, landTiles) {
    var W = m.W, count = Math.floor(landTiles.length / 35);
    var srcs = landTiles.filter(function (t) { return m.hills[t] || m.terrain[t] === T.mountain || m.elev[t] > 150; });
    for (var r = 0; r < count && srcs.length; r++) {
      var cur = rng.pick(srcs);
      if (m.terrain[cur] === T.mountain) {
        var opts = Hex.neighbors(cur).filter(function (z) { return isLand(m, z) && m.terrain[z] !== T.mountain; });
        if (!opts.length) continue; cur = rng.pick(opts);
      }
      if (m.river[cur]) continue;
      var path = [cur], visited = {}; visited[cur] = 1;
      for (var step = 0; step < 40; step++) {
        var nb = Hex.neighbors(cur), best = -1, bestE = 1e9, hitWater = -1;
        for (var q = 0; q < nb.length; q++) {
          var z = nb[q];
          if (isWater(m, z) && m.feature[z] !== F.ice) { hitWater = z; break; }
          if (visited[z] || m.terrain[z] === T.mountain) continue;
          var e = m.elev[z] + rng.next() * 40 + (m.river[z] ? -80 : 0);
          if (e < bestE) { bestE = e; best = z; }
        }
        if (hitWater >= 0) { m.riverMask[cur] |= (1 << Hex.dirTo(cur, hitWater)); break; }
        if (best < 0) { path = null; break; }
        m.riverMask[cur] |= (1 << Hex.dirTo(cur, best));
        if (m.river[best]) { path.push(best); break; }
        visited[best] = 1; path.push(best); cur = best;
      }
      if (path && path.length >= 3) path.forEach(function (t) { m.river[t] = 1; });
      else if (path) path.forEach(function (t) { if (!m.river[t]) m.riverMask[t] = 0; });
    }
  }

  function computeAreas(m) {
    var n = m.W * m.H, id = 0;
    m.area.fill(-1);
    for (var i = 0; i < n; i++) {
      if (m.area[i] >= 0) continue;
      var water = isWater(m, i), st = [i]; m.area[i] = id;
      while (st.length) {
        var t = st.pop(), nb = Hex.neighbors(t);
        for (var q = 0; q < nb.length; q++) { var z = nb[q]; if (m.area[z] < 0 && isWater(m, z) === water) { m.area[z] = id; st.push(z); } }
      }
      id++;
    }
  }

  function placeNaturalWonders(m, rng, opts) {
    var count = { duel: 2, tiny: 3, small: 4, standard: 5, large: 6, huge: 7, colossal: 9 }[opts.size] || 5;
    var keys = rng.shuffle(Object.keys(D.NATURAL_WONDERS));
    var n = m.W * m.H, placed = [];
    for (var k = 0; k < keys.length && placed.length < count; k++) {
      var nw = D.NATURAL_WONDERS[keys[k]];
      for (var tries = 0; tries < 300; tries++) {
        var i = rng.int(n);
        if (nw.water ? (m.terrain[i] !== T.coast || m.feature[i]) : (!isLand(m, i) || m.terrain[i] === T.snow)) continue;
        if (placed.some(function (p) { return Hex.distance(p, i) < 8; })) continue;
        if (nw.water && Hex.neighbors(i).every(function (z) { return isWater(m, z); })) continue;
        m.nw[i] = IDS.nw.map[keys[k]]; m.feature[i] = 0;
        if (nw.terrainLike === 'mountain' && !nw.water) { m.terrain[i] = T.mountain; m.hills[i] = 0; }
        placed.push(i); break;
      }
    }
  }

  function terrainKey(m, i) { return IDS.terrain.list[m.terrain[i]]; }
  function resFits(m, i, rk) {
    var r = D.RESOURCES[rk], tk = terrainKey(m, i), fk = IDS.feature.list[m.feature[i]];
    if (m.nw[i]) return false;
    if (tk === 'mountain' || fk === 'ice' || fk === 'oasis' || fk === 'atoll') return false;
    var on = r.on;
    if (D.TERRAIN[tk].water) return on.indexOf(tk) >= 0 && fk !== 'ice' && !(tk === 'coast' && rk === 'oil' && false);
    if (fk === 'forest' || fk === 'jungle' || fk === 'marsh' || fk === 'floodplains') {
      if (on.indexOf(fk) >= 0) return true;
      if (rk === 'wheat' && fk === 'floodplains') return true;
      return false;
    }
    if (m.hills[i]) return on.indexOf('hills') >= 0;
    return on.indexOf(tk) >= 0;
  }

  function placeResources(m, rng) {
    var n = m.W * m.H;
    var lux = [], strat = [], bonus = [];
    for (var rk in D.RESOURCES) {
      var t = D.RESOURCES[rk].type;
      (t === 'luxury' ? lux : t === 'strategic' ? strat : bonus).push(rk);
    }
    // Luxuries in regional clusters (each region favours 2-3 luxury types)
    var regionSize = 12;
    var regionLux = {};
    for (var i = 0; i < n; i++) {
      if (m.res[i]) continue;
      var x = i % m.W, y = (i / m.W) | 0;
      var rid = ((x / regionSize) | 0) + '_' + ((y / regionSize) | 0);
      if (!regionLux[rid]) regionLux[rid] = rng.shuffle(lux.slice()).slice(0, 4);
      var water = isWater(m, i);
      var p = rng.next();
      if (p < 0.05) {
        // luxury
        var cands = regionLux[rid].concat(rng.chance(0.15) ? [rng.pick(lux)] : []);
        for (var c = 0; c < cands.length; c++) if (resFits(m, i, cands[c])) { m.res[i] = R[cands[c]]; m.resQty[i] = 1; break; }
      } else if (p < 0.088) {
        var sc = rng.shuffle(strat.slice());
        for (c = 0; c < sc.length; c++) if (resFits(m, i, sc[c])) {
          m.res[i] = R[sc[c]]; var q = D.RESOURCES[sc[c]].qty; m.resQty[i] = rng.range(q[0], q[1]); break;
        }
      } else if (p < (water ? 0.16 : 0.15)) {
        var bc = rng.shuffle(bonus.slice());
        for (c = 0; c < bc.length; c++) if (resFits(m, i, bc[c])) { m.res[i] = R[bc[c]]; m.resQty[i] = 1; break; }
      }
    }
  }

  // Score a tile as a city site for the AI / start placement
  function siteScore(m, i, radius) {
    if (!isLand(m, i) || m.terrain[i] === T.mountain || m.nw[i]) return -1;
    var s = 0, coastal = false, fresh = m.river[i] ? 1 : 0;
    var tiles = Hex.within(i, radius || 2);
    for (var q = 0; q < tiles.length; q++) {
      var t = tiles[q], y = G.Rules ? G.Rules.tileBaseYield(m, t) : { f: 1, p: 1, g: 0 };
      var d = Hex.distance(i, t);
      var w = d <= 1 ? 1.5 : 1;
      s += ((y.f || 0) * 1.4 + (y.p || 0) * 1.1 + (y.g || 0) * 0.6 + (y.s || 0) * 0.5 + (y.fa || 0) * 0.3) * w;
      if (m.res[t]) { var rt = D.RESOURCES[IDS.res.list[m.res[t]]].type; s += (rt === 'luxury' ? 4 : rt === 'strategic' ? 2 : 1.5) * w; }
      if (d === 1 && isWater(m, t) && m.terrain[t] !== T.lake) coastal = true;
      if (d === 1 && (m.terrain[t] === T.lake || m.feature[t] === F.oasis)) fresh = 1;
      if (m.terrain[t] === T.mountain) s -= 0.5;
      if (m.feature[t] === F.ice || m.terrain[t] === T.snow) s -= 1.5;
    }
    if (coastal) s += 4;
    if (fresh) s += 5;
    if (m.hills[i]) s += 3;
    return s;
  }

  function findStarts(m, rng, count, minDist, avoid) {
    var n = m.W * m.H, cands = [];
    var areaSize = {};
    for (var i = 0; i < n; i++) if (isLand(m, i)) areaSize[m.area[i]] = (areaSize[m.area[i]] || 0) + 1;
    for (i = 0; i < n; i++) {
      if (!isLand(m, i) || (areaSize[m.area[i]] || 0) < 25) continue;
      var y = (i / m.W) | 0, lat = Math.abs(y - m.H / 2) / (m.H / 2);
      if (lat > 0.75) continue;
      var s = siteScore(m, i, 2);
      if (s > 0) cands.push({ i: i, s: s });
    }
    cands.sort(function (a, b) { return b.s - a.s; });
    cands = cands.slice(0, Math.max(60, Math.floor(cands.length * 0.4)));
    var starts = [], blocked = (avoid || []).slice();
    var md = minDist;
    while (starts.length < count && md >= 3) {
      var best = null, bestV = -1e9;
      for (var c = 0; c < cands.length; c++) {
        var ci = cands[c].i, minD = 1e9;
        for (var b = 0; b < blocked.length; b++) { var dd = Hex.distance(ci, blocked[b]); if (dd < minD) minD = dd; }
        if (minD < md) continue;
        var v = cands[c].s + Math.min(minD, md * 2) * 1.5 + rng.next() * 3;
        if (v > bestV) { bestV = v; best = ci; }
      }
      if (best === null) { md -= 1; continue; }
      starts.push(best); blocked.push(best);
    }
    return starts;
  }

  function placeRuins(m, rng, starts) {
    var n = m.W * m.H, count = Math.floor(n / 220);
    for (var k = 0, tries = 0; k < count && tries < count * 30; tries++) {
      var i = rng.int(n);
      if (!isLand(m, i) || m.terrain[i] === T.mountain || m.res[i] || m.nw[i] || m.hut[i]) continue;
      if (starts.some(function (s) { return Hex.distance(s, i) < 4; })) continue;
      m.hut[i] = 1; k++;
    }
  }

  return { generate: generate, isWater: isWater, isLand: isLand, siteScore: siteScore, findStarts: findStarts, placeRuins: placeRuins, computeAreas: computeAreas, resFits: resFits };
})();
