// ============================================================
//  Civilizations & leaders — each leader is a real historical head of
//  state/government of that civilization. Cities are real historical
//  cities, capital first. Traits use engine modifier keys.
// ============================================================
var G = (typeof G !== 'undefined') ? G : {};
G.D = G.D || {};
G.D.CIVS = {};
(function () {
  var C = function (id, o) { o.id = id; G.D.CIVS[id] = o; };

  C('america', { name: 'America', adj: 'American', leader: 'George Washington', title: 'President', reign: '1789–1797', col: ['#1f3a7a', '#f0f0f0'],
    trait: { name: 'Manifest Destiny', desc: '+1 sight for all land units; tiles cost 50% less gold', fx: { landSight: 1, tileBuyPct: -50 } },
    uu: { base: 'musketman', name: 'Minuteman', flags: ['ignoreTerrain'], desc: 'Ignores terrain cost' }, ub: { base: 'stock_exchange', name: 'Federal Reserve', add: { y: { g: 2 } } },
    cities: ['Washington', 'New York', 'Boston', 'Philadelphia', 'Baltimore', 'Charleston', 'Atlanta', 'Chicago', 'New Orleans', 'St. Louis', 'Seattle', 'San Francisco', 'Los Angeles', 'Houston', 'Denver', 'Detroit'] });
  C('arabia', { name: 'Abbasid Caliphate', adj: 'Arabian', leader: 'Harun al-Rashid', title: 'Caliph', reign: '786–809', col: ['#1d6b3a', '#f2e6a0'],
    trait: { name: 'Ships of the Desert', desc: '+2 Gold per trade route; +25% Gold', fx: { tradeGold: 2, goldPct: 10 } },
    uu: { base: 'knight', name: 'Camel Archer', cls: 'ranged', str: 17, rs: 21, range: 2, mv: 4, res: null, desc: 'Mounted ranged' }, ub: { base: 'market', name: 'Bazaar', add: { y: { g: 2 } } },
    cities: ['Baghdad', 'Mecca', 'Medina', 'Damascus', 'Basra', 'Kufa', 'Raqqa', 'Mosul', 'Samarra', 'Aleppo', 'Jeddah', 'Sana\'a'] });
  C('assyria', { name: 'Assyria', adj: 'Assyrian', leader: 'Ashurbanipal', title: 'King', reign: '669–631 BC', col: ['#e8b84a', '#5a2a10'],
    trait: { name: 'Treasures of Nineveh', desc: 'Science from conquering cities; +10% Science', fx: { sciPct: 10, conquestTech: true } },
    uu: { base: 'catapult', name: 'Siege Tower', str: 10, rs: 0, cls: 'melee', vsCity: 75, res: null, desc: 'Melee siege' }, ub: { base: 'library', name: 'Royal Library', add: { y: { s: 1 } } },
    cities: ['Nineveh', 'Assur', 'Nimrud', 'Dur-Sharrukin', 'Arbela', 'Harran', 'Tarbisu', 'Kilizu', 'Guzana', 'Til Barsip'] });
  C('austria', { name: 'Austria', adj: 'Austrian', leader: 'Maria Theresa', title: 'Archduchess', reign: '1740–1780', col: ['#f0f0f0', '#c0232b'],
    trait: { name: 'Diplomatic Marriage', desc: 'City-State influence +50% from gifts; +10% Gold', fx: { csGiftPct: 50, goldPct: 10 } },
    uu: { base: 'cavalry', name: 'Hussar', str: 38, mv: 5, desc: '+1 move' }, ub: { base: 'bank', name: 'Coffee House', add: { pct: { p: 5 } } },
    cities: ['Vienna', 'Salzburg', 'Graz', 'Linz', 'Innsbruck', 'Prague', 'Budapest', 'Klagenfurt', 'Trieste', 'Brno', 'Lemberg', 'Pressburg'] });
  C('aztec', { name: 'Aztec Empire', adj: 'Aztec', leader: 'Moctezuma I', title: 'Huey Tlatoani', reign: '1440–1469', col: ['#8a1c1c', '#5ad1c4'],
    trait: { name: 'Sacrificial Captives', desc: 'Culture from kills; +25% vs Barbarians', fx: { cultureFromKills: true, vsBarbPct: 25 } },
    uu: { base: 'warrior', name: 'Jaguar', str: 10, flags: ['jungleBonus'], desc: '+33% in forest/jungle' }, ub: { base: 'water_mill', name: 'Floating Gardens', add: { y: { f: 2 } } },
    cities: ['Tenochtitlan', 'Texcoco', 'Tlacopan', 'Tlatelolco', 'Xochimilco', 'Coyoacán', 'Chalco', 'Cholula', 'Azcapotzalco', 'Iztapalapa', 'Teotihuacan'] });
  C('babylon', { name: 'Babylon', adj: 'Babylonian', leader: 'Nebuchadnezzar II', title: 'King', reign: '605–562 BC', col: ['#2b4f9c', '#f2d36b'],
    trait: { name: 'Ingenuity', desc: 'Free Great Scientist with Writing; +50% Scientist rate', fx: { scientistGPPct: 50 }, onTech: { writing: { freeGP: 'scientist' } } },
    uu: { base: 'archer', name: 'Bowman', str: 9, rs: 9, desc: 'Stronger archer' }, ub: { base: 'walls', name: 'Walls of Babylon', add: { def: 1, hp: 50 } },
    cities: ['Babylon', 'Kish', 'Borsippa', 'Sippar', 'Nippur', 'Larsa', 'Isin', 'Dilbat', 'Marad', 'Kutha'] });
  C('brazil', { name: 'Brazil', adj: 'Brazilian', leader: 'Pedro II', title: 'Emperor', reign: '1831–1889', col: ['#2c9c3a', '#f2d22e'],
    trait: { name: 'Carnival', desc: 'Tourism +100% during Golden Ages; +25% Golden Age length', fx: { goldenAgeLenPct: 25, tourismPct: 25 } },
    uu: { base: 'infantry', name: 'Pracinha', str: 75, desc: 'Stronger infantry' }, ub: null,
    cities: ['Rio de Janeiro', 'São Paulo', 'Salvador', 'Recife', 'Belo Horizonte', 'Porto Alegre', 'Belém', 'Curitiba', 'Manaus', 'Fortaleza', 'Ouro Preto', 'Brasília'] });
  C('byzantium', { name: 'Byzantium', adj: 'Byzantine', leader: 'Justinian I', title: 'Emperor', reign: '527–565', col: ['#5b1e7a', '#e8c548'],
    trait: { name: 'Patriarchate of Constantinople', desc: '+20% Faith; extra religious belief', fx: { faithPct: 20, extraBelief: true } },
    uu: { base: 'knight', name: 'Cataphract', str: 25, mv: 3, desc: 'Heavy cavalry, no city penalty' }, ub: { base: 'temple', name: 'Hippodrome', add: { happy: 1 } },
    cities: ['Constantinople', 'Thessalonica', 'Nicaea', 'Antioch', 'Trebizond', 'Smyrna', 'Adrianople', 'Ephesus', 'Nicomedia', 'Ravenna', 'Dyrrachium', 'Iconium'] });
  C('carthage', { name: 'Carthage', adj: 'Carthaginian', leader: 'Hannibal Barca', title: 'Suffete', reign: '196 BC', col: ['#6b2a8c', '#f0f0f0'],
    trait: { name: 'Phoenician Heritage', desc: 'Free Harbor in coastal cities; +1 naval move', fx: { navalMoves: 1, coastalGold: 1 } },
    uu: { base: 'horseman', name: 'African Forest Elephant', str: 14, mv: 3, res: null, desc: 'No horses needed' }, ub: null,
    cities: ['Carthage', 'Utica', 'Hippo Regius', 'Gades', 'Leptis Magna', 'Hadrumetum', 'Carthago Nova', 'Panormus', 'Lilybaeum', 'Motya', 'Thapsus'] });
  C('celts', { name: 'Iceni Britons', adj: 'Celtic', leader: 'Boudica', title: 'Queen of the Iceni', reign: 'c. 60 AD', col: ['#1e5e3a', '#86c4e6'],
    trait: { name: 'Druidic Lore', desc: '+1 Faith in cities near forests; +15% Faith', fx: { faithPct: 15, forestFaith: 1 } },
    uu: { base: 'pikeman', name: 'Pictish Warrior', str: 20, desc: '+20% in foreign lands' }, ub: { base: 'shrine', name: 'Ceilidh Hall', add: { y: { c: 2 }, happy: 1 } },
    cities: ['Venta Icenorum', 'Camulodunum', 'Durovernum', 'Calleva', 'Isurium', 'Durnovaria', 'Lindum', 'Corinium', 'Viroconium', 'Moridunum'] });
  C('china', { name: 'Tang China', adj: 'Chinese', leader: 'Taizong of Tang', title: 'Emperor', reign: '626–649', col: ['#2a8a5a', '#f2f2f2'],
    trait: { name: 'Art of War', desc: '+50% Great General rate; +10% Science', fx: { generalGPPct: 50, sciPct: 10 } },
    uu: { base: 'crossbowman', name: 'Chu-Ko-Nu', str: 13, rs: 14, flags: ['twice'], desc: 'Attacks twice' }, ub: { base: 'library', name: 'Paper Maker', add: { y: { g: 2 } } },
    cities: ['Chang\'an', 'Luoyang', 'Beijing', 'Nanjing', 'Hangzhou', 'Kaifeng', 'Chengdu', 'Guangzhou', 'Suzhou', 'Yangzhou', 'Dunhuang', 'Taiyuan'] });
  C('denmark', { name: 'Denmark', adj: 'Danish', leader: 'Harald Bluetooth', title: 'King', reign: '958–986', col: ['#c8102e', '#f0f0f0'],
    trait: { name: 'Viking Fury', desc: 'Embarked units +1 move; no disembark penalty', fx: { embarkMoves: 1, amphibious: true } },
    uu: { base: 'longswordsman', name: 'Berserker', mv: 3, flags: ['amphib'], desc: '+1 move, amphibious' }, ub: null,
    cities: ['Roskilde', 'Jelling', 'Ribe', 'Hedeby', 'Aarhus', 'Odense', 'Viborg', 'Aalborg', 'Copenhagen', 'Lund', 'Helsingør'] });
  C('egypt', { name: 'Egypt', adj: 'Egyptian', leader: 'Ramesses II', title: 'Pharaoh', reign: '1279–1213 BC', col: ['#e6c85a', '#2a5aa0'],
    trait: { name: 'Monument Builders', desc: '+20% production of wonders', fx: { wonderPct: 20 } },
    uu: { base: 'chariot_archer', name: 'War Chariot', str: 6, rs: 12, mv: 5, res: null, desc: 'No horses needed' }, ub: { base: 'monument', name: 'Burial Tomb', add: { y: { c: 2 }, happy: 2 } },
    cities: ['Thebes', 'Memphis', 'Pi-Ramesses', 'Heliopolis', 'Abydos', 'Elephantine', 'Edfu', 'Hermopolis', 'Akhetaten', 'Sais', 'Alexandria', 'Giza'] });
  C('england', { name: 'England', adj: 'English', leader: 'Elizabeth I', title: 'Queen', reign: '1558–1603', col: ['#c8102e', '#f0f0f0'],
    trait: { name: 'Sun Never Sets', desc: '+2 naval movement; +1 trade route', fx: { navalMoves: 2, tradeRoutes: 1 } },
    uu: { base: 'crossbowman', name: 'Longbowman', range: 3, desc: '+1 range' }, ub: null, uu2: { base: 'frigate', name: 'Ship of the Line', str: 30, rs: 35 },
    cities: ['London', 'York', 'Nottingham', 'Bristol', 'Canterbury', 'Norwich', 'Oxford', 'Coventry', 'Exeter', 'Plymouth', 'Southampton', 'Winchester'] });
  C('ethiopia', { name: 'Ethiopia', adj: 'Ethiopian', leader: 'Menelik II', title: 'Emperor', reign: '1889–1913', col: ['#2a8a3a', '#f2d22e'],
    trait: { name: 'Spirit of Adwa', desc: '+20% combat vs larger civs; +15% Faith', fx: { underdogPct: 20, faithPct: 15 } },
    uu: { base: 'rifleman', name: 'Mehal Sefari', str: 36, desc: '+homeland bonus' }, ub: { base: 'monument', name: 'Stele', add: { y: { fa: 2 } } },
    cities: ['Addis Ababa', 'Gondar', 'Aksum', 'Harar', 'Lalibela', 'Dire Dawa', 'Bahir Dar', 'Mekelle', 'Dessie', 'Adwa'] });
  C('france', { name: 'France', adj: 'French', leader: 'Napoleon I', title: 'Emperor', reign: '1804–1815', col: ['#1f3f9c', '#f0f0f0'],
    trait: { name: 'City of Light', desc: '+2 Culture per city; +25% Tourism', fx: { cityCulture: 2, tourismPct: 25 } },
    uu: { base: 'musketman', name: 'Musketeer', str: 28, desc: 'Stronger musketman' }, ub: null,
    cities: ['Paris', 'Lyon', 'Marseille', 'Bordeaux', 'Toulouse', 'Orléans', 'Rouen', 'Lille', 'Strasbourg', 'Reims', 'Nantes', 'Avignon'] });
  C('germany', { name: 'Germany', adj: 'German', leader: 'Otto von Bismarck', title: 'Chancellor', reign: '1871–1890', col: ['#2a2a2a', '#d4d4d4'],
    trait: { name: 'Furor Teutonicus', desc: 'Barbarians may join; -25% unit maintenance', fx: { unitMaintPct: -25, barbConvert: 50 } },
    uu: { base: 'pikeman', name: 'Landsknecht', cost: 60, desc: 'Cheaper, moves after attack' }, ub: { base: 'bank', name: 'Hanse', add: { y: { p: 2 } } }, uu2: { base: 'tank', name: 'Panzer', str: 80, mv: 6 },
    cities: ['Berlin', 'Hamburg', 'Munich', 'Cologne', 'Frankfurt', 'Dresden', 'Leipzig', 'Stuttgart', 'Bremen', 'Hanover', 'Nuremberg', 'Königsberg'] });
  C('athens', { name: 'Athens', adj: 'Athenian', leader: 'Pericles', title: 'Strategos', reign: '461–429 BC', col: ['#3a7ac9', '#f0f0f0'],
    trait: { name: 'Delian League', desc: '+100% City-State influence from gifts; +10% Culture', fx: { csGiftPct: 100, culturePct: 10 } },
    uu: { base: 'spearman', name: 'Hoplite', str: 13, desc: 'Stronger spearman' }, ub: { base: 'amphitheater', name: 'Odeon', add: { y: { c: 1 } } },
    cities: ['Athens', 'Piraeus', 'Eleusis', 'Marathon', 'Delos', 'Chalcis', 'Salamis', 'Laurium', 'Thoricus', 'Aegina'] });
  C('macedon', { name: 'Macedon', adj: 'Macedonian', leader: 'Alexander the Great', title: 'Basileus', reign: '336–323 BC', col: ['#2a6ac0', '#f2c22e'],
    trait: { name: 'Hellenic League', desc: '+15% combat vs cities; Great Generals +50%', fx: { vsCityPct: 15, generalGPPct: 50 } },
    uu: { base: 'horseman', name: 'Companion Cavalry', str: 14, mv: 5, desc: '+1 move, generates generals' }, ub: null,
    cities: ['Pella', 'Aigai', 'Amphipolis', 'Philippi', 'Dion', 'Methone', 'Beroia', 'Edessa', 'Olynthus', 'Alexandria Eschate'] });
  C('sparta', { name: 'Sparta', adj: 'Spartan', leader: 'Leonidas I', title: 'King', reign: '489–480 BC', col: ['#b22222', '#e8c548'],
    trait: { name: 'Agoge', desc: '+20% combat for melee; +25% XP', fx: { meleePct: 20, xpPct: 25 } },
    uu: { base: 'spearman', name: 'Spartan Hoplite', str: 15, desc: 'Elite spearman' }, ub: { base: 'barracks', name: 'Syssitia', add: { y: { c: 1 } } },
    cities: ['Sparta', 'Gytheio', 'Amyclae', 'Messene', 'Pylos', 'Sellasia', 'Pharis', 'Thalamae', 'Boiae'] });
  C('inca', { name: 'Inca Empire', adj: 'Incan', leader: 'Pachacuti', title: 'Sapa Inca', reign: '1438–1471', col: ['#f2c22e', '#2a7a4a'],
    trait: { name: 'Great Andean Road', desc: 'Units ignore hill cost; no road maintenance on hills', fx: { hillsMove: true, roadMaintPct: -50 } },
    uu: { base: 'archer', name: 'Slinger', str: 4, rs: 7, desc: 'Withdraws' }, ub: null, ui: 'terrace_farm',
    cities: ['Cusco', 'Machu Picchu', 'Ollantaytambo', 'Quito', 'Tumebamba', 'Vilcabamba', 'Cajamarca', 'Huánuco Pampa', 'Pisac', 'Vitcos', 'Sacsayhuamán'] });
  C('india', { name: 'Maurya Empire', adj: 'Indian', leader: 'Ashoka', title: 'Emperor', reign: '268–232 BC', col: ['#f28a1a', '#2a7a3a'],
    trait: { name: 'Dhamma', desc: 'Population unhappiness -25%; +15% Faith', fx: { unhappyPerPopPct: -25, faithPct: 15 } },
    uu: { base: 'chariot_archer', name: 'War Elephant', str: 9, rs: 11, mv: 3, res: null, desc: 'Sturdy, no horses' }, ub: null,
    cities: ['Pataliputra', 'Ujjain', 'Taxila', 'Varanasi', 'Mathura', 'Tosali', 'Suvarnagiri', 'Vidisha', 'Sanchi', 'Kaushambi', 'Rajagriha'] });
  C('majapahit', { name: 'Majapahit', adj: 'Javanese', leader: 'Hayam Wuruk', title: 'King', reign: '1350–1389', col: ['#b22222', '#f0f0f0'],
    trait: { name: 'Spice Islanders', desc: '+2 Gold from coastal cities; +1 embark move', fx: { coastalGold: 2, embarkMoves: 1 } },
    uu: { base: 'swordsman', name: 'Kris Swordsman', str: 14, res: null, desc: 'No iron needed' }, ub: null, ui: 'kampung',
    cities: ['Trowulan', 'Daha', 'Singhasari', 'Kahuripan', 'Tuban', 'Gresik', 'Palembang', 'Jambi', 'Pajajaran', 'Gelgel'] });
  C('iroquois', { name: 'Haudenosaunee', adj: 'Iroquois', leader: 'Hiawatha', title: 'Founder of the Confederacy', reign: 'c. 1450', col: ['#5a3a1a', '#d0a060'],
    trait: { name: 'The Great Warpath', desc: 'Forests and jungles act as roads in your territory', fx: { forestRoads: true } },
    uu: { base: 'swordsman', name: 'Mohawk Warrior', str: 16, res: null, flags: ['jungleBonus'], desc: '+33% in forest/jungle' }, ub: { base: 'workshop', name: 'Longhouse', add: { y: { p: 1 } } },
    cities: ['Onondaga', 'Oneida', 'Cayuga', 'Seneca', 'Mohawk', 'Tuscarora', 'Ganondagan', 'Kanatsiohareke', 'Tiononderoge'] });
  C('japan', { name: 'Japan', adj: 'Japanese', leader: 'Tokugawa Ieyasu', title: 'Shōgun', reign: '1603–1605', col: ['#f0f0f0', '#c8102e'],
    trait: { name: 'Bushido', desc: 'Units fight at full strength when damaged', fx: { noDamagePenalty: true } },
    uu: { base: 'longswordsman', name: 'Samurai', str: 22, desc: 'Generates generals' }, ub: { base: 'castle', name: 'Himeji', add: { y: { c: 1 } } },
    cities: ['Edo', 'Kyoto', 'Osaka', 'Nagoya', 'Kamakura', 'Nara', 'Sendai', 'Kagoshima', 'Hiroshima', 'Sapporo', 'Nagasaki', 'Kanazawa'] });
  C('korea', { name: 'Joseon Korea', adj: 'Korean', leader: 'Sejong the Great', title: 'King', reign: '1418–1450', col: ['#2a3a8a', '#f0f0f0'],
    trait: { name: 'Scholars of the Jade Hall', desc: '+2 Science from specialists; +10% Science', fx: { specialistSci: 2, sciPct: 10 } },
    uu: { base: 'trebuchet', name: 'Hwacha', rs: 16, desc: 'Stronger vs units' }, ub: { base: 'university', name: 'Seowon', add: { y: { s: 2 } } },
    cities: ['Hanseong', 'Gaeseong', 'Gyeongju', 'Pyongyang', 'Busan', 'Jeonju', 'Daegu', 'Gwangju', 'Suwon', 'Wonju', 'Hamhung'] });
  C('mongolia', { name: 'Mongolia', adj: 'Mongol', leader: 'Genghis Khan', title: 'Khagan', reign: '1206–1227', col: ['#8a1c1c', '#f2c22e'],
    trait: { name: 'Mongol Terror', desc: '+30% combat vs City-States; mounted units +1 move', fx: { mountedMoves: 1, mountedPct: 10 } },
    uu: { base: 'knight', name: 'Keshik', cls: 'ranged', str: 15, rs: 16, range: 2, mv: 5, desc: 'Horse archer' }, ub: null,
    cities: ['Karakorum', 'Avarga', 'Khanbaliq', 'Ordu-Baliq', 'Kharkhorum', 'Uliastai', 'Khovd', 'Saray', 'Almaliq', 'Tsetserleg'] });
  C('morocco', { name: 'Saadi Morocco', adj: 'Moroccan', leader: 'Ahmad al-Mansur', title: 'Sultan', reign: '1578–1603', col: ['#c8102e', '#2a7a3a'],
    trait: { name: 'Gateway to Africa', desc: '+3 Gold, +1 Culture per trade route', fx: { tradeGold: 3 } },
    uu: { base: 'cavalry', name: 'Berber Cavalry', str: 36, desc: '+25% in desert' }, ub: null, ui: 'kasbah',
    cities: ['Marrakesh', 'Fez', 'Rabat', 'Meknes', 'Tangier', 'Salé', 'Agadir', 'Taroudant', 'Tetouan', 'Essaouira', 'Sijilmasa'] });
  C('netherlands', { name: 'Netherlands', adj: 'Dutch', leader: 'William the Silent', title: 'Stadtholder', reign: '1572–1584', col: ['#f28a1a', '#1f3f9c'],
    trait: { name: 'Dutch East India Company', desc: '+2 Happiness per luxury; +10% Gold', fx: { luxuryHappy: 1, goldPct: 10 } },
    uu: { base: 'privateer', name: 'Sea Beggar', str: 27, desc: 'Stronger privateer' }, ub: null, ui: 'polder',
    cities: ['Amsterdam', 'Rotterdam', 'Utrecht', 'Leiden', 'Haarlem', 'Delft', 'Groningen', 'The Hague', 'Middelburg', 'Dordrecht', 'Nijmegen'] });
  C('ottomans', { name: 'Ottoman Empire', adj: 'Ottoman', leader: 'Suleiman the Magnificent', title: 'Sultan', reign: '1520–1566', col: ['#c8102e', '#f0f0f0'],
    trait: { name: 'Barbary Corsairs', desc: '-33% naval maintenance; +15% vs cities', fx: { vsCityPct: 15, unitMaintPct: -15 } },
    uu: { base: 'musketman', name: 'Janissary', str: 26, desc: 'Heals on kill' }, ub: null, uu2: { base: 'lancer', name: 'Sipahi', str: 27, mv: 5 },
    cities: ['Istanbul', 'Edirne', 'Bursa', 'Ankara', 'Konya', 'Izmir', 'Trabzon', 'Sivas', 'Diyarbakır', 'Erzurum', 'Sofya', 'Belgrade'] });
  C('persia', { name: 'Achaemenid Persia', adj: 'Persian', leader: 'Darius I', title: 'King of Kings', reign: '522–486 BC', col: ['#7a2a9c', '#f2c22e'],
    trait: { name: 'Achaemenid Legacy', desc: 'Golden Ages +50% longer; +1 move in Golden Ages', fx: { goldenAgeLenPct: 50 } },
    uu: { base: 'spearman', name: 'Immortal', str: 12, desc: 'Heals faster' }, ub: { base: 'bank', name: 'Satrap\'s Court', add: { happy: 2 } }, ui: 'ziggurat_farm',
    cities: ['Persepolis', 'Pasargadae', 'Susa', 'Ecbatana', 'Bactra', 'Sardis', 'Gordium', 'Tarsus', 'Rhagae', 'Arbela', 'Herat'] });
  C('poland', { name: 'Poland', adj: 'Polish', leader: 'Casimir III', title: 'King', reign: '1333–1370', col: ['#c8102e', '#f0f0f0'],
    trait: { name: 'Solidarity', desc: 'Free Social Policy on entering each era', fx: { eraPolicy: true } },
    uu: { base: 'lancer', name: 'Winged Hussar', str: 30, mv: 5, desc: 'Pushes enemies' }, ub: null,
    cities: ['Kraków', 'Warsaw', 'Gniezno', 'Poznań', 'Wrocław', 'Lublin', 'Gdańsk', 'Toruń', 'Płock', 'Lwów', 'Sandomierz'] });
  C('hawaii', { name: 'Kingdom of Hawaii', adj: 'Hawaiian', leader: 'Kamehameha I', title: 'King', reign: '1795–1819', col: ['#f28a1a', '#1f3f9c'],
    trait: { name: 'Wayfinding', desc: 'Embark on ocean from start; +2 embark moves', fx: { earlyOcean: true, embarkMoves: 2 } },
    uu: { base: 'pikeman', name: 'Maori Warrior', str: 16, desc: 'Fear aura' }, ub: null, ui: 'moai',
    cities: ['Kailua-Kona', 'Lahaina', 'Honolulu', 'Hilo', 'Waimea', 'Kapaʻa', 'Kaunakakai', 'Hāna', 'Kawaihae', 'Wailuku'] });
  C('portugal', { name: 'Portugal', adj: 'Portuguese', leader: 'Manuel I', title: 'King', reign: '1495–1521', col: ['#f0f0f0', '#1f3f9c'],
    trait: { name: 'Mare Clausum', desc: '+4 Gold per trade route; +1 naval sight', fx: { tradeGold: 4, navalSight: 1 } },
    uu: { base: 'caravel', name: 'Nau', str: 24, desc: 'Sells exotic goods' }, ub: null, ui: 'feitoria',
    cities: ['Lisbon', 'Porto', 'Coimbra', 'Braga', 'Évora', 'Faro', 'Funchal', 'Ponta Delgada', 'Setúbal', 'Viseu', 'Guimarães'] });
  C('rome', { name: 'Rome', adj: 'Roman', leader: 'Augustus', title: 'Princeps', reign: '27 BC – 14 AD', col: ['#5b1e7a', '#f2c22e'],
    trait: { name: 'The Glory of Rome', desc: '+25% production of buildings already in capital', fx: { buildingPct: 15 } },
    uu: { base: 'swordsman', name: 'Legion', str: 17, flags: ['buildRoads'], desc: 'Builds roads and forts' }, ub: null, uu2: { base: 'catapult', name: 'Ballista', rs: 10 },
    cities: ['Rome', 'Antium', 'Cumae', 'Neapolis', 'Ravenna', 'Arretium', 'Mediolanum', 'Capua', 'Brundisium', 'Ostia', 'Lugdunum', 'Aquileia'] });
  C('russia', { name: 'Russia', adj: 'Russian', leader: 'Catherine the Great', title: 'Empress', reign: '1762–1796', col: ['#f2c22e', '#2a2a2a'],
    trait: { name: 'Siberian Riches', desc: 'Double strategic resources; +1 Production from them', fx: { strategicDouble: true, borderCostPct: -15 } },
    uu: { base: 'cavalry', name: 'Cossack', str: 36, desc: '+33% vs wounded' }, ub: { base: 'barracks', name: 'Krepost', add: { def: 2 } },
    cities: ['Saint Petersburg', 'Moscow', 'Novgorod', 'Kazan', 'Smolensk', 'Nizhny Novgorod', 'Yaroslavl', 'Tver', 'Arkhangelsk', 'Kiev', 'Rostov', 'Tobolsk'] });
  C('siam', { name: 'Siam (Sukhothai)', adj: 'Siamese', leader: 'Ram Khamhaeng', title: 'King', reign: '1279–1298', col: ['#c8102e', '#f2e6a0'],
    trait: { name: 'Father Governs Children', desc: 'City-State bonuses +50%', fx: { csBonusPct: 50 } },
    uu: { base: 'knight', name: 'Naresuan\'s Elephant', str: 25, mv: 3, res: null, desc: 'Heavy elephant' }, ub: { base: 'university', name: 'Wat', add: { y: { c: 3 } } },
    cities: ['Sukhothai', 'Si Satchanalai', 'Phitsanulok', 'Kamphaeng Phet', 'Phrae', 'Nan', 'Lampang', 'Uttaradit', 'Phichit', 'Tak'] });
  C('songhai', { name: 'Songhai', adj: 'Songhai', leader: 'Askia Muhammad I', title: 'Askia', reign: '1493–1528', col: ['#a0522d', '#f2c22e'],
    trait: { name: 'River Warlord', desc: 'Triple gold from barbarian camps; amphibious land units', fx: { amphibious: true, campGold: 3 } },
    uu: { base: 'knight', name: 'Mandekalu Cavalry', str: 22, desc: 'No city penalty' }, ub: { base: 'temple', name: 'Mud Pyramid Mosque', add: { y: { c: 2 } } },
    cities: ['Gao', 'Timbuktu', 'Djenné', 'Tadmekka', 'Kukiya', 'Walata', 'Agadez', 'Kabara', 'Bamba', 'Tondibi'] });
  C('spain', { name: 'Spain', adj: 'Spanish', leader: 'Isabella I', title: 'Queen of Castile', reign: '1474–1504', col: ['#c8102e', '#f2c22e'],
    trait: { name: 'Seven Cities of Gold', desc: 'Gold bonus for natural wonders; +10% Faith', fx: { nwGold: true, faithPct: 10 } },
    uu: { base: 'musketman', name: 'Tercio', str: 26, desc: '+50% vs mounted' }, ub: null, uu2: { base: 'knight', name: 'Conquistador', str: 22, mv: 5 },
    cities: ['Toledo', 'Seville', 'Córdoba', 'Valladolid', 'Burgos', 'Salamanca', 'Zaragoza', 'Valencia', 'Madrid', 'León', 'Cádiz', 'Barcelona'] });
  C('sweden', { name: 'Sweden', adj: 'Swedish', leader: 'Gustavus Adolphus', title: 'King', reign: '1611–1632', col: ['#1f4fa0', '#f2c22e'],
    trait: { name: 'Lion of the North', desc: 'Great Generals +50%; +15% combat with generals', fx: { generalGPPct: 50, generalAuraPct: 10 } },
    uu: { base: 'gatling_gun', name: 'Carolean', cls: 'gun', str: 34, rs: 0, desc: 'Line infantry' }, ub: null,
    cities: ['Stockholm', 'Uppsala', 'Gothenburg', 'Kalmar', 'Västerås', 'Norrköping', 'Linköping', 'Visby', 'Örebro', 'Falun', 'Lund'] });
  C('venice', { name: 'Venice', adj: 'Venetian', leader: 'Enrico Dandolo', title: 'Doge', reign: '1192–1205', col: ['#f2c22e', '#5b1e7a'],
    trait: { name: 'Serenissima', desc: 'Double trade routes; +25% Gold', fx: { tradeRoutes: 2, goldPct: 15 } },
    uu: { base: 'galleass', name: 'Great Galleass', str: 20, rs: 20, desc: 'Stronger galleass' }, ub: { base: 'market', name: 'Fondaco', add: { y: { g: 2 } } },
    cities: ['Venice', 'Padua', 'Verona', 'Treviso', 'Vicenza', 'Zara', 'Spalato', 'Candia', 'Corfu', 'Negroponte'] });
  C('zulu', { name: 'Zulu Kingdom', adj: 'Zulu', leader: 'Shaka', title: 'King', reign: '1816–1828', col: ['#f2c22e', '#5a3a1a'],
    trait: { name: 'Iklwa', desc: '-50% melee maintenance; +50% XP', fx: { unitMaintPct: -25, xpPct: 50 } },
    uu: { base: 'pikeman', name: 'Impi', str: 16, mv: 3, desc: 'Ranged opening attack' }, ub: { base: 'barracks', name: 'Ikanda', add: { xp: 10 } },
    cities: ['KwaBulawayo', 'Ulundi', 'Dukuza', 'Eshowe', 'Nongoma', 'Empangeni', 'Gingindlovu', 'Kwadukuza', 'Ndwedwe', 'Nkandla'] });
  C('maya', { name: 'Maya', adj: 'Mayan', leader: 'Pakal the Great', title: 'Ajaw of Palenque', reign: '615–683', col: ['#2a8a7a', '#c8102e'],
    trait: { name: 'The Long Count', desc: 'Free Great Person periodically; +10% Science', fx: { sciPct: 10, longCount: 60 } },
    uu: { base: 'composite_bowman', name: 'Atlatlist', cost: 40, tech: 'mathematics', desc: 'Cheaper' }, ub: { base: 'university', name: 'Pyramid', add: { y: { fa: 2 } } },
    cities: ['Palenque', 'Tikal', 'Calakmul', 'Copán', 'Chichen Itza', 'Uxmal', 'Yaxchilan', 'Piedras Negras', 'Tulum', 'Caracol', 'Mayapan'] });
  C('mali', { name: 'Mali', adj: 'Malian', leader: 'Mansa Musa', title: 'Mansa', reign: '1312–1337', col: ['#f2c22e', '#2a7a3a'],
    trait: { name: 'Gold of Mali', desc: '+1 Gold on desert mines; +20% Gold', fx: { goldPct: 20, desertGold: 1 } },
    uu: { base: 'knight', name: 'Mandekalu Horseman', str: 22, desc: 'Fast cavalry' }, ub: { base: 'market', name: 'Suguba', add: { pct: { g: 10 } } },
    cities: ['Niani', 'Timbuktu', 'Gao', 'Djenné', 'Walata', 'Kangaba', 'Koumbi Saleh', 'Kirina', 'Takedda', 'Taghaza'] });
  C('kongo', { name: 'Kongo', adj: 'Kongolese', leader: 'Afonso I', title: 'Mani Kongo', reign: '1509–1542', col: ['#c8102e', '#f2c22e'],
    trait: { name: 'Nkisi', desc: '+2 Faith and Food in cities; +50% Great Artist rate', fx: { cityFaith: 1, artGPPct: 50 } },
    uu: { base: 'swordsman', name: 'Ngao Mbeba', str: 16, res: null, desc: 'No iron, forest bonus' }, ub: null,
    cities: ['Mbanza Kongo', 'Soyo', 'Mbamba', 'Mpangu', 'Nsundi', 'Mbata', 'Mpemba', 'Kiova', 'Lemba'] });
  C('khmer', { name: 'Khmer Empire', adj: 'Khmer', leader: 'Jayavarman VII', title: 'King', reign: '1181–1218', col: ['#5b1e7a', '#f2c22e'],
    trait: { name: 'Grand Barays', desc: '+20% Food in cities on rivers; +10% Faith', fx: { riverFoodPct: 20, faithPct: 10 } },
    uu: { base: 'trebuchet', name: 'Domrey', rs: 15, mv: 3, desc: 'Elephant siege, no setup' }, ub: null,
    cities: ['Yasodharapura', 'Hariharalaya', 'Koh Ker', 'Banteay Chhmar', 'Preah Khan', 'Sambor Prei Kuk', 'Phimai', 'Lopburi', 'Banteay Srei'] });
  C('vietnam', { name: 'Đại Việt', adj: 'Vietnamese', leader: 'Lê Lợi', title: 'Emperor', reign: '1428–1433', col: ['#c8102e', '#f2c22e'],
    trait: { name: 'Nine Dragon River Delta', desc: '+25% combat in forest/jungle/marsh; +10% Food', fx: { featureCombat: 25, foodPct: 10 } },
    uu: { base: 'composite_bowman', name: 'Voi Chiến', rs: 13, mv: 3, desc: 'Elephant archer' }, ub: null,
    cities: ['Thăng Long', 'Hoa Lư', 'Tây Đô', 'Thanh Hóa', 'Nghệ An', 'Phú Xuân', 'Hội An', 'Gia Định', 'Lạng Sơn', 'Cao Bằng'] });
  C('scotland', { name: 'Scotland', adj: 'Scottish', leader: 'Robert the Bruce', title: 'King of Scots', reign: '1306–1329', col: ['#1f3f9c', '#f0f0f0'],
    trait: { name: 'Scottish Enlightenment', desc: '+5% Science and Production when Happy', fx: { sciPctHappy: 10, prodPct: 5 } },
    uu: { base: 'rifleman', name: 'Highlander', str: 36, rs: 0, desc: 'Fast rifle' }, ub: { base: 'workshop', name: 'Golf Course', add: { happy: 2 } },
    cities: ['Edinburgh', 'Perth', 'Stirling', 'Glasgow', 'Aberdeen', 'Dundee', 'Inverness', 'St Andrews', 'Dunfermline', 'Scone'] });
  C('phoenicia', { name: 'Phoenicia', adj: 'Phoenician', leader: 'Hiram I', title: 'King of Tyre', reign: '980–947 BC', col: ['#6b2a8c', '#f2c22e'],
    trait: { name: 'Mediterranean Colonies', desc: '+1 Production on coast; +1 naval move', fx: { seaProd: 1, navalMoves: 1 } },
    uu: { base: 'trireme', name: 'Bireme', str: 13, desc: 'Strong early ship' }, ub: null,
    cities: ['Tyre', 'Sidon', 'Byblos', 'Arwad', 'Kition', 'Berytus', 'Sarepta', 'Ugarit', 'Tripolis', 'Akko'] });
  C('hittites', { name: 'Hittites', adj: 'Hittite', leader: 'Šuppiluliuma I', title: 'Great King', reign: '1350–1322 BC', col: ['#8a5a2a', '#f2e6a0'],
    trait: { name: 'Iron Masters', desc: 'Iron revealed early; +15% melee production', fx: { meleeProdPct: 15, chariotPct: 15 } },
    uu: { base: 'chariot_archer', name: 'Heavy Chariot', cls: 'mounted', str: 12, rs: 0, mv: 4, desc: 'Melee chariot' }, ub: null,
    cities: ['Hattusa', 'Kanesh', 'Sapinuwa', 'Kussara', 'Nerik', 'Arinna', 'Karkemish', 'Tarhuntassa', 'Samuha', 'Ankuwa'] });
  C('sumer', { name: 'Sumer (Ur III)', adj: 'Sumerian', leader: 'Ur-Nammu', title: 'King of Ur', reign: '2112–2094 BC', col: ['#2a6a9c', '#e8b84a'],
    trait: { name: 'Code of Ur-Nammu', desc: '+1 Science per city; +10% Food', fx: { citySci: 1, foodPct: 10 } },
    uu: { base: 'chariot_archer', name: 'War Cart', cls: 'mounted', str: 10, rs: 0, mv: 3, res: null, desc: 'Early melee chariot' }, ub: null,
    cities: ['Ur', 'Uruk', 'Lagash', 'Eridu', 'Nippur', 'Umma', 'Larsa', 'Kish', 'Shuruppak', 'Girsu'] });
  C('nubia', { name: 'Kush', adj: 'Nubian', leader: 'Piye', title: 'King', reign: '744–714 BC', col: ['#c06a2a', '#1a1a1a'],
    trait: { name: 'Ta-Seti', desc: '+50% ranged XP; +1 Production on mines', fx: { rangedPct: 15, mineProd: 1 } },
    uu: { base: 'archer', name: 'Pítati Archer', str: 6, rs: 9, mv: 3, desc: 'Fast archer' }, ub: null,
    cities: ['Napata', 'Meroë', 'Kerma', 'Jebel Barkal', 'Nuri', 'Sanam', 'Kawa', 'Faras', 'Semna', 'Soleb'] });
  C('georgia', { name: 'Georgia', adj: 'Georgian', leader: 'Tamar', title: 'Queen', reign: '1184–1213', col: ['#f0f0f0', '#c8102e'],
    trait: { name: 'Glory of the World', desc: '+25% Faith; Golden Ages +25%', fx: { faithPct: 25, goldenAgeLenPct: 25 } },
    uu: { base: 'longswordsman', name: 'Khevsur', str: 23, desc: 'Hill fighter' }, ub: { base: 'walls', name: 'Tsikhe', add: { y: { fa: 2 } } },
    cities: ['Tbilisi', 'Kutaisi', 'Mtskheta', 'Batumi', 'Telavi', 'Gori', 'Akhaltsikhe', 'Zugdidi', 'Poti', 'Sighnaghi'] });
  C('hungary', { name: 'Hungary', adj: 'Hungarian', leader: 'Matthias Corvinus', title: 'King', reign: '1458–1490', col: ['#2a7a3a', '#c8102e'],
    trait: { name: 'Black Army', desc: '+10% combat; -15% unit maintenance', fx: { combatPct: 10, unitMaintPct: -15 } },
    uu: { base: 'lancer', name: 'Huszár', str: 28, mv: 5, desc: 'Light cavalry' }, ub: null,
    cities: ['Buda', 'Esztergom', 'Székesfehérvár', 'Pécs', 'Pozsony', 'Kolozsvár', 'Debrecen', 'Szeged', 'Visegrád', 'Eger'] });
  C('mughal', { name: 'Mughal Empire', adj: 'Mughal', leader: 'Akbar', title: 'Padishah', reign: '1556–1605', col: ['#2a7a3a', '#f2c22e'],
    trait: { name: 'Sulh-i-kul', desc: '+2 Culture per city; +10% Production on wonders', fx: { cityCulture: 1, wonderPct: 10 } },
    uu: { base: 'cannon', name: 'Mughal Cannon', rs: 22, desc: 'Heavy cannon' }, ub: null,
    cities: ['Agra', 'Delhi', 'Fatehpur Sikri', 'Lahore', 'Allahabad', 'Ajmer', 'Ahmedabad', 'Kabul', 'Dhaka', 'Burhanpur'] });
  C('canada', { name: 'Canada', adj: 'Canadian', leader: 'Wilfrid Laurier', title: 'Prime Minister', reign: '1896–1911', col: ['#c8102e', '#f0f0f0'],
    trait: { name: 'Four Faces of Peace', desc: 'Tundra +1 Food; tiles cost 25% less', fx: { tundraFood: 1, tileBuyPct: -25 } },
    uu: { base: 'cavalry', name: 'Mountie', str: 36, desc: 'Strong in own territory' }, ub: null,
    cities: ['Ottawa', 'Montreal', 'Toronto', 'Quebec City', 'Halifax', 'Winnipeg', 'Vancouver', 'Edmonton', 'Regina', 'Victoria', 'Calgary'] });
  C('australia', { name: 'Australia', adj: 'Australian', leader: 'John Curtin', title: 'Prime Minister', reign: '1941–1945', col: ['#1f3f9c', '#f2c22e'],
    trait: { name: 'Citadel of Civilization', desc: '+10% Production; +1 Food on coast', fx: { prodPct: 10, coastFood: 1 } },
    uu: { base: 'infantry', name: 'Digger', str: 75, desc: 'Amphibious infantry' }, ub: null,
    cities: ['Canberra', 'Sydney', 'Melbourne', 'Brisbane', 'Perth', 'Adelaide', 'Hobart', 'Darwin', 'Townsville', 'Geelong'] });
  C('norway', { name: 'Norway', adj: 'Norwegian', leader: 'Harald Hardrada', title: 'King', reign: '1046–1066', col: ['#1f3f9c', '#c8102e'],
    trait: { name: 'Thunderbolt of the North', desc: 'Embarked +1 move; naval melee +15%', fx: { embarkMoves: 1, navalPct: 15 } },
    uu: { base: 'trireme', name: 'Viking Longship', str: 14, mv: 5, desc: 'Fast raiders' }, ub: null,
    cities: ['Nidaros', 'Bergen', 'Oslo', 'Stavanger', 'Tønsberg', 'Hamar', 'Bodø', 'Tromsø', 'Ålesund', 'Kaupang'] });
  C('gran_colombia', { name: 'Gran Colombia', adj: 'Colombian', leader: 'Simón Bolívar', title: 'President', reign: '1819–1830', col: ['#f2c22e', '#1f3f9c'],
    trait: { name: 'Ejército Patriota', desc: '+1 movement for land units', fx: { landMoves: 1 } },
    uu: { base: 'cavalry', name: 'Llanero', str: 36, desc: 'Plains rider' }, ub: null,
    cities: ['Bogotá', 'Caracas', 'Quito', 'Panama City', 'Medellín', 'Cali', 'Maracaibo', 'Guayaquil', 'Cartagena', 'Valencia'] });
  C('tibet', { name: 'Tibetan Empire', adj: 'Tibetan', leader: 'Songtsen Gampo', title: 'Tsenpo', reign: '618–650', col: ['#c06a2a', '#f2f2f2'],
    trait: { name: 'Roof of the World', desc: 'Hills give +1 Faith; +15% Faith', fx: { hillsFaith: 1, faithPct: 15 } },
    uu: { base: 'horseman', name: 'Tibetan Lancer', str: 14, desc: 'Mountain rider' }, ub: null,
    cities: ['Lhasa', 'Shigatse', 'Gyantse', 'Tsetang', 'Chamdo', 'Nagqu', 'Yarlung', 'Sakya', 'Gartok', 'Nyingchi'] });
  C('bulgaria', { name: 'First Bulgarian Empire', adj: 'Bulgarian', leader: 'Simeon I', title: 'Tsar', reign: '893–927', col: ['#2a7a3a', '#f0f0f0'],
    trait: { name: 'Golden Age of Bulgarian Culture', desc: '+15% Culture; +10% combat vs cities', fx: { culturePct: 15, vsCityPct: 10 } },
    uu: { base: 'horseman', name: 'Bagatur', str: 14, desc: 'Steppe cavalry' }, ub: null,
    cities: ['Preslav', 'Pliska', 'Ohrid', 'Tarnovo', 'Serdica', 'Philippopolis', 'Varna', 'Vidin', 'Silistra', 'Sredets'] });
  C('huns', { name: 'Huns', adj: 'Hunnic', leader: 'Attila', title: 'King', reign: '434–453', col: ['#5a3a1a', '#c8102e'],
    trait: { name: 'Scourge of God', desc: 'Raze cities twice as fast; +15% mounted', fx: { mountedPct: 15, razeFast: true } },
    uu: { base: 'chariot_archer', name: 'Horse Archer', str: 7, rs: 11, mv: 4, desc: 'No rough penalty' }, ub: null,
    cities: ['Attila\'s Court', 'Sirmium', 'Aquincum', 'Naissus', 'Singidunum', 'Viminacium', 'Carnuntum', 'Savaria'] });
  C('ethiopia_aksum', { name: 'Aksum', adj: 'Aksumite', leader: 'Ezana', title: 'Negus', reign: '320–360', col: ['#2a5aa0', '#f2c22e'],
    trait: { name: 'Stelae of Aksum', desc: '+1 Faith per city; +1 trade route', fx: { cityFaith: 1, tradeRoutes: 1 } },
    uu: { base: 'spearman', name: 'Aksumite Spearman', str: 13, desc: 'Highland spear' }, ub: null,
    cities: ['Aksum', 'Adulis', 'Yeha', 'Matara', 'Qohaito', 'Metera', 'Wolqayt', 'Debre Damo'] });
})();
