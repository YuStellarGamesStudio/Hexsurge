// Fire handlers use base damage; combat owns scaling, burn statuses and elemental reactions.
import { burst, aimAngle, nearestN, randomEnemy, spawnArea, spawnProjectile, spawnStrike, syncOrbiters, clearOrbiters } from '../entities.js';
import { damageEnemy, healPlayer, emit } from '../combat.js';
import { TAU } from '../math.js';

function placePools(ctx, volcano) {
  const { run, s, def } = ctx;
  const targets = nearestN(run, run.player.x, run.player.z, s.range, ctx.count);
  if (!targets.length) return false;
  for (const target of targets) {
    const pool = spawnArea(run, { x: target.x, z: target.z, radius: ctx.area(s.radius), duration: ctx.duration(s.duration), tick: s.tick, damage: s.damage, element: 'fire', spellId: def.id, vfx: def.vfx });
    if (!volcano) continue;
    pool.data = { eruption: s.eruptionInterval };
    pool.onUpdate = (r, a, dt) => {
      a.data.eruption -= dt;
      if (a.data.eruption > 0) return;
      a.data.eruption += s.eruptionInterval;
      burst(r, { x: a.x, z: a.z, radius: a.r * s.eruptionScale, damage: s.eruptionDamage, knock: s.knock, element: 'fire', spellId: def.id, kind: 'volcano' });
      const phase = r.rng() * TAU;
      for (let i = 0; i < s.fragments; i++) spawnProjectile(r, { x: a.x, z: a.z, angle: phase + i * TAU / s.fragments, speed: s.fragmentSpeed, damage: s.fragmentDamage, radius: s.fragmentRadius, life: s.fragmentLife, element: 'fire', spellId: def.id, vfx: { shape: 'flame', color: '#ffab32', size: 0.65, glow: 1.8, trail: 'fire' } });
    };
  }
}

function orbit(ctx, dt, phoenix) {
  const { run, spell, s, def } = ctx;
  syncOrbiters(run, spell, { count: ctx.count, radius: ctx.area(s.radius), speed: s.speed, damage: s.damage, size: ctx.area(s.size), hitInterval: (s.hitInterval ?? s.cooldown) * (1 - run.player.stats.cooldown) / run.player.stats.castSpeed, element: 'fire', vfx: def.vfx, onHit: phoenix ? phoenixKill : undefined }, dt);
  if (phoenix) for (const body of spell.orbiters) body.data = s;
}

function phoenixKill(run, body, enemy) {
  if (!enemy.dead) return;
  const s = body.data;
  if (s && run.rng() < s.healChance) healPlayer(run, s.heal);
}

export const FIRE_HANDLERS = {
  fireball: {
    cast(ctx) {
      const { run, s, def } = ctx;
      const p = run.player;
      const base = aimAngle(run, p.x, p.z);
      const explode = (r, pr) => burst(r, { x: pr.x, z: pr.z, radius: ctx.area(s.explode), damage: s.damage * s.splash, element: 'fire', spellId: def.id, kind: 'explosion' });
      for (let i = 0; i < ctx.count; i++) spawnProjectile(run, { x: p.x, z: p.z, angle: base + (i - (ctx.count - 1) / 2) * s.spread, speed: s.speed, damage: s.damage, radius: s.radius, life: s.life, element: 'fire', spellId: def.id, vfx: def.vfx, knock: s.knock, onHit: explode, onExpire: explode });
    },
  },
  meteor_rain: {
    cast(ctx) {
      const { run, s, def } = ctx;
      const p = run.player;
      for (let i = 0; i < ctx.count; i++) {
        const t = randomEnemy(run, p.x, p.z, s.range);
        if (!t) return i === 0 ? false : undefined;
        const x = t.x + (run.rng() - 0.5) * s.scatter;
        const z = t.z + (run.rng() - 0.5) * s.scatter;
        spawnStrike(run, { x, z, radius: ctx.area(s.radius), damage: s.damage, delay: s.delay + i * s.stagger, element: 'fire', spellId: def.id, vfx: def.vfx, knock: s.knock, kind: 'meteor', onImpact: (r, st, hits) => {
          for (const e of hits) damageEnemy(r, e, st.dmg, { element: 'fire', spellId: def.id, knock: st.knock, kx: st.x, kz: st.z });
          spawnArea(r, { x: st.x, z: st.z, radius: st.r * s.poolScale, duration: ctx.duration(s.fire), tick: s.tick, damage: s.damage * s.burn, element: 'fire', spellId: def.id, vfx: { shape: 'disc', color: '#ff5a1a', size: st.r * s.poolScale, glow: 1.2 } });
        } });
      }
    },
  },
  ember_field: { cast(ctx) { return placePools(ctx, false); } },
  volcano_eruption: { cast(ctx) { return placePools(ctx, true); } },
  flame_wheel: { update(ctx, dt) { orbit(ctx, dt, false); }, dispose(ctx) { clearOrbiters(ctx.run, ctx.spell); } },
  phoenix_ring: {
    update(ctx, dt) { orbit(ctx, dt, true); },
    cast(ctx) {
      const { run, spell, s, def } = ctx;
      emit(run, { type: 'burst', x: run.player.x, z: run.player.z, r: ctx.area(s.radius) * s.flourishScale, element: 'fire', kind: 'phoenix' });
      for (const body of spell.orbiters ?? []) spawnProjectile(run, { x: body.x, z: body.z, angle: body.angle, speed: s.featherSpeed, damage: s.featherDamage, radius: s.featherRadius, life: s.featherLife, pierce: s.featherPierce, element: 'fire', spellId: def.id, vfx: { shape: 'crescent', color: '#ffd15a', size: 0.7, glow: 1.8, trail: 'fire' }, data: s, onHit: phoenixKill });
    },
    dispose(ctx) { clearOrbiters(ctx.run, ctx.spell); },
  },
};
