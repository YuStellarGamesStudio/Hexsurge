// Fire spell numbers and localized codex descriptions. Cooldown also controls orbit contact frequency.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const FIRE_SPELLS = [
  {
    id: 'fireball', element: 'fire', type: 'projectile',
    name: T('火球術', 'Fireball', 'ファイアボール'),
    desc: T('朝最近的敵人發射火球，命中時爆炸。', 'Hurls fireballs at the nearest enemy, exploding on impact.', '最寄りの敵へ火球を放ち、命中時に爆発する。'),
    base: { cooldown: 1.15, damage: 26, count: 1, speed: 13, radius: 0.45, explode: 1.4, life: 2.2, splash: 0.55, spread: 0.17, knock: 2 },
    perLevel: [
      { damage: 4, cooldown: -0.04 }, { damage: 4, count: 1 }, { damage: 4, cooldown: -0.04 },
      { damage: 4, cooldown: -0.04 }, { damage: 4, count: 1 }, { damage: 4, cooldown: -0.04 }, { damage: 5, cooldown: -0.05 },
    ],
    evolution: { id: 'meteor_rain', passive: 'power_sigil', level: 3 },
    vfx: { shape: 'flame', color: '#ff7a2a', size: 0.9, glow: 1.6, trail: 'fire' },
  },
  {
    id: 'meteor_rain', element: 'fire', type: 'burst', evolvedFrom: 'fireball',
    name: T('隕星雨', 'Meteor Rain', '流星雨'),
    desc: T('隕石轟擊敵群，落點留下持續燃燒的火海。', 'Meteors bombard the horde and leave burning ground behind.', '隕石が敵群を襲い、着弾地点に燃える大地を残す。'),
    base: { cooldown: 1.1, damage: 75, count: 3, radius: 2.6, delay: 0.7, stagger: 0.12, range: 15, scatter: 1.5, fire: 3, tick: 0.5, poolScale: 0.8, burn: 0.12, knock: 6 },
    vfx: { shape: 'flame', color: '#ff5a1a', size: 1.6, glow: 2.2, trail: 'fire' },
  },
  {
    id: 'ember_field', element: 'fire', type: 'area',
    name: T('餘燼領域', 'Ember Field', '残り火の領域'),
    desc: T('在敵群腳下鋪下餘燼池，持續灼燒踏入的敵人。', 'Places lingering ember pools beneath enemy clusters, burning foes that cross them.', '敵の群れの足元に残り火の池を作り、踏み込んだ敵を焼き続ける。'),
    base: { cooldown: 2.5, damage: 5, count: 1, radius: 2.3, duration: 3.5, tick: 0.5, range: 16 },
    perLevel: [
      { damage: 1, cooldown: -0.1 }, { damage: 1, count: 1 }, { damage: 1, cooldown: -0.1 },
      { damage: 1, cooldown: -0.1 }, { damage: 1, count: 1 }, { damage: 1, cooldown: -0.1 }, { damage: 2, cooldown: -0.15 },
    ],
    evolution: { id: 'volcano_eruption', passive: 'wide_sigil', level: 3 },
    vfx: { shape: 'disc', color: '#ff7a2a', size: 2.3, glow: 1.3 },
  },
  {
    id: 'volcano_eruption', element: 'fire', type: 'area', evolvedFrom: 'ember_field',
    name: T('火山爆發', 'Volcano Eruption', '火山噴火'),
    desc: T('熔岩池週期噴出火柱，擊退敵人並向外拋射熔岩。', 'Lava pools erupt in periodic geysers, knocking enemies back and hurling molten fragments outward.', '溶岩の池が周期的に噴き上がり、敵を押し返して溶岩の破片を飛ばす。'),
    base: { cooldown: 3, damage: 30, count: 2, radius: 2.7, duration: 4.5, tick: 0.5, range: 16, eruptionInterval: 1.5, eruptionDamage: 75, eruptionScale: 1.15, knock: 3, fragments: 5, fragmentDamage: 18, fragmentSpeed: 8, fragmentRadius: 0.3, fragmentLife: 1.2 },
    vfx: { shape: 'ring', color: '#ff5420', size: 2.7, glow: 1.6 },
  },
  {
    id: 'flame_wheel', element: 'fire', type: 'orbit',
    name: T('烈焰輪', 'Flame Wheel', '炎の輪'),
    desc: T('火焰環繞法師旋轉，灼燒接近的敵人。', 'Orbiting flames burn enemies that approach the mage.', '魔導士の周囲を巡る炎が、近づく敵を焼く。'),
    base: { cooldown: 0.7, damage: 26, count: 2, radius: 7, speed: 2.8, size: 1.4 },
    perLevel: [
      { damage: 3, cooldown: -0.025 }, { damage: 3, count: 1 }, { damage: 3, cooldown: -0.025 },
      { damage: 3, cooldown: -0.025 }, { damage: 3, count: 1 }, { damage: 3, cooldown: -0.025 }, { damage: 3, cooldown: -0.025 },
    ],
    evolution: { id: 'phoenix_ring', passive: 'echo_gem', level: 2 },
    vfx: { shape: 'flame', color: '#ff7a2a', size: 1.1, glow: 1.8, trail: 'fire' },
  },
  {
    id: 'phoenix_ring', element: 'fire', type: 'orbit', evolvedFrom: 'flame_wheel',
    name: T('鳳凰之環', 'Phoenix Ring', '不死鳥の環'),
    desc: T('鳳凰之火環繞更遠的範圍，向外射出羽焰；焚滅敵人時有機會恢復少量生命。', 'Phoenix flames circle a wider ring and launch fiery feathers outward; their kills can restore a little health.', '不死鳥の炎が大きな環を描き、外へ炎の羽を放つ。敵を倒すと時折、少量の体力を回復する。'),
    base: { cooldown: 1.1, damage: 80, count: 5, radius: 8, speed: 3.2, size: 0.8, hitInterval: 0.45, featherDamage: 45, featherSpeed: 12, featherRadius: 0.35, featherLife: 1.5, featherPierce: 1, healChance: 0.15, heal: 1, flourishScale: 1.1 },
    vfx: { shape: 'crescent', color: '#ffbc36', size: 1.5, glow: 2, trail: 'fire' },
  },
];
