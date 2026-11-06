# Ages of Empire — Enhanced Edition (v3, "Living Sky")

Everything from v2 (faster turns + sound), plus a graphics pass aimed at the
one thing the engine couldn't do before: the map itself never moved or
breathed. The terrain art was already detailed — v3 gives it a sky.

## New in v3

### 1. A living sky (new file: js/gfx/skylight.js)
- **Drifting cloud shadows.** Two parallax layers of soft shade, generated
  from the same noise fields as the terrain, slide slowly across the whole
  world — plains darken as a cloud passes, coasts brighten when it leaves.
  This is the single biggest "the world feels alive" cue strategy games use,
  and it costs almost nothing: the shadows are pre-rendered patterns, drawn
  as two full-screen fills per frame (measured: +15 canvas calls per frame,
  under 1%, against a warm sprite cache).
- **Golden sun bloom.** A warm radial glow anchored upper-left — the same
  direction the terrain/hill lighting already comes from — soft-light blended
  over the existing colour grade.
- **Film grain.** A three-frame cycling grain at 5% opacity. Barely visible
  on purpose; it kills the flat digital look of large colour areas.
- All of it is one settings toggle: **Menu → Settings → "Rich graphics —
  living sky & golden light"** (on by default). Motion also respects the
  existing "Animated water, smoke & effects" setting: with animation off,
  the sky is still and painted, never moving. Saves and gameplay untouched.

### 2. Richer chrome (css/style.css, appended "v3" block only)
Gilded setup title (real gradient-gold lettering), an animated light sheen
sweeping the End Turn button (off under reduced-motion), glassy top bar
with gold trim, glowing side-menu buttons, a double-framed minimap, blurred
modal backdrops, bronze scrollbars, gold text selection, and visible
keyboard focus rings.

### Verified
- DOM boot of all 40 scripts: zero errors; game starts; renderer draws real
  frames with Rich graphics ON and OFF (incl. reveal-all at high zoom).
- Settings row present, starts on, toggling flips the live renderer state
  and persists.
- Simulation parity: the engine files are byte-identical to v2, and the
  6-map × 250-turn soak reproduces v2's exact city/unit counts on every
  combo. Graphics only — same worlds, same saves, same outcomes.

---

# Ages of Empire — Enhanced Edition (v2)

Same game, same worlds, same saves. Your original save files and exported
saves load in this edition unchanged — the simulation produces identical
games (verified below). What changed is speed and sound.

## What's new

### 1. Faster turns (the big one)
Late-game AI turns were the bottleneck. CPU profiling of a 500-turn game
pointed at three hotspots; all three got behavior-preserving fixes:

- **Pathfinding** no longer recomputes zone-of-control for every tile
  expansion (it's memoized within each search), no longer allocates a
  neighbour array per step, and uses a new allocation-free hex distance
  for its heuristic.
- **Visibility** no longer rescans every tile of the map after every
  single unit move. Full refreshes still run at turn start / city
  founding / capture; moves and attacks use a light refresh backed by a
  per-player owned-tile cache (tile purchases update the cache live).
- Net measured effect: full 250-turn AI games run **~10–15% faster**,
  and the worst late-game turn dropped from **418 ms → 356 ms**
  (Node benchmark, standard map, seed 777).

### 2. Sound — there was none, now there is
A complete synthesized sound pack (WebAudio, zero audio files, so the
game stays one self-contained folder): button clicks, unit select/move,
melee and ranged combat, city founded/captured, research complete,
wonders, war and peace, nukes, turn chime, victory/defeat stings.
Only events involving *you* (plus world news) make noise, combat sounds
are throttled during AI turns, and there's a **Sound effects** toggle in
Menu → Settings.

### 3. Setup screen badge
The title screen now says which edition you're running.

## How it was verified (not just claimed)
- All 40 files pass syntax checks.
- **1,500 turns of AI-vs-AI soak tests** across 6 map/seed combos
  (duel→large, pangaea/continents/archipelago/fractal): zero crashes,
  save/load round-trip passes, and every game's city/unit counts match
  the original edition exactly.
- A full **500-turn game** on both editions: identical winner, identical
  victory type/turn, identical leader score (1519), identical tech
  counts for all 8 civilizations.
- The new hex distance was fuzz-tested against the original on
  **600,000 random tile pairs** across 3 map sizes: zero mismatches.
- Full-stack boot test (all 39 scripts in a real DOM): zero errors,
  setup screen renders with the new badge, a human game starts through
  the real UI (HUD live, "Turn 0 · 4000 BC"), and Menu → Settings shows
  the Sound effects toggle working and persisting. (A pixel screenshot
  wasn't possible from the build machine — its browser can't reach the
  local server and its Chromium is policy-locked — so rendering was
  verified at the DOM/canvas-call level, not by eye.)

## Honest notes
- The speedup is real but it's ~12%, not 100×. "100× better" was the
  brief; what a 13,000-line finished game honestly has room for is a
  solid shave on turn time, a whole sound layer it never had, and proof
  nothing broke. Bigger speed would need riskier surgery (citizen
  assignment caching, incremental visibility) — listed here as known
  future work rather than smuggled in unproven.
- Rendering performance on very weak hardware still depends on the
  animated-effects setting (Menu → Settings → "Animated water, smoke
  & effects" off is the lightest mode).
