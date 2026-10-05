// R6: collection and access only, never permanent player stat upgrades.
import { INITIAL, SPELL_UNLOCKS } from '../data/unlocks.js';
import { MAGES, MAGE_BY_ID } from '../data/mages.js';
import { MAPS } from '../data/maps.js';
import { DIFFICULTY } from '../data/config.js';
import { SPELL_BY_ID } from '../data/spells/index.js';
import { ENEMY_BY_ID } from '../data/enemies.js';
import { BOSS_BY_ID } from '../data/bosses.js';
import { submitScore } from './leaderboard.js';

export function unlockedSpells(data) {
  const mages = new Set([...INITIAL.mages, ...(data.unlocks?.mages ?? [])]);
  return [...new Set([...INITIAL.spells, ...(data.unlocks?.spells ?? []),
    ...[...mages].flatMap((id) => MAGE_BY_ID[id] ? [MAGE_BY_ID[id].startSpell] : [])])];
}
export function maxDifficulty(data) { return data.unlocks?.difficulty ?? INITIAL.difficulty; }
export function isUnlocked(data, kind, id) {
  if (kind === 'difficulty') return Number.isInteger(Number(id)) && Number(id) >= INITIAL.difficulty && Number(id) <= maxDifficulty(data);
  if (kind === 'spell' || kind === 'spells') return unlockedSpells(data).includes(id);
  const key = kind.endsWith('s') ? kind : `${kind}s`;
  return [...(INITIAL[key] ?? []), ...(data.unlocks?.[key] ?? [])].includes(id);
}
export function unlockProgress(data, cond) {
  if (!cond) return { current: 1, target: 1, done: true };
  const stats = data.stats ?? {};
  const fields = { runs: 'runs', kills: 'kills', evolve: 'evolutions', wins: 'wins', level: 'maxLevel', survive: 'bestTime', score: 'bestScore', bossKill: 'bossKills' };
  const current = cond.kind === 'bossKill' && cond.map ? stats.bossKillsByMap?.[cond.map] ?? 0 : stats[fields[cond.kind]] ?? 0;
  const target = cond.n ?? 1;
  return { current, target, done: Object.hasOwn(fields, cond.kind) && current >= target };
}
export function evaluateUnlocks(data) {
  const found = [];
  const grant = (type, id) => {
    if (isUnlocked(data, type, id)) return;
    data.unlocks[`${type}s`].push(id); found.push({ type, id });
  };
  for (const mage of MAGES) if (unlockProgress(data, mage.unlock).done) {
    grant('mage', mage.id);
    // Starting spells remain explicitly recorded as well as derived by unlockedSpells.
    if (!data.unlocks.spells.includes(mage.startSpell)) {
      const alreadyAvailable = INITIAL.spells.includes(mage.startSpell);
      data.unlocks.spells.push(mage.startSpell);
      if (!alreadyAvailable) found.push({ type: 'spell', id: mage.startSpell });
    }
  }
  for (const map of MAPS) if (unlockProgress(data, map.unlock).done) grant('map', map.id);
  for (const [id, cond] of Object.entries(SPELL_UNLOCKS)) if (unlockProgress(data, cond).done) grant('spell', id);
  for (const [key, board] of Object.entries(data.scores ?? {})) {
    const difficulty = Number(key.split('|')[1]);
    if (!DIFFICULTY.some((d) => d.id === difficulty) || !board.some((entry) => entry.won)) continue;
    const next = Math.min(difficulty + 1, DIFFICULTY.length);
    if (next > maxDifficulty(data)) {
      data.unlocks.difficulty = next;
      found.push({ type: 'difficulty', id: next });
    }
  }
  return found;
}
export function recordRun(saveModule, run, result) {
  let newUnlocks = [], rank = null;
  const bests = {};
  saveModule.update((data) => {
    const s = data.stats;
    s.runs++;
    for (const key of ['kills', 'bossKills', 'evolutions']) s[key] += result[key] ?? run.stats?.[key] ?? 0;
    s.bossKillsByMap[result.mapId] = (s.bossKillsByMap[result.mapId] ?? 0) + (result.bossKills ?? run.stats?.bossKills ?? 0);
    s.wins += result.won ? 1 : 0;
    s.playSeconds += result.time;
    for (const [stat, value] of Object.entries({ bestTime: result.time, maxLevel: result.level, bestScore: result.score })) {
      bests[stat] = value > s[stat]; s[stat] = Math.max(s[stat], value);
    }
    const discover = (key, values, registry) => {
      const seen = new Set(data.codex[key]);
      for (const id of values ?? []) if (Object.hasOwn(registry, id)) seen.add(id);
      data.codex[key] = [...seen];
    };
    discover('mages', [result.mageId], MAGE_BY_ID);
    discover('enemies', run.seen?.enemies, ENEMY_BY_ID);
    discover('bosses', run.seen?.bosses, BOSS_BY_ID);
    discover('spells', run.seen?.spells, SPELL_BY_ID);
    discover('evolutions', run.seen?.evolutions, SPELL_BY_ID);
    rank = submitScore(data, result);
    newUnlocks = evaluateUnlocks(data);
    const nextDifficulty = Math.min(result.difficulty + 1, DIFFICULTY.length);
    if (result.won && nextDifficulty > maxDifficulty(data)) {
      data.unlocks.difficulty = nextDifficulty;
      newUnlocks.push({ type: 'difficulty', id: nextDifficulty });
    }
  });
  return { newUnlocks, rank, bests };
}
