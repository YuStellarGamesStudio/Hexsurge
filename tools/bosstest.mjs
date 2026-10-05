// Boss bench: a strong reference build vs one boss tier with an invulnerable-but-measured bot.
//   node tools/bosstest.mjs <mapId> <tier 0..2> [--seconds 240] [--difficulty 1] [--mage ignis]
// Reports time-to-kill (target 60-120 s, guardrail 45-180 s), damage the bot WOULD have taken (god mode keeps it alive), and bullet/zone peaks.
import { applyDebug } from '../src/core/debug.js';
import { botMove } from './bot.mjs';
import { createRun, step } from '../src/sim/run.js';

const REFERENCE = {
  // Typical build at the moment each boss arrives (by tier): spells held / levels / passives.
  0: { spells: ['fireball', 'frost_nova', 'chain_lightning', 'arcane_orbs'], levels: { fireball: 8, frost_nova: 5, chain_lightning: 5, arcane_orbs: 4 }, passives: { power_sigil: 3, tome_haste: 2, hourglass: 2 } },
  1: { spells: ['fireball', 'frost_nova', 'chain_lightning', 'arcane_orbs', 'thorn_field'], levels: { fireball: 8, frost_nova: 8, chain_lightning: 8, arcane_orbs: 6, thorn_field: 5 }, passives: { power_sigil: 4, tome_haste: 3, hourglass: 3, twin_crest: 2 }, evolve: ['fireball'] },
  2: { spells: ['fireball', 'frost_nova', 'chain_lightning', 'arcane_orbs', 'thorn_field', 'spirit_wolf'], levels: { fireball: 8, frost_nova: 8, chain_lightning: 8, arcane_orbs: 8, thorn_field: 8, spirit_wolf: 6 }, passives: { power_sigil: 5, tome_haste: 4, hourglass: 4, twin_crest: 3, wide_sigil: 3 }, evolve: ['fireball', 'chain_lightning', 'frost_nova'] },
};

export function benchBoss({ map, tier, seconds = 240, difficulty = 1, mage = 'ignis', seed = 777, build }) {
  const run = createRun({ mageId: mage, mapId: map, difficulty, seed });
  const b = build ?? REFERENCE[tier];
  applyDebug(run, { ...b, god: true, time: [480, 840, 1080][tier], boss: tier });
  const dt = 1 / 60;
  const start = run.t;
  const boss = run.bosses[0];
  let taken = 0, peakBullets = 0, peakZones = 0, enrageAt = null;
  const origHp = run.player.hp;
  while (run.t - start < seconds && !boss.dead) {
    if (run.status === 'levelup') { run.status = 'running'; run.pendingLevels = 0; run.levelUp = null; }
    run.player.hp = origHp; // god: restore each step, count what would have landed
    step(run, dt, botMove(run));
    for (const e of run.events) { if (e.type === 'hurt') taken += e.amount; if (e.type === 'bossEnrage' && enrageAt === null) enrageAt = +(run.t - start).toFixed(1); }
    peakBullets = Math.max(peakBullets, run.eprojectiles.length);
    peakZones = Math.max(peakZones, run.zones.length);
    run.events.length = 0;
  }
  return { map, tier, killed: boss.dead, seconds: +(run.t - start).toFixed(1), hpLeft: Math.round(boss.hp), maxHp: Math.round(boss.maxHp), damageWouldTake: Math.round(taken), peakBullets, peakZones, enrageAt, adds: run.enemies.length };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.slice(2);
  const opt = (n, d) => { const i = a.indexOf(`--${n}`); return i >= 0 ? a[i + 1] : d; };
  const [map, tier] = [a[0], Number(a[1] ?? 0)];
  console.log(benchBoss({ map, tier, seconds: Number(opt('seconds', 240)), difficulty: Number(opt('difficulty', 1)), mage: opt('mage', 'ignis') }));
}
