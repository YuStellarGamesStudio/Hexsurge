// Thunder: chaining arcs, telegraphed columns, and diving familiars.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });
const vfx = (shape, size, glow = 1.8) => ({ shape, color: '#ffe34c', size, glow, trail: 'thunder' });
const growth = (damage, cooldown) => Array.from({ length: 7 }, () => ({ damage, cooldown }));
export const THUNDER_SPELLS = [
  {
    id: 'chain_lightning', element: 'thunder', type: 'chain',
    name: T('連鎖閃電', 'Chain Lightning', '連鎖雷撃'),
    desc: T('閃電在附近敵人之間跳躍，同一次連鎖不會重複命中。', 'Lightning jumps between nearby enemies, striking each target once per chain.', '雷が近くの敵へ次々と跳び、一つの連鎖で同じ敵には当たらない。'),
    base: { cooldown: 1.2, damage: 29, count: 1, jumps: 3, range: 20, jumpRange: 7, arcLife: 0.22 },
    perLevel: growth(8, -0.065),
    evolution: { id: 'storm_wrath', passive: 'twin_crest', level: 2 }, vfx: vfx('bolt', 0.8),
  },
  {
    id: 'storm_wrath', element: 'thunder', type: 'chain', evolvedFrom: 'chain_lightning',
    name: T('雷神之怒', 'Storm Wrath', '雷神の怒り'),
    desc: T('多道閃電同時連鎖，末端留下持續放電的雷場。', 'Unleashes simultaneous lightning chains that leave crackling fields at their endpoints.', '複数の雷が同時に連鎖し、終点に放電し続ける雷域を残す。'),
    base: { cooldown: 0.95, damage: 62, count: 3, jumps: 4, range: 22, jumpRange: 8, arcLife: 0.3, radius: 2.7, duration: 1.6, tick: 0.4, fieldDamage: 9 }, vfx: vfx('bolt', 1.4, 2.3),
  },
  {
    id: 'thunderstrike', element: 'thunder', type: 'burst',
    name: T('落雷術', 'Thunderstrike', '落雷'),
    desc: T('短暫預警後，雷柱轟擊隨機敵人周圍。', 'After a brief warning, lightning strikes around randomly chosen enemies.', '短い予兆の後、無作為に選んだ敵の周囲に雷が落ちる。'),
    base: { cooldown: 1.5, damage: 16, count: 2, radius: 2.2, delay: 0.4, range: 20, arcLife: 0.2, columnLength: 1.5 },
    perLevel: growth(4, -0.07),
    evolution: { id: 'sky_judgement', passive: 'clover', level: 3 }, vfx: vfx('bolt', 1.1),
  },
  {
    id: 'sky_judgement', element: 'thunder', type: 'burst', evolvedFrom: 'thunderstrike',
    name: T('天罰', 'Sky Judgement', '天罰'),
    desc: T('巨型雷柱清掃大片敵群，餘震接連炸開。', 'Vast lightning columns scour the horde, followed by successive electric aftershocks.', '巨大な雷柱が敵群を薙ぎ払い、続けて電撃の余震が炸裂する。'),
    base: { cooldown: 1.6, damage: 90, count: 3, radius: 4, delay: 0.65, range: 22, arcLife: 0.3, columnLength: 3.4, aftershocks: 2, aftershockDelay: 0.32, aftershockDamage: 15 }, vfx: vfx('bolt', 2.4, 2.4),
  },
  {
    id: 'thunder_hawk', element: 'thunder', type: 'summon',
    name: T('雷隼', 'Thunder Hawk', '雷隼'),
    desc: T('召喚雷隼盤旋並俯衝穿過敵群。', 'Summons lightning hawks that circle you and dive through enemies.', '雷隼を召喚し、周囲を旋回させて敵群へ急降下させる。'),
    base: { damage: 22, count: 2, cooldown: 0.9, speed: 9, radius: 1.4, range: 22, life: 120, hitInterval: 0.4, arcLife: 0.18 },
    perLevel: growth(4, -0.045),
    evolution: { id: 'storm_roc', passive: 'wind_boots', level: 3 }, vfx: vfx('hawk', 1.2),
  },
  {
    id: 'storm_roc', element: 'thunder', type: 'summon', evolvedFrom: 'thunder_hawk',
    name: T('暴風雷鵬', 'Storm Roc', '嵐の雷鵬'),
    desc: T('巨型雷鵬俯衝掃出雷電長線，並投下落雷。', 'Great storm rocs sweep lines of lightning through the horde and drop thunderbolts.', '巨大な雷鵬が雷の軌跡で敵群を貫き、落雷を降らせる。'),
    base: { damage: 100, count: 2, cooldown: 0.65, speed: 10, radius: 2.4, range: 24, life: 120, hitInterval: 0.45, arcLife: 0.24, boltInterval: 0.8, boltDamage: 42, boltRadius: 2.5, boltDelay: 0.28, columnLength: 2 }, vfx: vfx('stormRoc', 2.7, 2.2),
  },
];
