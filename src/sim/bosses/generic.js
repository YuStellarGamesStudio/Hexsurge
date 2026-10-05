// Fallback brain: slow pursuit plus rings. Each boss file overrides this with its own patterns.
import { BOSSES } from '../../data/bosses.js';
import { moveToward, ready, ring, fan, summon, blast } from './kit.js';

export function makeGenericBrain(summonId) {
  return {
    init(run, b) { b.data = {}; },
    update(run, b, dt, ctx) {
      const p = run.player;
      moveToward(run, b, p.x, p.z, b.speed * (ctx.enraged ? 1.35 : 1), dt);
      const rate = ctx.enraged ? 0.65 : 1;
      if (ready(b, 'ring', dt, 4, rate)) ring(run, b, { count: 14, speed: 6, damage: 10 * ctx.dmgMult, offset: run.rng() * 6.28 });
      if (ready(b, 'fan', dt, 3.2, rate)) fan(run, b, { count: 5, spread: 0.9, speed: 8, damage: 11 * ctx.dmgMult });
      if (ctx.tier >= 1 && ready(b, 'sum', dt, 12, rate)) summon(run, b, summonId, 4);
      if (ctx.tier >= 1 && ready(b, 'blast', dt, 5, rate)) blast(run, { x: p.x, z: p.z, radius: 3, warn: 1.2, damage: 18 * ctx.dmgMult });
    },
  };
}
export { BOSSES };
