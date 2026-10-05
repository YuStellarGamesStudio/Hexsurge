// Five bosses, one per map (§3.8). The same boss returns at 8:00 / 14:00 / 18:00 in escalating tiers:
//   tier 1 = patterns[0..1], tier 2 = + summons and patterns[2], tier 3 = every pattern + enrage phase.
// Fight length guardrail 45-180 s: hp is tuned against the reference build (see tools/balance.mjs).
// Boss brains (pattern code) live in src/sim/bosses/<id>.js.

const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const BOSSES = Object.freeze([
  {
    id: 'fallen_archmage', map: 'academy', radius: 1.4, speed: 2.4, contactDamage: 18,
    hp: [7000, 17000, 34000], enrageAt: 0.3,
    color: '#5b4aa8', accent: '#f4e3a0',
    name: T('墮落院長 馬爾沃蘭', 'Malvoran, the Fallen Headmaster', '堕ちた学院長マルヴォラン'),
    desc: T('曾守護學院的首席大法師，被禁書侵蝕後化為魔潮的先鋒。', 'The archmage who once guarded the academy, consumed by a forbidden tome and turned into the tide\'s herald.', 'かつて学院を守った大魔導師。禁書に蝕まれ、魔潮の先触れとなった。'),
    patterns: ['arcane_rings', 'rune_seals', 'summon_constructs', 'barrage_spiral'],
  },
  {
    id: 'rotwood_king', map: 'forest', radius: 1.9, speed: 1.8, contactDamage: 22,
    hp: [8500, 20000, 40000], enrageAt: 0.3,
    color: '#3c5a34', accent: '#7affd0',
    name: T('朽木之王', 'The Rotwood King', '朽ち木の王'),
    desc: T('被腐化侵蝕的古老樹靈，根鬚與孢子是它的武器。', 'An ancient tree spirit twisted by corruption, armed with roots and spores.', '腐敗に蝕まれた古の樹霊。根と胞子が武器。'),
    patterns: ['root_eruption', 'spore_cloud', 'seed_barrage', 'treant_call'],
  },
  {
    id: 'rimewing', map: 'tundra', radius: 1.7, speed: 3.2, contactDamage: 24,
    hp: [8000, 19000, 38000], enrageAt: 0.3,
    color: '#8fc8f0', accent: '#ffffff',
    name: T('霜翼冰龍', 'Rimewing, the Glacial Wyrm', '霜翼の氷竜リムウィング'),
    desc: T('盤踞冰封高原的古龍，吐息能凍結一切。', 'An ancient wyrm that rules the frozen plateau; its breath freezes everything.', '氷の高原に君臨する古竜。その息吹はすべてを凍らせる。'),
    patterns: ['frost_breath', 'icicle_rain', 'blizzard_dash', 'ice_golems'],
  },
  {
    id: 'ignarok', map: 'abyss', radius: 2.2, speed: 1.6, contactDamage: 30,
    hp: [9500, 22000, 44000], enrageAt: 0.3,
    color: '#4a2f2a', accent: '#ff7a1a',
    name: T('熔核泰坦 伊格納洛克', 'Ignarok, the Molten Titan', '溶核のタイタン イグナロク'),
    desc: T('自熔火深淵甦醒的玄武岩巨人，每一步都讓大地噴湧熔岩。', 'A basalt giant awakened from the molten abyss; every step makes lava erupt.', '溶火の深淵から目覚めた玄武岩の巨人。一歩ごとに溶岩が噴き出す。'),
    patterns: ['ground_slam', 'lava_pools', 'fire_ring_volley', 'magma_bombers'],
  },
  {
    id: 'nullgaze', map: 'void', radius: 1.6, speed: 2.0, contactDamage: 26,
    hp: [10000, 24000, 48000], enrageAt: 0.3,
    color: '#2a1d55', accent: '#ff7ad9',
    name: T('虛空君主 努爾凝視', 'Nullgaze, the Void Sovereign', '虚空の君主ヌルゲイズ'),
    desc: T('漂浮於浮島之上的巨眼，注視之處萬物歸於虛無。', 'A colossal eye drifting above the isles; whatever it gazes upon fades to nothing.', '浮島の上を漂う巨大な眼。見つめられたものは無に還る。'),
    patterns: ['gravity_wells', 'gaze_sweep', 'rift_summons', 'void_spiral'],
  },
]);

export const BOSS_BY_ID = Object.freeze(Object.fromEntries(BOSSES.map((b) => [b.id, b])));
export const BOSS_BY_MAP = Object.freeze(Object.fromEntries(BOSSES.map((b) => [b.map, b])));

/** Tier scaling applied on top of difficulty hp. Rewards (xp bursts) per kill. */
export const BOSS_RULES = Object.freeze({
  tierDamage: [1, 1.25, 1.55],
  xpDrop: [150, 300, 600],
  summonCap: 14,
  enrageSpeed: 1.35,
  enrageCooldown: 0.65,
  spawnDistance: 17,
});
