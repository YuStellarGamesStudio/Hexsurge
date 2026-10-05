import test from 'node:test';
import assert from 'node:assert/strict';
import { ARCANE_SPELLS } from '../src/data/spells/arcane.js';
import { SPELL_BY_ID } from '../src/data/spells/index.js';
import { ARCANE_HANDLERS } from '../src/sim/spells/arcane.js';
import { makeCtx } from '../src/sim/spells/index.js';
import { createRun } from '../src/sim/run.js';
import { addSpell, evolveSpell } from '../src/sim/progression.js';
import { spawnEnemy } from '../src/sim/enemies.js';
import { updateEntities } from '../src/sim/entities.js';
import { ENEMY_BY_ID } from '../src/data/enemies.js';

function setup(id) {
  const run = createRun({ mageId: 'ignis', mapId: 'academy', seed: 42 });
  run.spells.length = 0;
  const spell = addSpell(run, id);
  return makeCtx(run, spell);
}

test('arcane definitions have complete localization, two-stat upgrades and recipes', () => {
  assert.equal(ARCANE_SPELLS.length, 6);
  for (const def of ARCANE_SPELLS) {
    assert.equal(def.element, 'arcane');
    assert.ok(ARCANE_HANDLERS[def.id]);
    for (const key of ['name', 'desc']) for (const lang of ['zh', 'en', 'ja']) assert.ok(def[key][lang]?.length);
    if (!def.evolvedFrom) {
      assert.equal(def.perLevel.length, 7);
      for (const delta of def.perLevel) {
        assert.equal(Object.keys(delta).length, 2);
        for (const [key, value] of Object.entries(delta)) {
          assert.ok(['damage', 'count', 'cooldown', 'radius', 'shield'].includes(key));
          assert.ok(key === 'cooldown' ? value < 0 : value > 0);
        }
      }
      assert.equal(SPELL_BY_ID[def.evolution.id].evolvedFrom, def.id);
    }
  }
});

test('missiles home and arcane hits attune; evolved warheads detonate', () => {
  const ctx = setup('arcane_missiles');
  const enemy = spawnEnemy(ctx.run, ENEMY_BY_ID.imp, 1, 0);
  enemy.hp = enemy.maxHp = 10000;
  ctx.run.grid.insert(enemy);
  ARCANE_HANDLERS.arcane_missiles.cast(ctx);
  assert.equal(ctx.run.projectiles.length, ctx.count);
  assert.ok(ctx.run.projectiles.every(p => p.homing > 0));
  for (let i = 0; i < 20; i++) updateEntities(ctx.run, 1 / 60);
  assert.ok(enemy.attuneT > 0);
  const evolved = setup('arcane_barrage');
  ARCANE_HANDLERS.arcane_barrage.cast(evolved);
  const warhead = evolved.run.projectiles[0];
  assert.ok(warhead.onHit && warhead.onExpire);
  warhead.onHit(evolved.run, warhead);
  assert.ok(evolved.run.events.some(e => e.type === 'burst' && e.element === 'arcane'));
});

test('orrery has nested counter-rotating rings and star shots; disposal removes all bodies', () => {
  const ctx = setup('celestial_orrery');
  const h = ARCANE_HANDLERS.celestial_orrery;
  h.update(ctx, 0.1);
  assert.equal(ctx.run.orbiters.length, ctx.count);
  assert.ok(ctx.spell.orbitAngle > 0 && ctx.spell.outer.orbitAngle < 0);
  assert.ok(ctx.spell.outer.orbiters[0].orbitR > ctx.spell.orbiters[0].orbitR);
  h.cast(ctx);
  assert.equal(ctx.run.projectiles.length, ctx.s.shotCount);
  h.dispose(ctx);
  assert.ok(ctx.run.orbiters.every(o => o.dead));
});

test('barrier grants and restores shields; aegis absorbs only in-radius bullets and shockwaves', () => {
  const ctx = setup('mana_barrier');
  const h = ARCANE_HANDLERS.mana_barrier;
  assert.equal(ctx.player.shield, ctx.s.shield);
  h.update(ctx, 0.1);
  ctx.player.shield = 0;
  h.cast(ctx);
  assert.equal(ctx.player.shield, ctx.s.restore);
  const oldArea = ctx.spell.barrier;
  ctx.spell.level = 8;
  evolveSpell(ctx.run, ctx.spell);
  assert.ok(oldArea.dead);
  const evolved = makeCtx(ctx.run, ctx.spell);
  ctx.run.eprojectiles.push({ x: 1, z: 0 }, { x: 20, z: 0 });
  ARCANE_HANDLERS.aegis_of_mana.update(evolved, 0.1);
  assert.equal(ctx.run.eprojectiles.length, 1);
  assert.equal(ctx.run.eprojectiles[0].x, 20);
  ARCANE_HANDLERS.aegis_of_mana.cast(evolved);
  const wave = ctx.run.areas.find(a => a.vfx === evolved.def.shockVfx);
  assert.equal(wave.r, evolved.s.shockRadius);
  assert.equal(wave.dmg, evolved.s.shockDamage);
  assert.ok(wave.tick > wave.life, 'shockwave hits once, not every frame');
  assert.equal(evolved.def.areaVfx.fillOpacity, 0);
  assert.equal(evolved.def.areaVfx.ringOpacity, 0);
});
