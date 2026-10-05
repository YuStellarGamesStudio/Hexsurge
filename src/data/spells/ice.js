// Ice controls space through chill; every fourth ice hit freezes via combat.js.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });
const shard = { shape: 'shard', color: '#44eaff', size: 0.85, glow: 1.8, trail: 'ice' };
const ring = { shape: 'ring', color: '#79f4ff', size: 1, glow: 1.5 };

export const ICE_SPELLS = [
  {
    id: 'ice_lance', element: 'ice', type: 'projectile',
    name: T('冰錐術', 'Ice Lance', 'アイスランス'),
    desc: T('冰錐貫穿敵群並施加寒冷，四次命中使敵人凍結。', 'Piercing icicles chill enemies; four ice hits freeze them.', '敵を貫く氷槍で冷気を与える。氷属性の攻撃が4回当たると凍結する。'),
    base: { cooldown: 0.95, damage: 15, count: 2, speed: 19, radius: 0.4, pierce: 4, life: 1.8, spread: 0.12, knock: 1 },
    perLevel: [{ damage: 4, cooldown: -0.04 }, { damage: 4, cooldown: -0.04 }, { damage: 4, count: 1 }, { damage: 4, cooldown: -0.04 }, { damage: 4, cooldown: -0.04 }, { damage: 4, cooldown: -0.03 }, { damage: 4, cooldown: -0.04 }],
    evolution: { id: 'polar_storm', passive: 'tome_haste', level: 3 }, vfx: shard,
  },
  {
    id: 'polar_storm', element: 'ice', type: 'orbit', evolvedFrom: 'ice_lance',
    name: T('極寒風暴', 'Polar Storm', '極寒の嵐'),
    desc: T('旋轉冰晶隨暴風雪向外掃蕩，凍結周圍敵群。', 'A rotating crown of shards sweeps outward through a blizzard.', '回転する氷晶が吹雪とともに外へ広がり、敵群を凍らせる。'),
    base: { cooldown: 1.3, damage: 48, count: 9, radius: 12, innerRadius: 2, sweep: 3.2, spin: 2.8, size: 0.7, hitInterval: 0.6, fieldRatio: 0.9, duration: 1.35, tick: 0.65 },
    vfx: { ...shard, size: 1.1, glow: 2 },
  },
  {
    id: 'frost_nova', element: 'ice', type: 'burst',
    name: T('冰霜新星', 'Frost Nova', 'フロストノヴァ'),
    desc: T('擴張的冰霜環推退敵人並施加寒冷。', 'An expanding frost ring chills and knocks enemies back.', '広がる霜の輪で敵を冷やし、押し戻す。'),
    base: { cooldown: 2.1, damage: 20, count: 1, radius: 10, duration: 0.65, knock: 3 },
    perLevel: [{ damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }, { damage: 6, cooldown: -0.1 }],
    evolution: { id: 'absolute_zero', passive: 'hourglass', level: 3 }, vfx: ring,
  },
  {
    id: 'absolute_zero', element: 'ice', type: 'burst', evolvedFrom: 'frost_nova',
    name: T('絕對零度', 'Absolute Zero', '絶対零度'),
    desc: T('蓄力後釋放全畫面冰封脈衝，粉碎已凍結的敵人。', 'A delayed battlefield-wide freeze pulse shatters already frozen enemies.', '力を溜めて戦場全体を凍結させ、すでに凍った敵を粉砕する。'),
    base: { cooldown: 3.2, damage: 48, count: 1, radius: 22, delay: 0.75, shatter: 2.8, freeze: 2.2, knock: 2 }, vfx: { ...ring, color: '#d7ffff', glow: 2 },
  },
  {
    id: 'glacial_ward', element: 'ice', type: 'aura',
    name: T('冰晶守護', 'Glacial Ward', '氷晶の守護'),
    desc: T('環繞冰晶與寒冷領域保護法師，定期補充小型護盾。', 'Orbiting shards and a chill field protect the mage, periodically refreshing a small shield.', '周回する氷晶と冷気の領域で身を守り、小さなシールドを定期的に補充する。'),
    // Deliberately lower-band damage: persistent control and renewable shielding supply the remaining value.
    base: { cooldown: 3, damage: 8, count: 3, radius: 11, orbitRadius: 2.2, spin: 1.7, size: 0.6, hitInterval: 0.9, shield: 8, duration: 3.05, tick: 0.85, fieldRatio: 1.3 },
    perLevel: [{ damage: 2.55, shield: 2 }, { damage: 2.55, radius: 0.1 }, { damage: 2.55, count: 1 }, { damage: 1.5625, shield: 2 }, { damage: 1.5625, radius: 0.1 }, { damage: 1.5625, count: 1 }, { damage: 1.5625, shield: 3 }],
    evolution: { id: 'frozen_bastion', passive: 'ward_amulet', level: 3 }, vfx: { ...shard, shape: 'crystal' },
  },
  {
    id: 'frozen_bastion', element: 'ice', type: 'aura', evolvedFrom: 'glacial_ward',
    name: T('冰晶堡壘', 'Frozen Bastion', '氷晶の砦'),
    desc: T('巨大冰晶堡壘持續冰封敵群、再生護盾，受擊時向外反射冰錐。', 'A crystal fortress chills a wide field, regenerates shields and reflects shards when struck.', '広大な冷気の領域と再生シールドを展開し、被弾すると氷槍を放つ。'),
    // Defence-focused evolution remains in the lower half of evolved damage targets.
    base: { cooldown: 2, damage: 34, count: 6, radius: 14, orbitRadius: 3.2, spin: 0.65, size: 0.9, hitInterval: 0.9, shield: 30, duration: 2.05, tick: 0.75, fieldRatio: 1, reflectDamage: 36, reflectCount: 10, reflectSpeed: 17, reflectLife: 1.3, reflectPierce: 2, reflectRadius: 0.4 },
    vfx: { ...shard, shape: 'crystal', size: 1.2, glow: 1.7 },
  },
];
