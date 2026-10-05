// Void damage is unamplified here; erosion is a shared team bonus in combat.js.
// Entropy Aura trades focused damage for continuous control; its broad reach keeps kiting viable.
const T = (zh, en, ja) => Object.freeze({ zh, en, ja });
const vfx = (shape, size, glow = 1.6) => ({ shape, color: '#ff7ad9', size, glow, trail: 'void' });
export const VOID_SPELLS = [
  {
    id: 'void_rift', element: 'void', type: 'area',
    name: T('虛空裂隙', 'Void Rift', '虚空の裂け目'),
    desc: T('在敵群中撕開裂隙，拉扯並侵蝕敵人。', 'Tears a rift into an enemy cluster, pulling enemies in and eroding them.', '敵の群れに裂け目を開き、引き寄せて侵蝕する。'),
    base: { cooldown: 3.2, damage: 7, count: 1, radius: 3.4, duration: 2.8, tick: 0.5, pull: 4.2, range: 20 },
    perLevel: Array.from({ length: 7 }, (_, i) => ({ damage: i < 3 ? 6 : 3.5, cooldown: -0.15 })),
    evolution: { id: 'black_hole', passive: 'echo_gem', level: 3 }, vfx: vfx('void_rift', 3.4),
  },
  {
    id: 'black_hole', element: 'void', type: 'area', evolvedFrom: 'void_rift',
    name: T('黑洞', 'Black Hole', 'ブラックホール'),
    desc: T('奇點將整片戰場拖向核心，持續碾壓後坍縮爆發。', 'A singularity drags the battlefield inward, crushing enemies before collapsing in a burst.', '特異点が戦場全体を引き寄せ、敵を押し潰してから崩壊爆発する。'),
    base: { cooldown: 6, damage: 12, count: 1, radius: 19, coreRadius: 4.5, duration: 3.5, tick: 0.5, pull: 8, collapseDamage: 85, collapseRadius: 7, range: 14 }, vfx: vfx('void_singularity', 4.5, 2.2),
  },
  {
    id: 'shadow_familiar', element: 'void', type: 'summon',
    name: T('暗影使魔', 'Shadow Familiar', '影の使い魔'),
    desc: T('召喚環繞法師的使魔，向敵人射出侵蝕暗影彈。', 'Orbiting familiars fire eroding shadow bolts at nearby enemies.', '魔術師の周りを巡る使い魔が、敵へ侵蝕の影弾を放つ。'),
    base: { damage: 22, count: 2, speed: 9, radius: 0.45, life: 120, range: 22, fireInterval: 0.9, shotSpeed: 18, shotRadius: 0.35, shotLife: 2, pierce: 0 },
    perLevel: Array.from({ length: 7 }, () => ({ damage: 3.5, count: 0.4 })),
    evolution: { id: 'shadow_legion', passive: 'scholar_lens', level: 3 }, vfx: vfx('void_familiar', 0.65),
  },
  {
    id: 'shadow_legion', element: 'void', type: 'summon', evolvedFrom: 'shadow_familiar',
    name: T('暗影軍團', 'Shadow Legion', '影の軍団'),
    desc: T('暗影戰士與法師列陣出擊，擊殺敵人會喚起更多士兵。', 'Shadow soldiers and mages form a legion; fallen enemies raise new recruits.', '影の兵士と魔術師が軍団を組み、倒れた敵から増援が生まれる。'),
    base: { damage: 37, count: 8, maxCount: 12, killsPerRecruit: 8, meleeEvery: 3, speed: 11, radius: 0.65, life: 120, range: 24, fireInterval: 0.8, hitInterval: 0.5, shotSpeed: 20, shotRadius: 0.4, shotLife: 2, pierce: 1, formationRadius: 2.6 }, vfx: vfx('skull', 0.85, 2),
  },
  {
    id: 'entropy_aura', element: 'void', type: 'aura',
    name: T('熵蝕光環', 'Entropy Aura', '崩壊のオーラ'),
    desc: T('周身衰敗力場持續傷害、減速並侵蝕附近敵人。', 'A field of decay damages, slows, and erodes enemies around the mage.', '周囲の崩壊領域が敵に継続ダメージ、減速、侵蝕を与える。'),
    base: { cooldown: 0.5, damage: 12, count: 1, radius: 10, duration: 0.49, tick: 0.5, slow: 0.8 },
    perLevel: Array.from({ length: 7 }, () => ({ damage: 2.5, radius: 0.1 })),
    evolution: { id: 'heat_death', passive: 'hourglass', level: 2 }, vfx: vfx('void_entropy', 10, 1.3),
  },
  {
    id: 'heat_death', element: 'void', type: 'aura', evolvedFrom: 'entropy_aura',
    name: T('熱寂', 'Heat Death', '熱的死'),
    desc: T('擴散的熵波抹除敵彈、短暫停滯敵人，重創衰弱目標。', 'Expanding entropy waves erase enemy shots, briefly arrest enemies, and devastate weakened targets.', '広がるエントロピー波が敵弾を消し、敵の動きを止め、弱った敵を壊滅させる。'),
    base: { cooldown: 2.8, damage: 68, count: 1, radius: 12, startRadius: 1.2, duration: 1.6, tick: 0.15, freeze: 0.6, bossFreezeScale: 0.2, weakThreshold: 0.4, weakMultiplier: 2.2 }, vfx: vfx('void_entropy', 12, 1.8),
  },
];
