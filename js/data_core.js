// ============================================================
//  AGES OF EMPIRE — core rules data
//  Numbers follow Civilization V (Brave New World) where known:
//   - Food to grow: 15 + 6(n-1) + (n-1)^1.8
//   - Policy cost: 25 + (3k)^2.01, x(1 + 0.1 per extra city), floor to 5
//   - Border tile cost: 20 + (10(t-1))^1.1
//   - Combat: 24..36 base damage, scaled by ((((r+3)/4)^4)+1)/2
//   - Unhappiness: 3 per city, 1 per citizen; +4 per unique luxury
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};
G.D = G.D || {};

// Yield keys: f food, p production, g gold, s science, c culture, fa faith, t tourism
G.D.YIELDS = ['f', 'p', 'g', 's', 'c', 'fa'];
G.D.YIELD_NAMES = { f: 'Food', p: 'Production', g: 'Gold', s: 'Science', c: 'Culture', fa: 'Faith', t: 'Tourism' };
G.D.YIELD_ICONS = { f: '🌾', p: '⚒', g: '💰', s: '⚗', c: '🎭', fa: '🕊', t: '✈', h: '☺' };

// ---------- Game speeds ----------
// cost: % multiplier on production/research/culture/faith/GP costs. turns: turn limit for time victory
G.D.SPEEDS = {
  blitz:    { name: 'Blitz',    cost: 40,  growth: 50,  turns: 200,  desc: 'Very short game (a few hours)' },
  quick:    { name: 'Quick',    cost: 67,  growth: 67,  turns: 330,  desc: 'Civ V Quick speed' },
  standard: { name: 'Standard', cost: 100, growth: 100, turns: 500,  desc: 'Civ V Standard speed' },
  epic:     { name: 'Epic',     cost: 150, growth: 150, turns: 750,  desc: 'Civ V Epic speed' },
  marathon: { name: 'Marathon', cost: 300, growth: 300, turns: 1500, desc: 'Civ V Marathon speed (days)' },
  eternal:  { name: 'Eternal',  cost: 500, growth: 400, turns: 2500, desc: 'Longer than Marathon (many days)' }
};

// ---------- Map sizes (Civ V dimensions, plus Colossal) ----------
G.D.MAP_SIZES = {
  duel:     { name: 'Duel',     w: 40,  h: 24,  civs: 2,  cs: 4,  policyMod: 0.10 },
  tiny:     { name: 'Tiny',     w: 56,  h: 36,  civs: 4,  cs: 8,  policyMod: 0.10 },
  small:    { name: 'Small',    w: 66,  h: 42,  civs: 6,  cs: 12, policyMod: 0.10 },
  standard: { name: 'Standard', w: 80,  h: 52,  civs: 8,  cs: 16, policyMod: 0.10 },
  large:    { name: 'Large',    w: 104, h: 64,  civs: 10, cs: 20, policyMod: 0.075 },
  huge:     { name: 'Huge',     w: 128, h: 80,  civs: 12, cs: 24, policyMod: 0.05 },
  colossal: { name: 'Colossal', w: 160, h: 100, civs: 18, cs: 30, policyMod: 0.05 }
};

G.D.MAP_TYPES = {
  continents: { name: 'Continents' },
  pangaea: { name: 'Pangaea' },
  archipelago: { name: 'Archipelago' },
  fractal: { name: 'Fractal' },
  inland_sea: { name: 'Inland Sea' },
  small_continents: { name: 'Small Continents' }
};

// Difficulty: AI bonuses (% production/science/growth discount) and player happiness
G.D.DIFFICULTIES = {
  settler:   { name: 'Settler',   aiBonus: -30, playerHappy: 12, barbStr: 0.6 },
  chieftain: { name: 'Chieftain', aiBonus: -15, playerHappy: 10, barbStr: 0.75 },
  warlord:   { name: 'Warlord',   aiBonus: 0,   playerHappy: 9,  barbStr: 0.9 },
  prince:    { name: 'Prince',    aiBonus: 0,   playerHappy: 9,  barbStr: 1 },
  king:      { name: 'King',      aiBonus: 15,  playerHappy: 9,  barbStr: 1 },
  emperor:   { name: 'Emperor',   aiBonus: 25,  playerHappy: 9,  barbStr: 1.1 },
  immortal:  { name: 'Immortal',  aiBonus: 40,  playerHappy: 9,  barbStr: 1.2 },
  deity:     { name: 'Deity',     aiBonus: 60,  playerHappy: 9,  barbStr: 1.3 }
};

G.D.ERAS = ['Ancient', 'Classical', 'Medieval', 'Renaissance', 'Industrial', 'Modern', 'Atomic', 'Information'];

// ---------- Terrain ----------
// move: movement cost, def: defensive modifier %, color: base render colour
G.D.TERRAIN = {
  grassland: { name: 'Grassland', y: { f: 2 }, move: 1, def: 0, color: '#5f9a35', color2: '#4e8a2b' },
  plains:    { name: 'Plains',    y: { f: 1, p: 1 }, move: 1, def: 0, color: '#a8a548', color2: '#958f3a' },
  desert:    { name: 'Desert',    y: {}, move: 1, def: 0, color: '#dcc785', color2: '#cdb46c' },
  tundra:    { name: 'Tundra',    y: { f: 1 }, move: 1, def: 0, color: '#8c8a76', color2: '#7a7966' },
  snow:      { name: 'Snow',      y: {}, move: 1, def: 0, color: '#eef2f5', color2: '#d5dde4' },
  coast:     { name: 'Coast',     y: { f: 1, g: 1 }, move: 1, def: 0, water: true, color: '#3f8fb5', color2: '#3582a8' },
  ocean:     { name: 'Ocean',     y: { f: 1 }, move: 1, def: 0, water: true, deep: true, color: '#1f5a8c', color2: '#1a4f7d' },
  lake:      { name: 'Lake',      y: { f: 2, g: 1 }, move: 1, def: 0, water: true, fresh: true, color: '#4fa0c4', color2: '#4592b6' },
  mountain:  { name: 'Mountain',  y: {}, move: 99, def: 25, impassable: true, color: '#8a8278', color2: '#6d665e' }
};
// Hills are an elevation flag on land tiles: base yield becomes 2 production, +25% defense, 2 move
G.D.HILLS = { name: 'Hills', y: { p: 2 }, move: 2, def: 25 };

G.D.FEATURES = {
  forest:      { name: 'Forest',      y: { f: 1, p: 1 }, replaceYield: true, move: 2, def: 25, on: ['grassland', 'plains', 'tundra'], removeTech: 'mining' },
  jungle:      { name: 'Jungle',      y: { f: 1 }, replaceYield: true, move: 2, def: 25, on: ['grassland', 'plains'], removeTech: 'bronze_working' },
  marsh:       { name: 'Marsh',       y: { f: -1 }, move: 2, def: -15, on: ['grassland'], removeTech: 'masonry' },
  floodplains: { name: 'Flood Plains', y: { f: 2 }, move: 1, def: -10, on: ['desert'] },
  oasis:       { name: 'Oasis',       y: { f: 3, g: 1 }, replaceYield: true, move: 1, def: -10, fresh: true, on: ['desert'] },
  ice:         { name: 'Ice',         y: {}, replaceYield: true, move: 99, impassable: true, on: ['ocean', 'coast'] },
  atoll:       { name: 'Atoll',       y: { f: 1, p: 1 }, move: 1, def: 0, on: ['coast'] },
  fallout:     { name: 'Fallout',     y: { f: -3, p: -3, g: -3 }, move: 2, def: -15, on: [] }
};

// ---------- Natural wonders ----------
G.D.NATURAL_WONDERS = {
  mt_fuji:          { name: 'Mount Fuji', y: { c: 2, fa: 3, g: 2 }, happy: 0, terrainLike: 'mountain' },
  kilimanjaro:      { name: 'Mount Kilimanjaro', y: { f: 3, c: 2 }, promo: 'altitude', terrainLike: 'mountain' },
  great_barrier:    { name: 'Great Barrier Reef', y: { f: 2, p: 1, s: 2, g: 1 }, water: true },
  krakatoa:         { name: 'Krakatoa', y: { s: 5 }, water: true, terrainLike: 'mountain' },
  old_faithful:     { name: 'Old Faithful', y: { s: 3 }, happy: 2, terrainLike: 'mountain' },
  uluru:            { name: 'Uluru', y: { fa: 6, c: 2 }, terrainLike: 'mountain' },
  rock_gibraltar:   { name: 'Rock of Gibraltar', y: { f: 2, g: 5 }, terrainLike: 'mountain' },
  grand_mesa:       { name: 'Grand Mesa', y: { p: 2, g: 3 }, terrainLike: 'mountain' },
  cerro_potosi:     { name: 'Cerro de Potosí', y: { g: 10 }, terrainLike: 'mountain' },
  el_dorado:        { name: 'El Dorado', y: { g: 5 }, happy: 0, culturalFirst: 100 },
  fountain_youth:   { name: 'Fountain of Youth', y: { happy: 0 }, happy: 10, promo: 'fountain' },
  mt_sinai:         { name: 'Mount Sinai', y: { fa: 8 }, terrainLike: 'mountain' },
  mt_kailash:       { name: 'Mount Kailash', y: { fa: 6, h: 2 }, happy: 2, terrainLike: 'mountain' },
  sri_pada:         { name: 'Sri Pada', y: { f: 2, fa: 4 }, happy: 2, terrainLike: 'mountain' },
  king_solomon:     { name: "King Solomon's Mines", y: { p: 6 }, terrainLike: 'mountain' },
  lake_victoria:    { name: 'Lake Victoria', y: { f: 6 }, water: true, terrainLike: 'lake' },
  victoria_falls:   { name: 'Victoria Falls', y: { s: 3, c: 2 }, happy: 1, terrainLike: 'mountain' }
};

// ---------- Resources ----------
// type: bonus / strategic / luxury. tech: needed to reveal; imp: improvement that activates it
G.D.RESOURCES = {
  // Bonus
  wheat:   { name: 'Wheat',   type: 'bonus', y: { f: 1 }, imp: 'farm', on: ['plains', 'floodplains', 'desert_fp'], icon: '🌾', color: '#e6c34a' },
  cattle:  { name: 'Cattle',  type: 'bonus', y: { f: 1 }, imp: 'pasture', on: ['grassland'], icon: '🐄', color: '#8a5a3a' },
  sheep:   { name: 'Sheep',   type: 'bonus', y: { f: 1 }, imp: 'pasture', on: ['hills'], icon: '🐑', color: '#f2f2f2' },
  deer:    { name: 'Deer',    type: 'bonus', y: { f: 1 }, imp: 'camp', on: ['forest', 'tundra'], icon: '🦌', color: '#a0652d' },
  bananas: { name: 'Bananas', type: 'bonus', y: { f: 1 }, imp: 'plantation', on: ['jungle'], icon: '🍌', color: '#f5df4d' },
  fish:    { name: 'Fish',    type: 'bonus', y: { f: 2 }, imp: 'fishing_boats', on: ['coast', 'lake'], icon: '🐟', color: '#9fc6e0' },
  stone:   { name: 'Stone',   type: 'bonus', y: { p: 1 }, imp: 'quarry', on: ['grassland', 'plains', 'desert', 'tundra'], icon: '🪨', color: '#9a9a9a' },
  // Strategic
  horses:   { name: 'Horses',   type: 'strategic', y: { p: 1 }, imp: 'pasture', tech: 'animal_husbandry', on: ['grassland', 'plains', 'tundra'], qty: [2, 4], icon: '🐎', color: '#6b4226' },
  iron:     { name: 'Iron',     type: 'strategic', y: { p: 1 }, imp: 'mine', tech: 'bronze_working', on: ['hills', 'plains', 'grassland', 'desert', 'tundra', 'snow'], qty: [2, 6], icon: '⛓', color: '#5c6670' },
  coal:     { name: 'Coal',     type: 'strategic', y: { p: 1 }, imp: 'mine', tech: 'industrialization', on: ['hills', 'grassland', 'plains'], qty: [2, 6], icon: '⬛', color: '#2b2b2b' },
  oil:      { name: 'Oil',      type: 'strategic', y: { p: 1 }, imp: 'oil_well', tech: 'biology', on: ['desert', 'tundra', 'snow', 'marsh', 'jungle', 'coast'], qty: [2, 6], icon: '🛢', color: '#111111' },
  aluminum: { name: 'Aluminum', type: 'strategic', y: { s: 1 }, imp: 'mine', tech: 'electricity', on: ['hills', 'desert', 'plains', 'tundra'], qty: [2, 6], icon: '◆', color: '#c9d1d6' },
  uranium:  { name: 'Uranium',  type: 'strategic', y: { p: 1 }, imp: 'mine', tech: 'atomic_theory', on: ['hills', 'tundra', 'desert', 'jungle', 'forest', 'snow'], qty: [1, 4], icon: '☢', color: '#7fe05a' },
  // Luxury (each unique type: +4 happiness)
  gold_ore: { name: 'Gold',     type: 'luxury', y: { g: 2 }, imp: 'mine', on: ['hills', 'desert', 'plains', 'grassland'], icon: '🥇', color: '#f2c22e' },
  silver:   { name: 'Silver',   type: 'luxury', y: { g: 2 }, imp: 'mine', on: ['hills', 'tundra', 'desert'], icon: '🥈', color: '#d9dde0' },
  gems:     { name: 'Gems',     type: 'luxury', y: { g: 3 }, imp: 'mine', on: ['hills', 'jungle', 'grassland', 'plains', 'desert', 'tundra'], icon: '💎', color: '#3fd0d4' },
  marble:   { name: 'Marble',   type: 'luxury', y: { g: 2 }, imp: 'quarry', on: ['hills', 'grassland', 'plains', 'desert', 'tundra'], icon: '🏛', color: '#f0ece2', wonderBonus: 15 },
  ivory:    { name: 'Ivory',    type: 'luxury', y: { g: 2 }, imp: 'camp', on: ['plains', 'grassland'], icon: '🐘', color: '#f5efdb' },
  furs:     { name: 'Furs',     type: 'luxury', y: { g: 2 }, imp: 'camp', on: ['forest', 'tundra'], icon: '🦊', color: '#c26b2a' },
  dyes:     { name: 'Dyes',     type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['forest', 'jungle'], icon: '🎨', color: '#9b3fbf' },
  spices:   { name: 'Spices',   type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['jungle', 'forest'], icon: '🌶', color: '#d43c2b' },
  silk:     { name: 'Silk',     type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['forest'], icon: '🧵', color: '#f0a7d0' },
  sugar:    { name: 'Sugar',    type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['floodplains', 'marsh', 'grassland'], icon: '🍬', color: '#fafafa' },
  cotton:   { name: 'Cotton',   type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['grassland', 'plains', 'desert'], icon: '☁', color: '#fbfbfb' },
  wine:     { name: 'Wine',     type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['grassland', 'plains'], icon: '🍇', color: '#7a1f4a' },
  incense:  { name: 'Incense',  type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['desert', 'plains'], icon: '🕯', color: '#e8d6a8' },
  citrus:   { name: 'Citrus',   type: 'luxury', y: { f: 1, g: 1 }, imp: 'plantation', on: ['jungle', 'grassland', 'plains'], icon: '🍊', color: '#f59a23' },
  cocoa:    { name: 'Cocoa',    type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['jungle'], icon: '🍫', color: '#6b3b1a' },
  coffee:   { name: 'Coffee',   type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['jungle', 'hills', 'grassland'], icon: '☕', color: '#4a2b16' },
  tea:      { name: 'Tea',      type: 'luxury', y: { g: 1, s: 1 }, imp: 'plantation', on: ['hills', 'grassland'], icon: '🍵', color: '#5c8a3a' },
  tobacco:  { name: 'Tobacco',  type: 'luxury', y: { g: 2 }, imp: 'plantation', on: ['grassland', 'plains'], icon: '🍂', color: '#a8742f' },
  jade:     { name: 'Jade',     type: 'luxury', y: { g: 2, c: 1 }, imp: 'mine', on: ['hills', 'grassland', 'forest'], icon: '🟢', color: '#2ea86a' },
  amber:    { name: 'Amber',    type: 'luxury', y: { g: 2, c: 1 }, imp: 'mine', on: ['forest', 'tundra', 'plains'], icon: '🟠', color: '#f2a32e' },
  copper:   { name: 'Copper',   type: 'luxury', y: { g: 2 }, imp: 'mine', on: ['hills', 'desert', 'plains', 'grassland'], icon: '🟤', color: '#c46b3a' },
  salt:     { name: 'Salt',     type: 'luxury', y: { f: 1, g: 1 }, imp: 'mine', on: ['plains', 'desert', 'tundra'], icon: '🧂', color: '#f7f7f7' },
  truffles: { name: 'Truffles', type: 'luxury', y: { g: 3 }, imp: 'camp', on: ['forest', 'marsh', 'jungle'], icon: '🍄', color: '#5e4128' },
  whales:   { name: 'Whales',   type: 'luxury', y: { f: 1, g: 1 }, imp: 'fishing_boats', on: ['coast'], icon: '🐋', color: '#3f5a73' },
  pearls:   { name: 'Pearls',   type: 'luxury', y: { g: 2 }, imp: 'fishing_boats', on: ['coast'], icon: '🦪', color: '#f0f0ff' },
  crab:     { name: 'Crab',     type: 'luxury', y: { g: 2 }, imp: 'fishing_boats', on: ['coast'], icon: '🦀', color: '#e2502b' }
};

// ---------- Tile improvements ----------
// y: yields added; techY: extra yields after a tech; on: valid where
G.D.IMPROVEMENTS = {
  farm:        { name: 'Farm', tech: 'agriculture', turns: 6, y: { f: 1 }, techY: [['fertilizer', { f: 1 }], ['civil_service', { f: 1 }, 'fresh']], valid: 'farmable' },
  mine:        { name: 'Mine', tech: 'mining', turns: 7, y: { p: 1 }, techY: [['chemistry', { p: 1 }]], valid: 'mineable' },
  pasture:     { name: 'Pasture', tech: 'animal_husbandry', turns: 6, y: {}, resOnly: true },
  plantation:  { name: 'Plantation', tech: 'calendar', turns: 6, y: {}, resOnly: true },
  camp:        { name: 'Camp', tech: 'trapping', turns: 6, y: {}, resOnly: true },
  quarry:      { name: 'Quarry', tech: 'masonry', turns: 7, y: {}, resOnly: true },
  fishing_boats: { name: 'Fishing Boats', tech: 'sailing', turns: 0, y: {}, resOnly: true, sea: true },
  oil_well:    { name: 'Oil Well', tech: 'biology', turns: 8, y: {}, resOnly: true },
  offshore_platform: { name: 'Offshore Platform', tech: 'refrigeration', turns: 0, y: {}, resOnly: true, sea: true },
  lumber_mill: { name: 'Lumber Mill', tech: 'construction', turns: 6, y: { p: 1 }, techY: [['scientific_theory', { p: 1 }]], valid: 'forest' },
  trading_post:{ name: 'Trading Post', tech: 'trapping', turns: 6, y: { g: 1 }, techY: [['guilds', { g: 1 }], ['economics', { g: 1 }]], valid: 'flatland' },
  fort:        { name: 'Fort', tech: 'engineering', turns: 6, y: {}, def: 50, valid: 'land' },
  // Great Person improvements (built by expending the GP)
  academy:     { name: 'Academy', gp: true, y: { s: 3 }, techY: [['scientific_theory', { s: 2 }], ['plastics', { s: 2 }]] },
  manufactory: { name: 'Manufactory', gp: true, y: { p: 3 }, techY: [['industrialization', { p: 1 }], ['robotics', { p: 2 }]] },
  customs_house: { name: 'Customs House', gp: true, y: { g: 4 }, techY: [['economics', { g: 1 }], ['globalization', { g: 2 }]] },
  holy_site:   { name: 'Holy Site', gp: true, y: { fa: 6 }, techY: [['theology', { c: 3 }]] },
  citadel:     { name: 'Citadel', gp: true, y: {}, def: 100, damage: 30 },
  landmark:    { name: 'Landmark', gp: true, y: { c: 3 } },
  // Unique improvements
  terrace_farm:{ name: 'Terrace Farm', tech: 'agriculture', turns: 6, y: { f: 1 }, valid: 'hills', unique: 'inca' },
  polder:      { name: 'Polder', tech: 'guilds', turns: 8, y: { f: 3, g: 1 }, valid: 'marsh', unique: 'netherlands' },
  kasbah:      { name: 'Kasbah', tech: 'machinery', turns: 8, y: { f: 1, p: 1, g: 1 }, def: 50, valid: 'desert', unique: 'morocco' },
  feitoria:    { name: 'Feitoria', tech: 'navigation', turns: 8, y: { g: 3 }, valid: 'coastland', unique: 'portugal' },
  moai:        { name: 'Moai', tech: 'construction', turns: 6, y: { c: 1 }, valid: 'coastland', unique: 'hawaii' },
  chateau:     { name: 'Chateau', tech: 'chivalry', turns: 8, y: { c: 2, g: 1 }, valid: 'land', unique: 'france' },
  kampung:     { name: 'Kampung', tech: 'navigation', turns: 6, y: { f: 1, p: 1 }, valid: 'coastland', unique: 'indonesia' },
  ziggurat_farm: { name: 'Qanat', tech: 'masonry', turns: 6, y: { f: 2 }, valid: 'desert', unique: 'persia' }
};
G.D.ROADS = {
  road:     { name: 'Road', tech: 'the_wheel', turns: 3, moveCost: 1 / 3, maint: 1 },
  railroad: { name: 'Railroad', tech: 'railroad', turns: 4, moveCost: 1 / 10, maint: 2, prodPct: 25 }
};

// ---------- Technologies (Civ V BNW tree, costs on Standard speed) ----------
// era index, cost, prerequisites, grid position (col,row) for the tree screen
G.D.TECHS = {};
(function () {
  var T = function (id, name, era, cost, req, col, row, desc) {
    G.D.TECHS[id] = { id: id, name: name, era: era, cost: cost, req: req, col: col, row: row, desc: desc || '' };
  };
  // Ancient
  T('agriculture', 'Agriculture', 0, 20, [], 0, 4, 'The foundation of civilization: farms.');
  T('pottery', 'Pottery', 0, 35, ['agriculture'], 1, 1);
  T('animal_husbandry', 'Animal Husbandry', 0, 35, ['agriculture'], 1, 4, 'Reveals Horses.');
  T('archery', 'Archery', 0, 35, ['agriculture'], 1, 6);
  T('mining', 'Mining', 0, 35, ['agriculture'], 1, 8, 'Mines; clear forests.');
  T('sailing', 'Sailing', 0, 55, ['pottery'], 2, 0);
  T('calendar', 'Calendar', 0, 55, ['pottery'], 2, 1, 'Plantations.');
  T('writing', 'Writing', 0, 55, ['pottery'], 2, 2);
  T('trapping', 'Trapping', 0, 55, ['animal_husbandry'], 2, 3, 'Camps, Trading Posts.');
  T('the_wheel', 'The Wheel', 0, 55, ['animal_husbandry'], 2, 5, 'Roads.');
  T('masonry', 'Masonry', 0, 55, ['mining'], 2, 7, 'Quarries; clear marsh.');
  T('bronze_working', 'Bronze Working', 0, 55, ['mining'], 2, 8, 'Reveals Iron; clear jungle.');
  // Classical
  T('optics', 'Optics', 1, 85, ['sailing'], 3, 0, 'Units may embark.');
  T('horseback_riding', 'Horseback Riding', 1, 85, ['the_wheel'], 3, 4);
  T('mathematics', 'Mathematics', 1, 85, ['the_wheel', 'archery'], 3, 6);
  T('construction', 'Construction', 1, 85, ['masonry', 'the_wheel'], 3, 7, 'Lumber mills.');
  T('drama', 'Drama and Poetry', 1, 175, ['writing'], 4, 1);
  T('philosophy', 'Philosophy', 1, 175, ['writing', 'calendar'], 4, 2);
  T('currency', 'Currency', 1, 175, ['bronze_working'], 4, 8);
  T('iron_working', 'Iron Working', 1, 195, ['bronze_working'], 4, 9);
  T('engineering', 'Engineering', 1, 195, ['mathematics', 'construction'], 4, 6, 'Forts; road bridges.');
  // Medieval
  T('compass', 'Compass', 2, 275, ['optics'], 5, 0);
  T('theology', 'Theology', 2, 275, ['drama', 'philosophy'], 5, 1);
  T('civil_service', 'Civil Service', 2, 275, ['philosophy', 'trapping'], 5, 3, '+1 Food on fresh-water farms.');
  T('guilds', 'Guilds', 2, 275, ['currency'], 5, 8);
  T('metal_casting', 'Metal Casting', 2, 275, ['iron_working', 'construction'], 5, 7);
  T('education', 'Education', 2, 485, ['theology', 'civil_service'], 6, 2);
  T('chivalry', 'Chivalry', 2, 485, ['civil_service', 'horseback_riding', 'currency'], 6, 4);
  T('machinery', 'Machinery', 2, 485, ['guilds', 'engineering'], 6, 6, 'Roads move faster.');
  T('physics', 'Physics', 2, 485, ['metal_casting', 'compass'], 6, 0);
  T('steel', 'Steel', 2, 485, ['metal_casting'], 6, 8);
  // Renaissance
  T('astronomy', 'Astronomy', 3, 780, ['education', 'compass'], 7, 0, 'Embarked units cross ocean.');
  T('acoustics', 'Acoustics', 3, 780, ['education'], 7, 2);
  T('banking', 'Banking', 3, 780, ['chivalry', 'education'], 7, 4);
  T('printing_press', 'Printing Press', 3, 780, ['machinery', 'theology'], 7, 6);
  T('gunpowder', 'Gunpowder', 3, 780, ['physics', 'steel'], 7, 8);
  T('navigation', 'Navigation', 3, 1150, ['astronomy'], 8, 0);
  T('architecture', 'Architecture', 3, 1150, ['acoustics', 'printing_press'], 8, 2);
  T('economics', 'Economics', 3, 1150, ['banking', 'printing_press'], 8, 4);
  T('chemistry', 'Chemistry', 3, 1150, ['gunpowder'], 8, 7, '+1 Production on mines.');
  T('metallurgy', 'Metallurgy', 3, 1150, ['gunpowder'], 8, 9);
  // Industrial
  T('archaeology', 'Archaeology', 4, 1600, ['navigation'], 9, 0);
  T('scientific_theory', 'Scientific Theory', 4, 1600, ['architecture', 'navigation'], 9, 2);
  T('industrialization', 'Industrialization', 4, 1600, ['economics', 'metallurgy'], 9, 5, 'Reveals Coal.');
  T('rifling', 'Rifling', 4, 1600, ['metallurgy'], 9, 9);
  T('military_science', 'Military Science', 4, 1600, ['economics', 'chemistry'], 9, 7);
  T('fertilizer', 'Fertilizer', 4, 1600, ['chemistry'], 9, 8, '+1 Food on farms.');
  T('biology', 'Biology', 4, 2350, ['archaeology', 'scientific_theory'], 10, 1, 'Reveals Oil.');
  T('electricity', 'Electricity', 4, 2350, ['scientific_theory', 'metallurgy'], 10, 3, 'Reveals Aluminum.');
  T('steam_power', 'Steam Power', 4, 2350, ['industrialization', 'scientific_theory'], 10, 5);
  T('dynamite', 'Dynamite', 4, 2350, ['fertilizer', 'rifling', 'military_science'], 10, 8);
  T('railroad', 'Railroad', 4, 2350, ['steam_power', 'dynamite'], 11, 6, 'Railroads.');
  // Modern
  T('refrigeration', 'Refrigeration', 5, 3100, ['biology', 'electricity'], 11, 1, 'Offshore platforms.');
  T('telegraph', 'Telegraph', 5, 3100, ['electricity'], 11, 3);
  T('radio', 'Radio', 5, 3100, ['electricity'], 11, 2);
  T('replaceable_parts', 'Replaceable Parts', 5, 3100, ['steam_power'], 11, 5);
  T('flight', 'Flight', 5, 3100, ['replaceable_parts', 'radio'], 12, 4);
  T('combustion', 'Combustion', 5, 3100, ['railroad', 'replaceable_parts'], 12, 7);
  T('plastics', 'Plastics', 5, 4100, ['refrigeration'], 12, 1);
  T('electronics', 'Electronics', 5, 4100, ['telegraph', 'radio'], 12, 3);
  T('ballistics', 'Ballistics', 5, 4100, ['replaceable_parts', 'combustion'], 13, 6);
  // Atomic
  T('penicillin', 'Penicillin', 6, 4700, ['plastics'], 13, 0);
  T('atomic_theory', 'Atomic Theory', 6, 4700, ['combustion', 'electronics'], 13, 4, 'Reveals Uranium.');
  T('radar', 'Radar', 6, 4700, ['flight', 'electronics'], 13, 3);
  T('combined_arms', 'Combined Arms', 6, 4700, ['ballistics', 'combustion'], 14, 7);
  T('ecology', 'Ecology', 6, 4700, ['plastics', 'penicillin'], 14, 0);
  T('nuclear_fission', 'Nuclear Fission', 6, 5100, ['atomic_theory', 'radar'], 14, 4);
  T('rocketry', 'Rocketry', 6, 5100, ['radar'], 14, 3);
  T('computers', 'Computers', 6, 5100, ['electronics', 'plastics'], 14, 2);
  // Information
  T('telecommunications', 'Telecommunications', 7, 6000, ['computers'], 15, 1);
  T('mobile_tactics', 'Mobile Tactics', 7, 6000, ['nuclear_fission', 'combined_arms'], 15, 6);
  T('advanced_ballistics', 'Advanced Ballistics', 7, 6000, ['rocketry', 'nuclear_fission'], 15, 5);
  T('satellites', 'Satellites', 7, 6000, ['rocketry'], 15, 3);
  T('robotics', 'Robotics', 7, 6000, ['computers', 'mobile_tactics'], 16, 6);
  T('lasers', 'Lasers', 7, 6000, ['satellites', 'nuclear_fission'], 16, 4);
  T('globalization', 'Globalization', 7, 6000, ['ecology', 'telecommunications'], 16, 0);
  T('the_internet', 'The Internet', 7, 6000, ['computers', 'telecommunications'], 16, 2);
  T('particle_physics', 'Particle Physics', 7, 6300, ['satellites', 'robotics'], 17, 5);
  T('nuclear_fusion', 'Nuclear Fusion', 7, 7000, ['lasers', 'particle_physics'], 18, 4);
  T('nanotechnology', 'Nanotechnology', 7, 7000, ['particle_physics'], 18, 6);
  T('stealth', 'Stealth', 7, 7000, ['lasers'], 17, 3);
  T('future_tech', 'Future Tech', 7, 7700, ['nanotechnology', 'nuclear_fusion', 'stealth', 'globalization', 'the_internet'], 19, 4, 'Repeatable. +score.');
})();
