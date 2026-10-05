// Generates DESIGN.md from src/data so the document can never drift from the numbers the game actually uses.
//   node tools/gen-design.mjs            -> writes DESIGN.md
import { writeFileSync } from 'node:fs';
import * as C from '../src/data/config.js';
import { MAGES } from '../src/data/mages.js';
import { PASSIVES } from '../src/data/passives.js';
import { ENEMIES } from '../src/data/enemies.js';
import { BOSSES, BOSS_RULES } from '../src/data/bosses.js';
import { MAPS } from '../src/data/maps.js';
import * as SP from '../src/data/spawns.js';
import { INITIAL, SPELL_UNLOCKS } from '../src/data/unlocks.js';
import { BASE_SPELLS, SPELL_BY_ID, EVOLVED_SPELLS, spellStats } from '../src/data/spells/index.js';
import { xpForLevel } from '../src/sim/progression.js';
import { trackIds, loadTrack } from '../src/data/audio/tracks/index.js';
import { sfx } from '../src/data/audio/sfx.js';

const out = [];
const w = (s = '') => out.push(s);
const n = (v) => (typeof v === 'number' ? +v.toFixed(3) : v);
const table = (head, rows) => { w(`| ${head.join(' | ')} |`); w(`|${head.map(() => '---').join('|')}|`); for (const r of rows) w(`| ${r.map((c) => String(n(c)).replace(/\|/g, '/')).join(' | ')} |`); w(); };
const obj = (o) => Object.entries(o).map(([k, v]) => `${k}=${typeof v === 'object' ? JSON.stringify(v) : n(v)}`).join('、');

w('# Hexsurge（魔潮圍城）DESIGN — 數值唯一來源');
w();
w('> 本檔由 `node tools/gen-design.mjs` 從 `src/data/` 自動產生，禁止手改。數值衝突以本檔為準；機制衝突以企劃書正文為準。');
w();

w('## 1. 全域常數');
for (const key of ['SIM', 'ARENA', 'TIMELINE', 'PLAYER', 'XP', 'COMBAT', 'STATUS', 'SCORE']) { w(`**${key}**：${obj(C[key])}`); w(); }
w('### 1.1 經驗曲線（升級所需經驗）');
table(['等級', '所需經驗', '累計'], (() => { let t = 0; return Array.from({ length: 40 }, (_, i) => { const x = xpForLevel(i + 1); t += x; return [`${i + 1}→${i + 2}`, x, t]; }); })());
w(`節奏目標：首次升級 30–45 秒；前 5 分鐘 8–10 次（實測 ≈ 12–16，因無頭機器人專注擊殺）；一局 30–40 次，護欄 ≤ 50（\`node tools/balance.mjs pace\`）。`);
w();

w('## 2. 難度梯（1–5，解鎖型）');
table(['難度', '血量', '速度', '密度', '傷害', '特殊敵提前(s)', '分數倍率'], C.DIFFICULTY.map((d, i) => [d.id, `×${d.hp}`, `×${d.speed}`, `×${d.density}`, `×${d.damage}`, d.earlySpecial, `×${C.SCORE.difficultyScale[i]}`]));

w('## 3. 雙軌流派（R11）');
w(`純系套裝（同系法術數 → 該系傷害加成）：${obj(C.SYNERGY.pure)}；混系互補（持有元素種類 → 反應增幅）：${obj(C.SYNERGY.mixedPower)}。`);
w();
w(`元素反應：${JSON.stringify(C.REACTION)}`);
w();
w('| 組合 | 反應 | 效果 |'); w('|---|---|---|');
w('| 冰 → 火 | 融化 | 對凍結目標的火系命中傷害增幅並解凍 |');
w('| 火 → 自然 | 燃盡 | 自然系命中燃燒目標時疊加持續傷害層數 |');
w('| 雷 → 冰 | 超導 | 冰系命中被雷擊標記目標時電弧連鎖更多目標 |');
w('| 虛空 → 任意 | 侵蝕 | 目標承受所有來源的額外傷害 |');
w('| 奧術 → 任意 | 調和 | 目標的元素反應觸發率大幅提高、狀態持續更久 |');
w();
w('平衡護欄：純系與混系同投入輸出差距 ≤ 15%（`node tools/balance.mjs dual`）。');
w();

w('## 4. 法師（6，R18）');
table(['id', '系', '名稱', '起手法術', '專屬被動', '被動參數', '屬性修正', '解鎖'], MAGES.map((m) => [m.id, m.element, m.name.en, m.startSpell, m.passiveName.en, JSON.stringify(m.passive), JSON.stringify(m.mods), m.unlock ? JSON.stringify(m.unlock) : '初始']));

w('## 5. 被動道具（12）');
table(['id', '屬性', '每級', '上限', '附帶'], PASSIVES.map((p) => [p.id, p.stat, JSON.stringify(p.perLevel), p.maxLevel, p.extra ? JSON.stringify(p.extra) : '']));

w('## 6. 法術（18 + 18 進化形）');
w(`初始解鎖：${INITIAL.spells.join(', ')}；其餘由條件解鎖：${JSON.stringify(SPELL_UNLOCKS)}；法師解鎖時其起手法術一併解鎖。`);
w();
w(`同時持有進化形上限 ${C.SIM.maxEvolved}（護欄 ≤ 8），法術欄 ${C.SIM.spellSlots}，被動欄 ${C.SIM.passiveSlots}。`);
w();
for (const s of BASE_SPELLS) {
  const evo = SPELL_BY_ID[s.evolution.id];
  w(`### ${s.name.en}（${s.id}）— ${s.element} / ${s.type}`);
  w(`進化：**${evo.name.en}（${evo.id}）** = ${s.id} Lv 8 + ${s.evolution.passive} ≥ Lv ${s.evolution.level}`);
  w();
  const keys = [...new Set([...Object.keys(s.base), ...s.perLevel.flatMap((d) => Object.keys(d))])];
  table(['Lv', ...keys], Array.from({ length: 8 }, (_, i) => { const st = spellStats(s, i + 1); return [i + 1, ...keys.map((k) => st[k] ?? '')]; }));
  w(`進化形數值：${obj(evo.base)}（類型 ${evo.type}）`);
  w();
}

w('## 7. 敵人（10 族、26 種）');
table(['id', '族', '階', 'HP', '速度', '傷害', '半徑', 'XP', '特性'], ENEMIES.map((e) => [e.id, e.family, e.tier, e.hp, e.speed, e.dmg, e.radius, e.xp, [e.flying ? 'flying' : '', e.child ? 'child' : '', e.ai ? JSON.stringify(e.ai) : ''].filter(Boolean).join(' ')]));

w('## 8. 出怪表與節奏曲線（R12）');
w('0–3 分散兵期；3–8 分成群期（5:00 精英波）；8:00 Boss 1；8–14 分混合期；14:00 Boss 2；14–18 分決戰期（密度倍增）；18:00 終 Boss；之後無盡（計分加倍）。');
w();
w('**族權重（[秒, 權重] 關鍵格）**'); w();
table(['族', '關鍵格'], Object.entries(SP.FAMILY_SCHEDULE).map(([k, v]) => [k, JSON.stringify(v)]));
w(`同屏目標密度（難度 ×1）：${JSON.stringify(SP.DENSITY)}；決戰期加成：${JSON.stringify(SP.FINAL_STAND)}；變體階機率：${JSON.stringify(SP.TIER_ODDS)}；血量成長：${JSON.stringify(SP.HP_GROWTH)}；分組：${JSON.stringify(SP.GROUPS)}；${JSON.stringify(SP.SPAWN)}`);
w();

w('## 9. Boss（5）');
w(`規則：${JSON.stringify(BOSS_RULES)}。同一隻 Boss 於 8:00／14:00／18:00 以階 0／1／2 登場（階 1 加招喚與第三招，階 2 全招式＋狂暴）。單場目標 60–120 秒（護欄 45–180）。`);
w();
table(['id', '地圖', '半徑', '速度', '接觸傷害', 'HP(階0/1/2)', '狂暴血量', '招式'], BOSSES.map((b) => [b.id, b.map, b.radius, b.speed, b.contactDamage, b.hp.join(' / '), b.enrageAt, b.patterns.join(', ')]));
for (const b of BOSSES) if (b.attacks) { w(`**${b.id} attacks**：\`${JSON.stringify(b.attacks)}\``); w(); }

w('## 10. 地圖（5）');
table(['id', 'Boss', '解鎖', '加速度', '障礙數', '危害', '主題權重'], MAPS.map((m) => [m.id, m.boss, m.unlock ? JSON.stringify(m.unlock) : '初始', m.accel, m.obstacleCount, JSON.stringify(m.hazards), JSON.stringify(m.themeWeights)]));

w('## 11. 計分與成績榜');
w(`計分 = (存活時間 + 擊殺 + 精英 + Boss + 等級) × 難度倍率；進無盡後新增分數 ×${C.TIMELINE.endlessScoreMult}（R21）。本機榜依 法師×難度 分欄，每欄前 ${C.SCORE.leaderboardSize} 筆（R20）。係數：${obj(C.SCORE)}`);
w();

w('## 12. 音樂與音效');
const rows = [];
for (const id of trackIds) { const t = await loadTrack(id); rows.push([id, t.bpm, t.beats, t.layers.length, t.layers.reduce((a, l) => a + l.notes.length, 0)]); }
w(`BGM 共 ${rows.length} 首（R19：標題／選單／Boss／結算／無盡各 1 + 五圖環境各 2 = 15；戰鬥中播放各圖環境曲，護欄 ≥ 12）。全部由 OPM.js FM 即時合成。`);
w();
table(['曲目', 'BPM', '拍數', '層數', '音符數'], rows);
w(`SFX：${Object.keys(sfx).join(', ')}（七類：施法／命中／拾取／升級／進化／Boss 登場／UI 點擊；另有受傷）。`);
w();

writeFileSync(new URL('../DESIGN.md', import.meta.url), out.join('\n'));
console.log(`DESIGN.md written (${out.length} lines)`);
export { EVOLVED_SPELLS };
