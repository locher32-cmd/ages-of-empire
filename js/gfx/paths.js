(function (GF) {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var SAMPLE_COUNT = 10;

  // Scratch buffers reused across ribbon builds (avoids per-segment allocation).
  var scratchLeftX = new Float32Array(SAMPLE_COUNT + 1);
  var scratchLeftY = new Float32Array(SAMPLE_COUNT + 1);
  var scratchRightX = new Float32Array(SAMPLE_COUNT + 1);
  var scratchRightY = new Float32Array(SAMPLE_COUNT + 1);

  // ===========================================================================
  // Part A: rivers
  // ===========================================================================

  function segmentHash(ax, ay, bx, by) {
    var hashValue = (Math.imul(ax * 100 | 0, 374761393)
                   + Math.imul(ay * 100 | 0, 668265263)
                   + Math.imul(bx * 100 | 0, 1274126177)
                   + Math.imul(by * 100 | 0, 2147483647)) | 0;
    hashValue ^= hashValue >>> 13;
    hashValue = Math.imul(hashValue, 1274126177) | 0;
    hashValue ^= hashValue >>> 16;
    return (hashValue >>> 0) / 4294967296;
  }

  function taperProfile(t, flow, isDelta) {
    var endTaperStrength = Math.max(0, 0.65 - flow * 0.65);
    var edgeSpan = 0.15;
    var distToEdge = Math.min(t, 1 - t);
    var edgeFactor;
    if (distToEdge >= edgeSpan) {
      edgeFactor = 1;
    } else {
      edgeFactor = Math.pow(distToEdge / edgeSpan, 0.6);
    }
    var factor = 1 - endTaperStrength * (1 - edgeFactor);
    if (isDelta && t > 0.7) {
      var deltaT = (t - 0.7) / 0.3;
      factor += deltaT * 1.3;
    }
    return factor;
  }

  function appendRibbon(path, ax, ay, bx, by, baseWidth, flow, isDelta, layerScale, bendAmount) {
    var dx = bx - ax;
    var dy = by - ay;
    var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / segLen;
    var perpY = dx / segLen;

    for (var sampleIndex = 0; sampleIndex <= SAMPLE_COUNT; sampleIndex++) {
      var t = sampleIndex / SAMPLE_COUNT;
      var offset = (1 - Math.cos(TWO_PI * t)) * 0.5 * bendAmount;
      var pointX = ax + dx * t + perpX * offset;
      var pointY = ay + dy * t + perpY * offset;

      var tangentOffset = Math.sin(TWO_PI * t) * Math.PI * bendAmount;
      var tangentX = dx + perpX * tangentOffset;
      var tangentY = dy + perpY * tangentOffset;
      var tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1;
      var normalX = -tangentY / tangentLen;
      var normalY = tangentX / tangentLen;

      var halfWidth = baseWidth * taperProfile(t, flow, isDelta) * layerScale * 0.5;

      scratchLeftX[sampleIndex] = pointX + normalX * halfWidth;
      scratchLeftY[sampleIndex] = pointY + normalY * halfWidth;
      scratchRightX[sampleIndex] = pointX - normalX * halfWidth;
      scratchRightY[sampleIndex] = pointY - normalY * halfWidth;
    }

    path.moveTo(scratchLeftX[0], scratchLeftY[0]);
    for (var leftIndex = 1; leftIndex <= SAMPLE_COUNT; leftIndex++) {
      path.lineTo(scratchLeftX[leftIndex], scratchLeftY[leftIndex]);
    }
    for (var rightIndex = SAMPLE_COUNT; rightIndex >= 0; rightIndex--) {
      path.lineTo(scratchRightX[rightIndex], scratchRightY[rightIndex]);
    }
    path.closePath();
  }

  function appendCenterline(path, ax, ay, bx, by, bendAmount) {
    var dx = bx - ax;
    var dy = by - ay;
    var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / segLen;
    var perpY = dx / segLen;

    for (var sampleIndex = 0; sampleIndex <= SAMPLE_COUNT; sampleIndex++) {
      var t = sampleIndex / SAMPLE_COUNT;
      var offset = (1 - Math.cos(TWO_PI * t)) * 0.5 * bendAmount;
      var pointX = ax + dx * t + perpX * offset;
      var pointY = ay + dy * t + perpY * offset;
      if (sampleIndex === 0) {
        path.moveTo(pointX, pointY);
      } else {
        path.lineTo(pointX, pointY);
      }
    }
  }

  GF.drawRivers = function (ctx, segments, now, s) {
    if (!segments || segments.length < 6 || !(s > 0)) return;

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (var boundIndex = 0; boundIndex < segments.length; boundIndex += 6) {
      var bax = segments[boundIndex], bay = segments[boundIndex + 1];
      var bbx = segments[boundIndex + 2], bby = segments[boundIndex + 3];
      if (bax < minX) minX = bax; if (bax > maxX) maxX = bax;
      if (bbx < minX) minX = bbx; if (bbx > maxX) maxX = bbx;
      if (bay < minY) minY = bay; if (bay > maxY) maxY = bay;
      if (bby < minY) minY = bby; if (bby > maxY) maxY = bby;
    }

    var skipDetail = s < 8;

    var shadowPath = new Path2D();
    var bankPath = new Path2D();
    var waterPath = new Path2D();
    var highlightPath = new Path2D();
    var centerlinePath = new Path2D();
    var deltaFoamPath = new Path2D();
    var hasDelta = false;

    for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 6) {
      var ax = segments[segmentIndex], ay = segments[segmentIndex + 1];
      var bx = segments[segmentIndex + 2], by = segments[segmentIndex + 3];
      var flow = segments[segmentIndex + 4];
      var kind = segments[segmentIndex + 5];

      var dx = bx - ax, dy = by - ay;
      var segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen < 0.5) continue;

      var baseWidth = s * (0.10 + 0.20 * flow);
      var isDelta = kind === 1;
      var bendAmount = (segmentHash(ax, ay, bx, by) * 2 - 1) * segLen * 0.10;

      appendRibbon(shadowPath, ax, ay, bx, by, baseWidth, flow, isDelta, 1.45, bendAmount);
      appendRibbon(bankPath, ax, ay, bx, by, baseWidth, flow, isDelta, 1.18, bendAmount);
      appendRibbon(waterPath, ax, ay, bx, by, baseWidth, flow, isDelta, 1.0, bendAmount);
      if (!skipDetail) {
        appendRibbon(highlightPath, ax, ay, bx, by, baseWidth, flow, isDelta, 0.35, bendAmount);
      }
      appendCenterline(centerlinePath, ax, ay, bx, by, bendAmount);

      if (isDelta) {
        hasDelta = true;
        for (var foamIndex = 0; foamIndex < 5; foamIndex++) {
          var foamAngle = (foamIndex / 5) * TWO_PI;
          var foamRadius = s * (0.12 + (foamIndex % 2) * 0.05);
          deltaFoamPath.moveTo(bx, by);
          deltaFoamPath.lineTo(
            bx + Math.cos(foamAngle) * foamRadius,
            by + Math.sin(foamAngle) * foamRadius
          );
        }
      }
    }

    // Layer 1: dark bank shadow
    ctx.fillStyle = 'rgba(10, 20, 25, 0.42)';
    ctx.fill(shadowPath);

    // Layer 2: bank (earth)
    ctx.fillStyle = 'rgba(60, 45, 30, 0.55)';
    ctx.fill(bankPath);

    // Layer 3: water body with gradient
    if (maxX > minX && maxY > minY) {
      var waterGradient = ctx.createLinearGradient(minX, minY, maxX, maxY);
      waterGradient.addColorStop(0, '#2f7fb0');
      waterGradient.addColorStop(1, '#4fb0d8');
      ctx.fillStyle = waterGradient;
    } else {
      ctx.fillStyle = '#3f8fc0';
    }
    ctx.fill(waterPath);

    // Delta foam burst
    if (hasDelta) {
      ctx.save();
      ctx.strokeStyle = 'rgba(230, 245, 255, 0.7)';
      ctx.lineWidth = Math.max(1, s * 0.03);
      ctx.lineCap = 'round';
      ctx.stroke(deltaFoamPath);
      ctx.restore();
    }

    // Layer 4: thin highlight
    if (!skipDetail) {
      ctx.fillStyle = 'rgba(190, 235, 255, 0.4)';
      ctx.fill(highlightPath);
    }

    // Animated glints and flow streaks along the centreline.
    var animTime = (GF.settings && GF.settings.anim === false) ? 0 : now;

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.setLineDash([s * 0.15, s * 0.55]);
    ctx.lineDashOffset = -animTime * 0.06;
    ctx.lineWidth = Math.max(1, s * 0.025);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.55)';
    ctx.stroke(centerlinePath);

    ctx.setLineDash([s * 0.35, s * 0.9]);
    ctx.lineDashOffset = -animTime * 0.10;
    ctx.lineWidth = Math.max(1, s * 0.045);
    ctx.strokeStyle = 'rgba(220, 245, 255, 0.35)';
    ctx.stroke(centerlinePath);

    ctx.restore();
  };

  // ===========================================================================
  // Part B: roads
  // ===========================================================================

  function appendWobblyLine(path, ax, ay, bx, by, wobbleAmplitude, wobbleFrequency, sampleCount) {
    var dx = bx - ax;
    var dy = by - ay;
    var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / segLen;
    var perpY = dx / segLen;

    for (var sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex++) {
      var t = sampleIndex / sampleCount;
      var offset = Math.sin(TWO_PI * wobbleFrequency * t) * Math.sin(Math.PI * t) * wobbleAmplitude;
      var pointX = ax + dx * t + perpX * offset;
      var pointY = ay + dy * t + perpY * offset;
      if (sampleIndex === 0) {
        path.moveTo(pointX, pointY);
      } else {
        path.lineTo(pointX, pointY);
      }
    }
  }

  function appendOffsetLine(path, ax, ay, bx, by, wobbleAmplitude, wobbleFrequency, offsetDistance, sampleCount) {
    var dx = bx - ax;
    var dy = by - ay;
    var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / segLen;
    var perpY = dx / segLen;

    for (var sampleIndex = 0; sampleIndex <= sampleCount; sampleIndex++) {
      var t = sampleIndex / sampleCount;
      var wobble = Math.sin(TWO_PI * wobbleFrequency * t) * Math.sin(Math.PI * t) * wobbleAmplitude;
      var pointX = ax + dx * t + perpX * wobble;
      var pointY = ay + dy * t + perpY * wobble;

      var tangentOffset = (TWO_PI * wobbleFrequency
                         * Math.cos(TWO_PI * wobbleFrequency * t) * Math.sin(Math.PI * t)
                         + Math.sin(TWO_PI * wobbleFrequency * t) * Math.PI * Math.cos(Math.PI * t))
                         * wobbleAmplitude;
      var tangentX = dx + perpX * tangentOffset;
      var tangentY = dy + perpY * tangentOffset;
      var tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1;
      var normalX = -tangentY / tangentLen;
      var normalY = tangentX / tangentLen;

      var finalX = pointX + normalX * offsetDistance;
      var finalY = pointY + normalY * offsetDistance;

      if (sampleIndex === 0) {
        path.moveTo(finalX, finalY);
      } else {
        path.lineTo(finalX, finalY);
      }
    }
  }

  function appendSleeperMarks(path, ax, ay, bx, by, wobbleAmplitude, wobbleFrequency, sleeperHalfWidth, sleeperCount) {
    var dx = bx - ax;
    var dy = by - ay;
    var segLen = Math.sqrt(dx * dx + dy * dy) || 1;
    var perpX = -dy / segLen;
    var perpY = dx / segLen;

    for (var sleeperIndex = 0; sleeperIndex < sleeperCount; sleeperIndex++) {
      var t = (sleeperIndex + 0.5) / sleeperCount;
      var wobble = Math.sin(TWO_PI * wobbleFrequency * t) * Math.sin(Math.PI * t) * wobbleAmplitude;
      var pointX = ax + dx * t + perpX * wobble;
      var pointY = ay + dy * t + perpY * wobble;

      var tangentOffset = (TWO_PI * wobbleFrequency
                         * Math.cos(TWO_PI * wobbleFrequency * t) * Math.sin(Math.PI * t)
                         + Math.sin(TWO_PI * wobbleFrequency * t) * Math.PI * Math.cos(Math.PI * t))
                         * wobbleAmplitude;
      var tangentX = dx + perpX * tangentOffset;
      var tangentY = dy + perpY * tangentOffset;
      var tangentLen = Math.sqrt(tangentX * tangentX + tangentY * tangentY) || 1;
      var normalX = -tangentY / tangentLen;
      var normalY = tangentX / tangentLen;

      path.moveTo(pointX - normalX * sleeperHalfWidth, pointY - normalY * sleeperHalfWidth);
      path.lineTo(pointX + normalX * sleeperHalfWidth, pointY + normalY * sleeperHalfWidth);
    }
  }

  GF.drawRoads = function (ctx, segments, now, s) {
    if (!segments || segments.length < 6 || !(s > 0)) return;

    var skipDetail = s < 8;
    var NUM_SHADE_BUCKETS = 3;

    var dirtBuckets = [];
    var pavedBuckets = [];
    var railBuckets = [];
    for (var bucketIndex = 0; bucketIndex < NUM_SHADE_BUCKETS; bucketIndex++) {
      dirtBuckets.push({ outer: new Path2D(), inner: new Path2D(), used: false });
      pavedBuckets.push({ outer: new Path2D(), inner: new Path2D(), joints: new Path2D(), used: false });
      railBuckets.push({
        ballast: new Path2D(),
        sleepers: new Path2D(),
        leftRail: new Path2D(),
        rightRail: new Path2D(),
        used: false
      });
    }

    for (var segmentIndex = 0; segmentIndex < segments.length; segmentIndex += 6) {
      var ax = segments[segmentIndex], ay = segments[segmentIndex + 1];
      var bx = segments[segmentIndex + 2], by = segments[segmentIndex + 3];
      var tier = segments[segmentIndex + 4];
      var shade = segments[segmentIndex + 5];

      var dx = bx - ax, dy = by - ay;
      var segLen = Math.sqrt(dx * dx + dy * dy);
      if (segLen < 0.5) continue;

      var shadeBucket = Math.min(
        NUM_SHADE_BUCKETS - 1,
        Math.max(0, Math.floor(shade * NUM_SHADE_BUCKETS))
      );

      if (tier === 0) {
        var dirtBucket = dirtBuckets[shadeBucket];
        dirtBucket.used = true;
        var dirtWobble = segLen * 0.06;
        appendWobblyLine(dirtBucket.outer, ax, ay, bx, by, dirtWobble, 2, 10);
        appendWobblyLine(dirtBucket.inner, ax, ay, bx, by, dirtWobble, 2, 10);
      } else if (tier === 1) {
        var pavedBucket = pavedBuckets[shadeBucket];
        pavedBucket.used = true;
        var pavedWobble = segLen * 0.025;
        appendWobblyLine(pavedBucket.outer, ax, ay, bx, by, pavedWobble, 1.5, 8);
        appendWobblyLine(pavedBucket.inner, ax, ay, bx, by, pavedWobble, 1.5, 8);
        if (!skipDetail) {
          appendWobblyLine(pavedBucket.joints, ax, ay, bx, by, pavedWobble, 1.5, 8);
        }
      } else if (tier === 2) {
        var railBucket = railBuckets[shadeBucket];
        railBucket.used = true;
        var railWobble = segLen * 0.015;
        var railOffset = s * 0.055;
        appendWobblyLine(railBucket.ballast, ax, ay, bx, by, railWobble, 1, 8);
        appendOffsetLine(railBucket.leftRail, ax, ay, bx, by, railWobble, 1, -railOffset, 8);
        appendOffsetLine(railBucket.rightRail, ax, ay, bx, by, railWobble, 1, railOffset, 8);
        if (!skipDetail) {
          var sleeperCount = Math.max(2, Math.round(segLen / (s * 0.18)));
          appendSleeperMarks(
            railBucket.sleepers, ax, ay, bx, by, railWobble, 1,
            s * 0.13, sleeperCount
          );
        }
      }
    }

    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    // Tier 0 (dirt paths)
    for (var shadeIndex = 0; shadeIndex < NUM_SHADE_BUCKETS; shadeIndex++) {
      var dirtDarken = 1 - ((shadeIndex + 0.5) / NUM_SHADE_BUCKETS) * 0.4;
      var dirt = dirtBuckets[shadeIndex];
      if (!dirt.used) continue;

      ctx.lineWidth = s * 0.14;
      ctx.strokeStyle = 'rgba(' + ((55 * dirtDarken) | 0) + ','
                                + ((38 * dirtDarken) | 0) + ','
                                + ((22 * dirtDarken) | 0) + ',0.85)';
      ctx.stroke(dirt.outer);

      ctx.lineWidth = s * 0.09;
      ctx.strokeStyle = 'rgba(' + ((140 * dirtDarken) | 0) + ','
                                + ((105 * dirtDarken) | 0) + ','
                                + ((70 * dirtDarken) | 0) + ',0.9)';
      ctx.stroke(dirt.inner);
    }

    // Tier 1 (paved roads)
    for (var pavedShadeIndex = 0; pavedShadeIndex < NUM_SHADE_BUCKETS; pavedShadeIndex++) {
      var pavedDarken = 1 - ((pavedShadeIndex + 0.5) / NUM_SHADE_BUCKETS) * 0.4;
      var paved = pavedBuckets[pavedShadeIndex];
      if (!paved.used) continue;

      ctx.lineWidth = s * 0.20;
      ctx.strokeStyle = 'rgba(' + ((50 * pavedDarken) | 0) + ','
                                + ((48 * pavedDarken) | 0) + ','
                                + ((45 * pavedDarken) | 0) + ',0.9)';
      ctx.stroke(paved.outer);

      ctx.lineWidth = s * 0.15;
      ctx.strokeStyle = 'rgba(' + ((175 * pavedDarken) | 0) + ','
                                + ((168 * pavedDarken) | 0) + ','
                                + ((155 * pavedDarken) | 0) + ',0.95)';
      ctx.stroke(paved.inner);

      if (!skipDetail) {
        ctx.save();
        ctx.lineWidth = Math.max(1, s * 0.025);
        ctx.strokeStyle = 'rgba(' + ((85 * pavedDarken) | 0) + ','
                                  + ((80 * pavedDarken) | 0) + ','
                                  + ((72 * pavedDarken) | 0) + ',0.7)';
        ctx.setLineDash([s * 0.04, s * 0.12]);
        ctx.stroke(paved.joints);
        ctx.restore();
      }
    }

    // Tier 2 (railroad)
    for (var railShadeIndex = 0; railShadeIndex < NUM_SHADE_BUCKETS; railShadeIndex++) {
      var railDarken = 1 - ((railShadeIndex + 0.5) / NUM_SHADE_BUCKETS) * 0.4;
      var rail = railBuckets[railShadeIndex];
      if (!rail.used) continue;

      ctx.lineWidth = s * 0.22;
      ctx.strokeStyle = 'rgba(' + ((105 * railDarken) | 0) + ','
                                + ((98 * railDarken) | 0) + ','
                                + ((88 * railDarken) | 0) + ',0.85)';
      ctx.stroke(rail.ballast);

      if (!skipDetail) {
        ctx.lineWidth = Math.max(1, s * 0.045);
        ctx.strokeStyle = 'rgba(' + ((45 * railDarken) | 0) + ','
                                  + ((32 * railDarken) | 0) + ','
                                  + ((20 * railDarken) | 0) + ',0.9)';
        ctx.stroke(rail.sleepers);
      }

      ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.strokeStyle = 'rgba(' + ((180 * railDarken) | 0) + ','
                                + ((185 * railDarken) | 0) + ','
                                + ((190 * railDarken) | 0) + ',0.95)';
      ctx.stroke(rail.leftRail);
      ctx.stroke(rail.rightRail);
    }

    ctx.restore();
  };

  // ===========================================================================
  // Part C: bridge
  // ===========================================================================

  GF.drawBridge = function (ctx, x, y, angle, s, tier) {
    if (!(s > 0)) return;

    var deckLength = s * 0.85;
    var halfDeckLength = deckLength * 0.5;
    var deckWidth = s * 0.26;
    var wallHeight = s * 0.16;

    var stoneLight, stoneMid, stoneDark, mortar;
    if (tier === 0) {
      stoneLight = '#b08860';
      stoneMid = '#7a5838';
      stoneDark = '#4a3020';
      mortar = 'rgba(30, 20, 10, 0.5)';
    } else {
      stoneLight = '#c8c0b0';
      stoneMid = '#8a8070';
      stoneDark = '#5a5040';
      mortar = 'rgba(40, 35, 25, 0.6)';
    }

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);

    // Drop shadow under the bridge
    ctx.fillStyle = 'rgba(0, 0, 0, 0.35)';
    ctx.beginPath();
    ctx.ellipse(0, deckWidth * 0.35, halfDeckLength * 1.05, deckWidth * 0.55, 0, 0, TWO_PI);
    ctx.fill();

    // Front wall
    var wallGradient = ctx.createLinearGradient(0, 0, 0, wallHeight);
    wallGradient.addColorStop(0, stoneMid);
    wallGradient.addColorStop(0.5, stoneDark);
    wallGradient.addColorStop(1, 'rgba(20, 15, 10, 0.9)');
    ctx.fillStyle = wallGradient;
    ctx.fillRect(-halfDeckLength, 0, deckLength, wallHeight);

    // Arch openings cut into the wall
    var archCount = Math.max(1, Math.round(deckLength / (s * 0.4)));
    var archRadius = deckLength / archCount * 0.28;
    ctx.fillStyle = 'rgba(10, 8, 5, 0.85)';
    ctx.beginPath();
    for (var archIndex = 0; archIndex < archCount; archIndex++) {
      var archCenterX = -halfDeckLength + (archIndex + 0.5) * (deckLength / archCount);
      ctx.moveTo(archCenterX - archRadius, wallHeight);
      ctx.arc(archCenterX, wallHeight, archRadius, Math.PI, TWO_PI);
      ctx.closePath();
    }
    ctx.fill();

    // Deck top surface
    var deckGradient = ctx.createLinearGradient(0, -deckWidth, 0, 0);
    deckGradient.addColorStop(0, stoneLight);
    deckGradient.addColorStop(0.7, stoneMid);
    deckGradient.addColorStop(1, stoneDark);
    ctx.fillStyle = deckGradient;
    ctx.fillRect(-halfDeckLength, -deckWidth, deckLength, deckWidth);

    // Deck edge highlight
    ctx.strokeStyle = 'rgba(255, 250, 235, 0.45)';
    ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath();
    ctx.moveTo(-halfDeckLength, -deckWidth);
    ctx.lineTo(halfDeckLength, -deckWidth);
    ctx.stroke();

    // Cobble joints across the deck
    var cobbleCount = Math.max(3, Math.round(deckLength / (s * 0.15)));
    ctx.strokeStyle = mortar;
    ctx.lineWidth = Math.max(1, s * 0.015);
    ctx.beginPath();
    for (var cobbleIndex = 1; cobbleIndex < cobbleCount; cobbleIndex++) {
      var cobbleX = -halfDeckLength + (deckLength * cobbleIndex) / cobbleCount;
      ctx.moveTo(cobbleX, -deckWidth);
      ctx.lineTo(cobbleX, 0);
    }
    ctx.stroke();

    // Railing posts along the far edge
    var postCount = Math.max(2, Math.round(deckLength / (s * 0.2)));
    ctx.fillStyle = stoneDark;
    for (var postIndex = 0; postIndex <= postCount; postIndex++) {
      var postX = -halfDeckLength + (deckLength * postIndex) / postCount;
      ctx.fillRect(postX - s * 0.018, -deckWidth - s * 0.05, s * 0.036, s * 0.05);
    }

    // Railing bar
    ctx.strokeStyle = stoneDark;
    ctx.lineWidth = Math.max(1, s * 0.02);
    ctx.beginPath();
    ctx.moveTo(-halfDeckLength, -deckWidth - s * 0.04);
    ctx.lineTo(halfDeckLength, -deckWidth - s * 0.04);
    ctx.stroke();

    ctx.restore();
  };

})(G.GFX);
