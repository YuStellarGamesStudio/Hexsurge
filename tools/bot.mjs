// Headless bot used by balance tooling and tests: a simple kiting policy + upgrade strategies.
import { chooseUpgrade, createRun, getResult, step } from '../src/sim/run.js';
import { SIM } from '../src/data/config.js';

/** Potential-field movement: flee dense enemies/projectiles, drift to gems, stay off the rim. */
export function botMove(run) {
  const p = run.player;
  let fx = 0, fz = 0;
  for (const e of run.enemies) {
    const dx = p.x - e.x, dz = p.z - e.z, d2 = dx * dx + dz * dz;
    if (d2 > 144 || d2 < 1e-4) continue;
    const w = (e.boss ? 4 : 1) / (d2 + 0.5);
    fx += dx * w; fz += dz * w;
  }
  for (const b of run.eprojectiles) {
    const dx = p.x - b.x, dz = p.z - b.z, d2 = dx * dx + dz * dz;
    if (d2 > 36) continue;
    fx += dx / (d2 + 0.3) * 1.5; fz += dz / (d2 + 0.3) * 1.5;
  }
  for (const z of run.zones) {
    const dx = p.x - z.x, dz = p.z - z.z, d2 = dx * dx + dz * dz, r = z.r + 2.2;
    if (d2 < r * r) { const d = Math.sqrt(d2) || 0.1; fx += (dx / d) * 6; fz += (dz / d) * 6; }
  }
  // gems
  let best = null, bd = 1e9;
  for (const g of run.gems) { const d = (g.x - p.x) ** 2 + (g.z - p.z) ** 2; if (d < bd) { bd = d; best = g; } }
  if (best && bd < 400) { const d = Math.sqrt(bd) || 1; fx += ((best.x - p.x) / d) * 0.35; fz += ((best.z - p.z) / d) * 0.35; }
  // keep inside the arena, circle clockwise when idle
  const r = Math.hypot(p.x, p.z);
  if (r > 30) { fx -= (p.x / r) * (r - 30) * 0.25; fz -= (p.z / r) * (r - 30) * 0.25; }
  fx += -p.z * 0.002; fz += p.x * 0.002;
  const len = Math.hypot(fx, fz);
  return len < 1e-4 ? { x: 0, z: 0 } : { x: fx / len, z: fz / len };
}

/** Pick card index: strategies: 'focus' (evolve > upgrade owned spells > guided passives), 'random'. */
export function botPick(run, strategy = 'focus') {
  const cs = run.levelUp.choices;
  if (strategy === 'random') return Math.floor(run.rng() * cs.length);
  // 'focus' models a competent player: take evolutions, chase the passive a nearly-maxed spell needs,
  // concentrate upgrades on a few spells (cap 4 by default), then fall back to generic power passives.
  const maxSpells = strategy === 'wide' ? 6 : 4;
  const wanted = new Set();
  for (const s of run.spells) {
    const evo = s.def.evolution;
    if (evo && !s.evolved && s.level >= 3 && (run.passives[evo.passive] ?? 0) < evo.level) wanted.add(evo.passive);
  }
  const generic = { power_sigil: 36, tome_haste: 35, hourglass: 33, twin_crest: 32, wide_sigil: 30, vitality: 29 };
  const score = (c) => {
    switch (c.kind) {
      case 'evolve': return 1000;
      case 'passive_new': case 'passive_up': return (wanted.has(c.id) ? 90 : generic[c.id] ?? 20) + (c.kind === 'passive_up' ? 3 : 0);
      case 'spell_up': return 60 + c.level * 2;
      case 'spell_new': return run.spells.length < maxSpells ? 55 : 5;
      case 'heal': return run.player.hp < run.player.stats.maxHp * 0.6 ? 70 : 5;
      default: return 1;
    }
  };
  let best = 0;
  cs.forEach((c, i) => { if (score(c) > score(cs[best])) best = i; });
  return best;
}

/**
 * Runs a full headless run. Returns { run, result, timeline }.
 * opts: createRun opts + { seconds, strategy, sampleEvery, onSample }
 */
export function simulate(opts) {
  const run = createRun(opts);
  const dt = SIM.step;
  const limit = (opts.seconds ?? 1100);
  const timeline = [];
  const sampleEvery = opts.sampleEvery ?? 60;
  let nextSample = 0;
  const levelTimes = [];
  let lastLevel = 1;
  let guard = 0;
  while (run.t < limit && run.status !== 'dead') {
    if (run.status === 'levelup') { chooseUpgrade(run, botPick(run, opts.strategy)); continue; }
    if (run.status === 'won') break;
    step(run, dt, botMove(run));
    run.events.length = 0;
    if (run.player.level !== lastLevel) { for (let l = lastLevel; l < run.player.level; l++) levelTimes.push(run.t); lastLevel = run.player.level; }
    if (run.t >= nextSample) {
      nextSample += sampleEvery;
      timeline.push({ t: Math.round(run.t), level: run.player.level, kills: run.stats.kills, alive: run.enemies.length, hp: Math.round(run.player.hp), gems: run.gems.length, spells: run.spells.length, evo: run.stats.evolutions });
    }
    if (++guard > 400000) break;
  }
  return { run, result: getResult(run), timeline, levelTimes };
}

if (typeof process !== 'undefined' && import.meta.url === `file://${process.argv[1]}`) {
  const [mageId = 'ignis', mapId = 'academy', difficulty = '1', seconds = '1100'] = process.argv.slice(2);
  const started = performance.now();
  const { result, timeline, levelTimes } = simulate({ mageId, mapId, difficulty: Number(difficulty), seed: 12345, seconds: Number(seconds) });
  console.table(timeline);
  console.log(result, `${Math.round(performance.now() - started)}ms`);
  console.log('level times', levelTimes.map((t) => Math.round(t)).join(' '));
}
