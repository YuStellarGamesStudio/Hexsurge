// Spell bench: measures one spell's output against a mid-game horde with an invulnerable kiting bot.
//   node tools/spelltest.mjs <spellId> [--level 8] [--evolved] [--seconds 60] [--time 420] [--map academy] [--mage ignis]
// Prints damage/sec, kills, peak entity counts, and ms per sim step so slow or runaway spells are obvious.
import { MAX_SPELL_LEVEL, SPELL_BY_ID } from '../src/data/spells/index.js';
import { applyDebug } from '../src/core/debug.js';
import { botMove } from './bot.mjs';
import { createRun, step } from '../src/sim/run.js';

export function benchSpell({ spellId, level = MAX_SPELL_LEVEL, evolved = false, seconds = 60, time = 420, map = 'academy', mage = 'ignis', passives = {}, seed = 4242 }) {
  const def = SPELL_BY_ID[spellId];
  if (!def) throw new Error(`Unknown spell ${spellId}`);
  const base = def.evolvedFrom ? SPELL_BY_ID[def.evolvedFrom] : def;
  const run = createRun({ mageId: mage, mapId: map, difficulty: 1, seed });
  applyDebug(run, evolved || def.evolvedFrom ? { spells: [], evolve: [base.id], passives, god: true } : { spells: [spellId], levels: { [spellId]: level }, passives, god: true });
  run.t = time;
  run.bossSchedule.next = 99; // keep bosses out of the measurement
  const dt = 1 / 60;
  const t0 = run.t, d0 = run.stats.damage, k0 = run.stats.kills;
  let peak = { projectiles: 0, areas: 0, orbiters: 0, minions: 0, strikes: 0, events: 0 };
  const started = performance.now();
  let steps = 0, casts = 0;
  while (run.t - t0 < seconds) {
    if (run.status === 'levelup') { run.status = 'running'; run.pendingLevels = 0; run.levelUp = null; }
    step(run, dt, botMove(run));
    steps++;
    for (const e of run.events) if (e.type === 'cast') casts++;
    peak.events = Math.max(peak.events, run.events.length);
    peak.projectiles = Math.max(peak.projectiles, run.projectiles.length);
    peak.areas = Math.max(peak.areas, run.areas.length);
    peak.orbiters = Math.max(peak.orbiters, run.orbiters.length);
    peak.minions = Math.max(peak.minions, run.minions.length);
    peak.strikes = Math.max(peak.strikes, run.strikes.length);
    run.events.length = 0;
  }
  const ms = performance.now() - started;
  return {
    spell: run.spells.map((s) => `${s.def.id}@${s.level}${s.evolved ? '*' : ''}`).join(','),
    dps: Math.round((run.stats.damage - d0) / seconds), kills: run.stats.kills - k0, casts, peak,
    msPerStep: +(ms / steps).toFixed(3), alive: run.enemies.length,
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (name, def) => { const i = a.indexOf(`--${name}`); return i >= 0 ? a[i + 1] : def; };
  const spellId = a.find((x) => !x.startsWith('--') && !/^\d+$/.test(x) && a[a.indexOf(x) - 1]?.startsWith('--') !== true);
  const levels = opt('level', null) ? [Number(opt('level'))] : [1, 4, 8];
  const common = { seconds: Number(opt('seconds', 60)), time: Number(opt('time', 420)), map: opt('map', 'academy'), mage: opt('mage', 'ignis') };
  const def = SPELL_BY_ID[spellId];
  if (!def) { console.error('usage: node tools/spelltest.mjs <spellId> [--level n] [--evolved] [--seconds s] [--time t] [--map id] [--mage id]'); process.exit(1); }
  if (def.evolvedFrom || a.includes('--evolved')) console.log(benchSpell({ spellId, evolved: true, ...common }));
  else for (const level of levels) console.log(benchSpell({ spellId, level, ...common }));
}
