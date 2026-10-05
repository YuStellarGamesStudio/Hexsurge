// Floating eye: gravity cores, a readable rotating gaze, and open spiral lanes.
import { BOSS_RULES } from '../../data/bosses.js';
import { TAU } from '../math.js';
import { blast, bullet, markCast, moveToward, pool, ready, summon, toPlayer } from './kit.js';

export default {
  init(run, b) {
    const a = b.bossDef.attacks;
    b.data = { orbit: toPlayer(run, b), summonT: 0, spiralT: 0, shotT: 0, spiralAngle: 0, gazeT: 0, gazeLeft: 0,
      vfx: { shape: 'orb', color: b.def.accent, size: a.bulletSize, glow: a.bulletGlow } };
  },
  update(run, b, dt, ctx) {
    const a = b.bossDef.attacks, d = b.data, p = run.player;
    const rate = ctx.enraged ? BOSS_RULES.enrageCooldown : 1;
    d.orbit += a.orbitRate * dt;
    moveToward(run, b, p.x + Math.cos(d.orbit) * a.orbitDistance, p.z + Math.sin(d.orbit) * a.orbitDistance,
      b.speed * (ctx.enraged ? BOSS_RULES.enrageSpeed : 1) * (b.casting > 0 ? a.windupSpeed : 1), dt);
    b.facing = toPlayer(run, b);

    if (ready(b, 'gravity_wells', dt, a.gravity_wells.cooldown, rate)) {
      const c = a.gravity_wells, count = c.count + (ctx.enraged ? c.extra : 0), angle = run.rng() * TAU;
      for (let i = 0; i < count; i++) {
        const offset = angle + i * TAU / count;
        pool(run, { x: p.x + Math.cos(offset) * c.spacing, z: p.z + Math.sin(offset) * c.spacing,
          radius: c.radius, coreRadius: c.coreRadius, warn: c.warn, life: c.life, damage: c.damage * ctx.dmgMult,
          tick: c.tick, pull: c.pull, color: b.def.accent, element: 'void', kind: 'gravity_wells' });
      }
      markCast(b, c.warn);
    }
    if (d.gazeLeft > 0 && (d.gazeT -= dt) <= 0) {
      const c = a.gaze_sweep;
      const angle = d.gazeAngle + c.arc * (c.slices - d.gazeLeft) / (c.slices - 1);
      const count = 1 + (ctx.enraged ? c.extra : 0);
      for (let i = 0; i < count; i++) bullet(run, b, {
        from: d.gazeOrigin, angle: angle + i * c.arc / (c.slices * count), speed: c.speed, damage: c.damage * ctx.dmgMult,
        radius: c.bulletRadius, life: c.life, vfx: d.vfx,
      });
      d.gazeLeft--; d.gazeT = c.interval;
    }
    if (ready(b, 'gaze_sweep', dt, a.gaze_sweep.cooldown, rate)) {
      const c = a.gaze_sweep, aim = b.facing - c.arc / 2;
      d.gazeAngle = aim; d.gazeOrigin = { x: b.x, z: b.z }; d.gazeLeft = c.slices; d.gazeT = c.warn;
      // The entire sweep is previewed; later rays activate later, allowing a crossing behind it.
      for (let i = 0; i < c.slices; i++) {
        const angle = aim + c.arc * i / (c.slices - 1);
        for (let j = 1; j <= c.length; j++) blast(run, {
          x: b.x + Math.cos(angle) * j * c.step, z: b.z + Math.sin(angle) * j * c.step,
          radius: c.radius, warn: c.warn + i * c.interval, active: c.active,
          damage: c.damage * ctx.dmgMult, color: b.def.accent, element: 'void', kind: 'gaze_sweep',
        });
      }
      markCast(b, c.warn + (c.slices - 1) * c.interval);
    }
    if (ctx.tier >= 1) {
      const c = a.rift_summons;
      if (d.summonT > 0 && (d.summonT -= dt) <= 0) {
        summon(run, b, 'gloom_bat', c.count, c.spawnRadius);
        if (ctx.tier >= 2) summon(run, b, 'wraith', c.eliteCount, c.spawnRadius);
      }
      if (ready(b, 'rift_summons', dt, c.cooldown, rate)) {
        d.summonT = c.warn;
        blast(run, { x: b.x, z: b.z, radius: c.radius, warn: c.warn, damage: 0,
          color: b.def.accent, element: 'void', kind: 'rift_summons' });
        markCast(b, c.warn);
      }
    }
    if (ctx.tier >= 2) {
      const c = a.void_spiral;
      if (d.spiralT > 0) {
        d.spiralT -= dt; d.shotT -= dt;
        if (d.shotT <= 0) {
          d.shotT += c.interval;
          const arms = c.arms + (ctx.enraged ? c.extra : 0);
          for (let i = 0; i < arms; i++) bullet(run, b, { angle: d.spiralAngle + i * TAU / arms,
            speed: c.speed, damage: c.damage * ctx.dmgMult, radius: c.bulletRadius, life: c.life, vfx: d.vfx });
          d.spiralAngle += c.rotation;
          markCast(b);
        }
      }
      if (ready(b, 'void_spiral', dt, c.cooldown, rate)) {
        d.spiralT = c.duration; d.shotT = 0; d.spiralAngle = b.facing;
      }
    }
  },
};
