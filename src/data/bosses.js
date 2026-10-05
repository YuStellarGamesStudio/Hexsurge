// Five bosses, one per map (§3.8). The same boss returns at 8:00 / 14:00 / 18:00 in escalating tiers:
//   tier 1 = patterns[0..1], tier 2 = + summons and patterns[2], tier 3 = every pattern + enrage phase.
// Fight length guardrail 45-180 s: hp is tuned against the reference build (see tools/balance.mjs).
// Boss brains (pattern code) live in src/sim/bosses/<id>.js.

const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const BOSSES = Object.freeze([
  {
    id: 'fallen_archmage', map: 'academy', radius: 1.4, speed: 2.4, contactDamage: 18,
    hp: [26000, 60000, 160000], enrageAt: 0.3,
    color: '#5b4aa8', accent: '#f4e3a0',
    name: T('墮落院長 馬爾沃蘭', 'Malvoran, the Fallen Headmaster', '堕ちた学院長マルヴォラン'),
    desc: T('曾守護學院的首席大法師，被禁書侵蝕後化為魔潮的先鋒。', 'The archmage who once guarded the academy, consumed by a forbidden tome and turned into the tide\'s herald.', 'かつて学院を守った大魔導師。禁書に蝕まれ、魔潮の先触れとなった。'),
    patterns: ['arcane_rings', 'rune_seals', 'summon_constructs', 'barrage_spiral'],
    attacks: {
      movement: { distance: 10, teleportCd: 11, teleportWarn: 1, teleportRadius: 12 },
      arcane_rings: { cooldown: 4.8, warn: 0.9, count: 16, extra: 4, gap: 3, speed: 5.6, damage: 11, life: 6, radius: 0.32 },
      rune_seals: { cooldown: 6.4, warn: 1.2, count: 3, radius: 2.2, spacing: 4.8, damage: 19 },
      summon_constructs: { cooldown: 15, count: 3, ids: ['imp', 'ghoul', 'revenant'] },
      barrage_spiral: { cooldown: 10, duration: 3.2, interval: 0.22, rotation: 0.32, arms: 2, extra: 1, speed: 6.2, damage: 10, life: 5, radius: 0.28 },
    },
  },
  {
    id: 'rotwood_king', map: 'forest', radius: 1.9, speed: 1.8, contactDamage: 14,
    hp: [32000, 55000, 150000], enrageAt: 0.3,
    color: '#3c5a34', accent: '#7affd0',
    name: T('朽木之王', 'The Rotwood King', '朽ち木の王'),
    desc: T('被腐化侵蝕的古老樹靈，根鬚與孢子是它的武器。', 'An ancient tree spirit twisted by corruption, armed with roots and spores.', '腐敗に蝕まれた古の樹霊。根と胞子が武器。'),
    patterns: ['root_eruption', 'spore_cloud', 'seed_barrage', 'treant_call'],
    attacks: {
      root_eruption: { cooldown: 5.8, warn: 1.4, count: 7, spacing: 2.6, radius: 1.2, damage: 8 },
      spore_cloud: { cooldown: 7.2, warn: 1.5, radius: 2.6, life: 6, tick: 0.8, damage: 2, slow: 0.12, offset: 4.5 },
      seed_barrage: { cooldown: 4.8, count: 7, extra: 2, spread: 1.5, speed: 5.2, damage: 5, life: 6, radius: 0.32 },
      treant_call: { cooldown: 16, count: 2, finalCount: 4, ids: ['slime', 'ghoul'] },
    },
  },
  {
    id: 'rimewing', map: 'tundra', radius: 1.7, speed: 3.2, contactDamage: 4,
    hp: [23000, 55000, 160000], enrageAt: 0.3,
    color: '#8fc8f0', accent: '#ffffff',
    name: T('霜翼冰龍', 'Rimewing, the Glacial Wyrm', '霜翼の氷竜リムウィング'),
    desc: T('盤踞冰封高原的古龍，吐息能凍結一切。', 'An ancient wyrm that rules the frozen plateau; its breath freezes everything.', '氷の高原に君臨する古竜。その息吹はすべてを凍らせる。'),
    patterns: ['frost_breath', 'icicle_rain', 'blizzard_dash', 'ice_golems'],
    attacks: {
      movement: { distance: 5.5, strafe: 0.4 },
      frost_breath: { cooldown: 5.5, warn: 1.4, rows: 5, spacing: 2.3, radius: 1.1, width: 0.45, damage: 3, bullets: 5, extra: 2, spread: 0.9, speed: 5.5, life: 5 },
      icicle_rain: { cooldown: 7, warn: 1.5, count: 5, radius: 1.3, spread: 6, damage: 3 },
      blizzard_dash: { cooldown: 9, warn: 1.2, duration: 0.9, speed: 18, extension: 5, spacing: 2, radius: 1.2 },
      ice_golems: { cooldown: 17, count: 2, finalCount: 4, id: 'fangwolf' },
    },
  },
  {
    id: 'ignarok', map: 'abyss', radius: 2.2, speed: 1.6, contactDamage: 30,
    hp: [19000, 40000, 150000], enrageAt: 0.3,
    color: '#4a2f2a', accent: '#ff7a1a',
    name: T('熔核泰坦 伊格納洛克', 'Ignarok, the Molten Titan', '溶核のタイタン イグナロク'),
    desc: T('自熔火深淵甦醒的玄武岩巨人，每一步都讓大地噴湧熔岩。', 'A basalt giant awakened from the molten abyss; every step makes lava erupt.', '溶火の深淵から目覚めた玄武岩の巨人。一歩ごとに溶岩が噴き出す。'),
    patterns: ['ground_slam', 'lava_pools', 'fire_ring_volley', 'magma_bombers'],
    attacks: {
      stopDistance: 7, windupSpeed: 0.2,
      ground_slam: { cooldown: 8, warn: 1.4, radius: 4, damage: 16, count: 18, extra: 6, gap: 4, speed: 4.5, life: 6, bulletDamage: 6, bulletRadius: 0.32 },
      lava_pools: { cooldown: 6.5, warn: 1.4, radius: 2.1, life: 5, damage: 4, tick: 0.9, count: 2, extra: 1, spacing: 4 },
      fire_ring_volley: { cooldown: 6, warn: 1.1, count: 22, extra: 6, gap: 5, speed: 5.5, life: 5, damage: 5, bulletRadius: 0.3, volleys: 2, interval: 0.6, rotation: 0.12 },
      magma_bombers: { cooldown: 17, warn: 1.4, radius: 1.8, spawnRadius: 4, count: 2, eliteCount: 2 },
      bulletSize: 0.7, bulletGlow: 1.7,
    },
  },
  {
    id: 'nullgaze', map: 'void', radius: 1.6, speed: 2.0, contactDamage: 26,
    hp: [23000, 48000, 120000], enrageAt: 0.3,
    color: '#2a1d55', accent: '#ff7ad9',
    name: T('虛空君主 努爾凝視', 'Nullgaze, the Void Sovereign', '虚空の君主ヌルゲイズ'),
    desc: T('漂浮於浮島之上的巨眼，注視之處萬物歸於虛無。', 'A colossal eye drifting above the isles; whatever it gazes upon fades to nothing.', '浮島の上を漂う巨大な眼。見つめられたものは無に還る。'),
    patterns: ['gravity_wells', 'gaze_sweep', 'rift_summons', 'void_spiral'],
    attacks: {
      orbitDistance: 7, orbitRate: 0.22, windupSpeed: 0.25,
      gravity_wells: { cooldown: 8.5, warn: 1.4, radius: 3.5, coreRadius: 1.2, life: 4, damage: 3, tick: 1, pull: 1.2, count: 2, extra: 1, spacing: 6 },
      gaze_sweep: { cooldown: 9, warn: 1.5, radius: 0.75, step: 1.4, length: 11, slices: 5, arc: 0.85, interval: 0.2, active: 0.16, damage: 4, speed: 6, bulletRadius: 0.26, life: 4, extra: 1 },
      rift_summons: { cooldown: 16, warn: 1.4, radius: 2, spawnRadius: 4, count: 3, eliteCount: 1 },
      void_spiral: { cooldown: 7, duration: 2.4, interval: 0.26, arms: 3, extra: 1, rotation: 0.3, speed: 5, life: 5, damage: 5, bulletRadius: 0.26 },
      bulletSize: 0.65, bulletGlow: 1.8,
    },
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
