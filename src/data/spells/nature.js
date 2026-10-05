// Nature balance and presentation. Damage/count or damage/frequency improve at every level.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });
const green = '#7dff8a';
const patch = { shape: 'thorn_patch', color: green, size: 1.2, glow: 1.7, trail: 'nature' };
const wolf = { shape: 'wolf', color: green, size: 1.1, glow: 1.6, trail: 'nature' };
const leaf = { shape: 'leaf', color: green, size: 0.8, glow: 1.9, trail: 'nature', spin: 8 };
export const NATURE_SPELLS = [
  {
    id: 'thorn_field', element: 'nature', type: 'area',
    name: T('荊棘叢生', 'Thorn Field', '茨の領域'),
    desc: T('敵群腳下長出荊棘，持續造成傷害並減速。', 'Growing thorn patches damage and slow enemies beneath the horde.', '敵の足元に茨が生い茂り、継続ダメージと減速を与える。'),
    base: { cooldown: 2.8, damage: 12, count: 1, radius: 2.7, duration: 3.1, tick: 0.55, slow: 0.8, range: 18, growth: 0.6, initialRadius: 0.45 },
    perLevel: [{ damage: 4, cooldown: -0.12 }, { damage: 4, cooldown: -0.12 }, { damage: 1, count: 1 }, { damage: 4, cooldown: -0.12 }, { damage: 4, cooldown: -0.12 }, { damage: 4, cooldown: -0.12 }, { damage: 4, cooldown: -0.12 }],
    evolution: { id: 'world_roots', passive: 'magnet_charm', level: 2 }, vfx: patch,
  },
  {
    id: 'world_roots', element: 'nature', type: 'area', evolvedFrom: 'thorn_field',
    name: T('世界樹根', 'World Roots', '世界樹の根'),
    desc: T('巨根沿直線與圓環破土，纏住敵群；吸取生機微量治療自身。', 'Great roots erupt in lines and rings, snaring the horde and restoring a little health.', '巨根が直線と輪を描いて噴き出し、敵を絡め取り、生命力で少量回復する。'),
    base: { cooldown: 2.5, damage: 65, count: 5, radius: 3.4, duration: 2.6, tick: 0.6, slow: 1.2, range: 18, spacing: 2.4, ringRadius: 3.8, delay: 0.08, heal: 2, growth: 0.35, initialRadius: 0.35 },
    vfx: { ...patch, shape: 'world_root', size: 2, glow: 2.2 },
  },
  {
    id: 'spirit_wolf', element: 'nature', type: 'summon',
    name: T('靈狼', 'Spirit Wolf', '精霊狼'),
    desc: T('召喚靈狼追獵敵人，失去的靈狼會自動補足。', 'Summons hunting spirit wolves and replenishes the pack automatically.', '敵を追う精霊狼を召喚し、失った狼を自動で補充する。'),
    base: { damage: 12, count: 2, speed: 10, radius: 0.75, life: 30, hitInterval: 0.6, range: 22, spawnRadius: 1.2 },
    perLevel: [{ damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }, { damage: 2, count: 0.25 }],
    evolution: { id: 'fenrir_pack', passive: 'vitality', level: 2 }, vfx: wolf,
  },
  {
    id: 'fenrir_pack', element: 'nature', type: 'summon', evolvedFrom: 'spirit_wolf',
    name: T('魔狼群', 'Fenrir Pack', 'フェンリルの群れ'),
    desc: T('召喚魔狼群與巨型頭狼；嚎叫暫時提升全體狼的傷害與速度。', 'Summons a pack led by a mighty alpha whose howl boosts every wolf’s damage and speed.', '巨大な頭狼率いる群れを召喚。遠吠えで全ての狼の威力と速度が一時的に上がる。'),
    base: { cooldown: 5, damage: 35, count: 6, speed: 11, radius: 0.85, life: 30, hitInterval: 0.6, range: 24, spawnRadius: 1.6, howlDuration: 2.6, howlDamage: 1.45, howlSpeed: 1.35, alphaDamage: 1.5, alphaSize: 1.5, howlRadius: 4 },
    vfx: { ...wolf, size: 1.25, glow: 2 },
  },
  {
    id: 'razor_leaf', element: 'nature', type: 'chain',
    name: T('飛葉刃', 'Razor Leaf', 'リーフカッター'),
    desc: T('發射鋒利葉刃，在不同敵人之間反覆彈射。', 'Fires sharp leaf blades that ricochet between different enemies.', '鋭い葉の刃を放ち、敵から敵へ跳ね返らせる。'),
    base: { cooldown: 1.3, damage: 18, count: 1, speed: 17, radius: 0.45, life: 3, bounces: 3, spread: 0.16 },
    perLevel: [{ damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }, { damage: 6, cooldown: -0.05 }],
    evolution: { id: 'blade_tempest', passive: 'wind_boots', level: 2 }, vfx: leaf,
  },
  {
    id: 'blade_tempest', element: 'nature', type: 'chain', evolvedFrom: 'razor_leaf',
    name: T('葉刃風暴', 'Blade Tempest', '葉刃の嵐'),
    desc: T('葉刃螺旋向外散開，化為追逐敵群的彈射風暴。', 'Leaf blades spiral outward, then ricochet through the horde in a cutting tempest.', '葉の刃が螺旋状に広がり、敵群を跳ね回る嵐となる。'),
    base: { cooldown: 1.65, damage: 32, count: 7, speed: 15, radius: 0.5, life: 3.6, bounces: 4, spiralDuration: 0.5, spiralSpeed: 3.5, seekRange: 22 },
    vfx: { ...leaf, size: 1, glow: 2.3 },
  },
];
