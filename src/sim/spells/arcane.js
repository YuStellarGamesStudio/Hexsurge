// Arcane handlers use central damage/attunement and shared projectile/orbit lifecycles.
import { burst, clearOrbiters, spawnArea, spawnProjectile, syncOrbiters } from '../entities.js';
import { TAU } from '../math.js';
import { recomputeStats } from '../player.js';

function detonate(run, projectile) {
  const b = projectile.data;
  burst(run, { x: projectile.x, z: projectile.z, radius: b.radius, damage: b.damage, element: 'arcane', spellId: projectile.spellId, kind: 'explosion' });
}

function orbit(ctx, dt, state, radius, speed, count, size, damage) {
  syncOrbiters(ctx.run, state, { count, radius: ctx.area(radius), speed, damage, size, hitInterval: ctx.s.hitInterval, element: 'arcane', vfx: ctx.def.vfx }, dt);
}

function barrierUpdate(ctx, dt) {
  const { run, player, spell, s, def } = ctx;
  if (player.spellShield[def.id] !== s.shield) {
    player.spellShield[def.id] = s.shield;
    recomputeStats(run);
  }
  if (!spell.barrier || spell.barrier.dead) {
    spell.barrier = spawnArea(run, { x: player.x, z: player.z, radius: ctx.area(s.radius), duration: Infinity, tick: s.tick, damage: s.damage, follow: true, element: 'arcane', spellId: def.id, vfx: def.vfx });
  }
  spell.barrier.r = ctx.area(s.radius);
  spell.barrier.dmg = s.damage;
  // Separate rune bodies animate the perimeter without obscuring the matte enemy silhouettes.
  syncOrbiters(run, spell, { count: s.runes, radius: ctx.area(s.radius), speed: s.rotation, damage: 0, size: s.runeSize, hitInterval: s.tick, element: 'arcane', vfx: def.vfx }, dt);
}

function barrierInit(ctx) {
  ctx.player.spellShield[ctx.def.id] = ctx.s.shield;
  recomputeStats(ctx.run);
}

function barrierDispose(ctx) {
  if (ctx.spell.barrier) ctx.spell.barrier.dead = true;
  clearOrbiters(ctx.run, ctx.spell);
  delete ctx.player.spellShield[ctx.def.id];
  recomputeStats(ctx.run);
}

export const ARCANE_HANDLERS = {
  arcane_missiles: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      const angle = ctx.aim();
      for (let i = 0; i < ctx.count; i++) spawnProjectile(run, { x: player.x, z: player.z, angle: angle + (i - (ctx.count - 1) / 2) * s.spread, speed: s.speed, damage: s.damage, radius: s.radius, life: s.life, homing: s.homing, element: 'arcane', spellId: def.id, vfx: def.vfx });
    },
  },
  arcane_barrage: {
    cast(ctx) {
      const { run, player, s, def, spell } = ctx;
      spell.launchAngle = (spell.launchAngle ?? 0) + s.rotation * s.cooldown;
      const data = { radius: ctx.area(s.explode), damage: s.blastDamage };
      for (let i = 0; i < ctx.count; i++) {
        const a = spell.launchAngle + i / ctx.count * TAU;
        spawnProjectile(run, { x: player.x + Math.cos(a) * s.launchRadius, z: player.z + Math.sin(a) * s.launchRadius, angle: a, speed: s.speed, damage: s.damage, radius: s.radius, life: s.life, homing: s.homing, element: 'arcane', spellId: def.id, vfx: def.vfx, onHit: detonate, onExpire: detonate, data });
      }
    },
  },
  arcane_orbs: {
    update(ctx, dt) { orbit(ctx, dt, ctx.spell, ctx.s.radius, ctx.s.speed, ctx.count, ctx.s.size, ctx.s.damage); },
    dispose(ctx) { clearOrbiters(ctx.run, ctx.spell); },
  },
  celestial_orrery: {
    update(ctx, dt) {
      const { spell, s, def } = ctx;
      const inner = Math.ceil(ctx.count / 2);
      orbit(ctx, dt, spell, s.radius, s.speed, inner, s.size, s.damage);
      const outer = spell.outer ?? (spell.outer = { def });
      orbit(ctx, dt, outer, s.radius * s.outerScale, s.outerSpeed, ctx.count - inner, s.outerSize, s.damage);
    },
    cast(ctx) {
      const { run, spell, s, def } = ctx;
      const bodies = spell.outer?.orbiters ?? spell.orbiters;
      if (!bodies?.length) return;
      for (let i = 0; i < s.shotCount; i++) {
        const body = bodies[(spell.starIndex ?? 0) % bodies.length];
        spell.starIndex = (spell.starIndex ?? 0) + 1;
        spawnProjectile(run, { x: body.x, z: body.z, angle: body.angle, speed: s.shotSpeed, damage: s.shotDamage, radius: s.shotRadius, life: s.shotLife, homing: s.homing, element: 'arcane', spellId: def.id, vfx: def.starVfx });
      }
    },
    dispose(ctx) { clearOrbiters(ctx.run, ctx.spell); if (ctx.spell.outer) clearOrbiters(ctx.run, ctx.spell.outer); },
  },
  mana_barrier: {
    init: barrierInit, update: barrierUpdate, dispose: barrierDispose,
    cast(ctx) { ctx.player.shield = Math.min(ctx.player.shieldMax, ctx.player.shield + ctx.s.restore); },
  },
  aegis_of_mana: {
    init: barrierInit, dispose: barrierDispose,
    update(ctx, dt) {
      barrierUpdate(ctx, dt);
      const { run, player, s } = ctx;
      const radius = ctx.area(s.radius);
      for (let i = run.eprojectiles.length - 1; i >= 0; i--) {
        const p = run.eprojectiles[i];
        if ((p.x - player.x) ** 2 + (p.z - player.z) ** 2 <= radius ** 2) {
          run.eprojectiles[i] = run.eprojectiles[run.eprojectiles.length - 1]; run.eprojectiles.pop();
        }
      }
    },
    cast(ctx) {
      ctx.player.shield = Math.min(ctx.player.shieldMax, ctx.player.shield + ctx.s.restore);
      burst(ctx.run, { x: ctx.player.x, z: ctx.player.z, radius: ctx.area(ctx.s.shockRadius), damage: ctx.s.shockDamage, knock: ctx.s.knock, element: 'arcane', spellId: ctx.def.id, kind: 'nova' });
    },
  },
};
