import test from 'node:test';
import assert from 'node:assert/strict';
import { FIRE_SPELLS } from '../src/data/spells/fire.js';
import { benchSpell } from '../tools/spelltest.mjs';
import { createRun, step } from '../src/sim/run.js';
import { applyDebug } from '../src/core/debug.js';

for (const def of FIRE_SPELLS) {
  test(`${def.id}: localized contract and 20 seconds of simulation`, () => {
    for (const lang of ['zh', 'en', 'ja']) {
      assert.ok(def.name[lang]); assert.ok(def.desc[lang]);
    }
    if (!def.evolvedFrom) {
      assert.equal(def.perLevel.length, 7);
      for (const delta of def.perLevel) {
        assert.equal(Object.keys(delta).length, 2);
        for (const [key, value] of Object.entries(delta)) {
          assert.ok(['damage', 'count', 'cooldown'].includes(key));
          assert.ok(key === 'cooldown' ? value < 0 : value > 0);
        }
      }
      const evolved = FIRE_SPELLS.find((s) => s.id === def.evolution.id);
      assert.equal(evolved.evolvedFrom, def.id);
    }
    const result = benchSpell({ spellId: def.id, seconds: 20 });
    assert.ok(result.dps > 0);
    assert.ok(result.peak.projectiles < 150);
  });
}

test('volcano pools erupt into molten projectiles; phoenix bodies launch feathers', () => {
  for (const [base, evolved] of [['ember_field', 'volcano_eruption'], ['flame_wheel', 'phoenix_ring']]) {
    const run = createRun({ mageId: 'ignis', mapId: 'academy', seed: 4242 });
    applyDebug(run, { spells: [], evolve: [base], god: true, enemies: { imp: 30 } });
    let emitted = false;
    for (let i = 0; i < 240; i++) {
      if (run.status === 'levelup') run.status = 'running';
      step(run, 1 / 60, { x: 0, z: 0 });
      emitted ||= run.projectiles.some((p) => p.spellId === evolved && p.element === 'fire');
      run.events.length = 0;
    }
    assert.ok(emitted, `${evolved} must emit its evolved projectile mechanic`);
    if (base === 'flame_wheel') assert.ok(run.orbiters.length > 0);
  }
});
