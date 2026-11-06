// Draws DeepSeek's biome weather over the map, driven by the terrain at screen centre.
(function (GF) {
  var baseOverlay = GF.hooks.overlay, lastBiome = 'grassland';
  GF.hooks.overlay = function (ctx, list, now) {
    if (baseOverlay) baseOverlay.call(this, ctx, list, now);
    if (!GF.drawWeather || this.s < 14 || !this.game) return;
    var tile = this.screenToTile(this.cw / 2, this.ch / 2);
    if (tile >= 0 && this.visibility(tile)) lastBiome = G.IDS.terrain.list[this.game.map.terrain[tile]] || lastBiome;
    GF.drawWeather(ctx, this.cw, this.ch, now, lastBiome, this.cam.x, this.cam.y, this.s);
  };
})(G.GFX);
