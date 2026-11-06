(function (GF) {
  'use strict';

  var TWO_PI = Math.PI * 2;

  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function hexToRgb(css) {
    if (!css) return [150, 150, 150];
    if (css.charAt(0) === '#') {
      var hex = css.slice(1);
      if (hex.length === 3) hex = hex[0]+hex[0]+hex[1]+hex[1]+hex[2]+hex[2];
      return [parseInt(hex.substr(0,2),16), parseInt(hex.substr(2,2),16), parseInt(hex.substr(4,2),16)];
    }
    var m = css.match(/\d+(\.\d+)?/g);
    if (m && m.length >= 3) return [+m[0], +m[1], +m[2]];
    return [150, 150, 150];
  }
  function lighten(css, amt) {
    var rgb = hexToRgb(css);
    return 'rgb(' + Math.round(rgb[0]+(255-rgb[0])*amt) + ',' + Math.round(rgb[1]+(255-rgb[1])*amt) + ',' + Math.round(rgb[2]+(255-rgb[2])*amt) + ')';
  }
  function shade(css, amt) {
    var rgb = hexToRgb(css);
    return 'rgb(' + Math.round(rgb[0]*amt) + ',' + Math.round(rgb[1]*amt) + ',' + Math.round(rgb[2]*amt) + ')';
  }

  // ---- BACK LAYER ----

  function drawCloak(ctx, anchors, mainColor, accentColor) {
    var cx = anchors.chest.x;
    var topY = anchors.shoulderLeft.y - anchors.height * 0.02;
    var botY = anchors.footLeft.y - anchors.height * 0.08;
    var width = anchors.chest.width * 0.9;
    var back = -anchors.forwardX;

    var grad = ctx.createLinearGradient(cx - width, 0, cx + width, 0);
    grad.addColorStop(0, lighten(mainColor, 0.1));
    grad.addColorStop(0.4, mainColor);
    grad.addColorStop(1, shade(mainColor, 0.5));

    ctx.beginPath();
    ctx.moveTo(cx - width * 0.55, topY);
    ctx.quadraticCurveTo(cx + back * width * 0.6, topY + (botY - topY) * 0.5, cx + back * width * 0.7, botY);
    ctx.lineTo(cx + back * width * 0.4, botY + 2);
    ctx.quadraticCurveTo(cx + back * width * 0.1, (topY + botY) / 2, cx + width * 0.55, topY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(0.6, anchors.height * 0.012);
    ctx.beginPath();
    ctx.moveTo(cx + back * width * 0.7, botY);
    ctx.lineTo(cx + back * width * 0.4, botY + 2);
    ctx.stroke();
  }

  function drawQuiver(ctx, anchors) {
    var qx = anchors.chest.x - anchors.forwardX * anchors.chest.width * 0.55;
    var qyTop = anchors.chest.y - anchors.height * 0.05;
    var qyBot = anchors.chest.y + anchors.height * 0.1;
    var qw = anchors.height * 0.06;

    ctx.fillStyle = '#4a2418';
    ctx.beginPath();
    ctx.ellipse(qx, (qyTop + qyBot) / 2, qw, (qyBot - qyTop) / 2, 0, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = '#8a6a3a';
    for (var a = 0; a < 3; a++) {
      ctx.beginPath();
      ctx.moveTo(qx - qw * 0.6 + a * qw * 0.6, qyTop);
      ctx.lineTo(qx - qw * 0.4 + a * qw * 0.6, qyTop - anchors.height * 0.08);
      ctx.lineWidth = Math.max(0.5, anchors.height * 0.008);
      ctx.strokeStyle = '#d0c090';
      ctx.stroke();
    }
  }

  function drawBackpack(ctx, anchors) {
    var bx = anchors.chest.x - anchors.forwardX * anchors.chest.width * 0.6;
    var bw = anchors.height * 0.12;
    var bh = anchors.height * 0.18;
    ctx.fillStyle = '#4a3a28';
    ctx.fillRect(bx - bw / 2, anchors.chest.y - bh / 2, bw, bh);
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(bx - bw / 2, anchors.chest.y - bh / 2, bw, bh * 0.15);
  }

  function drawSlungShield(ctx, anchors, mainColor, accentColor, era) {
    var sx = anchors.chest.x - anchors.forwardX * anchors.chest.width * 0.7;
    var sy = anchors.chest.y;
    var radius = anchors.height * 0.19;

    // Wood backing
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 1.03, 0, TWO_PI);
    ctx.fill();

    // Team face
    var grad = ctx.createRadialGradient(sx - radius * 0.3, sy - radius * 0.3, radius * 0.1, sx, sy, radius);
    grad.addColorStop(0, lighten(mainColor, 0.3));
    grad.addColorStop(0.7, mainColor);
    grad.addColorStop(1, shade(mainColor, 0.6));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx, sy, radius, 0, TWO_PI);
    ctx.fill();

    // Metal boss
    ctx.fillStyle = '#b8b8b8';
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 0.25, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(sx - radius * 0.08, sy - radius * 0.08, radius * 0.08, 0, TWO_PI);
    ctx.fill();

    // Accent emblem (thin cross)
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(0.8, radius * 0.06);
    ctx.beginPath();
    ctx.moveTo(sx, sy - radius * 0.65);
    ctx.lineTo(sx, sy + radius * 0.65);
    ctx.moveTo(sx - radius * 0.65, sy);
    ctx.lineTo(sx + radius * 0.65, sy);
    ctx.stroke();

    // Rim
    ctx.strokeStyle = '#5a5040';
    ctx.lineWidth = Math.max(1, radius * 0.08);
    ctx.beginPath();
    ctx.arc(sx, sy, radius * 0.96, 0, TWO_PI);
    ctx.stroke();
  }

  // ---- TORSO LAYER ----

  function drawTorsoArmour(ctx, anchors, options) {
    var era = options.era === undefined ? 0 : options.era;
    var civilian = !!options.civilian;
    if (civilian && era < 4) return;

    var cx = anchors.chest.x;
    var cw = anchors.chest.width;
    var chestY = anchors.chest.y;
    var torsoH = anchors.chest.height;
    var topY = anchors.shoulderLeft.y;
    var midY = chestY;
    var botY = anchors.hip.y;
    var halfW = cw * 0.5;

    var baseColor, accent;
    if (era <= 1) { baseColor = '#8a6030'; accent = '#c8a050'; }
    else if (era === 2) { baseColor = '#7a7a80'; accent = '#a0a0a8'; }
    else if (era === 3) { baseColor = '#a0a8b0'; accent = '#e0e0e8'; }
    else if (era === 4) { baseColor = '#3a3020'; accent = options.accentColor || '#c8a040'; }
    else if (era === 5) { baseColor = '#4a5636'; accent = '#2a3018'; }
    else { baseColor = '#2a3040'; accent = options.accentColor || '#40e0ff'; }

    // Chest plate / armour
    var grad = ctx.createLinearGradient(cx - halfW, 0, cx + halfW, 0);
    grad.addColorStop(0, lighten(baseColor, 0.4));
    grad.addColorStop(0.5, baseColor);
    grad.addColorStop(1, shade(baseColor, 0.55));

    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.85, topY + (midY - topY) * 0.1);
    ctx.quadraticCurveTo(cx - halfW * 0.75, midY, cx - halfW * 0.65, botY);
    ctx.lineTo(cx + halfW * 0.65, botY);
    ctx.quadraticCurveTo(cx + halfW * 0.75, midY, cx + halfW * 0.85, topY + (midY - topY) * 0.1);
    ctx.quadraticCurveTo(cx, topY - anchors.height * 0.02, cx - halfW * 0.85, topY + (midY - topY) * 0.1);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Specular ridge
    ctx.strokeStyle = lighten(baseColor, 0.6);
    ctx.lineWidth = Math.max(0.7, anchors.height * 0.012);
    ctx.beginPath();
    ctx.moveTo(cx - halfW * 0.3, topY + anchors.height * 0.015);
    ctx.quadraticCurveTo(cx - halfW * 0.15, midY, cx - halfW * 0.1, botY - 1);
    ctx.stroke();

    // Pauldrons (era 2-5)
    if (era >= 2 && era <= 5) {
      ctx.fillStyle = shade(baseColor, 0.8);
      ctx.beginPath();
      ctx.ellipse(anchors.shoulderLeft.x, anchors.shoulderLeft.y + anchors.height * 0.02, anchors.height * 0.09, anchors.height * 0.05, 0, 0, TWO_PI);
      ctx.fill();
      ctx.beginPath();
      ctx.ellipse(anchors.shoulderRight.x, anchors.shoulderRight.y + anchors.height * 0.02, anchors.height * 0.09, anchors.height * 0.05, 0, 0, TWO_PI);
      ctx.fill();
      // Highlight
      ctx.fillStyle = lighten(baseColor, 0.5);
      ctx.beginPath();
      ctx.ellipse(anchors.shoulderRight.x - anchors.height * 0.02, anchors.shoulderRight.y, anchors.height * 0.04, anchors.height * 0.02, 0, 0, TWO_PI);
      ctx.fill();
    }

    // Belt buckle
    var buckleSize = anchors.height * 0.04;
    ctx.fillStyle = accent;
    ctx.fillRect(cx - buckleSize / 2, botY - buckleSize * 0.7, buckleSize, buckleSize);
    ctx.fillStyle = shade(accent, 0.6);
    ctx.fillRect(cx - buckleSize * 0.15, botY - buckleSize * 0.55, buckleSize * 0.3, buckleSize * 0.7);

    // Era 5 webbing pouches
    if (era === 5) {
      ctx.fillStyle = '#3a4228';
      ctx.fillRect(cx - halfW * 0.7, midY - anchors.height * 0.02, halfW * 0.3, anchors.height * 0.07);
      ctx.fillRect(cx + halfW * 0.4, midY - anchors.height * 0.02, halfW * 0.3, anchors.height * 0.07);
    }
  }

  // ---- HEAD LAYER ----

  function drawHelmet(ctx, anchors, options) {
    var era = options.era === undefined ? 0 : options.era;
    var headX = anchors.head.x;
    var headY = anchors.head.y;
    var radius = anchors.head.radius;
    if (radius < 2) return;

    var mainColor = options.mainColor || '#aa2020';
    var accentColor = options.accentColor || '#e8c040';
    var helmetColor, trimColor;

    if (era <= 1) { helmetColor = '#a07840'; trimColor = '#d0a858'; }
    else if (era === 2) { helmetColor = '#8a8a90'; trimColor = '#c0c0c8'; }
    else if (era === 3) { helmetColor = '#5a5048'; trimColor = '#8a8070'; }
    else if (era === 4) { helmetColor = '#1a1a20'; trimColor = '#c0a040'; }
    else if (era === 5) { helmetColor = '#4a5a3a'; trimColor = '#3a4a2a'; }
    else { helmetColor = '#2a3040'; trimColor = accentColor; }

    var grad = ctx.createLinearGradient(headX - radius, headY - radius, headX + radius, headY + radius);
    grad.addColorStop(0, lighten(helmetColor, 0.5));
    grad.addColorStop(0.5, helmetColor);
    grad.addColorStop(1, shade(helmetColor, 0.5));

    // Dome
    ctx.beginPath();
    ctx.arc(headX, headY - radius * 0.1, radius * 1.05, Math.PI, TWO_PI);
    ctx.lineTo(headX + radius * 1.05, headY);
    ctx.lineTo(headX - radius * 1.05, headY);
    ctx.closePath();
    ctx.fillStyle = grad;
    ctx.fill();

    // Rim
    ctx.strokeStyle = trimColor;
    ctx.lineWidth = Math.max(0.6, radius * 0.12);
    ctx.beginPath();
    ctx.moveTo(headX - radius * 1.05, headY);
    ctx.lineTo(headX + radius * 1.05, headY);
    ctx.stroke();

    // Era-specific details
    if (era <= 1) {
      // Crest / plume
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.moveTo(headX - radius * 0.2, headY - radius * 0.9);
      ctx.quadraticCurveTo(headX + anchors.forwardX * radius * 0.8, headY - radius * 1.4, headX + anchors.forwardX * radius * 0.5, headY - radius * 0.7);
      ctx.closePath();
      ctx.fill();
    } else if (era === 2) {
      // Nasal bar
      ctx.fillStyle = helmetColor;
      ctx.fillRect(headX - radius * 0.08, headY - radius * 0.5, radius * 0.16, radius * 0.55);
    } else if (era === 3) {
      // Morion comb
      ctx.fillStyle = helmetColor;
      ctx.beginPath();
      ctx.moveTo(headX, headY - radius * 1.3);
      ctx.lineTo(headX + anchors.forwardX * radius * 0.4, headY - radius * 0.85);
      ctx.lineTo(headX - anchors.forwardX * radius * 0.1, headY - radius * 0.85);
      ctx.closePath();
      ctx.fill();
    } else if (era === 4) {
      // Shako top
      ctx.fillStyle = helmetColor;
      ctx.fillRect(headX - radius * 0.8, headY - radius * 1.2, radius * 1.6, radius * 0.25);
      // Plume
      ctx.fillStyle = mainColor;
      ctx.beginPath();
      ctx.arc(headX + anchors.forwardX * radius * 0.5, headY - radius * 1.3, radius * 0.2, 0, TWO_PI);
      ctx.fill();
    } else if (era >= 5) {
      // Visor / brim
      ctx.strokeStyle = trimColor;
      ctx.lineWidth = Math.max(0.5, radius * 0.1);
      ctx.beginPath();
      ctx.moveTo(headX - radius * 0.9, headY - radius * 0.2);
      ctx.lineTo(headX + anchors.forwardX * radius * 1.2, headY - radius * 0.35);
      ctx.stroke();
    }
  }

  function drawHat(ctx, anchors, hatColor) {
    var headX = anchors.head.x;
    var headY = anchors.head.y;
    var radius = anchors.head.radius;
    if (radius < 2) return;

    // Wide brim
    ctx.fillStyle = shade(hatColor, 0.8);
    ctx.beginPath();
    ctx.ellipse(headX, headY - radius * 0.9, radius * 1.8, radius * 0.35, 0, 0, TWO_PI);
    ctx.fill();

    // Crown
    ctx.fillStyle = hatColor;
    ctx.beginPath();
    ctx.ellipse(headX, headY - radius * 1.2, radius * 0.7, radius * 0.4, 0, 0, TWO_PI);
    ctx.fill();

    // Band
    ctx.strokeStyle = shade(hatColor, 0.5);
    ctx.lineWidth = Math.max(0.5, radius * 0.1);
    ctx.beginPath();
    ctx.ellipse(headX, headY - radius * 0.95, radius * 0.7, radius * 0.15, 0, 0, TWO_PI);
    ctx.stroke();
  }

  // ---- HANDS LAYER ----

  function weaponAngle(options) {
    var pose = options.pose || 'stand';
    var facing = options.forwardX === -1 ? -1 : 1;
    if (pose === 'attack') return -Math.PI / 2 + facing * Math.PI * 0.28;
    if (pose === 'march') return -Math.PI / 2 + facing * 0.6;
    if (pose === 'work') return -Math.PI / 2 + facing * 1.1;
    return -Math.PI / 2 + facing * 0.15;
  }

  function drawSword(ctx, hx, hy, angle, height) {
    var bladeLen = height * 0.4;
    var bladeW = height * 0.028;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    // Grip
    ctx.fillStyle = '#3a2410';
    ctx.fillRect(-height * 0.008, -height * 0.005, height * 0.016, height * 0.06);
    // Pommel
    ctx.fillStyle = '#b8a040';
    ctx.beginPath();
    ctx.arc(0, height * 0.065, height * 0.018, 0, TWO_PI);
    ctx.fill();
    // Crossguard
    ctx.fillStyle = '#8a8040';
    ctx.fillRect(-height * 0.05, -height * 0.008, height * 0.1, height * 0.012);

    // Blade with fuller
    var bladeGrad = ctx.createLinearGradient(-bladeW / 2, 0, bladeW / 2, 0);
    bladeGrad.addColorStop(0, '#f0f0f8');
    bladeGrad.addColorStop(0.4, '#b8b8c0');
    bladeGrad.addColorStop(0.7, '#707078');
    bladeGrad.addColorStop(1, '#4a4a52');
    ctx.fillStyle = bladeGrad;
    ctx.beginPath();
    ctx.moveTo(-bladeW / 2, -height * 0.008);
    ctx.lineTo(-bladeW / 2, -bladeLen);
    ctx.lineTo(0, -bladeLen - height * 0.02);
    ctx.lineTo(bladeW / 2, -bladeLen);
    ctx.lineTo(bladeW / 2, -height * 0.008);
    ctx.closePath();
    ctx.fill();

    // Fuller line
    ctx.strokeStyle = 'rgba(0,0,0,0.4)';
    ctx.lineWidth = Math.max(0.4, height * 0.005);
    ctx.beginPath();
    ctx.moveTo(0, -height * 0.02);
    ctx.lineTo(0, -bladeLen * 0.85);
    ctx.stroke();
    ctx.restore();
  }

  function drawSpear(ctx, hx, hy, angle, height) {
    var shaftLen = height * 1.25;
    var headLen = height * 0.18;
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);

    // Shaft
    var shaftGrad = ctx.createLinearGradient(-height * 0.012, 0, height * 0.012, 0);
    shaftGrad.addColorStop(0, '#c8a878');
    shaftGrad.addColorStop(0.5, '#8a6a40');
    shaftGrad.addColorStop(1, '#4a3018');
    ctx.fillStyle = shaftGrad;
    ctx.fillRect(-height * 0.008, -shaftLen * 0.6, height * 0.016, shaftLen);

    // Head
    var headGrad = ctx.createLinearGradient(-height * 0.02, 0, height * 0.02, 0);
    headGrad.addColorStop(0, '#e8e8f0');
    headGrad.addColorStop(0.5, '#a0a0a8');
    headGrad.addColorStop(1, '#404048');
    ctx.fillStyle = headGrad;
    ctx.beginPath();
    ctx.moveTo(0, -shaftLen * 0.6 - headLen);
    ctx.lineTo(height * 0.035, -shaftLen * 0.6 - headLen * 0.4);
    ctx.lineTo(height * 0.02, -shaftLen * 0.6);
    ctx.lineTo(-height * 0.02, -shaftLen * 0.6);
    ctx.lineTo(-height * 0.035, -shaftLen * 0.6 - headLen * 0.4);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  function drawBow(ctx, hx, hy, angle, height) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    var bowH = height * 0.55;
    ctx.strokeStyle = '#4a2410';
    ctx.lineWidth = Math.max(1, height * 0.018);
    ctx.beginPath();
    ctx.moveTo(0, -bowH / 2);
    ctx.quadraticCurveTo(height * 0.08, 0, 0, bowH / 2);
    ctx.stroke();
    // String
    ctx.strokeStyle = 'rgba(240,240,240,0.8)';
    ctx.lineWidth = Math.max(0.4, height * 0.005);
    ctx.beginPath();
    ctx.moveTo(0, -bowH / 2);
    ctx.lineTo(0, bowH / 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawGun(ctx, hx, hy, angle, height, era) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    var gunLen;
    if (era <= 3) gunLen = height * 0.55;
    else if (era === 4) gunLen = height * 0.5;
    else if (era === 5) gunLen = height * 0.42;
    else gunLen = height * 0.38;

    // Stock
    ctx.fillStyle = '#4a2a10';
    ctx.beginPath();
    ctx.moveTo(-height * 0.02, height * 0.02);
    ctx.lineTo(-height * 0.03, -height * 0.02);
    ctx.lineTo(height * 0.01, -height * 0.025);
    ctx.lineTo(height * 0.02, height * 0.02);
    ctx.closePath();
    ctx.fill();

    // Barrel
    var barrelGrad = ctx.createLinearGradient(-height * 0.008, 0, height * 0.008, 0);
    barrelGrad.addColorStop(0, '#a0a0a8');
    barrelGrad.addColorStop(0.5, '#505058');
    barrelGrad.addColorStop(1, '#2a2a30');
    ctx.fillStyle = barrelGrad;
    var barrelW = era >= 5 ? height * 0.012 : height * 0.018;
    ctx.fillRect(-barrelW / 2, -gunLen, barrelW, gunLen);

    // Era 6: glowing sight
    if (era >= 6) {
      ctx.fillStyle = options0_gAccent;
      ctx.fillRect(-height * 0.008, -gunLen * 0.4, height * 0.016, height * 0.02);
    }
    ctx.restore();
  }
  var options0_gAccent = '#40e0ff';

  function drawStaff(ctx, hx, hy, angle, height) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    var staffLen = height * 0.9;
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = Math.max(1, height * 0.02);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, -staffLen * 0.55);
    ctx.lineTo(0, staffLen * 0.45);
    ctx.stroke();
    // Top knuckle
    ctx.fillStyle = '#8a6a3a';
    ctx.beginPath();
    ctx.arc(0, -staffLen * 0.55, height * 0.025, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  function drawPick(ctx, hx, hy, angle, height) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    var handleLen = height * 0.5;
    ctx.strokeStyle = '#6a4a2a';
    ctx.lineWidth = Math.max(1, height * 0.018);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(0, handleLen * 0.5);
    ctx.lineTo(0, -handleLen * 0.4);
    ctx.stroke();
    // Head
    ctx.strokeStyle = '#404048';
    ctx.lineWidth = Math.max(1, height * 0.015);
    ctx.beginPath();
    ctx.moveTo(-height * 0.09, -handleLen * 0.4);
    ctx.quadraticCurveTo(0, -handleLen * 0.55, height * 0.09, -handleLen * 0.4);
    ctx.stroke();
    ctx.restore();
  }

  function drawBook(ctx, hx, hy, height) {
    var bw = height * 0.08;
    var bh = height * 0.11;
    ctx.fillStyle = '#5a2a1a';
    ctx.fillRect(hx - bw / 2, hy - bh / 2, bw, bh);
    ctx.fillStyle = '#e8d8b0';
    ctx.fillRect(hx - bw / 2 + 1, hy - bh / 2 + 1, bw - 2, bh - 2);
    ctx.fillStyle = '#c8b888';
    ctx.fillRect(hx - bw / 2, hy - 0.5, bw, 1);
  }

  function drawClub(ctx, hx, hy, angle, height) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    var clubLen = height * 0.35;
    var clubGrad = ctx.createLinearGradient(-height * 0.02, 0, height * 0.02, 0);
    clubGrad.addColorStop(0, '#a87848');
    clubGrad.addColorStop(0.5, '#7a5030');
    clubGrad.addColorStop(1, '#3a2010');
    ctx.fillStyle = clubGrad;
    ctx.beginPath();
    ctx.moveTo(-height * 0.012, 0);
    ctx.lineTo(-height * 0.035, -clubLen * 0.85);
    ctx.quadraticCurveTo(0, -clubLen, height * 0.035, -clubLen * 0.85);
    ctx.lineTo(height * 0.012, 0);
    ctx.closePath();
    ctx.fill();
    // Knots
    ctx.fillStyle = shade('#7a5030', 0.6);
    ctx.beginPath();
    ctx.arc(height * 0.01, -clubLen * 0.5, height * 0.015, 0, TWO_PI);
    ctx.fill();
    ctx.restore();
  }

  function drawCrossbow(ctx, hx, hy, angle, height) {
    ctx.save();
    ctx.translate(hx, hy);
    ctx.rotate(angle);
    // Stock
    ctx.fillStyle = '#4a2a10';
    ctx.fillRect(-height * 0.015, -height * 0.14, height * 0.03, height * 0.18);
    // Prod
    ctx.strokeStyle = '#3a3a40';
    ctx.lineWidth = Math.max(1, height * 0.014);
    ctx.beginPath();
    ctx.moveTo(-height * 0.1, -height * 0.1);
    ctx.quadraticCurveTo(0, -height * 0.16, height * 0.1, -height * 0.1);
    ctx.stroke();
    // String
    ctx.strokeStyle = 'rgba(240,240,240,0.7)';
    ctx.lineWidth = Math.max(0.4, height * 0.005);
    ctx.beginPath();
    ctx.moveTo(-height * 0.1, -height * 0.1);
    ctx.lineTo(height * 0.1, -height * 0.1);
    ctx.stroke();
    ctx.restore();
  }

  function drawHeldShield(ctx, hx, hy, height, mainColor, accentColor, era) {
    var radius;
    if (era <= 1) radius = height * 0.19;
    else radius = height * 0.17;

    // Wood backing
    ctx.fillStyle = '#3a2410';
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 1.04, 0, TWO_PI);
    ctx.fill();

    // Team face
    var grad = ctx.createRadialGradient(hx - radius * 0.35, hy - radius * 0.35, radius * 0.1, hx, hy, radius);
    grad.addColorStop(0, lighten(mainColor, 0.3));
    grad.addColorStop(0.65, mainColor);
    grad.addColorStop(1, shade(mainColor, 0.55));
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(hx, hy, radius, 0, TWO_PI);
    ctx.fill();

    // Metal boss
    ctx.fillStyle = '#b8b8b8';
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 0.22, 0, TWO_PI);
    ctx.fill();
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(hx - radius * 0.06, hy - radius * 0.06, radius * 0.07, 0, TWO_PI);
    ctx.fill();

    // Accent ring
    ctx.strokeStyle = accentColor;
    ctx.lineWidth = Math.max(0.8, radius * 0.08);
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 0.7, 0, TWO_PI);
    ctx.stroke();

    // Rim
    ctx.strokeStyle = '#5a5040';
    ctx.lineWidth = Math.max(1, radius * 0.09);
    ctx.beginPath();
    ctx.arc(hx, hy, radius * 0.96, 0, TWO_PI);
    ctx.stroke();
  }

  // ---- PUBLIC ENTRY ----

  GF.drawGear = function (ctx, layer, anchors, options) {
    if (!anchors || !layer || !ctx) return;
    if (anchors.height < 10) return;
    options = options || {};

    var era = options.era === undefined ? 0 : options.era;
    var weapon = options.weapon || 'none';
    var pose = options.pose || 'stand';
    var mainColor = options.mainColor || '#4488cc';
    var accentColor = options.accentColor || '#ddc34a';
    var facing = anchors.forwardX === -1 ? -1 : 1;
    var height = anchors.height;

    if (layer === 'back') {
      if (era >= 1 && era <= 3 && !options.civilian) {
        drawCloak(ctx, anchors, mainColor, accentColor);
      }
      if (weapon === 'bow') drawQuiver(ctx, anchors);
      if (era >= 4 && !options.civilian) drawBackpack(ctx, anchors);
      if (options.shield && pose !== 'attack') {
        drawSlungShield(ctx, anchors, mainColor, accentColor, era);
      }
    } else if (layer === 'torso') {
      drawTorsoArmour(ctx, anchors, options);
    } else if (layer === 'head') {
      if (options.helmet) drawHelmet(ctx, anchors, options);
      else if (options.hat) drawHat(ctx, anchors, options.hat);
    } else if (layer === 'hands') {
      var angle = weaponAngle({ pose: pose, forwardX: facing });
      var hx = anchors.handRight.x;
      var hy = anchors.handRight.y;

      if (weapon === 'sword') drawSword(ctx, hx, hy, angle, height);
      else if (weapon === 'spear') drawSpear(ctx, hx, hy, angle, height);
      else if (weapon === 'bow') drawBow(ctx, hx, hy, angle, height);
      else if (weapon === 'xbow') drawCrossbow(ctx, hx, hy, angle, height);
      else if (weapon === 'gun') drawGun(ctx, hx, hy, angle, height, era);
      else if (weapon === 'staff') drawStaff(ctx, hx, hy, angle, height);
      else if (weapon === 'pick') drawPick(ctx, hx, hy, angle, height);
      else if (weapon === 'book') drawBook(ctx, hx, hy, height);
      else if (weapon === 'club') drawClub(ctx, hx, hy, angle, height);

      if (options.shield && pose === 'attack') {
        drawHeldShield(ctx, anchors.handLeft.x, anchors.handLeft.y, height, mainColor, accentColor, era);
      }
    }
  };

})(G.GFX);