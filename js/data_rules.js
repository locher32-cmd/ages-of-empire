// ============================================================
//  Units, promotions, buildings, wonders, projects, policies, beliefs
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};
G.D = G.D || {};

// cls: civilian, recon, melee, ranged, mounted, siege, gun (gunpowder melee), armor, naval_melee, naval_ranged, air, nuke, gp
// domain: land / sea / air.  str: melee strength, rs: ranged strength, range, mv: moves, res: strategic resource needed
G.D.UNITS = {};
(function () {
  var U = function (id, o) { o.id = id; o.domain = o.domain || 'land'; o.mv = o.mv || 2; o.sight = o.sight || 2; G.D.UNITS[id] = o; };
  // Civilians
  U('settler', { name: 'Settler', cls: 'civilian', cost: 106, mv: 2, flags: ['found'], desc: 'Founds new cities. City stops growing while built.' });
  U('worker', { name: 'Worker', cls: 'civilian', cost: 70, mv: 2, flags: ['build'] });
  U('work_boat', { name: 'Work Boat', cls: 'civilian', cost: 56, mv: 4, domain: 'sea', tech: 'sailing', flags: ['seabuild'] });
  U('caravan', { name: 'Caravan', cls: 'civilian', cost: 75, mv: 2, tech: 'pottery', flags: ['trade'], tradeRange: 10 });
  U('cargo_ship', { name: 'Cargo Ship', cls: 'civilian', cost: 100, mv: 4, domain: 'sea', tech: 'sailing', flags: ['trade'], tradeRange: 15 });
  U('missionary', { name: 'Missionary', cls: 'civilian', cost: 0, faithCost: 200, mv: 4, flags: ['spread'], spreads: 2 });
  U('inquisitor', { name: 'Inquisitor', cls: 'civilian', cost: 0, faithCost: 200, mv: 3, flags: ['inquisitor'] });
  // Great people
  U('great_scientist', { name: 'Great Scientist', cls: 'gp', cost: 0, mv: 2, gp: 'scientist', flags: ['gp'] });
  U('great_engineer', { name: 'Great Engineer', cls: 'gp', cost: 0, mv: 2, gp: 'engineer', flags: ['gp'] });
  U('great_merchant', { name: 'Great Merchant', cls: 'gp', cost: 0, mv: 2, gp: 'merchant', flags: ['gp'] });
  U('great_artist', { name: 'Great Artist', cls: 'gp', cost: 0, mv: 2, gp: 'artist', flags: ['gp'] });
  U('great_writer', { name: 'Great Writer', cls: 'gp', cost: 0, mv: 2, gp: 'writer', flags: ['gp'] });
  U('great_musician', { name: 'Great Musician', cls: 'gp', cost: 0, mv: 2, gp: 'musician', flags: ['gp'] });
  U('great_prophet', { name: 'Great Prophet', cls: 'gp', cost: 0, mv: 2, gp: 'prophet', flags: ['gp'] });
  U('great_general', { name: 'Great General', cls: 'gp', cost: 0, mv: 2, gp: 'general', flags: ['gp', 'aura'] });
  U('great_admiral', { name: 'Great Admiral', cls: 'gp', cost: 0, mv: 5, domain: 'sea', gp: 'admiral', flags: ['gp', 'aura'] });
  // Recon
  U('scout', { name: 'Scout', cls: 'recon', cost: 25, str: 5, mv: 2, flags: ['ignoreTerrain'], upg: 'explorer' });
  U('explorer', { name: 'Explorer', cls: 'recon', cost: 65, str: 10, mv: 3, tech: 'navigation', flags: ['ignoreTerrain'], upg: 'paratrooper' });
  // Ancient
  U('warrior', { name: 'Warrior', cls: 'melee', cost: 40, str: 8, upg: 'swordsman' });
  U('archer', { name: 'Archer', cls: 'ranged', cost: 40, str: 5, rs: 7, range: 2, tech: 'archery', upg: 'composite_bowman' });
  U('spearman', { name: 'Spearman', cls: 'melee', cost: 56, str: 11, tech: 'bronze_working', vs: { mounted: 100 }, upg: 'pikeman' });
  U('chariot_archer', { name: 'Chariot Archer', cls: 'ranged', cost: 56, str: 6, rs: 10, range: 2, mv: 4, tech: 'the_wheel', res: 'horses', flags: ['roughPenalty', 'mounted'], upg: 'knight' });
  U('trireme', { name: 'Trireme', cls: 'naval_melee', domain: 'sea', cost: 56, str: 10, mv: 4, tech: 'sailing', flags: ['coastOnly'], upg: 'caravel' });
  // Classical
  U('horseman', { name: 'Horseman', cls: 'mounted', cost: 75, str: 12, mv: 4, tech: 'horseback_riding', res: 'horses', vsCity: -33, upg: 'knight' });
  U('composite_bowman', { name: 'Composite Bowman', cls: 'ranged', cost: 75, str: 7, rs: 11, range: 2, tech: 'construction', upg: 'crossbowman' });
  U('swordsman', { name: 'Swordsman', cls: 'melee', cost: 75, str: 14, tech: 'iron_working', res: 'iron', upg: 'longswordsman' });
  U('catapult', { name: 'Catapult', cls: 'siege', cost: 75, str: 7, rs: 8, range: 2, tech: 'mathematics', res: 'iron', vsCity: 200, flags: ['setup'], upg: 'trebuchet' });
  U('galley', { name: 'Galley', cls: 'naval_ranged', domain: 'sea', cost: 75, str: 10, rs: 12, range: 2, mv: 3, tech: 'optics', flags: ['coastOnly'], upg: 'galleass' });
  // Medieval
  U('pikeman', { name: 'Pikeman', cls: 'melee', cost: 90, str: 16, tech: 'civil_service', vs: { mounted: 100 }, upg: 'musketman' });
  U('knight', { name: 'Knight', cls: 'mounted', cost: 120, str: 20, mv: 4, tech: 'chivalry', res: 'horses', vsCity: -33, upg: 'lancer' });
  U('crossbowman', { name: 'Crossbowman', cls: 'ranged', cost: 120, str: 13, rs: 18, range: 2, tech: 'machinery', upg: 'gatling_gun' });
  U('longswordsman', { name: 'Longswordsman', cls: 'melee', cost: 120, str: 21, tech: 'steel', res: 'iron', upg: 'musketman' });
  U('trebuchet', { name: 'Trebuchet', cls: 'siege', cost: 120, str: 12, rs: 14, range: 2, tech: 'physics', res: 'iron', vsCity: 200, flags: ['setup'], upg: 'cannon' });
  U('galleass', { name: 'Galleass', cls: 'naval_ranged', domain: 'sea', cost: 100, str: 16, rs: 17, range: 2, mv: 3, tech: 'compass', upg: 'frigate' });
  // Renaissance
  U('musketman', { name: 'Musketman', cls: 'gun', cost: 150, str: 24, tech: 'gunpowder', upg: 'rifleman' });
  U('cannon', { name: 'Cannon', cls: 'siege', cost: 185, str: 14, rs: 20, range: 2, tech: 'chemistry', vsCity: 200, flags: ['setup'], upg: 'artillery' });
  U('lancer', { name: 'Lancer', cls: 'mounted', cost: 185, str: 25, mv: 4, tech: 'metallurgy', res: 'horses', vsCity: -33, upg: 'cavalry' });
  U('caravel', { name: 'Caravel', cls: 'naval_melee', domain: 'sea', cost: 120, str: 20, mv: 4, sight: 3, tech: 'navigation', upg: 'privateer' });
  U('privateer', { name: 'Privateer', cls: 'naval_melee', domain: 'sea', cost: 150, str: 25, mv: 5, tech: 'navigation', flags: ['prize'], upg: 'destroyer' });
  U('frigate', { name: 'Frigate', cls: 'naval_ranged', domain: 'sea', cost: 185, str: 25, rs: 28, range: 2, mv: 5, tech: 'navigation', res: 'iron', upg: 'battleship' });
  U('ship_of_the_line', { name: 'Ship of the Line', cls: 'naval_ranged', domain: 'sea', cost: 185, str: 30, rs: 35, range: 2, mv: 5, tech: 'navigation', res: 'iron', unique: true, upg: 'battleship' });
  // Industrial
  U('rifleman', { name: 'Rifleman', cls: 'gun', cost: 225, str: 34, tech: 'rifling', upg: 'great_war_infantry' });
  U('cavalry', { name: 'Cavalry', cls: 'mounted', cost: 225, str: 34, mv: 4, tech: 'military_science', res: 'horses', vsCity: -33, upg: 'landship' });
  U('gatling_gun', { name: 'Gatling Gun', cls: 'ranged', cost: 225, str: 30, rs: 30, range: 1, tech: 'industrialization', upg: 'machine_gun' });
  U('artillery', { name: 'Artillery', cls: 'siege', cost: 250, str: 21, rs: 28, range: 3, tech: 'dynamite', vsCity: 200, flags: ['setup', 'indirect'], upg: 'rocket_artillery' });
  U('ironclad', { name: 'Ironclad', cls: 'naval_melee', domain: 'sea', cost: 250, str: 45, mv: 4, tech: 'steam_power', res: 'coal', upg: 'destroyer' });
  U('great_war_infantry', { name: 'Great War Infantry', cls: 'gun', cost: 320, str: 50, tech: 'replaceable_parts', upg: 'infantry' });
  // Modern
  U('machine_gun', { name: 'Machine Gun', cls: 'ranged', cost: 350, str: 50, rs: 60, range: 1, tech: 'ballistics', upg: 'bazooka' });
  U('landship', { name: 'Landship', cls: 'armor', cost: 350, str: 60, mv: 4, tech: 'combustion', res: 'oil', flags: ['noDefTerrain'], upg: 'tank' });
  U('destroyer', { name: 'Destroyer', cls: 'naval_melee', domain: 'sea', cost: 375, str: 55, mv: 8, sight: 3, tech: 'combustion', res: 'oil', upg: 'missile_cruiser' });
  U('battleship', { name: 'Battleship', cls: 'naval_ranged', domain: 'sea', cost: 375, str: 55, rs: 65, range: 3, mv: 5, tech: 'electronics', res: 'oil', upg: 'missile_cruiser' });
  U('submarine', { name: 'Submarine', cls: 'naval_ranged', domain: 'sea', cost: 325, str: 35, rs: 60, range: 2, mv: 5, tech: 'refrigeration', flags: ['hidden'], upg: 'nuclear_submarine' });
  U('fighter', { name: 'Fighter', cls: 'air', domain: 'air', cost: 325, str: 45, rs: 45, range: 8, mv: 1, tech: 'flight', res: 'oil', flags: ['intercept'], upg: 'jet_fighter' });
  U('triplane', { name: 'Triplane', cls: 'air', domain: 'air', cost: 325, str: 35, rs: 35, range: 5, mv: 1, tech: 'flight', res: 'oil', flags: ['intercept'], upg: 'fighter' });
  U('bomber', { name: 'Bomber', cls: 'air', domain: 'air', cost: 375, str: 65, rs: 65, range: 10, mv: 1, tech: 'radar', res: 'oil', vsCity: 50, upg: 'stealth_bomber' });
  // Atomic
  U('infantry', { name: 'Infantry', cls: 'gun', cost: 375, str: 70, tech: 'plastics', upg: 'mechanized_infantry' });
  U('anti_tank_gun', { name: 'Anti-Tank Gun', cls: 'gun', cost: 300, str: 50, tech: 'combined_arms', vs: { armor: 100 }, upg: 'mechanized_infantry' });
  U('anti_aircraft_gun', { name: 'Anti-Aircraft Gun', cls: 'gun', cost: 300, str: 50, tech: 'radar', vs: { air: 100 }, flags: ['intercept'], upg: 'mobile_sam' });
  U('paratrooper', { name: 'Paratrooper', cls: 'gun', cost: 375, str: 65, tech: 'radar', flags: ['paradrop'], upg: 'xcom' });
  U('tank', { name: 'Tank', cls: 'armor', cost: 375, str: 70, mv: 5, tech: 'combined_arms', res: 'oil', flags: ['noDefTerrain'], upg: 'modern_armor' });
  U('bazooka', { name: 'Bazooka', cls: 'ranged', cost: 375, str: 85, rs: 85, range: 1, tech: 'nuclear_fission' });
  U('carrier', { name: 'Carrier', cls: 'naval_melee', domain: 'sea', cost: 375, str: 40, mv: 5, tech: 'electronics', res: 'oil', flags: ['noAttack'] });
  U('atomic_bomb', { name: 'Atomic Bomb', cls: 'nuke', domain: 'air', cost: 600, rs: 1, range: 10, mv: 1, tech: 'nuclear_fission', res: 'uranium', nuke: 2 });
  U('helicopter_gunship', { name: 'Helicopter Gunship', cls: 'armor', cost: 425, str: 60, mv: 6, tech: 'rocketry', res: 'aluminum', vs: { armor: 100 }, flags: ['ignoreTerrain', 'hover'] });
  U('rocket_artillery', { name: 'Rocket Artillery', cls: 'siege', cost: 425, str: 45, rs: 60, range: 3, mv: 3, tech: 'rocketry', res: 'aluminum', vsCity: 200, flags: ['indirect'] });
  U('mobile_sam', { name: 'Mobile SAM', cls: 'gun', cost: 425, str: 65, mv: 3, tech: 'rocketry', vs: { air: 100 }, flags: ['intercept'] });
  // Information
  U('mechanized_infantry', { name: 'Mechanized Infantry', cls: 'gun', cost: 375, str: 90, mv: 3, tech: 'mobile_tactics', upg: 'xcom' });
  U('modern_armor', { name: 'Modern Armor', cls: 'armor', cost: 425, str: 100, mv: 5, tech: 'robotics', res: 'aluminum', flags: ['noDefTerrain'], upg: 'giant_death_robot' });
  U('jet_fighter', { name: 'Jet Fighter', cls: 'air', domain: 'air', cost: 425, str: 75, rs: 75, range: 10, mv: 1, tech: 'lasers', res: 'aluminum', flags: ['intercept'] });
  U('stealth_bomber', { name: 'Stealth Bomber', cls: 'air', domain: 'air', cost: 425, str: 85, rs: 85, range: 20, mv: 1, tech: 'stealth', res: 'aluminum', vsCity: 50 });
  U('missile_cruiser', { name: 'Missile Cruiser', cls: 'naval_ranged', domain: 'sea', cost: 425, str: 80, rs: 100, range: 3, mv: 7, tech: 'robotics' });
  U('nuclear_submarine', { name: 'Nuclear Submarine', cls: 'naval_ranged', domain: 'sea', cost: 425, str: 70, rs: 85, range: 3, mv: 6, tech: 'advanced_ballistics', flags: ['hidden'] });
  U('nuclear_missile', { name: 'Nuclear Missile', cls: 'nuke', domain: 'air', cost: 1000, rs: 1, range: 12, mv: 1, tech: 'advanced_ballistics', res: 'uranium', nuke: 3 });
  U('xcom', { name: 'XCOM Squad', cls: 'gun', cost: 400, str: 110, mv: 2, tech: 'nanotechnology', flags: ['paradrop'] });
  U('giant_death_robot', { name: 'Giant Death Robot', cls: 'armor', cost: 425, str: 150, mv: 5, tech: 'nuclear_fusion', res: 'uranium' });
})();

// ---------- Promotions ----------
// Effects understood by combat engine. 'req' = prerequisite promotion, 'cls' = unit classes allowed.
G.D.PROMOTIONS = {
  shock1: { name: 'Shock I', desc: '+15% combat in open terrain', open: 15, cls: ['melee', 'gun', 'mounted', 'armor', 'recon'] },
  shock2: { name: 'Shock II', desc: '+15% combat in open terrain', open: 15, req: 'shock1' },
  shock3: { name: 'Shock III', desc: '+15% open terrain, +1 move', open: 15, moves: 1, req: 'shock2' },
  drill1: { name: 'Drill I', desc: '+15% combat in rough terrain', rough: 15, cls: ['melee', 'gun', 'mounted', 'armor', 'recon'] },
  drill2: { name: 'Drill II', desc: '+15% combat in rough terrain', rough: 15, req: 'drill1' },
  drill3: { name: 'Drill III', desc: '+15% rough terrain, +1 move', rough: 15, moves: 1, req: 'drill2' },
  accuracy1: { name: 'Accuracy I', desc: '+15% ranged attack in open terrain', ropen: 15, cls: ['ranged', 'siege'] },
  accuracy2: { name: 'Accuracy II', desc: '+15% ranged attack in open terrain', ropen: 15, req: 'accuracy1' },
  barrage1: { name: 'Barrage I', desc: '+15% ranged attack in rough terrain', rrough: 15, cls: ['ranged', 'siege'] },
  barrage2: { name: 'Barrage II', desc: '+15% ranged attack in rough terrain', rrough: 15, req: 'barrage1' },
  range: { name: 'Range', desc: '+1 attack range', rangeUp: 1, req: ['accuracy2', 'barrage2'], cls: ['ranged', 'siege', 'naval_ranged'] },
  logistics: { name: 'Logistics', desc: 'May attack twice per turn', twice: true, req: ['accuracy2', 'barrage2', 'bombardment2'], cls: ['ranged', 'siege', 'naval_ranged'] },
  cover1: { name: 'Cover I', desc: '+33% defense vs ranged attacks', vsRanged: 33, cls: ['melee', 'gun', 'ranged', 'siege', 'recon'] },
  cover2: { name: 'Cover II', desc: '+33% defense vs ranged attacks', vsRanged: 33, req: 'cover1' },
  medic: { name: 'Medic', desc: 'Adjacent units heal +10 HP per turn', medic: 10 },
  march: { name: 'March', desc: 'Heal every turn, even after acting', march: true, req: ['medic', 'shock2', 'drill2'] },
  blitz: { name: 'Blitz', desc: 'Can attack multiple times per turn', blitz: true, req: ['shock3', 'drill3'] },
  charge: { name: 'Charge', desc: '+33% attack vs wounded units', vsWounded: 33, cls: ['mounted', 'armor'] },
  siege: { name: 'Siege', desc: '+50% attack vs cities', vsCityP: 50, cls: ['melee', 'gun', 'mounted', 'armor'] },
  mobility: { name: 'Mobility', desc: '+1 movement', moves: 1, req: ['shock1', 'drill1', 'charge', 'targeting1'] },
  amphibious: { name: 'Amphibious', desc: 'No penalty attacking from sea or across rivers', amphib: true, req: ['shock1', 'drill1'] },
  bombardment1: { name: 'Bombardment I', desc: '+15% vs land units', vsLand: 15, cls: ['naval_ranged'] },
  bombardment2: { name: 'Bombardment II', desc: '+15% vs land units', vsLand: 15, req: 'bombardment1' },
  targeting1: { name: 'Targeting I', desc: '+15% vs naval units', vsNaval: 15, cls: ['naval_ranged', 'naval_melee', 'air'] },
  targeting2: { name: 'Targeting II', desc: '+15% vs naval units', vsNaval: 15, req: 'targeting1' },
  boarding: { name: 'Boarding Party', desc: '+15% vs naval units (melee)', vsNaval: 15, cls: ['naval_melee'] },
  supply: { name: 'Supply', desc: 'Heals outside friendly territory', supply: true, req: ['targeting1', 'boarding', 'bombardment1'] },
  interception: { name: 'Interception', desc: '+33% when intercepting', intercept: 33, cls: ['air'] },
  air_siege: { name: 'Siege (air)', desc: '+33% vs cities', vsCityP: 33, cls: ['air'] },
  sentry: { name: 'Sentry', desc: '+1 sight', sight: 1 },
  heal: { name: 'Instant Heal', desc: 'Heal 50 HP immediately', instantHeal: true }
};
G.D.XP_LEVELS = [10, 30, 60, 100, 150, 210, 280, 360, 450, 550];

// ---------- Buildings ----------
// y: flat yields; perPop: yields per citizen; pct: % yield mods; happy; def (city defense), hp; slots: specialist slots
// req: required building in city; coastal / river / mountain requirements; res: required resource
G.D.BUILDINGS = {};
(function () {
  var B = function (id, o) { o.id = id; o.maint = o.maint || 0; G.D.BUILDINGS[id] = o; };
  B('palace', { name: 'Palace', cost: 0, y: { p: 3, s: 3, g: 3, c: 1 }, def: 2.5, hp: 25, hidden: true, desc: 'Capital of the empire.' });
  B('monument', { name: 'Monument', cost: 40, maint: 1, y: { c: 2 } });
  B('granary', { name: 'Granary', cost: 60, maint: 1, tech: 'pottery', y: { f: 2 }, resY: { wheat: { f: 1 }, bananas: { f: 1 }, deer: { f: 1 } } });
  B('shrine', { name: 'Shrine', cost: 40, maint: 1, tech: 'pottery', y: { fa: 1 } });
  B('barracks', { name: 'Barracks', cost: 75, maint: 1, tech: 'bronze_working', xp: 15 });
  B('library', { name: 'Library', cost: 75, maint: 1, tech: 'writing', perPop: { s: 0.5 }, slots: { scientist: 1 } });
  B('walls', { name: 'Walls', cost: 75, maint: 1, tech: 'masonry', def: 5, hp: 100 });
  B('stone_works', { name: 'Stone Works', cost: 75, maint: 1, tech: 'calendar', y: { p: 1 }, happy: 1, needRes: ['stone', 'marble'] });
  B('lighthouse', { name: 'Lighthouse', cost: 75, maint: 1, tech: 'optics', coastal: true, seaY: { f: 1 } });
  B('water_mill', { name: 'Water Mill', cost: 75, maint: 2, tech: 'the_wheel', river: true, y: { f: 2, p: 1 } });
  B('circus', { name: 'Circus', cost: 75, maint: 0, tech: 'trapping', happy: 3, needRes: ['horses', 'ivory'] });
  B('caravansary', { name: 'Caravansary', cost: 120, maint: 1, tech: 'horseback_riding', y: { g: 2 }, tradeRange: 50 });
  B('stable', { name: 'Stable', cost: 100, maint: 1, tech: 'horseback_riding', unitPct: { mounted: 15 }, resY: { horses: { p: 1 }, sheep: { p: 1 }, cattle: { p: 1 } } });
  B('temple', { name: 'Temple', cost: 100, maint: 2, tech: 'philosophy', y: { fa: 2 }, req: 'shrine' });
  B('amphitheater', { name: 'Amphitheater', cost: 100, maint: 1, tech: 'drama', y: { c: 3 }, slots: { writer: 1 }, works: { writing: 1 } });
  B('courthouse', { name: 'Courthouse', cost: 100, maint: 1, tech: 'mathematics', courthouse: true });
  B('colosseum', { name: 'Colosseum', cost: 100, maint: 1, tech: 'construction', happy: 4 });
  B('market', { name: 'Market', cost: 100, maint: 0, tech: 'currency', y: { g: 2 }, pct: { g: 25 }, slots: { merchant: 1 } });
  B('mint', { name: 'Mint', cost: 120, maint: 0, tech: 'currency', resY: { gold_ore: { g: 2 }, silver: { g: 2 }, copper: { g: 2 } }, needRes: ['gold_ore', 'silver', 'copper'] });
  B('aqueduct', { name: 'Aqueduct', cost: 100, maint: 1, tech: 'engineering', foodKeep: 40 });
  B('forge', { name: 'Forge', cost: 120, maint: 1, tech: 'metal_casting', unitPct: { land: 15 }, resY: { iron: { p: 1 } } });
  B('workshop', { name: 'Workshop', cost: 100, maint: 2, tech: 'metal_casting', y: { p: 2 }, pct: { p: 10 }, slots: { engineer: 1 } });
  B('harbor', { name: 'Harbor', cost: 120, maint: 2, tech: 'compass', coastal: true, seaY: { p: 1 }, connects: true });
  B('university', { name: 'University', cost: 160, maint: 3, tech: 'education', pct: { s: 33 }, req: 'library', slots: { scientist: 2 }, jungleS: 2 });
  B('castle', { name: 'Castle', cost: 160, maint: 0, tech: 'chivalry', def: 7, hp: 25, req: 'walls' });
  B('garden', { name: 'Garden', cost: 120, maint: 1, tech: 'theology', gppPct: 25, fresh: true });
  B('monastery', { name: 'Monastery', cost: 120, maint: 2, tech: 'theology', y: { fa: 2, c: 2 }, needRes: ['wine', 'incense'] });
  B('armory', { name: 'Armory', cost: 160, maint: 1, tech: 'steel', xp: 15, req: 'barracks' });
  B('bank', { name: 'Bank', cost: 200, maint: 0, tech: 'banking', y: { g: 2 }, pct: { g: 25 }, req: 'market', slots: { merchant: 1 } });
  B('observatory', { name: 'Observatory', cost: 200, maint: 0, tech: 'astronomy', pct: { s: 50 }, mountain: true });
  B('opera_house', { name: 'Opera House', cost: 200, maint: 1, tech: 'acoustics', y: { c: 3 }, req: 'amphitheater', slots: { musician: 1 }, works: { music: 1 } });
  B('zoo', { name: 'Zoo', cost: 150, maint: 2, tech: 'printing_press', happy: 4, req: 'colosseum' });
  B('seaport', { name: 'Seaport', cost: 250, maint: 2, tech: 'navigation', coastal: true, seaY: { p: 1, g: 1 }, req: 'harbor', unitPct: { sea: 15 } });
  B('museum', { name: 'Museum', cost: 350, maint: 3, tech: 'archaeology', y: { c: 3 }, req: 'opera_house', slots: { artist: 1 }, works: { art: 2 } });
  B('public_school', { name: 'Public School', cost: 300, maint: 3, tech: 'scientific_theory', y: { s: 3 }, perPop: { s: 0.5 }, req: 'university', slots: { scientist: 1 } });
  B('factory', { name: 'Factory', cost: 300, maint: 3, tech: 'industrialization', y: { p: 4 }, pct: { p: 10 }, req: 'workshop', res: 'coal', slots: { engineer: 2 } });
  B('hospital', { name: 'Hospital', cost: 300, maint: 2, tech: 'biology', y: { f: 5 }, req: 'aqueduct' });
  B('military_academy', { name: 'Military Academy', cost: 300, maint: 1, tech: 'military_science', xp: 15, req: 'barracks' });
  B('arsenal', { name: 'Arsenal', cost: 300, maint: 0, tech: 'railroad', def: 9, hp: 25, req: 'castle' });
  B('stock_exchange', { name: 'Stock Exchange', cost: 350, maint: 0, tech: 'electricity', y: { g: 3 }, pct: { g: 10 }, req: 'bank', slots: { merchant: 2 } });
  B('hydro_plant', { name: 'Hydro Plant', cost: 360, maint: 3, tech: 'electricity', river: true, pct: { p: 15 }, res: 'aluminum', power: true });
  B('police_station', { name: 'Police Station', cost: 300, maint: 1, tech: 'electricity', policeStation: true, req: 'constabulary_dummy' });
  B('hotel', { name: 'Hotel', cost: 300, maint: 3, tech: 'refrigeration', tourismPct: 50 });
  B('stadium', { name: 'Stadium', cost: 300, maint: 2, tech: 'refrigeration', happy: 4, req: 'zoo' });
  B('broadcast_tower', { name: 'Broadcast Tower', cost: 400, maint: 3, tech: 'radio', y: { c: 3 }, pct: { c: 33 }, req: 'museum', works: { music: 1 } });
  B('military_base', { name: 'Military Base', cost: 300, maint: 0, tech: 'telegraph', def: 12, hp: 25, req: 'arsenal' });
  B('airport', { name: 'Airport', cost: 500, maint: 5, tech: 'radar', tourismPct: 50, airlift: true });
  B('medical_lab', { name: 'Medical Lab', cost: 360, maint: 3, tech: 'penicillin', foodKeep: 25, req: 'hospital' });
  B('research_lab', { name: 'Research Lab', cost: 480, maint: 3, tech: 'computers', y: { s: 3 }, pct: { s: 50 }, req: 'public_school', slots: { scientist: 1 } });
  B('nuclear_plant', { name: 'Nuclear Plant', cost: 480, maint: 3, tech: 'nuclear_fission', y: { p: 5 }, pct: { p: 15 }, req: 'factory', res: 'uranium', power: true });
  B('solar_plant', { name: 'Solar Plant', cost: 480, maint: 3, tech: 'ecology', y: { p: 5 }, pct: { p: 15 }, req: 'factory', desert: true, power: true });
  B('supermarket', { name: 'Supermarket', cost: 300, maint: 3, tech: 'refrigeration', pct: { f: 15 }, farmY: { f: 1 } });
  B('recycling_center', { name: 'Recycling Center', cost: 375, maint: 3, tech: 'ecology', y: { p: 2 }, happy: 1 });
  B('spaceship_factory', { name: 'Spaceship Factory', cost: 360, maint: 3, tech: 'robotics', spacePct: 50, req: 'factory' });
  B('bomb_shelter', { name: 'Bomb Shelter', cost: 300, maint: 1, tech: 'telecommunications', nukeShield: true });
  // National wonders (one per empire)
  B('palace_dummy', { name: '', cost: 0, hidden: true });
  B('national_college', { name: 'National College', cost: 125, maint: 0, tech: 'philosophy', national: true, y: { s: 3, c: 1 }, pct: { s: 50 }, req: 'library', needAll: 'library' });
  B('heroic_epic', { name: 'Heroic Epic', cost: 125, maint: 0, tech: 'bronze_working', national: true, y: { c: 1 }, xp: 15, req: 'barracks', combatAll: 15 });
  B('national_epic', { name: 'National Epic', cost: 125, maint: 0, tech: 'drama', national: true, y: { c: 1 }, gppPct: 25, req: 'monument', needAll: 'monument', works: { writing: 1 } });
  B('circus_maximus', { name: 'Circus Maximus', cost: 125, maint: 0, tech: 'construction', national: true, happy: 5, req: 'colosseum', needAll: 'colosseum' });
  B('national_treasury', { name: 'East India Company', cost: 125, maint: 0, tech: 'economics', national: true, y: { g: 4 }, pct: { g: 15 }, req: 'market', needAll: 'market' });
  B('ironworks', { name: 'Ironworks', cost: 125, maint: 0, tech: 'machinery', national: true, y: { p: 10, s: 3 }, req: 'workshop' });
  B('oxford', { name: 'Oxford University', cost: 125, maint: 0, tech: 'education', national: true, y: { s: 3, c: 1 }, freeTech: 1, req: 'university', needAll: 'university' });
  B('hermitage', { name: 'Hermitage', cost: 125, maint: 0, tech: 'architecture', national: true, y: { c: 3 }, pct: { c: 50 }, req: 'opera_house', works: { art: 3 } });
  B('grand_temple', { name: 'Grand Temple', cost: 125, maint: 0, tech: 'theology', national: true, y: { fa: 8 }, req: 'temple', needAll: 'temple' });
  B('police_hq', { name: 'National Intelligence Agency', cost: 125, maint: 0, tech: 'radio', national: true, y: { s: 3 } });
  delete G.D.BUILDINGS.palace_dummy;
  delete G.D.BUILDINGS.police_station;
})();
// Specialist yields (BNW)
G.D.SPECIALISTS = {
  scientist: { name: 'Scientist', y: { s: 3 }, gp: 'scientist' },
  engineer: { name: 'Engineer', y: { p: 2 }, gp: 'engineer' },
  merchant: { name: 'Merchant', y: { g: 3 }, gp: 'merchant' },
  writer: { name: 'Writer', y: { c: 3 }, gp: 'writer' },
  artist: { name: 'Artist', y: { c: 3 }, gp: 'artist' },
  musician: { name: 'Musician', y: { c: 3 }, gp: 'musician' }
};
G.D.GREAT_PEOPLE = {
  scientist: { unit: 'great_scientist', name: 'Great Scientist' },
  engineer: { unit: 'great_engineer', name: 'Great Engineer' },
  merchant: { unit: 'great_merchant', name: 'Great Merchant' },
  writer: { unit: 'great_writer', name: 'Great Writer' },
  artist: { unit: 'great_artist', name: 'Great Artist' },
  musician: { unit: 'great_musician', name: 'Great Musician' },
  general: { unit: 'great_general', name: 'Great General' },
  admiral: { unit: 'great_admiral', name: 'Great Admiral' },
  prophet: { unit: 'great_prophet', name: 'Great Prophet' }
};
// Historical great people names, drawn in order
G.D.GP_NAMES = {
  scientist: ['Euclid', 'Archimedes', 'Zhang Heng', 'Aryabhata', 'Al-Khwarizmi', 'Ibn al-Haytham', 'Avicenna', 'Copernicus', 'Galileo Galilei', 'Johannes Kepler', 'Isaac Newton', 'Gottfried Leibniz', 'Antoine Lavoisier', 'Carl Linnaeus', 'Charles Darwin', 'Dmitri Mendeleev', 'Marie Curie', 'Albert Einstein', 'Niels Bohr', 'Alan Turing', 'Rosalind Franklin', 'Richard Feynman', 'Stephen Hawking'],
  engineer: ['Imhotep', 'Hippodamus', 'Lu Ban', 'Vitruvius', 'Isidore of Miletus', 'Filippo Brunelleschi', 'Leonardo da Vinci', 'Mimar Sinan', 'James Watt', 'Isambard Kingdom Brunel', 'Gustave Eiffel', 'Nikola Tesla', 'Thomas Edison', 'Henry Ford', 'Wernher von Braun', 'Sergei Korolev'],
  merchant: ['Marco Polo', 'Zheng He', 'Jakob Fugger', 'Cosimo de Medici', 'Ibn Battuta', 'Mansa Musa', 'Raffaele Rubattino', 'Adam Smith', 'Mitsui Takatoshi', 'Andrew Carnegie', 'John D. Rockefeller', 'Estée Lauder', 'Sarah Breedlove'],
  writer: ['Homer', 'Valmiki', 'Sappho', 'Ovid', 'Virgil', 'Li Bai', 'Murasaki Shikibu', 'Dante Alighieri', 'Geoffrey Chaucer', 'Miguel de Cervantes', 'William Shakespeare', 'Molière', 'Voltaire', 'Jane Austen', 'Leo Tolstoy', 'Mark Twain', 'Rabindranath Tagore', 'Gabriel García Márquez'],
  artist: ['Phidias', 'Gu Kaizhi', 'Andrei Rublev', 'Donatello', 'Sandro Botticelli', 'Michelangelo', 'Raphael', 'Hokusai', 'Rembrandt', 'Diego Velázquez', 'Claude Monet', 'Vincent van Gogh', 'Frida Kahlo', 'Pablo Picasso', 'Salvador Dalí'],
  musician: ['Hildegard of Bingen', 'Guillaume de Machaut', 'Johann Sebastian Bach', 'Antonio Vivaldi', 'Wolfgang Amadeus Mozart', 'Ludwig van Beethoven', 'Frédéric Chopin', 'Pyotr Tchaikovsky', 'Giuseppe Verdi', 'Clara Schumann', 'Louis Armstrong', 'Ravi Shankar'],
  general: ['Sargon of Akkad', 'Sun Tzu', 'Hannibal Barca', 'Scipio Africanus', 'Julius Caesar', 'Belisarius', 'Khalid ibn al-Walid', 'Saladin', 'Subutai', 'Joan of Arc', 'Tokugawa Ieyasu', 'Duke of Marlborough', 'Frederick the Great', 'George Washington', 'Napoleon Bonaparte', 'Arthur Wellesley', 'Ulysses S. Grant', 'Georgy Zhukov', 'Erwin Rommel', 'Dwight Eisenhower'],
  admiral: ['Themistocles', 'Gaius Duilius', 'Zheng He', 'Andrea Doria', 'Francis Drake', 'Yi Sun-sin', 'Michiel de Ruyter', 'Horatio Nelson', 'Togo Heihachiro', 'Chester Nimitz'],
  prophet: ['Zoroaster', 'Siddhartha Gautama', 'Confucius', 'Laozi', 'Mahavira', 'Moses', 'Paul of Tarsus', 'Adi Shankara', 'Guru Nanak', 'Martin Luther', 'Thomas Aquinas', 'Bahá\'u\'lláh']
};

// ---------- World wonders ----------
// fx: effect keys applied to the owner (see engine.applyMods). local: applied to the city only.
G.D.WONDERS = {};
(function () {
  var W = function (id, o) { o.id = id; o.wonder = true; G.D.WONDERS[id] = o; };
  W('stonehenge', { name: 'Stonehenge', era: 0, cost: 185, tech: 'calendar', local: { y: { fa: 5 } }, desc: '+5 Faith.' });
  W('great_library', { name: 'Great Library', era: 0, cost: 185, tech: 'writing', local: { y: { s: 3, c: 1 } }, once: { freeTech: 1 }, desc: 'Free technology. +3 Science.' });
  W('pyramids', { name: 'Pyramids', era: 0, cost: 185, tech: 'masonry', fx: { workerSpeed: 25 }, once: { freeUnits: ['worker', 'worker'] }, local: { y: { c: 1 } }, desc: '+25% worker speed, 2 free Workers.' });
  W('temple_of_artemis', { name: 'Temple of Artemis', era: 0, cost: 185, tech: 'archery', fx: { foodPct: 10, rangedProdPct: 15 }, desc: '+10% Food in all cities, +15% ranged unit production.' });
  W('colossus', { name: 'Colossus', era: 0, cost: 185, tech: 'bronze_working', coastal: true, local: { seaY: { g: 1 } }, fx: { tradeRoutes: 1 }, desc: '+1 Gold on ocean tiles, +1 trade route.' });
  W('mausoleum', { name: 'Mausoleum of Halicarnassus', era: 0, cost: 185, tech: 'masonry', local: { y: { c: 1 } }, fx: { gpGold: 100 }, desc: '+100 Gold whenever a Great Person is expended.' });
  W('statue_zeus', { name: 'Statue of Zeus', era: 0, cost: 185, tech: 'bronze_working', fx: { vsCityPct: 15 }, once: { freeUnits: ['spearman'] }, desc: '+15% combat vs cities. Free Spearman.' });
  W('great_lighthouse', { name: 'Great Lighthouse', era: 1, cost: 185, tech: 'optics', coastal: true, fx: { navalMoves: 1, navalSight: 1 }, desc: '+1 movement and sight for naval units.' });
  W('hanging_gardens', { name: 'Hanging Gardens', era: 1, cost: 250, tech: 'mathematics', local: { y: { f: 6, c: 1 } }, desc: '+6 Food.' });
  W('oracle', { name: 'Oracle', era: 1, cost: 250, tech: 'philosophy', local: { y: { c: 3 } }, once: { freePolicy: 1 }, desc: 'Free Social Policy.' });
  W('great_wall', { name: 'Great Wall', era: 1, cost: 250, tech: 'construction', fx: { enemyBorderSlow: true }, local: { def: 5 }, desc: 'Enemy land units in your territory spend all movement.' });
  W('terracotta_army', { name: 'Terracotta Army', era: 1, cost: 250, tech: 'construction', once: { copyUnits: true }, desc: 'Copies of each land unit type you own.' });
  W('petra', { name: 'Petra', era: 1, cost: 250, tech: 'currency', local: { desertY: { f: 1, p: 1 } }, fx: { tradeRoutes: 1 }, desc: '+1 Food and Production on desert tiles.' });
  W('parthenon', { name: 'Parthenon', era: 1, cost: 250, tech: 'drama', local: { y: { c: 4 } }, desc: '+4 Culture, Great Work.' });
  W('colosseum_flavian', { name: 'Flavian Amphitheatre', era: 1, cost: 250, tech: 'construction', fx: { happyFlat: 4 }, desc: '+4 Happiness.' });
  W('chichen_itza', { name: 'Chichen Itza', era: 2, cost: 300, tech: 'civil_service', fx: { goldenAgeLenPct: 50 }, happy: 4, desc: 'Golden Ages last 50% longer. +4 Happiness.' });
  W('machu_picchu', { name: 'Machu Picchu', era: 2, cost: 300, tech: 'guilds', mountainNear: true, fx: { connectGoldPct: 25 }, local: { y: { fa: 5 } }, desc: '+25% Gold from city connections, +5 Faith.' });
  W('hagia_sophia', { name: 'Hagia Sophia', era: 2, cost: 300, tech: 'theology', once: { freeGP: 'prophet' }, fx: { faithPct: 10 }, desc: 'Free Great Prophet.' });
  W('great_mosque', { name: 'Great Mosque of Djenné', era: 2, cost: 300, tech: 'theology', local: { y: { fa: 3 } }, fx: { missionarySpreads: 1 }, desc: 'Missionaries spread religion one extra time.' });
  W('borobudur', { name: 'Borobudur', era: 2, cost: 300, tech: 'theology', local: { y: { fa: 5 } }, once: { freeUnits: ['missionary', 'missionary', 'missionary'] }, desc: '3 free Missionaries.' });
  W('angkor_wat', { name: 'Angkor Wat', era: 2, cost: 300, tech: 'education', fx: { borderCostPct: -25 }, desc: 'Border growth costs 25% less culture.' });
  W('alhambra', { name: 'Alhambra', era: 2, cost: 300, tech: 'chivalry', fx: { cultureDomestic: 20 }, local: { y: { c: 3 } }, desc: '+20% Culture in the city, free Drill I for units from this city.' });
  W('notre_dame', { name: 'Notre Dame', era: 2, cost: 300, tech: 'physics', happy: 10, desc: '+10 Happiness.' });
  W('great_zimbabwe', { name: 'Great Zimbabwe', era: 2, cost: 300, tech: 'currency', local: { y: { g: 4 } }, fx: { tradeRoutes: 1 }, desc: '+4 Gold, +1 trade route.' });
  W('forbidden_palace', { name: 'Forbidden Palace', era: 3, cost: 375, tech: 'banking', fx: { unhappyPerPopPct: -10 }, desc: '-10% unhappiness from population. Extra delegates.' });
  W('leaning_tower', { name: 'Leaning Tower of Pisa', era: 3, cost: 375, tech: 'printing_press', fx: { gppPct: 25 }, desc: '+25% Great Person generation.' });
  W('himeji_castle', { name: 'Himeji Castle', era: 3, cost: 375, tech: 'gunpowder', fx: { homeCombatPct: 15 }, local: { def: 5 }, desc: '+15% combat in friendly territory.' });
  W('sistine_chapel', { name: 'Sistine Chapel', era: 3, cost: 375, tech: 'acoustics', fx: { culturePct: 25 }, desc: '+25% Culture in all cities.' });
  W('globe_theatre', { name: 'Globe Theatre', era: 3, cost: 375, tech: 'printing_press', local: { y: { c: 3 } }, once: { freeGP: 'writer' }, desc: 'Free Great Writer.' });
  W('porcelain_tower', { name: 'Porcelain Tower', era: 3, cost: 375, tech: 'architecture', once: { freeGP: 'scientist' }, fx: { sciPct: 5 }, desc: 'Free Great Scientist.' });
  W('taj_mahal', { name: 'Taj Mahal', era: 3, cost: 375, tech: 'architecture', once: { goldenAge: true }, happy: 4, desc: 'Starts a Golden Age.' });
  W('uffizi', { name: 'Uffizi', era: 3, cost: 375, tech: 'architecture', local: { y: { c: 4 } }, once: { freeGP: 'artist' }, desc: 'Free Great Artist.' });
  W('red_fort', { name: 'Red Fort', era: 3, cost: 375, tech: 'metallurgy', fx: { cityDefPct: 25 }, desc: '+25% defense in all cities.' });
  W('kremlin', { name: 'Kremlin', era: 4, cost: 600, tech: 'railroad', fx: { cityDefPct: 15 }, local: { y: { c: 3 } }, desc: '+15% city defense.' });
  W('big_ben', { name: 'Big Ben', era: 4, cost: 600, tech: 'industrialization', fx: { purchasePct: -15 }, desc: 'Gold purchases cost 15% less.' });
  W('louvre', { name: 'Louvre', era: 4, cost: 600, tech: 'archaeology', once: { freeGP: 'artist', freeGP2: 'artist' }, local: { y: { c: 4 } }, desc: '2 free Great Artists.' });
  W('brandenburg_gate', { name: 'Brandenburg Gate', era: 4, cost: 600, tech: 'military_science', fx: { xpFlat: 15 }, once: { freeGP: 'general' }, desc: '+15 XP for all new units, free Great General.' });
  W('neuschwanstein', { name: 'Neuschwanstein', era: 4, cost: 600, tech: 'railroad', mountainNear: true, fx: { castleGold: 3 }, happy: 2, desc: '+3 Gold, +1 Happiness in cities with Castles.' });
  W('eiffel_tower', { name: 'Eiffel Tower', era: 4, cost: 600, tech: 'industrialization', fx: { happyFlat: 5, tourismFlat: 12 }, desc: '+5 Happiness, +12 Tourism.' });
  W('statue_liberty', { name: 'Statue of Liberty', era: 5, cost: 800, tech: 'replaceable_parts', fx: { specialistProd: 1 }, desc: '+1 Production from specialists.' });
  W('cristo_redentor', { name: 'Cristo Redentor', era: 5, cost: 800, tech: 'plastics', fx: { policyCostPct: -10 }, desc: 'Social policies cost 10% less.' });
  W('broadway', { name: 'Broadway', era: 5, cost: 800, tech: 'radio', once: { freeGP: 'musician' }, local: { y: { c: 3 } }, desc: 'Free Great Musician.' });
  W('prora', { name: 'Prora', era: 5, cost: 800, tech: 'flight', happy: 2, fx: { happyPerCity: 0.5 }, desc: '+1 Happiness per 2 cities.' });
  W('panama_canal', { name: 'Panama Canal', era: 5, cost: 800, tech: 'steam_power', coastal: true, fx: { navalMoves: 1, tradeRoutes: 1 }, desc: '+1 naval movement, +1 trade route.' });
  W('pentagon', { name: 'Pentagon', era: 6, cost: 1000, tech: 'combined_arms', fx: { upgradePct: -33 }, desc: 'Unit upgrades cost 33% less.' });
  W('sydney_opera', { name: 'Sydney Opera House', era: 6, cost: 1000, tech: 'ecology', coastal: true, once: { freePolicy: 1 }, local: { y: { c: 4 } }, desc: 'Free Social Policy.' });
  W('manhattan_project', { name: 'Manhattan Project', era: 6, cost: 1500, tech: 'nuclear_fission', project: true, global: true, desc: 'Enables nuclear weapons for everyone.' });
  W('apollo_program', { name: 'Apollo Program', era: 6, cost: 1500, tech: 'rocketry', project: true, desc: 'Enables spaceship parts.' });
  W('cn_tower', { name: 'CN Tower', era: 7, cost: 1250, tech: 'telecommunications', fx: { popPerCity: 1, happyFlat: 5 }, desc: '+1 Population in every city, +5 Happiness.' });
  W('hubble', { name: 'Hubble Space Telescope', era: 7, cost: 1250, tech: 'satellites', once: { freeGP: 'scientist', freeGP2: 'scientist' }, local: { spacePct: 25 }, desc: '2 free Great Scientists.' });
  W('great_firewall', { name: 'Great Firewall', era: 7, cost: 1250, tech: 'computers', local: { def: 10 }, fx: { sciPct: 5 }, desc: 'Protects your cities from espionage.' });
  W('united_nations', { name: 'United Nations', era: 7, cost: 1250, tech: 'globalization', fx: { delegates: 2 }, desc: 'Founds the UN. Diplomatic victory votes begin.' });
  W('internet_hub', { name: 'Global Internet Hub', era: 7, cost: 1250, tech: 'the_internet', fx: { tourismPct: 50 }, desc: '+50% Tourism.' });
  W('utopia_project', { name: 'Utopia Project', era: 7, cost: 1500, tech: 'globalization', project: true, needTrees: 5, desc: 'Requires 5 completed policy trees. Wins a Cultural Victory.' });
})();
// Spaceship (Science victory). Built in capital after Apollo Program.
G.D.SPACESHIP = {
  ss_booster: { name: 'SS Booster', cost: 1500, tech: 'advanced_ballistics', need: 3 },
  ss_cockpit: { name: 'SS Cockpit', cost: 1500, tech: 'satellites', need: 1 },
  ss_stasis: { name: 'SS Stasis Chamber', cost: 1500, tech: 'nanotechnology', need: 1 },
  ss_engine: { name: 'SS Engine', cost: 1500, tech: 'particle_physics', need: 1 }
};

// ---------- Social Policies (BNW trees) ----------
// fx keys are aggregated into player modifiers. once: one-time grants on adoption.
G.D.POLICY_TREES = {
  tradition: { name: 'Tradition', era: 0, opener: { desc: '+3 Culture in capital, border growth -25% in capital', fx: { capCulture: 3, capBorderPct: -25 } },
    finisher: { desc: 'Free Aqueduct in first 4 cities, +15% growth', fx: { foodPct: 15 }, once: { freeBuilding: ['aqueduct', 4] } },
    policies: {
      aristocracy: { name: 'Aristocracy', desc: '+15% production on wonders, +1 Happiness per 10 citizens', fx: { wonderPct: 15, happyPer10Pop: 1 } },
      oligarchy: { name: 'Oligarchy', desc: 'Garrisoned units cost no upkeep, cities +50% ranged strike', fx: { cityRangedPct: 50, garrisonFree: true } },
      legalism: { name: 'Legalism', desc: 'Free culture building in first 4 cities', once: { freeBuilding: ['monument', 4] } },
      landed_elite: { name: 'Landed Elite', desc: '+10% growth and +2 Food in capital', fx: { capFood: 2, foodPct: 10 }, req: ['legalism'] },
      monarchy: { name: 'Monarchy', desc: '+1 Gold and -1 Unhappiness per 2 citizens in capital', fx: { capGoldPer2: 1, capUnhappyHalf: true }, req: ['oligarchy'] } } },
  liberty: { name: 'Liberty', era: 0, opener: { desc: '+1 Culture in every city', fx: { cityCulture: 1 } },
    finisher: { desc: 'Free Great Person of your choice', once: { freeGP: 'choice' } },
    policies: {
      collective_rule: { name: 'Collective Rule', desc: 'Settlers trained 50% faster in capital; free Settler', fx: { settlerPct: 50 }, once: { freeUnits: ['settler'] } },
      citizenship: { name: 'Citizenship', desc: 'Workers built 25% faster; free Worker', fx: { workerSpeed: 25 }, once: { freeUnits: ['worker'] } },
      republic: { name: 'Republic', desc: '+1 Production in every city; +5% building production', fx: { cityProd: 1, buildingPct: 5 }, req: ['collective_rule'] },
      representation: { name: 'Representation', desc: 'Policy cost per city reduced by 33%; starts a Golden Age', fx: { policyCityPct: -33 }, once: { goldenAge: true }, req: ['citizenship'] },
      meritocracy: { name: 'Meritocracy', desc: '+1 Happiness per connected city', fx: { happyPerConnected: 1 }, req: ['citizenship'] } } },
  honor: { name: 'Honor', era: 0, opener: { desc: '+33% vs Barbarians; culture from barbarian kills', fx: { vsBarbPct: 33, cultureFromKills: true } },
    finisher: { desc: 'Gold for each enemy unit killed', fx: { goldFromKills: true } },
    policies: {
      warrior_code: { name: 'Warrior Code', desc: '+15% production of melee units; free Great General', fx: { meleeProdPct: 15 }, once: { freeGP: 'general' } },
      discipline: { name: 'Discipline', desc: '+15% combat when adjacent to a friendly unit', fx: { adjacentPct: 15 } },
      military_tradition: { name: 'Military Tradition', desc: 'Units gain 50% more XP', fx: { xpPct: 50 }, req: ['warrior_code'] },
      military_caste: { name: 'Military Caste', desc: 'Garrisoned cities +1 Happiness, +2 Culture', fx: { garrisonHappy: 1, garrisonCulture: 2 }, req: ['discipline'] },
      professional_army: { name: 'Professional Army', desc: 'Upgrades cost 33% less; +1 Happiness from defense buildings', fx: { upgradePct: -33 }, req: ['military_caste'] } } },
  piety: { name: 'Piety', era: 1, opener: { desc: 'Shrines and Temples built 100% faster; +1 Happiness from them', fx: { shrineFast: true } },
    finisher: { desc: 'Free Great Prophet; faith-buy of Great People', once: { freeGP: 'prophet' } },
    policies: {
      organized_religion: { name: 'Organized Religion', desc: '+1 Faith in every city', fx: { cityFaith: 1 } },
      mandate_of_heaven: { name: 'Mandate of Heaven', desc: '-20% faith purchase costs', fx: { faithCostPct: -20 } },
      theocracy: { name: 'Theocracy', desc: 'Temples +25% Gold in city', fx: { templeGold: 2 }, req: ['organized_religion'] },
      reformation: { name: 'Reformation', desc: 'Start a Golden Age; +10% culture', fx: { culturePct: 10 }, once: { goldenAge: true }, req: ['organized_religion'] },
      religious_tolerance: { name: 'Religious Tolerance', desc: '+15% Faith', fx: { faithPct: 15 }, req: ['mandate_of_heaven'] } } },
  patronage: { name: 'Patronage', era: 1, opener: { desc: 'City-State influence decays 25% slower', fx: { csDecayPct: -25 } },
    finisher: { desc: 'Allied City-States occasionally gift Great People', fx: { csGP: true } },
    policies: {
      philanthropy: { name: 'Philanthropy', desc: 'Gold gifts to City-States +25% influence', fx: { csGiftPct: 25 } },
      consulates: { name: 'Consulates', desc: 'Resting influence +20', fx: { csResting: 20 } },
      scholasticism: { name: 'Scholasticism', desc: 'Allied City-States give 25% of their science', fx: { csScience: 25 }, req: ['consulates'] },
      cultural_diplomacy: { name: 'Cultural Diplomacy', desc: 'City-State resources doubled; +happiness', fx: { csLuxHappy: 1 }, req: ['philanthropy'] },
      merchant_confederacy: { name: 'Merchant Confederacy', desc: '+3 Gold per allied City-State', fx: { csGold: 3 }, req: ['philanthropy'] } } },
  aesthetics: { name: 'Aesthetics', era: 1, opener: { desc: '+25% Great Writer, Artist, Musician generation', fx: { artGPPct: 25 } },
    finisher: { desc: 'Doubled tourism from Great Works in capital', fx: { tourismPct: 25 } },
    policies: {
      cultural_centers: { name: 'Cultural Centers', desc: 'Culture buildings +100% production', fx: { cultureBuildFast: true } },
      fine_arts: { name: 'Fine Arts', desc: '50% of excess Happiness added to Tourism', fx: { happyToTourism: 50 } },
      flourishing_arts: { name: 'Flourishing of the Arts', desc: 'Golden Ages +33% length; +1 Culture per Great Work', fx: { goldenAgeLenPct: 33 }, req: ['cultural_centers'] },
      artistic_genius: { name: 'Artistic Genius', desc: 'Free Great Artist', once: { freeGP: 'artist' }, req: ['cultural_centers'] },
      cultural_exchange: { name: 'Cultural Exchange', desc: '+15% Tourism', fx: { tourismPct: 15 }, req: ['fine_arts'] } } },
  commerce: { name: 'Commerce', era: 2, opener: { desc: '+25% Gold in capital', fx: { capGoldPct: 25 } },
    finisher: { desc: '+1 Gold from Great Person improvements; Big Ben', fx: { gpImprovementGold: 1 } },
    policies: {
      wagon_trains: { name: 'Wagon Trains', desc: '-33% road maintenance; trade routes +2 gold', fx: { roadMaintPct: -33, tradeGold: 2 } },
      mercantilism: { name: 'Mercantilism', desc: 'Purchases cost 25% less; +1 Science from markets', fx: { purchasePct: -25 } },
      entrepreneurship: { name: 'Entrepreneurship', desc: '+25% Great Merchant rate', fx: { merchantGPPct: 25 }, req: ['wagon_trains'] },
      trade_unions: { name: 'Trade Unions', desc: '+1 trade route; -1 maintenance', fx: { tradeRoutes: 1 }, req: ['wagon_trains'] },
      protectionism: { name: 'Protectionism', desc: '+2 Happiness per luxury resource', fx: { luxuryHappy: 2 }, req: ['mercantilism', 'trade_unions'] } } },
  exploration: { name: 'Exploration', era: 3, opener: { desc: '+1 movement and sight for naval units', fx: { navalMoves: 1, navalSight: 1 } },
    finisher: { desc: 'Reveal hidden antiquity sites; +gold from naval kills', fx: { goldFromKills: true } },
    policies: {
      maritime_infrastructure: { name: 'Maritime Infrastructure', desc: '+1 Production on sea tiles', fx: { seaProd: 1 } },
      naval_tradition: { name: 'Naval Tradition', desc: '+1 Happiness from Harbors and Seaports', fx: { harborHappy: 1 } },
      merchant_navy: { name: 'Merchant Navy', desc: '+3 Gold in coastal cities', fx: { coastalGold: 3 }, req: ['maritime_infrastructure'] },
      navigation_school: { name: 'Navigation School', desc: 'Free Great Admiral; +25% Admiral rate', once: { freeGP: 'admiral' }, req: ['naval_tradition'] },
      treasure_fleets: { name: 'Treasure Fleets', desc: '+2 Gold per Harbor', fx: { harborGold: 2 }, req: ['naval_tradition'] } } },
  rationalism: { name: 'Rationalism', era: 3, opener: { desc: '+10% Science while Happy; Golden Age', fx: { sciPctHappy: 10 }, once: { goldenAge: true } },
    finisher: { desc: 'Two free technologies', once: { freeTech: 2 } },
    policies: {
      secularism: { name: 'Secularism', desc: '+2 Science from every specialist', fx: { specialistSci: 2 } },
      humanism: { name: 'Humanism', desc: '+1 Happiness from Universities, Observatories', fx: { universityHappy: 1 } },
      free_thought: { name: 'Free Thought', desc: '+1 Science on Trading Posts; +17% science in universities', fx: { sciPct: 10 }, req: ['secularism'] },
      sovereignty: { name: 'Sovereignty', desc: '+10% Science while Happy', fx: { sciPctHappy: 10 }, req: ['humanism'] },
      scientific_revolution: { name: 'Scientific Revolution', desc: 'Free tech; +25% Great Scientist rate', once: { freeTech: 1 }, fx: { scientistGPPct: 25 }, req: ['free_thought', 'sovereignty'] } } },
  freedom: { name: 'Freedom (Ideology)', era: 4, ideology: true, opener: { desc: '+1 Culture in every city; +25% specialists output', fx: { cityCulture: 1, specialistPct: 25 } },
    finisher: { desc: '+50% Tourism', fx: { tourismPct: 50 } },
    policies: {
      civil_society: { name: 'Civil Society', desc: 'Specialists consume half food', fx: { specialistFoodHalf: true } },
      volunteer_army: { name: 'Volunteer Army', desc: '+15% combat in friendly territory', fx: { homeCombatPct: 15 } },
      universal_suffrage: { name: 'Universal Suffrage', desc: 'Specialists -1 unhappiness; Golden Ages +50%', fx: { goldenAgeLenPct: 50 }, req: ['civil_society'] },
      new_deal: { name: 'New Deal', desc: 'Great Person improvements +4 yields', fx: { gpImprovementBonus: 2 }, req: ['volunteer_army'] },
      media_culture: { name: 'Media Culture', desc: '+25% Tourism', fx: { tourismPct: 25 }, req: ['universal_suffrage'] } } },
  order: { name: 'Order (Ideology)', era: 4, ideology: true, opener: { desc: '+15% Production in all cities', fx: { prodPct: 15 } },
    finisher: { desc: '+1 Happiness per city; free buildings', fx: { cityHappy: 1 } },
    policies: {
      five_year_plan: { name: 'Five-Year Plan', desc: '+2 Production per city; +1 on mines', fx: { cityProd: 2 } },
      socialist_realism: { name: 'Socialist Realism', desc: 'Free Monument; +2 Happiness from monuments', fx: { monumentHappy: 2 } },
      academy_of_sciences: { name: 'Academy of Sciences', desc: '+25% Science in capital; free Great Scientist', fx: { capSciPct: 25 }, once: { freeGP: 'scientist' }, req: ['five_year_plan'] },
      hero_of_the_people: { name: 'Hero of the People', desc: 'Free Great Engineer', once: { freeGP: 'engineer' }, req: ['socialist_realism'] },
      worker_faculties: { name: 'Worker Faculties', desc: '+25% Science from factories', fx: { sciPct: 10 }, req: ['five_year_plan'] } } },
  autocracy: { name: 'Autocracy (Ideology)', era: 4, ideology: true, opener: { desc: '-33% unit maintenance; +10% military production', fx: { unitMaintPct: -33, unitProdPct: 10 } },
    finisher: { desc: '+25% combat vs cities', fx: { vsCityPct: 25 } },
    policies: {
      mobilization: { name: 'Mobilization', desc: 'Purchasing units costs 33% less', fx: { unitPurchasePct: -33 } },
      elite_forces: { name: 'Elite Forces', desc: '+50% XP for units', fx: { xpPct: 50 } },
      lightning_warfare: { name: 'Lightning Warfare', desc: '+15% for armor; +1 move', fx: { armorPct: 15 }, req: ['mobilization'] },
      militarism: { name: 'Militarism', desc: '+1 Happiness from military buildings', fx: { militaryBuildingHappy: 1 }, req: ['elite_forces'] },
      total_war: { name: 'Total War', desc: '+25% production of military units; +15 XP', fx: { unitProdPct: 25, xpFlat: 15 }, req: ['lightning_warfare', 'militarism'] } } }
};

// ---------- Religion ----------
G.D.RELIGIONS = [
  { id: 'buddhism', name: 'Buddhism', icon: '☸', color: '#f2b134' },
  { id: 'christianity', name: 'Christianity', icon: '✝', color: '#e8e8f0' },
  { id: 'confucianism', name: 'Confucianism', icon: '儒', color: '#c94a3b' },
  { id: 'hinduism', name: 'Hinduism', icon: '🕉', color: '#ff7a1a' },
  { id: 'islam', name: 'Islam', icon: '☪', color: '#2e9b4c' },
  { id: 'judaism', name: 'Judaism', icon: '✡', color: '#3a6fcf' },
  { id: 'shinto', name: 'Shinto', icon: '⛩', color: '#e04040' },
  { id: 'sikhism', name: 'Sikhism', icon: '☬', color: '#2a4fa0' },
  { id: 'taoism', name: 'Taoism', icon: '☯', color: '#222222' },
  { id: 'zoroastrianism', name: 'Zoroastrianism', icon: '🔥', color: '#e6942e' },
  { id: 'tengrism', name: 'Tengrism', icon: '◎', color: '#4aa3df' },
  { id: 'orthodoxy', name: 'Orthodoxy', icon: '☦', color: '#d6b84a' },
  { id: 'jainism', name: 'Jainism', icon: '卍', color: '#e0703a' },
  { id: 'hellenism', name: 'Hellenism', icon: 'Ω', color: '#8ab0d8' }
];
G.D.BELIEFS = {
  pantheon: {
    god_of_craftsmen: { name: 'God of Craftsmen', desc: '+1 Production in cities with 3+ pop', fx: { cityProd3: 1 } },
    god_of_the_sea: { name: 'God of the Sea', desc: '+1 Production from fishing boats', fx: { seaProd: 1 } },
    god_of_war: { name: 'God of War', desc: 'Faith from killing units', fx: { faithFromKills: true } },
    goddess_of_festivals: { name: 'Goddess of Festivals', desc: '+1 Culture and Faith from wine/incense', fx: { luxFaith: 1 } },
    fertility_rites: { name: 'Fertility Rites', desc: '+10% growth', fx: { foodPct: 10 } },
    ancestor_worship: { name: 'Ancestor Worship', desc: '+1 Culture from shrines', fx: { shrineCulture: 1 } },
    desert_folklore: { name: 'Desert Folklore', desc: '+1 Faith from desert tiles', fx: { desertFaith: 1 } },
    sacred_path: { name: 'Sacred Path', desc: '+1 Culture from jungle tiles', fx: { jungleCulture: 1 } },
    stone_circles: { name: 'Stone Circles', desc: '+2 Faith from quarries', fx: { quarryFaith: 2 } },
    religious_idols: { name: 'Religious Idols', desc: '+1 Culture and Faith from gold/silver', fx: { idols: 1 } },
    oral_tradition: { name: 'Oral Tradition', desc: '+1 Culture from plantations', fx: { plantationCulture: 1 } },
    god_of_open_sky: { name: 'God of the Open Sky', desc: '+1 Culture from pastures', fx: { pastureCulture: 1 } },
    monument_to_gods: { name: 'Monument to the Gods', desc: '+15% production of ancient/classical wonders', fx: { wonderPct: 15 } },
    one_with_nature: { name: 'One with Nature', desc: '+4 Faith from natural wonders', fx: { nwFaith: 4 } },
    messenger_of_gods: { name: 'Messenger of the Gods', desc: '+2 Science in cities with a garrison', fx: { garrisonSci: 2 } }
  },
  founder: {
    tithe: { name: 'Tithe', desc: '+1 Gold per 4 followers', fx: { titheGold: 0.25 } },
    church_property: { name: 'Church Property', desc: '+2 Gold per city following', fx: { followerCityGold: 2 } },
    ceremonial_burial: { name: 'Ceremonial Burial', desc: '+1 Happiness per city following', fx: { followerCityHappy: 1 } },
    papal_primacy: { name: 'Papal Primacy', desc: '+15 resting influence with City-States following', fx: { csResting: 15 } },
    pilgrimage: { name: 'Pilgrimage', desc: '+2 Faith per foreign city following', fx: { foreignFollowerFaith: 2 } },
    world_church: { name: 'World Church', desc: '+1 Culture per 5 followers', fx: { worldChurch: 0.2 } },
    interfaith_dialogue: { name: 'Interfaith Dialogue', desc: 'Science when missionaries convert', fx: { interfaith: true } }
  },
  follower: {
    pagodas: { name: 'Pagodas', desc: '+2 Faith, +2 Culture, +2 Happiness per city', fx: { followerY: { fa: 2, c: 2 }, followerHappy: 2 } },
    mosques: { name: 'Mosques', desc: '+3 Faith, +2 Culture per city', fx: { followerY: { fa: 3, c: 2 } } },
    cathedrals: { name: 'Cathedrals', desc: '+3 Faith, +1 Culture, +1 Happiness', fx: { followerY: { fa: 3, c: 1 }, followerHappy: 1 } },
    feed_the_world: { name: 'Feed the World', desc: '+1 Food from shrines and temples', fx: { followerY: { f: 2 } } },
    guruship: { name: 'Guruship', desc: '+2 Production in cities with a specialist', fx: { followerY: { p: 2 } } },
    religious_community: { name: 'Religious Community', desc: '+1% production per follower', fx: { followerProdPct: 1 } },
    swords_into_plowshares: { name: 'Swords into Plowshares', desc: '+15% growth in peace', fx: { followerFoodPct: 15 } },
    choral_music: { name: 'Choral Music', desc: '+2 Culture per city', fx: { followerY: { c: 2 } } },
    peace_gardens: { name: 'Peace Gardens', desc: '+2 Happiness per city', fx: { followerHappy: 2 } },
    asceticism: { name: 'Asceticism', desc: '+1 Happiness, +1 Faith', fx: { followerY: { fa: 1 }, followerHappy: 1 } }
  }
};

// City-state types
G.D.CS_TYPES = {
  maritime: { name: 'Maritime', color: '#3fb3e0', friend: { capFood: 2, cityFood: 0.5 }, ally: { capFood: 2, cityFood: 1 } },
  cultured: { name: 'Cultured', color: '#c95fd6', friend: { culture: 3 }, ally: { culture: 6 } },
  militaristic: { name: 'Militaristic', color: '#d64a3b', friend: { unitEvery: 20 }, ally: { unitEvery: 14 } },
  mercantile: { name: 'Mercantile', color: '#e8c43a', friend: { happy: 2 }, ally: { happy: 3 } },
  religious: { name: 'Religious', color: '#f2f2f2', friend: { faith: 2 }, ally: { faith: 4 } }
};
G.D.CITY_STATES = [
  ['Almaty', 'mercantile'], ['Antananarivo', 'cultured'], ['Belgrade', 'militaristic'], ['Bratislava', 'cultured'], ['Brussels', 'mercantile'],
  ['Buenos Aires', 'mercantile'], ['Cape Town', 'maritime'], ['Colombo', 'maritime'], ['Florence', 'cultured'], ['Genoa', 'mercantile'],
  ['Hong Kong', 'mercantile'], ['Jerusalem', 'religious'], ['Kathmandu', 'religious'], ['Kuala Lumpur', 'maritime'], ['La Venta', 'religious'],
  ['Manila', 'maritime'], ['Milan', 'cultured'], ['Mombasa', 'maritime'], ['Monaco', 'maritime'], ['Riga', 'mercantile'],
  ['Samarkand', 'mercantile'], ['Singapore', 'maritime'], ['Valletta', 'militaristic'], ['Vilnius', 'cultured'], ['Wittenberg', 'religious'],
  ['Yerevan', 'religious'], ['Zanzibar', 'mercantile'], ['Geneva', 'religious'], ['Bologna', 'cultured'], ['Ife', 'religious'],
  ['Kabul', 'militaristic'], ['Sarajevo', 'militaristic'], ['Tallinn', 'maritime'], ['Bukhara', 'mercantile'], ['Malacca', 'maritime'],
  ['Granada', 'cultured'], ['Ragusa', 'maritime'], ['Hanseatic Lübeck', 'mercantile'], ['Zurich', 'mercantile'], ['Edessa', 'religious']
];
