// ============================================================
//  Boot
// ============================================================
(function () {
  var UI = G.UI;
  function boot() {
    // v2: audio unlocks on the first gesture (browser policy); buttons click.
    window.addEventListener('pointerdown', function () { if (G.SFX) G.SFX.unlock(); }, { passive: true });
    window.addEventListener('keydown', function () { if (G.SFX) G.SFX.unlock(); });
    document.addEventListener('click', function (e) { if (G.SFX && e.target && e.target.closest && e.target.closest('button')) G.SFX.play('click'); });
    UI.loadSettings();
    UI.rend = new G.Render(document.getElementById('map'));
    UI.rend.showGrid = !!UI.settings.grid;
    UI.bindInput();
    // gentle blink for units awaiting orders
    setInterval(function () { if (UI.rend && UI.game && !UI.busy) { UI.rend.blink = !UI.rend.blink; UI.rend.request(); } }, 700);
    UI.rend.onFrame = function () { if (UI.game) UI.rend.drawMinimap(document.getElementById('minimap')); };
    // draw an idle backdrop map behind the setup screen
    try {
      var demo = G.Engine.newGame({ size: 'duel', mapType: 'pangaea', speed: 'quick', difficulty: 'prince', civ: 'rome', allAI: true, seed: 20261105, numCS: 0, barbarians: false });
      UI.rend.setGame(demo, -1); UI.rend.revealAll = true; UI.rend.resize(); UI.rend.s = 34; UI.rend.centerOn(demo.players[0].startTile);
    } catch (e) { console.warn(e); }
    G.Screens.setup();
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
