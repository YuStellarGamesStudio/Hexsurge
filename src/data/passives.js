// 12 passive items (§3.5). Each level adds `perLevel[stat]` (additive) to the derived player stats.
// Passives are only obtainable from the level-up 3-pick and double as evolution prerequisites.
// `fmt`: how the UI prints one level's value ('pct' = x100 + %, 'num' = raw).

const T = (zh, en, ja) => Object.freeze({ zh, en, ja });

export const PASSIVES = Object.freeze([
  {
    id: 'tome_haste', icon: 'tome', maxLevel: 5, stat: 'castSpeed', perLevel: 0.08, fmt: 'pct',
    name: T('疾詠之書', 'Tome of Haste', '速詠の書'),
    desc: T('施法速度 +{v}／級', 'Cast speed +{v} per level', '詠唱速度 +{v}／Lv'),
  },
  {
    id: 'power_sigil', icon: 'sigil', maxLevel: 5, stat: 'damage', perLevel: 0.08, fmt: 'pct',
    name: T('威能印記', 'Sigil of Power', '威力の印'),
    desc: T('法術傷害 +{v}／級', 'Spell damage +{v} per level', '魔法ダメージ +{v}／Lv'),
  },
  {
    id: 'wide_sigil', icon: 'ring', maxLevel: 5, stat: 'area', perLevel: 0.1, fmt: 'pct',
    name: T('廣域法環', 'Wide Circlet', '広域の環'),
    desc: T('法術範圍 +{v}／級', 'Spell area +{v} per level', '魔法範囲 +{v}／Lv'),
  },
  {
    id: 'magnet_charm', icon: 'magnet', maxLevel: 4, stat: 'pickup', perLevel: 0.25, fmt: 'pct',
    name: T('引魂磁符', 'Soul Magnet', '引魂の符'),
    desc: T('拾取範圍 +{v}／級', 'Pickup range +{v} per level', '回収範囲 +{v}／Lv'),
  },
  {
    id: 'wind_boots', icon: 'boots', maxLevel: 4, stat: 'moveSpeed', perLevel: 0.07, fmt: 'pct',
    name: T('御風之靴', 'Boots of Wind', '風渡りの靴'),
    desc: T('移動速度 +{v}／級', 'Move speed +{v} per level', '移動速度 +{v}／Lv'),
  },
  {
    id: 'clover', icon: 'clover', maxLevel: 5, stat: 'luck', perLevel: 1, fmt: 'num',
    name: T('四葉幸運符', 'Lucky Clover', '四つ葉の護符'),
    desc: T('幸運 +{v}／級（暴擊率、額外選項與反應觸發率）', 'Luck +{v} per level (crit, bonus card, reaction chance)', '幸運 +{v}／Lv（会心・追加選択肢・反応率）'),
  },
  {
    id: 'ward_amulet', icon: 'ward', maxLevel: 5, stat: 'shield', perLevel: 16, fmt: 'num',
    name: T('結界護符', 'Ward Amulet', '結界の護符'),
    desc: T('護盾 +{v}／級（脫戰後自動回復）', 'Shield +{v} per level (regenerates out of combat)', 'シールド +{v}／Lv（戦闘外で回復）'),
  },
  {
    id: 'scholar_lens', icon: 'lens', maxLevel: 5, stat: 'xpGain', perLevel: 0.1, fmt: 'pct',
    name: T('學者透鏡', "Scholar's Lens", '学者のレンズ'),
    desc: T('經驗獲取 +{v}／級', 'Experience gain +{v} per level', '経験値 +{v}／Lv'),
  },
  {
    id: 'hourglass', icon: 'hourglass', maxLevel: 5, stat: 'cooldown', perLevel: 0.05, fmt: 'pct',
    name: T('時砂沙漏', 'Hourglass', '時砂の砂時計'),
    desc: T('冷卻縮減 +{v}／級', 'Cooldown reduction +{v} per level', 'クールダウン短縮 +{v}／Lv'),
  },
  {
    id: 'twin_crest', icon: 'crest', maxLevel: 4, stat: 'count', perLevel: [1, 0, 1, 0], fmt: 'num',
    name: T('雙生紋章', 'Twin Crest', '双子の紋章'),
    desc: T('投射物／召喚數量 +{v}（1、3 級各 +1）', 'Projectile/summon count +{v} (Lv 1 and 3)', '弾数・召喚数 +{v}（Lv1・3）'),
  },
  {
    id: 'vitality', icon: 'heart', maxLevel: 5, stat: 'maxHp', perLevel: 0.1, fmt: 'pct', extra: { regen: 0.25 },
    name: T('生命核心', 'Vital Core', '生命の核'),
    desc: T('最大生命 +{v}／級，並附帶生命回復', 'Max HP +{v} per level, plus regeneration', '最大HP +{v}／Lv、再生付き'),
  },
  {
    id: 'echo_gem', icon: 'gem', maxLevel: 4, stat: 'duration', perLevel: 0.12, fmt: 'pct',
    name: T('迴響寶石', 'Echo Gem', '残響の宝玉'),
    desc: T('持續時間 +{v}／級', 'Effect duration +{v} per level', '持続時間 +{v}／Lv'),
  },
]);

export const PASSIVE_BY_ID = Object.freeze(Object.fromEntries(PASSIVES.map((p) => [p.id, p])));

/** Value contributed to `stat` by `level` levels of passive `p` (handles array perLevel). */
export function passiveValue(p, level) {
  if (Array.isArray(p.perLevel)) {
    let total = 0;
    for (let i = 0; i < level; i++) total += p.perLevel[i] ?? 0;
    return total;
  }
  return p.perLevel * level;
}
