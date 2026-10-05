import test from 'node:test';
import assert from 'node:assert/strict';
import { NATURE_SPELLS } from '../src/data/spells/nature.js';
import { SPELL_BY_ID, spellStats } from '../src/data/spells/index.js';
import { NATURE_HANDLERS } from '../src/sim/spells/nature.js';
import { makeCtx } from '../src/sim/spells/index.js';
import { createRun } from '../src/sim/run.js';
import { applyDebug } from '../src/core/debug.js';
import { spawnEnemy } from '../src/sim/enemies.js';
import { ENEMY_BY_ID } from '../src/data/enemies.js';
import { updateEntities } from '../src/sim/entities.js';
import { SIM } from '../src/data/config.js';
import { benchSpell } from '../tools/spelltest.mjs';

function setup(id, level = 1) {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', seed: 17 });
  applyDebug(run, { spells: [id], levels: { [id]: level }, god: true });
  return { run, ctx: makeCtx(run, run.spells[0]) };
}
function target(run, x = 2, z = 0) {
  const e = spawnEnemy(run, ENEMY_BY_ID.imp, x, z, { hpMult: 1000 });
  run.grid.insert(e);
  return e;
}

test('nature definitions have complete translations, recipes and exactly two level improvements', () => {
  assert.equal(NATURE_SPELLS.length, 6);
  for (const def of NATURE_SPELLS) {
    assert.equal(def.element, 'nature');
    assert.ok(NATURE_HANDLERS[def.id]);
    for (const lang of ['zh', 'en', 'ja']) { assert.ok(def.name[lang]); assert.ok(def.desc[lang]); }
    if (!def.perLevel) continue;
    assert.equal(def.perLevel.length, 7);
    for (const delta of def.perLevel) {
      assert.equal(Object.keys(delta).length, 2);
      for (const [key, value] of Object.entries(delta)) {
        assert.ok(['damage', 'count', 'cooldown'].includes(key));
        assert.ok(key === 'cooldown' ? value < 0 : value > 0);
      }
    }
    assert.equal(SPELL_BY_ID[def.evolution.id].evolvedFrom, def.id);
    assert.ok(spellStats(def, 8).damage > def.base.damage);
  }
});

test('thorn patches grow, slow enemies, and trigger burnout on burning targets', () => {
  const { run, ctx } = setup('thorn_field');
  const e = target(run); e.burnT = 3; e.attuneT = 1;
  NATURE_HANDLERS.thorn_field.cast(ctx);
  const a = run.areas[0], initial = a.r;
  updateEntities(run, SIM.step);
  assert.ok(a.r > initial);
  assert.ok(e.chillT > 0);
  assert.ok(e.burnStacks > 0);
  assert.ok(run.events.some((event) => event.kind === 'burnout'));
});

test('world roots alternate a ring and a line, heal slightly, and maintain positive delayed radii', () => {
  const { run, ctx } = setup('world_roots'); target(run);
  run.player.hp -= 20; const hp = run.player.hp;
  NATURE_HANDLERS.world_roots.cast(ctx);
  assert.equal(run.areas.length, ctx.count);
  assert.equal(run.player.hp, hp + ctx.s.heal);
  const ring = run.areas.map((a) => [a.x, a.z]);
  updateEntities(run, SIM.step);
  assert.ok(run.areas.every((a) => a.r > 0));
  run.areas.length = 0;
  NATURE_HANDLERS.world_roots.cast(ctx);
  assert.notDeepEqual(run.areas.map((a) => [a.x, a.z]), ring);
  assert.ok(run.areas.every((a) => a.slow > 0));
});

test('wolves replenish without duplication, update with level, and dispose on evolution', () => {
  const { run, ctx } = setup('spirit_wolf');
  NATURE_HANDLERS.spirit_wolf.update(ctx);
  NATURE_HANDLERS.spirit_wolf.update(ctx);
  assert.equal(run.minions.length, ctx.count);
  run.minions[0].dead = true;
  NATURE_HANDLERS.spirit_wolf.update(ctx);
  assert.equal(run.minions.filter((m) => !m.dead).length, ctx.count);
  ctx.spell.level = 8;
  const upgraded = makeCtx(run, ctx.spell);
  NATURE_HANDLERS.spirit_wolf.update(upgraded);
  assert.equal(run.minions.filter((m) => !m.dead).length, upgraded.count);
  assert.ok(run.minions.filter((m) => !m.dead).every((m) => m.dmg === upgraded.s.damage));
  NATURE_HANDLERS.spirit_wolf.dispose(upgraded);
  assert.ok(run.minions.every((m) => m.dead));
});

test('alpha is larger and howl buffs the pack only for its duration', () => {
  const { run, ctx } = setup('fenrir_pack');
  NATURE_HANDLERS.fenrir_pack.update(ctx);
  const alpha = run.minions.find((m) => m.slot === 0), other = run.minions.find((m) => m.slot === 1);
  assert.ok(alpha.r > other.r); const dmg = other.dmg, speed = other.speed;
  NATURE_HANDLERS.fenrir_pack.cast(ctx);
  const howl = run.events.find((event) => event.kind === 'howl');
  assert.equal(howl.r, ctx.area(ctx.s.howlRadius));
  assert.ok(Number.isFinite(howl.r));
  assert.ok(other.dmg > dmg); assert.ok(other.speed > speed);
  run.t = ctx.spell.howlUntil + SIM.step;
  NATURE_HANDLERS.fenrir_pack.update(ctx);
  assert.equal(other.dmg, dmg); assert.equal(other.speed, speed);
});

test('leaf blades bounce to fresh targets and tempest spirals before seeking', () => {
  const { run, ctx } = setup('razor_leaf');
  target(run, 0.3); const next = target(run, 3, 2);
  NATURE_HANDLERS.razor_leaf.cast(ctx);
  const p = run.projectiles[0];
  updateEntities(run, SIM.step);
  assert.equal(p.hits.size, 1);
  assert.equal(p.bounces, ctx.s.bounces - 1);
  assert.ok(Math.abs(p.angle - Math.atan2(next.z - p.z, next.x - p.x)) < 0.001);
  const tempest = setup('blade_tempest'); target(tempest.run, 10, 4);
  NATURE_HANDLERS.blade_tempest.cast(tempest.ctx);
  const blade = tempest.run.projectiles[0], angle = blade.angle;
  updateEntities(tempest.run, SIM.step);
  assert.notEqual(blade.angle, angle);
  for (let i = 0; i < 40; i++) updateEntities(tempest.run, SIM.step);
  assert.ok(blade.data.released);
});

test('all nature spells meet 60-second damage, entity and step-time guardrails', () => {
  for (const def of NATURE_SPELLS) {
    const bands = def.evolvedFrom ? [[8, 440, 1020]] : [[1, 55, 100], [4, 120, 200], [8, 220, 380]];
    for (const [level, min, max] of bands) {
      const result = benchSpell({ spellId: def.id, level });
      assert.ok(result.dps > 0, `${def.id}@${level} dealt no damage`);
      assert.ok(result.peak.projectiles <= SIM.maxProjectiles);
      assert.ok(result.peak.minions <= SIM.maxMinions);
      assert.ok(result.msPerStep < 0.8, `${def.id}: ${result.msPerStep} ms/step`);
    }
  }
});
