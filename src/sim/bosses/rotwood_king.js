// Root chains lock their direction before erupting; poison pools leave safe lanes.
import { BOSS_RULES } from '../../data/bosses.js';
import { blast, fan, markCast, moveToward, pool, ready, summon, toPlayer } from './kit.js';

export default {
  init(run, b) { b.data = {}; },
  update(run, b, dt, ctx) {
    const a = b.bossDef.attacks, p = run.player;
    const rate = ctx.rate ?? (ctx.enraged ? BOSS_RULES.enrageCooldown : 1);
    moveToward(run, b, p.x, p.z, b.speed * (ctx.enraged ? BOSS_RULES.enrageSpeed : 1), dt);
    const root = a.root_eruption;
    if (ready(b, 'rootCd', dt, root.cooldown, rate)) {
      const angle = toPlayer(run, b), dx = Math.cos(angle), dz = Math.sin(angle);
      markCast(b, root.warn);
      for (let i = 1; i <= root.count; i++) blast(run, {
        x: b.x + dx * i * root.spacing, z: b.z + dz * i * root.spacing,
        ...root, damage: root.damage * ctx.dmgMult, color: b.def.accent, element: 'nature', kind: 'root_eruption',
      });
    }
    const spore = a.spore_cloud;
    if (ready(b, 'sporeCd', dt, spore.cooldown, rate)) {
      markCast(b, spore.warn);
      pool(run, { x: p.x, z: p.z, ...spore, damage: spore.damage * ctx.dmgMult, color: b.def.accent, element: 'nature', kind: 'spore_cloud' });
      if (ctx.enraged) {
        const angle = toPlayer(run, b) + Math.PI / 2;
        pool(run, { x: p.x + Math.cos(angle) * spore.offset, z: p.z + Math.sin(angle) * spore.offset, ...spore, damage: spore.damage * ctx.dmgMult, color: b.def.accent, element: 'nature', kind: 'spore_cloud' });
      }
    }
    const seed = a.seed_barrage;
    if (ctx.tier >= 1 && ready(b, 'seedCd', dt, seed.cooldown, rate)) fan(run, b, { ...seed, count: seed.count + (ctx.enraged ? seed.extra : 0), damage: seed.damage * ctx.dmgMult });
    const adds = a.treant_call;
    // Tier one introduces small add calls; the final tier unlocks the full treant wave.
    if (ctx.tier >= 1 && ready(b, 'summonCd', dt, adds.cooldown, rate)) {
      markCast(b);
      for (const id of adds.ids) summon(run, b, id, ctx.tier >= 2 ? adds.finalCount : adds.count);
    }
  },
};
