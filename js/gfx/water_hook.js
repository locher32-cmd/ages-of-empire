// Wires GF.drawWater into the ground hook with a real shore-distance depth map.
(function (GF) {
  var baseGround = GF.hooks.ground, depthCache = null;
  var WATER = { coast: 1, ocean: 1, lake: 1 };
  function depthMap(map) {
    if (depthCache && depthCache.map === map) return depthCache.dist;
    var LIST = G.IDS.terrain.list, size = map.terrain.length, dist = new Int8Array(size).fill(-1), queue = [];
    for (var tile = 0; tile < size; tile++) if (!WATER[LIST[map.terrain[tile]]]) { dist[tile] = 0; queue.push(tile); }
    for (var head = 0; head < queue.length; head++) {
      var current = queue[head], neighbours = G.Hex.neighbors(current);
      for (var k = 0; k < neighbours.length; k++) { var nb = neighbours[k]; if (nb >= 0 && dist[nb] < 0) { dist[nb] = dist[current] + 1; queue.push(nb); } }
    }
    depthCache = { map: map, dist: dist }; return dist;
  }
  var infoObject = { kind: null, depth: 0 };
  GF.hooks.ground = function (ctx, list, now) {
    if (GF.drawWater && this.s >= 10) {
      var map = this.game.map, LIST = G.IDS.terrain.list, dist = depthMap(map), self = this, visibleWater = [];
      for (var i = 0; i < list.length; i += 4) {
        var tile = list[i]; if (!this.visibility(tile) || !WATER[LIST[map.terrain[tile]]]) continue;
        visibleWater.push(tile, list[i + 1], list[i + 2], 0);
      }
      GF.drawWater(ctx, visibleWater, now, this.s, function (tile) {
        var kind = LIST[map.terrain[tile]];
        infoObject.kind = kind; infoObject.depth = kind === 'lake' ? 0.2 : Math.min(1, (dist[tile] - 1) / 4);
        return infoObject;
      });
    }
    if (baseGround) baseGround.call(this, ctx, list, now);
  };
})(G.GFX);
