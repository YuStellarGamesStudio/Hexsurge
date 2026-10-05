import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun, step, chooseUpgrade, continueEndless } from '../src/sim/run.js';
import { botMove, botPick } from '../tools/bot.mjs';
import { damageEnemy } from '../src/sim/combat.js';
import { spawnEnemy } from '../src/sim/enemies.js';
import { ENEMY_BY_ID } from '../src/data/enemies.js';
import { SIM, TIMELINE } from '../src/data/config.js';
import { applyDebug } from '../src/core/debug.js';
import { evolutionReady, generateChoices } from '../src/sim/progression.js';

const DT = 1 / 60;

function play(run, seconds, strategy = 'focus') {
  const end = run.t + seconds;
  while (run.t < end && run.status !== 'dead') {
    if (run.status === 'levelup') { chooseUpgrade(run, botPick(run, strategy)); continue; }
    if (run.status === 'won') break;
    step(run, DT, botMove(run));
    run.events.length = 0;
  }
}

test('a seeded run replays identically', () => {
  const a = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 2, seed: 99 });
  const b = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 2, seed: 99 });
  play(a, 60); play(b, 60);
  assert.equal(a.stats.kills, b.stats.kills);
  assert.equal(a.enemies.length, b.enemies.length);
  assert.equal(Math.round(a.player.x * 1000), Math.round(b.player.x * 1000));
  assert.ok(a.stats.kills > 20, 'the opening minute should produce kills');
});

test('simultaneous enemies never exceed the hard cap at the highest difficulty', () => {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 5, seed: 7 });
  applyDebug(run, { god: true, time: 900 });
  run.bossSchedule.next = 99;
  let peak = 0;
  for (let i = 0; i < 60 * 120; i++) {
    if (run.status === 'levelup') { chooseUpgrade(run, 0); continue; }
    step(run, DT, botMove(run));
    run.events.length = 0;
    peak = Math.max(peak, run.enemies.length);
  }
  assert.ok(peak <= SIM.maxAlive + 6, `peak ${peak}`); // +6: split children may briefly overshoot
  assert.ok(peak >= 30, `density should reach the design band, got ${peak}`);
});

test('melt: fire damage on a frozen enemy is amplified and thaws it', () => {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 1, seed: 3 });
  run.player.stats.critChance = 0;
  const def = { ...ENEMY_BY_ID.stone_brute, hp: 1e6 };
  const cold = spawnEnemy(run, def, 10, 0);
  const plain = spawnEnemy(run, def, -10, 0);
  cold.freezeT = 5; cold.attuneT = 1; // attuned = guaranteed reaction roll
  const before = cold.hp, plainBefore = plain.hp;
  damageEnemy(run, cold, 100, { element: 'fire', spellId: 't' });
  damageEnemy(run, plain, 100, { element: 'fire', spellId: 't' });
  const meltDamage = before - cold.hp, normal = plainBefore - plain.hp;
  assert.ok(meltDamage > normal * 1.5, `melt ${meltDamage} vs ${normal}`);
  assert.equal(cold.freezeT, 0);
});

test('level-up offers distinct cards and the evolution card appears once the recipe is met', () => {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 1, seed: 5 });
  const choices = generateChoices(run);
  assert.equal(new Set(choices.map((c) => `${c.kind}:${c.id}`)).size, choices.length);
  assert.ok(choices.length >= 3);
  applyDebug(run, { levels: { fireball: 8 }, passives: { power_sigil: 3 } });
  assert.equal(evolutionReady(run).length, 1);
  assert.ok(generateChoices(run).some((c) => c.kind === 'evolve' && c.into === 'meteor_rain'));
});

test('bosses arrive at 8:00 / 14:00 / 18:00, the final kill wins, endless doubles score', () => {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 1, seed: 11 });
  applyDebug(run, { god: true, time: TIMELINE.bossTimes[0] - 1 });
  play(run, 3);
  assert.equal(run.bosses.length, 1);
  assert.equal(run.bosses[0].tier, 0);
  // Kill the final boss directly and verify the victory flow.
  const e = run.bosses[0];
  e.bossIndex = 2; e.tier = 2;
  damageEnemy(run, e, 1e9, { element: 'fire', raw: true });
  assert.equal(run.status, 'won');
  const before = run.rawScore;
  assert.ok(continueEndless(run));
  run.hooks.addScore(run, 100);
  assert.equal(run.rawScore - before, 100 * TIMELINE.endlessScoreMult);
});

test('a hostile swarm can kill the player and ends the run', () => {
  const run = createRun({ mageId: 'ignis', mapId: 'abyss', difficulty: 5, seed: 21 });
  applyDebug(run, { spells: [], time: 840 });
  for (let i = 0; i < 60 * 90 && run.status === 'running'; i++) { step(run, DT, { x: 0, z: 0 }); run.events.length = 0; }
  assert.equal(run.status, 'dead');
});
