// Balance report (design doc §3): pacing curve, dual-track gap, boss fight lengths.
//   node tools/balance.mjs [pace|dual|boss|all]
// pace: level times / first evolution / survival of the reference bot across mages and maps (targets in PLAN §5).
// dual: pure-element builds vs mixed-element builds at equal investment; the average gap must stay <= 15% (R11).
import { MAGES } from '../src/data/mages.js';
import { BASE_SPELLS, SPELL_BY_ID } from '../src/data/spells/index.js';
import { applyDebug } from '../src/core/debug.js';
import { botMove } from './bot.mjs';
import { simulate } from './bot.mjs';
import { createRun, step } from '../src/sim/run.js';
import { benchBoss } from './bosstest.mjs';

const ELEMENTS = ['fire', 'ice', 'thunder', 'arcane', 'nature', 'void'];
const byElement = Object.fromEntries(ELEMENTS.map((e) => [e, BASE_SPELLS.filter((s) => s.element === e).map((s) => s.id)]));

/** DPS of a fixed build against the mid-game horde (same seed, god-mode bot). */
export function buildDps(spells, { seconds = 60, level = 8, seed = 4242, time = 420, passives = { power_sigil: 3, tome_haste: 3, hourglass: 2 } } = {}) {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 1, seed });
  applyDebug(run, { spells, levels: Object.fromEntries(spells.map((s) => [s, level])), passives, god: true });
  run.t = time; run.bossSchedule.next = 99;
  const t0 = run.t, d0 = run.stats.damage;
  while (run.t - t0 < seconds) {
    if (run.status === 'levelup') { run.status = 'running'; run.pendingLevels = 0; run.levelUp = null; }
    step(run, 1 / 60, botMove(run));
    run.events.length = 0;
  }
  return (run.stats.damage - d0) / seconds;
}

export function dualTrack(seeds = [4242, 99, 7]) {
  const avg = (spells) => seeds.reduce((a, s) => a + buildDps(spells, { seed: s }), 0) / seeds.length;
  const pure = ELEMENTS.map((e) => ({ name: `pure ${e}`, dps: avg(byElement[e]) }));
  // Mixed: three different elements, rotating over spell types so every element appears equally often.
  const mixes = [];
  for (let i = 0; i < 6; i++) {
    const e = [ELEMENTS[i], ELEMENTS[(i + 1) % 6], ELEMENTS[(i + 3) % 6]];
    mixes.push({ name: `mix ${e.join('+')}`, dps: avg(e.map((x, k) => byElement[x][(i + k) % 3])) });
  }
  const mean = (l) => l.reduce((a, b) => a + b.dps, 0) / l.length;
  const gap = Math.abs(mean(pure) - mean(mixes)) / Math.max(mean(pure), mean(mixes));
  return { pure, mixes, pureMean: mean(pure), mixMean: mean(mixes), gap };
}

export function pace(difficulty = 1) {
  const rows = [];
  for (const mage of MAGES) {
    for (const mapId of ['academy', 'abyss']) {
      const { levelTimes, evoTimes, result, timeline } = simulate({ mageId: mage.id, mapId, difficulty, seed: 5, seconds: 1100, sampleEvery: 30 });
      const at = (t) => levelTimes.filter((x) => x <= t).length + 1;
      const peakAlive = Math.max(...timeline.map((r) => r.alive));
      rows.push({ mage: mage.id, map: mapId, firstLvl: Math.round(levelTimes[0]), l300: at(300), l600: at(600), l1080: at(1080), firstEvo: evoTimes[0] ? Math.round(evoTimes[0]) : '-', evo: result.evolutions, bossKills: result.bossKills, peakAlive, end: result.reason ?? 'alive', t: Math.round(result.time) });
    }
  }
  return rows;
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const what = process.argv[2] ?? 'all';
  if (what === 'pace' || what === 'all') { console.log('== pacing (targets: first level 30-45 s, ~10 by 5:00, 30-40 total, <=50)'); console.table(pace()); }
  if (what === 'dual' || what === 'all') {
    const d = dualTrack();
    console.log('== dual track (gap must be <= 15%)');
    console.table([...d.pure, ...d.mixes].map((r) => ({ build: r.name, dps: Math.round(r.dps) })));
    console.log(`pure mean ${Math.round(d.pureMean)}  mixed mean ${Math.round(d.mixMean)}  gap ${(d.gap * 100).toFixed(1)}%`);
  }
  if (what === 'boss' || what === 'all') {
    const rows = [];
    for (const map of ['academy', 'forest', 'tundra', 'abyss', 'void']) for (const tier of [0, 1, 2]) {
      const r = benchBoss({ map, tier, seconds: 240 });
      rows.push({ map, tier, killed: r.killed, seconds: r.seconds, dmgTaken: r.damageWouldTake, bullets: r.peakBullets });
    }
    console.log('== bosses (target kill 60-120 s, guardrail 45-180)');
    console.table(rows);
  }
}
export { SPELL_BY_ID };
