import test from 'node:test';
import assert from 'node:assert/strict';
import { VOID_SPELLS } from '../src/data/spells/void.js';
import { createRun } from '../src/sim/run.js';
import { makeCtx } from '../src/sim/spells/index.js';
import { VOID_HANDLERS } from '../src/sim/spells/void.js';
import { spawnEnemy } from '../src/sim/enemies.js';
import { ENEMY_BY_ID } from '../src/data/enemies.js';
import { updateEntities, spawnEnemyProjectile } from '../src/sim/entities.js';
import { damageEnemy } from '../src/sim/combat.js';

function setup(id, level = 1) {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', difficulty: 1, seed: 42 });
  run.player.stats.critChance = 0;
  const def = VOID_SPELLS.find(s => s.id === id);
  const spell = { def, level };
  const ctx = makeCtx(run, spell);
  return { run, ctx, handler: VOID_HANDLERS[id] };
}
function enemy(run, x, z) {
  const e = spawnEnemy(run, { ...ENEMY_BY_ID.stone_brute, hp: 10000 }, x, z);
  run.grid.clear();
  for (const living of run.enemies) if (!living.dead) run.grid.insert(living);
  return e;
}

test('void definitions cover all recipes, languages and two-stat level steps', () => {
  assert.equal(VOID_SPELLS.length, 6);
  for (const def of VOID_SPELLS) {
    assert.ok(VOID_HANDLERS[def.id]);
    for (const lang of ['zh', 'en', 'ja']) { assert.ok(def.name[lang]); assert.ok(def.desc[lang]); }
    if (def.perLevel) {
      assert.equal(def.perLevel.length, 7);
      for (const delta of def.perLevel) {
        assert.equal(Object.keys(delta).length, 2);
        assert.ok(Object.entries(delta).every(([k, v]) => k === 'cooldown' ? v < 0 : v > 0));
      }
      assert.equal(VOID_SPELLS.find(s => s.id === def.evolution.id).evolvedFrom, def.id);
    }
  }
});
test('rift pulls enemies and erosion benefits another element without inflating initial damage', () => {
  const { run, ctx, handler } = setup('void_rift');
  const center = enemy(run, 5, 0), outer = enemy(run, 7, 0);
  handler.cast(ctx);
  updateEntities(run, 0.1);
  assert.ok(outer.x < 7);
  assert.ok(center.erodeT > 0);
  const plain = enemy(run, -5, 0);
  const erodedDamage = damageEnemy(run, center, 10, { element: 'nature', noCrit: true });
  const plainDamage = damageEnemy(run, plain, 10, { element: 'nature', noCrit: true });
  assert.ok(erodedDamage > plainDamage);
  assert.equal(run.areas[0].dmg, ctx.s.damage);
});
test('singularity collapses into an additional damaging burst', () => {
  const { run, ctx, handler } = setup('black_hole');
  const e = enemy(run, 5, 0);
  handler.cast(ctx);
  const area = run.areas[0], hp = e.hp;
  area.onExpire(run, area);
  assert.ok(e.hp < hp);
  assert.ok(run.events.some(e => e.type === 'burst' && e.kind === 'collapse'));
});
test('familiars are ranged; legion mixes roles, recruits, and disposes cleanly', () => {
  const familiar = setup('shadow_familiar');
  familiar.handler.update(familiar.ctx);
  assert.equal(familiar.run.minions.length, familiar.ctx.count);
  assert.ok(familiar.run.minions.every(m => m.ai === 'ranged' && m.shot));
  familiar.handler.dispose(familiar.ctx);
  assert.ok(familiar.run.minions.every(m => m.dead));
  const legion = setup('shadow_legion');
  legion.handler.update(legion.ctx);
  assert.ok(legion.run.minions.some(m => m.ai === 'melee'));
  assert.ok(legion.run.minions.some(m => m.ai === 'ranged'));
  legion.run.stats.kills += 1000;
  legion.handler.update(legion.ctx);
  assert.equal(legion.run.minions.length, legion.ctx.s.maxCount);
});
test('entropy slows and erodes; heat death expands, erases shots and freezes once per wave', () => {
  const aura = setup('entropy_aura');
  const a = enemy(aura.run, 2, 0);
  aura.handler.cast(aura.ctx); updateEntities(aura.run, 0.01);
  assert.ok(a.chillT > 0 && a.erodeT > 0);
  const heat = setup('heat_death');
  const e = enemy(heat.run, 2, 0);
  spawnEnemyProjectile(heat.run, { x: 2, z: 0, speed: 0, radius: 0.2, damage: 1 });
  heat.handler.cast(heat.ctx);
  updateEntities(heat.run, 0.5);
  assert.equal(heat.run.eprojectiles.length, 0);
  assert.ok(e.freezeT > 0);
  const hp = e.hp;
  updateEntities(heat.run, 0.2);
  assert.equal(e.hp, hp);
  assert.ok(heat.run.areas[0].r > heat.ctx.s.startRadius);
});
