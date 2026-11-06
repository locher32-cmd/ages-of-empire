// ============================================================
//  Hex grid (pointy-top, odd-r offset, wraps east-west), RNG, noise
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Hex = (function () {
  var W = 0, H = 0;
  var DIRS_EVEN = [[1, 0], [0, -1], [-1, -1], [-1, 0], [-1, 1], [0, 1]];
  var DIRS_ODD = [[1, 0], [1, -1], [0, -1], [-1, 0], [0, 1], [1, 1]];
  var nbCache = null;

  function setSize(w, h) {
    W = w; H = h; wcache = {};
    nbCache = new Int32Array(W * H * 6);
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var d = (y & 1) ? DIRS_ODD : DIRS_EVEN, i = y * W + x;
      for (var k = 0; k < 6; k++) {
        var nx = x + d[k][0], ny = y + d[k][1];
        if (ny < 0 || ny >= H) { nbCache[i * 6 + k] = -1; continue; }
        nx = ((nx % W) + W) % W;
        nbCache[i * 6 + k] = ny * W + nx;
      }
    }
  }
  function idx(x, y) { if (y < 0 || y >= H) return -1; x = ((x % W) + W) % W; return y * W + x; }
  function xy(i) { return [i % W, (i / W) | 0]; }
  function neighbors(i) {
    var r = [];
    for (var k = 0; k < 6; k++) { var n = nbCache[i * 6 + k]; if (n >= 0) r.push(n); }
    return r;
  }
  function neighbor(i, k) { return nbCache[i * 6 + k]; }
  function toCube(x, y) { var q = x - ((y - (y & 1)) >> 1); return [q, y]; }
  function distance(a, b) {
    var ax = a % W, ay = (a / W) | 0, bx = b % W, by = (b / W) | 0;
    var best = 1e9;
    for (var s = -1; s <= 1; s++) {
      var c1 = toCube(ax, ay), c2 = toCube(bx + s * W, by);
      var dq = c1[0] - c2[0], dr = c1[1] - c2[1];
      var d = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
      if (d < best) best = d;
    }
    return best;
  }
  // v2 perf: allocation-free twin of distance() — identical math, no temp
  // arrays. Fuzz-verified against distance() (tests in the v2 dev notes).
  function distanceFast(a, b) {
    var ax = a % W, ay = (a / W) | 0, bx = b % W, by = (b / W) | 0;
    var q1 = ax - ((ay - (ay & 1)) >> 1), best = 1e9;
    for (var s = -1; s <= 1; s++) {
      var bx2 = bx + s * W;
      var q2 = bx2 - ((by - (by & 1)) >> 1);
      var dq = q1 - q2, dr = ay - by;
      var d = (Math.abs(dq) + Math.abs(dr) + Math.abs(dq + dr)) / 2;
      if (d < best) best = d;
    }
    return best;
  }
  // All tiles within radius r of i (including i)
  var ringCache = {};
  var wcache = {};
  function within(i, r) {
    if (r <= 3) { var key = i * 4 + r; var hit = wcache[key]; if (hit) return hit; var res = withinRaw(i, r); wcache[key] = res; return res; }
    return withinRaw(i, r);
  }
  function withinRaw(i, r) {
    var out = [i], seen = {}; seen[i] = 1;
    var frontier = [i];
    for (var d = 0; d < r; d++) {
      var next = [];
      for (var f = 0; f < frontier.length; f++) {
        var t = frontier[f];
        for (var k = 0; k < 6; k++) {
          var n = nbCache[t * 6 + k];
          if (n >= 0 && !seen[n]) { seen[n] = 1; out.push(n); next.push(n); }
        }
      }
      frontier = next;
    }
    return out;
  }
  function ring(i, r) {
    if (r === 0) return [i];
    return within(i, r).filter(function (t) { return distance(i, t) === r; });
  }
  // Direction index from a to adjacent b
  function dirTo(a, b) { for (var k = 0; k < 6; k++) if (nbCache[a * 6 + k] === b) return k; return -1; }

  return { setSize: setSize, idx: idx, xy: xy, neighbors: neighbors, neighbor: neighbor, distance: distance, distanceFast: distanceFast, within: within, ring: ring, dirTo: dirTo,
    get W() { return W; }, get H() { return H; } };
})();

// Deterministic RNG (mulberry32); state kept in game for save/load reproducibility
G.RNG = function (seed) {
  this.s = seed >>> 0;
};
G.RNG.prototype.next = function () {
  this.s = (this.s + 0x6D2B79F5) >>> 0; var t = this.s;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};
G.RNG.prototype.int = function (n) { return Math.floor(this.next() * n); };
G.RNG.prototype.range = function (a, b) { return a + Math.floor(this.next() * (b - a + 1)); };
G.RNG.prototype.pick = function (arr) { return arr[Math.floor(this.next() * arr.length)]; };
G.RNG.prototype.shuffle = function (arr) {
  for (var i = arr.length - 1; i > 0; i--) { var j = Math.floor(this.next() * (i + 1)); var t = arr[i]; arr[i] = arr[j]; arr[j] = t; }
  return arr;
};
G.RNG.prototype.chance = function (p) { return this.next() < p; };

// 3D value noise (seeded) — sampled on a cylinder so the map wraps east-west
G.Noise = function (seed) {
  var rng = new G.RNG(seed);
  this.perm = new Uint16Array(512);
  this.vals = new Float32Array(256);
  var p = [];
  for (var i = 0; i < 256; i++) { p.push(i); this.vals[i] = rng.next() * 2 - 1; }
  rng.shuffle(p);
  for (i = 0; i < 512; i++) this.perm[i] = p[i & 255];
};
G.Noise.prototype.lattice = function (x, y, z) {
  var P = this.perm;
  return this.vals[P[(P[(P[x & 255] + y) & 511] + z) & 511] & 255];
};
G.Noise.prototype.noise3 = function (x, y, z) {
  var xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  var xf = x - xi, yf = y - yi, zf = z - zi;
  var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  var L = this.lattice.bind(this);
  function lerp(a, b, t) { return a + (b - a) * t; }
  var x00 = lerp(L(xi, yi, zi), L(xi + 1, yi, zi), u);
  var x10 = lerp(L(xi, yi + 1, zi), L(xi + 1, yi + 1, zi), u);
  var x01 = lerp(L(xi, yi, zi + 1), L(xi + 1, yi, zi + 1), u);
  var x11 = lerp(L(xi, yi + 1, zi + 1), L(xi + 1, yi + 1, zi + 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
};
// Fractal noise at map tile (x,y) with given base frequency (features per map width)
G.Noise.prototype.fbm = function (x, y, W, H, freq, oct) {
  var a = 1, sum = 0, norm = 0, f = freq;
  var ang = (x / W) * Math.PI * 2;
  for (var o = 0; o < (oct || 4); o++) {
    var R = f / (Math.PI * 2);
    sum += a * this.noise3(Math.cos(ang) * R + 31.7 * o, (y / W) * f + 17.3 * o, Math.sin(ang) * R + 7.1 * o);
    norm += a; a *= 0.5; f *= 2;
  }
  return sum / norm;
};
