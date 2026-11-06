(function (GF) {
  'use strict';

  var CROSSFADE_DURATION_MS = 2000;
  var MAX_PARTICLES = 400;
  var TWO_PI = Math.PI * 2;

  var BIOME_FAMILY = {
    grassland: 'temperate',
    plains: 'temperate',
    coast: 'temperate',
    desert: 'desert',
    tundra: 'snow',
    snow: 'snow',
    mountain: 'snow',
    ocean: 'water',
    lake: 'water'
  };

  // Module-level cross-fade state.
  var previousBiome = null;
  var currentBiome = null;
  var biomeChangeTimeMs = 0;

  // -------------------------------------------------------------------------
  // Helpers
  // -------------------------------------------------------------------------

  function hashToUnit(index, salt) {
    var value = (Math.imul(index + 1, 0x9E3779B1) ^ Math.imul(salt + 0x1F1F1F1F, 0x85EBCA6B)) | 0;
    value ^= value >>> 15;
    value = Math.imul(value, 0x2545F491);
    value ^= value >>> 13;
    return (value >>> 0) / 4294967296;
  }

  function wrapAround(value, period) {
    var wrapped = value % period;
    return wrapped < 0 ? wrapped + period : wrapped;
  }

  function familyOf(biomeKey) {
    var family = BIOME_FAMILY[biomeKey];
    return family || 'temperate';
  }

  function particleScale(zoom) {
    var scale = zoom / 40;
    if (scale < 0.3) scale = 0.3;
    if (scale > 2) scale = 2;
    return scale;
  }

  function scaledParticleCount(area, divisor, minimumCount, maximumCount, zoom) {
    var zoomFactor = Math.sqrt(zoom / 40);
    if (zoomFactor < 0.4) zoomFactor = 0.4;
    if (zoomFactor > 1.6) zoomFactor = 1.6;
    var count = Math.round((area / divisor) * zoomFactor);
    if (count < minimumCount) count = minimumCount;
    if (count > maximumCount) count = maximumCount;
    if (count > MAX_PARTICLES) count = MAX_PARTICLES;
    return count;
  }

  // -------------------------------------------------------------------------
  // Temperate: pollen + occasional rain squalls
  // -------------------------------------------------------------------------

  function drawPollen(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var sizeScale = particleScale(zoom);
    var count = scaledParticleCount(width * height, 14000, 30, 150, zoom);

    ctx.fillStyle = 'rgba(255, 248, 214, ' + (0.55 * alpha) + ')';
    ctx.beginPath();

    for (var index = 0; index < count; index++) {
      var baseX = hashToUnit(index, 101) * width;
      var baseY = hashToUnit(index, 102) * height;
      var driftSpeedX = (hashToUnit(index, 103) - 0.5) * 0.02 * sizeScale;
      var driftSpeedY = (hashToUnit(index, 104) - 0.5) * 0.014 * sizeScale;
      var parallaxFactor = 0.3 + hashToUnit(index, 105) * 0.45;
      var radius = (1.0 + hashToUnit(index, 106) * 1.8) * sizeScale;
      var swayPhase = hashToUnit(index, 107) * TWO_PI;
      var swayX = Math.sin(effectTime * 0.0009 + swayPhase) * 6 * sizeScale;

      var positionX = wrapAround(baseX - cameraX * parallaxFactor + effectTime * driftSpeedX + swayX, width + 30) - 15;
      var positionY = wrapAround(baseY - cameraY * parallaxFactor + effectTime * driftSpeedY, height + 30) - 15;

      ctx.moveTo(positionX + radius, positionY);
      ctx.arc(positionX, positionY, radius, 0, TWO_PI);
    }

    ctx.fill();
  }

  function drawRainSqualls(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var sizeScale = particleScale(zoom);
    var squallCount = 3;
    var dashCount = 26;

    ctx.lineWidth = Math.max(1, zoom * 0.028);

    for (var squallIndex = 0; squallIndex < squallCount; squallIndex++) {
      var cycleOffset = hashToUnit(squallIndex, 201);
      var cyclePhase = (effectTime / 60000 + cycleOffset) % 1;
      var squallStrength = (1 - Math.cos(cyclePhase * TWO_PI)) * 0.5;
      if (squallStrength < 0.02) continue;

      ctx.strokeStyle = 'rgba(196, 218, 236, ' + (0.32 * squallStrength * alpha) + ')';
      ctx.beginPath();

      for (var dashIndex = 0; dashIndex < dashCount; dashIndex++) {
        var seed = squallIndex * 211 + dashIndex;
        var baseX = hashToUnit(seed, 202) * width;
        var baseY = hashToUnit(seed, 203) * height;
        var fallSpeed = (0.5 + hashToUnit(seed, 204) * 0.5) * sizeScale;
        var fallDistance = wrapAround(baseY + effectTime * fallSpeed, height + 80) - 40;
        var slantX = baseX + (fallDistance - baseY) * 0.22;

        ctx.moveTo(slantX, fallDistance);
        ctx.lineTo(slantX - 7 * sizeScale, fallDistance + 20 * sizeScale);
      }

      ctx.stroke();
    }
  }

  function drawTemperate(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    drawPollen(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    drawRainSqualls(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
  }

  // -------------------------------------------------------------------------
  // Desert: sand streaks + heat shimmer band
  // -------------------------------------------------------------------------

  function drawDesert(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var sizeScale = particleScale(zoom);

    // Faint heat shimmer band near the horizon (gentle gradient, no distortion).
    var shimmerCentreY = height * 0.58 + Math.sin(effectTime * 0.0005) * height * 0.02;
    var shimmerBandHeight = height * 0.14;
    var shimmerGradient = ctx.createLinearGradient(
      0, shimmerCentreY - shimmerBandHeight * 0.5,
      0, shimmerCentreY + shimmerBandHeight * 0.5
    );
    shimmerGradient.addColorStop(0, 'rgba(255, 244, 206, 0)');
    shimmerGradient.addColorStop(0.5, 'rgba(255, 246, 212, ' + (0.13 * alpha) + ')');
    shimmerGradient.addColorStop(1, 'rgba(255, 244, 206, 0)');
    ctx.fillStyle = shimmerGradient;
    ctx.fillRect(0, shimmerCentreY - shimmerBandHeight * 0.5, width, shimmerBandHeight);

    // Blowing sand streaks.
    var count = scaledParticleCount(width * height, 9000, 40, 180, zoom);

    ctx.strokeStyle = 'rgba(232, 213, 168, ' + (0.34 * alpha) + ')';
    ctx.lineWidth = Math.max(1, zoom * 0.03);
    ctx.beginPath();

    for (var index = 0; index < count; index++) {
      var baseX = hashToUnit(index, 301) * width;
      var baseY = hashToUnit(index, 302) * height;
      var speed = (0.25 + hashToUnit(index, 303) * 0.45) * sizeScale;
      var streakLength = (18 + hashToUnit(index, 304) * 55) * sizeScale;
      var parallaxFactor = 0.5 + hashToUnit(index, 305) * 0.5;
      var wobblePhase = hashToUnit(index, 306) * TWO_PI;
      var wobbleY = Math.sin(effectTime * 0.0022 + wobblePhase) * 3 * sizeScale;

      var positionX = wrapAround(baseX - cameraX * parallaxFactor + effectTime * speed, width + streakLength) - streakLength;
      var positionY = wrapAround(baseY + wobbleY - cameraY * parallaxFactor * 0.3, height + 20) - 10;

      ctx.moveTo(positionX, positionY);
      ctx.lineTo(positionX + streakLength, positionY + streakLength * 0.05);
    }

    ctx.stroke();
  }

  // -------------------------------------------------------------------------
  // Snow: two parallax layers
  // -------------------------------------------------------------------------

  function drawSnowLayer(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha, layerIndex, nearLayer, count) {
    var sizeScale = particleScale(zoom);
    var parallaxFactor = nearLayer ? 0.7 : 0.25;
    var baseRadius = nearLayer ? 2.0 : 1.0;
    var baseSpeed = nearLayer ? 0.045 : 0.018;
    var swayAmount = nearLayer ? 12 : 6;
    var layerAlpha = nearLayer ? 0.85 : 0.5;
    var seedBase = 400 + layerIndex * 13;

    ctx.fillStyle = 'rgba(255, 255, 255, ' + (layerAlpha * alpha) + ')';
    ctx.beginPath();

    for (var index = 0; index < count; index++) {
      var baseX = hashToUnit(index, seedBase) * width;
      var baseY = hashToUnit(index, seedBase + 1) * height;
      var speed = baseSpeed * (0.6 + hashToUnit(index, seedBase + 2) * 0.8) * sizeScale;
      var radius = baseRadius * (0.7 + hashToUnit(index, seedBase + 3) * 0.8) * sizeScale;
      var swayPhase = hashToUnit(index, seedBase + 4) * TWO_PI;
      var swayX = Math.sin(effectTime * 0.0012 + swayPhase) * swayAmount * sizeScale;

      var positionX = wrapAround(baseX - cameraX * parallaxFactor + swayX, width + 40) - 20;
      var positionY = wrapAround(baseY - cameraY * parallaxFactor + effectTime * speed, height + 40) - 20;

      ctx.moveTo(positionX + radius, positionY);
      ctx.arc(positionX, positionY, radius, 0, TWO_PI);
    }

    ctx.fill();
  }

  function drawSnow(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var farCount = scaledParticleCount(width * height, 20000, 40, 110, zoom);
    var nearCount = scaledParticleCount(width * height, 26000, 25, 90, zoom);

    drawSnowLayer(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha, 0, false, farCount);
    drawSnowLayer(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha, 1, true, nearCount);
  }

  // -------------------------------------------------------------------------
  // Water: mist wisps + seabird silhouettes
  // -------------------------------------------------------------------------

  function drawMistWisps(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var sizeScale = particleScale(zoom);
    var count = scaledParticleCount(width * height, 22000, 10, 40, zoom);

    ctx.fillStyle = 'rgba(214, 232, 244, ' + (0.06 * alpha) + ')';
    ctx.beginPath();

    for (var index = 0; index < count; index++) {
      var baseX = hashToUnit(index, 601) * width;
      var baseY = hashToUnit(index, 602) * height;
      var driftSpeed = (0.008 + hashToUnit(index, 603) * 0.02) * sizeScale;
      var widthRadius = (60 + hashToUnit(index, 604) * 100) * sizeScale;
      var heightRadius = (10 + hashToUnit(index, 605) * 12) * sizeScale;
      var parallaxFactor = 0.12 + hashToUnit(index, 606) * 0.1;

      var positionX = wrapAround(baseX - cameraX * parallaxFactor + effectTime * driftSpeed, width + widthRadius * 2) - widthRadius;
      var positionY = wrapAround(baseY - cameraY * parallaxFactor * 0.5, height + heightRadius * 2) - heightRadius;

      ctx.moveTo(positionX + widthRadius, positionY);
      ctx.ellipse(positionX, positionY, widthRadius, heightRadius, 0, 0, TWO_PI);
    }

    ctx.fill();
  }

  function drawSeabirds(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    var sizeScale = particleScale(zoom);
    var count = 7;

    ctx.strokeStyle = 'rgba(48, 60, 74, ' + (0.55 * alpha) + ')';
    ctx.lineWidth = Math.max(1, zoom * 0.025);

    for (var index = 0; index < count; index++) {
      var baseX = hashToUnit(index, 701) * width;
      var baseY = hashToUnit(index, 702) * height * 0.7 + height * 0.08;
      var speed = (0.02 + hashToUnit(index, 703) * 0.03) * sizeScale;
      var parallaxFactor = 0.5 + hashToUnit(index, 704) * 0.3;
      var wingSize = (6 + hashToUnit(index, 705) * 5) * sizeScale;
      var flapPhase = hashToUnit(index, 706) * TWO_PI;
      var bobPhase = hashToUnit(index, 707) * TWO_PI;

      var flap = 0.6 + 0.4 * Math.sin(effectTime * 0.006 + flapPhase);
      var positionX = wrapAround(baseX - cameraX * parallaxFactor + effectTime * speed, width + 80) - 40;
      var positionY = baseY - cameraY * parallaxFactor * 0.4 + Math.sin(effectTime * 0.0015 + bobPhase) * 6 * sizeScale;

      ctx.beginPath();
      ctx.moveTo(positionX - wingSize, positionY);
      ctx.quadraticCurveTo(
        positionX - wingSize * 0.5,
        positionY - wingSize * 0.55 * flap,
        positionX,
        positionY
      );
      ctx.quadraticCurveTo(
        positionX + wingSize * 0.5,
        positionY - wingSize * 0.55 * flap,
        positionX + wingSize,
        positionY
      );
      ctx.stroke();
    }
  }

  function drawWater(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    drawMistWisps(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    drawSeabirds(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
  }

  // -------------------------------------------------------------------------
  // Family dispatcher
  // -------------------------------------------------------------------------

  function drawFamily(ctx, family, width, height, effectTime, cameraX, cameraY, zoom, alpha) {
    if (alpha < 0.005) return;

    if (family === 'temperate') {
      drawTemperate(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    } else if (family === 'desert') {
      drawDesert(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    } else if (family === 'snow') {
      drawSnow(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    } else if (family === 'water') {
      drawWater(ctx, width, height, effectTime, cameraX, cameraY, zoom, alpha);
    }
  }

  // -------------------------------------------------------------------------
  // Public entry point
  // -------------------------------------------------------------------------

  GF.drawWeather = function (ctx, width, height, now, biome, cameraX, cameraY, zoom) {
    if (!ctx || width <= 0 || height <= 0) return;

    // Track biome changes and remember when the cross-fade started.
    if (biome !== currentBiome) {
      previousBiome = currentBiome;
      currentBiome = biome;
      biomeChangeTimeMs = now;
    }

    var animationOn = !(GF.settings && GF.settings.anim === false);
    var effectTime = animationOn ? now : 0;

    var currentFamily = familyOf(currentBiome);
    var previousFamily = previousBiome ? familyOf(previousBiome) : null;

    var currentAlpha = 1;
    var previousAlpha = 0;

    if (!animationOn) {
      // Static frame: no cross-fade motion, just paint the current family.
      previousBiome = null;
      previousFamily = null;
    } else if (previousFamily && previousFamily !== currentFamily) {
      var fadeProgress = (now - biomeChangeTimeMs) / CROSSFADE_DURATION_MS;
      if (fadeProgress < 0) fadeProgress = 0;
      if (fadeProgress > 1) fadeProgress = 1;
      currentAlpha = fadeProgress;
      previousAlpha = 1 - fadeProgress;

      if (fadeProgress >= 1) {
        previousBiome = null;
        previousFamily = null;
      }
    } else {
      // Same family (or no previous biome): no cross-fade needed.
      previousBiome = null;
      previousFamily = null;
    }

    ctx.save();
    ctx.globalCompositeOperation = 'source-over';

    if (previousFamily && previousAlpha > 0.005) {
      drawFamily(ctx, previousFamily, width, height, effectTime, cameraX, cameraY, zoom, previousAlpha);
    }
    if (currentFamily) {
      drawFamily(ctx, currentFamily, width, height, effectTime, cameraX, cameraY, zoom, currentAlpha);
    }

    ctx.restore();
  };
})(G.GFX);
