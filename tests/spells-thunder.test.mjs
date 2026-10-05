import test from 'node:test';
import assert from 'node:assert/strict';
import { THUNDER_SPELLS } from '../src/data/spells/thunder.js';
import { spellStats } from '../src/data/spells/index.js';
import { THUNDER_HANDLERS } from '../src/sim/spells/thunder.js';
import { createRun, step } from '../src/sim/run.js';
import { applyDebug } from '../src/core/debug.js';
import { SIM } from '../src/data/config.js';

for (const def of THUNDER_SPELLS) {
  test(`${def.id}: complete data and evolution contract`, () => {
    assert.equal(def.element, 'thunder');
    assert.ok(THUNDER_HANDLERS[def.id]);
    for (const language of ['zh', 'en', 'ja']) {
      assert.ok(def.name[language]?.length);
      assert.ok(def.desc[language]?.length);
    }
    for (const level of [1, 4, 8]) for (const value of Object.values(spellStats(def, level))) assert.ok(Number.isFinite(value) && value > 0);
    if (!def.evolvedFrom) {
      assert.equal(def.perLevel.length, 7);
      for (const delta of def.perLevel) {
        assert.equal(Object.entries(delta).filter(([key, value]) => ['damage', 'count', 'jumps', 'cooldown'].includes(key) && value !== 0).length, 2);
        assert.ok((delta.damage ?? 0) >= 0 && (delta.count ?? 0) >= 0 && (delta.cooldown ?? 0) <= 0);
      }
      assert.equal(THUNDER_SPELLS.find((s) => s.id === def.evolution.id).evolvedFrom, def.id);
    }
  });
  for (const level of def.evolvedFrom ? [8] : [1, 8]) {
    test(`${def.id}@${level}: twenty seconds remain finite and bounded`, () => {
      const run = createRun({ mageId: 'voltra', mapId: 'academy', seed: 42 });
      applyDebug(run, { spells: [def.evolvedFrom ?? def.id], levels: { [def.id]: level }, evolve: def.evolvedFrom ? [def.evolvedFrom] : [], god: true, time: 420 });
      run.bossSchedule.next = 99;
      for (let i = 0; i < 1200; i++) {
        if (run.status === 'levelup') { run.status = 'running'; run.pendingLevels = 0; run.levelUp = null; }
        step(run, 1 / 60, { x: Math.cos(i / 120), z: Math.sin(i / 120) });
        assert.ok(run.minions.length <= SIM.maxMinions);
        for (const m of run.minions) assert.ok(Number.isFinite(m.x) && Number.isFinite(m.z));
        run.events.length = 0;
      }
      assert.ok(run.stats.damage > 0);
      assert.ok(Number.isFinite(run.stats.damage));
    });
  }
}
