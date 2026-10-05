// R20: independent mage × difficulty boards. R21 scoring is already applied by getResult.
import { META_RULES } from '../data/unlocks.js';
import { MAGE_BY_ID } from '../data/mages.js';
import { MAP_BY_ID } from '../data/maps.js';
import { DIFFICULTY } from '../data/config.js';

export function getBoard(data, mageId, difficulty) {
  return [...(data.scores?.[`${mageId}|${difficulty}`] ?? [])];
}
export function topPreview(data, n = 3) {
  return Object.entries(data.scores ?? {}).flatMap(([key, board]) => {
    const [mageId, difficulty] = key.split('|');
    return board.map((entry) => ({ ...entry, mageId, difficulty: Number(difficulty) }));
  }).sort((a, b) => b.score - a.score || b.date - a.date).slice(0, Math.max(0, n));
}
export function submitScore(data, result) {
  if (result.reason === 'quit' && result.time < META_RULES.minimumQuitSeconds) return null;
  if (!Object.hasOwn(MAGE_BY_ID, result.mageId) || !Object.hasOwn(MAP_BY_ID, result.mapId) || !DIFFICULTY.some((d) => d.id === result.difficulty)) return null;
  if (['score', 'time', 'kills', 'level'].some((k) => !Number.isFinite(result[k]) || result[k] < 0)) return null;
  const entry = { score: result.score, time: result.time, kills: result.kills, level: result.level, map: result.mapId, won: !!result.won, endless: !!result.endless, date: Date.now() };
  const key = `${result.mageId}|${result.difficulty}`;
  const board = [entry, ...(data.scores[key] ?? [])];
  // Inserting first also resolves same-millisecond ties in favor of the new run.
  board.sort((a, b) => b.score - a.score || b.date - a.date);
  board.length = Math.min(board.length, META_RULES.leaderboardLimit);
  data.scores[key] = board;
  const index = board.indexOf(entry);
  return index < 0 ? null : index + 1;
}
