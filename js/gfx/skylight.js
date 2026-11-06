// ============================================================
//  Skylight (Enhanced v3): a living sky over the whole world.
//  Slow cloud shadows drift across the land, a warm sun bloom
//  sits in the upper-left (matching the terrain light), and a
//  whisper of film grain gives the frame a cinematic finish.
//  Everything is pre-rendered patterns — three patterned fills
//  and one gradient per frame, nothing per-tile.
//  Toggle: Settings → "Rich graphics". Motion follows the
//  existing "Animate map effects" setting.
// ============================================================
(function (GF) {
  var shadowBig = null, shadowSmall = null, grains = null;

  function blobField(size, cells, seed, dark, soft) {
    var F = GF.fields(), c = GF.mk(size, size), ctx = c.getContext('2d');
    ctx.fillStyle = 'rgb(255,255,255)'; ctx.fillRect(0, 0, size, size);
    var img = ctx.getImageData(0, 0, size, size), d = img.data;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) {
      var u = x / size * cells, v = y / size * cells;
      var n = GF.sample(F.low, u % 1, v % 1) * 0.62 + GF.sample(F.mid, (u * 2) % 1, (v * 2) % 1) * 0.38;
      var t = (n - 0.52) / 0.30; t = t < 0 ? 0 : t > 1 ? 1 : t; t = t * t * (3 - 2 * t);
      var i = (y * size + x) * 4, k = 1 - t * dark;
      d[i] = 255 * (1 - (1 - k) * 1.0); d[i + 1] = 255 * (1 - (1 - k) * 0.94); d[i + 2] = 255 * (1 - (1 - k) * 0.72);
      // soften: blend toward white at patch borders is inherent in the smoothstep
      if (soft) { d[i] = d[i] * 0.9 + 25; d[i + 1] = d[i + 1] * 0.9 + 25; d[i + 2] = d[i + 2] * 0.9 + 25; }
    }
    ctx.putImageData(img, 0, 0);
    return c;
  }

  function buildAssets() {
    shadowBig = blobField(512, 1, 11, 0.38, false);
    shadowSmall = blobField(256, 1, 23, 0.26, true);
    grains = [];
    var r = GF.rng(99);
    for (var g = 0; g < 3; g++) {
      var c = GF.mk(140, 140), ctx = c.getContext('2d'), img = ctx.createImageData(140, 140), d = img.data;
      for (var i = 0; i < d.length; i += 4) { var v = 118 + Math.floor(r() * 26); d[i] = v; d[i + 1] = v; d[i + 2] = v; d[i + 3] = 255; }
      ctx.putImageData(img, 0, 0); grains.push(c);
    }
  }

  function pat(ctx, r, key, canvas) {
    if (!r[key]) r[key] = ctx.createPattern(canvas, 'repeat');
    return r[key];
  }

  function driftFill(ctx, r, pattern, size, par, driftX, driftY) {
    var ox = -((((r.cam.x * par + driftX) % size) + size) % size) - size;
    var oy = -((((r.cam.y * par + driftY) % size) + size) % size) - size;
    ctx.save(); ctx.translate(ox, oy);
    ctx.fillStyle = pattern; ctx.fillRect(0, 0, r.cw + size * 2 + 24, r.ch + size * 2 + 24);
    ctx.restore();
  }

  var baseOverlay = GF.hooks.overlay;
  GF.hooks.overlay = function (ctx, list, now) {
    if (baseOverlay) baseOverlay.call(this, ctx, list, now);
    if (GF.settings.rich === false) return;
    if (!shadowBig) buildAssets();
    var W = this.cw, H = this.ch, anim = GF.settings.anim !== false;
    var t = anim ? (now || 0) : 0;
    ctx.save();
    // 1) cloud shadows: two parallax layers of soft shade drifting east
    ctx.globalCompositeOperation = 'multiply';
    driftFill(ctx, this, pat(ctx, this, '_skyPatB', shadowBig), 512, 0.32, t * 0.010, t * 0.0022);
    driftFill(ctx, this, pat(ctx, this, '_skyPatS', shadowSmall), 256, 0.55, t * 0.021, t * 0.004);
    // 2) sun bloom from the upper-left, where the terrain light lives
    if (!this._skyGlow || this._skyGlow.w !== W || this._skyGlow.h !== H) {
      var g = ctx.createRadialGradient(W * 0.08, H * 0.02, 10, W * 0.08, H * 0.02, Math.max(W, H) * 0.85);
      g.addColorStop(0, 'rgba(255,216,150,0.55)'); g.addColorStop(0.45, 'rgba(255,205,130,0.18)'); g.addColorStop(1, 'rgba(255,205,130,0)');
      this._skyGlow = { w: W, h: H, g: g };
    }
    ctx.globalCompositeOperation = 'soft-light';
    ctx.fillStyle = this._skyGlow.g; ctx.fillRect(0, 0, W, H);
    // 3) film grain: three-frame cycle, barely-there texture
    if (anim) {
      var gi = ((t / 130) | 0) % 3;
      if (!this._grainPats) this._grainPats = [ctx.createPattern(grains[0], 'repeat'), ctx.createPattern(grains[1], 'repeat'), ctx.createPattern(grains[2], 'repeat')];
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.055;
      ctx.save(); ctx.translate(-(gi * 37) % 140, -(gi * 53) % 140);
      ctx.fillStyle = this._grainPats[gi]; ctx.fillRect(0, 0, W + 140, H + 140);
      ctx.restore();
    }
    ctx.restore();
  };
})(G.GFX);
