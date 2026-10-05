import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultSave } from '../src/save/save.js';
import { evaluateUnlocks, unlockedSpells, unlockProgress, isUnlocked, maxDifficulty, recordRun } from '../src/meta/unlocks.js';
import { submitScore, getBoard, topPreview } from '../src/meta/leaderboard.js';
const result = (overrides = {}) => ({ mageId: 'ignis', mapId: 'academy', difficulty: 1, time: 30, score: 100, kills: 4, level: 2, bossKills: 0, evolutions: 0, won: false, endless: false, reason: 'quit', ...overrides });
const run = () => ({ stats: {}, seen: { enemies: new Set(['imp', 'fake']), bosses: new Set(['fallen_archmage']), spells: new Set(['fireball']), evolutions: new Set(['meteor_rain']) } });
test('mage unlock arrives on run two and grants its starting spell', () => {
  const data = defaultSave(); data.stats.runs = 1; evaluateUnlocks(data);
  assert.equal(isUnlocked(data, 'mage', 'glacia'), false);
  data.stats.runs = 2; const earned = evaluateUnlocks(data);
  assert.ok(earned.some(u => u.type === 'mage' && u.id === 'glacia'));
  assert.ok(unlockedSpells(data).includes('ice_lance'));
  assert.deepEqual(evaluateUnlocks(data), []);
});
test('lifetime and per-map conditions use the intended counters', () => {
  const data = defaultSave(); data.stats.kills = 600; data.stats.bossKills = 1; data.stats.bossKillsByMap.academy = 1;
  assert.deepEqual(unlockProgress(data, { kind: 'kills', n: 600 }), { current: 600, target: 600, done: true });
  assert.equal(unlockProgress(data, { kind: 'bossKill', map: 'forest' }).done, false);
  evaluateUnlocks(data); assert.ok(isUnlocked(data, 'map', 'forest')); assert.ok(isUnlocked(data, 'spell', 'flame_wheel'));
});
test('boards retain twenty, newest ties first, and independent difficulty columns', () => {
  const data = defaultSave();
  for (let i = 0; i < 25; i++) submitScore(data, result({ score: i, kills: i }));
  const board = getBoard(data, 'ignis', 1); assert.equal(board.length, 20); assert.equal(board[0].score, 24); assert.equal(board[19].score, 5);
  assert.equal(submitScore(data, result({ score: 24, kills: 999 })), 1); assert.equal(getBoard(data, 'ignis', 1)[0].kills, 999);
  assert.equal(submitScore(data, result({ score: 0 })), null);
  submitScore(data, result({ difficulty: 2, score: 1000, endless: true }));
  assert.equal(getBoard(data, 'ignis', 2)[0].score, 1000); assert.equal(topPreview(data)[0].difficulty, 2);
  assert.equal(submitScore(data, result({ time: 14 })), null);
});
test('recordRun persists totals, discoveries, scores, and victory difficulty ladder', () => {
  const module = { data: defaultSave(), writes: 0, update(fn) { fn(this.data); this.writes++; } };
  let summary = recordRun(module, run(), result({ won: true, bossKills: 1, evolutions: 1, level: 15, score: 500 }));
  assert.equal(module.writes, 1); assert.equal(summary.rank, 1); assert.equal(summary.bests.bestScore, true);
  assert.equal(module.data.stats.runs, 1); assert.equal(module.data.stats.bossKillsByMap.academy, 1);
  assert.deepEqual(module.data.codex.enemies, ['imp']); assert.deepEqual(module.data.codex.mages, ['ignis']);
  assert.deepEqual(module.data.codex.evolutions, ['meteor_rain']); assert.equal(maxDifficulty(module.data), 2);
  assert.ok(summary.newUnlocks.some(u => u.type === 'difficulty' && u.id === 2));
  recordRun(module, run(), result({ difficulty: 2, won: false })); assert.equal(maxDifficulty(module.data), 2);
  recordRun(module, run(), result({ difficulty: 2, won: true })); assert.equal(maxDifficulty(module.data), 3);
  summary = recordRun(module, run(), result({ time: 10 })); assert.equal(summary.rank, null);
  assert.equal(module.data.stats.runs, 4); assert.equal(module.data.stats.playSeconds, 100);
});
