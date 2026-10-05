// Arcane damage centrally applies attunement (combat.js). Barrier level 1/4 output trades damage for shielding; the aegis adds bullet absorption.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });
export const ARCANE_SPELLS = [
  {
    id: 'arcane_missiles', element: 'arcane', type: 'projectile',
    name: T('奧術飛彈', 'Arcane Missiles', '魔力の矢'),
    desc: T('齊射追蹤飛彈，調和命中的敵人以促進元素反應。', 'Fires homing volleys that attune enemies, increasing elemental reactions.', '追尾する魔力の矢を斉射し、命中した敵を調和させて元素反応を促す。'),
    base: { cooldown: 1.2, damage: 32, count: 3, speed: 15, radius: 0.3, life: 2.4, homing: 7, spread: 0.24 },
    perLevel: [{ damage: 5, cooldown: -0.05 }, { damage: 5, count: 1 }, { damage: 6, cooldown: -0.05 }, { damage: 3, cooldown: -0.03 }, { damage: 3, cooldown: -0.03 }, { damage: 3, cooldown: -0.03 }, { damage: 3, cooldown: -0.03 }],
    evolution: { id: 'arcane_barrage', passive: 'tome_haste', level: 4 },
    vfx: { shape: 'arcane_missile', color: '#c199ff', size: 0.65, glow: 1.5, trail: 'arcane' },
  },
  {
    id: 'arcane_barrage', element: 'arcane', type: 'projectile', evolvedFrom: 'arcane_missiles',
    name: T('奧能彈幕', 'Arcane Barrage', '魔力弾幕'),
    desc: T('旋轉砲口持續射出追蹤彈頭，命中或耗盡時引爆。', 'Rotating launchers stream homing warheads that detonate on impact or expiry.', '回転する砲口から追尾弾を連射し、命中時または消滅時に爆発させる。'),
    base: { cooldown: 0.24, damage: 52, count: 2, speed: 18, radius: 0.32, life: 2, homing: 10, rotation: 3.3, launchRadius: 1.1, explode: 1.8, blastDamage: 24 },
    vfx: { shape: 'arcane_warhead', color: '#dfb8ff', size: 0.8, glow: 1.9, trail: 'arcane' },
  },
  {
    id: 'arcane_orbs', element: 'arcane', type: 'orbit',
    name: T('奧術法球', 'Arcane Orbs', '魔力の宝珠'),
    desc: T('法球環繞自身，灼擊接觸的敵人並使其調和。', 'Orbiting spheres scorch and attune enemies they touch.', '周囲を巡る宝珠が、触れた敵を焼き、調和させる。'),
    base: { damage: 28, count: 3, radius: 9, speed: 2.6, size: 1.1, hitInterval: 0.65 },
    perLevel: [{ damage: 3, count: 1 }, { damage: 3, count: 1 }, { damage: 4, count: 1 }, { damage: 1, count: 1 }, { damage: 1, count: 1 }, { damage: 1, count: 1 }, { damage: 1, count: 1 }],
    evolution: { id: 'celestial_orrery', passive: 'wide_sigil', level: 2 },
    vfx: { shape: 'arcane_planet', color: '#ad88ff', size: 1, glow: 1.4 },
  },
  {
    id: 'celestial_orrery', element: 'arcane', type: 'orbit', evolvedFrom: 'arcane_orbs',
    name: T('星象儀', 'Celestial Orrery', '天球儀'),
    desc: T('行星以不同速度沿內外軌道巡行，定期向敵人射出星芒。', 'Planets revolve at different speeds in nested orbits and periodically fire star bolts.', '内外の軌道を異なる速さで巡る惑星が、定期的に星の光を放つ。'),
    base: { cooldown: 0.5, damage: 58, count: 8, radius: 6, outerScale: 1.4, speed: 2.4, outerSpeed: -1.5, size: 0.8, outerSize: 0.65, hitInterval: 0.5, shotDamage: 65, shotCount: 4, shotSpeed: 18, shotLife: 2, homing: 8, shotRadius: 0.35 },
    vfx: { shape: 'arcane_planet', color: '#dfb8ff', size: 1.1, glow: 1.7 },
    starVfx: { shape: 'star', color: '#f0ddff', size: 0.7, glow: 1.8, trail: 'arcane' },
  },
  {
    id: 'mana_barrier', element: 'arcane', type: 'aura', noCountBonus: true,
    name: T('魔力屏障', 'Mana Barrier', '魔力障壁'),
    desc: T('旋轉符文灼傷近身敵人，並定期補充護盾。', 'Rotating runes damage nearby enemies and periodically replenish a shield.', '回転するルーンが近くの敵を傷つけ、定期的にシールドを補充する。'),
    base: { cooldown: 3, damage: 16, radius: 10, shield: 15, restore: 7, tick: 0.5, runes: 6, runeSize: 0.4, rotation: 1.2 },
    perLevel: [{ damage: 1, shield: 3 }, { damage: 1, shield: 3 }, { damage: 1, radius: 0.02 }, { damage: 3, shield: 3 }, { damage: 3, radius: 0.1 }, { damage: 3, shield: 4 }, { damage: 3, radius: 0.1 }],
    evolution: { id: 'aegis_of_mana', passive: 'vitality', level: 3 },
    vfx: { shape: 'arcane_rune', color: '#b89dff', size: 1, glow: 1.3 },
  },
  {
    id: 'aegis_of_mana', element: 'arcane', type: 'aura', evolvedFrom: 'mana_barrier', noCountBonus: true,
    name: T('魔力神盾', 'Aegis of Mana', '魔力の神盾'),
    desc: T('巨型符文神盾吸收範圍內敵彈，定期釋放衝擊波並補盾。', 'A vast rune aegis absorbs enemy bullets within its reach, releasing shockwaves and restoring shields.', '巨大なルーンの盾が範囲内の敵弾を吸収し、衝撃波を放ちながらシールドを回復する。'),
    base: { cooldown: 2.4, damage: 46, radius: 13, shield: 55, restore: 18, tick: 0.5, runes: 10, runeSize: 0.55, rotation: -0.8, shockDamage: 90, shockRadius: 15, knock: 2 },
    vfx: { shape: 'arcane_aegis', color: '#d0b2ff', size: 1, glow: 1.5 },
  },
];
