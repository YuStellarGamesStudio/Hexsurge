// Basalt titan: planted wind-ups, escapable shockwaves, and persistent lava.
import { BOSS_RULES } from '../../data/bosses.js';
import { TAU } from '../math.js';
import { blast, bullet, markCast, moveToward, pool, ready, summon, toPlayer } from './kit.js';

function shockwave(run, b, c, ctx, angle, origin) {
  const count = c.count + (ctx.enraged ? c.extra : 0);
  // Leave a wide corridor toward the snapshotted aim, rather than enclosing the player.
  for (let i = c.gap; i < count; i++) bullet(run, b, {
    from: origin, angle: angle + (i - c.gap / 2) * TAU / count,
    speed: c.speed, damage: (c.bulletDamage ?? c.damage) * ctx.dmgMult,
    radius: c.bulletRadius, life: c.life, vfx: b.data.vfx,
  });
  markCast(b);
}

export default {
  init(run, b) {
    const a = b.bossDef.attacks;
    b.data = { slamT: 0, volleyT: 0, volleys: 0, summonT: 0,
      vfx: { shape: 'flame', color: b.def.accent, size: a.bulletSize, glow: a.bulletGlow } };
  },
  update(run, b, dt, ctx) {
    const a = b.bossDef.attacks, d = b.data, p = run.player;
    const rate = ctx.enraged ? BOSS_RULES.enrageCooldown : 1;
    const speed = b.speed * (ctx.enraged ? BOSS_RULES.enrageSpeed : 1);
    if (Math.hypot(p.x - b.x, p.z - b.z) > a.stopDistance)
      moveToward(run, b, p.x, p.z, speed * (b.casting > 0 ? a.windupSpeed : 1), dt);
    b.facing = toPlayer(run, b);

    if (d.slamT > 0 && (d.slamT -= dt) <= 0) shockwave(run, b, a.ground_slam, ctx, d.slamAngle, d.slamOrigin);
    if (ready(b, 'ground_slam', dt, a.ground_slam.cooldown, rate)) {
      const c = a.ground_slam;
      d.slamOrigin = { x: b.x, z: b.z }; d.slamAngle = b.facing; d.slamT = c.warn;
      blast(run, { x: b.x, z: b.z, radius: c.radius, warn: c.warn, damage: c.damage * ctx.dmgMult,
        color: b.def.accent, element: 'fire', kind: 'ground_slam' });
      markCast(b, c.warn);
    }
    if (ready(b, 'lava_pools', dt, a.lava_pools.cooldown, rate)) {
      const c = a.lava_pools, count = c.count + (ctx.enraged ? c.extra : 0), angle = run.rng() * TAU;
      for (let i = 0; i < count; i++) {
        const offset = i * TAU / count + angle;
        pool(run, { x: p.x + Math.cos(offset) * c.spacing, z: p.z + Math.sin(offset) * c.spacing,
          radius: c.radius, warn: c.warn, life: c.life, damage: c.damage * ctx.dmgMult, tick: c.tick,
          color: b.def.accent, element: 'fire', kind: 'lava_pools' });
      }
      markCast(b, c.warn);
    }
    if (ctx.tier >= 1) {
      const c = a.fire_ring_volley;
      if (d.volleys > 0 && (d.volleyT -= dt) <= 0) {
        shockwave(run, b, c, ctx, d.volleyAngle, d.volleyOrigin);
        d.volleys--; d.volleyT = c.interval; d.volleyAngle += c.rotation;
      }
      if (ready(b, 'fire_ring_volley', dt, c.cooldown, rate)) {
        d.volleyOrigin = { x: b.x, z: b.z }; d.volleyAngle = b.facing;
        d.volleys = c.volleys; d.volleyT = c.warn;
        markCast(b, c.warn);
      }
      const s = a.magma_bombers;
      if (d.summonT > 0 && (d.summonT -= dt) <= 0) {
        summon(run, b, 'bomb_imp', s.count, s.spawnRadius);
        if (ctx.tier >= 2) summon(run, b, 'magma_bomber', s.eliteCount, s.spawnRadius);
      }
      if (ready(b, 'magma_bombers', dt, s.cooldown, rate)) {
        d.summonT = s.warn;
        blast(run, { x: b.x, z: b.z, radius: s.radius, warn: s.warn, damage: 0,
          color: b.def.accent, element: 'fire', kind: 'magma_bombers' });
        markCast(b, s.warn);
      }
    }
  },
};
