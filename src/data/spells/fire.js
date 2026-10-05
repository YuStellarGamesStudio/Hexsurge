// Fire (火). REFERENCE IMPLEMENTATION of the spell contract: fireball (projectile) with evolution meteor_rain.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const FIRE_SPELLS = [
  {
    id: 'fireball', element: 'fire', type: 'projectile',
    name: T('火球術', 'Fireball', 'ファイアボール'),
    desc: T('朝最近的敵人發射火球，命中時爆炸。', 'Hurls a fireball at the nearest enemy that explodes on impact.', '最寄りの敵へ火球を放ち、命中時に爆発する。'),
    base: { cooldown: 1.15, damage: 17, count: 1, speed: 13, radius: 0.45, explode: 1.4, life: 2.2 },
    perLevel: [
      { damage: 5, count: 0, cooldown: 0 },
      { damage: 0, cooldown: -0.12 },
      { damage: 6, explode: 0.2 },
      { count: 1, cooldown: 0 },
      { damage: 7, cooldown: -0.12 },
      { count: 1, damage: 0 },
      { damage: 9, cooldown: -0.15 },
    ],
    evolution: { id: 'meteor_rain', passive: 'power_sigil', level: 3 },
    vfx: { shape: 'orb', color: '#ff7a2a', size: 0.9, glow: 1.6, trail: 'fire' },
  },
  {
    id: 'meteor_rain', element: 'fire', type: 'burst', evolvedFrom: 'fireball',
    name: T('隕星雨', 'Meteor Rain', '流星雨'),
    desc: T('天降隕石砸向敵群，落點留下燃燒的火海。', 'Meteors rain onto the horde, leaving burning ground where they land.', '隕石が敵群に降り注ぎ、着弾地点に燃える大地を残す。'),
    base: { cooldown: 0.9, damage: 46, count: 3, radius: 2.6, delay: 0.7, range: 15, fire: 3.0 },
    vfx: { shape: 'orb', color: '#ff5a1a', size: 1.6, glow: 2.2, trail: 'fire' },
  },
];
