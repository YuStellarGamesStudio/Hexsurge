// Void handlers: base damage enters the central pipeline unchanged; erosion is applied there.
import { burst, nearestEnemy, spawnArea, spawnMinion, syncMinions } from '../entities.js';
import { damageEnemy, emit } from '../combat.js';
import { TAU } from '../math.js';

function rift(ctx, singularity) {
  const { run, player, s, def } = ctx;
  const target = nearestEnemy(run, player.x, player.z, s.range);
  const x = target?.x ?? player.x, z = target?.z ?? player.z;
  spawnArea(run, {
    x, z, radius: ctx.area(s.radius), duration: ctx.duration(s.duration), tick: s.tick,
    damage: s.damage, element: def.element, spellId: def.id, pull: s.pull,
    vfx: { ...def.vfx, size: ctx.area(singularity ? s.coreRadius : s.radius) },
    ...(singularity ? {
      onTick(r, a, hits) {
        const core = ctx.area(s.coreRadius);
        for (const e of hits) if (Math.hypot(e.x - a.x, e.z - a.z) <= core + e.r)
          damageEnemy(r, e, s.damage, { element: def.element, spellId: def.id });
      },
      onExpire(r, a) {
        burst(r, { x: a.x, z: a.z, radius: ctx.area(s.collapseRadius), damage: s.collapseDamage, element: def.element, spellId: def.id, kind: 'collapse' });
      },
    } : {}),
  });
}

function maintainLegion(ctx, legion) {
  const { run, player, spell, s, def } = ctx;
  if (spell.killOrigin === undefined) spell.killOrigin = run.stats.kills;
  const recruits = legion ? Math.floor((run.stats.kills - spell.killOrigin) / s.killsPerRecruit) : 0;
  const count = legion ? Math.min(s.maxCount, ctx.count + recruits) : ctx.count;
  syncMinions(run, spell, count, (slot, slots) => {
    const angle = slot / slots * TAU;
    const melee = legion && slot % s.meleeEvery === 0;
    const minion = spawnMinion(run, {
      x: player.x + Math.cos(angle) * (s.formationRadius ?? def.vfx.size),
      z: player.z + Math.sin(angle) * (s.formationRadius ?? def.vfx.size),
      ai: melee ? 'melee' : 'ranged', speed: s.speed, damage: s.damage,
      radius: s.radius, life: s.life, range: s.range, fireInterval: s.fireInterval,
      hitInterval: s.hitInterval, element: def.element, spellId: def.id,
      vfx: { ...def.vfx, shape: melee ? 'crescent' : 'void_familiar' },
      shot: { speed: s.shotSpeed, radius: s.shotRadius, life: s.shotLife, pierce: s.pierce,
        vfx: { ...def.vfx, shape: 'bolt', size: s.shotRadius } },
      slot, slots,
    });
    emit(run, { type: 'summon', x: minion.x, z: minion.z, element: def.element, spellId: def.id });
  });
  // Upgrades affect already-living familiars rather than waiting for their lifespan.
  for (const m of run.minions) if (m.spellId === def.id && !m.dead) m.dmg = s.damage;
}

function clearSummons({ run, def }) {
  for (const m of run.minions) if (m.spellId === def.id) m.dead = true;
}

export const VOID_HANDLERS = {
  void_rift: { cast(ctx) { rift(ctx, false); } },
  black_hole: { cast(ctx) { rift(ctx, true); } },
  shadow_familiar: { update(ctx) { maintainLegion(ctx, false); }, dispose: clearSummons },
  shadow_legion: { update(ctx) { maintainLegion(ctx, true); }, dispose: clearSummons },
  entropy_aura: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      spawnArea(run, { x: player.x, z: player.z, follow: true, radius: ctx.area(s.radius),
        duration: s.duration, tick: s.tick, damage: s.damage, slow: s.slow,
        element: def.element, spellId: def.id, vfx: { ...def.vfx, size: ctx.area(s.radius) } });
    },
  },
  heat_death: {
    cast(ctx) {
      const { run, player, s, def } = ctx;
      const hit = new Set();
      const maxRadius = ctx.area(s.radius), startRadius = ctx.area(s.startRadius);
      spawnArea(run, { x: player.x, z: player.z, follow: true, radius: startRadius,
        duration: ctx.duration(s.duration), tick: s.tick, element: def.element, spellId: def.id,
        vfx: { ...def.vfx, size: startRadius },
        onUpdate(r, a) {
          a.r = startRadius + (maxRadius - startRadius) * Math.min(1, 1 - a.life / a.maxLife);
          a.vfx.size = a.r;
          for (const shot of r.eprojectiles) if (Math.hypot(shot.x - a.x, shot.z - a.z) <= a.r + shot.r) shot.dead = true;
        },
        onTick(r, a, hits) {
          for (const e of hits) {
            if (hit.has(e.id)) continue;
            hit.add(e.id);
            const weak = e.hp / e.maxHp <= s.weakThreshold;
            damageEnemy(r, e, s.damage * (weak ? s.weakMultiplier : 1), { element: def.element, spellId: def.id });
            e.freezeT = Math.max(e.freezeT, s.freeze * (e.boss ? s.bossFreezeScale : 1));
          }
        },
      });
    },
  },
};
