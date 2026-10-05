import test from 'node:test';
import assert from 'node:assert/strict';
import { ICE_SPELLS } from '../src/data/spells/ice.js';
import { SPELL_BY_ID } from '../src/data/spells/index.js';
import { ICE_HANDLERS } from '../src/sim/spells/ice.js';
import { applyDebug } from '../src/core/debug.js';
import { createRun, step } from '../src/sim/run.js';
import { hurtPlayer } from '../src/sim/combat.js';

const bases = ICE_SPELLS.filter((s) => !s.evolvedFrom);
test('ice definitions have complete translations, two-stat upgrades and reciprocal evolutions', () => {
  assert.equal(ICE_SPELLS.length, 6);
  for (const def of ICE_SPELLS) {
    assert.ok(ICE_HANDLERS[def.id]);
    for (const text of [def.name, def.desc]) for (const lang of ['zh', 'en', 'ja']) assert.ok(text[lang]?.length);
    assert.equal(def.element, 'ice');
    for (const value of Object.values(def.base)) assert.ok(Number.isFinite(value));
  }
  for (const def of bases) {
    assert.equal(def.perLevel.length, 7);
    for (const delta of def.perLevel) {
      assert.equal(Object.keys(delta).length, 2);
      for (const [key, value] of Object.entries(delta)) {
        assert.ok(['damage', 'count', 'cooldown', 'radius', 'shield'].includes(key));
        assert.ok(key === 'cooldown' ? value < 0 : value > 0);
      }
    }
    assert.equal(SPELL_BY_ID[def.evolution.id].evolvedFrom, def.id);
    assert.ok(def.evolution.level > 0);
  }
});
for (const def of ICE_SPELLS) test(`${def.id} runs twenty seconds without leaking entities`, () => {
  const run = createRun({ mageId: 'glacia', mapId: 'academy', difficulty: 1, seed: 442 });
  applyDebug(run, def.evolvedFrom ? { spells: [], evolve: [def.evolvedFrom], god: true } : { spells: [def.id], levels: { [def.id]: 8 }, god: true });
  for (let i = 0; i < 1200; i++) {
    if (run.status === 'levelup') { run.status = 'running'; run.pendingLevels = 0; }
    step(run, 1 / 60, { x: 0, z: 0 });
    run.events.length = 0;
  }
  assert.equal(run.status, 'running');
  assert.ok(run.projectiles.length < 150);
  assert.ok(run.areas.length <= 2);
  assert.ok(Number.isFinite(run.stats.damage));
});
test('bastion refreshes a shield and reflects on a shielded hit', () => {
  const run = createRun({ mageId: 'glacia', mapId: 'academy', seed: 1 });
  applyDebug(run, { spells: [], evolve: ['glacial_ward'] });
  step(run, 1 / 60, { x: 0, z: 0 });
  assert.ok(run.player.shield >= 30);
  assert.ok(hurtPlayer(run, 1));
  step(run, 1 / 60, { x: 0, z: 0 });
  assert.equal(run.projectiles.filter((p) => p.spellId === 'frozen_bastion').length, 10);
});
