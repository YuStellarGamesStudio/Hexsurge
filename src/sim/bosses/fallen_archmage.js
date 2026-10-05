// Teleport destinations and rune seals are fixed at cast time, never chasing the player.
import { BOSS_RULES } from '../../data/bosses.js';
import { TAU } from '../math.js';
import { blast, bullet, clampToArena, markCast, moveToward, ready, summon, toPlayer } from './kit.js';

export default {
  init(run, b) { b.data = { ringWind: 0, teleportWind: 0, spiralT: 0, spiralShot: 0, spiralAngle: 0 }; },
  update(run, b, dt, ctx) {
    const d = b.data, a = b.bossDef.attacks, p = run.player;
    const rate = ctx.rate ?? (ctx.enraged ? BOSS_RULES.enrageCooldown : 1);
    const speed = b.speed * (ctx.enraged ? BOSS_RULES.enrageSpeed : 1);
    if (d.teleportWind > 0) {
      d.teleportWind -= dt;
      if (d.teleportWind <= 0) { b.x = d.tx; b.z = d.tz; clampToArena(b); }
    } else if (Math.hypot(b.x - p.x, b.z - p.z) > a.movement.distance) moveToward(run, b, p.x, p.z, speed, dt);
    b.facing = toPlayer(run, b);
    if (ready(b, 'teleportCd', dt, a.movement.teleportCd, rate)) {
      const angle = run.rng() * TAU;
      const target = { x: p.x + Math.cos(angle) * a.movement.teleportRadius, z: p.z + Math.sin(angle) * a.movement.teleportRadius };
      clampToArena(target);
      d.tx = target.x; d.tz = target.z; d.teleportWind = a.movement.teleportWarn;
      markCast(b, d.teleportWind);
      blast(run, { x: d.tx, z: d.tz, radius: b.r, warn: d.teleportWind, damage: 0, color: b.def.accent, element: 'arcane', kind: 'teleport' });
    }
    const ring = a.arcane_rings;
    if (d.ringWind > 0) {
      d.ringWind -= dt;
      if (d.ringWind <= 0) {
        const count = ring.count + (ctx.enraged ? ring.extra : 0);
        // A three-slot corridor makes the expanding ring escapable even nearby.
        for (let i = ring.gap; i < count; i++) bullet(run, b, { ...ring, angle: d.ringAngle + i / count * TAU, damage: ring.damage * ctx.dmgMult });
      }
    }
    if (ready(b, 'ringCd', dt, ring.cooldown, rate)) {
      d.ringWind = ring.warn; d.ringAngle = toPlayer(run, b) - ring.gap / ring.count * Math.PI;
      markCast(b, ring.warn);
      blast(run, { x: b.x, z: b.z, radius: b.r, warn: ring.warn, damage: 0, color: b.def.accent, element: 'arcane', kind: 'arcane_rings' });
    }
    const seal = a.rune_seals;
    if (ready(b, 'sealCd', dt, seal.cooldown, rate)) {
      markCast(b, seal.warn);
      const angle = run.rng() * TAU;
      for (let i = 0; i < seal.count; i++) {
        const offset = i === 0 ? 0 : seal.spacing;
        const theta = angle + i / seal.count * TAU;
        blast(run, { x: p.x + Math.cos(theta) * offset, z: p.z + Math.sin(theta) * offset, ...seal, damage: seal.damage * ctx.dmgMult, color: b.def.accent, element: 'arcane', kind: 'rune_seals' });
      }
    }
    const adds = a.summon_constructs;
    if (ctx.tier >= 1 && ready(b, 'summonCd', dt, adds.cooldown, rate)) {
      markCast(b);
      for (const id of adds.ids.slice(0, ctx.tier + 1)) summon(run, b, id, adds.count);
    }
    const spiral = a.barrage_spiral;
    if (ctx.tier >= 2 && ready(b, 'spiralCd', dt, spiral.cooldown, rate)) { d.spiralT = spiral.duration; d.spiralShot = 0; markCast(b, spiral.duration); }
    if (d.spiralT > 0) {
      d.spiralT -= dt; d.spiralShot -= dt;
      if (d.spiralShot <= 0) {
        d.spiralShot += spiral.interval * rate;
        const arms = spiral.arms + (ctx.enraged ? spiral.extra : 0);
        for (let i = 0; i < arms; i++) bullet(run, b, { ...spiral, angle: d.spiralAngle + i / arms * TAU, damage: spiral.damage * ctx.dmgMult });
        d.spiralAngle += spiral.rotation;
      }
    }
  },
};
