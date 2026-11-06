// ============================================================
//  Installs the GFX painters and hooks into the renderer.
// ============================================================
(function (GF) {
  if (!G.Render || !G.Render.P) return;
  var P = G.Render.P;
  P.ground = GF.ground; P.tall = GF.tall; P.city = GF.city; P.unit = GF.unit; P.improvement = GF.improvement;
  G.Render.prototype.hooks = GF.hooks;
})(G.GFX);
