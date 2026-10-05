import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/sim/run.js';
import { spawnBoss, updateBosses } from '../src/sim/boss.js';
import { updateEntities } from '../src/sim/entities.js';
import { updateZones } from '../src/sim/hazards.js';
import { SIM } from '../src/data/config.js';

for (const map of ['abyss', 'void']) for (const tier of [0, 1, 2]) {
  test(`${map} tier ${tier}: sixty seconds of normal and enraged patterns`, () => {
    const run = createRun({ mapId: map, mageId: 'ignis', seed: 910 + tier });
    const boss = spawnBoss(run, tier);
    const seen = new Set();
    let bullets = 0, warned = 0, pull = false, cast = false;
    for (let frame = 0; frame < 3600; frame++) {
      if (frame === 1800) boss.hp = boss.maxHp * 0.25;
      run.player.hp = run.player.maxHp;
      run.player.x = Math.cos(frame / 180) * 9;
      run.player.z = Math.sin(frame / 180) * 9;
      run.env.pushX = run.env.pushZ = 0;
      updateBosses(run, 1 / 60);
      for (const zone of run.zones) {
        seen.add(zone.kind);
        if (zone.warn > 0) { warned++; assert.ok(zone.warnMax >= 0.8); }
        if (zone.pull > 0) pull = true;
      }
      cast ||= boss.casting > 0;
      bullets = Math.max(bullets, run.eprojectiles.length);
      assert.ok(run.eprojectiles.length <= SIM.maxEnemyProjectiles);
      assert.ok(run.enemies.length <= SIM.maxAlive);
      assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.z));
      updateZones(run, 1 / 60);
      updateEntities(run, 1 / 60);
      run.events.length = 0;
    }
    assert.ok(warned > 0 && cast);
    assert.ok(boss.enraged);
    assert.ok(seen.has(map === 'abyss' ? 'ground_slam' : 'gaze_sweep'));
    if (map === 'abyss') assert.ok(bullets > 0 && seen.has('lava_pools'));
    else assert.ok(pull && seen.has('gravity_wells'));
    const adds = run.enemies.filter(e => e.summoner === boss.id);
    if (tier === 0) assert.equal(adds.length, 0);
    else assert.ok(adds.length > 0 && adds.length <= 14);
    if (tier === 2) {
      assert.ok(adds.some(e => e.def.id === (map === 'abyss' ? 'magma_bomber' : 'wraith')));
      if (map === 'void') assert.ok(bullets > 0);
    }
  });
}
