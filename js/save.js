// ============================================================
//  Save / load: compact serialization + IndexedDB storage
//  (falls back to localStorage), plus export/import as text.
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};

G.Save = (function () {
  var S = {};
  var MAP_FIELDS = { terrain: 'u8', hills: 'u8', feature: 'u8', res: 'u8', resQty: 'u8', imp: 'u8', road: 'u8', river: 'u8', riverMask: 'u8', owner: 'i16', city: 'i32', nw: 'u8', hut: 'u8', elev: 'u8', pillaged: 'u8', area: 'i32' };
  function b64(u8) {
    var s = '', CH = 0x8000;
    for (var i = 0; i < u8.length; i += CH) s += String.fromCharCode.apply(null, u8.subarray(i, i + CH));
    return typeof btoa !== 'undefined' ? btoa(s) : Buffer.from(s, 'binary').toString('base64');
  }
  function unb64(str) {
    var s = typeof atob !== 'undefined' ? atob(str) : Buffer.from(str, 'base64').toString('binary');
    var u8 = new Uint8Array(s.length);
    for (var i = 0; i < s.length; i++) u8[i] = s.charCodeAt(i);
    return u8;
  }
  function packBits(a) { var o = new Uint8Array(Math.ceil(a.length / 8)); for (var i = 0; i < a.length; i++) if (a[i]) o[i >> 3] |= 1 << (i & 7); return b64(o); }
  function unpackBits(str, n) { var u = unb64(str), o = new Uint8Array(n); for (var i = 0; i < n; i++) o[i] = (u[i >> 3] >> (i & 7)) & 1; return o; }

  S.serialize = function (game) {
    var out = {};
    for (var k in game) {
      if (k === 'map' || k === 'rng' || k === 'players' || k === 'units' || k === '_uidx') continue;
      out[k] = game[k];
    }
    out.rngState = game.rng.s;
    var m = {}; m.W = game.map.W; m.H = game.map.H;
    for (var f in MAP_FIELDS) m[f] = b64(new Uint8Array(game.map[f].buffer));
    out.map = m;
    out.players = game.players.map(function (p) {
      var o = {};
      for (var k in p) { if (k === 'visible' || k === '_resCache' || k === '_ownedCache' || k === 'explored') continue; o[k] = p[k]; }
      if (o.notes && o.notes.length > 80) o.notes = o.notes.slice(-80);
      o.explored = packBits(p.explored);
      return o;
    });
    out.units = {};
    for (var id in game.units) out.units[id] = JSON.parse(JSON.stringify(game.units[id]));
    return JSON.stringify(out);
  };
  S.deserialize = function (str) {
    var o = typeof str === 'string' ? JSON.parse(str) : str;
    var game = {};
    for (var k in o) if (k !== 'map' && k !== 'players' && k !== 'units' && k !== 'rngState') game[k] = o[k];
    var W = o.map.W, H = o.map.H, n = W * H;
    G.Hex.setSize(W, H);
    var map = { W: W, H: H };
    for (var f in MAP_FIELDS) {
      var u8 = unb64(o.map[f]);
      var buf = u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength);
      map[f] = MAP_FIELDS[f] === 'u8' ? new Uint8Array(buf) : MAP_FIELDS[f] === 'i16' ? new Int16Array(buf) : new Int32Array(buf);
    }
    game.map = map;
    game.rng = new G.RNG(1); game.rng.s = o.rngState >>> 0;
    game.players = o.players.map(function (p) {
      p.explored = unpackBits(p.explored, n);
      p.visible = new Uint8Array(n);
      return p;
    });
    game.units = {};
    for (var id in o.units) game.units[id] = o.units[id];
    G.Engine.rebuildIndex(game);
    game.players.forEach(function (p) { G.Rules.computeMods(game, p); G.Engine.updateVisibility(game, p); });
    G.Engine.computeCSBonuses(game);
    return game;
  };

  // ---------- storage ----------
  var DBN = 'ages_of_empire', ST = 'saves', dbP = null;
  function db() {
    if (dbP) return dbP;
    dbP = new Promise(function (res, rej) {
      try {
        var rq = indexedDB.open(DBN, 1);
        rq.onupgradeneeded = function () { rq.result.createObjectStore(ST); };
        rq.onsuccess = function () { res(rq.result); };
        rq.onerror = function () { rej(rq.error); };
      } catch (e) { rej(e); }
    });
    return dbP;
  }
  function lsKey(name) { return 'aoe_save_' + name; }
  S.put = function (name, meta, data) {
    var rec = { name: name, meta: meta, data: data, date: Date.now() };
    return db().then(function (d) {
      return new Promise(function (res, rej) { var tx = d.transaction(ST, 'readwrite'); tx.objectStore(ST).put(rec, name); tx.oncomplete = function () { res(true); }; tx.onerror = function () { rej(tx.error); }; });
    }).catch(function () {
      try { localStorage.setItem(lsKey(name), JSON.stringify(rec)); return true; } catch (e) { return false; }
    });
  };
  S.get = function (name) {
    return db().then(function (d) {
      return new Promise(function (res, rej) { var tx = d.transaction(ST, 'readonly'); var rq = tx.objectStore(ST).get(name); rq.onsuccess = function () { res(rq.result || null); }; rq.onerror = function () { rej(rq.error); }; });
    }).catch(function () { try { var s = localStorage.getItem(lsKey(name)); return s ? JSON.parse(s) : null; } catch (e) { return null; } });
  };
  S.list = function () {
    return db().then(function (d) {
      return new Promise(function (res, rej) {
        var out = [], tx = d.transaction(ST, 'readonly'), rq = tx.objectStore(ST).openCursor();
        rq.onsuccess = function () { var c = rq.result; if (c) { out.push({ name: c.key, meta: c.value.meta, date: c.value.date }); c.continue(); } else res(out); };
        rq.onerror = function () { rej(rq.error); };
      });
    }).catch(function () {
      var out = [];
      try { for (var i = 0; i < localStorage.length; i++) { var k = localStorage.key(i); if (k.indexOf('aoe_save_') === 0) { var r = JSON.parse(localStorage.getItem(k)); out.push({ name: r.name, meta: r.meta, date: r.date }); } } } catch (e) { }
      return out;
    });
  };
  S.del = function (name) {
    return db().then(function (d) {
      return new Promise(function (res) { var tx = d.transaction(ST, 'readwrite'); tx.objectStore(ST).delete(name); tx.oncomplete = function () { res(true); }; });
    }).catch(function () { try { localStorage.removeItem(lsKey(name)); } catch (e) { } return true; });
  };
  // ---------- cloud saves (artifact db capability; private per user) ----------
  var CHUNK = 180000;
  S.cloud = null;
  S.cloudReady = (function () {
    try {
      if (typeof window === 'undefined' || !window.claude || !window.claude.use) return Promise.resolve(null);
      return Promise.all([window.claude.use('db'), window.claude.use('user')]).then(function (r) {
        var db = r[0], user = r[1];
        if (!db || !user) return null;
        return Promise.resolve(user.id()).then(function (uid) { if (!uid) return null; S.cloud = { db: db, uid: uid }; return S.cloud; });
      }).catch(function () { return null; });
    } catch (e) { return Promise.resolve(null); }
  })();
  function slotId(name) { return 'save_' + String(name).replace(/[^A-Za-z0-9_\-.~]/g, '_').slice(0, 60); }
  S.cloudSave = function (name, game) {
    return S.cloudReady.then(function (c) {
      if (!c) return false;
      var data = S.serialize(game), n = Math.ceil(data.length / CHUNK);
      var meta = c.db.collection('data/users/' + c.uid).doc(slotId(name));
      var chunks = meta.collection('chunks');
      var p = Promise.resolve();
      for (var i = 0; i < n; i++) (function (i) { p = p.then(function () { return chunks.doc('c' + i).set({ d: data.substr(i * CHUNK, CHUNK) }); }); })(i);
      return p.then(function () { return meta.set({ name: name, meta: S.meta(game), chunks: n, date: Date.now(), kind: 'save' }); }).then(function () { return true; });
    }).catch(function (e) { console.warn('cloud save', e); return false; });
  };
  S.cloudList = function () {
    return S.cloudReady.then(function (c) {
      if (!c) return null;
      return c.db.collection('data/users/' + c.uid).where('kind', '==', 'save').get().then(function (snap) {
        return snap.docs.map(function (d) { var b = d.data(); return { id: d.id, name: b.name, meta: b.meta, date: b.date, chunks: b.chunks }; });
      });
    }).catch(function () { return null; });
  };
  S.cloudLoad = function (id) {
    return S.cloudReady.then(function (c) {
      if (!c) return null;
      var meta = c.db.collection('data/users/' + c.uid).doc(id);
      return meta.get().then(function (snap) {
        if (!snap.exists) return null;
        var n = snap.data().chunks, parts = [];
        var p = Promise.resolve();
        for (var i = 0; i < n; i++) (function (i) { p = p.then(function () { return meta.collection('chunks').doc('c' + i).get().then(function (cs) { parts[i] = cs.exists ? cs.data().d : ''; }); }); })(i);
        return p.then(function () { return S.deserialize(parts.join('')); });
      });
    });
  };
  S.cloudDelete = function (id) {
    return S.cloudReady.then(function (c) { if (!c) return false; return c.db.collection('data/users/' + c.uid).doc(id).delete().then(function () { return true; }); });
  };
  S.download = function (filename, text) {
    var viaCap = (typeof window !== 'undefined' && window.claude && window.claude.use) ? window.claude.use('downloads') : Promise.resolve(null);
    return Promise.resolve(viaCap).then(function (dl) {
      if (dl) return dl.save({ filename: filename, data: new Blob([text], { type: 'text/plain' }) }).then(function () { return true; });
      var a = document.createElement('a'); a.href = URL.createObjectURL(new Blob([text], { type: 'text/plain' })); a.download = filename; document.body.appendChild(a); a.click(); a.remove(); return true;
    });
  };

  S.meta = function (game) {
    var h = game.players[game.humanId];
    return { civ: h.name, leader: h.leader, turn: game.turn, year: G.Engine.yearOf(game), size: game.size, speed: game.speed };
  };
  S.saveGame = function (game, name) { return S.put(name, S.meta(game), S.serialize(game)); };
  S.loadGame = function (name) { return S.get(name).then(function (r) { return r ? S.deserialize(r.data) : null; }); };
  return S;
})();
