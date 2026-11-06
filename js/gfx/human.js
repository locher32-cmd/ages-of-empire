(function (GF) {
  'use strict';

  var TWO_PI = Math.PI * 2;
  var DEFAULT_SKIN = '#c89870';
  var DEFAULT_HAIR = '#3a2418';

  function hexToRgb(css) {
    if (!css) return [200, 150, 120];
    if (css.charAt(0) === '#') {
      var hex = css.slice(1);
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      return [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
    }
    var m = css.match(/\d+(\.\d+)?/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return [200, 150, 120];
  }
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lighten(css, amt) {
    var rgb = hexToRgb(css);
    return 'rgb(' + Math.round(rgb[0] + (255-rgb[0])*amt) + ',' + Math.round(rgb[1] + (255-rgb[1])*amt) + ',' + Math.round(rgb[2] + (255-rgb[2])*amt) + ')';
  }
  function shade(css, amt) {
    var rgb = hexToRgb(css);
    return 'rgb(' + Math.round(rgb[0]*amt) + ',' + Math.round(rgb[1]*amt) + ',' + Math.round(rgb[2]*amt) + ')';
  }
  function tintRgb(css, dr, dg, db) {
    var rgb = hexToRgb(css);
    return 'rgb(' + clamp(rgb[0]+dr,0,255) + ',' + clamp(rgb[1]+dg,0,255) + ',' + clamp(rgb[2]+db,0,255) + ')';
  }

  function capsulePath(ctx, sx, sy, ex, ey, sw, ew) {
    var dx = ex - sx, dy = ey - sy;
    var len = Math.sqrt(dx*dx + dy*dy) || 1;
    var nx = -dy / len, ny = dx / len;
    var r1 = Math.max(0.4, sw / 2), r2 = Math.max(0.4, ew / 2);
    var nAngle = Math.atan2(ny, nx);
    ctx.beginPath();
    ctx.moveTo(sx + nx * r1, sy + ny * r1);
    ctx.lineTo(ex + nx * r2, ey + ny * r2);
    ctx.arc(ex, ey, r2, nAngle, nAngle - Math.PI, true);
    ctx.lineTo(sx - nx * r1, sy - ny * r1);
    ctx.arc(sx, sy, r1, nAngle + Math.PI, nAngle, true);
    ctx.closePath();
  }

  function fillLimb(ctx, sx, sy, ex, ey, sw, ew, baseColor) {
    var dx = ex - sx, dy = ey - sy;
    var len = Math.sqrt(dx*dx + dy*dy) || 1;
    var nx = -dy / len, ny = dx / len;
    if (nx * -1 + ny * -1 < 0) { nx = -nx; ny = -ny; }
    var cx = (sx + ex) / 2, cy = (sy + ey) / 2;
    var halfW = (sw + ew) / 4;
    var grad = ctx.createLinearGradient(cx + nx*halfW, cy + ny*halfW, cx - nx*halfW, cy - ny*halfW);
    grad.addColorStop(0, lighten(baseColor, 0.35));
    grad.addColorStop(0.35, baseColor);
    grad.addColorStop(0.85, shade(baseColor, 0.65));
    grad.addColorStop(1, shade(baseColor, 0.4));
    capsulePath(ctx, sx, sy, ex, ey, sw, ew);
    ctx.fillStyle = grad;
    ctx.fill();
  }

  function drawHead(ctx, cx, cy, radius, skin, hair, hairStyle, facing) {
    var w = radius * 0.9;
    var h = radius * 1.02;
    var chinShift = facing * w * 0.1;

    var grad = ctx.createRadialGradient(cx - w * 0.4, cy - h * 0.4, radius * 0.1, cx, cy, radius * 1.3);
    grad.addColorStop(0, lighten(skin, 0.4));
    grad.addColorStop(0.5, skin);
    grad.addColorStop(1, shade(skin, 0.55));

    ctx.beginPath();
    ctx.moveTo(cx, cy - h);
    ctx.bezierCurveTo(cx + w * 0.9, cy - h * 0.9, cx + w * 1.05, cy - h * 0.15, cx + w, cy + h * 0.15);
    ctx.bezierCurveTo(cx + w * 0.9, cy + h * 0.6, cx + w * 0.5 + chinShift, cy + h * 0.95, cx + chinShift, cy + h);
    ctx.bezierCurveTo(cx - w * 0.5 + chinShift, cy + h * 0.95, cx - w * 0.9, cy + h * 0.6, cx - w, cy + h * 0.15);
    ctx.bezierCurveTo(cx - w * 1.05, cy - h * 0.15, cx - w * 0.9, cy - h * 0.9, cx, cy - h);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    if (radius > 2) {
      ctx.beginPath();
      ctx.moveTo(cx + chinShift, cy + h);
      ctx.bezierCurveTo(cx + w * 0.7, cy + h * 0.85, cx + w * 0.8, cy + h * 0.4, cx + w * 0.8, cy + h * 0.4);
      ctx.lineTo(cx - w * 0.8, cy + h * 0.4);
      ctx.bezierCurveTo(cx - w * 0.8, cy + h * 0.4, cx - w * 0.7, cy + h * 0.85, cx - w * 0.5 + chinShift, cy + h * 0.95);
      ctx.closePath();
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.fill();
    }

    if (radius > 2.5) {
      ctx.fillStyle = 'rgba(0,0,0,0.10)';
      ctx.beginPath();
      ctx.ellipse(cx + facing * w * 0.15, cy - h * 0.08, w * 0.5, h * 0.09, 0, 0, TWO_PI);
      ctx.fill();
    }

    if (radius > 3) {
      var eyeY = cy - h * 0.1;
      var eyeSpacing = w * 0.3;
      var eyeSize = Math.max(0.4, w * 0.07);
      ctx.fillStyle = '#1a1008';
      ctx.beginPath();
      ctx.ellipse(cx + facing * w * 0.12 - eyeSpacing * 0.5, eyeY, eyeSize, eyeSize * 0.7, 0, 0, TWO_PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(cx + facing * w * 0.12 + eyeSpacing * 0.5, eyeY, eyeSize, eyeSize * 0.7, 0, 0, TWO_PI);
      ctx.fill();
    }

    if (radius > 3.5) {
      ctx.fillStyle = lighten(skin, 0.5);
      ctx.beginPath();
      ctx.ellipse(cx + facing * w * 0.32, cy + h * 0.05, w * 0.08, h * 0.14, 0, 0, TWO_PI);
      ctx.fill();
    }

    if (hairStyle >= 0 && hair) {
      ctx.fillStyle = hair;
      ctx.beginPath();
      if (hairStyle === 0) {
        ctx.moveTo(cx - w * 0.95, cy - h * 0.2);
        ctx.bezierCurveTo(cx - w * 1.0, cy - h * 1.1, cx + w * 1.0, cy - h * 1.1, cx + w * 0.95, cy - h * 0.2);
        ctx.bezierCurveTo(cx + w * 0.9, cy - h * 0.6, cx - w * 0.9, cy - h * 0.6, cx - w * 0.95, cy - h * 0.2);
      } else if (hairStyle === 1) {
        var backSide = -facing;
        ctx.moveTo(cx - w * 0.95, cy - h * 0.3);
        ctx.bezierCurveTo(cx - w * 1.0, cy - h * 1.1, cx + w * 1.0, cy - h * 1.1, cx + w * 0.95, cy - h * 0.3);
        ctx.lineTo(cx + backSide * w * 0.5, cy + h * 0.85);
        ctx.bezierCurveTo(cx - w * 0.3 + backSide * w * 0.2, cy + h * 0.6, cx - w * 0.8, cy, cx - w * 0.95, cy - h * 0.3);
      } else if (hairStyle === 2) {
        ctx.moveTo(cx - w * 0.9, cy - h * 0.15);
        ctx.bezierCurveTo(cx - w * 1.0, cy - h * 1.15, cx + w * 1.0, cy - h * 1.15, cx + w * 0.9, cy - h * 0.15);
        ctx.lineTo(cx - facing * w * 1.1, cy - h * 0.05);
        ctx.closePath();
        ctx.fill();
        ctx.beginPath();
        ctx.arc(cx - facing * w * 1.0, cy - h * 0.1, radius * 0.35, 0, TWO_PI);
      } else {
        ctx.moveTo(cx - w * 0.6, cy - h * 0.5);
        ctx.bezierCurveTo(cx - w * 0.7, cy - h * 1.0, cx + w * 0.7, cy - h * 1.0, cx + w * 0.6, cy - h * 0.5);
        ctx.bezierCurveTo(cx + w * 0.3, cy - h * 0.8, cx - w * 0.3, cy - h * 0.8, cx - w * 0.6, cy - h * 0.5);
      }
      ctx.closePath();
      ctx.fill();

      if (radius > 3) {
        ctx.strokeStyle = lighten(hair, 0.35);
        ctx.lineWidth = Math.max(0.4, radius * 0.08);
        ctx.beginPath();
        ctx.moveTo(cx - w * 0.3, cy - h * 0.85);
        ctx.quadraticCurveTo(cx - w * 0.05, cy - h * 0.95, cx + w * 0.2, cy - h * 0.85);
        ctx.moveTo(cx - w * 0.15, cy - h * 0.75);
        ctx.quadraticCurveTo(cx + w * 0.1, cy - h * 0.82, cx + w * 0.3, cy - h * 0.72);
        ctx.stroke();
      }
    }
  }

  function drawSimple(ctx, footX, footY, height, mainColor, skin, facing, anchors) {
    var headRadius = height * 0.13;
    var headCenterY = footY - height + headRadius;
    var bodyTop = headCenterY + headRadius * 1.4;
    var bodyHeight = height * 0.38;
    var legTop = bodyTop + bodyHeight;
    var bodyHalfW = height * 0.13;

    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(footX + facing * height * 0.02, headCenterY, headRadius, 0, TWO_PI);
    ctx.fill();

    ctx.fillStyle = mainColor;
    ctx.fillRect(footX - bodyHalfW, bodyTop, bodyHalfW * 2, bodyHeight);

    ctx.fillStyle = shade(mainColor, 0.7);
    ctx.fillRect(footX - bodyHalfW * 0.8, legTop, bodyHalfW * 0.65, footY - legTop);
    ctx.fillRect(footX + bodyHalfW * 0.15, legTop, bodyHalfW * 0.65, footY - legTop);

    anchors.height = height;
    anchors.head = { x: footX + facing * height * 0.02, y: headCenterY, radius: headRadius };
    anchors.neck = { x: footX, y: headCenterY + headRadius * 1.3 };
    anchors.chest = { x: footX, y: bodyTop + bodyHeight * 0.5, width: bodyHalfW * 2, height: bodyHeight };
    anchors.hip = { x: footX, y: legTop };
    anchors.shoulderLeft = { x: footX - facing * bodyHalfW, y: bodyTop + height * 0.03 };
    anchors.shoulderRight = { x: footX + facing * bodyHalfW, y: bodyTop + height * 0.03 };
    anchors.handLeft = { x: footX - facing * bodyHalfW * 1.1, y: legTop - height * 0.05 };
    anchors.handRight = { x: footX + facing * bodyHalfW * 1.1, y: legTop - height * 0.05 };
    anchors.footLeft = { x: footX - bodyHalfW * 0.5, y: footY };
    anchors.footRight = { x: footX + bodyHalfW * 0.5, y: footY };
    anchors.forwardX = facing;
  }

  GF.drawHuman = function (ctx, footX, footY, height, options) {
    if (!ctx || !(height > 0)) return;
    options = options || {};

    var era = options.era === undefined ? 0 : options.era;
    var mainColor = options.mainColor || '#4488cc';
    var accentColor = options.accentColor || '#ddc34a';
    var skin = options.skin || DEFAULT_SKIN;
    var hair = options.hair === undefined ? DEFAULT_HAIR : options.hair;
    var pose = options.pose || 'stand';
    var facing = options.facing === -1 ? -1 : 1;
    var robe = !!options.robe;
    var civilian = !!options.civilian;
    var randomFn = typeof options.random === 'function' ? options.random : function () { return 0.5; };

    var anchors = {};
    if (height < 10) {
      drawSimple(ctx, footX, footY, height, mainColor, skin, facing, anchors);
      if (typeof GF.drawGear === 'function') {
        GF.drawGear(ctx, 'back', anchors, options);
        GF.drawGear(ctx, 'torso', anchors, options);
        GF.drawGear(ctx, 'head', anchors, options);
        GF.drawGear(ctx, 'hands', anchors, options);
      }
      return;
    }

    var buildFactor = 0.93 + randomFn() * 0.14;
    var skinShift = (randomFn() - 0.5) * 28;
    skin = tintRgb(skin, skinShift, skinShift * 0.65, skinShift * 0.45);
    var hairStyle = Math.floor(randomFn() * 4);
    var clothWear = randomFn();

    var headUnit = height / 7.5;
    var headRadius = headUnit / 2;
    var crownY = footY - height;
    var chinY = crownY + headUnit;
    var neckBottomY = chinY + headUnit * 0.18;
    var shoulderY = neckBottomY;
    var chestCenterY = shoulderY + headUnit * 0.5;
    var waistY = shoulderY + headUnit * 1.5;
    var hipY = shoulderY + headUnit * 2.3;
    var kneeY = footY - headUnit * 1.95;

    var torsoCenterX = footX;
    var headCenterX = torsoCenterX + facing * headRadius * 0.15;
    var headCenterY = crownY + headRadius;

    var shoulderHalfWidth = headUnit * 0.85 * buildFactor;
    var hipHalfWidth = headUnit * 0.58 * buildFactor;
    var waistHalfWidth = hipHalfWidth * 0.85;

    var poseData = computePose(pose, facing, headUnit, shoulderY, waistY, hipY, kneeY, shoulderHalfWidth, hipHalfWidth, torsoCenterX, footY, chestCenterY, chinY);

    anchors.height = height;
    anchors.head = { x: headCenterX, y: headCenterY, radius: headRadius };
    anchors.neck = { x: torsoCenterX, y: neckBottomY };
    anchors.chest = { x: torsoCenterX, y: chestCenterY, width: shoulderHalfWidth * 2, height: hipY - shoulderY };
    anchors.hip = { x: torsoCenterX, y: hipY };
    anchors.shoulderLeft = poseData.leftShoulder;
    anchors.shoulderRight = poseData.rightShoulder;
    anchors.handLeft = poseData.leftHand;
    anchors.handRight = poseData.rightHand;
    anchors.footLeft = poseData.leftFoot;
    anchors.footRight = poseData.rightFoot;
    anchors.forwardX = facing;

    var sleeveColor, trouserColor, torsoColor, bootColor, bareArms, bareLegs;
    if (civilian) {
      sleeveColor = lighten(mainColor, 0.12);
      trouserColor = shade(mainColor, 0.7);
      torsoColor = sleeveColor;
      bootColor = shade('#3a2418', 0.8);
      bareArms = era <= 1;
      bareLegs = era === 0;
    } else if (era === 0) {
      sleeveColor = skin; trouserColor = skin; torsoColor = mainColor;
      bootColor = skin; bareArms = true; bareLegs = true;
    } else if (era === 1) {
      sleeveColor = skin; trouserColor = shade(mainColor, 0.7); torsoColor = mainColor;
      bootColor = shade('#3a2418', 0.7); bareArms = true; bareLegs = false;
    } else if (era === 2) {
      sleeveColor = shade(mainColor, 0.72); trouserColor = shade(mainColor, 0.55);
      torsoColor = shade('#6a5c3a', 0.95); bootColor = shade('#2a1a08', 0.8);
      bareArms = false; bareLegs = false;
    } else if (era === 3) {
      sleeveColor = mainColor; trouserColor = shade(mainColor, 0.7);
      torsoColor = lighten(mainColor, 0.05); bootColor = shade('#2a1a08', 0.6);
      bareArms = false; bareLegs = false;
    } else if (era === 4) {
      sleeveColor = shade(mainColor, 0.7); trouserColor = shade(mainColor, 0.6);
      torsoColor = shade(mainColor, 0.75); bootColor = shade('#1a1208', 0.5);
      bareArms = false; bareLegs = false;
    } else if (era === 5) {
      sleeveColor = shade('#5a6842', 0.9); trouserColor = shade('#4a5636', 0.9);
      torsoColor = shade('#5a6842', 0.9); bootColor = shade('#201a08', 0.6);
      bareArms = false; bareLegs = false;
    } else {
      sleeveColor = shade('#222838', 1.0); trouserColor = shade('#222838', 0.9);
      torsoColor = shade('#2a3040', 1.0); bootColor = shade('#101418', 1.0);
      bareArms = false; bareLegs = false;
    }

    // --- 1) Back gear ---
    if (typeof GF.drawGear === 'function') GF.drawGear(ctx, 'back', anchors, options);

    // --- 2) Far arm + far leg (behind torso) ---
    if (!robe) {
      drawLeg(ctx, poseData.leftHip, poseData.leftKnee, poseData.leftFoot, skin, trouserColor, bootColor, bareLegs, buildFactor, headUnit, facing);
    }
    drawArm(ctx, poseData.leftShoulder, poseData.leftElbow, poseData.leftHand, skin, sleeveColor, bareArms, buildFactor, headUnit);

    // --- 3) Near leg ---
    if (!robe) {
      drawLeg(ctx, poseData.rightHip, poseData.rightKnee, poseData.rightFoot, skin, trouserColor, bootColor, bareLegs, buildFactor, headUnit, facing);
    }

    // --- 4) Torso + clothing ---
    drawTorso(ctx, torsoCenterX, shoulderY, chestCenterY, waistY, hipY, footY, shoulderHalfWidth, waistHalfWidth, hipHalfWidth, torsoColor, accentColor, era, civilian, robe, facing);

    // --- 5) Near arm ---
    drawArm(ctx, poseData.rightShoulder, poseData.rightElbow, poseData.rightHand, skin, sleeveColor, bareArms, buildFactor, headUnit);

    // --- 6) Neck ---
    var neckW = headUnit * 0.34;
    var neckGrad = ctx.createLinearGradient(headCenterX - neckW, 0, headCenterX + neckW, 0);
    neckGrad.addColorStop(0, lighten(skin, 0.15));
    neckGrad.addColorStop(1, shade(skin, 0.7));
    ctx.beginPath();
    ctx.moveTo(headCenterX - neckW * 0.5, chinY - headUnit * 0.03);
    ctx.lineTo(headCenterX + neckW * 0.5, chinY - headUnit * 0.03);
    ctx.lineTo(headCenterX + neckW * 0.55, shoulderY + headUnit * 0.05);
    ctx.lineTo(headCenterX - neckW * 0.55, shoulderY + headUnit * 0.05);
    ctx.closePath();
    ctx.fillStyle = neckGrad;
    ctx.fill();
    ctx.fillStyle = 'rgba(0,0,0,0.28)';
    ctx.beginPath();
    ctx.ellipse(headCenterX, chinY + headUnit * 0.06, neckW * 0.7, headUnit * 0.09, 0, 0, TWO_PI);
    ctx.fill();

    // --- 7) Head + hair ---
    drawHead(ctx, headCenterX, headCenterY, headRadius, skin, hair, hairStyle, facing);

    // --- 8) Torso gear ---
    if (typeof GF.drawGear === 'function') GF.drawGear(ctx, 'torso', anchors, options);

    // --- 9) Head gear ---
    if (typeof GF.drawGear === 'function') GF.drawGear(ctx, 'head', anchors, options);

    // --- 10) Hands gear ---
    if (typeof GF.drawGear === 'function') GF.drawGear(ctx, 'hands', anchors, options);
  };

  function computePose(pose, facing, headUnit, shoulderY, waistY, hipY, kneeY, shoulderHalfWidth, hipHalfWidth, centerX, footY, chestCenterY, chinY) {
    var rightShoulder = { x: centerX + facing * shoulderHalfWidth * 0.85, y: shoulderY };
    var leftShoulder = { x: centerX - facing * shoulderHalfWidth * 0.85, y: shoulderY };
    var rightHip = { x: centerX + facing * hipHalfWidth * 0.55, y: hipY };
    var leftHip = { x: centerX - facing * hipHalfWidth * 0.55, y: hipY };

    var rightElbow, rightHand, leftElbow, leftHand;
    var rightKnee, rightFoot, leftKnee, leftFoot;

    if (pose === 'stand') {
      rightElbow = { x: rightShoulder.x + facing * headUnit * 0.08, y: waistY + headUnit * 0.1 };
      rightHand = { x: rightShoulder.x + facing * headUnit * 0.18, y: hipY + headUnit * 0.2 };
      leftElbow = { x: leftShoulder.x - facing * headUnit * 0.08, y: waistY + headUnit * 0.1 };
      leftHand = { x: leftShoulder.x - facing * headUnit * 0.18, y: hipY + headUnit * 0.2 };
      var spread = headUnit * 0.15;
      rightKnee = { x: rightHip.x + facing * spread * 0.3, y: kneeY };
      rightFoot = { x: rightHip.x + facing * spread * 0.5, y: footY };
      leftKnee = { x: leftHip.x - facing * spread * 0.3, y: kneeY };
      leftFoot = { x: leftHip.x - facing * spread * 0.5, y: footY };
    } else if (pose === 'march') {
      rightElbow = { x: rightShoulder.x - facing * headUnit * 0.15, y: waistY + headUnit * 0.15 };
      rightHand = { x: rightShoulder.x - facing * headUnit * 0.3, y: hipY + headUnit * 0.15 };
      leftElbow = { x: leftShoulder.x + facing * headUnit * 0.2, y: waistY };
      leftHand = { x: leftShoulder.x + facing * headUnit * 0.45, y: chestCenterY + headUnit * 0.2 };
      var stepLen = headUnit * 0.55;
      rightKnee = { x: rightHip.x + facing * stepLen * 0.4, y: kneeY - headUnit * 0.05 };
      rightFoot = { x: rightHip.x + facing * stepLen, y: footY };
      leftKnee = { x: leftHip.x - facing * stepLen * 0.3, y: kneeY };
      leftFoot = { x: leftHip.x - facing * stepLen * 0.7, y: footY };
    } else if (pose === 'attack') {
      rightElbow = { x: rightShoulder.x + facing * headUnit * 0.45, y: shoulderY - headUnit * 0.15 };
      rightHand = { x: rightShoulder.x + facing * headUnit * 0.75, y: chinY - headUnit * 0.05 };
      leftElbow = { x: leftShoulder.x + facing * headUnit * 0.3, y: waistY - headUnit * 0.1 };
      leftHand = { x: leftShoulder.x + facing * headUnit * 0.65, y: chestCenterY };
      var lunge = headUnit * 0.7;
      rightKnee = { x: rightHip.x + facing * lunge * 0.5, y: kneeY + headUnit * 0.05 };
      rightFoot = { x: rightHip.x + facing * lunge, y: footY };
      leftKnee = { x: leftHip.x - facing * lunge * 0.3, y: kneeY };
      leftFoot = { x: leftHip.x - facing * lunge * 0.65, y: footY };
    } else {
      rightElbow = { x: rightShoulder.x + facing * headUnit * 0.35, y: waistY + headUnit * 0.05 };
      rightHand = { x: rightShoulder.x + facing * headUnit * 0.55, y: waistY + headUnit * 0.4 };
      leftElbow = { x: leftShoulder.x + facing * headUnit * 0.3, y: waistY + headUnit * 0.1 };
      leftHand = { x: leftShoulder.x + facing * headUnit * 0.5, y: waistY + headUnit * 0.35 };
      var workSpread = headUnit * 0.28;
      rightKnee = { x: rightHip.x + facing * workSpread * 0.3, y: kneeY };
      rightFoot = { x: rightHip.x + facing * workSpread * 0.6, y: footY };
      leftKnee = { x: leftHip.x - facing * workSpread * 0.3, y: kneeY };
      leftFoot = { x: leftHip.x - facing * workSpread * 0.6, y: footY };
    }
    return { rightShoulder, rightElbow, rightHand, leftShoulder, leftElbow, leftHand,
             rightHip, rightKnee, rightFoot, leftHip, leftKnee, leftFoot };
  }

  function drawArm(ctx, shoulder, elbow, hand, skin, sleeveColor, bare, buildFactor, headUnit) {
    var upperWidth = headUnit * 0.34 * buildFactor;
    var elbowWidth = headUnit * 0.27 * buildFactor;
    var foreWidth = headUnit * 0.26 * buildFactor;
    var wristWidth = headUnit * 0.11 * buildFactor;
    var handSize = headUnit * 0.12 * buildFactor;
    fillLimb(ctx, shoulder.x, shoulder.y, elbow.x, elbow.y, upperWidth, elbowWidth, sleeveColor);
    fillLimb(ctx, elbow.x, elbow.y, hand.x, hand.y, foreWidth, wristWidth, sleeveColor);
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(hand.x, hand.y, handSize, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = shade(skin, 0.65);
    ctx.beginPath();
    ctx.arc(hand.x + handSize * 0.3, hand.y + handSize * 0.2, handSize * 0.5, 0, TWO_PI);
    ctx.fill();
  }

  function drawLeg(ctx, hip, knee, foot, skin, trouserColor, bootColor, bare, buildFactor, headUnit, facing) {
    var thighWidth = headUnit * 0.6 * buildFactor;
    var kneeWidth = headUnit * 0.42 * buildFactor;
    var calfWidth = headUnit * 0.44 * buildFactor;
    var ankleWidth = headUnit * 0.22 * buildFactor;
    var legColor = bare ? skin : trouserColor;
    fillLimb(ctx, hip.x, hip.y, knee.x, knee.y, thighWidth, kneeWidth, legColor);
    fillLimb(ctx, knee.x, knee.y, foot.x, foot.y, calfWidth, ankleWidth, legColor);
    ctx.fillStyle = bare ? skin : bootColor;
    ctx.beginPath();
    ctx.ellipse(foot.x + facing * headUnit * 0.08, foot.y - headUnit * 0.02, headUnit * 0.16, headUnit * 0.06, 0, 0, TWO_PI);
    ctx.fill();
  }

  function drawTorso(ctx, cx, shoulderY, chestY, waistY, hipY, footY, shoulderW, waistW, hipW, torsoColor, accentColor, era, civilian, robe, facing) {
    var hemY = robe ? footY - 4 : hipY + (hipY - waistY) * 0.6;

    var grad = ctx.createLinearGradient(cx - shoulderW, 0, cx + shoulderW, 0);
    grad.addColorStop(0, lighten(torsoColor, 0.25));
    grad.addColorStop(0.5, torsoColor);
    grad.addColorStop(1, shade(torsoColor, 0.7));

    ctx.beginPath();
    ctx.moveTo(cx - shoulderW, shoulderY);
    ctx.quadraticCurveTo(cx - waistW * 1.05, waistY, cx - hipW, hipY);
    if (robe) {
      ctx.lineTo(cx - hipW * 1.35, hemY);
      ctx.lineTo(cx + hipW * 1.35, hemY);
    } else {
      ctx.lineTo(cx - hipW * 1.05, hemY);
      ctx.lineTo(cx + hipW * 1.05, hemY);
    }
    ctx.quadraticCurveTo(cx + waistW * 1.05, waistY, cx + shoulderW, shoulderY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    if (era === 2 && !civilian) {
      ctx.strokeStyle = 'rgba(0,0,0,0.18)';
      ctx.lineWidth = 0.5;
      var ringY = shoulderY + (hipY - shoulderY) * 0.15;
      var ringStep = Math.max(1.5, (hipY - shoulderY) * 0.08);
      while (ringY < hipY - 2) {
        ctx.beginPath();
        ctx.moveTo(cx - shoulderW * 0.85, ringY);
        ctx.lineTo(cx + shoulderW * 0.85, ringY);
        ctx.stroke();
        ringY += ringStep;
      }
    }

    if (era === 3 && !civilian) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = Math.max(1.5, shoulderW * 0.18);
      ctx.beginPath();
      ctx.moveTo(cx - shoulderW * 0.85, shoulderY + shoulderW * 0.1);
      ctx.lineTo(cx + shoulderW * 0.85, hipY - hipW * 0.15);
      ctx.stroke();
    }

    if (era >= 4 && !civilian) {
      ctx.strokeStyle = shade(torsoColor, 0.5);
      ctx.lineWidth = 0.7;
      ctx.beginPath();
      ctx.moveTo(cx, shoulderY + shoulderW * 0.15);
      ctx.lineTo(cx, hipY - 2);
      ctx.stroke();
      ctx.fillStyle = accentColor;
      var buttonCount = 4;
      for (var b = 0; b < buttonCount; b++) {
        var buttonY = shoulderY + shoulderW * 0.2 + b * ((hipY - shoulderY) * 0.7 / buttonCount);
        ctx.beginPath();
        ctx.arc(cx + facing * shoulderW * 0.08, buttonY, Math.max(0.5, shoulderW * 0.05), 0, TWO_PI);
        ctx.fill();
      }
    }

    if (era === 6 && !civilian) {
      ctx.strokeStyle = accentColor;
      ctx.lineWidth = Math.max(0.6, shoulderW * 0.04);
      ctx.beginPath();
      ctx.moveTo(cx, shoulderY + shoulderW * 0.1);
      ctx.lineTo(cx, hipY);
      ctx.moveTo(cx - shoulderW * 0.5, chestY);
      ctx.lineTo(cx + shoulderW * 0.5, chestY);
      ctx.stroke();
    }

    // Folds
    ctx.strokeStyle = shade(torsoColor, 0.6);
    ctx.lineWidth = Math.max(0.4, shoulderW * 0.05);
    ctx.beginPath();
    ctx.moveTo(cx - hipW * 0.5, waistY + 2);
    ctx.quadraticCurveTo(cx - hipW * 0.7, (waistY + hemY) / 2, cx - hipW * 0.8, hemY - 2);
    ctx.moveTo(cx + hipW * 0.3, waistY + 2);
    ctx.quadraticCurveTo(cx + hipW * 0.5, (waistY + hemY) / 2, cx + hipW * 0.6, hemY - 2);
    ctx.stroke();

    // Belt
    var beltY = hipY - (hipY - waistY) * 0.3;
    var beltH = Math.max(1.5, (hipY - waistY) * 0.15);
    ctx.fillStyle = shade('#2a1a08', 0.9);
    ctx.fillRect(cx - waistW * 1.15, beltY, waistW * 2.3, beltH);
    ctx.fillStyle = accentColor;
    ctx.fillRect(cx - waistW * 0.15, beltY, waistW * 0.3, beltH);

    // Hem accent
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(cx - hipW * (robe ? 1.35 : 1.05), hemY);
    ctx.lineTo(cx + hipW * (robe ? 1.35 : 1.05), hemY);
    ctx.stroke();
  }

})(G.GFX);