// Enemy roster (§3.7): 10 families, 2-3 variants each (size / colour / stat ladder), plus two split children.
// hp/dmg are at difficulty 1 and t=0 (the director scales them). `xp` = gem value dropped.
// ai params: see src/sim/enemies.js. Colours are matte palettes read by src/render/models (main = body, accent = detail).

const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const FAMILIES = Object.freeze(['swarm', 'fast', 'tank', 'ranged', 'split', 'exploder', 'flyer', 'buffer', 'healer', 'summoner']);

export const ENEMIES = Object.freeze([
  // ---- 散兵 swarm
  { id: 'imp', family: 'swarm', tier: 1, hp: 12, speed: 2.7, dmg: 5, radius: 0.45, xp: 1,
    color: '#8a4a5e', accent: '#e8c46a',
    name: T('小鬼', 'Imp', 'インプ'),
    desc: T('魔潮中最常見的雜兵，成群湧來。', 'The most common foot soldier of the tide, arriving in packs.', '魔潮に最も多い雑兵。群れをなして押し寄せる。') },
  { id: 'ghoul', family: 'swarm', tier: 2, hp: 34, speed: 2.9, dmg: 8, radius: 0.55, xp: 3,
    color: '#5a6b4a', accent: '#c7d6a0',
    name: T('食屍鬼', 'Ghoul', 'グール'),
    desc: T('腐敗的獵食者，比小鬼更耐打。', 'A rotting predator, sturdier than the imps.', '腐敗した捕食者。インプより頑丈。') },
  { id: 'revenant', family: 'swarm', tier: 3, hp: 80, speed: 3.1, dmg: 13, radius: 0.62, xp: 8,
    color: '#4b4f6e', accent: '#9fb4ff',
    name: T('亡魂戰士', 'Revenant', 'レヴナント'),
    desc: T('被魔潮喚醒的古戰士，披著殘破鎧甲。', 'An ancient warrior woken by the tide, wearing broken armor.', '魔潮に呼び覚まされた古の戦士。ぼろぼろの鎧をまとう。') },
  // ---- 快怪 fast
  { id: 'fangwolf', family: 'fast', tier: 1, hp: 15, speed: 4.4, dmg: 6, radius: 0.5, xp: 1, ai: { lungeEvery: 3.2, lungeTime: 0.45, lungeMult: 2.0 },
    color: '#6a5a4a', accent: '#ff8a4a',
    name: T('獠牙狼', 'Fangwolf', '牙狼'),
    desc: T('速度極快，會突然撲咬。', 'Extremely fast and lunges without warning.', '非常に素早く、不意に飛びかかる。') },
  { id: 'shade_stalker', family: 'fast', tier: 3, hp: 48, speed: 5.0, dmg: 12, radius: 0.5, xp: 6, ai: { lungeEvery: 2.6, lungeTime: 0.5, lungeMult: 2.2 },
    color: '#3a3552', accent: '#c78cff',
    name: T('影獵者', 'Shade Stalker', '影の狩人'),
    desc: T('如影子般貼近獵物的暗殺者。', 'An assassin that clings to its prey like a shadow.', '影のように獲物へ忍び寄る暗殺者。') },
  // ---- 肉盾 tank
  { id: 'stone_brute', family: 'tank', tier: 1, hp: 110, speed: 1.8, dmg: 14, radius: 0.95, xp: 4, mass: 3,
    color: '#7a7468', accent: '#d8d0bc',
    name: T('石皮蠻兵', 'Stone Brute', '石皮の蛮兵'),
    desc: T('皮膚如岩石，推進緩慢卻難以擊退。', 'Rock-like hide: slow, and hard to push back.', '岩のような皮膚。遅いが押し戻しにくい。') },
  { id: 'iron_ogre', family: 'tank', tier: 2, hp: 300, speed: 1.9, dmg: 20, radius: 1.15, xp: 10, mass: 4,
    color: '#5c6270', accent: '#e0a040',
    name: T('鐵甲食人魔', 'Iron Ogre', '鉄甲のオーガ'),
    desc: T('披著鐵甲的巨漢，吃下大量傷害。', 'A hulking brute in iron plates that soaks up damage.', '鉄板をまとった巨漢。大量のダメージを受け止める。') },
  { id: 'colossus', family: 'tank', tier: 3, hp: 720, speed: 1.7, dmg: 30, radius: 1.5, xp: 24, mass: 6,
    color: '#4a4258', accent: '#ff6a3a',
    name: T('魔核巨像', 'Core Colossus', '魔核の巨像'),
    desc: T('核心燃燒著魔潮之火的巨型魔像。', 'A giant golem with the tide\'s fire burning in its core.', '核に魔潮の火を宿す巨大ゴーレム。') },
  // ---- 遠程彈幕 ranged
  { id: 'cult_archer', family: 'ranged', tier: 1, hp: 24, speed: 2.3, dmg: 7, radius: 0.5, xp: 2,
    ai: { range: 10, interval: 2.4, count: 1, spread: 0, shotSpeed: 7, shotLife: 3.5 },
    color: '#7a5a8a', accent: '#ff7ac8',
    name: T('邪教弓手', 'Cult Archer', '邪教の弓手'),
    desc: T('保持距離，朝你射出魔力箭。', 'Keeps its distance and fires bolts of dark mana.', '距離を保ち、魔力の矢を放つ。') },
  { id: 'hex_caster', family: 'ranged', tier: 2, hp: 55, speed: 2.2, dmg: 9, radius: 0.55, xp: 5,
    ai: { range: 11, interval: 2.8, count: 3, spread: 0.28, shotSpeed: 6.5, shotLife: 3.8 },
    color: '#5a4a8a', accent: '#8affc8',
    name: T('咒術師', 'Hex Caster', '呪術師'),
    desc: T('一次投出三道詛咒彈。', 'Hurls three curse bolts at once.', '一度に三発の呪弾を放つ。') },
  { id: 'arc_gunner', family: 'ranged', tier: 3, hp: 120, speed: 2.0, dmg: 14, radius: 0.7, xp: 11,
    ai: { range: 12, interval: 3.4, count: 5, spread: 0.2, shotSpeed: 5.5, shotLife: 4.2, ring: true },
    color: '#3a5a7a', accent: '#6affff',
    name: T('奧能炮手', 'Arc Gunner', 'アーク砲手'),
    desc: T('施放扇形的奧能彈幕。', 'Unleashes a fan-shaped barrage of arcane shots.', '扇状のアーケインの弾幕を放つ。') },
  // ---- 分裂 split
  { id: 'slime', family: 'split', tier: 1, hp: 42, speed: 2.2, dmg: 7, radius: 0.75, xp: 2, ai: { into: 'slime_bit', count: 2 },
    color: '#4a9a6a', accent: '#c8ffd8',
    name: T('魔漿團', 'Ooze', '魔漿'),
    desc: T('被擊殺時分裂成兩隻小魔漿。', 'Splits into two bits when killed.', '倒されると二匹の小魔漿に分裂する。') },
  { id: 'brood_mother', family: 'split', tier: 3, hp: 180, speed: 2.0, dmg: 12, radius: 1.0, xp: 9, ai: { into: 'brood_spawn', count: 4 },
    color: '#8a5a3a', accent: '#ffd08a',
    name: T('孵巢母體', 'Brood Mother', '孵巣の母体'),
    desc: T('死亡時迸出一窩幼蟲。', 'Bursts into a brood of larvae on death.', '死亡時に幼虫の群れを撒き散らす。') },
  { id: 'slime_bit', family: 'split', tier: 0, hp: 12, speed: 3.0, dmg: 4, radius: 0.4, xp: 1, child: true,
    color: '#5ab07a', accent: '#d8ffe6',
    name: T('小魔漿', 'Ooze Bit', '小魔漿'),
    desc: T('魔漿團的碎片。', 'A fragment of an ooze.', '魔漿の欠片。') },
  { id: 'brood_spawn', family: 'split', tier: 0, hp: 18, speed: 3.6, dmg: 6, radius: 0.4, xp: 1, child: true,
    color: '#a8703a', accent: '#ffe0a8',
    name: T('幼蟲', 'Larva', '幼虫'),
    desc: T('孵巢母體的後代，動作迅速。', 'Offspring of the brood mother, quick and nimble.', '孵巣の母体の子。動きが素早い。') },
  // ---- 自爆 exploder
  { id: 'bomb_imp', family: 'exploder', tier: 1, hp: 10, speed: 3.6, dmg: 24, radius: 0.45, xp: 2, ai: { fuse: 0.55, blast: 2.8, trigger: 1.5 },
    color: '#c45a3a', accent: '#ffe04a',
    name: T('爆裂小鬼', 'Bomb Imp', '爆裂インプ'),
    desc: T('靠近後引信點燃，數秒後爆炸。', 'Lights its fuse up close and explodes.', '近づくと導火線に火がつき、爆発する。') },
  { id: 'magma_bomber', family: 'exploder', tier: 3, hp: 46, speed: 3.0, dmg: 42, radius: 0.7, xp: 7, ai: { fuse: 0.8, blast: 4.0, trigger: 2.0 },
    color: '#6a3a2a', accent: '#ff7a1a',
    name: T('熔爆者', 'Magma Bomber', '溶爆者'),
    desc: T('體內蘊含熔岩，爆炸範圍極大。', 'Molten inside, with a huge blast radius.', '体内に溶岩を宿し、爆発範囲が非常に広い。') },
  // ---- 飛行 flyer（無視地形）
  { id: 'gloom_bat', family: 'flyer', tier: 1, hp: 11, speed: 4.0, dmg: 5, radius: 0.4, xp: 1, flying: true,
    color: '#52425e', accent: '#ff9ad0',
    name: T('幽暗蝠', 'Gloom Bat', '幽暗コウモリ'),
    desc: T('飛越障礙直撲而來。', 'Flies over obstacles straight at you.', '障害物を飛び越えて一直線に襲う。') },
  { id: 'harpy', family: 'flyer', tier: 2, hp: 38, speed: 4.2, dmg: 10, radius: 0.55, xp: 4, flying: true,
    color: '#7a5a52', accent: '#ffd06a',
    name: T('鷹身妖', 'Harpy', 'ハーピー'),
    desc: T('以螺旋軌跡俯衝。', 'Dives in a spiralling path.', '螺旋を描いて急降下する。') },
  { id: 'wraith', family: 'flyer', tier: 3, hp: 95, speed: 3.8, dmg: 16, radius: 0.75, xp: 10, flying: true,
    color: '#3f4a6a', accent: '#a0ffff',
    name: T('幽影', 'Wraith', '幽影'),
    desc: T('穿越一切地形的亡靈。', 'A spirit that glides through all terrain.', 'あらゆる地形をすり抜ける亡霊。') },
  // ---- 增益 buffer
  { id: 'war_drummer', family: 'buffer', tier: 2, hp: 65, speed: 2.1, dmg: 8, radius: 0.7, xp: 5, ai: { radius: 5.5, speed: 0.25, damage: 0.2, keep: 7 },
    color: '#8a3a3a', accent: '#ffcf5a',
    name: T('戰鼓手', 'War Drummer', '戦鼓手'),
    desc: T('鼓聲讓周圍敵人更快更狠。', 'Its drums make nearby enemies faster and fiercer.', '太鼓の音で周囲の敵が速く、激しくなる。') },
  { id: 'banner_knight', family: 'buffer', tier: 3, hp: 170, speed: 2.0, dmg: 14, radius: 0.85, xp: 12, ai: { radius: 7, speed: 0.35, damage: 0.35, keep: 6 },
    color: '#5a4a7a', accent: '#ffe08a',
    name: T('戰旗騎士', 'Banner Knight', '戦旗の騎士'),
    desc: T('高舉戰旗，強化大範圍的盟友。', 'Raises a banner that empowers allies over a wide area.', '戦旗を掲げ、広範囲の味方を強化する。') },
  // ---- 治療 healer
  { id: 'mender', family: 'healer', tier: 2, hp: 52, speed: 2.1, dmg: 6, radius: 0.55, xp: 5, ai: { radius: 6, interval: 3, heal: 0.1, keep: 8 },
    color: '#5a8a6a', accent: '#b8ffc8',
    name: T('療傷祭司', 'Mender', '癒しの祭司'),
    desc: T('定期治療周圍的敵人，優先擊殺。', 'Periodically heals nearby enemies. Kill it first.', '周囲の敵を定期的に治療する。優先して倒そう。') },
  { id: 'life_weaver', family: 'healer', tier: 3, hp: 130, speed: 2.0, dmg: 9, radius: 0.7, xp: 12, ai: { radius: 8, interval: 2.5, heal: 0.15, keep: 8 },
    color: '#4a7a8a', accent: '#8affea',
    name: T('生命編織者', 'Life Weaver', '生命の織り手'),
    desc: T('以生命絲線快速治療大片敵群。', 'Quickly mends a large swath of the horde with threads of life.', '生命の糸で敵の大群を素早く治療する。') },
  // ---- Boss 招喚系 summoner
  { id: 'necromancer', family: 'summoner', tier: 2, hp: 100, speed: 2.0, dmg: 8, radius: 0.65, xp: 7, ai: { into: 'imp', count: 2, interval: 6, keep: 9, cap: 10 },
    color: '#4a3a5a', accent: '#9aff6a',
    name: T('死靈召喚師', 'Necromancer', '死霊召喚師'),
    desc: T('不斷從裂隙中召喚小鬼增援。', 'Keeps calling imp reinforcements through rifts.', '裂け目から絶えずインプの増援を呼び出す。') },
  { id: 'hive_queen', family: 'summoner', tier: 3, hp: 280, speed: 1.9, dmg: 14, radius: 1.0, xp: 16, ai: { into: 'gloom_bat', count: 3, interval: 7, keep: 10, cap: 12 },
    color: '#6a3a6a', accent: '#ffb0f0',
    name: T('蟲后', 'Hive Queen', '蟲の女王'),
    desc: T('孵化成群的幽暗蝠。', 'Hatches swarms of gloom bats.', '幽暗コウモリの群れを孵化させる。') },
]);

export const ENEMY_BY_ID = Object.freeze(Object.fromEntries(ENEMIES.map((e) => [e.id, e])));

/** Selectable (non-child) variants per family, ordered by tier. */
export const VARIANTS = Object.freeze(Object.fromEntries(FAMILIES.map((f) => [
  f, ENEMIES.filter((e) => e.family === f && !e.child).sort((a, b) => a.tier - b.tier),
])));
