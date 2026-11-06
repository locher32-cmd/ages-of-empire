(function (GF) {
  'use strict';
  var TILT = typeof GF.TILT === 'number' ? GF.TILT : 0.80;
  var NOMINAL_RADIUS = 40;
  var NOMINAL_HEX_WIDTH = NOMINAL_RADIUS * 2;
  var NOMINAL_HEX_HEIGHT = Math.round(NOMINAL_RADIUS * 2 * TILT);
  var CAUSTIC_PERIOD = 144;
  var CAUSTIC_MARGIN = 6;
  var CAUSTIC_ALPHA_A = 0.55;
  var CAUSTIC_ALPHA_B = 0.42;
  var CAUSTIC_SPEED_A_X = 0.014;
  var CAUSTIC_SPEED_A_Y = 0.008;
  var CAUSTIC_SPEED_B_X = -0.021;
  var CAUSTIC_SPEED_B_Y = 0.013;
  var CREST_VARIANTS = 6;
  var CREST_DRIFT = 14;
  var DEPTH_STEPS = 96;
  var DEPTH_STOPS = [
    { position: 0.00, red: 79,  green: 208, blue: 208 },
    { position: 0.30, red: 62,  green: 165, blue: 196 },
    { position: 0.62, red: 34,  green: 98,  blue: 158 },
    { position: 1.00, red: 13,  green: 44,  blue: 85  }
  ];

  function buildDepthColours() {
    var colours = [];
    for (var step = 0; step < DEPTH_STEPS; step++) {
      var depth = step / (DEPTH_STEPS - 1);
      var lowerStop = DEPTH_STOPS[0];
      var upperStop = DEPTH_STOPS[DEPTH_STOPS.length - 1];
      for (var stopIndex = 0; stopIndex < DEPTH_STOPS.length - 1; stopIndex++) {
        if (depth >= DEPTH_STOPS[stopIndex].position && depth <= DEPTH_STOPS[stopIndex + 1].position) {
          lowerStop = DEPTH_STOPS[stopIndex];
          upperStop = DEPTH_STOPS[stopIndex + 1];
          break;
        }
      }
      var stopSpan = upperStop.position - lowerStop.position;
      var mix = stopSpan > 0 ? (depth - lowerStop.position) / stopSpan : 0;
      var red = Math.round(lowerStop.red + (upperStop.red - lowerStop.red) * mix);
      var green = Math.round(lowerStop.green + (upperStop.green - lowerStop.green) * mix);
      var blue = Math.round(lowerStop.blue + (upperStop.blue - lowerStop.blue) * mix);
      colours.push('rgb(' + red + ',' + green + ',' + blue + ')');
    }
    return colours;
  }

  function buildCausticTexture(primaryField, secondaryField, primaryWeight, gamma, tintRed, tintGreen, tintBlue) {
    var canvasWidth = CAUSTIC_PERIOD + NOMINAL_HEX_WIDTH + CAUSTIC_MARGIN * 2;
    var canvasHeight = CAUSTIC_PERIOD + NOMINAL_HEX_HEIGHT + CAUSTIC_MARGIN * 2;
    var canvas = GF.mk(canvasWidth, canvasHeight);
    var surface = canvas.getContext('2d');
    var image = surface.createImageData(canvasWidth, canvasHeight);
    var pixels = image.data;
    var secondaryWeight = 1 - primaryWeight;
    for (var pixelY = 0; pixelY < canvasHeight; pixelY++) {
      var sampleV = (pixelY % CAUSTIC_PERIOD) / CAUSTIC_PERIOD;
      for (var pixelX = 0; pixelX < canvasWidth; pixelX++) {
        var sampleU = (pixelX % CAUSTIC_PERIOD) / CAUSTIC_PERIOD;
        var noiseValue =
          GF.sample(primaryField, sampleU, sampleV) * primaryWeight +
          GF.sample(secondaryField, sampleU, sampleV) * secondaryWeight;
        var intensity = Math.pow(noiseValue, gamma) * 175;
        if (intensity > 255) intensity = 255;
        var pixelOffset = (pixelY * canvasWidth + pixelX) * 4;
        pixels[pixelOffset] = tintRed;
        pixels[pixelOffset + 1] = tintGreen;
        pixels[pixelOffset + 2] = tintBlue;
        pixels[pixelOffset + 3] = intensity | 0;
      }
    }
    surface.putImageData(image, 0, 0);
    return { canvas: canvas, width: canvasWidth, height: canvasHeight, period: CAUSTIC_PERIOD };
  }

  function paintCrest(surface, crestX, crestY, crestWidth, crestHeight) {
    var verticalStretch = crestHeight / crestWidth;
    surface.save();
    surface.translate(crestX, crestY);
    surface.scale(1, verticalStretch);
    var foamGradient = surface.createRadialGradient(0, 0, 0, 0, 0, crestWidth * 0.5);
    foamGradient.addColorStop(0, 'rgba(255,255,255,0.80)');
    foamGradient.addColorStop(0.45, 'rgba(232,248,255,0.42)');
    foamGradient.addColorStop(1, 'rgba(206,240,255,0)');
    surface.fillStyle = foamGradient;
    surface.beginPath();
    surface.arc(0, 0, crestWidth * 0.5, 0, Math.PI * 2);
    surface.fill();
    surface.restore();
    surface.save();
    surface.globalCompositeOperation = 'lighter';
    surface.translate(crestX - crestWidth * 0.20, crestY - crestHeight * 0.55);
    surface.scale(1, verticalStretch);
    var glintRadius = crestWidth * 0.26;
    var glintGradient = surface.createRadialGradient(0, 0, 0, 0, 0, glintRadius);
    glintGradient.addColorStop(0, 'rgba(255,255,255,0.95)');
    glintGradient.addColorStop(0.45, 'rgba(216,242,255,0.35)');
    glintGradient.addColorStop(1, 'rgba(200,235,255,0)');
    surface.fillStyle = glintGradient;
    surface.beginPath();
    surface.arc(0, 0, glintRadius, 0, Math.PI * 2);
    surface.fill();
    surface.restore();
  }

  function buildCrestSheet(variantIndex) {
    var canvasWidth = NOMINAL_HEX_WIDTH + CREST_DRIFT * 2;
    var canvasHeight = NOMINAL_HEX_HEIGHT + CREST_DRIFT * 2;
    var canvas = GF.mk(canvasWidth, canvasHeight);
    var surface = canvas.getContext('2d');
    var random = GF.rng(9176 + variantIndex * 7919);
    var crestCount = 3 + Math.floor(random() * 3);
    for (var crestIndex = 0; crestIndex < crestCount; crestIndex++) {
      var crestX = CREST_DRIFT + NOMINAL_HEX_WIDTH * (0.12 + random() * 0.76);
      var crestY = CREST_DRIFT + NOMINAL_HEX_HEIGHT * (0.15 + random() * 0.70);
      var crestWidth = NOMINAL_HEX_WIDTH * (0.16 + random() * 0.16);
      var crestHeight = crestWidth * (0.30 + random() * 0.14);
      paintCrest(surface, crestX, crestY, crestWidth, crestHeight);
    }
    return { canvas: canvas, width: canvasWidth, height: canvasHeight };
  }

  function wrapValue(value, period) {
    var wrapped = value % period;
    return wrapped < 0 ? wrapped + period : wrapped;
  }

  function tileNoise(tileId, salt) {
    var value = (Math.imul(tileId | 0, 374761393) + Math.imul(salt | 0, 668265263)) | 0;
    value = Math.imul(value ^ (value >>> 13), 1274126177) | 0;
    return ((value ^ (value >>> 16)) >>> 0) / 4294967296;
  }

  function drawCausticLayer(ctx, texture, offsetX, offsetY, centreX, centreY, hexWidth, hexHeight, scale) {
    var periodScreen = texture.period * scale;
    var destinationLeft = centreX - hexWidth * 0.5 - CAUSTIC_MARGIN * scale + offsetX - periodScreen;
    var destinationTop = centreY - hexHeight * 0.5 - CAUSTIC_MARGIN * scale + offsetY - periodScreen;
    ctx.drawImage(texture.canvas, destinationLeft, destinationTop, texture.width * scale, texture.height * scale);
  }

  var depthColours = buildDepthColours();
  var noiseFields = GF.fields();
  var causticTextureA = buildCausticTexture(noiseFields.mid, noiseFields.hi, 0.55, 2.9, 198, 246, 255);
  var causticTextureB = buildCausticTexture(noiseFields.low, noiseFields.hi, 0.45, 3.6, 168, 226, 255);
  var crestSheets = [];
  for (var variantIndex = 0; variantIndex < CREST_VARIANTS; variantIndex++) crestSheets.push(buildCrestSheet(variantIndex));

  GF.waterTuning = { causticScale: 1, crestScale: 1, fill: true };

  GF.drawWater = function (ctx, tiles, now, s, getInfo) {
    if (!tiles || tiles.length < 4 || !s || !getInfo) return;
    var animationOn = !(GF.settings && GF.settings.anim === false);
    var time = animationOn ? now : 0;
    var scale = s / NOMINAL_RADIUS;
    var hexWidth = s * 2;
    var hexHeight = hexWidth * TILT;
    var causticPeriodScreen = CAUSTIC_PERIOD * scale;
    var crestDriftAmplitude = CREST_DRIFT * scale * 0.8;
    var tuning = GF.waterTuning;
    for (var index = 0; index + 3 < tiles.length; index += 4) {
      var tileId = tiles[index];
      var centreX = tiles[index + 1];
      var centreY = tiles[index + 2];
      var tileInfo = getInfo(tileId);
      if (!tileInfo || !tileInfo.kind) continue;
      var depth = tileInfo.depth;
      if (!(depth >= 0)) depth = 0;
      if (depth > 1) depth = 1;
      ctx.save();
      GF.hexPath(ctx, centreX, centreY, s + 0.5);
      ctx.clip();
      ctx.fillStyle = depthColours[(depth * (DEPTH_STEPS - 1) + 0.5) | 0];
      ctx.fillRect(centreX - s - 1, centreY - s - 1, s * 2 + 2, s * 2 + 2);
      ctx.globalCompositeOperation = 'lighter';
      ctx.globalAlpha = CAUSTIC_ALPHA_A * tuning.causticScale;
      drawCausticLayer(ctx, causticTextureA,
        wrapValue(time * CAUSTIC_SPEED_A_X + tileNoise(tileId, 11) * causticPeriodScreen, causticPeriodScreen),
        wrapValue(time * CAUSTIC_SPEED_A_Y + tileNoise(tileId, 12) * causticPeriodScreen, causticPeriodScreen),
        centreX, centreY, hexWidth, hexHeight, scale);
      ctx.globalAlpha = CAUSTIC_ALPHA_B * tuning.causticScale;
      drawCausticLayer(ctx, causticTextureB,
        wrapValue(time * CAUSTIC_SPEED_B_X + tileNoise(tileId, 13) * causticPeriodScreen, causticPeriodScreen),
        wrapValue(time * CAUSTIC_SPEED_B_Y + tileNoise(tileId, 14) * causticPeriodScreen, causticPeriodScreen),
        centreX, centreY, hexWidth, hexHeight, scale);
      ctx.globalCompositeOperation = 'source-over';
      var crestSheet = crestSheets[(tileNoise(tileId, 21) * CREST_VARIANTS) | 0];
      var driftPhase = tileNoise(tileId, 22) * Math.PI * 2;
      var fadePhase = tileNoise(tileId, 23) * Math.PI * 2;
      var driftX = Math.sin(time * 0.00062 + driftPhase) * crestDriftAmplitude;
      var driftY = Math.cos(time * 0.00047 + driftPhase * 1.7) * crestDriftAmplitude * 0.45;
      var fade = 0.5 + 0.5 * Math.sin(time * 0.0019 + fadePhase);
      ctx.globalAlpha = (0.18 + 0.60 * fade) * (1 - depth * 0.35) * tuning.crestScale;
      ctx.drawImage(crestSheet.canvas,
        centreX - crestSheet.width * scale * 0.5 + driftX,
        centreY - crestSheet.height * scale * 0.5 + driftY,
        crestSheet.width * scale, crestSheet.height * scale);
      ctx.restore();
    }
  };
})(G.GFX);
