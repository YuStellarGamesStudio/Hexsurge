import test from 'node:test';
import assert from 'node:assert/strict';
import { createRun } from '../src/sim/run.js';
import { spawnBoss, updateBosses } from '../src/sim/boss.js';
import { updateEntities } from '../src/sim/entities.js';
import { updateZones } from '../src/sim/hazards.js';
import { BOSS_RULES } from '../src/data/bosses.js';
import { SIM } from '../src/data/config.js';

for (const map of ['academy', 'forest', 'tundra']) {
  for (let tier = 0; tier <= 2; tier++) test(`${map} tier ${tier}: patterns, enrage and caps over 60 seconds`, () => {
    const run = createRun({ mapId: map, mageId: 'ignis', difficulty: 1, seed: 713 });
    const boss = spawnBoss(run, tier);
    run.player.hp = run.player.maxHp = 1e9;
    let bullets = 0, zones = 0, moved = false, summons = 0;
    const kinds = new Set(), start = { x: boss.x, z: boss.z };
    for (let frame = 0; frame < 60 / SIM.step; frame++) {
      run.t += SIM.step;
      run.player.x = Math.cos(run.t / 5) * 12; run.player.z = Math.sin(run.t / 5) * 12;
      if (frame === Math.floor(30 / SIM.step)) boss.hp = boss.maxHp * 0.2;
      updateBosses(run, SIM.step);
      for (const zone of run.zones) {
        kinds.add(zone.kind);
        if (zone.owner === 'boss') assert.ok(zone.warnMax >= 0.8, `${zone.kind} needs a dodge window`);
      }
      bullets = Math.max(bullets, run.eprojectiles.length); zones = Math.max(zones, run.zones.length);
      summons = Math.max(summons, run.enemies.filter(e => e.summoner === boss.id && !e.dead).length);
      assert.ok(run.eprojectiles.length <= SIM.maxEnemyProjectiles);
      assert.ok(run.enemies.length <= SIM.maxAlive);
      assert.ok(summons <= BOSS_RULES.summonCap);
      assert.ok(Number.isFinite(boss.x) && Number.isFinite(boss.z));
      for (const projectile of run.eprojectiles) assert.ok(Number.isFinite(projectile.angle) && Number.isFinite(projectile.dmg));
      moved ||= Math.hypot(boss.x - start.x, boss.z - start.z) > 1;
      updateEntities(run, SIM.step); updateZones(run, SIM.step);
      run.events.length = 0;
    }
    assert.ok(bullets > 0 || zones > 0);
    assert.ok(moved, 'boss must not stay idle');
    assert.equal(boss.enraged, true);
    assert.equal(summons > 0, tier >= 1);
    const expected = map === 'academy' ? ['arcane_rings', 'rune_seals'] : map === 'forest' ? ['root_eruption', 'spore_cloud'] : ['frost_breath', 'icicle_rain'];
    for (const kind of expected) assert.ok(kinds.has(kind), `missing ${kind}`);
    if (map === 'tundra') assert.equal(kinds.has('blizzard_dash'), tier >= 1);
    if (map === 'academy') assert.ok(bullets > 0);
    if (map === 'forest') assert.equal(bullets > 0, tier >= 1);
  });
}
