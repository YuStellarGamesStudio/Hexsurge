// Spell handler registry and the per-cast context handlers receive.
//
// Handler contract (one object per spell id, base AND evolved):
//   cast(ctx)        fired when the cooldown elapses (skip it for purely continuous spells and leave base.cooldown undefined)
//   update(ctx, dt)  optional, every simulation step (orbits, auras, minion upkeep)
//   init(ctx)        optional, when the spell is acquired or an evolved form takes over
//   dispose(ctx)     optional, when the spell is replaced (evolution)
//
// ctx = { run, player, spell, def, s, count, area(v), duration(v), aim(range) }
//   s         numeric stat block for the current level (data/spells spellStats)
//   count     s.count + passive projectile-count bonus
//   area(v)   v scaled by the area stat;  duration(v) likewise for the duration stat
// Damage numbers passed to damageEnemy / spawn* are BASE damage: player damage, synergy, crit and reactions are applied centrally.
import { spellStats } from '../../data/spells/index.js';
import { aimAngle } from '../entities.js';
import { FIRE_HANDLERS } from './fire.js';
import { ICE_HANDLERS } from './ice.js';
import { THUNDER_HANDLERS } from './thunder.js';
import { ARCANE_HANDLERS } from './arcane.js';
import { NATURE_HANDLERS } from './nature.js';
import { VOID_HANDLERS } from './void.js';

export const HANDLERS = {
  ...FIRE_HANDLERS, ...ICE_HANDLERS, ...THUNDER_HANDLERS, ...ARCANE_HANDLERS, ...NATURE_HANDLERS, ...VOID_HANDLERS,
};

export function makeCtx(run, spell) {
  const player = run.player;
  const stats = player.stats;
  if (spell.sLevel !== spell.level || spell.sDef !== spell.def) {
    spell.s = spellStats(spell.def, spell.level);
    spell.sLevel = spell.level; spell.sDef = spell.def;
  }
  const ctx = spell.ctx ?? (spell.ctx = {});
  ctx.run = run; ctx.player = player; ctx.spell = spell; ctx.def = spell.def; ctx.s = spell.s;
  ctx.count = Math.max(1, Math.round((spell.s.count ?? 1) + (spell.def.noCountBonus ? 0 : stats.count)));
  ctx.area = (v) => v * stats.area;
  ctx.duration = (v) => v * stats.duration;
  ctx.aim = (range = 22) => aimAngle(run, player.x, player.z, range);
  return ctx;
}

/** Seconds between casts after cast speed and cooldown reduction. */
export function effectiveCooldown(run, spell) {
  const st = run.player.stats;
  return Math.max(0.12, (spell.s?.cooldown ?? spell.def.base.cooldown) * (1 - st.cooldown) / st.castSpeed);
}
