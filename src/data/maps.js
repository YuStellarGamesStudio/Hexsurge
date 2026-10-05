// Five maps (R15). Palette per §4. `hazards` params are interpreted in src/sim/hazards.js, scenery by src/render/maps.
// themeWeights multiply the spawn-table family weights, giving each map a themed spawn mix.

const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const MAPS = Object.freeze([
  {
    id: 'academy', boss: 'fallen_archmage', unlock: null,
    name: T('魔法學院', 'Arcane Academy', '魔法学院'),
    desc: T('米白石砌與靛藍旗幟的校園廣場。符文塔樓週期性脈動，傷害踏入圈內者。', 'A cream-stone campus plaza hung with indigo banners. Rune pylons pulse periodically, hurting anyone inside.', '乳白の石畳と藍の旗がはためく学院の広場。ルーン塔が周期的に脈動し、範囲内の者を傷つける。'),
    palette: { ground: '#d9cfb8', ground2: '#bfb398', accent: '#3b3f9a', fog: '#c9c6e0', sky: ['#7f86d8', '#eae3d2'], glow: '#7a86ff', prop: '#e8e0cc', prop2: '#4a4fb0' },
    accel: 60, obstacleCount: 12, obstacleRadius: [0.9, 1.5], obstacleKinds: ['pillar', 'statue', 'bookpile'],
    hazards: [{ kind: 'rune_pylon', every: 22, count: 2, radius: 4.2, warn: 1.6, active: 0.5, damage: 14 }],
    themeWeights: { swarm: 1, fast: 1, tank: 1, ranged: 1.2, split: 1, exploder: 1, flyer: 1, buffer: 1, healer: 1, summoner: 1.1 },
    music: ['academy-1', 'academy-2'],
  },
  {
    id: 'forest', boss: 'rotwood_king', unlock: { kind: 'bossKill', map: 'academy' },
    name: T('腐化森林', 'Blighted Forest', '腐敗の森'),
    desc: T('墨綠枯木與螢光青孢子。毒孢子雲緩慢飄移，吸入者持續受創。', 'Ink-green dead trees and glowing cyan spores. Poison spore clouds drift slowly, hurting anyone breathing them.', '墨緑の枯れ木と蛍光の青い胞子。毒胞子の雲がゆっくり漂い、吸い込む者を蝕む。'),
    palette: { ground: '#1f3a2a', ground2: '#2c4d36', accent: '#58f0d0', fog: '#12281f', sky: ['#0b1a14', '#2b5a48'], glow: '#58f0d0', prop: '#2e4a3a', prop2: '#58f0d0' },
    accel: 60, obstacleCount: 20, obstacleRadius: [0.8, 1.6], obstacleKinds: ['deadtree', 'stump', 'mushroom'],
    hazards: [{ kind: 'spore_cloud', every: 16, count: 2, radius: 3.6, life: 12, drift: 0.9, damage: 5, tick: 0.5 }],
    themeWeights: { swarm: 1.3, fast: 1, tank: 0.9, ranged: 0.9, split: 1.6, exploder: 1, flyer: 1.2, buffer: 0.8, healer: 1.2, summoner: 1.6 },
    music: ['forest-1', 'forest-2'],
  },
  {
    id: 'tundra', boss: 'rimewing', unlock: { kind: 'bossKill', map: 'forest' },
    name: T('冰封高原', 'Frozen Plateau', '氷結の高原'),
    desc: T('冰藍與雪白的凜冽高地。腳下冰面濕滑，暴風雪週期性推著你前進。', 'A bitter highland of ice blue and snow white. The ice underfoot is slick, and blizzard gusts shove you around.', '氷青と雪白の凛冽な高地。足元の氷は滑りやすく、吹雪が周期的に体を押す。'),
    palette: { ground: '#dcecf7', ground2: '#b8d4ea', accent: '#4aa8e8', fog: '#cfe4f4', sky: ['#5a9ad0', '#f2f8ff'], glow: '#8fe3ff', prop: '#c4def2', prop2: '#6ab8f0' },
    accel: 14, obstacleCount: 16, obstacleRadius: [0.9, 1.7], obstacleKinds: ['iceboulder', 'pine', 'crystal'],
    hazards: [{ kind: 'blizzard', every: 20, duration: 5, force: 3.2, warn: 1.8 }],
    themeWeights: { swarm: 1, fast: 1.5, tank: 1.3, ranged: 1, split: 0.8, exploder: 0.8, flyer: 1, buffer: 1.2, healer: 1, summoner: 0.9 },
    music: ['tundra-1', 'tundra-2'],
  },
  {
    id: 'abyss', boss: 'ignarok', unlock: { kind: 'bossKill', map: 'tundra' },
    name: T('熔火深淵', 'Molten Abyss', '溶火の深淵'),
    desc: T('玄武岩黑與熔岩橙。地面週期性噴發熔岩，預警圈消失後即造成重傷。', 'Basalt black and lava orange. The ground erupts periodically; when the warning ring fades, it deals heavy damage.', '玄武岩の黒と溶岩のオレンジ。地面が周期的に噴火し、警告円が消えると大ダメージ。'),
    palette: { ground: '#2a2420', ground2: '#3d322b', accent: '#ff7a1a', fog: '#2a1410', sky: ['#1a0a08', '#6a2a10'], glow: '#ff7a1a', prop: '#4a3a30', prop2: '#ff7a1a' },
    accel: 60, obstacleCount: 16, obstacleRadius: [0.9, 1.8], obstacleKinds: ['basalt', 'lavarock', 'spire'],
    hazards: [{ kind: 'lava_burst', every: 8, count: 3, radius: 2.6, warn: 1.6, damage: 18 }],
    themeWeights: { swarm: 1, fast: 0.9, tank: 1.2, ranged: 1.2, split: 0.8, exploder: 1.8, flyer: 0.9, buffer: 1.2, healer: 0.7, summoner: 0.9 },
    music: ['abyss-1', 'abyss-2'],
  },
  {
    id: 'void', boss: 'nullgaze', unlock: { kind: 'bossKill', map: 'abyss' },
    name: T('虛空浮島', 'Void Isles', '虚空の浮島'),
    desc: T('深紫、星海藍與水晶粉的浮空群島。虛空裂隙吸引萬物並傷害中心。', 'Floating isles of deep purple, starry blue and crystal pink. Void rifts pull everything in and hurt at the core.', '深紫・星海の青・水晶ピンクの浮遊群島。虚空の裂け目が全てを引き寄せ、中心で傷つける。'),
    palette: { ground: '#2a1d4a', ground2: '#3a2a66', accent: '#ff7ad9', fog: '#1a1236', sky: ['#07041a', '#2a2a7a'], glow: '#ff7ad9', prop: '#4a3a7a', prop2: '#ff7ad9' },
    accel: 60, obstacleCount: 14, obstacleRadius: [0.8, 1.6], obstacleKinds: ['crystalspire', 'floatrock', 'obelisk'],
    hazards: [{ kind: 'void_rift', every: 24, count: 1, radius: 7, life: 9, pull: 4.5, damage: 12, tick: 0.4 }],
    themeWeights: { swarm: 0.9, fast: 1.1, tank: 1, ranged: 1.1, split: 1.4, exploder: 1, flyer: 1.6, buffer: 1.2, healer: 1.5, summoner: 1.2 },
    music: ['void-1', 'void-2'],
  },
]);

export const MAP_BY_ID = Object.freeze(Object.fromEntries(MAPS.map((m) => [m.id, m])));
