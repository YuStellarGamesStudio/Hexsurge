// Breath and dash paths are locked during wind-up; no late homing corrections.
import { BOSS_RULES } from '../../data/bosses.js';
import { TAU } from '../math.js';
import { blast, clampToArena, fan, markCast, moveToward, ready, summon, toPlayer } from './kit.js';

export default {
  init(run, b) { b.data = { breathWind: 0, dashWind: 0, dashT: 0 }; },
  update(run, b, dt, ctx) {
    const d = b.data, a = b.bossDef.attacks, p = run.player;
    const rate = ctx.rate ?? (ctx.enraged ? BOSS_RULES.enrageCooldown : 1);
    const speedMult = ctx.enraged ? BOSS_RULES.enrageSpeed : 1;
    if (d.dashWind > 0) {
      d.dashWind -= dt;
      if (d.dashWind <= 0) d.dashT = a.blizzard_dash.duration;
    } else if (d.dashT > 0) {
      d.dashT -= dt;
      const distance = moveToward(run, b, d.tx, d.tz, a.blizzard_dash.speed * speedMult, dt);
      if (distance <= b.r) d.dashT = 0;
    } else if (d.breathWind <= 0) {
      const angle = toPlayer(run, b), distance = Math.hypot(p.x - b.x, p.z - b.z);
      const approach = distance > a.movement.distance ? 1 : -a.movement.strafe;
      moveToward(run, b, b.x + Math.cos(angle) * approach - Math.sin(angle) * a.movement.strafe, b.z + Math.sin(angle) * approach + Math.cos(angle) * a.movement.strafe, b.speed * speedMult, dt);
      b.facing = angle;
    }
    const breath = a.frost_breath;
    if (d.breathWind > 0) {
      d.breathWind -= dt;
      if (d.breathWind <= 0) fan(run, b, { ...breath, count: breath.bullets + (ctx.enraged ? breath.extra : 0), angle: d.breathAngle, damage: breath.damage * ctx.dmgMult });
    }
    if (d.dashT <= 0 && d.dashWind <= 0 && ready(b, 'breathCd', dt, breath.cooldown, rate)) {
      d.breathAngle = toPlayer(run, b); d.breathWind = breath.warn;
      b.facing = d.breathAngle; markCast(b, breath.warn);
      const dx = Math.cos(d.breathAngle), dz = Math.sin(d.breathAngle);
      // Widening circular rows compose a cone without requiring renderer-only geometry.
      for (let row = 1; row <= breath.rows; row++) {
        const distance = row * breath.spacing;
        for (let lane = -1; lane <= 1; lane++) {
          const side = lane * distance * breath.width;
          blast(run, { x: b.x + dx * distance - dz * side, z: b.z + dz * distance + dx * side, radius: breath.radius, warn: breath.warn, damage: breath.damage * ctx.dmgMult, color: b.def.accent, element: 'ice', kind: 'frost_breath' });
        }
      }
    }
    const rain = a.icicle_rain;
    if (ready(b, 'rainCd', dt, rain.cooldown, rate)) {
      markCast(b, rain.warn);
      const rotation = run.rng() * TAU;
      for (let i = 0; i < rain.count; i++) {
        const angle = rotation + i / rain.count * TAU, distance = i === 0 ? 0 : rain.spread;
        blast(run, { x: p.x + Math.cos(angle) * distance, z: p.z + Math.sin(angle) * distance, ...rain, damage: rain.damage * ctx.dmgMult, color: b.def.accent, element: 'ice', kind: 'icicle_rain' });
      }
    }
    const dash = a.blizzard_dash;
    if (ctx.tier >= 1 && d.breathWind <= 0 && d.dashT <= 0 && d.dashWind <= 0 && ready(b, 'dashCd', dt, dash.cooldown, rate)) {
      const angle = toPlayer(run, b), dx = Math.cos(angle), dz = Math.sin(angle);
      const target = { x: p.x + dx * dash.extension, z: p.z + dz * dash.extension };
      clampToArena(target); d.tx = target.x; d.tz = target.z; d.dashWind = dash.warn;
      b.facing = angle; markCast(b, dash.warn);
      const distance = Math.hypot(d.tx - b.x, d.tz - b.z);
      for (let along = 0; along < distance; along += dash.spacing) blast(run, { x: b.x + dx * along, z: b.z + dz * along, radius: dash.radius, warn: dash.warn, damage: 0, color: b.def.accent, element: 'ice', kind: 'blizzard_dash' });
    }
    const adds = a.ice_golems;
    if (ctx.tier >= 1 && ready(b, 'summonCd', dt, adds.cooldown, rate)) {
      markCast(b);
      summon(run, b, adds.id, ctx.tier >= 2 ? adds.finalCount : adds.count);
    }
  },
};
